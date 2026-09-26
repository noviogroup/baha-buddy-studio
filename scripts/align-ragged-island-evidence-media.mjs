import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_RAGGED_ISLAND_EVIDENCE_MEDIA === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextQuarterlyReviewAt = '2026-11-03'
const nextMediaPolicyReviewAt = '2027-02-01'
const nextStableReviewAt = '2027-08-05'
const destinationId = 'dest-ragged-island'
const destinationDraftId = `drafts.${destinationId}`
const outputPath = '/private/tmp/baha-buddy-ragged-island-evidence-media-plan.json'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')

const sourceIds = {
  islandProfile: 'research-source-bmot-ragged-island',
  flightTables: 'research-source-bmot-flight-tables-current-review',
  aerodromeRegister: 'research-source-caab-government-aerodromes-2026',
  publicMap: 'research-source-bmot-public-map-dataset',
  mediaBoundary: 'research-source-bmot-brand-center-media-boundary',
  lostKey: 'research-source-operator-lost-key',
  lostKeyCorroboration: 'research-source-corrob-meridia-lost-key',
  nasaTerms: 'research-source-nasa-jsc-astronaut-photo-reuse-terms',
  nasaRange: 'research-source-nasa-ragged-range-iss052-e-78442',
  nasaDuncan: 'research-source-nasa-ragged-island-duncan-town-iss024-e-11938',
  wikimediaMap: 'research-source-wikimedia-ragged-island-locator-map',
  turtleLaw: 'research-source-laws-bahamas-marine-turtle-prohibition',
  alvinMunroe: 'research-source-bmot-ragged-alvin-munroe',
  manOWarTower: 'research-source-bmot-ragged-man-o-war-tower',
  lostKeyTin: 'research-source-bahamas-tin-lost-key-2023',
}

const supabaseIds = {
  hogCay: '45659ca4-6b99-4c9f-a2d0-ff055b32ead6',
  genericIsland: '772ff262-e575-4661-9da2-f832c9f61bcd',
  brewingRhodeIsland: '7838f434-8d50-4cc4-a712-c699243b94e4',
  innCalifornia: '935046bd-076d-4b1f-a011-8ce22a46bf65',
  gastropubCanada: '6c81af6a-d8e7-48a7-9593-8cf6e1b16fd9',
  robinAustralia: '66d0cf0d-1333-40ce-b00c-19b4afd34ba8',
  coffeePennsylvania: 'a8cb11c5-2727-479a-b18d-de4f05e26d9c',
  pointCalifornia: '82a1c49d-17f5-4e14-a372-5733858c1e83',
  mountainNewHampshire: '2a4d34b8-67a1-4bfa-b26c-75eac4c75d07',
  distilleryVirginia: 'e804397c-917e-43a0-910c-0a63a1e13498',
}
const foreignCatalogKeys = new Set([
  'brewingRhodeIsland', 'innCalifornia', 'gastropubCanada', 'robinAustralia',
  'coffeePennsylvania', 'pointCalifornia', 'mountainNewHampshire', 'distilleryVirginia',
])
const publishedPlaceIds = Object.fromEntries(Object.entries(supabaseIds).map(([key, id]) => [key, `place-supabase-${id}`]))
const placeIds = Object.fromEntries(Object.entries(publishedPlaceIds).map(([key, id]) => [key, `drafts.${id}`]))

const candidateIds = {
  duncanTown: 'drafts.canonical-place-candidate-ragged-island-duncan-town',
  jumentosCays: 'drafts.canonical-place-candidate-ragged-island-jumentos-cays',
  pigeonCay: 'drafts.canonical-place-candidate-ragged-island-pigeon-cay',
  lostKey: 'drafts.canonical-place-candidate-ragged-island-lost-key-lodge',
  alvinMunroe: 'drafts.canonical-place-candidate-ragged-island-alvin-munroe',
  manOWarTower: 'drafts.canonical-place-candidate-ragged-island-man-o-war-tower',
}

const imageIds = {
  nasaRange: 'drafts.image-candidate-ragged-range-nasa-iss052-e-78442',
  nasaDuncan: 'drafts.image-candidate-ragged-island-duncan-town-nasa-iss024-e-11938',
  wikimediaMap: 'drafts.image-candidate-ragged-island-wikimedia-locator-map',
  bmotHero: 'drafts.image-candidate-ragged-island-current-bmot-hero',
  bmotDuncan: 'drafts.image-candidate-ragged-island-duncan-town-bmot-display',
  bmotJumentos: 'drafts.image-candidate-ragged-island-jumentos-bmot-display',
  bmotHog: 'drafts.image-candidate-ragged-island-hog-cay-bmot-display',
  bmotPigeon: 'drafts.image-candidate-ragged-island-pigeon-cay-bmot-display',
  legacyHero: 'drafts.image-candidate-ragged-island-legacy-hero-rights-unresolved',
}

const factIds = {
  media: 'drafts.island-fact-ragged-island-image-and-legacy-hero-boundary',
  air: 'drafts.island-fact-ragged-island-air-access-and-aerodrome-boundary',
  turtle: 'drafts.island-fact-ragged-island-turtle-soup-legal-conflict',
  lostKey: 'drafts.island-fact-ragged-island-lost-key-operation-conflict',
  catalog: 'drafts.island-fact-ragged-island-catalog-and-public-copy-boundary',
}
const auditId = 'drafts.island-research-audit-2026-08-05-evidence-media-ragged-island'

const urls = {
  islandProfile: 'https://www.bahamas.com/the-islands/ragged-island/about-ragged-island',
  flying: 'https://www.bahamas.com/getting-here/flying',
  aerodromeRegister: 'https://caabahamas.com/wp-content/uploads/2026/01/The-Bahamas-Government-Owned-Aerodromes-Register.pdf',
  lostKey: 'https://lostkeylodge.com/',
  lostKeyCorroboration: 'https://www.meridiaoutdoors.com/the-bahamas/fishing-lodges/lost-key-lodge',
  lostKeyTin: 'https://inlandrevenue.finance.gov.bs/wp-content/uploads/2023/05/TIN-Only-Register-as-at-April-1-2023.pdf',
  turtleLaw: 'https://laws.bahamas.gov.bs/cms/images/LEGISLATION/SUBORDINATE/1986/1986-0010/1986-0010.pdf',
  alvinMunroe: 'https://www.bahamas.com/plan-your-trip/things-to-do/alvin-munroe',
  manOWarTower: 'https://www.bahamas.com/plan-your-trip/things-to-do/man-o-war-tower',
  nasaRangePage: 'https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?frame=78442&mission=ISS052&roll=E',
  nasaRangeOriginal: 'https://eol.jsc.nasa.gov/DatabaseImages/ESC/large/ISS052/ISS052-E-78442.JPG',
  nasaDuncanPage: 'https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?frame=11938&mission=ISS024&roll=E',
  nasaDuncanOriginal: 'https://eol.jsc.nasa.gov/DatabaseImages/ESC/large/ISS024/ISS024-E-11938.JPG',
  nasaTerms: 'https://eol.jsc.nasa.gov/FAQ/default.htm',
  wikimediaPage: 'https://commons.wikimedia.org/wiki/File:Ragged_Island_in_Bahamas_(zoom).svg',
  wikimediaPng: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ragged_Island_in_Bahamas_%28zoom%29.svg/1920px-Ragged_Island_in_Bahamas_%28zoom%29.svg.png',
  bmotHero: 'https://tempo.cdn.tambourine.com/windsong/media/bmot-ragged-island-mainsite-hero-image-5f64d6b7e4e11.jpg',
  bmotDuncan: 'https://tempo.cdn.tambourine.com/windsong/media/bmot-ragged-island-mainsite-island-insider-petals-images-duncan-town-5f6bd55b2c904.jpg',
  bmotJumentos: 'https://tempo.cdn.tambourine.com/windsong/media/cache/bmot-ragged-island-things-to-do-island-hopping-765x708-656510821e95a-765x708.jpg',
  bmotHog: 'https://tempo.cdn.tambourine.com/windsong/media/ragged-island-hog-cay-beach-5fac486a51849.jpg',
  bmotPigeon: 'https://tempo.cdn.tambourine.com/windsong/media/cache/bmot-ragged-island-mainsite-things-todo-pigeon-cay-5f68f9704befe-765x708.jpg',
  legacyHero: 'https://tempo.cdn.tambourine.com/windsong/media/bmot-ragged-island-islands-img-5f76552b68017.jpg',
}

const managedAssetDefinitions = {
  nasaRange: {url: urls.nasaRangeOriginal, filename: 'ragged-range-nasa-iss052-e-78442.jpg', checksum: '9c0ebe1d3db6b7f5eda9ebdcdf18ea43b6b107bd4727b1685942bcc2f4c74a56', width: 4928, height: 3280},
  nasaDuncan: {url: urls.nasaDuncanOriginal, filename: 'ragged-island-duncan-town-nasa-iss024-e-11938.jpg', checksum: '48d06c04f00bef1243bf533ecab398377397ce5896cd0e9f004095ee8d86dc5d', width: 4288, height: 2929},
  wikimediaMap: {url: urls.wikimediaPng, filename: 'ragged-island-wikimedia-locator-map-cc-by-sa-3.png', checksum: '0a27f94ae5957df9b5dadb0e9509900e84f1c9bdbd5723f00404f94d5643b630', width: 1920, height: 1385},
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

async function fetchHtml(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  if (!response.ok) throw new Error(`Research source failed: ${url} (${response.status})`)
  return response.text()
}

async function fetchText(url) {
  return plainText(await fetchHtml(url))
}

async function fetchBuffer(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy research source verifier/1.0'}})
  if (!response.ok) throw new Error(`Image source failed: ${url} (${response.status})`)
  return Buffer.from(await response.arrayBuffer())
}

async function urlStatus(url) {
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
  for (const [index, id] of [...new Set(ids)].entries()) if (!byId.has(id)) byId.set(id, reference(id, `${prefix}-${index + 1}-${id.replace(/[^a-z0-9]+/gi, '-').slice(-28)}`))
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

function locationReview({ids, reconciliationStatus = 'identity_without_point', operation = 'not_established', access = 'unresolved', decision = 'not_applicable', notes}) {
  return {_type: 'placeLocationReview', checkedAt, reconciliationStatus, candidates: [], evidenceSources: references(ids, 'location-source'), locationConfidence: 'low', operationEvidenceStatus: operation, accessEvidenceStatus: access, reviewDecision: decision, notes}
}

function travelerReview({ids, responsible = 'unresolved', operation = 'unresolved', access = 'unresolved', copy = 'identity_only', media = 'no_approved_media', notes}) {
  return {_type: 'placeTravelerReadinessReview', checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked', responsibleSourceStatus: responsible, operationStatus: operation, accessStatus: access, safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: copy, mediaStatus: media, deliveryDecision: 'blocked', sources: references(ids, 'readiness-source'), notes}
}

function contentReview({ids, identity = 'Identity is preserved for evidence review only; no point, route, operation, or traveler recommendation is approved.', foundation = 'identity_only', notes}) {
  const sourceRefs = references(ids, 'content-source')
  const components = [
    ['identity', 'partial', identity, 'Resolve the exact entity, destination, feature type, duplicate relationship, and accountable source before any canonical change.'],
    ['description', 'blocked', 'The reviewed evidence does not support a complete traveler description.', 'Obtain current responsible-source context before drafting public copy.'],
    ['operation_access', 'blocked', 'Current operation, exact access, route, restrictions, assistance, and fallback are incomplete.', 'Verify date-specific operation and access with the responsible operator or authority.'],
    ['safety', 'missing', 'No complete feature-specific safety and emergency package is established.', 'Verify hazards, supervision, communications, response, and traveler limitations.'],
    ['accessibility', 'missing', 'No responsible feature-level accessibility statement is established.', 'Obtain current route, surface, transfer, toilet, sensory, service-animal, and assistance details.'],
    ['media', 'blocked', 'No exact place-level asset has documented reusable rights and reviewed alt text.', 'Select a controlled-library, government-reuse, open-license, or directly permitted asset and record exact terms.'],
    ['traveler_copy', 'blocked', 'The evidence gates do not form a delivery-safe package.', 'Keep every channel closed until all gates and a separate editorial approval are complete.'],
  ].map(([component, status, evidenceSummary, nextAction], index) => ({_type: 'placeCopyComponentReview', _key: `component-${index + 1}-${component}`, component, status, evidenceSummary, nextAction}))
  return {_type: 'placeContentReadinessReview', checkedAt, nextReviewAt: nextOperationalReviewAt, overallStatus: 'blocked', accessibilityEvidenceStatus: 'not_found_in_reviewed_sources', accessibilitySources: sourceRefs, accessibilityBoundary: 'Access mode, terrain, a boat requirement, stairs, a trail, or source silence does not establish feature-level accessibility. Missing evidence is not proof that a feature is inaccessible.', copyFoundationStatus: foundation, copyComponents: components, mediaEvidenceStatus: 'no_candidate_media', mediaRightsStatus: 'unknown_or_unverified', mediaPolicySources: [reference(sourceIds.mediaBoundary, 'media-policy-source')], altTextStatus: 'no_approved_image', publicCopyDecision: 'blocked', notes}
}

function candidate({id, title, slug, featureType, categoryProposal, officialSourceName, ids, identityBoundary, location, traveler, content, reviewNotes, sourceAdjudicationStatus}) {
  return {_id: id, _type: 'canonicalPlaceCandidate', title, slug: {_type: 'slug', current: slug}, destination: reference(destinationId, 'destination-ragged-island'), islandName: 'Ragged Island', officialSourceName, featureType, categoryProposal, identityEvidence: references(ids, 'identity-source'), identityBoundary, locationReview: location, travelerReadinessReview: traveler, contentReadinessReview: content, rejectedSupabaseMatches: [], canonicalCreationStatus: 'researching', ...(sourceAdjudicationStatus ? {sourceAdjudicationStatus, sourceAdjudicationNotes: reviewNotes, adjudicatedAt: checkedAt} : {}), reviewedAt: checkedAt, reviewNotes}
}

function fact({id, title, topic, claim, guidance, ids, confidence = 'high', volatility = 'operational'}) {
  return {_id: id, _type: 'islandFact', title, destination: reference(destinationId, 'destination-ragged-island'), topic, claim, travelerGuidance: guidance, sources: references(ids, 'source'), checkedAt, nextReviewAt: nextOperationalReviewAt, volatility, confidence, verificationStatus: 'source_verified', channels: [], editorNotes: 'Review-only evidence. This fact does not approve publication, a Supabase change, a coordinate, provider, route, schedule, operation, legal advice, media asset, accessibility claim, or traveler delivery.'}
}

const [islandHtml, flyingText, lostKeyText, alvinText, towerText, nasaRangeText, nasaDuncanText, nasaTermsText, wikimediaText, managedBuffers, externalStatuses, documentStatuses] = await Promise.all([
  fetchHtml(urls.islandProfile), fetchText(urls.flying), fetchText(urls.lostKey), fetchText(urls.alvinMunroe), fetchText(urls.manOWarTower),
  fetchText(urls.nasaRangePage), fetchText(urls.nasaDuncanPage), fetchText(urls.nasaTerms), fetchText(urls.wikimediaPage),
  Promise.all(Object.values(managedAssetDefinitions).map(async (definition) => ({...definition, buffer: await fetchBuffer(definition.url)}))),
  Promise.all([urls.bmotHero, urls.bmotDuncan, urls.bmotJumentos, urls.bmotHog, urls.bmotPigeon, urls.legacyHero].map(urlStatus)),
  Promise.all([urls.aerodromeRegister, urls.turtleLaw, urls.lostKeyTin].map(urlStatus)),
])
const islandText = plainText(islandHtml)
const sourceSignals = {
  island: {...signals(islandText, {duncanTown: /Duncan Town/i, jumentos: /Jumentos/i, hogCay: /Hog Cay/i, pigeonCay: /Pigeon Cay/i, turtleSoup: /turtle soup/i}), hero: islandHtml.includes('bmot-ragged-island-mainsite-hero-image-5f64d6b7e4e11'), duncanImage: islandHtml.includes('bmot-ragged-island-mainsite-island-insider-petals-images-duncan-town-5f6bd55b2c904'), hogImage: islandHtml.includes('ragged-island-hog-cay-beach-5fac486a51849'), pigeonImage: islandHtml.includes('bmot-ragged-island-mainsite-things-todo-pigeon-cay-5f68f9704befe')},
  flying: signals(flyingText, {noCommercialFlights: /no commercial flights to Ragged Island/i, charter: /charter/i}),
  lostKey: signals(lostKeyText, {identity: /Lost Key/i, fourAnglers: /4 anglers|four anglers/i, duncan: /Duncan|Ragged Island/i}),
  alvin: signals(alvinText, {name: /Alvin Munroe/i, reservations: /one week|week in advance/i}),
  tower: signals(towerText, {name: /Man-O-War Tower|Man O War Tower/i, duncan: /Duncan Town/i, beacon: /solar.?powered/i}),
  nasaRange: signals(nasaRangeText, {photo: /ISS052-E-78442/i, date: /2017\.08\.26|2017-08-26/i, feature: /LITTLE RAGGED ISLAND|BONAVISTA CAY/i}),
  nasaDuncan: signals(nasaDuncanText, {photo: /ISS024-E-11938/i, date: /2010\.08\.14|2010-08-14/i, feature: /DUNCAN TOWN|RAGGED I/i}),
  nasaTerms: signals(nasaTermsText, {credit: /Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center/i, noEndorsement: /may not be used to state or imply the endorsement by NASA/i}),
  wikimedia: signals(wikimediaText, {filename: /Ragged Island in Bahamas \(zoom\)\.svg/i, creator: /TUBS/i, license: /CC BY-SA 3\.0|Attribution-ShareAlike 3\.0/i}),
}
if (Object.values(sourceSignals).flatMap((group) => Object.values(group)).some((value) => !value)) throw new Error(`Research-source signals changed: ${JSON.stringify(sourceSignals)}`)
if (externalStatuses.some((item) => !item.ok || !item.contentType?.startsWith('image/'))) throw new Error(`External image candidate changed: ${JSON.stringify(externalStatuses)}`)
if (documentStatuses.some((item) => !item.ok && !(item.url === urls.turtleLaw && item.status === 403))) throw new Error(`Official document source changed: ${JSON.stringify(documentStatuses)}`)
for (const item of managedBuffers) {
  const checksum = crypto.createHash('sha256').update(item.buffer).digest('hex')
  if (checksum !== item.checksum) throw new Error(`Managed review image checksum changed for ${item.url}: ${checksum}`)
}
const managedBufferByUrl = new Map(managedBuffers.map((item) => [item.url, item.buffer]))

const publicCopySignals = {
  webLegacyImage: fs.readFileSync(path.join(workspaceRoot, 'bahabuddy-web/src/lib/islands.ts'), 'utf8').includes(urls.legacyHero),
  mobileLegacyImage: fs.readFileSync(path.join(workspaceRoot, 'Baha-Buddy-V2/lib/core/constants/baha_images.dart'), 'utf8').includes(urls.legacyHero),
  webOffGridCopy: /Far-south cays, fishing, and off-grid exploration/i.test(fs.readFileSync(path.join(workspaceRoot, 'bahabuddy-web/src/components/marketplace/MarketplacePublicHeader.tsx'), 'utf8')),
}
if (Object.values(publicCopySignals).some((value) => !value)) throw new Error(`Public-copy signals changed: ${JSON.stringify(publicCopySignals)}`)

const env = loadEnv(path.join(workspaceRoot, 'bahabuddy-web/.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')
const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified,description,short_description,primary_image_url,gallery_images&island_id=eq.ragged-island`, {headers: {apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`}})
if (!supabaseResponse.ok) throw new Error(`Supabase Ragged Island read failed: ${supabaseResponse.status}`)
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
  "raggedFactChannels": count(*[_type == "islandFact" && _id in path("drafts.**") && destination._ref == $destinationId && count(channels) > 0]),
  "publishedImageCandidates": count(*[_type == "imageCandidate" && !(_id in path("drafts.**"))])
}`, {sourceIds: Object.values(sourceIds), publishedPlaceIds: Object.values(publishedPlaceIds), placeIds: Object.values(placeIds), candidateIds: Object.values(candidateIds), imageIds: Object.values(imageIds), factIds: Object.values(factIds), auditId, destinationId, destinationDraftId})

const sourceById = new Map(live.sources.map((item) => [item._id, item]))
const publishedPlaceById = new Map(live.publishedPlaces.map((item) => [item._id, item]))
const placeById = new Map(live.placeDrafts.map((item) => [item._id, item]))
const candidateById = new Map(live.candidates.map((item) => [item._id, item]))
const imageById = new Map(live.images.map((item) => [item._id, item]))
const factById = new Map(live.facts.map((item) => [item._id, item]))
for (const id of [sourceIds.islandProfile, sourceIds.flightTables, sourceIds.aerodromeRegister, sourceIds.publicMap, sourceIds.mediaBoundary, sourceIds.lostKey, sourceIds.lostKeyCorroboration, sourceIds.nasaTerms]) if (!sourceById.has(id)) throw new Error(`Missing source: ${id}`)
for (const id of Object.values(publishedPlaceIds)) if (!publishedPlaceById.has(id)) throw new Error(`Missing published place overlay: ${id}`)
for (const id of [candidateIds.duncanTown, candidateIds.jumentosCays, candidateIds.pigeonCay]) if (!candidateById.has(id)) throw new Error(`Missing candidate: ${id}`)
for (const id of Object.values(supabaseIds)) if (!supabaseById.has(id)) throw new Error(`Missing Supabase row: ${id}`)
if (!live.destinationPublished) throw new Error(`Missing destination: ${destinationId}`)
if (supabaseRows.length !== 10) throw new Error(`Expected 10 Ragged Island Supabase rows, found ${supabaseRows.length}`)
if (live.destinationPublished.heroImage?.externalUrl !== urls.legacyHero) throw new Error(`Published destination hero changed: ${live.destinationPublished.heroImage?.externalUrl}`)

const destinationRef = reference(destinationId, 'destination-ragged-island')
const sourcePlans = []
function planSource(planned) {
  const current = sourceById.get(planned._id)
  sourcePlans.push({id: planned._id, current, planned, needsUpdate: differs(current, planned)})
}

const islandSource = stripMeta(sourceById.get(sourceIds.islandProfile))
planSource({...islandSource, url: urls.islandProfile, topics: [...new Set([...(islandSource.topics || []), 'media'])], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck', notes: 'Primary national-tourism source for the island-chain identity, Duncan Town, Jumentos Cays, Hog Cay, Pigeon Cay, Man-O-War Tower, broad access context, and current image displays. Its current food copy promotes turtle soup while the reviewed official fisheries regulation prohibits taking, possessing, buying, or selling marine turtles, parts, or eggs except under a research or education permit. Do not repeat that food claim. Superlatives, suitability, boat-access, commercial-flight, operation, safety, accessibility, and media reuse claims require narrower responsible evidence.', reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'primary_source_scope_requires_review', attention: true, reviewScope: 'Recheck the destination page, turtle-soup wording, access statements, named places, superlatives, current image URLs, and any correction or responsible-source links.', nextAction: 'By 2026-09-04, reconcile the food copy with current fisheries law, retain the legal boundary, and obtain exact Brand Center asset records before reusing source images.', triggers: ['publisher_url_or_scope_change', 'safety_emergency_or_activation_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'media_rights_or_terms_change']})})

for (const id of [sourceIds.mediaBoundary, sourceIds.nasaTerms]) {
  const current = stripMeta(sourceById.get(id))
  planSource({...current, destinations: mergeReferences(current.destinations, [destinationId], 'destination'), topics: [...new Set([...(current.topics || []), 'media'])], checkedAt})
}

const lostKeySource = stripMeta(sourceById.get(sourceIds.lostKey))
planSource({...lostKeySource, checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck', notes: 'The direct operator site is current evidence for a specialized Ragged Island fishing-lodge identity and describes a maximum of four anglers. A current marketplace profile instead describes ten guests in five rooms. Treat capacity, current operation, charter, transfers, inclusions, price, availability, safety, accessibility, and media as unresolved until the operator confirms the exact current product.', reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'responsible_or_owning_publisher', attention: true, reviewScope: 'Confirm current operation, legal property identity, capacity, room inventory, access and charter responsibility, transfers, inclusions, safety, accessibility, cancellation, and media rights.', nextAction: 'By 2026-09-04, reconcile the four-angler direct statement with the ten-guest marketplace profile and obtain accountable current operating details.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'media_rights_or_terms_change']})})

const lostKeyCorroboration = stripMeta(sourceById.get(sourceIds.lostKeyCorroboration))
planSource({...lostKeyCorroboration, checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck', notes: 'Current marketplace corroboration for the Lost Key Lodge identity only. Its ten-guest, five-room and charter claims conflict with the direct operator site’s four-angler statement and must not be copied as current inventory, transport, pricing, or availability.', reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'corroborating_source', attention: true, reviewScope: 'Recheck the listing identity, capacity, rooms, transport, inclusions, dates, and whether the direct operator confirms each claim.', nextAction: 'By 2026-09-04, record the operator-confirmed capacity and retire or qualify conflicting marketplace claims.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change']})})

planSource({_id: sourceIds.nasaRange, _type: 'researchSource', title: 'NASA/JSC photo ISS052-E-78442 — Ragged Island Range and nearby cays', url: urls.nasaRangePage, publisher: 'Earth Science and Remote Sensing Unit, NASA Johnson Space Center', sourceClass: 'government', authorityLevel: 'primary', destinations: [destinationRef], topics: ['overview', 'nature', 'media'], checkedAt, nextReviewAt: nextStableReviewAt, status: 'active', notes: 'The NASA/JSC record identifies photo ISS052-E-78442, captured August 26, 2017, and names Bonavista Cay, Nurse Cay, Little Ragged Island, and the Turks and Caicos Islands. The image supports broad geographic context only; it is not current access, facility, navigation, depth, hazard, or traveler-condition evidence.', reviewPlan: reviewPlan({cadenceDays: 365, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck photo ID, capture date, feature metadata, dimensions, source URL, and any asset-level copyright or third-party notice.', nextAction: 'Retain the requested NASA/JSC credit, photo ID, source URL, non-endorsement boundary, and current-condition caveat with every proposed use.', triggers: ['publisher_url_or_scope_change', 'media_rights_or_terms_change']})})

planSource({_id: sourceIds.nasaDuncan, _type: 'researchSource', title: 'NASA/JSC photo ISS024-E-11938 — Ragged Island and Duncan Town', url: urls.nasaDuncanPage, publisher: 'Earth Science and Remote Sensing Unit, NASA Johnson Space Center', sourceClass: 'government', authorityLevel: 'primary', destinations: [destinationRef], topics: ['overview', 'nature', 'media'], checkedAt, nextReviewAt: nextStableReviewAt, status: 'active', notes: 'The NASA/JSC record identifies photo ISS024-E-11938, captured August 14, 2010, and names Duncan Town, Ragged Island, and reefs. Visual review shows the island, airstrip, surrounding banks, reefs, and deep ocean. The image cannot establish current airport, roads, shoreline, access, services, hazards, or traveler conditions.', reviewPlan: reviewPlan({cadenceDays: 365, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck photo ID, capture date, feature metadata, dimensions, source URL, and any asset-level copyright or third-party notice.', nextAction: 'Retain the requested NASA/JSC credit, photo ID, source URL, non-endorsement boundary, and current-condition caveat with every proposed use.', triggers: ['publisher_url_or_scope_change', 'media_rights_or_terms_change']})})

planSource({_id: sourceIds.wikimediaMap, _type: 'researchSource', title: 'Wikimedia Commons file — Ragged Island locator map', url: urls.wikimediaPage, publisher: 'Wikimedia Commons / TUBS', sourceClass: 'independent_editorial', authorityLevel: 'corroborating', destinations: [destinationRef], topics: ['overview', 'media'], checkedAt, nextReviewAt: nextStableReviewAt, status: 'active', notes: 'The Commons file record identifies creator TUBS, creation date May 20, 2012, and CC BY-SA 3.0 and GFDL licensing. The reviewed managed PNG is a rendering of the source SVG. It is contextual artwork only, not an official legal boundary, nautical chart, navigation aid, route, hazard, or current-condition source.', reviewPlan: reviewPlan({cadenceDays: 365, relationship: 'corroborating_source', reviewScope: 'Recheck the exact file history, creator, license, attribution requirements, source SVG, and any deletion, replacement, or dispute.', nextAction: 'Preserve attribution, license link, derivative/rendering notice, and share-alike terms; display a not-for-navigation and not-a-legal-boundary caveat.', method: 'dataset_review', triggers: ['publisher_url_or_scope_change', 'media_rights_or_terms_change']})})

planSource({_id: sourceIds.turtleLaw, _type: 'researchSource', title: 'The Bahamas fisheries regulation — marine-turtle prohibition', url: urls.turtleLaw, publisher: 'Government of The Bahamas — Laws of The Bahamas', sourceClass: 'government', authorityLevel: 'primary', destinations: [destinationRef], topics: ['food', 'nature', 'safety'], checkedAt, nextReviewAt: nextQuarterlyReviewAt, status: 'active', notes: 'The reviewed official online regulation text states in regulation 29 that no person shall take, possess, buy, or sell any marine turtle, turtle part, or turtle egg; regulation 32 provides a permit route for research or education. This is a content-safety boundary, not legal advice. Recheck the current consolidated law and competent authority before operational use.', reviewPlan: reviewPlan({cadenceDays: 90, relationship: 'responsible_or_owning_publisher', reviewScope: 'Recheck the current consolidated Fisheries Resources regulations, amendments, exceptions, enforcement guidance, and any responsible authority notice affecting marine turtles.', nextAction: 'Keep turtle-soup recommendations blocked and route any legal or enforcement interpretation to the competent Bahamas authority.', method: 'document_review', triggers: ['publisher_url_or_scope_change', 'safety_emergency_or_activation_change', 'source_restored_replaced_or_superseded']})})

planSource({_id: sourceIds.alvinMunroe, _type: 'researchSource', title: 'Alvin Munroe — official tourism activity listing', url: urls.alvinMunroe, publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary', destinations: [destinationRef], topics: ['experiences', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck', notes: 'The official listing identifies Alvin Munroe as a lifelong Ragged Island fisherman offering fishing, birding, picnicking, and snorkeling and asks for reservations at least one week ahead. It is an identity and service lead only; current licensing, availability, vessel, meeting point, safety, accessibility, price, cancellation, and media rights are not established.', reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', attention: true, reviewScope: 'Confirm the responsible operator, current legal business identity, services, licensing, vessel, capacity, exact meeting and access route, safety, accessibility, price, cancellation, and media rights.', nextAction: 'By 2026-09-04, obtain direct responsible confirmation before any recommendation or booking path.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change']})})

planSource({_id: sourceIds.manOWarTower, _type: 'researchSource', title: 'Man-O-War Tower — official tourism attraction listing', url: urls.manOWarTower, publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary', destinations: [destinationRef], topics: ['culture', 'experiences', 'access'], checkedAt, nextReviewAt: nextOperationalReviewAt, status: 'needs_recheck', notes: 'The official listing identifies Man-O-War Tower southeast of Duncan Town and describes a solar-powered beacon, circular stairs, trail, salt-pond context, and memorial plaque. It does not identify a current managing authority, exact approved point, opening or access status, maintenance, trail condition, climbing permission, safety, accessibility, emergency response, or media rights.', reviewPlan: reviewPlan({cadenceDays: 30, relationship: 'official_context_publisher', attention: true, reviewScope: 'Confirm the exact feature and trail, responsible authority, current beacon and site status, legal access, climbing rules, surface and stair conditions, hazards, accessibility, emergency response, and image rights.', nextAction: 'By 2026-09-04, obtain responsible operational and location evidence before traveler delivery.', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change']})})

planSource({_id: sourceIds.lostKeyTin, _type: 'researchSource', title: 'Bahamas TIN register — Lost Key Fishing Lodge & Resort (April 2023)', url: urls.lostKeyTin, publisher: 'Department of Inland Revenue, Government of The Bahamas', sourceClass: 'government', authorityLevel: 'corroborating', destinations: [destinationRef], topics: ['stays'], checkedAt, nextReviewAt: nextStableReviewAt, status: 'active', notes: 'The dated April 2023 register contains the identity Lost Key Fishing Lodge & Resort at Charles & Richmond Street, Duncan Town. It corroborates a historical registered identity and address only; it does not establish current operation, ownership, capacity, room inventory, availability, access, safety, accessibility, price, tax standing, or media rights.', reviewPlan: reviewPlan({cadenceDays: 365, relationship: 'corroborating_source', reviewScope: 'Recheck for a newer official business or tax register and confirm that the name and address remain applicable.', nextAction: 'Use only as dated identity/address corroboration; rely on current responsible evidence for operation and every traveler-facing claim.', method: 'document_review', triggers: ['publisher_url_or_scope_change', 'operation_schedule_or_contact_change', 'source_restored_replaced_or_superseded']})})

function imageCandidate({id, title, subjectLabel, subjectType, identityStatus, identityIds, identityNotes, imageUrl, sourceAssetId, sourceAssetUrl = imageUrl, sourcePageUrl, intendedUses, captureDate, width, height, checksumSha256, creator, rightsHolder, rightsStatus, licenseName, licenseUrl, requiredCredit, displayCredit = requiredCredit, usageRestrictions, rightsIds, currentConditionBoundary, altTextDraft, altTextStatus, reviewStatus, reviewNotes, caption, managedAssetKey, relatedPlaces = []}) {
  const current = imageById.get(id)
  const currentAsset = current?.reviewImage?.asset?._ref
  const reviewImage = {_type: 'contentImage', externalUrl: imageUrl, caption, credit: displayCredit, sourceUrl: sourcePageUrl, ...(altTextDraft ? {alt: altTextDraft} : {}), ...(currentAsset ? {asset: {_type: 'reference', _ref: currentAsset}} : {})}
  return {_id: id, _type: 'imageCandidate', title, destination: destinationRef, relatedPlaces: references(relatedPlaces, 'related-place'), subjectLabel, subjectType, identityStatus, identityEvidence: references(identityIds, 'identity-source'), identityNotes, reviewImage, sourceAssetId, sourceAssetUrl, sourcePageUrl, intendedUses, captureDate, width, height, checksumSha256, creator, rightsHolder, rightsStatus, licenseName, licenseUrl, requiredCredit, usageRestrictions, rightsEvidence: references(rightsIds, 'rights-source'), currentConditionBoundary, altTextDraft, altTextStatus, reviewStatus, approvalStatus: 'research_only', checkedAt, nextReviewAt: ['public_domain_or_government_reuse_terms', 'documented_open_license'].includes(rightsStatus) ? nextMediaPolicyReviewAt : nextOperationalReviewAt, reviewNotes, managedAssetKey}
}

const nasaCredit = 'Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center'
const tourismRights = {creator: 'Not identified on the public page', rightsHolder: 'Bahamas Ministry of Tourism, Investments & Aviation / controlled Brand Center to be confirmed', rightsStatus: 'controlled_library_asset_license_required', licenseName: 'Exact Brand Center asset license not yet recorded', requiredCredit: 'Do not use until the exact controlled-library asset record supplies the required credit.', usageRestrictions: 'Public display on Bahamas.com is not blanket reuse permission. Do not copy, upload, crop, or attach the file until its exact Brand Center asset record, subject, creator, capture date, permitted channels, alterations, credit, and any people or property permissions are documented.', rightsIds: [sourceIds.islandProfile, sourceIds.mediaBoundary], altTextStatus: 'no_exact_image', reviewStatus: 'rights_review'}
const imageDocuments = [
  imageCandidate({id: imageIds.nasaRange, title: 'Ragged Island Range and nearby cays — NASA ISS052-E-78442', subjectLabel: 'Bonavista Cay, Nurse Cay, Little Ragged Island, and surrounding banks', subjectType: 'destination_geography', identityStatus: 'responsible_source_confirmed', identityIds: [sourceIds.nasaRange], identityNotes: 'NASA/JSC metadata names the exact photo and visible features. Visual review shows a long chain of cays, broad turquoise shoals, deep-blue ocean, and cloud cover. It is not a point or navigation chart.', imageUrl: urls.nasaRangeOriginal, sourceAssetId: 'ISS052-E-78442', sourcePageUrl: urls.nasaRangePage, intendedUses: ['destination_hero', 'destination_gallery', 'map_context', 'editorial_article'], captureDate: '2017-08-26', width: 4928, height: 3280, checksumSha256: managedAssetDefinitions.nasaRange.checksum, creator: 'International Space Station crew', rightsHolder: 'National Aeronautics and Space Administration', rightsStatus: 'public_domain_or_government_reuse_terms', licenseName: 'NASA/JSC astronaut photography conditions of use', licenseUrl: urls.nasaTerms, requiredCredit: `${nasaCredit}. Photo ISS052-E-78442; eol.jsc.nasa.gov.`, displayCredit: nasaCredit, usageRestrictions: 'Do not state or imply NASA endorsement. Recheck the exact asset for any contrary copyright notice. Retain NASA/JSC acknowledgment, photo ID, and source URL.', rightsIds: [sourceIds.nasaRange, sourceIds.nasaTerms], currentConditionBoundary: 'Captured August 26, 2017. It supports broad geography only and must not imply current channels, water depth, access, facilities, services, hazards, or traveler conditions.', altTextDraft: 'Astronaut photograph of the Ragged Island chain, turquoise banks, small cays, and deep-blue ocean in August 2017.', altTextStatus: 'draft_unreviewed', reviewStatus: 'ready_for_editorial_review', reviewNotes: 'Managed review asset. Confirm crop, cloud cover, focal area, mobile safe area, contrast, credit placement, geographic framing, and non-endorsement before a separate content decision.', caption: 'Ragged Island Range and nearby cays from the International Space Station, August 26, 2017. NASA photo ISS052-E-78442.', managedAssetKey: 'nasaRange'}),
  imageCandidate({id: imageIds.nasaDuncan, title: 'Ragged Island and Duncan Town — NASA ISS024-E-11938', subjectLabel: 'Great Ragged Island, Duncan Town, airstrip, banks, and reefs', subjectType: 'destination_geography', identityStatus: 'responsible_source_confirmed', identityIds: [sourceIds.nasaDuncan], identityNotes: 'NASA/JSC metadata names Duncan Town and Ragged Island. Visual review shows the island, its airstrip, turquoise banks and reefs, and deep-blue ocean; the image is not a road, airport-status, or settlement-access source.', imageUrl: urls.nasaDuncanOriginal, sourceAssetId: 'ISS024-E-11938', sourcePageUrl: urls.nasaDuncanPage, intendedUses: ['destination_hero', 'destination_gallery', 'map_context', 'editorial_article'], captureDate: '2010-08-14', width: 4288, height: 2929, checksumSha256: managedAssetDefinitions.nasaDuncan.checksum, creator: 'International Space Station crew', rightsHolder: 'National Aeronautics and Space Administration', rightsStatus: 'public_domain_or_government_reuse_terms', licenseName: 'NASA/JSC astronaut photography conditions of use', licenseUrl: urls.nasaTerms, requiredCredit: `${nasaCredit}. Photo ISS024-E-11938; eol.jsc.nasa.gov.`, displayCredit: nasaCredit, usageRestrictions: 'Do not state or imply NASA endorsement. Recheck the exact asset for any contrary copyright notice. Retain NASA/JSC acknowledgment, photo ID, and source URL.', rightsIds: [sourceIds.nasaDuncan, sourceIds.nasaTerms], currentConditionBoundary: 'Captured August 14, 2010. It cannot establish current airport, settlement, shoreline, roads, access, services, hazards, or traveler conditions.', altTextDraft: 'Astronaut photograph of Great Ragged Island, its airstrip, turquoise banks, reefs, and deep-blue ocean in August 2010.', altTextStatus: 'draft_unreviewed', reviewStatus: 'ready_for_editorial_review', reviewNotes: 'Managed review asset. Confirm crop, orientation, legibility, mobile safe area, credit placement, age boundary, geographic framing, and non-endorsement before a separate content decision.', caption: 'Great Ragged Island and Duncan Town from the International Space Station, August 14, 2010. NASA photo ISS024-E-11938.', managedAssetKey: 'nasaDuncan'}),
  imageCandidate({id: imageIds.wikimediaMap, title: 'Ragged Island locator map — CC BY-SA 3.0', subjectLabel: 'Ragged Island district location within The Bahamas', subjectType: 'map_diagram', identityStatus: 'creator_metadata_confirmed', identityIds: [sourceIds.wikimediaMap], identityNotes: 'The Commons record identifies the exact locator map and creator TUBS. The managed PNG is a rendering of the source SVG and provides regional context only.', imageUrl: urls.wikimediaPng, sourceAssetId: 'File:Ragged Island in Bahamas (zoom).svg', sourcePageUrl: urls.wikimediaPage, intendedUses: ['map_context', 'editorial_article'], captureDate: '2012-05-20', width: 1920, height: 1385, checksumSha256: managedAssetDefinitions.wikimediaMap.checksum, creator: 'TUBS', rightsHolder: 'TUBS', rightsStatus: 'documented_open_license', licenseName: 'Creative Commons Attribution-ShareAlike 3.0 Unported', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', requiredCredit: 'Locator map by TUBS, via Wikimedia Commons, CC BY-SA 3.0; PNG rendering of the source SVG.', usageRestrictions: 'Preserve attribution, license link, share-alike requirements, and a notice that the PNG is a rendering of the SVG. Indicate any additional changes. Do not use for navigation, routing, legal boundaries, property limits, or hazard guidance.', rightsIds: [sourceIds.wikimediaMap], currentConditionBoundary: 'Created May 20, 2012. It is contextual cartography and does not establish current transport, facilities, routes, boundaries, hazards, or traveler conditions.', altTextDraft: 'Locator map showing the Ragged Island district in red within The Bahamas and its position in the wider Caribbean.', altTextStatus: 'draft_unreviewed', reviewStatus: 'ready_for_editorial_review', reviewNotes: 'Managed review asset. Confirm license-compatible placement, visible attribution, share-alike handling, map legend and scale legibility, contrast, and not-for-navigation framing before use.', caption: 'Locator map of the Ragged Island district in The Bahamas. Map by TUBS, via Wikimedia Commons, CC BY-SA 3.0.', managedAssetKey: 'wikimediaMap'}),
  imageCandidate({id: imageIds.bmotHero, title: 'Current BMOT Ragged Island page hero — rights review', subjectLabel: 'Ragged Island tourism-page hero; exact scene not identified', subjectType: 'unknown_mixed', identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile], identityNotes: 'The current official destination page displays this exact asset as its hero. The public page does not supply the exact location, creator, capture date, controlled-library record, or reuse terms.', imageUrl: urls.bmotHero, sourceAssetId: 'bmot-ragged-island-mainsite-hero-image-5f64d6b7e4e11', sourcePageUrl: urls.islandProfile, intendedUses: ['destination_hero', 'destination_gallery'], ...tourismRights, currentConditionBoundary: 'No capture date or exact scene identity is published. The image cannot establish current access, facilities, safety, accessibility, services, or conditions.', reviewNotes: 'External-only candidate. Locate the exact Brand Center asset and record its license and identity before download or selection.', caption: 'Current Bahamas.com Ragged Island hero; exact subject, creator, date, and reuse license pending.'}),
  imageCandidate({id: imageIds.bmotDuncan, title: 'BMOT Duncan Town feature image — rights review', subjectLabel: 'Duncan Town feature display; exact viewpoint not identified', subjectType: 'community', identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile], identityNotes: 'The current official destination page displays this exact asset with its Duncan Town feature. The page association is contextual and does not identify a public entrance, route, current condition, creator, or capture date.', imageUrl: urls.bmotDuncan, sourceAssetId: 'bmot-ragged-island-mainsite-island-insider-petals-images-duncan-town-5f6bd55b2c904', sourcePageUrl: urls.islandProfile, intendedUses: ['destination_gallery', 'editorial_article'], relatedPlaces: [candidateIds.duncanTown], ...tourismRights, currentConditionBoundary: 'No capture date or exact viewpoint is published. It cannot establish current roads, harbor, services, access, safety, accessibility, or settlement conditions.', reviewNotes: 'External-only candidate. Confirm exact subject and Brand Center terms before download; select a final crop before writing factual alt text.', caption: 'Current Bahamas.com Duncan Town feature display; exact viewpoint, creator, date, and reuse license pending.'}),
  imageCandidate({id: imageIds.bmotJumentos, title: 'BMOT Jumentos Cays island-hopping image — rights review', subjectLabel: 'Jumentos Cays island-hopping feature; exact cay not identified', subjectType: 'destination_geography', identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile], identityNotes: 'The current official page displays this asset for island hopping in the Jumentos Cays but does not identify the exact cay, route, operator, people, creator, or capture date.', imageUrl: urls.bmotJumentos, sourceAssetId: 'bmot-ragged-island-things-to-do-island-hopping-765x708-656510821e95a', sourcePageUrl: urls.islandProfile, intendedUses: ['destination_gallery', 'editorial_article'], relatedPlaces: [candidateIds.jumentosCays], ...tourismRights, currentConditionBoundary: 'No capture date or exact cay is published. It cannot establish current vessel access, navigation, landing permission, weather, hazards, services, or traveler conditions.', reviewNotes: 'External-only candidate. Confirm exact cay, people/property permissions, and Brand Center terms before download or use.', caption: 'Current Bahamas.com Jumentos Cays island-hopping display; exact cay, creator, date, and reuse license pending.'}),
  imageCandidate({id: imageIds.bmotHog, title: 'BMOT Hog Cay beach image — rights review', subjectLabel: 'Hog Cay beach feature; exact shoreline and date not identified', subjectType: 'place', identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile], identityNotes: 'The current official page labels this asset for Hog Cay. It does not identify the exact landing, shoreline segment, route, people, creator, or capture date.', imageUrl: urls.bmotHog, sourceAssetId: 'ragged-island-hog-cay-beach-5fac486a51849', sourcePageUrl: urls.islandProfile, intendedUses: ['destination_gallery', 'place_hero', 'place_gallery'], relatedPlaces: [placeIds.hogCay], ...tourismRights, currentConditionBoundary: 'No capture date or exact landing is published. It cannot establish current vessel access, landing permission, beach condition, safety, accessibility, services, events, or traveler suitability.', reviewNotes: 'External-only candidate. Confirm exact shoreline, rights, landing and event boundaries, and a final crop before factual alt text.', caption: 'Current Bahamas.com Hog Cay beach display; exact shoreline, creator, date, and reuse license pending.'}),
  imageCandidate({id: imageIds.bmotPigeon, title: 'BMOT Pigeon Cay image — rights review', subjectLabel: 'Pigeon Cay feature; exact site and date not identified', subjectType: 'culture_heritage', identityStatus: 'source_page_label_only', identityIds: [sourceIds.islandProfile], identityNotes: 'The current official page displays this asset for Pigeon Cay. The page does not identify the exact cay boundary, memorial site, access point, creator, capture date, or permission context.', imageUrl: urls.bmotPigeon, sourceAssetId: 'bmot-ragged-island-mainsite-things-todo-pigeon-cay-5f68f9704befe', sourcePageUrl: urls.islandProfile, intendedUses: ['destination_gallery', 'editorial_article'], relatedPlaces: [candidateIds.pigeonCay], ...tourismRights, currentConditionBoundary: 'No capture date or exact site is published. It cannot establish current vessel access, landing permission, memorial condition, cultural protocol, safety, accessibility, or traveler conditions.', reviewNotes: 'External-only candidate. Confirm exact subject, memorial permissions, cultural review, and Brand Center terms before download or use.', caption: 'Current Bahamas.com Pigeon Cay display; exact subject, creator, date, permissions, and reuse license pending.'}),
  imageCandidate({id: imageIds.legacyHero, title: 'Legacy Baha Buddy Ragged Island hero — source and rights unresolved', subjectLabel: 'Ragged Island legacy hero; exact subject unverified', subjectType: 'unknown_mixed', identityStatus: 'unverified', identityIds: [sourceIds.mediaBoundary], identityNotes: 'This exact tourism-CDN URL is referenced by the published Sanity destination and hardcoded web/mobile image maps. Its exact controlled-library record, subject, creator, capture date, current editorial status, and reuse rights are unresolved.', imageUrl: urls.legacyHero, sourceAssetId: 'bmot-ragged-island-islands-img-5f76552b68017', sourcePageUrl: urls.islandProfile, intendedUses: ['destination_hero'], ...tourismRights, rightsIds: [sourceIds.mediaBoundary], requiredCredit: 'Do not continue or expand use until the exact controlled-library asset record supplies the required credit.', currentConditionBoundary: 'The image URL remains reachable but publishes no capture date or exact destination context. It is not evidence of current place, access, services, safety, accessibility, or traveler conditions.', reviewNotes: 'P0 live-media review. Replace or formally clear the currently referenced hero through a separate approved release; this record does not change web, mobile, Supabase, or the published destination.', caption: 'Legacy Baha Buddy Ragged Island hero; exact source, subject, creator, date, and reuse license unresolved.'}),
]
const imagePlans = imageDocuments.map((planned) => {const {managedAssetKey, ...document} = planned; const current = imageById.get(document._id); return {id: document._id, current, planned: document, managedAssetKey, needsAssetUpload: Boolean(managedAssetKey && !document.reviewImage?.asset?._ref), needsUpdate: differs(current, document)}})

const placePlans = Object.entries(supabaseIds).map(([key, supabaseId]) => {
  const row = supabaseById.get(supabaseId)
  const id = placeIds[key]
  const existing = placeById.get(id)
  const published = publishedPlaceById.get(publishedPlaceIds[key])
  const planned = {...stripMeta(existing || published), _id: id, _type: 'placeEditorial', destination: destinationRef, islandName: 'Ragged Island', active: false, featured: false, channels: [], gallery: [], reviewedAt: checkedAt}
  delete planned.primaryImage
  planned.source = planned.source || {_type: 'contentSource', system: 'supabase', table: 'places', recordId: row.id, ownership: 'editorial_overlay', importedAt: new Date().toISOString()}
  planned.evidenceSources = mergeReferences(planned.evidenceSources, [sourceIds.islandProfile], 'catalog-evidence')
  const foreign = foreignCatalogKeys.has(key)
  const generic = key === 'genericIsland'
  const coordinateText = row.latitude == null || row.longitude == null ? 'missing coordinates' : `${row.latitude}, ${row.longitude}`
  planned.catalogReviewStatus = foreign ? 'island_assignment_conflict' : generic ? 'location_blocked' : 'exact_candidate'
  planned.catalogReviewNotes = foreign
    ? `Supabase row ${row.id} is assigned to Ragged Island but its address and point (${coordinateText}) place it outside The Bahamas. Keep this draft inactive and channel-free; a data operator must quarantine, correct, or reassign the canonical row after source review.`
    : generic
      ? `The row names the whole destination, has a zero coordinate, and is not a discrete attraction or routing point. Use the destination record and area geometry instead; keep this overlay inactive and channel-free.`
      : 'Hog Cay is an official tourism identity lead and the Supabase row is already draft/inactive, but it has no responsible point, route, vessel, landing, operation, safety, accessibility, or rights-cleared place media. Keep it inactive and channel-free.'
  planned.catalogLocationReview = locationReview({ids: [sourceIds.islandProfile], reconciliationStatus: generic ? 'area_identity_no_point' : 'identity_without_point', operation: foreign ? 'not_established' : 'not_applicable_natural_feature', decision: foreign ? 'rejected' : 'not_applicable', notes: planned.catalogReviewNotes})
  planned.catalogTravelerReadinessReview = travelerReview({ids: [sourceIds.islandProfile], responsible: foreign ? 'source_conflict' : 'current_official_listing_only', operation: foreign ? 'source_conflict' : 'not_applicable_identity', access: 'unresolved', copy: foreign ? 'blocked_by_source_conflict' : 'identity_only', media: 'no_approved_media', notes: foreign ? 'The row conflicts with its assigned destination and must not be delivered. Resolve the canonical record before place or media work.' : 'Identity or catalog presence does not establish a safe visitor route. Verify the responsible point or area model, vessel or guide, landing and permissions, operation, conditions, safety, accessibility, emergency fallback, and place-level media rights.'})
  planned.catalogContentReadinessReview = contentReview({ids: [sourceIds.islandProfile], foundation: foreign ? 'blocked_by_conflict' : 'identity_only', notes: 'No exact place-level image has documented reusable rights and reviewed alt text. Broad destination geography images cannot substitute for exact place identity, access, operation, safety, accessibility, or media evidence.'})
  return {id, current: existing, planned, needsUpdate: differs(existing, planned)}
})

const existingDuncan = stripMeta(candidateById.get(candidateIds.duncanTown))
const existingJumentos = stripMeta(candidateById.get(candidateIds.jumentosCays))
const existingPigeon = stripMeta(candidateById.get(candidateIds.pigeonCay))
const candidateDocuments = [
  {...existingDuncan, locationReview: locationReview({ids: [sourceIds.islandProfile, sourceIds.publicMap], reconciliationStatus: 'area_identity_no_point', operation: 'not_applicable_natural_feature', access: 'partial_official_context', notes: 'Duncan Town is a settlement/community identity, not a universal point. The tourism map pin is contextual evidence only and must not be treated as a public building, dock, entrance, safe route, or emergency rendezvous point.'}), reviewedAt: checkedAt, reviewNotes: 'Use an area/community model. Verify exact airport and dock transfer points, roads, lodging, provisioning, communications, safety, emergency coverage, accessibility, and current conditions before traveler delivery. The current tourism image remains external-only pending exact Brand Center rights.'},
  {...existingJumentos, locationReview: locationReview({ids: [sourceIds.islandProfile, sourceIds.publicMap], reconciliationStatus: 'area_identity_no_point', operation: 'not_applicable_natural_feature', access: 'unresolved', notes: 'The Jumentos Cays are a chain/area identity, not one canonical point. The tourism marker is contextual only and does not establish a navigable route, landing, anchorage, permission, safe depth, or emergency point.'}), reviewedAt: checkedAt, reviewNotes: 'Use an area/chain model. Verify exact cay, vessel or guide, landing/anchorage, permissions, marine rules, weather, tides/depth, safety, emergency communications, accessibility, and current conditions before traveler delivery.'},
  {...existingPigeon, locationReview: locationReview({ids: [sourceIds.islandProfile], reconciliationStatus: 'identity_without_point', operation: 'not_applicable_natural_feature', access: 'unresolved', notes: 'Pigeon Cay is an official identity lead with no responsibly verified site, landing, memorial point, or route. Do not infer a point from imagery or broad destination text.'}), reviewedAt: checkedAt, reviewNotes: 'Confirm the exact cay and memorial site, responsible cultural or land authority, landing permission, vessel or guide, route, memorial protocol, photography, safety, accessibility, emergency communications, and current condition before delivery.'},
  candidate({id: candidateIds.lostKey, title: 'Lost Key Lodge', slug: 'lost-key-lodge', featureType: 'accommodation_property', categoryProposal: 'hotel', officialSourceName: 'Lost Key Fishing Lodge & Resort', ids: [sourceIds.lostKey, sourceIds.lostKeyCorroboration, sourceIds.lostKeyTin], identityBoundary: 'A direct operator site, marketplace profile, and dated government register support a Ragged Island/Duncan Town lodge identity. They do not yet resolve the exact current capacity, inventory, operation, transport, or point.', location: locationReview({ids: [sourceIds.lostKey, sourceIds.lostKeyTin], reconciliationStatus: 'identity_without_point', operation: 'current_responsible_operator', access: 'partial_official_context', notes: 'The operator and dated register support Duncan Town context and a street-address lead, but no exact entrance or responsibly sourced coordinate is approved.'}), traveler: travelerReview({ids: [sourceIds.lostKey, sourceIds.lostKeyCorroboration, sourceIds.lostKeyTin], responsible: 'source_conflict', operation: 'source_conflict', access: 'source_conflict', copy: 'blocked_by_source_conflict', notes: 'The direct site says four anglers while the marketplace says ten guests/five rooms. Confirm exact current operation, property identity, point, capacity, inventory, charter and transfers, safety, accessibility, pricing, cancellation, and emergency fallback directly.'}), content: contentReview({ids: [sourceIds.lostKey, sourceIds.lostKeyCorroboration, sourceIds.lostKeyTin], foundation: 'blocked_by_conflict', notes: 'Identity is credible but current operation and capacity conflict. No operator image has a recorded reusable license or approved factual alt text.'}), reviewNotes: 'Do not create or activate a Supabase place from this draft. First reconcile the direct and marketplace capacity claims and verify exact property identity, point, operation, access, safety, accessibility, cancellation, emergency response, and media rights.', sourceAdjudicationStatus: 'responsible_operator_no_point'}),
  candidate({id: candidateIds.alvinMunroe, title: 'Alvin Munroe', slug: 'alvin-munroe', featureType: 'activity_operator', categoryProposal: 'activity', officialSourceName: 'Alvin Munroe', ids: [sourceIds.alvinMunroe], identityBoundary: 'The national-tourism listing identifies a named Ragged Island guide/operator and several activity themes. It does not establish a fixed attraction point, live availability, licensing, vessel, or current operating package.', location: locationReview({ids: [sourceIds.alvinMunroe], reconciliationStatus: 'identity_without_point', operation: 'current_official_listing_only', access: 'unresolved', notes: 'The listing supplies Duncan Town context and a club/address lead but no approved meeting point, dock, vessel location, or route.'}), traveler: travelerReview({ids: [sourceIds.alvinMunroe], responsible: 'current_official_listing_only', operation: 'current_official_listing_only', access: 'unresolved', copy: 'identity_only', media: 'source_media_not_cleared', notes: 'Confirm direct current operation, licensing, services, vessel, capacity, meeting and return points, weather limits, safety equipment, emergency communications, accessibility, price, cancellation, and availability.'}), content: contentReview({ids: [sourceIds.alvinMunroe], notes: 'The tourism listing supports identity and activity leads only. No direct operator evidence or reusable image license has been recorded.'}), reviewNotes: 'Keep as a research-only operator candidate. Obtain direct responsible confirmation before any recommendation, contact display, booking flow, location, or media use.', sourceAdjudicationStatus: 'responsible_operator_no_point'}),
  candidate({id: candidateIds.manOWarTower, title: 'Man-O-War Tower', slug: 'man-o-war-tower', featureType: 'lighthouse', categoryProposal: 'attraction', officialSourceName: 'Man-O-War Tower', ids: [sourceIds.manOWarTower], identityBoundary: 'The official listing identifies a tower/beacon and memorial site southeast of Duncan Town. Relative location and descriptive context do not establish an exact approved point, public entrance, climb permission, or current operation.', location: locationReview({ids: [sourceIds.manOWarTower], reconciliationStatus: 'official_identity_source_no_point', operation: 'current_official_listing_only', access: 'partial_official_context', notes: 'The source gives a relative distance and direction from Duncan Town but no exact responsible point. Do not geocode the prose or infer an entrance or trailhead.'}), traveler: travelerReview({ids: [sourceIds.manOWarTower], responsible: 'current_official_listing_only', operation: 'current_official_listing_only', access: 'partial_official_context', copy: 'identity_only', media: 'source_media_not_cleared', notes: 'Confirm the responsible authority, exact site and trail, current beacon/site status, legal access, climbing permission, stair and surface condition, hazards, safety, accessibility, emergency response, and cultural protocol.'}), content: contentReview({ids: [sourceIds.manOWarTower], notes: 'The source supports identity and descriptive leads but not delivery-safe access, safety, accessibility, or reusable media.'}), reviewNotes: 'Keep as a research-only candidate. Do not create a point from relative prose; obtain responsible location, operation, access, safety, accessibility, and media evidence first.', sourceAdjudicationStatus: 'relative_identity_no_point'}),
]
const candidatePlans = candidateDocuments.map((planned) => ({id: planned._id, current: candidateById.get(planned._id), planned, needsUpdate: differs(candidateById.get(planned._id), planned)}))

const factDocuments = [
  fact({id: factIds.media, title: 'Ragged Island: image identity and rights boundary', topic: 'overview', claim: 'The published Sanity destination and hardcoded web/mobile maps reference the same legacy tourism-CDN hero, but its exact asset record, subject, creator, capture date, and reuse terms are not recorded. Two exact NASA geography images and one CC BY-SA locator map have documented reuse terms and managed review copies; six current or legacy tourism images remain external-only pending exact Brand Center records.', guidance: 'Do not expand use of or copy the tourism-CDN images. Editors may review the managed NASA and licensed map assets with their credits, current-condition boundaries, and draft alt text, then make a separate placement decision.', ids: [sourceIds.islandProfile, sourceIds.mediaBoundary, sourceIds.nasaRange, sourceIds.nasaDuncan, sourceIds.nasaTerms, sourceIds.wikimediaMap]}),
  fact({id: factIds.air, title: 'Ragged Island: air access requires private-charter and live aerodrome verification', topic: 'access', claim: 'The current national-tourism flying page says there are no commercial flights to Ragged Island and points travelers toward private charter. The January 2026 CAA-B register identifies Duncan Town/Ragged Island aerodrome as MYRD, runway 13/31, 1,158 by 23 metres asphalt, VFR, CAT 0, sunrise-to-sunset VMC, with no port of entry and no fuel.', guidance: 'Treat the register as dated facility evidence, not live readiness. Confirm charter, runway and NOTAM status, daylight/weather limits, fire/EMS, immigration routing, baggage, assistance, ground or marine transfer, and disruption fallback for the exact trip.', ids: [sourceIds.flightTables, sourceIds.aerodromeRegister], confidence: 'high'}),
  fact({id: factIds.turtle, title: 'Ragged Island: turtle-soup tourism copy conflicts with current fisheries regulation', topic: 'food', claim: 'The current official Ragged Island tourism page promotes turtle soup. The reviewed official Fisheries Resources regulation states that no person shall take, possess, buy, or sell a marine turtle, turtle part, or turtle egg, with a separate research-or-education permit provision. The tourism food claim is therefore unsafe for Baha Buddy to repeat.', guidance: 'Do not recommend, normalize, or source turtle soup. Recheck the current consolidated law and route legal or enforcement questions to the competent Bahamas authority; this record is not legal advice.', ids: [sourceIds.islandProfile, sourceIds.turtleLaw], confidence: 'high'}),
  fact({id: factIds.lostKey, title: 'Ragged Island: Lost Key Lodge identity is credible but current capacity conflicts', topic: 'stays', claim: 'A direct operator site and a dated government register support a Lost Key lodge identity in Duncan Town. The direct site describes a maximum of four anglers, while a current marketplace profile describes ten guests in five rooms. No exact current capacity or inventory is approved.', guidance: 'Confirm current operation, exact property identity, capacity, rooms, access and charter responsibility, transfers, safety, accessibility, price, cancellation, emergency fallback, and image rights directly before planning or recommendation.', ids: [sourceIds.lostKey, sourceIds.lostKeyCorroboration, sourceIds.lostKeyTin], confidence: 'high'}),
  fact({id: factIds.catalog, title: 'Ragged Island: current catalog and public-copy delivery boundary', topic: 'overview', claim: 'Eight of ten Ragged Island Supabase rows have foreign addresses and coordinates outside The Bahamas. A ninth is a zero-coordinate record for the destination itself, and Hog Cay is an inactive identity lead without a responsible point or traveler-readiness package. Current public copy also uses unsupported “off-grid,” pristine, best-for, fishing-quality, and broad suitability language.', guidance: 'Do not use the foreign or zero-coordinate rows for recommendations or routing. Preserve Duncan Town and Jumentos as areas, and keep Hog Cay, Pigeon Cay, Man-O-War Tower, Lost Key Lodge, and Alvin Munroe behind exact identity, operation, access, safety, accessibility, media, and editorial gates.', ids: [sourceIds.islandProfile, sourceIds.publicMap, sourceIds.lostKey, sourceIds.alvinMunroe, sourceIds.manOWarTower], confidence: 'high'}),
]
const factPlans = factDocuments.map((planned) => ({id: planned._id, current: factById.get(planned._id), planned, needsUpdate: differs(factById.get(planned._id), planned)}))

const coverage = [
  ['overview', 2, 'Official identity and named features are strong; legacy hero rights, public superlatives, suitability, and catalog contamination block delivery.'],
  ['access', 2, 'Official pages and the 2026 aerodrome register establish a no-commercial-flight/private-charter boundary and facility constraints, but live charter and transfer readiness are unresolved.'],
  ['stays', 1, 'Lost Key identity is credible, but direct and marketplace capacity claims conflict and no canonical property record or complete readiness package exists.'],
  ['food', 0, 'No verified current local food provider exists, and current tourism turtle-soup copy conflicts with reviewed fisheries regulation.'],
  ['experiences', 1, 'Named guide and activity themes exist, but provider, vessel, licensing, route, safety, accessibility, and live-operation evidence are incomplete.'],
  ['nature', 1, 'Named cays and geography imagery exist; exact areas, landings, marine conditions, rules, safety, accessibility, and current state remain incomplete.'],
  ['culture', 1, 'Duncan Town, salt-pond, tower, and memorial identities exist; responsible authority, access, protocol, safety, accessibility, and current condition remain open.'],
  ['seasonality', 1, 'General weather evidence does not resolve trip-date charter, marine, runway, landing, or evacuation disruption.'],
  ['safety', 1, 'Dated facility and general emergency baselines exist, but current local response, communications, marine, airport, shelter, and evacuation readiness remain open.'],
  ['accessibility', 0, 'No complete responsible airport, charter, vessel, transfer, lodging, guide, trail, site, beach, or community accessibility package exists.'],
].map(([topic, score, finding], index) => ({_type: 'researchCoverageScore', _key: `coverage-${index + 1}-${topic}`, topic, score, evidenceCount: 0, finding}))

const gaps = [
  ['Published and hardcoded destination hero lacks an asset-specific reuse record', 'media', 'p0', 'Locate the exact Brand Center asset or replace it through a separately approved release; record subject, creator, date, license, channels, alterations, credit, and alt text.'],
  ['Eight active Supabase rows are foreign place-name collisions', 'places', 'p0', 'A data operator must quarantine, correct, or reassign all eight rows after source review; do not merge or delete automatically.'],
  ['Active zero-coordinate Ragged Island row is not a discrete attraction', 'places', 'p0', 'Use the destination and area model instead; quarantine or retire the generic canonical row through a separately approved Supabase change.'],
  ['Turtle-soup tourism copy conflicts with marine-turtle regulation', 'food', 'p0', 'Block the food claim, recheck the current consolidated law and competent authority, and request a responsible editorial correction without giving legal advice.'],
  ['No-commercial-flight access lacks an accountable live charter and transfer package', 'access', 'p0', 'Confirm charter, runway/NOTAM, daylight and weather limits, port-of-entry routing, fire/EMS, baggage, assistance, ground/marine transfer, and disruption fallback.'],
  ['Lost Key Lodge operation and capacity remain source-conflicted', 'stays', 'p0', 'Reconcile four anglers versus ten guests/five rooms directly and verify exact property, point, operation, inventory, transport, safety, accessibility, cancellation, and media rights.'],
  ['Duncan Town and Jumentos require area models rather than universal routing points', 'places', 'p0', 'Keep tourism map pins contextual; establish exact purpose-specific airport, dock, meeting, landing, emergency, and service points separately.'],
  ['Hog Cay, Pigeon Cay, and Man-O-War Tower lack responsible access and safety packages', 'places', 'p0', 'Confirm exact identity/area, point if appropriate, responsible authority/operator, vessel/trail/landing, permissions, hazards, accessibility, emergency communications, and current condition.'],
  ['No Ragged Island canonical place is verified for traveler delivery', 'places', 'p0', 'Resolve exact identity, destination, duplicate, point/area model, current operation, access, copy, media, safety, accessibility, and verification before any channel.'],
  ['Tourism image candidates need exact controlled-library licenses', 'media', 'p1', 'Find the current hero, Duncan Town, Jumentos, Hog Cay, Pigeon Cay, and legacy hero in the Brand Center and record exact identity, asset IDs, rights, credits, channels, and alterations.'],
  ['Rights-documented geography images need editorial placement review', 'media', 'p1', 'Review the two managed NASA images and CC BY-SA locator map for crop, mobile safe area, factual framing, age boundary, credit, license, contrast, alt text, and destination fit.'],
  ['Exact stays, food, access, activity, culture, and current-condition image coverage is missing', 'media', 'p1', 'Research operator-owned, directly permitted, controlled-library, government-reuse, or open-license media for every approved exact place; do not substitute broad geography imagery.'],
].map(([title, topic, priority, action], index) => ({_type: 'researchGap', _key: `gap-${index + 1}`, title, topic, priority, action, status: 'researching'}))

const auditDocument = {_id: auditId, _type: 'islandResearchAudit', title: 'Ragged Island evidence, catalog, copy and image review — 2026-08-05', destination: destinationRef, auditedAt: checkedAt, nextAuditAt: nextOperationalReviewAt, owner: 'Baha Buddy Content Operations', status: 'researching', overallScore: 1.1, coverage, gaps, sources: references([sourceIds.islandProfile, sourceIds.flightTables, sourceIds.aerodromeRegister, sourceIds.publicMap, sourceIds.mediaBoundary, sourceIds.lostKey, sourceIds.lostKeyCorroboration, sourceIds.lostKeyTin, sourceIds.alvinMunroe, sourceIds.manOWarTower, sourceIds.turtleLaw, sourceIds.nasaRange, sourceIds.nasaDuncan, sourceIds.nasaTerms, sourceIds.wikimediaMap], 'source'), methodologyNotes: 'This bounded review directly profiles current Supabase rows, raw-perspective Sanity, hardcoded web/mobile copy and image maps, current national-tourism and operator pages, the 2026 CAA-B register, the official fisheries regulation, a dated government TIN register, NASA/JSC image and rights records, and a Commons file record. It records exact image URLs, identity, rights status, credit, intended use, age/current-condition boundaries, and review-only alt text. It uploads only three images with documented NASA or CC BY-SA reuse terms. It does not mutate Supabase, publish content, accept a coordinate, enable delivery channels, copy uncleared tourism imagery, contact an external party, approve a provider, route, schedule, operation, legal interpretation, accessibility claim, or traveler delivery.'}
const auditPlan = {id: auditId, current: live.audit, planned: auditDocument, needsUpdate: differs(live.audit, auditDocument)}

const destinationDraft = {_id: destinationDraftId, _type: 'destination', name: 'Ragged Island', slug: {_type: 'slug', current: 'ragged-island'}, islandId: 'ragged-island', routeAliases: live.destinationPublished.routeAliases || [], tagline: 'Great Ragged Island, Duncan Town, and the Jumentos Cays—plan each route and landing separately.', overview: [block('ragged-overview-1', 'Ragged Island is a far-southern island chain whose only settlement is Duncan Town on Great Ragged Island. Duncan Town, the Jumentos Cays, Hog Cay, Pigeon Cay, and Man-O-War Tower are distinct planning identities; none should inherit a single destination point or generic access route.'), block('ragged-overview-2', 'The current official flying page reports no commercial flights to Ragged Island. Private charter and boat access remain date-specific operational questions, and every airport, dock, transfer, vessel, landing, accommodation, activity, safety, accessibility, and emergency detail requires current responsible confirmation.')], highlights: [
  {_type: 'destinationHighlight', _key: 'highlight-duncan-town', label: 'Duncan Town', description: 'Settlement/community identity; use purpose-specific airport, dock, meeting, service, and emergency points rather than one universal pin.'},
  {_type: 'destinationHighlight', _key: 'highlight-jumentos', label: 'Jumentos Cays', description: 'Island-chain identity; verify the exact cay, vessel, landing or anchorage, permission, marine conditions, safety, accessibility, and fallback.'},
  {_type: 'destinationHighlight', _key: 'highlight-hog-cay', label: 'Hog Cay', description: 'Official identity lead; exact landing, event status, permissions, route, safety, accessibility, and current conditions remain open.'},
  {_type: 'destinationHighlight', _key: 'highlight-pigeon-cay', label: 'Pigeon Cay', description: 'Official identity and memorial lead; exact site, cultural protocol, vessel access, landing, permissions, safety, and accessibility remain open.'},
  {_type: 'destinationHighlight', _key: 'highlight-man-o-war', label: 'Man-O-War Tower', description: 'Official relative-location lead; responsible authority, exact point, trail, climbing rules, condition, safety, and accessibility remain open.'},
], gettingThere: 'The current national-tourism flying page reports no commercial flights to Ragged Island and points travelers toward private charter. The January 2026 CAA-B register identifies Duncan Town/Ragged Island aerodrome as MYRD (DCT), VFR, sunrise-to-sunset VMC, CAT 0, with no port of entry and no fuel. Verify live charter, runway and NOTAM status, daylight/weather, fire/EMS, immigration routing, baggage and assistance, exact airport/dock transfer, onward vessel or ground transport, and disruption fallback.', airports: [{_type: 'gateway', _key: 'airport-dct', code: 'DCT', name: 'Duncan Town / Ragged Island Airport', type: 'airport', note: 'ICAO MYRD. Dated facility evidence only; no commercial service is claimed. Verify live runway/NOTAM, charter, daylight/weather, fire/EMS, port-of-entry routing, fuel planning, transfers, assistance, and fallback.'}], tripFit: {_type: 'object', vibe: 'Remote island-chain planning with charter and marine dependencies'}, practicalNotes: [block('ragged-practical-1', 'State the traveler’s exact island, cay, settlement, landing, accommodation, and activity before planning access or emergency support. A destination label or representative map pin does not prove a safe route or same-island service.'), block('ragged-practical-2', 'Recheck charter and vessel operators, airport and runway status, transfers, accommodation, provisioning, activities, marine rules, landings and permissions, tides and weather, emergency communications, accessibility, prices, cancellation, and fallback for the traveler’s dates.'), block('ragged-practical-3', 'Do not recommend turtle soup. Current tourism copy conflicts with the reviewed official marine-turtle prohibition; route legal questions to the competent Bahamas authority.')], gallery: [], faqs: [], featured: false, order: live.destinationPublished.order ?? 99, channels: live.destinationPublished.channels || ['web', 'mobile', 'buddy'], reviewedAt: checkedAt, source: {...live.destinationPublished.source, notes: 'Review-only corrective draft. It removes the uncleared legacy hero, unsupported fishing-quality, pristine, off-grid, best-for, and broad boat-access claims; adds the current turtle-law conflict; and keeps every operational claim behind responsible verification. Published Sanity and hardcoded web/mobile content remain unchanged until separate approval and release.'}, seo: {_type: 'seo', metaTitle: 'Ragged Island', metaDescription: 'Plan Ragged Island with exact charter, airport, cay, vessel, landing, stay, safety, accessibility and emergency checks.'}, evidenceSources: references([sourceIds.islandProfile, sourceIds.flightTables, sourceIds.aerodromeRegister, sourceIds.turtleLaw, sourceIds.lostKey, sourceIds.alvinMunroe, sourceIds.manOWarTower], 'evidence-source'), editorialReviewStatus: 'blocked', editorialReviewNotes: 'Review with the evidence-and-image queue. Select a rights-documented image separately. Verify every live charter, vessel, transfer, provider, route, operation, landing, permission, safety, accessibility, cancellation, price, and emergency claim before publication.'}
const destinationPlan = {id: destinationDraftId, current: live.destinationDraft, planned: destinationDraft, needsUpdate: differs(live.destinationDraft, destinationDraft)}

const allDocumentPlans = [...sourcePlans, ...placePlans, ...candidatePlans, ...imagePlans, ...factPlans, auditPlan, destinationPlan]
const guardrails = {
  exactSupabaseRowCount: supabaseRows.length === 10,
  noSupabaseMedia: supabaseRows.every((row) => !row.primary_image_url && (!Array.isArray(row.gallery_images) || row.gallery_images.length === 0)),
  eightForeignActiveCollisions: [...foreignCatalogKeys].every((key) => supabaseById.get(supabaseIds[key])?.is_active === true),
  genericActiveRowHasZeroPoint: supabaseById.get(supabaseIds.genericIsland)?.is_active === true && Number(supabaseById.get(supabaseIds.genericIsland)?.latitude) === 0 && Number(supabaseById.get(supabaseIds.genericIsland)?.longitude) === 0,
  hogCayAlreadyDraftInactive: supabaseById.get(supabaseIds.hogCay)?.status === 'draft' && supabaseById.get(supabaseIds.hogCay)?.is_active === false,
  publishedHeroMatchesHardcodedLegacyUrl: live.destinationPublished.heroImage?.externalUrl === urls.legacyHero && publicCopySignals.webLegacyImage && publicCopySignals.mobileLegacyImage,
  everyPlaceCorrectionIsDraftInactiveAndChannelFree: placePlans.every((item) => item.id.startsWith('drafts.') && item.planned.active === false && item.planned.channels.length === 0),
  everyFactIsDraftAndChannelFree: factPlans.every((item) => item.id.startsWith('drafts.') && item.planned.channels.length === 0),
  everyCandidateIsDraftResearching: candidatePlans.every((item) => item.id.startsWith('drafts.') && item.planned.canonicalCreationStatus === 'researching'),
  everyImageCandidateIsDraftAndResearchOnly: imagePlans.every((item) => item.id.startsWith('drafts.') && item.planned.approvalStatus === 'research_only'),
  onlyRightsDocumentedImagesPlannedForUpload: imagePlans.filter((item) => item.needsAssetUpload).every((item) => ['public_domain_or_government_reuse_terms', 'documented_open_license', 'direct_permission_recorded'].includes(item.planned.rightsStatus)),
  externalTourismImagesRemainUnmanaged: imagePlans.filter((item) => item.planned.rightsStatus === 'controlled_library_asset_license_required').every((item) => !item.planned.reviewImage?.asset?._ref),
  noPublishedImageCandidates: live.publishedImageCandidates === 0,
  existingPortfolioHasNoPublishedResearchFacts: live.publishedFacts === 0,
  existingRaggedFactDraftsHaveNoChannels: live.raggedFactChannels === 0,
}
if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const plan = {generatedAt: new Date().toISOString(), mode: apply ? 'apply' : 'dry-run', output: outputPath, sourceSignals, publicCopySignals, externalStatuses, documentStatuses, counts: {newSourcesToCreate: sourcePlans.filter((item) => !item.current && item.needsUpdate).length, existingSourcesToUpdate: sourcePlans.filter((item) => item.current && item.needsUpdate).length, placeDraftsToCreateOrUpdate: placePlans.filter((item) => item.needsUpdate).length, candidateDraftsToCreateOrUpdate: candidatePlans.filter((item) => item.needsUpdate).length, imageDraftsToCreateOrUpdate: imagePlans.filter((item) => item.needsUpdate).length, managedAssetsToUpload: imagePlans.filter((item) => item.needsAssetUpload).length, externalOnlyImagesNotCopied: imagePlans.filter((item) => !item.managedAssetKey).length, factDraftsToCreateOrUpdate: factPlans.filter((item) => item.needsUpdate).length, auditDraftsToCreateOrUpdate: Number(auditPlan.needsUpdate), destinationDraftsToCreateOrUpdate: Number(destinationPlan.needsUpdate)}, guardrails, changes: {sourceIds: sourcePlans.filter((item) => item.needsUpdate).map((item) => item.id), placeIds: placePlans.filter((item) => item.needsUpdate).map((item) => item.id), candidateIds: candidatePlans.filter((item) => item.needsUpdate).map((item) => item.id), imageIds: imagePlans.filter((item) => item.needsUpdate || item.needsAssetUpload).map((item) => item.id), assetUploads: imagePlans.filter((item) => item.needsAssetUpload).map((item) => managedAssetDefinitions[item.managedAssetKey].filename), factIds: factPlans.filter((item) => item.needsUpdate).map((item) => item.id), auditIds: auditPlan.needsUpdate ? [auditId] : [], destinationIds: destinationPlan.needsUpdate ? [destinationDraftId] : []}, boundary: 'This alignment updates live/internal source records and review-only Ragged Island drafts. It uploads only three exact images with documented NASA or CC BY-SA reuse terms and keeps six tourism-CDN candidates external-only. It does not mutate Supabase, publish content, accept a coordinate, change hardcoded web/mobile copy, enable delivery channels on research facts or places, contact an external party, copy uncleared media, approve a route, schedule, provider, operation, legal interpretation, accessibility claim, or traveler delivery.'}

if (apply) {
  const uploadedAssets = []
  for (const item of imagePlans.filter((candidatePlan) => candidatePlan.needsAssetUpload)) {
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
  for (const item of allDocumentPlans.filter((candidatePlan) => candidatePlan.needsUpdate)) {
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
