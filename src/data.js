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
