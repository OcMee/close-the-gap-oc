// The gap engine. Pure functions, no page code, so every number can be tested.
import { INCOME, TIERS, ANAHEIM_150, BUYER_AID, HABITAT, READY_SHARE, LENDER } from "./data.js";

const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const pos = (x) => Math.max(0, num(x));

export const sizeFor = (bedrooms) => Math.max(1, Math.min(8, Math.round(pos(bedrooms)) + 1));

export function tableFor(name) {
  if (name === "anaheim150") return ANAHEIM_150;
  return INCOME[name] || INCOME.median;
}

// Yearly and monthly affordable housing cost for an income group and unit size (H&SC 50052.5(b)).
export function affordableCost(tierKey, bedrooms) {
  const tier = TIERS.find((t) => t.key === tierKey) || TIERS[1];
  const size = sizeFor(bedrooms);
  const median = INCOME.median[size - 1];
  const yearly = tier.share * tier.ami * median;
  return { tier, size, median, yearly, monthly: yearly / 12 };
}

// Monthly principal and interest per dollar borrowed.
export function payFactor(ratePct, years) {
  const r = pos(ratePct) / 1200;
  const n = Math.max(1, Math.round(pos(years) || 30)) * 12;
  return r === 0 ? 1 / n : r / (1 - (1 + r) ** -n);
}

// Highest price whose monthly cost fits `monthly`. Deferred buyer aid lowers the first loan, so it adds to price.
// monthly = (loan) * (f + pmi/12) + price * (tax + ins)/12 + hoa, where loan = price * (1 - down) - aid.
export function affordablePrice({ monthly, ratePct, term = 30, downPct = 3, taxPct = 1.1, insPct = 0.35, pmiPct = 0.5, hoa = 0, aid = 0 }) {
  const d = Math.min(0.99, pos(downPct) / 100);
  const pmi = d < 0.2 ? pos(pmiPct) / 100 : 0;
  const loanCost = payFactor(ratePct, term) + pmi / 12;
  const perDollar = (1 - d) * loanCost + (pos(taxPct) + pos(insPct)) / 1200;
  const price = (pos(monthly) - pos(hoa) + pos(aid) * loanCost) / perDollar;
  return Math.max(0, price);
}

export function aidAmount(program, { price, income, size, city }) {
  if (program.status === "closed") return 0;
  if (program.cities && !program.cities.includes(city)) return 0;
  const inc = pos(income);
  if (program.incomeCap && inc > program.incomeCap) return 0;
  if (program.incomeTable && inc > tableFor(program.incomeTable)[size - 1]) return 0;
  const a = program.amount;
  if (a.fixed) return a.fixed;
  if (a.pctPrice) return Math.min(pos(price) * a.pctPrice / 100, a.cap ?? Infinity);
  if (a.tiers) {
    for (const [table, amount] of a.tiers) if (inc <= tableFor(table)[size - 1]) return amount;
  }
  return 0;
}

// Aid depends on price (percent programs) and price depends on aid, so iterate to a fixed point.
export function priceWithAid(base, chosen, family) {
  let aid = 0;
  let price = affordablePrice({ ...base, aid: 0 });
  const lines = [];
  for (let i = 0; i < 20; i += 1) {
    lines.length = 0;
    aid = 0;
    for (const program of chosen) {
      const amount = aidAmount(program, { ...family, price });
      if (amount > 0) lines.push({ program, amount });
      aid += amount;
    }
    const next = affordablePrice({ ...base, aid });
    if (Math.abs(next - price) < 0.5) { price = next; break; }
    price = next;
  }
  return { price, aid, lines };
}

// The whole picture for one home.
export function closeTheGap(input) {
  const { tier, bedrooms, ratePct, assume, deal, chosenAid = [], projectFunds = [], city, slipMonths = 0 } = input;
  const cost = affordableCost(tier, bedrooms);
  // A family at the top of its income group, which is how the price cap is set.
  const capTable = tableFor(cost.tier.cap);
  const income = input.income ?? capTable[cost.size - 1];
  const base = { monthly: cost.monthly, ratePct, term: assume.term, downPct: assume.downPct, taxPct: assume.taxPct, insPct: assume.insPct, pmiPct: assume.pmiPct, hoa: assume.hoa };
  const family = { income, size: cost.size, city };
  const without = affordablePrice(base);
  const withAid = priceWithAid(base, chosenAid, family);
  const slip = pos(slipMonths) * pos(assume.carryPerMonth);
  const totalCost = deal.reduce((s, line) => s + pos(line.amount), 0) + slip;
  const confirmed = projectFunds.filter((f) => f.confirmed).reduce((s, f) => s + pos(f.amount), 0);
  const pending = projectFunds.filter((f) => !f.confirmed).reduce((s, f) => s + pos(f.amount), 0);
  const gapBefore = totalCost - without;
  const gapAfterAid = totalCost - withAid.price;
  const gapConfirmed = gapAfterAid - confirmed;
  const gapIfAll = gapConfirmed - pending;
  return { cost, income, base, without, withAid, slip, totalCost, confirmed, pending, gapBefore, gapAfterAid, gapConfirmed, gapIfAll };
}

// M02: how the gap moves with the rate.
export function rateCurve(input, rates) {
  return rates.map((r) => ({ rate: r, gap: closeTheGap({ ...input, ratePct: r }).gapIfAll, price: closeTheGap({ ...input, ratePct: r }).withAid.price }));
}

// M03: what a gift pays for. Spread across the cost lines in proportion, and say how much of the gap it closes.
export function giftView(gift, result, deal) {
  const g = pos(gift);
  const total = deal.reduce((s, l) => s + pos(l.amount), 0) || 1;
  const gap = Math.max(0, result.gapIfAll);
  return {
    gift: g,
    shareOfGap: gap > 0 ? Math.min(1, g / gap) : 1,
    left: Math.max(0, gap - g),
    homesPerMillion: gap > 0 ? 1000000 / gap : Infinity,
    lines: deal.map((l) => ({ label: l.label, amount: (g * pos(l.amount)) / total })),
  };
}

export const ALL_AID = BUYER_AID;

// READY: one family's early check. Income group, which programs may fit and why, and the price they could pay.
export function incomeGroup(income, size) {
  const n = Math.max(1, Math.min(8, Math.round(pos(size)) || 1)) - 1;
  const inc = pos(income);
  if (inc <= INCOME.veryLow[n]) return { key: "veryLow", label: "Very low income", limit: INCOME.veryLow[n] };
  if (inc <= INCOME.low[n]) return { key: "low", label: "Lower income", limit: INCOME.low[n] };
  if (inc <= INCOME.moderate[n]) return { key: "moderate", label: "Moderate income", limit: INCOME.moderate[n] };
  if (inc <= ANAHEIM_150[n]) return { key: "above", label: "Above moderate, up to 150% of median", limit: ANAHEIM_150[n] };
  return { key: "over", label: "Over 150% of median", limit: ANAHEIM_150[n] };
}

export function readyCheck({ size, income, city, residency, firstTime, debts, rent = 0, ratePct, assume }) {
  const n = Math.max(1, Math.min(8, Math.round(pos(size)) || 1));
  const group = incomeGroup(income, n);
  const programs = BUYER_AID.map((p) => {
    const reasons = [];
    let verdict = "yes";
    const fail = (t) => { reasons.push({ ok: false, text: t }); verdict = "no"; };
    const ask = (t) => { reasons.push({ ok: null, text: t }); if (verdict === "yes") verdict = "check"; };
    const wrongCity = Boolean(p.cities && !p.cities.includes(city));
    if (wrongCity) fail(`Only for homes in ${p.cities.join(", ")}.`);
    const amount = aidAmount({ ...p, status: "open" }, { price: 400000, income, size: n, city: p.cities ? p.cities[0] : city });
    if (amount === 0) fail("Household income is over this program's limit.");
    if (!firstTime) fail("First-time buyers only (no home owned in the last 3 years).");
    if (p.residency === "green" && residency === "other") fail("Citizens and green card holders only.");
    if (p.residency === "unknown" && residency === "other") ask("Citizenship rule not published. Ask the city.");
    if (p.status === "check") ask("Funding status not published. Call before counting on it.");
    if (verdict === "yes") reasons.push({ ok: true, text: "City, income and first-time rules fit." });
    if (p.status === "closed") return { program: p, verdict: "closed", reasons: [{ ok: false, text: `${p.timing}.` }] };
    return { program: p, verdict, reasons };
  });
  const usable = BUYER_AID.filter((p) => programs.some((r) => r.program === p && (r.verdict === "yes" || r.verdict === "check")));
  const monthly = (pos(income) / 12) * READY_SHARE;
  const base = { monthly, ratePct, term: assume.term, downPct: assume.downPct, taxPct: assume.taxPct, insPct: assume.insPct, pmiPct: assume.pmiPct, hoa: assume.hoa };
  const alone = affordablePrice(base);
  const helped = priceWithAid(base, usable, { income, size: n, city });
  const monthlyIncome = pos(income) / 12;
  const debtShare = monthlyIncome > 0 ? (pos(debts) / monthlyIncome) * 100 : 100;
  const habitat = {
    incomeOk: pos(income) >= HABITAT.min[n - 1] && pos(income) <= INCOME.moderate[n - 1],
    min: HABITAT.min[n - 1], max: INCOME.moderate[n - 1],
    debtOk: debtShare < HABITAT.maxDebtPct, debtShare, debtLimit: (monthlyIncome * HABITAT.maxDebtPct) / 100,
    residencyOk: residency !== "other",
    rentShare: monthlyIncome > 0 ? (pos(rent) / monthlyIncome) * 100 : 0,
    needByCost: monthlyIncome > 0 && pos(rent) / monthlyIncome > 0.30,
    hours: HABITAT.hours[group.key] ?? null, resaleHours: HABITAT.resaleHours[group.key] ?? null,
  };
  return { size: n, group, programs, monthly, alone, helped, habitat };
}

// TOGETHER: city levers lower the cost lines before anyone raises money.
export function applyLevers(deal, { landPct = 0, feePct = 0 } = {}) {
  return deal.map((l) => ({ ...l, amount: l.key === "land" ? l.amount * (1 - pos(landPct) / 100) : l.key === "fees" ? l.amount * (1 - pos(feePct) / 100) : l.amount }));
}

export function buildDays({ homes, adults, hoursPerAdult, hoursPerDay }) {
  const total = pos(homes) * pos(adults) * pos(hoursPerAdult);
  const perAdult = pos(hoursPerDay) > 0 ? Math.ceil(pos(hoursPerAdult) / pos(hoursPerDay)) : 0;
  return { total, perAdult };
}

// READY: how strong a borrower looks today, with the next step and a number for each.
export function lenderReady({ income, debts, credit, savings, jobYears, price, ratePct, assume }) {
  const monthlyIncome = pos(income) / 12;
  const housing = monthlyIncome * READY_SHARE;
  const dti = monthlyIncome > 0 ? ((pos(debts) + housing) / monthlyIncome) * 100 : 100;
  const p = pos(price);
  const cashNeeded = p * (pos(assume.downPct) + LENDER.closingPct) / 100 + housing * LENDER.months;
  const tips = [];
  const add = (status, title, text) => tips.push({ status, title, text });
  if (dti <= LENDER.dtiTarget) add("good", "Debt-to-income", `${dti.toFixed(0)}% with the new payment. Lenders like ${LENDER.dtiTarget}% or less.`);
  else {
    const cut = ((dti - LENDER.dtiTarget) / 100) * monthlyIncome;
    add(dti <= LENDER.dtiMax ? "work" : "bad", "Debt-to-income", `${dti.toFixed(0)}% with the new payment. Pay down about $${Math.ceil(cut).toLocaleString("en-US")} a month of debt to reach ${LENDER.dtiTarget}%. Start with the smallest balances or the car loan.`);
  }
  const c = Math.round(pos(credit));
  const reached = LENDER.credit.filter(([min]) => c >= min);
  const next = LENDER.credit.find(([min]) => c < min);
  if (!reached.length) add("bad", "Credit score", `${c} is under 620, the usual minimum. Pull all three reports, fix errors, and pay every bill on time for 6 to 12 months.`);
  else add(next ? "work" : "good", "Credit score", `${c} opens: ${reached.map(([, l]) => l).join(", ")}.${next ? ` Reaching ${next[0]} adds: ${next[1]}. Keep card balances under ${LENDER.utilization}% of their limits.` : " Keep it there: no new credit until you have the keys."}`);
  const gap = cashNeeded - pos(savings);
  add(gap <= 0 ? "good" : "work", "Cash", gap <= 0
    ? `You have enough for ${assume.downPct}% down, about ${LENDER.closingPct}% closing costs and ${LENDER.months} months of payments in reserve at a $${Math.round(p).toLocaleString("en-US")} price.`
    : `About $${Math.round(cashNeeded).toLocaleString("en-US")} needed for ${assume.downPct}% down, closing costs and ${LENDER.months} months of reserves; you are $${Math.round(gap).toLocaleString("en-US")} short. Deferred help can cover part of it. Keep savings in one account for 2 months before applying.`);
  add(pos(jobYears) >= LENDER.jobYears ? "good" : "work", "Steady income", pos(jobYears) >= LENDER.jobYears
    ? "Two years or more of steady income. Do not change jobs during escrow."
    : `Lenders usually want ${LENDER.jobYears} years of steady income in the same line of work. Gather pay stubs and a letter from your employer.`);
  add("tip", "During the whole process", "No new loans or cards, no large unexplained deposits, and a gift letter for any family money.");
  return { dti, cashNeeded, tips, score: tips.filter((t) => t.status === "good").length };
}

// GIVE: what a pledge of time, materials and money does, in counts we can stand behind.
export function pledgeView({ hours, money, gap }, hoursPerDay = 8) {
  const g = pos(gap);
  return {
    buildDays: pos(hoursPerDay) > 0 ? Math.floor(pos(hours) / pos(hoursPerDay)) : 0,
    shareOfGap: g > 0 ? Math.min(1, pos(money) / g) : 1,
    homesClosed: g > 0 ? pos(money) / g : 0,
  };
}

// MORTGAGE ATLAS: does a loan type fit this family? "fit", "check" or "no", with reasons.
export function mortgageFit(m, { credit, residency, downPct, loan, veteran, selfEmployed, firstTime, income }) {
  const reasons = [];
  let verdict = "fit";
  const no = (t) => { reasons.push({ ok: false, text: t }); verdict = "no"; };
  const ask = (t) => { reasons.push({ ok: null, text: t }); if (verdict === "fit") verdict = "check"; };
  if (m.residency === "vet" && !veteran) no("For veterans and service members.");
  if (m.residency === "green" && residency === "other") no("Citizens and green card holders only.");
  if (m.credit && pos(credit) < m.credit) no(`Needs a credit score of about ${m.credit}.`);
  if (m.minDown && pos(downPct) < m.minDown) no(`Needs about ${m.minDown}% down.`);
  if (m.maxLoan && pos(loan) > m.maxLoan) no(`Loan over the $${m.maxLoan.toLocaleString("en-US")} limit.`);
  if (m.minLoan && pos(loan) < m.minLoan) no(`For loans over $${(m.minLoan - 1).toLocaleString("en-US")}.`);
  if (m.incomeCap && pos(income) > m.incomeCap) no(`Income over the $${m.incomeCap.toLocaleString("en-US")} limit.`);
  if (m.firstTime && !firstTime) no("First-time buyers only.");
  if (m.selfEmployed && !selfEmployed) no("Meant for self-employed buyers.");
  if (m.rural) ask("Only in USDA rural areas. Check the address.");
  if (m.certainty === "general") ask("General guidance. Each lender sets its own rules.");
  if (verdict === "fit") reasons.push({ ok: true, text: "Fits these answers." });
  return { verdict, reasons };
}

// TOGETHER: two city proposals.
// 1. Shared equity ("Help to Buy, OC style"): a city, nonprofit or fund puts in a share of the price and gets the
//    same share of the home's value back on sale (UK Help to Buy) or its money plus the same share of the gain (SF DALP).
export function sharedEquity({ price, downPct = 5, equityPct = 20, ratePct, years = 10, growthPct = 3, pmiPct = 0.5, taxPct = 1.1, insPct = 0.35 }) {
  const p = pos(price);
  const d = pos(downPct) / 100;
  const e = Math.min(0.5, pos(equityPct) / 100);
  const f = payFactor(ratePct, 30);
  const ownCosts = (p * (pos(taxPct) + pos(insPct))) / 1200;
  const loanWithout = p * (1 - d);
  const loanWith = p * (1 - d - e);
  const pmiWithout = 1 - d > 0.8 ? (loanWithout * pos(pmiPct)) / 1200 : 0;
  const pmiWith = 1 - d - e > 0.8 ? (loanWith * pos(pmiPct)) / 1200 : 0;
  const monthlyWithout = loanWithout * f + pmiWithout + ownCosts;
  const monthlyWith = loanWith * f + pmiWith + ownCosts;
  const futureValue = p * (1 + pos(growthPct) / 100) ** pos(years);
  const fundIn = p * e;
  const ukReturn = futureValue * e;
  const sfReturn = fundIn + e * (futureValue - p);
  return { fundIn, monthlyWithout, monthlyWith, saving: monthlyWithout - monthlyWith, incomeWithout: (monthlyWithout * 12) / 0.3, incomeWith: (monthlyWith * 12) / 0.3, futureValue, ukReturn, sfReturn, homesPerTenMillion: fundIn > 0 ? Math.floor(10000000 / fundIn) : 0 };
}

// 2. Builders set aside discounted homes, sold below market and resold at the same discount (UK First Homes style).
export function setAside({ homes, setAsidePct = 10, discountPct = 30, marketPrice, ratePct, downPct = 5 }) {
  const n = Math.round(pos(homes));
  const count = Math.floor((n * pos(setAsidePct)) / 100);
  const m = pos(marketPrice);
  const k = Math.min(0.9, pos(discountPct) / 100);
  const price = m * (1 - k);
  const f = payFactor(ratePct, 30);
  const d = pos(downPct) / 100;
  const pay = (x) => x * (1 - d) * f;
  return { count, price, discountEach: m * k, valueToFamilies: m * k * count, monthlyMarket: pay(m), monthlyDiscounted: pay(price), resaleRule: `${Math.round(k * 100)}% below market value, every time it sells` };
}

// TOGETHER: civic tech day. Faster ADU permit review means homes rented or lived in sooner.
export function aduSpeed({ requests = 300, currentDays = 120, targetDays = 30, rent = 2700 }) {
  const n = Math.round(pos(requests));
  const now = pos(currentDays);
  const goal = Math.min(now, pos(targetDays));
  const daysSaved = now - goal;
  const homeYears = (n * daysSaved) / 365;
  return { daysSaved, homeYears, rentValue: homeYears * 12 * pos(rent), legalMaxDays: 60, overLaw: now > 60, meetsLaw: goal <= 60 };
}
