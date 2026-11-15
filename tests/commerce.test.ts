import { describe, expect, test } from "bun:test";
import { isValidOrderReference, addCartQuantity, isLiveVerifiedPayment, isValidPhone, paymentIsVerified, stockAllowsQuantity } from "../src/lib/commerce";
describe("checkout integrity", () => {
  test("a fabricated success link is not proof of payment", () => {
    expect(paymentIsVerified({ payment_status: "unpaid", transaction_status: "succeeded" })).toBe(false);
    expect(paymentIsVerified({ payment_status: "verified", transaction_status: "succeeded" })).toBe(true);
  });
  test("adding three units is one quantity change", () => {
    expect(addCartQuantity([{ product_id: "ring", quantity: 2 }], { product_id: "ring", quantity: 1 }, 3)[0].quantity).toBe(5);
  });
  test("orders cannot exceed the available stock", () => {
    expect(stockAllowsQuantity(2, 3)).toBe(false);
    expect(stockAllowsQuantity(2, 2)).toBe(true);
  });
  test("alphabetic phone numbers are rejected", () => {
    expect(isValidPhone("abcdefghij")).toBe(false);
    expect(isValidPhone("01308697630")).toBe(true);
  });
});
test("sandbox completion does not count as real payment", () => {
 expect(isLiveVerifiedPayment({payment_status:"verified",transaction_status:"succeeded",environment:"sandbox"})).toBe(false);
 expect(isLiveVerifiedPayment({payment_status:"verified",transaction_status:"succeeded",environment:"live"})).toBe(true);
});

test("tracking accepts readable order numbers and legacy IDs", () => {expect(isValidOrderReference("CHB-261115-09935")).toBe(true);expect(isValidOrderReference("a1b03cc9-f1a3-48b2-beff-68b92623e8f1")).toBe(true);expect(isValidOrderReference("fake")).toBe(false);});
