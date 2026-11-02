// Fake card validation for the demo checkout. No card data is stored except the last 4 digits.
import { z } from "zod";

export function luhn(num: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return num.length > 0 && sum % 10 === 0;
}

function expiryOk(v: string, now = new Date()): boolean {
  const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > now; // valid through the end of the expiry month
}

export const cardSchema = z.object({
  cardName: z.string().trim().min(2, "Enter the name on the card.").max(80),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^\d{13,19}$/.test(v), "Card numbers have 13 to 19 digits.")
    .refine(luhn, "That card number doesn't look right."),
  cardExpiry: z.string().trim().refine(expiryOk, "Use MM/YY and a date in the future."),
  cardCvc: z.string().trim().regex(/^\d{3,4}$/, "3 or 4 digits."),
});
