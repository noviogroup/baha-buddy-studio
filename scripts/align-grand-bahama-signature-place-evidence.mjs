import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_GRAND_BAHAMA_SIGNATURE_PLACE_EVIDENCE === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextStableReviewAt = '2026-11-03'
const outputPath = '/private/tmp/baha-buddy-grand-bahama-signature-place-evidence-plan.json'
const destinationId = 'dest-grand-bahama'
const destinationDraftId = `drafts.${destinationId}`

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

const sourceIds = {
  islandProfile: 'research-source-bmot-grand-bahama',
  goldRock: 'research-source-bmot-gold-rock-beach',
  lucayanBnt: 'research-source-bnt-lucayan-national-park',
  petersonBnt: 'research-source-bnt-peterson-cay-national-park',
  portOperator: 'research-source-operator-port-lucaya-marketplace',
  publicMap: 'research-source-bmot-public-map-dataset',
  mediaBoundary: 'research-source-bmot-brand-center-media-boundary',
  lucayanTourism: 'research-source-bmot-lucayan-national-park-2026',
  portTourism: 'research-source-bmot-port-lucaya-marketplace-2026',
  portContact: 'research-source-operator-port-lucaya-contact-2026',
}

const placeIds = {
  goldRock: 'drafts.place-supabase-8eae30a6-6626-4f0c-a376-30c61b63f731',
  lucayan: 'drafts.place-supabase-04cd8585-cbb6-4c9b-bb0a-97a7c78b532b',
}

const supabaseIds = {
  goldRock: '8eae30a6-6626-4f0c-a376-30c61b63f731',
  lucayan: '04cd8585-cbb6-4c9b-bb0a-97a7c78b532b',
}

const candidateIds = {
  peterson: 'drafts.canonical-place-candidate-grand-bahama-peterson-cay-national-park',
  portLucaya: 'drafts.canonical-place-candidate-grand-bahama-port-lucaya-marketplace',
}

const factIds = {
  goldRock: 'drafts.island-fact-matched-signature-readiness-gold-rock-beach-grand-bahama',
  lucayan: 'drafts.island-fact-matched-signature-readiness-lucayan-national-park-grand-bahama',
  peterson: 'drafts.island-fact-canonical-candidate-peterson-cay-national-park-authority-boundary-grand-bahama',
  portLucaya: 'drafts.island-fact-canonical-candidate-port-lucaya-marketplace-current-operator-context-grand-bahama',
  publicCopy: 'drafts.island-fact-grand-bahama-public-copy-evidence-boundary',
}

const auditIds = {
  catalog: 'drafts.island-research-audit-2026-08-05-signature-place-catalog-grand-bahama',
  locations: 'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-grand-bahama',
  candidates: 'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-grand-bahama',
  traveler: 'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-grand-bahama',
  matched: 'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-grand-bahama',
  content: 'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-grand-bahama',
  freshness: 'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-grand-bahama',
  publicCopy: 'drafts.island-research-audit-2026-08-05-public-copy-conflicts-grand-bahama',
}

const urls = {
  islandProfile: 'https://www.bahamas.com/islands/freeport-grand-bahama-island',
  goldRock: 'https://www.bahamas.com/natural-wonders/gold-rock-beach/1000',
  lucayanBnt: 'https://bnt.bs/explore/grand-bahama/lucayan-national-park/',
  lucayanTourism: 'https://www.bahamas.com/plan-your-trip/things-to-do/lucayan-national-park',
  petersonBnt: 'https://bnt.bs/explore/grand-bahama/peterson-cay-national-park/',
  portTourism: 'https://www.bahamas.com/plan-your-trip/things-to-do/port-lucaya-marketplace',
  portOperator: 'https://portlucaya.com/',
  portContact: 'https://portlucaya.com/index.php/contact',
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
  for (const [index, id] of [...new Set(ids)].entries()) {
    if (!byId.has(id)) byId.set(id, reference(id, `${prefix}-${index + 1}-${id.replace(/[^a-z0-9]+/gi, '-').slice(-36)}`))
  }
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

function reviewPlan({cadenceDays, relationship, reviewScope, nextAction, attention = false, triggers = ['publisher_url_or_scope_change']}) {
  return {
    _type: 'researchSourceReviewPlan', plannedAt: checkedAt,
    reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: attention ? 'attention_required' : 'scheduled',
    freshnessStatus: attention ? 'needs_recheck' : 'current',
    cadenceBand: cadenceDays === 30 ? '30_day' : '90_day', cadenceDays,
    sourceRelationship: relationship, verificationMethod: 'webpage_review', changeTriggers: triggers,
    reviewScope, nextAction,
  }
}

function block(key, text, style = 'normal') {
  return {_type: 'block', _key: key, style, markDefs: [], children: [{_type: 'span', _key: `${key}-span`, text, marks: []}]}
}

const [islandText, goldText, lucayanBntText, lucayanTourismText, petersonText, portTourismText, portOperatorText, portContactText] = await Promise.all([
  fetchPage(urls.islandProfile), fetchPage(urls.goldRock), fetchPage(urls.lucayanBnt), fetchPage(urls.lucayanTourism),
  fetchPage(urls.petersonBnt), fetchPage(urls.portTourism), fetchPage(urls.portOperator), fetchPage(urls.portContact),
])

const sourceSignals = {
  islandProfile: signals(islandText, {identity: /Grand Bahama/i, freeport: /Freeport/i, secondLargest: /second[- ]largest city/i}),
  goldRock: signals(goldText, {identity: /Gold Rock Beach/i, park: /Lucayan National Park/i, lowTide: /low tide/i}),
  lucayanBnt: signals(lucayanBntText, {identity: /Lucayan National Park/i, visitorCentre: /visitor cent(?:re|er)/i, boardwalks: /boardwalk/i, fees: /entrance fee|admission/i}),
  lucayanTourism: signals(lucayanTourismText, {identity: /Lucayan National Park/i, swimmingRestriction: /swimming[^.]{0,80}(?:prohibited|not permitted)|(?:prohibited|not permitted)[^.]{0,80}swimming/i, divePermit: /div(?:e|ing)[^.]{0,120}permit|permit[^.]{0,120}div(?:e|ing)/i}),
  peterson: signals(petersonText, {identity: /Peterson Cay National Park/i, thousandAcres: /1,000 acres|1000 acres/i, noGuard: /no (?:one|person) on guard|no on-site guard|no onsite guard/i}),
  portTourism: signals(portTourismText, {identity: /Port Lucaya Marketplace/i, seaHorseRoad: /Sea Horse Road|Seahorse Road/i}),
  portOperator: signals(portOperatorText, {identity: /Port Lucaya Marketplace/i, copyright2016: /Copyright[^.]{0,80}2016|©\s*2016/i, elevenBars: /(?:11|eleven) bars(?:\/lounge)?/i, sevenBars: /7 bars/i}),
  portContact: signals(portContactText, {legalEntity: /Bahamaland Investments Limited/i, tradingName: /d\.?b\.?a\.?\s*['\"]?Port Lucaya Marketplace/i, bellChannel: /Bell Channel Way/i}),
}
if (Object.values(sourceSignals).flatMap((group) => Object.values(group)).some((value) => !value)) throw new Error(`Official source signals changed: ${JSON.stringify(sourceSignals)}`)

const hardcodedFiles = [
  path.join(workspaceRoot, 'bahabuddy-web', 'src', 'lib', 'island-config.ts'),
  path.join(workspaceRoot, 'bahabuddy-web', 'src', 'components', 'home', 'HomepageStorySections.tsx'),
  path.join(workspaceRoot, 'bahabuddy-web', 'src', 'lib', 'chat-tools.ts'),
  path.join(workspaceRoot, 'bahabuddy-web', 'src', 'app', 'destinations', 'page.tsx'),
]
const hardcodedSource = hardcodedFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
const publicCopySignals = {
  fixedSeason: /Grand Bahama[\s\S]{0,600}November [–-] April|grand-bahama[\s\S]{0,700}December to April/i.test(hardcodedSource),
  fixedDuration: /grand-bahama[\s\S]{0,700}(?:3[–-]5 days|3[–-]4 days|3-5 days)/i.test(hardcodedSource),
  superlatives: /Grand Bahama[\s\S]{0,700}world-class diving[\s\S]{0,250}Caribbean's finest/i.test(hardcodedSource),
  suitabilityAndValue: /Family-friendly island closest to Florida[\s\S]{0,800}Best value in the Bahamas/i.test(hardcodedSource),
  fixedFlightTime: /Grand Bahama Intl \(FPO\)[^\n]{0,100}30 min flight from Fort Lauderdale/i.test(hardcodedSource),
  easyLogistics: /Grand Bahama[\s\S]{0,500}easier logistics|grand-bahama[\s\S]{0,900}Easy logistics/i.test(hardcodedSource),
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
  if (!response.ok) throw new Error(`Supabase signature-place query failed for ${id}: ${response.status}`)
  supabaseRows.push(...await response.json())
}
const absentNames = ['Peterson Cay National Park', 'Port Lucaya Marketplace']
const absentMatches = {}
for (const name of absentNames) {
  const response = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,island_id&name=eq.${encodeURIComponent(name)}`, {headers})
  if (!response.ok) throw new Error(`Supabase exact-name query failed for ${name}: ${response.status}`)
  absentMatches[name] = await response.json()
}
const supabaseById = new Map(supabaseRows.map((row) => [row.id, row]))

const live = await client.fetch(`{
  "sources": *[_id in $sourceIds]{...},
  "places": *[_id in $placeIds]{...},
  "candidates": *[_id in $candidateIds]{...},
  "facts": *[_id in $factIds]{...},
  "audits": *[_id in $auditIds]{...},
  "destinationPublished": *[_id == $destinationId][0]{...},
  "destinationDraft": *[_id == $destinationDraftId][0]{...},
  "publishedFacts": count(*[_type == "islandFact" && !(_id in path("drafts.**"))]),
  "grandBahamaFactChannels": count(*[_type == "islandFact" && _id in path("drafts.**") && destination._ref == $destinationId && count(channels) > 0])
}`, {
  sourceIds: Object.values(sourceIds), placeIds: Object.values(placeIds), candidateIds: Object.values(candidateIds),
  factIds: Object.values(factIds), auditIds: Object.values(auditIds), destinationId, destinationDraftId,
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
if (!live.destinationPublished) throw new Error(`Missing published destination: ${destinationId}`)

const destinationReference = reference(destinationId, 'destination-grand-bahama')
const newSources = [
  {
    _id: sourceIds.lucayanTourism, _type: 'researchSource', title: 'Lucayan National Park — official visitor restrictions', url: urls.lucayanTourism,
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['nature', 'access', 'safety'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official visitor listing that identifies the park and states that swimming in the caves is prohibited and diving requires a permit. Use BNT for current managing-authority hours, fees, facilities, closures, and rules. Neither source approves a routing point, recreational cave access, current water conditions, or feature-level accessibility.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck cave, swimming, diving, permit, access, closure, and visitor-rule language against the current BNT park page.', nextAction: 'Keep every cave and water activity blocked unless the current managing authority and any required permit process are verified.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  {
    _id: sourceIds.portTourism, _type: 'researchSource', title: 'Port Lucaya Marketplace — official tourism listing', url: urls.portTourism,
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['experiences', 'food', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Current official tourism listing supporting the Port Lucaya Marketplace identity and Sea Horse Road context. It links the operator website but does not establish current tenant counts, hours, events, duty-free eligibility, public entrances, parking, transport, accessibility, or operation of any named business.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck the identity, address, contact block, operator link, and any changed facility description.', nextAction: 'Use this as identity context only until a current responsible operator record resolves venue and tenant operation.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change']}),
  },
  {
    _id: sourceIds.portContact, _type: 'researchSource', title: 'Port Lucaya Marketplace — responsible operator contact and legal identity', url: urls.portContact,
    publisher: 'Bahamaland Investments Limited d.b.a. Port Lucaya Marketplace', sourceClass: 'operator', authorityLevel: 'primary',
    destinations: [destinationReference], topics: ['overview', 'experiences', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'active',
    notes: 'Responsible-site contact page naming Bahamaland Investments Limited d.b.a. Port Lucaya Marketplace and publishing Seahorse Road/Bell Channel Way, telephone, and email. It establishes a Board-gated verification route and operator identity, not current marketplace, tenant, event, schedule, access, safety, or accessibility status. No contact was made.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck legal/trading identity, address, telephone, email, and whether the contact route remains responsible for marketplace operations.', nextAction: 'If operational verification is needed, prepare a question set and obtain Board approval before external contact; do not send from this workflow.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change']}),
  },
]

const sourceUpdates = {
  [sourceIds.islandProfile]: {
    checkedAt, nextReviewAt: nextStableReviewAt,
    notes: 'Current official island profile supporting the Grand Bahama/Freeport identity, Freeport as the country’s second-largest city, the four signature-place identities, and Grand Bahama International Airport as a named gateway. It does not substantiate a fixed best season or stay length, value or family ranking, “world-class” or “Caribbean’s finest” claims, a fixed Fort Lauderdale duration, easy logistics, live routes, venue operation, or universal suitability.',
    reviewPlan: reviewPlan({cadenceDays: 90, relationship: 'official_context_publisher', reviewScope: 'Recheck island identity, named gateways and signature places, and any changed access or operational wording.', nextAction: 'Keep seasonal, duration, route, value, suitability, ranking, venue, and activity claims separately evidenced and current.'}),
  },
  [sourceIds.goldRock]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official page identifying Gold Rock Beach inside Lucayan National Park, with low-tide shoreline context and limited amenities. Use BNT as managing authority for current operation, rules, hours, fees, facilities, and access. Neither source establishes the exact public entrance, live swimming conditions, emergency readiness, feature-level accessibility, or an approved canonical point.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck beach identity, park relationship, tide wording, amenities, access, and any closure or condition notice.', nextAction: 'Verify the correct public entrance, park operation, tide and swimming conditions, route, facilities, safety, accessibility, and point purpose before delivery.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.lucayanBnt]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current managing-authority page publishing Lucayan National Park identity, beach access, boardwalks and trails, restrooms, visitor centre, warden, fees, tours by arrangement, and current hours. Fees, hours, facilities, closures, tours, and access are volatile. A separate official tourism listing records cave swimming and diving restrictions. Neither source identifies the tourism map point as the entrance, trailhead, or park centroid.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck current hours, fees, closure notices, facilities, visitor centre, warden, tours, cave and beach access, rules, and contact route.', nextAction: 'Verify the live park state and exact visitor entrance before routing; retain cave, water, safety, accessibility, and permit boundaries.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.petersonBnt]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current managing-authority page distinguishing the protected park, expanded in 2015 to about 1,000 acres and mostly marine habitat, from the small cay. It describes wilderness, little infrastructure, limited trails, and no on-site guard. A point on the cay cannot represent the full park boundary, landing, mooring, safe route, or visitor access.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck park extent, cay-versus-park identity, rules, infrastructure, guard status, access, permitted activities, and closures.', nextAction: 'Use an area/protected-area model; separately verify a licensed vessel, landing or mooring, conditions, permit or guide needs, safety, accessibility, and emergency fallback.', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.portOperator]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck',
    notes: 'The responsible operator homepage is reachable but not safe as current operational evidence: it displays a 2016 copyright marker and internally inconsistent facility counts, including 11 bars in one passage and 7 bars in another. Treat tenant, venue, event, service, hours, and count claims as stale or conflicting until the responsible operator resolves them. No external contact was made.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'primary_source_scope_requires_review', attention: true, reviewScope: 'Recheck page dates, operator ownership, marketplace operation, internal count conflicts, tenant directory, events, services, hours, address, access, safety, accessibility, and any superseding source.', nextAction: 'Keep operation and traveler copy blocked. Prepare a bounded verification question set and obtain Board approval before any external contact.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change']}),
  },
}

const sourcePlans = newSources.map((source) => ({source, needsUpdate: differs(sourceById.get(source._id), source)}))
const sourceUpdatePlans = Object.entries(sourceUpdates).map(([id, fields]) => {
  const current = sourceById.get(id)
  if (!current) throw new Error(`Missing existing source: ${id}`)
  return {id, fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields)}
})

const goldRock = placeById.get(placeIds.goldRock)
const lucayan = placeById.get(placeIds.lucayan)
const placeFields = {
  [placeIds.goldRock]: {
    active: false, channels: [], catalogReviewStatus: 'location_blocked', reviewedAt: checkedAt,
    evidenceSources: mergeReferences(goldRock.evidenceSources, [sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.publicMap], 'grand-bahama-pilot-source'),
    catalogLocationReview: {
      ...goldRock.catalogLocationReview, checkedAt, evidenceSources: references([sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.publicMap], 'location-source'),
      operationEvidenceStatus: 'current_managing_authority', accessEvidenceStatus: 'partial_official_context', reviewDecision: 'pending',
      notes: 'The official tourism point is a beach-feature candidate, not a verified park entrance, boardwalk start, safe route, or accessibility point. The Supabase row still lacks a usable coordinate. Current BNT context supports park management and facilities but not live beach conditions or an accepted point. Keep the coordinate decision pending.',
    },
    catalogTravelerReadinessReview: {
      ...goldRock.catalogTravelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt,
      responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'partial_official_context',
      sources: references([sourceIds.lucayanBnt, sourceIds.goldRock, sourceIds.publicMap], 'source'),
      notes: 'Current sources identify Gold Rock Beach within Lucayan National Park and publish park-level facilities, fees, hours, and access context. Before delivery, verify the live park state, exact public entrance and route, boardwalk or trail condition, tide and swimming conditions, weather, facilities, emergency response, feature-level accessibility, and coordinate purpose.',
    },
    catalogReviewNotes: 'Identity and park-management evidence are strong, but the Supabase row still lacks a usable point and the tourism beach point is not a verified entrance. Keep this overlay inactive, channel-free, location-blocked, and delivery-blocked.',
  },
  [placeIds.lucayan]: {
    active: false, channels: [], catalogReviewStatus: 'location_blocked', reviewedAt: checkedAt,
    evidenceSources: mergeReferences(lucayan.evidenceSources, [sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.publicMap], 'grand-bahama-pilot-source'),
    catalogLocationReview: {
      ...lucayan.catalogLocationReview,
      candidates: (lucayan.catalogLocationReview?.candidates || []).map((candidate) => ({...candidate, relationship: 'visitor_site', notes: 'The official tourism business point is retained as a visitor-site candidate only. It is not identified as the park entrance, trailhead, cave access, beach access, or boundary centroid and is not accepted for canonical routing.'})),
      checkedAt, evidenceSources: references([sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.publicMap], 'location-source'),
      operationEvidenceStatus: 'current_managing_authority', accessEvidenceStatus: 'partial_official_context', reviewDecision: 'pending',
      notes: 'BNT publishes current managing-authority operations and visitor-facility context. The tourism map supplies a visitor-site point, not an identified entrance, trailhead, cave access, beach access, or park centroid. The Supabase row still lacks a usable coordinate. Keep the point decision pending.',
    },
    catalogTravelerReadinessReview: {
      ...lucayan.catalogTravelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt,
      responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'partial_official_context', safetyStatus: 'specific_hazard_context',
      sources: references([sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.publicMap], 'source'),
      notes: 'BNT currently publishes park hours, fees, facilities, beach access, boardwalks, trails, visitor centre, warden, and tours by arrangement. Official tourism says cave swimming is prohibited and diving requires a permit. Recheck closures, the exact entrance and open facilities, cave and water rules, conditions, emergency response, accessibility, and the pending coordinate before delivery.',
    },
    catalogReviewNotes: 'Current managing-authority evidence improves operation and restrictions, but the map point remains a visitor-site candidate and the Supabase row lacks a usable coordinate. Keep inactive, channel-free, location-blocked, and delivery-blocked.',
  },
}
const placePlans = Object.entries(placeFields).map(([id, fields]) => ({id, current: placeById.get(id), fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, placeById.get(id)[key]])), fields)}))

const peterson = candidateById.get(candidateIds.peterson)
const portLucaya = candidateById.get(candidateIds.portLucaya)
const candidateFields = {
  [candidateIds.peterson]: {
    identityEvidence: mergeReferences(peterson.identityEvidence, [sourceIds.islandProfile, sourceIds.petersonBnt, sourceIds.publicMap], 'grand-bahama-pilot-source'),
    identityBoundary: 'Peterson Cay is a small physical cay within Peterson Cay National Park. BNT says the protected park expanded in 2015 to about 1,000 acres and is mostly marine habitat; the tourism point on the cay cannot stand for the full protected-area geometry, a landing, a mooring, or a safe visitor route.',
    locationReview: {
      ...peterson.locationReview,
      candidates: (peterson.locationReview?.candidates || []).map((candidate) => ({...candidate, relationship: 'related_site', notes: 'This point identifies the cay component within the much larger protected park. It is not a park boundary, centroid, landing, mooring, entrance, or safe route and must not become the park coordinate.'})),
      checkedAt, reconciliationStatus: 'area_identity_no_point', reviewDecision: 'not_applicable',
      evidenceSources: references([sourceIds.petersonBnt, sourceIds.islandProfile, sourceIds.publicMap], 'location-source'),
      notes: 'Use an area/protected-area model. The small-cay point is related component evidence only and no canonical park point is applicable or accepted. Landing, mooring, route, conditions, access, emergency response, and accessibility remain separate live checks.',
    },
    travelerReadinessReview: {
      ...peterson.travelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt,
      responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context',
      sources: references([sourceIds.petersonBnt, sourceIds.islandProfile, sourceIds.publicMap], 'source'),
      notes: 'BNT identifies a mostly marine protected park with little infrastructure, limited trails, and no on-site guard; national tourism describes boat access to the small cay. Confirm current BNT rules, a responsible licensed vessel, landing or mooring, weather and sea state, permits or guide needs, protected-area conduct, emergency readiness, accessibility, and disruption fallback. Do not route to the cay point as the whole park.',
    },
    reviewedAt: checkedAt,
    reviewNotes: 'The exact protected-area identity remains absent from the Supabase places table. The park needs an area model; the cay point is a related component and is not accepted. No Supabase write, coordinate, operation, media, or traveler delivery is approved.',
  },
  [candidateIds.portLucaya]: {
    identityEvidence: mergeReferences(portLucaya.identityEvidence, [sourceIds.islandProfile, sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator, sourceIds.publicMap], 'grand-bahama-pilot-source'),
    identityBoundary: 'Official tourism and the responsible contact page support the Port Lucaya Marketplace identity and Sea Horse Road/Bell Channel Way context. The tourism point is a venue-area candidate, not a verified public entrance. Count Basie Square and each tenant, event, service, or business require separate identity and current-operation checks.',
    locationReview: {
      ...portLucaya.locationReview,
      candidates: (portLucaya.locationReview?.candidates || []).map((candidate) => ({...candidate, relationship: 'visitor_site', notes: 'The dated official tourism business point is retained as a venue-area visitor-site candidate. It is not identified as the current public entrance, parking or transport point, accessible route, or tenant location and remains unaccepted.'})),
      checkedAt, operationEvidenceStatus: 'not_established', accessEvidenceStatus: 'partial_official_context', reviewDecision: 'pending',
      evidenceSources: references([sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator, sourceIds.publicMap], 'location-source'),
      notes: 'Official tourism and the responsible contact page support identity and address context, but the homepage is visibly stale and internally inconsistent. The 2020 tourism point remains a pending venue-area candidate, not a verified entrance or accessible route. No point is accepted.',
    },
    travelerReadinessReview: {
      ...portLucaya.travelerReadinessReview, checkedAt, nextReviewAt: nextOperationalReviewAt,
      responsibleSourceStatus: 'source_conflict', operationStatus: 'source_conflict', accessStatus: 'partial_official_context', copyStatus: 'blocked_by_source_conflict',
      sources: references([sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator, sourceIds.publicMap], 'source'),
      notes: 'The official listing and responsible contact page support identity and a verification route. The operator homepage has a 2016 copyright marker and conflicting bar counts, so marketplace, tenant, event, service, and schedule claims are not current enough for delivery. Verify venue operation, tenant directory, hours, entrances, transport, parking, accessibility, closures, safety, and media through a Board-approved workflow.',
    },
    reviewedAt: checkedAt,
    reviewNotes: 'The exact marketplace identity remains absent from the Supabase places table. Identity and responsible contact are supported, but operation is source-conflicted and the tourism point is unaccepted. No external contact, Supabase write, media use, or traveler delivery occurred.',
  },
}
const candidatePlans = Object.entries(candidateFields).map(([id, fields]) => ({id, current: candidateById.get(id), fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, candidateById.get(id)[key]])), fields)}))

const factFields = {
  [factIds.goldRock]: {
    title: 'Gold Rock Beach: park, tide, access, and point boundary', topic: 'access',
    claim: 'Current official tourism identifies Gold Rock Beach inside Lucayan National Park and describes low-tide shoreline context and limited amenities. BNT publishes current park-level hours, fees, facilities, and access context. These sources do not establish a verified public entrance, live swimming conditions, feature-level accessibility, or an accepted canonical point.',
    travelerGuidance: 'Recheck the live park state, exact public entrance and route, boardwalk or trail condition, tide and swimming conditions, weather, facilities, emergency response, accessibility, and coordinate purpose before delivery.',
    sources: references([sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [],
    editorNotes: 'Draft evidence boundary only. The matched overlay remains inactive and channel-free; no coordinate, condition, media, or traveler delivery is approved.',
  },
  [factIds.lucayan]: {
    title: 'Lucayan National Park: current operation, restrictions, and point boundary', topic: 'safety',
    claim: 'BNT publishes current managing-authority hours, fees, beach access, boardwalks, trails, restrooms, visitor centre, warden, and tours-by-arrangement context. Official tourism states that swimming in the caves is prohibited and diving requires a permit. The tourism map point is not identified as an entrance, trailhead, cave access, beach access, or park centroid.',
    travelerGuidance: 'Recheck current hours, fees, closures, open facilities, exact entrance, cave and water rules, permit path, conditions, emergency response, feature-level accessibility, and the pending coordinate before delivery.',
    sources: references([sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [],
    editorNotes: 'Draft evidence boundary only. Current operation evidence does not accept a point, guarantee access, or authorize recreational cave use or delivery.',
  },
  [factIds.peterson]: {
    title: 'Peterson Cay National Park: park-versus-cay area boundary', topic: 'nature',
    claim: 'BNT says Peterson Cay National Park expanded in 2015 to about 1,000 acres and is mostly protected marine habitat, while the physical cay is much smaller. It describes wilderness with little infrastructure, limited trails, and no on-site guard. The tourism point on the cay cannot represent the full park boundary, a landing, a mooring, or a safe route.',
    travelerGuidance: 'Use an area/protected-area model. Verify current BNT rules, a licensed vessel, landing or mooring, sea and weather conditions, permits or guide needs, safety, emergency fallback, and accessibility before any recommendation.',
    sources: references([sourceIds.petersonBnt, sourceIds.islandProfile, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [],
    editorNotes: 'Draft evidence boundary only. The cay point is related component evidence and no canonical park coordinate, Supabase record, media, or delivery is approved.',
  },
  [factIds.portLucaya]: {
    title: 'Port Lucaya Marketplace: operator-page freshness conflict', topic: 'experiences',
    claim: 'Official tourism and the responsible contact page support the Port Lucaya Marketplace identity and Sea Horse Road/Bell Channel Way context. The operator homepage is reachable but displays a 2016 copyright marker and internally inconsistent venue counts, so it is not reliable current evidence for marketplace, tenant, event, service, or schedule claims.',
    travelerGuidance: 'Treat operation, tenants, events, hours, entrances, transport, parking, accessibility, duty-free eligibility, closures, and services as unverified until a fresh responsible source resolves them. External verification requires Board approval.',
    sources: references([sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator, sourceIds.publicMap], 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [],
    editorNotes: 'Identity and contact-route evidence are source-backed; current operation is source-conflicted. No contact, coordinate, catalog write, media, or delivery is approved.',
  },
  [factIds.publicCopy]: {
    _id: factIds.publicCopy, _type: 'islandFact', title: 'Grand Bahama: public destination-copy evidence boundary', destination: destinationReference, topic: 'overview',
    claim: 'Current official evidence supports the Grand Bahama/Freeport identity, Freeport as the country’s second-largest city, Grand Bahama International Airport as a named gateway, and Lucayan National Park, Gold Rock Beach, Peterson Cay National Park, and Port Lucaya Marketplace as signature identities. It does not substantiate the current public copy’s fixed best season or stay length, universal family or value positioning, fixed Fort Lauderdale flight duration, easy-logistics claim, superlative diving and reef rankings, or broad current marketplace and activity claims.',
    travelerGuidance: 'Use the corrective destination draft for editorial review. Verify current routes, schedules, total trip time, park and venue operation, conditions, suitability, accessibility, prices, and media rights for the traveler’s dates before delivery.',
    sources: references([sourceIds.islandProfile, sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact], 'source'),
    checkedAt, nextReviewAt: nextOperationalReviewAt, volatility: 'operational', confidence: 'high', verificationStatus: 'source_verified', channels: [],
    editorNotes: 'Review-only evidence boundary. Published Sanity and hardcoded web/Buddy copy remain unchanged until separate editorial approval and release.',
  },
}
const factPlans = Object.entries(factFields).map(([id, fields]) => {
  const current = factById.get(id)
  const planned = current ? {...current, ...fields} : fields
  return {id, current, fields, planned, needsUpdate: differs(current, planned)}
})

const auditSourceAdditions = {
  [auditIds.catalog]: [sourceIds.islandProfile, sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact],
  [auditIds.locations]: [sourceIds.publicMap, sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact],
  [auditIds.candidates]: [sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator, sourceIds.publicMap],
  [auditIds.traveler]: [sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator, sourceIds.publicMap],
  [auditIds.matched]: [sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.publicMap],
  [auditIds.content]: [sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator, sourceIds.mediaBoundary],
  [auditIds.freshness]: [sourceIds.lucayanTourism, sourceIds.portTourism, sourceIds.portContact],
}

const gapActions = {
  [auditIds.catalog]: {
    '2 official signature-place identities are absent from the canonical catalog': 'Keep controlled draft candidates for Peterson Cay National Park and Port Lucaya Marketplace. Peterson requires an area/protected-area model; Port Lucaya requires source-conflict resolution. Complete duplicate, category, operation, access, safety, accessibility, copy, and media gates before any separate approved Supabase change.',
    '2 matched signature-place rows fail the location gate': 'Keep Lucayan National Park and Gold Rock Beach inactive and channel-free. The Supabase rows still lack usable coordinates; neither tourism point is an accepted entrance or route, and Lucayan’s point is classified as a visitor-site candidate.',
  },
  [auditIds.locations]: {
    '2 official signature-place coordinate candidates await adjudication': 'For Gold Rock Beach, verify whether the beach-feature point is useful without treating it as the park entrance. For Lucayan National Park, retain the tourism point as a visitor-site candidate only. Keep both overlays inactive and channel-free and make no Supabase coordinate change.',
  },
  [auditIds.candidates]: {
    'Canonical-place decision pending: Peterson Cay National Park': 'Use an area/protected-area model. The small-cay tourism point is related component evidence, not the 1,000-acre park boundary, landing, mooring, entrance, centroid, or route. Resolve identity, geometry, duplicate, access, safety, accessibility, copy, and media gates before a separate approved Supabase change.',
    'Canonical-place decision pending: Port Lucaya Marketplace': 'Resolve the stale and internally inconsistent operator homepage, verify the exact venue identity and public entrance, and complete operation, tenant, access, safety, accessibility, copy, media, and duplicate checks before a separate approved Supabase change. The 2020 tourism point remains pending.',
  },
  [auditIds.traveler]: {
    'Traveler-readiness delivery gate remains blocked: Peterson Cay National Park': 'Confirm current BNT rules, a responsible licensed vessel, landing or mooring, weather and sea state, permits or guide needs, protected-area conduct, emergency readiness, accessibility, and disruption fallback. Do not route to the cay point as the full park.',
    'Traveler-readiness delivery gate remains blocked: Port Lucaya Marketplace': 'Resolve the operator-page freshness conflict and verify venue operation, tenant directory, events, hours, exact entrances, transport, parking, accessibility, closures, safety, services, and approved media through a Board-approved workflow before delivery.',
  },
  [auditIds.matched]: {
    'Matched signature-place traveler delivery remains blocked: Gold Rock Beach': 'Recheck the live park state, exact public entrance and route, boardwalk or trail condition, tides and swimming conditions, weather, facilities, emergency response, feature-level accessibility, media, and the pending coordinate before delivery.',
    'Matched signature-place traveler delivery remains blocked: Lucayan National Park': 'Recheck current BNT hours, fees, closures, open facilities, exact entrance, cave and water restrictions, permit path, weather, emergency response, feature-level accessibility, media, and the visitor-site point before delivery.',
  },
  [auditIds.content]: {
    'Complete traveler-safe copy review: Port Lucaya Marketplace': 'Keep all channels closed while the stale and internally inconsistent operator page remains unresolved. Verify current venue and tenant operation, access, accessibility, safety, copy, and licensed media before any editorial publication decision.',
    'Complete traveler-safe copy review: Peterson Cay National Park': 'Keep all channels closed. Use an area/protected-area model and verify vessel, landing or mooring, rules, conditions, safety, accessibility, copy, and licensed media before any editorial publication decision.',
  },
}

const auditPlans = Object.entries(auditSourceAdditions).map(([id, additions]) => {
  const current = auditById.get(id)
  const actions = gapActions[id] || {}
  let gaps = (current.gaps || []).map((gap) => actions[gap.title] ? {...gap, action: actions[gap.title], status: gap.status === 'resolved' ? 'resolved' : 'researching'} : gap)
  for (const title of Object.keys(actions)) if (!gaps.some((gap) => gap.title === title)) throw new Error(`Missing target gap in ${id}: ${title}`)
  if (id === auditIds.freshness && !gaps.some((gap) => gap.title === 'Recheck flagged source: Port Lucaya Marketplace')) {
    gaps = [...gaps, {_type: 'researchGap', _key: 'gap-grand-bahama-source-port-lucaya-freshness', title: 'Recheck flagged source: Port Lucaya Marketplace', topic: 'experiences', priority: 'p1', action: 'Resolve the 2016 copyright marker and internally inconsistent venue counts with a current responsible source. Verify marketplace, tenant, event, service, hours, access, accessibility, and superseding evidence; external contact requires Board approval.', status: 'researching'}]
  }
  if (id === auditIds.freshness) {
    gaps = gaps.map((gap) => gap.title === 'Source ownership and cadence profiled: 50 records' ? {...gap, title: 'Source ownership and cadence profiled: 53 records', action: 'The audit now routes 53 sources, including current Lucayan visitor restrictions, official Port Lucaya identity context, and the responsible Port Lucaya contact route. The stale operator homepage remains attention-required.'} : gap)
  }
  const sources = mergeReferences(current.sources, additions, 'grand-bahama-pilot-source')
  const addition = ' The Grand Bahama pilot now distinguishes park geometry from cay points, classifies Lucayan’s map point as a visitor site, records current cave restrictions, identifies the Port Lucaya responsible contact route, flags the stale operator page, and records a public-copy conflict. These changes do not approve coordinates, Supabase writes, current venue claims, media, publication, or traveler delivery.'
  const methodologyNotes = current.methodologyNotes?.includes('The Grand Bahama pilot now distinguishes') ? current.methodologyNotes : `${current.methodologyNotes || ''}${addition}`.trim()
  return {id, current, gaps, sources, methodologyNotes, needsUpdate: differs(current.gaps, gaps) || differs(current.sources, sources) || current.methodologyNotes !== methodologyNotes}
})

const publicCopyAudit = {
  _id: auditIds.publicCopy, _type: 'islandResearchAudit', title: 'Grand Bahama public-copy conflict review — 2026-08-05', destination: destinationReference,
  auditedAt: checkedAt, nextAuditAt: nextOperationalReviewAt, owner: 'Baha Buddy Content Operations', status: 'researching', overallScore: 1.5,
  coverage: [
    ['overview', 2, 'Official identity and four signature-place anchors are strong, while public copy includes unsupported superlatives and broad suitability claims.'],
    ['access', 1, 'FPO is a named gateway, but current carriers, routes, flight duration, total transfer, ground transport, and disruption fallback remain runtime checks.'],
    ['stays', 1, 'No current evidence set supports a fixed recommended stay or universal value position.'],
    ['food', 1, 'The marketplace identity exists, but current tenant, dining, duty-free, and hours claims are not established.'],
    ['experiences', 1, 'Named diving, dolphin, off-road, kayaking, shopping, and entertainment claims require exact current responsible sources.'],
    ['nature', 3, 'BNT and official tourism provide strong bounded evidence for Lucayan, Gold Rock, and Peterson Cay identities and management context.'],
    ['culture', 1, 'Freeport and Port Lucaya context exists, but current events, tenants, and community interpretation remain incomplete.'],
    ['seasonality', 0, 'The reviewed evidence does not establish a universal November–April best season or a fixed trip length.'],
    ['safety', 1, 'Park restrictions and low-infrastructure context are recorded; live conditions, entrances, emergency response, and universal suitability are not.'],
    ['accessibility', 0, 'No complete responsible feature-level accessibility evidence supports the public destination, park, beach, marine, marketplace, or transfer claims.'],
  ].map(([topic, score, finding]) => ({_type: 'researchCoverageScore', _key: `coverage-${topic}`, topic, score, evidenceCount: 0, finding})),
  gaps: [
    {_type: 'researchGap', _key: 'gap-grand-bahama-public-copy-conflict', topic: 'overview', priority: 'p0', title: 'Published Grand Bahama destination and Buddy copy contains unsupported season, duration, suitability, value, access, and ranking claims', action: 'Review the prepared corrective destination draft. Remove fixed best-season and stay-length claims, universal family/value positioning, fixed Fort Lauderdale duration, easy-logistics language, superlative diving/reef claims, and broad current venue or activity claims unless each is supported by current accountable evidence.', status: 'researching'},
    {_type: 'researchGap', _key: 'gap-grand-bahama-runtime-verification', topic: 'access', priority: 'p1', title: 'Grand Bahama gateway, park, venue, activity, and accessibility details remain runtime checks', action: 'For the traveler’s dates, verify current carriers and routes, total travel time, transfers, park and venue operation, conditions, licensed providers, prices, cancellation, safety, accessibility, and media rights.', status: 'researching'},
  ],
  sources: references([sourceIds.islandProfile, sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact, sourceIds.portOperator], 'source'),
  methodologyNotes: 'This review compares the published Sanity destination and four hardcoded web/Buddy content surfaces with current official, conservation, and responsible-operator evidence. It prepares a safer destination draft but does not alter or unpublish live content, select a provider or venue, approve a route, coordinate, price, media asset, channel, or traveler delivery, or contact an external party.',
}
const publicCopyAuditNeedsUpdate = differs(auditById.get(auditIds.publicCopy), publicCopyAudit)

const destinationDraft = {
  _id: destinationDraftId, _type: 'destination', name: live.destinationPublished.name,
  slug: {_type: 'slug', current: 'grand-bahama'}, islandId: 'grand-bahama', routeAliases: live.destinationPublished.routeAliases || [],
  tagline: 'Freeport and Lucaya services alongside protected parks, beaches, caves, and offshore marine habitat.',
  overview: [
    block('grand-bahama-overview-1', 'Grand Bahama combines Freeport and Lucaya visitor services with pine forest, mangrove, cave, beach, reef, and protected marine environments. Current official tourism identifies Freeport as The Bahamas’ second-largest city.'),
    block('grand-bahama-overview-2', 'Lucayan National Park and Gold Rock Beach have current managing-authority context from the Bahamas National Trust. Peterson Cay National Park requires an area-based protected-park model, while Port Lucaya Marketplace needs a fresh operation check because its operator website is visibly stale and internally inconsistent.'),
  ],
  highlights: [
    {_type: 'destinationHighlight', _key: 'highlight-lucayan', label: 'Lucayan National Park', description: 'BNT-managed park with caves, boardwalks, trails, visitor facilities, and beach access; verify live hours, fees, closures, entrance, and restrictions.'},
    {_type: 'destinationHighlight', _key: 'highlight-gold-rock', label: 'Gold Rock Beach', description: 'Beach within Lucayan National Park with low-tide shoreline context; verify entrance, conditions, facilities, and accessibility.'},
    {_type: 'destinationHighlight', _key: 'highlight-peterson', label: 'Peterson Cay National Park', description: 'Mostly marine protected park around a small cay; verify licensed vessel access, rules, conditions, and emergency fallback.'},
    {_type: 'destinationHighlight', _key: 'highlight-port-lucaya', label: 'Port Lucaya Marketplace', description: 'Official marketplace identity in Lucaya; current venue, tenant, event, service, and accessibility details need a fresh responsible-source check.'},
  ],
  gettingThere: 'Grand Bahama International Airport (FPO) is a named gateway. Verify the current carrier, route, schedule, airport and ground-transfer state, total travel time, baggage and assistance needs, disruption notices, and fallback for the traveler’s dates.',
  airports: [{_type: 'gateway', _key: 'airport-fpo', code: 'FPO', name: 'Grand Bahama International Airport', type: 'airport', note: 'Named gateway only; current routes, schedules, terminal state, assistance, transfers, and disruptions require a live check.'}],
  tripFit: {_type: 'object', vibe: 'Parks, beaches, marine areas, and Freeport/Lucaya services'},
  practicalNotes: [block('grand-bahama-practical-1', 'Recheck park and venue operation, exact entrances and routes, weather and marine conditions, permits, licensed providers, emergency response, accessibility, prices, and cancellation terms for the traveler’s dates. Do not use a map point as proof of a safe entrance or route.')],
  faqs: [], featured: false, order: live.destinationPublished.order ?? 99,
  channels: live.destinationPublished.channels || ['web', 'mobile', 'buddy'], reviewedAt: checkedAt,
  source: {...live.destinationPublished.source, notes: 'Review-only corrective draft prepared from current official, conservation, and responsible-operator evidence. It removes unsupported seasonal, duration, value, suitability, access, ranking, venue, and activity claims. The published destination and hardcoded fallbacks remain unchanged until separate editorial approval and release.'},
  seo: {_type: 'seo', metaTitle: 'Freeport — Grand Bahama Island', metaDescription: 'Plan Grand Bahama around Freeport and Lucaya services, protected parks, beaches, caves, and marine areas, with current route and access checks.'},
  evidenceSources: references([sourceIds.islandProfile, sourceIds.goldRock, sourceIds.lucayanBnt, sourceIds.lucayanTourism, sourceIds.petersonBnt, sourceIds.portTourism, sourceIds.portContact], 'evidence-source'),
  editorialReviewStatus: 'ready_for_review',
  editorialReviewNotes: 'The published destination and hardcoded web/Buddy copy include claims not supported by the current evidence set. Review this corrective draft, verify any route, schedule, duration, park, venue, activity, suitability, safety, accessibility, price, and media claim separately, and publish only through the normal editorial release process.',
}
const destinationDraftNeedsUpdate = differs(live.destinationDraft, destinationDraft)

const prospectivePlaces = placePlans.map((plan) => ({...plan.current, ...plan.fields}))
const prospectiveCandidates = candidatePlans.map((plan) => ({...plan.current, ...plan.fields}))
const prospectiveFacts = factPlans.map((plan) => plan.planned)
const prospectiveAudits = [...auditPlans.map((plan) => ({...plan.current, gaps: plan.gaps, sources: plan.sources, methodologyNotes: plan.methodologyNotes})), publicCopyAudit]
const trackedP0Titles = new Set(['Published Grand Bahama destination and Buddy copy contains unsupported season, duration, suitability, value, access, and ranking claims', ...Object.values(gapActions).flatMap((actions) => Object.keys(actions))])
const guardrails = {
  allOfficialSignalsPresent: Object.values(sourceSignals).flatMap((group) => Object.values(group)).every(Boolean),
  allPublicCopySignalsPresent: Object.values(publicCopySignals).every(Boolean),
  exactSupabaseRowsLoaded: supabaseRows.length === 2 && Object.values(supabaseIds).every((id) => supabaseById.has(id)),
  missingCanonicalIdentitiesRemainAbsentFromSupabasePlaces: Object.values(absentMatches).every((rows) => rows.length === 0),
  matchedSupabaseRowsStillLackUsablePoints: Object.values(supabaseIds).every((id) => supabaseById.get(id)?.latitude == null && supabaseById.get(id)?.longitude == null),
  allReviewContentRemainsDraftOnly: [...prospectivePlaces, ...prospectiveCandidates, ...prospectiveFacts, ...prospectiveAudits, destinationDraft].every((document) => document._id.startsWith('drafts.')),
  allFourPlaceReviewsRemainBlocked: [...prospectivePlaces.map((place) => place.catalogTravelerReadinessReview), ...prospectiveCandidates.map((candidate) => candidate.travelerReadinessReview)].every((review) => review?.deliveryDecision === 'blocked' && review?.overallStatus === 'blocked'),
  matchedOverlaysRemainInactiveAndChannelFree: prospectivePlaces.every((place) => place.active === false && (place.channels || []).length === 0),
  noAcceptedCoordinateDecision: [...prospectivePlaces.map((place) => place.catalogLocationReview).filter(Boolean), ...prospectiveCandidates.map((candidate) => candidate.locationReview)].every((review) => review?.reviewDecision !== 'accepted'),
  petersonUsesAreaModel: candidateFields[candidateIds.peterson].locationReview.reconciliationStatus === 'area_identity_no_point' && candidateFields[candidateIds.peterson].locationReview.reviewDecision === 'not_applicable',
  portLucayaOperationRemainsSourceConflicted: candidateFields[candidateIds.portLucaya].travelerReadinessReview.operationStatus === 'source_conflict' && sourceUpdates[sourceIds.portOperator].status === 'needs_recheck',
  factsRemainSourceVerifiedDraftsWithoutChannels: prospectiveFacts.every((fact) => fact.verificationStatus === 'source_verified' && (fact.channels || []).length === 0 && fact.sources?.length >= 3),
  correctiveDestinationRemainsDraftAndPublishedDestinationUntouched: destinationDraft._id === destinationDraftId && live.destinationPublished._id === destinationId,
  existingPortfolioHasNoPublishedResearchFacts: live.publishedFacts === 0,
  existingGrandBahamaFactsHaveNoDeliveryChannels: live.grandBahamaFactChannels === 0,
  everyTrackedP0RemainsOpen: prospectiveAudits.flatMap((audit) => audit.gaps || []).filter((gap) => trackedP0Titles.has(gap.title)).every((gap) => gap.priority !== 'p0' || ['open', 'researching'].includes(gap.status)),
}
if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const plan = {
  generatedAt: new Date().toISOString(), output: outputPath, mode: apply ? 'apply' : 'dry_run', sourceSignals, publicCopySignals,
  supabaseEvidence: {rows: supabaseRows, absentMatches},
  counts: {
    sourcesToCreateOrReplace: sourcePlans.filter((plan) => plan.needsUpdate).length,
    existingSourcesToUpdate: sourceUpdatePlans.filter((plan) => plan.needsUpdate).length,
    placeDraftsToUpdate: placePlans.filter((plan) => plan.needsUpdate).length,
    candidateDraftsToUpdate: candidatePlans.filter((plan) => plan.needsUpdate).length,
    factDraftsToCreateOrUpdate: factPlans.filter((plan) => plan.needsUpdate).length,
    auditDraftsToCreateOrUpdate: auditPlans.filter((plan) => plan.needsUpdate).length + Number(publicCopyAuditNeedsUpdate),
    destinationDraftsToCreateOrUpdate: Number(destinationDraftNeedsUpdate),
  },
  guardrails,
  changes: {
    sourceIds: sourcePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.source._id),
    existingSourceIds: sourceUpdatePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    placeIds: placePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    candidateIds: candidatePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    factIds: factPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    auditIds: [...auditPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id), ...(publicCopyAuditNeedsUpdate ? [auditIds.publicCopy] : [])],
    destinationIds: destinationDraftNeedsUpdate ? [destinationDraftId] : [],
  },
  boundary: 'This alignment updates live/internal source records and review-only Sanity drafts for four Grand Bahama signature identities plus one corrective destination draft. It does not mutate Supabase, accept a coordinate, change published Sanity or hardcoded web/Buddy copy, publish facts, add research delivery channels, contact an operator or authority, copy media, clear rights, select a provider, price, schedule, or route, or approve traveler delivery.',
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
  if (destinationDraftNeedsUpdate) { transaction = transaction.createOrReplace(destinationDraft); documentIds.push(destinationDraftId) }
  if (documentIds.length) {
    const result = await transaction.commit({visibility: 'sync'})
    plan.commit = {transactionId: result.transactionId, documentIds}
  } else plan.commit = {transactionId: null, documentIds: []}
}

fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)
console.log(JSON.stringify(plan, null, 2))
