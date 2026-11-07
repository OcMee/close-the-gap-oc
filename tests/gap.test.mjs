import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/gap.js";
import { ASSUME, DEAL, BUYER_AID, PROJECT_FUNDS, INCOME } from "../src/data.js";
import * as data from "../src/data.js";

const near = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);
const by = (k) => BUYER_AID.find((p) => p.key === k);
const base = { tier: "lower", bedrooms: 3, ratePct: 7.18, assume: ASSUME, deal: DEAL, city: "Santa Ana", projectFunds: [] };

test("affordable cost follows 50052.5: 30% of 70% of median for lower income, size = bedrooms + 1", () => {
  const c = g.affordableCost("lower", 3);
  assert.equal(c.size, 4);
  near(c.yearly, 0.3 * 0.7 * 138600);
  near(g.affordableCost("moderate", 2).yearly, 0.35 * 1.1 * 124750);
  near(g.affordableCost("veryLow", 0).yearly, 0.3 * 0.5 * 97000);
});

test("payment factor matches a known mortgage payment", () => {
  near(800000 * g.payFactor(7.18, 30), 5419);
  near(360000 * g.payFactor(0, 30), 1000);
});

test("affordable price solves back to the monthly cost", () => {
  const p = g.affordablePrice({ monthly: 2425.5, ratePct: 7.18, downPct: 3, taxPct: 1.1, insPct: 0.35, pmiPct: 0.5 });
  const loan = p * 0.97;
  const monthly = loan * (g.payFactor(7.18, 30) + 0.005 / 12) + p * 0.0145 / 12;
  near(monthly, 2425.5, 0.5);
});

test("deferred aid raises the price by most of its value", () => {
  const args = { monthly: 2425.5, ratePct: 7.18 };
  const diff = g.affordablePrice({ ...args, aid: 120000 }) - g.affordablePrice(args);
  assert.ok(diff > 100000 && diff < 120000, String(diff));
});

test("higher rate means a lower price and a bigger gap", () => {
  const curve = g.rateCurve({ ...base, chosenAid: [] }, [6, 7, 8]);
  assert.ok(curve[0].gap < curve[1].gap && curve[1].gap < curve[2].gap);
  assert.ok(curve[0].price > curve[2].price);
});

test("city programs only count in their city and under their income table", () => {
  const fam = { price: 300000, income: 140000, size: 4, city: "Santa Ana" };
  assert.equal(g.aidAmount(by("santaAna"), fam), 120000);
  assert.equal(g.aidAmount(by("santaAna"), { ...fam, city: "Anaheim" }), 0);
  assert.equal(g.aidAmount(by("santaAna"), { ...fam, income: INCOME.low[3] + 1 }), 0);
  assert.equal(g.aidAmount(by("gardenGrove"), { ...fam, city: "Garden Grove", income: INCOME.low[3] }), 110000);
  assert.equal(g.aidAmount(by("gardenGrove"), { ...fam, city: "Garden Grove", income: INCOME.moderate[3] }), 50000);
  assert.equal(g.aidAmount(by("dream"), fam), 0);
  assert.equal(g.aidAmount(by("map"), { ...fam, city: "Stanton", price: 300000 }), 60000);
  assert.equal(g.aidAmount(by("map"), { ...fam, city: "Stanton", price: 600000 }), 80000);
});

test("percent-of-price aid converges", () => {
  const r = g.priceWithAid({ monthly: 2425.5, ratePct: 7.18 }, [by("myhome")], { income: 140000, size: 4, city: "Santa Ana" });
  near(r.aid, r.price * 0.03, 2);
});

test("gap accounting: cost minus price minus confirmed, then pending", () => {
  const funds = [{ amount: 100000, confirmed: true }, { amount: 55000, confirmed: false }];
  const r = g.closeTheGap({ ...base, chosenAid: [by("santaAna")], projectFunds: funds });
  assert.equal(r.totalCost, 535000);
  near(r.gapAfterAid, 535000 - r.withAid.price);
  near(r.gapConfirmed, r.gapAfterAid - 100000);
  near(r.gapIfAll, r.gapConfirmed - 55000);
  assert.ok(r.withAid.price > r.without + 100000);
});

test("schedule slip adds holding cost", () => {
  const a = g.closeTheGap({ ...base, chosenAid: [] });
  const b = g.closeTheGap({ ...base, chosenAid: [], slipMonths: 10 });
  near(b.totalCost - a.totalCost, 10 * ASSUME.carryPerMonth);
});

test("gift view splits by cost line and reports homes per million", () => {
  const r = g.closeTheGap({ ...base, chosenAid: [], projectFunds: PROJECT_FUNDS.map((f) => ({ ...f, confirmed: false })) });
  const v = g.giftView(25000, r, DEAL);
  near(v.lines.reduce((s, l) => s + l.amount, 0), 25000);
  near(v.homesPerMillion, 1000000 / r.gapIfAll, 0.01);
  assert.ok(v.shareOfGap > 0 && v.shareOfGap <= 1);
});

test("bad inputs never give NaN", () => {
  for (const v of [NaN, -1, undefined, null, "x", Infinity]) {
    const r = g.closeTheGap({ ...base, bedrooms: v, ratePct: v, slipMonths: v, chosenAid: BUYER_AID, projectFunds: [{ amount: v, confirmed: true }] });
    for (const k of ["without", "totalCost", "gapIfAll"]) assert.ok(Number.isFinite(r[k]), `${k} ${v}`);
  }
});

test("income group uses the HCD table for the household size", () => {
  assert.equal(g.incomeGroup(118000, 4).key, "low");
  assert.equal(g.incomeGroup(148850, 4).key, "low");
  assert.equal(g.incomeGroup(148851, 4).key, "moderate");
  assert.equal(g.incomeGroup(90000, 4).key, "veryLow");
  assert.equal(g.incomeGroup(300000, 4).key, "over");
});

test("ready check: Santa Ana family of 4 at $118k", () => {
  const r = g.readyCheck({ size: 4, income: 118000, city: "Santa Ana", residency: "citizen", firstTime: true, debts: 500, ratePct: 7.18, assume: ASSUME });
  const v = (k) => r.programs.find((p) => p.program.key === k).verdict;
  assert.equal(v("santaAna"), "yes");
  assert.equal(v("myhome"), "yes");
  assert.equal(v("anaheim"), "no");
  assert.equal(v("dream"), "closed");
  near(r.monthly, (118000 / 12) * 0.3);
  assert.ok(r.helped.price > r.alone + 100000);
  assert.equal(r.habitat.incomeOk, true);
  assert.equal(r.habitat.debtOk, true);
  assert.equal(r.habitat.hours, 250);
});

test("ready check: housing need by cost is rent over 30% of gross income", () => {
  const base2 = { size: 4, income: 120000, city: "Santa Ana", residency: "citizen", firstTime: true, debts: 0, ratePct: 7.18, assume: ASSUME };
  assert.equal(g.readyCheck({ ...base2, rent: 3001 }).habitat.needByCost, true);
  assert.equal(g.readyCheck({ ...base2, rent: 3000 }).habitat.needByCost, false);
  near(g.readyCheck({ ...base2, rent: 2700 }).habitat.rentShare, 27, 0.01);
});

test("ready check: no green card, owned before, high debts", () => {
  const r = g.readyCheck({ size: 2, income: 90000, city: "Stanton", residency: "other", firstTime: false, debts: 2000, ratePct: 7.18, assume: ASSUME });
  assert.equal(r.programs.find((p) => p.program.key === "map").verdict, "no");
  assert.equal(r.habitat.debtOk, false);
  assert.equal(r.habitat.residencyOk, false);
});

test("city levers cut land and fees only", () => {
  const d = g.applyLevers(DEAL, { landPct: 50, feePct: 100 });
  assert.equal(d.find((l) => l.key === "land").amount, 180000);
  assert.equal(d.find((l) => l.key === "fees").amount, 0);
  assert.equal(d.find((l) => l.key === "build").amount, 40000);
});

test("build day planner", () => {
  const b = g.buildDays({ homes: 6, adults: 2, hoursPerAdult: 250, hoursPerDay: 8 });
  assert.equal(b.total, 3000);
  assert.equal(b.perAdult, 32);
});

test("lender readiness: debt-to-income, credit tiers, cash, job", () => {
  const base3 = { income: 120000, debts: 1000, credit: 690, savings: 20000, jobYears: 3, price: 400000, ratePct: 7.18, assume: ASSUME };
  const r = g.lenderReady(base3);
  near(r.dti, 30 + 10, 0.01);
  assert.equal(r.tips.find((t) => t.title === "Debt-to-income").status, "good");
  const credit = r.tips.find((t) => t.title === "Credit score");
  assert.equal(credit.status, "work");
  assert.ok(credit.text.includes("740"));
  near(r.cashNeeded, 400000 * 0.06 + 3000 * 2, 0.5);
  assert.equal(r.tips.find((t) => t.title === "Cash").status, "work");
  assert.equal(r.tips.find((t) => t.title === "Steady income").status, "good");
  const high = g.lenderReady({ ...base3, debts: 1800 });
  assert.equal(high.tips.find((t) => t.title === "Debt-to-income").status, "work");
  assert.ok(high.tips.find((t) => t.title === "Debt-to-income").text.includes("$500"));
  assert.equal(g.lenderReady({ ...base3, debts: 2500 }).tips.find((t) => t.title === "Debt-to-income").status, "bad");
  assert.equal(g.lenderReady({ ...base3, credit: 600 }).tips.find((t) => t.title === "Credit score").status, "bad");
  assert.equal(g.lenderReady({ ...base3, credit: 800 }).tips.find((t) => t.title === "Credit score").status, "good");
  assert.equal(g.lenderReady({ ...base3, savings: 100000 }).tips.find((t) => t.title === "Cash").status, "good");
  assert.equal(g.lenderReady({ ...base3, jobYears: 1 }).tips.find((t) => t.title === "Steady income").status, "work");
});

test("pledge view", () => {
  const p = g.pledgeView({ hours: 100, money: 25000, gap: 83615 });
  assert.equal(p.buildDays, 12);
  near(p.shareOfGap, 25000 / 83615, 0.0001);
  assert.equal(g.pledgeView({ hours: 0, money: 10, gap: 0 }).shareOfGap, 1);
});

test("mortgage atlas fit rules", () => {
  const { MORTGAGES } = data;
  const m = (id) => MORTGAGES.find((x) => x.id === id);
  const fam = { credit: 690, residency: "citizen", downPct: 3.5, loan: 450000, veteran: false, selfEmployed: false, firstTime: true, income: 118000 };
  assert.equal(g.mortgageFit(m("conv"), fam).verdict, "fit");
  assert.equal(g.mortgageFit(m("fha"), fam).verdict, "fit");
  assert.equal(g.mortgageFit(m("fha"), { ...fam, residency: "other" }).verdict, "no");
  assert.equal(g.mortgageFit(m("fha"), { ...fam, downPct: 3 }).verdict, "no");
  assert.equal(g.mortgageFit(m("conv"), { ...fam, residency: "other" }).verdict, "fit");
  assert.equal(g.mortgageFit(m("calhfa"), fam).verdict, "fit");
  assert.equal(g.mortgageFit(m("calhfa"), { ...fam, credit: 670 }).verdict, "no");
  assert.equal(g.mortgageFit(m("homeready"), fam).verdict, "no");
  assert.equal(g.mortgageFit(m("homeready"), { ...fam, income: 100000 }).verdict, "fit");
  assert.equal(g.mortgageFit(m("hb"), fam).verdict, "no");
  assert.equal(g.mortgageFit(m("hb"), { ...fam, loan: 900000, downPct: 5 }).verdict, "fit");
  assert.equal(g.mortgageFit(m("jumbo"), { ...fam, loan: 1300000, downPct: 20, credit: 760 }).verdict, "check");
  assert.equal(g.mortgageFit(m("va"), fam).verdict, "no");
  assert.equal(g.mortgageFit(m("va"), { ...fam, veteran: true }).verdict, "check");
  assert.equal(g.mortgageFit(m("nonqm"), { ...fam, selfEmployed: true, downPct: 10 }).verdict, "check");
  assert.equal(g.mortgageFit(m("gsfa"), { ...fam, loan: 900000 }).verdict, "no");
  for (const x of MORTGAGES) assert.ok(["fit", "check", "no"].includes(g.mortgageFit(x, { ...fam, credit: NaN, loan: undefined }).verdict));
});

test("shared equity: smaller loan, no mortgage insurance, fund gets its share back", () => {
  const r = g.sharedEquity({ price: 700000, downPct: 5, equityPct: 20, ratePct: 7, years: 10, growthPct: 3 });
  near(r.fundIn, 140000);
  assert.ok(r.saving > 1000, String(r.saving));
  near(r.futureValue, 700000 * 1.03 ** 10, 1);
  near(r.ukReturn, r.futureValue * 0.2, 1);
  near(r.sfReturn, 140000 + 0.2 * (r.futureValue - 700000), 1);
  near(r.ukReturn, r.sfReturn, 1);
  assert.equal(r.homesPerTenMillion, 71);
  assert.ok(Number.isFinite(g.sharedEquity({ price: NaN, ratePct: NaN }).saving));
});
test("set-aside: count, discount, resale rule", () => {
  const r = g.setAside({ homes: 200, setAsidePct: 10, discountPct: 30, marketPrice: 1000000, ratePct: 7 });
  assert.equal(r.count, 20);
  near(r.price, 700000);
  near(r.valueToFamilies, 6000000);
  assert.ok(r.monthlyDiscounted < r.monthlyMarket);
  assert.ok(r.resaleRule.startsWith("30%"));
});

test("ADU speed: days saved turn into home-years and rent", () => {
  const r = g.aduSpeed({ requests: 365, currentDays: 120, targetDays: 30, rent: 2000 });
  assert.equal(r.daysSaved, 90);
  near(r.homeYears, 90);
  near(r.rentValue, 90 * 12 * 2000);
  assert.ok(r.overLaw && r.meetsLaw);
  assert.equal(g.aduSpeed({ currentDays: 20, targetDays: 30 }).daysSaved, 0);
});
