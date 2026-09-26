import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})

const blockedSourceIds = [
  'research-source-ammc-public-site-no-program-detail',
  'research-source-operator-rum-cay-heritage-unavailable',
]

const candidateIds = [
  'drafts.canonical-place-candidate-nassau-paradise-island-queen-s-staircase',
  'drafts.canonical-place-candidate-nassau-paradise-island-fort-fincastle',
  'drafts.canonical-place-candidate-rum-cay-hartford-cave',
]

const relatedSourceIds = [
  ...blockedSourceIds,
  'research-source-bmot-nassau-paradise-island',
  'research-source-bmot-queens-staircase',
  'research-source-bmot-queens-staircase-natural-wonder',
  'research-source-bmot-fort-fincastle',
  'research-source-bmot-rum-cay',
  'research-source-bmot-hartford-cave',
  'research-source-bmot-public-map-dataset',
  'research-source-rgd-family-island-administration-offices',
  'research-source-bmot-general-contact-2026',
  'research-source-opm-queens-staircase-rededication-2024',
  'research-source-laws-antiquities-monuments-museum-act-2017-revision',
  'research-source-bmot-rum-cay-district-council-contact',
]

const relatedFactIds = [
  'drafts.island-fact-signature-identity-readiness-queen-s-staircase-nassau-paradise-island',
  'drafts.island-fact-signature-identity-readiness-fort-fincastle-nassau-paradise-island',
  'drafts.island-fact-signature-point-readiness-hartford-cave-rum-cay',
  'drafts.island-fact-signature-place-content-readiness-queen-s-staircase-nassau-paradise-island',
  'drafts.island-fact-signature-place-content-readiness-fort-fincastle-nassau-paradise-island',
  'drafts.island-fact-signature-place-content-readiness-hartford-cave-rum-cay',
]

const result = await client.fetch(`{
  "blockedSources": *[_id in $blockedSourceIds] | order(_id asc) {
    _id,
    _type,
    title,
    url,
    publisher,
    sourceClass,
    authorityLevel,
    "destinations": destinations[]->islandId,
    topics,
    checkedAt,
    nextReviewAt,
    status,
    notes,
    replacementBoundary,
    replacementSources[]->{_id, title, url, status},
    reviewPlan
  },
  "relatedSources": *[_id in $relatedSourceIds] | order(_id asc) {
    _id,
    title,
    url,
    publisher,
    sourceClass,
    authorityLevel,
    "destinations": destinations[]->islandId,
    topics,
    checkedAt,
    nextReviewAt,
    status,
    notes,
    reviewPlan
  },
  "directReferences": *[references($blockedSourceIds)] | order(_type asc, _id asc) {
    _id,
    _type,
    title,
    "destinationSlug": destination->islandId,
    auditedAt,
    status,
    verificationStatus,
    canonicalCreationStatus,
    "sourceRefs": sources[]._ref,
    "identityEvidenceRefs": identityEvidence[]._ref,
    "travelerReadinessSourceRefs": travelerReadinessReview.sources[]._ref,
    "gapCount": count(gaps),
    "openP0Count": count(gaps[priority == "p0" && status in ["open", "researching"]])
  },
  "candidates": *[_id in $candidateIds] | order(_id asc) {
    _id,
    _type,
    title,
    islandName,
    canonicalCreationStatus,
    sourceAdjudicationStatus,
    identityEvidence[]->{_id, title, url, status},
    travelerReadinessReview {
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
      notes,
      sources[]->{_id, title, url, status}
    }
  },
  "relatedFacts": *[_id in $relatedFactIds] | order(_id asc) {
    _id,
    title,
    "destinationSlug": destination->islandId,
    topic,
    claim,
    travelerGuidance,
    sources[]->{_id, title, url, status},
    checkedAt,
    nextReviewAt,
    volatility,
    confidence,
    verificationStatus,
    editorNotes,
    channels
  }
}`, {blockedSourceIds, candidateIds, relatedSourceIds, relatedFactIds})

result.counts = {
  blockedSources: result.blockedSources.length,
  relatedSources: result.relatedSources.length,
  directReferences: result.directReferences.length,
  candidates: result.candidates.length,
  relatedFacts: result.relatedFacts.length,
}

console.log(JSON.stringify(result, null, 2))
