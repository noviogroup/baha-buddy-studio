#!/usr/bin/env node

/**
 * Build a read-only traveler-readiness matrix for the 19 missing signature-place
 * candidates that currently have one official point candidate. No API mutation.
 */

import fs from 'node:fs'

const candidateSeedPath = process.argv[2] || '/private/tmp/baha-buddy-absent-signature-place-research-sanity-seed.ndjson'
const outputPath = process.argv[3] || '/private/tmp/baha-buddy-signature-place-traveler-readiness.json'
const checkedAt = '2026-08-05'
const nextReviewAt = '2026-09-04'

if (!fs.existsSync(candidateSeedPath)) throw new Error(`Missing candidate seed: ${candidateSeedPath}`)

function readNdjson(filePath) {
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)
}

function keyPart(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const mapSource = 'research-source-bmot-public-map-dataset'
const reviewSpecs = [
  {
    islandSlug: 'acklins-crooked-island', title: 'Long Cay',
    sourceIds: ['research-source-bmot-acklins-crooked-island', 'research-source-bmot-long-cay-access', 'research-source-bahamas-ferries-current-passenger-reconciliation', mapSource],
    identitySourceIds: ['research-source-bmot-long-cay-access'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The current national-tourism page identifies the inhabited cay and says it is served by a daily local ferry, but the separate current passenger-operator review did not expose an accountable scheduled route.',
    unresolved: 'Confirm the vessel/operator, exact Acklins or Crooked Island dock, schedule, passenger permission, flight connection, weather limit, luggage, accessibility, and fallback before planning travel.',
  },
  {
    islandSlug: 'berry-islands', title: 'Chub Cay',
    sourceIds: ['research-source-bmot-berry-islands', 'research-source-operator-chub-cay-current', 'research-source-makers-air-destinations', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'related_operator_only', operationStatus: 'not_applicable_identity', accessStatus: 'operator_restricted', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The cay has scheduled-air evidence, while the responsible resort/marina operator now describes its community as members-only and limits non-members to customs clearance and fuel under stated conditions.',
    unresolved: 'Keep the geographic cay distinct from the private club. Confirm who may enter each facility, reservations, transfers, public shoreline rights, service-animal and mobility arrangements, weather limits, and fallback.',
  },
  {
    islandSlug: 'berry-islands', title: 'Sugar Beach',
    sourceIds: ['research-source-bmot-berry-islands', 'research-source-bmot-sugar-beach', mapSource],
    identitySourceIds: ['research-source-bmot-sugar-beach'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The current national-tourism page describes several coves, ruins, a woods trail, and a careful rock climb, with a tourism-office contact but no responsible site operator.',
    unresolved: 'Confirm the correct arrival point, land and beach access rights, trail and rock condition, tides and weather, swimming safety, accessibility, emergency plan, and whether the map pin represents an entrance.',
  },
  {
    islandSlug: 'bimini', title: 'SS Sapona Shipwreck',
    sourceIds: ['research-source-bmot-bimini', 'research-source-bmot-sapona-shipwreck', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'permission_or_guide_required', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'Current national-tourism evidence identifies the marine wreck and a relative location off South Bimini, but does not establish a responsible vessel, mooring, legal access, supervision, or current conditions.',
    unresolved: 'Confirm a responsible licensed operator, approach and mooring, dive/snorkel conditions, skill and equipment, prohibited activities, weather, emergency readiness, accessibility, and exact-use point.',
  },
  {
    islandSlug: 'cat-island', title: 'Mount Alvernia and The Hermitage',
    sourceIds: ['research-source-bmot-cat-island', 'research-source-bmot-mount-alvernia', mapSource],
    identitySourceIds: ['research-source-bmot-mount-alvernia'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'partial_official_context', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The official page confirms The Hermitage atop Mount Alvernia and describes a stone staircase on a steep rocky incline, but publishes no current site manager, hours, condition, permission, or accessible alternative.',
    unresolved: 'Confirm the responsible authority, correct trailhead/entrance, current path and structure condition, weather exposure, steps and handrails, mobility alternatives, hours, donations, guide needs, and emergency plan.',
  },
  {
    islandSlug: 'cat-island', title: 'Old Bight Beach',
    sourceIds: ['research-source-bmot-cat-island', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The current island profile identifies Old Bight Beach as a white-sand beach and the official map supplies one point, but no dedicated responsible access source was found.',
    unresolved: 'Confirm the intended beach segment and public entrance, road and parking, land rights, tides and swimming conditions, amenities, accessibility, emergency communications, and media rights.',
  },
  {
    islandSlug: 'the-exumas', title: 'Thunderball Grotto',
    sourceIds: ['research-source-bmot-the-exumas', 'research-source-bmot-thunderball-grotto', 'research-source-bmot-exuma-local-marine-transfer', mapSource],
    identitySourceIds: ['research-source-bmot-thunderball-grotto'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The official page places the cave west of Staniel Cay and gives tide-dependent entry guidance, including low/slack-tide advice and a high-tide diving-equipment warning.',
    unresolved: 'Static tide language is not a go/no-go decision. Confirm a responsible vessel/guide, exact tide and weather window, current entrance condition, skill, equipment, conservation rules, emergency plan, and accessibility.',
  },
  {
    islandSlug: 'grand-bahama', title: 'Peterson Cay National Park',
    sourceIds: ['research-source-bmot-grand-bahama', 'research-source-bnt-peterson-cay-national-park', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The managing conservation authority identifies a boat-access wilderness park with little infrastructure, limited trails, and no on-site guard.',
    unresolved: 'Confirm BNT rules, a responsible licensed vessel, landing or mooring, weather and sea state, guide, protected-area conduct, emergency readiness, accessibility, and whether the map point is suitable for internal routing.',
  },
  {
    islandSlug: 'grand-bahama', title: 'Port Lucaya Marketplace',
    sourceIds: ['research-source-bmot-grand-bahama', 'research-source-operator-port-lucaya-marketplace', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_responsible_operator', operationStatus: 'current_responsible_operation', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The responsible venue site currently presents a waterside marketplace with shopping, dining, services, entertainment, and tour operators.',
    unresolved: 'Recheck venue and tenant hours, event dates, exact public entrances, transport and parking, accessibility, service availability, closures, and approved media before traveler delivery.',
  },
  {
    islandSlug: 'inagua', title: 'Great Inagua Lighthouse',
    sourceIds: ['research-source-bmot-inagua', 'research-source-bmot-great-inagua-lighthouse', mapSource],
    identitySourceIds: ['research-source-bmot-great-inagua-lighthouse'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'partial_official_context', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The official tourism page identifies the automated lighthouse at Mortimers Hill, supplies contact details, and promotes a climb, but does not identify the responsible lighthouse authority or current climb authorization.',
    unresolved: 'Confirm the responsible authority, public entry and climb permission, opening arrangements, stair and railing condition, height/health restrictions, weather, accessibility, supervision, and emergency plan.',
  },
  {
    islandSlug: 'inagua', title: 'Union Creek Reserve',
    sourceIds: ['research-source-bmot-inagua', 'research-source-bnt-union-creek-reserve', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_managing_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'specific_hazard_context', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The managing conservation authority identifies an enclosed tidal creek and sea-turtle research station with wilderness conditions, little infrastructure, limited trails, and no on-site guard.',
    unresolved: 'Confirm BNT permission, warden or guide arrangements, approach, wildlife and research restrictions, weather and tide, emergency readiness, accessibility, and whether any visitor point should be exposed.',
  },
  {
    islandSlug: 'mayaguana', title: "Abraham's Bay",
    sourceIds: ['research-source-bmot-mayaguana', 'research-source-bmot-abrahams-bay-town-square', 'research-source-bmot-flight-tables-current-review', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The island profile and official point establish Abraham’s Bay as a settlement, while the dedicated town-square page describes one component civic area and nearby Local Government complex.',
    unresolved: 'Do not turn the settlement point into one attraction entrance. Confirm airport-to-town transfer, roads, public facilities, service hours, emergency contacts, accessibility, and the correct point or area model.',
  },
  {
    islandSlug: 'mayaguana', title: 'Pirates Well',
    sourceIds: ['research-source-bmot-mayaguana', 'research-source-bmot-pirates-well-bimini-conflict', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'source_conflict', operationStatus: 'source_conflict', accessStatus: 'source_conflict', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'blocked_by_source_conflict',
    evidence: 'The Mayaguana profile and Mayaguana map business record identify Pirates Well on Mayaguana, but the current same-slug attraction page describes a different well in South Bimini and points to Bimini Sands.',
    unresolved: 'Block delivery and lower point confidence until the Ministry of Tourism or Mayaguana authority confirms the Mayaguana site identity, record ownership, exact point, condition, public access, safety, and correct canonical URL.',
  },
  {
    islandSlug: 'nassau-paradise-island', title: 'Government House',
    sourceIds: ['research-source-bmot-nassau-paradise-island', 'research-source-bmot-government-house-nassau', 'research-source-opm-government-house-current-use', mapSource],
    identitySourceIds: ['research-source-opm-government-house-current-use'],
    responsibleSourceStatus: 'current_government_authority', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'Tourism and current government evidence confirm the official residence and continuing ceremonial use, but do not establish general public entry or permanent visitor hours.',
    unresolved: 'Confirm each event or invitation, security and identification rules, public entrance, closures, transport, accessibility, photography, and organizer instructions before recommending a visit.',
  },
  {
    islandSlug: 'ragged-island', title: 'Duncan Town',
    sourceIds: ['research-source-bmot-ragged-island', 'research-source-bmot-flight-tables-current-review', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The current island profile identifies Duncan Town as Ragged Island’s only settlement and the airport as its only airport, while the dated air review found no commercial-flight proof and retained private charter as a volatile lead.',
    unresolved: 'Confirm an accountable flight or vessel, arrival permission, airport/dock transfer, lodging and provisioning, communications, weather limits, medical and emergency fallback, accessibility, and the correct area model.',
  },
  {
    islandSlug: 'rum-cay', title: 'Port Nelson',
    sourceIds: ['research-source-bmot-rum-cay', 'research-source-bmot-flight-tables-current-review', 'research-source-southern-air-travel-guide', 'research-source-bahamas-ferries-current-passenger-reconciliation', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'not_applicable_identity', accessStatus: 'partial_official_context', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'identity_only',
    evidence: 'The island profile identifies Port Nelson as Rum Cay’s only inhabited town and says its airport receives Nassau flights, but the operator audit did not find a Rum Cay route on the reviewed Southern Air page and found no scheduled passenger ferry.',
    unresolved: 'Confirm the actual operator and date, charter or marine alternative, arrival permission, airport/dock transfer, accommodation and provisioning, weather limits, accessibility, emergency fallback, and an area rather than POI model.',
  },
  {
    islandSlug: 'rum-cay', title: 'HMS Conqueror Shipwreck',
    sourceIds: ['research-source-bmot-rum-cay', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'permission_or_guide_required', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The official island profile identifies the wreck on Sumner Point Reef, says it lies under 30 feet of water, and calls it an underwater museum; the map provides one marine point.',
    unresolved: 'Confirm the managing heritage authority, protected status, legal access, exact wreck boundary versus point, responsible dive operator, mooring, sea state, skill/equipment, emergency plan, accessibility, and disclosure policy.',
  },
  {
    islandSlug: 'rum-cay', title: 'Hartford Cave',
    sourceIds: ['research-source-bmot-rum-cay', 'research-source-bmot-hartford-cave', 'research-source-operator-rum-cay-heritage-unavailable', mapSource],
    identitySourceIds: ['research-source-bmot-hartford-cave'],
    responsibleSourceStatus: 'current_official_listing_only', operationStatus: 'current_official_listing_only', accessStatus: 'unresolved', safetyStatus: 'not_established', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The official attraction page identifies a protected historical cave with Lucayan-Arawak material and lists a District Council contact, but its outbound heritage site was unavailable when checked.',
    unresolved: 'Confirm the responsible heritage authority, protection and disclosure rules, permission, guide, exact entrance, cave condition, wildlife/air/terrain hazards, accessibility, photography, emergency plan, and whether the point should be public.',
  },
  {
    islandSlug: 'san-salvador', title: 'Gerace Research Centre',
    sourceIds: ['research-source-bmot-san-salvador', 'research-source-operator-gerace-research-centre', mapSource],
    identitySourceIds: [],
    responsibleSourceStatus: 'current_responsible_operator', operationStatus: 'current_responsible_operation', accessStatus: 'permission_or_guide_required', safetyStatus: 'general_caution_only', accessibilityStatus: 'not_published', copyStatus: 'source_backed_internal_only',
    evidence: 'The responsible institution currently identifies itself as a San Salvador research and education facility rather than a walk-in attraction.',
    unresolved: 'Confirm program eligibility, group arrangements, dates and capacity, permission, airport transfer, accessibility, health and safety requirements, visitor conditions, and approved media before any traveler recommendation.',
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

const documents = readNdjson(candidateSeedPath)
const pointCandidates = documents.filter((document) =>
  document._type === 'canonicalPlaceCandidate' &&
  document.locationReview?.reconciliationStatus === 'official_point_candidate',
)
const candidateById = new Map(pointCandidates.map((document) => [document._id, document]))

if (pointCandidates.length !== 19) throw new Error(`Expected 19 point candidates, found ${pointCandidates.length}`)
if (reviewSpecs.length !== 19) throw new Error(`Expected 19 review specs, found ${reviewSpecs.length}`)

for (const row of reviewSpecs) {
  const candidate = candidateById.get(row.candidateId)
  if (!candidate) throw new Error(`Readiness spec has no point candidate: ${row.candidateId}`)
  if (candidate.title !== row.title) throw new Error(`Candidate title mismatch for ${row.candidateId}`)
  if (candidate.locationReview?.reviewDecision === 'accepted') throw new Error(`Unexpected accepted point: ${row.candidateId}`)
}

const coveredIds = new Set(reviewSpecs.map((row) => row.candidateId))
const uncovered = pointCandidates.filter((document) => !coveredIds.has(document._id)).map((document) => document._id)
if (uncovered.length) throw new Error(`Uncovered point candidates: ${uncovered.join(', ')}`)

const report = {
  generatedAt: new Date().toISOString(),
  checkedAt,
  methodology: {
    scope: 'All 19 missing official signature-place identities with one official point candidate.',
    sourceRule: 'Current national-tourism, government, managing-authority, responsible-operator, and already-reviewed transport sources are kept distinct. A related private operator does not control a whole cay, and a current listing does not prove access.',
    readinessRule: 'Operation, access, safety, accessibility, copy, media rights, and delivery are separate gates. One point cannot pass them by implication.',
    guardrail: 'Read-only audit. Every row remains blocked; no point is accepted, no Supabase record is created, and no delivery channel or public content is enabled.',
  },
  counts: {
    candidates: reviewSpecs.length,
    islands: new Set(reviewSpecs.map((row) => row.islandSlug)).size,
    sourceConflicts: reviewSpecs.filter((row) => row.responsibleSourceStatus === 'source_conflict').length,
    responsibleAuthoritiesOrOperators: reviewSpecs.filter((row) => ['current_managing_authority', 'current_responsible_operator', 'current_government_authority'].includes(row.responsibleSourceStatus)).length,
    officialListingOnlyOrRelatedOperator: reviewSpecs.filter((row) => ['current_official_listing_only', 'related_operator_only'].includes(row.responsibleSourceStatus)).length,
    accessibilityPublished: reviewSpecs.filter((row) => row.accessibilityStatus === 'published').length,
    mediaRightsCleared: reviewSpecs.filter((row) => row.mediaStatus === 'rights_cleared').length,
    travelerDeliveryAllowed: reviewSpecs.filter((row) => row.deliveryDecision !== 'blocked').length,
  },
  rows: reviewSpecs,
}

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({output: outputPath, counts: report.counts}, null, 2))
