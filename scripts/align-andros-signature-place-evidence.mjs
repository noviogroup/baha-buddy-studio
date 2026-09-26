import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_ANDROS_SIGNATURE_PLACE_EVIDENCE === '1'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'
const nextStableReviewAt = '2027-08-05'
const outputPath = '/private/tmp/baha-buddy-andros-signature-place-evidence-plan.json'
const destinationId = 'dest-andros'

const sourceIds = {
  androsProfile: 'research-source-bmot-andros',
  barrierTourism: 'research-source-bmot-andros-barrier-reef',
  androsiaRoot: 'research-source-operator-androsia',
  androsiaContact: 'research-source-operator-androsia-contact-2026',
  androsiaLegacyHours: 'research-source-operator-androsia-hours-legacy-2026',
  blueHoles: 'research-source-bnt-blue-holes-andros',
  blueHolesBoundary: 'research-source-bnt-blue-holes-boundary-map',
  bntAndros: 'research-source-bnt-andros',
  westSide: 'research-source-bnt-andros-west-side-national-park',
  westSideBoundary: 'research-source-bnt-west-side-boundary-map',
  marineParks: 'research-source-bnt-andros-north-south-marine-parks',
}

const placeIds = {
  barrier: 'drafts.place-supabase-2a219b40-3191-49df-b8a2-5aef332ee442',
  androsia: 'drafts.place-supabase-08ee2b46-fb82-4920-9092-5b440a695391',
  blueHoles: 'drafts.place-supabase-5935503a-cea3-4cec-95ac-8dd47bf6a76b',
}

const candidateId = 'drafts.canonical-place-candidate-andros-west-side-national-park'
const factIds = {
  barrier: 'drafts.island-fact-matched-signature-readiness-andros-barrier-reef-andros',
  androsia: 'drafts.island-fact-matched-signature-readiness-androsia-batik-factory-andros',
  blueHoles: 'drafts.island-fact-matched-signature-readiness-blue-holes-national-park-andros',
  westSide: 'drafts.island-fact-signature-identity-readiness-west-side-national-park-andros',
  westSideAccess: 'drafts.island-fact-canonical-candidate-west-side-national-park-access-boundary-andros',
}

const auditIds = {
  catalog: 'drafts.island-research-audit-2026-08-05-signature-place-catalog-andros',
  canonicalCandidates: 'drafts.island-research-audit-2026-08-05-signature-place-canonical-candidates-andros',
  identityReadiness: 'drafts.island-research-audit-2026-08-05-signature-place-identity-readiness-andros',
  matchedReadiness: 'drafts.island-research-audit-2026-08-05-signature-place-matched-readiness-andros',
  contentReadiness: 'drafts.island-research-audit-2026-08-05-signature-place-content-readiness-andros',
  sourceFreshness: 'drafts.island-research-audit-2026-08-05-source-freshness-owner-cadence-andros',
}

const urls = {
  androsiaRoot: 'https://androsia.com/',
  androsiaContact: 'https://androsia.com/pages/contact',
  androsiaLegacyHours: 'https://www.androsia.com/contact.html',
  blueHoles: 'https://bnt.bs/explore/andros/blue-holes-national-park/',
  blueHolesBoundary: 'https://www.google.com/maps/d/kml?mid=1Zn_-hMyhdQcAztZ-EzNjO9N3LcU&forcekml=1',
  blueHolesBoundaryView: 'https://www.google.com/maps/d/viewer?mid=1Zn_-hMyhdQcAztZ-EzNjO9N3LcU',
  westSide: 'https://bnt.bs/explore/andros/west-side-national-park/',
  westSideBoundary: 'https://www.google.com/maps/d/kml?mid=14_R30lu3oVfJPIdVh4ZDT1AYcUw&forcekml=1',
  westSideBoundaryView: 'https://www.google.com/maps/d/viewer?mid=14_R30lu3oVfJPIdVh4ZDT1AYcUw',
  marineParks: 'https://bnt.bs/explore/andros/northsouthmarinepark/',
  northMarineBoundary: 'https://www.google.com/maps/d/kml?mid=1io0EsCfiSnpx3eH6BcSa5IHgQJ0&forcekml=1',
  southMarineBoundary: 'https://www.google.com/maps/d/kml?mid=11oxe4mOyYmEn4UTCAPC4ZdQOk70&forcekml=1',
  barrierTourism: 'https://www.bahamas.com/natural-wonders/andros-barrier-reef',
}

async function fetchText(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy Content Operations source verifier'}})
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

let androsiaLegacyStatus = null
async function fetchAndrosiaLegacyPage(url) {
  const response = await fetch(url, {headers: {'user-agent': 'Baha Buddy Content Operations source verifier'}})
  androsiaLegacyStatus = response.status
  if (![200, 404, 410].includes(response.status)) throw new Error(`${url} returned unexpected status ${response.status}`)
  return response.text()
}

function signals(text, tests) {
  return Object.fromEntries(Object.entries(tests).map(([label, test]) => [label, typeof test === 'boolean' ? test : typeof test === 'function' ? test(text) : test.test(text)]))
}

function coordinates(kml) {
  return [...kml.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+),0/g)].map((match) => ({longitude: Number(match[1]), latitude: Number(match[2])}))
}

function pointInsidePolygon(point, vertices) {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index++) {
    const currentPoint = vertices[index]
    const previousPoint = vertices[previous]
    const intersects = ((currentPoint.latitude > point.latitude) !== (previousPoint.latitude > point.latitude)) &&
      point.longitude < ((previousPoint.longitude - currentPoint.longitude) * (point.latitude - currentPoint.latitude)) /
        (previousPoint.latitude - currentPoint.latitude) + currentPoint.longitude
    if (intersects) inside = !inside
  }
  return inside
}

function reference(id, keyPrefix = 'source') {
  return {_type: 'reference', _key: `${keyPrefix}-${id}`.slice(0, 96), _ref: id}
}

function sourceReferences(ids, keyPrefix = 'source') {
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

function reviewPlan({cadenceDays, relationship, method = 'webpage_review', freshnessStatus = 'current', workflowStatus = 'scheduled', reviewScope, nextAction, triggers}) {
  const cadenceBand = cadenceDays === 30 ? '30_day' : cadenceDays === 90 ? '90_day' : cadenceDays === 180 ? '180_day' : 'annual'
  return {
    _type: 'researchSourceReviewPlan',
    plannedAt: checkedAt,
    reviewOwner: 'Baha Buddy Content Operations',
    workflowStatus,
    freshnessStatus,
    cadenceBand,
    cadenceDays,
    sourceRelationship: relationship,
    verificationMethod: method,
    changeTriggers: triggers,
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

const [androsiaRootHtml, androsiaContactHtml, androsiaLegacyHoursHtml, blueHolesHtml, blueHolesKml, westSideHtml, westSideKml, marineParksHtml, northMarineKml, southMarineKml, barrierTourismHtml] = await Promise.all([
  fetchText(urls.androsiaRoot),
  fetchText(urls.androsiaContact),
  fetchAndrosiaLegacyPage(urls.androsiaLegacyHours),
  fetchText(urls.blueHoles),
  fetchText(urls.blueHolesBoundary),
  fetchText(urls.westSide),
  fetchText(urls.westSideBoundary),
  fetchText(urls.marineParks),
  fetchText(urls.northMarineBoundary),
  fetchText(urls.southMarineBoundary),
  fetchText(urls.barrierTourism),
])

const sourceSignals = {
  androsiaRoot: signals(androsiaRootHtml, {
    factoryIdentity: /Androsia (?:Batik )?Factory/i,
    locationCode: /P6C7\+VX5/i,
    directPhone: /242[-\s)]*376[-\s]*9339/i,
  }),
  androsiaContact: signals(androsiaContactHtml, {
    factoryIdentity: /Androsia Factory/i,
    locationCode: /P6C7\+VX5/i,
    directPhone: /242[-\s)]*376[-\s]*9339/i,
  }),
  androsiaLegacyHours: signals(androsiaLegacyHoursHtml, {
    unavailableStatus: [404, 410].includes(androsiaLegacyStatus),
    currentHoursNotRecoverable: !/Monday\s*-\s*Friday/i.test(androsiaLegacyHoursHtml) && !/9\.30\s*am\s*-\s*4\s*pm/i.test(androsiaLegacyHoursHtml),
  }),
  blueHoles: signals(blueHolesHtml, {
    temporaryClosure: /Closed temporarily/i,
    boardwalksTrails: /Boardwalks and Trails/i,
    restrooms: /Restrooms/i,
    boundaryMapEmbedded: /1Zn_-hMyhdQcAztZ-EzNjO9N3LcU/,
  }),
  blueHolesBoundary: signals(blueHolesKml, {
    officialAreaName: /AREANAM Blue Holes National Park/i,
    bntAgency: /AGENCY Bahamas National Trust/i,
    polygon: /<Polygon>/i,
    noPoint: (value) => !/<Point>/i.test(value),
  }),
  westSide: signals(westSideHtml, {
    boatOnly: /Only accessible by boat/i,
    littleInfrastructure: /little infrastructure/i,
    noGuard: /no one on guard/i,
    boundaryMapEmbedded: /14_R30lu3oVfJPIdVh4ZDT1AYcUw/,
  }),
  westSideBoundary: signals(westSideKml, {
    officialAreaName: /Westside National Park/i,
    polygon: /<Polygon>/i,
    noPoint: (value) => !/<Point>/i.test(value),
  }),
  marineParks: signals(marineParksHtml, {
    distinctReefAreas: /two distinct areas of the Andros barrier reef/i,
    activeWarden: /active warden/i,
    boatOnly: /Only accessible by boat/i,
    noTake: /no-take zone/i,
    responsibleProviderLeads: /Small Hope Bay Lodge/i.test(marineParksHtml) && /Forfar Field Station/i.test(marineParksHtml),
  }),
  northMarineBoundary: signals(northMarineKml, {
    officialAreaName: /AREANAM Northern Marine Park/i,
    polygon: /<Polygon>/i,
    noPoint: (value) => !/<Point>/i.test(value),
  }),
  southMarineBoundary: signals(southMarineKml, {
    officialAreaName: /AREANAM Southern Marine Park/i,
    polygon: /<Polygon>/i,
    noPoint: (value) => !/<Point>/i.test(value),
  }),
  barrierTourism: signals(barrierTourismHtml, {
    barrierIdentity: /Andros Barrier Reef/i,
    mismatchedContactLabel: /Harbour Island Tourist Office/i,
    relatedOperatorEmail: /shbinfo@smallhope\.com/i,
  }),
}

const flatSignals = Object.values(sourceSignals).flatMap((group) => Object.values(group))
if (flatSignals.some((value) => !value)) throw new Error(`Official source signals changed: ${JSON.stringify(sourceSignals)}`)

const blueVertices = coordinates(blueHolesKml)
const westVertices = coordinates(westSideKml)
const northMarineVertices = coordinates(northMarineKml)
const southMarineVertices = coordinates(southMarineKml)
const geometryEvidence = {
  blueHoles: {
    vertexCount: blueVertices.length,
    currentSupabasePointInsideBoundary: pointInsidePolygon({latitude: 24.74237, longitude: -77.86193}, blueVertices),
    mapContainsPointFeature: /<Point>/i.test(blueHolesKml),
  },
  westSide: {
    vertexCount: westVertices.length,
    mapContainsPointFeature: /<Point>/i.test(westSideKml),
  },
  marineProtectedSubsets: {
    northernVertexCount: northMarineVertices.length,
    southernVertexCount: southMarineVertices.length,
    currentSupabasePointInsideNorthernSubset: pointInsidePolygon({latitude: 24.7, longitude: -77.7667}, northMarineVertices),
    currentSupabasePointInsideSouthernSubset: pointInsidePolygon({latitude: 24.7, longitude: -77.7667}, southMarineVertices),
    mapsContainPointFeature: /<Point>/i.test(northMarineKml) || /<Point>/i.test(southMarineKml),
  },
}

const live = await client.fetch(`{
  "destination": *[_id == $destinationId][0]{...},
  "sources": *[_id in $allSourceIds] | order(_id asc){...},
  "places": *[_id in $placeIds] | order(_id asc){...},
  "candidate": *[_id == $candidateId][0]{...},
  "facts": *[_id in $factIds] | order(_id asc){...},
  "audits": *[_id in $auditIds] | order(_id asc){...},
  "androsRoutedSourceIds": *[_type == "researchSource" && $destinationId in destinations[]._ref]._id,
  "publishedResearchFacts": count(*[_type == "islandFact" && !(_id match "drafts.*")]),
  "androsFactDraftsWithChannels": count(*[_type == "islandFact" && _id match "drafts.*" && destination._ref == $destinationId && count(channels) > 0])
}`, {
  destinationId,
  allSourceIds: Object.values(sourceIds),
  placeIds: Object.values(placeIds),
  candidateId,
  factIds: Object.values(factIds),
  auditIds: Object.values(auditIds),
})

if (!live.destination || live.destination._id !== destinationId) throw new Error('Canonical Andros destination missing')
if (live.places.length !== 3 || live.facts.length !== 5 || live.audits.length !== 6 || !live.candidate) {
  throw new Error(`Target document count changed: ${JSON.stringify({places: live.places.length, facts: live.facts.length, audits: live.audits.length, candidate: Boolean(live.candidate)})}`)
}
if ([...live.places, ...live.facts, ...live.audits, live.candidate].some((document) => !document._id.startsWith('drafts.'))) throw new Error('Every mutable content target must remain a draft')

const destinationReference = reference(destinationId, 'destination')
const plannedSources = [
  {
    _id: sourceIds.androsiaContact,
    _type: 'researchSource',
    title: 'Androsia Factory — current contact and location code',
    url: urls.androsiaContact,
    publisher: 'Androsia Batik Factory',
    sourceClass: 'operator',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['culture', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current canonical operator contact page names Androsia Factory, supplies location code P6C7+VX5 in Andros Town, and publishes +1 242-376-9339. It does not publish public visitor hours, walk-in or tour arrangements, payment, transport, an entrance coordinate, accessibility, restrooms, sensory support, or media reuse rights.',
    reviewPlan: reviewPlan({
      cadenceDays: 30,
      relationship: 'responsible_or_owning_publisher',
      method: 'webpage_and_responsible_contact',
      triggers: ['operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'publisher_url_or_scope_change'],
      reviewScope: 'Recheck the canonical operator contact page for the exact facility name, public location code, telephone, and any newly published visit arrangement. Keep shopping and shipping claims separate from on-site visitor operation.',
      nextAction: `By ${nextOperationalReviewAt}, recheck the current operator page and confirm public hours, walk-in or tour policy, exact entrance, payment, transport, accessibility, facilities, photography, and closure fallback before traveler delivery.`,
    }),
  },
  {
    _id: sourceIds.androsiaLegacyHours,
    _type: 'researchSource',
    title: 'Androsia Factory — unavailable legacy contact and hours page',
    url: urls.androsiaLegacyHours,
    publisher: 'Androsia Batik Factory',
    sourceClass: 'operator',
    authorityLevel: 'discovery_only',
    destinations: [destinationReference],
    topics: ['culture', 'experiences', 'access'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'unavailable',
    notes: 'The former www operator contact page now returns HTTP 404. A prior review observed an Andros Street address, direct telephone, and weekday office and boutique hours, but those operational claims are no longer recoverable from the URL and the current canonical contact page does not publish hours. Preserve this record only as unavailable provenance; never reuse the historical schedule as current.',
    reviewPlan: reviewPlan({
      cadenceDays: 30,
      relationship: 'primary_source_scope_requires_review',
      method: 'webpage_and_responsible_contact',
      freshnessStatus: 'unavailable_or_rejected',
      workflowStatus: 'replacement_required',
      triggers: ['operation_schedule_or_contact_change', 'publisher_url_or_scope_change', 'access_route_or_restriction_change'],
      reviewScope: 'Retry the unavailable page and seek a current responsible replacement for public visitor hours. The canonical operator page replaces identity, location code, and telephone only; it does not replace the missing schedule.',
      nextAction: `By ${nextOperationalReviewAt}, retry the exact URL and confirm public visitor hours with the operator or a current canonical operator page. Keep hours blank and every delivery channel closed until current schedule evidence is recorded.`,
    }),
  },
  {
    _id: sourceIds.blueHolesBoundary,
    _type: 'researchSource',
    title: 'Blue Holes National Park — BNT embedded boundary map',
    url: urls.blueHolesBoundaryView,
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['nature', 'access'],
    checkedAt,
    nextReviewAt: nextStableReviewAt,
    status: 'active',
    notes: 'The public map embedded on the current BNT park page exports one Blue Holes National Park polygon with BNT agency and boundary metadata. It contains no point feature and does not identify an entrance, trailhead, Captain Bill’s visitor point, safe route, parking area, or currently open facility. Use it to model the park as an area, never to approve a routing point.',
    reviewPlan: reviewPlan({
      cadenceDays: 365,
      relationship: 'responsible_or_owning_publisher',
      method: 'dataset_review',
      triggers: ['publisher_url_or_scope_change', 'protected_area_boundary_or_rule_change', 'access_route_or_restriction_change'],
      reviewScope: 'Re-export the exact map embedded by BNT, confirm that it still identifies a polygon rather than a visitor point, and record any boundary or metadata change. Keep entrance and route evidence separate.',
      nextAction: `By ${nextStableReviewAt}, recheck the embedded map, boundary metadata, and whether BNT has published a distinct entrance or visitor-site point.`,
    }),
  },
  {
    _id: sourceIds.westSideBoundary,
    _type: 'researchSource',
    title: 'West Side National Park — BNT embedded boundary map',
    url: urls.westSideBoundaryView,
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['nature', 'access'],
    checkedAt,
    nextReviewAt: nextStableReviewAt,
    status: 'active',
    notes: 'The public map embedded on the current BNT park page exports Westside National Park as a large polygon with no point feature. It does not identify a public entrance, landing, mooring, route, guide, vessel, or visitor facility. Use it only as area-identity evidence; do not collapse the park into a fabricated POI point.',
    reviewPlan: reviewPlan({
      cadenceDays: 365,
      relationship: 'responsible_or_owning_publisher',
      method: 'dataset_review',
      triggers: ['publisher_url_or_scope_change', 'protected_area_boundary_or_rule_change', 'access_route_or_restriction_change'],
      reviewScope: 'Re-export the exact map embedded by BNT and confirm the park polygon, map ownership context, and absence or presence of any separately published visitor entrance.',
      nextAction: `By ${nextStableReviewAt}, recheck the embedded map and whether BNT has published a visitor-access geometry, landing, mooring, or route distinct from the park boundary.`,
    }),
  },
  {
    _id: sourceIds.marineParks,
    _type: 'researchSource',
    title: 'Andros North & South Marine Parks — managed reef subsets',
    url: urls.marineParks,
    publisher: 'Bahamas National Trust',
    sourceClass: 'conservation',
    authorityLevel: 'primary',
    destinations: [destinationReference],
    topics: ['nature', 'experiences', 'access', 'safety'],
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    status: 'active',
    notes: 'Current managing-authority page identifies the Northern and Southern Marine Parks as two distinct protected areas within the Andros Barrier Reef, reports an active warden, boat-only access, little infrastructure, and no-take rules, and names Small Hope Bay Lodge and Forfar Field Station as diving-experience leads. This authority is limited to the protected subsets; it does not make the entire reef one site, prove any provider is available, or establish an exact dive point, vessel, conditions, emergency plan, accessibility, or media rights.',
    reviewPlan: reviewPlan({
      cadenceDays: 30,
      relationship: 'responsible_or_owning_publisher',
      method: 'webpage_and_responsible_contact',
      triggers: ['protected_area_boundary_or_rule_change', 'operation_schedule_or_contact_change', 'access_route_or_restriction_change', 'safety_emergency_or_activation_change'],
      reviewScope: 'Recheck the BNT-managed reef subsets, active-warden statement, boat-only and no-take rules, and the scope of any operator lead. Do not generalize protected-subset rules or operations to the full reef.',
      nextAction: `By ${nextOperationalReviewAt}, recheck BNT rules and operation, then verify the exact protected area or dive site, responsible licensed provider, vessel, conditions, qualifications, supervision, emergency capability, accessibility, and booking route.`,
    }),
  },
]

const liveSourceById = new Map(live.sources.map((source) => [source._id, source]))
const newSourcePlans = plannedSources.map((source) => ({source, needsUpsert: differs(liveSourceById.get(source._id), source)}))

const sourceUpdatePlans = [
  {
    id: sourceIds.androsiaRoot,
    fields: {
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      notes: 'Current canonical operator site confirms the continuing Androsia Factory identity and handmade-batik operation and publishes an Andros Town location code plus direct telephone. The former www contact-and-hours page now returns 404, and the canonical page publishes no hours. Use the separate current-contact and unavailable-provenance records; replace the schedule evidence before traveler delivery.',
    },
  },
  {
    id: sourceIds.blueHoles,
    fields: {
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      notes: 'Current managing-authority park page still marks Blue Holes National Park temporarily closed. It publishes boardwalk, trail, restroom, arranged-guide, and freshwater-buoyancy context and embeds an area-boundary map. The map does not establish an entrance or approved routing point. Recheck reopening and visitor-facility status before any recommendation.',
    },
  },
]

for (const update of sourceUpdatePlans) {
  const current = liveSourceById.get(update.id)
  if (!current) throw new Error(`Missing existing source: ${update.id}`)
  update.current = current
  update.needsUpdate = differs(Object.fromEntries(Object.keys(update.fields).map((key) => [key, current[key]])), update.fields)
}

const placeById = new Map(live.places.map((place) => [place._id, place]))
const factById = new Map(live.facts.map((fact) => [fact._id, fact]))
const auditById = new Map(live.audits.map((audit) => [audit._id, audit]))

const placeFields = {
  [placeIds.barrier]: {
    evidenceSources: mergeReferences(placeById.get(placeIds.barrier).evidenceSources, [sourceIds.marineParks], 'andros-pilot-source'),
    catalogLocationReview: {
      _type: 'placeLocationReview',
      checkedAt,
      reconciliationStatus: 'area_identity_no_point',
      evidenceSources: sourceReferences([sourceIds.barrierTourism, sourceIds.marineParks], 'location-source'),
      locationConfidence: 'medium',
      operationEvidenceStatus: 'current_managing_authority',
      accessEvidenceStatus: 'current_responsible_source',
      reviewDecision: 'not_applicable',
      notes: 'The whole Andros Barrier Reef is a distributed natural area, not one venue or route point. BNT separately manages two protected reef subsets, each represented by a polygon rather than a point; the current Supabase point is not inside either protected-subset polygon, which does not prove it is outside the much larger reef. The tourism page identifies the reef but its contact block is internally mismatched. Keep the current point unapproved and require an exact dive/snorkel site plus responsible licensed operator at runtime.',
    },
    catalogTravelerReadinessReview: {
      ...placeById.get(placeIds.barrier).catalogTravelerReadinessReview,
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      sources: sourceReferences([sourceIds.barrierTourism, sourceIds.androsProfile, sourceIds.marineParks], 'source'),
      notes: 'National tourism identifies the whole reef, while BNT manages two distinct protected subsets with an active warden, boat-only access, little infrastructure, and no-take rules. BNT names Small Hope Bay Lodge and Forfar Field Station only as experience leads, not guaranteed availability. Keep the reef area-based; select the exact site and responsible licensed operator at runtime and confirm vessel, rules, qualifications, supervision, equipment, weather and sea conditions, emergency capability, accessibility, and booking.',
    },
    catalogReviewNotes: 'The normalized official and catalog names match, but a reef system is an area identity rather than one routing point. Current BNT evidence distinguishes two managed protected subsets and does not validate the existing Supabase point as a site, mooring, or entrance. The tourism page contact block is internally mismatched. No coordinate is accepted; current operation, exact site, responsible provider, safety, accessibility, copy, media rights, and delivery remain blocked.',
    reviewedAt: checkedAt,
  },
  [placeIds.androsia]: {
    address: 'P6C7+VX5, Andros Town, Bahamas',
    website: 'https://androsia.com/',
    phone: '+1 242-376-9339',
    openingHours: '',
    evidenceSources: mergeReferences(placeById.get(placeIds.androsia).evidenceSources, [sourceIds.androsiaContact, sourceIds.androsiaLegacyHours], 'andros-pilot-source'),
    catalogLocationReview: {
      _type: 'placeLocationReview',
      checkedAt,
      reconciliationStatus: 'official_identity_source_no_point',
      evidenceSources: sourceReferences([sourceIds.androsiaContact], 'location-source'),
      locationConfidence: 'medium',
      operationEvidenceStatus: 'current_responsible_operator',
      accessEvidenceStatus: 'current_responsible_source',
      reviewDecision: 'pending',
      notes: 'The current operator supplies location code P6C7+VX5 and Andros Town. This is stronger venue-location evidence, but the source does not publish an explicit geopoint or label a visitor entrance. No plus-code decoding or coordinate is accepted automatically. Confirm the exact entrance and intended routing point with the operator before canonical reconciliation.',
    },
    catalogTravelerReadinessReview: {
      ...placeById.get(placeIds.androsia).catalogTravelerReadinessReview,
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      sources: sourceReferences([sourceIds.androsiaRoot, sourceIds.androsiaContact, sourceIds.androsiaLegacyHours, sourceIds.androsProfile], 'source'),
      notes: 'The current operator confirms the factory identity, Andros Town location code, direct telephone, and continuing operation. The former www contact-and-hours page now returns 404 and the canonical page publishes no hours, so the live schedule remains unverified. Resolve the display name and exact entrance, then verify hours, walk-in or tour policy, payment, transport, step-free access, restrooms, sensory support, photography, and media rights before delivery.',
    },
    catalogReviewNotes: 'The operator identifies the venue as Androsia Factory or Androsia Batik Factory; the Supabase “Works” title remains a source-backed variant. Current operator evidence supplies P6C7+VX5, Andros Town and a direct phone, but no geopoint is accepted. The former hours page now returns 404 and no current public schedule was found. Keep the overlay inactive and channel-free pending exact entrance, live hours, operation, accessibility, copy, media, and editorial approval.',
    reviewedAt: checkedAt,
  },
  [placeIds.blueHoles]: {
    evidenceSources: mergeReferences(placeById.get(placeIds.blueHoles).evidenceSources, [sourceIds.blueHolesBoundary], 'andros-pilot-source'),
    catalogLocationReview: {
      _type: 'placeLocationReview',
      checkedAt,
      reconciliationStatus: 'area_identity_no_point',
      evidenceSources: sourceReferences([sourceIds.blueHoles, sourceIds.blueHolesBoundary], 'location-source'),
      locationConfidence: 'high',
      operationEvidenceStatus: 'current_managing_authority',
      accessEvidenceStatus: 'current_responsible_source',
      reviewDecision: 'not_applicable',
      notes: 'BNT embeds a public polygon for the 40,000-acre park. The current Supabase point falls inside that official boundary, but neither the page nor map labels it as an entrance, trailhead, Captain Bill’s visitor point, parking area, or safe route. Model the park as an area and keep the point unapproved. The managing authority currently reports a temporary closure, so no traveler routing or visit recommendation is allowed.',
    },
    catalogTravelerReadinessReview: {
      ...placeById.get(placeIds.blueHoles).catalogTravelerReadinessReview,
      checkedAt,
      nextReviewAt: nextOperationalReviewAt,
      sources: sourceReferences([sourceIds.blueHoles, sourceIds.blueHolesBoundary, sourceIds.bntAndros], 'source'),
      notes: 'BNT still marks the park temporarily closed and separately publishes boardwalk, trail, restroom, arranged-guide, and freshwater-buoyancy context. Its embedded map establishes an area boundary, not an entrance. Do not recommend a visit while closure remains. Recheck reopening, affected facilities and trailheads, authority conditions, water-entry rules, supervision, emergency readiness, feature-level accessibility, and the intended routing geometry.',
    },
    catalogReviewNotes: 'The official and catalog names match. Current BNT map evidence confirms a park polygon and shows that the current Supabase point is within the boundary, but not that it is a visitor entrance or route target. BNT still reports the park temporarily closed. No point is accepted; reopening, entrance purpose, safety, accessibility, copy, media rights, and delivery remain blocked.',
    reviewedAt: checkedAt,
  },
}

const placePlans = Object.entries(placeFields).map(([id, fields]) => {
  const current = placeById.get(id)
  if (!current) throw new Error(`Missing place: ${id}`)
  return {id, current, fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields)}
})

const candidateFields = {
  identityEvidence: mergeReferences(live.candidate.identityEvidence, [sourceIds.westSideBoundary], 'andros-pilot-source'),
  locationReview: {
    ...live.candidate.locationReview,
    checkedAt,
    evidenceSources: sourceReferences([sourceIds.androsProfile, sourceIds.westSide, sourceIds.westSideBoundary], 'location-source'),
    locationConfidence: 'high',
    notes: 'BNT identifies West Side National Park as a very large western-Andros wilderness and embeds a polygon with no point feature. This establishes an area identity, not a public entrance or routing point. The park remains boat-only, with little infrastructure and no on-site guard. A future canonical record needs an area or polygon model plus separately verified responsible vessel, route, landing or mooring, rules, conditions, emergency plan, and accessibility; no point may be fabricated.',
  },
  travelerReadinessReview: {
    ...live.candidate.travelerReadinessReview,
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    sources: sourceReferences([sourceIds.androsProfile, sourceIds.westSide, sourceIds.westSideBoundary], 'source'),
    notes: 'The managing conservation authority identifies a 1.5-million-acre wilderness park and supplies an area polygon, while reporting boat-only access, little infrastructure, no trails, and no on-site guard. Confirm BNT permission and rules, a responsible licensed vessel or guide, route and landing or mooring, tides and weather, communications and emergency plan, accessibility, protected-area conduct, and a non-point canonical model.',
  },
  reviewedAt: checkedAt,
  reviewNotes: 'The official West Side National Park identity remains absent from Supabase. BNT now supplies an embedded polygon, strengthening the area model while confirming that no single entrance point is published. A separate approved Supabase change would still need a supported area or polygon model, duplicate and category review, operation, access, safety, accessibility, sourced copy, media rights, and consumer-delivery approval. No coordinate, activation, publication, or channel is approved here.',
}
const candidateNeedsUpdate = differs(Object.fromEntries(Object.keys(candidateFields).map((key) => [key, live.candidate[key]])), candidateFields)

const factFields = {
  [factIds.barrier]: {
    title: 'Andros Barrier Reef: area, managed-subset, and access boundary',
    topic: 'access',
    claim: 'National tourism identifies the whole Andros Barrier Reef as a natural feature. The Bahamas National Trust separately manages Northern and Southern Marine Parks in two distinct parts of the reef and currently reports an active warden, boat-only access, little infrastructure, and no-take rules in those protected subsets. The tourism page contact block is internally mismatched and is not treated as a responsible reef operator.',
    travelerGuidance: 'Do not treat the reef as one point or apply protected-subset rules to the entire reef without checking scope. Select an exact dive or snorkel site and a responsible licensed operator, then verify park rules, vessel, qualifications, supervision, equipment, weather and sea conditions, emergency capability, accessibility, booking, and current availability.',
    sources: sourceReferences([sourceIds.barrierTourism, sourceIds.androsProfile, sourceIds.marineParks], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'Source-verified internal boundary only. BNT authority applies to two protected subsets, not the full reef. No point, provider availability, safety guarantee, media right, or delivery decision is inferred.',
    channels: [],
  },
  [factIds.androsia]: {
    title: 'Androsia Batik Factory: operator identity, contact, and hours boundary',
    topic: 'access',
    claim: 'The current operator identifies Androsia Factory in Andros Town, publishes location code P6C7+VX5 and +1 242-376-9339, and confirms continuing handmade-batik operation. The former www contact-and-hours page now returns 404, and no current public visitor hours were found on the canonical operator site.',
    travelerGuidance: 'Treat the location and phone as reviewable operator evidence, but keep hours blank. Confirm the exact entrance, walk-in or tour policy, live schedule, payment, transport, accessibility, facilities, sensory conditions, photography, and closure fallback before recommending a visit.',
    sources: sourceReferences([sourceIds.androsiaRoot, sourceIds.androsiaContact, sourceIds.androsiaLegacyHours, sourceIds.androsProfile], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'The operator identity, location code, and phone are current. The old schedule source is unavailable, so no historical hours are retained in the editorial field. No coordinate is decoded or accepted.',
    channels: [],
  },
  [factIds.blueHoles]: {
    title: 'Blue Holes National Park: closure and area-boundary evidence',
    topic: 'safety',
    claim: 'The Bahamas National Trust currently marks Blue Holes National Park temporarily closed and publishes boardwalk, trail, restroom, arranged-guide, and freshwater-buoyancy context. Its embedded public map supplies a park polygon with no point feature. The current Supabase point lies inside the polygon but is not identified as an entrance, trailhead, visitor site, or safe route.',
    travelerGuidance: 'Do not recommend or route a visit while the closure remains. Recheck reopening and facilities with BNT, and keep the current point unapproved until an accountable entrance or intended area-routing model is separately confirmed.',
    sources: sourceReferences([sourceIds.blueHoles, sourceIds.blueHolesBoundary, sourceIds.bntAndros], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'The polygon supports area identity only. Point-in-polygon is not entrance verification. No reopening, route, water-entry permission, accessibility, media right, or delivery approval is inferred.',
    channels: [],
  },
  [factIds.westSide]: {
    title: 'West Side National Park: area and traveler-readiness boundary',
    topic: 'safety',
    claim: 'The Bahamas National Trust identifies West Side National Park as a roughly 1.5-million-acre western-Andros wilderness and embeds a polygon with no point feature. It currently reports boat-only access, little infrastructure, no trail systems, and no on-site guard.',
    travelerGuidance: 'Do not model the park as one point of interest. Confirm BNT rules, a responsible licensed vessel or guide, route and landing or mooring, tides and weather, supplies, communications, emergency plan, accessibility, protected-area conduct, and a supported area or polygon model before delivery.',
    sources: sourceReferences([sourceIds.androsProfile, sourceIds.westSide, sourceIds.westSideBoundary], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'The BNT polygon strengthens the area identity but does not establish a visitor entrance or safe route. No point, operation guarantee, media right, or delivery decision is inferred.',
    channels: [],
  },
  [factIds.westSideAccess]: {
    title: 'West Side National Park: wilderness, boundary, and access model',
    topic: 'access',
    claim: 'The Bahamas National Trust currently describes West Side National Park as a roughly 1.5-million-acre wilderness area with little infrastructure, no trails, no on-site guard, and boat-only access. Its embedded public map supplies a park polygon and no point feature.',
    travelerGuidance: 'Use an area or polygon model, not a fabricated entrance point. Confirm a responsible licensed vessel, route and landing or mooring, rules, weather and tides, supplies, communications, accessibility, and emergency readiness before recommending access.',
    sources: sourceReferences([sourceIds.westSide, sourceIds.westSideBoundary], 'source'),
    checkedAt,
    nextReviewAt: nextOperationalReviewAt,
    volatility: 'operational',
    confidence: 'high',
    verificationStatus: 'source_verified',
    editorNotes: 'The map is boundary evidence only. No visitor route, operator availability, landing, coordinate, or delivery decision is approved.',
    channels: [],
  },
}

const factPlans = Object.entries(factFields).map(([id, fields]) => {
  const current = factById.get(id)
  if (!current) throw new Error(`Missing fact: ${id}`)
  return {id, current, fields, needsUpdate: differs(Object.fromEntries(Object.keys(fields).map((key) => [key, current[key]])), fields)}
})

const auditSourceAdditions = {
  [auditIds.catalog]: [sourceIds.androsiaContact, sourceIds.androsiaLegacyHours, sourceIds.blueHolesBoundary, sourceIds.westSideBoundary, sourceIds.marineParks],
  [auditIds.canonicalCandidates]: [sourceIds.westSideBoundary],
  [auditIds.identityReadiness]: [sourceIds.westSideBoundary],
  [auditIds.matchedReadiness]: [sourceIds.androsiaContact, sourceIds.androsiaLegacyHours, sourceIds.blueHolesBoundary, sourceIds.marineParks],
  [auditIds.contentReadiness]: [sourceIds.androsiaContact, sourceIds.androsiaLegacyHours, sourceIds.blueHolesBoundary, sourceIds.westSideBoundary, sourceIds.marineParks],
  [auditIds.sourceFreshness]: [...live.androsRoutedSourceIds, sourceIds.androsiaContact, sourceIds.androsiaLegacyHours, sourceIds.blueHolesBoundary, sourceIds.westSideBoundary, sourceIds.marineParks],
}

const gapActions = {
  [auditIds.canonicalCandidates]: {
    'Canonical-place decision pending: West Side National Park': 'BNT now supplies a park polygon and no point feature. Choose a supported area or polygon model that preserves the identity boundary; separately verify BNT rules, responsible vessel or guide, route, landing or mooring, conditions, emergency readiness, accessibility, copy, and media. Do not fabricate one POI point.',
  },
  [auditIds.identityReadiness]: {
    'Identity-readiness delivery gate remains blocked: West Side National Park': 'Retain the BNT polygon as area evidence only. Confirm BNT rules, a responsible licensed vessel or guide, route and landing or mooring, tides and weather, communications and emergency plan, accessibility, protected-area conduct, and a supported non-point canonical model.',
  },
  [auditIds.matchedReadiness]: {
    'Matched signature-place traveler delivery remains blocked: Andros Barrier Reef': 'Model the full reef as an area and keep the current point unapproved. Select the exact site and responsible licensed operator; verify whether BNT protected-subset rules apply, then confirm vessel, qualifications, supervision, equipment, conditions, emergency capability, accessibility, booking, and current availability.',
    'Matched signature-place traveler delivery remains blocked: Androsia Batik Factory': 'Retain the current operator location code and phone as review evidence; replace the unavailable legacy hours page with current operator schedule evidence, confirm the exact entrance and walk-in or tour policy, then verify payment, transport, accessibility, facilities, sensory support, photography, and media rights.',
    'Matched signature-place traveler delivery remains blocked: Blue Holes National Park': 'Retain the BNT polygon as area evidence and the current point as unapproved. Do not recommend or route a visit while BNT reports a temporary closure; recheck reopening, facilities, accountable entrance, water-entry rules, supervision, emergency readiness, feature-level accessibility, copy, and media rights.',
  },
}

const auditPlans = Object.entries(auditSourceAdditions).map(([id, additions]) => {
  const current = auditById.get(id)
  if (!current) throw new Error(`Missing audit: ${id}`)
  const actions = gapActions[id] || {}
  let nextGaps = (current.gaps || []).map((gap) => actions[gap.title] ? {...gap, action: actions[gap.title], status: gap.status === 'resolved' ? 'resolved' : 'researching'} : gap)
  for (const title of Object.keys(actions)) {
    if (!nextGaps.some((gap) => gap.title === title)) throw new Error(`Missing target gap in ${id}: ${title}`)
  }
  if (id === auditIds.sourceFreshness && !nextGaps.some((gap) => gap.title === 'Replace unavailable source: Androsia Factory — unavailable legacy contact and hours page')) {
    nextGaps = [...nextGaps, {
      _type: 'researchGap',
      _key: 'gap-andros-replace-unavailable-androsia-legacy-hours',
      topic: 'access',
      priority: 'p0',
      title: 'Replace unavailable source: Androsia Factory — unavailable legacy contact and hours page',
      action: `By ${nextOperationalReviewAt}, retry the exact URL and obtain current public visitor hours from the operator or a canonical operator page. The current contact page replaces identity, location code, and telephone only; keep hours blank and delivery blocked until schedule evidence is recorded.`,
      status: 'researching',
    }]
  }
  const nextSources = mergeReferences(current.sources, additions, 'andros-pilot-source')
  const addition = ' The Andros pilot now records current operator contact evidence, an unavailable legacy hours source, BNT area-boundary maps, and managed reef-subset evidence. These improve evidence quality but do not approve a coordinate, canonical write, operation, accessibility, media, or delivery.'
  const nextMethodologyNotes = current.methodologyNotes?.includes('The Andros pilot now records') ? current.methodologyNotes : `${current.methodologyNotes || ''}${addition}`.trim()
  return {
    id,
    current,
    nextGaps,
    nextSources,
    nextMethodologyNotes,
    needsUpdate: differs(current.gaps, nextGaps) || differs(current.sources, nextSources) || current.methodologyNotes !== nextMethodologyNotes,
  }
})

const prospectivePlaces = placePlans.map((plan) => ({...plan.current, ...plan.fields}))
const prospectiveFacts = factPlans.map((plan) => ({...plan.current, ...plan.fields}))
const prospectiveCandidate = {...live.candidate, ...candidateFields}
const prospectiveAudits = auditPlans.map((plan) => ({...plan.current, gaps: plan.nextGaps, sources: plan.nextSources, methodologyNotes: plan.nextMethodologyNotes}))
const openP0Statuses = new Set(['open', 'researching'])
const trackedP0Titles = new Set([
  ...Object.values(gapActions).flatMap((actions) => Object.keys(actions)),
  'Replace unavailable source: Androsia Factory — unavailable legacy contact and hours page',
])

const guardrails = {
  allOfficialSignalsPresent: flatSignals.every(Boolean),
  blueHolesMapIsPolygonWithoutPoint: blueVertices.length >= 4 && geometryEvidence.blueHoles.currentSupabasePointInsideBoundary && !geometryEvidence.blueHoles.mapContainsPointFeature,
  westSideMapIsPolygonWithoutPoint: westVertices.length >= 4 && !geometryEvidence.westSide.mapContainsPointFeature,
  marineMapsArePolygonsWithoutPoints: northMarineVertices.length >= 4 && southMarineVertices.length >= 4 && !geometryEvidence.marineProtectedSubsets.mapsContainPointFeature,
  barrierPointNotPromotedToProtectedSubset: !geometryEvidence.marineProtectedSubsets.currentSupabasePointInsideNorthernSubset && !geometryEvidence.marineProtectedSubsets.currentSupabasePointInsideSouthernSubset,
  allContentTargetsRemainDrafts: [...prospectivePlaces, ...prospectiveFacts, prospectiveCandidate, ...prospectiveAudits].every((document) => document._id.startsWith('drafts.')),
  allFourIdentityReviewsRemainBlocked: [...prospectivePlaces.map((place) => place.catalogTravelerReadinessReview), prospectiveCandidate.travelerReadinessReview].every((review) => review?.deliveryDecision === 'blocked' && review?.overallStatus === 'blocked'),
  noLocationCandidateOrAcceptanceAdded: [...prospectivePlaces.map((place) => place.catalogLocationReview), prospectiveCandidate.locationReview].every((review) => (review?.candidates || []).length === 0 && review?.reviewDecision !== 'accepted'),
  placeOverlaysRemainInactiveAndChannelFree: prospectivePlaces.every((place) => place.active === false && (place.channels || []).length === 0),
  factsRemainSourceVerifiedDraftsWithoutChannels: prospectiveFacts.every((fact) => fact.verificationStatus === 'source_verified' && (fact.channels || []).length === 0 && fact.sources?.length >= 2),
  existingPortfolioHasNoPublishedResearchFacts: live.publishedResearchFacts === 0,
  existingAndrosFactsHaveNoDeliveryChannels: live.androsFactDraftsWithChannels === 0,
  legacyHoursUnavailableAndNotReused: plannedSources.find((source) => source._id === sourceIds.androsiaLegacyHours)?.status === 'unavailable' && plannedSources.find((source) => source._id === sourceIds.androsiaLegacyHours)?.reviewPlan?.workflowStatus === 'replacement_required' && placeFields[placeIds.androsia].openingHours === '',
  blueHolesClosurePreserved: prospectivePlaces.find((place) => place._id === placeIds.blueHoles)?.catalogTravelerReadinessReview?.operationStatus === 'current_responsible_closure' && /temporarily closed/i.test(factFields[factIds.blueHoles].claim),
  everyTargetP0RemainsOpen: prospectiveAudits.flatMap((audit) => audit.gaps || []).filter((gap) => trackedP0Titles.has(gap.title)).every((gap) => gap.priority !== 'p0' || openP0Statuses.has(gap.status)),
}

if (Object.values(guardrails).some((value) => !value)) throw new Error(`Guardrail failed: ${JSON.stringify(guardrails)}`)

const plan = {
  generatedAt: new Date().toISOString(),
  output: outputPath,
  mode: apply ? 'apply' : 'dry_run',
  sourceSignals,
  geometryEvidence,
  counts: {
    sourcesToCreateOrReplace: newSourcePlans.filter((plan) => plan.needsUpsert).length,
    existingSourcesToUpdate: sourceUpdatePlans.filter((plan) => plan.needsUpdate).length,
    placeDraftsToUpdate: placePlans.filter((plan) => plan.needsUpdate).length,
    candidateDraftsToUpdate: Number(candidateNeedsUpdate),
    factDraftsToUpdate: factPlans.filter((plan) => plan.needsUpdate).length,
    auditDraftsToUpdate: auditPlans.filter((plan) => plan.needsUpdate).length,
    targetP0GapsPreserved: prospectiveAudits.flatMap((audit) => audit.gaps || []).filter((gap) => gap.priority === 'p0' && trackedP0Titles.has(gap.title)).length,
  },
  guardrails,
  changes: {
    sourceIds: newSourcePlans.filter((plan) => plan.needsUpsert).map((plan) => plan.source._id),
    existingSourceIds: sourceUpdatePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    placeIds: placePlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    candidateIds: candidateNeedsUpdate ? [candidateId] : [],
    factIds: factPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
    auditIds: auditPlans.filter((plan) => plan.needsUpdate).map((plan) => plan.id),
  },
  boundary: 'This alignment updates only internal research sources plus review-only Sanity drafts for the four Andros signature places. It does not mutate Supabase, create or activate a canonical place, accept or decode coordinates, publish content, add delivery channels, contact an operator or authority, copy media, clear reuse rights, or approve traveler delivery.',
}

fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)

const hasChanges = Object.values(plan.counts).slice(0, 6).some((count) => count > 0)
if (apply && hasChanges) {
  let transaction = client.transaction()
  for (const item of newSourcePlans.filter((entry) => entry.needsUpsert)) transaction = transaction.createOrReplace(item.source)
  for (const item of sourceUpdatePlans.filter((entry) => entry.needsUpdate)) {
    transaction = transaction.patch(item.id, (patch) => patch.ifRevisionId(item.current._rev).set(item.fields))
  }
  for (const item of placePlans.filter((entry) => entry.needsUpdate)) {
    transaction = transaction.patch(item.id, (patch) => patch.ifRevisionId(item.current._rev).set(item.fields))
  }
  if (candidateNeedsUpdate) {
    transaction = transaction.patch(candidateId, (patch) => patch.ifRevisionId(live.candidate._rev).set(candidateFields))
  }
  for (const item of factPlans.filter((entry) => entry.needsUpdate)) {
    transaction = transaction.patch(item.id, (patch) => patch.ifRevisionId(item.current._rev).set(item.fields))
  }
  for (const item of auditPlans.filter((entry) => entry.needsUpdate)) {
    transaction = transaction.patch(item.id, (patch) => patch.ifRevisionId(item.current._rev).set({
      gaps: item.nextGaps,
      sources: item.nextSources,
      methodologyNotes: item.nextMethodologyNotes,
    }))
  }
  const result = await transaction.commit({visibility: 'sync'})
  plan.commit = {transactionId: result.transactionId, documentIds: result.results?.map((item) => item.id) || []}
  fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`)
}

console.log(JSON.stringify(plan, null, 2))
