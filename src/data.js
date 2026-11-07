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

// READY: short lessons. Plain facts; each says where it comes from or that it is general guidance.
export const LESSONS = [
  { title: "How buying works in California", body: "Get pre-approved, find a home, make an offer, open escrow, finish inspections and the appraisal, remove contingencies, sign and get the keys. On the standard California contract, inspection, appraisal and loan contingencies default to 17 days each. Escrow usually takes 30 to 45 days." },
  { title: "What a lender looks at", body: "Four things: credit history and score, debt-to-income (all monthly debts plus the new housing payment, divided by gross monthly income), steady income (usually two years), and cash for the down payment, closing costs and reserves. Self-employed income is usually a two-year average after expenses." },
  { title: "Most down payment help is a loan", body: "City and state help is usually a deferred loan: no monthly payment, repaid when you sell, refinance or pay off the first loan. Dream For All is repaid with a share of the home's gain. A grant you never repay is rare. Read how each one is repaid before you count on it." },
  { title: "Below-market homes and their rules", body: "Habitat for Humanity, land trust and deed-restricted homes sell below market. In return the resale price is limited and equity is shared, so the home stays affordable for the next family. Ask for the restriction length and the resale formula in writing." },
  { title: "What can break a deal", body: "A low appraisal, a rate jump before you lock, a new car loan or credit card, a job change, a large deposit you cannot explain, or insurance you cannot get. Lock your rate, change nothing in your finances during escrow, and get an insurance quote before you offer." },
  { title: "Free help near you", body: "HUD-approved housing counselors teach the homebuyer class most programs require. Habitat OC runs free online orientations in English, Spanish and Vietnamese. For credit: SparkPoint OC (Orange County United Way), (714) 278-4679, and Operation HOPE, (657) 208-5873." },
];

// READY: lender targets used for tips. General guidance, labelled as such on screen.
export const LENDER = {
  dtiTarget: 43, dtiMax: 50, utilization: 30, months: 2, jobYears: 2,
  credit: [[620, "Most conventional loans"], [640, "Santa Ana My First Home, GSFA"], [680, "CalHFA conventional loans"], [740, "Better pricing"], [780, "Best pricing tier"]],
  closingPct: 3,
};

// TOGETHER: program ideas a city or nonprofit can start. Examples are only ones we checked.
export const IDEAS = [
  { title: "Community land trust homes", lever: "Land", what: "A trust keeps the land and sells the home, so the price drops by the land's share and stays low at resale.", example: "Irvine Community Land Trust, Sage Park townhomes in Portola Springs.", url: "https://www.irvineclt.org/sage-park/", first: "Offer one city-owned lot to a land trust partner." },
  { title: "Deferred down payment loans", lever: "Money", what: "A 0% or low-rate loan with no monthly payment, repaid on sale. Raises what a family can pay almost dollar for dollar.", example: "Santa Ana My First Home, up to $120,000 at 0%.", url: "https://www.santa-ana.org/my-first-home", first: "Set aside part of an existing housing fund as a revolving loan pool." },
  { title: "Deed-restricted resale homes", lever: "Policy", what: "New projects set aside homes at a price tied to income, with resale limits that keep them affordable.", example: "Tustin and Huntington Beach affordable ownership programs.", url: "https://www.tustinca.org/461/Homeownership-Opportunities", first: "Publish the list of restricted homes and an alert sign-up." },
  { title: "Build Days with Habitat", lever: "Time", what: "Monthly city Build Days where families earn sweat-equity hours beside volunteers and city staff.", example: "Habitat OC asks 250 hours per adult on a new home for low income.", url: "https://habitatoc.org/your-partnership/", first: "Host one Build Day a month on a city site." },
  { title: "Homebuyer education in two or three languages", lever: "Education", what: "Free classes with HUD-approved counselors, at libraries and schools, so families arrive ready.", example: "Habitat OC orientations in English, Spanish and Vietnamese.", url: "https://habitatoc.org/attend-an-orientation/", first: "Book a quarterly class at the main library." },
  { title: "Faster, cheaper approvals for affordable ownership", lever: "Speed", what: "Every month of delay adds holding cost. Fee deferral and a fast lane for affordable ownership cut the gap.", example: "No Orange County example verified. Idea to test.", url: null, first: "Measure months from application to permit on the last 3 affordable projects." },
  { title: "Employer-assisted housing", lever: "Money", what: "Hospitals, schools and the city itself help their own workers with down payment loans, so staff live near work.", example: "No Orange County example verified. Idea to test.", url: null, first: "Ask the 3 largest employers in the city to co-fund a pilot." },
  { title: "Count nearly-ready families, never names", lever: "Data", what: "Anonymous counts from readiness checks show how many families are close, so programs are sized to real demand.", example: "The Ready tab is built to keep answers on the family's device.", url: null, first: "Agree a shared, anonymous count with local counselors." },
];

// GIVE: ways to help beyond money.
export const GIVE_WAYS = [
  { kind: "Time", items: ["Build Days on a Habitat OC site", "Mentor a family through escrow", "Teach a money or homebuyer class"] },
  { kind: "Skills", items: ["Attorneys: contracts and title questions", "Engineers and architects: plan reviews and repairs", "Lenders and agents: free homebuyer workshops", "Accountants: tax help for first-time buyers"] },
  { kind: "Resources", items: ["Building materials and appliances to a Habitat ReStore", "A lot, a building or office space", "Company volunteer days"] },
  { kind: "Money", items: ["Close one home's gap", "Fund a down payment loan pool", "Match your employees' gifts"] },
];

// MORTGAGE ATLAS: the main loan types in Orange County. "verified" facts were read at the source on 7 Nov 2026;
// "general" facts are common lender guidance, shown as such, to confirm with a lender.
export const OC_LIMIT = 1249125;
export const BASE_LIMIT_2026 = 832750;
export const MORTGAGES = [
  { id: "conv", family: "Conventional", name: "Conventional 30-year fixed", down: "3% to 5% for first-time buyers, 20% to skip mortgage insurance", credit: 620, minDown: 3, maxLoan: BASE_LIMIT_2026, residency: "all",
    mi: "Private mortgage insurance under 20% down. It can be removed once you reach 20% equity.", who: "Most buyers with steady income and decent credit.",
    pros: "Mortgage insurance can come off. Open to work visa holders who are lawfully present.", cons: "Needs better credit than FHA for the best price.",
    pairs: ["Santa Ana My First Home", "Garden Grove", "My Anaheim Home", "County MAP"], certainty: "verified", url: "https://selling-guide.fanniemae.com/sel/b2-2-02/non-us-citizen-borrower-eligibility-requirements" },
  { id: "hb", family: "Conventional", name: "High-balance conventional", down: "5% or more", credit: 620, minDown: 5, minLoan: BASE_LIMIT_2026 + 1, maxLoan: OC_LIMIT, residency: "all",
    mi: "Private mortgage insurance under 20% down.", who: "Loans from $832,751 to $1,249,125, the Orange County limit for 2026.",
    pros: "Lets you borrow more without a jumbo loan.", cons: "Priced slightly higher than a standard conventional loan.",
    pairs: [], certainty: "verified", url: "https://www.fhfa.gov/news/news-release/fhfa-announces-conforming-loan-limit-values-for-2026" },
  { id: "homeready", family: "Conventional", name: "HomeReady (Fannie Mae) or Home Possible (Freddie Mac)", down: "3%", credit: 620, minDown: 3, maxLoan: OC_LIMIT, residency: "all", incomeCap: 110880,
    mi: "Reduced mortgage insurance. Price add-ons waived.", who: "Income at or below 80% of the area median for the home's location (about $110,900 in Orange County; check the tract).",
    pros: "Cheaper than standard conventional at 3% down.", cons: "Income limit is low for Orange County. Homebuyer education if all buyers are first-time.",
    pairs: ["CalHFA MyHome (with a CalHFA loan)", "City deferred loans"], certainty: "verified", url: "https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/homeready-mortgage" },
  { id: "jumbo", family: "Conventional", name: "Jumbo loan", down: "Often 10% to 20%", credit: 700, minDown: 10, minLoan: OC_LIMIT + 1, residency: "all",
    mi: "Usually none; lenders ask for more down instead.", who: "Loans above $1,249,125.",
    pros: "No loan size cap.", cons: "Tighter credit, more cash and more reserves. Each lender sets its own rules.",
    pairs: [], certainty: "general", url: null },
  { id: "fha", family: "Government", name: "FHA loan", down: "3.5% with a 580 score", credit: 580, minDown: 3.5, maxLoan: OC_LIMIT, residency: "green",
    mi: "Upfront and yearly mortgage insurance; with under 10% down it usually lasts the life of the loan.", who: "Buyers with lower credit scores or small down payments.",
    pros: "Easiest credit rules. Pairs with CalHFA and Chenoa help.", cons: "Since May 2025, citizens and green card holders only. Insurance hard to remove.",
    pairs: ["CalHFA MyHome", "Chenoa Fund", "GSFA Platinum"], certainty: "verified", url: "https://www.hud.gov/news/hud-no-26-084" },
  { id: "va", family: "Government", name: "VA loan", down: "0%", credit: 0, minDown: 0, maxLoan: null, residency: "vet",
    mi: "No monthly mortgage insurance. A one-time funding fee, waived for some veterans.", who: "Veterans, service members and some surviving spouses.",
    pros: "No down payment and no monthly insurance.", cons: "Only for eligible service. Lenders set their own credit minimum.",
    pairs: ["GSFA Platinum"], certainty: "general", url: "https://www.va.gov/housing-assistance/home-loans/" },
  { id: "usda", family: "Government", name: "USDA rural loan", down: "0%", credit: 0, minDown: 0, maxLoan: null, residency: "green", rural: true,
    mi: "Upfront and yearly guarantee fees.", who: "Homes in USDA-eligible rural areas, with income limits.",
    pros: "No down payment.", cons: "Almost no eligible areas in Orange County. Check the address on the USDA map.",
    pairs: [], certainty: "general", url: "https://eligibility.sc.egov.usda.gov/" },
  { id: "calhfa", family: "State", name: "CalHFA first loan (conventional or FHA)", down: "3% to 3.5%, help can cover it", credit: 680, minDown: 0, maxLoan: OC_LIMIT, residency: "green", firstTime: true, incomeCap: 274000,
    mi: "As for conventional or FHA.", who: "First-time buyers with income up to $274,000 in Orange County.",
    pros: "Unlocks MyHome (3% to 3.5% deferred) and the Zero Interest Program.", cons: "Citizens and qualified aliens only (green card, not work visas). Rate can be higher than market.",
    pairs: ["CalHFA MyHome", "Zero Interest Program", "Dream For All (when open)"], certainty: "verified", url: "https://www.calhfa.ca.gov/homeownership/programs/index.htm" },
  { id: "gsfa", family: "State", name: "GSFA Platinum first loan", down: "Help of up to 5% of the loan (5.5% FHA)", credit: 640, minDown: 3, maxLoan: BASE_LIMIT_2026, residency: "all", incomeCap: 204300,
    mi: "As for conventional or FHA.", who: "Buyers anywhere in California, first-time or not, income up to $204,300 in Orange County (2025 table).",
    pros: "Not limited to first-time buyers. The conventional version can fit work visa holders (confirm).", cons: "The help is a 15-year loan with payments. GSFA sets the rate and no discount points.",
    pairs: ["Its own 5% second loan"], certainty: "verified", url: "https://gsfahome.org/programs/dpa/platinum.shtml" },
  { id: "nonqm", family: "Special", name: "Bank-statement loan (non-QM)", down: "Often 10% to 20%", credit: 620, minDown: 10, maxLoan: null, residency: "all", selfEmployed: true,
    mi: "Usually none; priced into the rate.", who: "Self-employed buyers whose tax returns show less income than the business earns.",
    pros: "Uses 12 to 24 months of bank deposits instead of tax returns.", cons: "Higher rate and fees. Rules vary by lender. Compare with a standard loan first.",
    pairs: [], certainty: "general", url: null },
  { id: "arm", family: "Special", name: "Adjustable rate (5/6 or 7/6 ARM)", down: "As for the loan type", credit: 620, minDown: 3, maxLoan: null, residency: "all",
    mi: "As for the loan type.", who: "Buyers who expect to move or refinance within the fixed period.",
    pros: "Lower starting rate for 5 or 7 years.", cons: "The payment can rise after the fixed period. Qualify at the higher rate.",
    pairs: [], certainty: "general", url: null },
  { id: "buydown", family: "Special", name: "Seller-paid rate buydown (2-1)", down: "As for the loan type", credit: 620, minDown: 3, maxLoan: null, residency: "all",
    mi: "As for the loan type.", who: "Buyers in a market where sellers offer credits.",
    pros: "Lower payments in years 1 and 2, paid by the seller's credit.", cons: "The full rate applies from year 3. You qualify at the full rate.",
    pairs: [], certainty: "general", url: null },
];
