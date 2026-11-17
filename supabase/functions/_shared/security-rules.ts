export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function sanitizeChatMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return null;

  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const message = item as { role?: unknown; content?: unknown };
    if (message.role !== "user" && message.role !== "assistant") return null;
    if (typeof message.content !== "string") return null;
    const content = message.content.trim();
    if (!content || content.length > 4000) return null;
    messages.push({ role: message.role, content });
  }

  return messages[messages.length - 1]?.role === "user" ? messages : null;
}

export function getLimitedHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-10);
}

export type DeliveryNotificationType = "delivery_nearby" | "delivery_arrived";

export interface DeliveryOrderForSms {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
}

export function buildDeliverySms(
  order: DeliveryOrderForSms,
  notificationType: unknown,
  riderName: string,
  etaMinutes?: unknown,
): { recipient: string; message: string } | null {
  if (notificationType !== "delivery_nearby" && notificationType !== "delivery_arrived") return null;

  const digits = order.customer_phone.replace(/\D/g, "");
  const withoutInternationalPrefix = digits.startsWith("00880") ? digits.slice(2) : digits;
  const bangladeshNumber = withoutInternationalPrefix.startsWith("0")
    ? `88${withoutInternationalPrefix}`
    : withoutInternationalPrefix.startsWith("880")
      ? withoutInternationalPrefix
      : `880${withoutInternationalPrefix}`;
  if (!/^8801[3-9]\d{8}$/.test(bangladeshNumber)) return null;

  const safeRiderName = riderName.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80);
  const safeCustomerName = order.customer_name.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80);
  const reference = order.order_number || order.id.slice(-8).toUpperCase();
  if (!safeRiderName || !safeCustomerName) return null;

  if (notificationType === "delivery_nearby") {
    if (typeof etaMinutes !== "number" || !Number.isInteger(etaMinutes) || etaMinutes < 0 || etaMinutes > 180) return null;
    return {
      recipient: `+${bangladeshNumber}`,
      message: `প্রিয় ${safeCustomerName}, আপনার অর্ডার #${reference}-এর ডেলিভারি রাইডার ${safeRiderName} প্রায় ${etaMinutes} মিনিটের মধ্যে পৌঁছাবেন। - চিত্রাবলী`,
    };
  }

  return {
    recipient: `+${bangladeshNumber}`,
    message: `প্রিয় ${safeCustomerName}, আপনার অর্ডার #${reference}-এর ডেলিভারি রাইডার ${safeRiderName} পৌঁছে গেছেন। অনুগ্রহ করে অর্ডার গ্রহণ করুন। - চিত্রাবলী`,
  };
}