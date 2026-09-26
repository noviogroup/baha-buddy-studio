#!/usr/bin/env node

/**
 * Build a read-only traveler-readiness matrix for the 18 missing signature-place
 * candidates that do not have an acceptable point candidate. No API mutation.
 */

import fs from 'node:fs'

const absentSeedPath = process.argv[2] || '/private/tmp/baha-buddy-absent-signature-place-research-sanity-seed.ndjson'
const adjudicationSeedPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-source-adjudication-research-sanity-seed.ndjson'
const pointReadinessSeedPath = process.argv[4] || '/private/tmp/baha-buddy-signature-place-traveler-readiness-research-sanity-seed.ndjson'
const outputPath = process.argv[5] || '/private/tmp/baha-buddy-signature-place-identity-readiness.json'
const checkedAt = '2026-08-05'
const nextReviewAt = '2026-09-04'

for (const inputPath of [absentSeedPath, adjudicationSeedPath, pointReadinessSeedPath]) {
  if (!fs.existsSync(inputPath)) throw new Error(`Missing input: ${inputPath}`)
}

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

function keyPart(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const mapSource = 'research-source-bmot-public-map-dataset'
const reviewSpecs = [
  {
    islandSlug: 'abacos', title: 'Hope Town',
    sourceIds: ['research-source-bmot-abacos', 'research-source-bmot-hope-town-current'],
    identitySourceIds: ['research-source-bmot-hope-town-current'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The current national-tourism sources identify Hope Town as Elbow Cay’s settlement, describe regularly scheduled ferry access to Elbow Cay, and state that the town center is car-free and traversed on foot or bicycle while golf carts and cars are permitted outside it.',
    unresolved: 'Keep the settlement separate from a beach, marina, museum, or business point. Confirm the current ferry operator, exact docks and timetable, town-center vehicle boundary, luggage and mobility assistance, emergency transport, and an area geometry before traveler delivery.',
  },
  {
    islandSlug: 'acklins-crooked-island', title: 'Ancient Lucayan Sites',
    sourceIds: ['research-source-bmot-acklins-crooked-island', 'research-source-bmot-acklins-lucayan-indian-sites', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'Official tourism evidence describes a plural, distributed archaeological identity spanning multiple sites; the Samana Cay marker is only component-area evidence and does not locate any individual protected site.',
    unresolved: 'Confirm the responsible heritage authority, exact identities and protection/disclosure rules, land ownership and permission, guide requirements, safe approaches, accessibility, photography, and whether any site location should be public.',
  },
  {
    islandSlug: 'acklins-crooked-island', title: 'Turtle Sound',
    sourceIds: ['research-source-bmot-acklins-crooked-island', 'research-source-bmot-turtle-sound'],
    identitySourceIds: ['research-source-bmot-turtle-sound'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current tourism page describes Turtle Sound as a nine-mile mangrove-lined waterway running inland from French Wells Channel behind Moss Town and Seaview, with differing water depths, and publishes an Administrator’s Office contact.',
    unresolved: 'Reject the impossible positive-longitude map record. Confirm responsible local guidance, exact waterway geometry, launch or landing points, vessel/guide, tides and depth, wildlife and fishing rules, weather, emergency communications, and accessibility.',
  },
  {
    islandSlug: 'andros', title: 'West Side National Park',
    sourceIds: ['research-source-bmot-andros', 'research-source-bnt-andros-west-side-national-park'],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The managing conservation authority identifies a 1.5-million-acre wilderness park that is accessible only by boat, has little infrastructure or trail systems, and has no one on guard.',
    unresolved: 'Confirm BNT permission and rules, a responsible licensed vessel/guide, route and landing or mooring, tides and weather, communications and emergency plan, accessibility, protected-area conduct, and non-point geometry.',
  },
  {
    islandSlug: 'bimini', title: 'Dolphin House Museum',
    sourceIds: ['research-source-bmot-bimini', 'research-source-bmot-bimini-dolphin-house-profile', 'research-source-operator-dolphin-house-museum', 'research-source-operator-dolphin-house-contact'],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_responsible_operator', operationStatus: 'unresolved', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current institution and owner contact pages strengthen the Alice Town museum identity, but they do not publish a dependable exact entrance, current opening schedule, admission terms, reservation requirement, or feature-level accessibility.',
    unresolved: 'Contact the owner to confirm current visitor operation, entrance/address, hours, admission and payment, reservations, maximum group size, accessibility, service animals, photography, emergency conditions, and media permissions.',
  },
  {
    islandSlug: 'bimini', title: 'Fountain of Youth',
    sourceIds: ['research-source-bmot-bimini', 'research-source-bmot-fountain-of-youth-bimini', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'related_operator_only', operationStatus: 'current_official_listing_only', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The current tourism page describes a limestone well near the road leading to South Bimini Airport and lists Bimini Sands as a contact, but the two official points remain kilometres apart and the listed property is not proven to manage the well.',
    unresolved: 'Confirm the responsible land or site authority, exact well and entrance, public permission, current condition, drinking/contact-water safety, hours, accessibility, emergency route, and correction of the conflicting map record before traveler use.',
  },
  {
    islandSlug: 'cat-island', title: "Sir Sidney Poitier's Boyhood Home",
    sourceIds: ['research-source-bmot-cat-island'],
    identitySourceIds: [],
    responsibleSourceStatus: 'unresolved', operationStatus: 'unresolved', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The official island profile supports a biographical connection to Cat Island but does not establish that a specific surviving home is a managed public visitor site or appropriate to locate.',
    unresolved: 'Confirm the exact heritage identity, surviving structure and ownership, family/community consent, managing authority, public access, appropriate disclosure, entrance, condition, accessibility, photography, and media rights.',
  },
  {
    islandSlug: 'cat-island', title: 'Port Howe',
    sourceIds: ['research-source-bmot-cat-island', 'research-source-laws-cat-island-port-howe-community', 'research-source-laws-family-island-taxi-zone-fares-2008'],
    identitySourceIds: ['research-source-laws-cat-island-port-howe-community'],
    responsibleSourceStatus: 'current_government_authority', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'Current official tourism and codified local-government evidence establish Port Howe as a settlement/town area in Cat Island’s local-government structure; road and taxi-zone law provides route context but not a single visitor entrance.',
    unresolved: 'Model the community as an area. Confirm the current administrator or town contact, road condition and licensed transfer, public facilities and hours, communications, medical and emergency fallback, accessibility, and appropriate settlement geometry.',
  },
  {
    islandSlug: 'eleuthera-harbour-island', title: 'Pineapple Fields',
    sourceIds: ['research-source-bmot-eleuthera-harbour-island', 'research-source-bmot-eleuthera-pineapple-fields-identity'],
    identitySourceIds: ['research-source-bmot-eleuthera-pineapple-fields-identity'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'Current tourism evidence presents Eleuthera’s pineapple fields as a distributed agricultural and cultural identity and profiles one farmer; it does not define one attraction, one farm, or the similarly named condo-hotel as the canonical feature.',
    unresolved: 'Confirm participating farms and growers, landowner permission, seasons and appointments, exact public visitor sites, biosecurity and farm safety, accessibility, photography, commercial relationships, and whether a collection is the correct model.',
  },
  {
    islandSlug: 'eleuthera-harbour-island', title: 'Spanish Wells',
    sourceIds: ['research-source-bmot-eleuthera-harbour-island', 'research-source-bmot-spanish-wells-community-access', 'research-source-bmot-eleuthera-marine-arrival'],
    identitySourceIds: ['research-source-bmot-spanish-wells-community-access'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The current tourism source identifies Spanish Wells as a town on St. George’s Cay reached by ferry from mainland Eleuthera; the separate Spanish Wells Beach point is a component site, not the community coordinate.',
    unresolved: 'Confirm the current passenger operator, exact docks and schedule, North Eleuthera transfer, disruption fallback, settlement geometry, public facilities, local transport, accessibility, emergency contacts, and service hours.',
  },
  {
    islandSlug: 'long-island', title: 'Cape Santa Maria Beach',
    sourceIds: ['research-source-bmot-long-island', 'research-source-bmot-cape-santa-maria-beach', 'research-source-operator-cape-santa-maria-current', mapSource],
    identitySourceIds: ['research-source-bmot-cape-santa-maria-beach'],
    responsibleSourceStatus: 'related_operator_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'Current tourism and resort sources confirm the four-mile beach and the resort’s current operation on it, but the operator’s property and contact do not establish public rights, boundaries, or an exact public-beach entrance for the whole shoreline.',
    unresolved: 'Keep the beach distinct from the resort. Confirm public access and land boundaries, exact entrance/parking, permitted use, current swimming conditions, amenities, accessibility, emergency route, and media rights before delivery.',
  },
  {
    islandSlug: 'long-island', title: 'Columbus Point',
    sourceIds: ['research-source-bmot-long-island', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current Long Island profile identifies Columbus Point at the island’s northern tip and a monument atop a hill, while the only reviewed map point is for related Columbus Harbour Beach rather than the monument or entrance.',
    unresolved: 'Confirm the managing heritage or land authority, road/trailhead and monument point, property permission, hours, hill and path condition, weather exposure, accessibility, emergency route, photography, and whether the point should be public.',
  },
  {
    islandSlug: 'long-island', title: 'Twin Churches',
    sourceIds: ['research-source-bmot-long-island', 'research-source-bmot-st-peter-st-paul-catholic-church', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'Official evidence identifies two separate Clarence Town churches and supplies a point only for St. Peter & St. Paul’s Catholic Church; the plural identity cannot be represented by that component point.',
    unresolved: 'Confirm both responsible congregations, exact church identities and entrances, worship versus visitor hours, permission, accessibility, service disruption, photography, condition, and a two-site collection model.',
  },
  {
    islandSlug: 'nassau-paradise-island', title: "Queen's Staircase",
    sourceIds: ['research-source-bmot-nassau-paradise-island', 'research-source-bmot-queens-staircase', 'research-source-bmot-queens-staircase-natural-wonder', 'research-source-ammc-public-site-no-program-detail', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'unresolved', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'Current tourism pages support the historic linear feature, but two official points are 290 metres apart and may represent different parts of the staircase/fort complex. The AMMC public site exposes no current site-specific operating detail.',
    unresolved: 'Confirm the responsible authority, canonical entrances and linear geometry, current hours and closures, step and surface condition, handrails and accessible alternative, security, events, photography, and emergency access.',
  },
  {
    islandSlug: 'nassau-paradise-island', title: 'Fort Fincastle',
    sourceIds: ['research-source-bmot-nassau-paradise-island', 'research-source-bmot-fort-fincastle', 'research-source-ammc-public-site-no-program-detail', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'unresolved', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The tourism map pin fits the official Fort Fincastle–Queen’s Staircase complex better than the outlying business point, but neither point is accepted and the AMMC public site provides no current fort-specific operating detail.',
    unresolved: 'Confirm the responsible authority, entrance and boundary, current hours/fees/closures, structure and stair condition, accessibility, security, events, vendor boundary, photography, and emergency access before delivery.',
  },
  {
    islandSlug: 'ragged-island', title: 'Jumentos Cays',
    sourceIds: ['research-source-bmot-ragged-island', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The official profile and map support the Jumentos Cays as a broad chain/area; the area marker is not a dock, landing, route, settlement entrance, or safe traveler destination.',
    unresolved: 'Confirm exact geographic scope, settlement and cay identities, lawful landing/anchoring and protected areas, responsible vessel/guide, weather and sea-state limits, provisioning, communications, emergency fallback, and an area model.',
  },
  {
    islandSlug: 'ragged-island', title: 'Pigeon Cay',
    sourceIds: ['research-source-bmot-ragged-island'],
    identitySourceIds: [],
    responsibleSourceStatus: 'unresolved', operationStatus: 'unresolved', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The official island profile supports a Pigeon Cay identity only through relative context; it does not establish a cay centroid, memorial point, ownership, permission, landing, or visitor operation.',
    unresolved: 'Confirm the exact cay and memorial identity, ownership and consent, responsible authority, landing/anchoring rules, vessel, sea state and weather, emergency plan, accessibility, photography, and whether any point should be exposed.',
  },
  {
    islandSlug: 'san-salvador', title: 'Bonefish Bay Beach',
    sourceIds: ['research-source-bmot-san-salvador', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The current island profile lists Bonefish Bay Beach among San Salvador’s secluded beaches, while the public map locates related Bonefish Bay rather than an exact beach entrance or shoreline segment.',
    unresolved: 'Confirm the intended shoreline and public entrance, road/parking and land rights, tides and swimming conditions, amenities, accessibility, emergency communications, exact point or geometry, and media rights.',
  },
].map((row) => ({
  ...row,
  checkedAt,
  nextReviewAt,
  overallStatus: 'blocked',
  mediaStatus: 'source_media_not_cleared',
  deliveryDecision: 'blocked',
  candidateId: `drafts.canonical-place-candidate-${row.islandSlug}-${keyPart(row.title)}`,
}))

const candidateById = new Map(
  readNdjson(absentSeedPath)
    .filter((document) => document._type === 'canonicalPlaceCandidate')
    .map((document) => [document._id, document]),
)
for (const filePath of [adjudicationSeedPath, pointReadinessSeedPath]) {
  for (const document of readNdjson(filePath).filter((item) => item._type === 'canonicalPlaceCandidate')) {
    candidateById.set(document._id, document)
  }
}

const allCandidates = [...candidateById.values()]
const remainingCandidates = allCandidates.filter((document) => !document.travelerReadinessReview)

if (allCandidates.length !== 37) throw new Error(`Expected 37 merged candidates, found ${allCandidates.length}`)
if (remainingCandidates.length !== 18) throw new Error(`Expected 18 candidates without readiness review, found ${remainingCandidates.length}`)
if (reviewSpecs.length !== 18) throw new Error(`Expected 18 review specs, found ${reviewSpecs.length}`)

for (const row of reviewSpecs) {
  const candidate = candidateById.get(row.candidateId)
  if (!candidate) throw new Error(`Readiness spec has no candidate: ${row.candidateId}`)
  if (candidate.title !== row.title) throw new Error(`Candidate title mismatch for ${row.candidateId}`)
  if (candidate.travelerReadinessReview) throw new Error(`Candidate already has readiness review: ${row.candidateId}`)
  if (candidate.locationReview?.reviewDecision === 'accepted') throw new Error(`Unexpected accepted point: ${row.candidateId}`)
}

const coveredIds = new Set(reviewSpecs.map((row) => row.candidateId))
const uncovered = remainingCandidates.filter((document) => !coveredIds.has(document._id)).map((document) => document._id)
if (uncovered.length) throw new Error(`Uncovered candidates: ${uncovered.join(', ')}`)

const report = {
  generatedAt: new Date().toISOString(),
  checkedAt,
  methodology: {
    scope: 'All 18 missing official signature-place identities that do not have an acceptable point candidate and were not in the one-point traveler-readiness tranche.',
    sourceRule: 'Current government, national-tourism, conservation-authority, responsible-operator, and previously adjudicated evidence are kept distinct. A component operator or related point does not control a community, beach, distributed identity, or protected area.',
    readinessRule: 'Identity/geometry, responsible ownership, operation, access, safety, accessibility, copy, media rights, and delivery are independent gates.',
    guardrail: 'Read-only audit. Every row remains blocked; no point is accepted, no Supabase record is created, and no delivery channel or public content is enabled.',
  },
  counts: {
    candidates: reviewSpecs.length,
    islands: new Set(reviewSpecs.map((row) => row.islandSlug)).size,
    areaIdentities: remainingCandidates.filter((document) => document.locationReview?.reconciliationStatus === 'area_identity_no_point').length,
    sourceOnlyIdentities: remainingCandidates.filter((document) => document.locationReview?.reconciliationStatus === 'official_identity_source_no_point').length,
    pointConflicts: remainingCandidates.filter((document) => document.locationReview?.reconciliationStatus === 'official_point_conflict').length,
    relatedSiteOnly: remainingCandidates.filter((document) => document.locationReview?.reconciliationStatus === 'official_related_site_point_only').length,
    invalidPoints: remainingCandidates.filter((document) => document.locationReview?.reconciliationStatus === 'official_invalid_point').length,
    sourceAdjudicated: remainingCandidates.filter((document) => document.sourceAdjudicationStatus).length,
    responsibleAuthoritiesOrOperators: reviewSpecs.filter((row) => ['current_managing_authority', 'current_responsible_operator', 'current_government_authority'].includes(row.responsibleSourceStatus)).length,
    accessibilityPublished: reviewSpecs.filter((row) => row.accessibilityStatus === 'published').length,
    mediaRightsCleared: reviewSpecs.filter((row) => row.mediaStatus === 'rights_cleared').length,
    travelerDeliveryAllowed: reviewSpecs.filter((row) => row.deliveryDecision !== 'blocked').length,
  },
  rows: reviewSpecs,
}

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({output: outputPath, counts: report.counts}, null, 2))
