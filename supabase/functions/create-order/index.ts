import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const limits=new Map<string,{count:number;until:number}>();
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,"0")).join("");
serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{headers});
 try {
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if(!url||!key)return json({error:"Service unavailable"},503);
  const db=createClient(url,key);
  const ip=req.headers.get("x-forwarded-for")||"unknown"; const now=Date.now();
  for(const [k,v] of limits)if(v.until<now)limits.delete(k);
  const bucket=limits.get(ip)||{count:0,until:now+60000}; if(++bucket.count>20)return json({error:"Please wait before trying again"},429); limits.set(ip,bucket);
  const body=await req.json();
  const items=body.items;
  if(!Array.isArray(items)||!items.length||items.length>100)return json({error:"At least one valid item is required"},400);
  const quantities=new Map<string,number>();
  for(const item of items){if(typeof item.product_id!=="string"||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>999)return json({error:"Invalid item quantity"},400);quantities.set(item.product_id,(quantities.get(item.product_id)||0)+item.quantity);}
  if(body.quote !== true && (typeof body.checkout_key!=="string" || typeof body.checkout_token!=="string" || body.checkout_token.length<32))return json({error:"Please reopen checkout"},400);
  const tokenHash=await hash(body.checkout_token||"");
  const readExisting=()=>db.from("orders").select("id,order_number,total_amount,items,status,checkout_token_hash").eq("checkout_key",body.checkout_key).maybeSingle();
  const existing=body.quote===true ? {data:null,error:null} : await readExisting();
  if(existing.error)return json({error:"Could not check previous order"},503);
  if(body.quote !== true && existing.data){if(existing.data.checkout_token_hash!==tokenHash)return json({error:"Order access denied"},403);const {checkout_token_hash,...order}=existing.data;return json({success:true,order});}
  const {data:products,error}=await db.from("products").select("id,name,price,image_url,in_stock,stock_quantity").in("id",[...quantities.keys()]);
  if(error)return json({error:"Could not check inventory"},503);
  const validated=[];let total=0;
  for(const [id,quantity] of quantities){const p=products?.find(p=>p.id===id);if(!p||p.in_stock===false||(p.stock_quantity!==null&&quantity>p.stock_quantity))return json({error:"A selected item has insufficient stock"},400);total+=Number(p.price)*quantity;validated.push({product_id:id,product_name:p.name,product_price:Number(p.price),product_image:p.image_url,quantity});}
  if(body.quote===true)return json({success:true,total_amount:total,items:validated});
  const c=body.customer_details;
  if(!c||typeof c.name!=="string"||c.name.trim().length<2||c.name.length>100||typeof c.email!=="string"||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)||typeof c.phone!=="string"||!/^\+?\d{10,15}$/.test(c.phone.trim())||typeof c.address!=="string"||c.address.trim().length<10||c.address.length>500)return json({error:"Please check your contact and delivery details"},400);
  const method=body.payment_method,flow=body.payment_flow==="gateway"?"gateway":"manual";
  if(!["cod","bkash","nagad"].includes(method))return json({error:"Invalid payment method"},400);
  if(method!=="cod"&&flow==="manual"&&!(typeof body.transaction_id==="string"&&body.transaction_id.trim()))return json({error:"Transaction ID is required"},400);
  if(typeof body.checkout_key!=="string"||! /^[0-9a-f-]{36}$/i.test(body.checkout_key)||typeof body.checkout_token!=="string"||body.checkout_token.length<32)return json({error:"Please reopen checkout"},400);
  if(Number(body.expected_total)!==total)return json({error:"Prices changed. Review the updated total before placing your order.",total_amount:total},409);
  let userId=null; const authorization=req.headers.get("authorization");
  if(authorization?.startsWith("Bearer ")){const {data}=await db.auth.getUser(authorization.slice(7));userId=data.user?.id||null;}
  const {data:order,error:insertError}=await db.from("orders").insert({checkout_key:body.checkout_key,checkout_token_hash:tokenHash,user_id:userId,session_id:body.session_id||null,customer_name:c.name.trim(),customer_email:c.email.trim().toLowerCase(),customer_phone:c.phone.trim(),customer_address:c.address.trim(),items:validated,total_amount:total,status:"pending",payment_method:method,payment_status:method!=="cod"&&flow==="manual"?"pending_verification":"unpaid",transaction_id:method!=="cod"&&flow==="manual"?body.transaction_id.trim():null,payment_gateway:method!=="cod"&&flow==="gateway"?method:null}).select("id,order_number,total_amount,items,status").single();
  if(insertError){if(insertError.code==="23505"){const retry=await readExisting();if(retry.data?.checkout_token_hash===tokenHash){const {checkout_token_hash,...order}=retry.data;return json({success:true,order});}}return json({error:insertError.message.includes("Insufficient stock")?"An item just sold out. Please review your cart.":"Could not place order. Your cart is safe."},400);}
  return json({success:true,order});
 }catch{return json({error:"Could not process the order. Please try again."},500);}
});
