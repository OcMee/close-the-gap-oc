// Page code. All text goes in through textContent, so nothing typed can become markup.
import { SOURCES, ASSUME, DEAL, BUYER_AID, PROJECT_FUNDS, TIERS, RATE, CITIES, CHECKED, LESSONS, LENDER, IDEAS, GIVE_WAYS, MORTGAGES } from "./data.js";
import { closeTheGap, rateCurve, giftView, tableFor, readyCheck, applyLevers, buildDays, lenderReady, pledgeView, mortgageFit } from "./gap.js";
import { pdfText } from "./pdftext.js";
import { analyze, buildProfile, TYPE_LABEL } from "./doccheck.js";

const SVG = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "href" && !/^(https:|#)/.test(v)) continue;
    else n.setAttribute(k, v === true ? "" : String(v));
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return n;
}
function svg(tag, attrs = {}, ...kids) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (k === "text") n.textContent = v; else n.setAttribute(k, String(v));
  for (const kid of kids) n.append(kid);
  return n;
}
const money = (x) => `${x < 0 ? "-" : ""}$${Math.round(Math.abs(x)).toLocaleString("en-US")}`;
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const tag = (status) => el("span", { class: `tag t-${status}`, text: { verified: "Verified", partly: "Partly verified", assumption: "ASSUMPTION", unknown: "We do not know", open: "Open", check: "Check status", closed: "Closed", unconfirmed: "Unconfirmed", confirmed: "Confirmed" }[status] || status });
const src = (key) => (SOURCES[key] ? el("a", { href: SOURCES[key].url, target: "_blank", rel: "noopener noreferrer", class: "src", text: "Source" }) : null);
const clampNum = (v, min, max, fallback) => { const x = Number(v); return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : fallback; };

// State lives only in this tab.
const S = {
  tier: "lower", bedrooms: 3, rate: RATE.value, city: "Santa Ana", slip: 0, gift: 25000,
  assume: { ...ASSUME }, deal: DEAL.map((l) => ({ ...l })),
  aid: Object.fromEntries(BUYER_AID.map((p) => [p.key, false])),
  funds: PROJECT_FUNDS.map((f) => ({ ...f, confirmed: false })),
  ready: { size: 4, income: 118000, debts: 500, rent: 2700, city: "Santa Ana", residency: "citizen", firstTime: true, credit: 690, savings: 15000, jobYears: 3 },
  pledge: { hours: 40, skill: "none", materials: 0, money: 25000 },
  atlas: { downPct: 3.5, veteran: false, selfEmployed: false },
  donate: { cause: "home", amount: 250, custom: "", freq: "monthly", match: false },
  levers: { landPct: 0, feePct: 0 },
  build: { homes: 6, adults: 2, hours: 250, perDay: 8 },
};
const dealNow = () => applyLevers(S.deal, S.levers);
let showTab = () => {};
const subs = [];
const paint = () => { const r = compute(); subs.forEach((f) => f(r)); };
const set = (fn) => { fn(); paint(); };
const compute = () => closeTheGap({
  tier: S.tier, bedrooms: S.bedrooms, ratePct: S.rate, assume: S.assume, deal: dealNow(), city: S.city, slipMonths: S.slip,
  chosenAid: BUYER_AID.filter((p) => S.aid[p.key]), projectFunds: S.funds,
});

function numberField(label, get, put, { min = 0, max = 1e7, step = 1, prefix = "", suffix = "", note, status } = {}) {
  const id = `f${Math.random().toString(36).slice(2, 8)}`;
  const input = el("input", { id, type: "number", inputmode: "decimal", min, max, step, value: get(),
    onchange: (e) => { set(() => put(clampNum(e.target.value, min, max, get()))); e.target.value = get(); } });
  return el("div", { class: "field" }, el("label", { for: id }, label, status ? tag(status) : null),
    el("div", { class: "num" }, prefix ? el("span", { text: prefix }) : null, input, suffix ? el("span", { text: suffix }) : null), note ? el("p", { class: "note", text: note }) : null);
}
function rangeField(label, get, put, { min, max, step, fmt, note }) {
  const id = `r${Math.random().toString(36).slice(2, 8)}`;
  const out = el("output", { for: id });
  const input = el("input", { id, type: "range", min, max, step, value: get(), oninput: (e) => set(() => put(Number(e.target.value))) });
  subs.push(() => { out.textContent = fmt(get()); input.value = get(); input.setAttribute("aria-valuetext", fmt(get())); });
  return el("div", { class: "field" }, el("label", { for: id }, label, out), input, note ? el("p", { class: "note", text: note }) : null);
}
const section = (id, kicker, title, lead, ...kids) => el("section", { id, class: "card" }, el("p", { class: "kicker", text: kicker }), el("h2", { text: title }), lead ? el("p", { class: "lead", text: lead }) : null, ...kids);
const big = (label) => { const v = el("strong", { class: "big" }); const n = el("span", { class: "sub" }); return { v, n, node: el("div", { class: "stat" }, el("span", { class: "lab", text: label }), v, n) }; };

// Hero: the answer in one line.

// READY: one family, early check.
function readySection() {
  const R = S.ready;
  const group = big("Income group");
  const alone = big("Price you could pay on income");
  const helped = big("With help that may fit");
  const list = el("div", { class: "aid" });
  const habitat = el("ul", { class: "checks" });
  const next = el("ol", { class: "plain" });
  const cityId = "ready-city";
  const city = el("select", { id: cityId, onchange: (e) => set(() => { R.city = e.target.value; }) }, CITIES.map((c) => el("option", { value: c, text: c })));
  city.value = R.city;
  const res = el("select", { id: "ready-res", onchange: (e) => set(() => { R.residency = e.target.value; }) },
    el("option", { value: "citizen", text: "U.S. citizen" }), el("option", { value: "pr", text: "Permanent resident (green card)" }), el("option", { value: "other", text: "Other or not sure" }));
  res.value = R.residency;
  const first = el("label", { class: "tick" }, el("input", { type: "checkbox", checked: R.firstTime, onchange: (e) => set(() => { R.firstTime = e.target.checked; }) }), "No one in the household owned a home in the last 3 years");
  const mark = { true: ["met", "Met"], false: ["miss", "Not met"], null: ["ask", "Check"] };
  subs.push(() => {
    const r = readyCheck({ ...R, ratePct: S.rate, assume: S.assume });
    group.v.textContent = r.group.label;
    group.n.textContent = `${r.size} people. Limit for this group: ${money(r.group.limit)} (HCD 2026)`;
    alone.v.textContent = money(r.alone);
    alone.n.textContent = `${money(r.monthly)} a month, 30% of gross income (ASSUMPTION), at ${S.rate.toFixed(2)}%`;
    helped.v.textContent = money(r.helped.price);
    helped.n.textContent = r.helped.aid > 0 ? `${money(r.helped.aid)} of deferred help: ${r.helped.lines.map((l) => l.program.name).join(" + ")}. Whether they combine is not confirmed.` : "No deferred help fits these answers";
    list.replaceChildren(...r.programs.map((p) => el("article", { class: `aidcard v-${p.verdict}` },
      el("div", { class: "row" }, el("b", { text: p.program.name })),
      el("p", { class: "verdict", text: { yes: "May fit", check: "May fit, check first", no: "Does not fit these answers", closed: "Closed now" }[p.verdict] }),
      el("ul", { class: "reasons" }, p.reasons.map((x) => el("li", { class: mark[x.ok][0] }, el("span", { class: "sr", text: `${mark[x.ok][1]}: ` }), x.text))),
      el("p", {}, src(p.program.src)))));
    const h = r.habitat;
    habitat.replaceChildren(
      el("li", { class: h.incomeOk ? "met" : "miss", text: h.incomeOk ? `Income fits Habitat's range for ${r.size} people: ${money(h.min)} to ${money(h.max)}.` : `Habitat's range for ${r.size} people is ${money(h.min)} to ${money(h.max)}.` }),
      el("li", { class: h.needByCost ? "met" : "ask", text: h.needByCost ? `Need for improved housing: rent is ${h.rentShare.toFixed(0)}% of gross income, over 30%.` : `Need for improved housing: rent is ${h.rentShare.toFixed(0)}% of gross income. Other ways to show need: overcrowded, unhealthy or unsafe housing, or unable to buy at market rate.` }),
      el("li", { class: h.residencyOk ? "met" : "miss", text: h.residencyOk ? "Citizen or permanent resident who lives or works in Orange County (confirm live or work)." : "Habitat requires U.S. citizens or permanent residents who live or work in Orange County." }),
      el("li", { class: "ask", text: "Ability to pay a long-term mortgage, a 1% to 5% down payment and closing costs. Credit is reviewed and should be in good standing." }),
      el("li", { class: h.debtOk ? "ask" : "miss", text: h.debtOk ? `Monthly debts are ${h.debtShare.toFixed(1)}% of gross income. Habitat's homebuyer guide says under 10%; the qualifications page does not list it, so confirm at orientation.` : `Monthly debts are ${h.debtShare.toFixed(1)}% of gross income. Habitat's homebuyer guide says under 10%, about ${money(h.debtLimit)} a month. Confirm at orientation.` }),
      h.hours ? el("li", { class: "met", text: `Sweat equity for this income group: ${h.hours} hours per adult on a new home, ${h.resaleHours} on a resale.` }) : null);
    const steps = [];
    if (!h.debtOk) steps.push(`Pay monthly debts down below ${money(h.debtLimit)}. It is the first thing Habitat checks.`);
    if (!R.firstTime) steps.push("Most help here is for first-time buyers. Ask each program how it counts past ownership.");
    steps.push("Attend a free orientation: Habitat OC runs them online in English, Spanish and Vietnamese.");
    steps.push("Take a HUD-approved homebuyer class. Most programs require it.");
    steps.push("Gather 2 years of tax returns, recent pay stubs and 2 months of bank statements.");
    steps.push("Pull your credit reports and fix errors before you apply. Free help in OC: SparkPoint OC, Orange County United Way, (714) 278-4679; Operation HOPE, (657) 208-5873.");
    next.replaceChildren(...steps.map((t) => el("li", { text: t })));
  });
  return section("ready", "1. Ready", "Is this family ready, and what is the gap?", "An early check for a family or the counselor sitting with them. Answers stay on this device. Use made-up numbers in a demo.",
    el("div", { class: "grid" },
      el("div", {},
        numberField("People in the household", () => R.size, (v) => { R.size = Math.round(v); }, { min: 1, max: 8, step: 1 }),
        numberField("Household income a year, before tax", () => R.income, (v) => { R.income = v; }, { min: 0, max: 1000000, step: 1000, prefix: "$" }),
        numberField("Monthly debt payments", () => R.debts, (v) => { R.debts = v; }, { min: 0, max: 50000, step: 50, prefix: "$", note: "Car, cards, student loans. Not rent." }),
        numberField("Rent and utilities a month", () => R.rent, (v) => { R.rent = v; }, { min: 0, max: 20000, step: 50, prefix: "$", note: "Habitat counts housing costs over 30% of gross income as a need." }),
        el("div", { class: "field" }, el("label", { for: cityId }, "City where they want to buy"), city),
        el("div", { class: "field" }, el("label", { for: "ready-res" }, "Residency"), res),
        first),
      el("div", {}, group.node, alone.node, helped.node)),
    el("h3", { text: "Programs" }), list,
    el("h3", { text: "Habitat for Humanity of Orange County" }), habitat, el("p", { class: "note" }, "Three criteria from Habitat: need for improved housing, a steady source of income, and willingness to partner (sweat equity). Questions: Habitat OC Home Ownership, (714) 434-6200 ext. 227. ", src("habitat")),
    el("h3", { text: "Next steps" }), next);
}

// TOGETHER: what a city and its neighbors can do before anyone writes a check.
function leversSection() {
  const saved = big("Cost removed by the city");
  const days = big("Build Days each adult needs");
  const hours = big("Total sweat-equity hours");
  subs.push((r) => {
    const raw = S.deal.reduce((s, l) => s + l.amount, 0);
    const cut = raw - applyLevers(S.deal, S.levers).reduce((s, l) => s + l.amount, 0);
    saved.v.textContent = money(cut);
    saved.n.textContent = cut > 0 ? `Gap per home is now ${r.gapIfAll > 0 ? money(r.gapIfAll) : "closed"}` : "Move a slider to see the effect";
    const b = buildDays({ homes: S.build.homes, adults: S.build.adults, hoursPerAdult: S.build.hours, hoursPerDay: S.build.perDay });
    days.v.textContent = String(b.perAdult);
    days.n.textContent = `At ${S.build.perDay} hours a day. Weekly Build Days take about ${b.perAdult} weeks.`;
    hours.v.textContent = b.total.toLocaleString("en-US");
    hours.n.textContent = `${S.build.homes} homes, ${S.build.adults} adults each, ${S.build.hours} hours per adult`;
  });
  return section("levers", "Together: city and neighbors", "What the city and neighbors can do", "Land is the biggest line in the example deal. Fees and delay add up. Build Days turn neighbors and families into a crew.",
    el("div", { class: "grid" },
      el("div", {},
        rangeField("City land: share offered free or leased", () => S.levers.landPct, (v) => { S.levers.landPct = v; }, { min: 0, max: 100, step: 5, fmt: (v) => `${v}%`, note: "A lever to ask each city about. We did not confirm any city offer." }),
        rangeField("Fees waived or deferred", () => S.levers.feePct, (v) => { S.levers.feePct = v; }, { min: 0, max: 100, step: 5, fmt: (v) => `${v}%`, note: "Assumption to check with each city." }),
        el("p", { class: "note", text: "Delay is set in section 1. Faster permits are money: each month adds holding cost (ASSUMPTION)." })),
      el("div", {}, saved.node)),
    el("h3", { text: "Build Day planner" }),
    el("div", { class: "grid" },
      el("div", {},
        numberField("Homes", () => S.build.homes, (v) => { S.build.homes = Math.round(v); }, { min: 1, max: 100, step: 1 }),
        numberField("Adults on title per home", () => S.build.adults, (v) => { S.build.adults = Math.round(v); }, { min: 1, max: 4, step: 1 }),
        numberField("Hours per adult", () => S.build.hours, (v) => { S.build.hours = v; }, { min: 0, max: 500, step: 5, note: "Habitat OC: 250 on a new home for low income, 100 on a resale, 25 for moderate income." }),
        numberField("Hours per Build Day", () => S.build.perDay, (v) => { S.build.perDay = v; }, { min: 1, max: 12, step: 1, status: "assumption" })),
      el("div", {}, hours.node, days.node,
        el("p", { class: "note", text: "Counts only. A city view would show how many households are nearly ready, never names." }))));
}

function tabs(panels) {
  const nav = document.getElementById("tabs");
  const buttons = panels.map(([id, label], i) => el("button", { type: "button", role: "tab", id: `tab-${id}`, "aria-controls": `panel-${id}`, "aria-selected": i === 0 ? "true" : "false", onclick: () => show(id) }, label));
  nav.setAttribute("role", "tablist");
  nav.replaceChildren(...buttons);
  const show = (id) => {
    for (const [pid] of panels) {
      document.getElementById(`panel-${pid}`).hidden = pid !== id;
      document.getElementById(`tab-${pid}`).setAttribute("aria-selected", pid === id ? "true" : "false");
    }
  };
  return show;
}

// Together: the answer in one line.
function hero() {
  const line = el("p", { class: "answer", role: "status", "aria-live": "polite" });
  const bar = el("div", { class: "bar", role: "img" });
  const legend = el("ul", { class: "legend" });
  subs.push((r) => {
    const remaining = r.gapIfAll;
    line.textContent = remaining > 0
      ? `This home is ${money(remaining)} short, even if every pending fund arrives. Before any help it was ${money(r.gapBefore)} short.`
      : r.pending > 0 && r.gapConfirmed > 0
        ? `This home closes, with ${money(-remaining)} to spare, but only if ${money(r.pending)} of unconfirmed funds arrive. Before any help it was ${money(r.gapBefore)} short.`
        : `This home closes on confirmed money, with ${money(-r.gapConfirmed)} to spare. Before any help it was ${money(r.gapBefore)} short.`;
    const parts = [
      ["Family pays from income", r.without, "p0"], ["Buyer help (deferred loans)", r.withAid.price - r.without, "p1"],
      ["Confirmed project funds", r.confirmed, "p2"], ["Unconfirmed project funds", r.pending, "p3"], ["Still missing", Math.max(0, remaining), "p4"],
    ].filter(([, v]) => v > 0);
    const total = Math.max(r.totalCost, parts.reduce((s, [, v]) => s + v, 0)) || 1;
    bar.replaceChildren(...parts.map(([, v, c]) => { const s = el("span", { class: `seg ${c}` }); s.style.setProperty("--w", `${(v / total) * 100}%`); return s; }));
    bar.setAttribute("aria-label", `Cost ${money(r.totalCost)}: ${parts.map(([l, v]) => `${l} ${money(v)}`).join(", ")}`);
    legend.replaceChildren(...parts.map(([l, v, c]) => el("li", {}, el("i", { class: `dot ${c}` }), el("span", { text: l }), el("b", { text: money(v) }))));
  });
  const scen = (label, fn) => el("button", { type: "button", class: "chip", onclick: () => set(fn) }, label);
  return el("section", { class: "hero" },
    el("h2", { class: "h1" }, "Does it pencil, and ", el("em", { text: "who closes the gap?" })),
    el("p", { class: "lead", text: "For a nonprofit finance lead, a city housing analyst or a donor. One affordable Orange County home: what it costs, what the family can legally pay, what help stacks, and what is still missing. Every number shows its source or says ASSUMPTION." }),
    el("div", { class: "chips" }, el("span", { text: "Try a scenario:" }),
      scen("M01 Who closes the gap?", () => { S.rate = RATE.value; S.slip = 0; Object.keys(S.aid).forEach((k) => { S.aid[k] = false; }); S.funds.forEach((f) => { f.confirmed = f.key !== "gifts"; }); showTab("together"); location.hash = "#stack"; }),
      scen("M02 The rate moves", () => { S.rate = RATE.previous; showTab("together"); location.hash = "#rates"; }),
      scen("M03 What does $25,000 do?", () => { S.gift = 25000; showTab("give"); location.hash = "#give"; })),
    el("div", { class: "result" }, line, bar, legend));
}

function homeSection() {
  const total = big("Cost to deliver one home");
  subs.push((r) => { total.v.textContent = money(r.totalCost); total.n.textContent = r.slip ? `Includes ${money(r.slip)} from a ${S.slip}-month delay` : "No delay included"; });
  return section("home", "Together: the home", "What it costs to deliver", "From the lane's made-up example deal. Change any line to match a real project, and label it.",
    el("div", { class: "grid" },
      el("div", {}, S.deal.map((l) => numberField(l.label, () => l.amount, (v) => { l.amount = v; }, { step: 1000, prefix: "$", status: "assumption" }))),
      el("div", {}, total.node,
        rangeField("Schedule slip", () => S.slip, (v) => { S.slip = v; }, { min: 0, max: 24, step: 1, fmt: (v) => `${v} months`, note: "Each month adds holding costs. $7,083 a month here is $85,000 over 12 months (ASSUMPTION). In the lane's example, a 10-month slip multiplied the fundraising needed about seven times." }),
        numberField("Holding cost per month", () => S.assume.carryPerMonth, (v) => { S.assume.carryPerMonth = v; }, { step: 100, prefix: "$", status: "assumption" }))));
}

function familySection() {
  const cap = big("Most the family can pay each month");
  const price = big("Price the family can pay, before help");
  const why = el("p", { class: "note" });
  subs.push((r) => {
    cap.v.textContent = money(r.cost.monthly);
    cap.n.textContent = `${pct(r.cost.tier.share)} of ${pct(r.cost.tier.ami)} of the ${money(r.cost.median)} median for ${r.cost.size} people`;
    price.v.textContent = money(r.without);
    price.n.textContent = `At ${S.rate.toFixed(2)}%, ${S.assume.downPct}% down, tax, insurance and mortgage insurance included`;
    why.textContent = `Household size is bedrooms plus one (${S.bedrooms} bedrooms, ${r.cost.size} people). Income limit for this group and size: ${money(tableFor(r.cost.tier.cap)[r.cost.size - 1])} (HCD 2026).`;
  });
  const tierSel = el("select", { id: "tier", onchange: (e) => set(() => { S.tier = e.target.value; }) }, TIERS.map((t) => el("option", { value: t.key, text: t.label })));
  tierSel.value = S.tier;
  return section("family", "Together: the family", "What the family can legally pay", "California sets the affordable housing cost by income group, not by the family's exact income. We price at the cap.",
    el("div", { class: "grid" },
      el("div", {},
        el("div", { class: "field" }, el("label", { for: "tier" }, "Income group", tag("verified")), tierSel),
        rangeField("Bedrooms", () => S.bedrooms, (v) => { S.bedrooms = v; }, { min: 0, max: 5, step: 1, fmt: (v) => `${v}` }),
        rangeField("30-year rate", () => S.rate, (v) => { S.rate = v; }, { min: 4, max: 10, step: 0.01, fmt: (v) => `${v.toFixed(2)}%`, note: `Freddie Mac average: ${RATE.value}% on ${RATE.date}.` }),
        el("details", { class: "more" }, el("summary", { text: "Loan assumptions" }),
          numberField("Down payment", () => S.assume.downPct, (v) => { S.assume.downPct = v; }, { min: 0, max: 50, step: 0.5, suffix: "%", status: "assumption" }),
          numberField("Property tax rate", () => S.assume.taxPct, (v) => { S.assume.taxPct = v; }, { min: 0.5, max: 3, step: 0.05, suffix: "%", status: "assumption", note: "About 1% plus local bonds. Mello-Roos areas run higher." }),
          numberField("Insurance, share of price", () => S.assume.insPct, (v) => { S.assume.insPct = v; }, { min: 0, max: 2, step: 0.05, suffix: "%", status: "assumption" }),
          numberField("Mortgage insurance", () => S.assume.pmiPct, (v) => { S.assume.pmiPct = v; }, { min: 0, max: 2, step: 0.05, suffix: "% a year", status: "assumption" }),
          numberField("HOA a month", () => S.assume.hoa, (v) => { S.assume.hoa = v; }, { min: 0, max: 2000, step: 10, prefix: "$", status: "assumption" }))),
      el("div", {}, cap.node, price.node, why,
        el("p", { class: "note" }, "Formula: H&SC 50052.5(b). ", tag("partly"), " ", src("statute"), " We read the formula but not every exception. Confirm with the program."))));
}

function stackSection() {
  const cards = el("div", { class: "aid" });
  const after = big("Price the family can pay with help");
  const gapA = big("Gap after buyer help");
  const gapB = big("Gap after confirmed funds");
  const gapC = big("Gap if every pending fund arrives");
  const citySel = el("select", { id: "city", onchange: (e) => set(() => { S.city = e.target.value; }) }, CITIES.map((c) => el("option", { value: c, text: c })));
  citySel.value = S.city;
  subs.push((r) => {
    after.v.textContent = money(r.withAid.price);
    after.n.textContent = `${money(r.withAid.aid)} of deferred help, same monthly cost`;
    for (const [s, v] of [[gapA, r.gapAfterAid], [gapB, r.gapConfirmed], [gapC, r.gapIfAll]]) {
      s.v.textContent = v > 0 ? money(v) : `${money(-v)} spare`;
      s.v.dataset.bad = v > 0 ? "1" : "0";
    }
    cards.replaceChildren(...BUYER_AID.map((p) => {
      const line = r.withAid.lines.find((l) => l.program.key === p.key);
      const id = `a-${p.key}`;
      let why;
      if (p.status === "closed") why = "Closed now";
      else if (p.cities && !p.cities.includes(S.city)) why = `Only in ${p.cities.join(", ")}`;
      else if (line) why = `${money(line.amount)} at this price`;
      else if (S.aid[p.key]) why = "Family is over this income limit";
      else {
        const trial = closeTheGap({ tier: S.tier, bedrooms: S.bedrooms, ratePct: S.rate, assume: S.assume, deal: dealNow(), city: S.city, slipMonths: S.slip,
          chosenAid: BUYER_AID.filter((q) => S.aid[q.key] || q.key === p.key), projectFunds: S.funds });
        const closes = r.gapIfAll - trial.gapIfAll;
        why = closes > 0 ? `Would close about ${money(closes)}. Tick to count it.` : "Family is over this income limit";
      }
      return el("article", { class: `aidcard ${line ? "on" : ""}` },
        el("div", { class: "row" }, el("input", { id, type: "checkbox", checked: S.aid[p.key], disabled: p.status === "closed", onchange: (e) => set(() => { S.aid[p.key] = e.target.checked; }) }),
          el("label", { for: id }, el("b", { text: p.name })), tag(p.status)),
        el("p", { class: "kind", text: `${p.kind}. ${p.timing}.` }),
        el("p", { class: "amt", text: why }),
        el("p", { class: "note", text: p.note }), el("p", {}, tag(SOURCES[p.src].status), " ", src(p.src)));
    }));
  });
  const fundRows = S.funds.map((f) => {
    const cid = `c-${f.key}`;
    return el("div", { class: "fund" },
      numberField(f.name, () => f.amount, (v) => { f.amount = v; }, { step: 1000, prefix: "$", status: "assumption", note: f.note }),
      el("label", { class: "tick", for: cid }, el("input", { id: cid, type: "checkbox", checked: f.confirmed, onchange: (e) => set(() => { f.confirmed = e.target.checked; }) }), "Confirmed (awarded or signed)"));
  });
  return section("stack", "Together: the stack", "Who closes the gap", "Help to the buyer raises what the family can pay. Money to the project lowers what is left. Unconfirmed money is shown apart, because a gap is only closed when the money is signed.",
    el("div", { class: "field narrow" }, el("label", { for: "city" }, "Where is the home?"), citySel),
    el("h3", { text: "Help to the buyer" }), cards,
    el("p", { class: "note warn", text: "Whether these programs combine is not confirmed. Each one caps total borrowing, and the lender and city decide. Treat the stack as a question to ask, not an answer." }),
    el("h3", { text: "Money to the project" }), el("div", { class: "funds" }, fundRows),
    el("div", { class: "stats4" }, after.node, gapA.node, gapB.node, gapC.node));
}

function rateSection() {
  const W = 640, H = 260, P = { l: 70, r: 16, t: 16, b: 36 };
  const chart = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img" });
  const text = el("p", { class: "answer small", role: "status" });
  const table = el("table", { class: "tbl" });
  subs.push(() => {
    const rates = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
    const input = { tier: S.tier, bedrooms: S.bedrooms, assume: S.assume, deal: dealNow(), city: S.city, slipMonths: S.slip, chosenAid: BUYER_AID.filter((p) => S.aid[p.key]), projectFunds: S.funds };
    const curve = rateCurve(input, rates);
    const lo = Math.min(0, ...curve.map((c) => c.gap)), hi = Math.max(1, ...curve.map((c) => c.gap));
    const x = (r) => P.l + ((r - 5) / 4) * (W - P.l - P.r);
    const y = (g) => P.t + (1 - (g - lo) / (hi - lo || 1)) * (H - P.t - P.b);
    chart.replaceChildren();
    chart.append(svg("line", { x1: P.l, x2: W - P.r, y1: y(0), y2: y(0), class: "zero" }));
    rates.forEach((r) => chart.append(svg("text", { x: x(r), y: H - 12, "text-anchor": "middle", class: "tick", text: `${r}%` })));
    [lo, (lo + hi) / 2, hi].forEach((g) => chart.append(svg("text", { x: P.l - 8, y: y(g) + 4, "text-anchor": "end", class: "tick", text: `$${Math.round(g / 1000)}k` })));
    chart.append(svg("polyline", { points: curve.map((c) => `${x(c.rate)},${y(c.gap)}`).join(" "), class: "curve" }));
    const now = closeTheGap({ ...input, ratePct: S.rate });
    chart.append(svg("circle", { cx: x(Math.min(9, Math.max(5, S.rate))), cy: y(now.gapIfAll), r: 7, class: "pin" }));
    chart.setAttribute("aria-label", `Gap by rate: ${curve.map((c) => `${c.rate}% ${money(c.gap)}`).join(", ")}`);
    const prev = closeTheGap({ ...input, ratePct: RATE.previous });
    const cur = closeTheGap({ ...input, ratePct: RATE.value });
    const step = closeTheGap({ ...input, ratePct: S.rate + 0.5 });
    text.textContent = `Every half point costs about ${money(step.gapIfAll - now.gapIfAll)} on this home. Freddie Mac's rate moved from ${RATE.previous.toFixed(2)}% (${RATE.previousDate}) to ${RATE.value.toFixed(2)}% (${RATE.date}), which ${cur.gapIfAll <= prev.gapIfAll ? "shrank" : "grew"} the gap by ${money(Math.abs(cur.gapIfAll - prev.gapIfAll))}.`;
    table.replaceChildren(el("thead", {}, el("tr", {}, el("th", { text: "Rate" }), el("th", { text: "Family can pay" }), el("th", { text: "Gap left" }))),
      el("tbody", {}, curve.map((c) => el("tr", {}, el("td", { text: `${c.rate}%` }), el("td", { text: money(c.price) }), el("td", { text: money(c.gap) })))));
  });
  return section("rates", "Together: rates", "When the rate moves, the gap moves", "Same family, same help. Only the mortgage rate changes. The dot is the rate set above.",
    chart, text, el("details", { class: "more" }, el("summary", { text: "Show as a table" }), table), el("p", { class: "note" }, "Rate: Freddie Mac 30-year fixed. ", tag("verified"), " ", src("fred")));
}

function giveSection() {
  const share = big("Share of this home's gap");
  const homes = big("Homes closed per $1 million");
  const lines = el("ul", { class: "legend" });
  const say = el("p", { class: "answer small", role: "status" });
  subs.push((r) => {
    const v = giftView(S.gift, r, dealNow());
    share.v.textContent = r.gapIfAll > 0 ? pct(v.shareOfGap) : "Closed";
    share.n.textContent = r.gapIfAll > 0 ? `${money(v.left)} still missing after the gift` : "No gap left in this scenario";
    homes.v.textContent = Number.isFinite(v.homesPerMillion) ? v.homesPerMillion.toFixed(1) : "No gap";
    homes.n.textContent = "At this gap per home";
    say.textContent = `${money(v.gift)} pays for roughly: ${v.lines.map((l) => `${money(l.amount)} of ${l.label.toLowerCase()}`).join(", ")}. Split in proportion to the cost lines, which are ASSUMPTION.`;
  });
  return section("give", "3. Give", "What a gift does", "For a donor or a business that wants to see where the money goes.",
    el("div", { class: "grid" },
      el("div", {}, numberField("Gift", () => S.gift, (v) => { S.gift = v; }, { step: 1000, prefix: "$" }), say),
      el("div", {}, share.node, homes.node)),
    el("h3", { text: "Taxes, honestly" }),
    el("ul", { class: "plain" },
      el("li", {}, "Gifts to a 501(c)(3) charity are generally deductible for donors who itemize. ", src("irs526")),
      el("li", {}, "Donated goods are valued under IRS Publication 561. Non-cash gifts over $500 need Form 8283. ", src("irs561")),
      el("li", { text: "A city cannot hand out income tax breaks. Cities can lower costs instead: land, fee deferrals, faster review. We did not confirm any city offer." }),
      el("li", { text: "A donation pays no one back. Lending to housing for a return is investing, with risk, and needs a licensed advisor. We keep the two apart." }),
      el("li", { text: "Donors should ask their own tax advisor." })));
}

function sourcesSection() {
  const rows = [
    ...Object.values(SOURCES).map((s) => [s.label, s.status, s.url]),
    ["Orange County income limits used (median, 50%, 80%, 120% by household size)", "verified", SOURCES.hcd.url],
    ...DEAL.map((l) => [`${l.label}: ${money(l.amount)}`, "assumption", SOURCES.lane.url]),
    [`Down payment ${ASSUME.downPct}%, property tax ${ASSUME.taxPct}%, insurance ${ASSUME.insPct}%, mortgage insurance ${ASSUME.pmiPct}% a year`, "assumption", null],
    [`Holding cost $${ASSUME.carryPerMonth.toLocaleString("en-US")} a month (the deal's $85,000 over 12 months)`, "assumption", null],
    ["Whether buyer programs combine, and their combined borrowing caps", "unknown", null],
    ["Per-home amounts for HOME, CDBG, CalHome or other public awards", "unknown", null],
    ["Price caps for Santa Ana and Garden Grove; Garden Grove funding status", "unknown", null],
    ["Citizenship rules for Santa Ana, Garden Grove and Anaheim programs", "unknown", null],
    ["County MAP covers 14 smaller cities plus unincorporated areas; the tool lists 5", "partly", SOURCES.map.url],
  ];
  return section("sources", "Sources and assumptions", "Every number, where it came from", `Checked ${CHECKED}. When a source does not say, the tool says "We do not know".`,
    el("table", { class: "tbl" }, el("thead", {}, el("tr", {}, el("th", { text: "Item" }), el("th", { text: "Status" }), el("th", { text: "Link" }))),
      el("tbody", {}, rows.map(([label, status, url]) => el("tr", {}, el("td", { text: label }), el("td", {}, tag(status)), el("td", {}, url ? el("a", { href: url, target: "_blank", rel: "noopener noreferrer", text: "Open" }) : "None"))))));
}


// READY: learn the basics, then see how a lender would see you.
function learnSection() {
  return section("learn", "1. Ready: learn", "Learn the basics in five minutes", "Six short lessons. Each one is general guidance; your lender and program staff decide.",
    el("div", { class: "lessons" }, LESSONS.map((l, i) => el("details", { class: "lesson", open: i === 0 }, el("summary", {}, el("span", { class: "n", text: String(i + 1) }), l.title), el("p", { text: l.body })))));
}

function borrowerSection() {
  const R = S.ready;
  const list = el("div", { class: "tips" });
  const dti = big("Debt-to-income with the new payment");
  const cash = big("Cash to have ready");
  subs.push(() => {
    const ready = readyCheck({ ...R, ratePct: S.rate, assume: S.assume });
    const r = lenderReady({ ...R, price: ready.helped.price, ratePct: S.rate, assume: S.assume });
    dti.v.textContent = `${r.dti.toFixed(0)}%`;
    dti.v.dataset.bad = r.dti > LENDER.dtiTarget ? "1" : "0";
    dti.n.textContent = `Target ${LENDER.dtiTarget}% or less. Most loans stop near ${LENDER.dtiMax}%.`;
    cash.v.textContent = money(r.cashNeeded);
    cash.n.textContent = `For a ${money(ready.helped.price)} home: ${S.assume.downPct}% down, about ${LENDER.closingPct}% closing costs, ${LENDER.months} months of payments`;
    const label = { good: "Strong", work: "Work on this", bad: "Fix first", tip: "Tip" };
    list.replaceChildren(...r.tips.map((t) => el("article", { class: `tip s-${t.status}` },
      el("div", { class: "row" }, el("b", { text: t.title }), el("span", { class: "tag", text: label[t.status] })), el("p", { text: t.text }))));
  });
  return section("borrower", "1. Ready: get stronger", "How a lender sees this family", "Personal tips from the answers above, each with a number to aim for. General guidance, not lending advice.",
    el("div", { class: "grid" },
      el("div", {},
        numberField("Lowest credit score of the buyers", () => R.credit, (v) => { R.credit = Math.round(v); }, { min: 300, max: 850, step: 5 }),
        numberField("Savings today", () => R.savings, (v) => { R.savings = v; }, { min: 0, max: 2000000, step: 500, prefix: "$" }),
        numberField("Years of steady income", () => R.jobYears, (v) => { R.jobYears = v; }, { min: 0, max: 40, step: 0.5 })),
      el("div", {}, dti.node, cash.node)),
    list);
}

// TOGETHER: ideas a city or nonprofit can start, each with a first step.
function ideasSection() {
  return section("ideas", "Together: program ideas", "Programs a city or nonprofit can start", "Each idea names the lever it pulls and a first step. Examples are only ones we checked; the rest say so.",
    el("div", { class: "ideas" }, IDEAS.map((i) => el("article", { class: "idea" },
      el("div", { class: "row" }, el("b", { text: i.title }), el("span", { class: "lever", text: i.lever })),
      el("p", { text: i.what }),
      el("p", { class: "note" }, "Example: ", i.example, " ", i.url ? el("a", { href: i.url, target: "_blank", rel: "noopener noreferrer", text: "Source" }) : null),
      el("p", { class: "first" }, el("b", { text: "First step: " }), i.first)))));
}

// GIVE: pillars of the community, with time, skills, resources and money.
function pillarsSection() {
  const P2 = S.pledge;
  const days = big("Build Days");
  const share = big("Share of one home's gap");
  const say = el("p", { class: "answer small", role: "status" });
  subs.push((r) => {
    const v = pledgeView({ hours: P2.hours, money: P2.money, gap: r.gapIfAll });
    days.v.textContent = String(v.buildDays);
    days.n.textContent = `${P2.hours} hours at 8 hours a day`;
    share.v.textContent = r.gapIfAll > 0 ? pct(v.shareOfGap) : "Closed";
    share.n.textContent = r.gapIfAll > 0 ? `${money(P2.money)} against a ${money(r.gapIfAll)} gap` : "No gap left in this scenario";
    const parts = [];
    if (P2.hours > 0) parts.push(`${P2.hours} hours: ${v.buildDays} Build Days beside families earning their sweat equity`);
    if (P2.skill !== "none") parts.push(`pro bono ${P2.skill.toLowerCase()} help that families would otherwise pay for`);
    if (P2.materials > 0) parts.push(`${money(P2.materials)} of materials through a Habitat ReStore`);
    if (P2.money > 0) parts.push(`${money(P2.money)}, about ${pct(v.shareOfGap)} of one home's gap`);
    say.textContent = parts.length ? `Your pledge: ${parts.join("; ")}.` : "Add time, skills, materials or money to see what your pledge does.";
  });
  const skillSel = el("select", { id: "pledge-skill", onchange: (e) => set(() => { P2.skill = e.target.value; }) },
    ["none", "Legal", "Engineering and design", "Lending and real estate", "Accounting and tax"].map((s) => el("option", { value: s, text: s === "none" ? "None" : s })));
  skillSel.value = P2.skill;
  return section("pillars", "3. Give: pillars of the community", "Give time, skills, resources or money", "For people who have done well here and want their county to be better. Every kind of help counts, not only money.",
    el("div", { class: "ways" }, GIVE_WAYS.map((w) => el("div", { class: "way" }, el("h3", { text: w.kind }), el("ul", { class: "plain" }, w.items.map((t) => el("li", { text: t })))))),
    el("h3", { text: "Your pledge" }),
    el("div", { class: "grid" },
      el("div", {},
        numberField("Volunteer hours this year", () => P2.hours, (v) => { P2.hours = Math.round(v); }, { min: 0, max: 5000, step: 8 }),
        el("div", { class: "field" }, el("label", { for: "pledge-skill" }, "Professional skill to give"), skillSel),
        numberField("Materials to donate, value", () => P2.materials, (v) => { P2.materials = v; }, { min: 0, max: 10000000, step: 500, prefix: "$" }),
        numberField("Money", () => P2.money, (v) => { P2.money = v; }, { min: 0, max: 100000000, step: 1000, prefix: "$" })),
      el("div", {}, days.node, share.node)),
    say,
    el("p", { class: "note", text: "Volunteer hours help build homes; families earn their own sweat equity. Ask Habitat OC or your chosen nonprofit how they count gifts of time and materials. Ask your tax advisor how a gift is deducted." }));
}


// READY: the mortgage atlas. Every main loan type, and which ones fit this family.
function atlasSection() {
  const A = S.atlas;
  const grid = el("div", { class: "atlas" });
  const count = el("p", { class: "answer small", role: "status" });
  const toggle = (key, label) => el("label", { class: "tick" }, el("input", { type: "checkbox", checked: A[key], onchange: (e) => set(() => { A[key] = e.target.checked; }) }), label);
  const LABEL = { fit: "Fits", check: "Check with a lender", no: "Not for now" };
  subs.push(() => {
    const R = S.ready;
    const ready = readyCheck({ ...R, ratePct: S.rate, assume: S.assume });
    const price = ready.helped.price;
    const loan = price * (1 - A.downPct / 100);
    const fam = { credit: R.credit, residency: R.residency, downPct: A.downPct, loan, veteran: A.veteran, selfEmployed: A.selfEmployed, firstTime: R.firstTime, income: R.income };
    const rows = MORTGAGES.map((m) => ({ m, ...mortgageFit(m, fam) }));
    const fits = rows.filter((r) => r.verdict === "fit").length;
    const checks = rows.filter((r) => r.verdict === "check").length;
    count.textContent = `For a ${money(price)} home with ${A.downPct}% down (a ${money(loan)} loan): ${fits} loan types fit, ${checks} to check with a lender, ${rows.length - fits - checks} not for now.`;
    const families = [...new Set(MORTGAGES.map((m) => m.family))];
    grid.replaceChildren(...families.map((fam2) => el("div", { class: "atlas-group" }, el("h3", { text: { Conventional: "Conventional loans", Government: "Government loans", State: "State and agency programs", Special: "Special situations" }[fam2] || fam2 }),
      el("div", { class: "atlas-grid" }, rows.filter((r) => r.m.family === fam2).map((r) => el("article", { class: `loan v-${r.verdict}` },
        el("div", { class: "row" }, el("b", { text: r.m.name }), el("span", { class: `fit f-${r.verdict}`, text: LABEL[r.verdict] })),
        el("dl", {},
          el("dt", { text: "Down" }), el("dd", { text: r.m.down }),
          el("dt", { text: "Credit" }), el("dd", { text: r.m.credit ? `About ${r.m.credit}+` : "Lender sets it" }),
          el("dt", { text: "Insurance" }), el("dd", { text: r.m.mi }),
          el("dt", { text: "For" }), el("dd", { text: r.m.who })),
        el("p", { class: "pc" }, el("b", { text: "Good: " }), r.m.pros),
        el("p", { class: "pc" }, el("b", { text: "Watch: " }), r.m.cons),
        r.m.pairs.length ? el("p", { class: "note" }, "Pairs with: ", r.m.pairs.join(", ")) : null,
        el("ul", { class: "reasons" }, r.reasons.map((x) => el("li", { class: x.ok === true ? "met" : x.ok === false ? "miss" : "ask", text: x.text }))),
        el("p", { class: "note" }, el("span", { class: `tag t-${r.m.certainty === "verified" ? "verified" : "partly"}`, text: r.m.certainty === "verified" ? "Verified 7 Nov 2026" : "General guidance" }), " ", r.m.url ? el("a", { href: r.m.url, target: "_blank", rel: "noopener noreferrer", text: "Source" }) : null)))))));
  });
  return section("atlas", "1. Ready: mortgage atlas", "Every main loan type, and which fit this family", "Uses the credit score, residency and income above. Orange County 2026 loan limit: $1,249,125; above $832,750 is high-balance.",
    el("div", { class: "grid" },
      el("div", {}, numberField("Down payment you can make", () => A.downPct, (v) => { A.downPct = v; }, { min: 0, max: 50, step: 0.5, suffix: "%" })),
      el("div", {}, toggle("veteran", "A buyer is a veteran or service member"), toggle("selfEmployed", "A buyer is self-employed"))),
    count, grid);
}


// READY: verify a profile from documents. PDFs are read on this device; nothing is uploaded.
function docsSection() {
  const R = S.ready;
  const results = [];
  const list = el("div", { class: "docs" });
  const profileBox = el("div", { class: "profile" });
  const status = el("p", { class: "answer small", role: "status", text: "Add pay stubs, a bank statement, a Loan Estimate or notices as PDF files." });
  const LEVEL = { fix: "Fix or explain", watch: "Watch" };
  const paint2 = () => {
    list.replaceChildren(...results.map((r) => el("article", { class: "doc" },
      el("div", { class: "row" }, el("b", { text: r.name }), el("span", { class: "lever", text: TYPE_LABEL[r.type] })),
      el("ul", { class: "plain" }, r.facts.map((f) => el("li", { text: f }))),
      r.flags.length ? el("ul", { class: "reasons" }, r.flags.map((f) => el("li", { class: f.level === "fix" ? "miss" : "ask" }, el("b", { text: `${LEVEL[f.level]}: ` }), f.text))) : el("p", { class: "note", text: "Nothing flagged in this document." }))));
    const fixes = results.reduce((s, r) => s + r.flags.filter((f) => f.level === "fix").length, 0);
    status.textContent = results.length ? `${results.length} document${results.length > 1 ? "s" : ""} read on this device. ${fixes} item${fixes === 1 ? "" : "s"} to fix or explain before applying.` : "Add pay stubs, a bank statement, a Loan Estimate or notices as PDF files.";
    const p = buildProfile(results);
    if (!results.some((r) => r.type === "paystub" || r.type === "bank")) { profileBox.replaceChildren(); return; }
    const rows = [
      ["Applicants", p.people.join(" and ") || "Not found"],
      ["Gross monthly income", p.incomeHigh ? `${money(p.incomeLow)} to ${money(p.incomeHigh)} (base pay to year-to-date average)` : "Add pay stubs"],
      ["Current rent", p.rent != null ? money(p.rent) : "Add a bank statement"],
      ["Monthly debts", p.debtParts ? `${money(p.debts)}: auto ${money(p.debtParts.auto)}, card ${money(p.debtParts.card)}, pay-later ${money(p.debtParts.payLater)}` : "Add a bank statement"],
      ["Checking / savings", p.checking != null ? `${money(p.checking)} / ${money(p.savings)}` : "Add a bank statement"],
      ["Large or cash deposits", p.cashDeposits.length ? p.cashDeposits.map((c) => `${money(c.amount)} on ${c.day}, source unknown`).join("; ") : "None found"],
      ["Overdraft or NSF events", String(p.nsf)],
      ["Under 2 years in the job", p.shortHistory.length ? p.shortHistory.join(", ") : "None found"],
    ];
    if (p.housingRatio) {
      rows.push(["Housing cost / gross income", `${Math.round(p.housingRatio[0] * 100)}% to ${Math.round(p.housingRatio[1] * 100)}%`]);
      rows.push(["All debts / gross income", `${Math.round(p.totalRatio[0] * 100)}% to ${Math.round(p.totalRatio[1] * 100)}%`]);
      if (p.cashGap != null) rows.push(["Cash to close vs savings", p.cashGap > 0 ? `${money(p.cashGap)} short` : "Covered"]);
    }
    rows.push(["Still missing", p.missing.join("; ")]);
    profileBox.replaceChildren(el("h3", { text: "Family profile, filled from the documents" }),
      el("table", { class: "tbl" }, el("tbody", {}, rows.map(([k, v]) => el("tr", {}, el("th", { text: k }), el("td", { text: v }))))),
      el("p", { class: "note", text: "Ratios are shown for staff to judge; the tool does not apply a lender cutoff." }),
      el("button", { type: "button", class: "chip", onclick: () => set(() => {
        if (p.incomeLow) R.income = Math.round((p.incomeLow * 12) / 100) * 100;
        if (p.debtParts) R.debts = Math.round(p.debts);
        if (p.rent != null) R.rent = Math.round(p.rent);
        if (p.savings != null) R.savings = Math.round(p.savings);
        location.hash = "#ready";
      }) }, "Use these numbers in the Ready check"));
  };
  const input = el("input", { id: "doc-files", type: "file", accept: "application/pdf,.pdf", multiple: true, onchange: async (e) => {
    const files = [...e.target.files].slice(0, 20);
    for (const file of files) {
      if (file.size > 5000000) { results.push({ name: file.name, type: "unknown", facts: ["File over 5 MB, skipped."], flags: [] }); continue; }
      try {
        const lines = await pdfText(await file.arrayBuffer());
        results.push({ name: file.name, ...analyze(lines) });
      } catch {
        results.push({ name: file.name, type: "unknown", facts: ["Could not read this PDF. Scanned or photographed pages need text recognition, which this demo does not do."], flags: [] });
      }
    }
    e.target.value = "";
    paint2();
  } });
  return section("docs", "1. Ready: check documents", "Verify a profile from the documents", "A counselor drops in the family's PDFs. The tool reads them on this device, fills the profile, and flags what a careful caseworker would: hidden debt, unexplained deposits, payments that leave things out.",
    el("div", { class: "drop" }, el("label", { for: "doc-files", class: "chip" }, "Choose PDF documents"), input,
      el("button", { type: "button", class: "ghost", onclick: () => { results.length = 0; paint2(); } }, "Clear")),
    el("p", { class: "note", text: "Nothing is uploaded. Use made-up demo documents only; never a real family's papers in a demo. Photos of documents need text recognition, which is a next step." }),
    status, list, profileBox);
}

// TOGETHER: the story of one home, from an empty lot to a front door.
const STORY = [
  ["lot", "An empty lot", "Land is the biggest cost. A city or church that offers one lot removes the largest line in the budget."],
  ["city-hall", "The city says yes", "Faster permits and deferred fees cut months of holding cost."],
  ["planning", "Neighbors plan together", "A community meeting shows the design, the price and who it is for."],
  ["future-homes", "Families get ready", "Families use Ready to learn the path, check programs and fix what a lender will ask."],
  ["framing", "Build Day", "Families earn sweat-equity hours beside volunteers."],
  ["truss", "The roof goes up", "Donated materials and skilled volunteers keep the cost down."],
  ["painting", "Everyone helps", "Students, retirees and company teams paint, plant and finish."],
  ["mentor", "Skills passed on", "A retired engineer teaches a teen to measure twice and cut once."],
  ["lunch", "The street eats together", "Lunch for the crew. Neighbors meet the family moving in."],
  ["home", "A front door", "Keys, at a price the family can carry for 30 years."],
];
function storyStrip() {
  return section("story", "Together: one home, start to finish", "From an empty lot to a front door", "Illustrations of how a community closes the gap together. Made-up scenes, not real people.",
    el("div", { class: "story" }, STORY.map(([img, title, text], i) => el("figure", { class: "frame" },
      el("img", { src: `img/${img}.jpg`, alt: title, width: 1200, height: 674, loading: i < 2 ? "eager" : "lazy" }),
      el("figcaption", {}, el("span", { class: "n", text: String(i + 1) }), el("b", { text: title }), el("span", { text: text }))))));
}

// GIVE: events that bring the county together.
const EVENTS = [
  { img: "community-day", title: "City Day", who: "Families, city staff, nonprofits, lenders", raises: "Awareness and ready families", how: "Ready on tablets: families check programs and documents with a counselor on the spot.", first: "Ask the city to host one Saturday at a park or library." },
  { img: "framing", title: "Orange County Community Build Day", who: "Volunteers, companies, families earning sweat equity", raises: "Time and skills", how: "The Build Day planner sizes the crew; the pledge planner records hours.", first: "Partner with Habitat OC on one site, one Saturday a month." },
  { img: "gala", title: "Leaders and Donors Gala", who: "Business owners, retired leaders, philanthropists, council members", raises: "Money and big commitments", how: "Give, live on screen: each pledge shows the share of one home's gap it closes.", first: "Pick one real project and show its gap on the night." },
  { img: "lunch", title: "Neighborhood Lunch and Learn", who: "Renters, first-time buyers, neighbors", raises: "Education", how: "The six Ready lessons and the mortgage atlas, taught in plain language.", first: "Book a library room, invite a HUD-approved counselor." },
  { img: "mentor", title: "Pro Bono Day", who: "Attorneys, engineers, lenders, accountants", raises: "Skills families would otherwise pay for", how: "Volunteers review documents and plans; the document check prepares the files first.", first: "Ask one professional association to send five volunteers." },
  { img: "council", title: "Council Housing Night", who: "Council members, planners, residents", raises: "Land, fee and permit decisions", how: "Together shows what land, fees and delay do to the gap, in dollars.", first: "Request ten minutes on a council agenda with one home's numbers." },
];
function eventsSection() {
  return section("events", "3. Give: bring the county together", "Events that turn neighbors into builders and backers", "Six ways to get people aware, working and contributing. Each one has a job, an audience and a first step.",
    el("div", { class: "events" }, EVENTS.map((ev) => el("article", { class: "event" },
      el("img", { src: `img/${ev.img}.jpg`, alt: ev.title, width: 1200, height: 674, loading: "lazy" }),
      el("div", { class: "event-body" },
        el("h3", { text: ev.title }),
        el("dl", {}, el("dt", { text: "Who" }), el("dd", { text: ev.who }), el("dt", { text: "Brings" }), el("dd", { text: ev.raises }), el("dt", { text: "Tool" }), el("dd", { text: ev.how })),
        el("p", { class: "first" }, el("b", { text: "First step: " }), ev.first))))),
    el("p", { class: "note", text: "Illustrations, not real events. Dates, venues and partners are for each city and nonprofit to set." }));
}


// GIVE: a donation flow that works up to the payment step, then says plainly it is a demo.
// It never asks for a name, email or card, so nothing personal or financial is collected.
const CAUSES = [
  ["home", "Close one home’s gap", "Goes to the gap on one affordable home in the Together tab."],
  ["pool", "Down payment loan pool", "Deferred loans that families repay when they sell, so the money helps again."],
  ["build", "Build Day materials", "Lumber, paint and tools for a community Build Day."],
  ["classes", "Homebuyer classes", "Free classes in English, Spanish and Vietnamese."],
];
function donateSection() {
  const D = S.donate;
  const preview = el("div", { class: "impact" });
  const summary = el("p", { class: "answer small", role: "status" });
  const dlg = el("dialog", { class: "demo-dialog", "aria-labelledby": "demo-title" },
    el("p", { class: "eyebrow", text: "Demo" }),
    el("h2", { id: "demo-title", text: "Giving is in the works" }),
    el("p", { text: "This is a demo of how giving will work. No payment is taken, and no card or personal details are asked for or stored." }),
    el("p", { id: "demo-summary" }),
    el("p", { text: "To give today, give directly to a nonprofit you trust, such as Habitat for Humanity of Orange County." }),
    el("div", { class: "dlg-actions" },
      el("a", { class: "chip", href: "https://habitatoc.org/", target: "_blank", rel: "noopener noreferrer" }, "Visit Habitat OC"),
      el("button", { type: "button", class: "ghost", onclick: () => dlg.close() }, "Back to the demo")));
  const amountBtns = [50, 250, 1000, 5000, 25000].map((v) => el("button", { type: "button", class: "amt", "data-v": v, onclick: () => set(() => { D.amount = v; D.custom = ""; }) }, money(v)));
  const customId = "donate-custom";
  const custom = el("input", { id: customId, type: "number", min: 1, max: 10000000, step: 1, inputmode: "numeric", placeholder: "Other", value: D.custom,
    onchange: (e) => set(() => { const v = clampNum(e.target.value, 1, 10000000, 0); D.custom = v ? String(v) : ""; if (v) D.amount = v; e.target.value = D.custom; }) });
  const freq = el("div", { class: "seg2", role: "group", "aria-label": "How often" },
    ...[["once", "One time"], ["monthly", "Monthly"]].map(([k, l]) => el("button", { type: "button", "data-k": k, onclick: () => set(() => { D.freq = k; }) }, l)));
  const causeList = el("div", { class: "causes", role: "radiogroup", "aria-label": "Where it goes" },
    ...CAUSES.map(([k, title, text]) => el("label", { class: "cause" }, el("input", { type: "radio", name: "cause", value: k, checked: D.cause === k, onchange: () => set(() => { D.cause = k; }) }), el("span", {}, el("b", { text: title }), el("small", { text })))));
  const match = el("label", { class: "tick" }, el("input", { type: "checkbox", checked: D.match, onchange: (e) => set(() => { D.match = e.target.checked; }) }), "My employer matches gifts (doubles it, if they do)");
  subs.push((r) => {
    amountBtns.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.v) === D.amount && !D.custom)));
    [...freq.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.k === D.freq)));
    const yearly = D.amount * (D.freq === "monthly" ? 12 : 1) * (D.match ? 2 : 1);
    const gap = Math.max(0, r.gapIfAll);
    const cause = CAUSES.find(([k]) => k === D.cause);
    const lines = [];
    if (D.cause === "home") lines.push(gap > 0 ? `${pct(Math.min(1, yearly / gap))} of one home’s ${money(gap)} gap` : "The example home's gap is already closed; it would go to the next home");
    if (D.cause === "pool") lines.push(`${Math.floor(yearly / 50000)} family loan${Math.floor(yearly / 50000) === 1 ? "" : "s"} of $50,000, like My Anaheim Home (repaid and lent again)`);
    if (D.cause === "build") lines.push(`Materials for about ${Math.max(0, Math.floor(yearly / 2500))} Build Day${Math.floor(yearly / 2500) === 1 ? "" : "s"} at $2,500 each (ASSUMPTION)`);
    if (D.cause === "classes") lines.push(`About ${Math.max(0, Math.floor(yearly / 1500))} class${Math.floor(yearly / 1500) === 1 ? "" : "es"} for 20 families at $1,500 each (ASSUMPTION)`);
    preview.replaceChildren(el("p", { class: "lab", text: "Your gift in a year" }), el("strong", { class: "big", text: money(yearly) }),
      el("p", { class: "sub", text: `${money(D.amount)} ${D.freq === "monthly" ? "a month" : "once"}${D.match ? ", doubled by an employer match" : ""}` }),
      el("ul", { class: "plain" }, lines.map((t) => el("li", { text: t }))));
    summary.textContent = `${money(D.amount)} ${D.freq === "monthly" ? "a month" : "one time"} to ${cause[1].toLowerCase()}.`;
    document.getElementById("demo-summary") && (document.getElementById("demo-summary").textContent = `You chose ${summary.textContent}`);
  });
  return section("donate", "3. Give: donate", "Give in under a minute", "Choose where it goes and how much. You see what it does before you give.",
    el("div", { class: "grid" },
      el("div", {},
        el("h3", { text: "Where it goes" }), causeList,
        el("h3", { text: "Amount" }), el("div", { class: "amounts" }, amountBtns, el("label", { class: "sr", for: customId, text: "Other amount" }), el("span", { class: "num solo" }, el("span", { text: "$" }), custom)),
        el("h3", { text: "How often" }), freq, match),
      el("div", { class: "donate-side" }, preview, summary,
        el("button", { type: "button", class: "cta", onclick: () => { document.getElementById("demo-summary").textContent = `You chose ${summary.textContent}`; dlg.showModal(); } }, "Continue to secure payment"),
        el("p", { class: "note", text: "Demo: no payment is taken. Gifts to a 501(c)(3) are generally deductible for donors who itemize; ask a tax advisor." }))),
    dlg);
}

function intro() {
  const letters = [
    ["OC", "Orange County", "Where the people who work here can live here."],
    ["M", "Mortgage", "A way in for working families. Ready."],
    ["E", "Education", "Classes, counseling and sweat equity. Ready and Together."],
    ["E", "Equity", "Homes that build wealth and stay affordable. Together."],
    ["D", "Design", "The plan that puts it together, with every number sourced. Give."],
  ];
  return el("section", { class: "intro" },
    el("p", { class: "eyebrow", text: "OCMEE Design presents" }),
    el("h1", {}, "The Affordable Home ", el("em", { text: "Initiative" })),
    el("p", { class: "motto" }, "Every working family a way in. ", el("em", { text: "Every neighbor a way to help." })),
    el("p", { class: "lead", text: "Ready teaches a family the path, checks which programs fit and shows how to look stronger to a lender. Together gives a city or nonprofit the cost of one home, who closes the gap and programs it can start. Give lets the pillars of the community help with time, skills, resources and money. Same sources, one story." }),
    el("div", { class: "acronym" },
      el("p", { class: "acronym-title" }, "What ", el("b", { text: "OCMEED" }), " stands for"),
      el("ol", { class: "letters" }, letters.map(([l, w, d]) => el("li", {}, el("span", { class: "l", text: l }), el("span", { class: "w", text: w }), el("span", { class: "d", text: d })))),
      el("p", { class: "byline" }, "Orange County Mortgage, Education and Equity, ", el("em", { text: "by Design." }), " Affordable homes do not happen by accident.")));
}
const panel = (id, ...kids) => el("div", { id: `panel-${id}`, role: "tabpanel", "aria-labelledby": `tab-${id}`, hidden: id !== "ready" }, ...kids);
document.getElementById("main").append(intro(),
  panel("ready", learnSection(), readySection(), docsSection(), borrowerSection(), atlasSection()),
  panel("together", storyStrip(), hero(), homeSection(), leversSection(), ideasSection(), familySection(), stackSection(), rateSection()),
  panel("give", donateSection(), eventsSection(), giveSection(), pillarsSection()),
  sourcesSection());
showTab = tabs([["ready", "1. Ready"], ["together", "2. Together"], ["give", "3. Give"]]);
paint();
