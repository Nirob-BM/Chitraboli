import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeStorage } from "@/lib/safeStorage";
import { addCartQuantity } from "@/lib/commerce";
import { toast } from "sonner";
const CART_KEY = "chitraboli-cart";
const MERGE_KEY = "chitraboli-cart-merge";
export interface CartItem { id: string; product_id: string; product_name: string; product_price: number; product_image: string; quantity: number; }
interface CartContextType {
 items: CartItem[]; addItem: (product: Omit<CartItem,"id"|"quantity">, quantity?: number) => Promise<void>;
 removeItem: (id: string) => Promise<void>; updateQuantity: (id: string, quantity: number) => Promise<void>;
 clearCart: () => Promise<void>; totalItems: number; totalPrice: number; isOpen: boolean; setIsOpen: (open: boolean) => void;
 syncing: boolean;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
function localCart(): CartItem[] {
 try { const value = JSON.parse(safeStorage.get(CART_KEY) || "[]"); return Array.isArray(value) ? value.filter(i => typeof i.product_id === "string" && Number.isInteger(i.quantity) && i.quantity > 0) : []; } catch { return []; }
}
export const CartProvider = ({children}: {children: ReactNode}) => {
 const [items,setItems] = useState<CartItem[]>(localCart);
 const [isOpen,setIsOpen] = useState(false);
 const [syncing,setSyncing] = useState(false);
 const current = useRef(items); const uid = useRef<string|null>(null);
 const blocked = useRef(false);
 const queue = useRef<Promise<void>>(Promise.resolve());
 const publish = useCallback((next: CartItem[]) => { current.current=next; setItems(next); },[]);
 const enqueue = useCallback((operation: () => Promise<void>) => {
  const task=queue.current.then(operation);
  queue.current=task.catch(() => { toast.error("Your cart could not be saved. Please try again; your previous items are safe."); });
  return queue.current;
 },[]);
 useEffect(() => {
  let active=true;
  const sync = (user: string|null) => enqueue(async () => {
   if (!active || uid.current===user && user===null) return;
   if (uid.current===user && user!==null) return;
   uid.current=user; setSyncing(true); blocked.current=false;
   try {
    if (!user) { publish(localCart()); return; }
    const guest=localCart();
    if (guest.length) {
     let merge=safeStorage.get(MERGE_KEY);
     if (!merge) { merge=crypto.randomUUID(); safeStorage.set(MERGE_KEY,merge); }
     const {error}=await supabase.rpc("merge_guest_cart",{_merge_key:merge,_items:guest.map(i=>({...i}))});
     if(error) { uid.current=null; blocked.current=true; throw error; }
     safeStorage.remove(CART_KEY); safeStorage.remove(MERGE_KEY);
    }
    const {data,error}=await supabase.from("cart_items").select("*").eq("user_id",user);
    if(error) { uid.current=null; blocked.current=true; throw error; }
    if(active) publish((data||[]).map(i=>({...i,product_price:Number(i.product_price),product_image:i.product_image||""})));
   } finally { if(active) setSyncing(false); }
  });
  supabase.auth.getSession().then(({data})=>sync(data.session?.user.id||null));
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{ void sync(session?.user.id||null); });
  return ()=>{active=false;subscription.unsubscribe();};
 },[enqueue,publish]);
 const commit = useCallback(async (next: CartItem[], productId?: string) => {
  if(blocked.current) throw new Error("Reload to retry cart synchronization");
  const user=uid.current;
  if(user) {
   const affected=productId ? [productId] : current.current.map(i=>i.product_id);
   for(const id of affected) {
    const before=current.current.find(i=>i.product_id===id); const after=next.find(i=>i.product_id===id);
    const query= !after ? supabase.from("cart_items").delete().eq("user_id",user).eq("product_id",id)
     : before ? supabase.from("cart_items").update({quantity:after.quantity}).eq("user_id",user).eq("product_id",id)
     : supabase.from("cart_items").insert({...after,id:undefined,user_id:user,session_id:user});
    const {error}=await query; if(error) throw error;
   }
  } else { safeStorage.set(CART_KEY,JSON.stringify(next)); safeStorage.remove(MERGE_KEY); }
  publish(next);
 },[publish]);
 const addItem = useCallback((product: Omit<CartItem,"id"|"quantity">,quantity=1)=>enqueue(async()=>{
  if(!Number.isInteger(quantity)||quantity<1) return;
  await commit(addCartQuantity(current.current,{...product,id:crypto.randomUUID(),quantity},quantity),product.product_id); setIsOpen(true);
 }),[enqueue,commit]);
 const removeItem=useCallback((id:string)=>enqueue(()=>commit(current.current.filter(i=>i.product_id!==id),id)),[enqueue,commit]);
 const updateQuantity=useCallback((id:string,quantity:number)=>enqueue(()=>commit(quantity<=0 ? current.current.filter(i=>i.product_id!==id) : current.current.map(i=>i.product_id===id ? {...i,quantity} : i),id)),[enqueue,commit]);
 const clearCart=useCallback(()=>{const task=queue.current.then(async()=>{
  if(blocked.current) throw new Error("Reload to retry cart synchronization");
  if(uid.current) { const {error}=await supabase.from("cart_items").delete().eq("user_id",uid.current); if(error) throw error; }
  safeStorage.remove(CART_KEY); safeStorage.remove(MERGE_KEY); publish([]);
 });queue.current=task.catch(()=>{toast.error("Could not clear your saved cart. Please try again.");});return task;},[publish]);
 return <CartContext.Provider value={{items,addItem,removeItem,updateQuantity,clearCart,isOpen,setIsOpen,syncing,totalItems:items.reduce((s,i)=>s+i.quantity,0),totalPrice:items.reduce((s,i)=>s+i.quantity*i.product_price,0)}}>{children}</CartContext.Provider>;
};
export function useCart(){const value=useContext(CartContext);if(!value)throw new Error("Cart provider required");return value;}
