import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/gap.js";
import { ASSUME, DEAL, BUYER_AID, PROJECT_FUNDS, INCOME } from "../src/data.js";

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
