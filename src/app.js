// Page code. All text goes in through textContent, so nothing typed can become markup.
import { SOURCES, ASSUME, DEAL, BUYER_AID, PROJECT_FUNDS, TIERS, RATE, CITIES, CHECKED, LESSONS, LENDER, IDEAS, GIVE_WAYS, MORTGAGES } from "./data.js";
import { closeTheGap, rateCurve, giftView, tableFor, readyCheck, applyLevers, buildDays, lenderReady, pledgeView, mortgageFit, sharedEquity, setAside, aduSpeed, projectGap } from "./gap.js";
import { pdfText } from "./pdftext.js";
import { docxText } from "./docx.js";
import { LANGS, I18N } from "./lang.js";
let lang = "en";
try { const saved = localStorage.getItem("lang"); if (I18N[saved]) lang = saved; } catch { /* storage blocked */ }
const L = () => I18N[lang];
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
  equity: { price: 700000, equityPct: 20, downPct: 5, years: 10, growthPct: 3 },
  aside: { homes: 200, setAsidePct: 10, discountPct: 30, marketPrice: 1000000 },
  adu: { requests: 300, currentDays: 120, targetDays: 30, rent: 2700 },
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
  // A dial under every number box. Wide ranges use a curve so everyday values get most of the travel.
  const steps = (max - min) / step;
  const curved = steps > 200;
  const N = curved ? 1000 : Math.round(steps);
  const toPos = (v) => { const f = Math.min(1, Math.max(0, (v - min) / (max - min))); return Math.round((curved ? Math.sqrt(f) : f) * N); };
  const fromPos = (p) => { const f = p / N; const v = min + (curved ? f * f : f) * (max - min); return Math.min(max, Math.max(min, Math.round(v / step) * step)); };
  const show = (v) => `${prefix}${Number(v).toLocaleString("en-US")}${suffix ? ` ${suffix}` : ""}`;
  const dial = el("input", { type: "range", class: "dial", min: 0, max: N, step: 1, value: toPos(get()), "aria-label": `${label}, dial`,
    oninput: (e) => set(() => { put(fromPos(Number(e.target.value))); input.value = get(); }) });
  subs.push(() => {
    if (document.activeElement !== input) input.value = get();
    if (document.activeElement !== dial) dial.value = toPos(get());
    dial.setAttribute("aria-valuetext", show(get()));
  });
  return el("div", { class: "field" }, el("label", { for: id }, label, status ? tag(status) : null),
    el("div", { class: "num" }, prefix ? el("span", { text: prefix }) : null, input, suffix ? el("span", { text: suffix }) : null), dial, note ? el("p", { class: "note", text: note }) : null);
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

// READY: a floating atlas of every program and loan type, centered on the family.
// Orange dots may fit, outlined dots need a check, gray dots do not fit these answers.
const SHORT = { myhome: "CalHFA MyHome", santaAna: "Santa Ana", gardenGrove: "Garden Grove", anaheim: "Anaheim", map: "County MAP", dream: "Dream For All",
  conv: "Conventional", hb: "High-balance", homeready: "HomeReady", jumbo: "Jumbo", fha: "FHA", va: "VA", usda: "USDA", calhfa: "CalHFA loan", gsfa: "GSFA", nonqm: "Non-QM", arm: "ARM", buydown: "Rate buydown" };
const NS = "http://www.w3.org/2000/svg";
const sv = (tag, attrs = {}, ...kids) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); for (const k of kids) if (k) n.append(k); return n; };
function programAtlas() {
  const W = 960, H = 520;
  const svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "pa-svg", role: "group", "aria-label": "Atlas of programs and loan types for this family" });
  const cap = el("p", { class: "pa-cap", role: "status", "aria-live": "polite" });
  const count = el("p", { class: "pa-count" });
  let nodes = [], links = [], raf = 0, visible = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const tell = (n) => { cap.replaceChildren(el("b", { text: n.name }), ` · ${n.verdictText}. `, n.reason || ""); };
  const build = () => {
    const R = S.ready, A = S.atlas;
    const ready = readyCheck({ ...R, ratePct: S.rate, assume: S.assume });
    const price = ready.helped.price;
    const loan = price * (1 - A.downPct / 100);
    const fam = { credit: R.credit, residency: R.residency, downPct: A.downPct, loan, veteran: A.veteran, selfEmployed: A.selfEmployed, firstTime: R.firstTime, income: R.income };
    const aidV = { yes: "fit", check: "check", no: "no", closed: "closed" };
    const aid = ready.programs.map((p) => ({ id: p.program.key, name: p.program.name, label: SHORT[p.program.key] || p.program.name, v: aidV[p.verdict], reason: p.reasons.map((x) => x.text).join(" ") }));
    const loans = MORTGAGES.map((m) => { const f = mortgageFit(m, fam); return { id: m.id, name: m.name, label: SHORT[m.id] || m.name, v: f.verdict, reason: f.reasons.map((x) => x.text).join(" ") }; });
    const h = ready.habitat;
    const hab = { id: "habitat", name: "Habitat for Humanity of Orange County", label: "Habitat OC", v: h.incomeOk && h.residencyOk ? (h.debtOk ? "fit" : "check") : "no",
      reason: h.incomeOk ? `Income fits the range for ${ready.size} people. ${h.debtOk ? "" : "Debts look high; confirm at orientation."}` : `Habitat's range for ${ready.size} people is ${money(h.min)} to ${money(h.max)}.` };
    const VT = { fit: "May fit", check: "Check first", no: "Not for these answers", closed: "Closed now" };
    const center = { x: W / 2, y: H / 2 + 10, r: 48, kind: "family", name: "This family", verdictText: `${R.size} people, ${money(R.income)} a year`, reason: `Price on income ${money(ready.alone)}, with help ${money(ready.helped.price)}.` };
    const hubs = [
      { x: 200, y: 210, r: 20, kind: "hub", label: "Down payment help", items: aid },
      { x: 775, y: 225, r: 20, kind: "hub", label: "Loan types", items: loans },
      { x: 480, y: 455, r: 20, kind: "hub", label: "Nonprofit path", items: [hab] },
    ];
    nodes = [center];
    links = [];
    for (const hb of hubs) {
      hb.name = hb.label; hb.verdictText = `${hb.items.filter((i) => i.v === "fit").length} may fit`; hb.reason = "";
      nodes.push(hb);
      links.push({ a: center, b: hb, on: hb.items.some((i) => i.v === "fit") });
      const ring = hb.items.length > 6 ? 150 : hb.items.length > 1 ? 115 : 0;
      hb.items.forEach((it, k) => {
        const ang = hb.items.length === 1 ? Math.PI / 2 : (k / hb.items.length) * Math.PI * 2 - Math.PI / 2 + (hb.x > W / 2 ? 0.2 : -0.2);
        const n = { ...it, kind: "prog", x: hb.items.length === 1 ? hb.x + 120 : hb.x + Math.cos(ang) * ring, y: hb.items.length === 1 ? hb.y : hb.y + Math.sin(ang) * ring * 0.85,
          r: it.v === "fit" ? 16 : it.v === "check" ? 13 : 9, verdictText: VT[it.v], ang: hb.items.length === 1 ? 0 : ang };
        n.x = Math.max(60, Math.min(W - 60, n.x)); n.y = Math.max(24, Math.min(H - 30, n.y));
        nodes.push(n);
        links.push({ a: hb, b: n, on: it.v === "fit", ask: it.v === "check" });
      });
    }
    nodes.forEach((n, i) => { n.ph = i * 1.7; n.amp = n.kind === "family" ? 3 : n.kind === "hub" ? 5 : 9; n.sp = 0.0006 + (i % 5) * 0.00012; n.dx = 0; n.dy = 0; });
    const lineLayer = sv("g", { class: "pa-links" });
    for (const l of links) { l.el = sv("line", { class: `pa-link${l.on ? " on" : l.ask ? " ask" : ""}` }); lineLayer.append(l.el); }
    const nodeLayer = sv("g");
    for (const n of nodes) {
      const g = sv("g", { class: `pa-node k-${n.kind}${n.v ? ` v-${n.v}` : ""}`, tabindex: "0", role: "button", "aria-label": `${n.name}: ${n.verdictText}` });
      if (n.kind === "family") {
        g.append(sv("circle", { r: n.r + 10, class: "pa-glow" }), sv("circle", { r: n.r }));
        const t1 = sv("text", { y: -3, class: "pa-in" }); t1.textContent = `${R.size} people`;
        const t2 = sv("text", { y: 18, class: "pa-in small" }); t2.textContent = `${money(R.income / 1000)}K`;
        g.append(t1, t2);
      } else {
        g.append(sv("circle", { r: n.r }));
        if (n.kind !== "family") {
          const cx = n.kind === "hub" ? 0 : Math.cos(n.ang), sy = n.kind === "hub" ? 1 : Math.sin(n.ang);
          const side = cx > 0.35 ? "start" : cx < -0.35 ? "end" : "middle";
          const lx = side === "middle" ? 0 : cx * (n.r + 8), ly = side === "middle" ? (sy < 0 ? -n.r - 8 : n.r + 18) : sy * (n.r + 8) + 5;
          const t = sv("text", { x: lx.toFixed(1), y: ly.toFixed(1), "text-anchor": side, class: `pa-label${n.kind === "hub" ? " hub" : n.v === "no" || n.v === "closed" ? " dim" : ""}` });
          t.textContent = n.label;
          g.append(t);
        }
      }
      const title = sv("title"); title.textContent = `${n.name}: ${n.verdictText}`; g.prepend(title);
      g.addEventListener("click", () => tell(n));
      g.addEventListener("focus", () => tell(n));
      g.addEventListener("mouseenter", () => tell(n));
      n.el = g;
      nodeLayer.append(g);
    }
    svg.replaceChildren(lineLayer, nodeLayer);
    place(0);
    const fits = nodes.filter((n) => n.v === "fit").length, checks = nodes.filter((n) => n.v === "check").length;
    count.textContent = `${fits} may fit, ${checks} to check, ${nodes.filter((n) => n.kind === "prog").length - fits - checks} not for now.`;
    tell(center);
  };
  const place = (t) => {
    for (const n of nodes) {
      n.dx = reduce.matches ? 0 : Math.sin(t * n.sp + n.ph) * n.amp;
      n.dy = reduce.matches ? 0 : Math.cos(t * n.sp * 1.3 + n.ph) * n.amp;
      n.el.setAttribute("transform", `translate(${(n.x + n.dx).toFixed(1)} ${(n.y + n.dy).toFixed(1)})`);
    }
    for (const l of links) {
      l.el.setAttribute("x1", (l.a.x + l.a.dx).toFixed(1)); l.el.setAttribute("y1", (l.a.y + l.a.dy).toFixed(1));
      l.el.setAttribute("x2", (l.b.x + l.b.dx).toFixed(1)); l.el.setAttribute("y2", (l.b.y + l.b.dy).toFixed(1));
    }
  };
  const loop = (t) => { if (visible && !reduce.matches) place(t); raf = requestAnimationFrame(loop); };
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); }).observe(svg);
  subs.push(build);
  raf = requestAnimationFrame(loop);
  return el("div", { class: "pa" },
    el("div", { class: "pa-head" }, el("span", { class: "lab", text: "Program atlas for this family" }), count),
    svg,
    el("p", { class: "pa-legend" }, el("span", { class: "dot fit" }), "May fit ", el("span", { class: "dot check" }), "Check first ", el("span", { class: "dot no" }), "Not for now"),
    cap);
}

function readySection() {
  const R = S.ready;
  const group = big("Income group");
  const alone = big("Price you could pay on income");
  const helped = big("With help that may fit");
  const list = el("div", { class: "aid" });
  const lift = el("div", { class: "lift", role: "img" });
  const liftKey = el("ul", { class: "lift-key" });
  const liftSay = el("p", { class: "lift-say" });
  const liftBig = el("strong", { class: "lift-big" });
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
    // The orange part: how much more home the help buys, split by program in proportion to each award.
    const up = Math.max(0, r.helped.price - r.alone);
    const total = Math.max(1, r.helped.price);
    const parts = r.helped.lines.filter((l) => l.amount > 0);
    const sum = parts.reduce((s, l) => s + l.amount, 0) || 1;
    lift.replaceChildren(
      el("span", { class: "lift-base", title: `On income: ${money(r.alone)}` }, el("b", { text: money(r.alone) })),
      ...parts.map((l, k) => el("span", { class: `lift-help h${k % 3}`, title: `${l.program.name}: +${money((up * l.amount) / sum)}` })));
    const shares = parts.map((l) => Math.max(6, ((up * l.amount) / sum / total) * 100));
    const helpPct = shares.reduce((s, x) => s + x, 0);
    lift.firstChild.style.width = `${100 - helpPct}%`;
    parts.forEach((l, k) => { lift.children[k + 1].style.width = `${shares[k]}%`; });
    liftBig.textContent = up > 0 ? `+${money(up)}` : "$0";
    lift.setAttribute("aria-label", `On income ${money(r.alone)}, plus ${money(up)} from help, total ${money(r.helped.price)}`);
    liftKey.replaceChildren(
      el("li", {}, el("span", { class: "sw base" }), `On income ${money(r.alone)}`),
      ...parts.map((l, k) => el("li", {}, el("span", { class: `sw h${k % 3}` }), `+${money((up * l.amount) / sum)} ${l.program.name}`)));
    liftSay.replaceChildren(up > 0 ? el("b", { text: `Help adds ${money(up)} to the home they can buy (+${Math.round((up / Math.max(1, r.alone)) * 100)}%).` }) : el("b", { text: "No help fits these answers yet." }),
      up > 0 ? " The lift is not dollar for dollar: help also changes the loan size and mortgage insurance." : " Try another city or check the first-time box.");
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
      el("div", {}, group.node, alone.node, helped.node, el("div", { class: "lift-box" }, el("span", { class: "lab", text: "What the help adds" }), liftBig, lift, liftKey, liftSay))),
    programAtlas(),
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
  const chapter = (id) => CHAPTERS.find((c) => c.id === id);
  const buttons = panels.map(([id], i) => {
    const c = chapter(id) || { line: "The pitch deck and the 90-second demo" };
    return el("button", { type: "button", role: "tab", id: `tab-${id}`, class: chapter(id) ? "" : "tab-plain", "aria-controls": `panel-${id}`, "aria-selected": i === 0 ? "true" : "false", title: c.line, onclick: () => show(id) },
      el("span", { class: "tab-txt" }, el("span", { class: "tab-n" }), el("span", { class: "tab-w" })));
  });
  nav.setAttribute("role", "tablist");
  nav.replaceChildren(...buttons);
  const label = () => panels.forEach(([id], i) => {
    const c = chapter(id), b = buttons[i];
    if (!c) { b.querySelector(".tab-w").textContent = { en: "Demo", es: "Demo", vi: "Demo", zh: "\u6f14\u793a" }[lang] || "Demo"; return; }
    const [pre, word] = L().steps[i];
    b.querySelector(".tab-n").textContent = `${c.n} \u00b7 ${L().who[i]}`;
    b.querySelector(".tab-w").replaceChildren(pre, el("em", { text: word }));
  });
  label();
  document.addEventListener("langchange", label);
  const progress = el("div", { class: "tab-progress", "aria-hidden": "true" }, el("span"));
  nav.closest("header").append(progress);
  let current = 0;
  const show = (id) => {
    const i = panels.findIndex(([pid]) => pid === id);
    const dir = i > current ? "fwd" : i < current ? "back" : "";
    current = i;
    for (const [pid] of panels) {
      document.getElementById(`panel-${pid}`).hidden = pid !== id;
      document.getElementById(`tab-${pid}`).setAttribute("aria-selected", pid === id ? "true" : "false");
    }
    progress.firstChild.style.width = `${((i + 1) / panels.length) * 100}%`;
    for (const s of document.querySelectorAll(".slip")) s.setAttribute("aria-current", s.dataset.id === id ? "step" : "false");
    const p = document.getElementById(`panel-${id}`);
    if (dir) {
      p.classList.remove("in-fwd", "in-back");
      void p.offsetWidth;
      p.classList.add(`in-${dir}`);
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (p.getBoundingClientRect().top < 0 || p.getBoundingClientRect().top > innerHeight * 0.6) p.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  progress.firstChild.style.width = `${100 / panels.length}%`;
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
  const status = el("p", { class: "answer small", role: "status", text: "Add pay stubs, a bank statement, a Loan Estimate or notices: PDF, Word (.docx) or a photo." });
  const LEVEL = { fix: "Fix or explain", watch: "Watch" };
  const paint2 = () => {
    list.replaceChildren(...results.map((r) => el("article", { class: "doc" },
      el("div", { class: "row" }, el("b", { text: r.name }), el("span", { class: "lever", text: r.kindLabel || TYPE_LABEL[r.type] || "Not recognized" })),
      r.thumb ? el("img", { class: "doc-thumb", src: r.thumb, alt: `Photo: ${r.name}`, width: "320", height: "200" }) : null,
      el("ul", { class: "plain" }, r.facts.map((f) => el("li", { text: f }))),
      r.flags.length ? el("ul", { class: "reasons" }, r.flags.map((f) => el("li", { class: f.level === "fix" ? "miss" : "ask" }, el("b", { text: `${LEVEL[f.level]}: ` }), f.text))) : el("p", { class: "note", text: "Nothing flagged in this document." }))));
    const fixes = results.reduce((s, r) => s + r.flags.filter((f) => f.level === "fix").length, 0);
    status.textContent = results.length ? `${results.length} document${results.length > 1 ? "s" : ""} read on this device. ${fixes} item${fixes === 1 ? "" : "s"} to fix or explain before applying.` : "Add pay stubs, a bank statement, a Loan Estimate or notices: PDF, Word (.docx) or a photo.";
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
  const asDataUrl = (file) => new Promise((ok, bad) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = bad; fr.readAsDataURL(file); });
  // Photos: use the browser's own text detector where it exists (on device). Otherwise keep the photo for staff to read.
  const photoText = async (file) => {
    if (!("TextDetector" in window)) return null;
    try {
      const bmp = await createImageBitmap(file);
      const found = await new window.TextDetector().detect(bmp);
      const items = found.map((f) => ({ y: f.boundingBox.y, x: f.boundingBox.x, t: f.rawValue }));
      items.sort((p, q) => p.y - q.y || p.x - q.x);
      const rows = [];
      for (const it of items) { const last = rows[rows.length - 1]; if (last && Math.abs(last.y - it.y) < 8) last.t += ` ${it.t}`; else rows.push({ ...it }); }
      return rows.map((r) => r.t);
    } catch { return null; }
  };
  const input = el("input", { id: "doc-files", type: "file", accept: "application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*", multiple: true, onchange: async (e) => {
    const files = [...e.target.files].slice(0, 20);
    for (const file of files) {
      if (results.some((r) => r.name === file.name && r.size === file.size)) continue;
      const base = { name: file.name, size: file.size };
      if (file.size > 8000000) { results.push({ ...base, type: "unknown", facts: ["File over 8 MB, skipped."], flags: [] }); continue; }
      const ext = file.name.toLowerCase().split(".").pop();
      try {
        if (ext === "pdf" || file.type === "application/pdf") {
          results.push({ ...base, ...analyze(await pdfText(await file.arrayBuffer())) });
        } else if (ext === "docx") {
          results.push({ ...base, ...analyze(await docxText(await file.arrayBuffer())) });
        } else if (ext === "doc") {
          results.push({ ...base, type: "unknown", facts: ["Old Word format (.doc). Save it as .docx or PDF and add it again."], flags: [] });
        } else if (file.type.startsWith("image/")) {
          const thumb = await asDataUrl(file);
          const lines = await photoText(file);
          if (lines && lines.length) {
            const r = analyze(lines);
            results.push({ ...base, ...r, thumb, facts: [...r.facts, "Read from a photo by the browser's text detector. Check the numbers against the paper."] });
          } else {
            results.push({ ...base, type: "unknown", kindLabel: "Photo", thumb, facts: ["Photo kept on this device for staff to read. This browser cannot read text from photos, so nothing was filled in.", "Best: ask the family for the PDF from the employer or bank portal."], flags: [{ level: "watch", text: "A photo is not enough proof on its own; lenders ask for the original document." }] });
          }
        } else {
          results.push({ ...base, type: "unknown", facts: ["This file type is not supported. Use PDF, Word (.docx) or a photo."], flags: [] });
        }
      } catch {
        results.push({ ...base, type: "unknown", facts: ["Could not read this file. Scanned pages inside a PDF are pictures, not text; add them as photos."], flags: [] });
      }
    }
    e.target.value = "";
    paint2();
  } });
  return section("docs", "1. Ready: check documents", "Verify a profile from the documents", "A counselor drops in the family's PDFs. The tool reads them on this device, fills the profile, and flags what a careful caseworker would: hidden debt, unexplained deposits, payments that leave things out.",
    el("div", { class: "drop" }, el("label", { for: "doc-files", class: "chip" }, "Choose documents: PDF, Word or photos"), input,
      el("button", { type: "button", class: "ghost", onclick: () => { results.length = 0; paint2(); } }, "Clear")),
    el("p", { class: "note", text: "Nothing is uploaded: files are read in this browser and never leave the device. Use made-up demo documents only; never a real family's papers in a demo. The same file added twice is counted once." }),
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
  const strip = el("div", { class: "story", tabindex: "0", "aria-label": `Story, ${STORY.length} scenes` }, STORY.map(([img, title, text], i) => el("figure", { class: "frame" },
    el("img", { src: `img/${img}.jpg`, alt: title, width: 1200, height: 674, loading: i < 2 ? "eager" : "lazy" }),
    el("figcaption", {}, el("span", { class: "n", text: String(i + 1) }), el("b", { text: title }), el("span", { text: text })))));
  // Rotate one scene at a time so it is clear there are more than four. Pauses on hover, focus or touch; a button stops it.
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let playing = !reduce, hold = false, visible = false;
  const count = el("span", { class: "story-count", "aria-live": "off" });
  const dots = el("div", { class: "story-dots" }, STORY.map((x, i) => el("button", { type: "button", "aria-label": `Scene ${i + 1}: ${x[1]}`, onclick: () => go(i) })));
  const playBtn = el("button", { type: "button", class: "ghost story-play" });
  const card = () => (strip.firstChild ? strip.firstChild.getBoundingClientRect().width + 16 : 300);
  const first = () => Math.round(strip.scrollLeft / card());
  const perView = () => Math.max(1, Math.round(strip.clientWidth / card()));
  const update = () => {
    const i = first(), n = perView();
    count.textContent = `${i + 1} to ${Math.min(STORY.length, i + n)} of ${STORY.length}`;
    [...dots.children].forEach((d, k) => d.setAttribute("aria-current", k >= i && k < i + n ? "true" : "false"));
    playBtn.textContent = playing ? "Pause" : "Play";
    playBtn.setAttribute("aria-pressed", playing ? "false" : "true");
  };
  const go = (i) => {
    const last = STORY.length - perView();
    const target = i > last ? 0 : i < 0 ? last : i;
    strip.scrollTo({ left: target * card(), behavior: reduce ? "auto" : "smooth" });
  };
  playBtn.addEventListener("click", () => { playing = !playing; update(); });
  for (const [ev, v] of [["mouseenter", true], ["mouseleave", false], ["focusin", true], ["focusout", false], ["pointerdown", true]]) strip.addEventListener(ev, () => { hold = v; });
  strip.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es.some((x) => x.isIntersecting); }).observe(strip);
  setInterval(() => { if (playing && !hold && visible && !document.hidden) go(first() + 1); }, 3500);
  requestAnimationFrame(update);
  return section("story", "Together: one home, start to finish", "From an empty lot to a front door", "Illustrations of how a community closes the gap together. Made-up scenes, not real people.",
    el("div", { class: "story-wrap" }, strip),
    el("div", { class: "story-bar" },
      el("button", { type: "button", class: "ghost story-arrow", "aria-label": "Previous scene", onclick: () => go(first() - 1) }, "\u2190"),
      dots,
      el("button", { type: "button", class: "ghost story-arrow", "aria-label": "Next scene", onclick: () => go(first() + 1) }, "\u2192"),
      count, playBtn));
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
// GIVE: donate a car. Habitat OC's vehicle page, read 7 Nov 2026, sends donors to its vehicle donation partner.
function carSection() {
  const link = (href, text) => el("a", { href, target: "_blank", rel: "noopener noreferrer", text });
  return section("car", "3. Donate: your car", "Donate a car. It helps build a home.", "Upgrading your car? The old one can become part of a local family's home.",
    el("div", { class: "car" },
      el("div", { class: "car-main" },
        el("ol", { class: "car-steps" },
          el("li", {}, el("b", { text: "Open Habitat OC's vehicle page. " }), "It sends you to Habitat's vehicle donation partner to arrange the donation."),
          el("li", {}, el("b", { text: "Have the title (pink slip) ready. " }), "Cars, trucks and other vehicles are accepted; the partner confirms what it takes."),
          el("li", {}, el("b", { text: "Tell the DMV within 5 days. " }), "File a Notice of Transfer and Release of Liability so tickets and tolls stop being yours."),
          el("li", {}, el("b", { text: "Keep Form 1098-C. " }), "If the car sells for more than $500, the tax deduction is usually the sale price, not the blue-book value. Not tax advice; ask your tax preparer.")),
        el("p", { class: "car-cta" }, el("a", { class: "chip", href: "https://habitatoc.org/support-us/donate-a-vehicle/", target: "_blank", rel: "noopener noreferrer", text: "Donate a vehicle at Habitat OC \u2192" })),
        el("p", { class: "note" }, "Sources: ", link("https://habitatoc.org/support-us/donate-a-vehicle/", "Habitat OC, Donate a Vehicle"), "; ", link("https://www.irs.gov/pub/irs-pdf/p4303.pdf", "IRS Publication 4303"), "; ", link("https://www.dmv.ca.gov/portal/vehicle-registration/titles/title-transfers-and-changes/", "California DMV, title transfers"), ". Checked 7 Nov 2026.")),
      el("aside", { class: "car-side" },
        el("h3", { text: "Families need cars too" }),
        el("p", { text: "A broken car can cost a job, and a job is what qualifies a family for a mortgage. Habitat sells donated vehicles to fund homes; it does not hand them to families." }),
        el("p", {}, tag("unknown"), " We do not know an Orange County program that gives donated cars to working families."),
        el("p", {}, tag("assumption"), " Idea for a city or nonprofit: a small car-repair fund for families in the Ready program, so one repair bill does not undo two years of saving."))));
}

// GIVE: pick volunteer roles. Nothing is sent: the page builds a message the volunteer copies and sends themselves.
const ROLES = [
  ["build", "Build crew", "Half or full day", "Framing, roofing, drywall and siding beside a site lead. No experience needed; the crew lead shows you how."],
  ["paint", "Paint and plant", "Half day", "Interior paint, fences and drought-tolerant yards. Good for families and teams; ask about age rules."],
  ["events", "Event crew", "2 to 4 hours", "Check-in, water and lunch at Build Days, groundbreakings and home dedications."],
  ["papers", "Paperwork and translation", "Flexible, can be remote", "Help families gather documents for the Ready check, or translate in Spanish, Vietnamese or Chinese. No legal advice."],
  ["coach", "Ready coach", "2 hours a month", "Walk one family through Ready: programs, lender tips and the document check, month by month."],
  ["trades", "Skilled trades", "By project", "Licensed electricians, plumbers, roofers and HVAC techs who can lead or inspect work."],
  ["store", "Resale store", "Half day", "Sort, price and move donated furniture, appliances and building materials at a ReStore."],
  ["pro", "Pro bono", "A few hours", "Attorneys, accountants, engineers and lenders: reviews and workshops families would otherwise pay for."],
];
function volunteerSection() {
  const V = { roles: new Set(["build"]), when: "Weekends", langs: new Set(["English"]) };
  const msg = el("textarea", { class: "vol-msg", rows: 7, readonly: true, "aria-label": "Your volunteer message" });
  const count = el("p", { class: "answer small", role: "status" });
  const copied = el("span", { class: "note", role: "status" });
  const draw = () => {
    const picked = ROLES.filter((r) => V.roles.has(r[0]));
    count.textContent = picked.length ? `${picked.length} role${picked.length > 1 ? "s" : ""} picked. Your message is ready to copy.` : "Pick at least one role.";
    msg.value = picked.length ? [
      "Hello Habitat for Humanity of Orange County,",
      "",
      `I would like to volunteer. Roles I am interested in: ${picked.map((r) => r[1]).join(", ")}.`,
      `I am usually free: ${V.when.toLowerCase()}.`,
      `Languages I speak: ${[...V.langs].join(", ") || "English"}.`,
      "",
      "Please let me know the next steps.",
      "[Your name and phone]",
    ].join("\n") : "";
  };
  const role = ([key, name, time, text]) => el("label", { class: "vol-role" },
    el("input", { type: "checkbox", checked: V.roles.has(key), onchange: (e) => { if (e.target.checked) V.roles.add(key); else V.roles.delete(key); draw(); } }),
    el("span", {}, el("b", { text: name }), el("span", { class: "vol-time", text: ` \u00b7 ${time}` }), el("span", { class: "vol-text", text: text })));
  const seg = el("div", { class: "seg2", role: "group", "aria-label": "When you are free" });
  const paintSeg = () => seg.replaceChildren(...["Weekdays", "Weekends", "Evenings", "Any time"].map((w) => el("button", { type: "button", "aria-pressed": V.when === w ? "true" : "false", onclick: () => { V.when = w; paintSeg(); draw(); } }, w)));
  paintSeg();
  const langs = el("div", { class: "vol-langs" }, ["English", "Spanish", "Vietnamese", "Chinese", "Korean", "Tagalog"].map((l) => el("label", { class: "tick" },
    el("input", { type: "checkbox", checked: V.langs.has(l), onchange: (e) => { if (e.target.checked) V.langs.add(l); else V.langs.delete(l); draw(); } }), l)));
  const copy = el("button", { type: "button", class: "chip", onclick: async () => {
    try { await navigator.clipboard.writeText(msg.value); copied.textContent = " Copied. Paste it into an email to Habitat OC."; } catch { msg.select(); copied.textContent = " Select the text and copy it."; }
  } }, "Copy my message");
  draw();
  return section("volunteer", "3. Donate: your time", "Volunteer: pick what you would like to do", "Examples of roles. Build days and shifts are set by the nonprofit; this page only helps you say what you can offer.",
    el("div", { class: "vol" },
      el("div", { class: "vol-roles" }, ROLES.map(role)),
      el("div", { class: "vol-side" },
        el("p", { class: "lab", text: "When are you free?" }), seg,
        el("p", { class: "lab", text: "Languages you speak" }), langs,
        count, msg,
        el("div", { class: "vol-actions" }, copy,
          el("a", { class: "ghost vol-link", href: "https://habitatoc.org/get-involved/individual-volunteers/", target: "_blank", rel: "noopener noreferrer", text: "Register at Habitat OC \u2192" })),
        copied,
        el("p", { class: "note", text: "Nothing is sent or saved by this page. Companies: Habitat OC also runs corporate volunteer days. Source: habitatoc.org volunteer pages, checked 7 Nov 2026." }))));
}

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


// TOGETHER: two proposals a city can bring to council, each with a calculator and its precedents.
function proposalsSection() {
  const E = S.equity, A = S.aside;
  const eStats = el("div", { class: "stats4" });
  const eSay = el("p", { class: "answer small", role: "status" });
  const aStats = el("div", { class: "stats4" });
  const aSay = el("p", { class: "answer small", role: "status" });
  const stat2 = (label, value, note, bad) => { const v = el("strong", { class: "big", text: value }); if (bad !== undefined) v.dataset.bad = bad ? "1" : "0"; return el("div", { class: "stat" }, el("span", { class: "lab", text: label }), v, el("span", { class: "sub", text: note })); };
  subs.push(() => {
    const r = sharedEquity({ ...E, ratePct: S.rate, taxPct: S.assume.taxPct, insPct: S.assume.insPct, pmiPct: S.assume.pmiPct });
    eStats.replaceChildren(
      stat2("Equity share put in", money(r.fundIn), `${E.equityPct}% of ${money(E.price)}`),
      stat2("Monthly cost with it", money(r.monthlyWith), `vs ${money(r.monthlyWithout)} without`, false),
      stat2("Income needed", money(r.incomeWith), `vs ${money(r.incomeWithout)} without, at 30% of income`),
      stat2(`Back to the fund in year ${E.years}`, money(r.ukReturn), `If the home grows ${E.growthPct}% a year (ASSUMPTION)`));
    eSay.textContent = `The family saves ${money(r.saving)} a month and needs ${money(r.incomeWithout - r.incomeWith)} less income to qualify. On sale, the fund gets ${E.equityPct}% of the value back and lends it again: $10 million helps about ${r.homesPerTenMillion} families at a time, then keeps going.`;
    const b = setAside({ ...A, ratePct: S.rate });
    aStats.replaceChildren(
      stat2("Discounted homes", String(b.count), `${A.setAsidePct}% of ${A.homes} new homes`),
      stat2("Price to the family", money(b.price), `${A.discountPct}% below ${money(A.marketPrice)}`),
      stat2("Monthly loan payment", money(b.monthlyDiscounted), `vs ${money(b.monthlyMarket)} at market`),
      stat2("Value kept for families", money(b.valueToFamilies), "Kept at every resale"));
    aSay.textContent = `Resale rule: ${b.resaleRule}. The discount stays with the home, not the first owner, so it helps a family every time it sells.`;
  });
  const n = (label, get, put, o) => numberField(label, get, put, o);
  return section("proposals", "Together: ideas to bring to council", "Two programs a city can propose", "Each one has worked somewhere. Each needs a city attorney to fit it to California law; we mark what is proven and what is an idea.",
    el("article", { class: "proposal" },
      el("h3", { text: "1. Help to Buy, Orange County style: someone else holds 20%" }),
      el("p", { text: "The family puts down 5%. A city, a nonprofit or a fund puts in 20% as a shared-equity loan: no monthly payment, repaid with the same share of the home's value when the family sells or refinances. The bank lends the other 75%, so there is no mortgage insurance." }),
      el("div", { class: "grid" },
        el("div", {},
          n("Home price", () => E.price, (v) => { E.price = v; }, { min: 100000, max: 3000000, step: 5000, prefix: "$" }),
          n("Equity share", () => E.equityPct, (v) => { E.equityPct = v; }, { min: 5, max: 40, step: 1, suffix: "%" }),
          n("Family down payment", () => E.downPct, (v) => { E.downPct = v; }, { min: 0, max: 30, step: 0.5, suffix: "%" }),
          n("Years until sale", () => E.years, (v) => { E.years = Math.round(v); }, { min: 1, max: 30, step: 1 }),
          n("Home value growth a year", () => E.growthPct, (v) => { E.growthPct = v; }, { min: -5, max: 10, step: 0.5, suffix: "%", status: "assumption" })),
        el("div", {}, eStats)),
      eSay,
      el("table", { class: "tbl" }, el("thead", {}, el("tr", {}, el("th", { text: "Who holds the 20%" }), el("th", { text: "Precedent" }), el("th", { text: "Status" }))),
        el("tbody", {},
          el("tr", {}, el("td", { text: "The city" }), el("td", {}, "San Francisco DALP: a 0% silent second; the city gets its loan back plus the same share of the gain. ", el("a", { href: "https://sfmohcd.org/dalp-details", target: "_blank", rel: "noopener noreferrer", text: "Source" })), el("td", {}, tag("verified"))),
          el("tr", {}, el("td", { text: "The state" }), el("td", {}, "CalHFA Dream For All: up to 20%, repaid with a share of the gain. ", src("dream")), el("td", {}, tag("verified"))),
          el("tr", {}, el("td", { text: "A nonprofit or land trust" }), el("td", { text: "Same loan structure, funded by gifts from the Give tab and recycled on each sale." }), el("td", {}, tag("assumption"))),
          el("tr", {}, el("td", { text: "An investor fund" }), el("td", { text: "Possible, but it touches securities and lending law, and investors need a return. Needs counsel before any offer." }), el("td", {}, tag("unknown"))))),
      el("p", { class: "note", text: "UK note: Help to Buy charged interest from year 6 (1.75%, then rising each year). Repayment there was the loan's share of market value; San Francisco repays the loan plus the share of gain. Both come to the same money when the home is sold." })),
    el("article", { class: "proposal" },
      el("h3", { text: "2. Builders set aside discounted homes, and the discount stays forever" }),
      el("p", { text: "Every new development sells a share of its homes below market to local first-time buyers. The deed keeps the same discount at every resale, so the home stays affordable for the next family." }),
      el("div", { class: "grid" },
        el("div", {},
          n("Homes in the development", () => A.homes, (v) => { A.homes = Math.round(v); }, { min: 10, max: 5000, step: 10 }),
          n("Share set aside", () => A.setAsidePct, (v) => { A.setAsidePct = v; }, { min: 5, max: 30, step: 1, suffix: "%" }),
          n("Discount below market", () => A.discountPct, (v) => { A.discountPct = v; }, { min: 10, max: 50, step: 5, suffix: "%" }),
          n("Market price of a home", () => A.marketPrice, (v) => { A.marketPrice = v; }, { min: 200000, max: 3000000, step: 10000, prefix: "$" })),
        el("div", {}, aStats)),
      aSay,
      el("table", { class: "tbl" }, el("thead", {}, el("tr", {}, el("th", { text: "Where" }), el("th", { text: "Rule" }), el("th", { text: "Status" }))),
        el("tbody", {},
          el("tr", {}, el("td", { text: "England, First Homes" }), el("td", { text: "At least 30% below market value, kept in perpetuity; councils could set up to 50%. 25% of affordable homes from developers had to be First Homes until the national rule was dropped in December 2024; local plans can still require them." }), el("td", {}, tag("partly"))),
          el("tr", {}, el("td", { text: "Irvine" }), el("td", {}, "Inclusionary ordinance: 15% of new homes affordable since 2003; the city's 2023-25 budget says raised to 20%. ", el("a", { href: "https://cityofirvine.gov/node/81916", target: "_blank", rel: "noopener noreferrer", text: "Source" })), el("td", {}, tag("partly"))),
          el("tr", {}, el("td", { text: "California density bonus" }), el("td", { text: "Builders who include moderate-income for-sale homes get extra density; those homes carry an equity-sharing agreement with the city (Gov. Code 65915(c)(2))." }), el("td", {}, tag("partly"))),
          el("tr", {}, el("td", { text: "Huntington Beach, Tustin" }), el("td", { text: "Deed-restricted resale homes priced to income, already on the books." }), el("td", {}, tag("verified"))))),
      el("p", { class: "note", text: "Set-aside rules must leave projects able to pencil, or builders stop building. A city usually pairs them with density bonuses, faster permits or fee cuts." })));
}


// TOGETHER: a city tech day (hackathon) with one target: approve a standard ADU in 30 days or less.
function aduSection() {
  const A = S.adu;
  const stats = el("div", { class: "stats4" });
  const say = el("p", { class: "answer small", role: "status" });
  const st = (label, value, note) => el("div", { class: "stat" }, el("span", { class: "lab", text: label }), el("strong", { class: "big", text: value }), el("span", { class: "sub", text: note }));
  subs.push(() => {
    const r = aduSpeed(A);
    stats.replaceChildren(
      st("Days saved per permit", String(Math.round(r.daysSaved)), `${A.currentDays} days now, target ${Math.min(A.currentDays, A.targetDays)}`),
      st("Home-years gained", r.homeYears.toFixed(0), `${A.requests} ADU requests a year`),
      st("Rent or housing value", money(r.rentValue), `At ${money(A.rent)} a month (ASSUMPTION)`),
      st("State deadline", "60 days", r.overLaw ? "Your current time is over the legal limit" : "Current time is within the limit"));
    say.textContent = `Cutting review from ${A.currentDays} to ${Math.min(A.currentDays, A.targetDays)} days puts about ${r.homeYears.toFixed(0)} extra years of homes on the market every year, without one new dollar of subsidy.`;
  });
  const n = (label, get, put, o) => numberField(label, get, put, o);
  const challenges = [
    ["Pre-check before submit", "A tool that reads the ADU plans and lists what is missing against the city's own checklist, so the first review is the last one."],
    ["Parcel fit in one minute", "Type an address and see setbacks, height, lot coverage and the ADU size the lot allows, from the city's public GIS layers."],
    ["Pick a pre-approved plan", "A gallery of plans the city already approved; pick one and the review is mostly done."],
    ["Live permit tracker", "Every application shows which desk it is on and for how many days, like a package tracker."],
    ["Plain-language corrections", "Turn reviewer comments into clear fix lists in English, Spanish and Vietnamese."],
  ];
  return section("adu", "Together: tech for the city", "City tech day: approve an ADU in 30 days", "Cities can host a community hackathon with students, builders, architects and city staff in one room. One target: a standard backyard home (ADU) approved in 30 days or less, and 15 days with a pre-approved plan. Nothing is built for the city without its staff in the room, and no personal data is used: public rules, public maps, sample plans.",
    el("article", { class: "proposal" },
      el("h3", { text: "The target" }),
      el("table", { class: "tbl" }, el("thead", {}, el("tr", {}, el("th", { text: "Step" }), el("th", { text: "Days" }), el("th", { text: "Status" }))),
        el("tbody", {},
          el("tr", {}, el("td", { text: "California law: decide a complete ADU application within 60 days (Gov. Code 66317)" }), el("td", { text: "60" }), el("td", {}, tag("verified"))),
          el("tr", {}, el("td", { text: "Tech day goal for a standard ADU" }), el("td", { text: "30" }), el("td", {}, tag("assumption"))),
          el("tr", {}, el("td", { text: "Pre-approved plan (cities must offer a pre-approved plan program, AB 1332, from 2025)" }), el("td", { text: "15" }), el("td", {}, tag("assumption"))))),
      el("div", { class: "grid" },
        el("div", {},
          n("ADU requests a year", () => A.requests, (v) => { A.requests = Math.round(v); }, { min: 10, max: 5000, step: 10 }),
          n("Days to approve now", () => A.currentDays, (v) => { A.currentDays = Math.round(v); }, { min: 1, max: 365, step: 5, status: "assumption" }),
          n("Target days", () => A.targetDays, (v) => { A.targetDays = Math.round(v); }, { min: 1, max: 120, step: 5 }),
          n("Monthly rent of an ADU", () => A.rent, (v) => { A.rent = v; }, { min: 500, max: 6000, step: 50, prefix: "$" })),
        el("div", {}, stats)),
      say),
    el("article", { class: "proposal" },
      el("h3", { text: "Five challenges for the hackathon" }),
      el("div", { class: "ideas" }, challenges.map(([t, d]) => el("div", { class: "idea" }, el("h3", { text: t }), el("p", { text: d })))),
      el("p", { class: "note", text: "Format: one Saturday, city planning staff as judges, UCI and community college students, local builders and architects. Winning tools are handed to the city as open source (MIT) so any Orange County city can use them. We do not know each city's current ADU review time; the city enters its own number." })));
}


// The chapter banner: makes the move between Ready, Together and Give visible.
// The three parts: Get ready. Organize together. Donate.
const CHAPTERS = [
  { id: "ready", n: 1, letter: "G", verb: "Get", word: "ready.", who: "I", whoLong: "For the family", img: "img/saving.jpg", alt: "A family counting savings at the kitchen table",
    line: "Learn the path, check which programs fit, read your own documents and look stronger to a lender." },
  { id: "together", n: 2, letter: "O", verb: "Organize", word: "together.", who: "We", whoLong: "For the city and the nonprofit", img: "img/framing.jpg", alt: "Volunteers raising a wall frame on a build site",
    line: "Price one home, see who closes the gap, and take ready-made programs to council." },
  { id: "give", n: 3, letter: "D", verb: "", word: "Donate.", who: "You", whoLong: "For the neighbor and the business", img: "img/gala.jpg", alt: "Guests at a community gala",
    line: "Time, skills, goods and money, each one tied to a real gap. Demo only: nothing is charged." },
];
// TOGETHER: projects on the map. Sample sites where a city, church or nonprofit could build new
// affordable homes. Fictional numbers; each gap uses the same formula as the calculator.
const SITES = [
  { id: "sa", city: "Santa Ana", site: "Church parking lot", homes: 12, tier: "lower", bedrooms: 3, cost: 520000, funds: 180000, lon: -117.867, lat: 33.745 },
  { id: "an", city: "Anaheim", site: "Surplus city land", homes: 24, tier: "moderate", bedrooms: 3, cost: 610000, funds: 20000, lon: -117.914, lat: 33.836 },
  { id: "gg", city: "Garden Grove", site: "Former office park", homes: 16, tier: "lower", bedrooms: 2, cost: 480000, funds: 220000, lon: -117.941, lat: 33.774 },
  { id: "fu", city: "Fullerton", site: "Next to the train station", homes: 30, tier: "moderate", bedrooms: 2, cost: 560000, funds: 0, lon: -117.925, lat: 33.870 },
  { id: "ir", city: "Irvine", site: "Builder set-aside, new village", homes: 20, tier: "moderate", bedrooms: 3, cost: 700000, funds: 60000, lon: -117.794, lat: 33.684 },
  { id: "cm", city: "Costa Mesa", site: "Small infill lot", homes: 6, tier: "lower", bedrooms: 3, cost: 540000, funds: 180000, lon: -117.919, lat: 33.641 },
  { id: "we", city: "Westminster", site: "Closed school site", homes: 18, tier: "lower", bedrooms: 3, cost: 500000, funds: 160000, lon: -117.994, lat: 33.759 },
  { id: "tu", city: "Tustin", site: "Former base land", homes: 28, tier: "moderate", bedrooms: 3, cost: 590000, funds: 50000, lon: -117.826, lat: 33.746 },
  { id: "sj", city: "San Juan Capistrano", site: "Church land", homes: 8, tier: "lower", bedrooms: 2, cost: 620000, funds: 300000, lon: -117.662, lat: 33.502 },
];
// Simplified county outline (lon, lat), clockwise from Seal Beach. Illustration, not a survey.
const OC_SHAPE = [[-118.115, 33.745], [-118.09, 33.78], [-118.03, 33.84], [-117.98, 33.90], [-117.88, 33.94], [-117.78, 33.95], [-117.67, 33.88], [-117.60, 33.82], [-117.53, 33.74], [-117.46, 33.68], [-117.41, 33.64], [-117.47, 33.55], [-117.51, 33.50], [-117.60, 33.39], [-117.65, 33.43], [-117.69, 33.46], [-117.75, 33.50], [-117.79, 33.55], [-117.85, 33.59], [-117.89, 33.60], [-117.94, 33.62], [-118.00, 33.66], [-118.06, 33.71], [-118.115, 33.745]];
function mapSection() {
  const W = 700, H = 690;
  const px = (lon) => ((lon + 118.16) / 0.80) * W;
  const py = (lat) => ((33.97 - lat) / 0.62) * H;
  const NS = "http://www.w3.org/2000/svg";
  const sv = (tag, at = {}, ...kids) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) n.setAttribute(k, v); for (const k of kids) if (k) n.append(k); return n; };
  const svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "pm-svg", role: "group", "aria-label": "Map of sample project sites in Orange County" });
  const detail = el("div", { class: "pm-detail", role: "status", "aria-live": "polite" });
  const rows = el("tbody", {});
  const totals = el("p", { class: "answer small" });
  const tierSel = el("select", { id: "pm-tier", onchange: () => draw() },
    el("option", { value: "all", text: "All income groups" }), el("option", { value: "lower", text: "Lower income" }), el("option", { value: "moderate", text: "Moderate income" }));
  const COLOR = { funded: "#2f7d4f", under25: "#b8860b", over25: "#c0392b" };
  const LABEL = { funded: "Fully funded", under25: "Under 25% still open", over25: "25% or more still open" };
  let picked = "sa";
  const calc = (s) => ({ ...s, ...projectGap({ costPerHome: s.cost, tier: s.tier, bedrooms: s.bedrooms, fundsPerHome: s.funds, ratePct: S.rate, assume: S.assume }) });
  const show = (r) => {
    picked = r.id;
    const total = r.open * r.homes;
    detail.replaceChildren(
      el("p", { class: "lab", text: `${r.city} \u00b7 ${r.site}` }),
      el("h3", { text: `${r.homes} homes, ${r.bedrooms} bedrooms, ${r.tier === "lower" ? "lower" : "moderate"} income` }),
      el("dl", { class: "pm-dl" },
        el("dt", { text: "Cost to deliver, per home" }), el("dd", { text: money(r.cost) }),
        el("dt", { text: "What the family can pay" }), el("dd", { text: money(r.price) }),
        el("dt", { text: "Confirmed funds, per home" }), el("dd", { text: money(r.funds) }),
        el("dt", { text: "Still open, per home" }), el("dd", { class: `pm-open s-${r.status}`, text: r.open > 0 ? money(r.open) : "$0" })),
      el("p", { class: "pm-total" }, r.open > 0 ? el("b", { text: `${money(total)} closes this project.` }) : el("b", { text: "This project is fully funded." }),
        r.open > 0 ? ` That is ${Math.ceil(total / 25000)} gifts of $25,000, or ${Math.ceil(r.open / 25000) > 1 ? Math.ceil(r.open / 25000) + " gifts" : "one gift"} per home.` : " Ready for families from the Ready check."),
      el("p", { class: "note", text: "Sample site and fictional numbers (ASSUMPTION). The family's price uses the calculator's income table and today's rate." }));
    [...svg.querySelectorAll(".pm-pin")].forEach((g) => g.setAttribute("aria-pressed", g.dataset.id === r.id ? "true" : "false"));
    [...rows.children].forEach((tr) => tr.classList.toggle("on", tr.dataset.id === r.id));
  };
  const draw = () => {
    const list = SITES.map(calc).filter((r) => tierSel.value === "all" || r.tier === tierSel.value);
    const ocean = sv("rect", { x: 0, y: 0, width: W, height: H, fill: "#dfeaf1" });
    const land = sv("rect", { x: 0, y: 0, width: W, height: H, fill: "#f4efe6" });
    const coastClip = sv("clipPath", { id: "pm-coast" }, sv("polygon", { points: `0,0 ${W},0 ${W},${py(33.40)} ${px(-117.60)},${py(33.39)} ${OC_SHAPE.slice(13).map(([x, y]) => `${px(x)},${py(y)}`).join(" ")} 0,${py(33.70)}` }));
    const county = sv("polygon", { points: OC_SHAPE.map(([x, y]) => `${px(x)},${py(y)}`).join(" "), fill: "#fff8ee", stroke: "#ff8710", "stroke-width": 3, "stroke-linejoin": "round" });
    const labels = [["Los Angeles Co.", -118.03, 33.945], ["San Bernardino Co.", -117.66, 33.94], ["Riverside County", -117.52, 33.84], ["Pacific Ocean", -118.05, 33.55], ["Orange County", -117.72, 33.60]].map(([t, lo, la]) => { const n = sv("text", { x: px(lo), y: py(la), class: t === "Orange County" ? "pm-county" : "pm-region" }); n.textContent = t; return n; });
    const pins = list.map((r) => {
      const rad = 8 + Math.sqrt(r.homes) * 2.2;
      const g = sv("g", { class: "pm-pin", "data-id": r.id, tabindex: 0, role: "button", "aria-label": `${r.city}, ${r.site}: ${r.homes} homes, ${LABEL[r.status]}`, transform: `translate(${px(r.lon)} ${py(r.lat)})` },
        sv("circle", { r: rad, fill: COLOR[r.status], stroke: "#fff", "stroke-width": 3 }));
      const n = sv("text", { y: 6, class: "pm-n" }); n.textContent = String(r.homes); g.append(n);
      const side = { we: [-1, 0], gg: [-1, -1], sa: [0, 1], cm: [-1, 0] }[r.id] || [1, 0];
      const c = sv("text", { x: side[0] * (rad + 6), y: side[1] === 0 ? 5 : side[1] * (rad + 14) + (side[1] > 0 ? 4 : 0), "text-anchor": side[0] < 0 ? "end" : side[0] > 0 ? "start" : "middle", class: "pm-city" }); c.textContent = r.city; g.append(c);
      g.addEventListener("click", () => show(r));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(r); } });
      return g;
    });
    svg.replaceChildren(sv("defs", {}, coastClip), ocean, sv("g", { "clip-path": "url(#pm-coast)" }, land), county, ...labels, ...pins);
    rows.replaceChildren(...list.map((r) => el("tr", { "data-id": r.id, tabindex: 0, onclick: () => show(r), onkeydown: (e) => { if (e.key === "Enter") show(r); } },
      el("td", {}, el("span", { class: `pm-dot s-${r.status}` }), r.city), el("td", { text: r.site }), el("td", { text: String(r.homes) }), el("td", { class: `pm-open s-${r.status}`, text: r.open > 0 ? money(r.open) : "Funded" }))));
    const homes = list.reduce((s, r) => s + r.homes, 0);
    const open = list.reduce((s, r) => s + r.open * r.homes, 0);
    totals.textContent = `${list.length} sample sites, ${homes} homes. ${money(open)} still open after confirmed funds, about $${(open / 1000000).toFixed(1)} million to raise across the county.`;
    const cur = list.find((r) => r.id === picked) || list[0];
    if (cur) show(cur); else detail.replaceChildren(el("p", { text: "No sample site in this group." }));
  };
  subs.push(draw);
  return section("projectmap", "2. Organize together: where to build", "Projects on the map: new homes on new kinds of land", "Church lots, surplus city land, closed schools, old office parks, land by the train. Each pin is a sample site where new affordable homes could go. Pin size is the number of homes; color is how much of each home's gap is still open after confirmed funds.",
    el("div", { class: "pm-tools" }, el("label", { for: "pm-tier", class: "lab", text: "Show" }), tierSel,
      el("span", { class: "pm-key" }, el("span", { class: "pm-dot s-funded" }), "Fully funded"),
      el("span", { class: "pm-key" }, el("span", { class: "pm-dot s-under25" }), "Under 25% open"),
      el("span", { class: "pm-key" }, el("span", { class: "pm-dot s-over25" }), "25% or more open"),
      tag("assumption")),
    totals,
    el("div", { class: "pm" }, el("div", { class: "pm-map" }, svg, el("p", { class: "note", text: "Simplified outline, not to scale. Sample sites, not real projects." })),
      el("div", { class: "pm-side" }, detail,
        el("table", { class: "tbl pm-tbl" }, el("thead", {}, el("tr", {}, el("th", { text: "City" }), el("th", { text: "Site" }), el("th", { text: "Homes" }), el("th", { text: "Open per home" }))), rows))));
}

// DEMO: the pitch deck as images, with the 90-second video on slide 8.
const DECK = [
  "The Affordable Home Initiative", "10 years in the UK: 3 homes bought", "3 years in the US: 3 escrows opened, 0 closed",
  "What OCMEED stands for", "California already has Help to Buy", "One affordable home, one gap",
  "The friend at the party, for every family", "The 90-second demo", "Let's build that path here",
];
function demoSection() {
  let i = 0;
  const stage = el("div", { class: "deck-stage" });
  const count = el("span", { class: "deck-count", "aria-live": "polite" });
  const thumbs = el("div", { class: "deck-thumbs", role: "group", "aria-label": "All slides" }, DECK.map((t, k) => el("button", { type: "button", "aria-label": `Slide ${k + 1}: ${t}`, onclick: () => go(k) },
    el("img", { src: `media/slide-${String(k + 1).padStart(2, "0")}.jpg`, alt: "", width: "192", height: "108", loading: "lazy" }))));
  const go = (k) => {
    i = (k + DECK.length) % DECK.length;
    const src = `media/slide-${String(i + 1).padStart(2, "0")}.jpg`;
    if (i === 7) {
      const v = el("video", { src: "media/demo-90s.mp4", poster: src, controls: true, preload: "none", playsinline: true, "aria-label": "The 90-second demo of theAhome.ocmeed.com" });
      stage.replaceChildren(v);
    } else {
      stage.replaceChildren(el("img", { src, alt: `Slide ${i + 1}: ${DECK[i]}`, width: "1920", height: "1080" }));
    }
    count.textContent = `${i + 1} / ${DECK.length} \u00b7 ${DECK[i]}`;
    [...thumbs.children].forEach((b, k2) => b.setAttribute("aria-current", k2 === i ? "true" : "false"));
  };
  const box = el("div", { class: "deck", tabindex: "0", "aria-label": "Pitch deck. Use the left and right arrow keys to move between slides." }, stage);
  box.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); } });
  go(0);
  return section("demo", "Demo", "The pitch, slide by slide", "Our nine-slide pitch from the Claude Impact Lab at UC Irvine, 7 November 2026. Slide 8 is the 90-second demo video.",
    box,
    el("div", { class: "deck-bar" },
      el("button", { type: "button", class: "ghost story-arrow", "aria-label": "Previous slide", onclick: () => go(i - 1) }, "\u2190"),
      count,
      el("button", { type: "button", class: "ghost story-arrow", "aria-label": "Next slide", onclick: () => go(i + 1) }, "\u2192"),
      el("a", { class: "ghost deck-dl", href: "media/pitch-deck.pdf", download: "the-affordable-home-initiative.pdf", text: "Download the deck (PDF)" })),
    thumbs);
}

function intro() {
  const T = L();
  const base = [["OC", "Orange County"], ["M", "Mortgage"], ["E", "Education"], ["E", "Equity"], ["D", "Design"]];
  return el("section", { class: "intro", lang },
    T.note ? el("p", { class: "lang-note", text: T.note }) : null,
    el("div", { class: "intro-top" },
      el("div", { class: "intro-text" },
        el("p", { class: "eyebrow", text: T.eyebrow }),
        el("h1", {}, T.h1[0], el("em", { text: T.h1[1] })),
        el("p", { class: "motto" }, T.motto[0], el("em", { text: T.motto[1] })),
        el("p", { class: "lead", text: T.lead })),
      el("nav", { class: "slips", "aria-label": "Parts" }, CHAPTERS.map((c, i) => {
        const on = document.getElementById(`tab-${c.id}`)?.getAttribute("aria-selected") === "true" || (!document.getElementById(`tab-${c.id}`) && i === 0);
        return el("button", { type: "button", class: "slip", "data-id": c.id, "aria-current": on ? "step" : "false", onclick: () => showTab(c.id) },
          el("img", { src: c.img, alt: "", width: "1200", height: "800" }),
          el("span", { class: "slip-n", text: String(c.n) }),
          el("span", { class: "slip-w" }, T.steps[i][0], el("em", { text: T.steps[i][1] })));
      }))),
    el("div", { class: "acronym" },
      el("p", { class: "acronym-title" }, T.acronym[0], el("b", { text: "OCMEED" }), T.acronym[1]),
      el("ol", { class: "letters" }, base.map(([l, w], i) => el("li", {}, el("span", { class: "l", text: l }), el("span", { class: "w", text: T.words[i] ? `${w} \u00b7 ${T.words[i]}` : w }), el("span", { class: "d", text: T.desc[i] })))),
      el("p", { class: "byline" }, T.byline[0], el("em", { text: T.byline[1] }), T.byline[2])));
}

// Language flip in the header: EN, ES, VI, 中文.
function langSwitch() {
  const box = el("div", { class: "langs", role: "group", "aria-label": "Language" });
  const paint = () => box.replaceChildren(...LANGS.map(([code, short, name]) => el("button", { type: "button", lang: code, "aria-pressed": code === lang ? "true" : "false", "aria-label": name, title: name, onclick: () => setLang(code) }, short)));
  paint();
  document.addEventListener("langchange", paint);
  return box;
}
let introEl;
function setLang(code) {
  if (!I18N[code] || code === lang) return;
  lang = code;
  try { localStorage.setItem("lang", code); } catch { /* storage blocked */ }
  document.documentElement.lang = code === "zh" ? "zh-Hans" : code;
  for (const n of document.querySelectorAll(".notice")) n.textContent = L().notice;
  const brand = document.querySelector(".brand-name");
  if (brand) brand.textContent = L().brand;
  const fresh = intro();
  introEl.replaceWith(fresh);
  introEl = fresh;
  document.dispatchEvent(new Event("langchange"));
}
const panel = (id, ...kids) => el("div", { id: `panel-${id}`, role: "tabpanel", "aria-labelledby": `tab-${id}`, hidden: id !== "ready" }, ...kids);
introEl = intro();
document.getElementById("main").append(introEl,
  panel("ready", learnSection(), readySection(), docsSection(), borrowerSection(), atlasSection()),
  panel("together", storyStrip(), hero(), homeSection(), leversSection(), mapSection(), proposalsSection(), aduSection(), ideasSection(), familySection(), stackSection(), rateSection()),
  panel("give", donateSection(), carSection(), volunteerSection(), eventsSection(), giveSection(), pillarsSection()),
  panel("demo", demoSection()),
  sourcesSection());
document.getElementById("tabs").before(langSwitch());
showTab = tabs([["ready", "1. Ready"], ["together", "2. Together"], ["give", "3. Give"], ["demo", "Demo"]]);
paint();

if (lang !== "en") { const start = lang; lang = "en"; setLang(start); }
