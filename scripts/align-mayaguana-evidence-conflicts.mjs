import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_MAYAGUANA_EVIDENCE_CONFLICTS === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const outputPath = '/private/tmp/baha-buddy-mayaguana-evidence-conflicts-plan.json'
const destinationId = 'dest-mayaguana'
const destinationDraftId = `drafts.${destinationId}`

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

const sourceIds = {
  islandProfile: 'research-source-bmot-mayaguana',
  baycanerTourism: 'research-source-bmot-baycaner',
  hotelDirectory: 'research-source-bmot-hotel-directory-2025',
  baycanerOperator: 'research-source-operator-baycaner',
  baycanerTrip: 'research-source-corrob-gofishingworldwide-mayaguana-2026',
  aopa: 'research-source-aopa-mayaguana-kneeboard-2026',
  caab2026: 'research-source-caab-government-aerodromes-2026',
  doaAirports: 'research-source-doa-airports',
  flightTable: 'research-source-bmot-flight-tables-current-review',
  boobyCay: 'research-source-bmot-booby-cay',
  abrahamsTownSquare: 'research-source-bmot-abrahams-bay-town-square',
  piratesConflict: 'research-source-bmot-pirates-well-bimini-conflict',
  publicMap: 'research-source-bmot-public-map-dataset',
  businessMap: 'research-source-bmot-business-map-pins',
  mediaBoundary: 'research-source-bmot-brand-center-media-boundary',
}

const supabaseIds = {
  baycaner: '427ca602-1fed-48a4-84b8-1c4581de80a2',
  boobyCay: '350f1104-0491-4da9-80e9-6e6baa53d583',
  horsePond: 'c64b453a-dad0-429e-9665-52714574e1ca',
  bahamaBay: '150a9cfd-e386-4607-9c29-fb648c402b88',
  albany: '11f46d18-9857-4231-afef-50a7d696add7',
  tommyBahama: '3ab05555-8783-44e5-8c44-87c1ed3744ca',
  genericMayaguana: 'ece3fee6-38c1-4092-9a93-c8832befd4c9',
  stuartCove: '5d380f05-e3b8-4456-9316-16cb705da57c',
  prestigiousTransport: 'd249261e-1c0b-4e26-b26e-5f8e66d57a81',
}

const contaminatedKeys = ['bahamaBay', 'albany', 'tommyBahama', 'genericMayaguana', 'stuartCove', 'prestigiousTransport']
const publishedPlaceIds = Object.fromEntries(Object.entries(supabaseIds).map(([key, id]) => [key, `place-supabase-${id}`]))
const placeIds = Object.fromEntries(Object.entries(publishedPlaceIds).map(([key, id]) => [key, `drafts.${id}`]))
const candidateIds = {
  abrahamsBay: 'drafts.canonical-place-candidate-mayaguana-abraham-s-bay',
  piratesWell: 'drafts.canonical-place-candidate-mayaguana-pirates-well',
}
const factIds = {
  abrahamsBay: 'drafts.island-fact-signature-point-readiness-abraham-s-bay-mayaguana',
  boobyCay: 'drafts.island-fact-matched-signature-readiness-booby-cay-mayaguana',
  accommodation: 'drafts.island-fact-deep-research-2025-accommodation-directory-mayaguana',
  operator: 'drafts.island-fact-deep-research-baycaner-operator-reconciliation-mayaguana',
  checkpoint: 'drafts.island-fact-deep-research-baycaner-2026-operation-checkpoint-mayaguana',
  airportConflict: 'drafts.island-fact-mayaguana-airport-and-route-source-conflict-boundary',
  publicCopy: 'drafts.island-fact-mayaguana-public-copy-evidence-boundary',
}
const auditId = 'drafts.island-research-audit-2026-08-05-public-copy-conflicts-mayaguana'

const urls = {
  islandProfile: 'https://www.bahamas.com/islands/mayaguana',
  baycanerTourism: 'https://www.bahamas.com/hotels/baycaner-beach-resort',
  boobyCay: 'https://www.bahamas.com/natural-wonders/booby-cay',
  abrahamsTownSquare: 'https://www.bahamas.com/plan-your-trip/things-to-do/abrahams-bay-town-square',
  piratesConflict: 'https://www.bahamas.com/plan-your-trip/things-to-do/the-pirates-well',
  flightTable: 'https://www.bahamas.com/getting-here/flying',
  doaAirports: 'https://www.doabahamas.com/',
  baycanerOperatorInsecure: 'http://www.baycanerbeachresort.com/index.php',
  hotelDirectory: 'https://www.tourismtoday.com/sites/default/files/2025-11/Hotel%20Directory%20-%202025%20Final%20Aug%202025.pdf',
  caab2026: 'https://caabahamas.com/wp-content/uploads/2026/01/The-Bahamas-Government-Owned-Aerodromes-Register.pdf',
  aopa: 'https://www.aopa.org/Kneeboard/Kneeboard/GeneratePdf?airportId=MYMM',
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

async function sourceReachable(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  return response.ok
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
    if (!byId.has(id)) byId.set(id, reference(id, `${prefix}-${index + 1}-${id.replace(/[^a-z0-9]+/gi, '-').slice(-28)}`))
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

function reviewPlan({relationship, reviewScope, nextAction, attention = false, method = 'webpage_review', triggers = ['publisher_url_or_scope_change']}) {
  return {
    _type: 'researchSourceReviewPlan', plannedAt: checkedAt, reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: attention ? 'attention_required' : 'scheduled', freshnessStatus: attention ? 'needs_recheck' : 'current',
    cadenceBand: '30_day', cadenceDays: 30, sourceRelationship: relationship, verificationMethod: method,
    changeTriggers: triggers, reviewScope, nextAction,
  }
}

function block(key, text) {
  return {_type: 'block', _key: key, style: 'normal', markDefs: [], children: [{_type: 'span', _key: `${key}-span`, text, marks: []}]}
}

function travelerReview({sourceIds: ids, responsible = 'source_conflict', operation = 'source_conflict', access = 'source_conflict', safety = 'not_established', accessibility = 'not_published', copy = 'blocked_by_source_conflict', notes}) {
  return {
    _type: 'placeTravelerReadinessReview', checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked',
    responsibleSourceStatus: responsible, operationStatus: operation, accessStatus: access, safetyStatus: safety,
    accessibilityStatus: accessibility, copyStatus: copy, mediaStatus: 'no_approved_media', deliveryDecision: 'blocked',
    sources: references(ids, 'readiness-source'), notes,
  }
}

function contentReview({sourceIds: ids, foundation = 'blocked_by_conflict', accessibility = 'not_found_in_reviewed_sources', notes}) {
  const sourceRefs = references(ids, 'content-source')
  const components = [
    ['identity', 'source_backed_internal', 'The exact catalog identity remains visible for evidence review, but identity does not approve its island assignment, point, operation, or delivery.', 'Retain the forensic row and resolve identity and island assignment before any canonical change.'],
    ['description', 'blocked', 'Catalog or source conflicts prevent a reliable traveler description.', 'Resolve the conflicting identity, island, operation, and source scope before drafting public copy.'],
    ['operation_access', 'blocked', 'Current operation, access, route, and responsible provider evidence is incomplete or conflicting.', 'Confirm the responsible source, operation, route, restrictions, assistance, and fallback for the traveler’s dates.'],
    ['safety', 'missing', 'No current feature-specific safety or emergency plan is established.', 'Verify current hazards, supervision, emergency response, communications, and traveler limitations.'],
    ['accessibility', 'missing', 'No complete responsible feature-level accessibility evidence is established.', 'Obtain routes, surfaces, gradients, transfers, toilets, sensory support, service-animal, and assistance details.'],
    ['media', 'blocked', 'No exact asset has documented reusable rights and reviewed alt text.', 'Select a controlled-library or directly licensed asset, record terms and credit, then review factual alt text.'],
    ['traveler_copy', 'blocked', 'The identity, operation, access, safety, accessibility, media, and editorial gates do not form a delivery-safe package.', 'Keep all channels closed until every open component is resolved and a separate publication decision is recorded.'],
  ].map(([component, status, evidenceSummary, nextAction], index) => ({_type: 'placeCopyComponentReview', _key: `component-${index + 1}-${component}`, component, status, evidenceSummary, nextAction}))
  return {
    _type: 'placeContentReadinessReview', checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked',
    accessibilityEvidenceStatus: accessibility, accessibilitySources: sourceRefs,
    accessibilityBoundary: 'A generic accessibility label, transport mode, terrain description, or source silence is not a feature-level accessibility promise. Missing evidence is not proof that a place is inaccessible.',
    copyFoundationStatus: foundation, copyComponents: components, mediaEvidenceStatus: 'source_display_only_not_cleared',
    mediaRightsStatus: 'controlled_library_asset_license_required', mediaPolicySources: [reference(sourceIds.mediaBoundary, 'media-policy-source')],
    altTextStatus: 'no_approved_image', publicCopyDecision: 'blocked', notes,
  }
}

function fact({id, title, topic, claim, guidance, ids, confidence = 'medium', volatility = 'operational'}) {
  return {
    _id: id, _type: 'islandFact', title, destination: reference(destinationId, 'destination-mayaguana'), topic, claim,
    travelerGuidance: guidance, sources: references(ids, 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt,
    volatility, confidence, verificationStatus: 'source_verified', channels: [],
    editorNotes: 'Review-only evidence. This fact does not approve publication, a canonical Supabase change, coordinate, operation, route, schedule, price, provider, media, accessibility claim, or traveler delivery.',
  }
}

const [islandText, baycanerText, boobyText, abrahamsText, piratesText, flightText, doaText, operatorText, hotelDirectoryReachable, caabReachable, aopaReachable] = await Promise.all([
  fetchPage(urls.islandProfile), fetchPage(urls.baycanerTourism), fetchPage(urls.boobyCay), fetchPage(urls.abrahamsTownSquare),
  fetchPage(urls.piratesConflict), fetchPage(urls.flightTable), fetchPage(urls.doaAirports), fetchPage(urls.baycanerOperatorInsecure),
  sourceReachable(urls.hotelDirectory), sourceReachable(urls.caab2026), sourceReachable(urls.aopa),
])

const sourceSignals = {
  island: signals(islandText, {mayaguana: /Welcome to Mayaguana|Mayaguana/i, horsePond: /Horse Pond Beach/i, boobyCay: /Booby Cay/i, airport: /Mayaguana Airport/i, scheduled: /regularly scheduled service/i}),
  baycanerTourism: signals(baycanerText, {identity: /Baycaner Beach Resort/i, sixteenRooms: /16-room/i, accessibilityLabel: /Handicap Accessible/i, restaurant: /Restaurant/i}),
  boobyCay: signals(boobyText, {identity: /Booby Cay/i, east: /east of mainland Mayaguana/i, administrator: /Administrator.s Office/i}),
  abrahams: signals(abrahamsText, {townSquare: /Abraham.s Bay Town Square/i, localGovernment: /Local Government complex/i, escortedTour: /escorted tour/i}),
  pirates: signals(piratesText, {southBimini: /South Bimini/i, biminiSands: /Bimini Sands/i}),
  flight: signals(flightText, {mayaguana: /Mayaguana/i, bahamasair: /BAHAMASAIR/i, nassau: /Nassau/i, inagua: /Matthew Town|Inagua/i}),
  doa: signals(doaText, {mayaguana: /MAYAGUANA/i, mymm: /MYMM/i, myg: /MYG/i, abrahamsBay: /Abraham.s Bay/i}),
  operator: signals(operatorText, {identity: /Baycaner Beach Resort/i, threeFlights: /three Bahamasair flights per week/i, mailBoat: /Lady Mathilda/i, plusCode: /CVMX\+W78/i}),
  documents: {hotelDirectoryReachable, caabReachable, aopaReachable},
}
if (Object.values(sourceSignals).flatMap((group) => Object.values(group)).some((value) => !value)) throw new Error(`Research-source signals changed: ${JSON.stringify(sourceSignals)}`)

const webImagePath = path.join(workspaceRoot, 'bahabuddy-web/src/lib/islands.ts')
const webHeaderPath = path.join(workspaceRoot, 'bahabuddy-web/src/components/marketplace/MarketplacePublicHeader.tsx')
const mobileImagePath = path.join(workspaceRoot, 'Baha-Buddy-V2/lib/core/constants/baha_images.dart')
const publicCopySignals = {
  webExternalImage: /tempo\.cdn\.tambourine\.com\/windsong\/media\/mayaguana/i.test(fs.readFileSync(webImagePath, 'utf8')),
  mobileExternalImage: /tempo\.cdn\.tambourine\.com\/windsong\/media\/mayaguana/i.test(fs.readFileSync(mobileImagePath, 'utf8')),
  genericHeaderClaim: /Remote beaches and true out-island pace/i.test(fs.readFileSync(webHeaderPath, 'utf8')),
}
if (Object.values(publicCopySignals).some((value) => !value)) throw new Error(`Public-copy signals changed: ${JSON.stringify(publicCopySignals)}`)

const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web/.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')
const response = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified,description,short_description,primary_image_url,gallery_images&island_id=eq.mayaguana`, {headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`}})
if (!response.ok) throw new Error(`Supabase Mayaguana read failed: ${response.status}`)
const supabaseRows = await response.json()
const supabaseById = new Map(supabaseRows.map((row) => [row.id, row]))

const live = await client.fetch(`{
  "sources": *[_id in $sourceIds]{...},
  "publishedPlaces": *[_id in $publishedPlaceIds]{...},
  "placeDrafts": *[_id in $placeIds]{...},
  "candidates": *[_id in $candidateIds]{...},
  "facts": *[_id in $factIds]{...},
  "audit": *[_id == $auditId][0]{...},
  "destinationPublished": *[_id == $destinationId][0]{...},
  "destinationDraft": *[_id == $destinationDraftId][0]{...},
  "publishedFacts": count(*[_type == "islandFact" && !(_id in path("drafts.**"))]),
  "mayaguanaFactChannels": count(*[_type == "islandFact" && _id in path("drafts.**") && destination._ref == $destinationId && count(channels) > 0])
}`, {
  sourceIds: Object.values(sourceIds), publishedPlaceIds: Object.values(publishedPlaceIds), placeIds: Object.values(placeIds),
  candidateIds: Object.values(candidateIds), factIds: Object.values(factIds), auditId, destinationId, destinationDraftId,
})

const sourceById = new Map(live.sources.map((item) => [item._id, item]))
const publishedPlaceById = new Map(live.publishedPlaces.map((item) => [item._id, item]))
const placeById = new Map(live.placeDrafts.map((item) => [item._id, item]))
const candidateById = new Map(live.candidates.map((item) => [item._id, item]))
const factById = new Map(live.facts.map((item) => [item._id, item]))
for (const id of Object.values(sourceIds)) if (!sourceById.has(id)) throw new Error(`Missing source: ${id}`)
for (const id of Object.values(publishedPlaceIds)) if (!publishedPlaceById.has(id)) throw new Error(`Missing published place overlay: ${id}`)
for (const id of Object.values(candidateIds)) if (!candidateById.has(id)) throw new Error(`Missing candidate: ${id}`)
for (const id of [factIds.abrahamsBay, factIds.boobyCay, factIds.accommodation, factIds.operator, factIds.checkpoint]) if (!factById.has(id)) throw new Error(`Missing existing fact: ${id}`)
if (!live.destinationPublished) throw new Error(`Missing destination: ${destinationId}`)

const destinationReference = reference(destinationId, 'destination-mayaguana')
const sourceUpdates = {
  [sourceIds.islandProfile]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official profile supports Mayaguana identity, Mayaguana Airport, Abraham’s Bay, Horse Pond Beach’s relative location, Booby Cay’s habitat context, and broad beach, fishing, food-festival, snorkeling, and diving themes. Its regularly-scheduled-service, rustic-accommodation, suitability, superlative, activity, and image claims are not live carrier, provider, safety, accessibility, or media-rights evidence.',
    reviewPlan: reviewPlan({relationship: 'official_context_publisher', reviewScope: 'Recheck island identity, highlighted places, gateway, accommodation, activity, food-festival, and access wording.', nextAction: 'Verify current carrier, airport, lodging, provider, route, permission, conditions, safety, accessibility, and media rights separately before delivery.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change']}),
  },
  [sourceIds.baycanerTourism]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck',
    notes: 'Current national-tourism listing identifies Baycaner, says 16 rooms, prints contact details and generic service/accessibility tags, and links to www.baycanerbeach.com. The 2025 official hotel directory says 12 rooms, and the outbound domain currently does not resolve. Treat identity and contact as official leads, not current inventory, operation, room count, feature-level accessibility, restaurant, activity, or secure booking evidence.',
    reviewPlan: reviewPlan({relationship: 'primary_source_scope_requires_review', attention: true, reviewScope: 'Recheck room count, licensing/listing state, current operation, contact, secure website, restaurant, activities, and the meaning of generic accessibility labels.', nextAction: 'Keep stay, dining, activity, accessibility, price, and booking delivery blocked until responsible current evidence resolves the conflicts.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'source_restored_replaced_or_superseded']}),
  },
  [sourceIds.hotelDirectory]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'The official 2025 directory lists Baycaner as Mayaguana’s single directory property, records 12 rooms, labels it HA, and links the currently non-resolving baycanerbeach.com domain. The directory conflicts with the tourism page’s 16-room claim and is not live inventory, current operation, secure booking, or feature-level accessibility evidence.',
    reviewPlan: reviewPlan({relationship: 'official_context_publisher', reviewScope: 'Recheck the latest licensed-hotel directory for Mayaguana identity, room count, accessibility code, contacts, and any superseding edition.', nextAction: 'Use only as a dated official listing; obtain current responsible operation, inventory, accessibility, and secure booking evidence.', method: 'document_review', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change']}),
  },
  [sourceIds.baycanerOperator]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck',
    notes: 'The operator site identifies Baycaner in Pirate’s Well and publishes a current-looking contact path, but HTTPS uses a self-signed certificate while HTTP is unencrypted. Its undated transport copy claims three Bahamasair flights each week and a Lady Mathilda mail-boat schedule, conflicting with the current tourism flight table and lacking current responsible marine confirmation. Do not expose the insecure link or reuse schedules, rates, services, restaurant, activities, or transfer claims as current.',
    reviewPlan: reviewPlan({relationship: 'primary_source_scope_requires_review', attention: true, reviewScope: 'Recheck ownership, licensing, secure domain, contact, operation, rooms, restaurant, activities, transfer, flight and mail-boat claims, prices, deposits, and cancellations.', nextAction: 'Keep all operator claims blocked until a secure responsible channel and current operation details are verified through a Board-approved workflow.', method: 'webpage_and_responsible_contact', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'source_restored_replaced_or_superseded']}),
  },
  [sourceIds.aopa]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck',
    notes: 'The generated kneeboard says the first 2,500 feet of Runway 24 are closed indefinitely, 4,800 feet remain available, and Baycaner offers rentals and airport transportation. The January 2026 CAA-B register prints a 2,042-metre runway without that closure. A generated date does not prove the underlying industry data is current; preserve the conflict and verify with the regulator, airport, NOTAM, carrier, and property.',
    reviewPlan: reviewPlan({relationship: 'corroborating_source', attention: true, reviewScope: 'Recheck underlying data date, partial-runway closure, airport hours, fire context, Baycaner transfer claim, and superseding regulator or NOTAM evidence.', nextAction: 'Do not use the kneeboard as live airport or property evidence; resolve the runway and transfer conflicts with responsible sources.', method: 'document_review', triggers: ['publisher_url_or_scope_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.caab2026]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    destinations: mergeReferences(sourceById.get(sourceIds.caab2026).destinations, [destinationId], 'destination'),
    notes: 'The January 2026 regulator register identifies Mayaguana Airport as MYMM with a 2,042 x 30 metre asphalt runway, VFR operation, UNICOM 122.80, CAT 0, sunrise-to-sunset VMC operation, no port-of-entry status, and no fuel. It also retains the previously reviewed Ragged Island and Rum Cay fields. These are dated facility constraints, not proof of a current flight, runway availability, staffing, response capability, or safe travel-day operation.',
    reviewPlan: reviewPlan({relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck the current government-aerodrome register and AIP/NOTAM context for runway, VFR/daylight limits, RFFS category, port-of-entry status, fuel, closures, and notices.', nextAction: 'Verify live airport, runway, NOTAM, weather, carrier or charter, immigration routing, transfer, baggage, assistance, and disruption fallback.', method: 'document_review', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'safety_emergency_or_activation_change']}),
  },
  [sourceIds.doaAirports]: {
    checkedAt, nextReviewAt: nextOperationalReviewAt,
    notes: 'Current Department of Aviation directory lists Mayaguana Airport as MYMM/MYG at Abraham’s Bay with coordinates, UNICOM, phone and an emergency number. It also retains a conflicting MYRF code for New Port Nelson versus CAA-B’s MYRP. Directory fields do not prove live operation, runway availability, staffing, response, carrier service, or transfer; Mayaguana’s AOPA partial-runway notice requires responsible rechecking.',
    reviewPlan: reviewPlan({relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck airport identity, code, coordinates, contacts, emergency field, operation, and any conflict with the CAA-B register or current notices.', nextAction: 'Use current regulator/AIP/NOTAM and carrier evidence for operations; do not infer availability from the directory.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'safety_emergency_or_activation_change']}),
  },
}
const sourcePlans = Object.entries(sourceUpdates).map(([id, fields]) => {
  const current = sourceById.get(id)
  const planned = {...stripMeta(current), ...fields}
  return {id, current, planned, needsUpdate: differs(current, planned)}
})

const abrahamsCurrent = stripMeta(candidateById.get(candidateIds.abrahamsBay))
const abrahamsCandidate = {
  ...abrahamsCurrent,
  identityEvidence: mergeReferences(abrahamsCurrent.identityEvidence, [sourceIds.islandProfile, sourceIds.abrahamsTownSquare, sourceIds.doaAirports, sourceIds.publicMap], 'mayaguana-pilot-source'),
  identityBoundary: 'Abraham’s Bay is a community/settlement identity. The Town Square is one component civic site and Mayaguana Airport is a separate gateway. A tourism community marker must not become a universal town entrance, dock, beach, public-service office, airport, or routing destination.',
  locationReview: {
    ...abrahamsCurrent.locationReview,
    candidates: (abrahamsCurrent.locationReview?.candidates || []).map((candidate) => ({...candidate, relationship: 'visitor_site', notes: 'Representative community marker only. It is not an accepted civic-site entrance, public-service office, dock, beach, airport, transfer point, accessible route, or universal routing destination.'})),
    checkedAt, reconciliationStatus: 'area_identity_no_point', evidenceSources: references([sourceIds.islandProfile, sourceIds.abrahamsTownSquare, sourceIds.doaAirports, sourceIds.publicMap], 'location-source'),
    locationConfidence: 'high', operationEvidenceStatus: 'not_established', accessEvidenceStatus: 'partial_official_context', reviewDecision: 'not_applicable',
    notes: 'Use a community/area model. Official sources distinguish Abraham’s Bay, its Town Square component, and Mayaguana Airport. Verify the traveler’s exact lodging, civic destination, airport, transfer, road, service, or waterfront route separately; no single community point is accepted.',
  },
  travelerReadinessReview: travelerReview({sourceIds: [sourceIds.islandProfile, sourceIds.abrahamsTownSquare, sourceIds.doaAirports, sourceIds.flightTable], responsible: 'current_official_listing_only', operation: 'not_applicable_identity', access: 'partial_official_context', copy: 'source_backed_internal_only', notes: 'Abraham’s Bay is a community identity, while the Town Square and Mayaguana Airport are separate component/gateway identities. Verify the exact destination, roads, transfer, public facilities, service hours, safety, accessibility, communications, and fallback for the traveler’s dates.'}),
  reviewedAt: checkedAt,
  reviewNotes: 'Area-model correction only. Keep researching and do not create a point-based Supabase place from the representative map marker. No operation, transfer, access, accessibility, media, publication, or delivery is approved.',
}
const candidatePlans = [{id: candidateIds.abrahamsBay, current: candidateById.get(candidateIds.abrahamsBay), planned: abrahamsCandidate, needsUpdate: differs(candidateById.get(candidateIds.abrahamsBay), abrahamsCandidate)}]

const contaminationReasons = {
  bahamaBay: 'The row points to Davenport, Florida and is outside The Bahamas.',
  albany: 'The row points to New Providence, not Mayaguana.',
  tommyBahama: 'The row points to Sandestin, Florida and is outside The Bahamas.',
  genericMayaguana: 'The generic row is geocoded in Nassau, uses a Colonel Hill address, and links a currently non-resolving Baycaner domain; it is not a valid Mayaguana feature record.',
  stuartCove: 'The row points to a New Providence dive operator, not a Mayaguana venue.',
  prestigiousTransport: 'The row points to a Nassau transport operator and does not prove Mayaguana service.',
}
const contaminatedDocuments = contaminatedKeys.map((key) => {
  const published = stripMeta(publishedPlaceById.get(publishedPlaceIds[key]))
  const row = supabaseById.get(supabaseIds[key])
  return {
    ...published, _id: placeIds[key], active: false, channels: [], catalogReviewStatus: 'island_assignment_conflict', reviewedAt: checkedAt,
    evidenceSources: mergeReferences(published.evidenceSources, [sourceIds.islandProfile], 'mayaguana-conflict-source'),
    catalogLocationReview: {
      _type: 'placeLocationReview', checkedAt, reconciliationStatus: 'official_invalid_point', evidenceSources: [reference(sourceIds.islandProfile, 'location-source-island-profile')],
      locationConfidence: 'high', operationEvidenceStatus: 'not_established', accessEvidenceStatus: 'unresolved', reviewDecision: 'rejected',
      notes: `${contaminationReasons[key]} Current Supabase assignment: ${row.name}; ${row.address || 'no address'}; ${row.latitude ?? 'missing'}, ${row.longitude ?? 'missing'}. Reject the current Mayaguana coordinate/assignment for delivery, preserve the forensic row, and require an authoritative identity and island correction before a separate Supabase change.`,
    },
    catalogTravelerReadinessReview: travelerReview({sourceIds: [sourceIds.islandProfile], notes: `${contaminationReasons[key]} The current row is active in Supabase but unverified, without useful copy or media. Keep this Sanity correction draft inactive and channel-free; resolve the canonical identity and island assignment before any operation, access, safety, accessibility, or delivery review.`}),
    catalogContentReadinessReview: contentReview({sourceIds: [sourceIds.islandProfile], notes: `${contaminationReasons[key]} This review records a catalog conflict, not traveler content. No source image was copied and no delivery channel is approved.`}),
    catalogReviewNotes: `${contaminationReasons[key]} Supabase row ${row.id} is active but unverified, has no useful description or media, and fails the broad Mayaguana location gate. Preserve it for forensic/data-operator review; do not publish, recommend, merge, geocode by inference, or delete it in this editorial batch.`,
  }
})

const baycanerBase = stripMeta(placeById.get(placeIds.baycaner) || publishedPlaceById.get(publishedPlaceIds.baycaner))
const baycanerDocument = {
  ...baycanerBase, _id: placeIds.baycaner, active: false, channels: [], officialSourceName: 'Baycaner Beach Resort', catalogReviewStatus: 'exact_candidate', reviewedAt: checkedAt,
  shortDescription: 'Official accommodation identity in Pirate’s Well with room-count, operation, transport, accessibility, and secure-link conflicts under review.',
  address: 'Baycaner Avenue, Pirate’s Well, Mayaguana, The Bahamas (CVMX+W78)', website: urls.baycanerTourism,
  evidenceSources: mergeReferences(baycanerBase.evidenceSources, [sourceIds.baycanerTourism, sourceIds.hotelDirectory, sourceIds.businessMap, sourceIds.baycanerOperator, sourceIds.baycanerTrip, sourceIds.aopa], 'baycaner-source'),
  catalogLocationReview: {
    _type: 'placeLocationReview', checkedAt, reconciliationStatus: 'official_point_candidate',
    candidates: [{_type: 'placeLocationCandidate', _key: 'candidate-map-760', label: 'Baycaner Beach Resort — official tourism map business record', relationship: 'operator_entrance', location: {_type: 'geopoint', lat: 22.434536842839, lng: -73.10189679265}, source: reference(sourceIds.businessMap, 'source-map-760'), sourceRecordType: 'tourism_business', sourceRecordId: '760', sourceName: 'Baycaner Beach Resort', sourceUrl: 'https://www.bahamas.com/map#b=760', confidence: 'high', notes: 'Official map point corroborated by the operator’s published plus code. It remains a pending candidate and does not approve a driveway, accessible entrance, current operation, transfer, or Supabase coordinate write.'}],
    evidenceSources: references([sourceIds.baycanerTourism, sourceIds.businessMap, sourceIds.baycanerOperator], 'location-source'), locationConfidence: 'high',
    operationEvidenceStatus: 'not_established', accessEvidenceStatus: 'unresolved', reviewDecision: 'pending',
    notes: 'The official map coordinate and operator plus code support an exact-location candidate, but current operation and safe access are source-conflicted. A separate data-operator decision is required before any Supabase coordinate change; keep the row inactive and unverified.',
  },
  catalogTravelerReadinessReview: travelerReview({sourceIds: [sourceIds.baycanerTourism, sourceIds.hotelDirectory, sourceIds.baycanerOperator, sourceIds.baycanerTrip, sourceIds.aopa, sourceIds.flightTable], accessibility: 'partial', notes: 'Official sources conflict on 12 versus 16 rooms and publish only generic accessibility labels. The operator’s HTTPS certificate is self-signed, its legacy domain does not resolve, and its flight/mail-boat copy conflicts with current source review. Dated 2026 corroboration supports a recent operation checkpoint only. Verify secure contact, current licensing/operation, rooms, availability, transfers, restaurant, activities, accessibility, prices, cancellation, safety, and fallback before delivery.'}),
  catalogContentReadinessReview: contentReview({sourceIds: [sourceIds.baycanerTourism, sourceIds.hotelDirectory, sourceIds.baycanerOperator], foundation: 'needs_responsible_recheck', accessibility: 'partial_responsible_evidence', notes: 'Official generic accessibility labels lack room, route, bathroom, transfer, beach, sensory, service-animal, and assistance detail. Room count, operation, schedule, secure link, and service claims conflict. No source image was copied or licensed.'}),
  catalogReviewNotes: 'Exact identity and official point candidate retained, but operation, room count, transport, secure booking, restaurant, activities, feature-level accessibility, safety, copy, and media gates remain open. No Supabase mutation or delivery approval is made.',
}

const boobyBase = stripMeta(placeById.get(placeIds.boobyCay))
const boobyDocument = {
  ...boobyBase, active: false, channels: [], reviewedAt: checkedAt,
  catalogLocationReview: {
    ...boobyBase.catalogLocationReview,
    candidates: (boobyBase.catalogLocationReview?.candidates || []).map((candidate) => ({...candidate, relationship: 'visitor_site', notes: 'Representative cay marker only. It is not an accepted landing, route, permission, safe approach, habitat boundary, or accessible visitor point.'})),
    checkedAt, reconciliationStatus: 'area_identity_no_point', evidenceSources: references([sourceIds.islandProfile, sourceIds.boobyCay, sourceIds.publicMap], 'location-source'),
    locationConfidence: 'high', operationEvidenceStatus: 'not_applicable_natural_feature', accessEvidenceStatus: 'partial_official_context', reviewDecision: 'not_applicable',
    notes: 'Use a cay/area model. Official tourism places Booby Cay east of Mayaguana and identifies habitat, but the marker cannot represent a landing, habitat boundary, permission, safe route, responsible vessel, current conditions, or accessibility.',
  },
  catalogTravelerReadinessReview: travelerReview({sourceIds: [sourceIds.islandProfile, sourceIds.boobyCay, sourceIds.publicMap], responsible: 'current_official_listing_only', operation: 'not_applicable_identity', access: 'permission_or_guide_required', copy: 'source_backed_internal_only', notes: 'Booby Cay is an offshore natural-area identity. The official page lists an Administrator’s Office contact, but that does not prove visitor management, landing permission, a responsible vessel, safe access, wildlife rules, conditions, emergency support, accessibility, or suitability. Verify each before any recommendation.'}),
  catalogReviewNotes: 'Official identity and habitat context support a cay/area model, not a canonical visitor point. Keep inactive and channel-free; no landing, route, permission, vessel, operation, safety, accessibility, media, or delivery is approved.',
}

const placeDocuments = [baycanerDocument, boobyDocument, ...contaminatedDocuments]
const placePlans = placeDocuments.map((planned) => ({id: planned._id, current: placeById.get(planned._id), planned, needsUpdate: differs(placeById.get(planned._id), planned)}))

const facts = [
  fact({id: factIds.abrahamsBay, title: 'Abraham’s Bay: community-area and component-site boundary', topic: 'overview', confidence: 'high', ids: [sourceIds.islandProfile, sourceIds.abrahamsTownSquare, sourceIds.doaAirports, sourceIds.publicMap], claim: 'Official sources distinguish Abraham’s Bay as a community, its Town Square as one civic component, and Mayaguana Airport as a separate gateway. A representative community marker is not a universal entrance, dock, beach, public-service office, airport, or route point.', guidance: 'Plan to the traveler’s exact lodging, civic destination, airport, transfer, road, service, or waterfront point; verify current access, hours, safety, accessibility, communications, and fallback.'}),
  fact({id: factIds.boobyCay, title: 'Booby Cay: offshore area and access boundary', topic: 'nature', confidence: 'high', ids: [sourceIds.islandProfile, sourceIds.boobyCay, sourceIds.publicMap], claim: 'National tourism places Booby Cay east of mainland Mayaguana and identifies bird, iguana, and goat habitat. The tourism marker is a representative cay point, not a verified landing, route, habitat boundary, permission, responsible vessel, or safe visitor site.', guidance: 'Verify current visitor appropriateness, wildlife rules, landing permission, licensed vessel or guide, exact route, weather and sea state, emergency support, accessibility, and fallback before recommending a visit.'}),
  fact({id: factIds.accommodation, title: 'Mayaguana: Baycaner official room-count and listing conflict', topic: 'stays', confidence: 'high', ids: [sourceIds.baycanerTourism, sourceIds.hotelDirectory, sourceIds.baycanerOperator], claim: 'The 2025 official hotel directory lists Baycaner as Mayaguana’s single directory property with 12 rooms, while the current national-tourism property page says 16 rooms. Both official sources link a domain that currently does not resolve; an alternate operator domain uses a self-signed HTTPS certificate.', guidance: 'Treat Baycaner as an official accommodation identity lead, not current inventory. Verify licensing, operation, room count, availability, secure contact/booking, cancellation, transport, and payment for the traveler’s dates.'}),
  fact({id: factIds.operator, title: 'Mayaguana: Baycaner operator website and transport conflict', topic: 'access', ids: [sourceIds.baycanerTourism, sourceIds.baycanerOperator, sourceIds.flightTable, sourceIds.hotelDirectory], claim: 'Baycaner’s operator page claims three weekly Bahamasair flights and a Lady Mathilda mail-boat route, while the current tourism flight table lists Friday Nassau–Mayaguana service and Monday Inagua–Mayaguana service. No current responsible marine source in this review confirms the mail-boat claim, and the operator’s HTTPS connection is not trusted.', guidance: 'Do not reuse the operator’s schedule, fare, transfer, or mail-boat claims. Check the live carrier/runtime provider, airport and NOTAM, responsible marine operator or authority, secure property channel, transfer, and disruption fallback.'}),
  fact({id: factIds.checkpoint, title: 'Mayaguana: Baycaner dated operation checkpoint with unresolved current state', topic: 'stays', ids: [sourceIds.baycanerTourism, sourceIds.baycanerOperator, sourceIds.baycanerTrip, sourceIds.aopa], claim: 'A dated hosted trip used Baycaner in April 2026, and a current-generated AOPA kneeboard mentions resort rentals and airport transportation. These corroborate a recent operation/service relationship only; they do not resolve current availability, the insecure website, conflicting room counts, runway data, or responsible transfer confirmation.', guidance: 'Reconfirm current operation, inventory, secure contact, pickup, runway/airport state, price, cancellation, accessibility, and fallback before recommending or booking.'}),
  fact({id: factIds.airportConflict, title: 'Mayaguana Airport: current facility and runway-source conflict boundary', topic: 'access', ids: [sourceIds.caab2026, sourceIds.doaAirports, sourceIds.flightTable, sourceIds.aopa], claim: 'The January 2026 CAA-B register identifies Mayaguana Airport as MYMM with a 2,042 x 30 metre asphalt runway, VFR operation, UNICOM 122.80, CAT 0, sunrise-to-sunset VMC operation, no port-of-entry status, and no fuel. A current-generated AOPA kneeboard says the first 2,500 feet of Runway 24 are closed indefinitely and 4,800 feet remain available, creating a runway-availability conflict.', guidance: 'Verify current AIP/NOTAM, usable runway, airport state, weather, carrier or charter, port-of-entry/immigration routing, fuel, assistance, transfer, and disruption fallback. A static directory or generated kneeboard is not travel-day clearance.'}),
  fact({id: factIds.publicCopy, title: 'Mayaguana: public-copy, catalog and media evidence boundary', topic: 'overview', ids: [sourceIds.islandProfile, sourceIds.baycanerTourism, sourceIds.hotelDirectory, sourceIds.baycanerOperator, sourceIds.flightTable, sourceIds.caab2026, sourceIds.mediaBoundary], claim: 'Published Mayaguana destination copy asserts no traffic lights, one resort, a longest beach, pristine reef diving, untouched Caribbean beaches, broad suitability, and externally hosted imagery. The current catalog also assigns six active, unverified, out-of-bounds rows to Mayaguana. The reviewed sources do not support delivering those claims or rows as verified traveler recommendations.', guidance: 'Use the corrective destination and catalog-conflict drafts. Keep superlatives, current operation, activity suitability, access, schedules, feature-level accessibility, and external media out of delivery until each is independently evidenced and approved.'}),
]
const factPlans = facts.map((planned) => ({id: planned._id, current: factById.get(planned._id), planned, needsUpdate: differs(factById.get(planned._id), planned)}))

const audit = {
  _id: auditId, _type: 'islandResearchAudit', title: 'Mayaguana evidence-conflict and public-copy review — 2026-08-05', destination: destinationReference,
  auditedAt: checkedAt, nextAuditAt: nextOperationalReviewAt, owner: 'Baha Buddy Content Operations', status: 'researching', overallScore: 1.2,
  coverage: [
    ['overview', 2, 'Official identity and community/place context exist, but published superlatives, suitability, and catalog assignments are not delivery-safe.'],
    ['access', 1, 'Airport, carrier-table, AOPA, operator, and marine claims conflict or remain runtime-only.'],
    ['stays', 1, 'Baycaner is an official identity with a strong point candidate and dated operation checkpoint, but room count, secure link, operation, and availability conflict or remain unresolved.'],
    ['food', 1, 'Official festival-food themes exist, but no verified current local provider or provisioning path is established.'],
    ['experiences', 1, 'Broad beach, fishing, snorkeling and diving themes exist without responsible providers, exact sites, current access, conditions, safety, or accessibility.'],
    ['nature', 2, 'Horse Pond Beach and Booby Cay have official identity/context, while points, landing, conditions, rules, and traveler suitability remain incomplete.'],
    ['culture', 2, 'Abraham’s Bay Town Square has official component-site context; current operation, access, local interpretation, and accessibility remain incomplete.'],
    ['seasonality', 0, 'No Mayaguana-specific seasonality claim is approved for traveler delivery.'],
    ['safety', 1, 'Airport and emergency baselines exist, but live runway, response, evacuation, marine and activity readiness remain unverified.'],
    ['accessibility', 0, 'Generic HA labels and access context do not provide complete responsible feature-level evidence.'],
  ].map(([topic, score, finding]) => ({_type: 'researchCoverageScore', _key: `coverage-${topic}`, topic, score, evidenceCount: 0, finding})),
  gaps: [
    {_type: 'researchGap', _key: 'gap-mayaguana-public-copy-and-catalog-conflict', topic: 'overview', priority: 'p0', title: 'Published Mayaguana destination, imported place overlays, and hardcoded web/mobile copy contain unsupported or unsafe claims', action: 'Review the corrective destination and six catalog-conflict drafts. Remove unsupported superlatives, suitability, current-operation, activity, longest-beach, pristine, one-resort, no-traffic-light, and external-image assumptions; keep contaminated rows out of delivery until separately corrected in Supabase.', status: 'researching'},
    {_type: 'researchGap', _key: 'gap-mayaguana-baycaner-conflicts', topic: 'stays', priority: 'p0', title: 'Baycaner room count, secure link, operation, transport and accessibility claims conflict', action: 'Resolve 12 versus 16 rooms, licensed/current operation, secure domain and booking route, availability, airport pickup, restaurant/activities, feature-level accessibility, prices, cancellation, payment, safety, and fallback through current responsible evidence.', status: 'researching'},
    {_type: 'researchGap', _key: 'gap-mayaguana-airport-runway-conflict', topic: 'access', priority: 'p0', title: 'Mayaguana Airport runway availability and scheduled-service state remain source-conflicted', action: 'Resolve the CAA-B full-runway register versus AOPA partial-closure notice with current AIP/NOTAM and airport authority evidence; verify travel-day weather, carrier/charter, immigration routing, fuel, transfer, assistance, and fallback.', status: 'researching'},
    {_type: 'researchGap', _key: 'gap-mayaguana-pirates-well-conflict', topic: 'places', priority: 'p0', title: 'Pirates Well Mayaguana identity remains conflicted with the current South Bimini attraction page', action: 'Keep the Mayaguana candidate research-only until the tourism authority or Mayaguana authority confirms the exact site identity, source-record ownership, point purpose, condition, public access, safety, accessibility, and correct canonical URL through a Board-approved workflow.', status: 'researching'},
    {_type: 'researchGap', _key: 'gap-mayaguana-runtime-checks', topic: 'safety', priority: 'p1', title: 'Mayaguana airport, transfer, lodging, marine, activity and accessibility details require current responsible checks', action: 'For the traveler’s dates, verify every carrier/provider, permission, route, operation, conditions, safety, accessibility, price, cancellation, communications, emergency support, and disruption fallback.', status: 'researching'},
  ],
  sources: references([sourceIds.islandProfile, sourceIds.baycanerTourism, sourceIds.hotelDirectory, sourceIds.baycanerOperator, sourceIds.baycanerTrip, sourceIds.aopa, sourceIds.caab2026, sourceIds.doaAirports, sourceIds.flightTable, sourceIds.boobyCay, sourceIds.abrahamsTownSquare, sourceIds.piratesConflict, sourceIds.publicMap, sourceIds.mediaBoundary], 'source'),
  methodologyNotes: 'This review directly profiles current Supabase Mayaguana rows, current raw-perspective Sanity documents, hardcoded web/mobile fallbacks, and current official, regulator, operator, and corroborating sources. It creates only review drafts and updates internal source records. It does not mutate Supabase, accept a coordinate, publish content, alter hardcoded copy, expose an insecure link, contact an external party, copy media, approve a provider, route, schedule, price, operation, accessibility claim, or traveler delivery.',
}
const auditPlan = {id: auditId, current: live.audit, planned: audit, needsUpdate: differs(live.audit, audit)}

const destinationDraft = {
  _id: destinationDraftId, _type: 'destination', name: 'Mayaguana', slug: {_type: 'slug', current: 'mayaguana'}, islandId: 'mayaguana', routeAliases: live.destinationPublished.routeAliases || [],
  tagline: 'A remote southeastern island with small communities, beach and fishing context, and limited verified visitor inventory.',
  overview: [
    block('mayaguana-overview-1', 'Mayaguana’s official planning anchors include Abraham’s Bay, Mayaguana Airport, Horse Pond Beach, and offshore Booby Cay. These are distinct community, gateway, beach, and cay identities; none should be reduced to one universal map point or route.'),
    block('mayaguana-overview-2', 'Official sources describe beach, fishing, snorkeling, diving, food-festival, and nature themes. Each specific experience still needs a current responsible provider or authority, exact access, permission, conditions, safety, accessibility, emergency support, and media review before traveler delivery.'),
  ],
  highlights: [
    {_type: 'destinationHighlight', _key: 'highlight-abrahams-bay', label: 'Abraham’s Bay', description: 'Community identity with a separate Town Square component and airport gateway; verify the traveler’s exact destination and route.'},
    {_type: 'destinationHighlight', _key: 'highlight-horse-pond-beach', label: 'Horse Pond Beach', description: 'Official beach identity described relative to Abraham’s Bay; exact segment, public approach, conditions, safety, facilities, and accessibility remain unverified.'},
    {_type: 'destinationHighlight', _key: 'highlight-booby-cay', label: 'Booby Cay', description: 'Offshore cay and habitat identity; verify visitor appropriateness, wildlife rules, landing permission, vessel, conditions, emergency support, and accessibility.'},
  ],
  gettingThere: 'Mayaguana Airport (MYG/MYMM) is the named gateway at Abraham’s Bay. The January 2026 CAA-B register lists VFR, sunrise-to-sunset VMC operation, CAT 0, no port-of-entry status, and no fuel. A current-generated AOPA kneeboard conflicts on usable runway length. Verify the current AIP/NOTAM, runway, weather, carrier or charter, immigration routing, baggage and assistance, transfer, and disruption fallback for the traveler’s dates.',
  airports: [{_type: 'gateway', _key: 'airport-myg', code: 'MYG', name: 'Mayaguana Airport', type: 'airport', note: 'Named gateway with a runway-source conflict and regulator constraints; live airport, carrier/charter, immigration routing, transfer, assistance, weather, and disruption checks are required.'}],
  tripFit: {_type: 'object', vibe: 'Remote island planning with limited verified inventory'},
  practicalNotes: [
    block('mayaguana-practical-1', 'Baycaner is an official accommodation identity with a strong location candidate and dated 2026 operation evidence, but official sources conflict on 12 versus 16 rooms. Its official outbound domain does not resolve and an alternate operator site has a self-signed certificate. Confirm operation, availability, secure contact, room count, accessibility, transfer, price, cancellation, and payment before use.'),
    block('mayaguana-practical-2', 'Do not reuse the operator page’s three-flight-per-week or Lady Mathilda mail-boat claims. Check the live carrier/runtime provider, airport and NOTAM, responsible marine operator or authority, last-mile transfer, communications, and disruption fallback.'),
    block('mayaguana-practical-3', 'No verified current local food provider is approved in this repository. Confirm dining or provisioning, ingredients/allergens, payment, transport, medical and emergency plans, and communications for the traveler’s exact location and dates.'),
  ],
  faqs: [], featured: false, order: live.destinationPublished.order ?? 99, channels: live.destinationPublished.channels || ['web', 'mobile', 'buddy'], reviewedAt: checkedAt,
  source: {...live.destinationPublished.source, notes: 'Review-only corrective draft prepared from current four-surface and source-conflict evidence. It removes unsupported superlatives, suitability, longest-beach, pristine, one-resort, no-traffic-light, current-operation, schedule, and external-image assumptions. Published content and Supabase remain unchanged until separate approval.'},
  seo: {_type: 'seo', metaTitle: 'Mayaguana', metaDescription: 'Plan Mayaguana around Abraham’s Bay and Mayaguana Airport, with current checks for lodging, transport, beach and cay access, safety, and accessibility.'},
  evidenceSources: references([sourceIds.islandProfile, sourceIds.baycanerTourism, sourceIds.hotelDirectory, sourceIds.baycanerOperator, sourceIds.caab2026, sourceIds.doaAirports, sourceIds.flightTable, sourceIds.boobyCay, sourceIds.abrahamsTownSquare], 'evidence-source'),
  editorialReviewStatus: 'ready_for_review',
  editorialReviewNotes: 'Review against the Mayaguana conflict audit. Confirm every live airport/runway, carrier, stay, marine, transfer, provider, operation, permission, safety, accessibility, price, cancellation, emergency, and media claim separately. Publishing is a separate editorial decision.',
}
const destinationPlan = {id: destinationDraftId, current: live.destinationDraft, planned: destinationDraft, needsUpdate: differs(live.destinationDraft, destinationDraft)}

const inBounds = (row) => {
  const lat = Number(row.latitude)
  const lng = Number(row.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && lat >= 21.8 && lat <= 22.8 && lng >= -73.6 && lng <= -72.3
}
const publicDestinationText = JSON.stringify(live.destinationPublished)
const publicDestinationSignals = {
  noTrafficLights: /No traffic lights/i.test(publicDestinationText), oneResort: /one resort/i.test(publicDestinationText),
  longestBeach: /longest beach/i.test(publicDestinationText), pristineDiving: /Pristine reef diving/i.test(publicDestinationText),
  untouchedCaribbean: /untouched beaches in the Caribbean/i.test(publicDestinationText), externalHero: /tempo\.cdn\.tambourine\.com\/windsong\/media\/mayaguana/i.test(publicDestinationText),
}
const piratesCandidate = candidateById.get(candidateIds.piratesWell)
const guardrails = {
  allResearchSignalsPresent: Object.values(sourceSignals).flatMap((group) => Object.values(group)).every(Boolean),
  allHardcodedSignalsPresent: Object.values(publicCopySignals).every(Boolean),
  allPublishedDestinationConflictSignalsPresent: Object.values(publicDestinationSignals).every(Boolean),
  exactSupabaseProfileLoaded: supabaseRows.length === 9 && Object.values(supabaseIds).every((id) => supabaseById.has(id)),
  sixActiveRowsRemainCatalogConflicts: contaminatedKeys.every((key) => supabaseById.get(supabaseIds[key])?.is_active === true) && supabaseRows.filter((row) => row.is_active === true).length === 6,
  noSupabaseRowsVerifiedOrInBounds: supabaseRows.every((row) => row.is_verified !== true) && supabaseRows.filter(inBounds).length === 0,
  contaminatedDraftsAreInactiveChannelFreeAndRejected: contaminatedDocuments.every((doc) => doc.active === false && (doc.channels || []).length === 0 && doc.catalogReviewStatus === 'island_assignment_conflict' && doc.catalogLocationReview.reviewDecision === 'rejected'),
  abrahamsBayUsesAreaModel: abrahamsCandidate.locationReview.reconciliationStatus === 'area_identity_no_point' && abrahamsCandidate.locationReview.reviewDecision === 'not_applicable',
  boobyCayUsesAreaModel: boobyDocument.catalogLocationReview.reconciliationStatus === 'area_identity_no_point' && boobyDocument.catalogLocationReview.reviewDecision === 'not_applicable',
  baycanerCoordinateRemainsPending: baycanerDocument.catalogLocationReview.reviewDecision === 'pending' && baycanerDocument.active === false && baycanerDocument.channels.length === 0,
  piratesWellConflictRemainsBlocked: piratesCandidate.travelerReadinessReview?.responsibleSourceStatus === 'source_conflict' && piratesCandidate.locationReview?.reviewDecision !== 'accepted',
  conflictedSourcesRequireAttention: sourceUpdates[sourceIds.baycanerTourism].status === 'needs_recheck' && sourceUpdates[sourceIds.baycanerOperator].status === 'needs_recheck' && sourceUpdates[sourceIds.aopa].status === 'needs_recheck',
  allReviewContentRemainsDraftOnly: [...placeDocuments, abrahamsCandidate, ...facts, audit, destinationDraft].every((document) => document._id.startsWith('drafts.')),
  noAcceptedCoordinateDecision: [...placeDocuments.map((doc) => doc.catalogLocationReview), abrahamsCandidate.locationReview, piratesCandidate.locationReview].every((review) => review?.reviewDecision !== 'accepted'),
  factsRemainSourceVerifiedAndChannelFree: facts.every((document) => document.verificationStatus === 'source_verified' && document.channels.length === 0 && document.sources.length >= 3),
  correctiveDestinationHasNoMedia: !destinationDraft.heroImage && !destinationDraft.gallery && live.destinationPublished._id === destinationId,
  existingPortfolioHasNoPublishedResearchFacts: live.publishedFacts === 0,
  existingMayaguanaFactsHaveNoDeliveryChannels: live.mayaguanaFactChannels === 0,
  allNewP0sRemainOpen: audit.gaps.filter((gap) => gap.priority === 'p0').every((gap) => ['open', 'researching'].includes(gap.status)),
}
if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const allPlans = [...sourcePlans, ...placePlans, ...candidatePlans, ...factPlans, auditPlan, destinationPlan]
const plan = {
  generatedAt: new Date().toISOString(), output: outputPath, mode: apply ? 'apply' : 'dry_run', sourceSignals, publicCopySignals, publicDestinationSignals,
  supabaseEvidence: {rows: supabaseRows},
  counts: {
    existingSourcesToUpdate: sourcePlans.filter((item) => item.needsUpdate).length,
    placeDraftsToCreateOrUpdate: placePlans.filter((item) => item.needsUpdate).length,
    candidateDraftsToUpdate: candidatePlans.filter((item) => item.needsUpdate).length,
    factDraftsToCreateOrUpdate: factPlans.filter((item) => item.needsUpdate).length,
    auditDraftsToCreateOrUpdate: Number(auditPlan.needsUpdate),
    destinationDraftsToCreateOrUpdate: Number(destinationPlan.needsUpdate),
    totalDocumentsToChange: allPlans.filter((item) => item.needsUpdate).length,
  },
  guardrails,
  changes: {
    sourceIds: sourcePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    placeIds: placePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    candidateIds: candidatePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    factIds: factPlans.filter((item) => item.needsUpdate).map((item) => item.id),
    auditIds: auditPlan.needsUpdate ? [auditId] : [],
    destinationIds: destinationPlan.needsUpdate ? [destinationDraftId] : [],
  },
  boundary: 'This alignment updates live/internal research-source records and review-only Mayaguana drafts. It does not mutate Supabase, accept a coordinate, change published Sanity or hardcoded web/mobile copy, publish facts, add delivery channels to research facts, expose an insecure link, contact an operator or authority, copy media, clear rights, select a provider, price, schedule, stay, route, operation, or approve traveler delivery.',
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
