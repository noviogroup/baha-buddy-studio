#!/usr/bin/env node

/**
 * Analysis: 16-island editorial research baseline
 * Date: 2026-08-04
 * Data source: the current content migration snapshot generated from approved
 * public/editorial Supabase tables plus existing Sanity documents.
 *
 * The script deliberately keeps table-level counts separate before joining by
 * canonical destination ID. It never reads traveler, booking, payment, or auth data.
 */

import fs from 'node:fs'

const inputPath = process.argv[2] || '/private/tmp/baha-buddy-sanity-content-import.ndjson'
const outputBase = process.argv[3] || '/private/tmp/baha-buddy-island-research-baseline'
const checkedAt = '2026-08-04'
const operationalReviewAt = '2026-11-02'
const annualReviewAt = '2027-08-04'

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

async function fetchCurrentPlaces() {
  const env = loadEnv(new URL('../../bahabuddy-web/.env.local', import.meta.url))
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')
  const fields = 'id,name,category,island_id,island_name,address,latitude,longitude,status,is_active,is_verified,description,short_description,primary_image_url,gallery_images'
  const rows = []
  for (let start = 0; ; start += 1000) {
    const response = await fetch(`${url}/rest/v1/places?select=${fields}`, {
      headers: {apikey: key, Authorization: `Bearer ${key}`, Range: `${start}-${start + 999}`},
    })
    if (!response.ok) throw new Error(`places: ${response.status} ${(await response.text()).slice(0, 200)}`)
    const page = await response.json()
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

if (!fs.existsSync(inputPath)) {
  throw new Error(`Missing ${inputPath}. Run npm run content:build-import first.`)
}

const documents = fs.readFileSync(inputPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
const currentPlaces = await fetchCurrentPlaces()
const destinations = documents.filter((item) => item._type === 'destination')
const destinationById = new Map(destinations.map((item) => [item._id.replace(/^drafts\./, ''), item]))

const officialIslands = [
  {slug: 'abacos', page: 'abacos', theme: 'boating, fishing, sailing, colonial settlements, and cay-to-cay travel', highlights: ['Elbow Reef Lighthouse', 'Man-O-War Cay', 'Tahiti Beach', 'Hope Town'], gateways: ['TCB', 'MHH', 'YAS']},
  {slug: 'acklins-crooked-island', page: 'acklins-crooked-island', theme: 'seclusion, bonefishing, birdwatching, Long Cay, and the Bight of Acklins', highlights: ['The Bight of Acklins', 'Ancient Lucayan Sites', 'Long Cay', 'Turtle Sound'], gateways: ['AXP', 'PWN', 'CRI']},
  {slug: 'andros', page: 'andros', theme: 'blue holes, reefs, underwater wrecks, forests, and nature-based travel', highlights: ['Blue Holes National Park', 'West Side National Park', 'Andros Barrier Reef', 'Androsia Batik Factory'], gateways: ['ASD', 'SAQ', 'TZN']},
  {slug: 'berry-islands', page: 'berry-islands', theme: 'marine life, fishing, largely uninhabited cays, beaches, and blue-hole exploration', highlights: ['Chub Cay', 'Sugar Beach', 'Hoffman’s Cay Blue Hole', 'Flo’s Conch Bar'], gateways: ['GHC', 'CCZ']},
  {slug: 'bimini', page: 'bimini', theme: 'sport fishing, diving, shipwrecks, sharks, and maritime history', highlights: ['Dolphin House Museum', 'Bimini Road', 'Fountain of Youth', 'SS Sapona Shipwreck'], gateways: ['BIM', 'NSB']},
  {slug: 'cat-island', page: 'cat-island', theme: 'quiet beaches, watersports, hiking, music, and historical sites', highlights: ['Mount Alvernia and The Hermitage', 'Sir Sidney Poitier’s Boyhood Home', 'Old Bight Beach', 'Port Howe'], gateways: ['TBI']},
  {slug: 'eleuthera-harbour-island', page: 'eleuthera-harbour-island', theme: 'distinct Eleuthera, Harbour Island, and Spanish Wells experiences connected by road and water', highlights: ['Glass Window Bridge', 'Pineapple Fields', 'Pink Sands Beach', 'Spanish Wells'], gateways: ['GHB', 'ELH']},
  {slug: 'the-exumas', page: 'the-exumas', theme: 'island hopping, clear water, secluded cays, protected marine areas, and the swimming pigs', highlights: ['Big Major Cay', 'Thunderball Grotto', 'Compass Cay Marina', 'Exuma Cays Land & Sea Park'], gateways: ['GGT', 'TYM']},
  {slug: 'grand-bahama', page: 'freeport-grand-bahama-island', theme: 'Freeport amenities alongside mangroves, caves, pine forests, beaches, and national parks', highlights: ['Peterson Cay National Park', 'Port Lucaya Marketplace', 'Lucayan National Park', 'Gold Rock Beach'], gateways: ['FPO', 'Lucayan Harbour']},
  {slug: 'inagua', page: 'inagua', theme: 'birdwatching, protected habitats, flamingos, lighthouses, and remote nature travel', highlights: ['Inagua National Park', 'Little Inagua National Park', 'Great Inagua Lighthouse', 'Union Creek Reserve'], gateways: ['IGA']},
  {slug: 'long-island', page: 'long-island', theme: 'bonefishing, reefs, blue holes, beaches, and a quiet land-based pace', highlights: ['Dean’s Blue Hole', 'Cape Santa Maria Beach', 'Columbus Point', 'Twin Churches'], gateways: ['SML', 'LGI']},
  {slug: 'mayaguana', page: 'mayaguana', theme: 'seclusion, low-density beaches, fishing, and outdoor exploration', highlights: ['Booby Cay', 'Abraham’s Bay', 'Horse Pond Beach', 'Pirates Well'], gateways: ['MYG']},
  {slug: 'nassau-paradise-island', page: 'nassau-paradise-island', theme: 'capital-city culture, major visitor infrastructure, historical sites, and nearby resort experiences', highlights: ['National Art Gallery of The Bahamas', 'Queen’s Staircase', 'Fort Fincastle', 'Government House'], gateways: ['NAS', 'Prince George Wharf']},
  {slug: 'ragged-island', page: 'ragged-island', theme: 'Duncan Town, fishing, sparsely populated cays, and remote-island travel', highlights: ['Duncan Town', 'Jumentos Cays', 'Hog Cay', 'Pigeon Cay'], gateways: ['DCT']},
  {slug: 'rum-cay', page: 'rum-cay', theme: 'quiet beaches, reefs, diving, Lucayan history, and access to Conception Island', highlights: ['Port Nelson', 'HMS Conqueror Shipwreck', 'Conception Island National Park', 'Hartford Cave'], gateways: ['RCY']},
  {slug: 'san-salvador', page: 'san-salvador', theme: 'historical monuments, lakes, beaches, diving, and protected nature', highlights: ['Southern Great Lake National Park', 'Watling’s Blue Hole', 'Gerace Research Centre', 'Bonefish Bay Beach'], gateways: ['ZSA']},
]

const officialBySlug = new Map(officialIslands.map((item) => [item.slug, item]))
const floors = new Map([
  ['nassau-paradise-island', 120],
  ...['grand-bahama', 'bimini', 'abacos', 'eleuthera-harbour-island', 'the-exumas', 'andros'].map((slug) => [slug, 72]),
  ...['berry-islands', 'long-island', 'cat-island', 'san-salvador'].map((slug) => [slug, 42]),
  ...['rum-cay', 'ragged-island', 'mayaguana', 'inagua', 'acklins-crooked-island'].map((slug) => [slug, 25]),
])

const islandAliases = new Map([
  ['abaco', 'abacos'], ['the-abacos', 'abacos'], ['the abacos', 'abacos'],
  ['exuma', 'the-exumas'], ['exumas', 'the-exumas'], ['the exumas', 'the-exumas'],
  ['nassau', 'nassau-paradise-island'], ['paradise-island', 'nassau-paradise-island'], ['paradise island', 'nassau-paradise-island'],
  ['freeport', 'grand-bahama'], ['freeport-grand-bahama', 'grand-bahama'],
  ['eleuthera', 'eleuthera-harbour-island'], ['harbour-island', 'eleuthera-harbour-island'], ['harbor-island', 'eleuthera-harbour-island'],
])

const islandBounds = {
  'nassau-paradise-island': {minLatitude: 24.75, maxLatitude: 25.35, minLongitude: -77.8, maxLongitude: -76.9},
  'grand-bahama': {minLatitude: 26.1, maxLatitude: 27.1, minLongitude: -79.7, maxLongitude: -77.5},
  bimini: {minLatitude: 25.35, maxLatitude: 26.1, minLongitude: -79.6, maxLongitude: -78.9},
  abacos: {minLatitude: 25.3, maxLatitude: 27.1, minLongitude: -78.2, maxLongitude: -76.6},
  'berry-islands': {minLatitude: 25.2, maxLatitude: 26.2, minLongitude: -78.5, maxLongitude: -77.3},
  'eleuthera-harbour-island': {minLatitude: 24.2, maxLatitude: 26, minLongitude: -77.1, maxLongitude: -75.5},
  'the-exumas': {minLatitude: 23, maxLatitude: 25.5, minLongitude: -77, maxLongitude: -75},
  andros: {minLatitude: 23, maxLatitude: 25.5, minLongitude: -78.8, maxLongitude: -76.1},
  'long-island': {minLatitude: 22.5, maxLatitude: 24.3, minLongitude: -75.8, maxLongitude: -74.6},
  'cat-island': {minLatitude: 23.9, maxLatitude: 25.2, minLongitude: -76.1, maxLongitude: -74.9},
  'san-salvador': {minLatitude: 23.6, maxLatitude: 24.5, minLongitude: -74.9, maxLongitude: -74},
  'rum-cay': {minLatitude: 23.2, maxLatitude: 24, minLongitude: -75.2, maxLongitude: -74.4},
  'ragged-island': {minLatitude: 21.2, maxLatitude: 22.8, minLongitude: -76.3, maxLongitude: -75},
  mayaguana: {minLatitude: 21.8, maxLatitude: 22.8, minLongitude: -73.6, maxLongitude: -72.3},
  inagua: {minLatitude: 20.5, maxLatitude: 21.8, minLongitude: -74.1, maxLongitude: -72.5},
  'acklins-crooked-island': {minLatitude: 21.6, maxLatitude: 23.3, minLongitude: -75.4, maxLongitude: -73},
}

function canonicalIsland(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return islandAliases.get(normalized) || normalized.replace(/\s+/g, '-')
}

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function isInsideIsland(place, slug) {
  const bounds = islandBounds[slug]
  const latitude = numeric(place.latitude)
  const longitude = numeric(place.longitude)
  return Boolean(bounds && latitude !== null && longitude !== null && latitude !== 0 && longitude !== 0 &&
    latitude >= bounds.minLatitude && latitude <= bounds.maxLatitude && longitude >= bounds.minLongitude && longitude <= bounds.maxLongitude)
}

function rawHasDescription(place) {
  return [place.description, place.short_description].some((value) => typeof value === 'string' && value.trim().length >= 40)
}

function rawHasMedia(place) {
  if (typeof place.primary_image_url === 'string' && place.primary_image_url.trim()) return true
  const gallery = Array.isArray(place.gallery_images) ? place.gallery_images : []
  return gallery.some((item) => typeof item === 'string' ? item.trim() : item?.url)
}

function destinationSlug(document, field = 'destination') {
  const id = document?.[field]?._ref?.replace(/^drafts\./, '')
  return destinationById.get(id)?.islandId || null
}

function text(value) {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) return ''
  return value.flatMap((block) => block?.children || []).map((span) => span?.text || '').join(' ').trim()
}

function hasImage(value) {
  return Boolean(value?.asset?._ref || value?.externalUrl)
}

function countFor(type, slug, field = 'destination', filter = () => true) {
  return documents.filter((item) => item._type === type && destinationSlug(item, field) === slug && filter(item)).length
}

function itemsFor(type, slug, field = 'destination') {
  return documents.filter((item) => item._type === type && destinationSlug(item, field) === slug)
}

function score(topic, value, finding, evidenceCount = 0) {
  return {_type: 'researchCoverageScore', _key: `coverage-${topic}`, topic, score: value, evidenceCount, finding}
}

function gap(slug, topic, priority, title, action, status = 'open') {
  return {_type: 'researchGap', _key: `gap-${slug}-${topic}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`, topic, priority, title, action, status}
}

const rows = destinations.map((destination) => {
  const slug = destination.islandId
  const official = officialBySlug.get(slug)
  const rawPlaces = currentPlaces.filter((item) => canonicalIsland(item.island_id || item.island_name) === slug)
  const landmarks = itemsFor('placeEditorial', slug).filter((item) => item.source?.table === 'historic_landmarks')
  const activePlaces = rawPlaces.filter((item) => item.is_active === true && item.status === 'active')
  const inBoundsActivePlaces = activePlaces.filter((item) => isInsideIsland(item, slug))
  const activeLocationIssues = activePlaces.filter((item) => !isInsideIsland(item, slug))
  const descriptions = rawPlaces.filter(rawHasDescription)
  const media = rawPlaces.filter(rawHasMedia)
  const hotels = rawPlaces.filter((item) => item.category === 'hotel')
  const food = rawPlaces.filter((item) => item.category === 'restaurant')
  const attractions = rawPlaces.filter((item) => ['attraction', 'beach', 'landmark'].includes(item.category))
  const verifiedPlaces = rawPlaces.filter((item) => item.is_verified === true)
  const launchReadyPlaces = rawPlaces.filter((item) => item.is_active === true && item.status === 'active' && item.is_verified === true && isInsideIsland(item, slug) && rawHasDescription(item) && rawHasMedia(item))
  const experiences = countFor('experience', slug)
  const guidedTours = countFor('guidedTour', slug)
  const itineraries = countFor('itinerary', slug)
  const faqs = countFor('faq', slug)
  const articles = countFor('article', slug, 'relatedDestination')
  const deals = countFor('deal', slug)
  const contentChecks = {
    overview: text(destination.overview).length >= 120,
    tagline: (destination.tagline || '').trim().length >= 20,
    heroImage: hasImage(destination.heroImage),
    highlights: (destination.highlights || []).length >= 4,
    access: (destination.airports || []).length > 0 && (destination.gettingThere || '').trim().length >= 20,
    tripFit: Boolean(destination.tripFit?.vibe && destination.tripFit?.recommendedStay && destination.tripFit?.bestFor?.length),
    practicalNotes: text(destination.practicalNotes).length >= 80,
    seasonality: Boolean(destination.bestTimeToVisit),
    seo: Boolean(destination.seo?.metaTitle && destination.seo?.metaDescription),
  }

  const coverage = [
    score('overview', official && contentChecks.overview ? 2 : 1, 'A destination profile and primary tourism source exist; independent corroboration and editorial sign-off are still pending.', 0),
    score('access', official?.gateways?.length && contentChecks.access ? 2 : 1, 'Gateway names are present, but current routes, schedules, transfers, and disruption handling need operator-level verification.', 0),
    score('stays', hotels.length ? 1 : 0, hotels.length ? `${hotels.length} stay candidates exist, but none is verified or launch-ready.` : 'No canonical stay candidate is present; document an explicit N/A or base-island pattern if appropriate.', 0),
    score('food', food.length ? 1 : 0, food.length ? `${food.length} food candidates exist, but none is verified or launch-ready.` : 'No canonical food candidate is present; document an explicit N/A or provisioning pattern if appropriate.', 0),
    score('experiences', attractions.length + experiences + guidedTours ? 1 : 0, `${attractions.length} place candidates, ${experiences} editorial experiences, and ${guidedTours} guided tours exist; identity and source review remain incomplete.`, 0),
    score('nature', official?.highlights?.length || landmarks.length ? 1 : 0, 'Official highlights provide a starting point, but access conditions, conservation rules, and traveler suitability need source-level review.', 0),
    score('culture', landmarks.length || articles ? 1 : 0, `${landmarks.length} landmark overlays and ${articles} related articles exist; citations and local editorial review are incomplete.`, 0),
    score('seasonality', contentChecks.seasonality ? 1 : 0, contentChecks.seasonality ? 'Seasonal guidance exists but lacks dated source evidence.' : 'No seasonality guidance is present in the destination profile.', 0),
    score('safety', 0, 'No approved, island-specific safety and emergency guidance is recorded in the research repository.', 0),
    score('accessibility', 0, 'No approved, island-specific accessibility and mobility guidance is recorded in the research repository.', 0),
  ]
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))

  const gaps = [
    gap(slug, 'places', 'p0', 'No verified, launch-ready canonical places', 'Adjudicate identity and coordinates, add rights-cleared media and sourced copy, then verify only records that pass the publication gate.'),
    gap(slug, 'access', 'p1', 'Current access not operator-verified', 'Confirm current air, ferry, water-taxi, and local transfer patterns against operator sources; keep live schedules out of canonical CMS copy.'),
    gap(slug, 'safety', 'p1', 'Island-specific safety guidance missing', 'Draft practical and emergency guidance from government or responsible authority sources, then route for editorial review.'),
    gap(slug, 'accessibility', 'p1', 'Accessibility evidence missing', 'Research airport, ferry, beach, attraction, and mobility constraints; distinguish verified accessibility from assumptions.'),
  ]
  if (activeLocationIssues.length) gaps.push(gap(slug, 'places', 'p0', `${activeLocationIssues.length} active place location failures`, `Quarantine or correct the active records whose coordinates do not fall within the island review bounds. First review: ${activeLocationIssues.slice(0, 8).map((item) => item.name).join(', ')}.`))
  if (!contentChecks.seasonality) gaps.push(gap(slug, 'seasonality', 'p1', 'Seasonality guidance missing', 'Add sourced seasonal patterns and a review date; do not treat a static climate summary as a live forecast.'))
  if (!hotels.length) gaps.push(gap(slug, 'stays', 'p0', 'No stay candidate', 'Prove a current local stay or record an explicit N/A/base-island pattern instead of inventing inventory.'))
  if (!food.length) gaps.push(gap(slug, 'food', 'p0', 'No food candidate', 'Prove a current food option or document provisioning/base-island guidance with a dated source.'))
  if (!faqs) gaps.push(gap(slug, 'planning', 'p2', 'No island-linked FAQ', 'Create traveler questions only after the supporting island facts are source-verified.'))
  if (!articles && !guidedTours && !itineraries) gaps.push(gap(slug, 'editorial', 'p2', 'No deep guide or itinerary', 'Build one practical, evidence-backed starter guide after the P0 identity and access gaps are closed.'))

  return {
    slug,
    name: destination.name,
    destinationId: destination._id.replace(/^drafts\./, ''),
    evidenceScore: overallScore,
    validationStatus: 'Needs revision',
    floor: floors.get(slug),
    destinationCompleteness: Object.values(contentChecks).filter(Boolean).length,
    destinationFields: Object.keys(contentChecks).length,
    canonicalPlaces: rawPlaces.length,
    activePlaceCandidates: activePlaces.length,
    inBoundsActivePlaceCandidates: inBoundsActivePlaces.length,
    activeLocationIssues: activeLocationIssues.length,
    suspectActivePlaces: activeLocationIssues.map((item) => ({id: item.id, name: item.name, category: item.category, address: item.address, latitude: item.latitude, longitude: item.longitude})),
    verifiedPlaces: verifiedPlaces.length,
    launchReadyPlaces: launchReadyPlaces.length,
    describedPlaces: descriptions.length,
    placesWithMedia: media.length,
    stays: hotels.length,
    food: food.length,
    things: attractions.length,
    historicLandmarks: landmarks.length,
    experiences,
    deals,
    guidedTours,
    itineraries,
    faqs,
    articles,
    coverage,
    gaps,
  }
}).sort((a, b) => a.evidenceScore - b.evidenceScore || a.activePlaceCandidates - b.activePlaceCandidates || a.name.localeCompare(b.name))

const sourceDocs = officialIslands.map((item) => {
  const destination = destinations.find((candidate) => candidate.islandId === item.slug)
  return {
    _id: `research-source-bmot-${item.slug}`,
    _type: 'researchSource',
    title: `${destination?.name || item.slug} — official island profile`,
    url: `https://www.bahamas.com/islands/${item.page}`,
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [{_type: 'reference', _key: `destination-${item.slug}`, _ref: destination?._id.replace(/^drafts\./, '')}],
    topics: ['overview', 'access', 'experiences', 'nature', 'culture'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'Primary source for official island taxonomy and a baseline of highlighted places and named gateways. Operational access still requires carrier or port verification.',
  }
})

sourceDocs.push(
  {
    _id: 'research-source-bmot-islands-index', _type: 'researchSource', title: 'The 16 Islands of The Bahamas', url: 'https://www.bahamas.com/islands', publisher: 'Bahamas Ministry of Tourism, Investments & Aviation', sourceClass: 'national_tourism', authorityLevel: 'primary', topics: ['overview', 'access', 'experiences', 'nature', 'culture'], checkedAt, nextReviewAt: annualReviewAt, status: 'active', notes: 'Canonical 16-island taxonomy and national overview. Use individual island profiles for deeper research.',
  },
  {
    _id: 'research-source-bnt-national-parks', _type: 'researchSource', title: 'National Park Information', url: 'https://bnt.bs/national-park-info/', publisher: 'Bahamas National Trust', sourceClass: 'conservation', authorityLevel: 'primary', topics: ['nature', 'safety', 'access'], checkedAt, nextReviewAt: annualReviewAt, status: 'active', notes: 'Primary conservation source for park identities and protected-area context. Confirm current access and visitor rules on park-specific pages.',
  },
  {
    _id: 'research-source-bahamas-ferries-travel', _type: 'researchSource', title: 'Passenger Services and Schedules', url: 'https://bahamasferries.com/your-travel/', publisher: 'Bahamas Ferries', sourceClass: 'transport_operator', authorityLevel: 'primary', topics: ['access'], checkedAt, nextReviewAt: '2026-09-03', status: 'active', notes: 'Operator source. Schedules are operational and weather-dependent; never copy them into evergreen content without a short review window.',
    destinations: ['abacos', 'andros', 'cat-island', 'eleuthera-harbour-island', 'the-exumas', 'grand-bahama', 'nassau-paradise-island'].map((slug) => destinationReference(slug)),
  },
  {
    _id: 'research-source-bahamasair', _type: 'researchSource', title: 'Bahamasair Route and Schedule Search', url: 'https://www.bahamasair.com/', publisher: 'Bahamasair', sourceClass: 'transport_operator', authorityLevel: 'primary', topics: ['access'], checkedAt, nextReviewAt: '2026-09-03', status: 'active', notes: 'Operator source for current air service. Use for dated route checks; live availability and schedules stay in runtime providers.',
  },
)

function destinationReference(slug, key = `destination-${slug}`) {
  const destination = destinations.find((candidate) => candidate.islandId === slug)
  return {_type: 'reference', _key: key, _ref: destination?._id.replace(/^drafts\./, '')}
}

function allDestinationReferences() {
  return officialIslands.map((item) => destinationReference(item.slug))
}

sourceDocs.push(
  {
    _id: 'research-source-bmot-flying',
    _type: 'researchSource',
    title: 'Flying to and within The Bahamas',
    url: 'https://www.bahamas.com/getting-here/flying',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('mayaguana'), destinationReference('inagua')],
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official transport overview. Route references are operational and require a short review window plus carrier confirmation before traveler delivery.',
  },
  {
    _id: 'research-source-doa-airports',
    _type: 'researchSource',
    title: 'Department of Aviation airport directory',
    url: 'https://www.doabahamas.com/',
    publisher: 'Bahamas Department of Aviation',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['access'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Government directory for official airport identity, codes, and coordinates. It does not establish that a scheduled passenger service is operating.',
  },
  {
    _id: 'research-source-bmot-island-hopping-access',
    _type: 'researchSource',
    title: 'Island Hopping Frequently Asked Questions',
    url: 'https://www.bahamas.com/getting-here/island-hopping/island-hopping-faqs',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official national planning overview for scheduled and charter air, national ferry connections, local water taxis, and private-boat access. Named routes and connection guidance are operational and must be confirmed with the responsible carrier for exact dates.',
  },
  {
    _id: 'research-source-caab-government-aerodromes-2026',
    _type: 'researchSource',
    title: 'The Bahamas Government-Owned Aerodromes Register — 2026',
    url: 'https://caabahamas.com/wp-content/uploads/2026/01/The-Bahamas-Government-Owned-Aerodromes-Register.pdf',
    publisher: 'Civil Aviation Authority Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('ragged-island'), destinationReference('rum-cay')],
    topics: ['access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Current regulator register used for facility-level constraints. Flight schedules and charter availability still require operator confirmation.',
  },
  {
    _id: 'research-source-moh-family-islands-health-clinics',
    _type: 'researchSource',
    title: 'Family Islands Health Clinics directory',
    url: 'https://cdn.bahamas.gov.bs/tenant/tenantministryofhealth/documents/All%20Documents/Family-Islands-Health-Clinics-20250114225027.pdf',
    publisher: 'Bahamas Ministry of Health and Wellness',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [
      destinationReference('abacos'),
      destinationReference('acklins-crooked-island'),
      destinationReference('andros'),
      destinationReference('berry-islands'),
      destinationReference('bimini'),
      destinationReference('cat-island'),
      destinationReference('eleuthera-harbour-island'),
      destinationReference('grand-bahama'),
      destinationReference('inagua'),
      destinationReference('long-island'),
      destinationReference('mayaguana'),
      destinationReference('ragged-island'),
      destinationReference('rum-cay'),
      destinationReference('san-salvador'),
      destinationReference('the-exumas'),
    ],
    topics: ['safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official directory used only for the named clinic, published contact, and weekday-hours baseline. It does not establish current staffing, after-hours response, emergency capability, ambulance or evacuation coverage, medicine availability, physical accessibility, or reliable telephone service. Recheck locally before traveler delivery.',
  },
  {
    _id: 'research-source-moh-new-providence-health-clinics',
    _type: 'researchSource',
    title: 'New Providence Health Clinics directory',
    url: 'https://cdn.bahamas.gov.bs/tenant/tenantministryofhealth/documents/All%20Documents/New-Providence-Health-Clinics-20250114224927.pdf',
    publisher: 'Bahamas Ministry of Health and Wellness',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('nassau-paradise-island')],
    topics: ['safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official directory used only for the named New Providence clinics, contacts, and weekday-hours baseline. It contains no Paradise Island clinic entry and does not establish current staffing, after-hours response, emergency capability, hospital routing, ambulance coverage, medicine availability, physical accessibility, or reliable telephone service. Recheck locally before traveler delivery.',
  },
  {
    _id: 'research-source-drm-emergency-numbers',
    _type: 'researchSource',
    title: 'DRM Authority emergency numbers',
    url: 'https://getready.gov.bs/contact-us/emergency-numbers/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current official national contact directory. It lists National Emergency Medical Services and police at 911/919 plus agency and specialist contacts. A listed number does not prove mobile coverage, routing, local response time, service eligibility, transport, capacity, or cost on every island. Recheck before traveler delivery.',
  },
  {
    _id: 'research-source-drm-evacuation-guidance',
    _type: 'researchSource',
    title: 'DRM Authority evacuation guidance',
    url: 'https://getready.gov.bs/evacuation/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official preparedness guidance covering local routes, shelters, transportation planning, emergency supplies, special needs, official instructions, and inter- versus intra-island evacuation. It does not supply a verified traveler-specific route or transport asset.',
  },
  {
    _id: 'research-source-drm-disability-preparedness',
    _type: 'researchSource',
    title: 'DRM Authority preparedness for people with disabilities',
    url: 'https://getready.gov.bs/people-with-disabilities/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official national preparedness guidance requiring a personalized plan for accessible evacuation routes, medical supplies, communication devices, caregivers, and support networks. It is not evidence that a particular facility, shelter, vehicle, dock, airport, or service is accessible.',
  },
  {
    _id: 'research-source-drm-live-alerts',
    _type: 'researchSource',
    title: 'DRM Authority official alerts and updates',
    url: 'https://drm.gov.bs/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official disaster authority homepage used only as the live-alert and official-update destination. Never copy an all-clear, activation level, shelter status, or affected-island list into evergreen CMS content; check the live authority page at runtime.',
  },
  {
    _id: 'research-source-drm-2026-hurricane-shelters',
    _type: 'researchSource',
    title: 'DRM Authority 2026 hurricane shelter page',
    url: 'https://getready.gov.bs/know-your-shelters/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'The page is labeled 2026 and was updated 2026-07-22, but the rendered content is not a complete national shelter dataset: it contains detailed New Providence and some MICAL entries while several island panels display placeholder text. Do not copy shelter names, capacities, activation, or accessibility as a complete island fact until the authority supplies a clean current island list and activation status.',
  },
  {
    _id: 'research-source-drm-official-2026-emergency-shelter-list-pdf',
    _type: 'researchSource',
    title: 'The Official 2026 Emergency Shelter List',
    url: 'https://getready.gov.bs/official-2026-shelter-list-completion-15072026/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Official seven-page PDF created 2026-07-15. It contains 121 numbered facility rows with printed capacities totaling 15,700 across 15 canonical island groups. It has no Ragged Island row and its Acklins & Crooked Island coverage contains Crooked Island rows only. It conflicts with the current companion web page, which names one Acklins facility and additional Crooked Island and Mayaguana facilities. Every name, designation, and capacity is dated list evidence only—not current activation, condition, usable capacity, services, transport, pet policy, or feature-level accessibility.',
  },
  {
    _id: 'research-source-bahamas-2023-hurricane-shelter-gis',
    _type: 'researchSource',
    title: 'The Bahamas 2023 Hurricane Shelter Locations public GIS',
    url: 'https://www.arcgis.com/home/item.html?id=3c11f94e0cce4f708ec7a01e846210b5',
    publisher: 'NEMA, Ministry of Social Services, BNGIS Centre, and Ministry of Public Works',
    sourceClass: 'government',
    authorityLevel: 'discovery_only',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access'],
    checkedAt: '2026-08-05',
    nextReviewAt: '2026-09-04',
    status: 'needs_recheck',
    notes: 'Public agency-linked 2023 shelter map and feature layer, last modified in September 2023. The layer exposes 144 rows, including 128 with non-zero coordinates, plus facility name, island, settlement, district, street, and limited shelter-type fields. It exposes no inspection date/result, suitability assessment, grade, repair or closure status, current activation, accessible features, or verified 2026 capacity. Coordinates are historical discovery candidates only and require an exact 2026 facility crosswalk plus editorial review before reuse.',
  },
  {
    _id: 'research-source-drm-national-humanitarian-assistance-standards-2025',
    _type: 'researchSource',
    title: 'National Humanitarian Assistance Standards for The Bahamas',
    url: 'https://drm.gov.bs/publications/national-humanitarian-assistance-standards/attachment/national-humanitarian-assistance-bahamas_v07_digital/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2027-08-04',
    status: 'active',
    notes: 'Official 186-page national standard created 2025-05-22 and published by DRM in August 2025. Its shelter chapter assigns agency responsibilities and requires yearly needs/capacity review, February–April list updates and inspections, documented suitability assessments, mass-evacuation plans for every island/group, trained teams, defined capacity/catchment, essential services, inclusive access, transport planning, and service-animal arrangements. These are standards and required processes—not proof that a named facility passed inspection or provides a feature now.',
  },
  {
    _id: 'research-source-drm-shelter-inspection-grading-programme',
    _type: 'researchSource',
    title: 'DRM shelter-inspection, grading, and mass-evacuation programme claims',
    url: 'https://drm.gov.bs/what-we-do/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'The official programme overview, last updated 2025-04-29, names “New Shelter Inspection Standards and Shelter Grading System” and development of a National Mass Evacuation Plan. The reviewed page does not link facility grades, completed inspection reports, suitability assessments, island evacuation plans, implementation status, or activation instructions. Treat it as a responsible programme lead only.',
  },
  {
    _id: 'research-source-opm-hurricane-melissa-evacuation-shelter-activation-2025',
    _type: 'researchSource',
    title: 'Hurricane Melissa evacuation and shelter-activation statement — October 2025',
    url: 'https://opm.gov.bs/prime-minister-davis-hurricane-melissa-press-conference/',
    publisher: 'Office of the Prime Minister, The Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: ['acklins-crooked-island', 'inagua', 'mayaguana', 'ragged-island'].map((slug) => destinationReference(slug)),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2027-08-04',
    status: 'active',
    notes: 'Dated 2025-10-27 event evidence. The statement orders evacuation for Inagua, Mayaguana, Acklins, Crooked Island, Long Cay, and Ragged Island; says air and maritime assets were in place; and says shelters across affected islands had been inspected, staffed, and made operational. It names no facility, grade, capacity, route, vehicle, receiving shelter, accessible feature, or completion result and is not current readiness evidence.',
  },
  {
    _id: 'research-source-drm-national-disaster-coordination-protocols',
    _type: 'researchSource',
    title: 'National Disaster Coordination Protocols',
    url: 'https://drm.gov.bs/wp-content/uploads/2025/09/National-Disaster-Coordination-Protocols-v01.pdf',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'accessibility', 'access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official coordination framework identifying Family Island Incident Coordination Centres by region and integrating New Providence incident coordination into the DRM Authority. It does not publish live activation, staffing, public emergency numbers, response time, transport, capacity, or traveler-specific instructions.',
  },
  {
    _id: 'research-source-rgd-family-island-administration-offices',
    _type: 'researchSource',
    title: 'Participating RGD and Family Island Administration Offices',
    url: 'https://rgd-civreg.bahamas.gov.bs/html/rgd_offices.html',
    publisher: 'Registrar General Department, Government of The Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: officialIslands.filter((item) => item.slug !== 'nassau-paradise-island').map((item) => destinationReference(item.slug)),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Government directory of administration offices participating in Registrar General services. Use only as an accountable administrative planning lead. It is not an emergency directory, has no visible review date, and includes shared or off-island routing that must be preserved and rechecked, including Berry Islands via Nicholl’s Town, Ragged Island via George Town, and Rum Cay via Cockburn Town, San Salvador.',
  },
  {
    _id: 'research-source-bahamas-met-climate-overview',
    _type: 'researchSource',
    title: 'Climate of The Bahamas',
    url: 'https://met.gov.bs/wp-content/uploads/2022/03/Climate-of-the-Bahamas.pdf',
    publisher: 'The Bahamas Department of Meteorology',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['seasonality', 'safety', 'access'],
    checkedAt,
    nextReviewAt: '2027-02-04',
    status: 'active',
    notes: 'Official national climate baseline for wet and dry regimes, cyclone-season timing, prevailing winds, temperature patterns, and the northwest-to-southeast rainfall gradient. It is not an island forecast, marine forecast, warning, climate normal for every settlement, or proof that transport and businesses will operate.',
  },
  {
    _id: 'research-source-drm-hazard-season-planning',
    _type: 'researchSource',
    title: 'DRM Authority hazard-ready seasonal planning',
    url: 'https://getready.gov.bs/get-hazard-ready/',
    publisher: 'Bahamas Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['seasonality', 'safety', 'accessibility', 'access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official national hazard-planning source. It identifies June through November as Atlantic hurricane season, with peak activity typically August through October, and directs people to current DRM Authority and Bahamas Meteorology updates. It does not establish a current warning, all-clear, flood status, shelter activation, route, or traveler-specific risk.',
  },
  {
    _id: 'research-source-caab-special-assistance-facilitation',
    _type: 'researchSource',
    title: 'CAA-B SEC 02 — Facilitation for passengers requiring special assistance',
    url: 'https://caabahamas.com/wp-content/uploads/2021/03/SEC-02-Facilitation.pdf',
    publisher: 'Civil Aviation Authority Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['accessibility', 'access', 'safety'],
    checkedAt,
    nextReviewAt: '2027-08-04',
    status: 'active',
    notes: 'National aviation facilitation standard. Sections 10.7.1–10.7.3 require special assistance, accessible information, adapted airport services, boarding/terminal transfer devices where needed, mobility-aid handling, and service-animal carriage subject to safety and quarantine rules. A regulatory requirement is not evidence that a named airport, aircraft, ground handler, or transfer currently implements every feature; verify the exact travel chain.',
  },
  {
    _id: 'research-source-bahamasair-passenger-disability',
    _type: 'researchSource',
    title: 'Bahamasair passenger-with-disability policy',
    url: 'https://www.bahamasair.com/special-assistance/passenger-with-disability',
    publisher: 'Bahamasair',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['accessibility', 'access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current national-carrier policy for assistive devices, gate delivery, wheelchair and pre-boarding assistance, aisle chairs, movable armrests on jet aircraft, and portable oxygen concentrators. Destination links indicate conditional planning relevance only; they do not assert current Bahamasair service to every island. Confirm the exact route, aircraft, airport, device, battery, oxygen, service-animal, and assistance request.',
  },
  {
    _id: 'research-source-bahamasair-accessibility-request',
    _type: 'researchSource',
    title: 'Bahamasair accessibility-services request form',
    url: 'https://www.bahamasair.com/quicklinks/accessibility-services',
    publisher: 'Bahamasair',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['accessibility', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current operator assistance-request path covering wheelchair help, respiratory assistive devices, and service or emotional-support animals. The page directs departures within 24 hours to telephone support. Destination links indicate conditional planning relevance only, not current route coverage or confirmation that a requested service is available on a specific flight.',
  },
  {
    _id: 'research-source-lpia-accessibility',
    _type: 'researchSource',
    title: 'Lynden Pindling International Airport accessibility features',
    url: 'https://nassaulpia.com/help/accessibility/',
    publisher: 'Nassau Airport Development Company',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('nassau-paradise-island')],
    topics: ['accessibility', 'access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Airport-operator page identifying accessible short-term parking, elevators and escalators at transition levels, family and accessible restrooms, airline-arranged wheelchairs, and the Hidden Disabilities Sunflower programme. These features apply to LPIA only and do not prove an accessible aircraft, onward Family Island airport, ground transfer, bridge route, or destination facility.',
  },
  {
    _id: 'research-source-bahamas-ferries-passenger-policies',
    _type: 'researchSource',
    title: 'Bahamas Ferries passenger policies',
    url: 'https://bahamasferries.com/about-us/policies/',
    publisher: 'Bahamas Ferries',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: ['abacos', 'andros', 'cat-island', 'eleuthera-harbour-island', 'the-exumas', 'grand-bahama', 'nassau-paradise-island'].map((slug) => destinationReference(slug)),
    topics: ['accessibility', 'access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Current public passenger policy reviewed for assistance and accessibility planning. It permits refusal of embarkation where the Master considers a passenger unfit due to sickness or infirmity, but it does not publish a feature-level wheelchair, boarding, lift/ramp, accessible-restroom, mobility-device, service-animal, or assistance-request workflow. Absence from the page is not proof that assistance is unavailable; obtain route-, vessel-, terminal-, and traveler-specific confirmation before booking.',
  },
  {
    _id: 'research-source-bmot-flight-tables-current-review',
    _type: 'researchSource',
    title: 'Flying to The Bahamas — dated carrier and airport-pair review',
    url: 'https://www.bahamas.com/getting-here/flying',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Official national carrier table used only as a dated lead for named carriers and airport pairs. The page says schedules are subject to change and contains internal frequency conflicts plus code or typing errors, including TXN for Congo Town where TZN is used elsewhere. Never copy its frequency, price, availability, or operating-day claims into evergreen content; confirm the exact itinerary with the carrier and runtime provider.',
  },
  {
    _id: 'research-source-western-air-route-directory',
    _type: 'researchSource',
    title: 'Western Air destinations and current route directory',
    url: 'https://www.westernairbahamas.com/destination/',
    publisher: 'Western Air',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: ['abacos', 'andros', 'bimini', 'cat-island', 'eleuthera-harbour-island', 'the-exumas', 'grand-bahama', 'nassau-paradise-island'].map((slug) => destinationReference(slug)),
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current carrier-controlled destination and booking pages used for route-pair identity only. Displayed dates, fares, weather, availability, frequency, and aircraft assignment are live or short-lived information and are intentionally excluded from Sanity facts.',
  },
  {
    _id: 'research-source-makers-air-destinations',
    _type: 'researchSource',
    title: 'Makers Air scheduled and charter destination directory',
    url: 'https://makersair.com/destinations/',
    publisher: 'Makers Air',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: ['abacos', 'andros', 'berry-islands', 'cat-island', 'eleuthera-harbour-island', 'the-exumas', 'long-island'].map((slug) => destinationReference(slug)),
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current operator page that explicitly separates scheduled destinations from charter destinations. Marsh Harbour and Scotland Cay are retained as charter leads only; Congo Town, Fresh Creek, San Andros, Stella Maris, Cat Island/New Bight, Staniel Cay, Rock Sound, Governor’s Harbour, North Eleuthera, Chub Cay, and Great Harbour Cay are labeled scheduled. Exact dates, fares, seats, frequency, aircraft, and connection protection remain runtime checks.',
  },
  {
    _id: 'research-source-southern-air-travel-guide',
    _type: 'researchSource',
    title: 'Southern Air Charter current travel guide',
    url: 'https://www.southernaircharter.com/travel-guide',
    publisher: 'Southern Air Charter',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: ['eleuthera-harbour-island', 'long-island', 'nassau-paradise-island'].map((slug) => destinationReference(slug)),
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current carrier-controlled page establishing Nassau pairs with Deadman’s Cay, Stella Maris, North Eleuthera, Governor’s Harbour, and Rock Sound. The operator marks every displayed schedule subject to change; times, frequency, flight numbers, dates, fares, seats, aircraft, and disruptions remain runtime information.',
  },
  {
    _id: 'research-source-bahamas-ferries-current-passenger-reconciliation',
    _type: 'researchSource',
    title: 'Bahamas Ferries current passenger page — route reconciliation',
    url: 'https://bahamasferries.com/your-travel/',
    publisher: 'Bahamas Ferries',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: ['abacos', 'andros', 'cat-island', 'eleuthera-harbour-island', 'the-exumas', 'grand-bahama', 'nassau-paradise-island'].map((slug) => destinationReference(slug)),
    topics: ['access', 'safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'The current operator passenger page visibly publishes a Nassau–Spanish Wells–Harbour Island high-speed service and says all schedules are weather permitting and subject to holiday or special-event changes. It lists offices in Freeport, George Town, Governor’s Harbour, Harbour Island, Marsh Harbour, Rock Sound, and Spanish Wells, but an office listing is not proof of a current passenger route. This is narrower than the national tourism FAQ’s seven island-pair claims, so every non-Eleuthera route remains uncorroborated pending operator confirmation.',
  },
  {
    _id: 'research-source-bmot-eleuthera-marine-arrival',
    _type: 'researchSource',
    title: 'Eleuthera & Harbour Island getting-around context',
    url: 'https://www.bahamas.com/plan-your-trip/island-faq/eleuthera-harbour-island/getting-around',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('eleuthera-harbour-island')],
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official destination context establishing that Harbour Island is boat- or ferry-only from mainland Eleuthera and that Spanish Wells requires a ferry from the mainland. It does not identify the local dock operator, transfer vehicle, schedule, fare, capacity, accessibility, weather limit, or disruption fallback.',
  },
  {
    _id: 'research-source-bmot-exuma-local-marine-transfer',
    _type: 'researchSource',
    title: 'The Exumas local marine-access context',
    url: 'https://www.bahamas.com/the-islands/the-exumas/about-exumas',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('the-exumas')],
    topics: ['access', 'nature', 'safety'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official destination context distinguishing Great Exuma, Little Exuma, and the cays. It identifies a George Town water-taxi pattern for Stocking Island, boat-only access to Big Major Cay from nearby Staniel Cay, and boat or air access to Staniel Cay. It does not identify the operator, dock, schedule, fare, capacity, accessibility, weather limit, conservation permissions, or disruption fallback.',
  },
  {
    _id: 'research-source-bmot-licensed-ground-transport-baseline',
    _type: 'researchSource',
    title: 'The Bahamas visitor transport and licensed-operator baseline',
    url: 'https://www.bahamas.com/plan-your-trip/island-faq/entry-requirements',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['access', 'safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current national visitor guidance says to accept rides only from licensed land and sea operators and describes taxis, jitneys, rentals, scooters, bicycles, and golf carts at a country level. It is not proof that any mode, driver, vehicle, payment method, fare, operating window, or accessible transfer is available on a specific island or travel date.',
  },
  {
    _id: 'research-source-rtd-taxi-licensing-inspection',
    _type: 'researchSource',
    title: 'Road Traffic Department taxi licensing and inspection requirements',
    url: 'https://www.roadtraffic.gov.bs/public-transportation-and-inspection/vehicle-registration-and-inspection-new/taxi/',
    publisher: 'Road Traffic Department, Government of The Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Government process page establishing that taxi registration requires a valid public-service driver licence, insurance, business licence, taxi-franchise grant letter, vehicle registration, and inspection; it says public-service vehicles are inspected in May and October. This is a regulatory baseline, not a live register of licensed operators and not evidence that a named driver or vehicle currently complies.',
  },
  {
    _id: 'research-source-laws-family-island-taxi-zone-fares-2008',
    _type: 'researchSource',
    title: 'Road Traffic (Taxi-Cab) (Family Islands Zone Fares) Regulations, 2008',
    url: 'https://laws.bahamas.gov.bs/cms/images/LEGISLATION/SUBORDINATE/2008/2008-0112/2008-0112.pdf',
    publisher: 'Government of The Bahamas — Laws of The Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: ['abacos', 'andros', 'cat-island', 'eleuthera-harbour-island', 'the-exumas', 'long-island'].map((slug) => destinationReference(slug)),
    topics: ['access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Official 2008 regulations define maximum taxi-cab fare zones for Abaco, Andros, Cat Island, Eleuthera, Exuma, and Long Island, including several airport-linked zones. The old schedule is evidence of a statutory zone framework, not a traveler-facing current quote. Confirm amendment status, exact route, surcharge, waiting time, luggage, gratuity, payment method, and quoted fare before delivery.',
  },
  {
    _id: 'research-source-laws-new-providence-taxi-fares-2024',
    _type: 'researchSource',
    title: 'Road Traffic (Taxi-Cab) (New Providence Zone Fares) Amendment Regulations, 2024',
    url: 'https://laws.bahamas.gov.bs/cms/images/LEGISLATION/AMENDING/2024/2024-0014S/2024-0014S.pdf',
    publisher: 'Government of The Bahamas — Official Gazette',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('nassau-paradise-island')],
    topics: ['access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'The March 2024 amendment replaces the New Providence zone-fare schedule and includes LPIA, downtown, Paradise Island, Prince George Dock, and other zones. It establishes the legal fare framework only. Exact live quotes, tolls, luggage, waiting, gratuity, payment method, vehicle capacity, and availability remain runtime checks.',
  },
  {
    _id: 'research-source-lpia-taxi-pickup',
    _type: 'researchSource',
    title: 'LPIA taxi pickup and transportation options',
    url: 'https://nassaulpia.com/to-from/taxis/',
    publisher: 'Nassau Airport Development Company',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('nassau-paradise-island')],
    topics: ['access', 'safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Current airport-operator page says taxis are outside the US, International, and Domestic terminals and publishes set zone fares plus passenger and luggage surcharges. Pickup location is retained; exact prices are excluded from evergreen facts and must be checked at runtime. The page does not establish an accessible vehicle, child seat, payment method, queue time, capacity, or disruption fallback.',
  },
  {
    _id: 'research-source-bmot-bimini-arrival-transfer-chain',
    _type: 'researchSource',
    title: 'Bimini South-to-North arrival-transfer context',
    url: 'https://www.bahamas.com/uk/islands/bimini/getting-around',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('bimini')],
    topics: ['access', 'safety', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official island context says most visitors fly into South Bimini Airport and continue to North Bimini by ferry. It does not identify the responsible ferry or ground operator, pickup point, dock, schedule, fare, luggage transfer, capacity, accessibility, weather limit, missed-connection responsibility, or fallback.',
  },
  {
    _id: 'research-source-rbpf-national-district-emergency-baseline',
    _type: 'researchSource',
    title: 'Royal Bahamas Police Force national district and emergency baseline',
    url: 'https://www.royalbahamaspolice.org/aboutus/index.php?aboutus_id=1',
    publisher: 'Royal Bahamas Police Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Current official RBPF page says the Force provides policing services across The Bahamas, is divided into New Providence, Northern Bahamas, and Family Islands districts, and displays 911/919 as the emergency route. This is a national responsibility and routing baseline, not proof of local connectivity, a staffed station, dispatch, response time, transport, fire or marine capability, or an accessible response for a specific island.',
  },
  {
    _id: 'research-source-rbpf-police-telephone-directory-partial',
    _type: 'researchSource',
    title: 'RBPF police telephone directory — partial station reconciliation',
    url: 'https://royalbahamaspolice.org/contactus/telephonelisting.html',
    publisher: 'Royal Bahamas Police Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: ['abacos', 'acklins-crooked-island', 'andros', 'berry-islands', 'bimini', 'cat-island', 'eleuthera-harbour-island', 'grand-bahama', 'nassau-paradise-island'].map((slug) => destinationReference(slug)),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Official telephone listing with New Providence, Grand Bahama, and rendered Family Island station sections through Eleuthera. It is useful for station-identity leads but is incomplete for the remaining islands and contains apparent data-quality issues, including “March Harbour,” an Abaco-section Bullock’s Harbour entry, a malformed Alice Town number, and overlapping-looking Berry/Abaco telephone entries. Telephone numbers are intentionally excluded from evergreen facts; verify the exact current station and dispatch path before use.',
  },
  {
    _id: 'research-source-rbpf-family-islands-division-directory',
    _type: 'researchSource',
    title: 'RBPF Family Islands district and division directory',
    url: 'https://www.royalbahamaspolice.org/stations_divisions/familyisland_display.php?station_id=12',
    publisher: 'Royal Bahamas Police Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: ['acklins-crooked-island', 'andros', 'berry-islands', 'cat-island', 'eleuthera-harbour-island', 'the-exumas', 'inagua', 'long-island', 'mayaguana', 'ragged-island', 'rum-cay', 'san-salvador'].map((slug) => destinationReference(slug)),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Current official district index naming Berry Islands & Chub Cay, Eleuthera, Andros, Acklins/Crooked Island/Long Cay, Cat Island, Exuma/Ragged Island/the Cays, Inagua, Long Island, Mayaguana, and San Salvador/Rum Cay divisions. A division name does not establish a staffed local station, current officer, telephone, hours, dispatch, response time, equipment, transport, or coverage of every cay.',
  },
  {
    _id: 'research-source-rbpf-northern-bahamas-division-directory',
    _type: 'researchSource',
    title: 'RBPF Grand Bahama and Northern Bahamas division directory',
    url: 'https://www.royalbahamaspolice.org/stations_divisions/gbnorthernbahamas_display.php?station_id=1',
    publisher: 'Royal Bahamas Police Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: ['abacos', 'bimini', 'grand-bahama'].map((slug) => destinationReference(slug)),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Current official district index listing Grand Bahama divisions plus separate Abaco and Bimini divisions. It establishes organizational routing only; it does not prove a staffed station, current contact, dispatch, response time, fire or marine support, transport, or coverage of every cay.',
  },
  {
    _id: 'research-source-caab-rffs-standard',
    _type: 'researchSource',
    title: 'CAA-B aerodrome rescue and firefighting standard — CAP AGA 03',
    url: 'https://caabahamas.com/wp-content/uploads/2021/03/CAP-AGA-03-Rescue-and-Fire-fighting-Services.pdf',
    publisher: 'Civil Aviation Authority Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official CAP AGA 03 dated 25 March 2021. It requires aerodrome operators to provide aircraft-firefighting vehicles, equipment, and personnel commensurate with the RFFS category published in the AIP; conduct task-and-resource analysis; agree minimum staffing with CAA-B; test response time; and assess specialist rescue needs near water, swamp, or difficult terrain. Its optimum-condition two-minute objective, not exceeding three minutes to runway ends and movement areas, is a standard—not proof that a named airport currently meets it. The category table begins at 1 and does not define CAT 0.',
  },
  {
    _id: 'research-source-caab-government-aerodrome-rffs-register',
    _type: 'researchSource',
    title: 'CAA-B register of government-owned aerodromes — published RFFS categories',
    url: 'https://caabahamas.com/wp-content/uploads/2024/07/CAA-B-Register-of-Government-Owned-Aerodromes.pdf',
    publisher: 'Civil Aviation Authority Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Official register issued under the Civil Aviation Authority Bahamas Act 2021. Its aerodrome-data reference is BANSA AIP Sixth Edition Amendment 01/2023, so every airport category and operating field is retained as a dated snapshot requiring current AIP confirmation. CAT 0 is recorded verbatim and never normalized to no rescue or no fire response because CAP AGA 03 starts its category table at 1 and the reviewed register does not define 0. A listed category is not proof of current appliances, agent, staffing, response tests, hours, mutual aid, or readiness.',
  },
  {
    _id: 'research-source-airport-authority-rff-service-footprint',
    _type: 'researchSource',
    title: 'Airport Authority rescue-firefighting service footprint',
    url: 'https://www.airportsbahamas.com/our-team',
    publisher: 'Airport Authority of The Bahamas',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Current authority page says the Airport Authority delivers Security and Rescue Fire Fighting services to LPIA and throughout the Family Islands and manages or provides security services to 28 Family Island airports. It does not identify airport-specific RFFS categories, fire stations, appliances, staffing, operating windows, response tests, current outages, structural-fire jurisdiction, medical transport, or accessibility.',
  },
  {
    _id: 'research-source-doa-airport-emergency-contact-review',
    _type: 'researchSource',
    title: 'Department of Aviation airport emergency-field review',
    url: 'https://www.doabahamas.com/',
    publisher: 'Bahamas Department of Aviation',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Current government airport directory review classified whether a government-airport entry renders a field labelled Emergency, Phone & Emergency, or no such field. Mutable telephone numbers are intentionally excluded from evergreen facts. A labelled emergency field is a routing lead only: it does not identify the receiving agency, prove that the number works from every network, or establish RFFS category, staffed appliances, dispatch, ambulance availability, response time, accessibility, or current operation. N/A on a private or cay-airport entry is not proof that no emergency response exists.',
  },
  {
    _id: 'research-source-pha-nems-ambulance-system-snapshot',
    _type: 'researchSource',
    title: 'PHA National Emergency Medical Services and ambulance-system snapshot',
    url: 'https://cdn.bahamas.gov.bs/tenant/tenantministryofhealth/documents/All%20Documents/Request-for-Information-Healthcare-Information-System-and-Electronic-Medical-Record-System-20240430032513.pdf',
    publisher: 'Public Hospitals Authority / Ministry of Health',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Officially hosted system-description document says NEMS coordinates first response to national medical emergencies, names paramedics, EMTs, dispatchers, and drivers, and reports 22 public ambulances with six attached to unspecified Family Island clinics plus a volunteer First Responder Programme. The document has no trustworthy current operational revision and contains legacy systems context, so the fleet, bases, personnel, programme, and island distribution are historical leads only—not current capacity. The six clinics or islands are not identified.',
  },
  {
    _id: 'research-source-drm-fidep-local-response-asset-standard',
    _type: 'researchSource',
    title: 'Family Island Disaster Emergency Plan local response-asset framework',
    url: 'https://drm.gov.bs/wp-content/uploads/2025/09/FIDEP-Public-Summary-v040932025-2.pdf',
    publisher: 'Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Official public framework requires local Family Island plans to inventory emergency personnel, volunteer firefighters, health facilities, firefighting equipment and supplies, medical-transport vehicles, evacuation and search-and-rescue equipment, satellite communications, ICCs, shelters, and other assets. It defines what accountable local plans should document; it is not the completed inventory and does not prove that any named asset exists, works, is staffed, is accessible, or can reach a traveler.',
  },
  {
    _id: 'research-source-rbpf-fire-service-directory-scope',
    _type: 'researchSource',
    title: 'RBPF Fire Services telephone-directory scope review',
    url: 'https://royalbahamaspolice.org/contactus/telephonelisting.html',
    publisher: 'Royal Bahamas Police Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'The reviewed current telephone listing explicitly renders Fire Services within New Providence and Grand Bahama sections but does not provide a responsible current national directory of Family Island fire stations, brigades, appliances, staffing, or service boundaries. Direct numbers are intentionally excluded. Absence of a Family Island fire entry is an evidence gap—not proof that no volunteer brigade, airport RFFS, police, Defence Force, private, industrial, community, or mutual-aid response exists.',
  },
  {
    _id: 'research-source-drm-bimini-fire-equipment-training-2026',
    _type: 'researchSource',
    title: 'Bimini community-firefighting equipment and training — July 2026',
    url: 'https://drm.gov.bs/newsroom/latest-news/',
    publisher: 'Disaster Risk Management Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('bimini')],
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official July 20, 2026 newsroom listing says DRM presented equipment to Bimini officials to enhance community firefighting capabilities and conducted training. The accessible listing truncates the equipment details and does not identify custody, station, volunteers, maintenance, dispatch, coverage, response time, water supply, operating readiness, accessibility, or whether North Bimini, South Bimini, Cat Cay, and other cays are all served. It is dated capacity-building evidence, not a current readiness promise.',
  },
  {
    _id: 'research-source-aaia-airport-incident-response-evidence-2026',
    _type: 'researchSource',
    title: 'AAIA dated airport incident and response evidence — 2026',
    url: 'https://www.baaid.org/news-and-events',
    publisher: 'Aircraft Accident Investigation Authority',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: ['eleuthera-harbour-island', 'mayaguana', 'nassau-paradise-island'].map((slug) => destinationReference(slug)),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official dated occurrence notices report a March 2026 runway incident at Governor\'s Harbour with CAA-B and Airport Authority coordination, a March 2026 off-runway occurrence at Mayaguana after which occupants were receiving medical attention, and a July 2026 LPIA engine fire extinguished by Airport Fire and Rescue Services. These notices prove only those dated events and stated actions; they do not establish current category, staffing, appliance state, ambulance transport, response time, or readiness at another time or airport.',
  },
  {
    _id: 'research-source-rbpf-eleuthera-volunteer-fire-response-2024',
    _type: 'researchSource',
    title: 'Eleuthera volunteer fire-service response — April 2024',
    url: 'https://mail.royalbahamaspolice.org/crimeinformation/crimereports/crimereportsdisplay2024.php?cr_id=122',
    publisher: 'Royal Bahamas Police Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('eleuthera-harbour-island')],
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official April 2024 incident report says the island volunteer fire services responded to and extinguished a vehicle fire on Eleuthera and that surviving occupants were airlifted to New Providence. It is dated incident evidence only; it does not identify the brigade, base, apparatus, staffing, dispatch, coverage, medical stabilization, airlift operator, response time, current readiness, or service for Harbour Island, Spanish Wells, or every Eleuthera settlement.',
  },
  {
    _id: 'research-source-rbdf-public-sar-contact-2026',
    _type: 'researchSource',
    title: 'RBDF public Search & Rescue and VHF contact page — 2026',
    url: 'https://rbdf.gov.bs/contact-us/',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access'],
    checkedAt: '2026-08-05',
    nextReviewAt: '2026-09-04',
    status: 'active',
    notes: 'Current official RBDF page explicitly publishes Search & Rescue at (242) 362-3816, Harbour Control on VHF Channel 16, and Police Emergency at 919/911. This is a national public routing baseline only. It does not prove island/cay telephone or radio coverage, continuous watch during outages, caller-location capability, a responding asset, crew/fuel/launch readiness, range, weather limits, response time, accessible communication, dock/clinic handoff, medical transport, or evacuation.',
  },
  {
    _id: 'research-source-rbdf-national-search-rescue-protocols',
    _type: 'researchSource',
    title: 'RBDF national search-and-rescue emergency-support protocols',
    url: 'https://rbdf.gov.bs/wp-content/uploads/2023/08/DRMU-Emergency-Protocols-and-Procedures.pdf',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Official emergency-support document assigns RBDF central/lead coordination for search and rescue and marine search and rescue, with NEMA, the Port Department, the United States Embassy, and other support agencies participating as applicable. The file path and document do not provide a clear current revision or effective date, so it is retained as a responsibility baseline that requires authority recheck—not as proof of current assets, staffing, response time, public contact, designated RCC status, or island-level capability.',
  },
  {
    _id: 'research-source-rbdf-operations-satellite-base-directory',
    _type: 'researchSource',
    title: 'RBDF operations, search-and-rescue, and satellite-base directory',
    url: 'https://rbdf.gov.bs/phone-numbers/',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'Current official page names Operations Command Center radio/search-and-rescue functions and satellite-base entries for HMBS Gun Point, HMBS Matthew Town, Northern Command Abaco, and Northern Command Grand Bahama. The rendered values are internal-looking extensions without clear public dialing context or a last-updated marker. Numbers are intentionally excluded from evergreen facts; the absence of another island from this page is not proof that no RBDF personnel, facility, partner, vessel, aircraft, or response can serve it.',
  },
  {
    _id: 'research-source-rbdf-sarops-rcc-status-2025',
    _type: 'researchSource',
    title: 'RBDF SAROPS training and Rescue Coordination Centre status — 2025',
    url: 'https://rbdf.gov.bs/rbdf-personnel-undergo-sarops-training-to-strengthen-maritime-sar-capabilities/',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: allDestinationReferences(),
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-11-02',
    status: 'active',
    notes: 'Dated April 2025 evidence that RBDF Operations Command Center, Harbour Patrol, Air Wing, and Sea Training personnel completed SAROPS training at HMBS Coral Harbour. The source calls designated national Rescue Coordination Centre status a strategic goal; therefore the repository does not describe the OCC as already designated without newer authoritative proof.',
  },
  {
    _id: 'research-source-rbdf-hmbs-abaco-site-assessment-2026',
    _type: 'researchSource',
    title: 'HMBS Abaco site and maritime-unit assessment — February 2026',
    url: 'https://rbdf.gov.bs/deputy-commander-defence-force-visit-hmbs-abaco/',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('abacos')],
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Dated February 2026 leadership visit documenting HMBS Abaco, current berthing-area and administrative-office review, and proposed long-range radar and dedicated Maritime Unit facility locations. Existing presence and proposed infrastructure are kept separate; the page does not prove completion, commissioning, staffing, deployable assets, public distress routing, response time, or coverage of every Abaco cay.',
  },
  {
    _id: 'research-source-rbdf-grand-bahama-readiness-assessment-2026',
    _type: 'researchSource',
    title: 'Northern Command Grand Bahama readiness assessment — February 2026',
    url: 'https://rbdf.gov.bs/rbdf-deputy-commander-defence-force-concludes-strategic-visit-to-grand-bahama/',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('grand-bahama')],
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Dated February 2026 evidence of Northern Command headquarters inspection and operational review in Grand Bahama. Proposed communications/radar, rapid-response maritime-unit, and Small Boat station locations are planning evidence only and are not recorded as completed or operational capabilities.',
  },
  {
    _id: 'research-source-rbdf-hmbs-matthew-town-use-2026',
    _type: 'researchSource',
    title: 'HMBS Matthew Town dated facility-use evidence — February 2026',
    url: 'https://rbdf.gov.bs/rbdf-hmbs-nassau-hosts-maritime-cadets-from-inagua/',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('inagua')],
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Dated February 2026 source places HMBS Nassau alongside HMBS Matthew Town during a cadet visit. It corroborates facility identity and dated vessel use only; it does not establish continuous staffing, assigned rescue assets, public distress routing, launch readiness, response time, accessibility, or Little Inagua coverage.',
  },
  {
    _id: 'research-source-rbdf-gun-point-operation-2024',
    _type: 'researchSource',
    title: 'HMBS Gun Point dated operation evidence — March 2024',
    url: 'https://rbdf.gov.bs/rbdf-intercepts-haitian-sailing-vessel-apprehends-122-migrants/',
    publisher: 'Royal Bahamas Defence Force',
    sourceClass: 'government',
    authorityLevel: 'primary',
    destinations: [destinationReference('ragged-island')],
    topics: ['safety', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Dated March 2024 operation reports a surface asset towing to Gun Point, Ragged Island, with HMBS Lawrence Major dispatched there with additional personnel. This corroborates facility identity and a historical operational use, not current staffing, assigned assets, public distress routing, launch readiness, response time, accessibility, or an evacuation promise.',
  },
  {
    _id: 'research-source-bmot-hotel-directory-2025',
    _type: 'researchSource',
    title: 'The Islands of The Bahamas Hotel Directory — 2025',
    url: 'https://www.tourismtoday.com/sites/default/files/2025-11/Hotel%20Directory%20-%202025%20Final%20Aug%202025.pdf',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [
      destinationReference('acklins-crooked-island'),
      destinationReference('berry-islands'),
      destinationReference('inagua'),
      destinationReference('mayaguana'),
      destinationReference('ragged-island'),
      destinationReference('rum-cay'),
    ],
    topics: ['stays'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Official 2025 accommodation directory. A listing supports identity and the directory snapshot only; current operation, rates, availability, and booking details still require direct confirmation.',
  },
  {
    _id: 'research-source-bnt-little-inagua',
    _type: 'researchSource',
    title: 'Little Inagua National Park',
    url: 'https://bnt.bs/explore/inagua/little-inagua-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('inagua')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary protected-area source for access limitations, infrastructure, freshwater, and no-take status. Conditions still require a pre-trip check.',
  },
  {
    _id: 'research-source-bmot-baycaner',
    _type: 'researchSource',
    title: 'Baycaner Beach Resort listing',
    url: 'https://www.bahamas.com/hotels/baycaner-beach-resort',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('mayaguana')],
    topics: ['stays'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Official property listing used to corroborate identity. Current operation and availability require direct operator confirmation.',
  },
  {
    _id: 'research-source-bmot-acklins-trophy-lodge',
    _type: 'researchSource',
    title: 'Crooked & Acklins Trophy Lodge listing',
    url: 'https://www.bahamas.com/hotels/crooked-acklins-trophy-lodge',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('acklins-crooked-island')],
    topics: ['stays'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Official property listing used to corroborate identity. Current operation and availability require direct operator confirmation.',
  },
  {
    _id: 'research-source-bmot-chub-cay-club',
    _type: 'researchSource',
    title: 'Chub Cay Club listing',
    url: 'https://www.bahamas.com/hotels/chub-cay-club',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('berry-islands')],
    topics: ['stays'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Official property listing used to corroborate identity. Current operation and availability require direct operator confirmation.',
  },
  {
    _id: 'research-source-bmot-flos-conch-bar',
    _type: 'researchSource',
    title: "Flo's Conch Bar listing",
    url: 'https://www.bahamas.com/plan-your-trip/restaurants/flos-conch-bar',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('berry-islands')],
    topics: ['food'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official restaurant listing used to corroborate identity. Hours, transport, payment arrangements, and opening status remain operational.',
  },
  {
    _id: 'research-source-bmot-ocean-view-restaurant',
    _type: 'researchSource',
    title: 'Ocean View Restaurant & Bar listing',
    url: 'https://www.bahamas.com/plan-your-trip/restaurants/ocean-view-restaurant-bar',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('rum-cay')],
    topics: ['food'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official restaurant listing used to corroborate identity. Hours, transport, payment arrangements, and opening status remain operational.',
  },
  {
    _id: 'research-source-bmot-enricas-inn',
    _type: 'researchSource',
    title: "Enrica's Inn listing",
    url: 'https://www.bahamas.com/hotels/enricas-inn',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('inagua')],
    topics: ['stays'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Official property listing used to corroborate identity. Current operation and availability require direct operator confirmation.',
  },
  {
    _id: 'research-source-bmot-business-map-pins',
    _type: 'researchSource',
    title: 'Bahamas official business map pins — remote-island candidates',
    url: 'https://www.bahamas.com/map',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('mayaguana'), destinationReference('inagua'), destinationReference('rum-cay')],
    topics: ['stays', 'food', 'access'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'The official listing pages link to map business IDs 760, 838, and 3609. The live official map backend returns exact pins for Baycaner, Enrica’s, and Ocean View. Backend update dates are 2023, 2023, and 2020 respectively, so the pins support stable location reconciliation only—not current operation, hours, inventory, or accessibility.',
  },
  {
    _id: 'research-source-bmot-mally-suites',
    _type: 'researchSource',
    title: 'Mally Suites listing',
    url: 'https://www.bahamas.com/placeproperty/malley-suites',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('inagua')],
    topics: ['stays'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Official property listing uses the page label “Malley Suites,” while the 2025 directory uses “Mally Suites.” Identity must be reconciled before canonical publication.',
  },
  {
    _id: 'research-source-bmot-lighthouse-restaurant-inagua',
    _type: 'researchSource',
    title: 'Lighthouse Restaurant Bar and Grill listing',
    url: 'https://www.bahamas.com/vendor/lighthouse-restaurant-bar-and-grill',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('inagua')],
    topics: ['food'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Official restaurant listing used to corroborate identity. Hours and operating status remain operational.',
  },
)

sourceDocs.push(
  {
    _id: 'research-source-bmot-hotel-directory-2025-mid-islands',
    _type: 'researchSource',
    title: 'The Islands of The Bahamas Hotel Directory — 2025 (mid-island research batch)',
    url: 'https://www.tourismtoday.com/sites/default/files/2025-11/Hotel%20Directory%20-%202025%20Final%20Aug%202025.pdf',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('andros'), destinationReference('cat-island'), destinationReference('long-island'), destinationReference('san-salvador')],
    topics: ['stays', 'access'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Scoped citation record for the Andros, Cat Island, Long Island, and San Salvador sections. Directory entries support identity and the 2025 snapshot only, not current operation or availability.',
  },
  {
    _id: 'research-source-bnt-conception-island',
    _type: 'researchSource',
    title: 'Conception Island National Park',
    url: 'https://bnt.bs/explore/conception-island-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('long-island'), destinationReference('rum-cay')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary protected-area source for boat-only access, limited infrastructure, marine constraints, and visitor cautions. Conditions require a pre-trip recheck.',
  },
  {
    _id: 'research-source-bmot-hermitage-mount-alvernia',
    _type: 'researchSource',
    title: 'The Hermitage on Mt. Alvernia',
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/the-hermitage-on-mt-alvernia',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('cat-island')],
    topics: ['experiences', 'culture', 'accessibility'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'Official attraction page for the site identity, elevation, construction history, and steep staircase approach. Current access conditions still need a local check.',
  },
  {
    _id: 'research-source-bnt-san-salvador',
    _type: 'researchSource',
    title: 'Parks of San Salvador',
    url: 'https://bnt.bs/explore/san-salvador/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('san-salvador')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'Primary index for the five San Salvador protected-area groups and their conservation purpose.',
  },
  {
    _id: 'research-source-bnt-southern-great-lake',
    _type: 'researchSource',
    title: 'Southern Great Lake National Park',
    url: 'https://bnt.bs/explore/san-salvador/southern-great-lake-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('san-salvador')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary protected-area page. It describes a wilderness site with little infrastructure or trail system and no guard.',
  },
  {
    _id: 'research-source-bnt-andros',
    _type: 'researchSource',
    title: 'Parks of Andros',
    url: 'https://bnt.bs/explore/andros/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('andros')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'Primary index for Andros protected areas and their location, size, type, and conservation purpose.',
  },
  {
    _id: 'research-source-bnt-blue-holes-andros',
    _type: 'researchSource',
    title: 'Blue Holes National Park',
    url: 'https://bnt.bs/explore/andros/blue-holes-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('andros')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Primary park page. At review time it marked the park temporarily closed and described freshwater-buoyancy caution at Capt. Bill’s Blue Hole; recheck before any traveler recommendation.',
  },
  {
    _id: 'research-source-bnt-west-side-andros',
    _type: 'researchSource',
    title: 'West Side National Park',
    url: 'https://bnt.bs/explore/andros/west-side-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('andros')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary park page for boat-only wilderness access, limited infrastructure, and the absence of an on-site guard.',
  },
  {
    _id: 'research-source-bnt-north-south-marine-parks-andros',
    _type: 'researchSource',
    title: 'Andros North & South Marine Parks',
    url: 'https://bnt.bs/explore/andros/northsouthmarinepark/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('andros')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary park page for boat-only access, no-take status, limited infrastructure, and reef conservation context.',
  },
)

sourceDocs.push(
  {
    _id: 'research-source-bmot-hotel-directory-2025-major-islands',
    _type: 'researchSource',
    title: 'The Islands of The Bahamas Hotel Directory — 2025 (major-island research batch)',
    url: 'https://www.tourismtoday.com/sites/default/files/2025-11/Hotel%20Directory%20-%202025%20Final%20Aug%202025.pdf',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('abacos'), destinationReference('bimini'), destinationReference('eleuthera-harbour-island'), destinationReference('the-exumas'), destinationReference('grand-bahama'), destinationReference('nassau-paradise-island')],
    topics: ['stays', 'access'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Scoped citation record for the final six island groups. Directory counts support the 2025 inventory snapshot only, not current operation, availability, or bookability.',
  },
  {
    _id: 'research-source-bnt-fowl-cays',
    _type: 'researchSource',
    title: 'Fowl Cays National Park',
    url: 'https://bnt.bs/explore/abaco/fowl-cays-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('abacos')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary park page for boat-only access, daytime/snorkel moorings, limited infrastructure, and no on-site guard.',
  },
  {
    _id: 'research-source-bnt-pelican-cays',
    _type: 'researchSource',
    title: 'Pelican Cays Land and Sea Park',
    url: 'https://bnt.bs/explore/abaco/pelican-cays-land-and-sea-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('abacos')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary park page for boat-only access, daytime/snorkel moorings, limited infrastructure, and no on-site guard.',
  },
  {
    _id: 'research-source-bnt-exuma-cays-land-sea-park',
    _type: 'researchSource',
    title: 'Exuma Cays Land & Sea Park',
    url: 'https://bnt.bs/explore/exuma/exuma-cays-land-sea-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('the-exumas')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary park page for protected-area identity, trails, moorings, visitor facilities, wardens, office arrangements, and emergency VHF context.',
  },
  {
    _id: 'research-source-bnt-exuma-park-quick-guide',
    _type: 'researchSource',
    title: 'Exuma Cays Land & Sea Park quick guide and rules',
    url: 'https://bnt.bs/wp-content/uploads/2021/12/BNT-Quick-Guide-th-ECLSP.pdf',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('the-exumas')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Official park rules reference. Recheck current regulations before traveler delivery; live fees and office status must not be copied into evergreen content.',
  },
  {
    _id: 'research-source-bnt-lucayan-national-park',
    _type: 'researchSource',
    title: 'Lucayan National Park',
    url: 'https://bnt.bs/explore/grand-bahama/lucayan-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('grand-bahama')],
    topics: ['nature', 'culture', 'access', 'accessibility', 'safety'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary park page for protected cave, mangrove, forest, reef, beach, trail, boardwalk, restroom, visitor-centre, and warden context. Fees and hours remain operational.',
  },
  {
    _id: 'research-source-bnt-leon-levy-preserve',
    _type: 'researchSource',
    title: 'Leon Levy Native Plant Preserve',
    url: 'https://bnt.bs/explore/eleuthera/leon-levy-preserve/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('eleuthera-harbour-island')],
    topics: ['nature', 'culture', 'access', 'accessibility'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'Primary park page for the 30-acre preserve, native-plant and bush-medicine context, trails, boardwalk, visitor centre, and warden. Hours remain operational.',
  },
  {
    _id: 'research-source-bnt-new-providence',
    _type: 'researchSource',
    title: 'Parks of New Providence',
    url: 'https://bnt.bs/explore/new-providence/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('nassau-paradise-island')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'Primary protected-area index for Bonefish Pond, Harrold & Wilson Ponds, Primeval Forest, and The Retreat Garden.',
  },
  {
    _id: 'research-source-bnt-harrold-wilson-ponds',
    _type: 'researchSource',
    title: 'Harrold & Wilson Ponds National Park',
    url: 'https://bnt.bs/explore/new-providence/harrold-and-wilson-ponds-national-park/',
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference('nassau-paradise-island')],
    topics: ['nature', 'access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'Primary park page. At review time it marked the park closed for habitat restoration and infrastructure repairs; recheck before any traveler recommendation.',
  },
  {
    _id: 'research-source-bmot-queens-staircase',
    _type: 'researchSource',
    title: "The Queen's Staircase",
    url: 'https://www.bahamas.com/plan-your-trip/things-to-do/the-queens-staircase',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('nassau-paradise-island')],
    topics: ['culture', 'experiences', 'accessibility'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'Official attraction page for construction history, route purpose, naming, and visible-step count. Current access conditions still require a local check.',
  },
  {
    _id: 'research-source-bmot-bimini-what-to-do',
    _type: 'researchSource',
    title: 'Bimini: what to do',
    url: 'https://www.bahamas.com/bimini/what-to-do',
    publisher: 'Bahamas Ministry of Tourism, Investments & Aviation',
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: [destinationReference('bimini')],
    topics: ['experiences', 'culture', 'nature'],
    checkedAt,
    nextReviewAt: annualReviewAt,
    status: 'active',
    notes: 'Official island experience page used for attraction identity leads such as Dolphin House and Shark Lab. Wildlife and dive activities still require operator and safety verification.',
  },
)

sourceDocs.push(
  {
    _id: 'research-source-operator-baycaner',
    _type: 'researchSource',
    title: 'Baycaner Beach Resort — direct property website',
    url: 'https://www.baycanerbeachresort.com/index.php',
    publisher: 'Baycaner Beach Resort',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('mayaguana')],
    topics: ['stays', 'food', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'The direct property site identifies Baycaner in Pirate’s Well and describes lodging and dining, but its TLS certificate is self-signed and its undated schedules and prices may be stale. Use for identity research only until the security and operational details are independently reconfirmed.',
  },
  {
    _id: 'research-source-corrob-gofishingworldwide-mayaguana-2026',
    _type: 'researchSource',
    title: 'Hosted Mayaguana trip — April 2026',
    url: 'https://www.gofishingworldwide.co.uk/hosted-trips/mayaguana-april/',
    publisher: 'Go Fishing Worldwide',
    sourceClass: 'operator',
    authorityLevel: 'corroborating',
    destinations: [destinationReference('mayaguana')],
    topics: ['stays', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'A dated travel-operator page advertised an April 23–May 1, 2026 hosted trip using Baycaner for seven nights. This corroborates recent commercial use of the identity, not current room availability or any evergreen schedule.',
  },
  {
    _id: 'research-source-aopa-mayaguana-kneeboard-2026',
    _type: 'researchSource',
    title: 'AOPA Mayaguana airport kneeboard — May 2026',
    url: 'https://www.aopa.org/Kneeboard/Kneeboard/GeneratePdf?airportId=MYMM',
    publisher: 'Aircraft Owners and Pilots Association',
    sourceClass: 'industry_body',
    authorityLevel: 'corroborating',
    destinations: [destinationReference('mayaguana')],
    topics: ['stays', 'access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'The kneeboard generated 2026-05-26 says Baycaner offers rentals and airport transportation. This is dated industry corroboration of a service relationship, not property availability or responsible-authority confirmation of runway conditions. Recheck aviation details with the operator and Bahamas authorities.',
  },
  {
    _id: 'research-source-operator-enricas-site',
    _type: 'researchSource',
    title: "Enrica's Inn — direct property website",
    url: 'https://www.enricasinn.com/',
    publisher: "Enrica's Inn",
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('inagua')],
    topics: ['stays'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'The national tourism listing links to this direct property domain, but the TLS certificate was expired at review time. Do not treat the site as proof of current operation or send travelers to it until the certificate and booking path are repaired and reconfirmed.',
  },
  {
    _id: 'research-source-operator-soul-fly',
    _type: 'researchSource',
    title: 'Soul Fly Lodge — direct operator website and journal',
    url: 'https://www.soulflylodge.com/',
    publisher: 'Soul Fly Lodge',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('berry-islands')],
    topics: ['stays', 'food', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'The direct site contains dated 2026 journal entries and a launch-history page that explicitly describes Soul Fly Lodge as the next chapter of the former Carriearl Boutique Hotel. Availability, rates, and flight details remain live operational information.',
  },
  {
    _id: 'research-source-operator-top-choice',
    _type: 'researchSource',
    title: 'Top Choice Bonefish Lodge — direct operator website',
    url: 'https://topchoicebonefishlodge.com/',
    publisher: 'Top Choice Bonefish Lodge',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('acklins-crooked-island')],
    topics: ['stays', 'experiences'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'The direct site identifies Top Choice Bonefish Lodge on Acklins Island. It supports property identity and direct web presence, not current availability, pricing, transport, or launch readiness.',
  },
  {
    _id: 'research-source-operator-ivels',
    _type: 'researchSource',
    title: "IVel's Bed and Breakfast — direct operator website",
    url: 'https://ivelsbedandbreakfast.com/',
    publisher: "IVel's Bed and Breakfast",
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('acklins-crooked-island')],
    topics: ['stays', 'food', 'experiences'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'The direct site identifies IVel’s on Acklins and describes its accommodation types and guest services. It supports identity research only until the canonical location, current bookability, and media rights are reviewed.',
  },
  {
    _id: 'research-source-operator-ivels-cloudbeds',
    _type: 'researchSource',
    title: "IVel's Bed and Breakfast — operator-linked booking profile",
    url: 'https://hotels.cloudbeds.com/reservation/40RmBH',
    publisher: "IVel's Bed and Breakfast / Cloudbeds",
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('acklins-crooked-island')],
    topics: ['stays', 'access'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'The direct IVel’s website links to this booking-provider profile. Its structured data supplies the exact street address and coordinates used for controlled location reconciliation. Prices and availability are runtime-only and must not be copied into evergreen content.',
  },
  {
    _id: 'research-source-operator-greys-point',
    _type: 'researchSource',
    title: "Grey's Point Bonefish Inn — direct operator website",
    url: 'https://greyspointbonefish.com/',
    publisher: "Grey's Point Bonefish Inn",
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('acklins-crooked-island')],
    topics: ['stays', 'experiences'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'The direct site identifies Grey’s Point Bonefish Inn as an Acklins property and describes lodging and fishing packages. It does not by itself establish live availability or launch-ready canonical data.',
  },
  {
    _id: 'research-source-operator-crooked-island-lodge',
    _type: 'researchSource',
    title: 'Crooked Island Lodge & Marina — direct operator website',
    url: 'https://www.crookedislandlodge.com/',
    publisher: 'Crooked Island Lodge & Marina',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('acklins-crooked-island')],
    topics: ['stays', 'food', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'The direct site identifies an eight-room Crooked Island lodge with an associated marina and restaurant. Capacity, marina services, fuel, hours, and availability are operational claims requiring direct recheck before traveler delivery.',
  },
  {
    _id: 'research-source-operator-lost-key',
    _type: 'researchSource',
    title: 'Lost Key Lodge — direct operator website',
    url: 'https://lostkeylodge.com/',
    publisher: 'Lost Key Lodge',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('ragged-island')],
    topics: ['stays', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    status: 'active',
    notes: 'The direct operator site identifies a specialized fishing-lodge operation on Ragged Island. It supports a current property lead but does not establish general hotel availability, live capacity, transport, pricing, or canonical readiness.',
  },
  {
    _id: 'research-source-corrob-meridia-lost-key',
    _type: 'researchSource',
    title: 'Lost Key Lodge — current fishing-travel marketplace profile',
    url: 'https://www.meridiaoutdoors.com/the-bahamas/fishing-lodges/lost-key-lodge',
    publisher: 'Meridia Outdoors',
    sourceClass: 'independent_editorial',
    authorityLevel: 'corroborating',
    destinations: [destinationReference('ragged-island')],
    topics: ['stays', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'A current marketplace profile independently identifies Lost Key Lodge in Duncan Town, Ragged Island. Marketplace capacity, inclusions, prices, seasons, and transport details are live sales claims and must not be copied into canonical content.',
  },
  {
    _id: 'research-source-operator-blessings-aviation',
    _type: 'researchSource',
    title: 'Blessings Aviation — charter destination directory',
    url: 'https://www.blessingsaviation.com/destinations/',
    publisher: 'Blessings Aviation',
    sourceClass: 'transport_operator',
    authorityLevel: 'primary',
    destinations: [destinationReference('inagua'), destinationReference('mayaguana'), destinationReference('ragged-island'), destinationReference('rum-cay')],
    topics: ['access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'The charter operator lists Matthew’s Town, Abraham’s Bay, Duncan Town, and Port Nelson among its destinations and self-identifies as BCAA-licensed. This supports an operator lead only; route feasibility, dates, aircraft, regulatory status, weather, and price require direct confirmation.',
  },
  {
    _id: 'research-source-operator-sumner-point-marina-site',
    _type: 'researchSource',
    title: 'Sumner Point Marina — legacy-looking operator website',
    url: 'https://sumnerpointmarina.com/',
    publisher: 'Sumner Point Marina',
    sourceClass: 'operator',
    authorityLevel: 'discovery_only',
    destinations: [destinationReference('rum-cay')],
    topics: ['stays', 'food', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'needs_recheck',
    notes: 'The site remains online and describes cottages, marina services, and a restaurant, but recent independent reporting conflicts with those claims. Treat the entire site as a stale discovery lead until ownership, physical condition, and operation are resolved.',
  },
  {
    _id: 'research-source-independent-tribune-rum-cay-sumner-point-2026',
    _type: 'researchSource',
    title: 'Rum Cay feud reignites — Sumner Point property report',
    url: 'https://www.tribune242.com/news/2026/may/21/rum-cay-feud-reignites/',
    publisher: 'The Tribune',
    sourceClass: 'independent_editorial',
    authorityLevel: 'corroborating',
    destinations: [destinationReference('rum-cay')],
    topics: ['stays', 'food', 'access', 'safety'],
    checkedAt,
    nextReviewAt: '2026-09-03',
    status: 'active',
    notes: 'A dated May 2026 report describes an active legal/property dispute and says Sumner Point cottages, its restaurant, utilities, dock, and road infrastructure had been destroyed. Use to block stale service claims, not to resolve the underlying legal ownership question.',
  },
)

const factDocs = officialIslands.map((item) => {
  const row = rows.find((candidate) => candidate.slug === item.slug)
  return {
    _id: `drafts.island-fact-official-baseline-${item.slug}`,
    _type: 'islandFact',
    title: `${row.name}: official identity and gateways baseline`,
    destination: {_type: 'reference', _ref: row.destinationId},
    topic: 'overview',
    claim: `${row.name} is presented by the national tourism authority around ${item.theme}. Its highlighted anchors include ${item.highlights.join(', ')}. The same source currently names these gateways: ${item.gateways.join(', ')}.`,
    travelerGuidance: 'Use this as a research baseline, not as proof of current service, operating hours, or availability. Recheck transport with the applicable operator before traveler delivery.',
    sources: [{_type: 'reference', _key: `source-${item.slug}`, _ref: `research-source-bmot-${item.slug}`}],
    checkedAt,
    nextReviewAt: operationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Paraphrased from the official island profile. Editorial approval and transport corroboration are still required; delivery channels intentionally left empty.',
  }
})

const priorityOperationalFacts = [
  {
    slug: 'ragged-island',
    topic: 'stays',
    key: 'base-island-stay-pattern',
    title: 'Ragged Island: Long Island base-stay pattern',
    claim: 'The official tourism profile currently advises most visitors to stay on nearby Long Island and visit Ragged Island by boat or charter flight.',
    guidance: 'Do not invent or imply on-island accommodation. Recheck current operators and treat transport as operational information before recommending a day trip.',
  },
  {
    slug: 'rum-cay',
    topic: 'stays',
    key: 'base-island-stay-pattern',
    title: 'Rum Cay: Long Island base-stay pattern',
    claim: 'The official tourism profile currently advises using nearby Long Island as the accommodation base and reaching Rum Cay by boat or charter flight.',
    guidance: 'The three existing Rum Cay hotel candidates conflict with this baseline and require identity, location, and operating-status adjudication before traveler delivery.',
  },
  {
    slug: 'acklins-crooked-island',
    topic: 'access',
    key: 'inter-island-access-baseline',
    title: 'Acklins & Crooked Island: access baseline',
    claim: 'The official tourism profile identifies Spring Point Airport for Acklins, Colonel Hill Airport for Crooked Island, and ferry or private-boat connections among Acklins, Crooked Island, and Long Cay.',
    guidance: 'The page includes service-frequency language that may change. Confirm current ferry and flight operation with the carrier before giving traveler instructions.',
  },
  {
    slug: 'inagua',
    topic: 'access',
    key: 'air-mailboat-access-baseline',
    title: 'Inagua: air and mail-boat access baseline',
    claim: 'The official tourism profile identifies Great Inagua Airport as the common air gateway and also describes mail-boat access from Nassau; Little Inagua is described as boat-access only.',
    guidance: 'Mail-boat timing and air service are operational facts. Recheck the carrier or port source before traveler delivery.',
  },
  {
    slug: 'berry-islands',
    topic: 'access',
    key: 'two-gateway-access-baseline',
    title: 'The Berry Islands: Great Harbour Cay and Chub Cay gateways',
    claim: 'The official tourism profile identifies Great Harbour Cay and Chub Cay as the principal inhabited hubs and names air and sea access for both.',
    guidance: 'Confirm current flight, charter, marina, and local transfer operation before turning this island-level baseline into an itinerary.',
  },
]

for (const item of priorityOperationalFacts) {
  const row = rows.find((candidate) => candidate.slug === item.slug)
  factDocs.push({
    _id: `drafts.island-fact-${item.key}-${item.slug}`,
    _type: 'islandFact',
    title: item.title,
    destination: {_type: 'reference', _ref: row.destinationId},
    topic: item.topic,
    claim: item.claim,
    travelerGuidance: item.guidance,
    sources: [{_type: 'reference', _key: `source-${item.slug}`, _ref: `research-source-bmot-${item.slug}`}],
    checkedAt,
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    verificationStatus: 'source_verified',
    editorNotes: 'Source-level baseline only. Requires operator corroboration and editorial approval; delivery channels intentionally left empty.',
  })
}

function addDeepResearchFact({slug, key, title, topic, claim, travelerGuidance, sourceIds, nextReviewAt = operationalReviewAt, volatility = 'operational', confidence = 'high', editorNotes}) {
  const row = rows.find((candidate) => candidate.slug === slug)
  factDocs.push({
    _id: `drafts.island-fact-deep-research-${key}-${slug}`,
    _type: 'islandFact',
    title,
    destination: {_type: 'reference', _ref: row.destinationId},
    topic,
    claim,
    travelerGuidance,
    sources: sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    checkedAt,
    nextReviewAt,
    volatility,
    confidence,
    verificationStatus: 'source_verified',
    editorNotes: `${editorNotes} Delivery channels intentionally left empty pending editorial and consumer review.`,
  })
}

addDeepResearchFact({
  slug: 'mayaguana',
  key: '2025-accommodation-directory',
  title: 'Mayaguana: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory lists Baycaner Beach Resort as Mayaguana’s only directory entry and records 12 rooms. The national tourism website also maintains a Baycaner property listing.',
  travelerGuidance: 'Treat this as an identity and inventory baseline, not proof of current availability or operating status. Confirm directly before recommending or planning an overnight stay.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-bmot-baycaner'],
  editorNotes: 'The current canonical catalog has zero in-bounds active Mayaguana places; its Baycaner overlay is inactive. Reconcile the official listing, coordinates, media rights, and operating status before activation.',
})

addDeepResearchFact({
  slug: 'inagua',
  key: '2025-accommodation-directory',
  title: 'Inagua: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory lists three Inagua properties: Brensville Suite with 8 rooms, Enrica’s Inn with 15 rooms, and Mally Suites with 6 rooms. Separate tourism listings corroborate Enrica’s Inn and a property page labeled Malley Suites.',
  travelerGuidance: 'Use the names and room counts as a directory snapshot only. Confirm identity spelling, current operation, rates, and availability directly before traveler delivery.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-bmot-enricas-inn', 'research-source-bmot-mally-suites'],
  editorNotes: 'The canonical catalog currently has 12 active Inagua location failures and only 2 in-bounds active records. Enrica’s exists only as an inactive overlay, while Brensville and Mally/Malley need canonical reconciliation.',
})

addDeepResearchFact({
  slug: 'acklins-crooked-island',
  key: '2025-accommodation-directory',
  title: 'Acklins & Crooked Island: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory lists multiple accommodations across Acklins and Crooked Island. Named entries include IVel’s, Top Choice Bonefish, Grey’s Point, Salina Point Lodge, Crooked & Acklins Trophy Lodge, Serenity Beach Villas, Sonsette, Nature’s Delight, and Crooked Island Lodge & Marina.',
  travelerGuidance: 'The list establishes research candidates, not current availability. Confirm each property’s island, coordinates, operating status, and booking contact before canonical publication.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-bmot-acklins-trophy-lodge'],
  editorNotes: 'Only 2 current active place records fall within the combined-island review bounds; 7 active rows are location failures. The official candidates must be reconciled one by one rather than bulk-activated.',
})

addDeepResearchFact({
  slug: 'berry-islands',
  key: '2025-accommodation-directory',
  title: 'The Berry Islands: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory lists Chub Cay Resort, 5 Bays of Pirates, Soul Fly Lodge (formerly Carriearl), and The Osprey for the Berry Islands. The tourism website separately maintains a Chub Cay Club listing.',
  travelerGuidance: 'Recheck current property names and operation before recommendations. In particular, avoid presenting Carriearl as the current identity without reconciling the directory’s Soul Fly Lodge rename.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-bmot-chub-cay-club'],
  editorNotes: 'The canonical catalog contains an active Carriearl record and should be reviewed for stale naming. Three other active Berry Islands rows fail the location gate.',
})

addDeepResearchFact({
  slug: 'berry-islands',
  key: 'flos-conch-bar-identity',
  title: "The Berry Islands: Flo's Conch Bar identity",
  topic: 'food',
  claim: "The national tourism authority maintains a restaurant listing for Flo's Conch Bar in the Berry Islands.",
  travelerGuidance: 'This verifies a research candidate only. Confirm current opening arrangements, transport, payment expectations, and exact coordinates before traveler delivery.',
  sourceIds: ['research-source-bmot-flos-conch-bar'],
  nextReviewAt: '2026-09-03',
  confidence: 'medium',
  editorNotes: "Flo's already exists as an inactive canonical overlay. Reconcile identity and location, then complete the place publication gate before any activation.",
})

addDeepResearchFact({
  slug: 'rum-cay',
  key: 'ocean-view-restaurant-identity',
  title: 'Rum Cay: Ocean View Restaurant & Bar identity',
  topic: 'food',
  claim: 'The national tourism authority maintains a restaurant listing for Ocean View Restaurant & Bar on Rum Cay.',
  travelerGuidance: 'This verifies a research candidate only. Confirm current opening arrangements, menu availability, payment expectations, and exact coordinates before traveler delivery.',
  sourceIds: ['research-source-bmot-ocean-view-restaurant'],
  nextReviewAt: '2026-09-03',
  confidence: 'medium',
  editorNotes: 'Ocean View already exists as an inactive canonical overlay. All but one current active Rum Cay place fail the location gate, so no bulk activation is safe.',
})

addDeepResearchFact({
  slug: 'inagua',
  key: 'lighthouse-restaurant-identity',
  title: 'Inagua: Lighthouse Restaurant Bar and Grill identity',
  topic: 'food',
  claim: 'The national tourism authority maintains a vendor listing for Lighthouse Restaurant Bar and Grill on Inagua.',
  travelerGuidance: 'This verifies a research candidate only. Confirm current opening arrangements, payment expectations, and exact coordinates before traveler delivery.',
  sourceIds: ['research-source-bmot-lighthouse-restaurant-inagua'],
  nextReviewAt: '2026-09-03',
  confidence: 'medium',
  editorNotes: 'The current canonical catalog does not provide a clean, verified match for this listing. Create or reconcile only after identity and location adjudication.',
})

addDeepResearchFact({
  slug: 'inagua',
  key: 'little-inagua-access-conservation',
  title: 'Little Inagua: protected-area access constraints',
  topic: 'nature',
  claim: 'The Bahamas National Trust describes Little Inagua National Park as remote and accessible by boat, with no freshwater and little or no visitor infrastructure or trails. The protected area is designated no-take.',
  travelerGuidance: 'Do not frame Little Inagua as a casual self-guided outing. Any visit needs current local transport, weather, safety, conservation, and provisioning checks.',
  sourceIds: ['research-source-bnt-little-inagua'],
  confidence: 'high',
  editorNotes: 'The conservation status is strong primary-source evidence; access conditions remain operational and require a pre-trip recheck.',
})

for (const slug of ['ragged-island', 'rum-cay']) {
  const airportName = slug === 'ragged-island' ? 'Duncan Town Airport' : 'New Port Nelson Airport'
  addDeepResearchFact({
    slug,
    key: '2026-government-aerodrome-constraints',
    title: `${airportName}: 2026 regulator baseline`,
    topic: 'access',
    claim: `The 2026 Civil Aviation Authority Bahamas government-owned aerodromes register records ${airportName} as a daylight/VFR aerodrome and indicates that it is neither a refueling point nor a port of entry.`,
    travelerGuidance: 'This is facility-level context, not a flight schedule or assurance of service. International arrivals, charter feasibility, fuel planning, and current operating conditions require direct operator and authority confirmation.',
    sourceIds: ['research-source-caab-government-aerodromes-2026', 'research-source-doa-airports'],
    confidence: 'high',
    editorNotes: 'Keep out of casual traveler copy until safety/editorial review. It is useful for preventing the app from implying full-service airport facilities.',
  })
}

addDeepResearchFact({
  slug: 'mayaguana',
  key: 'official-air-service-check',
  title: 'Mayaguana: official air-service research baseline',
  topic: 'access',
  claim: 'The national tourism authority’s flying guide currently lists Bahamasair service between Nassau and Mayaguana, while the Department of Aviation identifies Mayaguana Airport as MYG.',
  travelerGuidance: 'Route operation, days, times, seats, and disruptions are live or operational facts. Confirm through the carrier at planning time.',
  sourceIds: ['research-source-bmot-flying', 'research-source-doa-airports'],
  nextReviewAt: '2026-09-03',
  confidence: 'medium',
  editorNotes: 'Use only as a dated research baseline. Do not copy schedules into Sanity or treat the tourism guide as live inventory.',
})

addDeepResearchFact({
  slug: 'inagua',
  key: 'official-air-service-check',
  title: 'Inagua: official air-service research baseline',
  topic: 'access',
  claim: 'The national tourism authority’s flying guide currently lists Bahamasair service between Nassau and Inagua.',
  travelerGuidance: 'Route operation, days, times, seats, and disruptions are live or operational facts. Confirm through the carrier at planning time.',
  sourceIds: ['research-source-bmot-flying', 'research-source-bahamasair'],
  nextReviewAt: '2026-09-03',
  confidence: 'medium',
  editorNotes: 'Use only as a dated research baseline. Do not copy schedules into Sanity or treat the tourism guide as live inventory.',
})

addDeepResearchFact({
  slug: 'long-island',
  key: '2025-accommodation-directory',
  title: 'Long Island: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory records 10 Long Island properties totaling 182 rooms. The named entries are Cape Santa Maria Beach Resort, Stella Maris Resort, Long Island Harbour Club, Ellen’s Inn, Long Island Bonefish Lodge, Smith & Wells Guest House, Gems at Paradise Beach Hotel, Harbor Breeze Villas, Winter Haven Inn, and Chez Pierre Hotel & Restaurant.',
  travelerGuidance: 'Treat the list and room total as a dated directory snapshot. Confirm current identity, operation, rates, and availability directly before recommending a stay.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-mid-islands'],
  editorNotes: 'Current canonical data has 3 stay candidates, far fewer than the official directory snapshot, and one active assigned hotel is The Cove at Atlantis in Nassau. Reconcile the directory candidates without bulk activation.',
})

addDeepResearchFact({
  slug: 'cat-island',
  key: '2025-accommodation-directory',
  title: 'Cat Island: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory records 13 Cat Island properties totaling 143 rooms. Entries span Bennett’s Harbour, Orange Creek, Roker’s, New Bight, Fernandez Bay, Old Bight, Port Howe, Hawk’s Nest, and Smith’s Bay.',
  travelerGuidance: 'Treat the count, room total, and settlement coverage as a dated directory snapshot. Confirm each property’s current identity, operation, rates, and availability before traveler delivery.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-mid-islands'],
  editorNotes: 'Current canonical data has 6 stay candidates, including an active Club Med Columbus record that belongs to San Salvador. Reconcile official candidates one by one.',
})

addDeepResearchFact({
  slug: 'san-salvador',
  key: '2025-accommodation-directory',
  title: 'San Salvador: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory records four San Salvador properties totaling 294 rooms: Club Mediterranee Columbus Isle, Guanahani Beach Club Resort, Riding Rock Inn Resort & Marina, and The Sands Hotel.',
  travelerGuidance: 'Treat the list and room total as a dated directory snapshot. Confirm current identity, operation, rates, and availability directly before recommending a stay.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-mid-islands'],
  editorNotes: 'The current catalog has 9 stay candidates, but most assigned active hotels resolve to San Salvador, El Salvador. Reconcile the four official Bahamas candidates and quarantine the foreign records.',
})

addDeepResearchFact({
  slug: 'andros',
  key: '2025-accommodation-directory',
  title: 'Andros: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory summarizes 46 Andros properties totaling 445 rooms across the northern, central, and southern districts.',
  travelerGuidance: 'The count establishes the scale of the official directory snapshot, not current bookable inventory. Reconcile candidates by district, settlement, and gateway before traveler delivery.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-mid-islands'],
  editorNotes: 'The current canonical catalog has only 10 stay candidates and no described, verified, or media-ready places. Use the directory as an adjudication source, not an activation source.',
})

addDeepResearchFact({
  slug: 'cat-island',
  key: 'mount-alvernia-hermitage',
  title: 'Cat Island: Mount Alvernia and The Hermitage identity',
  topic: 'culture',
  claim: 'The national tourism authority identifies Mount Alvernia, also called Como Hill, as the highest point in The Bahamas at 206 feet (63 metres). It says Father Jerome built The Hermitage there from local stone in 1939.',
  travelerGuidance: 'The approach includes a stone staircase on a steep, rocky incline. Do not imply step-free access; current trail and weather conditions still need checking.',
  sourceIds: ['research-source-bmot-hermitage-mount-alvernia'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'The historical identity and elevation are stable. The accessibility limitation is evident from the official description but still needs an explicit local accessibility review.',
})

addDeepResearchFact({
  slug: 'long-island',
  key: 'conception-island-access',
  title: 'Conception Island National Park: access and marine constraints',
  topic: 'nature',
  claim: 'The Bahamas National Trust describes Conception Island National Park as boat-access only, with little to no infrastructure or trail systems and no on-site guard. It identifies moorings, a four-knot limit inside Conception Creek, and marine conditions that require caution.',
  travelerGuidance: 'Do not present the park as a casual self-guided beach stop. Any visit requires current vessel, weather, anchorage, provisioning, conservation, and water-safety checks.',
  sourceIds: ['research-source-bnt-conception-island'],
  confidence: 'high',
  editorNotes: 'The park is geographically near both Long Island and Rum Cay. This fact is attached to Long Island for planning context but should not imply municipal ownership or routine transport.',
})

addDeepResearchFact({
  slug: 'san-salvador',
  key: 'protected-area-network',
  title: 'San Salvador: protected-area network baseline',
  topic: 'nature',
  claim: 'The Bahamas National Trust identifies five protected-area groups on San Salvador: Graham’s Harbour Iguana & Seabird National Park, Green’s Bay National Park, Pigeon Creek & Snow Bay National Park, Southern Great Lake National Park, and West Coast Marine Park.',
  travelerGuidance: 'The protected-area identities do not establish road, trail, boat, or visitor access. Check the park-specific page and local conditions before recommending a visit.',
  sourceIds: ['research-source-bnt-san-salvador'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'Use the park index as a taxonomy baseline. Individual access, conservation rules, and suitability need park-level evidence.',
})

addDeepResearchFact({
  slug: 'san-salvador',
  key: 'southern-great-lake-access',
  title: 'Southern Great Lake National Park: wilderness access baseline',
  topic: 'nature',
  claim: 'The Bahamas National Trust describes Southern Great Lake National Park as a pristine mangrove ecosystem and wilderness site with little infrastructure or trail systems and no on-site guard.',
  travelerGuidance: 'Do not imply maintained visitor facilities or independent accessibility. Confirm approach, water conditions, local guidance, and emergency readiness before a visit.',
  sourceIds: ['research-source-bnt-southern-great-lake'],
  confidence: 'high',
  editorNotes: 'This supplies conservation and limitation context, not a complete access route or visitor plan.',
})

addDeepResearchFact({
  slug: 'andros',
  key: 'blue-holes-temporary-closure',
  title: 'Blue Holes National Park: current closure and water caution',
  topic: 'safety',
  claim: 'At the 2026-08-04 review, the Bahamas National Trust page marked Blue Holes National Park temporarily closed. The same page warns that the freshwater surface layer at Capt. Bill’s Blue Hole is less buoyant than saltwater and can make floating more difficult.',
  travelerGuidance: 'Do not recommend entry while the official page reports a closure. Recheck the park authority before planning and retain explicit water-safety caution if access reopens.',
  sourceIds: ['research-source-bnt-blue-holes-andros'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'This is operational safety evidence and must never become an undated evergreen claim. Delivery channels remain empty.',
})

addDeepResearchFact({
  slug: 'andros',
  key: 'west-side-boat-only',
  title: 'West Side National Park: boat-only wilderness access',
  topic: 'nature',
  claim: 'The Bahamas National Trust describes West Side National Park as accessible only by boat, with little infrastructure or trail system and no on-site guard.',
  travelerGuidance: 'Do not frame this as a casual self-guided outing. Current vessel, local guide, weather, communications, provisioning, conservation, and emergency planning are required.',
  sourceIds: ['research-source-bnt-west-side-andros'],
  confidence: 'high',
  editorNotes: 'The identity and protected status are strong; practical access remains operational and should be rechecked for every trip.',
})

addDeepResearchFact({
  slug: 'andros',
  key: 'north-south-marine-parks',
  title: 'Andros North & South Marine Parks: boat-only no-take baseline',
  topic: 'nature',
  claim: 'The Bahamas National Trust describes the Andros North & South Marine Parks as boat-access only, with little to no infrastructure or trail systems, and designates them as no-take zones.',
  travelerGuidance: 'Respect the no-take rule and confirm current access, dive/snorkel operator, weather, and water-safety conditions before planning a visit.',
  sourceIds: ['research-source-bnt-north-south-marine-parks-andros'],
  confidence: 'high',
  editorNotes: 'The source notes an active warden, but this fact does not imply continuous visitor supervision or emergency coverage.',
})

addDeepResearchFact({
  slug: 'abacos',
  key: '2025-accommodation-directory',
  title: 'The Abacos: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory summarizes 40 Abaco properties totaling 1,465 rooms.',
  travelerGuidance: 'The count establishes the scale of the official directory snapshot, not current bookable inventory. Reconcile candidates by cay, settlement, and gateway before traveler delivery.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-major-islands'],
  editorNotes: 'The current canonical catalog has 10 stay candidates, no verified or launch-ready records, and an active Lubbers’ Landing row with missing coordinates.',
})

addDeepResearchFact({
  slug: 'bimini',
  key: '2025-accommodation-directory',
  title: 'Bimini: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory summarizes six Bimini properties totaling 427 rooms.',
  travelerGuidance: 'The count establishes a dated directory snapshot, not current bookable inventory. Confirm each property’s island, coordinates, operation, rates, and availability before traveler delivery.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-major-islands'],
  editorNotes: 'The current canonical catalog has 10 stay candidates, including plausible active properties with missing coordinates. Reconcile all identities rather than assuming the larger candidate count is more complete.',
})

addDeepResearchFact({
  slug: 'eleuthera-harbour-island',
  key: '2025-accommodation-directory',
  title: 'Eleuthera & Harbour Island: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory summarizes 29 Eleuthera mainland properties with 399 rooms and 14 Harbour Island and Spanish Wells properties with 257 rooms, for a combined 43 properties and 656 rooms.',
  travelerGuidance: 'Treat the totals as a dated directory snapshot. Preserve the distinction among Eleuthera mainland, Harbour Island, and Spanish Wells when reconciling identity and access.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-major-islands'],
  editorNotes: 'The current canonical catalog has 11 stay candidates and only one active location failure, but no records are described, verified, or media-ready.',
})

addDeepResearchFact({
  slug: 'the-exumas',
  key: '2025-accommodation-directory',
  title: 'The Exumas: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory summarizes 27 properties across Exuma mainland and the cays, totaling 494 rooms.',
  travelerGuidance: 'The count establishes a dated directory snapshot, not current bookable inventory. Reconcile properties by cay, settlement, access pattern, and provider identity before traveler delivery.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-major-islands'],
  editorNotes: 'All 28 current active place candidates fall inside the broad island-group bounds, but none has a sourced description, managed media, verification, or complete launch gate.',
})

addDeepResearchFact({
  slug: 'grand-bahama',
  key: '2025-accommodation-directory',
  title: 'Grand Bahama: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory summarizes 17 Grand Bahama properties totaling 1,520 rooms.',
  travelerGuidance: 'The count establishes a dated directory snapshot, not current bookable inventory. Confirm operation, recovery or renovation status, rates, and availability before traveler delivery.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-major-islands'],
  editorNotes: 'The current canonical catalog has 10 stay candidates and no verified or launch-ready places. Recent operational history makes direct property checking especially important.',
})

addDeepResearchFact({
  slug: 'nassau-paradise-island',
  key: '2025-accommodation-directory',
  title: 'Nassau & Paradise Island: 2025 official accommodation baseline',
  topic: 'stays',
  claim: 'The 2025 official Bahamas hotel directory reports a combined 52 properties and 10,274 rooms across New Providence and Paradise Island.',
  travelerGuidance: 'The total is a dated directory snapshot, not current availability. Use live provider inventory for booking and reconcile canonical identity before editorial recommendations.',
  sourceIds: ['research-source-bmot-hotel-directory-2025-major-islands'],
  editorNotes: 'All 30 current active place candidates fall inside the broad island-group bounds, but the catalog has only 10 stay candidates and none passes the full content and verification gate.',
})

addDeepResearchFact({
  slug: 'abacos',
  key: 'fowl-pelican-cays-access',
  title: 'The Abacos: Fowl Cays and Pelican Cays access baseline',
  topic: 'nature',
  claim: 'The Bahamas National Trust describes both Fowl Cays National Park and Pelican Cays Land and Sea Park as boat-access only, with little infrastructure or trail systems and no on-site guard. Both pages identify daytime or snorkel moorings.',
  travelerGuidance: 'Do not present either park as a casual shore-based stop. Confirm vessel, mooring rules or fees, weather, water safety, conservation rules, and emergency readiness before visiting.',
  sourceIds: ['research-source-bnt-fowl-cays', 'research-source-bnt-pelican-cays'],
  confidence: 'high',
  editorNotes: 'Mooring fee language is operational and intentionally omitted from the claim. Recheck both park pages before traveler delivery.',
})

addDeepResearchFact({
  slug: 'bimini',
  key: 'dolphin-house-shark-lab-anchors',
  title: 'Bimini: Dolphin House and Shark Lab identity anchors',
  topic: 'experiences',
  claim: 'The national tourism authority’s Bimini experience page identifies Dolphin House and Shark Lab as notable island visitor anchors alongside fishing, diving, shipwrecks, and wildlife experiences.',
  travelerGuidance: 'This establishes attraction identity and destination fit only. Confirm current visitor access, reservations, operator status, wildlife practices, and water-safety requirements before recommending an activity.',
  sourceIds: ['research-source-bmot-bimini-what-to-do', 'research-source-bmot-bimini'],
  nextReviewAt: operationalReviewAt,
  confidence: 'medium',
  editorNotes: 'The tourism page is a primary discovery source, not current operator or conservation proof. Each activity still needs its own accountable source.',
})

addDeepResearchFact({
  slug: 'eleuthera-harbour-island',
  key: 'leon-levy-preserve',
  title: 'Eleuthera: Leon Levy Native Plant Preserve baseline',
  topic: 'nature',
  claim: 'The Bahamas National Trust describes the Leon Levy Native Plant Preserve as a 30-acre botanic garden in Governor’s Harbour and the first and only national park on Eleuthera. It highlights native and endemic plants, traditional bush medicine, trails, a mangrove boardwalk, a visitor centre, and an active warden.',
  travelerGuidance: 'The listed facilities do not prove step-free access across the preserve. Confirm current hours, admission, trail condition, and accessibility before recommending a visit.',
  sourceIds: ['research-source-bnt-leon-levy-preserve'],
  confidence: 'high',
  editorNotes: 'Keep hours and any fees out of evergreen copy. A full mobility and sensory accessibility audit is still missing.',
})

addDeepResearchFact({
  slug: 'the-exumas',
  key: 'exuma-cays-park-rules',
  title: 'Exuma Cays Land & Sea Park: protected-area rules baseline',
  topic: 'nature',
  claim: 'The Bahamas National Trust identifies Exuma Cays Land & Sea Park as a protected marine and terrestrial park with wardens, moorings, trails, visitor facilities, and a remote park office. Its official rules prohibit fishing, shelling, and conching.',
  travelerGuidance: 'Treat the park as a protected no-take environment. Recheck current rules, moorings, fees, office contact, VHF procedures, weather, and vessel requirements before visiting.',
  sourceIds: ['research-source-bnt-exuma-cays-land-sea-park', 'research-source-bnt-exuma-park-quick-guide'],
  confidence: 'high',
  editorNotes: 'The no-take rule is strong primary-source evidence; operational contacts and fees remain short-review facts.',
})

addDeepResearchFact({
  slug: 'grand-bahama',
  key: 'lucayan-national-park',
  title: 'Grand Bahama: Lucayan National Park identity and facilities',
  topic: 'nature',
  claim: 'The Bahamas National Trust says Lucayan National Park protects an extensive charted underwater cave system, Lucayan remains, pine forest, mangrove creek, coral reef, and Gold Rock Beach. The park page identifies boardwalks, trails, restrooms, a visitor centre, beach access, and an active warden.',
  travelerGuidance: 'Do not infer that the cave system is open for recreational diving. Confirm current park hours, fees, trail and beach conditions, guided access, and accessibility before visiting.',
  sourceIds: ['research-source-bnt-lucayan-national-park'],
  confidence: 'high',
  editorNotes: 'The facilities are source-verified but not a substitute for a full accessibility audit. Historical cave-diving access is restricted context, not a visitor invitation.',
})

addDeepResearchFact({
  slug: 'nassau-paradise-island',
  key: 'new-providence-park-network',
  title: 'New Providence: national-park network baseline',
  topic: 'nature',
  claim: 'The Bahamas National Trust identifies four national-park sites on New Providence: Bonefish Pond National Park, Harrold & Wilson Ponds National Park, Primeval Forest National Park, and The Retreat Garden.',
  travelerGuidance: 'The park identities do not establish that every site is currently open or accessible. Check the individual park page before recommending a visit.',
  sourceIds: ['research-source-bnt-new-providence'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'Individual operating conditions remain separate facts; Harrold & Wilson Ponds is currently documented as closed.',
})

addDeepResearchFact({
  slug: 'nassau-paradise-island',
  key: 'harrold-wilson-current-closure',
  title: 'Harrold & Wilson Ponds: current closure',
  topic: 'safety',
  claim: 'At the 2026-08-04 review, the Bahamas National Trust page marked Harrold & Wilson Ponds National Park closed for habitat restoration and infrastructure repairs.',
  travelerGuidance: 'Do not recommend a visit while the responsible authority reports the closure. Recheck the park page before planning.',
  sourceIds: ['research-source-bnt-harrold-wilson-ponds'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'This is operational closure evidence and must never become an undated evergreen claim. Delivery channels remain empty.',
})

addDeepResearchFact({
  slug: 'nassau-paradise-island',
  key: 'queens-staircase-history',
  title: "Nassau: Queen's Staircase historical baseline",
  topic: 'culture',
  claim: 'The national tourism authority says the Queen’s Staircase was hewn from solid limestone by enslaved people in 1793–1794 to provide a direct route from Fort Fincastle to Nassau. Commonly called the 66 Steps, it now has 65 visible steps because the bottom step is covered by paving.',
  travelerGuidance: 'Preserve the site’s history accurately and avoid romanticising the forced labour behind its construction. Confirm current route and accessibility conditions before a visit.',
  sourceIds: ['research-source-bmot-queens-staircase'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'Stable historical fact; current physical access and mobility information still need an explicit local review.',
})

addDeepResearchFact({
  slug: 'mayaguana',
  key: 'baycaner-operator-reconciliation',
  title: 'Mayaguana: Baycaner operator evidence and website caveat',
  topic: 'stays',
  claim: 'Baycaner Beach Resort has a direct property website, and a dated travel-operator page advertised an April 23–May 1, 2026 hosted trip using Baycaner for seven nights. The property website had a self-signed TLS certificate at the 2026-08-04 review.',
  travelerGuidance: 'This improves confidence in the current property identity but does not prove today’s operation or availability. Do not rely on the property website’s undated schedules or prices; verify the stay and transport directly before planning.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-operator-baycaner', 'research-source-corrob-gofishingworldwide-mayaguana-2026'],
  nextReviewAt: '2026-09-03',
  confidence: 'medium',
  editorNotes: 'The direct domain is not safe enough to promote as a traveler link until its TLS configuration is repaired. Exact location is handled by the separate official-map fact; current operation, content, and media remain unresolved.',
})

addDeepResearchFact({
  slug: 'mayaguana',
  key: 'baycaner-official-map-location',
  title: 'Mayaguana: Baycaner exact-location evidence',
  topic: 'stays',
  claim: 'The national tourism authority’s current Baycaner listing links to official map business ID 760, whose backend pin is 22.434536842839, -73.10189679265 in Pirate’s Well. The direct property site independently publishes plus code CVMX+W78 for the resort.',
  travelerGuidance: 'Use this as accountable coordinate evidence for controlled data correction only. It does not prove today’s operation, room availability, safe transport, or physical accessibility.',
  sourceIds: ['research-source-bmot-baycaner', 'research-source-bmot-business-map-pins', 'research-source-operator-baycaner'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'The two accountable location representations close the exact-coordinate research gap. The direct site still has a certificate problem, and all live operational details require recheck.',
})

addDeepResearchFact({
  slug: 'inagua',
  key: 'enricas-official-map-location',
  title: 'Inagua: Enrica’s exact-location evidence with address discrepancy',
  topic: 'stays',
  claim: 'The national tourism authority’s Enrica’s listing links to official map business ID 838, whose backend pin is 20.945487474536, -73.675195508451 in Matthew Town. The current listing says Victory & Taylor Streets, while the 2025 official hotel directory says Victory & Matthew Streets.',
  travelerGuidance: 'The pin supports controlled coordinate correction, but the street-name discrepancy must remain visible until the operator or a controlled local check resolves it. Current operation and availability remain separate checks.',
  sourceIds: ['research-source-bmot-enricas-inn', 'research-source-bmot-business-map-pins', 'research-source-bmot-hotel-directory-2025'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'medium',
  editorNotes: 'Close the exact-coordinate gap but retain the address conflict as an open data-quality issue. Do not use the expired-certificate direct site as the traveler link.',
})

addDeepResearchFact({
  slug: 'rum-cay',
  key: 'ocean-view-official-map-location',
  title: 'Rum Cay: Ocean View exact-location evidence',
  topic: 'food',
  claim: 'The national tourism authority’s Ocean View Restaurant & Bar listing links to official map business ID 3609, whose backend pin is 23.650244, -74.840713 at Pearl Street, Port Nelson.',
  travelerGuidance: 'Use this as accountable coordinate evidence for controlled data correction only. The map pin does not prove current operation, opening hours, payment arrangements, or physical accessibility.',
  sourceIds: ['research-source-bmot-ocean-view-restaurant', 'research-source-bmot-business-map-pins'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'The official map backend closes the exact-coordinate research gap. Its record was last updated in 2020, so every operational claim remains blocked pending a direct recheck.',
})

addDeepResearchFact({
  slug: 'mayaguana',
  key: 'baycaner-accessibility-label',
  title: 'Mayaguana: Baycaner accessibility label needs feature-level verification',
  topic: 'accessibility',
  claim: 'The 2025 official hotel directory marks Baycaner Beach Resort with its HA code for handicapped access, and the current national tourism listing labels the property Handicap Accessible. Neither source identifies the accessible rooms, routes, bathrooms, transfers, beach access, or measurement method.',
  travelerGuidance: 'Treat this as a verification lead, not an accessibility promise. Confirm the traveler’s exact mobility, sensory, communication, and transfer needs directly before planning.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-bmot-baycaner'],
  nextReviewAt: operationalReviewAt,
  confidence: 'medium',
  editorNotes: 'Two official labels improve confidence that some accommodation may exist, but the absence of feature-level evidence keeps the physical-accessibility gate open.',
})

addDeepResearchFact({
  slug: 'inagua',
  key: 'enricas-accessibility-label',
  title: 'Inagua: Enrica’s accessibility label needs feature-level verification',
  topic: 'accessibility',
  claim: 'The current national tourism listing labels Enrica’s Inn Handicap Accessible but supplies no details about accessible rooms, routes, bathrooms, transfers, dining spaces, or the basis and date of the label.',
  travelerGuidance: 'Treat this as a verification lead, not an accessibility promise. Confirm the traveler’s exact mobility, sensory, communication, and transfer needs directly before planning.',
  sourceIds: ['research-source-bmot-enricas-inn'],
  nextReviewAt: operationalReviewAt,
  confidence: 'medium',
  editorNotes: 'A place-specific official label is useful but does not close the physical-accessibility gate without feature-level operator or local verification.',
})

addDeepResearchFact({
  slug: 'berry-islands',
  key: 'soul-fly-current-operation-checkpoint',
  title: 'Berry Islands: Soul Fly current operation checkpoint',
  topic: 'stays',
  claim: 'At the 2026-08-04 check, Soul Fly Lodge’s direct operator site invited availability inquiries and said it was securing prime tides for Fall 2026 and Winter/Spring 2027. The same site contains dated journal activity through May 8, 2026.',
  travelerGuidance: 'This supports a current operator and booking-inquiry path, not guaranteed inventory, rates, transport, or suitability. Confirm the exact trip directly at planning time.',
  sourceIds: ['research-source-operator-soul-fly'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'Current operation evidence is strong enough for internal reconciliation. Keep pricing and availability at runtime, and keep the place inactive until canonical, media, safety, accessibility, and editorial gates pass.',
})

addDeepResearchFact({
  slug: 'acklins-crooked-island',
  key: 'ivels-current-operation-checkpoint',
  title: 'Acklins: IVel’s current operation checkpoint',
  topic: 'stays',
  claim: 'At the 2026-08-04 check, IVel’s direct operator site linked a Book Now action to a live Cloudbeds lodging profile with current check-in/check-out metadata and multiple named room types.',
  travelerGuidance: 'This supports a current operator-controlled booking channel, not guaranteed room availability, price, transport, or physical accessibility. Confirm the exact dates and needs directly.',
  sourceIds: ['research-source-operator-ivels', 'research-source-operator-ivels-cloudbeds'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'No wheelchair, step-free, roll-in shower, grab-bar, hearing, visual, or other feature-level accessibility term was found in the booking-profile markup. Do not infer accessibility from general room amenities.',
})

addDeepResearchFact({
  slug: 'mayaguana',
  key: 'baycaner-2026-operation-checkpoint',
  title: 'Mayaguana: Baycaner recent operation checkpoint',
  topic: 'stays',
  claim: 'Baycaner’s direct site publishes a current contact path and accommodation terms; a travel operator used Baycaner for a dated April 23–May 1, 2026 hosted trip; and an AOPA kneeboard generated May 26, 2026 said the resort offered rentals and airport transportation.',
  travelerGuidance: 'This is recent multi-source operation evidence, not proof of today’s availability or transport. The direct site has a certificate problem, so verify through a safe accountable channel before planning or payment.',
  sourceIds: ['research-source-operator-baycaner', 'research-source-corrob-gofishingworldwide-mayaguana-2026', 'research-source-aopa-mayaguana-kneeboard-2026'],
  nextReviewAt: '2026-09-03',
  confidence: 'medium',
  editorNotes: 'The three signals support a recent operation checkpoint through May 2026. They do not establish live inventory, secure checkout, current transport, or feature-level accessibility.',
})

addDeepResearchFact({
  slug: 'berry-islands',
  key: 'family-island-clinic-baseline',
  title: 'Berry Islands: official clinic-access baseline',
  topic: 'safety',
  claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Bullock’s Harbour Community Clinic, telephone (242) 367-8400, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
  travelerGuidance: 'Treat this as a planning contact, not a 24-hour or emergency-care promise. Reconfirm the number, current opening, staffing, available services, medications, accessible transport, ambulance or evacuation arrangements, and the traveler’s insurance plan before departure.',
  sourceIds: ['research-source-moh-family-islands-health-clinics'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'The claim is limited to what the official directory publishes. It does not establish current capability or suitability for a specific medical need.',
})

addDeepResearchFact({
  slug: 'acklins-crooked-island',
  key: 'family-island-clinic-baseline',
  title: 'Acklins & Crooked Island: official clinic-access baseline',
  topic: 'safety',
  claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Spring Point Community Clinic on Acklins at (242) 344-2172, and Colonel Hill and Landrail Point Community Clinics on Crooked Island at (242) 344-2350 and (242) 344-2166. It publishes 9:00 a.m.–5:00 p.m. Monday–Friday hours except public holidays for all three.',
  travelerGuidance: 'Choose the relevant island and settlement before relying on a clinic. Reconfirm the number, current opening, staffing, available services, medications, accessible transport, ambulance or evacuation arrangements, and the traveler’s insurance plan before departure.',
  sourceIds: ['research-source-moh-family-islands-health-clinics'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'The island pair has separate clinics and transfer constraints. Do not collapse them into a single medical-access promise or infer inter-island emergency transport.',
})

addDeepResearchFact({
  slug: 'mayaguana',
  key: 'family-island-clinic-baseline',
  title: 'Mayaguana: official clinic-access baseline',
  topic: 'safety',
  claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Abraham’s Bay Community Clinic, telephone (242) 339-3109, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
  travelerGuidance: 'Treat this as a planning contact, not a 24-hour or emergency-care promise. Reconfirm the number, current opening, staffing, available services, medications, accessible transport, ambulance or evacuation arrangements, and the traveler’s insurance plan before departure.',
  sourceIds: ['research-source-moh-family-islands-health-clinics'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'The claim is limited to what the official directory publishes. Remote aviation, weather, communications, and medical-evacuation planning remain open.',
})

addDeepResearchFact({
  slug: 'inagua',
  key: 'family-island-clinic-baseline',
  title: 'Inagua: official clinic-access baseline',
  topic: 'safety',
  claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Matthew Town Community Clinic, telephone (242) 339-1249, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
  travelerGuidance: 'Treat this as a planning contact, not a 24-hour or emergency-care promise. Reconfirm the number, current opening, staffing, available services, medications, accessible transport, ambulance or evacuation arrangements, and the traveler’s insurance plan before departure.',
  sourceIds: ['research-source-moh-family-islands-health-clinics'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'The claim is limited to what the official directory publishes. Remote aviation, weather, communications, and medical-evacuation planning remain open.',
})

addDeepResearchFact({
  slug: 'rum-cay',
  key: 'family-island-clinic-baseline',
  title: 'Rum Cay: official clinic-access baseline',
  topic: 'safety',
  claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Port Nelson Community Clinic, telephone (242) 331-2104, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
  travelerGuidance: 'Treat this as a planning contact, not a 24-hour or emergency-care promise. Reconfirm the number, current opening, staffing, available services, medications, accessible transport, ambulance or evacuation arrangements, and the traveler’s insurance plan before departure.',
  sourceIds: ['research-source-moh-family-islands-health-clinics'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'The claim is limited to what the official directory publishes. Remote aviation, marine, weather, communications, and medical-evacuation planning remain open.',
})

for (const item of [
  {
    slug: 'abacos',
    title: 'The Abacos: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists community clinics at Cooper’s Town, Fox Town, Green Turtle Cay, Hope Town, Marsh Harbour, Moore’s Island, and Sandy Point. It publishes 9:00 a.m.–5:00 p.m. Monday–Friday hours except public holidays; the Marsh Harbour contact is printed as (242) 367-2510 / 4594.',
    editorNotes: 'Preserve the cay and settlement distinctions. A clinic elsewhere in the Abacos is not evidence of timely transport from a particular cay.',
  },
  {
    slug: 'andros',
    title: 'Andros: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists multiple Andros facilities, including Fresh Creek at (242) 368-2038, Mangrove Cay at (242) 369-0089, Mastic Point at (242) 329-3055, and Nicholl’s Town at (242) 329-2055. It publishes 9:00 a.m.–5:00 p.m. Monday–Friday hours except public holidays.',
    editorNotes: 'The source extraction contains two additional contact blocks whose clinic headings are not safely recoverable. Do not infer or publish those names without direct source review.',
  },
  {
    slug: 'bimini',
    title: 'Bimini: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Alice Town Community Clinic, telephone (242) 347-2210, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
    editorNotes: 'This establishes one official planning contact, not current capability, after-hours care, or transfer from every cay.',
  },
  {
    slug: 'cat-island',
    title: 'Cat Island: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists facilities at Bain Town, Old Bight/The Bight, Orange Creek, and Smiths Bay, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays. Published contacts include Orange Creek at (242) 354-4050 and Smiths Bay at (242) 342-2160.',
    editorNotes: 'The directory separately prints Old Bight and The Bight entries with overlapping contact information. Preserve that source ambiguity rather than inventing a facility count.',
  },
  {
    slug: 'eleuthera-harbour-island',
    title: 'Eleuthera & Harbour Island: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists facilities across Eleuthera, Harbour Island, and Spanish Wells. Published contacts include Governor’s Harbour at (242) 332-2774, Harbour Island at (242) 333-2227, Rock Sound at (242) 334-2226 or 344-2139, and Spanish Wells at (242) 333-4064; the directory publishes 9:00 a.m.–5:00 p.m. Monday–Friday hours except public holidays.',
    editorNotes: 'Preserve mainland Eleuthera, Harbour Island, and Spanish Wells as distinct access contexts. The presence of several clinics does not establish bridge, boat, ambulance, or referral capability.',
  },
  {
    slug: 'the-exumas',
    title: 'The Exumas: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Black Point, Forbes Hill, George Town, and Steventon clinics, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays. Published contacts are (242) 355-3007, 345-4144, 336-2088, and 358-0053 respectively.',
    editorNotes: 'Preserve mainland and cay geography. A clinic on Great Exuma or Black Point is not evidence of timely access from every cay.',
  },
  {
    slug: 'grand-bahama',
    title: 'Grand Bahama: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists community clinics at Eight Mile Rock, Grand Cay, Hawksbill, High Rock, McCleans Town, Sweeting’s Cay, and West End, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
    editorNotes: 'This directory fact is not a complete hospital or emergency-services map for Grand Bahama and does not establish current capability at any listed facility.',
  },
  {
    slug: 'long-island',
    title: 'Long Island: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Clarence Town Community Clinic at (242) 337-3333, Deadman’s Cay Community Clinic with its contact printed as (242) 337-1222/42, and Simms Community Clinic at (242) 338-8488. It publishes 9:00 a.m.–5:00 p.m. Monday–Friday hours except public holidays.',
    editorNotes: 'Retain the Deadman’s Cay contact exactly as printed until the authority clarifies the abbreviated second number. Do not normalize it by inference.',
  },
  {
    slug: 'ragged-island',
    title: 'Ragged Island: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Duncan Town Community Clinic, telephone (242) 344-1560, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
    editorNotes: 'This establishes one official planning contact, not current staffing, emergency capability, medicine, communications, or evacuation coverage.',
  },
  {
    slug: 'san-salvador',
    title: 'San Salvador: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness Family Islands clinic directory lists Cockburn Town Community Clinic with its telephone printed as (242) 331-2105-6 and published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays.',
    editorNotes: 'Retain the telephone as printed until rechecked. This is San Salvador island in The Bahamas, not San Salvador city in El Salvador.',
  },
  {
    slug: 'nassau-paradise-island',
    key: 'new-providence-clinic-baseline',
    title: 'Nassau & Paradise Island: official clinic-access baseline',
    claim: 'The Bahamas Ministry of Health and Wellness New Providence clinic directory lists multiple Nassau and New Providence facilities, including South Beach Health Centre at (242) 392-2123–6, with published hours of 9:00 a.m.–5:00 p.m. Monday–Friday except public holidays. The directory contains no Paradise Island clinic entry.',
    sourceIds: ['research-source-moh-new-providence-health-clinics'],
    editorNotes: 'Do not infer that South Beach is the nearest or appropriate facility for a specific traveler, or that routine clinic contacts cover hospital, emergency, ambulance, or Paradise Island routing.',
  },
]) {
  addDeepResearchFact({
    slug: item.slug,
    key: item.key || 'family-island-clinic-baseline',
    title: item.title,
    topic: 'safety',
    claim: item.claim,
    travelerGuidance: 'Use the authority directory to identify a planning contact, not as a 24-hour or emergency-care promise. Reconfirm the closest appropriate facility, current number, opening, staffing, services, medicines, accessible transport, ambulance or evacuation arrangements, and the traveler’s insurance and professional medical plan before departure.',
    sourceIds: item.sourceIds || ['research-source-moh-family-islands-health-clinics'],
    nextReviewAt: '2026-09-03',
    confidence: 'high',
    editorNotes: item.editorNotes,
  })
}

const emergencyIslandBoundaries = {
  abacos: 'Confirm the traveler’s actual cay, the nearest activated shelter or safer location, and whether marine or air movement is possible before conditions deteriorate.',
  'acklins-crooked-island': 'Keep Acklins and Crooked Island separate; establish the traveler’s current island, settlement, local response contact, shelter activation, and any inter-island movement before an emergency.',
  andros: 'Confirm the traveler’s district, settlement, cay, road or marine access, local response contact, and nearest activated shelter or safer location.',
  'berry-islands': 'Confirm the traveler’s cay, local response contact, activated shelter or safer location, and marine or air movement constraints.',
  bimini: 'Confirm the traveler’s island or cay, local response contact, activated shelter or safer location, and bridge, marine, or air movement constraints.',
  'cat-island': 'Confirm the traveler’s settlement, road access, local response contact, and nearest activated shelter or safer location.',
  'eleuthera-harbour-island': 'Keep Eleuthera mainland, Harbour Island, and Spanish Wells separate; confirm bridge, land, water-taxi, dock, airport, and shelter conditions for the traveler’s actual location.',
  'the-exumas': 'Confirm the traveler’s cay, local response contact, activated shelter or safer location, and marine or air movement constraints; Great Exuma resources are not automatically reachable from every cay.',
  'grand-bahama': 'Confirm the traveler’s settlement or cay, local response contact, road or marine access, hospital routing, and nearest activated shelter or safer location.',
  inagua: 'Confirm Matthew Town contacts, communications, local shelter activation, airport status, weather limits, and any medical or disaster evacuation plan before travel.',
  'long-island': 'Confirm the traveler’s settlement, road access, local response contact, clinic or referral routing, and nearest activated shelter or safer location.',
  mayaguana: 'Confirm the traveler’s settlement, communications, local shelter activation, airport status, weather limits, and any medical or disaster evacuation plan before travel.',
  'nassau-paradise-island': 'Confirm whether the traveler is on New Providence or Paradise Island, current bridge and road conditions, hospital or ambulance routing, and the nearest activated accessible shelter or safer location.',
  'ragged-island': 'Confirm Duncan Town contacts, communications, local shelter activation, airport or marine status, weather limits, and any evacuation plan before travel.',
  'rum-cay': 'Confirm Port Nelson contacts, communications, local shelter activation, airport or marine status, weather limits, and any evacuation plan before travel.',
  'san-salvador': 'Confirm Cockburn Town contacts, communications, road and airport status, local shelter activation, weather limits, and any evacuation plan before travel.',
}

for (const [slug, islandBoundary] of Object.entries(emergencyIslandBoundaries)) {
  addDeepResearchFact({
    slug,
    key: 'national-emergency-evacuation-baseline',
    title: `${rows.find((candidate) => candidate.slug === slug).name}: national emergency and evacuation baseline`,
    topic: 'safety',
    claim: 'The Bahamas Disaster Risk Management Authority’s official emergency directory lists National Emergency Medical Services and police at 911/919. Its evacuation guidance says to identify local routes and shelters, arrange transportation, prepare essential supplies and medical needs, distinguish inter-island from intra-island evacuation, and follow current official instructions. Its disability guidance calls for personalized accessible routes, medical supplies, communication devices, caregivers, and support networks.',
    travelerGuidance: `Use 911/919 for an immediate emergency and monitor the live DRM Authority updates, but do not assume identical connectivity, call routing, response time, transport, shelter activation, or accessible service on every island. ${islandBoundary}`,
    sourceIds: ['research-source-drm-emergency-numbers', 'research-source-drm-evacuation-guidance', 'research-source-drm-disability-preparedness', 'research-source-drm-live-alerts'],
    nextReviewAt: '2026-09-03',
    confidence: 'high',
    editorNotes: 'The national numbers and preparedness actions are primary-source facts. The current 2026 shelter page is not clean enough for complete island delivery because several rendered panels contain placeholder content. Keep emergency routing out of evergreen traveler delivery until local contacts, shelter activation, communications, transport, and accessibility are rechecked.',
  })
}

const seasonalityIslandBoundaries = {
  abacos: 'The official climate paper uses Abaco as the northwestern high-rainfall endpoint, but it does not provide a current cay- or settlement-specific normal.',
  'acklins-crooked-island': 'Keep Acklins, Crooked Island, and Long Cay separate when checking current weather, marine conditions, and access; the national paper does not provide a local normal for each island.',
  andros: 'Andros spans a large north-to-south area, so do not substitute a Nassau, Abaco, or single-airport observation for conditions in the traveler’s district or cay.',
  'berry-islands': 'Conditions and exposure can differ among the cays; the national paper does not provide a Great Harbour Cay, Chub Cay, or island-group station normal.',
  bimini: 'Bimini is in the northern Bahamas, where winter conditions can differ from central and southern islands, but the source does not provide a current island-specific normal.',
  'cat-island': 'The national paper does not supply a Cat Island station normal, settlement-level rainfall pattern, or marine forecast.',
  'eleuthera-harbour-island': 'Keep mainland Eleuthera, Harbour Island, and Spanish Wells separate when checking wind, bridge, dock, water-taxi, and airport conditions.',
  'the-exumas': 'Great Exuma observations do not establish conditions across every cay; check the traveler’s actual location and marine route.',
  'grand-bahama': 'Grand Bahama is in the northern Bahamas, where winter conditions can differ from central and southern islands, but the source does not provide a settlement-specific normal.',
  inagua: 'The official climate paper uses Inagua as the southeastern low-rainfall endpoint, but that annual comparison is not a current forecast or a guarantee of dry travel conditions.',
  'long-island': 'Long Island crosses the Tropic of Cancer and spans many settlements; the national paper does not provide a single local normal that is safe to apply everywhere.',
  mayaguana: 'The national paper establishes a broad southeastern climate context, not a Mayaguana station normal, marine forecast, or transport-operating promise.',
  'nassau-paradise-island': 'The paper includes historical New Providence reference values, but they are not live conditions and do not prove weather, bridge, marine, or transport status on either New Providence or Paradise Island.',
  'ragged-island': 'The national paper establishes a broad southern climate context, not a Duncan Town or Jumentos station normal, marine forecast, or transport-operating promise.',
  'rum-cay': 'The national paper does not supply a Rum Cay station normal, sea-state forecast, or transport-operating promise.',
  'san-salvador': 'The national paper does not supply a San Salvador station normal, settlement-level rainfall pattern, marine forecast, or transport-operating promise.',
}

for (const [slug, islandBoundary] of Object.entries(seasonalityIslandBoundaries)) {
  addDeepResearchFact({
    slug,
    key: 'national-climate-seasonality-baseline',
    title: `${rows.find((candidate) => candidate.slug === slug).name}: national climate and seasonality baseline`,
    topic: 'seasonality',
    claim: 'The Bahamas Department of Meteorology classifies the national climate as tropical marine with wet and dry regimes. It describes the wet season as late May through October and the dry season as November through April. The official tropical-cyclone season runs June through November, with the highest historical frequency of effects or close approaches in August, September, and October. The same source says annual rainfall varies substantially from the northwest to the southeast.',
    travelerGuidance: `${islandBoundary} Check current Bahamas Meteorology and DRM Authority information before and during travel. Forecasts, warnings, heat, rainfall, sea state, flight or ferry operation, closures, prices, and availability are runtime facts and must not be copied into evergreen CMS content.`,
    sourceIds: ['research-source-bahamas-met-climate-overview', 'research-source-drm-hazard-season-planning', 'research-source-drm-live-alerts'],
    nextReviewAt: '2027-02-04',
    volatility: 'seasonal',
    confidence: 'medium',
    editorNotes: 'This is a primary-source national planning baseline, not an island climate normal or a “best time to visit” recommendation. Island-specific normals, marine exposure, recurring operator seasons, events, wildlife timing, and traveler preferences remain separate research questions.',
  })
}

const accessIslandConfigurations = {
  abacos: {
    airports: 'Leonard M. Thompson International Airport (MHH), Treasure Cay International Airport (TCB), and several smaller public or private fields',
    boundary: 'Choose the traveler’s actual Abaco island or cay before selecting an airport, ferry, water taxi, or ground transfer.',
    ferry: 'The national tourism FAQ currently names Nassau–Abaco and Freeport–Abaco Bahamas Ferries connections.',
  },
  'acklins-crooked-island': {
    airports: 'Spring Point Airport (AXP) on Acklins and Colonel Hill Airport (CRI) on Crooked Island',
    boundary: 'Keep Acklins, Crooked Island, and Long Cay separate; an arrival on one island does not prove a same-day inter-island transfer.',
  },
  andros: {
    airports: 'Andros Town/Fresh Creek (ASD), Congo Town/South Andros (TZN), Clarence A. Bain/Mangrove Cay (MAY), and San Andros (SAQ)',
    boundary: 'Choose the district and settlement first; Andros airports, roads, ferries, and marine transfers are not interchangeable.',
    ferry: 'The national tourism FAQ currently names a Nassau–Andros Bahamas Ferries connection.',
  },
  'berry-islands': {
    airports: 'Great Harbour Cay Airport (GHC) plus several smaller cay fields listed by the Department of Aviation',
    boundary: 'Choose the cay first and verify the onward marine or local transfer; Great Harbour Cay access does not establish access to every Berry Island.',
  },
  bimini: {
    airports: 'South Bimini Airport (BIM) plus smaller cay or seaplane facilities listed by the Department of Aviation',
    boundary: 'Confirm whether the stay is on North Bimini, South Bimini, or another cay and verify the current water or ground transfer.',
  },
  'cat-island': {
    airports: 'Arthur’s Town Airport (ATC) and New Bight International Airport (TBI)',
    boundary: 'Choose the traveler’s settlement before selecting an airport and verify the current road transfer and operator service.',
    ferry: 'The national tourism FAQ currently names a Nassau–Cat Island Bahamas Ferries connection.',
  },
  'eleuthera-harbour-island': {
    airports: 'Governor’s Harbour (GHB), North Eleuthera (ELH), and Rock Sound (RSD) international airports',
    boundary: 'Keep mainland Eleuthera, Harbour Island, and Spanish Wells separate and verify the airport, road, dock, water-taxi, and ferry chain for the actual destination.',
    ferry: 'The national tourism FAQ currently names Nassau service to Eleuthera and Harbour Island through Bahamas Ferries.',
  },
  'the-exumas': {
    airports: 'Exuma International Airport (GGT), Staniel Cay Airport (TYM), Black Point Airport, and Farmer’s Cay Airport',
    boundary: 'Choose the cay first; arrival on Great Exuma does not establish a current same-day connection to another cay.',
    ferry: 'The national tourism FAQ currently names a Nassau–Exumas Bahamas Ferries connection.',
  },
  'grand-bahama': {
    airports: 'Grand Bahama International Airport (FPO)',
    boundary: 'Verify the traveler’s settlement, airport-to-stay transfer, and any onward Abaco or cay connection for the exact date.',
    ferry: 'The national tourism FAQ currently names Nassau–Freeport and Freeport–Abaco Bahamas Ferries connections.',
  },
  inagua: {
    airports: 'Inagua International/Matthew Town Airport (IGA)',
    boundary: 'Little Inagua remains a separate boat-access context; an Inagua airport listing does not establish service to it or a current onward vessel.',
  },
  'long-island': {
    airports: 'Deadman’s Cay Airport (LGI) and Stella Maris Airport (SML)',
    boundary: 'Choose the traveler’s settlement and end of the island before selecting an airport and verify the long ground transfer for the exact itinerary.',
  },
  mayaguana: {
    airports: 'Mayaguana Airport (MYG) at Abraham’s Bay',
    boundary: 'An airport directory entry does not establish a current scheduled flight, charter seat, ground transfer, fuel, or disruption fallback.',
  },
  'nassau-paradise-island': {
    airports: 'Lynden Pindling International Airport (MYNN in the Department of Aviation directory)',
    boundary: 'Verify New Providence or Paradise Island ground and bridge routing and allow a current operator-confirmed connection window for onward Family Island travel.',
    ferry: 'The national tourism FAQ describes Nassau as the principal connection point for several Bahamas Ferries routes.',
  },
  'ragged-island': {
    airports: 'Duncan Town Airport (DCT)',
    boundary: 'An airport directory entry does not establish a current scheduled flight, charter seat, marine connection, local transfer, or disruption fallback.',
  },
  'rum-cay': {
    airports: 'New Port Nelson Airport (RCY)',
    boundary: 'An airport directory entry does not establish a current scheduled flight, charter seat, marine connection, local transfer, or disruption fallback.',
  },
  'san-salvador': {
    airports: 'San Salvador International Airport (ZSA)',
    boundary: 'Verify the current carrier, flight, airport status, and settlement transfer for the exact travel dates.',
  },
}

for (const [slug, configuration] of Object.entries(accessIslandConfigurations)) {
  addDeepResearchFact({
    slug,
    key: 'national-air-and-island-hopping-access-baseline',
    title: `${rows.find((candidate) => candidate.slug === slug).name}: official air and island-hopping access baseline`,
    topic: 'access',
    claim: `The Bahamas Department of Aviation directory lists ${configuration.airports}. The national tourism authority says all 16 major island destinations can be reached by air connecting through Nassau and distinguishes scheduled service from charter service. ${configuration.ferry || 'No current national-ferry route is asserted for this island in this fact.'}`,
    travelerGuidance: `${configuration.boundary} Airport identity is not proof of current scheduled passenger service. Confirm the exact carrier, date, route, connection, baggage rules, accessibility needs, weather status, local transfer, and cancellation terms directly before traveler delivery.`,
    sourceIds: [
      'research-source-doa-airports',
      'research-source-bmot-island-hopping-access',
      ...(configuration.ferry ? ['research-source-bahamas-ferries-travel'] : []),
    ],
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    editorNotes: 'The airport identities and national access model are primary-source facts. The draft deliberately does not store a flight or ferry schedule, fare, availability, connection guarantee, private-field permission, mail-boat timetable, or local-transfer promise.',
  })
}

for (const [slug, configuration] of Object.entries(accessIslandConfigurations)) {
  addDeepResearchFact({
    slug,
    key: 'national-air-accessibility-assistance-baseline',
    title: `${rows.find((candidate) => candidate.slug === slug).name}: national air-accessibility assistance baseline`,
    topic: 'accessibility',
    claim: 'Civil Aviation Authority Bahamas SEC 02 requires airport operators, air operators, and government agencies to provide special assistance to passengers with disabilities; make travel information understandable to people with cognitive or sensory disabilities; adapt airport facilities and services; provide appropriate aircraft-to-terminal transfer devices where required; and address mobility-aid and service-animal carriage subject to space, safety, technical, operator, and quarantine rules. If a trip uses Bahamasair, its current policy separately describes wheelchair and pre-boarding assistance, assistive-device handling, gate delivery, aisle-chair support, and a formal assistance-request path.',
    travelerGuidance: `${configuration.boundary} Treat the national standard and Bahamasair policy as planning rights and request paths, not proof that a particular airport, aircraft, terminal, handler, dock, vehicle, or connection can meet the traveler’s needs. Confirm the exact route, aircraft type, boarding method, transfer devices, wheelchair dimensions and battery, seating, restroom, oxygen or respiratory device, service animal, communication support, ground transfer, and fallback before purchase.`,
    sourceIds: [
      'research-source-caab-special-assistance-facilitation',
      'research-source-bahamasair-passenger-disability',
      'research-source-bahamasair-accessibility-request',
    ],
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'high',
    editorNotes: 'The regulator and carrier establish a credible national standard and a conditional operator process. This fact does not assert that Bahamasair currently serves the island, that every airport or aircraft implements every feature, or that a requested service has been confirmed. Keep route, schedule, equipment, staffing, and availability at runtime.',
  })
}

addDeepResearchFact({
  slug: 'nassau-paradise-island',
  key: 'lpia-feature-level-accessibility-baseline',
  title: 'Nassau & Paradise Island: LPIA accessibility-feature baseline',
  topic: 'accessibility',
  claim: 'Lynden Pindling International Airport’s current accessibility page identifies accessible parking in all short-term lots, elevators and escalators at every transition level, family and accessible restrooms throughout the terminals, airline-arranged wheelchair service, and a Hidden Disabilities Sunflower programme for travelers who may need additional time or assistance.',
  travelerGuidance: 'Contact the operating airline in advance for wheelchair or flight-specific assistance and confirm the traveler’s exact requirements. The LPIA features do not establish an accessible aircraft, remote stand transfer, onward Family Island airport, taxi or transfer vehicle, Paradise Island bridge route, hotel, beach, attraction, or emergency fallback.',
  sourceIds: ['research-source-lpia-accessibility'],
  nextReviewAt: '2026-11-02',
  volatility: 'operational',
  confidence: 'high',
  editorNotes: 'This is facility-level evidence for LPIA only. The Sunflower lanyard indicates a possible need for additional time or assistance; the airport states that it is not a fast-track benefit. Do not extend these features to another airport or to the full destination travel chain.',
})

const scheduledAirOperatorConfigurations = {
  abacos: {
    claim: 'Western Air currently exposes a Nassau–Marsh Harbour route in its carrier-controlled directory. The national tourism flight table separately lists Bahamasair and Southern Air as Nassau–Treasure Cay leads. Makers Air labels Marsh Harbour and Scotland Cay as charter destinations, not scheduled destinations, on the reviewed operator page.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory', 'research-source-makers-air-destinations'],
    boundary: 'Choose the exact Abaco island or cay and distinguish a scheduled Marsh Harbour or Treasure Cay lead from a private charter or onward boat transfer.',
  },
  'acklins-crooked-island': {
    claim: 'The national tourism flight table currently names Bahamasair for Nassau–Spring Point, Nassau–Crooked Island, and Spring Point–Crooked Island airport pairs. No carrier-controlled route page was located in this pass to independently confirm those exact pairs.',
    sourceIds: ['research-source-bmot-flight-tables-current-review'],
    boundary: 'Treat Acklins, Crooked Island, and Long Cay as separate transfer problems and recheck all three airport-pair leads with the carrier.',
    confidence: 'medium',
  },
  andros: {
    claim: 'Western Air currently publishes Nassau pairs with San Andros and South Andros/Congo Town. Makers Air labels Congo Town, Fresh Creek, and San Andros as scheduled destinations; the national tourism table identifies the Makers origin as Fort Lauderdale Executive and also lists LeAir Nassau pairs with Fresh Creek and Mangrove Cay.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory', 'research-source-makers-air-destinations'],
    boundary: 'Choose North, Central, Mangrove Cay, or South Andros before selecting a route; the airports and island districts are not interchangeable.',
  },
  'berry-islands': {
    claim: 'Makers Air currently labels Chub Cay and Great Harbour Cay as scheduled destinations. The national tourism table identifies Fort Lauderdale Executive pairs for Makers Air and separately names Bahamasair and LeAir for Nassau–Great Harbour Cay.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-makers-air-destinations'],
    boundary: 'Choose the traveler’s cay first and verify the onward boat or local transfer; an air route to Great Harbour Cay or Chub Cay is not access proof for every Berry Island.',
  },
  bimini: {
    claim: 'Western Air currently publishes the Nassau–Bimini airport pair in its carrier-controlled route directory. The national tourism table also lists international Bimini leads, but those were not independently reconciled in this domestic-operator pass.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory'],
    boundary: 'Confirm whether the trip is for North Bimini, South Bimini, or another cay and verify the current airport-to-dock or ground transfer.',
  },
  'cat-island': {
    claim: 'Western Air currently exposes Nassau–The Bight/New Bight in its route directory, while the national tourism table also names Western Air for Nassau–Arthur’s Town. Makers Air labels Cat Island/New Bight as a scheduled destination and the national table identifies its Fort Lauderdale Executive pair.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory', 'research-source-makers-air-destinations'],
    boundary: 'Choose the settlement before selecting Arthur’s Town or New Bight and verify the actual operating airport and road transfer.',
  },
  'eleuthera-harbour-island': {
    claim: 'Southern Air currently publishes Nassau pairs with North Eleuthera, Governor’s Harbour, and Rock Sound. Western Air currently exposes Nassau–North Eleuthera. Makers Air labels North Eleuthera, Governor’s Harbour, and Rock Sound as scheduled destinations; the national tourism table supplies additional Bahamasair and Pineapple Air leads that still need direct carrier confirmation.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory', 'research-source-makers-air-destinations', 'research-source-southern-air-travel-guide'],
    boundary: 'Keep mainland Eleuthera, Harbour Island, and Spanish Wells separate and verify the road, dock, water-taxi, and ferry chain after the selected airport.',
  },
  'the-exumas': {
    claim: 'Western Air currently publishes Nassau–George Town/Great Exuma. Makers Air labels Staniel Cay as a scheduled destination and the national tourism table identifies its Fort Lauderdale Executive pair. The national table also names Bahamasair for Nassau–George Town.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory', 'research-source-makers-air-destinations'],
    boundary: 'Choose Great Exuma or the exact cay first; an arrival at George Town or Staniel Cay does not establish a same-day connection to another cay.',
  },
  'grand-bahama': {
    claim: 'Western Air currently publishes the Nassau–Freeport airport pair in its carrier-controlled directory. The national tourism table separately names Bahamasair for Nassau–Freeport and other international service leads.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory'],
    boundary: 'Verify the traveler’s exact settlement, airport transfer, and any onward Abaco or cay connection for the booked dates.',
  },
  inagua: {
    claim: 'The national tourism flight table currently names Bahamasair for Nassau–Matthew Town/Inagua and Mayaguana–Matthew Town/Inagua. No carrier-controlled route page was located in this pass to independently confirm those exact pairs.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-bahamasair'],
    boundary: 'Treat the route names as dated planning leads only and keep Little Inagua as a separate boat-access context.',
    confidence: 'medium',
  },
  'long-island': {
    claim: 'Southern Air currently publishes Nassau pairs with Deadman’s Cay and Stella Maris. Makers Air labels Stella Maris as a scheduled destination, with the national tourism table identifying its Fort Lauderdale Executive pair. The national table also names Bahamasair for Nassau–Deadman’s Cay.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-makers-air-destinations', 'research-source-southern-air-travel-guide'],
    boundary: 'Choose the traveler’s end of Long Island first and verify the potentially long ground transfer from Deadman’s Cay or Stella Maris.',
  },
  mayaguana: {
    claim: 'The national tourism flight table currently names Bahamasair for Nassau–Mayaguana and Matthew Town/Inagua–Mayaguana. No carrier-controlled route page was located in this pass to independently confirm those exact pairs.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-bahamasair'],
    boundary: 'The airport-pair lead is not proof of a bookable seat, through connection, ground transfer, fuel, or disruption fallback.',
    confidence: 'medium',
  },
  'nassau-paradise-island': {
    claim: 'Current operator pages establish Nassau as a domestic connection point: Western Air publishes Nassau pairs with Marsh Harbour, Freeport, Bimini, South Andros, San Andros, The Bight/New Bight, George Town/Great Exuma, and North Eleuthera; Southern Air publishes Nassau pairs with Deadman’s Cay, Stella Maris, North Eleuthera, Governor’s Harbour, and Rock Sound. The national tourism table provides additional dated carrier leads but is not a live schedule.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-western-air-route-directory', 'research-source-southern-air-travel-guide'],
    boundary: 'A published city pair is not a protected same-ticket connection. Recheck terminal, minimum connection time, baggage handling, check-in, disruption protection, and Paradise Island ground transfer.',
  },
  'ragged-island': {
    claim: 'At the 2026-08-04 review, the national tourism flight page explicitly said there were no commercial flights to Ragged Island and recommended private charter for air access. This is a volatile dated status, not an evergreen statement that service cannot exist.',
    sourceIds: ['research-source-bmot-flight-tables-current-review'],
    boundary: 'Confirm current commercial-service status and any charter operator, authorization, aircraft, seat, price, accessibility, weather limit, ground transfer, and fallback before planning.',
    confidence: 'medium',
  },
  'rum-cay': {
    claim: 'The national tourism flight table currently names Southern Air for the Nassau–Rum Cay airport pair. The reviewed Southern Air travel-guide page did not expose a Rum Cay section, so this remains an uncorroborated national-table lead.',
    sourceIds: ['research-source-bmot-flight-tables-current-review'],
    boundary: 'Do not infer operation from the table alone; recheck the exact flight or charter and the island’s airport, transfer, accommodation, provisioning, and disruption fallback.',
    confidence: 'medium',
  },
  'san-salvador': {
    claim: 'The national tourism flight table currently names Bahamasair for Nassau–San Salvador and Deadman’s Cay–San Salvador, and Southern Air for Nassau–San Salvador. The reviewed carrier pages did not independently expose these exact San Salvador pairs.',
    sourceIds: ['research-source-bmot-flight-tables-current-review', 'research-source-bahamasair'],
    boundary: 'Recheck the exact operating carrier, route, airport status, settlement transfer, connection protection, and disruption handling before traveler delivery.',
    confidence: 'medium',
  },
}

for (const [slug, configuration] of Object.entries(scheduledAirOperatorConfigurations)) {
  addDeepResearchFact({
    slug,
    key: 'dated-scheduled-air-operator-baseline',
    title: `${rows.find((candidate) => candidate.slug === slug).name}: dated scheduled-air operator baseline`,
    topic: 'access',
    claim: configuration.claim,
    travelerGuidance: `${configuration.boundary} Route identity at the review date does not establish a flight on the traveler’s date. Confirm the exact airport pair, operating carrier, flight number, date, time, seats, fare, aircraft, baggage and check-in rules, accessibility assistance, connection protection, weather status, cancellation terms, and arrival transfer at runtime.`,
    sourceIds: configuration.sourceIds,
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: configuration.confidence || 'high',
    editorNotes: 'This is a non-exhaustive dated operator-coverage layer focused on useful Bahamas island access leads. Frequencies, days, prices, availability, schedules, and indirect generated city-pair pages are deliberately excluded. A national-table lead without a carrier-controlled match remains explicitly uncorroborated.',
  })
}

const scheduledMarineOperatorConfigurations = {
  abacos: {
    claim: 'The national tourism island-hopping FAQ names Nassau–Abaco and Freeport–Abaco Bahamas Ferries connections. The current Bahamas Ferries passenger page reviewed on 2026-08-04 did not publish either route; its Marsh Harbour office listing is not service proof.',
    sourceIds: ['research-source-bmot-island-hopping-access', 'research-source-bahamas-ferries-current-passenger-reconciliation'],
    boundary: 'Treat both national route names as uncorroborated planning leads and separately identify the exact Abaco cay, local ferry or water taxi, dock, and arrival transfer.',
  },
  'acklins-crooked-island': {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for Acklins, Crooked Island, or Long Cay. That research result is not proof that no mail boat, local ferry, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Do not merge Acklins, Crooked Island, and Long Cay. Identify an accountable operator and exact inter-island chain before offering marine access.',
  },
  andros: {
    claim: 'The national tourism island-hopping FAQ names a Nassau–Andros Bahamas Ferries connection. The current Bahamas Ferries passenger page reviewed on 2026-08-04 did not publish that route, so it remains an uncorroborated national lead.',
    sourceIds: ['research-source-bmot-island-hopping-access', 'research-source-bahamas-ferries-current-passenger-reconciliation'],
    boundary: 'Choose the Andros district and dock first; a Nassau–Andros label does not identify North, Central, Mangrove Cay, or South Andros arrival and onward transfer.',
  },
  'berry-islands': {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for the Berry Islands. That research result is not proof that no local ferry, mail boat, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Choose the cay first and identify the accountable vessel, dock, and onward transfer; Great Harbour Cay, Chub Cay, and smaller cays are not interchangeable.',
  },
  bimini: {
    claim: 'The reviewed inter-island tourism FAQ and current Bahamas Ferries passenger page did not identify a Bahamas Ferries inter-island route for Bimini. International ferry service is a separate access class and was not treated as an inter-island connection in this fact.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Keep North Bimini, South Bimini, local water transfer, and any international ferry itinerary separate and verify each accountable operator.',
  },
  'cat-island': {
    claim: 'The national tourism island-hopping FAQ names a Nassau–Cat Island Bahamas Ferries connection. The current Bahamas Ferries passenger page reviewed on 2026-08-04 did not publish that route, so it remains an uncorroborated national lead.',
    sourceIds: ['research-source-bmot-island-hopping-access', 'research-source-bahamas-ferries-current-passenger-reconciliation'],
    boundary: 'Identify the exact Cat Island port, settlement, vessel, and onward road transfer before traveler delivery.',
  },
  'eleuthera-harbour-island': {
    claim: 'Bahamas Ferries currently publishes a weather-permitting Nassau–Spanish Wells–Harbour Island high-speed passenger route. The national tourism destination page separately establishes that Harbour Island is accessible only by boat or ferry from mainland Eleuthera and that Spanish Wells requires a ferry from the mainland.',
    sourceIds: ['research-source-bahamas-ferries-current-passenger-reconciliation', 'research-source-bmot-eleuthera-marine-arrival', 'research-source-bmot-island-hopping-access'],
    boundary: 'Do not infer the airport-to-dock vehicle, local mainland ferry, dock, vessel, luggage transfer, accessibility, or same-day connection from the national high-speed route.',
    confidence: 'high',
  },
  'the-exumas': {
    claim: 'The national tourism FAQ names a Nassau–Exumas Bahamas Ferries connection, but the current Bahamas Ferries passenger page reviewed on 2026-08-04 did not publish it. Official destination context separately identifies a George Town water-taxi pattern for Stocking Island, boat-only access to Big Major Cay from nearby Staniel Cay, and boat or air access to Staniel Cay without naming the responsible marine operators.',
    sourceIds: ['research-source-bmot-island-hopping-access', 'research-source-bahamas-ferries-current-passenger-reconciliation', 'research-source-bmot-exuma-local-marine-transfer'],
    boundary: 'Select Great Exuma, Little Exuma, or the exact cay first and establish every operator, dock, transfer, conservation constraint, and fallback in the chain.',
  },
  'grand-bahama': {
    claim: 'The national tourism island-hopping FAQ names Nassau–Freeport and Freeport–Abaco Bahamas Ferries connections. The current Bahamas Ferries passenger page reviewed on 2026-08-04 did not publish either route; its Freeport office listing is not service proof.',
    sourceIds: ['research-source-bmot-island-hopping-access', 'research-source-bahamas-ferries-current-passenger-reconciliation'],
    boundary: 'Treat both national route names as uncorroborated leads and verify the exact terminal, vessel, date, Abaco destination, and onward transfer.',
  },
  inagua: {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for Inagua. That research result is not proof that no mail boat, local vessel, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Keep Great Inagua and Little Inagua separate and identify any accountable vessel, departure port, receiving dock, permission, provisioning, and weather limit.',
  },
  'long-island': {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for Long Island. That research result is not proof that no mail boat, local ferry, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Identify the exact Long Island port and settlement, because a marine arrival may create a long onward road transfer.',
  },
  mayaguana: {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for Mayaguana. That research result is not proof that no mail boat, local vessel, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Do not offer a marine option until the accountable vessel, departure port, Abraham’s Bay arrival, passenger permission, provisioning, weather limit, and fallback are verified.',
  },
  'nassau-paradise-island': {
    claim: 'Bahamas Ferries currently publishes a weather-permitting Nassau–Spanish Wells–Harbour Island high-speed passenger route. The national tourism FAQ additionally names Nassau connections to Abaco, Andros, Cat Island, Exuma, Eleuthera and Harbour Island, and Freeport, but the current operator passenger page did not publish those other routes in this review.',
    sourceIds: ['research-source-bahamas-ferries-current-passenger-reconciliation', 'research-source-bmot-island-hopping-access'],
    boundary: 'Treat Nassau as a possible connection point, not a guarantee. Reconcile the exact terminal, separate-ticket timing, baggage, accommodation, weather delay, and onward transfer.',
    confidence: 'high',
  },
  'ragged-island': {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for Ragged Island. That research result is not proof that no mail boat, local vessel, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Do not offer a marine option until the accountable vessel, departure port, Duncan Town or cay arrival, passenger permission, provisioning, weather limit, and fallback are verified.',
  },
  'rum-cay': {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for Rum Cay. That research result is not proof that no mail boat, local vessel, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Do not offer a marine option until the accountable vessel, departure port, Port Nelson arrival, passenger permission, accommodation, provisioning, weather limit, and fallback are verified.',
  },
  'san-salvador': {
    claim: 'The reviewed national tourism FAQ and current Bahamas Ferries passenger page did not identify a scheduled passenger-ferry route for San Salvador. That research result is not proof that no mail boat, local vessel, private boat, or charter operates.',
    sourceIds: ['research-source-bmot-island-hopping-access'],
    boundary: 'Identify the accountable vessel, departure port, San Salvador dock, passenger permission, ground transfer, weather limit, and fallback before traveler delivery.',
  },
}

for (const [slug, configuration] of Object.entries(scheduledMarineOperatorConfigurations)) {
  addDeepResearchFact({
    slug,
    key: 'dated-passenger-marine-operator-baseline',
    title: `${rows.find((candidate) => candidate.slug === slug).name}: dated passenger-marine operator baseline`,
    topic: 'access',
    claim: configuration.claim,
    travelerGuidance: `${configuration.boundary} Route identity or the absence of a route on a reviewed page does not establish live service. Confirm the exact date, operator, passenger eligibility, terminal and dock, vessel, boarding method, check-in, luggage, fare, capacity, accessibility, weather and sea limits, cancellation terms, communications, arrival transfer, and disruption fallback at runtime.`,
    sourceIds: configuration.sourceIds,
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: configuration.confidence || 'medium',
    editorNotes: 'This is a dated evidence-reconciliation layer. A national tourism route without a current operator-page match remains an uncorroborated lead; absence from the reviewed pages is never converted into a claim that no service exists. Schedules, days, times, fares, seats, vessel assignments, alerts, and weather status are deliberately excluded.',
  })
}

const familyIslandTaxiZoneSlugs = new Set([
  'abacos',
  'andros',
  'cat-island',
  'eleuthera-harbour-island',
  'the-exumas',
  'long-island',
])

const licensedArrivalTransferConfigurations = Object.fromEntries(officialIslands.map(({slug}) => {
  const sourceIds = [
    'research-source-bmot-licensed-ground-transport-baseline',
    'research-source-rtd-taxi-licensing-inspection',
  ]
  let islandContext = 'This pass did not find a responsible airport, port, local-authority, or operator page that proves a specific arrival pickup or transfer for this island group.'
  let boundary = 'Do not infer airport or port taxi availability, a dispatch contact, a licensed operator, or an onward transfer from the national guidance alone.'
  let confidence = 'medium'

  if (familyIslandTaxiZoneSlugs.has(slug)) {
    sourceIds.push('research-source-laws-family-island-taxi-zone-fares-2008')
    islandContext = 'The official 2008 Family Islands Zone Fares Regulations include this island group in a statutory maximum-fare zone framework, including airport-linked zones in the schedule.'
    boundary = 'The 2008 schedule is old and does not prove a taxi is waiting, that a named driver or vehicle is licensed today, or that an unamended traveler quote, surcharge, or payment method applies.'
  }

  if (slug === 'nassau-paradise-island') {
    sourceIds.push('research-source-laws-new-providence-taxi-fares-2024', 'research-source-lpia-taxi-pickup')
    islandContext = 'The 2024 New Providence regulations replace the zone-fare schedule, and LPIA currently says taxis are located outside its US, International, and Domestic terminals.'
    boundary = 'The airport pickup statement does not prove an accessible vehicle, child seat, queue time, capacity, payment method, exact live quote, bridge or toll treatment, or service during a disruption.'
    confidence = 'high'
  }

  if (slug === 'bimini') {
    sourceIds.push('research-source-bmot-bimini-arrival-transfer-chain')
    islandContext = 'Official destination context says most visitors fly into South Bimini Airport and continue to North Bimini by ferry.'
    boundary = 'The source does not identify the responsible ferry or ground operator, pickup point, dock, schedule, fare, luggage transfer, capacity, accessibility, weather limit, or missed-connection fallback.'
  }

  return [slug, {sourceIds, islandContext, boundary, confidence}]
}))

for (const [slug, configuration] of Object.entries(licensedArrivalTransferConfigurations)) {
  const islandName = rows.find((candidate) => candidate.slug === slug).name
  addDeepResearchFact({
    slug,
    key: 'licensed-arrival-ground-transfer-baseline',
    title: `${islandName}: licensed arrival ground-transfer baseline`,
    topic: 'access',
    claim: `National visitor guidance says travelers should accept rides only from licensed land and sea operators. The Road Traffic Department taxi-registration process requires a valid public-service driver licence, insurance, business licence, taxi-franchise grant letter, vehicle registration, and inspection; it says public-service vehicles are inspected in May and October. ${configuration.islandContext}`,
    travelerGuidance: `${configuration.boundary} Before traveler delivery, confirm the exact named operator, current licence or accountable dispatch, vehicle or vessel, pickup point, travel date and time, capacity, luggage and mobility-device handling, fare quote, surcharges, payment method, accessibility, road or sea conditions, cancellation handling, communications, and disruption fallback.`,
    sourceIds: configuration.sourceIds,
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: configuration.confidence,
    editorNotes: 'This layer separates the national licensing and legal-fare framework from live island availability. A government registration process is not a current operator register; a fare regulation is not a current quote; an airport or destination statement is not feature-level accessibility or end-to-end transfer proof. Prices, queue times, vehicle assignments, availability, conditions, and alerts are runtime only.',
  })
}

const policeResponseFacilityConfigurations = {
  abacos: {
    detail: 'The Northern Bahamas index names an Abaco Division. The telephone page lists station leads for Cooper’s Town, Crown Haven, Fox Town, Grand Cay, Green Turtle Cay, Marsh Harbour airport and town, Moore’s Island, and Walker’s Cay, but it renders “March Harbour” and includes a Bullock’s Harbour entry whose island assignment requires recheck.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-northern-bahamas-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Choose the exact Abaco island or cay; do not assume the nearest listed station, marine unit, fire response, road route, or telephone is reachable or staffed.',
  },
  'acklins-crooked-island': {
    detail: 'The Family Islands index names a combined Acklins, Crooked Island & Long Cay Division. The telephone page separately lists Spring Point and Salina Point station leads on Acklins plus a Crooked Island station lead.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Keep Acklins, Crooked Island, and Long Cay separate; a combined division does not prove same-island response or an inter-island emergency transfer.',
  },
  andros: {
    detail: 'The Family Islands index names an Andros Division. The telephone page lists Cargill Creek, Fresh Creek, Kemp’s Bay, Lowe Sound, Mangrove Cay, and Nicoll’s Town station leads.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Choose North, Central, Mangrove Cay, or South Andros and the exact settlement; stations, roads, boats, clinics, and response assets are not interchangeable.',
  },
  'berry-islands': {
    detail: 'The Family Islands index names a Berry Islands & Chub Cay Division. The telephone page lists airport, Chub Cay, and Great Harbour Cay station leads, but one rendered number appears to overlap an Abaco-section entry and requires recheck.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Choose the exact cay and verify whether the listed station, telephone, vessel, and response route are current and reachable.',
  },
  bimini: {
    detail: 'The Northern Bahamas index names a Bimini Division. The telephone page lists Alice Town, Cat Cay, Ocean Cay, and South Bimini station leads plus a local emergency entry, but the Alice Town number is malformed in the rendered directory.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-northern-bahamas-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Choose North Bimini, South Bimini, Cat Cay, Ocean Cay, or another cay and verify the current station, telephone, ferry or marine handoff, and bridge or weather constraints.',
  },
  'cat-island': {
    detail: 'The Family Islands index names a Cat Island Division. The telephone page lists Arthur’s Town and The Bight station leads.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Confirm the traveler’s settlement, current station, road condition, response asset, clinic handoff, and fire or marine support.',
  },
  'eleuthera-harbour-island': {
    detail: 'The Family Islands index names an Eleuthera Division. The telephone page lists Deep Creek, Governor’s Harbour, Gregory Town, Harbour Island, Hatchet Bay, Lower Bogue, Spanish Wells, and Tarpum Bay station leads, with “Govern’s Harbour” rendered as a likely directory typo.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Keep mainland Eleuthera, Harbour Island, and Spanish Wells separate and verify every road, dock, ferry or water-taxi handoff in the response path.',
  },
  'the-exumas': {
    detail: 'The Family Islands index names an Exuma, Ragged Island and the Cays Division. The reviewed current station page does not provide an exact Exuma station telephone or cay-level coverage map.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory'],
    boundary: 'Choose Great Exuma, Little Exuma, or the exact cay; a George Town-centered division label does not prove timely marine or air response elsewhere.',
  },
  'grand-bahama': {
    detail: 'The Northern Bahamas directory lists Grand Bahama airport, central, Eight Mile Rock, northeastern, operational-command, southwestern, traffic, and West End divisions. The telephone page lists district headquarters, several stations, and Fire Services, but not response coverage or capability.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-northern-bahamas-division-directory', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Confirm the traveler’s settlement or cay, the current dispatch route, road or marine access, fire and medical handoff, and receiving facility.',
  },
  inagua: {
    detail: 'The Family Islands index names an Inagua Division. The reviewed current telephone page does not render an exact Inagua station telephone or prove coverage beyond the division label.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory'],
    boundary: 'Keep Matthew Town and Little Inagua separate; verify the current station, communications, road or boat response, clinic handoff, and any air or marine evacuation asset.',
  },
  'long-island': {
    detail: 'The Family Islands index names a Long Island Division. The reviewed current telephone page does not render exact Long Island station contacts or a north-versus-south coverage map.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory'],
    boundary: 'Confirm the settlement and island end, current station, road travel time, fire and clinic handoff, airfield choice, and receiving facility.',
  },
  mayaguana: {
    detail: 'The Family Islands index names a Mayaguana Division. The reviewed current telephone page does not render an exact Mayaguana station contact or response-capability record.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory'],
    boundary: 'Verify the current Abraham’s Bay station or dispatch path, communications, vehicle, fire support, clinic handoff, airport access, and fallback.',
  },
  'nassau-paradise-island': {
    detail: 'RBPF identifies a New Providence District, and its telephone page lists airport, Paradise Island, Tourism, Harbour Patrol, Potters Cay, and multiple geographic station leads across New Providence.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-police-telephone-directory-partial'],
    boundary: 'Select the current incident location and verify the responsible station or specialist unit, dispatch route, road or bridge condition, fire and EMS handoff, and receiving facility.',
  },
  'ragged-island': {
    detail: 'The Family Islands index places Ragged Island within the Exuma, Ragged Island and the Cays Division. The reviewed current telephone page does not render a Duncan Town station contact or local response-capability record.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory'],
    boundary: 'A combined off-island division label does not prove a staffed Duncan Town facility, working communications, local transport, fire response, or air and marine evacuation.',
  },
  'rum-cay': {
    detail: 'The Family Islands index names a combined San Salvador & Rum Cay Division. The reviewed current telephone page does not render a Port Nelson station contact or response-capability record.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory'],
    boundary: 'A combined division does not prove a staffed Rum Cay facility or same-island communications, fire, medical, air, or marine response.',
  },
  'san-salvador': {
    detail: 'The Family Islands index names a combined San Salvador & Rum Cay Division. The reviewed current telephone page does not render an exact San Salvador station contact or response-capability record.',
    sourceIds: ['research-source-rbpf-national-district-emergency-baseline', 'research-source-rbpf-family-islands-division-directory'],
    boundary: 'Verify the current Cockburn Town station or dispatch path, road response, fire and clinic handoff, airport access, and receiving facility; do not infer Rum Cay coverage.',
  },
}

for (const [slug, configuration] of Object.entries(policeResponseFacilityConfigurations)) {
  const islandName = rows.find((candidate) => candidate.slug === slug).name
  addDeepResearchFact({
    slug,
    key: 'dated-police-division-and-station-baseline',
    title: `${islandName}: dated police division and station baseline`,
    topic: 'safety',
    claim: `The Royal Bahamas Police Force says it provides policing across The Bahamas through New Providence, Northern Bahamas, and Family Islands districts and displays 911/919 as the national emergency route. ${configuration.detail}`,
    travelerGuidance: `${configuration.boundary} A division or station listing is not proof that a telephone works, a facility is staffed, dispatch reaches the caller, responders are available, or a vehicle, vessel, aircraft, fire unit, clinic, accessible communication method, or evacuation path can serve the exact location. Confirm current official routing at runtime.`,
    sourceIds: configuration.sourceIds,
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    editorNotes: 'This dated layer records organizational and station-identity evidence without copying mutable telephone numbers into evergreen content. Apparent spelling, placement, and number anomalies remain visible as source-quality rechecks. It does not establish response time, hours, staffing, equipment, jurisdiction at a precise location, fire or marine capability, medical transport, accessibility, or medevac.',
  })
}

const nationalMarineSearchRescueSourceIds = [
  'research-source-rbdf-public-sar-contact-2026',
  'research-source-rbdf-national-search-rescue-protocols',
  'research-source-rbdf-operations-satellite-base-directory',
  'research-source-rbdf-sarops-rcc-status-2025',
]

const marineSearchRescueFacilityEvidence = {
  abacos: {
    detail: 'The current RBDF directory names Northern Command Abaco. A February 2026 site assessment documents HMBS Abaco, current berthing and administrative-office review, and proposed long-range radar and dedicated Maritime Unit facilities. The proposed infrastructure is not recorded as completed or commissioned.',
    sourceId: 'research-source-rbdf-hmbs-abaco-site-assessment-2026',
  },
  'grand-bahama': {
    detail: 'The current RBDF directory names Northern Command Grand Bahama. A February 2026 leadership visit documents an existing headquarters inspection and operational review while describing communications/radar, rapid-response maritime-unit, and Small Boat station locations as proposed or potential.',
    sourceId: 'research-source-rbdf-grand-bahama-readiness-assessment-2026',
  },
  inagua: {
    detail: 'The current RBDF directory names HMBS Matthew Town. A February 2026 source places HMBS Nassau alongside that facility, corroborating dated facility use without proving continuous staffing or an assigned rescue asset.',
    sourceId: 'research-source-rbdf-hmbs-matthew-town-use-2026',
  },
  'nassau-paradise-island': {
    detail: 'The April 2025 SAROPS source locates the Operations Command Center at HMBS Coral Harbour and names OCC, Harbour Patrol, Air Wing, and Sea Training participation. It describes designation as the national Rescue Coordination Centre as a strategic goal, so the repository does not claim that designation is complete.',
    sourceId: 'research-source-rbdf-sarops-rcc-status-2025',
  },
  'ragged-island': {
    detail: 'The current RBDF directory names HMBS Gun Point. A March 2024 operation reports a surface-asset tow to Gun Point and additional personnel arriving aboard HMBS Lawrence Major, which is dated operational evidence rather than a current readiness promise.',
    sourceId: 'research-source-rbdf-gun-point-operation-2024',
  },
}

const marineSearchRescueBoundaries = {
  abacos: 'Choose the exact Abaco island or cay and verify who receives the distress report, which asset can launch, fuel and crew readiness, sea and weather limits, travel time, and the handoff at the nearest reachable dock or clinic.',
  'acklins-crooked-island': 'Keep Acklins, Crooked Island, and Long Cay separate; verify communications, local vessel availability, the launching point, inter-island coverage, aviation support, and the receiving clinic or hospital.',
  andros: 'Choose North, Central, Mangrove Cay, or South Andros and the exact shoreline or bank; verify radio/telephone coverage, launch location, shallow-water capability, weather limits, road or clinic handoff, and air support.',
  'berry-islands': 'Choose the exact cay and route; verify the accountable distress path, nearest deployable asset, fuel and crew, shallow-water or open-sea limits, weather, and receiving facility.',
  bimini: 'Keep North Bimini, South Bimini, Cat Cay, Ocean Cay, and offshore waters separate; verify the current distress path, local or regional asset, USCG/RBDF handoff where applicable, dock, clinic, and onward medical transport.',
  'cat-island': 'Confirm the exact coast or settlement, communications, local launch point and vessel, road and clinic handoff, airfield choice, weather limits, and receiving facility.',
  'eleuthera-harbour-island': 'Keep mainland Eleuthera, Harbour Island, and Spanish Wells separate; verify the responsible distress route, asset and launch point, reefs and cuts, dock transfer, road/clinic handoff, and weather limits.',
  'the-exumas': 'Choose Great Exuma, Little Exuma, or the exact cay and waterway; verify the responsible distress route, nearest deployable asset, range, fuel, crew, protected-area constraints, weather, dock, clinic, and air handoff.',
  'grand-bahama': 'Confirm whether the incident is near Freeport, West End, East End, or an offshore cay; verify the current command contact, deployable asset, harbour or small-boat launch, weather, fire/EMS handoff, and receiving facility.',
  inagua: 'Keep Matthew Town, Great Inagua waters, and Little Inagua separate; verify the current command path, assigned or visiting asset, launch readiness, range, weather, clinic handoff, airport access, and receiving facility.',
  'long-island': 'Confirm the coast, settlement, bank or ocean side, current distress route, nearest launch point and vessel, road distance, clinic and airfield handoff, weather, and receiving facility.',
  mayaguana: 'Verify the current distress route from the exact coast or anchorage, working communications, local vessel or off-island asset, range, weather, Abraham’s Bay clinic and airport handoff, and fallback.',
  'nassau-paradise-island': 'Verify the current public distress route, whether OCC, Harbour Patrol, Police Marine Unit, BASRA, port, marina, or another responder owns the first action, the deployable asset, harbour/reef limits, fire/EMS handoff, and receiving facility.',
  'ragged-island': 'Verify current HMBS Gun Point staffing and public routing, assigned or visiting assets, fuel and crew, launch readiness, range along the Ragged Island chain, weather, Duncan Town clinic/airfield handoff, and receiving facility.',
  'rum-cay': 'Verify the current public distress route, working communications, local vessel or off-island asset, range, reef and weather limits, Port Nelson dock/clinic handoff, airfield access, and receiving facility.',
  'san-salvador': 'Verify the current public distress route, local or off-island asset, launch point, range, reef and weather limits, road/clinic handoff, airport access, and receiving facility.',
}

const marineSearchRescueConfigurations = Object.fromEntries(rows.map((row) => {
  const facility = marineSearchRescueFacilityEvidence[row.slug]
  return [row.slug, {
    detail: facility?.detail || 'The reviewed current RBDF operations and satellite-base directory does not name an island-specific RBDF base for this destination. This is a recorded evidence gap, not proof that no RBDF personnel, facility, partner, vessel, aircraft, or response can serve it.',
    sourceIds: [...nationalMarineSearchRescueSourceIds, ...(facility?.sourceId && !nationalMarineSearchRescueSourceIds.includes(facility.sourceId) ? [facility.sourceId] : [])],
    boundary: marineSearchRescueBoundaries[row.slug],
  }]
}))

for (const [slug, configuration] of Object.entries(marineSearchRescueConfigurations)) {
  const islandName = rows.find((candidate) => candidate.slug === slug).name
  addDeepResearchFact({
    slug,
    key: 'dated-marine-search-rescue-coordination-and-facility-baseline',
    title: `${islandName}: marine search-and-rescue coordination and facility baseline`,
    topic: 'safety',
    claim: `The reviewed RBDF emergency-support document assigns the Royal Bahamas Defence Force central/lead coordination for national search and rescue and marine search and rescue, working with NEMA, the Port Department, the United States Embassy, and other support agencies as applicable. A 2025 RBDF update says the Operations Command Center was building toward designated national Rescue Coordination Centre status; this repository does not treat the designation as complete. The current official RBDF contact page also publishes Search & Rescue at (242) 362-3816 and Harbour Control on VHF Channel 16, establishing a national public routing baseline without proving island-level coverage or response. ${configuration.detail}`,
    travelerGuidance: `${configuration.boundary} The current RBDF public contact page supplies a national Search & Rescue telephone route and Harbour Control VHF Channel 16. Those published routes, plus a coordination role, training record, directory entry, facility name, vessel visit, or past operation, are not proof that a call or transmission will connect from the exact island/cay, that a continuous watch persists through an outage, or that staff, an assigned vessel or aircraft, launch readiness, range, response time, accessible communication, medical transport, or successful evacuation are available. Resolve the current responsible-authority route at runtime.`,
    sourceIds: configuration.sourceIds,
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    editorNotes: 'This layer separates the current public national SAR/VHF route, national SAR responsibility, RCC designation status, named facility footprint, proposed infrastructure, and dated operational examples. Internal-looking directory extensions are excluded from evergreen facts. Absence from the directory is never treated as proof of no service, and a named base or public contact is never treated as an island-level readiness or response-time promise.',
  })
}

const nationalAirportFireEmsSourceIds = [
  'research-source-caab-rffs-standard',
  'research-source-caab-government-aerodrome-rffs-register',
  'research-source-airport-authority-rff-service-footprint',
  'research-source-doa-airport-emergency-contact-review',
  'research-source-pha-nems-ambulance-system-snapshot',
  'research-source-drm-fidep-local-response-asset-standard',
  'research-source-rbpf-fire-service-directory-scope',
]

const airportFireEmsFacilityConfigurations = {
  abacos: {
    register: 'The dated register lists Leonard M. Thompson International (MYAM) as CAT 5 and Moore\'s Island (MYAO), Sandy Point (MYAS), and Treasure Cay (MYAT) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders labelled Emergency fields for the reviewed government-operated Abaco airport entries while private and cay entries can render N/A.',
    structuralFire: 'The reviewed RBPF directory does not provide an Abaco fire-station, brigade, appliance, or service-boundary record.',
    boundary: 'Keep mainland Abaco and every cay separate; confirm the selected airport, published current AIP category, active flight window, emergency receiver, airport appliance and crew, structural or wildfire responder, ambulance or first responder, clinic handoff, road or marine transfer, and mutual-aid fallback.',
  },
  'acklins-crooked-island': {
    register: 'The dated register lists Spring Point, Acklins (MYAP) and Colonel Hill, Crooked Island (MYCI) as CAT 0.',
    emergencyDirectory: 'The reviewed Department of Aviation directory renders a Phone & Emergency field for Colonel Hill, while the rendered Spring Point section does not establish a separate emergency field.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Acklins, Crooked Island, or Long Cay fire-facility or capability map.',
    boundary: 'Keep Acklins, Crooked Island, and Long Cay separate; verify the exact airport or settlement, current emergency receiver, local or off-island airport and structural-fire assets, ambulance or trained first responder, clinic rendezvous, inter-island transfer, air or marine evacuation, and fallback.',
  },
  andros: {
    register: 'The dated register lists Andros Town International (MYAF), Clarence A. Bain (MYAB), Congo Town (MYAK), and San Andros (MYAN) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders labelled Emergency fields for the reviewed Andros government-airport entries.',
    structuralFire: 'The reviewed RBPF directory does not provide a current island-wide Andros structural or wildfire response map.',
    boundary: 'Choose North, Central, Mangrove Cay, or South Andros and the exact airport or settlement; verify the current airport category and flight window, emergency receiver, local appliance and crew, AUTEC or other mutual-aid limits where relevant, ambulance or first responder, road or marine transfer, clinic, and receiving hospital.',
  },
  'berry-islands': {
    register: 'The dated register lists Great Harbour Cay (MYBG) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders an Emergency field for Great Harbour Cay; reviewed private and cay-airport entries can render N/A.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Berry Islands fire-facility or cay-by-cay response map.',
    boundary: 'Choose the exact cay and airport or dock; verify the current emergency receiver, airport appliance and crew, volunteer or other structural-fire responder, water supply, ambulance or trained first responder, clinic and dock transfer, mutual aid, weather limit, and evacuation destination.',
  },
  bimini: {
    register: 'The dated register lists South Bimini (MYBS) as CAT 5.',
    emergencyDirectory: 'The Department of Aviation directory renders an Emergency field for South Bimini while reviewed seaplane, Cat Cay, and Ocean Cay entries render N/A.',
    structuralFire: 'A July 2026 DRM listing records equipment presented to Bimini officials to enhance community firefighting and associated training, without publishing a complete current asset, custodian, station, or readiness record.',
    boundary: 'Keep North Bimini, South Bimini, Cat Cay, Ocean Cay, and other cays separate; verify airport and community dispatch, equipment custody and serviceability, trained crew, water supply, ferry or bridge transfer, ambulance or first responder, clinic, medevac, US or Bahamian mutual aid where applicable, and fallback.',
    extraSourceIds: ['research-source-drm-bimini-fire-equipment-training-2026'],
  },
  'cat-island': {
    register: 'The dated register records Arthur\'s Town (MYCA) as under construction and New Bight (MYCB) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders labelled Emergency fields for the reviewed Arthur\'s Town and New Bight entries.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Cat Island fire-facility, brigade, appliance, or service-boundary record.',
    boundary: 'Confirm which airport and settlement are relevant, whether Arthur\'s Town construction status has changed, the current AIP category and flight window, emergency receiver, airport and community fire assets, ambulance or first responder, road distance, clinic, medevac route, and fallback.',
  },
  'eleuthera-harbour-island': {
    register: 'The dated register lists Governor\'s Harbour (MYEM) and Rock Sound (MYER) as CAT 0 and North Eleuthera (MYEH) as CAT 5.',
    emergencyDirectory: 'The Department of Aviation directory renders labelled Emergency fields for Governor\'s Harbour, North Eleuthera, and Rock Sound.',
    structuralFire: 'An April 2024 RBPF incident records an Eleuthera volunteer fire-service response. A March 2026 AAIA notice records Airport Authority and CAA-B coordination after an aircraft was disabled on the Governor\'s Harbour runway, but does not state that airport firefighters were deployed.',
    boundary: 'Keep mainland Eleuthera, Harbour Island, and Spanish Wells separate; verify the selected airport, current AIP category, emergency receiver, airport and volunteer assets, brigade identity, staffing, dispatch, road or ferry transfer, ambulance or first responder, clinic, airlift, and mutual-aid fallback.',
    extraSourceIds: ['research-source-aaia-airport-incident-response-evidence-2026', 'research-source-rbpf-eleuthera-volunteer-fire-response-2024'],
  },
  'the-exumas': {
    register: 'The dated register lists Exuma International (MYEF) as CAT 5 and Black Point (MYEB), Farmer\'s Cay (MYE3), and Staniel Cay (MYES) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders labelled Emergency fields for the reviewed Black Point, Exuma International, Farmer\'s Cay, and Staniel Cay entries.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Great Exuma, Little Exuma, or cay-by-cay fire-facility and capability map.',
    boundary: 'Choose Great Exuma, Little Exuma, or the exact cay and airport; verify the current emergency receiver, airport and community fire assets, crew and water supply, ambulance or trained first responder, clinic or hospital handoff, road or marine transfer, medevac, weather limit, and fallback.',
  },
  'grand-bahama': {
    register: 'The dated register lists Grand Bahama International (MYGF) as CAT 5.',
    emergencyDirectory: 'The Department of Aviation directory renders an Emergency field and emergency-radio information for Grand Bahama International.',
    structuralFire: 'The reviewed RBPF directory explicitly lists Fire Services in Grand Bahama but does not establish station, appliance, staffing, response-time, island-wide wildfire, or East End and West End coverage.',
    boundary: 'Confirm the exact airport or community and current category, flight window, Airport Authority and RBPF ownership, emergency receiver, airport and structural-fire appliances, crew, ambulance, Rand handoff, East or West transfer distance, industrial or mutual aid, and fallback.',
  },
  inagua: {
    register: 'The dated register lists Matthew Town (MYIG) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders a labelled Emergency field for Matthew Town.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Inagua structural or wildfire response-facility record.',
    boundary: 'Keep Matthew Town, remote Great Inagua locations, and Little Inagua separate; verify the current airport category and emergency receiver, airport and community fire assets, Morton Salt or other mutual-aid limits where applicable, ambulance or first responder, clinic, airport transfer, medevac, communications, and fallback.',
  },
  'long-island': {
    register: 'The dated register lists Deadman\'s Cay (MYLD) and Stella Maris (MYLS) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders labelled Emergency fields for Deadman\'s Cay and Stella Maris.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Long Island fire-station, brigade, appliance, or north-to-south service-boundary record.',
    boundary: 'Choose the exact settlement and airport; verify the current emergency receiver, airport and structural-fire assets, crew, water supply, ambulance or first responder, road distance, clinic, air transfer, receiving hospital, mutual aid, and fallback.',
  },
  mayaguana: {
    register: 'The dated register lists Mayaguana Airport (MYMM) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders a labelled Emergency field for Mayaguana Airport.',
    structuralFire: 'A March 2026 AAIA notice says occupants of an aircraft that left the runway were receiving medical attention, but does not identify the responder, ambulance, transport, fire asset, or response time. The reviewed RBPF directory has no current Mayaguana fire-facility map.',
    boundary: 'Verify the current airport category and flight window, emergency receiver, airport appliance and crew, structural or wildfire response, ambulance or trained first responder, Abraham\'s Bay clinic handoff, road access, medevac aircraft and receiving facility, communications, and fallback.',
    extraSourceIds: ['research-source-aaia-airport-incident-response-evidence-2026'],
  },
  'nassau-paradise-island': {
    register: 'The dated register lists Lynden Pindling International (MYNN) as CAT 8 with 24-hour operations in that snapshot.',
    emergencyDirectory: 'The reviewed Department of Aviation LPIA entry publishes general contact and website information but does not render a separate labelled Emergency field.',
    structuralFire: 'The reviewed RBPF directory explicitly lists Fire Services for New Providence. A July 2026 AAIA notice says Airport Fire and Rescue Services responded to and extinguished an aircraft-engine fire at LPIA; that event is not a continuous readiness guarantee.',
    boundary: 'Verify the exact incident location and responsible Airport Authority, RBPF Fire Services, NEMS, private, industrial, or mutual-aid route; current category and operational state; appliances and crew; dispatch; ambulance; PMH or other receiving facility; Paradise Island transfer; traffic; and fallback.',
    extraSourceIds: ['research-source-aaia-airport-incident-response-evidence-2026'],
  },
  'ragged-island': {
    register: 'The dated register lists Duncan Town (MYRD) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders a labelled Emergency field for Duncan Town.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Ragged Island fire-facility, brigade, appliance, or chain-wide service record.',
    boundary: 'Verify the current airport category and emergency receiver, same-island airport or community fire asset, crew, water supply, ambulance or trained first responder, Duncan Town clinic, chain-wide communications, air or marine medevac, weather limit, and fallback.',
  },
  'rum-cay': {
    register: 'The dated register lists New Port Nelson (MYRP) as CAT 0.',
    emergencyDirectory: 'The Department of Aviation directory renders a Phone & Emergency field for New Port Nelson.',
    structuralFire: 'The reviewed RBPF directory does not provide a current Rum Cay fire-facility, brigade, appliance, or service record.',
    boundary: 'Verify the current airport category and emergency receiver, airport or community fire asset, crew and water supply, ambulance or trained first responder, Port Nelson clinic and road transfer, medevac, communications, weather limit, and fallback.',
  },
  'san-salvador': {
    register: 'The dated register lists San Salvador International (MYSM) as CAT 8.',
    emergencyDirectory: 'The Department of Aviation directory renders a labelled Emergency field for San Salvador International.',
    structuralFire: 'The reviewed RBPF directory does not provide a current San Salvador structural or wildfire response-facility and service-boundary record.',
    boundary: 'Verify the current airport category and flight window, emergency receiver, airport and community fire assets, crew, ambulance or trained first responder, clinic, resort or private mutual aid where applicable, medevac aircraft, receiving hospital, and fallback.',
  },
}

for (const [slug, configuration] of Object.entries(airportFireEmsFacilityConfigurations)) {
  const islandName = rows.find((candidate) => candidate.slug === slug).name
  const sourceIds = [...nationalAirportFireEmsSourceIds, ...(configuration.extraSourceIds || [])]
  addDeepResearchFact({
    slug,
    key: 'dated-airport-rescue-fire-and-ems-facility-baseline',
    title: `${islandName}: airport rescue, fire, and EMS facility baseline`,
    topic: 'safety',
    claim: `CAA-B CAP AGA 03 requires an aerodrome operator to provide vehicles, equipment, and personnel commensurate with the RFFS category published in the AIP, with task-and-resource analysis, response testing, and specialist-risk assessment near water, swamp, or difficult terrain. ${configuration.register} CAT 0 is retained verbatim: the reviewed register does not define it and the CAP category table begins at 1, so it is not translated into “no rescue” or “no fire response.” The Airport Authority says it delivers Rescue Fire Fighting services at LPIA and throughout the Family Islands. ${configuration.emergencyDirectory} ${configuration.structuralFire} An officially hosted but internally legacy PHA description places national first-response coordination with NEMS and reports six ambulances attached to unspecified Family Island clinics; those counts and locations are not treated as current.`,
    travelerGuidance: `${configuration.boundary} A regulatory standard, published category, emergency-labelled directory field, national service statement, historical fleet count, equipment handoff, or dated incident does not prove a current contact, staffed appliance, extinguishing agent, ambulance, dispatch, response time, accessible rescue, stabilization, medical transfer, or successful evacuation. Recheck the current AIP and responsible authorities at runtime; do not publish mutable emergency numbers from this fact.`,
    sourceIds,
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    editorNotes: 'This layer keeps airport RFFS, structural and wildfire response, and EMS as separate capabilities. CAT 0 is never interpreted beyond the register text. Emergency directory fields are routing leads, not capability proof. The NEMS fleet description is a historical lead. Dated incidents and training show only the stated event; no current staffing, vehicle, dispatch, coverage, response time, accessibility, or evacuation promise is inferred.',
  })
}

const official2026ShelterRows = `
1|abacos|Central Abaco Primary School|Central Pines|880|hurricane_shelter|
2|abacos|Friendship Tabernacle|Dundas Town|250|hurricane_shelter|
3|abacos|Guana Cay Primary School|Guana Cay|40|hurricane_shelter|
4|abacos|Man-O-War Primary School|Man-O-War Cay|80|hurricane_shelter|
5|abacos|DRM Abaco Shelter|Central Pines|300|hurricane_shelter|
6|abacos|Murphy Town Community Center|Murphy Town|100|hurricane_shelter|
7|abacos|Amy Roberts Primary School|Green Turtle Cay|240|hurricane_shelter|
8|abacos|Faithwalk Church of God - Community Center|Cooper's Town|170|hurricane_shelter|
9|abacos|Crossing Rocks Primary School|Crossing Rocks|70|hurricane_shelter|
10|abacos|Moore's Island School|Moore's Island|240|hurricane_shelter|
11|abacos|Soul Seeking Ministries|Moore's Island|200|hurricane_shelter|
12|andros|Bowen Sound Pentecostal Ministries|Bowen Sound|100|hurricane_shelter|
13|andros|Rev. Euthurl Rodgers Primary School|Deep Creek|90|hurricane_shelter|
14|andros|Friendship Baptist Church|The Bluff|180|hurricane_shelter|
15|andros|Cleora McKenzie Pre-School|Long Bay Cays|90|hurricane_shelter|
16|andros|Burnt Rock Primary School|Burnt Rock, Mangrove Cay|80|hurricane_shelter|
17|andros|Mangrove Cay High School|Mangrove Cay|80|hurricane_shelter|
18|andros|South Andros Multi-Purpose Gymnasium|Money Rock|400|hurricane_shelter|
19|andros|BAMSI Training Center|BARC Community|20|hurricane_shelter|
20|andros|Nicholl's Town / Clara Evans Primary School|Nicholl's Town|50|hurricane_shelter|
21|berry-islands|Church of God of Prophecy|Great Harbour Cay|50|hurricane_shelter|
22|berry-islands|David A. Dean Community Center|Bullocks Harbour|100|hurricane_shelter|
23|bimini|Gateway Gymnasium|Bailey Town|500|hurricane_shelter|
24|bimini|Louise McDonald High School (4 Classrooms)|Alice Town|110|hurricane_shelter|
25|bimini|Urban Renewal Building (Special Needs Shelter)|Alice Town|30|special_needs_shelter|Special Needs Shelter
26|cat-island|St. Mark's Anglican School|Port Howe|50|hurricane_shelter|
27|cat-island|Seaview Seventh Day Adventist Church|Wilson Bay|120|hurricane_shelter|
28|cat-island|Holy Redeemer Catholic Church|New Bight|80|hurricane_shelter|
29|cat-island|Mt. Sinai Native Baptist Church|New Bight|120|hurricane_shelter|
30|cat-island|St. Andrew's Anglican Church|Arthur's Town|60|hurricane_shelter|
31|acklins-crooked-island|Church of God of Prophecy|Cripple Hill|70|hurricane_shelter|
32|acklins-crooked-island|Landrail Point Community Centre|Landrail Point|70|hurricane_shelter|
33|eleuthera-harbour-island|Wesley Methodist Church (Hall)|Palmetto Point|50|hurricane_shelter|
34|eleuthera-harbour-island|Church of the Nazarene|Palmetto Point|50|hurricane_shelter|
35|eleuthera-harbour-island|The Salvation Army|Palmetto Point|40|hurricane_shelter|
36|eleuthera-harbour-island|Emily G. Petty Primary School|Governor's Harbour|80|hurricane_shelter|
37|eleuthera-harbour-island|George E. Johnson Memorial Center|Hatchet Bay|40|hurricane_shelter|
38|eleuthera-harbour-island|Bahamas Methodist Habitat (Camp Symonette)|James Cistern|100|hurricane_shelter|
39|eleuthera-harbour-island|Charles Wesley Methodist Church|Lower Logue|150|hurricane_shelter|
40|eleuthera-harbour-island|Mission Church of God|Upper Bogue|70|hurricane_shelter|
41|eleuthera-harbour-island|The Current Community Center|The Current|20|hurricane_shelter|
42|eleuthera-harbour-island|Haitian Baptist People Church|The Bluff|80|hurricane_shelter|
43|eleuthera-harbour-island|Zion Methodist Church|Current Island|50|hurricane_shelter|
44|eleuthera-harbour-island|New Jerusalem Church|Blackwood|200|hurricane_shelter|
45|eleuthera-harbour-island|Sir George Robert's Public Library|Harbour Island|30|hurricane_shelter|
46|eleuthera-harbour-island|Lighthouse Church of God|Harbour Island|150|hurricane_shelter|
47|eleuthera-harbour-island|New Alliance Church of God|Harbour Island|20|hurricane_shelter|
48|eleuthera-harbour-island|Wesley Methodist Church|Harbour Island|50|hurricane_shelter|
49|eleuthera-harbour-island|Church of God of Prophecy|Tarpum Bay|70|hurricane_shelter|
50|eleuthera-harbour-island|Deep Creek Primary School|Deep Creek|50|hurricane_shelter|
51|eleuthera-harbour-island|Green Castle Primary School|Green Castle|190|hurricane_shelter|
52|eleuthera-harbour-island|Wemyss Bight Primary School|Wemyss Bight|140|hurricane_shelter|
53|eleuthera-harbour-island|Frederick G. Guild Complex|Rock Sound|50|hurricane_shelter|
54|the-exumas|Bethel Union Baptist Church|Ramsey|80|hurricane_shelter|
55|the-exumas|Ebenezer Union Baptist Church|Farmer's Hill|100|hurricane_shelter|
56|the-exumas|Ebenezer Union Baptist Church|Barraterre|60|hurricane_shelter|
57|the-exumas|Exuma Resource Center (Special Needs Shelter)|Hooper's Bay|60|special_needs_shelter|Special Needs Shelter
58|the-exumas|Forbe's Hill Cultural Center|Forbe's Hill|30|hurricane_shelter|
59|the-exumas|Gethsemane Baptist Church|Black Point|50|hurricane_shelter|
60|the-exumas|Mount Herman Union Baptist Church|Mt. Thompson|100|hurricane_shelter|
61|the-exumas|St. John's The Baptist Anglican Church|Moss Town|60|hurricane_shelter|
62|the-exumas|Aurelia Miller Comprehensive School|Black Point|60|hurricane_shelter|
63|the-exumas|St. Luke's Union Baptist Church|Black Point|60|hurricane_shelter|
64|the-exumas|The New Mt. Olive Union Baptist Church|Hartswell|60|hurricane_shelter|
65|the-exumas|Mount Olivet Baptist Church|Staniel Cay|80|hurricane_shelter|
66|the-exumas|Palestine Union Baptist Church|The Forest|80|hurricane_shelter|
67|the-exumas|St. Andrew's Community Center|George Town|200|hurricane_shelter|
68|the-exumas|St. Margaret's Anglican Church|Harts/Steventon|60|hurricane_shelter|
69|the-exumas|St. Mary's Magdeline Anglican Church|William's Town|60|hurricane_shelter|
70|the-exumas|St. Theresa's Roman Catholic Church|George Town|110|hurricane_shelter|
71|the-exumas|St. Margaret Mission Baptist Church|Stuart Manor|60|hurricane_shelter|
72|the-exumas|Ebenezer Union Baptist Church|Rolleville|80|hurricane_shelter|
73|grand-bahama|Bethany Baptist Church|Hanna Hill|150|hurricane_shelter|
74|grand-bahama|Church of God of Prophecy|Seagrape|100|hurricane_shelter|
75|grand-bahama|Central Zion Baptist|Pinedale|60|hurricane_shelter|
76|grand-bahama|Church of God of Prophecy|Pinedale|80|hurricane_shelter|
77|grand-bahama|Bethel Baptist Church|Pinedale|150|hurricane_shelter|
78|grand-bahama|New Mount Olivet Baptist Church|Holme's Rock|100|hurricane_shelter|
79|grand-bahama|Eight Mile Rock Gymnasium|Eight Mile Rock|400|hurricane_shelter|
80|grand-bahama|Holme's Rock Junior Highschool|Holme's Rock|200|hurricane_shelter|
81|grand-bahama|Foster B Pestina Hall, Christ The King (Shelter Needs Shelter)|East Atlantic Drive|80|other|Shelter Needs Shelter
82|grand-bahama|Central Church of God|Coral Road|130|hurricane_shelter|
83|grand-bahama|First Baptist Church|Columbus Drive|125|hurricane_shelter|
84|grand-bahama|Shiloh Seventh Day Adventist Church|Sandcombe Road|50|hurricane_shelter|
85|grand-bahama|Evangeline Jervis Hurricane Shelter|Anita Doherty Drive (Beachway Drive) & Gambier Drive|120|hurricane_shelter|
86|grand-bahama|Revelation Apostolic International Church|Jobson Avenue|30|hurricane_shelter|
87|grand-bahama|Calvary Temple Assembly of God|Clive Avenue|100|hurricane_shelter|
88|grand-bahama|Bishop Michael Eldon School (Auditorium)|Anita Roherty Drive (Beachway Drive)|300|hurricane_shelter|
89|grand-bahama|COGOP Community at Heart (Reserved for Aftermath)|Coral Road|350|aftermath_facility|Reserved for Aftermath
90|grand-bahama|Maurice Moore Primary School|Torcross Road & Sandcombe Drive|820|hurricane_shelter|
91|grand-bahama|St. George's High School Gymnasium|Sunset Highway|400|hurricane_shelter|
92|inagua|St. Phillip's Anglican Community Centre|Matthew Town|60|hurricane_shelter|
93|long-island|First Assemblies Discipleship Centre|Salt Pond|20|hurricane_shelter|
94|long-island|Community Centre|Clarence Town|100|hurricane_shelter|
95|long-island|Holy Cross Anglican Church|Hamilton's|60|hurricane_shelter|
96|long-island|Holy Family Anglican Church|Mortimor's|30|hurricane_shelter|
97|long-island|Salem Baptist Church|Millers|40|hurricane_shelter|
98|long-island|Seymour's Gospel Church|Seymour's|20|hurricane_shelter|
99|long-island|St Athanasius|Deadman's Cay|70|hurricane_shelter|
100|long-island|St Paul's Anglican Parish|Clarence Town|25|hurricane_shelter|
101|mayaguana|Mayaguana Comprehensive K - School|Pirate's Well|80|hurricane_shelter|
102|mayaguana|Betsy Bay Community Centre|Betsy Bay|70|hurricane_shelter|
103|nassau-paradise-island|New Providence Community Center|Blake Road|330|hurricane_shelter|
104|nassau-paradise-island|Samuel and Cornella Williams Community Center, The Salvation Army|Meadow Street|50|hurricane_shelter|
105|nassau-paradise-island|Rev. Dr. O. A. Pratt Educational Building, St. John's Native Baptist|Augusta & Meeting Street|150|hurricane_shelter|
106|nassau-paradise-island|Epwoth Hall, Ebenezer Methodist Church (for use by Homeless and Persons with physical disabilities)|Shirley Street|270|special_needs_shelter|for use by Homeless and Persons with physical disabilities
107|nassau-paradise-island|St. Barnabus Anglican Church|Wulff Road & Baillou Hill Road|140|hurricane_shelter|
108|nassau-paradise-island|Maranatha Seventh Day Adventist|Prince Charles|140|hurricane_shelter|
109|nassau-paradise-island|The Salvation Army|Mackey Street|60|hurricane_shelter|
110|nassau-paradise-island|Pilgrim Baptist Temple|St. James Street|150|hurricane_shelter|
111|nassau-paradise-island|New Bethlehem Baptist Church|Independence Drive|200|hurricane_shelter|
112|nassau-paradise-island|Church of God (Convention Center)|Joe Farrinton Road|600|hurricane_shelter|
113|nassau-paradise-island|Berea Seventh Day Adventist|Baillou Hill South|50|hurricane_shelter|
114|nassau-paradise-island|Canon Neil E. Roach Hall, Holy Cross Anglican Church|Highbury Park|100|hurricane_shelter|
115|nassau-paradise-island|Epiphany Anglican Church|Prince Charles Drive|300|hurricane_shelter|
116|nassau-paradise-island|Nassau Village Community Center|Nassau Village|300|hurricane_shelter|
117|rum-cay|Rum Cay All Age School|Rum Cay|30|hurricane_shelter|
118|san-salvador|Gerace Research Center|United Estates|170|hurricane_shelter|
119|san-salvador|Idell Jones Community Hall|Cockburn Town|80|hurricane_shelter|
120|san-salvador|St. Stephen's Native Baptist Church|Cockburn Town|90|hurricane_shelter|
121|san-salvador|St. Peter's Native Baptist|Long Bay|20|hurricane_shelter|
`.trim().split('\n').map((line) => {
  const [entryNumber, slug, title, settlement, publishedCapacity, facilityKind, sourceDesignation] = line.split('|')
  return {
    entryNumber: Number(entryNumber),
    slug,
    title,
    settlement,
    publishedCapacity: Number(publishedCapacity),
    facilityKind,
    sourceDesignation: sourceDesignation || undefined,
  }
})

if (official2026ShelterRows.length !== 121) throw new Error(`Expected 121 official shelter rows, found ${official2026ShelterRows.length}`)
if (official2026ShelterRows.some((item, index) => item.entryNumber !== index + 1)) throw new Error('Official shelter source entry numbers are not sequential')
if (official2026ShelterRows.reduce((sum, item) => sum + item.publishedCapacity, 0) !== 15700) throw new Error('Official shelter printed capacities do not total 15,700')

const emergencyFacilityDraftDocs = official2026ShelterRows.map((item) => {
  const destination = rows.find((candidate) => candidate.slug === item.slug)
  if (!destination) throw new Error(`Missing destination for official shelter row ${item.entryNumber}: ${item.slug}`)
  const sourceAnomaly = item.entryNumber === 81
    ? 'The source prints “Shelter Needs Shelter,” which appears anomalous and is preserved verbatim for editorial adjudication.'
    : item.entryNumber === 88
      ? 'The source prints “Anita Roherty Drive”; another row prints “Anita Doherty Drive.” Preserve this address conflict until the authority confirms it.'
      : item.entryNumber === 106
        ? 'The source prints “Epwoth Hall” and “Joe Farrinton Road” appears elsewhere in the same list; apparent spelling issues are preserved rather than silently corrected.'
        : ''
  return {
    _id: `drafts.emergency-facility-drm-2026-${String(item.entryNumber).padStart(3, '0')}-${item.slug}`,
    _type: 'emergencyFacility',
    title: item.title,
    destination: {_type: 'reference', _ref: destination.destinationId},
    facilityKind: item.facilityKind,
    settlement: item.settlement,
    publishedCapacity: item.publishedCapacity,
    publishedForYear: 2026,
    sourceEntryNumber: item.entryNumber,
    ...(item.sourceDesignation ? {sourceDesignation: item.sourceDesignation} : {}),
    source: {_type: 'reference', _ref: 'research-source-drm-official-2026-emergency-shelter-list-pdf'},
    checkedAt,
    nextReviewAt: '2026-09-03',
    verificationStatus: 'source_verified',
    reviewNotes: `Review-only transcription of numbered row ${item.entryNumber} in the official 2026 PDF. The printed capacity is a dated publication value, not current usable capacity. Source verification does not establish activation, opening, building condition, staffing, supplies, sanitation, power, communications, security, transport, pet policy, medical support, or feature-level accessibility. Confirm current official instructions before any traveler use. ${sourceAnomaly}`.trim(),
    channels: [],
  }
})

const hurricaneShelterFacilityConfigurations = {
  abacos: {count: 11, capacity: 2570, detail: 'The rows span Central Abaco, mainland communities, Guana Cay, Man-O-War Cay, Green Turtle Cay, and Moore’s Island; that distribution is not proof of access from every Abaco cay.'},
  'acklins-crooked-island': {count: 2, capacity: 140, detail: 'Both PDF rows are on Crooked Island—Cripple Hill and Landrail Point—and no Acklins row appears. The companion web page names Joshua Kingdom Ministries in Pine Field, Acklins, and one additional Crooked Island facility, so the two official surfaces conflict.'},
  andros: {count: 9, capacity: 1090, detail: 'The rows include North, Central, Mangrove Cay, and South Andros locations; they do not establish transport between districts or cays.'},
  'berry-islands': {count: 2, capacity: 150, detail: 'Both rows are on Great Harbour Cay/Bullocks Harbour; no other Berry Islands cay is represented.'},
  bimini: {count: 3, capacity: 640, detail: 'One Alice Town row is designated “Special Needs Shelter,” but that label does not establish any particular accessibility, medical, caregiver, power, bathroom, or transport feature.'},
  'cat-island': {count: 5, capacity: 430, detail: 'The rows cover Port Howe, Wilson Bay, New Bight, and Arthur’s Town; they are list entries rather than a current island-wide access plan.'},
  'eleuthera-harbour-island': {count: 21, capacity: 1680, detail: 'Four rows are explicitly in Harbour Island. No row explicitly names Spanish Wells, and the list does not establish ferry, bridge, or road access during an emergency.'},
  'the-exumas': {count: 19, capacity: 1450, detail: 'The rows span Great Exuma settlements and several Exuma Cays. One Hooper’s Bay row is designated “Special Needs Shelter,” which is not feature-level accessibility proof.'},
  'grand-bahama': {count: 19, capacity: 3745, detail: 'One row carries the anomalous wording “Shelter Needs Shelter,” and another is explicitly reserved for aftermath; neither should be normalized into a currently activated public shelter.'},
  inagua: {count: 1, capacity: 60, detail: 'The only row is in Matthew Town; the list supplies no Little Inagua facility or evacuation path.'},
  'long-island': {count: 8, capacity: 365, detail: 'The rows span Salt Pond, Clarence Town, Hamilton’s, Mortimor’s, Millers, Seymour’s, and Deadman’s Cay; current road access and transport remain unverified.'},
  mayaguana: {count: 2, capacity: 150, detail: 'The PDF lists Pirate’s Well and Betsy Bay. The companion web page additionally names St James Native Baptist Church, so the two official surfaces conflict.'},
  'nassau-paradise-island': {count: 14, capacity: 2840, detail: 'All rows are in New Providence. One is described for homeless people and persons with physical disabilities, but the list does not establish feature-level accessibility or a Paradise Island-specific facility.'},
  'ragged-island': {count: 0, capacity: 0, detail: 'The PDF has no Ragged Island row, and the reviewed companion page does not supply a usable Ragged Island panel. This is a documented no-entry result, not proof that no shelter or emergency arrangement exists.'},
  'rum-cay': {count: 1, capacity: 30, detail: 'The only row is Rum Cay All Age School; the list does not establish current condition, activation, or island transport.'},
  'san-salvador': {count: 4, capacity: 360, detail: 'The rows are in United Estates, Cockburn Town, and Long Bay; current access and usable capacity remain unverified.'},
}

for (const [slug, configuration] of Object.entries(hurricaneShelterFacilityConfigurations)) {
  const islandName = rows.find((candidate) => candidate.slug === slug).name
  const actualRows = official2026ShelterRows.filter((item) => item.slug === slug)
  const actualCapacity = actualRows.reduce((sum, item) => sum + item.publishedCapacity, 0)
  if (actualRows.length !== configuration.count || actualCapacity !== configuration.capacity) {
    throw new Error(`Official shelter rollup mismatch for ${slug}: expected ${configuration.count}/${configuration.capacity}, found ${actualRows.length}/${actualCapacity}`)
  }
  addDeepResearchFact({
    slug,
    key: 'dated-2026-hurricane-shelter-facility-list-baseline',
    title: `${islandName}: official 2026 emergency-shelter facility baseline`,
    topic: 'safety',
    claim: configuration.count > 0
      ? `The official seven-page 2026 emergency-shelter PDF contains ${configuration.count} numbered ${configuration.count === 1 ? 'facility row' : 'facility rows'} assigned to ${islandName}, with printed capacities totaling ${configuration.capacity.toLocaleString('en-US')}. ${configuration.detail}`
      : `The official seven-page 2026 emergency-shelter PDF contains no facility row assigned to ${islandName}. ${configuration.detail}`,
    travelerGuidance: 'Use this only as a dated preparedness and facility-identification baseline. A printed row or capacity does not mean a facility is activated, open, safe, staffed, reachable, supplied, accessible, or appropriate for the traveler. Follow current DRM and local-authority instructions at runtime; never route a traveler to a shelter from this fact alone.',
    sourceIds: [
      'research-source-drm-official-2026-emergency-shelter-list-pdf',
      'research-source-drm-2026-hurricane-shelters',
      'research-source-drm-evacuation-guidance',
      'research-source-drm-disability-preparedness',
      'research-source-drm-fidep-local-response-asset-standard',
    ],
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    editorNotes: 'The PDF was transcribed by numbered row and mechanically checked for 121 entries and 15,700 total printed capacity. Official PDF/web omissions and conflicts are preserved. “Special Needs Shelter” and disability-related wording are source designations only, never inferred accessibility. No activation, usable-capacity, condition, service, transport, or accessibility claim is approved.',
  })
}

const hurricaneMelissaShelterActivationEvidence = {
  'acklins-crooked-island': 'The 2025-10-27 Office of the Prime Minister statement explicitly ordered evacuation for Acklins, Crooked Island, and Long Cay and said air and maritime assets were in place and shelters across the affected islands had been inspected, staffed, and made operational.',
  inagua: 'The 2025-10-27 Office of the Prime Minister statement explicitly ordered evacuation for Inagua and said air and maritime assets were in place and shelters across the affected islands had been inspected, staffed, and made operational.',
  mayaguana: 'The 2025-10-27 Office of the Prime Minister statement explicitly ordered evacuation for Mayaguana and said air and maritime assets were in place and shelters across the affected islands had been inspected, staffed, and made operational.',
  'ragged-island': 'The 2025-10-27 Office of the Prime Minister statement explicitly ordered evacuation for Ragged Island and said air and maritime assets were in place and shelters across the affected islands had been inspected, staffed, and made operational.',
}

const shelterGovernanceConfigurations = Object.fromEntries(rows.map((row) => [row.slug, {
  boundary: emergencyIslandBoundaries[row.slug],
  eventEvidence: hurricaneMelissaShelterActivationEvidence[row.slug] || 'The reviewed October 2025 Hurricane Melissa activation statement does not identify this island group, so it is not used as island-specific operational evidence here.',
  hasEventEvidence: Boolean(hurricaneMelissaShelterActivationEvidence[row.slug]),
}]))

for (const [slug, configuration] of Object.entries(shelterGovernanceConfigurations)) {
  const islandName = rows.find((candidate) => candidate.slug === slug).name
  addDeepResearchFact({
    slug,
    key: 'shelter-inspection-governance-and-activation-standard',
    title: `${islandName}: shelter inspection, governance, and activation standard`,
    topic: 'safety',
    claim: `The 2025 National Humanitarian Assistance Standards assign overall facility appropriateness to the DRM Authority, structural strength, maintenance, and integrity to the Ministry of Public Works, sanitation and toilets/showers/sewage to Environmental Health Services, and shelter coordination, staffing, disability access, equipment, services, and resident safety to the Department of Social Services Disaster Management Unit. They require yearly needs and capacity review; February–April list updating and shelter inspection; documented and widely distributed suitability assessments; mass-evacuation plans for every Family Island or island group; defined maximum capacity and catchment; trained management teams; emergency equipment, water, sanitation, power, food, medical supplies, sleeping space, communications, and compromised-shelter evacuation; and inclusive planning for people without transport, people with disabilities, chronic illness, caregivers, interpreters, and service animals. The DRM programme page names a new shelter inspection standard and grading system plus development of a national mass-evacuation plan, but publishes no reviewed facility grades or implementation results. ${configuration.eventEvidence}`,
    travelerGuidance: `${configuration.boundary} Obtain the current official suitability assessment, grade, inspection date and findings, repair closure, activation decision, route, assembly point, transport asset, receiving shelter, usable capacity, staffing, services, accessibility features, and fallback for the exact facility and traveler. A national standard, programme statement, or dated storm activation does not prove current compliance or readiness.`,
    sourceIds: [
      'research-source-drm-national-humanitarian-assistance-standards-2025',
      'research-source-drm-shelter-inspection-grading-programme',
      'research-source-drm-national-disaster-coordination-protocols',
      ...(configuration.hasEventEvidence ? ['research-source-opm-hurricane-melissa-evacuation-shelter-activation-2025'] : []),
    ],
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    editorNotes: 'This layer distinguishes mandatory national standards, named responsible agencies, programme claims, and dated event evidence from completed inspection or facility compliance. No exact facility is marked inspected, graded, accessible, staffed, supplied, operational, or transport-ready from these sources. Historical activation is never presented as current state.',
  })
}

const localAuthorityConfigurations = {
  abacos: {
    coordination: 'North Abaco, Central Abaco, and South Abaco Incident Coordination Centres in Region 1',
    administration: 'The administration directory lists North Abaco at Cooper’s Town, Grand Cay through Cooper’s Town, Central Abaco and Hope Town through Marsh Harbour, and South Abaco and Moore’s Island through Sandy Point.',
    boundary: 'The directory does not establish separate ICC activation, public emergency routing, or current coverage for every Abaco cay.',
  },
  'acklins-crooked-island': {
    coordination: 'separate Acklins and Crooked Island & Long Cay Incident Coordination Centres in Region 4',
    administration: 'The administration directory prints Acklins Family Island Administration at Colonel Hill with (242) 344-3538 and Crooked Island & Long Cay at Colonel Hill with (242) 344-2197.',
    boundary: 'Colonel Hill is on Crooked Island, so the printed Acklins location is preserved as a source anomaly and must not be normalized or treated as a local Acklins emergency office without authority confirmation.',
  },
  andros: {
    coordination: 'North Andros, Central Andros, South Andros, and Mangrove Cay Incident Coordination Centres in Region 2B',
    administration: 'The administration directory lists Nicholl’s Town, Fresh Creek, Kemp’s Bay, and Mangrove Cay office leads for those four areas.',
    boundary: 'An Andros district office or ICC is not evidence of response coverage or transport from another district or cay.',
  },
  'berry-islands': {
    coordination: 'the Berry Island Incident Coordination Centre in Region 2B',
    administration: 'The administration directory routes The Berry Islands Family Island Administration through Nicholl’s Town at (242) 329-2278, the same lead printed for North Andros.',
    boundary: 'This is an explicit off-island/shared directory route, not proof of an on-island emergency office, current call routing, or access from every cay.',
  },
  bimini: {
    coordination: 'the Bimini and Cat Cay Incident Coordination Centre in Region 1',
    administration: 'The administration directory lists Bimini & Cat Cay Family Island Administration in Alice Town at (242) 347-3222.',
    boundary: 'The office lead does not establish ICC activation, after-hours response, or transfer from South Bimini or another cay.',
  },
  'cat-island': {
    coordination: 'the Cat Island Incident Coordination Centre in Region 3',
    administration: 'The administration directory lists Cat Island Family Island Administration at The Bight, (242) 342-3031.',
    boundary: 'The office lead does not establish current emergency routing, response time, shelter activation, or transport from every settlement.',
  },
  'eleuthera-harbour-island': {
    coordination: 'North Eleuthera, Central Eleuthera, and South Eleuthera Incident Coordination Centres in Region 2B',
    administration: 'The administration directory separately lists Harbour Island, North Eleuthera, Spanish Wells, Central Eleuthera, and South Eleuthera office leads.',
    boundary: 'The coordination figure does not separately name Harbour Island or Spanish Wells ICCs; do not infer their activation chain, bridge or water-taxi response, or facility access.',
  },
  'the-exumas': {
    coordination: 'the Exuma and Cays (Ragged Island) Incident Coordination Centre in Region 3',
    administration: 'The administration directory lists Exuma at George Town, (242) 336-2166/7, and Exuma Cays–Black Point through George Town at (242) 355-3020.',
    boundary: 'Great Exuma or George Town routing does not establish contact, response, shelter, or transport from every cay.',
  },
  'grand-bahama': {
    coordination: 'East Grand Bahama, West Grand Bahama, and City of Freeport Incident Coordination Centres in Region 1',
    administration: 'The directory lists a Freeport Registrar General office plus East Grand Bahama at High Rock and West Grand Bahama at Eight Mile Rock.',
    boundary: 'The Freeport RGD number is not labeled as a Family Island emergency office, and none of these entries proves ICC activation, emergency dispatch, hospital routing, or cay access.',
  },
  inagua: {
    coordination: 'the Inagua Incident Coordination Centre in Region 4',
    administration: 'The administration directory lists Inagua Family Island Administration in Matthew Town at (242) 339-1271.',
    boundary: 'The office lead is not a 24-hour emergency promise and does not establish Little Inagua coverage, airport status, evacuation, or after-hours response.',
  },
  'long-island': {
    coordination: 'the Long Island Incident Coordination Centre in Region 3',
    administration: 'The administration directory lists Clarence Town at (242) 337-3030 and Simms at (242) 338-8517.',
    boundary: 'Two administration leads do not establish island-wide response time, ambulance coverage, receiving facility, or transport between distant settlements.',
  },
  mayaguana: {
    coordination: 'the Mayaguana Incident Coordination Centre in Region 4',
    administration: 'The administration directory lists Mayaguana Family Island Administration in Abraham’s Bay at (242) 339-3100.',
    boundary: 'The office lead is not a 24-hour emergency line and does not establish ICC activation, airport status, evacuation, or settlement-level communications.',
  },
  'nassau-paradise-island': {
    coordination: 'New Providence incident coordination integrated into the DRM Authority as Region 2A',
    administration: 'The reviewed Family Island administration directory does not apply to New Providence; use the national DRM and 911/919 routing already recorded in the emergency baseline.',
    boundary: 'Integrated coordination does not establish a traveler’s nearest response unit, hospital, ambulance, accessible shelter, bridge route, or Paradise Island-specific contact.',
    noAdministrationSource: true,
  },
  'ragged-island': {
    coordination: 'the Exuma and Cays (Ragged Island) Incident Coordination Centre in Region 3',
    administration: 'The administration directory routes Ragged Island Family Island Administration through George Town and prints (242) 344-1699.',
    boundary: 'This is an explicit off-island/shared coordination route, not proof of an on-island emergency office, current call routing, shelter, air or marine response, or evacuation asset.',
  },
  'rum-cay': {
    coordination: 'the San Salvador and Rum Cay Incident Coordination Centre in Region 3',
    administration: 'The administration directory routes Rum Cay Family Island Administration through Cockburn Town, San Salvador at (242) 331-2202.',
    boundary: 'This is an explicit off-island/shared route, not proof of an on-island emergency office, current call routing, shelter, marine or air response, or evacuation asset.',
  },
  'san-salvador': {
    coordination: 'the San Salvador and Rum Cay Incident Coordination Centre in Region 3',
    administration: 'The administration directory lists San Salvador Family Island Administration in Cockburn Town at (242) 331-2202.',
    boundary: 'The shared ICC and office lead do not establish current activation, response time, shelter status, airport status, or separate Rum Cay capability.',
  },
}

for (const [slug, configuration] of Object.entries(localAuthorityConfigurations)) {
  addDeepResearchFact({
    slug,
    key: 'local-administration-and-incident-coordination-baseline',
    title: `${rows.find((candidate) => candidate.slug === slug).name}: local administration and incident-coordination baseline`,
    topic: 'safety',
    claim: `The Bahamas National Disaster Coordination Protocols place this destination under ${configuration.coordination}. ${configuration.administration}`,
    travelerGuidance: `Use this only to identify the accountable coordination and administration structure before travel. For an immediate emergency use 911/919 and current DRM instructions. Reconfirm the relevant office, ICC activation, public contact, communications, response, shelter, transport, receiving facility, and accessibility through current authorities. ${configuration.boundary}`,
    sourceIds: [
      'research-source-drm-national-disaster-coordination-protocols',
      ...(configuration.noAdministrationSource ? ['research-source-drm-emergency-numbers'] : ['research-source-rgd-family-island-administration-offices']),
    ],
    nextReviewAt: '2026-09-03',
    volatility: 'operational',
    confidence: 'medium',
    editorNotes: 'This closes only the structural routing question. The administration source is a Registrar General service directory, not an emergency contact list, and the coordination protocol is not a live activation feed. Never present an administration office number as guaranteed emergency dispatch.',
  })
}

addDeepResearchFact({
  slug: 'berry-islands',
  key: 'soul-fly-former-carriearl-identity',
  title: 'Berry Islands: Soul Fly is the current Carriearl successor identity',
  topic: 'stays',
  claim: 'Soul Fly Lodge’s direct website contains dated 2026 activity and its operator-published launch history explicitly describes Soul Fly Lodge on Great Harbour Cay as the next chapter of the former Carriearl Boutique Hotel.',
  travelerGuidance: 'Use Soul Fly Lodge as the current identity lead and retain Carriearl only as a former-name alias. Recheck current operation, availability, rates, transport, coordinates, and media rights before a public recommendation.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-operator-soul-fly'],
  confidence: 'high',
  editorNotes: 'This resolves the naming relationship but does not approve either current canonical row. Merge or retire duplicates only after exact record adjudication.',
})

addDeepResearchFact({
  slug: 'berry-islands',
  key: 'soul-fly-location-reconciliation',
  title: 'Berry Islands: Soul Fly location matches the Carriearl candidate',
  topic: 'stays',
  claim: 'Soul Fly Lodge’s direct operator structured data identifies the property at Soul Fly Lodge, Great Harbour Cay Drive, Great Harbour Cay, Berry Islands, with coordinates 25.756469, -77.851485. The existing Supabase Carriearl candidate is at 25.756414, -77.851680, approximately 21 metres away.',
  travelerGuidance: 'This supports a controlled identity and coordinate merge candidate. It does not prove current availability, physical accessibility, complete publication quality, or launch readiness.',
  sourceIds: ['research-source-operator-soul-fly'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'The coordinate comparison resolves the exact-location research gap for this candidate only. Preserve the operator coordinate as evidence and require data review before changing the Supabase record.',
})

addDeepResearchFact({
  slug: 'acklins-crooked-island',
  key: 'ivels-location-reconciliation',
  title: 'Acklins: IVel’s operator-linked booking profile supplies exact location',
  topic: 'stays',
  claim: 'The direct IVel’s website links to a current Cloudbeds profile whose structured data identifies 17 Queens Highway, Masons Bay, Acklins, with coordinates 22.54327393, -73.87608337.',
  travelerGuidance: 'The address and coordinates can support a controlled correction of the zero-coordinate Supabase candidate after data review. They do not establish current room availability, physical accessibility, or publication readiness.',
  sourceIds: ['research-source-operator-ivels', 'research-source-operator-ivels-cloudbeds'],
  nextReviewAt: annualReviewAt,
  volatility: 'stable',
  confidence: 'high',
  editorNotes: 'The operator-linked booking provider closes the exact-location evidence gap for IVel’s. Runtime prices, room inventory, and availability were deliberately excluded.',
})

addDeepResearchFact({
  slug: 'acklins-crooked-island',
  key: 'direct-operator-identity-corroboration',
  title: 'Acklins & Crooked Island: four accommodation identities have direct operator sites',
  topic: 'stays',
  claim: 'Four accommodation names from the official 2025 directory are independently represented by direct operator websites that identify the same island group: Top Choice Bonefish Lodge, IVel’s Bed and Breakfast, Grey’s Point Bonefish Inn, and Crooked Island Lodge & Marina.',
  travelerGuidance: 'The direct sites strengthen identity evidence but do not prove room availability, transport, prices, location accuracy, or publication quality. Reconcile each property separately before recommending it.',
  sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-operator-top-choice', 'research-source-operator-ivels', 'research-source-operator-greys-point', 'research-source-operator-crooked-island-lodge'],
  confidence: 'high',
  editorNotes: 'This is an identity-reconciliation batch, not permission to bulk-activate official-directory records. Other directory candidates remain unresolved.',
})

addDeepResearchFact({
  slug: 'ragged-island',
  key: 'lost-key-current-identity',
  title: 'Ragged Island: Lost Key Lodge is a current specialized stay lead',
  topic: 'stays',
  claim: 'A direct operator website and a current fishing-travel marketplace both identify Lost Key Lodge as a specialized fishing lodge in Duncan Town on Ragged Island.',
  travelerGuidance: 'This is a specialized operator lead and an exception to a simple “no on-island stay” interpretation; it is not evidence of broad hotel supply or live availability. Confirm operation, exact location, capacity, charter logistics, and suitability directly.',
  sourceIds: ['research-source-operator-lost-key', 'research-source-corrob-meridia-lost-key', 'research-source-bmot-ragged-island'],
  confidence: 'high',
  editorNotes: 'Lost Key is absent from the official 2025 hotel-directory section used in the baseline and is not a launch-ready canonical place. Adjudicate it as a new specialized property candidate.',
})

addDeepResearchFact({
  slug: 'rum-cay',
  key: 'sumner-point-contradictory-operation-evidence',
  title: 'Rum Cay: Sumner Point online claims conflict with 2026 condition reporting',
  topic: 'stays',
  claim: 'The Sumner Point Marina website remains online and describes cottages, a restaurant, and marina services, while a May 21, 2026 Tribune report says the cottages, restaurant, utilities, dock, and road infrastructure had been destroyed and describes an active property dispute.',
  travelerGuidance: 'Do not present Sumner Point Marina, its cottages, restaurant, fuel, dockage, or other services as operating. Keep the national tourism authority’s Long Island base-stay guidance until responsible parties and current physical operation are directly verified.',
  sourceIds: ['research-source-operator-sumner-point-marina-site', 'research-source-independent-tribune-rum-cay-sumner-point-2026', 'research-source-bmot-rum-cay'],
  nextReviewAt: '2026-09-03',
  confidence: 'high',
  editorNotes: 'This is a contradiction/blocking record, not a legal conclusion. Quarantine any Sumner Point stay or marina candidate from delivery until the conflict is resolved.',
})

for (const item of [
  {slug: 'inagua', destination: 'Matthew’s Town'},
  {slug: 'mayaguana', destination: 'Abraham’s Bay'},
  {slug: 'ragged-island', destination: 'Duncan Town'},
  {slug: 'rum-cay', destination: 'Port Nelson'},
]) {
  addDeepResearchFact({
    slug: item.slug,
    key: 'blessings-charter-destination-lead',
    title: `${rows.find((candidate) => candidate.slug === item.slug).name}: current charter-operator lead`,
    topic: 'access',
    claim: `Blessings Aviation’s direct destination directory lists ${item.destination} among the places it serves by private charter. The company’s website self-identifies the operator as licensed by the Bahamas Civil Aviation Authority.`,
    travelerGuidance: 'This establishes one charter-operator lead, not a scheduled route, confirmed availability, price, aircraft assignment, regulatory verification, or weather clearance. Confirm every trip directly with the operator and responsible aviation authorities.',
    sourceIds: ['research-source-operator-blessings-aviation'],
    nextReviewAt: '2026-09-03',
    confidence: 'medium',
    editorNotes: 'The licensing statement is operator-supplied and has not yet been matched to a regulator certificate record. Keep all operational details out of evergreen copy.',
  })
}

const auditDocs = rows.map((row) => ({
  _id: `drafts.island-research-audit-${checkedAt}-${row.slug}`,
  _type: 'islandResearchAudit',
  title: `${row.name} research baseline — ${checkedAt}`,
  destination: {_type: 'reference', _ref: row.destinationId},
  auditedAt: checkedAt,
  nextAuditAt: operationalReviewAt,
  owner: 'Baha Buddy Content Operations',
  status: 'baseline',
  overallScore: row.evidenceScore,
  coverage: row.coverage,
  gaps: row.gaps,
  sources: [{_type: 'reference', _key: `source-${row.slug}`, _ref: `research-source-bmot-${row.slug}`}],
  methodologyNotes: `Automated baseline from the ${checkedAt} Supabase/Sanity content migration snapshot. Place counts are candidates, not verified recommendations. All islands remain Needs revision because the canonical place catalog reports zero verified and zero launch-ready records. Scores: 0 missing; 1 weak or uncited; 2 sourced but incomplete or stale; 3 strong, current, and corroborated.`,
}))

const deepAuditConfigurations = {
  'ragged-island': {
    scores: {overview: 2, access: 2, stays: 2, food: 0, experiences: 1, nature: 1, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      access: 'The tourism profile, Department of Aviation directory, and 2026 regulator register establish the airport and facility constraints; current flight or charter operation is not yet carrier-confirmed.',
      stays: 'The national tourism profile documents a Long Island base-stay pattern, and the 2025 hotel directory shows no Ragged Island section; operator corroboration is still required.',
      food: 'No source-verified local food option has been established.',
      safety: 'The regulator register supplies limited aerodrome safety context, but no broader island-specific emergency or visitor guidance is approved.',
    },
    sourceIds: ['research-source-bmot-ragged-island', 'research-source-doa-airports', 'research-source-caab-government-aerodromes-2026', 'research-source-bmot-hotel-directory-2025'],
    researchGap: ['stays', 'Validate the Long Island base-stay pattern with current charter and boat operators; record explicit N/A locally if confirmed.'],
  },
  mayaguana: {
    scores: {overview: 2, access: 2, stays: 2, food: 0, experiences: 1, nature: 1, culture: 1, seasonality: 0, safety: 0, accessibility: 0},
    findings: {
      access: 'The tourism flying guide and Department of Aviation identify MYG and a current air-service baseline; schedules and availability still require carrier checks.',
      stays: 'The 2025 hotel directory and official property page corroborate Baycaner as the accommodation baseline, but current operation and canonical data remain unverified.',
      food: 'No source-verified food option has been established.',
    },
    sourceIds: ['research-source-bmot-mayaguana', 'research-source-bmot-flying', 'research-source-doa-airports', 'research-source-bmot-hotel-directory-2025', 'research-source-bmot-baycaner'],
    researchGap: ['stays', 'Reconcile Baycaner as the official accommodation lead, then verify coordinates, operation, description, and rights-cleared media before activation.'],
  },
  'acklins-crooked-island': {
    scores: {overview: 2, access: 2, stays: 2, food: 0, experiences: 1, nature: 1, culture: 1, seasonality: 0, safety: 0, accessibility: 0},
    findings: {
      access: 'The tourism profile establishes the island gateways and inter-island pattern, but carrier and ferry operation remain uncorroborated.',
      stays: 'The 2025 official directory provides a substantial named accommodation candidate list, with Trophy Lodge independently corroborated by an official property page.',
      food: 'No source-verified food option has been established.',
    },
    sourceIds: ['research-source-bmot-acklins-crooked-island', 'research-source-bmot-hotel-directory-2025', 'research-source-bmot-acklins-trophy-lodge'],
    researchGap: ['stays', 'Create a property-by-property adjudication queue for the official directory candidates; do not infer current operation or bulk-activate listings.'],
  },
  'rum-cay': {
    scores: {overview: 2, access: 2, stays: 2, food: 2, experiences: 1, nature: 1, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      access: 'Government airport sources establish RCY/New Port Nelson and facility constraints; no scheduled or charter operation is yet corroborated.',
      stays: 'The national tourism profile documents a Long Island base-stay pattern; the current hotel candidates conflict with that pattern and require adjudication.',
      food: 'An official tourism listing corroborates Ocean View Restaurant & Bar as an identity lead; operation and location remain unverified.',
      safety: 'The regulator register supplies limited aerodrome safety context, but no broader island-specific emergency or visitor guidance is approved.',
    },
    sourceIds: ['research-source-bmot-rum-cay', 'research-source-doa-airports', 'research-source-caab-government-aerodromes-2026', 'research-source-bmot-hotel-directory-2025', 'research-source-bmot-ocean-view-restaurant'],
    researchGap: ['places', 'Quarantine the location failures, reconcile Ocean View as an inactive overlay, and adjudicate every stay record against the documented base-island pattern.'],
  },
  'berry-islands': {
    scores: {overview: 2, access: 2, stays: 2, food: 2, experiences: 1, nature: 1, culture: 1, seasonality: 0, safety: 0, accessibility: 0},
    findings: {
      access: 'The tourism profile identifies Great Harbour Cay and Chub Cay as gateways; current flight, charter, marina, and transfer operation needs operator confirmation.',
      stays: 'The official 2025 directory provides a named accommodation baseline and explicitly records Soul Fly Lodge as formerly Carriearl.',
      food: "The national tourism listing corroborates Flo's Conch Bar as an identity lead; operating details and location remain unverified.",
    },
    sourceIds: ['research-source-bmot-berry-islands', 'research-source-bmot-hotel-directory-2025', 'research-source-bmot-chub-cay-club', 'research-source-bmot-flos-conch-bar'],
    researchGap: ['places', 'Resolve the Carriearl-to-Soul Fly identity change, quarantine out-of-bounds rows, and reconcile the official property and restaurant leads.'],
  },
  inagua: {
    scores: {overview: 2, access: 2, stays: 2, food: 2, experiences: 1, nature: 2, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      access: 'The tourism profile and flying guide establish the current air and boat research baseline, but all schedules and service operation require carrier or port checks.',
      stays: 'The 2025 hotel directory names three Inagua properties and official pages corroborate two identities; spelling and current operation still need reconciliation.',
      food: 'The national tourism listing corroborates Lighthouse Restaurant Bar and Grill as an identity lead; operating details and location remain unverified.',
      nature: 'Bahamas National Trust sources provide primary protected-area evidence, including strong Little Inagua access and conservation constraints.',
      safety: 'The Little Inagua source establishes serious provisioning and access limitations, but broader island emergency guidance is not approved.',
    },
    sourceIds: ['research-source-bmot-inagua', 'research-source-bmot-flying', 'research-source-bmot-hotel-directory-2025', 'research-source-bmot-enricas-inn', 'research-source-bmot-mally-suites', 'research-source-bmot-lighthouse-restaurant-inagua', 'research-source-bnt-little-inagua'],
    researchGap: ['places', 'Quarantine the 12 active location failures and reconcile the official stay and food candidates before building visitor-facing inventory.'],
  },
  'long-island': {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 1, nature: 2, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      stays: 'The 2025 official directory establishes a ten-property, 182-room snapshot, but the canonical catalog contains only three stay candidates and one active Nassau hotel misassignment.',
      nature: 'The Bahamas National Trust supplies strong Conception Island protected-area and access evidence, including boat-only wilderness constraints.',
      safety: 'Conception Island evidence supplies specific marine and infrastructure cautions, but complete island-wide emergency guidance is not approved.',
      food: 'Six food candidates exist, but none has a sourced description, verification, or media gate.',
    },
    sourceIds: ['research-source-bmot-long-island', 'research-source-bmot-hotel-directory-2025-mid-islands', 'research-source-bnt-conception-island'],
    researchGap: ['stays', 'Reconcile the ten official directory candidates, remove the Nassau hotel assignment, and verify exact identities and operating status before activation.'],
  },
  'cat-island': {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 2, nature: 1, culture: 2, seasonality: 0, safety: 0, accessibility: 1},
    findings: {
      stays: 'The 2025 official directory establishes a thirteen-property, 143-room snapshot; the current catalog has only six stay candidates and includes a San Salvador hotel misassignment.',
      experiences: 'The official Hermitage page strongly establishes the primary attraction identity and approach, while other experiences remain weak or uncited.',
      culture: 'Mount Alvernia and The Hermitage have a narrow, source-verified historical baseline; broader cultural coverage remains incomplete.',
      accessibility: 'The official page establishes a steep rocky staircase approach, which is a meaningful limitation, but no full accessibility audit exists.',
      food: 'Eight food candidates exist, but none has a sourced description, verification, or media gate.',
    },
    sourceIds: ['research-source-bmot-cat-island', 'research-source-bmot-hotel-directory-2025-mid-islands', 'research-source-bmot-hermitage-mount-alvernia'],
    researchGap: ['places', 'Quarantine the seven location failures, remove the San Salvador hotel assignment, and reconcile official accommodations and Hermitage access details.'],
  },
  'san-salvador': {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 1, nature: 2, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      stays: 'The 2025 official directory establishes four Bahamas properties totaling 294 rooms; most current assigned active hotels instead resolve to San Salvador, El Salvador.',
      nature: 'Bahamas National Trust sources establish the island protected-area network and a specific wilderness baseline for Southern Great Lake National Park.',
      safety: 'The Southern Great Lake source establishes limited infrastructure and no on-site guard, but broader island emergency guidance is not approved.',
      food: 'Ten food candidates exist, but the active set is heavily contaminated by El Salvador and other foreign records.',
    },
    sourceIds: ['research-source-bmot-san-salvador', 'research-source-bmot-hotel-directory-2025-mid-islands', 'research-source-bnt-san-salvador', 'research-source-bnt-southern-great-lake'],
    researchGap: ['places', 'Quarantine the 23 location failures, distinguish San Salvador island from San Salvador city, and reconcile the four official Bahamas accommodation candidates.'],
  },
  andros: {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 1, nature: 2, culture: 1, seasonality: 0, safety: 2, accessibility: 0},
    findings: {
      stays: 'The 2025 official directory summarizes 46 properties and 445 rooms, far beyond the ten current stay candidates; operation and district identity remain unverified.',
      nature: 'Multiple park-specific Bahamas National Trust sources provide strong protected-area, access, infrastructure, and no-take evidence.',
      safety: 'The park authority currently marks Blue Holes National Park temporarily closed and supplies a specific freshwater-buoyancy warning; complete island-wide safety guidance remains incomplete.',
      food: 'Ten food candidates exist, but several active records are unrelated restaurants in Florida, Greece, and Colombia.',
    },
    sourceIds: ['research-source-bmot-andros', 'research-source-bmot-hotel-directory-2025-mid-islands', 'research-source-bnt-andros', 'research-source-bnt-blue-holes-andros', 'research-source-bnt-west-side-andros', 'research-source-bnt-north-south-marine-parks-andros'],
    researchGap: ['places', 'Quarantine the eight location failures, reconcile the official accommodation scale by district, and keep the Blue Holes closure out of traveler recommendations until BNT reopens it.'],
  },
  abacos: {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 1, nature: 2, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      stays: 'The 2025 official directory summarizes 40 properties and 1,465 rooms; current canonical inventory contains only ten stay candidates and no verified or launch-ready records.',
      nature: 'Bahamas National Trust sources strongly establish two boat-only protected areas with moorings and limited infrastructure.',
      safety: 'The park sources establish no on-site guard and remote marine access constraints, but complete island and cay-specific emergency guidance is not approved.',
      food: 'Ten food candidates exist, but none has sourced copy, managed media, or verification.',
    },
    sourceIds: ['research-source-bmot-abacos', 'research-source-bmot-hotel-directory-2025-major-islands', 'research-source-bnt-fowl-cays', 'research-source-bnt-pelican-cays'],
    researchGap: ['places', 'Quarantine the six location failures, reconcile official accommodation candidates by cay, and verify the boat-only park access facts before itinerary delivery.'],
  },
  bimini: {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 2, nature: 1, culture: 1, seasonality: 0, safety: 0, accessibility: 0},
    findings: {
      stays: 'The 2025 official directory summarizes six properties and 427 rooms; the ten canonical stay candidates require identity, coordinate, and operating-status reconciliation.',
      experiences: 'The national tourism experience page corroborates Dolphin House and Shark Lab as identity anchors, but operator, wildlife, and water-safety evidence is incomplete.',
      food: 'Eleven food candidates exist, including active Nassau and South Carolina misassignments, and none passes the content and verification gate.',
    },
    sourceIds: ['research-source-bmot-bimini', 'research-source-bmot-bimini-what-to-do', 'research-source-bmot-hotel-directory-2025-major-islands'],
    researchGap: ['places', 'Quarantine the eight location failures, resolve plausible local records with missing coordinates, and verify experience operators before traveler delivery.'],
  },
  'eleuthera-harbour-island': {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 2, nature: 2, culture: 1, seasonality: 0, safety: 0, accessibility: 1},
    findings: {
      stays: 'The 2025 directory establishes separate Eleuthera-mainland and Harbour Island/Spanish Wells inventory totaling 43 properties and 656 rooms.',
      nature: 'The Leon Levy Preserve has strong park-authority evidence for identity, conservation purpose, trails, boardwalk, visitor centre, and warden.',
      experiences: 'Official profiles and park evidence establish strong discovery anchors, but current access and operator evidence remains incomplete.',
      accessibility: 'The preserve identifies visitor facilities and trails, but no complete mobility or sensory accessibility audit exists.',
      food: 'Eleven food candidates exist, but none passes sourced-copy, media, and verification gates.',
    },
    sourceIds: ['research-source-bmot-eleuthera-harbour-island', 'research-source-bmot-hotel-directory-2025-major-islands', 'research-source-bnt-leon-levy-preserve'],
    researchGap: ['places', 'Correct the one active zero-coordinate excursion and reconcile stays separately for mainland Eleuthera, Harbour Island, and Spanish Wells.'],
  },
  'the-exumas': {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 2, nature: 2, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      stays: 'The 2025 official directory summarizes 27 properties and 494 rooms across Exuma mainland and the cays; canonical inventory remains unverified.',
      nature: 'The Bahamas National Trust park page and rules strongly establish protected-area identity, no-take restrictions, facilities, and operational context.',
      safety: 'The park sources provide meaningful conservation and remote-office/VHF context, but complete island-group emergency and water-safety guidance is not approved.',
      food: 'Ten food candidates exist, but none passes sourced-copy, media, and verification gates.',
    },
    sourceIds: ['research-source-bmot-the-exumas', 'research-source-bmot-hotel-directory-2025-major-islands', 'research-source-bnt-exuma-cays-land-sea-park', 'research-source-bnt-exuma-park-quick-guide'],
    researchGap: ['places', 'Even though all active candidates fall inside the broad island-group bounds, verify exact cay identity, rights-cleared media, operation, and protected-area compatibility before activation.'],
  },
  'grand-bahama': {
    scores: {overview: 2, access: 1, stays: 2, food: 1, experiences: 2, nature: 2, culture: 1, seasonality: 0, safety: 1, accessibility: 1},
    findings: {
      stays: 'The 2025 official directory summarizes 17 properties and 1,520 rooms; current operation and recovery status require direct checks.',
      nature: 'The Lucayan National Park source provides strong identity, habitat, culture, visitor-facility, and access evidence.',
      experiences: 'The official island profile and Lucayan park source establish high-confidence anchors, but current operator and facility checks remain incomplete.',
      safety: 'Lucayan park evidence distinguishes public visitor facilities from restricted cave-diving history, but broader emergency guidance is missing.',
      accessibility: 'Boardwalks, trails, restrooms, and a visitor centre are source-verified, but no complete accessibility audit exists.',
    },
    sourceIds: ['research-source-bmot-grand-bahama', 'research-source-bmot-hotel-directory-2025-major-islands', 'research-source-bnt-lucayan-national-park'],
    researchGap: ['places', 'Correct the one active zero-coordinate excursion, verify property recovery and operation, and complete facility-level accessibility checks.'],
  },
  'nassau-paradise-island': {
    scores: {overview: 2, access: 2, stays: 2, food: 1, experiences: 2, nature: 2, culture: 2, seasonality: 0, safety: 1, accessibility: 1},
    findings: {
      access: 'The national tourism profile strongly establishes NAS and the island-pair access pattern; live routes, transfers, and cruise operations remain runtime facts.',
      stays: 'The 2025 directory reports 52 properties and 10,274 rooms across New Providence and Paradise Island; canonical inventory remains far smaller and unverified.',
      nature: 'The Bahamas National Trust establishes a four-site national-park network and a current closure at Harrold & Wilson Ponds.',
      culture: 'The Queen’s Staircase has strong official historical evidence including its forced-labour context, date, purpose, and visible-step count.',
      safety: 'The current Harrold & Wilson closure is strong operational evidence, but broader destination safety guidance remains incomplete.',
      accessibility: 'Site form and park facilities provide partial evidence, but no complete attraction or destination accessibility audit exists.',
    },
    sourceIds: ['research-source-bmot-nassau-paradise-island', 'research-source-bmot-hotel-directory-2025-major-islands', 'research-source-bnt-new-providence', 'research-source-bnt-harrold-wilson-ponds', 'research-source-bmot-queens-staircase'],
    researchGap: ['places', 'All active candidates fall inside the broad bounds, but reconcile the large official inventory gap and verify identity, content, media, and operation before launch.'],
  },
}

const defaultDeepFindings = {
  overview: 'The official island profile establishes a primary-source identity baseline; independent/local editorial corroboration remains incomplete.',
  access: 'Official access evidence exists but operational confirmation remains incomplete.',
  stays: 'Official accommodation evidence exists but canonical and operating-status verification remain incomplete.',
  food: 'Food evidence is missing or incomplete.',
  experiences: 'Official highlights support discovery, but exact identities, access, and suitability remain unverified.',
  nature: 'Nature evidence is a useful official baseline, but access rules and traveler suitability remain incomplete.',
  culture: 'The official profile provides a cultural/history starting point without sufficient local corroboration.',
  seasonality: 'No dated island-specific seasonality fact has been approved.',
  safety: 'No complete island-specific safety and emergency guidance has been approved.',
  accessibility: 'No island-specific accessibility and mobility evidence has been approved.',
}

const deepAuditDocs = Object.entries(deepAuditConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const coverage = Object.entries(configuration.scores).map(([topic, value]) => score(topic, value, configuration.findings?.[topic] || defaultDeepFindings[topic], 0))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  const deepGaps = [
    gap(slug, 'places', 'p0', 'No verified, launch-ready canonical places', 'Pass each approved candidate through identity, coordinate, sourced-description, rights-cleared-media, and verification gates.'),
    gap(slug, configuration.researchGap[0], 'p0', 'Official evidence not reconciled to canonical inventory', configuration.researchGap[1], 'researching'),
    gap(slug, 'access', 'p1', 'Operational access needs operator confirmation', 'Recheck carrier, charter, ferry, mail-boat, marina, or port claims through the responsible operator before traveler delivery.'),
    gap(slug, 'safety', 'p1', 'Complete safety guidance missing', 'Add government or responsible-authority emergency, medical, weather-disruption, and provisioning guidance.'),
    gap(slug, 'accessibility', 'p1', 'Accessibility evidence missing', 'Research airport, boat, lodging, attraction, beach, and mobility constraints without inferring accessibility.'),
  ]
  if (row.activeLocationIssues > 0) {
    deepGaps.unshift(gap(slug, 'places', 'p0', `${row.activeLocationIssues} active place location failures`, `Quarantine or correct all active records outside the island review bounds. Current in-bounds active inventory is ${row.inBoundsActivePlaceCandidates}/${row.activePlaceCandidates}.`, 'researching'))
  }
  return {
    _id: `drafts.island-research-audit-${checkedAt}-quality-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} quality deep dive — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: deepGaps,
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Deep verification batch for the six weakest island groups. Current public/editorial place rows were checked against the Admin island bounds, then official tourism, government aviation, conservation, and property-directory sources were reconciled as dated evidence. No Supabase rows were mutated. Source-verified facts remain drafts with no delivery channels; zero canonical places currently pass the complete launch gate. Scores: 0 missing; 1 weak or uncited; 2 sourced but incomplete or stale; 3 strong, current, and corroborated.`,
  }
})

const operatorAuditConfigurations = {
  mayaguana: {
    scores: {overview: 2, access: 2, stays: 2, food: 0, experiences: 1, nature: 1, culture: 1, seasonality: 0, safety: 0, accessibility: 0},
    findings: {
      access: 'A current charter operator lists Abraham’s Bay, but flight feasibility, availability, schedule, price, and regulatory status still require direct confirmation.',
      stays: 'Baycaner is supported by the official 2025 directory, a direct property site, and a dated April 2026 hosted-trip page. The property site has a self-signed TLS certificate, so current operation is not yet approved.',
      food: 'The Baycaner site describes dining but cannot safely establish a current traveler-facing food option while its security and operation remain unresolved.',
    },
    sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-operator-baycaner', 'research-source-corrob-gofishingworldwide-mayaguana-2026', 'research-source-operator-blessings-aviation'],
    operatorGap: gap('mayaguana', 'stays', 'p0', 'Baycaner operation and secure traveler link unresolved', 'Confirm operation through a safe direct channel, repair or replace the broken-TLS link, and reconcile the exact canonical location, sourced copy, and rights-cleared media.', 'researching'),
  },
  inagua: {
    scores: {overview: 2, access: 2, stays: 2, food: 2, experiences: 1, nature: 2, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      access: 'A current charter operator lists Matthew’s Town, but this is not evidence of scheduled service, availability, regulatory verification, or a guaranteed route.',
      stays: 'The official directory lists Brensville Suite, Enrica’s Inn, and Mally Suites. Enrica’s direct domain has an expired TLS certificate, and no accountable current operator source was found for Brensville or Mally/Malley.',
      food: 'The official tourism listing establishes Lighthouse Restaurant as an identity lead, but no accountable current operator source has been verified.',
    },
    sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-bmot-enricas-inn', 'research-source-operator-enricas-site', 'research-source-bmot-mally-suites', 'research-source-bmot-lighthouse-restaurant-inagua', 'research-source-operator-blessings-aviation'],
    operatorGap: gap('inagua', 'stays', 'p0', 'All three accommodation operators remain unresolved', 'Repair or replace the Enrica link, identify accountable current operators for Brensville and Mally/Malley, and confirm exact identity, coordinates, and operation before activation.', 'researching'),
  },
  'acklins-crooked-island': {
    scores: {overview: 2, access: 2, stays: 2, food: 0, experiences: 2, nature: 1, culture: 1, seasonality: 0, safety: 0, accessibility: 0},
    findings: {
      access: 'A current charter operator lists Spring Point, but the island-pair transport pattern and every lodge transfer remain operational facts requiring direct confirmation.',
      stays: 'Direct operator sites now corroborate Top Choice, IVel’s, Grey’s Point, and Crooked Island Lodge & Marina. Other official-directory identities and every canonical record still require individual adjudication.',
      experiences: 'The direct lodge sites support specialized fishing-experience identity leads, but guide credentials, safety, conservation practice, access, and bookability are not approved.',
      food: 'Property sites mention meals or restaurants, but no independently reconciled food place is approved for traveler delivery.',
    },
    sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-operator-top-choice', 'research-source-operator-ivels', 'research-source-operator-greys-point', 'research-source-operator-crooked-island-lodge', 'research-source-operator-blessings-aviation'],
    operatorGap: gap('acklins-crooked-island', 'stays', 'p0', 'Operator identities not reconciled to canonical records', 'Match the four corroborated operators one by one to exact coordinates and canonical rows, then continue the same review for every remaining official-directory candidate.', 'researching'),
  },
  'berry-islands': {
    scores: {overview: 2, access: 2, stays: 2, food: 2, experiences: 2, nature: 1, culture: 1, seasonality: 0, safety: 0, accessibility: 0},
    findings: {
      access: 'A current charter operator lists Chub Cay and Great Harbour Cay; current flight, marina, and ground-transfer details remain short-review operational facts.',
      stays: 'Soul Fly’s current direct site and operator history resolve the former Carriearl naming relationship. Other lodging identities and all canonical quality gates remain incomplete.',
      food: 'Official tourism evidence supports Flo’s Conch Bar as an identity lead, but no accountable current operator site was found. Soul Fly dining remains part of a lodging operator, not a separately approved food place.',
      experiences: 'Soul Fly supplies a current specialist fishing lead, but activity safety, conservation claims, availability, and suitability require separate review.',
    },
    sourceIds: ['research-source-bmot-hotel-directory-2025', 'research-source-operator-soul-fly', 'research-source-bmot-flos-conch-bar', 'research-source-operator-blessings-aviation'],
    operatorGap: gap('berry-islands', 'places', 'p0', 'Soul Fly and Carriearl records need identity merge', 'Preserve Carriearl as a former-name alias, select one current Soul Fly canonical identity, and adjudicate coordinates, content, media rights, and verification before activation.', 'researching'),
  },
  'ragged-island': {
    scores: {overview: 2, access: 2, stays: 2, food: 0, experiences: 2, nature: 1, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      access: 'A current charter operator lists Duncan Town, while the Lost Key marketplace profile describes charter-based access. Neither source establishes a scheduled service or confirmed trip availability.',
      stays: 'Lost Key Lodge is corroborated by a direct operator site and a current specialist marketplace, creating a narrow on-island fishing-lodge exception to the official base-stay pattern. It is not yet a canonical or approved place.',
      food: 'No independent local food option is source-verified. Any meals bundled by a specialist lodge must not be generalized into public restaurant inventory.',
      experiences: 'Lost Key is a current specialized fishing-experience lead, but guide, boat, safety, conservation, and bookability details still require accountable review.',
    },
    sourceIds: ['research-source-bmot-ragged-island', 'research-source-operator-lost-key', 'research-source-corrob-meridia-lost-key', 'research-source-operator-blessings-aviation'],
    operatorGap: gap('ragged-island', 'stays', 'p0', 'Lost Key is absent from canonical and official-directory inventory', 'Create a controlled candidate, confirm exact location and accountable operation, reconcile the base-stay exception, and complete sourced copy, media-rights, and verification gates.', 'researching'),
  },
  'rum-cay': {
    scores: {overview: 2, access: 2, stays: 1, food: 2, experiences: 1, nature: 1, culture: 1, seasonality: 0, safety: 1, accessibility: 0},
    findings: {
      access: 'A current charter operator lists Port Nelson, but no schedule, availability, fare, or guaranteed service has been established.',
      stays: 'Evidence is contradictory: a live-looking Sumner Point website claims cottages and services, the official tourism profile recommends a Long Island base, and May 2026 reporting describes destroyed infrastructure and an active dispute. The stay score is reduced to 1.',
      food: 'Ocean View has an official tourism identity listing. Sumner Point’s restaurant claim is blocked by recent condition reporting, and neither option is approved as currently operating.',
      safety: 'The aerodrome register and recent Sumner Point condition report provide narrow caution evidence, but island-wide emergency, marine, and provisioning guidance remains incomplete.',
    },
    sourceIds: ['research-source-bmot-rum-cay', 'research-source-operator-sumner-point-marina-site', 'research-source-independent-tribune-rum-cay-sumner-point-2026', 'research-source-bmot-ocean-view-restaurant', 'research-source-operator-blessings-aviation', 'research-source-caab-government-aerodromes-2026'],
    operatorGap: gap('rum-cay', 'stays', 'p0', 'Sumner Point services are contradicted and blocked', 'Do not activate Sumner Point. Obtain accountable owner/operator and physical-condition confirmation, resolve the service contradiction, and retain the Long Island base-stay guidance until then.', 'researching'),
  },
}

const operatorAuditDocs = Object.entries(operatorAuditConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const coverage = Object.entries(configuration.scores).map(([topic, value]) => score(topic, value, configuration.findings?.[topic] || defaultDeepFindings[topic], 0))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  const operatorGaps = [
    configuration.operatorGap,
    gap(slug, 'places', 'p0', 'No operator candidate passes the canonical publication gate', 'Resolve identity and coordinates, write sourced copy, obtain rights-cleared media, and complete verification before enabling any delivery channel.', 'researching'),
    gap(slug, 'access', 'p1', 'Operator evidence is not a live transport confirmation', 'Recheck exact travel dates with the responsible carrier or charter operator and the applicable authority; keep schedules, availability, and prices out of canonical CMS copy.'),
    gap(slug, 'safety', 'p1', 'Complete island safety guidance remains missing', 'Add responsible-authority emergency, medical, marine, disruption, and provisioning guidance.'),
    gap(slug, 'accessibility', 'p1', 'Accessibility evidence remains missing', 'Verify mobility constraints at airports, docks, transfers, stays, food venues, and activities without inferring accessibility.'),
  ]
  if (row.activeLocationIssues > 0) {
    operatorGaps.unshift(gap(slug, 'places', 'p0', `${row.activeLocationIssues} active place location failures remain`, `Quarantine or correct every active record outside the island review bounds before canonical reconciliation.`, 'researching'))
  }
  return {
    _id: `drafts.island-research-audit-${checkedAt}-operator-reconciliation-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} operator reconciliation — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: operatorGaps,
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: 'Remote-island operator reconciliation performed after the official-source deep pass. Direct operator sites were used to strengthen identity evidence, recent accountable corroboration was added where available, and conflicting or insecure sources were explicitly downgraded. A live website is not proof of operation, availability, pricing, schedule, location quality, or publication readiness. No Supabase place rows were mutated, facts remain drafts, and delivery channels remain empty.',
  }
})

const catalogAdjudicationConfigurations = {
  mayaguana: {
    gaps: [
      gap('mayaguana', 'stays', 'p0', 'Baycaner candidate is inactive and ungeocoded', 'Keep Supabase places.id 427ca602-1fed-48a4-84b8-1c4581de80a2 inactive. Confirm exact coordinates and current operation through an accountable safe source, then add sourced copy and rights-cleared media before verification.', 'researching'),
      gap('mayaguana', 'places', 'p0', 'Active hotel and food rows are foreign assignments', 'Quarantine Albany 11f46d18-9857-4231-afef-50a7d696add7, Bahama Bay Resort 150a9cfd-e386-4607-9c29-fb648c402b88, and Tommy Bahama 3ab05555-8783-44e5-8c44-87c1ed3744ca from Mayaguana delivery. Do not delete forensic rows.', 'researching'),
      gap('mayaguana', 'food', 'p0', 'No verified local food record', 'Do not reuse the foreign Tommy Bahama row or infer a public restaurant from Baycaner’s website. Establish a current accountable local venue or explicit provisioning guidance.', 'open'),
    ],
    notes: 'Exact Supabase candidate: Baycaner Beach Resort 427ca602-1fed-48a4-84b8-1c4581de80a2 is already an inactive draft with no coordinates, description, or managed media. This is the safest starting row; it is not ready to activate.',
  },
  inagua: {
    gaps: [
      gap('inagua', 'stays', 'p0', 'Enrica candidate is inactive and ungeocoded', 'Keep Supabase places.id 96abb6cc-3c1e-47d9-9156-eea0d8110451 inactive until its unsafe direct link, exact coordinates, operation, sourced copy, and media rights are resolved.', 'researching'),
      gap('inagua', 'stays', 'p0', 'Brensville and Mally directory identities are absent', 'Create no canonical row until current accountable operators, exact names, and coordinates are established. Treat Malley/Mally as an unresolved spelling relationship, not two properties.', 'open'),
      gap('inagua', 'stays', 'p0', 'Plausible local stay rows remain uncorroborated', 'Research Inagua Outback Lodge 3bf80cc5-55a4-4407-b5c7-f56adcc942f7, Morton Main House eb5d4dad-0ba6-45ab-a9ca-071a36e7c223, and Walkine’s Guest House 35b81b0f-bd11-4188-9b2e-270fc2d0b9ef separately; do not merge them into official-directory identities.', 'open'),
      gap('inagua', 'places', 'p0', 'Foreign stay and food rows are active', 'Quarantine azuLine 87ae3f5c-af3c-4a67-a4b1-e32225419a92, Bahama House f5887d16-cab3-4698-8144-50b84fcc786a, Old Bahama Bay d803369c-50d5-4ee1-8efb-8ede5a769d4f, Bahama Breeze d717fabc-c4a1-4039-aa8b-5620bacd10f7, Bahamas 8b3cbc71-a1a9-4702-8c6a-563f30762c63, and Tommy Bahama 6bcbfd2e-bbb3-42d2-bdc2-71d5f29f9b1d.', 'researching'),
      gap('inagua', 'food', 'p0', 'Official Lighthouse Restaurant lead has no canonical match', 'Do not relabel the in-bounds Cepigel record 38e58595-16ee-4b9d-b5b1-5dcc503dd91e. Research Lighthouse and Cepigel as separate identities and verify operation, coordinates, and accountable ownership.', 'open'),
    ],
    notes: 'The current catalog has one exact official-property lead for Enrica’s but no exact rows for Brensville or Mally/Malley. Several plausible local records coexist with clear foreign contamination and must be adjudicated separately.',
  },
  'acklins-crooked-island': {
    gaps: [
      gap('acklins-crooked-island', 'stays', 'p0', 'IVel’s exact row is active at zero coordinates', 'Quarantine places.id fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49 from delivery while preserving it as the exact identity candidate. Add accountable coordinates, sourced copy, rights-cleared media, and operation evidence before reactivation.', 'researching'),
      gap('acklins-crooked-island', 'stays', 'p0', 'Three corroborated operators are absent from the catalog', 'Create no rows for Top Choice, Grey’s Point, or Crooked Island Lodge & Marina until exact coordinates and duplicate checks are complete. Keep Trophy Lodge e0b54187-500d-444e-9bf1-caca74ffe7b2 as a separate inactive candidate.', 'open'),
      gap('acklins-crooked-island', 'stays', 'p0', 'Acklins Creekside is a separate uncorroborated active lead', 'Research places.id 5c50c16b-046e-4817-9a88-2e198e5192f5 independently. Do not infer it is Top Choice, Grey’s Point, Trophy Lodge, or another directory property based on geography alone.', 'open'),
      gap('acklins-crooked-island', 'food', 'p0', 'All active restaurant rows are foreign', 'Quarantine Crooked Hammock rows 5afc71e2-5510-44f5-8649-c5bcda775678 and b46ec44d-3389-4df7-b2bd-736de04fc9b5, The Crooked Post 29c16c48-143c-495e-b5a3-901d18bf1090, and The Crooked Spoon 838d0ae6-4413-4a03-99e1-39f0dbb72a77.', 'researching'),
    ],
    notes: 'Only IVel’s has an exact current operator-to-catalog name match, but the row is active with zero coordinates. The three other direct operators are absent; nearby or similarly themed rows must not be merged by inference.',
  },
  'berry-islands': {
    gaps: [
      gap('berry-islands', 'stays', 'p0', 'Carriearl is an active stale-name candidate for Soul Fly', 'Adjudicate places.id 74aedc62-dbc0-4b8a-8ca3-97f22db6175c as the likely same-property identity. Preserve Carriearl as a former-name alias and propose Soul Fly as the current name only after exact operator-location confirmation; do not mark verified yet.', 'researching'),
      gap('berry-islands', 'stays', 'p0', 'Chub Cay and Osprey need separate operator checks', 'Do not fold Chub Cay Resort 3f132897-e764-46d3-b6fd-095fe62c73a0 or The Osprey 09911e3b-f9ff-427f-a9f5-9290b20d6726 into the Soul Fly/Carriearl merge. Adjudicate each identity separately.', 'open'),
      gap('berry-islands', 'food', 'p0', 'Flo’s is inactive and ungeocoded', 'Keep Flo’s Conch Bar fa7d5f7d-ae3f-4a6c-ab05-564e4a44571c inactive until a current accountable operator, exact coordinates, operation, sourced copy, and media rights are confirmed.', 'open'),
      gap('berry-islands', 'food', 'p0', 'Two foreign restaurants are active', 'Quarantine Berry’s Seafood cf2226fc-2a54-4d49-9043-6a24d91bc26c and Caffe Berry e49d2895-76a0-43c5-9aba-08a44022d488 from Berry Islands delivery.', 'researching'),
    ],
    notes: 'The Carriearl row has plausible Great Harbour Cay coordinates and an address, while the current operator explicitly describes Soul Fly as the next chapter of that property. This supports a controlled rename/alias review, not automatic verification.',
  },
  'ragged-island': {
    gaps: [
      gap('ragged-island', 'stays', 'p0', 'Lost Key has no canonical place row', 'Create no production-active row until the direct operator confirms the exact property coordinate and current operation. Then create a controlled inactive candidate with sourced copy, rights-cleared media, and a specialized-lodge classification.', 'researching'),
      gap('ragged-island', 'food', 'p0', 'Every restaurant row is foreign', 'Quarantine Ragged Edge a8cb11c5-2727-479a-b18d-de4f05e26d9c, Ragged Point Inn 935046bd-076d-4b1f-a011-8ce22a46bf65, Ragged Rocks 6c81af6a-d8e7-48a7-9593-8cf6e1b16fd9, and The Ragged Robin 66d0cf0d-1333-40ce-b00c-19b4afd34ba8.', 'researching'),
      gap('ragged-island', 'places', 'p0', 'No active row is a verified local destination place', 'Keep all nine active location failures out of traveler queries. Preserve Hog Cay 45659ca4-6b99-4c9f-a2d0-ff055b32ead6 as an inactive research candidate until responsible-source coordinates and access evidence exist.', 'researching'),
    ],
    notes: 'The current Ragged Island catalog has no hotel row and no in-bounds active place. Lost Key therefore needs a controlled new candidate rather than a guessed merge into an unrelated record.',
  },
  'rum-cay': {
    gaps: [
      gap('rum-cay', 'stays', 'p0', 'No current Rum Cay stay row exists', 'Do not relabel Compass Cay Marina d18571d7-2c94-4437-a738-b53b8f7f1ec2, Green Turtle Club d004d845-b61f-4e95-9c32-68dc6d4db40d, or Staniel Cay Yacht Club d7a455a9-1b7c-4555-9fed-cbce0f6d28a0. They belong to other island groups and must be quarantined.', 'researching'),
      gap('rum-cay', 'stays', 'p0', 'Sumner Point is absent and operationally contradicted', 'Do not create or activate a Sumner Point row while recent condition evidence conflicts with the live-looking website. Resolve responsible ownership, physical condition, and service operation first.', 'researching'),
      gap('rum-cay', 'food', 'p0', 'Ocean View is the only exact local food candidate', 'Keep Ocean View dc5fb048-5231-4111-8ff9-8e17873accd0 inactive until current operation, exact coordinates, accountable ownership, sourced copy, and media rights are confirmed.', 'open'),
      gap('rum-cay', 'food', 'p0', 'All eight active restaurant rows belong elsewhere', 'Quarantine Drifters c0ca342c-dd54-43a7-b306-0e446403fdb4, On Da’ Beach 7c10159a-29a3-42c7-8473-febdde437a68, Pink Octopus eae288aa-a357-46f5-8138-91ff0d12bd2e, Potters Cay 64983a8a-3c90-4e21-8eba-15aab5f04477, Rum Dog 6577878a-acc9-4849-98b4-6795693192bd, Staniel restaurant fa10570b-c43d-47be-99fc-d92557300767, and all other nonlocal active rows.', 'researching'),
    ],
    notes: 'Only the generic Rum Cay attraction is in bounds. All active hotel rows and all active restaurant rows are nonlocal; Ocean View is an inactive no-coordinate candidate, and Sumner Point has no row and is blocked by contradictory current evidence.',
  },
}

const catalogAdjudicationAuditDocs = Object.entries(catalogAdjudicationConfigurations).map(([slug, adjudication]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const operatorConfiguration = operatorAuditConfigurations[slug]
  const coverage = Object.entries(operatorConfiguration.scores).map(([topic, value]) => score(topic, value, operatorConfiguration.findings?.[topic] || defaultDeepFindings[topic], 0))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-catalog-adjudication-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} canonical catalog adjudication — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: adjudication.gaps,
    sources: operatorConfiguration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Read-only record-level adjudication against the 2026-08-04 Supabase places snapshot. Exact IDs are included so editors and data operators can preserve forensic rows, quarantine contaminated assignments, and avoid unsafe merges. ${adjudication.notes} No Supabase row was changed, deleted, activated, or verified.`,
  }
})

const coordinateClosureConfigurations = {
  'berry-islands': {
    sourceIds: ['research-source-operator-soul-fly'],
    gaps: [
      gap('berry-islands', 'stays', 'p1', 'Soul Fly exact-location evidence identified', 'Retain the operator JSON-LD address and coordinates as the accountable evidence record. The approximately 21-metre match supports the Carriearl rename/alias review.', 'resolved'),
      gap('berry-islands', 'stays', 'p0', 'Soul Fly canonical change still requires controlled review', 'Apply the Soul Fly current name and Carriearl former-name alias only after a data operator reviews the coordinate comparison; then complete sourced copy, rights-cleared media, operation, and verification gates.', 'researching'),
      gap('berry-islands', 'safety', 'p1', 'Property and activity safety evidence remains incomplete', 'Verify current emergency, marine, transfer, fishing, and disruption guidance through accountable operators and authorities.'),
      gap('berry-islands', 'accessibility', 'p1', 'Physical accessibility remains unverified', 'Obtain property-specific evidence for rooms, paths, docks, transfers, bathrooms, and activities. Do not infer physical accessibility from website accessibility language.'),
    ],
    notes: 'The operator JSON-LD coordinate 25.756469, -77.851485 is approximately 21 metres from the existing Carriearl candidate at 25.756414, -77.851680. Exact-location evidence is resolved for this candidate; publication readiness is not.',
  },
  'acklins-crooked-island': {
    sourceIds: ['research-source-operator-ivels', 'research-source-operator-ivels-cloudbeds'],
    gaps: [
      gap('acklins-crooked-island', 'stays', 'p1', 'IVel’s exact-location evidence identified', 'Retain the operator-linked Cloudbeds address and coordinates as the accountable correction evidence for the existing zero-coordinate record.', 'resolved'),
      gap('acklins-crooked-island', 'stays', 'p0', 'IVel’s zero-coordinate row still requires controlled correction', 'After data-operator review, correct places.id fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49 to 22.54327393, -73.87608337 and retain 17 Queens Highway, Masons Bay as the address. Keep inactive until operation, copy, media, and verification gates pass.', 'researching'),
      gap('acklins-crooked-island', 'safety', 'p1', 'Property and transfer safety evidence remains incomplete', 'Verify current emergency, transport, marine, fishing, and disruption guidance through accountable operators and authorities.'),
      gap('acklins-crooked-island', 'accessibility', 'p1', 'Physical accessibility remains unverified', 'Obtain property-specific evidence for rooms, paths, transfers, bathrooms, and activities. Do not infer physical accessibility from a booking profile or generic website statement.'),
    ],
    notes: 'The direct operator site links to the Cloudbeds profile whose JSON-LD supplies 17 Queens Highway, Masons Bay and coordinates 22.54327393, -73.87608337. Exact-location evidence is resolved for this candidate; operation and publication readiness are not.',
  },
  mayaguana: {
    sourceIds: ['research-source-bmot-baycaner', 'research-source-bmot-business-map-pins', 'research-source-operator-baycaner', 'research-source-corrob-gofishingworldwide-mayaguana-2026'],
    gaps: [
      gap('mayaguana', 'stays', 'p1', 'Baycaner exact-location evidence identified', 'Retain official map pin 22.434536842839, -73.10189679265 and operator plus code CVMX+W78 as the accountable correction evidence.', 'resolved'),
      gap('mayaguana', 'stays', 'p0', 'Baycaner canonical row still requires controlled correction', 'After data-operator review, geocode places.id 427ca602-1fed-48a4-84b8-1c4581de80a2 and retain Baycaner Avenue, Pirate’s Well. Keep inactive until current operation, copy, media, and verification gates pass.', 'researching'),
      gap('mayaguana', 'stays', 'p1', 'Baycaner operating evidence is time-bound', 'The April 2026 hosted trip and current direct site strengthen operation evidence, but availability and transport must be rechecked through a safe direct channel for each trip.'),
      gap('mayaguana', 'accessibility', 'p1', 'Baycaner accessibility labels lack physical detail', 'Verify accessible rooms, routes, bathrooms, transfers, beach access, and service arrangements. Do not turn the official HA labels into a blanket promise.', 'researching'),
      gap('mayaguana', 'safety', 'p1', 'Property and remote-island safety evidence remains incomplete', 'Verify emergency, medical, aviation, marine, activity, disruption, and provisioning guidance through accountable operators and authorities.'),
    ],
    notes: 'Official map business ID 760 supplies 22.434536842839, -73.10189679265, corroborated by operator plus code CVMX+W78. Exact-location evidence is resolved; current availability and feature-level accessibility are not.',
  },
  inagua: {
    sourceIds: ['research-source-bmot-enricas-inn', 'research-source-bmot-business-map-pins', 'research-source-bmot-hotel-directory-2025'],
    gaps: [
      gap('inagua', 'stays', 'p1', 'Enrica’s exact-location evidence identified', 'Retain official map pin 20.945487474536, -73.675195508451 as the accountable correction evidence.', 'resolved'),
      gap('inagua', 'stays', 'p0', 'Enrica’s canonical row still requires controlled correction', 'After data-operator review, geocode places.id 96abb6cc-3c1e-47d9-9156-eea0d8110451. Keep inactive until current operation, copy, media, and verification gates pass.', 'researching'),
      gap('inagua', 'stays', 'p1', 'Enrica’s street-name discrepancy remains open', 'Resolve Victory & Taylor Streets on the current listing versus Victory & Matthew Streets in the 2025 directory through the operator or controlled local verification.', 'researching'),
      gap('inagua', 'accessibility', 'p1', 'Enrica’s accessibility label lacks physical detail', 'Verify accessible rooms, routes, bathrooms, transfers, dining spaces, and service arrangements. Do not turn the tourism listing label into a blanket promise.', 'researching'),
      gap('inagua', 'safety', 'p1', 'Property and remote-island safety evidence remains incomplete', 'Verify emergency, medical, aviation, marine, activity, disruption, and provisioning guidance through accountable operators and authorities.'),
    ],
    notes: 'Official map business ID 838 supplies 20.945487474536, -73.675195508451. Exact-coordinate evidence is resolved, but the two official sources disagree on the second street name and current operation remains unverified.',
  },
  'rum-cay': {
    sourceIds: ['research-source-bmot-ocean-view-restaurant', 'research-source-bmot-business-map-pins'],
    gaps: [
      gap('rum-cay', 'food', 'p1', 'Ocean View exact-location evidence identified', 'Retain official map pin 23.650244, -74.840713 and Pearl Street, Port Nelson as the accountable correction evidence.', 'resolved'),
      gap('rum-cay', 'food', 'p0', 'Ocean View canonical row still requires controlled correction', 'After data-operator review, geocode places.id dc5fb048-5231-4111-8ff9-8e17873accd0. Keep inactive until current operation, copy, media, and verification gates pass.', 'researching'),
      gap('rum-cay', 'food', 'p0', 'Ocean View operation and hours remain unverified', 'Reconfirm accountable ownership, current operation, hours, reservations, and payment arrangements directly. Do not publish the undated official listing hours.', 'researching'),
      gap('rum-cay', 'accessibility', 'p1', 'Ocean View physical accessibility evidence is missing', 'Verify route, entrance, seating, bathroom, payment, and communication accessibility without inference.'),
      gap('rum-cay', 'safety', 'p1', 'Restaurant and remote-island safety evidence remains incomplete', 'Verify emergency, medical, aviation, marine, disruption, and provisioning guidance through accountable operators and authorities.'),
    ],
    notes: 'Official map business ID 3609 supplies 23.650244, -74.840713 at Pearl Street, Port Nelson. Exact-location evidence is resolved; the map record’s 2020 update date cannot establish current operation or hours.',
  },
}

const coordinateClosureAuditDocs = Object.entries(coordinateClosureConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const operatorConfiguration = operatorAuditConfigurations[slug]
  const coverage = Object.entries(operatorConfiguration.scores).map(([topic, value]) => score(topic, value, operatorConfiguration.findings?.[topic] || defaultDeepFindings[topic], 0))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-coordinate-closure-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} coordinate evidence closure — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: configuration.gaps,
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Accountable location evidence review performed against national-tourism map pins, direct operator data where available, and the 2026-08-04 read-only Supabase snapshot. ${configuration.notes} No Supabase row was mutated, activated, or verified.`,
  }
})

const operationEvidenceConfigurations = {
  'berry-islands': {
    sourceIds: ['research-source-operator-soul-fly'],
    gaps: [
      gap('berry-islands', 'stays', 'p1', 'Soul Fly current operator evidence identified', 'Retain the current availability-inquiry path, Fall 2026 and 2027 planning language, and dated May 2026 journal activity as the operation checkpoint.', 'resolved'),
      gap('berry-islands', 'places', 'p0', 'Soul Fly and Carriearl still require a controlled canonical merge', 'After data-operator review, rename or merge the Carriearl candidate into the current Soul Fly identity, retain Carriearl as an alias, and apply the accountable coordinate correction. Keep inactive until every publication gate passes.', 'researching'),
      gap('berry-islands', 'stays', 'p1', 'Live availability and rates remain runtime facts', 'Confirm the exact dates, package, inclusions, transfer, price, payment path, and cancellation terms directly at planning time.'),
      gap('berry-islands', 'safety', 'p1', 'Property and activity safety evidence remains incomplete', 'Verify emergency, medical, marine, fishing, weather-disruption, and transfer guidance through accountable operators and authorities.'),
      gap('berry-islands', 'accessibility', 'p1', 'Feature-level physical accessibility evidence is missing', 'Obtain room, path, dock, transfer, bathroom, activity, sensory, and communication-access evidence without inference.'),
    ],
    notes: 'The direct operator site advertises future 2026 and 2027 planning windows, accepts availability inquiries, and contains dated May 2026 journal activity. This is strong current-operator evidence, but not a promise of inventory, price, transport, safety, accessibility, or publication readiness.',
  },
  'acklins-crooked-island': {
    sourceIds: ['research-source-operator-ivels', 'research-source-operator-ivels-cloudbeds'],
    gaps: [
      gap('acklins-crooked-island', 'stays', 'p1', 'IVel’s current operator booking channel identified', 'Retain the direct-site Book Now path and its live Cloudbeds lodging profile as the current-operation checkpoint.', 'resolved'),
      gap('acklins-crooked-island', 'places', 'p0', 'IVel’s zero-coordinate Supabase row requires controlled correction', 'After data-operator review, correct places.id fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49 to the accountable operator-linked coordinates and keep the record inactive until copy, media, safety, accessibility, and verification gates pass.', 'researching'),
      gap('acklins-crooked-island', 'stays', 'p1', 'Live availability, pricing, and transfer remain runtime facts', 'Confirm the exact room, dates, price, payment path, cancellation terms, airport transfer, and island transport directly at planning time.'),
      gap('acklins-crooked-island', 'accessibility', 'p1', 'No feature-level accessibility evidence was found', 'Obtain room, entrance, path, bathroom, transfer, sensory, and communication-access details. The reviewed booking markup contained no wheelchair, step-free, roll-in shower, grab-bar, hearing, or visual accessibility terms.'),
      gap('acklins-crooked-island', 'safety', 'p1', 'Property and remote-island safety evidence remains incomplete', 'Verify emergency, medical, aviation, marine, fishing, weather-disruption, and provisioning guidance through accountable operators and authorities.'),
    ],
    notes: 'The direct operator site links to a live Cloudbeds lodging profile with current booking metadata and multiple room types. This is strong current-operator-channel evidence, but not a promise of room inventory, price, transfer, safety, physical accessibility, or publication readiness.',
  },
  mayaguana: {
    sourceIds: ['research-source-operator-baycaner', 'research-source-corrob-gofishingworldwide-mayaguana-2026', 'research-source-aopa-mayaguana-kneeboard-2026'],
    gaps: [
      gap('mayaguana', 'stays', 'p1', 'Baycaner recent 2026 operation evidence identified', 'Retain the direct contact path, April 2026 hosted-trip evidence, and May 2026 AOPA service reference as a dated operation checkpoint through May 2026.', 'resolved'),
      gap('mayaguana', 'stays', 'p0', 'Safe current confirmation remains required', 'The direct site has a self-signed TLS certificate and the dated corroboration is not live inventory. Confirm current operation and availability through a safe accountable channel before recommending, linking, or taking payment.', 'researching'),
      gap('mayaguana', 'places', 'p0', 'Official coordinate evidence still requires controlled application', 'After data-operator review, apply the official map coordinate to places.id 427ca602-1fed-48a4-84b8-1c4581de80a2 and keep the record inactive until all publication gates pass.', 'researching'),
      gap('mayaguana', 'accessibility', 'p1', 'Official accessibility labels lack feature-level detail', 'Verify accessible rooms, routes, bathrooms, transfers, beach access, sensory access, communication access, and service arrangements. Do not convert the HA labels into a blanket promise.'),
      gap('mayaguana', 'safety', 'p1', 'Property and remote-island safety evidence remains incomplete', 'Verify emergency, medical, aviation, marine, fishing, weather-disruption, and provisioning guidance through accountable operators and authorities.'),
    ],
    notes: 'The three-source checkpoint supports recent commercial operation through May 2026. It does not establish today’s inventory, transport, secure checkout, property condition, safety, feature-level accessibility, or publication readiness.',
  },
}

const operationEvidenceAuditDocs = Object.entries(operationEvidenceConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const operatorConfiguration = operatorAuditConfigurations[slug]
  const coverage = Object.entries(operatorConfiguration.scores).map(([topic, value]) => score(topic, value, operatorConfiguration.findings?.[topic] || defaultDeepFindings[topic], 0))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-operation-evidence-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} operation evidence checkpoint — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: configuration.gaps,
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Dated operation-evidence checkpoint using direct operator-controlled paths and recent accountable corroboration. ${configuration.notes} Evidence of identity or recent operation is not evidence of live availability, price, safe payment, transport, safety, accessibility, or publication readiness. No operator outreach was performed, no Supabase row was mutated, and all facts remain reviewable drafts with no delivery channels.`,
  }
})

const medicalAccessConfigurations = {
  abacos: {
    clinicSummary: 'The authority directory lists seven Abaco community clinics across mainland settlements and cays, with a published weekday-hours baseline.',
    resolvedAction: 'Retain each clinic by cay or settlement and use the directory as a short-review planning source; do not infer timely inter-cay transport.',
  },
  'berry-islands': {
    clinicSummary: 'Bullock’s Harbour Community Clinic is listed with a published contact and weekday-hours baseline.',
    resolvedAction: 'Retain the official Bullock’s Harbour clinic listing as a short-review medical-planning contact.',
  },
  'acklins-crooked-island': {
    clinicSummary: 'Spring Point, Colonel Hill, and Landrail Point Community Clinics are separately listed with published contacts and weekday-hours baselines.',
    resolvedAction: 'Retain all three clinics by island and settlement; do not collapse Acklins and Crooked Island into one access assumption.',
  },
  andros: {
    clinicSummary: 'The authority directory identifies multiple Andros clinic contacts across northern, central, southern, and Mangrove Cay contexts, with a published weekday-hours baseline.',
    resolvedAction: 'Retain only safely recoverable facility names and preserve district and island geography; manually review the two source blocks with missing headings before publication.',
  },
  bimini: {
    clinicSummary: 'Alice Town Community Clinic is listed with a published contact and weekday-hours baseline.',
    resolvedAction: 'Retain the official Alice Town listing as a short-review medical-planning contact and verify transfer from the traveler’s actual cay.',
  },
  'cat-island': {
    clinicSummary: 'The authority directory lists several Cat Island clinics but contains overlapping Old Bight/The Bight entries, with a published weekday-hours baseline.',
    resolvedAction: 'Retain the named settlements and source ambiguity; do not invent a facility count or merge the Bight records without authority review.',
  },
  'eleuthera-harbour-island': {
    clinicSummary: 'The authority directory lists clinics across Eleuthera mainland, Harbour Island, and Spanish Wells, with published contacts and weekday-hours baselines.',
    resolvedAction: 'Retain mainland, Harbour Island, and Spanish Wells as distinct access contexts and verify bridge, boat, land-transfer, and referral arrangements.',
  },
  'the-exumas': {
    clinicSummary: 'Black Point, Forbes Hill, George Town, and Steventon clinics are listed with published contacts and weekday-hours baselines.',
    resolvedAction: 'Retain mainland and cay geography and verify the closest appropriate facility and marine or air transfer for the traveler’s actual cay.',
  },
  'grand-bahama': {
    clinicSummary: 'The authority directory lists seven Grand Bahama community clinics with published contacts and weekday-hours baselines.',
    resolvedAction: 'Retain the community-clinic directory as a short-review planning layer; build hospital and emergency routing separately.',
  },
  mayaguana: {
    clinicSummary: 'Abraham’s Bay Community Clinic is listed with a published contact and weekday-hours baseline.',
    resolvedAction: 'Retain the official Abraham’s Bay clinic listing as a short-review medical-planning contact.',
  },
  inagua: {
    clinicSummary: 'Matthew Town Community Clinic is listed with a published contact and weekday-hours baseline.',
    resolvedAction: 'Retain the official Matthew Town clinic listing as a short-review medical-planning contact.',
  },
  'long-island': {
    clinicSummary: 'Clarence Town, Deadman’s Cay, and Simms Community Clinics are listed with published contacts and weekday-hours baselines.',
    resolvedAction: 'Retain all three by settlement and preserve the abbreviated Deadman’s Cay telephone exactly as printed until authority recheck.',
  },
  'ragged-island': {
    clinicSummary: 'Duncan Town Community Clinic is listed with a published contact and weekday-hours baseline.',
    resolvedAction: 'Retain the official Duncan Town clinic listing as a short-review medical-planning contact.',
  },
  'rum-cay': {
    clinicSummary: 'Port Nelson Community Clinic is listed with a published contact and weekday-hours baseline.',
    resolvedAction: 'Retain the official Port Nelson clinic listing as a short-review medical-planning contact.',
  },
  'san-salvador': {
    clinicSummary: 'Cockburn Town Community Clinic is listed with a published contact and weekday-hours baseline.',
    resolvedAction: 'Retain the official Cockburn Town listing, keep the telephone exactly as printed until recheck, and preserve the Bahamas island identity.',
  },
  'nassau-paradise-island': {
    clinicSummary: 'The New Providence authority directory lists multiple clinics and a weekday-hours baseline, but contains no Paradise Island clinic entry.',
    resolvedAction: 'Retain the New Providence network as a planning baseline and verify the closest appropriate clinic, hospital, ambulance, and Paradise Island routing at runtime.',
    sourceIds: ['research-source-moh-new-providence-health-clinics'],
  },
}

const medicalAccessAuditDocs = Object.entries(medicalAccessConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for medical-access audit: ${slug}`)
  const medicalScores = {...evidenceConfiguration.scores, safety: Math.max(1, evidenceConfiguration.scores.safety || 0)}
  const coverage = Object.entries(medicalScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? `${configuration.clinicSummary} This is a narrow primary-source baseline; current staffing, capability, after-hours response, evacuation, communications, and traveler-specific suitability remain unverified.`
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-medical-access-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} medical-access baseline — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'Official clinic-directory baseline identified', configuration.resolvedAction, 'resolved'),
      gap(slug, 'safety', 'p1', 'Current clinic operation and capability need recheck', 'Reconfirm the telephone number, opening, staffing, services, medication or supply constraints, communications, and referral arrangements before traveler delivery.', 'researching'),
      gap(slug, 'safety', 'p1', 'After-hours and evacuation plan remains missing', 'Establish accountable local emergency contacts, first-response coverage, ambulance or marine/air evacuation arrangements, weather limits, insurance requirements, and the nearest suitable referral facility.'),
      gap(slug, 'accessibility', 'p1', 'Clinic and emergency-transport accessibility remain unverified', 'Verify step-free routes, entrances, bathrooms, examination access, sensory and communication support, companion policy, and accessible land, marine, or air transfer without inference.'),
      gap(slug, 'planning', 'p1', 'Traveler-specific medical planning remains runtime work', 'Match the traveler’s conditions, medications, mobility, insurance, communication needs, and risk tolerance to current professional advice; never use the directory as individualized medical guidance.'),
    ],
    sources: (configuration.sourceIds || ['research-source-moh-family-islands-health-clinics']).map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary-source clinic-directory review. ${configuration.clinicSummary} The evidence is a directory baseline only, not proof of current opening, staffing, services, emergency response, medicine, ambulance, evacuation, reliable connectivity, physical accessibility, or suitability for a specific traveler. No clinic or operator outreach was performed, no Supabase row was mutated, and the fact remains a reviewable draft with no delivery channels.`,
  }
})

const emergencyReadinessAuditDocs = Object.entries(emergencyIslandBoundaries).map(([slug, islandBoundary]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for emergency-readiness audit: ${slug}`)
  const emergencyScores = {
    ...evidenceConfiguration.scores,
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
    accessibility: Math.max(1, evidenceConfiguration.scores.accessibility || 0),
  }
  const coverage = Object.entries(emergencyScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? 'Primary national emergency numbers, evacuation guidance, live-alert routing, and an island clinic baseline now exist. Local communications, response time, activated shelters, transport, and evacuation capability remain unresolved.'
      : topic === 'accessibility'
        ? 'The national authority requires personalized accessible evacuation routes, medical supplies, communication devices, caregivers, and support networks. No complete island implementation or facility-level evidence is verified.'
        : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-emergency-readiness-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} emergency and disruption readiness — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'National emergency and evacuation routing identified', 'Retain 911/919, DRM live alerts, official-instruction, transport-plan, supply-kit, and personalized disability-planning guidance as short-review national facts.', 'resolved'),
      gap(slug, 'safety', 'p0', 'Local response and evacuation path remains unverified', `${islandBoundary} Record accountable local response, clinic or hospital routing, transport, receiving facility, weather limits, and fallback communications before traveler delivery.`, 'researching'),
      gap(slug, 'safety', 'p0', 'Current shelter inventory is not safe to reuse as complete', 'The DRM 2026 shelter page contains detailed entries for some locations and placeholder panels for others. Obtain a clean current island list, activation status, capacity, services, pet policy, and authority confirmation before publishing any shelter recommendation.', 'researching'),
      gap(slug, 'access', 'p1', 'Emergency communications and transport remain unverified', 'Test or confirm mobile, landline, VHF or local fallback contacts and land, bridge, marine, or air transport appropriate to the traveler’s exact location.'),
      gap(slug, 'accessibility', 'p1', 'Accessible evacuation implementation remains unverified', 'Verify accessible routes, vehicles, docks, aircraft, shelters, bathrooms, power for medical equipment, communication support, caregivers, and service-animal arrangements without inference.'),
      gap(slug, 'safety', 'p1', 'Live alert and all-clear status is runtime only', 'Use the current DRM Authority and Bahamas Meteorology instructions during planning and travel. Never persist a current code, warning, shelter activation, affected-island list, or all-clear as evergreen CMS copy.'),
    ],
    sources: [
      'research-source-drm-emergency-numbers',
      'research-source-drm-evacuation-guidance',
      'research-source-drm-disability-preparedness',
      'research-source-drm-live-alerts',
      'research-source-drm-2026-hurricane-shelters',
    ].map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary-source national emergency-readiness review. ${islandBoundary} National contacts and preparedness principles improve the safety evidence score, but they do not prove local connectivity, response, shelter activation, transport, evacuation, accessibility, capacity, or suitability. The rendered 2026 shelter page is explicitly quarantined as incomplete. No emergency service, clinic, property, or operator outreach was performed; no Supabase row was mutated; and the fact remains a reviewable draft with no delivery channels.`,
  }
})

const seasonalityWeatherAuditDocs = Object.entries(seasonalityIslandBoundaries).map(([slug, islandBoundary]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for seasonality-weather audit: ${slug}`)
  const seasonalityScores = {
    ...evidenceConfiguration.scores,
    seasonality: Math.max(2, evidenceConfiguration.scores.seasonality || 0),
  }
  const coverage = Object.entries(seasonalityScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'seasonality'
      ? 'A primary-source national wet/dry and cyclone-season baseline now exists. Island-specific climate normals, local marine exposure, recurring events, wildlife timing, and operator seasons remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-seasonality-weather-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} climate and seasonality — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2027-02-04',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'seasonality', 'p1', 'National climate and hazard-season baseline identified', 'Retain the wet/dry regime, June-through-November cyclone season, August-through-October historical peak, and northwest-to-southeast variation as sourced national context.', 'resolved'),
      gap(slug, 'seasonality', 'p1', 'Island-specific climate normals remain unresolved', `${islandBoundary} Obtain accountable island or station normals before publishing local rainfall, temperature, wind, or “best month” claims.`, 'researching'),
      gap(slug, 'seasonality', 'p1', 'Local recurring seasons remain unverified', 'Research island-specific festivals, fishing or diving patterns, wildlife timing, business closures, and transport seasons from the responsible authority or operator. Do not infer them from the national climate regime.'),
      gap(slug, 'safety', 'p1', 'Live weather and marine conditions are runtime only', 'Use current Bahamas Meteorology, DRM Authority, carrier, port, and marine guidance at planning and travel time. Never persist a forecast, warning, sea state, heat alert, closure, affected-island list, or all-clear as evergreen copy.'),
      gap(slug, 'planning', 'p1', 'Traveler-specific seasonal fit remains editorial work', 'Match heat, rain, wind, medical and mobility needs, activities, cancellation flexibility, and risk tolerance to current conditions without presenting a universal best time to visit.'),
    ],
    sources: [
      'research-source-bahamas-met-climate-overview',
      'research-source-drm-hazard-season-planning',
      'research-source-drm-live-alerts',
    ].map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary-source national climate and hazard-season review. ${islandBoundary} The score improves only for the existence of a sourced national baseline. It does not prove island normals, current weather, marine conditions, transport operation, event dates, wildlife timing, business seasons, physical accessibility, or suitability for a particular traveler. No authority or operator outreach was performed; no Supabase row was mutated; and the fact remains a reviewable draft with no delivery channels.`,
  }
})

const accessTransportAuditDocs = Object.entries(accessIslandConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for access-transport audit: ${slug}`)
  const accessScores = {
    ...evidenceConfiguration.scores,
    access: Math.max(2, evidenceConfiguration.scores.access || 0),
  }
  const coverage = Object.entries(accessScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'access'
      ? 'Official airport identities and a national scheduled/charter island-hopping model now exist. Current routes, frequency, availability, local transfers, marine links, disruption handling, and physical accessibility remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-access-transport-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} air and island-hopping access — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'access', 'p1', 'Official airport and national access baseline identified', `Retain ${configuration.airports} as a facility-identity baseline and preserve the distinction between scheduled and charter air.`, 'resolved'),
      gap(slug, 'access', 'p1', 'Current scheduled or charter service remains unverified', 'Confirm the responsible carrier, route, operating day, booking path, baggage rules, check-in, connection protection, availability, price, cancellation terms, and disruption policy for the exact dates.', 'researching'),
      gap(slug, 'access', 'p1', 'Exact arrival-to-destination transfer remains unverified', `${configuration.boundary} Establish the accountable road, bridge, dock, water-taxi, ferry, charter, or accommodation transfer and its fallback before traveler delivery.`),
      gap(slug, 'access', 'p1', 'Marine and mail-boat access needs current operator evidence', `${configuration.ferry || 'The reviewed national source does not assert a current Bahamas Ferries route for this island.'} Confirm every ferry, local water taxi, mail boat, private charter, port, and weather-dependent connection with the responsible operator; do not copy schedules into evergreen content.`),
      gap(slug, 'accessibility', 'p1', 'Transport-chain accessibility remains unverified', 'Verify assistance booking, boarding, steps, lifts or ramps, aircraft or vessel constraints, wheelchairs and mobility devices, docks, bathrooms, seating, service animals, communication support, baggage handling, and accessible ground transfer without inference.'),
      gap(slug, 'safety', 'p1', 'Transport disruption fallback remains unverified', 'Establish accountable delay, cancellation, missed-connection, overnight, weather, medical, communications, and evacuation fallbacks for the exact route and traveler.'),
    ],
    sources: [
      'research-source-doa-airports',
      'research-source-bmot-island-hopping-access',
      ...(configuration.ferry ? ['research-source-bahamas-ferries-travel'] : []),
    ].map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary-source airport and national island-hopping review. ${configuration.boundary} The score improves only for facility identity and a documented national access model. It does not prove current passenger service, schedule, availability, price, local transfer, ferry or mail-boat operation, private-field permission, weather suitability, disruption handling, or feature-level accessibility. No carrier, port, airport, property, or authority outreach was performed; no Supabase row was mutated; and the fact remains a reviewable draft with no delivery channels.`,
  }
})

const scheduledAirOperatorAuditDocs = Object.entries(scheduledAirOperatorConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for scheduled-air audit: ${slug}`)
  const accessScores = {
    ...evidenceConfiguration.scores,
    access: Math.max(2, evidenceConfiguration.scores.access || 0),
  }
  const coverage = Object.entries(accessScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'access'
      ? 'One or more accountable carrier or national-authority route leads are now recorded as a dated baseline. Exact date-level operation, itinerary protection, aircraft, accessibility, local transfer, and disruption handling remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  const routeStatusAction = slug === 'ragged-island'
    ? 'Retain the dated national statement that no commercial flights were listed at review time and the private-charter planning lead; recheck within 30 days and never convert it into a permanent no-service claim.'
    : 'Retain only the named carrier and airport-pair leads with their review date and source boundary; do not persist frequency, schedule, fare, or availability.'
  const liveOperationAction = slug === 'ragged-island'
    ? 'Recheck whether commercial service has started, stopped, or changed. For any private charter, verify the accountable operator, authorization, exact airports, aircraft, dates, seats, baggage, price, terms, accessibility, weather limits, ground transfer, and fallback.'
    : 'Query the responsible carrier and runtime provider for the exact travel date, flight number, operating carrier, airport pair, departure and arrival time, seats, fare, aircraft, cancellation terms, and operational status.'
  return {
    _id: `drafts.island-research-audit-${checkedAt}-scheduled-air-operator-coverage-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} scheduled-air operator coverage — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'access', 'p1', 'Dated carrier and airport-pair lead recorded', routeStatusAction, 'resolved'),
      gap(slug, 'access', 'p1', 'Exact live flight operation remains unverified', liveOperationAction, 'researching'),
      gap(slug, 'access', 'p1', 'Connection, baggage, and check-in handling remain unverified', 'Confirm same-ticket or separate-ticket status, minimum connection time, terminal transfer, baggage through-check, baggage limits, check-in cutoff, missed-connection responsibility, overnight exposure, cancellation protection, and re-accommodation for the exact itinerary.', 'researching'),
      gap(slug, 'accessibility', 'p1', 'Route-specific aircraft and assistance remain unverified', 'Confirm the operating aircraft, boarding method, seat and aisle constraints, mobility-device dimensions and battery, device handling and return, transfer chair or lift, restroom, oxygen or respiratory device, service animal, communication support, companion seating, and assistance record before purchase.', 'researching'),
      gap(slug, 'access', 'p1', 'Arrival transfer and disruption fallback remain unverified', `${configuration.boundary} Confirm the named driver, vehicle or vessel, pickup point, hours, luggage and mobility-device handling, price, weather and road limits, cancellation response, overnight option, communications, medical fallback, and evacuation path.`),
    ],
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary carrier pages were used where they explicitly expose a destination or route pair; the national tourism table remains a dated lead and is marked for recheck because its schedules are mutable and its rendered table contains internal inconsistencies. ${configuration.boundary} No frequency, fare, availability, operating day, aircraft assignment, connection guarantee, or live status was promoted to an evergreen fact. No carrier, airport, authority, property, or traveler outreach was performed; no Supabase row was mutated; and every fact remains a reviewable draft with no delivery channels.`,
  }
})

const scheduledMarineOperatorAuditDocs = Object.entries(scheduledMarineOperatorConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for scheduled-marine audit: ${slug}`)
  const accessScores = {
    ...evidenceConfiguration.scores,
    access: Math.max(2, evidenceConfiguration.scores.access || 0),
  }
  const coverage = Object.entries(accessScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'access'
      ? 'The national route lead, current operator-page match, or explicit no-match research boundary is now recorded as a dated baseline. Exact service, terminal, vessel, boarding, local transfer, accessibility, and disruption handling remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-scheduled-marine-operator-coverage-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} passenger-marine operator coverage — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'access', 'p1', 'Dated passenger-marine evidence boundary recorded', 'Retain the national route lead, current operator-page match, or explicit no-match result with its review date. Never infer service from an office listing and never infer no service from an unsuccessful page review.', 'resolved'),
      gap(slug, 'access', 'p1', 'Exact live passenger-marine operation remains unverified', 'Confirm the accountable operator, legal passenger service, exact date, route, terminal, dock, vessel, departure and arrival time, check-in, fare, capacity, booking path, weather status, cancellation terms, and current operational alert.', 'researching'),
      gap(slug, 'access', 'p1', 'Mail-boat, local-ferry, and private-charter roles remain unverified', 'Distinguish scheduled passenger ferry, freight or mail boat, local water taxi, hotel transfer, excursion, and private charter. Verify passenger permission, responsible operator, licensing or authority, exact ports, luggage or cargo limits, payment, safety equipment, and cancellation terms.'),
      gap(slug, 'accessibility', 'p1', 'Marine boarding and vessel accessibility remain unverified', 'Verify terminal and dock surfaces, steps, gangway or tender geometry, tide and sea-state limits, lift or crew assistance, wheelchair and mobility-device dimensions and handling, seating, restroom, communication support, service animal, evacuation, and accessible onward transfer without inference.'),
      gap(slug, 'access', 'p1', 'Dock-to-destination transfer and disruption fallback remain unverified', `${configuration.boundary} Confirm the arrival dock, named driver or vessel, pickup point, transfer time, luggage and mobility-device handling, price, operating window, road or weather limits, communications, missed-connection responsibility, overnight option, medical fallback, and evacuation path.`),
    ],
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary national-tourism and current operator-page reconciliation. ${configuration.boundary} The current Bahamas Ferries passenger page visibly publishes only the Nassau–Spanish Wells–Harbour Island high-speed service, while the national tourism FAQ names a broader route set. That mismatch is preserved as a recheck, not silently resolved. No schedule, fare, capacity, vessel assignment, alert, weather state, office listing, or page absence was promoted to an evergreen service promise. No operator, port, authority, property, or traveler outreach was performed; no Supabase row was mutated; and every fact remains a reviewable draft with no delivery channels.`,
  }
})

const licensedArrivalGroundTransferAuditDocs = Object.entries(licensedArrivalTransferConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for licensed arrival-transfer audit: ${slug}`)
  const transferScores = {
    ...evidenceConfiguration.scores,
    access: Math.max(2, evidenceConfiguration.scores.access || 0),
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
  }
  const coverage = Object.entries(transferScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'access'
      ? 'The national licensed-operator rule, taxi-registration process, and any island-specific legal or facility evidence are recorded with explicit limits. Exact operator, pickup, vehicle, fare, accessibility, and fallback remain unresolved.'
      : topic === 'safety'
        ? 'The licensing and inspection framework is recorded, but no claim is made that a specific current driver, vehicle, vessel, or dispatch complies.'
        : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-licensed-arrival-ground-transfer-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} licensed arrival ground-transfer coverage — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'National licensed-transport and taxi-registration baseline recorded', 'Retain the national licensed-operator guidance, Road Traffic Department registration and inspection requirements, and their limits. Do not turn the process page into a live operator register.', 'resolved'),
      gap(slug, 'access', 'p1', 'Exact licensed arrival-transfer operator remains unverified', 'Identify the named taxi, livery, shuttle, hotel transfer, water taxi, or other accountable operator for the exact airport or port. Confirm its current licence or responsible dispatch, operating area, service dates and hours, contact path, booking requirement, cancellation terms, and legal passenger role.', 'researching'),
      gap(slug, 'access', 'p1', 'Airport or port pickup and onward transfer remain unverified', `${configuration.boundary} Confirm the exact terminal, gate, curb, dock, meeting point, driver or vessel handoff, route, travel time, connection margin, luggage transfer, communications, and missed-arrival response.`),
      gap(slug, 'access', 'p1', 'Current fare, payment, luggage, and capacity remain unverified', 'Obtain a current route-specific quote and confirm passenger basis, child policy, luggage and oversized-item fees, waiting time, tolls, gratuity, cash or card acceptance, receipts, vehicle or vessel capacity, advance payment, cancellation, and refund handling. Do not copy old legal schedules or web prices as evergreen traveler facts.'),
      gap(slug, 'accessibility', 'p1', 'Accessible transfer and disruption fallback remain unverified', 'Confirm step-free pickup and drop-off, wheelchair or mobility-device dimensions and securement, boarding method, lift or ramp, seating transfer, service animal, companion capacity, luggage handling, restroom need, road or sea-state limits, backup vehicle or vessel, overnight option, medical fallback, and evacuation path without inference.'),
    ],
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary national-tourism, Road Traffic Department, official-law, airport-operator, and destination evidence was used only where it directly applies. ${configuration.islandContext} ${configuration.boundary} No office contact was treated as dispatch, no registration rule was treated as current operator proof, no fare schedule or web price was promoted to an evergreen quote, and no facility statement was treated as feature-level accessibility. No operator, airport, port, authority, property, or traveler outreach was performed; no Supabase row was mutated; and every fact remains a reviewable draft with no delivery channels.`,
  }
})

const policeResponseFacilityAuditDocs = Object.entries(policeResponseFacilityConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for police response-facility audit: ${slug}`)
  const responseScores = {
    ...evidenceConfiguration.scores,
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
  }
  const coverage = Object.entries(responseScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? 'The national RBPF district structure, 911/919 route, and available division or station-identity evidence are recorded with source-quality limits. Current local dispatch, response, fire, marine, medical handoff, accessibility, and evacuation capability remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-police-response-facility-coverage-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} police response-facility coverage — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'Police district, division, and station-identity baseline recorded', 'Retain the national 911/919 route and the dated organizational or station identity with all source anomalies. Do not publish mutable direct telephone numbers or infer capability from a listing.', 'resolved'),
      gap(slug, 'safety', 'p0', 'Local response and evacuation capability remain unverified', `${configuration.boundary} Verify police, fire, medical, shelter, road, marine and air response; receiving facilities; weather limits; mutual aid; evacuation assets; and realistic response time for the traveler’s exact location.`, 'researching'),
      gap(slug, 'safety', 'p1', 'Current police station contact and dispatch remain unverified', 'Recheck the responsible district, division, station, physical location, official telephone or other accessible contact method, operating window, dispatch routing, jurisdiction, staffing, outage fallback, and whether 911/919 connects from the traveler’s exact island and network. Resolve every rendered directory anomaly before storing a direct contact.'),
      gap(slug, 'safety', 'p1', 'Fire, marine rescue, and interagency handoff remain unverified', 'Identify the accountable fire service or brigade, marine police, Defence Force or search-and-rescue path, clinic or EMS handoff, available vehicle or vessel, equipment, communications, receiving facility, activation authority, mutual aid, weather limits, and transport fallback. A police division is not proof of these services.'),
      gap(slug, 'accessibility', 'p1', 'Accessible emergency communication and response remain unverified', 'Verify text, relay, sign-language, visual or audible alert, cognitive-support, service-animal, caregiver, wheelchair and mobility-device handling, accessible pickup and shelter, medical-equipment power, communication-device charging, and evacuation transport for the exact traveler and location.'),
    ],
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary Royal Bahamas Police Force district, division, and telephone-directory review. ${configuration.detail} ${configuration.boundary} Direct numbers were not copied into the fact layer because the rendered directory is partial and contains apparent anomalies. No station listing was treated as proof of staffing, dispatch, response time, fire or marine capability, medical transport, accessibility, or evacuation. No police, fire, marine, medical, authority, property, or traveler outreach was performed; no Supabase row was mutated; and every fact remains a reviewable draft with no delivery channels.`,
  }
})

const marineSearchRescueAuditDocs = Object.entries(marineSearchRescueConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for marine search-and-rescue audit: ${slug}`)
  const responseScores = {
    ...evidenceConfiguration.scores,
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
  }
  const coverage = Object.entries(responseScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? 'The national RBDF marine-SAR coordination role, current RCC-status boundary, and reviewed facility-directory footprint are recorded. Public distress routing, communications, deployable local assets, response time, fire/medical handoff, accessibility, and evacuation remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-marine-search-rescue-facility-coverage-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} marine search-and-rescue facility coverage — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'National marine search-and-rescue coordination lead identified', 'Retain RBDF as the central/lead national SAR and marine-SAR coordinator under the reviewed emergency-support protocol, with its interagency boundary. Keep designated RCC status unresolved until newer authoritative proof is recorded.', 'resolved'),
      gap(slug, 'safety', 'p1', 'National public RBDF SAR and VHF routes identified', 'Retain the official Search & Rescue telephone route, Harbour Control VHF Channel 16, and police-emergency handoff as a short-cadence national baseline. Keep island/cay connectivity, watch continuity, caller location, asset, launch readiness, weather, response time, accessibility, medical handoff, and fallback unresolved.', 'resolved'),
      gap(slug, 'safety', 'p1', 'RBDF facility-directory footprint classified', `${configuration.detail} Retain a named facility, proposal, dated use, or no-entry result only at that exact evidence strength.`, 'resolved'),
      gap(slug, 'safety', 'p0', 'Current marine distress route and communications remain unverified', `${configuration.boundary} Obtain the current authority-approved public telephone, radio, digital, relay, or other distress path; continuous-watch status; coverage and outage limits; caller-location method; escalation chain; and fallback. Do not publish the internal-looking RBDF directory extensions.`),
      gap(slug, 'safety', 'p1', 'Deployable rescue assets and response time remain unverified', 'Verify the responsible launch location, vessel and aircraft type, crew, fuel, maintenance and readiness state, range, draft and shallow-water ability, navigation and night capability, medical equipment, weather and sea-state limits, mutual aid, mobilization time, transit time, and cancellation or suspension criteria for the exact incident area.'),
      gap(slug, 'safety', 'p1', 'Fire, medical, and receiving-facility handoff remain unverified', 'Verify fire or hazmat capability, in-water recovery, first aid and stabilization, clinic or EMS rendezvous, dock and road transfer, air or marine medevac, receiving hospital, customs or immigration handoff where relevant, command ownership, and fallback when the preferred facility or route is unavailable.'),
      gap(slug, 'accessibility', 'p1', 'Accessible marine rescue and evacuation remain unverified', 'Verify text or relay access, sign-language and cognitive-support options, visual/audible distress communication, caregiver and service-animal handling, transfer geometry, lifting and securement, wheelchair or mobility-device handling, medical-equipment power and oxygen, accessible dock/vehicle/aircraft, medication continuity, and evacuation destination for the exact traveler.'),
    ],
    sources: configuration.sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary Royal Bahamas Defence Force public-contact, emergency-protocol, operations-directory, training-status, facility, and dated-operation evidence. ${configuration.detail} ${configuration.boundary} The review distinguishes a current public national route from island-level communications and operational readiness, central coordination from designated RCC status, current entries from proposed infrastructure, and facility identity from operational readiness. Internal-looking extensions were not copied into facts; absence from the directory was not treated as absence of service; and no contact, facility, or incident was treated as proof of current island-level staffing, assigned assets, response time, accessibility, medical transport, or evacuation. No defence, police, fire, marine, medical, authority, operator, property, or traveler outreach was performed; no Supabase row was mutated; and every fact remains a reviewable draft with no delivery channels.`,
  }
})

const airportFireEmsFacilityAuditDocs = Object.entries(airportFireEmsFacilityConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for airport, fire, and EMS facility audit: ${slug}`)
  const responseScores = {
    ...evidenceConfiguration.scores,
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
  }
  const coverage = Object.entries(responseScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? 'The national aerodrome RFFS standard, dated airport categories, emergency-directory field classification, Airport Authority footprint, NEMS historical responsibility lead, and local asset-inventory framework are recorded. Current RFFS, structural or wildfire response, EMS dispatch, ambulance availability, response time, accessibility, medical transfer, and evacuation remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  const sourceIds = [...nationalAirportFireEmsSourceIds, ...(configuration.extraSourceIds || [])]
  return {
    _id: `drafts.island-research-audit-${checkedAt}-airport-fire-ems-facility-coverage-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} airport rescue, fire, and EMS facility coverage — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'CAA-B aerodrome RFFS standard and register categories recorded', `${configuration.register} Retain CAT 0 verbatim and recheck every category against the current AIP before use.`, 'resolved'),
      gap(slug, 'safety', 'p1', 'Airport-emergency and NEMS responsibility evidence classified', `${configuration.emergencyDirectory} The Airport Authority national RFFS statement and the legacy NEMS organization and fleet description are responsibility or routing leads only.`, 'resolved'),
      gap(slug, 'safety', 'p0', 'Current aerodrome RFFS readiness remains unverified', `${configuration.boundary} Recheck current AIP status, operator, alert path, station, appliances, agent, rescue equipment, crew, response test, difficult-terrain capability, mutual aid, and fallback.`),
      gap(slug, 'safety', 'p0', 'Current EMS dispatch and ambulance availability remain unverified', 'Verify the current NEMS or local dispatch route, working contact and network coverage, ambulance or other medical-transport base, vehicle and crew, operating window, equipment, first-responder programme status, realistic mobilization and travel time, clinic rendezvous, receiving hospital, medevac trigger, weather limits, and fallback for the exact location.'),
      gap(slug, 'safety', 'p1', 'Current structural and wildfire response capacity remains unverified', `${configuration.structuralFire} Verify the responsible responder, dispatch, service boundary, appliance, water, crew, rescue and wildfire capability, response time, mutual aid, road or cay access, and fallback.`),
      gap(slug, 'accessibility', 'p1', 'Accessible rescue, stabilization, and medical transfer remain unverified', 'Verify text or relay contact, visual and audible alerting, sign-language and cognitive support, caregiver and service-animal handling, wheelchair extraction and securement, mobility-device transfer and storage, bariatric support, oxygen and medical-equipment power, medication continuity, accessible ambulance or substitute vehicle, airport or dock transfer geometry, shelter and bathroom access, and receiving-facility capability for the exact traveler.'),
    ],
    sources: sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary CAA-B standard and dated aerodrome-register review, current Airport Authority service-footprint statement, Department of Aviation emergency-field classification, legacy PHA NEMS system description, DRM local asset-inventory framework, RBPF fire-directory scope review, and limited dated incident or training evidence where available. ${configuration.register} ${configuration.emergencyDirectory} ${configuration.structuralFire} ${configuration.boundary} The review keeps RFFS, structural and wildfire response, and EMS separate; records CAT 0 without interpretation; and treats every emergency field, fleet count, equipment handoff, training item, or incident as evidence only at its stated date and scope. No emergency service, authority, operator, property, or traveler outreach was performed; no Supabase row was mutated; and every fact remains a reviewable draft with no delivery channels.`,
  }
})

const hurricaneShelterFacilityAuditDocs = Object.entries(hurricaneShelterFacilityConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for hurricane-shelter facility audit: ${slug}`)
  const shelterScores = {
    ...evidenceConfiguration.scores,
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
    accessibility: Math.max(1, evidenceConfiguration.scores.accessibility || 0),
  }
  const coverage = Object.entries(shelterScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? 'The official 2026 PDF facility rows and printed capacities are transcribed, and the PDF/web conflicts are classified. Current activation, condition, usable capacity, services, evacuation transport, and facility-level accessibility remain unresolved.'
      : topic === 'accessibility'
        ? 'Source designations and national disability-planning guidance are recorded without inferring facility features. Entrances, routes, bathrooms, communications, caregivers, service animals, power, medical support, and accessible transport remain unverified.'
        : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  const countResolution = configuration.count > 0
    ? `Retain ${configuration.count} numbered rows and the combined printed capacity of ${configuration.capacity.toLocaleString('en-US')} exactly as a dated 2026 list result. ${configuration.detail}`
    : `Retain the no-entry result for the PDF without converting it into a claim that no shelter exists. ${configuration.detail}`
  const sourceIds = [
    'research-source-drm-official-2026-emergency-shelter-list-pdf',
    'research-source-drm-2026-hurricane-shelters',
    'research-source-drm-evacuation-guidance',
    'research-source-drm-disability-preparedness',
    'research-source-drm-fidep-local-response-asset-standard',
  ]
  return {
    _id: `drafts.island-research-audit-${checkedAt}-hurricane-shelter-facility-coverage-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} hurricane-shelter facility coverage — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'Official 2026 shelter-list coverage classified', 'Retain the PDF as the numbered facility baseline and the companion page as a conflicting or incomplete official surface. Preserve omissions, extra web entries, spelling anomalies, special-needs wording, and aftermath designation instead of silently reconciling them.', 'resolved'),
      gap(slug, 'safety', 'p1', configuration.count > 0 ? 'Published shelter count and capacity captured' : 'Official PDF no-entry result captured', countResolution, 'resolved'),
      gap(slug, 'safety', 'p0', 'Current shelter activation, condition, and usable capacity remain unverified', 'Obtain current authority confirmation of activation, inspection and structural condition, hazard suitability, open/closed state, actual usable capacity, staffing, supplies, sanitation, power, water, communications, security, medical support, opening and closing rules, and fallback. Never use the dated printed capacity as a live availability value.'),
      gap(slug, 'access', 'p0', 'Current evacuation route, assembly point, and transport remain unverified', 'Verify the traveler’s exact origin, responsible authority, alert method, route, bridge or road condition, assembly point, accessible vehicle or other transport, driver and fuel, ferry/dock/airfield dependency, weather and tide limits, timing, receiving facility, alternate route, and stranded-traveler fallback.'),
      gap(slug, 'safety', 'p1', 'Shelter operations, services, and pet policy remain unverified', 'Verify registration and admission rules, supplies to bring, food and water, sleeping arrangements, bathrooms and bathing, medications and refrigeration, oxygen and electrical power, infection controls, security, children and caregivers, pets and service animals, communications, charging, length of stay, return or relocation plan, and costs or eligibility where applicable.'),
      gap(slug, 'accessibility', 'p1', 'Facility accessibility and special-needs implementation remain unverified', 'Verify step-free route and entrance, doorway and circulation widths, accessible toilet and bathing, sleeping and transfer space, wheelchair and mobility-device handling, visual and audible alerts, text/relay/sign-language and cognitive support, caregiver and service-animal arrangements, medical-equipment power and oxygen, medication continuity, accessible transport, and evacuation assistance. A “Special Needs Shelter” label is not feature-level proof.'),
    ],
    sources: sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary DRM Authority PDF, companion shelter page, evacuation guidance, disability guidance, and local-response framework review. ${configuration.detail} The PDF transcription was mechanically checked for 121 sequential entries and 15,700 total printed capacity. Counts and capacities are dated publication values only. Official-surface conflicts, omissions, and apparent source typos are preserved for authority recheck. No shelter, authority, emergency service, administrator, operator, or traveler outreach was performed; no Supabase row was mutated; no facility was activated or published; and every facility, fact, and audit remains a review-only draft with no delivery channels.`,
  }
})

const shelterGovernanceAuditDocs = Object.entries(shelterGovernanceConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for shelter-governance audit: ${slug}`)
  const governanceScores = {
    ...evidenceConfiguration.scores,
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
    accessibility: Math.max(1, evidenceConfiguration.scores.accessibility || 0),
  }
  const coverage = Object.entries(governanceScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? 'National shelter inspection timing, suitability-assessment requirements, responsible agencies, activation governance, minimum operating standards, and dated event applicability are classified. No current facility inspection report, grade, repair status, activation, or transport plan is verified.'
      : topic === 'accessibility'
        ? 'The national standard requires inclusive access, transport planning, disability access, interpreters, caregivers, service-animal arrangements, accessible sanitation, and other support. No named facility is proven to implement those requirements.'
        : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  const sourceIds = [
    'research-source-drm-national-humanitarian-assistance-standards-2025',
    'research-source-drm-shelter-inspection-grading-programme',
    'research-source-drm-national-disaster-coordination-protocols',
    ...(configuration.hasEventEvidence ? ['research-source-opm-hurricane-melissa-evacuation-shelter-activation-2025'] : []),
  ]
  return {
    _id: `drafts.island-research-audit-${checkedAt}-shelter-inspection-governance-and-activation-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} shelter inspection, governance, and activation — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'National shelter inspection and suitability standard identified', 'Retain the yearly needs/capacity review, February–April list update and inspection window, documented and widely distributed suitability-assessment requirement, annual maintenance, repair, catchment, surge, host-island, and mass-evacuation planning duties as the national standard.', 'resolved'),
      gap(slug, 'safety', 'p1', 'Responsible shelter agencies and minimum operating standard identified', 'Retain the DRM Authority, Ministry of Public Works, Environmental Health Services, Department of Social Services/DMU, RBPF/RBDF, Family Island ICC, and shelter-team responsibility boundaries plus the minimum equipment, staffing, services, communications, protection, sanitation, accessibility, and compromised-shelter evacuation requirements.', 'resolved'),
      gap(slug, 'safety', 'p1', 'Dated storm activation evidence classified', configuration.eventEvidence, 'resolved'),
      gap(slug, 'safety', 'p0', 'Current 2026 inspection, suitability assessment, and shelter grade remain unverified', 'Obtain the authority-approved facility inspection date, inspectors and agencies, checklist or standard version, structural and hazard assessment, sanitation result, security result, maximum usable capacity and calculation, accessibility review, grade, defects, repairs, restrictions, owner acknowledgement, approval/sign-off, reinspection, publication date, and current supersession status for every listed facility.'),
      gap(slug, 'access', 'p0', 'Current activation decision, evacuation order, and transport remain runtime-only', 'Reconfirm the exact island, cay, settlement, and origin. Obtain the current official activation or closure decision, catchment, alert route, assembly points, ground/marine/air and accessible transport, timing and manifests, weather/tide/road limits, receiving shelter, host-island agreement, priority passengers, mobility and medical-device rules, responsible officer, and fallback. Never reuse the October 2025 event as a current instruction.'),
      gap(slug, 'accessibility', 'p1', 'Facility-level implementation of shelter standards remains unverified', 'For each facility, verify the step-free route, entrances and circulation, accessible toilets/showers, sleeping and transfer space, lighting and alerts, sign-language/text/relay/cognitive support, caregiver and service-animal arrangements, medical professional and supplies, medication refrigeration, oxygen and device power, water/WASH, emergency communications, security, accessible transport, compromised-shelter evacuation, and complaint/protection mechanisms.'),
    ],
    sources: sourceIds.map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary DRM national standards, programme overview, national coordination protocols, and applicable dated OPM activation evidence. ${configuration.eventEvidence} The review treats the February–April inspection window, agency roles, grading-system claim, mass-evacuation-plan claim, minimum standards, and historical activation as separate evidence. No unpublished inspection or suitability report, grade, repair record, facility checklist, activation order, manifest, route, vehicle, accessibility assessment, or current readiness result was inferred. No authority, shelter, administrator, emergency service, operator, or traveler outreach was performed; no Supabase row was mutated; and every fact and audit remains a review-only draft with no delivery channels.`,
  }
})

const airTransportAccessibilityAuditDocs = Object.entries(accessIslandConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for air-accessibility audit: ${slug}`)
  const accessibilityScores = {
    ...evidenceConfiguration.scores,
    accessibility: Math.max(slug === 'nassau-paradise-island' ? 2 : 1, evidenceConfiguration.scores.accessibility || 0),
  }
  const coverage = Object.entries(accessibilityScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'accessibility'
      ? slug === 'nassau-paradise-island'
        ? 'A national aviation accessibility standard, a current national-carrier assistance process, and facility-level LPIA features are documented. Exact aircraft, handler, onward airport, ground transfer, marine connection, and destination implementation remain unverified.'
        : 'A national aviation accessibility standard and a current national-carrier assistance process are documented. Exact airport, aircraft, handler, ground transfer, marine connection, and destination implementation remain unverified.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-air-transport-accessibility-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} air and onward-transport accessibility — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'accessibility', 'p1', 'National aviation special-assistance standard identified', 'Retain the CAA-B requirements for special assistance, accessible information, adapted airport services, transfer devices, mobility aids, service animals, and advance notice as the national regulatory baseline.', 'resolved'),
      gap(slug, 'accessibility', 'p1', 'Conditional Bahamasair assistance path identified', 'If the itinerary uses Bahamasair, use its passenger-with-disability policy and assistance-request form as the operator planning path; do not infer current route coverage or service confirmation.', 'resolved'),
      ...(slug === 'nassau-paradise-island' ? [
        gap(slug, 'accessibility', 'p1', 'LPIA terminal accessibility features identified', 'Retain the airport-operator evidence for short-term accessible parking, elevators and escalators, accessible restrooms, airline-arranged wheelchairs, and the Hidden Disabilities Sunflower programme at LPIA only.', 'resolved'),
      ] : []),
      gap(slug, 'accessibility', 'p1', 'Exact airport implementation remains unverified', `Verify ${configuration.airports} individually for the traveler’s dates and needs: terminal or waiting-area access, curb or parking, surfaces, steps, ramps or lifts, boarding method, transfer devices, restrooms, seating, communication support, power, staffing, and disruption fallback.`, 'researching'),
      gap(slug, 'accessibility', 'p1', 'Exact carrier, aircraft, and assistance confirmation remains unverified', 'Confirm the operating carrier, aircraft type, seat and aisle constraints, boarding method, wheelchair dimensions and weight, battery handling, device stowage and return, transfer chair or lift, restroom, companion seating, communication support, oxygen or respiratory device, service animal, and assistance record before purchase.', 'researching'),
      gap(slug, 'accessibility', 'p1', 'Accessible local ground transfer remains unverified', `${configuration.boundary} Verify the accountable vehicle, loading method, restraint or securement, luggage and device handling, companion capacity, road or bridge conditions, pickup point, cost, and fallback without assuming that an airport accessibility standard covers onward transport.`),
      gap(slug, 'accessibility', 'p1', 'Marine connection accessibility remains unverified', configuration.ferry
        ? 'Bahamas Ferries publishes passenger policies but no feature-level wheelchair, boarding, ramp or lift, accessible-restroom, mobility-device, service-animal, or assistance-request workflow was found on the reviewed page. Absence is not proof of no assistance; confirm the exact terminal, dock, gangway, tide, vessel, seating, restroom, device handling, crew help, evacuation, and transfer.'
        : 'No accountable feature-level accessibility evidence is recorded for the required ferry, water taxi, mail boat, dock, tender, or private charter. Confirm gangway or boarding geometry, tide and weather limits, device handling, seating, restroom, crew assistance, evacuation, and accessible onward transfer.'),
      gap(slug, 'safety', 'p1', 'Assistance and medical-device disruption fallback remains unverified', 'Plan for delay, diversion, cancellation, device damage or delayed return, battery or charging needs, missed connections, medication and oxygen continuity, communication failure, overnight accommodation, and emergency or evacuation assistance for the exact traveler and route.'),
    ],
    sources: [
      'research-source-caab-special-assistance-facilitation',
      'research-source-bahamasair-passenger-disability',
      'research-source-bahamasair-accessibility-request',
      ...(slug === 'nassau-paradise-island' ? ['research-source-lpia-accessibility'] : []),
      ...(configuration.ferry ? ['research-source-bahamas-ferries-passenger-policies'] : []),
    ].map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary-source regulator, carrier, and applicable airport or ferry-operator review. ${configuration.boundary} The score improves for a national standard and an accountable assistance request path${slug === 'nassau-paradise-island' ? ', plus feature-level LPIA terminal evidence' : ''}. It does not prove current route coverage, compliance at a named Family Island airport, aircraft or vessel suitability, confirmed assistance, accessible ground or marine transfer, destination accessibility, or medical fitness. The Bahamas Ferries policy-page absence is retained only as a verification gap, never as proof that assistance is unavailable. No carrier, airport, port, property, authority, or traveler outreach was performed; no Supabase row was mutated; and every fact remains a reviewable draft with no delivery channels.`,
  }
})

const localAuthorityAuditDocs = Object.entries(localAuthorityConfigurations).map(([slug, configuration]) => {
  const row = rows.find((candidate) => candidate.slug === slug)
  const evidenceConfiguration = operatorAuditConfigurations[slug] || deepAuditConfigurations[slug]
  if (!evidenceConfiguration) throw new Error(`Missing evidence configuration for local-authority audit: ${slug}`)
  const localAuthorityScores = {
    ...evidenceConfiguration.scores,
    safety: Math.max(2, evidenceConfiguration.scores.safety || 0),
  }
  const coverage = Object.entries(localAuthorityScores).map(([topic, value]) => score(
    topic,
    value,
    topic === 'safety'
      ? 'The responsible national incident-coordination structure and an accountable administration routing lead are now identified. Live activation, public contact, response, shelter, transport, capability, and accessibility remain unresolved.'
      : evidenceConfiguration.findings?.[topic] || defaultDeepFindings[topic],
    0,
  ))
  const overallScore = Number((coverage.reduce((sum, item) => sum + item.score, 0) / coverage.length).toFixed(2))
  return {
    _id: `drafts.island-research-audit-${checkedAt}-local-authority-routing-${slug}`,
    _type: 'islandResearchAudit',
    title: `${row.name} local administration and incident coordination — ${checkedAt}`,
    destination: {_type: 'reference', _ref: row.destinationId},
    auditedAt: checkedAt,
    nextAuditAt: '2026-09-03',
    owner: 'Baha Buddy Content Operations',
    status: 'researching',
    overallScore,
    coverage,
    gaps: [
      gap(slug, 'safety', 'p1', 'Official Incident Coordination Centre structure identified', `Retain ${configuration.coordination} as the accountable structural baseline.`, 'resolved'),
      gap(slug, 'safety', 'p1', 'Administration routing lead identified', configuration.administration, 'resolved'),
      gap(slug, 'safety', 'p0', 'Live ICC activation and public contact remain unverified', 'Obtain the current authority-approved public contact, activation state, hours, staffing, responsible officer, radio or satellite fallback, and escalation path. Do not substitute a Registrar General service number for emergency dispatch.', 'researching'),
      gap(slug, 'safety', 'p0', 'Local response and evacuation capability remain unverified', 'Verify police, fire, medical, shelter, road, marine and air response; receiving facilities; weather limits; mutual aid; evacuation assets; and realistic response time for the traveler’s exact location.', 'researching'),
      gap(slug, 'access', 'p1', 'Shared or off-island administration routing needs recheck', configuration.boundary, 'researching'),
      gap(slug, 'accessibility', 'p1', 'Local coordination accessibility implementation remains unverified', 'Verify accessible alerts, communication formats, office and ICC access, caregivers, power for medical equipment, service animals, shelters, bathrooms, vehicles, docks, aircraft, and assisted evacuation without inference.'),
    ],
    sources: [
      'research-source-drm-national-disaster-coordination-protocols',
      ...(configuration.noAdministrationSource ? ['research-source-drm-emergency-numbers'] : ['research-source-rgd-family-island-administration-offices']),
    ].map((sourceId, index) => ({_type: 'reference', _key: `source-${index + 1}`, _ref: sourceId})),
    methodologyNotes: `Primary-source incident-coordination and administration-directory review. ${configuration.boundary} The evidence establishes accountable structure and a planning lead only. It does not prove a live public emergency number, activation, staffing, dispatch, communications, response time, shelter, medical capability, transport, evacuation, or accessibility. No administrator, ICC, authority, emergency service, or operator outreach was performed; no Supabase row was mutated; and the fact remains a reviewable draft with no delivery channels.`,
  }
})

function createPlaceReviewDraft(recordId, changes, evidenceNote) {
  const base = documents.find((item) => item._id === `place-supabase-${recordId}`)
  if (!base) throw new Error(`Missing placeEditorial source document for ${recordId}`)
  return {
    ...base,
    ...changes,
    _id: `drafts.${base._id}`,
    source: {
      ...base.source,
      notes: `Review-only editorial draft created from the 2026-08-04 evidence pass. ${evidenceNote} Supabase remains authoritative for identity, coordinates, operation, and verification. Keep inactive and channel-free until every publication gate passes.`,
    },
    reviewedAt: checkedAt,
  }
}

const placeReviewDraftDocs = [
  createPlaceReviewDraft(
    '74aedc62-dbc0-4b8a-8ca3-97f22db6175c',
    {
      title: 'Soul Fly Lodge',
      slug: {_type: 'slug', current: 'soul-fly-lodge-great-harbour-cay'},
      shortDescription: 'Specialist fly-fishing lodge on Great Harbour Cay and the current successor identity to the former Carriearl Boutique Hotel.',
      address: 'Soul Fly Lodge, Great Harbour Cay Drive, Great Harbour Cay, Berry Islands, The Bahamas',
      website: 'https://www.soulflylodge.com/',
      active: false,
      channels: [],
      seo: {_type: 'seo', metaTitle: 'Soul Fly Lodge', metaDescription: 'Review draft for Soul Fly Lodge on Great Harbour Cay, formerly Carriearl Boutique Hotel.'},
    },
    'See research-source-operator-soul-fly and the Soul Fly identity/location facts. Operator JSON-LD supplies 25.756469, -77.851485, about 21 metres from Carriearl. Preserve Carriearl as a former-name alias; do not auto-publish.',
  ),
  createPlaceReviewDraft(
    'fd19f9b4-cdf5-4ae8-95b5-cde910b6bc49',
    {
      title: "IVel's Bed and Breakfast",
      slug: {_type: 'slug', current: 'ivels-bed-and-breakfast-acklins'},
      shortDescription: 'Direct-operator accommodation lead at 17 Queens Highway, Masons Bay, Acklins. Current availability and physical accessibility remain under review.',
      address: '17 Queens Highway, Masons Bay, Acklins, The Bahamas, N3313',
      website: 'https://ivelsbedandbreakfast.com/',
      active: false,
      channels: [],
      seo: {_type: 'seo', metaTitle: "IVel's Bed and Breakfast", metaDescription: 'Review draft for an Acklins accommodation with operator-linked location evidence; operation and accessibility remain under review.'},
    },
    'See research-source-operator-ivels, research-source-operator-ivels-cloudbeds, and the IVel’s location fact. Cloudbeds JSON-LD supplies 22.54327393, -73.87608337. The Supabase row remains at zero coordinates; delivery stays disabled.',
  ),
  createPlaceReviewDraft(
    '427ca602-1fed-48a4-84b8-1c4581de80a2',
    {
      title: 'Baycaner Beach Resort',
      slug: {_type: 'slug', current: 'baycaner-beach-resort-mayaguana'},
      shortDescription: 'Officially mapped accommodation lead in Pirate’s Well, Mayaguana. Current availability and feature-level physical accessibility require direct confirmation.',
      address: 'Baycaner Avenue, Pirate’s Well, Mayaguana, The Bahamas (CVMX+W78)',
      website: 'https://www.bahamas.com/hotels/baycaner-beach-resort',
      active: false,
      channels: [],
      seo: {_type: 'seo', metaTitle: 'Baycaner Beach Resort', metaDescription: 'Review draft for a mapped Mayaguana accommodation; availability and physical accessibility remain under review.'},
    },
    'Official map pin: 22.434536842839, -73.10189679265; operator plus code: CVMX+W78. April 2026 use is corroborated. The self-signed direct domain is not the traveler link; availability and accessibility details remain gated.',
  ),
  createPlaceReviewDraft(
    '96abb6cc-3c1e-47d9-9156-eea0d8110451',
    {
      title: "Enrica's Inn",
      slug: {_type: 'slug', current: 'enricas-inn-inagua'},
      shortDescription: 'Officially mapped accommodation lead in Matthew Town, Inagua. Current operation, availability, and feature-level physical accessibility require direct confirmation.',
      address: 'Victory & Taylor Streets, Matthew Town, Inagua, The Bahamas',
      website: 'https://www.bahamas.com/hotels/enricas-inn',
      active: false,
      channels: [],
      seo: {_type: 'seo', metaTitle: "Enrica's Inn", metaDescription: 'Review draft for a mapped Inagua accommodation; operation and physical accessibility remain under review.'},
    },
    'Official map pin: 20.945487474536, -73.675195508451. The current listing says Victory & Taylor; the 2025 directory says Victory & Matthew. Keep that address conflict open. The expired-certificate direct domain remains omitted.',
  ),
  createPlaceReviewDraft(
    'dc5fb048-5231-4111-8ff9-8e17873accd0',
    {
      title: 'Ocean View Restaurant & Bar',
      slug: {_type: 'slug', current: 'ocean-view-restaurant-bar-rum-cay'},
      shortDescription: 'Officially mapped restaurant lead on Pearl Street in Port Nelson, Rum Cay. Current operation, hours, payment arrangements, and physical accessibility require confirmation.',
      address: 'Pearl Street, Port Nelson, Rum Cay, The Bahamas',
      website: 'https://www.bahamas.com/plan-your-trip/restaurants/ocean-view-restaurant-bar',
      active: false,
      channels: [],
      openingHours: '',
      seo: {_type: 'seo', metaTitle: 'Ocean View Restaurant & Bar', metaDescription: 'Review draft for a mapped Rum Cay restaurant; operation, hours, and accessibility remain under review.'},
    },
    'Official map pin: 23.650244, -74.840713 at Pearl Street. The map record dates to 2020, so hours and operation remain unverified. Published hours are intentionally excluded pending direct recheck.',
  ),
]

const seedPath = `${outputBase}-sanity-seed.ndjson`
const placeReviewSeedPath = `${outputBase}-place-review-drafts.ndjson`
const researchReviewSeedPath = `${outputBase}-research-review-updates.ndjson`
const shelterGovernanceSeedPath = `${outputBase}-shelter-governance-updates.ndjson`
const researchReviewUpdateIds = new Set([
  'drafts.island-fact-deep-research-baycaner-operator-reconciliation-mayaguana',
])
const researchReviewUpdateDocs = factDocs.filter((item) => researchReviewUpdateIds.has(item._id))
fs.writeFileSync(seedPath, [...sourceDocs, ...factDocs, ...auditDocs, ...deepAuditDocs, ...operatorAuditDocs, ...catalogAdjudicationAuditDocs, ...coordinateClosureAuditDocs, ...operationEvidenceAuditDocs, ...medicalAccessAuditDocs, ...emergencyReadinessAuditDocs, ...seasonalityWeatherAuditDocs, ...accessTransportAuditDocs, ...scheduledAirOperatorAuditDocs, ...scheduledMarineOperatorAuditDocs, ...licensedArrivalGroundTransferAuditDocs, ...policeResponseFacilityAuditDocs, ...marineSearchRescueAuditDocs, ...airportFireEmsFacilityAuditDocs, ...hurricaneShelterFacilityAuditDocs, ...shelterGovernanceAuditDocs, ...airTransportAccessibilityAuditDocs, ...localAuthorityAuditDocs, ...emergencyFacilityDraftDocs, ...placeReviewDraftDocs].map((item) => JSON.stringify(item)).join('\n') + '\n')
fs.writeFileSync(placeReviewSeedPath, placeReviewDraftDocs.map((item) => JSON.stringify(item)).join('\n') + '\n')
fs.writeFileSync(researchReviewSeedPath, researchReviewUpdateDocs.map((item) => JSON.stringify(item)).join('\n') + '\n')
fs.writeFileSync(shelterGovernanceSeedPath, shelterGovernanceAuditDocs.map((item) => JSON.stringify(item)).join('\n') + '\n')

const baseline = {
  generatedAt: new Date().toISOString(),
  snapshotDate: checkedAt,
  methodology: {
    scope: 'Public/editorial content only; no traveler, booking, payment, partner-private, or auth data.',
    grain: 'One row per canonical island group. Each source table is counted separately before joining on the destination reference.',
    score: '0 missing; 1 weak or uncited; 2 sourced but incomplete/stale; 3 strong, current, and corroborated.',
    confidence: 'Needs revision until public place inventory is verified and all P0 gaps close.',
  },
  totals: {
    islands: rows.length,
    canonicalPlaces: rows.reduce((sum, row) => sum + row.canonicalPlaces, 0),
    activePlaceCandidates: rows.reduce((sum, row) => sum + row.activePlaceCandidates, 0),
    inBoundsActivePlaceCandidates: rows.reduce((sum, row) => sum + row.inBoundsActivePlaceCandidates, 0),
    activeLocationIssues: rows.reduce((sum, row) => sum + row.activeLocationIssues, 0),
    verifiedPlaces: rows.reduce((sum, row) => sum + row.verifiedPlaces, 0),
    launchReadyPlaces: rows.reduce((sum, row) => sum + row.launchReadyPlaces, 0),
    describedPlaces: rows.reduce((sum, row) => sum + row.describedPlaces, 0),
    placesWithMedia: rows.reduce((sum, row) => sum + row.placesWithMedia, 0),
    researchSourcesSeeded: sourceDocs.length,
    draftFactsSeeded: factDocs.length,
    draftAuditsSeeded: auditDocs.length + deepAuditDocs.length + operatorAuditDocs.length + catalogAdjudicationAuditDocs.length + coordinateClosureAuditDocs.length + operationEvidenceAuditDocs.length + medicalAccessAuditDocs.length + emergencyReadinessAuditDocs.length + seasonalityWeatherAuditDocs.length + accessTransportAuditDocs.length + scheduledAirOperatorAuditDocs.length + scheduledMarineOperatorAuditDocs.length + licensedArrivalGroundTransferAuditDocs.length + policeResponseFacilityAuditDocs.length + marineSearchRescueAuditDocs.length + airportFireEmsFacilityAuditDocs.length + hurricaneShelterFacilityAuditDocs.length + shelterGovernanceAuditDocs.length + airTransportAccessibilityAuditDocs.length + localAuthorityAuditDocs.length,
    emergencyFacilityDraftsSeeded: emergencyFacilityDraftDocs.length,
    placeReviewDraftsSeeded: placeReviewDraftDocs.length,
  },
  islands: rows,
}
fs.writeFileSync(`${outputBase}.json`, JSON.stringify(baseline, null, 2) + '\n')

const matrix = rows.map((row) => `| ${row.name} | ${row.evidenceScore.toFixed(2)} | ${row.inBoundsActivePlaceCandidates}/${row.floor} | ${row.activeLocationIssues} | ${row.describedPlaces} | ${row.placesWithMedia} | ${row.faqs} | ${row.articles + row.guidedTours + row.itineraries} | ${row.gaps.filter((item) => item.priority === 'p0').map((item) => item.title).join('; ')} |`).join('\n')
const markdown = `# Island Information Research Baseline\n\n**Snapshot:** ${checkedAt}  \n**Validation verdict:** Needs revision\n\n## Outcome\n\nAll 16 canonical island groups have destination documents, but none is ready to be described as a solid, verified repository. The current place inventory contains ${baseline.totals.canonicalPlaces} canonical candidates (${baseline.totals.activePlaceCandidates} active), but only ${baseline.totals.inBoundsActivePlaceCandidates} active candidates fall inside their assigned island review bounds. There are ${baseline.totals.activeLocationIssues} active location failures, ${baseline.totals.verifiedPlaces} verified records, and ${baseline.totals.launchReadyPlaces} launch-ready records. Existing editorial volume is useful for discovery, not proof.\n\nThis baseline adds a source registry, draft facts, and per-island audit documents to Sanity so evidence, confidence, freshness, and gaps can be managed separately from traveler-facing copy.\n\n## Scoring\n\n- **0 — missing:** no usable evidence.\n- **1 — weak or uncited:** content/candidates exist but have not passed evidence and quality gates.\n- **2 — sourced but incomplete/stale:** a primary source exists, but corroboration, operational checks, or editorial review remain.\n- **3 — strong and current:** corroborated, date-reviewed, quality-clean, and approved.\n\n## Current gap matrix\n\n| Island group | Evidence /3 | In-bounds active / floor | Active location failures | Described places | Places with media | Linked FAQs | Guides/tours/plans | P0 gaps |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n${matrix}\n\n## Source hierarchy\n\n1. Government, regulator, national tourism authority, conservation authority, airport/port authority.\n2. Current carrier, ferry, venue, attraction, or accommodation operator for operational facts.\n3. Industry bodies and locally accountable organizations for corroboration.\n4. Reputable independent editorial sources for discovery and triangulation, never as the only source for high-risk facts.\n5. Reviews and social content are leads and traveler sentiment only; they do not establish identity, safety, access, or operation.\n\n## Freshness rules\n\n| Fact class | Maximum review window | Examples |\n|---|---:|---|\n| Stable | 24 months | Geography, established history, enduring cultural context |\n| Seasonal | 6 months | Typical seasonal guidance, recurring events, wildlife timing |\n| Operational | 30–90 days | Routes, ferry patterns, opening arrangements, access constraints |\n| Live | Runtime only | Price, availability, weather, schedule status, closures |\n\n## Methodology and caveats\n\nThe source snapshot was rebuilt from the fixed public/editorial Supabase table list used by the Sanity migration and merged with current Sanity documents. Place quality was then recomputed directly from the current canonical place rows using the same generous island-review bounds as the Admin publication gate. Counts were computed separately at the place, FAQ, guide, tour, itinerary, and destination grains before joining by canonical destination ID. No private traveler, booking, payment, or authentication data was read.\n\nA populated field is not treated as verified. Imported “last reviewed” dates indicate migration timing unless a source-level review record exists. Place candidates remain blocked until identity, location, description, rights-cleared media, and verification gates pass.\n\n## Next research order\n\n1. P0 remote-island truth: Mayaguana, Ragged Island, Rum Cay, Inagua, and Acklins & Crooked Island.\n2. P0 catalog quality: identity, coordinates, descriptions, media rights, and verification for every island.\n3. Current access: carrier/ferry/airport/port sources, with operational review dates.\n4. Safety and accessibility guidance from responsible authorities.\n5. Editorial depth: island FAQs, practical guides, food/culture context, and itineraries only after facts are approved.\n`
fs.writeFileSync(`${outputBase}.md`, markdown)

console.log(JSON.stringify({inputPath, baselineJson: `${outputBase}.json`, baselineMarkdown: `${outputBase}.md`, sanitySeed: seedPath, placeReviewSeed: placeReviewSeedPath, researchReviewSeed: researchReviewSeedPath, shelterGovernanceSeed: shelterGovernanceSeedPath, totals: baseline.totals}, null, 2))
