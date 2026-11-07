// Every number the tool uses, with its source, the date it was checked and its status.
// status: "verified" (read at the source), "partly" (source read, some terms not confirmed),
// "assumption" (made up for the demo, labelled in the tool), "unknown" (no source says).
export const CHECKED = "2026-11-07";

export const SOURCES = {
  hcd: { label: "HCD 2026 State Income Limits, revised memo 23 June 2026", url: "https://www.hcd.ca.gov/sites/default/files/docs/grants-and-funding/income-limits-2026.pdf", status: "verified" },
  statute: { label: "California Health and Safety Code 50052.5 (affordable housing cost)", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=HSC&sectionNum=50052.5", status: "partly" },
  fred: { label: "Freddie Mac 30-year fixed rate, FRED series MORTGAGE30US", url: "https://fred.stlouisfed.org/series/MORTGAGE30US", status: "verified" },
  calhfa: { label: "CalHFA MyHome Assistance program sheet", url: "https://www.calhfa.ca.gov/homeownership/programs/myhome.pdf", status: "verified" },
  calhfaLimits: { label: "CalHFA income limits, effective 30 June 2026", url: "https://www.calhfa.ca.gov/homeownership/limits/income/income.pdf", status: "verified" },
  dream: { label: "CalHFA Dream For All, 2026 round press release", url: "https://www.calhfa.ca.gov/about/press/press-releases/2026/pr2026-01-16.htm", status: "verified" },
  santaAna: { label: "City of Santa Ana, My First Home", url: "https://www.santa-ana.org/my-first-home", status: "partly" },
  gardenGrove: { label: "City of Garden Grove, First-Time Home Buyer Program", url: "https://ggcity.org/neighborhood-improvement/first-time-home-buyer-program", status: "partly" },
  anaheim: { label: "City of Anaheim, My Anaheim Home FY2026 flyer", url: "https://www.anaheim.gov/6695/First-Time-Homebuyer-Program", status: "verified" },
  map: { label: "County of Orange Mortgage Assistance Program, application package 5 May 2026", url: "https://affordable-housing.org/orange-county-mortgage-assistance-program/", status: "verified" },
  habitat: { label: "Habitat for Humanity of Orange County, Review Qualifications (2026 table)", url: "https://habitatoc.org/review-qualifications/", status: "verified" },
  habitatAudit: { label: "Habitat for Humanity of OC, audited financial statements FY ended 30 June 2025", url: "https://habitatoc.org/wp-content/uploads/2026/02/Habitat-for-Humanity-of-OC-Inc.-HFHOC-FS-Audit-Report-2025-Final-1.pdf", status: "verified" },
  irs526: { label: "IRS Publication 526, Charitable Contributions", url: "https://www.irs.gov/publications/p526", status: "partly" },
  irs561: { label: "IRS Publication 561 and Form 8283, donated property", url: "https://www.irs.gov/publications/p561", status: "partly" },
  lane: { label: "Impact Lab lane 3 synthetic example deal (all numbers ASSUMPTION)", url: "https://github.com/travcjohnson/claude-impact-lab-uci/blob/main/lanes/3-fund-it/data/synthetic-example-deal.json", status: "assumption" },
};

// HCD 2026, Orange County, household sizes 1 to 8.
export const INCOME = {
  median: [97000, 110900, 124750, 138600, 149700, 160800, 171850, 182950],
  veryLow: [65150, 74450, 83750, 93050, 100500, 107950, 115400, 122850],
  low: [104200, 119100, 134000, 148850, 160800, 172700, 184600, 196500],
  moderate: [116400, 133050, 149650, 166300, 179600, 192900, 206200, 219500],
};

// H&SC 50052.5(b), owner-occupied: share of income times share of area median, by income group.
// Household size "appropriate for the unit" is bedrooms plus one (50052.5(h)). status "partly": confirm the full text.
export const TIERS = [
  { key: "veryLow", label: "Very low income", share: 0.30, ami: 0.50, cap: "veryLow" },
  { key: "lower", label: "Lower income", share: 0.30, ami: 0.70, cap: "low" },
  { key: "moderate", label: "Moderate income", share: 0.35, ami: 1.10, cap: "moderate" },
];

export const RATE = { value: 7.18, date: "2026-11-05", previous: 7.40, previousDate: "2026-10-08" };

// Assumptions the user can change. Each is labelled ASSUMPTION on screen.
export const ASSUME = {
  downPct: 3, taxPct: 1.1, insPct: 0.35, pmiPct: 0.5, hoa: 0, term: 30, bedrooms: 3,
  slipMonths: 0, carryPerMonth: 7083,
};

// The lane's made-up deal: $535,000 per home. Every line is ASSUMPTION.
export const DEAL = [
  { key: "land", label: "Land and building purchase", amount: 360000 },
  { key: "carry", label: "Holding costs while waiting (interest, tax, insurance)", amount: 85000 },
  { key: "build", label: "Construction and repairs", amount: 40000 },
  { key: "fees", label: "Design, legal and sales fees", amount: 50000 },
];

// Money that goes to the buyer and raises what the family can pay. Deferred loans add to the price almost
// dollar for dollar because they carry no monthly payment.
export const BUYER_AID = [
  { key: "myhome", residency: "green", name: "CalHFA MyHome Assistance", kind: "Deferred loan, repaid on sale or refinance", amount: { pctPrice: 3 },
    incomeCap: 274000, cities: null, status: "open", timing: "Funds at closing", src: "calhfa",
    note: "3% with a conventional first loan, 3.5% with FHA. Needs a CalHFA first loan. Income cap $274,000 (CalHFA, 30 June 2026). Citizens and green card holders only." },
  { key: "santaAna", residency: "unknown", name: "Santa Ana My First Home", kind: "0% deferred loan", amount: { fixed: 120000 },
    incomeTable: "low", cities: ["Santa Ana"], status: "open", timing: "Funds at closing, first come first served", src: "santaAna",
    note: "Only 80% of median applications accepted now. Buyer needs 3% own savings held 90 days. Citizenship rule not stated." },
  { key: "gardenGrove", residency: "unknown", name: "Garden Grove First-Time Home Buyer", kind: "0% deferred loan, 30 years", amount: { tiers: [["low", 110000], ["moderate", 50000]] },
    incomeTable: "moderate", cities: ["Garden Grove"], status: "check", timing: "Funds at closing; funding status not published", src: "gardenGrove",
    note: "$110,000 up to 80% of median, $50,000 up to 120%. Price cap and forgiveness not confirmed." },
  { key: "anaheim", residency: "unknown", name: "My Anaheim Home", kind: "Deferred loan at 1% simple interest, 30 years", amount: { fixed: 50000 },
    incomeTable: "anaheim150", cities: ["Anaheim"], status: "open", timing: "Funds at closing; interest list", src: "anaheim",
    note: "Income up to 150% of median. Price cannot exceed the average Anaheim home price. In-person HUD seminar." },
  { key: "map", residency: "green", name: "County Mortgage Assistance Program", kind: "Silent second at 3% simple interest, 30 years", amount: { pctPrice: 20, cap: 80000 },
    incomeTable: "low", cities: ["Stanton", "Cypress", "Brea", "Placentia", "Unincorporated county"], status: "open", timing: "Funds at closing", src: "map",
    note: "Only unincorporated areas and 14 smaller cities (5 shown). Citizens and green card holders only. Price under 85% of the OC median." },
  { key: "dream", residency: "green", name: "CalHFA Dream For All", kind: "Shared appreciation loan", amount: { pctPrice: 20, cap: 150000 },
    incomeCap: 219000, cities: null, status: "closed", timing: "Closed. The 2026 round was a lottery, 24 February to 16 March", src: "dream",
    note: "First-generation buyers only. No future round announced." },
];

// Anaheim FY2026 flyer, 150% of median.
export const ANAHEIM_150 = [145500, 166350, 187100, 207900, 224550, 241200, 257750, 274400];

// Money that goes to the project. Amounts are not published per home, so the user enters them and they stay
// "unconfirmed" until awarded.
export const PROJECT_FUNDS = [
  { key: "public", name: "Public subsidy (city, county or state award)", status: "unconfirmed", amount: 100000, note: "ASSUMPTION from the lane deal. Programs such as HOME, CDBG and CalHome set amounts per award round. We do not know a per-home figure." },
  { key: "rent", name: "Rent earned while waiting", status: "unconfirmed", amount: 55000, note: "ASSUMPTION from the lane deal." },
  { key: "gifts", name: "Donor gifts and fundraising", status: "unconfirmed", amount: 0, note: "Enter pledges. Count only signed pledges as confirmed." },
];

export const CITIES = ["Santa Ana", "Garden Grove", "Anaheim", "Stanton", "Cypress", "Brea", "Placentia", "Unincorporated county", "Other Orange County city"];

// Habitat for Humanity of Orange County: a path, not a dollar amount. habitatoc.org, 2026 table.
export const HABITAT = {
  name: "Habitat for Humanity of Orange County",
  min: [39100, 44700, 50300, 55850, 60350, 64908, 69300, 73750],
  maxDebtPct: 10,
  hours: { veryLow: 250, low: 250, moderate: 25 },
  resaleHours: { veryLow: 100, low: 100, moderate: 25 },
  note: "Citizens or permanent residents who live or work in Orange County and show a housing need. Price is set from income; housing costs near 30% to 35% of gross income. Resale stays affordable for the next family.",
  src: "habitat",
};

// Budget share used in the Ready check: 30% of gross income, the statute's share for lower-income buyers. ASSUMPTION for any one family.
export const READY_SHARE = 0.30;
