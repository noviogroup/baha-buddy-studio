import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_ELEUTHERA_SIGNATURE_PLACE_EVIDENCE === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextStableReviewAt = '2026-11-03'
const outputPath = '/private/tmp/baha-buddy-eleuthera-signature-place-evidence-plan.json'
const destinationId = 'dest-eleuthera'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

const sourceIds = {
  islandProfile: 'research-source-bmot-eleuthera-harbour-island',
  marineArrival: 'research-source-bmot-eleuthera-marine-arrival',
  publicMap: 'research-source-bmot-public-map-dataset',
  mediaBoundary: 'research-source-bmot-brand-center-media-boundary',
  glassTourism: 'research-source-bmot-glass-window-bridge',
  glassWorks: 'research-source-mow-glass-window-bridge-traffic-advisory-2026',
  glassProcurement: 'research-source-opm-glass-window-bridge-procurement-2026',
  pinkSands: 'research-source-bmot-pink-sands-beach',
  pineappleIdentity: 'research-source-bmot-eleuthera-pineapple-fields-identity',
  ladyDiFarm: 'research-source-bmot-lady-di-pineapple-farm-2026',
  spanishWells: 'research-source-bmot-spanish-wells-community-access',
  eleutheraFerry: 'research-source-operator-bahamas-ferries-eleuthera-route-2026',
}

const placeIds = {
  glass: 'drafts.place-supabase-6c704b3f-daa4-45ff-aaaf-dadc4e9cb404',
  pinkSands: 'drafts.place-supabase-dd04a350-1850-4858-8141-113c1a4a8eb0',
}

const supabaseIds = {
  glass: '6c704b3f-daa4-45ff-aaaf-dadc4e9cb404',
  pinkSands: 'dd04a350-1850-4858-8141-113c1a4a8eb0',
  pineappleResort: '39503352-89e1-4b1a-85d3-04544ca8f52f',
}

const candidateIds = {
  pineapple: 'drafts.canonical-place-candidate-eleuthera-harbour-island-pineapple-fields',
  spanishWells: 'drafts.canonical-place-candidate-eleuthera-harbour-island-spanish-wells',
}

const factIds = {
  glass: 'drafts.island-fact-matched-signature-readiness-glass-window-bridge-eleuthera-harbour-island',
  pinkSands: 'drafts.island-fact-matched-signature-readiness-pink-sands-beach-eleuthera-harbour-island',
  pineapple: 'drafts.island-fact-signature-identity-readiness-pineapple-fields-eleuthera-harbour-island',
  spanishWells: 'drafts.island-fact-signature-identity-readiness-spanish-wells-eleuthera-harbour-island',
  publicCopy: 'drafts.island-fact-pink-sands-public-copy-evidence-boundary-eleuthera-harbour-island',
}

const auditIds = {
  catalog: 'drafts.island-research-audit-2026-08-05-signature-place-catalog-eleuthera-harbour-island',
  locations: 'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-eleuthera-harbour-island',
  candidates: 'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-eleuthera-harbour-island',
  identity: 'drafts.island-research-audit-2026-08-05-signature-place-identity-readiness-eleuthera-harbour-island',
  matched: 'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-eleuthera-harbour-island',
  content: 'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-eleuthera-harbour-island',
  freshness: 'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-eleuthera-harbour-island',
  publicCopy: 'drafts.island-research-audit-2026-08-05-public-copy-conflicts-eleuthera-harbour-island',
}

const articleBaseId = 'article-hardcoded-pink-sand-harbour-island'
const articleDraftId = `drafts.${articleBaseId}`

const urls = {
  glassTourism: 'https://www.bahamas.com/natural-wonders/glass-window-bridge',
  glassWorks: 'https://mowbahamas.com/api/announcements',
  glassProcurement: 'https://opm.gov.bs/prime-minister-davis-budget-debate-contribution-2026-2027/',
  pinkSands: 'https://www.bahamas.com/natural-wonders/harbour-island-pink-sand-beach',
  islandProfile: 'https://www.bahamas.com/plan-your-trip/island-faq/eleuthera-harbour-island/getting-around',
  ladyDiFarm: 'https://www.bahamas.com/plan-your-trip/things-to-do/lady-dis-pineapple-farm',
  ferry: 'https://bahamasferries.com/your-travel/',
}

function loadEnv(filePath) {
  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    values[match[1]] = value
  }
  return values
}

function plainText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
}

async function fetchPage(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  if (!response.ok) throw new Error(`Official source failed: ${url} (${response.status})`)
  return plainText(await response.text())
}

function signals(text, patterns) {
  return Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, pattern.test(text)]))
}

function reference(id, key = id.replace(/[^a-z0-9]+/gi, '-').slice(0, 90)) {
  return {_type: 'reference', _key: key, _ref: id}
}

function references(ids, prefix) {
  return [...new Set(ids)].map((id, index) => reference(id, `${prefix}-${index + 1}`))
}

function mergeReferences(current = [], ids, prefix) {
  const byId = new Map(current.filter((item) => item?._ref).map((item) => [item._ref, item]))
  for (const [index, id] of [...new Set(ids)].entries()) if (!byId.has(id)) byId.set(id, reference(id, `${prefix}-${index + 1}-${id.replace(/[^a-z0-9]+/gi, '-').slice(-40)}`))
  return [...byId.values()]
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter((key) => !['_rev', '_updatedAt', '_createdAt'].includes(key) && value[key] !== undefined).sort().map((key) => [key, comparable(value[key])]))
  return value
}

function differs(current, planned) {
  return JSON.stringify(comparable(current)) !== JSON.stringify(comparable(planned))
}

function reviewPlan({cadenceDays, relationship, reviewScope, nextAction, triggers = ['publisher_url_or_scope_change']}) {
  return {
    _type: 'researchSourceReviewPlan',
    plannedAt: checkedAt,
    reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: 'scheduled',
    freshnessStatus: 'current',
    cadenceBand: cadenceDays === 30 ? '30_day' : '90_day',
    cadenceDays,
    sourceRelationship: relationship,
    verificationMethod: 'webpage_review',
    changeTriggers: triggers,
    reviewScope,
    nextAction,
  }
}

function block(key, text, style = 'normal') {
  return {_type: 'block', _key: key, style, markDefs: [], children: [{_type: 'span', _key: `${key}-span`, text, marks: []}]}
}

function linkedBlock(key, before, linkText, href, after) {
  return {
    _type: 'block', _key: key, style: 'normal',
    markDefs: [{_type: 'link', _key: `${key}-link`, href}],
    children: [
      {_type: 'span', _key: `${key}-before`, text: before, marks: []},
      {_type: 'span', _key: `${key}-linked`, text: linkText, marks: [`${key}-link`]},
      {_type: 'span', _key: `${key}-after`, text: after, marks: []},
    ],
  }
}

const [glassTourismText, glassWorksText, glassProcurementText, pinkSandsText, islandProfileText, ladyDiText, ferryText] = await Promise.all([
  fetchPage(urls.glassTourism),
  fetchPage(urls.glassWorks),
  fetchPage(urls.glassProcurement),
  fetchPage(urls.pinkSands),
  fetchPage(urls.islandProfile),
  fetchPage(urls.ladyDiFarm),
  fetchPage(urls.ferry),
])

const sourceSignals = {
  glassTourism: signals(glassTourismText, {identity: /Glass Window Bridge/i, atlanticAndBight: /Atlantic Ocean[\s\S]{0,300}Bight of Eleuthera/i}),
  glassWorks: signals(glassWorksText, {identity: /Glass Window Bridge/i, laneRestriction: /single[- ]lane traffic/i, foundationWork: /foundation work/i}),
  glassProcurement: signals(glassProcurementText, {procurement: /90\.6 million procurement/i, newBridge: /new Glass Window Bridge/i}),
  pinkSands: signals(pinkSandsText, {identity: /PINK SAND BEACH/i, easternSide: /eastern Atlantic Ocean side/i, length: /three plus miles/i, foraminifera: /Foraminifera/i, wetSand: /wet sand at the water['’]s edge/i}),
  islandProfile: signals(islandProfileText, {harbourBoatOnly: /Accessible only by boat or ferry/i, spanishWells: /short ferry ride[\s\S]{0,100}St\. George['’]s Cay/i, pineappleFields: /Pineapple Fields, Forever/i}),
  ladyDi: signals(ladyDiText, {identity: /Lady Di['’]s Pineapple Farm/i, tours: /called upon to give pineapple tours/i, contact: /335\s*-\s*5006/i, gregoryTown: /Gregory Town/i}),
  ferry: signals(ferryText, {route: /Spanish Wells\s*&\s*Harbour Island/i, nassau: /Depart Nassau/i, spanishWells: /Arrive Spanish Wells/i, harbourIsland: /Arrive Harbour Island/i, changeBoundary: /Holidays and special events will override this schedule/i}),
}
if (Object.values(sourceSignals).flatMap((group) => Object.values(group)).some((value) => !value)) throw new Error(`Official source signals changed: ${JSON.stringify(sourceSignals)}`)

const publicArticlePath = path.join(workspaceRoot, 'bahabuddy-web', 'src', 'lib', 'article-content.ts')
const publicArticleSource = fs.readFileSync(publicArticlePath, 'utf8')
const publicCopySignals = {
  fixedHotelPrice: /\$600-1500\/night/.test(publicArticleSource),
  fixedCartPrices: /\$80\/day[\s\S]{0,100}\$120/.test(publicArticleSource),
  timingGuarantee: /arrive at the beach by 7:30am/.test(publicArticleSource),
  transportAbsolute: /There['’]s no other way to do it/.test(publicArticleSource),
  populationClaim: /about 2,000 residents/.test(publicArticleSource),
  namedVenueRecommendations: /Pink Sands Resort[\s\S]{0,300}Romora Bay/.test(publicArticleSource),
}
if (Object.values(publicCopySignals).some((value) => !value)) throw new Error(`Public-copy signals changed: ${JSON.stringify(publicCopySignals)}`)

const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web', '.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')
const supabaseSelect = 'id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified'
const supabaseRows = []
for (const id of Object.values(supabaseIds)) {
  const response = await fetch(`${supabaseUrl}/rest/v1/places?select=${supabaseSelect}&id=eq.${id}`, {headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`}})
  if (!response.ok) throw new Error(`Supabase signature-place query failed for ${id}: ${response.status}`)
  supabaseRows.push(...await response.json())
}
const spanishResponse = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,island_id&name=eq.${encodeURIComponent('Spanish Wells')}`, {headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`}})
if (!spanishResponse.ok) throw new Error(`Supabase Spanish Wells query failed: ${spanishResponse.status}`)
const spanishRows = await spanishResponse.json()
const supabaseById = new Map(supabaseRows.map((row) => [row.id, row]))

const allSourceIds = [...new Set(Object.values(sourceIds))]
const allFactIds = Object.values(factIds)
const allAuditIds = Object.values(auditIds)
const live = await client.fetch(`{
  "sources": *[_id in $sourceIds]{...},
  "places": *[_id in $placeIds]{...},
  "candidates": *[_id in $candidateIds]{...},
  "facts": *[_id in $factIds]{...},
  "audits": *[_id in $auditIds]{...},
  "articleDraft": *[_id == $articleDraftId][0]{...},
  "articlePublished": *[_id == $articleBaseId][0]{...},
  "routedSourceIds": *[_type == "researchSource" && references($destinationId)]._id,
  "publishedFacts": count(*[_type == "islandFact" && !(_id in path("drafts.**"))]),
  "eleutheraFactChannels": count(*[_type == "islandFact" && _id in path("drafts.**") && destination._ref == $destinationId && count(channels) > 0])
}`, {
  sourceIds: allSourceIds,
  placeIds: Object.values(placeIds),
  candidateIds: Object.values(candidateIds),
  factIds: allFactIds,
  auditIds: allAuditIds,
  articleDraftId,
  articleBaseId,
  destinationId,
})

const sourceById = new Map(live.sources.map((source) => [source._id, source]))
const placeById = new Map(live.places.map((place) => [place._id, place]))
const candidateById = new Map(live.candidates.map((candidate) => [candidate._id, candidate]))
const factById = new Map(live.facts.map((fact) => [fact._id, fact]))
const auditById = new Map(live.audits.map((audit) => [audit._id, audit]))
for (const id of Object.values(placeIds)) if (!placeById.has(id)) throw new Error(`Missing place review: ${id}`)
for (const id of Object.values(candidateIds)) if (!candidateById.has(id)) throw new Error(`Missing candidate review: ${id}`)
for (const id of Object.values(factIds).filter((id) => id !== factIds.publicCopy)) if (!factById.has(id)) throw new Error(`Missing fact: ${id}`)
for (const id of Object.values(auditIds).filter((id) => id !== auditIds.publicCopy)) if (!auditById.has(id)) throw new Error(`Missing audit: ${id}`)
if (!live.articlePublished) throw new Error(`Missing published article: ${articleBaseId}`)

const destinationReference = reference(destinationId, 'destination-eleuthera-harbour-island')
const newSources = [
  {
    _id: sourceIds.glassWorks, _type: 'researchSource',
    title: 'Glass Window Bridge — current Ministry of Works traffic advisory', url: urls.glassWorks,
    publisher: 'Bahamas Ministry of Works & Family Island Affairs', sourceClass: 'government', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['access', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current Ministry portal advisory stating that single-lane traffic is in effect on the temporary Glass Window Bridge while foundation work proceeds for the new permanent structure. This is volatile road-operation evidence, not a safe stopping point, parking approval, construction schedule, accessibility statement, or guarantee of passage during weather events.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck the exact Eleuthera traffic advisory, lane state, work phase, dates, detours, weather restrictions, and any superseding notice.', nextAction: 'Verify the live road and lane state before routing; separately confirm any legal and safe visitor stopping area.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  {
    _id: sourceIds.glassProcurement, _type: 'researchSource',
    title: 'Glass Window Bridge — 2026 government procurement status', url: urls.glassProcurement,
    publisher: 'Office of the Prime Minister, The Bahamas', sourceClass: 'government', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['access', 'safety', 'overview'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Dated June 17, 2026 official statement that procurement for a new Glass Window Bridge was concluded. It establishes a live infrastructure-change context but not construction completion, current passability, a visitor point, parking, safe pedestrian exposure, or accessibility.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck procurement, construction start, phasing, completion, traffic impacts, and responsible Ministry notices.', nextAction: 'Pair project status with the current Ministry traffic advisory; do not use a budget statement as live route clearance.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change']}),
  },
  {
    _id: sourceIds.ladyDiFarm, _type: 'researchSource',
    title: "Lady Di's Pineapple Farm — current official listing", url: urls.ladyDiFarm,
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['culture', 'experiences', 'access', 'food'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official listing for a specific Gregory Town farmer, publishing a telephone and describing pineapple tours on some occasions. It is a component/operator lead within Eleuthera’s broader pineapple identity, not proof that “Pineapple Fields” is one attraction or that tours, harvest, tasting, hours, access, safety, accessibility, or photography are guaranteed.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck the named farmer, telephone, location, tour wording, season qualifier, and any responsible operator route.', nextAction: 'Confirm directly through a Board-approved workflow before recommending a visit; preserve the farm-versus-distributed-identity boundary.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change']}),
  },
  {
    _id: sourceIds.eleutheraFerry, _type: 'researchSource',
    title: 'Bahamas Ferries — Eleuthera passenger route snapshot', url: urls.ferry,
    publisher: 'Bahamas Ferries', sourceClass: 'transport_operator', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['access', 'safety', 'accessibility'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current responsible-operator page publishing a Nassau–Spanish Wells–Harbour Island passenger service and explicitly warning that holidays and special events override the schedule. Exact times and fares are volatile and are not copied into traveler-facing facts. The page does not complete local dock transfers, weather disruption, assistance, accessible boarding, mobility-device, restroom, or emergency evidence.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck route, vessel, operating days, check-in, ports, holiday overrides, weather notices, fares, policies, and accessibility assistance.', nextAction: 'Verify the traveler date and exact dock-to-dock itinerary with the operator before delivery; keep local transfer and accessibility checks separate.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
]

const sourceUpdates = {
  [sourceIds.glassTourism]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current national-tourism identity page for Glass Window Bridge. It does not resolve the two official map points, select a safe visitor stop, or establish current road operation. Separate 2026 government sources show a replacement project and a temporary single-lane traffic advisory, so every routing and stopping claim must be rechecked against live Ministry notices.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck identity and geographic context, then compare the responsible Ministry project and traffic notices.', nextAction: 'Keep the point conflict open and verify live lane state, stopping legality, wave/weather exposure, barriers, emergency response, and accessibility.'}),
  },
  [sourceIds.pinkSands]: {
    url: urls.pinkSands, checkedAt, nextReviewAt: nextStableReviewAt,
    notes: 'Current official natural-wonder page identifying Pink Sands Beach on Harbour Island’s eastern Atlantic side, describing a three-plus-mile length, approximate width, Foraminifera context, and stronger pink coloration in wet sand at the water’s edge. It does not substantiate fixed hotel or cart prices, a best time guarantee, a public entrance, swimming conditions, facilities, emergency response, responsible site operation, accessibility, or a point-level location.',
    reviewPlan: reviewPlan({cadenceDays: 90, relationship: 'official_context_publisher', reviewScope: 'Recheck identity, extent, sand explanation, contact block, and any access or condition wording.', nextAction: 'Keep stay prices, transport rates, named recommendations, timing guarantees, population, public entrance, safety, and accessibility out of copy unless separately supported.'}),
  },
  [sourceIds.pineappleIdentity]: {
    checkedAt, nextReviewAt: nextStableReviewAt,
    notes: 'Current official story about one Eleuthera pineapple farmer and the island’s distributed agricultural identity. A separate current listing for Lady Di’s farm publishes a telephone and describes occasional tours, but it does not turn all “Pineapple Fields” into one attraction or make the similarly named condo-hotel canonical. Participants, appointments, season, access, biosecurity, safety, accessibility, photography, and commercial relationships remain separate.',
    reviewPlan: reviewPlan({cadenceDays: 90, relationship: 'official_context_publisher', reviewScope: 'Recheck the distributed pineapple identity and distinguish every named farmer, farm, festival, hotel, and visitor experience.', nextAction: 'Use a collection or area model unless an exact responsible farm visit is separately verified.'}),
  },
  [sourceIds.spanishWells]: {
    url: urls.islandProfile, checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official island content identifying Spanish Wells as a town on St. George’s Cay reached by a short ferry from mainland Eleuthera. A separate current Bahamas Ferries source establishes one Nassau–Spanish Wells–Harbour Island service with an explicit schedule-change boundary. Neither source defines one canonical community point, all local ferries, dock transfers, disruption fallback, public facilities, emergency contacts, or accessibility.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck community identity, St. George’s Cay relationship, ferry context, and any superseding access page.', nextAction: 'Keep Spanish Wells area-based and verify the exact responsible operator, docks, traveler date, local transfers, conditions, assistance, and emergency fallback.'}),
  },
}

const sourcePlans = newSources.map((source) => ({source, needsUpdate: differs(sourceById.get(source._id), source)}))
const sourceUpdatePlans = Object.entries(sourceUpdates).map(([id, fields]) => {
  const current = sourceById.get(id)
  if (!current) throw new Error(`Missing existing source: ${id}`)
  return {id, fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields)}
})

const glass = placeById.get(placeIds.glass)
const pinkSands = placeById.get(placeIds.pinkSands)
const placeFields = {
  [placeIds.glass]: {
    active: false, channels: [], catalogReviewStatus: 'location_blocked',
    evidenceSources: mergeReferences(glass.evidenceSources, [sourceIds.glassTourism, sourceIds.glassWorks, sourceIds.glassProcurement, sourceIds.publicMap, sourceIds.islandProfile], 'eleuthera-pilot-source'),
    catalogLocationReview: {
      ...glass.catalogLocationReview,
      checkedAt,
      evidenceSources: references([sourceIds.publicMap, sourceIds.glassTourism, sourceIds.glassWorks, sourceIds.glassProcurement], 'location-source'),
      operationEvidenceStatus: 'current_managing_authority', accessEvidenceStatus: 'current_responsible_source', reviewDecision: 'pending',
      notes: 'The tourism map still supplies two same-name points about 220 metres apart and neither is accepted as the canonical visitor point. Current government evidence shows an active replacement project and a temporary single-lane traffic restriction during foundation work. That establishes volatile road context, not a safe stopping point, parking approval, pedestrian route, accessibility, or weather clearance. Confirm the exact intended point and live Ministry advisory before any canonical or routing decision.',
    },
    catalogTravelerReadinessReview: {
      ...glass.catalogTravelerReadinessReview,
      checkedAt, nextReviewAt: nextOperationalReviewAt,
      responsibleSourceStatus: 'current_government_authority', operationStatus: 'current_responsible_operation', accessStatus: 'partial_official_context', safetyStatus: 'specific_hazard_context',
      sources: references([sourceIds.glassWorks, sourceIds.glassProcurement, sourceIds.glassTourism, sourceIds.publicMap, sourceIds.islandProfile], 'source'),
      notes: 'The Ministry currently publishes a single-lane traffic restriction while foundation work proceeds, and the OPM records the replacement procurement. The map-point conflict remains. Before routing or recommending a stop, verify the live lane and road state, work zone, weather and overtopping risk, barriers, legal stopping and parking, pedestrian exposure, emergency response, accessibility, and the exact point purpose.',
    },
    catalogReviewNotes: 'Current responsible government evidence confirms an active bridge replacement and temporary traffic restriction, increasing the need for a live route check. It does not resolve the two official map points or approve a visitor stop. Keep this review inactive, channel-free, location-blocked, and delivery-blocked.',
    reviewedAt: checkedAt,
  },
  [placeIds.pinkSands]: {
    active: false, channels: [], catalogReviewStatus: 'exact_candidate',
    evidenceSources: mergeReferences(pinkSands.evidenceSources, [sourceIds.pinkSands, sourceIds.islandProfile, sourceIds.marineArrival, sourceIds.eleutheraFerry], 'eleuthera-pilot-source'),
    catalogTravelerReadinessReview: {
      ...pinkSands.catalogTravelerReadinessReview,
      checkedAt, nextReviewAt: nextOperationalReviewAt,
      sources: references([sourceIds.pinkSands, sourceIds.islandProfile, sourceIds.marineArrival, sourceIds.eleutheraFerry], 'source'),
      notes: 'Current official evidence supports the Harbour Island identity, eastern Atlantic side, approximate extent, sand explanation, and boat/ferry island access. It does not approve the Supabase point as a public entrance, define the beach segment, publish swimming conditions, or substantiate fixed stay/cart prices, named recommendations, a best-time guarantee, facilities, emergency response, accessibility, or media rights. Verify each for the traveler date before delivery.',
    },
    catalogReviewNotes: 'The current point remains an unverified exact-name Supabase candidate. Current official evidence strengthens identity and description only; it does not establish a public entrance or safe route. Keep inactive and channel-free while the public-copy conflict, access, conditions, accessibility, media, and point decision remain open.',
    reviewedAt: checkedAt,
  },
}
const placePlans = Object.entries(placeFields).map(([id, fields]) => ({id, current: placeById.get(id), fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, placeById.get(id)[key]])), fields)}))

const pineapple = candidateById.get(candidateIds.pineapple)
const spanishWells = candidateById.get(candidateIds.spanishWells)
const candidateFields = {
  [candidateIds.pineapple]: {
    identityEvidence: mergeReferences(pineapple.identityEvidence, [sourceIds.islandProfile, sourceIds.pineappleIdentity, sourceIds.ladyDiFarm], 'eleuthera-pilot-source'),
    locationReview: {...pineapple.locationReview, checkedAt, evidenceSources: references([sourceIds.islandProfile, sourceIds.pineappleIdentity, sourceIds.ladyDiFarm], 'location-source'), notes: 'The signature identity remains distributed agricultural and cultural context. Lady Di’s current official farm listing is a specific component/operator lead in Gregory Town, not a point for all Pineapple Fields and not the similarly named condo-hotel. No area, farm, entrance, or coordinate is accepted.'},
    travelerReadinessReview: {...pineapple.travelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt, responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'partial_official_context', sources: references([sourceIds.islandProfile, sourceIds.pineappleIdentity, sourceIds.ladyDiFarm], 'source'), notes: 'Official tourism identifies Eleuthera’s pineapple heritage and one named Gregory Town farm, publishing a telephone and describing tours on some occasions. That is not a guaranteed schedule or open-access attraction. Confirm the exact farm, responsible host, appointment, season and harvest, land permission, access, biosecurity, food and farm safety, accessibility, photography, commercial relationship, cancellation, and whether a collection is the correct canonical model.'},
    reviewedAt: checkedAt,
    reviewNotes: 'Keep the distributed Pineapple Fields identity separate from Lady Di’s specific farm and Pineapple Fields Resort. The specific farm is a research lead only; no catalog record, coordinate, operation, visit, media, or delivery is approved.',
  },
  [candidateIds.spanishWells]: {
    identityEvidence: mergeReferences(spanishWells.identityEvidence, [sourceIds.islandProfile, sourceIds.spanishWells, sourceIds.publicMap, sourceIds.eleutheraFerry], 'eleuthera-pilot-source'),
    locationReview: {...spanishWells.locationReview, checkedAt, evidenceSources: references([sourceIds.islandProfile, sourceIds.spanishWells, sourceIds.publicMap, sourceIds.eleutheraFerry], 'location-source'), accessEvidenceStatus: 'current_responsible_source', notes: 'Spanish Wells remains a community on St. George’s Cay. The related Spanish Wells Beach point cannot stand in for the settlement. Bahamas Ferries currently publishes one passenger route serving Spanish Wells, but a route and dock do not define the community geometry or canonical point. No coordinate is accepted.'},
    travelerReadinessReview: {...spanishWells.travelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt, responsibleSourceStatus: 'current_responsible_operator', accessStatus: 'partial_official_context', sources: references([sourceIds.islandProfile, sourceIds.spanishWells, sourceIds.marineArrival, sourceIds.eleutheraFerry], 'source'), notes: 'Current tourism evidence supports the community identity and ferry context; Bahamas Ferries publishes one Nassau–Spanish Wells–Harbour Island passenger route and warns that holidays and special events override its schedule. Verify the traveler date, exact operator and docks, local mainland transfer, fares, check-in, weather disruption, baggage, assistance, accessibility, public facilities, local transport, emergency contacts, and fallback before delivery.'},
    reviewedAt: checkedAt,
    reviewNotes: 'The community remains absent from the current Supabase places query. The beach pin remains related-site evidence only and the passenger route does not authorize a point or catalog write. Keep the candidate blocked and channel-free.',
  },
}
const candidatePlans = Object.entries(candidateFields).map(([id, fields]) => ({id, current: candidateById.get(id), fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, candidateById.get(id)[key]])), fields)}))

const factFields = {
  [factIds.glass]: {title: 'Glass Window Bridge: current project, traffic, point, and visitor-stop boundary', topic: 'safety', claim: 'Current government sources establish an active replacement project and a Ministry single-lane traffic restriction during foundation work. National tourism supports the identity, while its map still supplies two same-name points about 220 metres apart. None of these sources approves a canonical visitor point or safe stopping area.', travelerGuidance: 'Before routing, verify the live Ministry advisory, lane and road state, construction phase, weather and overtopping risk, barriers, legal stopping and parking, pedestrian exposure, emergency response, accessibility, and exact point purpose.', sources: references([sourceIds.glassWorks, sourceIds.glassProcurement, sourceIds.glassTourism, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', editorNotes: 'Government infrastructure and lane-state evidence strengthens the block; it does not accept either tourism point, approve a stop, or guarantee passage.', channels: []},
  [factIds.pinkSands]: {title: 'Pink Sands Beach: identity, extent, sand, access, and public-copy boundary', topic: 'access', claim: 'Current national tourism identifies Pink Sands Beach on Harbour Island’s eastern Atlantic side, describes a three-plus-mile extent and approximate width, explains the Foraminifera contribution, and says the pink stands out more in wet sand at the water’s edge. Harbour Island is boat- or ferry-accessed. These sources do not substantiate the current guide’s fixed prices, timing guarantees, transport absolutes, named venue recommendations, population claim, or a public entrance and swimming conditions.', travelerGuidance: 'Verify the exact public entrance and beach segment, responsible route, current transport and stay options, prices, conditions, facilities, emergency response, accessibility, and media rights for the traveler date. Use the corrective article draft for editorial review.', sources: references([sourceIds.pinkSands, sourceIds.islandProfile, sourceIds.marineArrival, sourceIds.eleutheraFerry], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', editorNotes: 'Identity and bounded natural-history claims are source-backed. Point, entrance, conditions, prices, named recommendations, media, and delivery remain unapproved.', channels: []},
  [factIds.pineapple]: {title: 'Pineapple Fields: distributed identity and specific-farm boundary', topic: 'culture', claim: 'Official tourism supports Eleuthera’s distributed pineapple heritage and separately lists Lady Di’s Pineapple Farm in Gregory Town, with a telephone and occasional-tour wording. The specific farm, the broad Pineapple Fields identity, and Pineapple Fields Resort are distinct entities.', travelerGuidance: 'Do not merge the resort or one farm into the island-wide identity. Confirm the exact host and farm, appointment, season, access, land permission, biosecurity, safety, accessibility, photography, commercial terms, and canonical collection model before recommendation.', sources: references([sourceIds.islandProfile, sourceIds.pineappleIdentity, sourceIds.ladyDiFarm], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', editorNotes: 'The specific farm listing is a component lead, not a canonical-coordinate decision or guaranteed operation.', channels: []},
  [factIds.spanishWells]: {title: 'Spanish Wells: community identity and current passenger-route boundary', topic: 'access', claim: 'National tourism identifies Spanish Wells as a community on St. George’s Cay reached by ferry from mainland Eleuthera. Bahamas Ferries currently publishes one Nassau–Spanish Wells–Harbour Island route and warns that holidays and special events override the schedule. The related Spanish Wells Beach point is not the community coordinate.', travelerGuidance: 'Keep the community area-based. Verify the exact responsible operator, traveler date, docks and transfers, schedule, fares, check-in, weather disruption, baggage, assistance, accessibility, facilities, local transport, emergency contacts, and fallback.', sources: references([sourceIds.islandProfile, sourceIds.spanishWells, sourceIds.marineArrival, sourceIds.eleutheraFerry], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', editorNotes: 'Current route evidence does not authorize a canonical point or represent every local ferry.', channels: []},
  [factIds.publicCopy]: {_id: factIds.publicCopy, _type: 'islandFact', title: 'Pink Sands public guide: supported claims and prohibited carry-forward claims', destination: destinationReference, topic: 'overview', claim: 'Current official sources support the Pink Sands Beach identity, eastern Atlantic setting, approximate extent, Foraminifera explanation, wet-sand color context, and boat/ferry access to Harbour Island. They do not substantiate the published guide’s fixed hotel and golf-cart prices, best-time guarantee, transport absolute, named venue recommendations, population claim, universal walking or swimming suitability, public entrance, or current operational details.', travelerGuidance: 'Use the prepared corrective draft. Keep stays, transport, prices, schedules, conditions, public access, safety, accessibility, and venue recommendations tied to accountable current sources and runtime verification.', sources: references([sourceIds.pinkSands, sourceIds.islandProfile, sourceIds.eleutheraFerry], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', editorNotes: 'This channel-free fact documents a live public-copy conflict. It does not alter the published article or approve the corrective draft.', channels: []},
}
const factPlans = Object.entries(factFields).map(([id, fields]) => {
  const current = factById.get(id)
  const planned = current ? {...current, ...fields} : fields
  return {id, current, fields, planned, needsUpdate: current ? differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields) : true}
})

const auditSourceAdditions = {
  [auditIds.catalog]: [sourceIds.glassTourism, sourceIds.glassWorks, sourceIds.glassProcurement, sourceIds.pinkSands, sourceIds.ladyDiFarm, sourceIds.eleutheraFerry],
  [auditIds.locations]: [sourceIds.glassWorks, sourceIds.glassProcurement, sourceIds.publicMap],
  [auditIds.candidates]: [sourceIds.ladyDiFarm, sourceIds.eleutheraFerry],
  [auditIds.identity]: [sourceIds.ladyDiFarm, sourceIds.eleutheraFerry],
  [auditIds.matched]: [sourceIds.glassWorks, sourceIds.glassProcurement, sourceIds.pinkSands, sourceIds.eleutheraFerry],
  [auditIds.content]: [sourceIds.glassWorks, sourceIds.glassProcurement, sourceIds.pinkSands, sourceIds.ladyDiFarm, sourceIds.eleutheraFerry],
  [auditIds.freshness]: [...live.routedSourceIds, ...newSources.map((source) => source._id)],
}

const gapActions = {
  [auditIds.catalog]: {
    '1 matched signature-place row fails the location gate': 'Glass Window Bridge remains point-blocked. Preserve both official map candidates and verify the exact intended point against live Ministry road, construction, weather, stopping, pedestrian, emergency, and accessibility evidence.',
    '2 matched signature-place candidates remain unverified and not launch-ready': 'Keep Glass Window Bridge and Pink Sands Beach inactive and channel-free. Complete point or entrance, operation/access, conditions, safety, accessibility, copy, media-rights, and editorial gates before any delivery.',
    '2 official signature-place identities are absent from the canonical catalog': 'Keep Pineapple Fields and Spanish Wells as controlled area/community candidates. Do not merge Pineapple Fields Resort, Lady Di’s specific farm, or Spanish Wells Beach into the broader identities.',
  },
  [auditIds.locations]: {
    'Official signature-place coordinate conflict remains unresolved': 'Do not choose between the two Glass Window Bridge points. Current construction and single-lane traffic make live responsible-authority confirmation of the route, stop, and point purpose essential.',
  },
  [auditIds.candidates]: {
    'Canonical-place decision pending: Pineapple Fields': 'Preserve the distributed agricultural identity. Treat Lady Di’s farm as one specific component lead and Pineapple Fields Resort as a distinct hotel; choose a collection/area model only through a reviewed canonical workflow.',
    'Canonical-place decision pending: Spanish Wells': 'Preserve Spanish Wells as a community on St. George’s Cay. The beach pin and one ferry route are related access evidence, not a community point; choose an area/community model through a reviewed canonical workflow.',
  },
  [auditIds.identity]: {
    'Identity-readiness delivery gate remains blocked: Pineapple Fields': 'Confirm exact participating farms or hosts, appointment and season, land permission, visitor access, biosecurity, food and farm safety, accessibility, photography, commercial relationship, and collection model.',
    'Identity-readiness delivery gate remains blocked: Spanish Wells': 'Verify the exact operator and docks for the traveler date, local transfers, schedules, fares, weather disruption, assistance, accessibility, community facilities, transport, emergency contacts, and fallback.',
  },
  [auditIds.matched]: {
    'Matched signature-place traveler delivery remains blocked: Glass Window Bridge': 'Recheck the live Ministry traffic advisory and confirm the point, route, construction phase, lane and road state, weather and overtopping risk, barriers, legal stopping and parking, pedestrian exposure, emergency response, accessibility, copy, and media.',
    'Matched signature-place traveler delivery remains blocked: Pink Sands Beach': 'Confirm the intended public entrance and beach segment, land and shoreline access, current transport and stays, conditions, facilities, emergency response, accessibility, copy, media, and a point-level decision. Remove unsupported prices, timing, venue, population, and transport claims from public copy.',
  },
}

const auditPlans = Object.entries(auditSourceAdditions).map(([id, additions]) => {
  const current = auditById.get(id)
  const actions = gapActions[id] || {}
  const gaps = (current.gaps || []).map((gap) => actions[gap.title] ? {...gap, action: actions[gap.title], status: gap.status === 'resolved' ? 'resolved' : 'researching'} : gap)
  for (const title of Object.keys(actions)) if (!gaps.some((gap) => gap.title === title)) throw new Error(`Missing target gap in ${id}: ${title}`)
  const sources = mergeReferences(current.sources, additions, 'eleuthera-pilot-source')
  const addition = ' The Eleuthera pilot now records current bridge construction and traffic evidence, a specific pineapple-farm lead, a bounded current ferry route, and a Pink Sands public-copy conflict. These improve evidence quality but do not approve a coordinate, Supabase write, price, provider or venue recommendation, media, or delivery.'
  const methodologyNotes = current.methodologyNotes?.includes('The Eleuthera pilot now records') ? current.methodologyNotes : `${current.methodologyNotes || ''}${addition}`.trim()
  return {id, current, gaps, sources, methodologyNotes, needsUpdate: differs(current.gaps, gaps) || differs(current.sources, sources) || current.methodologyNotes !== methodologyNotes}
})

const publicCopyAudit = {
  _id: auditIds.publicCopy, _type: 'islandResearchAudit',
  title: 'Eleuthera & Harbour Island public-copy conflict review — 2026-08-05', destination: destinationReference,
  auditedAt: checkedAt, nextAuditAt: nextOperationalReviewAt, owner: 'Baha Buddy Content Operations', status: 'researching', overallScore: 1.5,
  coverage: [
    ['overview', 2, 'Official identity and bounded natural-history evidence is strong, while the live guide contains unsupported operational claims.'],
    ['access', 2, 'Current official and operator access context exists, but exact transfers, entrance, schedules, conditions, and accessibility remain live checks.'],
    ['stays', 1, 'The live guide names properties and fixed price ranges without current accountable support.'],
    ['food', 1, 'Named dining recommendations in the live guide are not reviewed by this evidence set.'],
    ['experiences', 1, 'Golf-cart, snorkeling, fishing, and venue claims require exact current responsible sources.'],
    ['nature', 3, 'The current official Pink Sands page supports the beach identity, extent, and Foraminifera explanation within its stated scope.'],
    ['culture', 1, 'Population and social-scene claims are not supported by the reviewed official evidence.'],
    ['seasonality', 1, 'Best-time and high-season language is not established as a current guarantee.'],
    ['safety', 1, 'The reviewed sources do not establish swimming conditions, a public entrance, emergency response, or universal suitability.'],
    ['accessibility', 0, 'No responsible feature-level accessibility evidence was established for the beach, transfers, carts, or named venues.'],
  ].map(([topic, score, finding]) => ({_type: 'researchCoverageScore', _key: `coverage-${topic}`, topic, score, evidenceCount: 0, finding})),
  gaps: [
    {_type: 'researchGap', _key: 'gap-eleuthera-pink-sands-public-copy-conflict', topic: 'overview', priority: 'p0', title: 'Published Pink Sands public copy contains unsupported prices, timing, transport, venue, and population claims', action: 'Review the prepared corrective Sanity draft against current official and responsible sources. Remove fixed hotel and cart prices, best-time guarantees, transport absolutes, named recommendations, population claims, and any access, condition, or suitability claim without accountable evidence before publishing.', status: 'researching'},
    {_type: 'researchGap', _key: 'gap-eleuthera-pink-sands-runtime-planning', topic: 'experiences', priority: 'p1', title: 'Pink Sands stays, transport, entrance, conditions, and accessibility remain runtime-only', action: 'For the traveler date, verify current stays and rates, licensed transport, ferry and local transfers, public entrance, swimming and weather conditions, facilities, emergency response, accessibility, cancellation, and media rights.', status: 'researching'},
  ],
  sources: references([sourceIds.pinkSands, sourceIds.islandProfile, sourceIds.marineArrival, sourceIds.eleutheraFerry], 'source'),
  methodologyNotes: 'This review compares the currently published imported Sanity article and hardcoded web fallback with current official and responsible-operator evidence. It prepares a safer draft but does not alter or unpublish the live document, select a stay or venue, approve a price, copy media, enable a channel, or authorize traveler delivery.',
}
const publicCopyAuditNeedsUpdate = differs(auditById.get(auditIds.publicCopy), publicCopyAudit)

const articleDraft = {
  _id: articleDraftId, _type: 'article',
  title: 'Pink Sands Beach on Harbour Island: a source-backed planning guide',
  slug: {_type: 'slug', current: 'pink-sand-harbour-island'},
  excerpt: 'What current official sources establish about Pink Sands Beach—and the transport, access, conditions, stays, and accessibility details to verify for your dates.',
  body: [
    block('pink-sands-intro', 'Pink Sands Beach lies along Harbour Island’s eastern Atlantic side. Current national-tourism information describes a beach stretching for more than three miles, but the practical visit still depends on your route, public access point, conditions, accommodation, and mobility needs.'),
    block('pink-sands-established', 'What current official sources establish', 'h2'),
    linkedBlock('pink-sands-official', 'The ', 'current official Pink Sands Beach page', urls.pinkSands, ' describes the beach’s approximate length and width and explains that Foraminifera contribute to its pale-pink sand. It says the pink color stands out more in wet sand at the water’s edge.'),
    block('pink-sands-color-boundary', 'Light, tide, weather, and camera settings can change how the color appears. Treat the official description as context, not a guarantee of a particular photograph or a “best” hour.'),
    block('pink-sands-getting-there', 'Getting to Harbour Island', 'h2'),
    linkedBlock('pink-sands-island-access', 'The ', 'official island overview', urls.islandProfile, ' says Harbour Island is accessible only by boat or ferry. A current operator page publishes one Nassau–Spanish Wells–Harbour Island service and warns that holidays and special events can override its schedule.'),
    block('pink-sands-route-checks', 'Verify the exact airport or ferry route, docks, check-in, local transfer, luggage rules, weather disruption, assistance, total price, and cancellation terms for your dates. Do not rely on an old fare or assume one service covers every itinerary.'),
    block('pink-sands-beach-plan', 'Planning the beach visit', 'h2'),
    block('pink-sands-beach-checks', 'Confirm the intended public entrance and beach segment, current swimming and weather conditions, facilities, supervision, emergency response, and any help needed for mobility, sensory, medical, or family requirements. An island description does not establish that every access path or beach condition suits every traveler.'),
    block('pink-sands-stays', 'Stays, carts, and dining', 'h2'),
    block('pink-sands-stays-checks', 'Compare current bookable stays and licensed local transport for your dates. Verify the total rate, taxes, availability, location, cancellation, cart or transfer terms, accessibility, and the current operation of any restaurant or activity before choosing. This guide deliberately does not preserve fixed price ranges or rank named venues.'),
    block('pink-sands-not-carried', 'Claims deliberately not carried forward', 'h2'),
    block('pink-sands-not-carried-body', 'This draft does not promise a best time of day, say that everyone must rent a golf cart, publish fixed hotel or cart prices, estimate the population, or recommend named hotels, restaurants, bars, snorkeling, fishing, or nightlife without a current responsible source. Those claims can change or require a narrower evidence scope.'),
  ],
  category: 'travel_guide', relatedDestination: destinationReference, readTimeMinutes: 5,
  buddyPrompt: 'Help me plan Pink Sands Beach on Harbour Island. Compare current routes, stays, local transport, total prices, public access, conditions, cancellation, safety, and accessibility for my dates and party.',
  planningSummary: 'Pink Sands Beach is on Harbour Island’s eastern Atlantic side; Harbour Island requires boat or ferry access. Use current official identity context, then verify the exact route, transfers, stay, price, public entrance, conditions, facilities, emergency response, accessibility, and cancellation at planning time.',
  channels: ['web', 'mobile', 'buddy'], publishedAt: live.articlePublished.publishedAt, reviewedAt: checkedAt, featured: false, order: live.articlePublished.order ?? 99,
  source: {_type: 'contentSource', system: 'web_source', sourcePath: 'src/lib/article-content.ts', sourceKey: 'pink-sand-harbour-island', ownership: 'sanity_canonical', importedAt: live.articlePublished.source?.importedAt, notes: 'Review-only corrective draft prepared from current official and responsible-operator evidence. It removes unsupported fixed prices, timing guarantees, transport absolutes, named recommendations, population, and unverified access or suitability claims. The published article and hardcoded fallback remain unchanged until separate editorial approval and release.'},
  tags: ['beaches', 'review-required'],
  seo: {_type: 'seo', metaTitle: 'Pink Sands Beach on Harbour Island: planning guide', metaDescription: 'Plan Pink Sands Beach with current route, public-access, conditions, stays, transport, safety, and accessibility checks.'},
  evidenceSources: references([sourceIds.pinkSands, sourceIds.islandProfile, sourceIds.marineArrival, sourceIds.eleutheraFerry], 'evidence-source'),
  editorialReviewStatus: 'ready_for_review',
  editorialReviewNotes: 'The live imported article and hardcoded fallback contain claims not supported by the current evidence set. Review this corrective draft, verify any stay, transport, venue, price, condition, access, safety, and accessibility claim separately, select rights-cleared media, and publish only through the normal editorial release process.',
}
const articleDraftNeedsUpdate = differs(live.articleDraft, articleDraft)

const prospectivePlaces = placePlans.map((plan) => ({...plan.current, ...plan.fields}))
const prospectiveCandidates = candidatePlans.map((plan) => ({...plan.current, ...plan.fields}))
const prospectiveFacts = factPlans.map((plan) => plan.planned)
const prospectiveAudits = [...auditPlans.map((plan) => ({...plan.current, gaps: plan.gaps, sources: plan.sources, methodologyNotes: plan.methodologyNotes})), publicCopyAudit]
const trackedP0Titles = new Set(['Published Pink Sands public copy contains unsupported prices, timing, transport, venue, and population claims', ...Object.values(gapActions).flatMap((actions) => Object.keys(actions))])
const openP0Statuses = new Set(['open', 'researching'])
const guardrails = {
  allOfficialSignalsPresent: Object.values(sourceSignals).flatMap((group) => Object.values(group)).every(Boolean),
  allPublicCopySignalsPresent: Object.values(publicCopySignals).every(Boolean),
  exactSupabaseRowsLoaded: supabaseRows.length === 3 && Object.values(supabaseIds).every((id) => supabaseById.has(id)),
  spanishWellsStillAbsentFromSupabasePlaces: spanishRows.length === 0,
  glassStillLacksUsablePoint: supabaseById.get(supabaseIds.glass)?.latitude == null && supabaseById.get(supabaseIds.glass)?.longitude == null,
  pineappleResortRemainsDistinct: supabaseById.get(supabaseIds.pineappleResort)?.name === 'Pineapple Fields Resort' && candidateFields[candidateIds.pineapple].reviewNotes.includes('separate'),
  pinkSandsPointRemainsUnverified: supabaseById.get(supabaseIds.pinkSands)?.is_verified === false && placeFields[placeIds.pinkSands].catalogReviewStatus === 'exact_candidate',
  allContentTargetsRemainDrafts: [...prospectivePlaces, ...prospectiveCandidates, ...prospectiveFacts, ...prospectiveAudits, articleDraft].every((document) => document._id.startsWith('drafts.')),
  allFourPlaceReviewsRemainBlocked: [...prospectivePlaces.map((place) => place.catalogTravelerReadinessReview), ...prospectiveCandidates.map((candidate) => candidate.travelerReadinessReview)].every((review) => review?.deliveryDecision === 'blocked' && review?.overallStatus === 'blocked'),
  placeOverlaysRemainInactiveAndChannelFree: prospectivePlaces.every((place) => place.active === false && (place.channels || []).length === 0),
  noAcceptedCoordinateDecision: [...prospectivePlaces.map((place) => place.catalogLocationReview).filter(Boolean), ...prospectiveCandidates.map((candidate) => candidate.locationReview)].every((review) => review?.reviewDecision !== 'accepted'),
  factsRemainSourceVerifiedDraftsWithoutChannels: prospectiveFacts.every((fact) => fact.verificationStatus === 'source_verified' && (fact.channels || []).length === 0 && fact.sources?.length >= 2),
  correctiveArticleRemainsDraftAndPublishedArticleUntouched: articleDraft._id === articleDraftId && live.articlePublished._id === articleBaseId,
  existingPortfolioHasNoPublishedResearchFacts: live.publishedFacts === 0,
  existingEleutheraFactsHaveNoDeliveryChannels: live.eleutheraFactChannels === 0,
  everyTrackedP0RemainsOpen: prospectiveAudits.flatMap((audit) => audit.gaps || []).filter((gap) => trackedP0Titles.has(gap.title)).every((gap) => gap.priority !== 'p0' || openP0Statuses.has(gap.status)),
}
if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const plan = {
  generatedAt: new Date().toISOString(), output: outputPath, mode: apply ? 'apply' : 'dry_run', sourceSignals, publicCopySignals,
  supabaseEvidence: {rows: supabaseRows, spanishWellsMatches: spanishRows},
  counts: {
    sourcesToCreateOrReplace: sourcePlans.filter((plan) => plan.needsUpdate).length,
    existingSourcesToUpdate: sourceUpdatePlans.filter((plan) => plan.needsUpdate).length,
    placeDraftsToUpdate: placePlans.filter((plan) => plan.needsUpdate).length,
    candidateDraftsToUpdate: candidatePlans.filter((plan) => plan.needsUpdate).length,
    factDraftsToCreateOrUpdate: factPlans.filter((plan) => plan.needsUpdate).length,
    auditDraftsToCreateOrUpdate: auditPlans.filter((plan) => plan.needsUpdate).length + Number(publicCopyAuditNeedsUpdate),
    articleDraftsToCreateOrUpdate: Number(articleDraftNeedsUpdate),
    trackedP0GapsPreserved: prospectiveAudits.flatMap((audit) => audit.gaps || []).filter((gap) => gap.priority === 'p0' && trackedP0Titles.has(gap.title)).length,
  },
  guardrails,
  changes: {
    sourceIds: sourcePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.source._id),
    existingSourceIds: sourceUpdatePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    placeIds: placePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    candidateIds: candidatePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    factIds: factPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    auditIds: [...auditPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id), ...(publicCopyAuditNeedsUpdate ? [auditIds.publicCopy] : [])],
    articleIds: articleDraftNeedsUpdate ? [articleDraftId] : [],
  },
  boundary: 'This alignment updates live/internal source records and review-only Sanity drafts for four Eleuthera & Harbour Island signature places plus one corrective article draft. It does not mutate Supabase, accept a coordinate, change the published article or hardcoded fallback, publish facts, add research delivery channels, select a stay, provider, venue, schedule, or price, contact an operator or authority, copy media, clear rights, or approve traveler delivery.',
}

if (apply) {
  let transaction = client.transaction()
  const documentIds = []
  for (const item of sourcePlans.filter((item) => item.needsUpdate)) { transaction = transaction.createOrReplace(item.source); documentIds.push(item.source._id) }
  for (const item of sourceUpdatePlans.filter((item) => item.needsUpdate)) { transaction = transaction.patch(item.id, (patch) => patch.set(item.fields)); documentIds.push(item.id) }
  for (const item of placePlans.filter((item) => item.needsUpdate)) { transaction = transaction.patch(item.id, (patch) => patch.set(item.fields)); documentIds.push(item.id) }
  for (const item of candidatePlans.filter((item) => item.needsUpdate)) { transaction = transaction.patch(item.id, (patch) => patch.set(item.fields)); documentIds.push(item.id) }
  for (const item of factPlans.filter((item) => item.needsUpdate)) { if (item.current) transaction = transaction.patch(item.id, (patch) => patch.set(item.fields)); else transaction = transaction.createOrReplace(item.fields); documentIds.push(item.id) }
  for (const item of auditPlans.filter((item) => item.needsUpdate)) { transaction = transaction.patch(item.id, (patch) => patch.set({gaps: item.gaps, sources: item.sources, methodologyNotes: item.methodologyNotes})); documentIds.push(item.id) }
  if (publicCopyAuditNeedsUpdate) { transaction = transaction.createOrReplace(publicCopyAudit); documentIds.push(auditIds.publicCopy) }
  if (articleDraftNeedsUpdate) { transaction = transaction.createOrReplace(articleDraft); documentIds.push(articleDraftId) }
  if (documentIds.length) {
    const result = await transaction.commit({visibility: 'sync'})
    plan.commit = {transactionId: result.transactionId, documentIds}
  } else plan.commit = {transactionId: null, documentIds: []}
}

fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)
console.log(JSON.stringify(plan, null, 2))
