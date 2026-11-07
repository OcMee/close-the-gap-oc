// Reads the text of common homebuying documents and flags what a careful caseworker would flag.
// Pure functions, no page code. Every finding quotes the numbers it used. Staff make the final call.

const money = (s) => Number(String(s).replace(/[$,\s]/g, ""));
const amounts = (line) => (line.match(/-?\$[\d,]+(?:\.\d+)?/g) || []).map((a) => Number(a.replace(/[$,]/g, "")));
const fmt = (x) => `${x < 0 ? "-" : ""}$${Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const find = (lines, re) => lines.find((l) => re.test(l)) || "";
const date = (s) => { const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : null; };
const days = (a, b) => Math.round((b - a) / 86400000);

export function payment(principal, ratePct, months) {
  const r = ratePct / 1200;
  return r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
}
export function balanceAfter(principal, ratePct, totalMonths, paid) {
  const r = ratePct / 1200;
  const p = payment(principal, ratePct, totalMonths);
  return principal * (1 + r) ** paid - (p * ((1 + r) ** paid - 1)) / r;
}

export function classify(lines) {
  const t = lines.join("\n");
  if (/EARNINGS STATEMENT|NET PAY/i.test(t)) return "paystub";
  if (/Member statement|Closing balance|Opening balance/i.test(t)) return "bank";
  if (/Loan Estimate/i.test(t)) return "loanEstimate";
  if (/SUPPLEMENTAL PROPERTY TAX/i.test(t)) return "supplementalTax";
  if (/NONRENEWAL/i.test(t)) return "insurance";
  if (/SPECIAL ASSESSMENT/i.test(t)) return "hoa";
  if (/COMMITMENT OF FUNDS/i.test(t)) return "funding";
  if (/Development Budget/i.test(t)) return "budget";
  if (/Intake Form/i.test(t)) return "intake";
  return "unknown";
}

function paystub(lines) {
  const facts = [], flags = [];
  const who = (find(lines, /^Employee /).match(/^Employee (.+?) Pay period/) || [, "Employee"])[1];
  const position = (find(lines, /^Position /).match(/^Position (.+?) Pay frequency/) || [, ""])[1];
  const reg = amounts(find(lines, /^Regular /)); const regHours = Number((find(lines, /^Regular /).match(/\$[\d.]+ ([\d.]+)/) || [, 0])[1]);
  const ot = amounts(find(lines, /^Overtime /));
  const gross = amounts(find(lines, /^GROSS PAY/));
  const net = amounts(find(lines, /^NET PAY/))[0] || 0;
  const payDate = date(find(lines, /Pay date/).replace(/.*Pay date/, ""));
  const startDate = date(find(lines, /start date/i).replace(/.*start date/i, ""));
  const biweekly = /Biweekly/i.test(find(lines, /Pay frequency/));
  const rate = reg[0] || 0;
  const periodsPerYear = biweekly ? 26 : 24;
  const baseMonthly = (rate * regHours * periodsPerYear) / 12;
  const from = startDate && payDate && startDate > new Date(payDate.getFullYear(), 0, 1) ? startDate : payDate ? new Date(payDate.getFullYear(), 0, 1) : null;
  const ytdMonths = from && payDate ? days(from, payDate) / 30.44 : 12;
  const ytdMonthly = gross[1] ? gross[1] / ytdMonths : 0;
  facts.push(`${who}${position ? `, ${position}` : ""}: ${fmt(rate)} an hour, ${regHours} regular hours this period, ${biweekly ? "paid every two weeks" : "paid twice a month"}.`);
  facts.push(`This check: gross ${fmt(gross[0] || 0)}, net ${fmt(net)}. Year to date: ${fmt(gross[1] || 0)}.`);
  facts.push(`Monthly income: about ${fmt(Math.round(baseMonthly))} from this period's base hours, about ${fmt(Math.round(ytdMonthly))} from year-to-date pay.`);
  if (ot[1] > 0) flags.push({ level: "watch", text: `Overtime of ${fmt(ot[1])} this check (${fmt(ot[2] || 0)} this year) is variable. Lenders usually average overtime over time instead of counting one period.` });
  if (startDate && payDate) {
    const months = days(startDate, payDate) / 30.44;
    if (months < 24) flags.push({ level: "watch", text: `Started ${startDate.toLocaleDateString("en-US")}: ${Math.round(months)} months on the job. Many lenders want 2 years of work history or a written explanation.` });
    const checks = Math.max(1, Math.round(days(startDate, payDate) / (biweekly ? 14 : 15.2)) + 1);
    const avg = gross[1] / checks;
    if (gross[0] < avg * 0.9) flags.push({ level: "watch", text: `This check (${fmt(gross[0])}) is below the average check this year (about ${fmt(Math.round(avg))} over ${checks} checks). Hours look variable and may be falling.` });
  }
  return { facts, flags, data: { who, baseMonthly, ytdMonthly, startDate, overtime: ot[1] || 0 } };
}

function bank(lines) {
  const facts = [], flags = [];
  const tx = lines.filter((l) => /^\d{2}\/\d{2} /.test(l)).map((l) => ({ line: l, day: l.slice(0, 5), amt: amounts(l)[0] || 0, bal: amounts(l)[1] }));
  const sumOf = (re) => tx.filter((t) => re.test(t.line)).reduce((s, t) => s + Math.abs(t.amt), 0);
  const rent = sumOf(/RENT/i), auto = sumOf(/AUTO LOAN/i), card = sumOf(/CREDIT CARD/i), care = sumOf(/CHILD CARE/i);
  const payLater = sumOf(/PAY-LATER|AFFIRM|KLARNA|AFTERPAY|SPLITPAY|FLEXPAY/i);
  const closing = amounts(find(lines, /Closing balance/))[0] || 0;
  const savings = amounts(find(lines, /savings/i))[0] || 0;
  const cash = tx.filter((t) => /CASH DEPOSIT/i.test(t.line) && t.amt > 0);
  const nsf = tx.filter((t) => /INSUFFICIENT FUNDS|NSF|OVERDRAFT/i.test(t.line));
  const negative = tx.filter((t) => t.bal < 0);
  facts.push(`Rent ${fmt(rent)}. Auto loan ${fmt(auto)}. Credit card ${fmt(card)}. Pay-later ${fmt(payLater)}. Child care ${fmt(care)}.`);
  facts.push(`Checking at month end ${fmt(closing)}. Savings ${fmt(savings)}.`);
  for (const c of cash) flags.push({ level: "fix", text: `Cash deposit of ${fmt(c.amt)} on ${c.day} with no source shown. Lenders ask for a written explanation and proof of where it came from.` });
  if (nsf.length) flags.push({ level: "fix", text: `${nsf.length} insufficient-funds or overdraft event${nsf.length > 1 ? "s" : ""} (${nsf.map((n) => n.day).join(", ")}). The account went negative ${negative.length} time${negative.length === 1 ? "" : "s"}: a cash flow problem early in the month.` });
  if (payLater > 0) flags.push({ level: "fix", text: `Pay-later installments of ${fmt(payLater)} a month. Often missing from credit reports, but real monthly debt. Count them.` });
  return { facts, flags, data: { rent, debts: { auto, card, payLater }, closing, savings, cashDeposits: cash.map((c) => ({ amount: c.amt, day: c.day })), nsf: nsf.length } };
}

function loanEstimate(lines) {
  const facts = [], flags = [];
  const price = amounts(find(lines, /Sale price/))[0] || 0;
  const loan = amounts(find(lines, /^Loan amount/))[0] || 0;
  const rateLine = find(lines, /^Interest rate/);
  const rate = Number((rateLine.match(/([\d.]+)%/) || [, 0])[1]);
  const maxRate = Number((rateLine.match(/max ([\d.]+)%/) || [, 0])[1]);
  const maxYear = Number((rateLine.match(/by year (\d+)/) || [, 0])[1]);
  const arm = /Adjustable|ARM/i.test(find(lines, /^Product/));
  const pi = amounts(find(lines, /^Principal & interest/))[0] || amounts(find(lines, /principal & interest/i))[0] || 0;
  const mi = amounts(find(lines, /^Mortgage insurance/))[0] || 0;
  const escrow = amounts(find(lines, /^Estimated escrow/))[0] || 0;
  const total = amounts(find(lines, /ESTIMATED TOTAL MONTHLY/))[0] || 0;
  const hoaLine = find(lines, /Association dues|HOA/i);
  const hoa = Number((hoaLine.match(/\$([\d,]+)\/month/) || [, "0"])[1].replace(/,/g, ""));
  const hoaOutside = /NOT in escrow/i.test(hoaLine);
  const prepay = find(lines, /^Prepayment penalty/);
  const lockNo = /Rate lock:\s*NO/i.test(lines.join(" "));
  const cashToClose = amounts(find(lines, /CASH TO CLOSE/))[0] || 0;
  const points = /discount point/i.test(lines.join(" "));
  facts.push(`Price ${fmt(price)}, loan ${fmt(loan)}, ${rate}% ${arm ? "adjustable" : "fixed"}. Payment shown: ${fmt(total)} a month. Cash to close: ${fmt(cashToClose)}.`);
  let trueMonthly = total;
  if (hoa > 0 && hoaOutside) {
    trueMonthly = total + hoa;
    flags.push({ level: "fix", text: `HOA dues of ${fmt(hoa)} a month are NOT in the payment shown. True monthly cost is ${fmt(trueMonthly)}, not ${fmt(total)}.` });
  }
  let worst = 0;
  if (arm && maxRate && maxYear) {
    const paid = (maxYear - 1) * 12;
    const bal = balanceAfter(loan, rate, 360, paid);
    worst = payment(bal, maxRate, 360 - paid);
    flags.push({ level: "fix", text: `Adjustable rate: ${rate}% can rise to ${maxRate}% by year ${maxYear}. Principal and interest could reach about ${fmt(Math.round(worst))} a month (balance about ${fmt(Math.round(bal))} re-paid over ${30 - (maxYear - 1)} years).` });
  }
  if (/YES/i.test(prepay)) flags.push({ level: "fix", text: `Prepayment penalty: ${prepay.replace(/^Prepayment penalty\s*YES\s*/i, "")}. Costly if the family must refinance or sell early.` });
  if (lockNo) flags.push({ level: "watch", text: "No rate lock. The rate can change before closing." });
  if (arm && points) flags.push({ level: "watch", text: "A discount point is being paid on an adjustable loan. Check it pays back before the rate can change." });
  return { facts, flags, data: { price, loan, rate, arm, pi, mi, escrow, total, hoa, trueMonthly, worst, cashToClose } };
}

function supplementalTax(lines) {
  const total = amounts(find(lines, /^TOTAL/))[0] || 0;
  const inst = lines.filter((l) => /installment/i.test(l) && /\$/.test(l));
  const dueDates = (lines.join(" ").match(/\d{2}\/\d{2}\/\d{4}/g) || []);
  const each = amounts(inst[0] || "")[0] || total / 2;
  const due = dueDates.filter((d) => /0[48]\/(30|31)\//.test(d));
  return { facts: [`Supplemental tax: ${fmt(total)} in two payments of ${fmt(each)}${due.length >= 2 ? `, due ${due[0]} and ${due[1]}` : ""}.`],
    flags: [{ level: "fix", text: `This bill is IN ADDITION to the regular property tax and is usually NOT paid by the mortgage escrow. In plain words: you owe ${fmt(total)} extra this year${due.length >= 2 ? `; pay ${fmt(each)} by ${due[0]} and ${fmt(each)} by ${due[1]}` : ""}. Late payments add 10%.` }], data: { total } };
}

function insurance(lines) {
  const notice = date(find(lines, /Notice date/));
  const ends = date(find(lines, /expires/i));
  const left = notice && ends ? days(notice, ends) : null;
  return { facts: [`Homeowner's insurance will not renew. Coverage ends ${ends ? ends.toLocaleDateString("en-US") : "on the date shown"}${left ? `, ${left} days after the notice` : ""}.`],
    flags: [{ level: "fix", text: "Replace coverage before it ends. If it lapses, the lender can buy force-placed insurance, usually much more expensive, and add it to the monthly payment. Call an agent or broker now." }], data: { ends } };
}

function hoa(lines) {
  const t = lines.join(" ");
  const total = amounts(find(lines, /Special assessment \(total\)/))[0] || 0;
  const monthly = Number((t.match(/\$([\d,.]+) \/month/) || [, "0"])[1].replace(/,/g, ""));
  const fee = Number((t.match(/\(\$([\d.]+) admin fee each\)/) || [, "0"])[1]);
  const oldDues = amounts(find(lines, /Monthly dues 20\d\d(?! \(approved)/))[0] || 0;
  const newDues = amounts(find(lines, /Monthly dues .*approved/))[0] || 0;
  const hardship = (t.match(/before (\d{2}\/\d{2}\/\d{4})/) || [, ""])[1];
  const planTotal = monthly * 12;
  return { facts: [`Special assessment ${fmt(total)}: lump sum, or 12 payments of ${fmt(monthly)} (${fmt(Math.round(planTotal * 100) / 100)} in total${fee ? `, ${fmt(Math.round((planTotal - total) * 100) / 100)} more in fees` : ""}). Dues rise from ${fmt(oldDues)} to ${fmt(newDues)} a month.`],
    flags: [{ level: "fix", text: `With monthly payments, HOA cost becomes ${fmt(Math.round((newDues + monthly) * 100) / 100)} a month, up from ${fmt(oldDues)}.${hardship ? ` A hardship payment plan can be requested before ${hardship}.` : ""} Unpaid assessments can become a lien.` }],
    data: { total, monthly, newDues, oldDues } };
}

function funding(lines) {
  const t = lines.join(" ");
  const total = (t.match(/\$([\d,]{7,})/) || [, "0"])[1];
  const homes = Number((t.match(/for (\d+) homes/i) || [, 0])[1]);
  const expires = (t.match(/EXPIRES on (\d{2}\/\d{2}\/\d{4})/) || [, ""])[1];
  const per = homes ? money(total) / homes : 0;
  return { facts: [`${fmt(money(total))}${homes ? ` for ${homes} homes: ${fmt(per)} per home` : ""}.`],
    flags: [{ level: "fix", text: `This is a CONDITIONAL commitment${expires ? ` that expires ${expires}` : ""}. Funds are not reserved until a funding agreement is signed. Count it as pending, not confirmed.` }],
    data: { total: money(total), perHome: per, conditional: true } };
}

function budget(lines) {
  const t = lines.join(" ");
  const homes = Number((t.match(/(\d+) for-sale/i) || [, 0])[1]);
  const total = amounts(find(lines, /TOTAL DEVELOPMENT COST/))[0] || Math.max(0, ...amounts(t));
  const per = homes ? total / homes : 0;
  const flags = [];
  if (/valid 90 days/i.test(t)) flags.push({ level: "watch", text: "The construction bid is valid for 90 days. A delay can reprice the biggest cost line." });
  if (/subject to change/i.test(t)) flags.push({ level: "watch", text: "Impact fees can change when permits are issued." });
  return { facts: [`Total development cost ${fmt(total)}${homes ? ` for ${homes} homes: ${fmt(per)} per home` : ""}.`], flags, data: { total, perHome: per, homes } };
}

const READERS = { paystub, bank, loanEstimate, supplementalTax, insurance, hoa, funding, budget };
export const TYPE_LABEL = { paystub: "Pay stub", bank: "Bank statement", loanEstimate: "Loan Estimate", supplementalTax: "Supplemental tax bill", insurance: "Insurance notice", hoa: "HOA notice", funding: "Funding letter", budget: "Development budget", intake: "Intake form", unknown: "Not recognized" };

export function analyze(lines) {
  const type = classify(lines);
  const reader = READERS[type];
  if (!reader) return { type, facts: type === "intake" ? ["Blank intake form. The profile below fills it from the other documents."] : ["This document type is not recognized yet."], flags: [], data: {} };
  return { type, ...reader(lines) };
}

// Builds the family profile a caseworker would write on the intake form.
export function buildProfile(results) {
  const pay = results.filter((r) => r.type === "paystub");
  const bankR = results.find((r) => r.type === "bank");
  const le = results.find((r) => r.type === "loanEstimate");
  const incomeLow = pay.reduce((s, p) => s + Math.min(p.data.baseMonthly, p.data.ytdMonthly), 0);
  const incomeHigh = pay.reduce((s, p) => s + Math.max(p.data.baseMonthly, p.data.ytdMonthly), 0);
  const debts = bankR ? bankR.data.debts.auto + bankR.data.debts.card + bankR.data.debts.payLater : 0;
  const profile = {
    people: pay.map((p) => p.data.who),
    incomeLow, incomeHigh,
    rent: bankR?.data.rent ?? null,
    debts, debtParts: bankR?.data.debts ?? null,
    checking: bankR?.data.closing ?? null, savings: bankR?.data.savings ?? null,
    cashDeposits: bankR?.data.cashDeposits ?? [], nsf: bankR?.data.nsf ?? 0,
    shortHistory: pay.filter((p) => p.data.startDate && (Date.now() - p.data.startDate) / 86400000 / 30.44 < 24 + 12).filter((p) => p.flags.some((f) => /work history/.test(f.text))).map((p) => p.data.who),
    missing: [],
  };
  if (le && incomeHigh > 0) {
    profile.housingRatio = [le.data.trueMonthly / incomeHigh, le.data.trueMonthly / incomeLow];
    profile.totalRatio = [(le.data.trueMonthly + debts) / incomeHigh, (le.data.trueMonthly + debts) / incomeLow];
  }
  if (le && bankR) profile.cashGap = le.data.cashToClose - bankR.data.savings;
  profile.missing.push("Tax returns (2 years)");
  if (pay.length) profile.missing.push("A second recent pay stub for each worker");
  if (profile.cashDeposits.length) profile.missing.push("Letter and proof of source for the cash deposit");
  profile.missing.push("Photo ID for each buyer");
  return profile;
}
