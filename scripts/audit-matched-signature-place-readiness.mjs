#!/usr/bin/env node

/**
 * Build a read-only traveler-readiness matrix for the 27 official signature
 * identities already matched to Supabase. This script never mutates Supabase
 * or Sanity and does not approve coordinates, copy, media, or delivery.
 */

import fs from 'node:fs'

const signatureSeedPath = process.argv[2] || '/private/tmp/baha-buddy-signature-place-research-sanity-seed.ndjson'
const locationSeedPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-location-research-sanity-seed.ndjson'
const outputPath = process.argv[4] || '/private/tmp/baha-buddy-matched-signature-place-traveler-readiness.json'
const checkedAt = '2026-08-05'
const nextOperationalReviewAt = '2026-09-04'

for (const inputPath of [signatureSeedPath, locationSeedPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

const mapSource = 'research-source-bmot-public-map-dataset'
const specs = [
  {
    placeId: '0f922564-abe0-4a1c-9461-7ff4fc8aadbc', islandSlug: 'acklins-crooked-island', officialTitle: 'The Bight of Acklins',
    sourceIds: ['research-source-bmot-acklins-crooked-island', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The national-tourism island profile supports the broad Bight of Acklins identity, while the location review correctly models it as an area with no single official visitor point.',
    unresolved: 'Define the intended traveler use, responsible local authority or operator, route or vessel, landing or shoreline segment, weather and tide limits, safety, emergency plan, accessibility, and an area-based delivery model before publication.',
  },
  {
    placeId: '2a219b40-3191-49df-b8a2-5aef332ee442', islandSlug: 'andros', officialTitle: 'Andros Barrier Reef',
    sourceIds: ['research-source-bmot-andros-barrier-reef', 'research-source-bmot-andros'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'permission_or_guide_required', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current national-tourism page identifies the reef west of Andros and promotes boat-based diving and snorkeling, but does not identify an accountable site manager or a responsible dive or vessel operator.',
    unresolved: 'Select a licensed responsible operator at runtime and confirm the exact site, vessel, certification or skill, supervision, equipment, sea and weather conditions, conservation rules, emergency capability, and accessibility for the traveler.',
  },
  {
    placeId: '08ee2b46-fb82-4920-9092-5b440a695391', islandSlug: 'andros', officialTitle: 'Androsia Batik Factory',
    sourceIds: ['research-source-operator-androsia', 'research-source-bmot-andros'],
    responsibleSourceStatus: 'current_responsible_operator', operationStatus: 'current_responsible_operation', accessStatus: 'current_responsible_access', safetyStatus: 'not_applicable', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The direct operator identifies the Androsia Factory in Andros Town, publishes weekday hours and a direct telephone number, and supports the catalog name-variant decision.',
    unresolved: 'Resolve the canonical display name and exact entrance, then recheck opening arrangements, tour or walk-in policy, payment, transport, step-free access, restrooms, sensory accommodations, and rights-cleared media before delivery.',
  },
  {
    placeId: '5935503a-cea3-4cec-95ac-8dd47bf6a76b', islandSlug: 'andros', officialTitle: 'Blue Holes National Park',
    sourceIds: ['research-source-bnt-blue-holes-andros', 'research-source-bnt-andros'],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_closure', accessStatus: 'operator_restricted', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The Bahamas National Trust currently marks the park temporarily closed. Its page describes boardwalks, trails, restrooms, arranged guides, and a freshwater-buoyancy caution at Capt. Bill’s Blue Hole.',
    unresolved: 'Do not recommend a visit while the closure remains. Recheck reopening, affected facilities and trailheads, authority conditions, water-entry rules, supervision, emergency readiness, feature-level accessibility, and the intended canonical point.',
  },
  {
    placeId: 'e62d6f20-dab1-49df-8735-ac43012aff14', islandSlug: 'bimini', officialTitle: 'Bimini Road',
    sourceIds: ['research-source-bmot-bimini-road', 'research-source-bmot-bimini'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'permission_or_guide_required', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current national-tourism page identifies Bimini Road in waters west of North Bimini and says the dive site is accessible only by boat.',
    unresolved: 'Confirm a licensed dive or vessel operator, exact site and mooring, conditions, certification or skill, supervision, equipment, conservation rules, emergency plan, accessibility, and a defensible point or area representation before delivery.',
  },
  {
    placeId: '6c704b3f-daa4-45ff-aaaf-dadc4e9cb404', islandSlug: 'eleuthera-harbour-island', officialTitle: 'Glass Window Bridge',
    sourceIds: ['research-source-bmot-glass-window-bridge', 'research-source-bmot-eleuthera-harbour-island', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'source_conflict', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'needs_responsible_review',
    evidence: 'The official identity is current, but the tourism map supplies two same-name points about 220 metres apart and neither the page nor map establishes a safe stop, entrance, route, or current road condition.',
    unresolved: 'Obtain responsible road or local-authority confirmation for the intended point, stopping and parking rules, road condition, wave and weather limits, barriers, pedestrian exposure, emergency response, and accessibility before routing travelers.',
  },
  {
    placeId: 'dd04a350-1850-4858-8141-113c1a4a8eb0', islandSlug: 'eleuthera-harbour-island', officialTitle: 'Pink Sands Beach',
    sourceIds: ['research-source-bmot-pink-sands-beach', 'research-source-bmot-eleuthera-harbour-island', 'research-source-bmot-eleuthera-marine-arrival'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'Current national-tourism pages identify Pink Sands Beach on boat- or ferry-accessed Harbour Island, but do not define the beach segment, a public entrance, swimming conditions, or a responsible site operator.',
    unresolved: 'Confirm the intended public entrance and beach segment, land and shoreline access, local transport, tides and swimming conditions, facilities, emergency response, mobility access, and a point-level location decision before delivery.',
  },
  {
    placeId: '8eae30a6-6626-4f0c-a376-30c61b63f731', islandSlug: 'grand-bahama', officialTitle: 'Gold Rock Beach',
    sourceIds: ['research-source-bnt-lucayan-national-park', 'research-source-bmot-gold-rock-beach', mapSource],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'current_responsible_access', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The Bahamas National Trust identifies Gold Rock Beach inside Lucayan National Park and publishes current park access context; national tourism identifies the secluded beach, low-tide shoreline, and limited amenities.',
    unresolved: 'Recheck park hours and fees, the correct beach entrance and trail or boardwalk condition, tides and swimming conditions, weather, facilities, emergency response, feature-level accessibility, and the pending coordinate before delivery.',
  },
  {
    placeId: '04cd8585-cbb6-4c9b-bb0a-97a7c78b532b', islandSlug: 'grand-bahama', officialTitle: 'Lucayan National Park',
    sourceIds: ['research-source-bnt-lucayan-national-park', mapSource],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'current_responsible_access', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The managing authority publishes park identity, current hours and admission, visitor-centre, warden, restroom, beach, boardwalk, and trail context.',
    unresolved: 'Recheck hours, fees, closures, the exact entrance and which facilities are open, cave and water restrictions, weather, emergency response, feature-level accessibility, and the pending canonical coordinate before delivery.',
  },
  {
    placeId: '8fd67764-cab2-4561-8797-8f1f4f6e934f', islandSlug: 'inagua', officialTitle: 'Inagua National Park',
    sourceIds: ['research-source-bnt-inagua-national-park', mapSource],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The Bahamas National Trust identifies an active warden, wilderness and limited-infrastructure context, and directs visitors to confirm travel dates with its New Providence or Inagua office.',
    unresolved: 'Confirm dates, warden or guide arrangements, transport and route, road and weather conditions, supplies, wildlife rules, communications, emergency and evacuation capability, accessibility, and the intended visitor point before delivery.',
  },
  {
    placeId: 'f32a6dd6-4b83-48b4-a061-692226880a86', islandSlug: 'inagua', officialTitle: 'Little Inagua National Park',
    sourceIds: ['research-source-bnt-little-inagua', mapSource],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The managing authority identifies Little Inagua as a remote no-take wilderness with no freshwater or trail infrastructure and says it is accessible only by boat.',
    unresolved: 'Confirm BNT rules and permission, a responsible vessel and landing, weather and sea state, potable water and supplies, guide needs, wildlife protections, emergency and evacuation capability, accessibility, and the pending point before delivery.',
  },
  {
    placeId: 'e7a912a5-b839-4e5f-a8eb-be88faef85e8', islandSlug: 'long-island', officialTitle: "Dean's Blue Hole",
    sourceIds: ['research-source-bmot-deans-blue-hole', mapSource, 'research-source-bmot-long-island'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: "The official page supports the natural-feature identity, while the map locates only a related 'Dean's Blue Hole Beach' and promotional plunge language does not establish safe swimming or freediving.",
    unresolved: 'Confirm a responsible local authority or operator, correct feature and public entrance, water and depth conditions, supervision, rescue readiness, prohibited activities, accessibility, and an exact point distinct from the beach pin.',
  },
  {
    placeId: '350f1104-0491-4da9-80e9-6e6baa53d583', islandSlug: 'mayaguana', officialTitle: 'Booby Cay',
    sourceIds: ['research-source-bmot-booby-cay', 'research-source-bmot-mayaguana', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'permission_or_guide_required', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'National tourism places Booby Cay east of mainland Mayaguana and identifies bird and iguana habitat; the map point does not establish a landing, permission, or responsible vessel.',
    unresolved: 'Confirm a licensed vessel, landing permission and point, wildlife protections, weather and sea state, guide requirements, emergency readiness, accessibility, and whether traveler visitation is appropriate before delivery.',
  },
  {
    placeId: 'c64b453a-dad0-429e-9665-52714574e1ca', islandSlug: 'mayaguana', officialTitle: 'Horse Pond Beach',
    sourceIds: ['research-source-bmot-mayaguana', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: "The island profile identifies Horse Pond Beach and gives only relative location context east of Abraham's Bay; no exact official point or responsible access source was found.",
    unresolved: 'Confirm the beach segment, public approach and land rights, road or vessel, current conditions, swimming safety, facilities, local guidance, emergency communications, accessibility, and a defensible point before delivery.',
  },
  {
    placeId: '25a9d563-d7a8-474d-8fc3-7e2c71fcdeb3', islandSlug: 'nassau-paradise-island', officialTitle: 'National Art Gallery of The Bahamas',
    sourceIds: ['research-source-operator-nagb', mapSource],
    responsibleSourceStatus: 'current_responsible_operator', operationStatus: 'current_responsible_operation', accessStatus: 'current_responsible_access', safetyStatus: 'not_applicable', accessibilityStatus: 'partial', copyStatus: 'source_backed_internal_only',
    evidence: 'The institution publishes current hours, admission, pedestrian and car entrances, parking, restrooms, and direct contact. It also reports an elevator under maintenance, while its FAQ notes the Art Park is unpaved and hilly.',
    unresolved: 'Recheck the elevator and exact route needed by the traveler, resolve the canonical entrance coordinate, reconcile any live hours or admission changes, confirm floor and exhibition access, and clear media and editorial copy before delivery.',
  },
  {
    placeId: '45659ca4-6b99-4c9f-a2d0-ff055b32ead6', islandSlug: 'ragged-island', officialTitle: 'Hog Cay',
    sourceIds: ['research-source-bmot-ragged-island', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The island profile supports Hog Cay as a Ragged Island identity, but the official map only supplies a related Hog Cay Beach point and no accountable access source.',
    unresolved: 'Confirm whether the traveler target is the whole cay or beach, responsible vessel or local guide, landing and permissions, weather and sea state, facilities, emergency readiness, accessibility, and an appropriate area or point model.',
  },
  {
    placeId: 'd18571d7-2c94-4437-a738-b53b8f7f1ec2', islandSlug: 'the-exumas', officialTitle: 'Compass Cay Marina',
    sourceIds: ['research-source-operator-compass-cay-marina', 'research-source-bmot-the-exumas'],
    responsibleSourceStatus: 'current_responsible_operator', operationStatus: 'current_responsible_operation', accessStatus: 'current_responsible_access', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'blocked_by_source_conflict',
    evidence: 'The marina operator publishes current vessel and landing-fee context, contact details, and a nurse-shark visitor activity. National tourism places Compass Cay in The Exumas, while the matched Supabase row is assigned to Rum Cay.',
    unresolved: 'Correct the island assignment only after catalog adjudication, then verify the exact marina entrance, current rates and terms, transport, wildlife-interaction rules, water safety, emergency readiness, accessibility, and rights-cleared media before delivery.',
  },
  {
    placeId: '2df8651f-cbb9-4ab5-a7e5-7cc69cc73970', islandSlug: 'rum-cay', officialTitle: 'Conception Island National Park',
    sourceIds: ['research-source-bnt-conception-island', mapSource],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The managing authority identifies a boat-only wilderness park with little infrastructure, no guard, moorings, shifting creek access, wind and swell exposure, and wildlife-protection rules.',
    unresolved: 'Confirm BNT rules, a responsible vessel and mooring or landing, current weather and sea state, creek conditions, guide needs, emergency and evacuation capability, accessibility, and the intended visitor point before delivery.',
  },
  {
    placeId: '61e516f7-b72a-4525-b7c8-7312bae392ca', islandSlug: 'san-salvador', officialTitle: 'Southern Great Lake National Park',
    sourceIds: ['research-source-bnt-southern-great-lake', 'research-source-bnt-san-salvador', mapSource],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'unresolved', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'needs_responsible_review',
    evidence: 'The managing authority names Southern Great Lake National Park and describes a wilderness site with little infrastructure or trail system and no guard; the Supabase title omits “Southern.”',
    unresolved: 'Adjudicate the canonical name, intended point or area, current public access and route, permission or guide requirements, conditions, communications, emergency readiness, accessibility, and traveler suitability before delivery.',
  },
  {
    placeId: '7befb31e-4ec9-40cb-a416-f8082415f45b', islandSlug: 'san-salvador', officialTitle: "Watling's Blue Hole",
    sourceIds: ['research-source-bmot-watlings-blue-hole', 'research-source-bmot-san-salvador', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: "National tourism identifies Watling's Blue Hole in southwestern San Salvador, but neither the page nor official map supplies an exact point, approach, safe-swimming assessment, facilities, or responsible operator.",
    unresolved: 'Confirm the exact feature and entrance, land access, conditions and water hazards, local guidance, emergency readiness, prohibited activities, accessibility, and a defensible point before delivery.',
  },
  {
    placeId: 'b2cd568b-7ef1-4c0a-8dfe-5ece8e77479c', islandSlug: 'abacos', officialTitle: 'Elbow Reef Lighthouse',
    sourceIds: ['research-source-operator-elbow-reef-lighthouse-visit', 'research-source-bmot-abacos', mapSource],
    responsibleSourceStatus: 'current_responsible_operator', operationStatus: 'current_responsible_operation', accessStatus: 'current_responsible_access', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The lighthouse society currently publishes visiting hours, Sunday closure, a requested pre-visit form, and that visits are not tours. The tourism point remains a pending location candidate.',
    unresolved: 'Recheck hours and form requirements, transport and arrival point, stairs and climbing restrictions, supervision, weather, emergency readiness, feature-level accessibility, canonical entrance, and media rights before delivery.',
  },
  {
    placeId: 'a09ebcdb-b922-431c-baaf-993ed90db462', islandSlug: 'abacos', officialTitle: 'Man-O-War Cay',
    sourceIds: ['research-source-bmot-man-o-war-cay', 'research-source-bmot-abacos', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_applicable', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'National tourism identifies the community and says it is accessible by ferry from Marsh Harbour; the map supplies only a related beach point rather than a whole-cay coordinate.',
    unresolved: 'Confirm the responsible ferry operator, exact docks, schedule and disruption plan, local mobility, public facilities, emergency access, accessibility, community-sensitive visitor guidance, and an area-based location model before delivery.',
  },
  {
    placeId: '0f53515b-b574-47f0-8f91-44c49a2efac1', islandSlug: 'abacos', officialTitle: 'Tahiti Beach',
    sourceIds: ['research-source-bmot-tahiti-beach', 'research-source-bmot-abacos'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current national-tourism page places Tahiti Beach at the southern tip of Elbow Cay and says it is reached only on foot, by bicycle, or by boat, with a sandbar visible around low tide.',
    unresolved: 'Confirm the public entrance or landing, route and land rights, tide and swimming conditions, weather, facilities, emergency readiness, mobility access, exact point, and whether bicycle or boat advice is currently responsible before delivery.',
  },
  {
    placeId: 'fa7d5f7d-ae3f-4a6c-ab05-564e4a44571c', islandSlug: 'berry-islands', officialTitle: "Flo's Conch Bar",
    sourceIds: ['research-source-bmot-flos-conch-bar', 'research-source-bmot-berry-islands', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'partial_official_context', safetyStatus: 'not_applicable', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current national-tourism listing identifies the Little Harbour Cay restaurant, publishes a named contact, telephone, email, and broad service hours, and recommends advance notice for food preparation.',
    unresolved: 'Verify directly with the operator that it is open for the traveler date, the vessel and landing, reservations or notice, menu and payment, weather disruption, food-allergy handling, restrooms, accessibility, and the pending point before delivery.',
  },
  {
    placeId: '561abe21-623b-4439-9178-46454185ee02', islandSlug: 'berry-islands', officialTitle: "Hoffman's Cay Blue Hole",
    sourceIds: ['research-source-bmot-hoffmans-cay-blue-hole', 'research-source-bmot-berry-islands', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'permission_or_guide_required', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'National tourism supports the identity and a relative approach landmark, but the official map record has no coordinates and the source does not establish transport, a landing, safe water entry, or rescue readiness.',
    unresolved: 'Confirm a responsible vessel and guide, exact landing and trail, water conditions and depth hazards, prohibited activities, supervision, emergency capability, accessibility, and a defensible point before delivery.',
  },
  {
    placeId: '397ca218-f9cb-456e-9d54-3d4eb6790cf3', islandSlug: 'the-exumas', officialTitle: 'Big Major Cay',
    sourceIds: ['research-source-bmot-big-major-cay-pig-beach', 'research-source-bmot-exuma-local-marine-transfer', mapSource],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'permission_or_guide_required', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'National tourism identifies Big Major Cay as Pig Beach, says it is accessible only by boat, and publishes community-developed animal-interaction and feeding context. The map point is for Pig Beach, not the whole cay.',
    unresolved: 'Confirm a licensed vessel, departure and landing, current animal-interaction rules and feeding restrictions, weather, water safety, emergency arrangements, accessibility, and whether delivery should target Pig Beach rather than the whole-cay identity.',
  },
  {
    placeId: '61cf7fb9-a680-4be9-b437-dbfaeee3d74a', islandSlug: 'the-exumas', officialTitle: 'Exuma Cays Land & Sea Park',
    sourceIds: ['research-source-bnt-exuma-cays-land-sea-park', 'research-source-bnt-exuma-park-quick-guide', 'research-source-bmot-the-exumas'],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'current_responsible_access', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The managing authority publishes current park office and VHF context, wardens, moorings, visitor facilities, trails, protected-area rules, and a remote Warderick Wells operating boundary.',
    unresolved: 'Recheck park rules, fees, office availability and communications, choose the intended visitor facility or area rather than one point, confirm a responsible vessel, weather and sea state, emergency capability, accessibility, and current media rights before delivery.',
  },
]

const allowed = {
  responsibleSourceStatus: new Set(['current_managing_authority', 'current_responsible_operator', 'current_government_authority', 'current_official_listing_only', 'related_operator_only', 'source_conflict', 'unresolved']),
  operationStatus: new Set(['current_responsible_operation', 'current_responsible_closure', 'current_official_listing_only', 'not_applicable_identity', 'source_conflict', 'unresolved']),
  accessStatus: new Set(['current_responsible_access', 'partial_official_context', 'operator_restricted', 'permission_or_guide_required', 'source_conflict', 'unresolved']),
  safetyStatus: new Set(['specific_hazard_context', 'general_caution_only', 'not_established', 'not_applicable']),
  accessibilityStatus: new Set(['published', 'partial', 'not_published', 'not_applicable']),
  copyStatus: new Set(['source_backed_internal_only', 'identity_only', 'blocked_by_source_conflict', 'needs_responsible_review']),
}

const mergedPlaces = new Map()
for (const inputPath of [signatureSeedPath, locationSeedPath]) {
  for (const doc of readNdjson(inputPath).filter((item) => item._type === 'placeEditorial')) mergedPlaces.set(doc._id, doc)
}

if (specs.length !== 27) throw new Error(`Expected 27 review specifications, found ${specs.length}`)
const seen = new Set()
for (const spec of specs) {
  if (seen.has(spec.placeId)) throw new Error(`Duplicate place ID: ${spec.placeId}`)
  seen.add(spec.placeId)
  const doc = mergedPlaces.get(`drafts.place-supabase-${spec.placeId}`)
  if (!doc) throw new Error(`Missing matched place draft: ${spec.placeId} / ${spec.officialTitle}`)
  if (doc.active !== false || (doc.channels || []).length) throw new Error(`Matched place is not quarantined: ${doc._id}`)
  for (const [field, values] of Object.entries(allowed)) {
    if (!values.has(spec[field])) throw new Error(`Invalid ${field} for ${spec.officialTitle}: ${spec[field]}`)
  }
}

const rows = specs.map((spec) => ({
  ...spec,
  placeDraftId: `drafts.place-supabase-${spec.placeId}`,
  checkedAt,
  nextReviewAt: nextOperationalReviewAt,
  overallStatus: 'blocked',
  mediaStatus: 'no_approved_media',
  deliveryDecision: 'blocked',
}))

function countBy(field) {
  return Object.fromEntries([...new Set(rows.map((row) => row[field]))].sort().map((value) => [value, rows.filter((row) => row[field] === value).length]))
}

const result = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: 'All 27 official signature-place identities already matched to Supabase.',
    gates: 'Responsible source, current operation or closure, access, safety, accessibility, copy, media rights, location confidence, and traveler delivery are evaluated independently.',
    guardrail: 'A Supabase match, official listing, map pin, operating page, or access fact cannot approve another gate by implication. This audit never mutates Supabase or Sanity.',
  },
  counts: {
    rows: rows.length,
    islands: new Set(rows.map((row) => row.islandSlug)).size,
    responsibleSourceStatus: countBy('responsibleSourceStatus'),
    operationStatus: countBy('operationStatus'),
    accessStatus: countBy('accessStatus'),
    safetyStatus: countBy('safetyStatus'),
    accessibilityStatus: countBy('accessibilityStatus'),
    deliveryDecision: countBy('deliveryDecision'),
  },
  rows,
}

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify({output: outputPath, ...result.counts}, null, 2))
