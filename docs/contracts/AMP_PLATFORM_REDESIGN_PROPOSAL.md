# AMP Platform Redesign Proposal

Date: 2026-03-16

## 1. Deployment Confirmation

### 1.1 Current deployment state verified

- Live public environment audited: `https://amppattaya.com`
- Live VPS host reachable in read-only mode: `flowbiz-vps`
- Latest deployed telemetry on VPS:
  - `target_sha`: `dd0d93e0b2186b6b3fef80c0ef11fde2046f32cd`
  - `deploy_status`: `ok`
  - smoke: `healthz=200`, `properties=200`, `projects=200`, `admin_login=200`
- Current local `main` HEAD during audit:
  - `5864a900a29a57921100b08c8ab652dde6b0fb15`

### 1.2 Safe deployment result

No new deployment was executed from the current workstation.

Reason:

1. no staging target is defined in the repository or deployment docs
2. the existing deploy script is coupled to the active production path and production `.env`
3. using the same VPS with alternate ports would still reuse the production environment and database context, so it is not a safe temporary target
4. local temporary deployment could not be created from this machine because Docker is not installed

Conclusion:

- production was not modified during this audit
- the real V1 behavior was audited against the currently deployed system instead
- there is now a verified deployment drift between current `main` and live production

## 2. V1 Runtime Audit

### 2.1 Route validation summary

Verified live routes and observed behavior:

| Surface | Route | Result | Notes |
| --- | --- | --- | --- |
| Home | `/en` | `200` | loads normally |
| Buy / property listing | `/en/buy` | `200` | loads with filters, listings, advisory CTA |
| Property detail | `/en/property/riviera-jomtien-2br-high-floor` | `200` | loads, but routes users into broken tool surfaces |
| Project detail | `/en/projects/the-riviera-jomtien` | `200` | loads, but data gaps are visible in the deep review block |
| Admin login | `/login` | `200` | loads normally |
| Admin dashboard shell | `/admin/dashboard` | `200` | locked shell loads, sign-in required |
| Shortlist | `/en/shortlist` | `404` | broken public route on live runtime |
| Buying cost estimator | `/en/buying-cost-estimator` | `404` | broken public route on live runtime |
| Compare | `/en/compare` | `200` | page render fails in browser due chunk loading error |
| Investment | `/en/investment` | `200` | loads normally |
| Invest | `/en/invest` | `200` | loads normally |
| Investor | `/en/investor` | loads in content fetch | overlapping investment surface |
| Foreign-buyer page | `/en/european` | `200` | loads normally |

Observed edge/public API behavior:

| Endpoint | Result | Notes |
| --- | --- | --- |
| `/api/health` | `404` | route exists in current repo but not on live runtime |
| `/api/ping` | `404` | route exists in current repo but not on live runtime |
| `/api/v1/properties?limit=3` | `200` | returns property payloads |
| `/api/v1/shortlists/current?...` | `404` | shortlist product layer not live on current deployment |

### 2.2 Runtime routes inventory

Routes actively shaping the live V1 experience:

- advisory homepage: `/en`
- inventory discovery: `/en/buy`, `/en/projects`, `/en/property/[slug]`, `/en/projects/[slug]`
- investment/advisory content: `/en/invest`, `/en/investment`, `/en/investor`
- foreign-buyer guidance: `/en/european`
- admin shell: `/login`, `/admin/dashboard`

Routes present in current repo but not active on the audited live system:

- `/en/shortlist`
- `/en/shortlist/shared/[shareToken]`
- `/en/buying-cost-estimator`
- `/api/health`
- `/api/ping`
- `/api/v1/shortlists/*`

### 2.3 Broken flows

1. shortlist journey is broken end-to-end on live V1
   - the public shortlist page returns `404`
   - the shortlist API owner route returns `404`
   - listing and project surfaces now point users toward a product layer that is not actually deployed

2. buying-cost-estimator journey is broken on live V1
   - the dedicated estimator route returns `404`
   - current repo treats this as a route owner for a new tool, but live production does not carry it

3. compare is not operational even though the route returns `200`
   - browser content reports a chunk loading failure for the compare page asset
   - this is runtime asset drift, not just content-level degradation

4. property and project pages send users into broken or fragmented tool routes
   - property detail promotes `/calculator` and `/compare`
   - project detail promotes `/calculator` and `/compare`
   - compare is broken live, and estimator ownership is split between old calculator and new estimator concepts

5. deployment parity is broken
   - current repo contains public routes and health endpoints that are not live
   - current live build SHA does not match local `main`

### 2.4 Performance and UI consistency observations

Observed response times were generally acceptable for basic HTML delivery:

- `/en`: about `0.39s`
- `/en/buy`: about `0.30s`
- `/en/investment`: about `0.27s`
- `/en/european`: about `0.27s`
- `/en/property/...`: about `0.27s`
- `/en/projects/...`: about `0.30s`

However, user-facing reliability is weaker than the timing suggests:

1. route status is not a reliable indicator of usable UX
   - compare returns `200` but is unusable
   - admin dashboard returns `200` but only as a locked shell until sign-in

2. repetitive advisory blocks create UI sameness across distinct surfaces
   - buy, invest, investment, investor, european, project detail, and property detail all reuse similar hero, proof-bar, CTA, and lead-form patterns

3. route-level identity is diluted
   - investment content is split across multiple pages with overlapping promises and near-identical handoff patterns
   - the foreign-buyer page behaves like another advisory landing page instead of a distinct governed module

### 2.5 Data gaps seen in live V1

1. project deep review surfaces show explicit missing data
   - `ROI snapshot missing`
   - `Area statistics missing`
   - `Cover image missing`

2. live property API samples contain thin content fields
   - `description` often `null`
   - `title_i18n` and `description_i18n` often `null`
   - listing enrichment appears incomplete relative to the advisory framing around those listings

3. tool-ready product state is inconsistent with real data availability
   - compare depends on project evaluation snapshots
   - project pages visibly acknowledge missing evaluation data
   - shortlist depends on project resolution from property items and a live shortlist API, neither of which is fully operational in production today

## 3. Structural Audit

### 3.1 Routing

#### Real route ownership today

- public localized site routes are owned by `admin-app/app/(site)/[locale]`
- admin routes are owned by `admin-app/app/admin/*`
- middleware adds locale routing and excludes `/api/*`, `/admin/*`, and selected non-localized paths
- current repo is almost entirely app-router based, with `pages/500.tsx` as a compatibility remnant

#### Route conflicts and architectural issues

There is no simple app-router vs pages-router conflict, but there is a more serious product-routing conflict:

1. runtime route ownership and deployment ownership are out of sync
   - repo says shortlist and buying-cost-estimator are active routes
   - live production does not serve them

2. route taxonomy around investment is fragmented
   - `/invest`
   - `/investment`
   - `/investor`
   - `/european`

These routes are not just SEO aliases. They behave as overlapping advisory entry surfaces with similar CTA logic and similar component structure.

3. roadmap governance conflicts with runtime reality
   - status matrix says market intelligence and foreign buyer hub are V2 roadmap-only modules
   - live V1 already exposes multiple investment and foreign-buyer guidance routes
   - this creates planning confusion about what is actually V1 baseline versus V2 expansion

### 3.2 Data flow

#### Property data flow

- server-rendered public pages fetch properties and projects through `admin-app/app/_lib/public-api-server.ts`
- public pages depend on `/api/v1/*` proxy-style access and SSR revalidation
- project compare and deep review depend on `/v1/projects/{id}/evaluation`

#### Shortlist persistence

- shortlist owner identity is created in browser `localStorage`
- shortlist state is cached in browser `localStorage`
- live shortlist behavior then depends on `/api/v1/shortlists/current*`
- compare readiness is resolved by re-fetching each shortlisted property to derive project ids

This means shortlist is not a clean module boundary. It is a browser-owned state layer that must re-resolve server truth through multiple endpoints.

#### Estimator usage

- legacy investment calculator uses query-string handoff into compare/contact
- new buying-cost-estimator uses another query-state contract and another route owner
- current live V1 still behaves around `/calculator`
- current repo introduces a second tool owner for buyer-side financial estimation

This creates split ownership between a yield tool and a buying-cost tool without a stable decision-tools shell.

#### Compare surfaces

- compare depends on `ids` in query state
- shortlist is expected to generate those ids indirectly from shortlisted property items
- calculator also feeds compare through query state

Compare is therefore a convergence route for three upstream flows:

1. calculator
2. shortlist
3. project selection

That convergence is currently brittle because the route is not independently dependable in production.

#### Market intelligence data

- investment-style pages are largely content/advisory driven
- project deep review and area statistics expose partial market signals
- there is no single market-intelligence module boundary in the current runtime

Current state: market intelligence is partly content, partly project evaluation snapshot, partly investment messaging.

### 3.3 UI architecture

#### Page shells

- public routes share one strong advisory shell pattern
- admin routes share a separate admin shell

This keeps consistency, but it also causes over-coupling:

1. too many route types inherit the same conversion framing
2. tool routes, knowledge routes, and catalog routes do not look sufficiently distinct in purpose

#### Surface boundaries

Current surface boundaries are blurred:

- catalog surfaces also act as funnel surfaces
- knowledge surfaces also act as funnel surfaces
- tool surfaces also act as funnel handoff surfaces

The result is that every page tries to do discovery, explanation, qualification, and contact escalation at once.

#### Component reuse

Reuse quality is technically strong, but product meaning is weak.

The reuse pattern currently optimizes for visual consistency more than domain separation.

### 3.4 Advisor funnel

#### Entry points discovered

Advisor entry points are embedded across:

- home
- buy
- property detail
- project detail
- invest
- investment
- investor
- european
- calculator
- compare

#### Contact surfaces and decision-support layers

The platform is strongly coupled to the advisor funnel:

1. project and property pages frame next steps around contact escalation
2. calculator is designed to carry a brief into compare or advisor handoff
3. shortlist text explicitly preserves separation from CRM, but still points toward advisor contact
4. investment pages behave more like advisory qualification pages than neutral information modules

Conclusion:

the advisor funnel currently owns too much of the public information architecture.

## 4. V1 Design Problems

### 4.1 Architectural weaknesses

1. deployment parity is not governed as a platform contract
2. public route availability is drifting from repo intent
3. decision tools do not have a stable product boundary
4. data contracts are too distributed across query strings, SSR fetches, and browser cache

### 4.2 Routing conflicts

1. route taxonomy is fragmented across `invest`, `investment`, `investor`, and `european`
2. route ownership in code and route availability in production are not aligned
3. canonical V1 versus V2 surface boundaries are unclear in runtime reality

### 4.3 Advisory funnel coupling

1. nearly every surface funnels into contact
2. catalog, knowledge, and tools are all framed as advisory handoff layers
3. the platform lacks neutral product modules that can stand independently of the funnel

### 4.4 Duplicated surfaces

1. `invest` and `investment` overlap heavily
2. `investment` and `investor` overlap in promise and user journey
3. `buy` and `european` overlap on foreign-buyer guidance
4. `calculator` and `buying-cost-estimator` split decision-tool ownership

### 4.5 UI fragmentation

1. many pages look structurally similar despite different jobs
2. users are sent into broken next-step routes from otherwise healthy pages
3. live pages expose tool promises that the live deployment cannot keep

### 4.6 Module boundaries that should be redesigned

1. public catalog
2. decision tools
3. knowledge and market context
4. advisory handoff and CRM bridge
5. release and deployment health

## 5. Proposed Architecture Improvements

### 5.1 New module boundaries

#### A. Catalog module

Owns:

- `/buy`
- `/rent`
- `/projects`
- `/property/[slug]`
- `/projects/[slug]`
- `/areas/[slug]`

Responsibilities:

- inventory discovery
- property/project detail
- area and listing context
- neutral product facts first

#### B. Decision tools module

Owns:

- `/compare`
- `/calculator`
- `/buying-cost-estimator`
- `/shortlist`

Responsibilities:

- shortlist state
- compare state
- calculator state
- estimator state
- stable handoff contracts into advisor flow

Design rule:

tool routes must be operationally self-contained and deploy-parity guarded before being linked from catalog routes.

#### C. Knowledge and market context module

Owns:

- investment guidance
- foreign-buyer guidance
- ownership explainers
- market interpretation content

Recommended route target:

- choose one canonical investment route
- keep others as redirects only
- do not treat persona pages as separate product modules unless they have distinct data, journey, and governance

#### D. Advisory handoff module

Owns:

- `/contact`
- advisor CTA contract
- lead payload normalization
- CRM handoff logic

Rule:

other public modules may pass context into this module, but must not each define their own funnel behavior semantics.

#### E. Platform health and release module

Owns:

- deployment telemetry
- release parity checks
- runtime route health contracts
- public/admin operational smoke contracts

### 5.2 Revised route ownership

Recommended canonical ownership:

| Current state | Proposed canonical owner |
| --- | --- |
| `/buy`, `/rent`, `/projects`, `/property/*`, `/areas/*` | Catalog |
| `/compare`, `/calculator`, `/buying-cost-estimator`, `/shortlist` | Decision tools |
| `/invest`, `/investment`, `/investor` | consolidate into one canonical knowledge route |
| `/european` | either fold into knowledge module or replace later with governed `/foreign-buyer` route |
| `/contact` | advisory handoff owner |
| `/admin/*` | admin operations |

Canonical simplification recommendation:

1. keep one canonical investment route
2. turn the other investment-like routes into redirects with tracking only
3. do not ship a dedicated foreign-buyer hub until its governed content model is ready

### 5.3 Revised roadmap ordering

#### Phase 0: Release parity and broken-surface recovery

1. restore deploy parity between repo and live environment
2. make compare operational on production
3. either deploy shortlist fully or remove all public links to it until ready
4. either deploy buying-cost-estimator fully or keep calculator as the sole owner temporarily
5. expose public health endpoints consistently or remove them from repo/runtime expectations

#### Phase 1: Route consolidation

1. collapse overlapping investment routes into one canonical route
2. decide whether foreign-buyer guidance remains embedded in existing pages or becomes a future dedicated module
3. remove dead-end CTA paths from project and property pages

#### Phase 2: Decision tools boundary extraction

1. define stable shortlist contract
2. define stable compare contract
3. define stable estimator/calculator ownership model
4. define advisor handoff payload once, not per page family

#### Phase 3: Continue V2 selectively

Only after phases 0 to 2 are stable should new roadmap modules continue.

## 6. Which V1 Parts Should Be Refactored

Refactor immediately:

1. compare production asset and route contract
2. shortlist route and shortlist API contract
3. calculator versus buying-cost-estimator ownership
4. project/property CTA wiring into tool routes
5. investment route taxonomy
6. deployment parity governance and runtime smoke coverage

Refactor next:

1. project deep review data completeness contract
2. market/evaluation snapshot ownership
3. public health endpoint governance

## 7. Which V2 Modules Should Be Postponed

Postpone until V1 parity is restored:

1. dedicated foreign buyer hub module
2. dedicated market intelligence module
3. broader saved-shortlist productization beyond basic route recovery
4. AI matching
5. deal room / document vault
6. any new public decision-support surfaces that depend on the current broken tool chain

## 8. Governance Recommendation

### Option A

Refactor V1 surfaces before continuing roadmap.

Pros:

- lowest architectural ambiguity
- strongest platform baseline

Cons:

- likely slows momentum more than required
- risks turning recovery work into open-ended redesign

### Option B

Freeze V1 and continue V2 modules.

Pros:

- keeps roadmap velocity high in the short term

Cons:

- unsafe
- current V1 runtime already has broken decision-support routes and deploy drift
- new V2 work would stack on an unreliable public tool chain

### Option C

Perform hybrid refactor plus roadmap.

Recommended interpretation:

1. freeze new public-surface expansion temporarily
2. refactor only the broken V1 platform layers first
3. resume only those V2 items that do not deepen route or tool fragmentation

### Safest recommendation

Recommended option: `Option C`

Why this is the safest practical strategy:

1. it fixes the real operational risks first
   - broken compare
   - missing shortlist
   - missing estimator route
   - deploy parity drift

2. it avoids a false choice between total redesign and blind roadmap continuation

3. it establishes a stable platform contract before new modules create more route and data coupling

Operational rule for the next phase:

- no new public V2 surface should ship until Phase 0 route parity and broken-flow recovery are complete

## 9. Final Conclusion

The actual deployed V1 is not a clean closed baseline.

It is a partially healthy advisory/catalog runtime with a broken decision-tools layer and a verified mismatch between live production and current repository state.

The redesign priority is therefore not visual refresh first.

The redesign priority is:

1. restore deployment parity
2. separate catalog, tools, knowledge, and funnel ownership
3. consolidate route taxonomy
4. continue roadmap work only after those boundaries are stable