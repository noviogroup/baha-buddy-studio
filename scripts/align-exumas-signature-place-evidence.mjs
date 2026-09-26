import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_EXUMAS_SIGNATURE_PLACE_EVIDENCE === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextStableReviewAt = '2026-11-03'
const outputPath = '/private/tmp/baha-buddy-exumas-signature-place-evidence-plan.json'
const destinationId = 'dest-exuma'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

const sourceIds = {
  exumasProfile: 'research-source-bmot-the-exumas',
  marineTransfer: 'research-source-bmot-exuma-local-marine-transfer',
  publicMap: 'research-source-bmot-public-map-dataset',
  pigBeach: 'research-source-bmot-big-major-cay-pig-beach',
  thunderball: 'research-source-bmot-thunderball-grotto',
  park: 'research-source-bnt-exuma-cays-land-sea-park',
  parkQuickGuide: 'research-source-bnt-exuma-park-quick-guide',
  parkContact: 'research-source-bnt-exuma-cays-park-contact-2026',
  parkFees: 'research-source-bnt-exuma-cays-park-fees-2026',
  compassMarina: 'research-source-operator-compass-cay-marina',
  compassContact: 'research-source-operator-compass-cay-marina-contact-2026',
  compassPolicies: 'research-source-operator-compass-cay-marina-policies-2026',
  compassTourism: 'research-source-bmot-compass-cay-marina-resort-2026',
}

const placeIds = {
  bigMajor: 'drafts.place-supabase-397ca218-f9cb-456e-9d54-3d4eb6790cf3',
  park: 'drafts.place-supabase-61cf7fb9-a680-4be9-b437-dbfaeee3d74a',
  compass: 'drafts.place-supabase-d18571d7-2c94-4437-a738-b53b8f7f1ec2',
}

const supabaseIds = {
  bigMajor: '397ca218-f9cb-456e-9d54-3d4eb6790cf3',
  park: '61cf7fb9-a680-4be9-b437-dbfaeee3d74a',
  compass: 'd18571d7-2c94-4437-a738-b53b8f7f1ec2',
}

const candidateId = 'drafts.canonical-place-candidate-the-exumas-thunderball-grotto'
const factIds = {
  bigMajor: 'drafts.island-fact-matched-signature-readiness-big-major-cay-the-exumas',
  compass: 'drafts.island-fact-matched-signature-readiness-compass-cay-marina-the-exumas',
  park: 'drafts.island-fact-matched-signature-readiness-exuma-cays-land-sea-park-the-exumas',
  thunderball: 'drafts.island-fact-signature-point-readiness-thunderball-grotto-the-exumas',
  publicCopy: 'drafts.island-fact-pig-beach-public-copy-evidence-boundary-the-exumas',
}

const auditIds = {
  catalog: 'drafts.island-research-audit-2026-08-05-signature-place-catalog-the-exumas',
  locations: 'drafts.island-research-audit-2026-08-05-signature-place-location-evidence-the-exumas',
  candidates: 'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-the-exumas',
  traveler: 'drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-the-exumas',
  matched: 'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-the-exumas',
  content: 'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-the-exumas',
  freshness: 'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-the-exumas',
  publicCopy: 'drafts.island-research-audit-2026-08-05-public-copy-conflicts-the-exumas',
}

const articleBaseId = 'article-hardcoded-swimming-pigs-exuma'
const articleDraftId = `drafts.${articleBaseId}`

const urls = {
  pigBeach: 'https://www.bahamas.com/experiences/official-home-swimming-pigs',
  thunderball: 'https://www.bahamas.com/plan-your-trip/things-to-do/thunderball-grotto',
  park: 'https://bnt.bs/explore/exuma/exuma-cays-land-sea-park/',
  parkContact: 'https://bnt.bs/contact-us/',
  parkFees: 'https://bnt.bs/payexumapark/',
  compassMarina: 'https://compasscaymarina.com/marina/',
  compassContact: 'https://compasscaymarina.com/contact-us/',
  compassPolicies: 'https://compasscaymarina.com/policies/',
  compassTourism: 'https://www.bahamas.com/hotels/compass-cay-marina-resort',
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

async function fetchText(url) {
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0 (compatible; BahaBuddyContentReview/1.0)'}})
      if (!response.ok) throw new Error(`${url} returned ${response.status}`)
      const body = await response.text()
      if (body.length < 200) throw new Error(`${url} returned an unexpectedly short body`)
      return body
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 250))
    }
  }
  throw lastError
}

function textContent(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
}

function signals(text, tests) {
  return Object.fromEntries(Object.entries(tests).map(([label, test]) => [label, test.test(text)]))
}

function reference(id, keyPrefix = 'source') {
  return {_type: 'reference', _key: `${keyPrefix}-${id}`.slice(0, 96), _ref: id}
}

function references(ids, keyPrefix = 'source') {
  return [...new Set(ids)].map((id) => reference(id, keyPrefix))
}

function mergeReferences(existing, ids, keyPrefix = 'source') {
  const merged = [...(existing || [])]
  const present = new Set(merged.map((item) => item._ref))
  for (const id of ids) {
    if (present.has(id)) continue
    merged.push(reference(id, keyPrefix))
    present.add(id)
  }
  return merged
}

function reviewPlan({cadenceDays, relationship, reviewScope, nextAction, method = 'webpage_review'}) {
  return {
    _type: 'researchSourceReviewPlan',
    plannedAt: checkedAt,
    reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: 'scheduled',
    freshnessStatus: 'current',
    cadenceBand: cadenceDays === 30 ? '30_day' : '90_day',
    cadenceDays,
    sourceRelationship: relationship,
    verificationMethod: method,
    changeTriggers: ['page content changes', 'contact or policy changes', 'closure or access changes'],
    reviewScope,
    nextAction,
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value)
      .filter((key) => !['_rev', '_createdAt', '_updatedAt'].includes(key))
      .sort()
      .map((key) => [key, stableValue(value[key])]))
  }
  return value
}

function differs(left, right) {
  return JSON.stringify(stableValue(left)) !== JSON.stringify(stableValue(right))
}

function pointInsidePolygon(point, vertices) {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index++) {
    const current = vertices[index]
    const prior = vertices[previous]
    const intersects = ((current.latitude > point.latitude) !== (prior.latitude > point.latitude)) &&
      point.longitude < ((prior.longitude - current.longitude) * (point.latitude - current.latitude)) /
        (prior.latitude - current.latitude) + current.longitude
    if (intersects) inside = !inside
  }
  return inside
}

function block(key, text, style = 'normal') {
  return {_type: 'block', _key: key, style, markDefs: [], children: [{_type: 'span', _key: `${key}-span`, marks: [], text}]}
}

function linkedBlock(key, before, label, href, after = '') {
  const markKey = `${key}-link`
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [{_type: 'link', _key: markKey, href, openInNewTab: true}],
    children: [
      {_type: 'span', _key: `${key}-before`, marks: [], text: before},
      {_type: 'span', _key: `${key}-label`, marks: [markKey], text: label},
      {_type: 'span', _key: `${key}-after`, marks: [], text: after},
    ],
  }
}

const [pigHtml, thunderHtml, parkHtml, parkContactHtml, parkFeesHtml, compassMarinaHtml, compassContactHtml, compassPoliciesHtml, compassTourismHtml] = await Promise.all([
  fetchText(urls.pigBeach),
  fetchText(urls.thunderball),
  fetchText(urls.park),
  fetchText(urls.parkContact),
  fetchText(urls.parkFees),
  fetchText(urls.compassMarina),
  fetchText(urls.compassContact),
  fetchText(urls.compassPolicies),
  fetchText(urls.compassTourism),
])

const pageText = {
  pigBeach: textContent(pigHtml),
  thunderball: textContent(thunderHtml),
  park: textContent(parkHtml),
  parkContact: textContent(parkContactHtml),
  parkFees: textContent(parkFeesHtml),
  compassMarina: textContent(compassMarinaHtml),
  compassContact: textContent(compassContactHtml),
  compassPolicies: textContent(compassPoliciesHtml),
  compassTourism: textContent(compassTourismHtml),
}

const sourceSignals = {
  pigBeach: signals(pageText.pigBeach, {
    bigMajorIdentity: /Big Major Cay/i,
    boatOnly: /only accessible by boat/i,
    interactionSigns: /rules and regulations to visitors/i,
    designatedFeeding: /designated place to feed/i,
  }),
  thunderball: signals(pageText.thunderball, {
    westOfStaniel: /west of Staniel Cay/i,
    lowSlackTide: /low or slack tide/i,
    highTideEquipment: /At high tide[\s\S]{0,120}diving equipment is necessary/i,
  }),
  park: signals(pageText.park, {
    identity: /Exuma Cays Land (?:&|and) Sea Park/i,
    officeHours: /Mon-Fri\s*9am-5pm/i,
    vhf09: /Channel\s*#?\s*09/i,
    vhf16: /Channel\s*#?\s*16/i,
    northBoundary: /24 deg 30/i,
    southBoundary: /24 deg 18/i,
  }),
  parkContact: signals(pageText.parkContact, {
    parkIdentity: /Exuma Cays Land and Sea Park/i,
    warderickWells: /Warderick Wells Cay/i,
    phone: /242[^0-9]{0,4}601[^0-9]{0,4}7438/i,
    email: /exumapark@bnt\.bs/i,
  }),
  parkFees: signals(pageText.parkFees, {
    paymentAfterMooring: /payment should be made after securing a mooring ball/i,
    noReservationGuarantee: /does not (?:take|accept) reservations/i,
    vat: /10% VAT/i,
  }),
  compassMarina: signals(pageText.compassMarina, {
    identity: /Marina on Compass Cay/i,
    dockage: /Dockage/i,
    draftLimit: /six-foot draft at low tide/i,
    marinaPhone: /242[^0-9]{0,4}422[^0-9]{0,4}7300/i,
  }),
  compassContact: signals(pageText.compassContact, {
    reservationLabel: /Marina Reservation ONLY/i,
    reservationEmail: /info@compasscaymarina\.org/i,
    marinaPhone: /242[^0-9]{0,4}422[^0-9]{0,4}7300/i,
  }),
  compassPolicies: signals(pageText.compassPolicies, {
    slipDeposit: /Deposit for slip reservations/i,
    noFires: /NO Fires Allowed/i,
    noDrones: /NO DRONES/i,
  }),
  compassTourism: signals(pageText.compassTourism, {
    identity: /Compass Cay Marina (?:&|and) Resort/i,
    exumasAssignment: /Compass Cay, The Exumas/i,
    ownerManager: /Owner\/Manager/i,
  }),
}

if (Object.values(sourceSignals).flatMap((group) => Object.values(group)).some((value) => !value)) {
  throw new Error(`Official source signals changed: ${JSON.stringify(sourceSignals)}`)
}

const parkBoundary = [
  {latitude: 24 + 30 / 60 + 37 / 3600, longitude: -(76 + 52 / 60 + 37 / 3600)},
  {latitude: 24 + 35 / 60 + 30 / 3600, longitude: -(76 + 45 / 60 + 50 / 3600)},
  {latitude: 24 + 18 / 60 + 37 / 3600, longitude: -(76 + 28 / 60 + 47 / 3600)},
  {latitude: 24 + 14 / 60 + 25 / 3600, longitude: -(76 + 36 / 60 + 2 / 3600)},
]

const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web', '.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')

const supabaseSelect = 'id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified'
const supabaseRows = []
for (const id of Object.values(supabaseIds)) {
  const response = await fetch(`${supabaseUrl}/rest/v1/places?select=${supabaseSelect}&id=eq.${id}`, {
    headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`},
  })
  if (!response.ok) throw new Error(`Supabase signature-place query failed for ${id}: ${response.status}`)
  supabaseRows.push(...await response.json())
}
const thunderballResponse = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,island_id&name=ilike.*Thunderball*`, {
  headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`},
})
if (!thunderballResponse.ok) throw new Error(`Supabase Thunderball query failed: ${thunderballResponse.status}`)
const thunderballRows = await thunderballResponse.json()
const supabaseById = new Map(supabaseRows.map((row) => [row.id, row]))
const parkRow = supabaseById.get(supabaseIds.park)
const geometryEvidence = {
  officialParkBoundaryCorners: parkBoundary,
  currentParkPoint: {latitude: Number(parkRow?.latitude), longitude: Number(parkRow?.longitude)},
  currentParkPointInsideOfficialBoundary: pointInsidePolygon({latitude: Number(parkRow?.latitude), longitude: Number(parkRow?.longitude)}, parkBoundary),
}

const allSourceIds = [...new Set(Object.values(sourceIds))]
const allPlaceIds = Object.values(placeIds)
const allFactIds = Object.values(factIds)
const allAuditIds = Object.values(auditIds)
const live = await client.fetch(`{
  "sources": *[_id in $sourceIds]{...},
  "places": *[_id in $placeIds]{...},
  "candidate": *[_id == $candidateId][0]{...},
  "facts": *[_id in $factIds]{...},
  "audits": *[_id in $auditIds]{...},
  "articleDraft": *[_id == $articleDraftId][0]{...},
  "articlePublished": *[_id == $articleBaseId][0]{...},
  "routedSourceIds": *[_type == "researchSource" && references($destinationId)]._id,
  "publishedFacts": count(*[_type == "islandFact" && !(_id in path("drafts.**"))]),
  "exumasFactChannels": count(*[_type == "islandFact" && _id in path("drafts.**") && destination._ref == $destinationId && count(channels) > 0])
}`, {
  sourceIds: allSourceIds,
  placeIds: allPlaceIds,
  candidateId,
  factIds: allFactIds,
  auditIds: allAuditIds,
  articleDraftId,
  articleBaseId,
  destinationId,
})

const sourceById = new Map(live.sources.map((source) => [source._id, source]))
const placeById = new Map(live.places.map((place) => [place._id, place]))
const factById = new Map(live.facts.map((fact) => [fact._id, fact]))
const auditById = new Map(live.audits.map((audit) => [audit._id, audit]))

for (const id of allPlaceIds) if (!placeById.has(id)) throw new Error(`Missing place review: ${id}`)
if (!live.candidate) throw new Error(`Missing candidate: ${candidateId}`)
for (const id of Object.values(factIds).filter((id) => id !== factIds.publicCopy)) if (!factById.has(id)) throw new Error(`Missing fact: ${id}`)
for (const id of Object.values(auditIds).filter((id) => id !== auditIds.publicCopy)) if (!auditById.has(id)) throw new Error(`Missing audit: ${id}`)
if (!live.articlePublished) throw new Error(`Missing published article: ${articleBaseId}`)

const destinationReference = reference(destinationId, 'destination')
const operationalTriggers = ['hours, fees, contacts or policies change', 'page becomes unavailable', 'operation, access or closure changes']
const newSources = [
  {
    _id: sourceIds.parkContact,
    _type: 'researchSource',
    title: 'Exuma Cays Land & Sea Park — current BNT contact route',
    url: urls.parkContact,
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['access', 'safety', 'overview'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current managing-authority contact page for the Warderick Wells park office, including the park telephone, email and VHF route. It does not establish coverage, guaranteed response, vessel access, accessibility, or a canonical point for the whole park.',
    reviewPlan: {...reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck the exact Exuma Park office telephone, email, address, VHF route, and any availability qualifier.', nextAction: 'Verify the contact fields and remote-office limitations before any traveler-facing operational guidance.'}), changeTriggers: operationalTriggers},
  },
  {
    _id: sourceIds.parkFees,
    _type: 'researchSource',
    title: 'Exuma Cays Land & Sea Park — current fee and reservation boundary',
    url: urls.parkFees,
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['access', 'experiences'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current BNT fee platform stating that payment follows securing a mooring ball, prepayment is not a reservation, and VAT is applied. Individual prices are volatile and are not copied into traveler-facing facts.',
    reviewPlan: {...reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck fee categories, VAT, payment sequence, reservation limitations, and platform availability without copying stale price tables.', nextAction: 'Keep public copy qualitative and require live BNT verification for the traveler date.'}), changeTriggers: operationalTriggers},
  },
  {
    _id: sourceIds.compassContact,
    _type: 'researchSource',
    title: 'Compass Cay Marina — current reservation contact',
    url: urls.compassContact,
    publisher: 'Compass Cay Marina',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['access', 'experiences', 'stays'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current operator contact page distinguishing marina and housing enquiries and publishing the marina reservation email and telephone. Its “open 24/7” widget is not reused as visitor-operation evidence.',
    reviewPlan: {...reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck the marina reservation phone, email, enquiry split, and any explicit operating-hours statement.', nextAction: 'Confirm current reservation and arrival instructions directly before traveler delivery; do not infer visitor hours from a site widget.'}), changeTriggers: operationalTriggers},
  },
  {
    _id: sourceIds.compassPolicies,
    _type: 'researchSource',
    title: 'Compass Cay Marina — current reservation and island policies',
    url: urls.compassPolicies,
    publisher: 'Compass Cay Marina',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['access', 'safety', 'experiences', 'stays'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current operator policy page covering slip deposits, cancellations, payment, and named island rules including fire, smoking, drone, food, pet, and camera restrictions. It does not provide a complete nurse-shark interaction or water-safety protocol.',
    reviewPlan: {...reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck reservation, cancellation, payment, island-use, photography, pet, and safety policies.', nextAction: 'Preserve exact operator rules and separately obtain responsible wildlife-interaction and accessibility guidance.'}), changeTriggers: operationalTriggers},
  },
  {
    _id: sourceIds.compassTourism,
    _type: 'researchSource',
    title: 'Compass Cay Marina & Resort — official Exumas identity listing',
    url: urls.compassTourism,
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['overview', 'stays', 'access', 'experiences'],
    checkedAt,
    nextReviewAt: nextStableReviewAt,
    status: 'active',
    notes: 'Current national-tourism listing explicitly assigning Compass Cay Marina & Resort to Compass Cay, The Exumas and naming the owner/manager. This is strong island-identity evidence, but not a coordinate, live availability, rate, safety, accessibility, or media-rights approval.',
    reviewPlan: reviewPlan({cadenceDays: 90, relationship: 'official_context_publisher', reviewScope: 'Recheck the official identity, island assignment, owner/manager listing, contact block, and official-site link.', nextAction: 'Use this source to adjudicate the wrong-island Supabase assignment; retain separate operator evidence for current operation.'}),
  },
]

const sourceUpdates = {
  [sourceIds.pigBeach]: {
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official page identifying Big Major Cay as Pig Beach, confirming boat-only access, and describing visitor signage, approved feeding categories, a designated trough, and community/operator care. It does not substantiate named operator rankings, fixed prices, seasonal guarantees, complete animal-welfare rules, accessibility, or safe interaction for every traveler.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck identity, boat-only access, visitor signs, feeding context, tourism-office contact, and any animal-interaction wording.', nextAction: 'Keep named providers, prices, schedules, animal-health claims, and safety guarantees out of public copy unless separately supported.'}),
  },
  [sourceIds.thunderball]: {
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    notes: 'Current official listing places Thunderball Grotto west of Staniel Cay and publishes low/slack-tide and high-tide equipment context. Static tide wording is not a go/no-go assessment and the page does not name a responsible guide, confirm entrance condition, emergency capability, or accessibility.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', reviewScope: 'Recheck identity, relative location, tide language, equipment wording, contact block, and map link.', nextAction: 'Require a responsible guide or operator, live conditions, skill/equipment screening, emergency plan, and accessibility review before recommendation.'}),
  },
  [sourceIds.park]: {
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    notes: 'Current managing-authority page publishing the park identity, boundary corners, Warderick Wells office context, office hours, VHF routes, wardens, moorings, trails, restrooms, visitor centre, and no-take enforcement. Its boundary proves the current Supabase point is outside the park and that the park should not be modeled as one visitor point.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck boundary text, office hours, communications, wardens, facilities, moorings, rules, and any closure or access notice.', nextAction: 'Keep the park area-based, quarantine the current point, and verify the exact visitor facility, route, vessel, conditions, and accessibility before delivery.'}),
  },
  [sourceIds.compassMarina]: {
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    notes: 'Current responsible-operator page publishing Compass Cay marina approach, draft limits, dockage and utility context, contact details, and a nurse-shark visitor activity. Rates are volatile. The page does not provide a complete wildlife-interaction, water-safety, emergency, transport, or accessibility protocol and does not establish a canonical coordinate.',
    reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck marina approach, draft limits, dockage and landing terms, contact details, services, and wildlife-activity wording.', nextAction: 'Verify arrival conditions, live rates, reservation, wildlife rules, safety, emergency readiness, and accessibility before traveler delivery.'}),
  },
}

const sourcePlans = newSources.map((source) => ({source, needsUpdate: differs(sourceById.get(source._id), source)}))
const sourceUpdatePlans = Object.entries(sourceUpdates).map(([id, fields]) => {
  const current = sourceById.get(id)
  if (!current) throw new Error(`Missing existing source: ${id}`)
  return {id, current, fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields)}
})

const bigMajor = placeById.get(placeIds.bigMajor)
const park = placeById.get(placeIds.park)
const compass = placeById.get(placeIds.compass)
const placeFields = {
  [placeIds.bigMajor]: {
    active: false,
    channels: [],
    catalogReviewStatus: 'location_blocked',
    evidenceSources: mergeReferences(bigMajor.evidenceSources, [sourceIds.pigBeach, sourceIds.marineTransfer, sourceIds.publicMap], 'exumas-pilot-source'),
    catalogLocationReview: {
      ...bigMajor.catalogLocationReview,
      checkedAt,
      reconciliationStatus: 'official_related_site_point_only',
      evidenceSources: references([sourceIds.pigBeach, sourceIds.marineTransfer, sourceIds.publicMap], 'location-source'),
      locationConfidence: 'high',
      operationEvidenceStatus: 'not_applicable_natural_feature',
      accessEvidenceStatus: 'partial_official_context',
      reviewDecision: 'not_applicable',
      notes: 'National tourism establishes Big Major Cay as Pig Beach and boat-only. The official map point is explicitly Pig Beach, a visitor site on the cay, while the Supabase row has no usable latitude or longitude. Preserve the cay-versus-beach distinction; no whole-cay point is accepted. Verify the exact intended target, public landing, licensed vessel, current posted rules, conditions, emergency plan, and accessibility.',
    },
    catalogTravelerReadinessReview: {
      ...bigMajor.catalogTravelerReadinessReview,
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      sources: references([sourceIds.pigBeach, sourceIds.marineTransfer, sourceIds.publicMap], 'source'),
      notes: 'National tourism confirms Big Major Cay/Pig Beach is boat-only and describes visitor signage, feeding categories, a designated trough, and community/operator care. It does not approve a named operator, price, schedule, complete animal-welfare protocol, or universal safety. Confirm the exact beach target, licensed vessel, departure and landing, current signs and feeding rules, guide briefing, conditions, emergency capability, and accessibility.',
    },
    catalogReviewNotes: 'The Supabase identity matches Big Major Cay but has no usable point. The official point is for Pig Beach as a visitor site, not a canonical whole-cay point. Keep the review inactive and channel-free; resolve the target model, access, animal-interaction, safety, accessibility, copy, and media before any delivery.',
    reviewedAt: checkedAt,
  },
  [placeIds.park]: {
    active: false,
    channels: [],
    catalogReviewStatus: 'location_blocked',
    website: urls.park,
    phone: '+1 242-601-7438',
    openingHours: 'Mon–Fri 9am–5pm; Sun 9am–12pm',
    evidenceSources: mergeReferences(park.evidenceSources, [sourceIds.park, sourceIds.parkQuickGuide, sourceIds.parkContact, sourceIds.parkFees], 'exumas-pilot-source'),
    catalogLocationReview: {
      _type: 'placeLocationReview',
      checkedAt,
      reconciliationStatus: 'area_identity_no_point',
      candidates: [],
      evidenceSources: references([sourceIds.park, sourceIds.parkQuickGuide, sourceIds.parkContact], 'location-source'),
      locationConfidence: 'high',
      operationEvidenceStatus: 'current_managing_authority',
      accessEvidenceStatus: 'current_responsible_source',
      reviewDecision: 'not_applicable',
      notes: 'BNT publishes four boundary corners for the Exuma Cays Land & Sea Park. The current Supabase point (24.182863, -76.456535) falls outside that official boundary. The park is a 112,640-acre land-and-sea area with a remote office at Warderick Wells; neither the office nor another visitor site should silently replace the whole-park geometry. Quarantine the point and choose an area/polygon model plus a separately verified visitor facility or route.',
    },
    catalogTravelerReadinessReview: {
      ...park.catalogTravelerReadinessReview,
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      sources: references([sourceIds.park, sourceIds.parkQuickGuide, sourceIds.parkContact, sourceIds.parkFees, sourceIds.exumasProfile], 'source'),
      notes: 'BNT currently publishes park hours, a Warderick Wells contact route, VHF context, wardens, facilities, moorings, no-take and vessel rules, and a fee platform that does not reserve moorings. The current Supabase point is outside the official boundary. Use an area model; verify the exact intended facility or route, responsible vessel, mooring availability, live fees, weather and sea state, emergency capability, accessibility, and media rights.',
    },
    catalogReviewNotes: 'The official and catalog names align, but the current Supabase point falls outside BNT’s published park boundary and cannot pass the location gate. Current BNT operation and contact details are retained only in this inactive, channel-free draft. No coordinate, visitor route, price, availability, accessibility, media, or delivery is approved.',
    reviewedAt: checkedAt,
  },
  [placeIds.compass]: {
    active: false,
    channels: [],
    website: 'https://compasscaymarina.com/',
    phone: '+1 242-422-7300',
    openingHours: '',
    catalogReviewStatus: 'island_assignment_conflict',
    evidenceSources: mergeReferences(compass.evidenceSources, [sourceIds.compassMarina, sourceIds.compassContact, sourceIds.compassPolicies, sourceIds.compassTourism, sourceIds.exumasProfile], 'exumas-pilot-source'),
    catalogLocationReview: {
      _type: 'placeLocationReview',
      checkedAt,
      reconciliationStatus: 'official_identity_source_no_point',
      candidates: [],
      evidenceSources: references([sourceIds.compassMarina, sourceIds.compassContact, sourceIds.compassTourism, sourceIds.exumasProfile], 'location-source'),
      locationConfidence: 'high',
      operationEvidenceStatus: 'current_responsible_operator',
      accessEvidenceStatus: 'current_responsible_source',
      reviewDecision: 'not_applicable',
      notes: 'The operator and national tourism place Compass Cay Marina on Compass Cay in The Exumas. The matched Supabase row remains assigned to Rum Cay. The current operator sources publish approach and contact context but no accountable canonical point was accepted in this review. Correct the island assignment through a separately reviewed Supabase workflow, then verify the marina entrance point and route purpose.',
    },
    catalogTravelerReadinessReview: {
      ...compass.catalogTravelerReadinessReview,
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      sources: references([sourceIds.compassMarina, sourceIds.compassContact, sourceIds.compassPolicies, sourceIds.compassTourism, sourceIds.exumasProfile], 'source'),
      notes: 'Current operator pages publish marina approach, draft, dockage, reservation contacts, and island-use policies; national tourism confirms Compass Cay, The Exumas. Rates and conditions remain live. The sources do not provide a complete nurse-shark interaction, water-safety, emergency, or accessibility protocol. Correct the wrong-island Supabase assignment first, then verify entrance, arrival conditions, live terms, wildlife rules, and media rights.',
    },
    catalogReviewNotes: 'Current operator and national-tourism evidence strongly contradicts the Supabase Rum Cay assignment and places the marina on Compass Cay in The Exumas. This draft records the conflict without changing the canonical row or accepting a coordinate. It remains inactive and channel-free.',
    reviewedAt: checkedAt,
  },
}

const placePlans = Object.entries(placeFields).map(([id, fields]) => {
  const current = placeById.get(id)
  return {id, current, fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields)}
})

const candidateFields = {
  identityEvidence: mergeReferences(live.candidate.identityEvidence, [sourceIds.thunderball, sourceIds.marineTransfer, sourceIds.publicMap], 'exumas-pilot-source'),
  locationReview: {
    ...live.candidate.locationReview,
    checkedAt,
    evidenceSources: references([sourceIds.exumasProfile, sourceIds.thunderball, sourceIds.marineTransfer, sourceIds.publicMap], 'location-source'),
    accessEvidenceStatus: 'partial_official_context',
    reviewDecision: 'pending',
    notes: 'National tourism identifies Thunderball Grotto west of Staniel Cay and the official map supplies one same-name point candidate. The page also gives low/slack-tide and high-tide equipment context, but this does not validate the point as a safe entrance or route. Keep the point pending until a responsible operator or authority confirms the exact feature, entrance purpose, approach, live conditions, skills, equipment, emergency plan, conservation rules, and accessibility.',
  },
  travelerReadinessReview: {
    ...live.candidate.travelerReadinessReview,
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    sources: references([sourceIds.exumasProfile, sourceIds.thunderball, sourceIds.marineTransfer, sourceIds.publicMap], 'source'),
    notes: 'The official page places the cave west of Staniel Cay and gives tide-dependent entry context. Static tide language is not a go/no-go decision, and no responsible guide or emergency plan is named. Confirm the exact point and entrance, responsible vessel/guide, tide and weather window, entrance condition, skill, equipment, supervision, conservation rules, emergency capability, and accessibility before delivery.',
  },
  reviewedAt: checkedAt,
  reviewNotes: 'The official identity remains absent from the current Supabase places query. One tourism-map point remains a candidate only; current source review does not accept it, create a canonical record, or approve access, safety, accessibility, copy, media, or delivery.',
}
const candidateNeedsUpdate = differs(Object.fromEntries(Object.keys(candidateFields).map((key) => [key, live.candidate[key]])), candidateFields)

const factFields = {
  [factIds.bigMajor]: {
    title: 'Big Major Cay: Pig Beach identity, interaction, and access boundary',
    topic: 'access',
    claim: 'National tourism identifies Big Major Cay as Pig Beach and says it is accessible only by boat. The current page describes visitor-interaction signs, approved feeding categories, a designated feeding trough, and care by local volunteers and visiting operators. The official map point is for Pig Beach, not the whole cay.',
    travelerGuidance: 'Choose the exact Pig Beach target and a licensed vessel, then verify departure and landing, current posted interaction and feeding rules, guide briefing, weather and sea conditions, supervision, emergency capability, accessibility, booking, and cancellation. Do not reuse named operator rankings, fixed prices, or unsupported animal-care claims from the legacy guide.',
    sources: references([sourceIds.pigBeach, sourceIds.marineTransfer, sourceIds.publicMap], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Internal evidence boundary only. The Pig Beach point is not promoted to the whole cay, and the official page does not substantiate the public legacy guide’s provider rankings, prices, timing guarantees, or all animal-handling claims.',
    channels: [],
  },
  [factIds.compass]: {
    title: 'Compass Cay Marina: identity, operation, policy, and island-assignment boundary',
    topic: 'access',
    claim: 'The marina operator currently publishes approach, vessel-draft, dockage, reservation-contact, and island-policy context. National tourism explicitly places Compass Cay Marina & Resort on Compass Cay in The Exumas, while the matched Supabase row remains assigned to Rum Cay.',
    travelerGuidance: 'Correct the island assignment only through a reviewed canonical workflow. Before delivery, verify the exact entrance and approach, live rates and reservation terms, arrival conditions, current island rules, nurse-shark interaction and water-safety protocol, emergency capability, accessibility, and media rights.',
    sources: references([sourceIds.compassMarina, sourceIds.compassContact, sourceIds.compassPolicies, sourceIds.compassTourism, sourceIds.exumasProfile], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Strong identity and island-assignment evidence does not authorize a Supabase edit or coordinate. Rates are not copied and the operator sources do not establish complete wildlife, water-safety, emergency, or accessibility guidance.',
    channels: [],
  },
  [factIds.park]: {
    title: 'Exuma Cays Land & Sea Park: boundary, operation, and visitor-route evidence',
    topic: 'safety',
    claim: 'The Bahamas National Trust currently publishes the park boundary corners, a remote Warderick Wells office and contact route, office hours, VHF context, wardens, moorings, visitor facilities, no-take and vessel rules, and a fee platform that does not reserve moorings. The current Supabase point lies outside the official boundary.',
    travelerGuidance: 'Treat the park as an area, not one POI. Quarantine the current point and select the exact intended visitor facility or route; then verify the responsible vessel, mooring availability, live fees and rules, weather and sea state, communications, emergency capability, accessibility, and media rights.',
    sources: references([sourceIds.park, sourceIds.parkQuickGuide, sourceIds.parkContact, sourceIds.parkFees, sourceIds.exumasProfile], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'The official boundary creates a location conflict with the current Supabase point. No replacement point, route, price, availability, emergency guarantee, accessibility, media right, or delivery decision is inferred.',
    channels: [],
  },
  [factIds.thunderball]: {
    title: 'Thunderball Grotto: point-candidate, tide, and safety boundary',
    topic: 'safety',
    claim: 'National tourism identifies Thunderball Grotto west of Staniel Cay, supplies one same-name map point candidate, and gives low/slack-tide and high-tide equipment context. It does not identify a responsible guide, validate the point as a safe entrance, or establish current conditions, emergency capability, or accessibility.',
    travelerGuidance: 'Keep the point pending. Confirm the exact entrance and point purpose with a responsible operator or authority, then verify a licensed vessel/guide, live tide and weather, entrance condition, skill and equipment, supervision, conservation rules, emergency plan, and accessibility.',
    sources: references([sourceIds.exumasProfile, sourceIds.thunderball, sourceIds.marineTransfer, sourceIds.publicMap], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Static official tide language is evidence context, not a current go/no-go decision. No coordinate, operator, safety guarantee, media right, or delivery is approved.',
    channels: [],
  },
  [factIds.publicCopy]: {
    _id: factIds.publicCopy,
    _type: 'islandFact',
    title: 'Pig Beach public guide: current evidence and prohibited carry-forward claims',
    destination: destinationReference,
    topic: 'safety',
    claim: 'Current official sources support the Big Major Cay/Pig Beach identity, boat-only access, posted interaction rules, approved feeding categories, a designated trough, and a tourism-office contact. They do not substantiate named operator rankings, instructions to avoid unnamed providers, fixed price ranges, seasonal or time-of-day guarantees, or every animal-handling and animal-health statement in the currently published imported guide.',
    travelerGuidance: 'Use the prepared corrective article draft. Keep provider selection, current price, schedule, weather, vessel, safety, accessibility, cancellation, and animal-interaction guidance tied to accountable current sources and runtime verification.',
    sources: references([sourceIds.pigBeach, sourceIds.marineTransfer], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'This fact documents a public-copy conflict and remains channel-free. It does not alter the live article or approve the corrective draft for publication.',
    channels: [],
  },
}

const factPlans = Object.entries(factFields).map(([id, fields]) => {
  const current = factById.get(id)
  const planned = current ? {...current, ...fields} : fields
  return {id, current, fields, planned, needsUpdate: current ? differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields) : true}
})

const auditSourceAdditions = {
  [auditIds.catalog]: [sourceIds.compassTourism, sourceIds.compassMarina, sourceIds.park, sourceIds.pigBeach, sourceIds.thunderball],
  [auditIds.locations]: [sourceIds.park, sourceIds.parkContact, sourceIds.compassTourism, sourceIds.compassMarina, sourceIds.pigBeach, sourceIds.thunderball],
  [auditIds.candidates]: [sourceIds.thunderball],
  [auditIds.traveler]: [sourceIds.thunderball],
  [auditIds.matched]: [sourceIds.pigBeach, sourceIds.park, sourceIds.parkContact, sourceIds.parkFees, sourceIds.compassMarina, sourceIds.compassContact, sourceIds.compassPolicies, sourceIds.compassTourism],
  [auditIds.content]: [sourceIds.pigBeach, sourceIds.park, sourceIds.parkContact, sourceIds.parkFees, sourceIds.compassMarina, sourceIds.compassContact, sourceIds.compassPolicies, sourceIds.compassTourism, sourceIds.thunderball],
  [auditIds.freshness]: [...live.routedSourceIds, ...newSources.map((source) => source._id)],
}

const gapActions = {
  [auditIds.catalog]: {
    '1 matched signature-place row fails the location gate': 'Big Major Cay remains point-blocked because Supabase has no usable coordinate and the official point is Pig Beach, a visitor site rather than a whole-cay point. Preserve the feature relationship and verify the exact traveler target before any canonical change.',
    '1 signature-place row has an island-assignment conflict': 'Current Compass Cay Marina operator and national-tourism sources place the marina on Compass Cay in The Exumas, contradicting the Supabase Rum Cay assignment. Correct only through a reviewed canonical workflow; do not accept a coordinate by inference.',
  },
  [auditIds.locations]: {
    '1 signature-place identity has only related-site point evidence': 'Keep the official Pig Beach map pin attached to Pig Beach as a visitor site. Do not promote it to a whole-cay coordinate for Big Major Cay; choose and verify the intended target model.',
  },
  [auditIds.candidates]: {
    'Canonical-place decision pending: Thunderball Grotto': 'Retain the official same-name map point as pending. Obtain responsible confirmation of the exact feature and entrance purpose, vessel or guide, live tide and weather, condition, skill and equipment, emergency plan, accessibility, copy, and media before a Supabase record is proposed.',
  },
  [auditIds.traveler]: {
    'Traveler-readiness delivery gate remains blocked: Thunderball Grotto': 'Static official tide language is not a go/no-go decision. Confirm the exact entrance and point purpose, responsible vessel/guide, live tide and weather, entrance condition, skill, equipment, supervision, conservation rules, emergency capability, and accessibility.',
  },
  [auditIds.matched]: {
    'Matched signature-place traveler delivery remains blocked: Big Major Cay': 'Confirm the exact Pig Beach target, licensed vessel, departure and landing, current posted interaction and feeding rules, guide briefing, weather and sea state, emergency capability, accessibility, booking, and cancellation. Remove unsupported provider, price, timing, and animal-care claims from public copy.',
    'Matched signature-place traveler delivery remains blocked: Compass Cay Marina': 'Correct the Supabase Rum Cay assignment through a reviewed workflow, then verify the exact marina entrance, approach, live rates and terms, island policies, wildlife interaction, water safety, emergency capability, accessibility, and media rights.',
    'Matched signature-place traveler delivery remains blocked: Exuma Cays Land & Sea Park': 'Quarantine the current Supabase point because it falls outside BNT’s published park boundary. Use an area model and verify the exact visitor facility or route, responsible vessel, mooring availability, live fees and rules, conditions, emergency capability, accessibility, and media rights.',
  },
}

const auditPlans = Object.entries(auditSourceAdditions).map(([id, additions]) => {
  const current = auditById.get(id)
  const actions = gapActions[id] || {}
  let gaps = (current.gaps || []).map((gap) => actions[gap.title] ? {...gap, action: actions[gap.title], status: gap.status === 'resolved' ? 'resolved' : 'researching'} : gap)
  for (const title of Object.keys(actions)) if (!gaps.some((gap) => gap.title === title)) throw new Error(`Missing target gap in ${id}: ${title}`)
  if (id === auditIds.locations && !gaps.some((gap) => gap.title === 'Exuma Cays Land & Sea Park canonical point falls outside the official park boundary')) {
    gaps = [...gaps, {
      _type: 'researchGap',
      _key: 'gap-exumas-park-point-outside-official-boundary',
      topic: 'places',
      priority: 'p0',
      title: 'Exuma Cays Land & Sea Park canonical point falls outside the official park boundary',
      action: 'Quarantine the current point. Adopt a supported area or polygon model from BNT’s published boundary and separately verify the intended visitor facility or route before proposing any canonical coordinate change.',
      status: 'researching',
    }]
  }
  const sources = mergeReferences(current.sources, additions, 'exumas-pilot-source')
  const addition = ' The Exumas pilot now records current operator contacts and policies, park contact and fee boundaries, official park geometry, a wrong-island conflict, and a public Pig Beach copy conflict. These improve evidence quality but do not approve a coordinate, Supabase write, price, provider ranking, media, or delivery.'
  const methodologyNotes = current.methodologyNotes?.includes('The Exumas pilot now records') ? current.methodologyNotes : `${current.methodologyNotes || ''}${addition}`.trim()
  return {id, current, gaps, sources, methodologyNotes, needsUpdate: differs(current.gaps, gaps) || differs(current.sources, sources) || current.methodologyNotes !== methodologyNotes}
})

const coverageTopics = [
  ['overview', 2, 'Official identity evidence is strong, but public copy and canonical location conflicts remain under review.'],
  ['access', 2, 'Responsible and official access context exists for the four signature places, but exact vessels, routes and live conditions remain unverified.'],
  ['stays', 1, 'Compass Cay lodging and reservation evidence is partial and not a complete current stay inventory.'],
  ['food', 1, 'No food claim is approved by this public-copy review.'],
  ['experiences', 2, 'Current official experience context exists, while providers, prices, schedules and availability remain runtime checks.'],
  ['nature', 2, 'Managing-authority and national-tourism sources support the natural-feature identities and protected-area rules with explicit scope limits.'],
  ['culture', 1, 'Film-history and destination context are present but are not the focus of this operational review.'],
  ['seasonality', 1, 'The public article’s seasonal and time-of-day claims lack current responsible evidence.'],
  ['safety', 2, 'Official sources provide partial interaction, tide, vessel and park-rule context, not complete traveler safety or emergency readiness.'],
  ['accessibility', 0, 'No responsible feature-level accessibility evidence was established for the reviewed experiences.'],
]

const publicCopyAudit = {
  _id: auditIds.publicCopy,
  _type: 'islandResearchAudit',
  title: 'The Exumas public-copy conflict review — 2026-08-05',
  destination: destinationReference,
  auditedAt: checkedAt,
  nextAuditAt: nextOperationalReviewAt,
  owner: 'Baha Buddy Content Operations',
  status: 'researching',
  overallScore: 1.4,
  coverage: coverageTopics.map(([topic, score, finding]) => ({_type: 'researchCoverageScore', _key: `coverage-${topic}`, topic, score, evidenceCount: 0, finding})),
  gaps: [
    {
      _type: 'researchGap',
      _key: 'gap-exumas-pig-beach-public-copy-conflict',
      topic: 'safety',
      priority: 'p0',
      title: 'Published Pig Beach guide contains unsupported provider, price, timing, and animal-care claims',
      action: 'Review the prepared Sanity draft against the cited current official sources. Remove named rankings, avoid-provider language, fixed price ranges, seasonal or time-of-day guarantees, and animal-handling or health claims that lack an accountable current source before publishing.',
      status: 'researching',
    },
    {
      _type: 'researchGap',
      _key: 'gap-exumas-pig-beach-provider-runtime',
      topic: 'experiences',
      priority: 'p1',
      title: 'Pig Beach provider, vessel, price, schedule, and cancellation evidence remains runtime-only',
      action: 'At planning time, compare accountable licensed operators and verify the exact departure, vessel, group size, inclusions, price, schedule, cancellation, weather policy, safety briefing, accessibility, and emergency plan.',
      status: 'researching',
    },
  ],
  sources: references([sourceIds.pigBeach, sourceIds.marineTransfer, sourceIds.publicMap], 'source'),
  methodologyNotes: 'This review compares the currently published imported Sanity article and its hardcoded web fallback with current national-tourism evidence. It prepares a safer draft but does not alter or unpublish the live document, approve a provider or price, copy media, enable a new channel, or authorize traveler delivery.',
}
const publicCopyAuditNeedsUpdate = differs(auditById.get(auditIds.publicCopy), publicCopyAudit)

const articleDraft = {
  _id: articleDraftId,
  _type: 'article',
  title: 'Swimming pigs in The Exumas: how to plan responsibly',
  slug: {_type: 'slug', current: 'swimming-pigs-exuma'},
  excerpt: 'A source-backed planning guide to Big Major Cay and Pig Beach, covering boat access, current interaction boundaries, and what to verify before choosing an operator.',
  body: [
    block('exumas-pig-intro', 'Big Major Cay—widely known as Pig Beach—is the official home of The Exumas’ swimming pigs. Reaching it requires a boat, and the practical details depend on the exact departure point, vessel, operator, weather, and sea conditions.'),
    block('exumas-pig-what-established', 'What current official sources establish', 'h2'),
    linkedBlock('exumas-pig-official-source', 'The ', 'current official Pig Beach page', urls.pigBeach, ' identifies Big Major Cay, confirms boat-only access, and describes visitor signs, approved feeding categories, a designated feeding trough, and care by local volunteers and visiting operators.'),
    block('exumas-pig-rules', 'Follow the signs and the current guide’s briefing. Do not substitute social-media advice or an old article for the rules in force on the day of the visit.'),
    block('exumas-pig-transport', 'Choosing transport', 'h2'),
    block('exumas-pig-transport-body', 'Confirm that the operator and vessel are appropriate for your departure point and party. Ask about the exact itinerary, licensed operation, group size, flotation and safety equipment, supervision in the water, weather cancellation policy, emergency plan, accessibility, inclusions, and the current total price before booking.'),
    block('exumas-pig-conditions', 'Conditions and interaction', 'h2'),
    block('exumas-pig-conditions-body', 'The official page provides general interaction context, not a guarantee that every visit is suitable or safe. Recheck weather and sea state, landing conditions, the current animal-interaction and feeding instructions, the swimming ability expected of guests, and the assistance available for children or travelers with mobility, sensory, or other access needs.'),
    block('exumas-pig-not-carried', 'Claims deliberately not carried forward', 'h2'),
    block('exumas-pig-not-carried-body', 'This draft does not rank or disparage named operators, publish fixed price ranges, promise a best season or time of day, or repeat animal-handling and animal-health claims without a current accountable source. Those details can change and must be verified for the traveler’s actual date and route.'),
    linkedBlock('exumas-pig-island-context', 'Use the ', 'official Exumas access overview', 'https://www.bahamas.com/the-islands/the-exumas/about-exumas', ' for island-chain context, then let Buddy compare current bookable options against the traveler’s departure point, party needs, and conditions.'),
  ],
  category: 'travel_guide',
  relatedDestination: destinationReference,
  readTimeMinutes: 4,
  buddyPrompt: 'I want to visit Big Major Cay/Pig Beach. Compare current licensed options for my departure point and party, including vessel, duration, total price, cancellation, safety briefing, accessibility, and weather fallback.',
  planningSummary: 'Big Major Cay, also known as Pig Beach, is accessible only by boat. Use current official interaction guidance and verify the exact licensed operator, departure, vessel, group size, price, schedule, cancellation, conditions, emergency plan, and accessibility at planning time.',
  channels: ['web', 'mobile', 'buddy'],
  publishedAt: live.articlePublished.publishedAt,
  reviewedAt: checkedAt,
  featured: false,
  order: live.articlePublished.order ?? 99,
  source: {
    _type: 'contentSource',
    system: 'web_source',
    sourcePath: 'src/lib/article-content.ts',
    sourceKey: 'swimming-pigs-exuma',
    ownership: 'sanity_canonical',
    importedAt: live.articlePublished.source?.importedAt,
    notes: 'Review-only corrective draft prepared from current official Exumas sources. It removes unsupported provider rankings, avoid-provider language, fixed price ranges, timing guarantees, and uncited animal-care claims. The published article and hardcoded fallback remain unchanged until separate editorial approval and release.',
  },
  tags: ['experiences', 'review-required'],
  seo: {
    _type: 'seo',
    metaTitle: 'Swimming pigs in The Exumas: responsible planning',
    metaDescription: 'Plan a Big Major Cay and Pig Beach visit using current boat-access, interaction, operator, safety, and accessibility checks.',
  },
  evidenceSources: references([sourceIds.pigBeach, sourceIds.marineTransfer, sourceIds.publicMap], 'evidence-source'),
  editorialReviewStatus: 'ready_for_review',
  editorialReviewNotes: 'The live imported article and hardcoded fallback contain claims not supported by the current official evidence set. Review this corrective draft, verify any provider-specific statements separately, select rights-cleared media, and publish only through the normal editorial release process.',
}
const articleDraftNeedsUpdate = differs(live.articleDraft, articleDraft)

const prospectivePlaces = placePlans.map((plan) => ({...plan.current, ...plan.fields}))
const prospectiveCandidate = {...live.candidate, ...candidateFields}
const prospectiveFacts = factPlans.map((plan) => plan.planned)
const prospectiveAudits = [...auditPlans.map((plan) => ({...plan.current, gaps: plan.gaps, sources: plan.sources, methodologyNotes: plan.methodologyNotes})), publicCopyAudit]
const trackedP0Titles = new Set([
  'Exuma Cays Land & Sea Park canonical point falls outside the official park boundary',
  'Published Pig Beach guide contains unsupported provider, price, timing, and animal-care claims',
  ...Object.values(gapActions).flatMap((actions) => Object.keys(actions)),
])
const openP0Statuses = new Set(['open', 'researching'])

const guardrails = {
  allOfficialSignalsPresent: Object.values(sourceSignals).flatMap((group) => Object.values(group)).every(Boolean),
  exactSupabaseRowsLoaded: supabaseRows.length === 3 && Object.values(supabaseIds).every((id) => supabaseById.has(id)),
  thunderballStillAbsentFromSupabasePlaces: thunderballRows.length === 0,
  bigMajorStillLacksUsablePoint: supabaseById.get(supabaseIds.bigMajor)?.latitude == null && supabaseById.get(supabaseIds.bigMajor)?.longitude == null,
  compassWrongIslandConflictPreserved: supabaseById.get(supabaseIds.compass)?.island_id === 'rum-cay' && placeFields[placeIds.compass].catalogReviewStatus === 'island_assignment_conflict',
  parkPointOutsideOfficialBoundary: geometryEvidence.currentParkPointInsideOfficialBoundary === false,
  parkConvertedToAreaReviewWithoutPointCandidate: placeFields[placeIds.park].catalogLocationReview.reconciliationStatus === 'area_identity_no_point' && placeFields[placeIds.park].catalogLocationReview.candidates.length === 0,
  allContentTargetsRemainDrafts: [...prospectivePlaces, prospectiveCandidate, ...prospectiveFacts, ...prospectiveAudits, articleDraft].every((document) => document._id.startsWith('drafts.')),
  allFourPlaceReviewsRemainBlocked: [...prospectivePlaces.map((place) => place.catalogTravelerReadinessReview), prospectiveCandidate.travelerReadinessReview].every((review) => review?.deliveryDecision === 'blocked' && review?.overallStatus === 'blocked'),
  placeOverlaysRemainInactiveAndChannelFree: prospectivePlaces.every((place) => place.active === false && (place.channels || []).length === 0),
  noAcceptedCoordinateDecision: [...prospectivePlaces.map((place) => place.catalogLocationReview), prospectiveCandidate.locationReview].every((review) => review?.reviewDecision !== 'accepted'),
  factsRemainSourceVerifiedDraftsWithoutChannels: prospectiveFacts.every((fact) => fact.verificationStatus === 'source_verified' && (fact.channels || []).length === 0 && fact.sources?.length >= 2),
  correctiveArticleRemainsDraftAndPublishedArticleUntouched: articleDraft._id === articleDraftId && live.articlePublished._id === articleBaseId,
  existingPortfolioHasNoPublishedResearchFacts: live.publishedFacts === 0,
  existingExumasFactsHaveNoDeliveryChannels: live.exumasFactChannels === 0,
  everyTrackedP0RemainsOpen: prospectiveAudits.flatMap((audit) => audit.gaps || []).filter((gap) => trackedP0Titles.has(gap.title)).every((gap) => gap.priority !== 'p0' || openP0Statuses.has(gap.status)),
}

if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const plan = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  mode: apply ? 'apply' : 'dry_run',
  sourceSignals,
  supabaseEvidence: {
    rows: supabaseRows,
    thunderballMatches: thunderballRows,
  },
  geometryEvidence,
  counts: {
    sourcesToCreateOrReplace: sourcePlans.filter((plan) => plan.needsUpdate).length,
    existingSourcesToUpdate: sourceUpdatePlans.filter((plan) => plan.needsUpdate).length,
    placeDraftsToUpdate: placePlans.filter((plan) => plan.needsUpdate).length,
    candidateDraftsToUpdate: Number(candidateNeedsUpdate),
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
    candidateIds: candidateNeedsUpdate ? [candidateId] : [],
    factIds: factPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    auditIds: [...auditPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id), ...(publicCopyAuditNeedsUpdate ? [auditIds.publicCopy] : [])],
    articleIds: articleDraftNeedsUpdate ? [articleDraftId] : [],
  },
  boundary: 'This alignment updates live/internal source records and review-only Sanity drafts for four Exumas signature places plus one corrective article draft. It does not mutate Supabase, accept a coordinate, change the published article or hardcoded fallback, publish facts, add research delivery channels, select a provider or price, contact an operator or authority, copy media, clear rights, or approve traveler delivery.',
}

if (apply) {
  let transaction = client.transaction()
  const documentIds = []
  for (const item of sourcePlans.filter((item) => item.needsUpdate)) {
    transaction = transaction.createOrReplace(item.source)
    documentIds.push(item.source._id)
  }
  for (const item of sourceUpdatePlans.filter((item) => item.needsUpdate)) {
    transaction = transaction.patch(item.id, (patch) => patch.set(item.fields))
    documentIds.push(item.id)
  }
  for (const item of placePlans.filter((item) => item.needsUpdate)) {
    transaction = transaction.patch(item.id, (patch) => patch.set(item.fields))
    documentIds.push(item.id)
  }
  if (candidateNeedsUpdate) {
    transaction = transaction.patch(candidateId, (patch) => patch.set(candidateFields))
    documentIds.push(candidateId)
  }
  for (const item of factPlans.filter((item) => item.needsUpdate)) {
    if (item.current) transaction = transaction.patch(item.id, (patch) => patch.set(item.fields))
    else transaction = transaction.createOrReplace(item.fields)
    documentIds.push(item.id)
  }
  for (const item of auditPlans.filter((item) => item.needsUpdate)) {
    transaction = transaction.patch(item.id, (patch) => patch.set({gaps: item.gaps, sources: item.sources, methodologyNotes: item.methodologyNotes}))
    documentIds.push(item.id)
  }
  if (publicCopyAuditNeedsUpdate) {
    transaction = transaction.createOrReplace(publicCopyAudit)
    documentIds.push(auditIds.publicCopy)
  }
  if (articleDraftNeedsUpdate) {
    transaction = transaction.createOrReplace(articleDraft)
    documentIds.push(articleDraftId)
  }
  if (documentIds.length > 0) {
    const result = await transaction.commit({visibility: 'sync'})
    plan.commit = {transactionId: result.transactionId, documentIds}
  } else {
    plan.commit = {transactionId: null, documentIds: []}
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)
console.log(JSON.stringify(plan, null, 2))
