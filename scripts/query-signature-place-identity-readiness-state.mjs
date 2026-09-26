import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const sourceIds = [
  'research-source-bmot-hope-town-current',
  'research-source-bmot-turtle-sound',
  'research-source-laws-cat-island-port-howe-community',
  'research-source-bmot-eleuthera-pineapple-fields-identity',
  'research-source-bmot-spanish-wells-community-access',
  'research-source-bmot-cape-santa-maria-beach',
  'research-source-operator-cape-santa-maria-current',
  'research-source-ammc-public-site-no-program-detail',
]

const candidateIds = [
  'drafts.canonical-place-candidate-abacos-hope-town',
  'drafts.canonical-place-candidate-acklins-crooked-island-ancient-lucayan-sites',
  'drafts.canonical-place-candidate-acklins-crooked-island-turtle-sound',
  'drafts.canonical-place-candidate-andros-west-side-national-park',
  'drafts.canonical-place-candidate-bimini-dolphin-house-museum',
  'drafts.canonical-place-candidate-bimini-fountain-of-youth',
  'drafts.canonical-place-candidate-cat-island-sir-sidney-poitier-s-boyhood-home',
  'drafts.canonical-place-candidate-cat-island-port-howe',
  'drafts.canonical-place-candidate-eleuthera-harbour-island-pineapple-fields',
  'drafts.canonical-place-candidate-eleuthera-harbour-island-spanish-wells',
  'drafts.canonical-place-candidate-long-island-cape-santa-maria-beach',
  'drafts.canonical-place-candidate-long-island-columbus-point',
  'drafts.canonical-place-candidate-long-island-twin-churches',
  'drafts.canonical-place-candidate-nassau-paradise-island-queen-s-staircase',
  'drafts.canonical-place-candidate-nassau-paradise-island-fort-fincastle',
  'drafts.canonical-place-candidate-ragged-island-jumentos-cays',
  'drafts.canonical-place-candidate-ragged-island-pigeon-cay',
  'drafts.canonical-place-candidate-san-salvador-bonefish-bay-beach',
]
const publishedCandidateIds = candidateIds.map((id) => id.replace(/^drafts\./, ''))

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "allCandidateDrafts": count(*[_type == "canonicalPlaceCandidate" && _id match "drafts.*"]),
  "candidateDraftsWithReadiness": count(*[_type == "canonicalPlaceCandidate" && _id match "drafts.*" && defined(travelerReadinessReview)]),
  "candidateDraftsMissingReadiness": count(*[_type == "canonicalPlaceCandidate" && _id match "drafts.*" && !defined(travelerReadinessReview)]),
  "sources": *[_id in $sourceIds]{_id, title, url, checkedAt, nextReviewAt, status},
  "facts": *[_type == "islandFact" && _id match "drafts.island-fact-signature-identity-readiness-*"]{
    _id, title, verificationStatus, channels
  },
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.island-research-audit-2026-08-05-signature-place-identity-readiness-*"]{
    _id,
    title,
    "island": destination->islandId,
    status,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"])
  },
  "candidates": *[_id in $candidateIds]{
    _id,
    title,
    islandName,
    canonicalCreationStatus,
    sourceAdjudicationStatus,
    "locationStatus": locationReview.reconciliationStatus,
    "locationConfidence": locationReview.locationConfidence,
    "coordinateDecision": locationReview.reviewDecision,
    travelerReadinessReview{
      checkedAt,
      nextReviewAt,
      overallStatus,
      responsibleSourceStatus,
      operationStatus,
      accessStatus,
      safetyStatus,
      accessibilityStatus,
      copyStatus,
      mediaStatus,
      deliveryDecision,
      "sourceCount": count(sources)
    },
    "hasActive": defined(active),
    "hasChannels": defined(channels)
  },
  "publishedCandidates": *[_id in $publishedCandidateIds]{_id},
  "publishedFacts": *[_type == "islandFact" && !(_id match "drafts.*") && _id match "island-fact-signature-identity-readiness-*"]{_id},
  "publishedAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && _id match "island-research-audit-2026-08-05-signature-place-identity-readiness-*"]{_id}
}`, {sourceIds, candidateIds, publishedCandidateIds})

const candidateByTitle = new Map(documents.candidates.map((candidate) => [candidate.title, candidate]))
const sourceById = new Map(documents.sources.map((source) => [source._id, source]))
const turtleSound = candidateByTitle.get('Turtle Sound')
const capeSantaMaria = candidateByTitle.get('Cape Santa Maria Beach')
const westSide = candidateByTitle.get('West Side National Park')
const queen = candidateByTitle.get("Queen's Staircase")
const fort = candidateByTitle.get('Fort Fincastle')

const state = {
  production: {
    documents: documents.totalDocuments,
    sources: documents.totalSources,
    factDrafts: documents.totalFactDrafts,
    auditDrafts: documents.totalAuditDrafts,
    candidateDrafts: documents.allCandidateDrafts,
    candidateDraftsWithReadiness: documents.candidateDraftsWithReadiness,
    candidateDraftsMissingReadiness: documents.candidateDraftsMissingReadiness,
  },
  counts: {
    trancheSources: documents.sources.length,
    factDrafts: documents.facts.length,
    auditDrafts: documents.audits.length,
    candidateDrafts: documents.candidates.length,
    approvedForSupabase: documents.candidates.filter((document) => document.canonicalCreationStatus === 'approved_for_supabase').length,
    acceptedCoordinateDecisions: documents.candidates.filter((document) => document.coordinateDecision === 'accepted').length,
    accessibilityPublished: documents.candidates.filter((document) => document.travelerReadinessReview?.accessibilityStatus === 'published').length,
    mediaRightsCleared: documents.candidates.filter((document) => document.travelerReadinessReview?.mediaStatus === 'rights_cleared').length,
    travelerDeliveryAllowed: documents.candidates.filter((document) => document.travelerReadinessReview && document.travelerReadinessReview.deliveryDecision !== 'blocked').length,
    candidateDocsWithActiveField: documents.candidates.filter((document) => document.hasActive).length,
    candidateDocsWithChannelsField: documents.candidates.filter((document) => document.hasChannels).length,
    factDraftsWithChannels: documents.facts.filter((document) => (document.channels || []).length > 0).length,
    publishedCandidates: documents.publishedCandidates.length,
    publishedFacts: documents.publishedFacts.length,
    publishedAudits: documents.publishedAudits.length,
  },
  guardrails: {
    allEightSourcesPresent: documents.sources.length === 8,
    allTenFactsAreDraftsAndChannelFree: documents.facts.length === 10 && documents.facts.every((document) => (document.channels || []).length === 0),
    allTenAuditsAreDrafts: documents.audits.length === 10,
    allEighteenCandidatesRemainResearching: documents.candidates.length === 18 && documents.candidates.every((document) => document.canonicalCreationStatus === 'researching'),
    allThirtySevenCandidateDraftsHaveReadinessReview: documents.allCandidateDrafts === 37 && documents.candidateDraftsWithReadiness === 37 && documents.candidateDraftsMissingReadiness === 0,
    everyTravelerDeliveryDecisionIsBlocked: documents.candidates.length === 18 && documents.candidates.every((document) => document.travelerReadinessReview?.deliveryDecision === 'blocked'),
    noAcceptedCoordinates: documents.candidates.every((document) => document.coordinateDecision !== 'accepted'),
    noAccessibilityClaimedPublished: documents.candidates.every((document) => document.travelerReadinessReview?.accessibilityStatus !== 'published'),
    noMediaRightsClaimedCleared: documents.candidates.every((document) => document.travelerReadinessReview?.mediaStatus !== 'rights_cleared'),
    noCandidateActivationOrChannels: documents.candidates.every((document) => !document.hasActive && !document.hasChannels),
    noPublishedTrancheDocuments: documents.publishedCandidates.length === 0 && documents.publishedFacts.length === 0 && documents.publishedAudits.length === 0,
    turtleSoundInvalidPointPreserved: turtleSound?.locationStatus === 'official_invalid_point' && turtleSound?.coordinateDecision !== 'accepted',
    capeSantaMariaOperatorBoundaryPreserved: capeSantaMaria?.travelerReadinessReview?.responsibleSourceStatus === 'related_operator_only',
    westSideManagingAuthorityPreserved: westSide?.travelerReadinessReview?.responsibleSourceStatus === 'current_managing_authority' && westSide?.travelerReadinessReview?.accessStatus === 'permission_or_guide_required',
    nassauPointConflictsRemainUnaccepted: queen?.locationStatus === 'official_point_conflict' && fort?.locationStatus === 'official_point_conflict' && queen?.coordinateDecision !== 'accepted' && fort?.coordinateDecision !== 'accepted',
    ammcProgramDetailRecordedUnavailable: sourceById.get('research-source-ammc-public-site-no-program-detail')?.status === 'unavailable',
  },
  locationStatuses: Object.fromEntries(
    [...new Set(documents.candidates.map((document) => document.locationStatus))]
      .filter(Boolean)
      .sort()
      .map((status) => [status, documents.candidates.filter((document) => document.locationStatus === status).length]),
  ),
  responsibleSourceStatuses: Object.fromEntries(
    [...new Set(documents.candidates.map((document) => document.travelerReadinessReview?.responsibleSourceStatus))]
      .filter(Boolean)
      .sort()
      .map((status) => [status, documents.candidates.filter((document) => document.travelerReadinessReview?.responsibleSourceStatus === status).length]),
  ),
  sources: documents.sources.sort((left, right) => left._id.localeCompare(right._id)),
  candidates: documents.candidates.sort((left, right) => left._id.localeCompare(right._id)),
  audits: documents.audits.sort((left, right) => String(left.island).localeCompare(String(right.island))),
}

console.log(JSON.stringify(state, null, 2))
