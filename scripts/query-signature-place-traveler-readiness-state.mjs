import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const sourceIds = [
  'research-source-bmot-long-cay-access',
  'research-source-operator-chub-cay-current',
  'research-source-bmot-sugar-beach',
  'research-source-bmot-mount-alvernia',
  'research-source-bmot-thunderball-grotto',
  'research-source-bmot-great-inagua-lighthouse',
  'research-source-bmot-abrahams-bay-town-square',
  'research-source-bmot-pirates-well-bimini-conflict',
  'research-source-bmot-hartford-cave',
  'research-source-operator-rum-cay-heritage-unavailable',
  'research-source-opm-government-house-current-use',
]

const candidateIds = [
  'drafts.canonical-place-candidate-acklins-crooked-island-long-cay',
  'drafts.canonical-place-candidate-berry-islands-chub-cay',
  'drafts.canonical-place-candidate-berry-islands-sugar-beach',
  'drafts.canonical-place-candidate-bimini-ss-sapona-shipwreck',
  'drafts.canonical-place-candidate-cat-island-mount-alvernia-and-the-hermitage',
  'drafts.canonical-place-candidate-cat-island-old-bight-beach',
  'drafts.canonical-place-candidate-the-exumas-thunderball-grotto',
  'drafts.canonical-place-candidate-grand-bahama-peterson-cay-national-park',
  'drafts.canonical-place-candidate-grand-bahama-port-lucaya-marketplace',
  'drafts.canonical-place-candidate-inagua-great-inagua-lighthouse',
  'drafts.canonical-place-candidate-inagua-union-creek-reserve',
  'drafts.canonical-place-candidate-mayaguana-abraham-s-bay',
  'drafts.canonical-place-candidate-mayaguana-pirates-well',
  'drafts.canonical-place-candidate-nassau-paradise-island-government-house',
  'drafts.canonical-place-candidate-ragged-island-duncan-town',
  'drafts.canonical-place-candidate-rum-cay-port-nelson',
  'drafts.canonical-place-candidate-rum-cay-hms-conqueror-shipwreck',
  'drafts.canonical-place-candidate-rum-cay-hartford-cave',
  'drafts.canonical-place-candidate-san-salvador-gerace-research-centre',
]
const publishedCandidateIds = candidateIds.map((id) => id.replace(/^drafts\./, ''))

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_id in $sourceIds]{_id, title, url, checkedAt, nextReviewAt, status},
  "facts": *[_type == "islandFact" && _id match "drafts.island-fact-signature-point-readiness-*"]{
    _id, title, verificationStatus, channels
  },
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.island-research-audit-2026-08-05-signature-place-traveler-readiness-*"]{
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
  "publishedFacts": *[_type == "islandFact" && !(_id match "drafts.*") && _id match "island-fact-signature-point-readiness-*"]{_id},
  "publishedAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && _id match "island-research-audit-2026-08-05-signature-place-traveler-readiness-*"]{_id}
}`, {sourceIds, candidateIds, publishedCandidateIds})

const candidateByTitle = new Map(documents.candidates.map((candidate) => [candidate.title, candidate]))
const piratesWell = candidateByTitle.get('Pirates Well')
const chubCay = candidateByTitle.get('Chub Cay')

const state = {
  production: {
    documents: documents.totalDocuments,
    sources: documents.totalSources,
    factDrafts: documents.totalFactDrafts,
    auditDrafts: documents.totalAuditDrafts,
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
    allElevenSourcesPresent: documents.sources.length === 11,
    allThirteenFactsAreDraftsAndChannelFree: documents.facts.length === 13 && documents.facts.every((document) => (document.channels || []).length === 0),
    allTwelveAuditsAreDrafts: documents.audits.length === 12,
    allNineteenCandidatesRemainResearching: documents.candidates.length === 19 && documents.candidates.every((document) => document.canonicalCreationStatus === 'researching'),
    everyTravelerDeliveryDecisionIsBlocked: documents.candidates.length === 19 && documents.candidates.every((document) => document.travelerReadinessReview?.deliveryDecision === 'blocked'),
    noAcceptedCoordinates: documents.candidates.every((document) => document.coordinateDecision !== 'accepted'),
    noAccessibilityClaimedPublished: documents.candidates.every((document) => document.travelerReadinessReview?.accessibilityStatus !== 'published'),
    noMediaRightsClaimedCleared: documents.candidates.every((document) => document.travelerReadinessReview?.mediaStatus !== 'rights_cleared'),
    noCandidateActivationOrChannels: documents.candidates.every((document) => !document.hasActive && !document.hasChannels),
    noPublishedTrancheDocuments: documents.publishedCandidates.length === 0 && documents.publishedFacts.length === 0 && documents.publishedAudits.length === 0,
    piratesWellConflictPreserved: piratesWell?.travelerReadinessReview?.responsibleSourceStatus === 'source_conflict' && piratesWell?.locationConfidence === 'low',
    chubCayOperatorRestrictionPreserved: chubCay?.travelerReadinessReview?.accessStatus === 'operator_restricted',
  },
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
