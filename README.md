# The Affordable Home Initiative, by OCMEE Design

**OCMEED:** Orange County Mortgage, Education and Equity, by Design.

> For a nonprofit finance lead, city housing analyst or donor: shows whether one affordable Orange County home pencils, which help stacks, and what is still missing, with every number sourced or labelled ASSUMPTION.

**Team:** [team name]
**Members:** [names]
**Lane:** 3 Fund it
**Built at:** Claude Impact Lab: UCI × SoCal Affordable Housing, November 7, 2026

## The real user

A finance lead at a small housing nonprofit (made-up for this demo) has a home that costs more to deliver than the family can pay. Today she builds the funding stack by hand in a spreadsheet, looking up each program's income limits, city rules and status one by one, and rebuilds it every time rates move.

**Before:** a hand-built spreadsheet, income tables of unknown date, no clear line between money that is signed and money that is hoped for.
**After:** one page that prices the home at the legal cap, shows which buyer programs apply in that city at that income, separates confirmed from unconfirmed money, and shows how the gap moves with the rate and what a gift closes.

## What we built

A static web page in three tabs, no server, no accounts, no data leaves the browser.

**1. Ready (a family, or the counselor with them).** Six short lessons on how buying works, what lenders look at and what can break a deal. A check of household size, income, debts, rent, city, residency and first-time status: the income group from HCD's 2026 table, which programs may fit and why, the price they could pay with and without deferred help, a Habitat for Humanity of OC check against its published criteria, and next steps. Then "How a lender sees this family": personal tips on debt-to-income, credit score tiers, cash needed and steady income, each with a number to aim for.

**2. Together (a nonprofit or city).**

1. **The home:** cost lines from the lane's example deal (ASSUMPTION), plus a schedule-slip slider that adds holding costs per month.
2. **The family:** the legal affordable housing cost by income group (H&SC 50052.5) from HCD's 2026 Orange County income limits, turned into a price at the Freddie Mac rate.
3. **City levers and Build Days:** land offered, fees waived, delay, and a planner for sweat-equity hours.
   Program ideas a city or nonprofit can start, each with the lever it pulls, a checked Orange County example or a note that none was verified, and a first step.
4. **The stack:** buyer programs (CalHFA MyHome, Santa Ana, Garden Grove, Anaheim, County MAP, Dream For All) checked against city and income, each card saying how much it would close. Project funds marked confirmed or unconfirmed.
5. **Rates:** the gap at 5% to 9%, and what the move from 7.40% (8 Oct) to 7.18% (5 Nov) did.
**3. Give (donors, businesses and pillars of the community).** What a gift pays for, line by line, share of the gap and homes closed per $1 million. Ways to give time, professional skills, materials and money, and a pledge planner that shows what a pledge does. Honest tax notes, and giving kept apart from investing.

**Sources and assumptions,** under every tab: every source with its status and date.

Scenarios M01, M02 and M03 from the lane load with one click.

Example, all defaults (3-bed home, lower-income family of 4, 7.18%): the family can pay **$296,385**. The home costs **$535,000** (ASSUMPTION). Gap before help: **$238,615**. In Santa Ana, the city's deferred loan would close about **$105,445** of it.

**Demo video:** [uploaded on the hub]
**Live demo:** https://theahome.ocmeed.com

## How Claude is used

- Built with Claude Code: research of program pages, the engine, tests and the page.
- The tool itself runs no AI. All numbers come from a tested calculator, so the same inputs always give the same answer. A person checks every program rule against its source before relying on it.

## Try it

No install needed. Any modern browser. Fonts: Montserrat under the SIL Open Font License (see `fonts/README.md`).

```bash
git clone https://github.com/OcMee/close-the-gap-oc.git
cd close-the-gap-oc
python -m http.server 8000
# open http://localhost:8000
```

Run the tests (Node.js 18 or newer, no packages):

```bash
node --test tests/gap.test.mjs
```

No environment variables and no keys. There is nothing to put in a `.env` file.

## Sources and assumptions

| Item | Source or assumption | Date checked |
|---|---|---|
| Orange County income limits by household size (median, 50%, 80%, 120%) | HCD 2026 State Income Limits, revised memo 23 June 2026 | 2026-11-07 |
| Affordable housing cost: 30% of 50% (very low), 30% of 70% (lower), 35% of 110% (moderate) of median; household size = bedrooms + 1 | California H&SC 50052.5. Formula read; exceptions not all reviewed | 2026-11-07 |
| 30-year rate 7.18% (5 Nov 2026), 7.40% (8 Oct 2026) | Freddie Mac via FRED MORTGAGE30US | 2026-11-07 |
| CalHFA MyHome: 3% conventional, 3.5% FHA, income cap $274,000 | CalHFA program sheet and income limits effective 30 June 2026 | 2026-11-07 |
| Dream For All: up to 20%, max $150,000; closed after the 2026 lottery round | CalHFA press release 2026 | 2026-11-07 |
| Santa Ana My First Home: up to $120,000 at 0%, 80% of median only | City of Santa Ana page; some terms from an older city source | 2026-11-07 |
| Garden Grove: $110,000 to 80%, $50,000 to 120% | City of Garden Grove page; funding status not published | 2026-11-07 |
| My Anaheim Home: $50,000 at 1%, income to 150% of median | City of Anaheim FY2026 flyer | 2026-11-07 |
| County MAP: up to $80,000 or 20% of price, listed cities only | County MAP application package 5 May 2026 | 2026-11-07 |
| Cost lines $360,000 / $85,000 / $40,000 / $50,000 | ASSUMPTION, lane 3 synthetic example deal | |
| Public subsidy $100,000, rent while waiting $55,000 | ASSUMPTION, lane 3 synthetic example deal | |
| Down 3%, tax 1.1%, insurance 0.35%, mortgage insurance 0.5% a year, HOA $0 | ASSUMPTION | |
| Holding cost $7,083 a month | ASSUMPTION ($85,000 over 12 months) | |
| Ready budget: 30% of gross income | ASSUMPTION for any one family | |
| Habitat OC income range, debts under 10%, sweat-equity hours | habitatoc.org review-qualifications and your-partnership pages | 2026-11-07 |
| City land and fee levers | ASSUMPTION, no city offer confirmed | |
| Gift tax notes | IRS Publications 526 and 561, Form 8283 | 2026-11-07 |

Every number we made up is labelled ASSUMPTION here and in the tool.

## What is real and what is mocked

| Part | Status |
|---|---|
| Income limits, legal price formula, rate, program rules | Working, real public data |
| Cost of the home | Mocked: the lane's synthetic deal, editable |
| Public subsidy and rent amounts | Mocked: lane's synthetic deal, editable |
| Whether programs combine | Not modelled. Shown as a question to ask |
| County MAP city list | Partly: 5 of the 14 cities plus unincorporated areas |
| Spanish and Vietnamese | Not built |

## Where it gets things wrong

- It assumes buyer programs stack. In reality each caps total borrowing, and the lender and city decide.
- It prices at the top of each income group, the way the statute caps price. A family below the cap may need a lower price.
- Deferred help is modelled as fully replacing first-loan dollars. Programs that require monthly payments (for example GSFA's repayable second) are not included.
- Program status changes. Garden Grove's funding status and several citizenship rules are unknown.
- The statute has exceptions we did not review. Confirm the formula with the funding program.

## Next steps

- A city view: counts of nearly ready households by city, never names.
- Program combination rules from each city, added as data.
- Spanish and Vietnamese.
- A shared JSON of sources so other lanes' tools can plug in (see `src/data.js`).

## Data and privacy

This project uses only public or provided data. It contains no personal information about real tenants, buyers or residents. It does not file applications or contact any city or person. The families and donors in `docs/story.md` are made up.

## License

MIT, see the LICENSE file.
