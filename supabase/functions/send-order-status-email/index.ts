import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderStatusEmailRequest {
  customerName: string;
  customerEmail: string;
  orderId: string;
  newStatus: string;
  items: OrderItem[];
  totalAmount: number;
}

const getStatusMessage = (status: string): { subject: string; message: string; emoji: string } => {
  switch (status) {
    case 'confirmed':
      return {
        subject: 'Your Order has been Confirmed! ✅',
        message: 'Great news! Your order has been confirmed and is being prepared.',
        emoji: '✅'
      };
    case 'shipped':
      return {
        subject: 'Your Order is on its way! 🚚',
        message: 'Exciting news! Your order has been shipped and is on its way to you.',
        emoji: '🚚'
      };
    case 'delivered':
      return {
        subject: 'Your Order has been Delivered! 🎉',
        message: 'Your order has been delivered. We hope you love your purchase!',
        emoji: '🎉'
      };
    case 'cancelled':
      return {
        subject: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have any questions, please contact us.',
        emoji: '❌'
      };
    default:
      return {
        subject: 'Order Status Update',
        message: `Your order status has been updated to: ${status}`,
        emoji: '📦'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send order status email");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerName, customerEmail, orderId, newStatus, items, totalAmount }: OrderStatusEmailRequest = await req.json();

    console.log(`Sending status email to ${customerEmail} for order ${orderId}, status: ${newStatus}`);

    const { subject, message, emoji } = getStatusMessage(newStatus);
    
    const itemsHtml = items
      .map(item => `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price.toLocaleString()}</td>
      </tr>`)
      .join('');

    const emailResponse = await resend.emails.send({
      from: "Chitraboli <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Chitraboli - ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 28px;">Chitraboli</h1>
            <p style="color: #1a1a2e; margin: 5px 0 0 0; font-size: 14px;">চিত্রাবলী ✨</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <div style="text-align: center; font-size: 48px; margin-bottom: 20px;">${emoji}</div>
            
            <h2 style="color: #1a1a2e; margin-top: 0;">Hello ${customerName},</h2>
            
            <p style="font-size: 16px; color: #555;">${message}</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #888; font-size: 14px;">Order ID</p>
              <p style="margin: 0; font-family: monospace; font-size: 16px; color: #1a1a2e;">#${orderId.slice(0, 8).toUpperCase()}</p>
            </div>

            <h3 style="color: #1a1a2e; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">Order Summary</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px 8px; font-weight: bold; border-top: 2px solid #d4af37;">Total</td>
                  <td style="padding: 12px 8px; font-weight: bold; text-align: right; border-top: 2px solid #d4af37; color: #d4af37; font-size: 18px;">৳${totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%); padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
              <p style="color: #d4af37; margin: 0; font-size: 14px;">Thank you for shopping with Chitraboli!</p>
              <p style="color: #888; margin: 10px 0 0 0; font-size: 12px;">For any queries, contact us via WhatsApp</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Chitraboli. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order status email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
