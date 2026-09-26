import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_RUM_CAY_SIGNATURE_PLACE_EVIDENCE === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextStableReviewAt = '2026-11-03'
const outputPath = '/private/tmp/baha-buddy-rum-cay-signature-place-evidence-plan.json'
const destinationId = 'dest-rum-cay'
const destinationDraftId = `drafts.${destinationId}`

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

const sourceIds = {
  islandProfile: 'research-source-bmot-rum-cay',
  hartford: 'research-source-bmot-hartford-cave',
  council: 'research-source-bmot-rum-cay-district-council-contact',
  conceptionBnt: 'research-source-bnt-conception-island',
  conceptionPlanning: 'research-source-bnt-conception-management-planning-2025',
  wreckDiving: 'research-source-bmot-hms-conqueror-diving-2026',
  datedStayClaims: 'research-source-bmot-rum-cay-september-2025-stay-claims',
  caabAerodromes: 'research-source-caab-government-aerodromes-2026',
  doaAirports: 'research-source-doa-airports',
  flightTable: 'research-source-bmot-flight-tables-current-review',
  publicMap: 'research-source-bmot-public-map-dataset',
  mediaBoundary: 'research-source-bmot-brand-center-media-boundary',
  sumnerOperator: 'research-source-operator-sumner-point-marina-site',
  sumnerIndependent: 'research-source-independent-tribune-rum-cay-sumner-point-2026',
  heritageUnavailable: 'research-source-operator-rum-cay-heritage-unavailable',
}

const publishedPlaceIds = {
  hms: 'place-supabase-a59c1f50-052c-45dd-8565-788c70cdfa17',
  conception: 'place-supabase-2df8651f-cbb9-4ab5-a7e5-7cc69cc73970',
  compass: 'place-supabase-d18571d7-2c94-4437-a738-b53b8f7f1ec2',
}
const placeIds = Object.fromEntries(Object.entries(publishedPlaceIds).map(([key, id]) => [key, `drafts.${id}`]))
const supabaseIds = {
  hms: 'a59c1f50-052c-45dd-8565-788c70cdfa17',
  conception: '2df8651f-cbb9-4ab5-a7e5-7cc69cc73970',
  compass: 'd18571d7-2c94-4437-a738-b53b8f7f1ec2',
  islandArea: '5ab0ffa1-fd10-4a28-9025-750091c58b5e',
}

const candidateIds = {
  portNelson: 'drafts.canonical-place-candidate-rum-cay-port-nelson',
  hms: 'drafts.canonical-place-candidate-rum-cay-hms-conqueror-shipwreck',
  hartford: 'drafts.canonical-place-candidate-rum-cay-hartford-cave',
}

const factIds = {
  portNelson: 'drafts.island-fact-signature-point-readiness-port-nelson-rum-cay',
  hms: 'drafts.island-fact-signature-point-readiness-hms-conqueror-shipwreck-rum-cay',
  hartford: 'drafts.island-fact-signature-point-readiness-hartford-cave-rum-cay',
  conception: 'drafts.island-fact-matched-signature-readiness-conception-island-national-park-rum-cay',
  baseStay: 'drafts.island-fact-base-island-stay-pattern-rum-cay',
  sumner: 'drafts.island-fact-deep-research-sumner-point-contradictory-operation-evidence-rum-cay',
  publicCopy: 'drafts.island-fact-rum-cay-public-copy-evidence-boundary',
}

const auditIds = {
  catalog: 'drafts.island-research-audit-2026-08-05-signature-place-catalog-rum-cay',
  locations: 'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-rum-cay',
  candidates: 'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-rum-cay',
  traveler: 'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-rum-cay',
  matched: 'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-rum-cay',
  content: 'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-rum-cay',
  freshness: 'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-rum-cay',
  replacements: 'drafts.island-research-audit-2026-08-05-source-replacement-evidence-rum-cay',
  publicCopy: 'drafts.island-research-audit-2026-08-05-public-copy-conflicts-rum-cay',
}

const urls = {
  islandProfile: 'https://www.bahamas.com/islands/rum-cay',
  hartford: 'https://www.bahamas.com/plan-your-trip/things-to-do/hartford-cave',
  council: 'https://www.bahamas.com/plan-your-trip/things-to-do/rum-cay-salt-pond',
  conceptionBnt: 'https://bnt.bs/explore/conception-island-national-park/',
  conceptionPlanning: 'https://bnt.bs/news/bnt-engages-long-island-community-in-planning-the-future-of-conception-island-national-park/',
  wreckDiving: 'https://www.bahamas.com/things-to-do/diving/wreck-diving',
  datedStayClaims: 'https://www.bahamas.com/pressroom/savoring-summer-enjoy-an-extended-vacation-in-the-bahamas-this-september',
  flightTable: 'https://www.bahamas.com/getting-here/flying',
  sumnerOperator: 'https://sumnerpointmarina.com/',
  sumnerIndependent: 'https://www.tribune242.com/news/2026/may/21/rum-cay-feud-reignites/',
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
  if (!response.ok) throw new Error(`Research source failed: ${url} (${response.status})`)
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
  for (const [index, id] of [...new Set(ids)].entries()) {
    if (!byId.has(id)) byId.set(id, reference(id, `${prefix}-${index + 1}-${id.replace(/[^a-z0-9]+/gi, '-').slice(-32)}`))
  }
  return [...byId.values()]
}

function stripMeta(document) {
  if (!document) return document
  const {_rev, _createdAt, _updatedAt, ...rest} = document
  return rest
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter((key) => !['_rev', '_createdAt', '_updatedAt'].includes(key) && value[key] !== undefined).sort().map((key) => [key, comparable(value[key])]))
  return value
}

function differs(current, planned) {
  return JSON.stringify(comparable(current)) !== JSON.stringify(comparable(planned))
}

function reviewPlan({cadenceDays = 30, relationship, reviewScope, nextAction, attention = false, method = 'webpage_review', triggers = ['publisher_url_or_scope_change']}) {
  return {
    _type: 'researchSourceReviewPlan', plannedAt: checkedAt, reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: attention ? 'attention_required' : 'scheduled', freshnessStatus: attention ? 'needs_recheck' : 'current',
    cadenceBand: cadenceDays === 30 ? '30_day' : '90_day', cadenceDays, sourceRelationship: relationship,
    verificationMethod: method, changeTriggers: triggers, reviewScope, nextAction,
  }
}

function block(key, text, style = 'normal') {
  return {_type: 'block', _key: key, style, markDefs: [], children: [{_type: 'span', _key: `${key}-span`, text, marks: []}]}
}

function updateGap(gaps, title, fields) {
  let found = false
  const updated = (gaps || []).map((gap) => {
    if (gap.title !== title) return gap
    found = true
    return {...gap, ...fields}
  })
  if (!found) throw new Error(`Missing target gap: ${title}`)
  return updated
}

const [islandText, hartfordText, councilText, conceptionText, planningText, wreckText, datedStayText, flightText, sumnerText, tribuneText] = await Promise.all([
  fetchPage(urls.islandProfile), fetchPage(urls.hartford), fetchPage(urls.council), fetchPage(urls.conceptionBnt),
  fetchPage(urls.conceptionPlanning), fetchPage(urls.wreckDiving), fetchPage(urls.datedStayClaims), fetchPage(urls.flightTable),
  fetchPage(urls.sumnerOperator), fetchPage(urls.sumnerIndependent),
])

const sourceSignals = {
  islandProfile: signals(islandText, {portNelson: /Port Nelson/i, hms: /HMS Conqueror/i, longIslandBase: /Long Island/i, conception: /Conception Island/i}),
  hartford: signals(hartfordText, {identity: /Hartford Cave/i, protected: /protected/i, lucayan: /Lucayan|Arawak/i}),
  council: signals(councilText, {council: /Rum Cay District Council/i, saltPond: /salt pond/i}),
  conception: signals(conceptionText, {identity: /Conception Island National Park/i, thirtyThousand: /30,000|30000/i, boat: /boat/i, noGuard: /no (?:one|person) on guard|no on-site guard|no onsite guard/i}),
  planning: signals(planningText, {identity: /Conception Island National Park/i, managementPlan: /management plan/i, unregulatedTourism: /unregulated tourism/i, rumCay: /Rum Cay/i}),
  wreck: signals(wreckText, {hms: /HMS Conqueror/i, rumCay: /Rum Cay/i}),
  datedStay: signals(datedStayText, {sumner: /Sumner Point/i, rumCay: /Rum Cay/i}),
  flight: signals(flightText, {rumCay: /Rum Cay/i, southernAir: /Southern Air/i}),
  sumner: signals(sumnerText, {identity: /Sumner Point Marina/i, cottages: /cottages?/i, fuel: /fuel/i}),
  tribune: signals(tribuneText, {rumCay: /Rum Cay/i, destroyed: /destroyed/i, fuelLossContext: /fuel/i, restartConstraint: /no resources|start over again|nothing left/i}),
}
if (Object.values(sourceSignals).flatMap((group) => Object.values(group)).some((value) => !value)) throw new Error(`Research-source signals changed: ${JSON.stringify(sourceSignals)}`)

const hardcodedFiles = [
  path.join(workspaceRoot, 'bahabuddy-web', 'src', 'components', 'marketplace', 'MarketplacePublicHeader.tsx'),
  path.join(workspaceRoot, 'bahabuddy-web', 'src', 'lib', 'islands.ts'),
  path.join(workspaceRoot, 'bahabuddy-web', 'src', 'lib', 'chat-tools.ts'),
  path.join(workspaceRoot, 'Baha-Buddy-V2', 'lib', 'core', 'constants', 'baha_images.dart'),
]
const hardcodedSource = hardcodedFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
const publicCopySignals = {
  unsupportedStay: /Small-island diving, beaches, and low-key stays/i.test(hardcodedSource),
  externalWebImage: /tempo\.cdn\.tambourine\.com\/windsong\/media\/rum-cay/i.test(fs.readFileSync(hardcodedFiles[1], 'utf8')),
  externalMobileImage: /tempo\.cdn\.tambourine\.com\/windsong\/media\/rum-cay/i.test(fs.readFileSync(hardcodedFiles[3], 'utf8')),
  conceptionDayTrip: /Conception Island day trip/i.test(fs.readFileSync(hardcodedFiles[2], 'utf8')),
}
if (Object.values(publicCopySignals).some((value) => !value)) throw new Error(`Public-copy signals changed: ${JSON.stringify(publicCopySignals)}`)

const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web', '.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')
const headers = {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`}
const supabaseRows = []
for (const id of Object.values(supabaseIds)) {
  const response = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified&id=eq.${id}`, {headers})
  if (!response.ok) throw new Error(`Supabase read failed for ${id}: ${response.status}`)
  supabaseRows.push(...await response.json())
}
const exactNames = ['Port Nelson', 'Hartford Cave', 'HMS Conqueror Shipwreck', 'HMS Conqueror Underwater Museum']
const exactMatches = {}
for (const name of exactNames) {
  const response = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,island_id,status,is_active,is_verified&name=eq.${encodeURIComponent(name)}`, {headers})
  if (!response.ok) throw new Error(`Supabase exact-name read failed for ${name}: ${response.status}`)
  exactMatches[name] = await response.json()
}
const supabaseById = new Map(supabaseRows.map((row) => [row.id, row]))

const live = await client.fetch(`{
  "sources": *[_id in $sourceIds]{...},
  "publishedPlaces": *[_id in $publishedPlaceIds]{...},
  "placeDrafts": *[_id in $placeIds]{...},
  "candidates": *[_id in $candidateIds]{...},
  "facts": *[_id in $factIds]{...},
  "audits": *[_id in $auditIds]{...},
  "destinationPublished": *[_id == $destinationId][0]{...},
  "destinationDraft": *[_id == $destinationDraftId][0]{...},
  "publishedFacts": count(*[_type == "islandFact" && !(_id in path("drafts.**"))]),
  "rumCayFactChannels": count(*[_type == "islandFact" && _id in path("drafts.**") && destination._ref == $destinationId && count(channels) > 0])
}`, {
  sourceIds: Object.values(sourceIds), publishedPlaceIds: Object.values(publishedPlaceIds), placeIds: Object.values(placeIds),
  candidateIds: Object.values(candidateIds), factIds: Object.values(factIds), auditIds: Object.values(auditIds), destinationId, destinationDraftId,
})

const sourceById = new Map(live.sources.map((item) => [item._id, item]))
const publishedPlaceById = new Map(live.publishedPlaces.map((item) => [item._id, item]))
const placeById = new Map(live.placeDrafts.map((item) => [item._id, item]))
const candidateById = new Map(live.candidates.map((item) => [item._id, item]))
const factById = new Map(live.facts.map((item) => [item._id, item]))
const auditById = new Map(live.audits.map((item) => [item._id, item]))
for (const id of Object.values(candidateIds)) if (!candidateById.has(id)) throw new Error(`Missing candidate draft: ${id}`)
for (const id of Object.values(factIds).filter((id) => id !== factIds.publicCopy)) if (!factById.has(id)) throw new Error(`Missing fact draft: ${id}`)
for (const id of Object.values(auditIds).filter((id) => id !== auditIds.publicCopy)) if (!auditById.has(id)) throw new Error(`Missing audit draft: ${id}`)
for (const id of Object.values(publishedPlaceIds)) if (!publishedPlaceById.has(id)) throw new Error(`Missing published place overlay: ${id}`)
if (!live.destinationPublished) throw new Error(`Missing published destination: ${destinationId}`)

const destinationReference = reference(destinationId, 'destination-rum-cay')
const newSources = [
  {
    _id: sourceIds.wreckDiving, _type: 'researchSource', title: 'HMS Conqueror — official wreck-diving identity', url: urls.wreckDiving,
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['experiences', 'culture', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official wreck-diving page names HMS Conqueror at Rum Cay. This corroborates the historic wreck identity but not a safe approach, mooring, licensed provider, legal-access state, conditions, required experience, accessibility, or an approved coordinate.',
    reviewPlan: reviewPlan({relationship: 'official_context_publisher', reviewScope: 'Recheck wreck identity, island association, access wording, any provider or restriction reference, and changed safety context.', nextAction: 'Keep diving delivery blocked until a current responsible authority and licensed provider confirm access, conditions, equipment, skill, emergency plan, and exact point purpose.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  {
    _id: sourceIds.conceptionPlanning, _type: 'researchSource', title: 'Conception Island National Park — 2025 management planning', url: urls.conceptionPlanning,
    publisher: 'Bahamas National Trust', sourceClass: 'conservation', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['nature', 'access', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'BNT management-planning context says the park expanded in 2009 and 2021, identifies illegal fishing, habitat disturbance, and unregulated-tourism concerns, and describes planned zoning, signage, boundary marking, and engagement with Long Island, Rum Cay, and San Salvador. It does not place the park within Rum Cay or approve a traveler route.',
    reviewPlan: reviewPlan({relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck management-plan status, zoning, boundary markers, visitor rules, enforcement, access, closures, and affected-community engagement.', nextAction: 'Use with the current park page; retain the area model and recheck BNT rules plus a responsible vessel before any delivery.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  {
    _id: sourceIds.datedStayClaims, _type: 'researchSource', title: 'Rum Cay September 2025 promotional stay claims', url: urls.datedStayClaims,
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['stays', 'food', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck',
    notes: 'Dated September 2025 promotional copy references Sumner Point stays. It is contradicted by May 2026 reporting of destroyed cottages, restaurant, dock, utilities, office, pier and fuel service, and by the current official island page advising a Long Island base. Do not use as current operation evidence.',
    reviewPlan: reviewPlan({relationship: 'primary_source_scope_requires_review', attention: true, reviewScope: 'Recheck whether the dated campaign remains indexed, whether a correction exists, and whether any current accountable source verifies Rum Cay lodging or Sumner Point operation.', nextAction: 'Keep Rum Cay stay and Sumner service claims blocked until current responsible evidence resolves the conflict.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'safety_emergency_or_activation_change']}),
  },
]

const sourceUpdates = {
  [sourceIds.islandProfile]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official island profile supports Port Nelson as the only inhabited town, the HMS Conqueror wreck identity, Hartford Cave, nearby Conception Island visitor context, New Port Nelson Airport as a named gateway, and a Long Island base-stay recommendation. It does not establish live flights, current lodging on Rum Cay, a responsible vessel or dive provider, exact entrances, safe routes, accessibility, or rights to the displayed image.',
    reviewPlan: reviewPlan({relationship: 'official_context_publisher', reviewScope: 'Recheck community, gateway, base-stay, signature-place, and access wording plus any operation or closure notice.', nextAction: 'Keep schedule, stay, provider, route, activity, safety, accessibility, price, and media claims separately verified for the traveler’s dates.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change']}),
  },
  [sourceIds.hartford]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official listing identifies Hartford Cave as a protected historic site associated with Lucayan-Arawak artifacts and petroglyphs. The page publishes a contact but does not establish that the Rum Cay District Council operates the cave, approve the map pin as an entrance, or publish current permission, hours, access, conditions, safety, accessibility, or media rules.',
    reviewPlan: reviewPlan({relationship: 'official_context_publisher', reviewScope: 'Recheck protected-site identity, heritage wording, contact, access, permissions, disclosure, safety, accessibility, and any changed visitor instructions.', nextAction: 'Identify the responsible heritage authority or custodian and use a Board-approved verification workflow before disclosing an entrance or delivering a visit.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.council]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official salt-pond listing names the Rum Cay District Council and repeats a local contact route. It establishes a local-administration lead only; it does not prove that the Council operates Hartford Cave or can authorize access, safety, accessibility, heritage disclosure, or media use. No contact was made.',
    reviewPlan: reviewPlan({relationship: 'official_context_publisher', reviewScope: 'Recheck the named Council and contact route, plus any explicit scope for heritage, access, or visitor coordination.', nextAction: 'Prepare a bounded question set and obtain Board approval before external contact; do not treat the contact listing as operational authority.'}),
  },
  [sourceIds.conceptionBnt]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current managing-authority page describes a 30,000-acre protected park reached by boat, little or no infrastructure, no on-site guard, moorings, creek conditions, and wildlife rules. This is an area/protected-park identity; a visitor-site pin cannot represent its boundary, safe route, landing, mooring, or current conditions. Rum Cay is planning context, not proof the park is physically part of Rum Cay.',
    reviewPlan: reviewPlan({relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck park extent, rules, moorings, creek conditions, infrastructure, guard status, closures, access, and visitor conduct.', nextAction: 'Use an area model and verify current BNT rules, a responsible licensed vessel, conditions, landing or mooring, emergency readiness, accessibility, and fallback before delivery.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.caabAerodromes]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'The January 2026 regulator register identifies New Port Nelson Airport as MYRP/RCY with a 1,362 x 30 metre asphalt runway, VFR operation, UNICOM 122.80, CAT 0 rescue and fire-fighting service, sunrise-to-sunset VMC operation, no port-of-entry status, and no fuel. These are facility constraints, not proof of a current flight or safe travel-day operation.',
    reviewPlan: reviewPlan({relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck the government-aerodrome register for code, runway, VFR/daylight limits, RFFS category, port-of-entry status, fuel, and notices.', nextAction: 'Verify live airport state, NOTAMs, weather, carrier or charter, immigration routing, transfer, baggage, assistance, and disruption fallback.', method: 'document_review', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.doaAirports]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current Department of Aviation directory lists New Port Nelson Airport, contact and emergency context, but prints ICAO MYRF, conflicting with the CAA-B government-aerodrome register’s MYRP. Treat CAA-B as the regulator source for the code and recheck the inconsistency before operational use.',
    reviewPlan: reviewPlan({relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck airport name, code, address, contacts, emergency details, and any discrepancy with the current CAA-B register.', nextAction: 'Do not resolve the MYRF/MYRP inconsistency by inference; use CAA-B for regulatory code context and verify live operations separately.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.sumnerOperator]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck',
    notes: 'The operator site claims marina slips, fuel, utilities, internet, cottages, restaurant, and charters, but current official base-stay guidance and May 2026 independent reporting conflict with those claims. Treat every Sumner Point operation, stay, food, marina, fuel, utility, charter, and access claim as unresolved. No contact was made.',
    reviewPlan: reviewPlan({relationship: 'primary_source_scope_requires_review', attention: true, reviewScope: 'Recheck ownership, update dates, storm or closure notices, marina, fuel, utilities, cottages, restaurant, charters, dock, road access, contacts, and any superseding responsible statement.', nextAction: 'Keep all operation and stay claims blocked. If verification is needed, prepare questions and obtain Board approval before external contact.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.sumnerIndependent]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'May 21, 2026 independent reporting says Sumner Point cottages, restaurant, utilities, dock and road infrastructure were destroyed and quotes the operator as having no office, pier, fuel, or resources to restart. This is strong current contradiction evidence, not a responsible closure notice or restoration status.',
    reviewPlan: reviewPlan({relationship: 'corroborating_source', reviewScope: 'Recheck for later reporting, restoration, ownership, responsible closure or reopening statements, and whether quoted conditions changed.', nextAction: 'Use only to preserve the source conflict; require current responsible evidence before any Sumner Point operation or stay claim.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'safety_emergency_or_activation_change']}),
  },
}

const sourcePlans = newSources.map((planned) => ({id: planned._id, current: sourceById.get(planned._id), planned, needsUpdate: differs(sourceById.get(planned._id), planned)}))
const sourceUpdatePlans = Object.entries(sourceUpdates).map(([id, fields]) => {
  const current = sourceById.get(id)
  if (!current) throw new Error(`Missing existing source: ${id}`)
  const planned = {...stripMeta(current), ...fields}
  return {id, current, planned, needsUpdate: differs(current, planned)}
})

const hmsCandidate = candidateById.get(candidateIds.hms)
const conceptionCurrent = placeById.get(placeIds.conception) || {...stripMeta(publishedPlaceById.get(publishedPlaceIds.conception)), _id: placeIds.conception}
const hmsCurrent = placeById.get(placeIds.hms) || {...stripMeta(publishedPlaceById.get(publishedPlaceIds.hms)), _id: placeIds.hms}
const compassDraft = placeById.get(placeIds.compass)
if (!compassDraft) throw new Error(`Missing wrong-island Compass Cay review draft: ${placeIds.compass}`)

const hmsReadiness = {
  ...hmsCandidate.travelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked',
  responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'permission_or_guide_required',
  safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only', mediaStatus: 'source_media_not_cleared', deliveryDecision: 'blocked',
  sources: references([sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.publicMap], 'source'),
  notes: 'Official tourism corroborates the HMS Conqueror wreck identity and the Supabase row named HMS Conqueror Underwater Museum is a source-backed name variant, not a separate place. Confirm heritage authority, protected status, legal access, exact wreck boundary versus point, responsible licensed dive provider, mooring, sea state, equipment and skill requirements, emergency plan, accessibility, and disclosure policy before delivery.',
}

const placeDocuments = [
  {
    ...stripMeta(hmsCurrent), _id: placeIds.hms, active: false, channels: [], officialSourceName: 'HMS Conqueror Shipwreck',
    catalogReviewStatus: 'name_variant', reviewedAt: checkedAt,
    evidenceSources: mergeReferences(hmsCurrent.evidenceSources, [sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.publicMap], 'rum-cay-pilot-source'),
    catalogLocationReview: {...hmsCandidate.locationReview, checkedAt, evidenceSources: references([sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.publicMap], 'location-source'), reviewDecision: 'pending', notes: 'The existing Supabase row is the source-backed name variant HMS Conqueror Underwater Museum. The official tourism wreck point remains a pending feature point and is not a mooring, safe approach, provider location, dive plan, or legal-access decision. Do not create a duplicate canonical row.'},
    catalogTravelerReadinessReview: hmsReadiness,
    catalogContentReadinessReview: hmsCandidate.contentReadinessReview,
    catalogReviewNotes: 'Source-backed name variant of HMS Conqueror Shipwreck. Preserve the existing Supabase identity and block duplicate creation. This draft is inactive and channel-free; no coordinate, diving operation, route, media, publication, or traveler delivery is approved.',
  },
  {
    ...stripMeta(conceptionCurrent), _id: placeIds.conception, active: false, channels: [], catalogReviewStatus: 'location_blocked', reviewedAt: checkedAt,
    evidenceSources: mergeReferences(conceptionCurrent.evidenceSources, [sourceIds.conceptionBnt, sourceIds.conceptionPlanning, sourceIds.publicMap], 'rum-cay-pilot-source'),
    catalogLocationReview: {
      ...conceptionCurrent.catalogLocationReview,
      candidates: (conceptionCurrent.catalogLocationReview?.candidates || []).map((candidate) => ({...candidate, relationship: 'visitor_site', notes: 'The tourism point is retained as a related visitor-site candidate only. It is not the 30,000-acre protected-area boundary, a safe route, landing, mooring, creek entrance, or current-condition signal.'})),
      checkedAt, reconciliationStatus: 'area_identity_no_point', evidenceSources: references([sourceIds.conceptionBnt, sourceIds.conceptionPlanning, sourceIds.publicMap], 'location-source'),
      locationConfidence: 'high', operationEvidenceStatus: 'current_managing_authority', accessEvidenceStatus: 'partial_official_context', reviewDecision: 'not_applicable',
      notes: 'Use an area/protected-area model. BNT manages a 30,000-acre park with boat-only context, little or no infrastructure, no on-site guard, moorings, creek conditions, and wildlife rules. The map point cannot represent the park geometry or a safe visitor route. Rum Cay is stakeholder/planning context, not proof that the park is physically part of Rum Cay.',
    },
    catalogTravelerReadinessReview: {
      ...conceptionCurrent.catalogTravelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked',
      responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context',
      accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only', mediaStatus: 'source_media_not_cleared', deliveryDecision: 'blocked',
      sources: references([sourceIds.conceptionBnt, sourceIds.conceptionPlanning, sourceIds.publicMap], 'source'),
      notes: 'Current BNT evidence establishes park management, boat-only context, limited infrastructure, no on-site guard, moorings, creek conditions, wildlife rules, and active management planning. Verify current rules, a responsible licensed vessel, landing or mooring, weather and sea state, access permission, emergency fallback, accessibility, and the park-area relationship before any recommendation.',
    },
    catalogReviewNotes: 'Current managing-authority evidence supports a protected-area identity, not a canonical point or a Rum Cay location assignment. Keep inactive, channel-free, area-modeled, location-blocked, and delivery-blocked.',
  },
]
const placePlans = placeDocuments.map((planned) => ({id: planned._id, current: placeById.get(planned._id), planned, needsUpdate: differs(placeById.get(planned._id), planned)}))

const candidateDocuments = Object.values(candidateIds).map((id) => stripMeta(candidateById.get(id)))
const candidateByPlannedId = new Map(candidateDocuments.map((item) => [item._id, item]))
const port = candidateByPlannedId.get(candidateIds.portNelson)
port.identityEvidence = mergeReferences(port.identityEvidence, [sourceIds.islandProfile, sourceIds.caabAerodromes, sourceIds.doaAirports, sourceIds.publicMap], 'rum-cay-pilot-source')
port.identityBoundary = 'Port Nelson is the official inhabited-community identity on Rum Cay. New Port Nelson Airport is a separate gateway identity. A community marker or airport point must not become a universal settlement entrance or route.'
port.locationReview = {...port.locationReview, candidates: (port.locationReview?.candidates || []).map((candidate) => ({...candidate, relationship: 'visitor_site', notes: 'Community-area reference only. It is not an accepted settlement entrance, civic centre, airport, transfer point, accessible route, or universal routing destination.'})), checkedAt, reconciliationStatus: 'area_identity_no_point', evidenceSources: references([sourceIds.islandProfile, sourceIds.caabAerodromes, sourceIds.doaAirports, sourceIds.publicMap], 'location-source'), locationConfidence: 'high', operationEvidenceStatus: 'not_established', accessEvidenceStatus: 'partial_official_context', reviewDecision: 'not_applicable', notes: 'Use a community/area model. The official profile establishes Port Nelson as the inhabited town and separately names New Port Nelson Airport. No single community point is accepted; verify the traveler’s actual lodging, civic destination, transfer, or airport route separately.'}
port.travelerReadinessReview = {...port.travelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked', responsibleSourceStatus: 'current_government_authority', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only', mediaStatus: 'no_approved_media', deliveryDecision: 'blocked', sources: references([sourceIds.islandProfile, sourceIds.caabAerodromes, sourceIds.doaAirports, sourceIds.flightTable], 'source'), notes: 'Port Nelson is a community identity; New Port Nelson Airport is separate. CAA-B lists VFR, daylight/VMC, CAT 0 RFFS, no port-of-entry status, and no fuel. Verify live airport status, NOTAMs, weather, current carrier or charter, immigration routing, transfers, lodging, assistance, and disruption fallback for the traveler’s dates.'}
port.reviewedAt = checkedAt
port.reviewNotes = 'The community identity remains absent as an exact Supabase place. Use an area model and do not create or accept a single community point from the airport or tourism marker. A separate approved catalog change still requires duplicate, category, area geometry, access, safety, accessibility, copy, media, and delivery review.'

const hms = candidateByPlannedId.get(candidateIds.hms)
hms.identityEvidence = mergeReferences(hms.identityEvidence, [sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.publicMap], 'rum-cay-pilot-source')
hms.identityBoundary = 'HMS Conqueror Shipwreck is the official identity; the existing Supabase HMS Conqueror Underwater Museum row is a source-backed name variant of the same wreck. The marine point does not establish a mooring, approach, operator, legal access, or dive plan.'
hms.locationReview = {...hms.locationReview, checkedAt, evidenceSources: references([sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.publicMap], 'location-source'), reviewDecision: 'pending', notes: 'Reconcile this candidate to the existing HMS Conqueror Underwater Museum Supabase row and its inactive name-variant overlay. Keep the wreck point pending and do not create a duplicate canonical identity or infer a safe approach, mooring, provider, or legal-access state.'}
hms.travelerReadinessReview = hmsReadiness
hms.reviewedAt = checkedAt
hms.reviewNotes = 'A source-backed Supabase name variant now resolves the earlier exact-name absence. Do not create a duplicate row. Keep canonicalCreationStatus researching until identity reconciliation, point purpose, responsible authority/operator, legal access, safety, accessibility, copy, media rights, and delivery gates are reviewed.'

const hartford = candidateByPlannedId.get(candidateIds.hartford)
hartford.identityEvidence = mergeReferences(hartford.identityEvidence, [sourceIds.islandProfile, sourceIds.hartford, sourceIds.council, sourceIds.heritageUnavailable, sourceIds.publicMap], 'rum-cay-pilot-source')
hartford.identityBoundary = 'Hartford Cave is a protected historic-site identity associated in official tourism copy with Lucayan-Arawak artifacts and petroglyphs. The published contact and map point do not establish the responsible heritage authority, current entrance, permission, safe access, accessibility, disclosure, or media rights.'
hartford.locationReview = {...hartford.locationReview, checkedAt, operationEvidenceStatus: 'current_official_listing_only', accessEvidenceStatus: 'unresolved', reviewDecision: 'pending', evidenceSources: references([sourceIds.hartford, sourceIds.council, sourceIds.heritageUnavailable, sourceIds.publicMap], 'location-source'), notes: 'The dated official tourism marker remains a pending feature candidate only. Do not disclose or route to it until the responsible heritage authority or custodian confirms the intended entrance, permission, land access, site protection, current condition, safety, accessibility, and disclosure policy.'}
hartford.travelerReadinessReview = {...hartford.travelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked', responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'needs_responsible_review', mediaStatus: 'source_media_not_cleared', deliveryDecision: 'blocked', sources: references([sourceIds.hartford, sourceIds.council, sourceIds.heritageUnavailable, sourceIds.publicMap], 'source'), notes: 'Official tourism supports a protected historic identity and publishes a contact lead, but does not identify the Council as cave operator or resolve permission, entrance, operation, conservation, safety, accessibility, disclosure, or media rights. External verification requires Board approval.'}
hartford.reviewedAt = checkedAt
hartford.reviewNotes = 'The identity remains absent from the Supabase catalog. Keep the point pending and exact entrance disclosure blocked until a responsible heritage authority or custodian verifies permission, access, conservation, safety, accessibility, and media policy. No external contact was made.'

const candidatePlans = candidateDocuments.map((planned) => ({id: planned._id, current: candidateById.get(planned._id), planned, needsUpdate: differs(candidateById.get(planned._id), planned)}))

const factFields = {
  [factIds.portNelson]: {title: 'Port Nelson: community-area and airport boundary', topic: 'access', claim: 'Current official tourism identifies Port Nelson as Rum Cay’s only inhabited town and separately identifies New Port Nelson Airport. The CAA-B register identifies the airport as MYRP/RCY with VFR and daylight/VMC limits, CAT 0 RFFS, no port-of-entry status, and no fuel. A community marker or airport point cannot represent a universal Port Nelson route.', travelerGuidance: 'Verify the traveler’s actual destination, live airport status, NOTAMs, weather, carrier or charter, immigration routing, transfer, lodging, assistance, and disruption fallback. Do not use the airport as the community point.', sources: references([sourceIds.islandProfile, sourceIds.caabAerodromes, sourceIds.doaAirports, sourceIds.flightTable], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [], editorNotes: 'Draft evidence boundary only. Port Nelson uses a community/area model; no Supabase row, coordinate, route, schedule, or delivery is approved.'},
  [factIds.hms]: {title: 'HMS Conqueror: source-backed Supabase name variant', topic: 'experiences', claim: 'Official tourism names HMS Conqueror at Rum Cay. The existing Supabase row named HMS Conqueror Underwater Museum is a source-backed name variant of the same wreck and should be reconciled rather than duplicated. The official marine point is not evidence of a mooring, safe approach, provider, legal access, or current dive conditions.', travelerGuidance: 'Reconcile to the existing row and verify the responsible heritage authority, licensed dive provider, protected status, legal access, mooring, weather and sea state, skill and equipment, emergency plan, accessibility, and disclosure before delivery.', sources: references([sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [], editorNotes: 'Draft evidence boundary only. Do not create a duplicate canonical record or accept a coordinate from this fact.'},
  [factIds.hartford]: {title: 'Hartford Cave: protected-site identity and access boundary', topic: 'culture', claim: 'Current official tourism identifies Hartford Cave as a protected historic site associated with Lucayan-Arawak artifacts and petroglyphs. Its contact and dated map point do not establish a responsible heritage operator, current entrance, permission, site condition, safety, accessibility, disclosure, or reusable media rights.', travelerGuidance: 'Identify the responsible heritage authority or custodian and verify permission, exact access, conservation rules, safety, accessibility, disclosure, and media policy through a Board-approved workflow before delivery.', sources: references([sourceIds.hartford, sourceIds.council, sourceIds.heritageUnavailable, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [], editorNotes: 'Draft evidence boundary only. No contact, point acceptance, entrance disclosure, media use, or traveler delivery is approved.'},
  [factIds.conception]: {title: 'Conception Island National Park: area model and managing-authority boundary', topic: 'nature', claim: 'BNT describes Conception Island National Park as a 30,000-acre protected area reached by boat, with little or no infrastructure, no on-site guard, moorings, creek conditions, wildlife rules, and active management planning. Rum Cay is stakeholder/planning context; a visitor-site point cannot represent the park boundary or prove the park is physically part of Rum Cay.', travelerGuidance: 'Use an area model. Recheck BNT rules and verify a responsible licensed vessel, landing or mooring, conditions, permission, emergency fallback, accessibility, and the correct island relationship before delivery.', sources: references([sourceIds.conceptionBnt, sourceIds.conceptionPlanning, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [], editorNotes: 'Draft evidence boundary only. The matched overlay remains inactive and channel-free; no canonical point or traveler route is approved.'},
  [factIds.baseStay]: {title: 'Rum Cay stay pattern: Long Island base and current-operation conflict', topic: 'stays', claim: 'The current official Rum Cay profile advises travelers to base on Long Island. A dated September 2025 tourism campaign and the Sumner Point operator site claim Rum Cay stays, while May 2026 reporting describes major destruction and no office, pier, fuel, or resources to restart. Current on-island lodging is therefore source-conflicted.', travelerGuidance: 'Do not promise Rum Cay lodging or Sumner Point services. Verify current accommodation, vessel or charter, transfers, utilities, food, cancellation, safety, accessibility, and fallback with responsible providers for the traveler’s dates.', sources: references([sourceIds.islandProfile, sourceIds.datedStayClaims, sourceIds.sumnerOperator, sourceIds.sumnerIndependent], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [], editorNotes: 'Draft conflict record only. No stay, marina, provider, price, availability, contact, or delivery is approved.'},
  [factIds.sumner]: {title: 'Sumner Point: current operation remains source-conflicted', topic: 'stays', claim: 'The Sumner Point operator site claims marina, fuel, utilities, cottages, restaurant, and charter services. A dated September 2025 tourism campaign repeats stay claims, but May 2026 independent reporting describes destroyed cottages, restaurant, utilities, dock and road infrastructure and quotes the operator as having no office, pier, fuel, or resources to restart. No current responsible reopening evidence was found.', travelerGuidance: 'Treat every Sumner Point stay, marina, fuel, food, utility, charter, dock, road, and access claim as unavailable for planning until a current responsible source resolves the conflict.', sources: references([sourceIds.datedStayClaims, sourceIds.sumnerOperator, sourceIds.sumnerIndependent, sourceIds.islandProfile], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [], editorNotes: 'Draft source-conflict fact only. No external contact was made and no operation, provider, route, media, or delivery is approved.'},
}

const publicCopyFact = {
  _id: factIds.publicCopy, _type: 'islandFact', title: 'Rum Cay public-copy evidence boundary', destination: destinationReference,
  topic: 'overview', claim: 'Published Sanity copy calls Rum Cay a hidden treasure with legendary dive sites and seclusion, while hardcoded web copy promises low-key stays and shared web/mobile code uses an external hero image. Current evidence supports bounded identities and a Long Island base-stay pattern, but not those superlatives, current on-island stays, universal suitability, a verified Conception Island day trip, or reusable rights to the external image.',
  travelerGuidance: 'Use the corrective destination draft as the review baseline. Verify current lodging, licensed vessels and dive providers, access, conditions, safety, accessibility, prices, cancellation, and exact media rights before any public release.',
  sources: references([sourceIds.islandProfile, sourceIds.conceptionBnt, sourceIds.wreckDiving, sourceIds.datedStayClaims, sourceIds.sumnerOperator, sourceIds.sumnerIndependent, sourceIds.mediaBoundary], 'source'),
  checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [],
  editorNotes: 'Review-only corrective boundary. The published destination, hardcoded web/mobile copy, external image references, Supabase rows, and delivery channels remain unchanged.',
}
const factPlans = [...Object.entries(factFields).map(([id, fields]) => {
  const current = factById.get(id)
  const planned = {...stripMeta(current), ...fields}
  return {id, current, planned, needsUpdate: differs(current, planned)}
}), {id: factIds.publicCopy, current: factById.get(factIds.publicCopy), planned: publicCopyFact, needsUpdate: differs(factById.get(factIds.publicCopy), publicCopyFact)}]

const auditSourceAdditions = {
  [auditIds.catalog]: [sourceIds.islandProfile, sourceIds.wreckDiving],
  [auditIds.locations]: [sourceIds.conceptionBnt, sourceIds.conceptionPlanning, sourceIds.publicMap],
  [auditIds.candidates]: [sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.hartford, sourceIds.council, sourceIds.caabAerodromes, sourceIds.doaAirports],
  [auditIds.traveler]: [sourceIds.wreckDiving, sourceIds.hartford, sourceIds.council, sourceIds.caabAerodromes, sourceIds.doaAirports],
  [auditIds.matched]: [sourceIds.conceptionBnt, sourceIds.conceptionPlanning],
  [auditIds.content]: [sourceIds.wreckDiving, sourceIds.conceptionPlanning, sourceIds.hartford, sourceIds.mediaBoundary],
  [auditIds.freshness]: [sourceIds.wreckDiving, sourceIds.conceptionPlanning, sourceIds.datedStayClaims],
  [auditIds.replacements]: [sourceIds.hartford, sourceIds.council, sourceIds.heritageUnavailable],
}

const auditDocuments = Object.entries(auditSourceAdditions).map(([id, sourceAdditions]) => {
  const current = auditById.get(id)
  let gaps = current.gaps || []
  if (id === auditIds.catalog) {
    const oldTitle = '3 official signature-place identities are absent from the canonical catalog'
    const newTitle = '2 official signature-place identities are absent; HMS Conqueror has a canonical name variant'
    const targetTitle = gaps.some((gap) => gap.title === oldTitle) ? oldTitle : newTitle
    gaps = updateGap(gaps, targetTitle, {title: newTitle, action: 'Keep controlled candidates for Port Nelson and Hartford Cave. Reconcile HMS Conqueror Shipwreck to the existing HMS Conqueror Underwater Museum row and do not create a duplicate. Complete identity, area or point, access, operation, safety, accessibility, copy, and media-rights review before any separate Supabase change.', status: 'researching'})
  }
  if (id === auditIds.candidates) gaps = updateGap(gaps, 'Canonical-place decision pending: HMS Conqueror Shipwreck', {action: 'Reconcile the official HMS Conqueror Shipwreck identity to the existing HMS Conqueror Underwater Museum Supabase row as a source-backed name variant. Do not create a duplicate; keep the marine point, responsible authority/operator, legal access, safety, accessibility, copy, and media gates open.', status: 'researching'})
  if (id === auditIds.traveler) {
    gaps = updateGap(gaps, 'Traveler-readiness delivery gate remains blocked: Port Nelson', {action: 'Use a community/area model and separately verify New Port Nelson Airport, live carrier or charter, immigration routing, transfers, lodging, assistance, weather, NOTAMs, and disruption fallback.', status: 'researching'})
    gaps = updateGap(gaps, 'Traveler-readiness delivery gate remains blocked: HMS Conqueror Shipwreck', {action: 'Reconcile the existing Supabase name variant, then verify heritage authority, legal access, licensed dive provider, mooring, conditions, skill and equipment, emergency response, accessibility, disclosure, and media before delivery.', status: 'researching'})
    gaps = updateGap(gaps, 'Traveler-readiness delivery gate remains blocked: Hartford Cave', {action: 'Identify the responsible heritage authority or custodian and verify permission, entrance, access, conservation, current condition, safety, accessibility, disclosure, and media policy through a Board-approved workflow.', status: 'researching'})
  }
  if (id === auditIds.matched) gaps = updateGap(gaps, 'Matched signature-place traveler delivery remains blocked: Conception Island National Park', {action: 'Use a protected-area model and recheck current BNT rules, a responsible licensed vessel, landing or mooring, weather and sea state, access permission, emergency fallback, accessibility, and the correct island relationship before delivery.', status: 'researching'})
  if (id === auditIds.freshness) {
    const currentProfileGap = gaps.find((gap) => /^Source ownership and cadence profiled: \d+ records$/.test(gap.title))
    if (!currentProfileGap) throw new Error(`Missing freshness profile count gap in ${id}`)
    const currentCount = Number(currentProfileGap.title.match(/\d+/)[0])
    const targetCount = currentCount === 49 ? 52 : currentCount
    gaps = updateGap(gaps, currentProfileGap.title, {title: `Source ownership and cadence profiled: ${targetCount} records`, action: `The audit now routes ${targetCount} Rum Cay sources, including current HMS Conqueror identity corroboration, BNT management-planning context, and the dated tourism stay claim. The stay source and Sumner operator remain attention-required.`, status: 'resolved'})
    if (!gaps.some((gap) => gap.title === 'Recheck flagged source: Rum Cay September 2025 promotional stay claims')) gaps = [...gaps, {_type: 'researchGap', _key: 'gap-rum-cay-source-dated-stay-claims-freshness', title: 'Recheck flagged source: Rum Cay September 2025 promotional stay claims', topic: 'stays', priority: 'p1', action: 'Keep the dated stay claim attention-required and out of traveler delivery until a current responsible source resolves Rum Cay lodging and Sumner Point operation.', status: 'researching'}]
  }
  const sources = mergeReferences(current.sources, sourceAdditions, 'rum-cay-pilot-source')
  const addition = ' The Rum Cay pilot now reconciles the HMS Conqueror name variant, applies area models to Port Nelson and Conception Island National Park, preserves Hartford Cave’s protected-site access boundary, records the Sumner Point stay conflict, and flags unsupported public copy. It does not approve a Supabase write, coordinate, route, operation, contact, media, publication, or traveler delivery.'
  const methodologyNotes = current.methodologyNotes?.includes('The Rum Cay pilot now reconciles') ? current.methodologyNotes : `${current.methodologyNotes || ''}${addition}`.trim()
  const coverage = (current.coverage || []).map((row) => row.topic === 'experiences' ? {...row, finding: 'Four official signature identities were reviewed: one source-backed Supabase name variant (HMS Conqueror), one matched protected-area row with no accepted point (Conception Island), and two absent identities (Port Nelson and Hartford Cave). None is launch-ready.'} : row)
  return {...stripMeta(current), gaps, sources, methodologyNotes, coverage}
})

const publicCopyAudit = {
  _id: auditIds.publicCopy, _type: 'islandResearchAudit', title: 'Rum Cay public-copy conflict review — 2026-08-05', destination: destinationReference,
  auditedAt: checkedAt, nextAuditAt: nextOperationalReviewAt, owner: 'Baha Buddy Content Operations', status: 'researching', overallScore: 1.3,
  coverage: [
    ['overview', 2, 'Official identity and signature anchors exist, while published copy uses unsupported superlatives and suitability language.'],
    ['access', 1, 'New Port Nelson Airport is a named gateway with regulator constraints; live flights, immigration routing, transfers, and disruption fallback remain runtime checks.'],
    ['stays', 1, 'Current official guidance advises a Long Island base and Sumner Point operation is source-conflicted; hardcoded low-key-stays copy is unsupported.'],
    ['food', 1, 'An official restaurant identity lead exists, but current operation and location are not established.'],
    ['experiences', 1, 'The wreck, cave, and Conception Island identities are bounded, but responsible providers, permissions, current access, and conditions remain unresolved.'],
    ['nature', 2, 'BNT provides strong protected-area context for Conception Island, but it is not a Rum Cay point or a verified day-trip route.'],
    ['culture', 2, 'Hartford Cave and HMS Conqueror have official historic identity evidence, but authority, conservation, access, and interpretation remain incomplete.'],
    ['seasonality', 0, 'No island-specific seasonality claim is approved for traveler delivery.'],
    ['safety', 1, 'Airport constraints and protected-area hazards exist; feature-level current safety and emergency plans remain incomplete.'],
    ['accessibility', 0, 'No complete responsible feature-level accessibility evidence supports the destination, transfers, wreck, cave, park, or stay claims.'],
  ].map(([topic, score, finding]) => ({_type: 'researchCoverageScore', _key: `coverage-${topic}`, topic, score, evidenceCount: 0, finding})),
  gaps: [
    {_type: 'researchGap', _key: 'gap-rum-cay-public-copy-conflict', topic: 'overview', priority: 'p0', title: 'Published Rum Cay destination and hardcoded web/mobile copy contains unsupported stay, activity, suitability, superlative, and media claims', action: 'Review the corrective destination draft. Remove hidden-treasure, legendary, secluded, low-key-stays, and unqualified day-trip/activity language; remove the external hero image until exact reusable rights are recorded; verify each provider, access, condition, safety, accessibility, and media claim separately.', status: 'researching'},
    {_type: 'researchGap', _key: 'gap-rum-cay-runtime-verification', topic: 'access', priority: 'p1', title: 'Rum Cay airport, stay, vessel, activity, protected-site, and accessibility details remain runtime checks', action: 'For the traveler’s dates, verify live airport and carrier or charter state, immigration routing, lodging, licensed vessel and dive providers, protected-area rules, permissions, conditions, safety, accessibility, prices, cancellation, and disruption fallback.', status: 'researching'},
  ],
  sources: references([sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.hartford, sourceIds.council, sourceIds.conceptionBnt, sourceIds.conceptionPlanning, sourceIds.caabAerodromes, sourceIds.datedStayClaims, sourceIds.sumnerOperator, sourceIds.sumnerIndependent, sourceIds.mediaBoundary], 'source'),
  methodologyNotes: 'This review compares the published Sanity destination and four hardcoded web/mobile/Buddy surfaces with current official, regulator, conservation, operator, and independent evidence. It prepares a safer destination draft but does not alter or unpublish live content, mutate Supabase, approve a coordinate, route, provider, operation, price, schedule, media asset, channel, or traveler delivery, or contact an external party.',
}
const auditPlans = [...auditDocuments, publicCopyAudit].map((planned) => ({id: planned._id, current: auditById.get(planned._id), planned, needsUpdate: differs(auditById.get(planned._id), planned)}))

const destinationDraft = {
  _id: destinationDraftId, _type: 'destination', name: 'Rum Cay', slug: {_type: 'slug', current: 'rum-cay'}, islandId: 'rum-cay', routeAliases: live.destinationPublished.routeAliases || [],
  tagline: 'Port Nelson, historic-site identities, a shallow-water wreck, and nearby protected-island planning context.',
  overview: [
    block('rum-cay-overview-1', 'Port Nelson is the official inhabited-community identity on Rum Cay. New Port Nelson Airport is a separate gateway with regulator-published VFR, daylight, rescue-and-fire, port-of-entry, and fuel constraints that require a live travel-day check.'),
    block('rum-cay-overview-2', 'HMS Conqueror, Hartford Cave, and Conception Island National Park are evidence-backed planning anchors, but each still needs current responsible access, safety, accessibility, provider, and media checks. Conception Island is a protected-area identity reached by boat and is not a single Rum Cay map point.'),
  ],
  highlights: [
    {_type: 'destinationHighlight', _key: 'highlight-port-nelson', label: 'Port Nelson', description: 'Inhabited-community identity; use an area model and verify the traveler’s exact destination, transfer, and services.'},
    {_type: 'destinationHighlight', _key: 'highlight-hms-conqueror', label: 'HMS Conqueror', description: 'Historic wreck identity with an existing Supabase name variant; verify responsible authority, licensed provider, legal access, mooring, conditions, and safety.'},
    {_type: 'destinationHighlight', _key: 'highlight-hartford-cave', label: 'Hartford Cave', description: 'Protected historic-site identity; permission, entrance, conservation, safety, accessibility, disclosure, and media policy remain unresolved.'},
    {_type: 'destinationHighlight', _key: 'highlight-conception-island', label: 'Conception Island National Park', description: 'BNT-managed, boat-access protected area with limited infrastructure; verify current rules, vessel, conditions, and the correct island relationship.'},
  ],
  gettingThere: 'New Port Nelson Airport (RCY) is the named gateway. The CAA-B register lists VFR and daylight/VMC operation, CAT 0 rescue and fire-fighting service, no port-of-entry status, and no fuel. Verify live airport status, NOTAMs, weather, carrier or charter, immigration routing, baggage and assistance, ground transfer, and disruption fallback for the traveler’s dates.',
  airports: [{_type: 'gateway', _key: 'airport-rcy', code: 'RCY', name: 'New Port Nelson Airport', type: 'airport', note: 'Named gateway with regulator constraints; live operations, carrier or charter, immigration routing, transfers, assistance, weather, and disruptions require a current check.'}],
  tripFit: {_type: 'object', vibe: 'Small-island community, protected heritage, and marine planning'},
  practicalNotes: [
    block('rum-cay-practical-1', 'Current official tourism guidance advises using Long Island as a base. Do not promise Rum Cay lodging or Sumner Point marina, fuel, restaurant, cottage, utility, charter, dock, or road services until a current responsible source resolves the operation conflict.'),
    block('rum-cay-practical-2', 'Recheck licensed vessels and dive providers, protected-area rules, permissions, exact entrances and routes, weather and marine conditions, emergency response, accessibility, prices, cancellation, and fallback for the traveler’s dates. A map pin is not proof of safe access.'),
  ],
  faqs: [], featured: false, order: live.destinationPublished.order ?? 99, channels: live.destinationPublished.channels || ['web', 'mobile', 'buddy'], reviewedAt: checkedAt,
  source: {...live.destinationPublished.source, notes: 'Review-only corrective draft prepared from current official, regulator, conservation, operator, and independent evidence. It removes unsupported superlatives, suitability, current-stay, activity, route, and media claims. The published destination and hardcoded web/mobile copy remain unchanged until separate editorial approval and release.'},
  seo: {_type: 'seo', metaTitle: 'Rum Cay', metaDescription: 'Plan Rum Cay around Port Nelson, New Port Nelson Airport, protected heritage and marine identities, with current stay, vessel, access, safety, and accessibility checks.'},
  evidenceSources: references([sourceIds.islandProfile, sourceIds.wreckDiving, sourceIds.hartford, sourceIds.council, sourceIds.conceptionBnt, sourceIds.conceptionPlanning, sourceIds.caabAerodromes, sourceIds.datedStayClaims, sourceIds.sumnerIndependent], 'evidence-source'),
  editorialReviewStatus: 'ready_for_review',
  editorialReviewNotes: 'Review this corrective draft against the public-copy audit. Verify every live flight, stay, vessel, provider, route, operation, permission, safety, accessibility, price, cancellation, and media claim separately. Publishing remains a separate editorial decision.',
}
const destinationPlan = {id: destinationDraftId, current: live.destinationDraft, planned: destinationDraft, needsUpdate: differs(live.destinationDraft, destinationDraft)}

const prospectiveFacts = factPlans.map((item) => item.planned)
const prospectiveAudits = auditPlans.map((item) => item.planned)
const trackedP0Titles = new Set([
  '2 official signature-place identities are absent; HMS Conqueror has a canonical name variant',
  'Canonical-place decision pending: HMS Conqueror Shipwreck',
  'Traveler-readiness delivery gate remains blocked: Port Nelson',
  'Traveler-readiness delivery gate remains blocked: HMS Conqueror Shipwreck',
  'Traveler-readiness delivery gate remains blocked: Hartford Cave',
  'Matched signature-place traveler delivery remains blocked: Conception Island National Park',
  'Published Rum Cay destination and hardcoded web/mobile copy contains unsupported stay, activity, suitability, superlative, and media claims',
])
const guardrails = {
  allResearchSignalsPresent: Object.values(sourceSignals).flatMap((group) => Object.values(group)).every(Boolean),
  allPublicCopySignalsPresent: Object.values(publicCopySignals).every(Boolean),
  exactSupabaseRowsLoaded: supabaseRows.length === 4 && Object.values(supabaseIds).every((id) => supabaseById.has(id)),
  portNelsonAndHartfordRemainAbsent: exactMatches['Port Nelson'].length === 0 && exactMatches['Hartford Cave'].length === 0,
  hmsExactTargetAbsentButNameVariantExists: exactMatches['HMS Conqueror Shipwreck'].length === 0 && exactMatches['HMS Conqueror Underwater Museum'].length === 1 && exactMatches['HMS Conqueror Underwater Museum'][0].id === supabaseIds.hms,
  hmsReviewUsesExistingNameVariant: placeDocuments.find((item) => item._id === placeIds.hms)?.catalogReviewStatus === 'name_variant' && hms.reviewNotes.includes('Do not create a duplicate'),
  conceptionUsesAreaModel: placeDocuments.find((item) => item._id === placeIds.conception)?.catalogLocationReview?.reconciliationStatus === 'area_identity_no_point' && placeDocuments.find((item) => item._id === placeIds.conception)?.catalogLocationReview?.reviewDecision === 'not_applicable',
  portNelsonUsesAreaModel: port.locationReview.reconciliationStatus === 'area_identity_no_point' && port.locationReview.reviewDecision === 'not_applicable',
  compassWrongIslandReviewRemainsBlocked: compassDraft.catalogReviewStatus === 'island_assignment_conflict' && compassDraft.active === false && (compassDraft.channels || []).length === 0,
  allReviewContentRemainsDraftOnly: [...placeDocuments, ...candidateDocuments, ...prospectiveFacts, ...prospectiveAudits, destinationDraft].every((document) => document._id.startsWith('drafts.')),
  placeOverlaysRemainInactiveAndChannelFree: placeDocuments.every((place) => place.active === false && (place.channels || []).length === 0),
  candidatesRemainResearching: candidateDocuments.every((candidate) => candidate.canonicalCreationStatus === 'researching'),
  noAcceptedCoordinateDecision: [...placeDocuments.map((place) => place.catalogLocationReview), ...candidateDocuments.map((candidate) => candidate.locationReview)].every((review) => review?.reviewDecision !== 'accepted'),
  sumnerOperationRemainsSourceConflicted: sourceUpdates[sourceIds.sumnerOperator].status === 'needs_recheck' && factFields[factIds.sumner].title.includes('source-conflicted'),
  factsRemainSourceVerifiedDraftsWithoutChannels: prospectiveFacts.every((fact) => fact.verificationStatus === 'source_verified' && (fact.channels || []).length === 0 && fact.sources?.length >= 3),
  correctiveDestinationHasNoMediaAndPublishedDestinationIsUntouched: !destinationDraft.heroImage && !destinationDraft.gallery && live.destinationPublished._id === destinationId,
  existingPortfolioHasNoPublishedResearchFacts: live.publishedFacts === 0,
  existingRumCayFactsHaveNoDeliveryChannels: live.rumCayFactChannels === 0,
  everyTrackedP0RemainsOpen: prospectiveAudits.flatMap((audit) => audit.gaps || []).filter((gap) => trackedP0Titles.has(gap.title)).every((gap) => gap.priority !== 'p0' || ['open', 'researching'].includes(gap.status)),
}
if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const allPlans = [...sourcePlans, ...sourceUpdatePlans, ...placePlans, ...candidatePlans, ...factPlans, ...auditPlans, destinationPlan]
const plan = {
  generatedAt: new Date().toISOString(), output: outputPath, mode: apply ? 'apply' : 'dry_run', sourceSignals, publicCopySignals,
  supabaseEvidence: {rows: supabaseRows, exactMatches},
  counts: {
    sourcesToCreateOrReplace: sourcePlans.filter((item) => item.needsUpdate).length,
    existingSourcesToUpdate: sourceUpdatePlans.filter((item) => item.needsUpdate).length,
    placeDraftsToCreateOrUpdate: placePlans.filter((item) => item.needsUpdate).length,
    candidateDraftsToUpdate: candidatePlans.filter((item) => item.needsUpdate).length,
    factDraftsToCreateOrUpdate: factPlans.filter((item) => item.needsUpdate).length,
    auditDraftsToCreateOrUpdate: auditPlans.filter((item) => item.needsUpdate).length,
    destinationDraftsToCreateOrUpdate: Number(destinationPlan.needsUpdate),
    totalDocumentsToChange: allPlans.filter((item) => item.needsUpdate).length,
  },
  guardrails,
  changes: {
    sourceIds: [...sourcePlans, ...sourceUpdatePlans].filter((item) => item.needsUpdate).map((item) => item.id),
    placeIds: placePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    candidateIds: candidatePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    factIds: factPlans.filter((item) => item.needsUpdate).map((item) => item.id),
    auditIds: auditPlans.filter((item) => item.needsUpdate).map((item) => item.id),
    destinationIds: destinationPlan.needsUpdate ? [destinationDraftId] : [],
  },
  boundary: 'This alignment updates live/internal research-source records and review-only Sanity drafts for Rum Cay. It does not mutate Supabase, accept a coordinate, change published Sanity or hardcoded web/mobile copy, publish facts, add research delivery channels, contact an operator or authority, copy media, clear rights, select a provider, price, schedule, stay, route, or approve traveler delivery.',
}

if (apply) {
  let transaction = client.transaction()
  const documentIds = []
  for (const item of allPlans.filter((item) => item.needsUpdate)) {
    transaction = transaction.createOrReplace(item.planned)
    documentIds.push(item.id)
  }
  if (documentIds.length) {
    const result = await transaction.commit({visibility: 'sync'})
    plan.commit = {transactionId: result.transactionId, documentIds}
  } else plan.commit = {transactionId: null, documentIds: []}
}

fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)
console.log(JSON.stringify(plan, null, 2))
