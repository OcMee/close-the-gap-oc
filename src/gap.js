// The gap engine. Pure functions, no page code, so every number can be tested.
import { INCOME, TIERS, ANAHEIM_150, BUYER_AID, HABITAT, READY_SHARE } from "./data.js";

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

export function readyCheck({ size, income, city, residency, firstTime, debts, ratePct, assume }) {
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
