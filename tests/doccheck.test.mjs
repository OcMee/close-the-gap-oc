import test from "node:test";
import assert from "node:assert/strict";
import { analyze, buildProfile, balanceAfter, payment } from "../src/doccheck.js";

// Lines as the PDF reader returns them from the event's fictional demo pack.
const LE = ["Loan Estimate (simplified sample)", "Lender: Bayline Home Lending (fictional) | Date issued 11/02/2026 | Rate lock: NO", "Sale price $585,000", "Product 5/6 Adjustable Rate (ARM)", "Loan amount $567,450 NO",
  "Interest rate 6.500% YES - adjusts every 6 mo. from year 6; max 11.500% by year 8", "Prepayment penalty YES Up to $11,349 if paid off in first 3 years", "Principal & interest $3,586.67", "Mortgage insurance $260",
  "Estimated escrow (property taxes + homeowner's insurance) $711", "ESTIMATED TOTAL MONTHLY PAYMENT $4,558", "Other: Homeowner's Association dues ($425/month) - NOT in escrow. You must pay these costs separately.",
  "Estimated closing costs (incl. $4,120 origination charges, 1.0 discount point) $18,640", "ESTIMATED CASH TO CLOSE $36,190"];
const BANK = ["Member statement | Everyday Checking", "10/02 RENT - ALMOND COURT APTS (fictional) -$2,450.00 $516.51", "10/03 AUTO LOAN PMT - FICTIONAL AUTO FINANCE -$412.00 $104.51",
  "10/05 PAY-LATER INSTALLMENT - SPLITPAY (fictional) -$86.50 $18.01", "10/06 GROCERY - FICTIONAL MARKET -$214.37 -$196.36", "10/06 INSUFFICIENT FUNDS FEE -$35.00 -$231.36",
  "10/09 CASH DEPOSIT - BRANCH $3,000.00 $2,628.64", "10/12 PAY-LATER INSTALLMENT - FLEXPAY (fictional) -$62.25 $2,566.39", "10/15 CREDIT CARD PMT - FICTIONAL CARD -$125.00 $2,272.49",
  "10/19 PAY-LATER INSTALLMENT - SPLITPAY (fictional) -$86.50 $4,480.93", "10/26 PAY-LATER INSTALLMENT - FLEXPAY (fictional) -$62.25 $3,720.24",
  "Closing balance 10/31/2026: $6,018.84", "Linked savings x0000 balance 10/31/2026: $8,420.00"];
const TAX = ["SUPPLEMENTAL PROPERTY TAX BILL | Fiscal year 2026-27", "1st installment $680.74 04/30/2027 05/31/2027 5:00 PM +10% penalty", "2nd installment $680.74 08/31/2027 09/30/2027 5:00 PM +10% penalty + $10 cost", "TOTAL $1,361.47"];

test("Loan Estimate: HOA left out of the payment, ARM worst case, penalty, no lock", () => {
  const r = analyze(LE);
  assert.equal(r.type, "loanEstimate");
  assert.equal(r.data.trueMonthly, 4983);
  assert.ok(r.flags.some((f) => f.text.includes("$4,983")));
  assert.ok(Math.abs(r.data.worst - 5298) < 3, String(r.data.worst));
  assert.ok(r.flags.some((f) => /Prepayment/.test(f.text)));
  assert.ok(r.flags.some((f) => /No rate lock/.test(f.text)));
});
test("Bank statement: cash deposit, overdraft, pay-later as debt", () => {
  const r = analyze(BANK);
  assert.equal(r.type, "bank");
  assert.equal(r.data.debts.payLater, 297.5);
  assert.deepEqual(r.data.cashDeposits, [{ amount: 3000, day: "10/09" }]);
  assert.equal(r.data.nsf, 1);
  assert.equal(r.data.savings, 8420);
});
test("Supplemental tax is flagged as outside escrow, in plain words", () => {
  const r = analyze(TAX);
  assert.equal(r.type, "supplementalTax");
  assert.ok(r.flags[0].text.includes("NOT paid by the mortgage escrow"));
  assert.ok(r.flags[0].text.includes("$1,361.47"));
});
test("Profile: debts include pay-later, cash gap against the Loan Estimate", () => {
  const p = buildProfile([analyze(BANK), analyze(LE)]);
  assert.equal(p.debts, 834.5);
  assert.equal(p.cashGap, 36190 - 8420);
});
test("Amortization helpers", () => {
  assert.ok(Math.abs(payment(567450, 6.5, 360) - 3586.67) < 0.5);
  assert.ok(Math.abs(balanceAfter(567450, 6.5, 360, 84) - 513067) < 50);
});
test("Unknown text is not guessed", () => {
  assert.equal(analyze(["Hello world"]).type, "unknown");
});
