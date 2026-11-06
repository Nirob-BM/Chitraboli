// Format order details for WhatsApp notification
export const formatOrderForWhatsApp = (order: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  totalAmount: number;
  orderId: string;
}) => {
  const itemsList = order.items
    .map((item) => `• ${item.name} x${item.quantity} - ৳${item.price.toLocaleString()}`)
    .join('\n');

  const message = `🛒 *NEW ORDER RECEIVED!*
━━━━━━━━━━━━━━━━━━
📋 *Order ID:* ${order.orderId.startsWith("CHB-") ? order.orderId : order.orderId.slice(0, 8)}

👤 *Customer Details:*
Name: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail}

📍 *Delivery Address:*
${order.customerAddress}

🛍️ *Order Items:*
${itemsList}

💰 *Total Amount:* ৳${order.totalAmount.toLocaleString()}
━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}`;

  return message;
};

// Send order to WhatsApp
export const sendOrderToWhatsApp = (orderDetails: Parameters<typeof formatOrderForWhatsApp>[0]) => {
  const message = formatOrderForWhatsApp(orderDetails);
  const encodedMessage = encodeURIComponent(message);
  const whatsappNumber = '8801308697630';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
  
  // Open in new tab
  window.open(whatsappUrl, '_blank');
};

// Get Facebook Messenger link
export const getFacebookMessengerLink = () => {
  return 'https://m.me/chitraboli1';
};
