export const isValidPhone = (phone: string) => /^\+?\d{10,15}$/.test(phone.trim());
export const paymentIsVerified = (result: { payment_status?: string; transaction_status?: string; environment?: string }) =>
  result.payment_status === "verified" && result.transaction_status === "succeeded";
export const stockAllowsQuantity = (stock: number | null, quantity: number) =>
  Number.isInteger(quantity) && quantity > 0 && (stock === null || quantity <= stock);
export const addCartQuantity = <T extends { product_id: string; quantity: number }>(items: T[], product: T, quantity: number): T[] => {
  const found = items.some(item => item.product_id === product.product_id);
  return found ? items.map(item => item.product_id === product.product_id ? { ...item, quantity: item.quantity + quantity } : item) : [...items, { ...product, quantity }];
};
export const isLiveVerifiedPayment = (result: {payment_status?:string;transaction_status?:string;environment?:string}) => paymentIsVerified(result) && result.environment === "live";

export const isValidOrderReference = (id: string) => /^(?:[a-f0-9-]{10,}|CHB-\d{6}-[A-Z0-9]{5})$/i.test(id.trim().replace(/^#/, ""));
