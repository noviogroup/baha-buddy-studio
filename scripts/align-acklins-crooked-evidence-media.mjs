import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_ACKLINS_CROOKED_EVIDENCE_MEDIA === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextMediaPolicyReviewAt = '2027-02-01'
const nextStableReviewAt = '2027-08-05'
const destinationId = 'dest-acklins-crooked-island'
const destinationDraftId = `drafts.${destinationId}`
const outputPath = '/private/tmp/baha-buddy-acklins-crooked-evidence-media-plan.json'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

const sourceIds = {
  islandProfile: 'research-source-bmot-acklins-crooked-island',
  longCay: 'research-source-bmot-long-cay-access',
  ferries: 'research-source-bahamas-ferries-current-passenger-reconciliation',
  publicMap: 'research-source-bmot-public-map-dataset',
  ancientSites: 'research-source-bmot-acklins-lucayan-indian-sites',
  turtleSound: 'research-source-bmot-turtle-sound',
  mediaBoundary: 'research-source-bmot-brand-center-media-boundary',
  nasaAcklins2024: 'research-source-nasa-acklins-iss071e365062',
  nasaBank2015: 'research-source-nasa-crooked-acklins-bank-iss043-e-120519',
  nasaTerms: 'research-source-nasa-jsc-astronaut-photo-reuse-terms',
  wikimediaMap: 'research-source-wikimedia-acklins-crooked-topographic-map',
}

const supabaseIds = {
  trophyLodge: 'e0b54187-500d-444e-9bf1-caca74ffe7b2',
  bight: '0f922564-abe0-4a1c-9461-7ff4fc8aadbc',
  brewerySouthCarolina: '5afc71e2-5510-44f5-8649-c5bcda775678',
  beachFlorida: 'da05f700-a974-4631-985b-591ffd6dc8eb',
  breweryDelaware: 'b46ec44d-3389-4df7-b2bd-736de04fc9b5',
  creekside: '5c50c16b-046e-4817-9a88-2e198e5192f5',
  ivels: 'fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49',
  spoonFlorida: '838d0ae6-4413-4a03-99e1-39f0dbb72a77',
  postAustralia: '29c16c48-143c-495e-b5a3-901d18bf1090',
  genericCrooked: 'ae4607c9-304e-4fa2-8b63-8839d35f1a49',
  caves: 'f712e747-33df-4d0b-ba19-8cd89c304a54',
}
const foreignCatalogKeys = new Set(['brewerySouthCarolina', 'beachFlorida', 'breweryDelaware', 'spoonFlorida', 'postAustralia'])
const publishedPlaceIds = Object.fromEntries(Object.entries(supabaseIds).map(([key, id]) => [key, `place-supabase-${id}`]))
const placeIds = Object.fromEntries(Object.entries(publishedPlaceIds).map(([key, id]) => [key, `drafts.${id}`]))

const candidateIds = {
  ancientSites: 'drafts.canonical-place-candidate-acklins-crooked-island-ancient-lucayan-sites',
  longCay: 'drafts.canonical-place-candidate-acklins-crooked-island-long-cay',
  turtleSound: 'drafts.canonical-place-candidate-acklins-crooked-island-turtle-sound',
}

const imageIds = {
  nasaAcklins2024: 'drafts.image-candidate-acklins-nasa-iss071e365062',
  nasaBank2015: 'drafts.image-candidate-crooked-acklins-bank-nasa-iss043-e-120519',
  wikimediaMap: 'drafts.image-candidate-acklins-crooked-topographic-map',
  bmotHero: 'drafts.image-candidate-acklins-crooked-current-bmot-hero',
  bmotLongCay: 'drafts.image-candidate-acklins-crooked-long-cay-bmot-display',
  bmotSeaview: 'drafts.image-candidate-acklins-crooked-seaview-beach-bmot-display',
  legacyHero: 'drafts.image-candidate-acklins-crooked-legacy-hero-rights-unresolved',
}

const factIds = {
  media: 'drafts.island-fact-acklins-crooked-media-and-legacy-hero-boundary',
  transport: 'drafts.island-fact-acklins-crooked-transport-source-conflict-boundary',
  publicCopy: 'drafts.island-fact-acklins-crooked-public-copy-evidence-boundary',
}
const auditId = 'drafts.island-research-audit-2026-08-05-acklins-crooked-evidence-media'

const urls = {
  islandProfile: 'https://www.bahamas.com/islands/acklins-crooked-island',
  nasaAcklinsPage: 'https://www.nasa.gov/image-detail/iss071e365062/',
  nasaAcklinsApi: 'https://www.nasa.gov/wp-json/wp/v2/media?search=iss071e365062&per_page=20&_fields=id,date,slug,caption,alt_text,source_url,media_details,link',
  nasaAcklinsOriginal: 'https://www.nasa.gov/wp-content/uploads/2024/08/iss071e365062.jpg',
  nasaAcklinsReview: 'https://www.nasa.gov/wp-content/uploads/2024/08/iss071e365062.jpg?w=2000',
  nasaBankPage: 'https://eol.jsc.nasa.gov/searchphotos/photo.pl?frame=120519&mission=ISS043&roll=E',
  nasaBankOriginal: 'https://eol.jsc.nasa.gov/DatabaseImages/ESC/large/ISS043/ISS043-E-120519.JPG',
  nasaTerms: 'https://eol.jsc.nasa.gov/FAQ/default.htm',
  wikimediaPage: 'https://commons.wikimedia.org/wiki/File:Acklins_and_Crooked_15ft_4p572_shaded.png',
  wikimediaOriginal: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Acklins_and_Crooked_15ft_4p572_shaded.png',
  bmotHero: 'https://tempo.cdn.tambourine.com/windsong/media/bmot-acklins-crooked-mainsite-hero-image-5f4ee38a7713b.jpg?q=16',
  bmotLongCay: 'https://tempo.cdn.tambourine.com/windsong/media/bmot-acklins-crooked-mainsite-island-insider-petals-images-sleepy-long-cay-5f4ef3047ce67.jpg',
  bmotSeaview: 'https://tempo.cdn.tambourine.com/windsong/media/acklins-crooked-islands-seaview-beach-5f74d86279ea8.jpg?q=19',
  legacyHero: 'https://tempo.cdn.tambourine.com/windsong/media/bmot-acklins-crooked-island-islands-img-6577398613c5c.jpg',
}

const managedAssetDefinitions = {
  nasaAcklins2024: {
    url: urls.nasaAcklinsReview,
    filename: 'acklins-nasa-iss071e365062-2000.jpg',
    checksum: '73118e0bc4d31da245d5c409642247c2c09ef5cb63fb447adcfd96f57f7e400f',
    width: 2000,
    height: 1333,
  },
  nasaBank2015: {
    url: urls.nasaBankOriginal,
    filename: 'crooked-acklins-bank-nasa-iss043-e-120519.jpg',
    checksum: '23099aaa7359cfe55ddc9027d2bbdfca08b12c791749a360f3155c07b3622b74',
    width: 3280,
    height: 4928,
  },
  wikimediaMap: {
    url: urls.wikimediaOriginal,
    filename: 'acklins-crooked-topographic-map-public-domain.png',
    checksum: '55c544fd926958488d559652a72c6d9a8347b846adb6f46253752501ed2b4fa9',
    width: 1918,
    height: 1490,
  },
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

async function fetchText(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  if (!response.ok) throw new Error(`Research source failed: ${url} (${response.status})`)
  return plainText(await response.text())
}

async function fetchHtml(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  if (!response.ok) throw new Error(`Research source failed: ${url} (${response.status})`)
  return response.text()
}

async function fetchBuffer(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  if (!response.ok) throw new Error(`Image source failed: ${url} (${response.status})`)
  return Buffer.from(await response.arrayBuffer())
}

async function imageStatus(url) {
  const response = await fetch(url, {method: 'HEAD', headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  return {url, status: response.status, ok: response.ok, contentType: response.headers.get('content-type'), contentLength: response.headers.get('content-length')}
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

function reviewPlan({cadenceDays, relationship, reviewScope, nextAction, attention = false, method = 'webpage_review', triggers = ['publisher_url_or_scope_change']}) {
  const cadenceBand = cadenceDays <= 30 ? '30_day' : cadenceDays <= 90 ? '90_day' : cadenceDays <= 180 ? '180_day' : cadenceDays <= 365 ? 'annual' : 'long_term'
  return {
    _type: 'researchSourceReviewPlan', plannedAt: checkedAt, reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus: attention ? 'attention_required' : 'scheduled', freshnessStatus: attention ? 'needs_recheck' : 'current',
    cadenceBand, cadenceDays, sourceRelationship: relationship, verificationMethod: method,
    changeTriggers: triggers, reviewScope, nextAction,
  }
}

function block(key, text) {
  return {_type: 'block', _key: key, style: 'normal', markDefs: [], children: [{_type: 'span', _key: `${key}-span`, text, marks: []}]}
}

function travelerReview({ids, responsible = 'unresolved', operation = 'unresolved', access = 'unresolved', copy = 'blocked_by_source_conflict', notes}) {
  return {
    _type: 'placeTravelerReadinessReview', checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked',
    responsibleSourceStatus: responsible, operationStatus: operation, accessStatus: access, safetyStatus: 'not_established',
    accessibilityStatus: 'not_published', copyStatus: copy, mediaStatus: 'no_approved_media', deliveryDecision: 'blocked',
    sources: references(ids, 'readiness-source'), notes,
  }
}

function contentReview({ids, notes}) {
  const sourceRefs = references(ids, 'content-source')
  const components = [
    ['identity', 'partial', 'The catalog row is preserved for exact evidence review; its identity and island assignment are not automatically approved.', 'Resolve the exact entity, island, feature type, duplicate relationship, and responsible source before any canonical change.'],
    ['description', 'blocked', 'The source catalog provides no useful source-backed traveler description.', 'Obtain current responsible-source identity and descriptive context before drafting public copy.'],
    ['operation_access', 'blocked', 'Current operation, responsible access, route, restrictions, and fallback are not established.', 'Verify current operation, access, restrictions, assistance, and fallback with the responsible source.'],
    ['safety', 'missing', 'No current feature-specific safety or emergency evidence is established.', 'Verify hazards, supervision, emergency response, communications, and traveler limitations.'],
    ['accessibility', 'missing', 'No responsible feature-level accessibility statement is established.', 'Obtain routes, surfaces, gradients, transfers, toilets, sensory support, service-animal, and assistance details.'],
    ['media', 'blocked', 'The Supabase row has no media, and no exact place-level asset has documented reusable rights and reviewed alt text.', 'Select a controlled-library, government-reuse, open-license, or directly permitted asset; record the exact terms and credit, then review factual alt text.'],
    ['traveler_copy', 'blocked', 'Identity, operation, access, safety, accessibility, media, and editorial gates do not form a delivery-safe package.', 'Keep all channels closed until every gate is resolved and a separate publication decision is recorded.'],
  ].map(([component, status, evidenceSummary, nextAction], index) => ({_type: 'placeCopyComponentReview', _key: `component-${index + 1}-${component}`, component, status, evidenceSummary, nextAction}))
  return {
    _type: 'placeContentReadinessReview', checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked',
    accessibilityEvidenceStatus: 'not_found_in_reviewed_sources', accessibilitySources: sourceRefs,
    accessibilityBoundary: 'A location, terrain description, transport mode, source silence, or generic label is not a feature-level accessibility promise. Missing evidence is not proof that a feature is inaccessible.',
    copyFoundationStatus: 'blocked_by_conflict', copyComponents: components, mediaEvidenceStatus: 'no_candidate_media',
    mediaRightsStatus: 'unknown_or_unverified', mediaPolicySources: [reference(sourceIds.mediaBoundary, 'media-policy-source')],
    altTextStatus: 'no_approved_image', publicCopyDecision: 'blocked', notes,
  }
}

function fact({id, title, topic, claim, guidance, ids, confidence = 'high', volatility = 'operational'}) {
  return {
    _id: id, _type: 'islandFact', title, destination: reference(destinationId, 'destination-acklins-crooked-island'), topic, claim,
    travelerGuidance: guidance, sources: references(ids, 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt,
    volatility, confidence, verificationStatus: 'source_verified', channels: [],
    editorNotes: 'Review-only evidence. This fact does not approve publication, a Supabase change, a coordinate, a provider, route, schedule, operation, media asset, accessibility claim, or traveler delivery.',
  }
}

const [islandHtml, nasaAcklinsApiText, nasaBankText, nasaTermsText, wikimediaText, managedBuffers, externalImageStatuses] = await Promise.all([
  fetchHtml(urls.islandProfile),
  fetchText(urls.nasaAcklinsApi),
  fetchText(urls.nasaBankPage),
  fetchText(urls.nasaTerms),
  fetchText(urls.wikimediaPage),
  Promise.all(Object.values(managedAssetDefinitions).map(async (definition) => ({...definition, buffer: await fetchBuffer(definition.url)}))),
  Promise.all([urls.bmotHero, urls.bmotLongCay, urls.bmotSeaview, urls.legacyHero].map(imageStatus)),
])
const islandText = plainText(islandHtml)

const sourceSignals = {
  island: {
    ...signals(islandText, {
      identity: /Acklins\s*&\s*Crooked Island/i,
      group: /Acklins, Crooked Island and Long Cay, wrapped around the Bight of Acklins/i,
      crookedFerry: /twice-daily ferries from Acklins/i,
      longCayFerry: /daily ferry from neighboring Acklins/i,
      bightTypo: /1,000 square foot lagoon/i,
    }),
    heroImage: /bmot-acklins-crooked-mainsite-hero-image-5f4ee38a7713b/i.test(islandHtml),
    longCayImage: /bmot-acklins-crooked-mainsite-island-insider-petals-images-sleepy-long-cay-5f4ef3047ce67/i.test(islandHtml),
    seaviewImage: /acklins-crooked-islands-seaview-beach-5f74d86279ea8/i.test(islandHtml),
  },
  nasaAcklins: signals(nasaAcklinsApiText, {id: /iss071e365062/i, acklins: /Acklins, an island in The Bahamas/i, barratt: /Mike Barratt/i, july2024: /July 18, 2024/i, sourceUrl: /iss071e365062\.jpg/i}),
  nasaBank: signals(nasaBankText, {id: /ISS043-E-120519/i, date: /2015\.04\.14/i, features: /CROOKED-ACKLINS BANK/i, dimensions: /3280 x 4928/i}),
  nasaTerms: signals(nasaTermsText, {credit: /Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center/i, noEndorsement: /may not be used to state or imply the endorsement by NASA/i, notCopyrighted: /NASA material is not protected by copyright unless noted/i}),
  wikimedia: signals(wikimediaText, {title: /Acklins and Crooked 15ft 4p572 shaded\.png/i, author: /Lithium6ion/i, publicDomain: /release this work into the public domain/i, created: /22 February 2012/i}),
}
if (Object.values(sourceSignals).flatMap((group) => Object.values(group)).some((value) => !value)) throw new Error(`Research-source signals changed: ${JSON.stringify(sourceSignals)}`)
if (externalImageStatuses.some((item) => !item.ok || !item.contentType?.startsWith('image/'))) throw new Error(`External image candidate changed: ${JSON.stringify(externalImageStatuses)}`)
for (const item of managedBuffers) {
  const checksum = crypto.createHash('sha256').update(item.buffer).digest('hex')
  if (checksum !== item.checksum) throw new Error(`Managed review image checksum changed for ${item.url}: ${checksum}`)
}
const managedBufferByUrl = new Map(managedBuffers.map((item) => [item.url, item.buffer]))

const webImagePath = path.join(workspaceRoot, 'bahabuddy-web/src/lib/islands.ts')
const webHeaderPath = path.join(workspaceRoot, 'bahabuddy-web/src/components/marketplace/MarketplacePublicHeader.tsx')
const mobileImagePath = path.join(workspaceRoot, 'Baha-Buddy-V2/lib/core/constants/baha_images.dart')
const publicCopySignals = {
  webLegacyImage: fs.readFileSync(webImagePath, 'utf8').includes(urls.legacyHero),
  mobileLegacyImage: fs.readFileSync(mobileImagePath, 'utf8').includes(urls.legacyHero),
  webSuitabilityCopy: /Bonefishing, solitude, and long quiet shorelines/i.test(fs.readFileSync(webHeaderPath, 'utf8')),
}
if (Object.values(publicCopySignals).some((value) => !value)) throw new Error(`Public-copy signals changed: ${JSON.stringify(publicCopySignals)}`)

const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web/.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')
const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified,description,short_description,primary_image_url,gallery_images&island_id=eq.acklins-crooked-island`, {headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`}})
if (!supabaseResponse.ok) throw new Error(`Supabase Acklins & Crooked Island read failed: ${supabaseResponse.status}`)
const supabaseRows = await supabaseResponse.json()
const supabaseById = new Map(supabaseRows.map((row) => [row.id, row]))

const live = await client.fetch(`{
  "sources": *[_id in $sourceIds]{...},
  "publishedPlaces": *[_id in $publishedPlaceIds]{...},
  "placeDrafts": *[_id in $placeIds]{...},
  "candidates": *[_id in $candidateIds]{...},
  "images": *[_id in $imageIds]{...},
  "facts": *[_id in $factIds]{...},
  "audit": *[_id == $auditId][0]{...},
  "destinationPublished": *[_id == $destinationId][0]{...},
  "destinationDraft": *[_id == $destinationDraftId][0]{...},
  "publishedFacts": count(*[_type == "islandFact" && !(_id in path("drafts.**"))]),
  "acklinsFactChannels": count(*[_type == "islandFact" && _id in path("drafts.**") && destination._ref == $destinationId && count(channels) > 0]),
  "publishedImageCandidates": count(*[_type == "imageCandidate" && !(_id in path("drafts.**"))])
}`, {
  sourceIds: Object.values(sourceIds), publishedPlaceIds: Object.values(publishedPlaceIds), placeIds: Object.values(placeIds),
  candidateIds: Object.values(candidateIds), imageIds: Object.values(imageIds), factIds: Object.values(factIds), auditId, destinationId, destinationDraftId,
})

const sourceById = new Map(live.sources.map((item) => [item._id, item]))
const publishedPlaceById = new Map(live.publishedPlaces.map((item) => [item._id, item]))
const placeById = new Map(live.placeDrafts.map((item) => [item._id, item]))
const candidateById = new Map(live.candidates.map((item) => [item._id, item]))
const imageById = new Map(live.images.map((item) => [item._id, item]))
const factById = new Map(live.facts.map((item) => [item._id, item]))
for (const id of [sourceIds.islandProfile, sourceIds.longCay, sourceIds.ferries, sourceIds.publicMap, sourceIds.ancientSites, sourceIds.turtleSound, sourceIds.mediaBoundary]) if (!sourceById.has(id)) throw new Error(`Missing source: ${id}`)
for (const id of Object.values(publishedPlaceIds)) if (!publishedPlaceById.has(id)) throw new Error(`Missing published place overlay: ${id}`)
for (const id of Object.values(candidateIds)) if (!candidateById.has(id)) throw new Error(`Missing candidate: ${id}`)
for (const id of Object.values(supabaseIds)) if (!supabaseById.has(id)) throw new Error(`Missing Supabase row: ${id}`)
if (!live.destinationPublished) throw new Error(`Missing destination: ${destinationId}`)
if (supabaseRows.length !== 11) throw new Error(`Expected 11 Acklins & Crooked Island Supabase rows, found ${supabaseRows.length}`)
if (live.destinationPublished.heroImage?.externalUrl !== urls.legacyHero) throw new Error(`Published destination hero changed: ${live.destinationPublished.heroImage?.externalUrl}`)

const destinationRef = reference(destinationId, 'destination-acklins-crooked-island')
const sourcePlans = []
function planSource(planned) {
  const current = sourceById.get(planned._id)
  sourcePlans.push({id: planned._id, current, planned, needsUpdate: differs(current, planned)})
}

const islandSource = stripMeta(sourceById.get(sourceIds.islandProfile))
planSource({
  ...islandSource,
  topics: [...new Set([...(islandSource.topics || []), 'media'])],
  checkedAt,
  nextReviewAt: nextOperationalReviewAt,
  status: 'needs_recheck',
  notes: 'Primary source for official island-group identity, named gateways, highlights, and image displays. It currently claims twice-daily and daily inter-island ferries without naming an accountable operator or schedule; the current Bahamas Ferries passenger page does not corroborate those routes. It also prints an implausible “1,000 square foot lagoon” value. Treat access, numerical, superlative, suitability, and media claims as review leads only.',
  reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'primary_source_scope_requires_review', attention: true, reviewScope: 'Recheck island-group identity, airport names, ferry wording, numerical Bight claims, highlights, suitability language, current image URLs, and any correction or accountable operator link.', nextAction: 'By 2026-09-04, reconcile the ferry claims with a responsible operator, resolve the Bight measurement, and obtain exact Brand Center asset records before reusing source images.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'media_rights_or_terms_change']}),
})

const ferrySource = stripMeta(sourceById.get(sourceIds.ferries))
planSource({...ferrySource, destinations: mergeReferences(ferrySource.destinations, [destinationId], 'destination'), checkedAt, nextReviewAt: nextOperationalReviewAt})

const mediaBoundarySource = stripMeta(sourceById.get(sourceIds.mediaBoundary))
planSource({...mediaBoundarySource, topics: [...new Set([...(mediaBoundarySource.topics || []), 'media'])], checkedAt, nextReviewAt: nextOperationalReviewAt})

planSource({
  _id: sourceIds.nasaAcklins2024, _type: 'researchSource', title: 'NASA image ISS071E365062 — Acklins from the International Space Station',
  url: urls.nasaAcklinsPage, publisher: 'National Aeronautics and Space Administration', sourceClass: 'government', authorityLevel: 'primary',
  destinations: [destinationRef], topics: ['overview', 'nature', 'media'], checkedAt, nextReviewAt: nextStableReviewAt, status: 'active',
  notes: 'NASA’s image record identifies Acklins, names astronaut Mike Barratt, dates the photograph July 18, 2024, and supplies an 8256×5504 original. This confirms image subject and provenance only; it does not describe current roads, beaches, facilities, access, safety, or traveler conditions.',
  reviewPlan: reviewPlan({cadenceDays: 365, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck the exact image record, caption, creator attribution, source URL, dimensions, and any copyright or third-party notice.', nextAction: 'Retain the photo ID and NASA/JSC credit with every use; keep editorial crop, current-condition, non-endorsement, and placement review separate.', triggers: ['publisher_url_or_scope_change', 'media_rights_or_terms_change']}),
})

planSource({
  _id: sourceIds.nasaBank2015, _type: 'researchSource', title: 'NASA image ISS043-E-120519 — Crooked-Acklins Bank shoals and cays',
  url: urls.nasaBankPage, publisher: 'Earth Science and Remote Sensing Unit, NASA Johnson Space Center', sourceClass: 'government', authorityLevel: 'primary',
  destinations: [destinationRef], topics: ['overview', 'nature', 'media'], checkedAt, nextReviewAt: nextStableReviewAt, status: 'active',
  notes: 'The NASA/JSC record identifies photo ISS043-E-120519, dated April 14, 2015, with features Crooked-Acklins Bank, shoals, channels, cays, North Cay, and Fish Cay. It is useful for geographic context only and must not imply current access, facilities, hazards, or conditions.',
  reviewPlan: reviewPlan({cadenceDays: 365, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck photo ID, date, feature metadata, source URL, dimensions, and any copyright or third-party notice.', nextAction: 'Retain the photo ID and NASA/JSC credit with every use; keep crop, identity framing, current-condition, and placement review separate.', triggers: ['publisher_url_or_scope_change', 'media_rights_or_terms_change']}),
})

planSource({
  _id: sourceIds.nasaTerms, _type: 'researchSource', title: 'NASA/JSC astronaut photography — conditions of use and required credit',
  url: urls.nasaTerms, publisher: 'Earth Science and Remote Sensing Unit, NASA Johnson Space Center', sourceClass: 'government', authorityLevel: 'primary',
  destinations: [destinationRef], topics: ['media'], checkedAt, nextReviewAt: nextMediaPolicyReviewAt, status: 'active',
  notes: 'The source states that NASA materials are generally not copyrighted unless noted, permits reproduction and distribution of non-copyrighted material without further NASA permission, requires NASA acknowledgment, requests the exact JSC credit, recommends the photo number and source site, prohibits implied endorsement, and flags third-party copyright and recognizable-person rights. Each selected image still needs its own record-level copyright check.',
  reviewPlan: reviewPlan({cadenceDays: 180, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck NASA/JSC conditions of use, required credit wording, non-endorsement language, third-party copyright caveats, recognizable-person rules, and any asset-level exception.', nextAction: 'Before each content use, confirm the exact asset has no contrary notice and carry forward the requested credit, photo ID, source URL, and non-endorsement boundary.', triggers: ['publisher_url_or_scope_change', 'media_rights_or_terms_change']}),
})

planSource({
  _id: sourceIds.wikimediaMap, _type: 'researchSource', title: 'Wikimedia Commons file — Acklins and Crooked topographic map',
  url: urls.wikimediaPage, publisher: 'Wikimedia Commons / Lithium6ion', sourceClass: 'independent_editorial', authorityLevel: 'corroborating',
  destinations: [destinationRef], topics: ['overview', 'media'], checkedAt, nextReviewAt: nextStableReviewAt, status: 'active',
  notes: 'The Commons file record identifies creator Lithium6ion, creation date February 22, 2012, SRTM3 elevation-data basis, approximately 90-metre resolution, and a public-domain dedication by the copyright holder. It is a self-published contextual map, not official routing, boundary, access, hazard, or current-condition evidence.',
  reviewPlan: reviewPlan({cadenceDays: 365, relationship: 'corroborating_source', reviewScope: 'Recheck the exact file, public-domain statement, creator, source data, resolution, dimensions, and file history for any deletion, replacement, or dispute.', nextAction: 'Use only as contextual editorial artwork with creator and source credit; do not treat the shape, elevation colors, or coastline as navigation or safety guidance.', method: 'dataset_review', triggers: ['publisher_url_or_scope_change', 'media_rights_or_terms_change']}),
})

function imageCandidate({id, title, subjectLabel, subjectType, identityStatus, identityIds, identityNotes, imageUrl, sourceAssetId, sourceAssetUrl, sourcePageUrl, intendedUses, captureDate, width, height, checksumSha256, creator, rightsHolder, rightsStatus, licenseName, licenseUrl, requiredCredit, displayCredit = requiredCredit, usageRestrictions, rightsIds, currentConditionBoundary, altTextDraft, altTextStatus, reviewStatus, reviewNotes, caption, managedAssetKey}) {
  const current = imageById.get(id)
  const currentAsset = current?.reviewImage?.asset?._ref
  const reviewImage = {
    _type: 'contentImage', externalUrl: imageUrl, caption, credit: displayCredit, sourceUrl: sourcePageUrl,
    ...(altTextDraft ? {alt: altTextDraft} : {}),
    ...(currentAsset ? {asset: {_type: 'reference', _ref: currentAsset}} : {}),
  }
  return {
    _id: id, _type: 'imageCandidate', title, destination: destinationRef, subjectLabel, subjectType, identityStatus,
    identityEvidence: references(identityIds, 'identity-source'), identityNotes, reviewImage, sourceAssetId, sourceAssetUrl, sourcePageUrl,
    intendedUses, captureDate, width, height, checksumSha256, creator, rightsHolder, rightsStatus, licenseName, licenseUrl,
    requiredCredit, usageRestrictions, rightsEvidence: references(rightsIds, 'rights-source'), currentConditionBoundary,
    altTextDraft, altTextStatus, reviewStatus, approvalStatus: 'research_only', checkedAt,
    nextReviewAt: rightsStatus === 'public_domain_or_government_reuse_terms' || rightsStatus === 'documented_open_license' ? nextMediaPolicyReviewAt : nextOperationalReviewAt,
    reviewNotes, managedAssetKey,
  }
}

const imageDocuments = [
  imageCandidate({
    id: imageIds.nasaAcklins2024, title: 'Acklins from the ISS — NASA ISS071E365062', subjectLabel: 'Acklins Island', subjectType: 'destination_geography',
    identityStatus: 'responsible_source_confirmed', identityIds: [sourceIds.nasaAcklins2024],
    identityNotes: 'NASA’s record explicitly identifies Acklins and the exact photo number. Visual review confirms a narrow dark island landmass between turquoise shallows and deep-blue ocean; orientation and exact settlements are not labeled in the image.',
    imageUrl: urls.nasaAcklinsReview, sourceAssetId: 'ISS071E365062', sourceAssetUrl: urls.nasaAcklinsOriginal, sourcePageUrl: urls.nasaAcklinsPage,
    intendedUses: ['destination_hero', 'destination_gallery', 'map_context', 'editorial_article'], captureDate: '2024-07-18', width: 2000, height: 1333,
    checksumSha256: managedAssetDefinitions.nasaAcklins2024.checksum, creator: 'NASA astronaut Mike Barratt', rightsHolder: 'National Aeronautics and Space Administration',
    rightsStatus: 'public_domain_or_government_reuse_terms', licenseName: 'NASA/JSC astronaut photography conditions of use', licenseUrl: urls.nasaTerms,
    requiredCredit: 'Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center. Photo ISS071E365062; eol.jsc.nasa.gov.',
    displayCredit: 'Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center',
    usageRestrictions: 'Do not state or imply NASA endorsement. Recheck the exact asset for any contrary copyright notice. Retain NASA/JSC acknowledgment, photo ID, and source URL. No recognizable person appears in the image.',
    rightsIds: [sourceIds.nasaAcklins2024, sourceIds.nasaTerms],
    currentConditionBoundary: 'Captured July 18, 2024. The image supports geographic identity and visual context only; it must not imply current roads, beaches, facilities, services, access, safety, water depth, or traveler conditions.',
    altTextDraft: 'Oblique astronaut photograph of Acklins Island between turquoise shallows and deep-blue ocean, taken from the International Space Station in July 2024.',
    altTextStatus: 'draft_unreviewed', reviewStatus: 'ready_for_editorial_review',
    reviewNotes: 'Managed review copy may be cropped only after editorial review confirms the destination fit, focal area, contrast, mobile safe area, credit placement, and non-endorsement boundary. Approval and attachment to a destination remain separate actions.',
    caption: 'Acklins photographed from the International Space Station on July 18, 2024. NASA photo ISS071E365062.', managedAssetKey: 'nasaAcklins2024',
  }),
  imageCandidate({
    id: imageIds.nasaBank2015, title: 'Crooked-Acklins Bank shoals and cays — NASA ISS043-E-120519', subjectLabel: 'Crooked-Acklins Bank, shoals, channels, North Cay and Fish Cay', subjectType: 'destination_geography',
    identityStatus: 'responsible_source_confirmed', identityIds: [sourceIds.nasaBank2015],
    identityNotes: 'NASA/JSC metadata explicitly names the Crooked-Acklins Bank, shoals, channels, cays, North Cay, and Fish Cay. The image is not a point for Crooked Island, Acklins, Long Cay, Turtle Sound, or a route.',
    imageUrl: urls.nasaBankOriginal, sourceAssetId: 'ISS043-E-120519', sourceAssetUrl: urls.nasaBankOriginal, sourcePageUrl: urls.nasaBankPage,
    intendedUses: ['destination_gallery', 'map_context', 'editorial_article'], captureDate: '2015-04-14', width: 3280, height: 4928,
    checksumSha256: managedAssetDefinitions.nasaBank2015.checksum, creator: 'International Space Station crew', rightsHolder: 'National Aeronautics and Space Administration',
    rightsStatus: 'public_domain_or_government_reuse_terms', licenseName: 'NASA/JSC astronaut photography conditions of use', licenseUrl: urls.nasaTerms,
    requiredCredit: 'Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center. Photo ISS043-E-120519; eol.jsc.nasa.gov.',
    displayCredit: 'Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center',
    usageRestrictions: 'Do not state or imply NASA endorsement. Recheck the exact asset for any contrary copyright notice. Retain NASA/JSC acknowledgment, photo ID, and source URL. No recognizable person appears in the image.',
    rightsIds: [sourceIds.nasaBank2015, sourceIds.nasaTerms],
    currentConditionBoundary: 'Captured April 14, 2015. It supports broad bank-and-shoal context only and cannot establish current channels, navigation, water depth, access, safety, facilities, or traveler conditions.',
    altTextDraft: 'Astronaut photograph of small cays, pale sandbars, turquoise shoals, and deep-blue water on the Crooked-Acklins Bank in April 2015.',
    altTextStatus: 'draft_unreviewed', reviewStatus: 'ready_for_editorial_review',
    reviewNotes: 'Use only as geographic context. Editorial review must confirm the crop, subject label, portrait treatment, credit placement, current-condition boundary, and that it is not presented as navigational imagery.',
    caption: 'Crooked-Acklins Bank shoals and cays photographed from the International Space Station on April 14, 2015. NASA photo ISS043-E-120519.', managedAssetKey: 'nasaBank2015',
  }),
  imageCandidate({
    id: imageIds.wikimediaMap, title: 'Acklins, Crooked Island and Long Cay topographic map — public domain', subjectLabel: 'Acklins, Crooked Island, Long Cay, and nearby cays', subjectType: 'map_diagram',
    identityStatus: 'creator_metadata_confirmed', identityIds: [sourceIds.wikimediaMap],
    identityNotes: 'The creator’s file record identifies the islands and describes 15-foot contour intervals derived from SRTM3 data at approximately 90-metre resolution. It is contextual artwork, not an official boundary or navigation chart.',
    imageUrl: urls.wikimediaOriginal, sourceAssetId: 'File:Acklins and Crooked 15ft 4p572 shaded.png', sourceAssetUrl: urls.wikimediaOriginal, sourcePageUrl: urls.wikimediaPage,
    intendedUses: ['map_context', 'editorial_article'], captureDate: '2012-02-22', width: 1918, height: 1490,
    checksumSha256: managedAssetDefinitions.wikimediaMap.checksum, creator: 'Lithium6ion', rightsHolder: 'Lithium6ion',
    rightsStatus: 'public_domain_or_government_reuse_terms', licenseName: 'Public-domain dedication by copyright holder', licenseUrl: urls.wikimediaPage,
    requiredCredit: 'Map by Lithium6ion, via Wikimedia Commons. Public domain.',
    usageRestrictions: 'Use only as a contextual topographic illustration. Do not use for navigation, routing, legal boundaries, property limits, hazard guidance, or current coastline/elevation precision. Preserve the color key when the map is displayed.',
    rightsIds: [sourceIds.wikimediaMap],
    currentConditionBoundary: 'Created in 2012 from SRTM3 elevation data at approximately 90-metre resolution. It does not represent current roads, facilities, shoreline conditions, access, hazards, or services.',
    altTextDraft: 'Color-coded topographic map of Acklins, Crooked Island, Long Cay, and nearby cays using 15-foot elevation intervals.',
    altTextStatus: 'draft_unreviewed', reviewStatus: 'ready_for_editorial_review',
    reviewNotes: 'Managed review asset is suitable only for editorial geography context after checking legibility, color-key inclusion, creator/source credit, and a visible not-for-navigation caveat.',
    caption: 'Public-domain topographic map of Acklins, Crooked Island, Long Cay, and nearby cays, created by Lithium6ion from SRTM3 data.', managedAssetKey: 'wikimediaMap',
  }),
  imageCandidate({
    id: imageIds.bmotHero, title: 'Current BMOT Acklins & Crooked page hero — rights review', subjectLabel: 'Acklins & Crooked Island tourism-page hero; exact location not identified', subjectType: 'unknown_mixed',
    identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile],
    identityNotes: 'The current official destination page displays this exact asset as its hero and labels the visible scene only as a small speedboat in water with plants in the foreground. The page does not identify the exact island, shoreline, people, operator, or capture date.',
    imageUrl: urls.bmotHero, sourceAssetId: 'bmot-acklins-crooked-mainsite-hero-image-5f4ee38a7713b', sourceAssetUrl: urls.bmotHero, sourcePageUrl: urls.islandProfile,
    intendedUses: ['destination_hero', 'destination_gallery'], creator: 'Not identified on the public page', rightsHolder: 'Bahamas Ministry of Tourism, Investments & Aviation / controlled Brand Center to be confirmed',
    rightsStatus: 'controlled_library_asset_license_required', licenseName: 'Exact Brand Center asset license not yet recorded',
    requiredCredit: 'Do not use until the exact controlled-library asset record supplies the required credit.',
    usageRestrictions: 'Public display on Bahamas.com is not blanket reuse permission. Do not copy or attach this file until the exact Brand Center asset, license, permitted channels, geography/time limits, alterations, and credit are recorded.',
    rightsIds: [sourceIds.islandProfile, sourceIds.mediaBoundary],
    currentConditionBoundary: 'The public page provides no capture date or exact location. Even after rights clearance, confirm the subject, date, current relevance, crop, people/property permissions, and whether the scene represents the destination responsibly.',
    altTextStatus: 'no_exact_image', reviewStatus: 'rights_review',
    reviewNotes: 'Retain as an external-only candidate. Locate the exact asset in the BMOTIA Brand Center and record its asset ID, photographer, license, required credit, usage limits, and current subject identity before download or editorial selection.',
    caption: 'Current Bahamas.com destination-page hero; exact location, creator, date, and reuse license pending.',
  }),
  imageCandidate({
    id: imageIds.bmotLongCay, title: 'BMOT Long Cay feature image — rights review', subjectLabel: 'Long Cay feature display; exact shoreline and date not identified', subjectType: 'community',
    identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile, sourceIds.longCay],
    identityNotes: 'The current official Acklins & Crooked Island page displays the exact asset alongside its Long Cay feature. The source alt text describes an ocean-and-rock composite but does not identify the exact locations, direction, creator, or capture date.',
    imageUrl: urls.bmotLongCay, sourceAssetId: 'bmot-acklins-crooked-mainsite-island-insider-petals-images-sleepy-long-cay-5f4ef3047ce67', sourceAssetUrl: urls.bmotLongCay, sourcePageUrl: urls.islandProfile,
    intendedUses: ['destination_gallery', 'editorial_article'], creator: 'Not identified on the public page', rightsHolder: 'Bahamas Ministry of Tourism, Investments & Aviation / controlled Brand Center to be confirmed',
    rightsStatus: 'controlled_library_asset_license_required', licenseName: 'Exact Brand Center asset license not yet recorded',
    requiredCredit: 'Do not use until the exact controlled-library asset record supplies the required credit.',
    usageRestrictions: 'Do not copy or attach from the public page. Obtain the exact Brand Center asset record and confirm whether the composite may be cropped, separated, overlaid, or used in web/mobile promotion.',
    rightsIds: [sourceIds.islandProfile, sourceIds.mediaBoundary],
    currentConditionBoundary: 'No capture date is published. The image cannot establish current ferry service, docks, population, access, facilities, safety, accessibility, or conditions on Long Cay.',
    altTextStatus: 'no_exact_image', reviewStatus: 'rights_review',
    reviewNotes: 'External-only candidate. Confirm exact component identities and rights in the controlled library before download; write factual alt text only after the approved final composite or crop is selected.',
    caption: 'Current Bahamas.com Long Cay feature display; exact component identities, creator, date, and reuse license pending.',
  }),
  imageCandidate({
    id: imageIds.bmotSeaview, title: 'BMOT Seaview Beach display — rights review', subjectLabel: 'Seaview Beach, Crooked Island; source-page label only', subjectType: 'place',
    identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile],
    identityNotes: 'The current official island page labels this exact asset “acklins crooked islands seaview beach” inside its Crooked Island section. No exact beach boundary, capture date, creator, or responsible-site metadata is supplied.',
    imageUrl: urls.bmotSeaview, sourceAssetId: 'acklins-crooked-islands-seaview-beach-5f74d86279ea8', sourceAssetUrl: urls.bmotSeaview, sourcePageUrl: urls.islandProfile,
    intendedUses: ['destination_gallery', 'place_hero', 'place_gallery'], creator: 'Not identified on the public page', rightsHolder: 'Bahamas Ministry of Tourism, Investments & Aviation / controlled Brand Center to be confirmed',
    rightsStatus: 'controlled_library_asset_license_required', licenseName: 'Exact Brand Center asset license not yet recorded',
    requiredCredit: 'Do not use until the exact controlled-library asset record supplies the required credit.',
    usageRestrictions: 'Do not copy or attach from the public page. Obtain the exact Brand Center asset record, identity confirmation, license, permitted channels, alteration rules, and required credit.',
    rightsIds: [sourceIds.islandProfile, sourceIds.mediaBoundary],
    currentConditionBoundary: 'No capture date is published. The asset cannot establish current beach access, shoreline conditions, water safety, services, accessibility, ownership, or traveler suitability.',
    altTextStatus: 'no_exact_image', reviewStatus: 'rights_review',
    reviewNotes: 'External-only candidate. Confirm the exact beach, current subject identity, and controlled-library terms before download. A separate canonical-place and access review is required before any place-level use.',
    caption: 'Current Bahamas.com image labeled Seaview Beach; exact creator, date, place boundary, and reuse license pending.',
  }),
  imageCandidate({
    id: imageIds.legacyHero, title: 'Legacy Baha Buddy Acklins & Crooked hero — source and rights unresolved', subjectLabel: 'Acklins & Crooked Island legacy hero; exact subject unverified', subjectType: 'unknown_mixed',
    identityStatus: 'unverified', identityIds: [sourceIds.islandProfile],
    identityNotes: 'This exact tourism-CDN URL is referenced by the published Sanity destination and hardcoded web/mobile image maps, and it currently responds successfully. The exact asset is not present in the reviewed current destination-page HTML, so its subject, creator, capture date, source record, and current editorial status are unresolved.',
    imageUrl: urls.legacyHero, sourceAssetId: 'bmot-acklins-crooked-island-islands-img-6577398613c5c', sourceAssetUrl: urls.legacyHero, sourcePageUrl: urls.islandProfile,
    intendedUses: ['destination_hero'], creator: 'Not identified', rightsHolder: 'Bahamas Ministry of Tourism, Investments & Aviation / controlled Brand Center to be confirmed',
    rightsStatus: 'controlled_library_asset_license_required', licenseName: 'Exact Brand Center asset license not yet recorded',
    requiredCredit: 'Do not continue or expand use until the exact controlled-library asset record supplies the required credit.',
    usageRestrictions: 'Existing URL availability is not proof of reuse rights. Do not copy, upload, crop, or extend this image to additional surfaces until the exact Brand Center record, subject identity, license, channels, alteration terms, and credit are documented.',
    rightsIds: [sourceIds.mediaBoundary],
    currentConditionBoundary: 'The CDN reports a December 2023 last-modified date but no capture date or current destination context. Do not treat the image as evidence of current place, access, facilities, safety, or traveler conditions.',
    altTextStatus: 'no_exact_image', reviewStatus: 'rights_review',
    reviewNotes: 'P0 live-media review: replace or formally clear this currently referenced hero through a separate approved release. This candidate record does not change the published destination or hardcoded web/mobile references.',
    caption: 'Legacy Baha Buddy destination hero; exact source record, subject, creator, date, and reuse license unresolved.',
  }),
]

const imagePlans = imageDocuments.map((planned) => {
  const {managedAssetKey, ...document} = planned
  const current = imageById.get(document._id)
  return {id: document._id, current, planned: document, managedAssetKey, needsAssetUpload: Boolean(managedAssetKey && !document.reviewImage?.asset?._ref), needsUpdate: differs(current, document)}
})

const placePlans = Object.entries(supabaseIds).map(([key, supabaseId]) => {
  const row = supabaseById.get(supabaseId)
  const id = placeIds[key]
  const existing = placeById.get(id)
  const published = publishedPlaceById.get(publishedPlaceIds[key])
  const planned = {...stripMeta(existing || published), _id: id, _type: 'placeEditorial'}
  planned.destination = destinationRef
  planned.islandName = 'Acklins & Crooked Island'
  planned.active = false
  planned.featured = false
  planned.channels = []
  delete planned.primaryImage
  planned.gallery = []
  planned.reviewedAt = checkedAt
  planned.source = planned.source || {_type: 'contentSource', system: 'supabase', table: 'places', recordId: row.id, ownership: 'editorial_overlay', importedAt: new Date().toISOString()}
  planned.evidenceSources = mergeReferences(planned.evidenceSources, [sourceIds.islandProfile], 'catalog-evidence')

  const foreign = foreignCatalogKeys.has(key)
  const isArea = ['bight', 'genericCrooked'].includes(key)
  planned.catalogReviewStatus = foreign ? 'island_assignment_conflict' : ['bight', 'ivels', 'genericCrooked'].includes(key) ? 'location_blocked' : 'exact_candidate'
  const coordinateText = row.latitude == null || row.longitude == null ? 'missing coordinates' : `${row.latitude}, ${row.longitude}`
  planned.catalogReviewNotes = foreign
    ? `Supabase row ${row.id} is an active, unverified foreign-name collision at ${row.address || 'an external address'} (${coordinateText}). It has no useful description or media. Preserve it for data-operator review; do not merge, geocode, activate, publish, recommend, or delete it in this editorial batch.`
    : `Supabase row ${row.id} remains unverified with ${coordinateText}, no useful description, and no media. Preserve the exact row for evidence review. Current identity, location model, operation, access, safety, accessibility, rights-cleared place media, and traveler copy must be resolved before any delivery.`

  if (key !== 'ivels' || !planned.catalogLocationReview) {
    planned.catalogLocationReview = {
      _type: 'placeLocationReview', checkedAt,
      reconciliationStatus: isArea ? 'area_identity_no_point' : 'identity_without_point',
      evidenceSources: [reference(sourceIds.islandProfile, 'location-source')], locationConfidence: 'low',
      operationEvidenceStatus: isArea ? 'not_applicable_natural_feature' : 'not_established', accessEvidenceStatus: 'unresolved',
      reviewDecision: foreign || isArea ? 'not_applicable' : 'pending',
      notes: foreign
        ? `The Supabase coordinate is outside the Acklins & Crooked Island group and is not retained as a location candidate. Reject automatic reconciliation; verify and correct the source island assignment through a separate data-operator workflow.`
        : isArea
          ? `${row.name} is an area or island identity, not a universal entrance or routing point. No canonical point is proposed by this review.`
          : `No current responsible-source point is accepted. The Supabase coordinate is catalog evidence only and is not promoted to a verified entrance, route, or canonical point.`,
    }
  }
  const reviewIds = key === 'ivels' ? [sourceIds.islandProfile, 'research-source-operator-ivels', 'research-source-operator-ivels-cloudbeds'] : [sourceIds.islandProfile]
  planned.catalogTravelerReadinessReview = travelerReview({
    ids: reviewIds,
    responsible: key === 'ivels' ? 'current_responsible_operator' : foreign ? 'source_conflict' : 'unresolved',
    operation: key === 'ivels' ? 'current_responsible_operation' : isArea ? 'not_applicable_identity' : foreign ? 'source_conflict' : 'unresolved',
    access: foreign ? 'source_conflict' : 'unresolved',
    copy: foreign ? 'blocked_by_source_conflict' : 'needs_responsible_review',
    notes: foreign
      ? 'The row conflicts with its assigned destination and cannot be delivered. Resolve the canonical source record before any place or media research.'
      : 'Identity or catalog presence does not establish a complete traveler plan. Verify the responsible source, operation, route, restrictions, safety, accessibility, place-level media rights, and fallback before delivery.',
  })
  planned.catalogContentReadinessReview = contentReview({ids: reviewIds, notes: 'No exact place-level image has documented reusable rights and reviewed alt text. Destination-level NASA and map candidates cannot substitute for the identity, access, operation, safety, accessibility, and media evidence required for this exact place.'})
  return {id, current: existing, planned, needsUpdate: differs(existing, planned)}
})

const longCayCurrent = stripMeta(candidateById.get(candidateIds.longCay))
const longCayPlanned = {
  ...longCayCurrent,
  locationReview: {
    ...longCayCurrent.locationReview,
    checkedAt,
    reconciliationStatus: 'area_identity_no_point',
    reviewDecision: 'not_applicable',
    locationConfidence: 'low',
    notes: 'Long Cay is an island, settlement, and community identity. The official tourism marker is preserved as contextual evidence only; it is not a dock, public building, entrance, ferry landing, safe route, or universal canonical point. No point is approved, and ferry claims remain unresolved without a responsible operator.',
  },
  reviewedAt: checkedAt,
  reviewNotes: 'Use an area/community model. Confirm current responsible ferry or vessel access, exact docks, schedule, passenger permission, assistance, weather limits, luggage, emergency response, and fallback before any traveler delivery. The source-page image remains external-only until its exact Brand Center license is recorded.',
}
const candidatePlans = Object.values(candidateIds).map((id) => {
  const current = candidateById.get(id)
  const planned = id === candidateIds.longCay ? longCayPlanned : stripMeta(current)
  return {id, current, planned, needsUpdate: differs(current, planned)}
})

const factDocuments = [
  fact({
    id: factIds.media, title: 'Acklins & Crooked Island: image identity and rights boundary', topic: 'overview',
    claim: 'The published Sanity destination and hardcoded web/mobile maps reference the same Bahamas-tourism CDN hero, but the exact asset record, subject, creator, capture date, and reuse terms are not recorded. Three exact geography candidates have documented NASA or public-domain reuse terms and managed review copies; three current tourism-page displays and the legacy hero remain external-only pending exact Brand Center asset licenses.',
    guidance: 'Do not expand use of the legacy hero or copy public-page imagery. Editors may review the managed NASA and public-domain geography assets, required credits, current-condition boundaries, and alt-text drafts, then make a separate content approval and placement decision.',
    ids: [sourceIds.islandProfile, sourceIds.mediaBoundary, sourceIds.nasaAcklins2024, sourceIds.nasaBank2015, sourceIds.nasaTerms, sourceIds.wikimediaMap],
  }),
  fact({
    id: factIds.transport, title: 'Acklins & Crooked Island: ferry claims require responsible-operator reconciliation', topic: 'access',
    claim: 'The current national-tourism page says Crooked Island is reachable by twice-daily ferries from Acklins and Long Cay by a daily ferry, but it does not name an accountable vessel, operator, timetable, dock, passenger terms, accessibility assistance, or disruption fallback. The reviewed current Bahamas Ferries passenger page does not publish those routes.',
    guidance: 'Treat these ferry statements as leads only. Before planning travel, verify the responsible operator, exact origin and destination docks, date-specific schedule, passenger permission, luggage, accessibility, weather limits, connection protection, emergency communications, and fallback.',
    ids: [sourceIds.islandProfile, sourceIds.longCay, sourceIds.ferries], confidence: 'high', volatility: 'operational',
  }),
  fact({
    id: factIds.publicCopy, title: 'Acklins & Crooked Island: public-copy evidence boundary', topic: 'overview',
    claim: 'The official page supports the grouped identity of Acklins, Crooked Island, Long Cay, and the Bight of Acklins, plus named airport gateways and highlighted place identities. It does not responsibly support Baha Buddy’s current broad suitability and superlative language, and its printed “1,000 square foot lagoon” value is implausible and must not be repeated without correction.',
    guidance: 'Use exact identity and gateway names only as an editorial foundation. Keep bonefishing quality, birdwatching, untouched or pristine conditions, solitude, best-for claims, route frequency, numerical size, place access, safety, accessibility, and media as separately verified fields.',
    ids: [sourceIds.islandProfile, sourceIds.longCay, sourceIds.ancientSites, sourceIds.turtleSound, sourceIds.ferries], confidence: 'high', volatility: 'operational',
  }),
]
const factPlans = factDocuments.map((planned) => ({id: planned._id, current: factById.get(planned._id), planned, needsUpdate: differs(factById.get(planned._id), planned)}))

const coverage = [
  ['overview', 2, 'Official island-group identity and named gateways are strong, but public superlatives, suitability, numerical Bight copy, and legacy hero provenance remain blocked.'],
  ['access', 1, 'Named airports exist; daily and twice-daily ferry claims lack accountable operator reconciliation and complete passenger details.'],
  ['stays', 1, 'Directory and operator leads exist, but no property has passed canonical, coordinate, operation, copy, media, safety, accessibility, and verification gates.'],
  ['food', 1, 'Official food themes exist, while active foreign restaurant collisions and no verified local canonical restaurant prevent delivery.'],
  ['experiences', 1, 'Official themes and signature identities exist, but provider, route, conditions, safety, rules, and accessibility remain incomplete.'],
  ['nature', 1, 'Bight and Turtle Sound identities plus imagery exist, while geometry, numerical claims, access, conditions, wildlife rules, and safety remain unresolved.'],
  ['culture', 1, 'Distributed Lucayan-site and Long Cay heritage identities exist, but responsible authority, exact components, protection, disclosure, access, and photography rules remain open.'],
  ['seasonality', 1, 'National climate baselines exist but do not resolve date-specific marine and aviation disruptions for the three-island group.'],
  ['safety', 1, 'National and dated facility baselines exist, but current island-specific response, clinic, shelter, marine, aviation, communications, and evacuation readiness remain open.'],
  ['accessibility', 0, 'No complete responsible feature-, route-, property-, vessel-, or airport-level accessibility package exists for traveler delivery.'],
].map(([topic, score, finding], index) => ({_type: 'researchCoverageScore', _key: `coverage-${index + 1}-${topic}`, topic, score, evidenceCount: 0, finding}))

const gaps = [
  ['Published and hardcoded destination hero lacks an asset-specific reuse record', 'overview', 'p0', 'Locate the exact BMOTIA Brand Center asset or replace it through a separately approved content release. Record subject, creator, capture date, license, channels, alteration terms, credit, and alt text before use.'],
  ['Tourism ferry frequency claims lack responsible-operator reconciliation', 'access', 'p0', 'Confirm the exact operator, vessel, docks, timetable, passenger terms, accessibility, weather limits, communications, connection protection, and fallback; do not plan from tourism copy alone.'],
  ['Five active Supabase rows are foreign place-name collisions', 'places', 'p0', 'Data-operator review must quarantine or correct the two Crooked Hammock Brewery rows, Crooked Island Beach, The Crooked Spoon, and The Crooked Post without automatic merging or deletion.'],
  ['Long Cay requires an area/community model rather than a universal routing point', 'places', 'p0', 'Keep the official marker as contextual evidence only and confirm exact docks, settlement purpose, access, safety, accessibility, and responsible local routing before any point use.'],
  ['Turtle Sound official map longitude is invalid', 'places', 'p0', 'Reject the positive-longitude point; verify waterway geometry, launch or landing locations, vessel or guide, tides and depth, rules, weather, emergency communications, accessibility, and safe route.'],
  ['Ancient Lucayan Sites require protected-site authority and disclosure rules', 'culture', 'p0', 'Confirm the responsible heritage authority, exact site identities, protection and disclosure rules, landowner permission, access, guide requirements, safety, accessibility, photography, and whether any location should be public.'],
  ['The Bight numerical and delivery model remains unresolved', 'nature', 'p0', 'Do not repeat the current 1,000-square-foot text. Verify the intended measurement and use an area model with responsible access, water conditions, safety, wildlife/fishing rules, accessibility, and emergency boundaries.'],
  ['No Acklins & Crooked canonical place is verified for delivery', 'places', 'p0', 'Resolve each exact identity, destination assignment, duplicate, coordinate model, current operation, access, copy, place-level media rights, safety, accessibility, and verification before enabling any channel.'],
  ['Tourism image candidates need exact controlled-library licenses', 'media', 'p1', 'Find the current page hero, Long Cay display, Seaview Beach display, and legacy Baha Buddy hero in the BMOTIA Brand Center; record asset IDs, rights, credits, channels, alterations, and identity before download.'],
  ['Rights-safe geography images need editorial placement review', 'media', 'p1', 'Review the managed NASA and public-domain map assets for crop, mobile safe area, factual framing, freshness boundary, credit placement, color contrast, alt text, and destination fit before a separate content change.'],
  ['Rights-safe image coverage does not yet extend to exact stays, food, access, or activities', 'media', 'p1', 'Research exact operator-owned, directly permitted, controlled-library, government-reuse, or open-license images for every approved place; do not substitute broad geography images for place identity.'],
].map(([title, topic, priority, action], index) => ({_type: 'researchGap', _key: `gap-${index + 1}`, title, topic, priority, action, status: 'researching'}))

const auditDocument = {
  _id: auditId, _type: 'islandResearchAudit', title: 'Acklins & Crooked Island evidence, catalog, copy and image review — 2026-08-05',
  destination: destinationRef, auditedAt: checkedAt, nextAuditAt: nextOperationalReviewAt, owner: 'Baha Buddy Content Operations', status: 'researching',
  overallScore: 1, coverage, gaps,
  sources: references([sourceIds.islandProfile, sourceIds.longCay, sourceIds.ferries, sourceIds.publicMap, sourceIds.ancientSites, sourceIds.turtleSound, sourceIds.mediaBoundary, sourceIds.nasaAcklins2024, sourceIds.nasaBank2015, sourceIds.nasaTerms, sourceIds.wikimediaMap], 'source'),
  methodologyNotes: 'This bounded review directly profiles current Supabase rows, raw-perspective Sanity, hardcoded web/mobile copy and image maps, the current national-tourism page, the current passenger-operator page, NASA/JSC image and rights records, and a Commons file record. It records exact image URLs, identity, rights status, credit, intended use, current-condition boundaries, and review-only alt text. It uploads only three images with documented government/public-domain reuse terms. It does not mutate Supabase, publish content, accept a coordinate, enable a channel, copy uncleared tourism imagery, contact an external party, approve a provider, route, schedule, operation, accessibility claim, or traveler delivery.',
}
const auditPlan = {id: auditId, current: live.audit, planned: auditDocument, needsUpdate: differs(live.audit, auditDocument)}

const destinationDraft = {
  _id: destinationDraftId, _type: 'destination', name: 'Acklins & Crooked Island', slug: {_type: 'slug', current: 'acklins-crooked-island'}, islandId: 'acklins-crooked-island',
  routeAliases: live.destinationPublished.routeAliases || [],
  tagline: 'Acklins, Crooked Island, Long Cay, and the shallow Bight of Acklins.',
  overview: [
    block('acklins-overview-1', 'Acklins, Crooked Island, and Long Cay form a multi-island group around the Bight of Acklins. Each island, community, airport, waterway, archaeological identity, and traveler route must stay distinct in planning and emergency guidance.'),
    block('acklins-overview-2', 'The Bight of Acklins, Long Cay, Turtle Sound, and Ancient Lucayan Sites are evidence-backed planning identities, but their exact visitor use, responsible access, safe routing, protection rules, accessibility, current conditions, and place-level media still require review.'),
  ],
  highlights: [
    {_type: 'destinationHighlight', _key: 'highlight-bight', label: 'The Bight of Acklins', description: 'Shallow-water area identity; verify measurement, intended use, access, conditions, rules, safety, accessibility, and emergency plan.'},
    {_type: 'destinationHighlight', _key: 'highlight-long-cay', label: 'Long Cay', description: 'Island and community identity; verify the responsible vessel, exact docks, schedule, passenger terms, assistance, weather, and fallback.'},
    {_type: 'destinationHighlight', _key: 'highlight-turtle-sound', label: 'Turtle Sound', description: 'Natural waterway identity; the official map point is invalid and no route, launch, guide, rules, or safety package is approved.'},
    {_type: 'destinationHighlight', _key: 'highlight-lucayan', label: 'Ancient Lucayan Sites', description: 'Distributed protected-site identity; responsible authority, components, disclosure, permission, access, safety, accessibility, and photography remain open.'},
  ],
  gettingThere: 'Spring Point Airport (AXP) serves Acklins. Colonel Hill Airport (CRI) and Pitts Town Point Airport (PWN) are on Crooked Island. Verify live airport status, carrier or charter, route, weather, immigration needs, baggage and accessibility assistance, ground or marine transfers, exact destination island, and disruption fallback. Do not rely on the tourism page’s ferry frequency claims until a responsible operator confirms them.',
  airports: [
    {_type: 'gateway', _key: 'airport-axp', code: 'AXP', name: 'Spring Point Airport', type: 'airport', note: 'Acklins gateway; live operation, route, carrier or charter, transfers, assistance, weather, and fallback require a current check.'},
    {_type: 'gateway', _key: 'airport-cri', code: 'CRI', name: 'Colonel Hill Airport', type: 'airport', note: 'Crooked Island gateway; live operation, route, carrier or charter, transfers, assistance, weather, and fallback require a current check.'},
    {_type: 'gateway', _key: 'airport-pwn', code: 'PWN', name: 'Pitts Town Point Airport', type: 'airport', note: 'Crooked Island gateway; live operation, route, carrier or charter, transfers, assistance, weather, and fallback require a current check.'},
  ],
  tripFit: {_type: 'object', vibe: 'Multi-island geography, heritage, and shallow-water planning'},
  practicalNotes: [
    block('acklins-practical-1', 'State the traveler’s exact island and settlement before planning access or emergency support. A combined island-group label does not prove same-island services, road access, marine transfer, clinic coverage, shelter activation, or response time.'),
    block('acklins-practical-2', 'Recheck flights, licensed ground and marine transfers, accommodations, restaurants, activity providers, protected-site permissions, tides and weather, emergency response, accessibility, prices, cancellation, and fallback for the traveler’s dates.'),
  ],
  gallery: [], faqs: [], featured: false, order: live.destinationPublished.order ?? 99,
  channels: live.destinationPublished.channels || ['web', 'mobile', 'buddy'], reviewedAt: checkedAt,
  source: {...live.destinationPublished.source, notes: 'Review-only corrective draft. It removes the unlicensed legacy hero, unsupported superlatives, suitability, numerical lagoon, ferry-frequency, and delivery-ready place claims. Published Sanity and hardcoded web/mobile content remain unchanged until separate editorial approval and release.'},
  seo: {_type: 'seo', metaTitle: 'Acklins & Crooked Island', metaDescription: 'Plan Acklins, Crooked Island and Long Cay with exact island, airport, marine-transfer, access, safety, accessibility and provider checks.'},
  evidenceSources: references([sourceIds.islandProfile, sourceIds.longCay, sourceIds.ferries, sourceIds.ancientSites, sourceIds.turtleSound], 'evidence-source'),
  editorialReviewStatus: 'blocked',
  editorialReviewNotes: 'Review this corrective draft with the evidence-and-media audit. Select a rights-cleared image candidate separately. Verify every live flight, vessel, transfer, provider, route, operation, permission, safety, accessibility, price, cancellation, and emergency claim before publication.',
}
const destinationPlan = {id: destinationDraftId, current: live.destinationDraft, planned: destinationDraft, needsUpdate: differs(live.destinationDraft, destinationDraft)}

const allDocumentPlans = [...sourcePlans, ...placePlans, ...candidatePlans, ...imagePlans, ...factPlans, auditPlan, destinationPlan]
const guardrails = {
  exactSupabaseRowCount: supabaseRows.length === 11,
  noSupabaseMedia: supabaseRows.every((row) => !row.primary_image_url && (!Array.isArray(row.gallery_images) || row.gallery_images.length === 0)),
  fiveForeignActiveCollisions: [...foreignCatalogKeys].every((key) => supabaseById.get(supabaseIds[key])?.is_active === true),
  publishedHeroMatchesHardcodedLegacyUrl: live.destinationPublished.heroImage?.externalUrl === urls.legacyHero && publicCopySignals.webLegacyImage && publicCopySignals.mobileLegacyImage,
  legacyHeroUrlCurrentlyResponds: externalImageStatuses.find((item) => item.url === urls.legacyHero)?.ok === true,
  everyPlaceCorrectionIsDraftInactiveAndChannelFree: placePlans.every((item) => item.id.startsWith('drafts.') && item.planned.active === false && item.planned.channels.length === 0),
  everyFactIsDraftAndChannelFree: factPlans.every((item) => item.id.startsWith('drafts.') && item.planned.channels.length === 0),
  everyImageCandidateIsDraftAndResearchOnly: imagePlans.every((item) => item.id.startsWith('drafts.') && item.planned.approvalStatus === 'research_only'),
  onlyRightsDocumentedImagesPlannedForUpload: imagePlans.filter((item) => item.needsAssetUpload).every((item) => ['public_domain_or_government_reuse_terms', 'documented_open_license', 'direct_permission_recorded'].includes(item.planned.rightsStatus)),
  externalTourismImagesRemainUnmanaged: imagePlans.filter((item) => item.planned.rightsStatus === 'controlled_library_asset_license_required').every((item) => !item.planned.reviewImage?.asset?._ref),
  noPublishedImageCandidates: live.publishedImageCandidates === 0,
  existingPortfolioHasNoPublishedResearchFacts: live.publishedFacts === 0,
  existingAcklinsFactDraftsHaveNoChannels: live.acklinsFactChannels === 0,
}
if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const plan = {
  generatedAt: new Date().toISOString(), mode: apply ? 'apply' : 'dry-run', output: outputPath,
  sourceSignals, publicCopySignals, externalImageStatuses,
  counts: {
    newSourcesToCreate: sourcePlans.filter((item) => !item.current && item.needsUpdate).length,
    existingSourcesToUpdate: sourcePlans.filter((item) => item.current && item.needsUpdate).length,
    placeDraftsToCreateOrUpdate: placePlans.filter((item) => item.needsUpdate).length,
    candidateDraftsToUpdate: candidatePlans.filter((item) => item.needsUpdate).length,
    imageDraftsToCreateOrUpdate: imagePlans.filter((item) => item.needsUpdate).length,
    managedAssetsToUpload: imagePlans.filter((item) => item.needsAssetUpload).length,
    externalOnlyImagesNotCopied: imagePlans.filter((item) => !item.managedAssetKey).length,
    factDraftsToCreateOrUpdate: factPlans.filter((item) => item.needsUpdate).length,
    auditDraftsToCreateOrUpdate: Number(auditPlan.needsUpdate),
    destinationDraftsToCreateOrUpdate: Number(destinationPlan.needsUpdate),
  },
  guardrails,
  changes: {
    sourceIds: sourcePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    placeIds: placePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    candidateIds: candidatePlans.filter((item) => item.needsUpdate).map((item) => item.id),
    imageIds: imagePlans.filter((item) => item.needsUpdate || item.needsAssetUpload).map((item) => item.id),
    assetUploads: imagePlans.filter((item) => item.needsAssetUpload).map((item) => managedAssetDefinitions[item.managedAssetKey].filename),
    factIds: factPlans.filter((item) => item.needsUpdate).map((item) => item.id),
    auditIds: auditPlan.needsUpdate ? [auditId] : [],
    destinationIds: destinationPlan.needsUpdate ? [destinationDraftId] : [],
  },
  boundary: 'This alignment updates live/internal source records and review-only Acklins & Crooked Island drafts. It uploads only three exact images with documented NASA or public-domain reuse terms and keeps four tourism-CDN candidates external-only. It does not mutate Supabase, publish content, accept a coordinate, change hardcoded web/mobile copy, enable delivery channels on research facts or places, contact an external party, copy uncleared media, approve a route, schedule, provider, operation, accessibility claim, or traveler delivery.',
}

if (apply) {
  const uploadedAssets = []
  for (const item of imagePlans.filter((candidate) => candidate.needsAssetUpload)) {
    const definition = managedAssetDefinitions[item.managedAssetKey]
    const asset = await client.assets.upload('image', managedBufferByUrl.get(definition.url), {filename: definition.filename})
    item.planned.reviewImage.asset = {_type: 'reference', _ref: asset._id}
    item.needsUpdate = differs(item.current, item.planned)
    item.needsAssetUpload = false
    uploadedAssets.push({candidateId: item.id, assetId: asset._id, filename: definition.filename})
  }
  plan.uploadedAssets = uploadedAssets

  let transaction = client.transaction()
  const documentIds = []
  for (const item of allDocumentPlans.filter((candidate) => candidate.needsUpdate)) {
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
