import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const sourceIds = [
  'research-source-opm-queens-staircase-rededication-2024',
  'research-source-laws-antiquities-monuments-museum-act-2017-revision',
  'research-source-bmot-rum-cay-district-council-contact',
  'research-source-bmot-general-contact-2026',
]
const blockedSourceIds = [
  'research-source-ammc-public-site-no-program-detail',
  'research-source-operator-rum-cay-heritage-unavailable',
]
const candidateIds = [
  'drafts.canonical-place-candidate-nassau-paradise-island-queen-s-staircase',
  'drafts.canonical-place-candidate-nassau-paradise-island-fort-fincastle',
  'drafts.canonical-place-candidate-rum-cay-hartford-cave',
]
const factIds = [
  'drafts.island-fact-source-replacement-queens-staircase-restoration-nassau-paradise-island',
  'drafts.island-fact-source-replacement-fort-fincastle-tour-listing-nassau-paradise-island',
  'drafts.island-fact-source-replacement-hartford-cave-contact-boundary-rum-cay',
]
const auditIds = [
  'drafts.island-research-audit-2026-08-05-source-replacement-evidence-nassau-paradise-island',
  'drafts.island-research-audit-2026-08-05-source-replacement-evidence-rum-cay',
]

const documents = await client.fetch(`{
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "newSources": *[_id in $sourceIds] | order(_id asc) {
    _id, title, url, authorityLevel, status, checkedAt, nextReviewAt, reviewPlan
  },
  "blockedSources": *[_id in $blockedSourceIds] | order(_id asc) {
    _id, title, status, notes, replacementBoundary,
    "replacementSourceIds": replacementSources[]._ref,
    reviewPlan
  },
  "candidates": *[_id in $candidateIds] | order(_id asc) {
    _id, title, canonicalCreationStatus,
    "coordinateDecision": locationReview.reviewDecision,
    "hasActive": defined(active),
    "hasChannels": defined(channels),
    travelerReadinessReview {
      overallStatus, accessibilityStatus, mediaStatus, deliveryDecision,
      "sourceIds": sources[]._ref
    }
  },
  "facts": *[_id in $factIds] | order(_id asc) {
    _id, title, confidence, verificationStatus, channels,
    "sourceIds": sources[]._ref
  },
  "audits": *[_id in $auditIds] | order(_id asc) {
    _id, title, status,
    "destinationSlug": destination->islandId,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"]),
    "sourceIds": sources[]._ref
  },
  "publishedFacts": *[_id in $publishedFactIds]{_id},
  "publishedAudits": *[_id in $publishedAuditIds]{_id}
}`, {
  sourceIds,
  blockedSourceIds,
  candidateIds,
  factIds,
  auditIds,
  publishedFactIds: factIds.map((id) => id.replace(/^drafts\./, '')),
  publishedAuditIds: auditIds.map((id) => id.replace(/^drafts\./, '')),
}, {perspective: 'raw'})

const requiredCandidateSources = {
  "Queen's Staircase": ['research-source-opm-queens-staircase-rededication-2024', 'research-source-laws-antiquities-monuments-museum-act-2017-revision'],
  'Fort Fincastle': ['research-source-opm-queens-staircase-rededication-2024', 'research-source-laws-antiquities-monuments-museum-act-2017-revision'],
  'Hartford Cave': ['research-source-bmot-rum-cay-district-council-contact', 'research-source-laws-antiquities-monuments-museum-act-2017-revision'],
}

const state = {
  production: {
    sources: documents.totalSources,
    factDrafts: documents.totalFactDrafts,
    auditDrafts: documents.totalAuditDrafts,
  },
  counts: {
    newSources: documents.newSources.length,
    blockedSources: documents.blockedSources.length,
    candidateDrafts: documents.candidates.length,
    factDrafts: documents.facts.length,
    auditDrafts: documents.audits.length,
    openP0Gaps: documents.audits.reduce((sum, document) => sum + document.openP0, 0),
    resolvedEvidenceTasks: documents.audits.reduce((sum, document) => sum + document.resolved, 0),
    publishedFacts: documents.publishedFacts.length,
    publishedAudits: documents.publishedAudits.length,
  },
  guardrails: {
    allFourPackageSourcesPresentAndScheduled: documents.newSources.length === 4 && documents.newSources.every((document) => document.status === 'active' && document.reviewPlan?.workflowStatus === 'scheduled'),
    bothUnavailableSourcesHaveBoundedReplacements: documents.blockedSources.length === 2 && documents.blockedSources.every((document) => document.status === 'unavailable' && document.reviewPlan?.workflowStatus === 'replacement_recorded' && document.replacementSourceIds?.length >= 4 && document.replacementBoundary?.length > 300),
    allCandidateEvidenceLinked: documents.candidates.length === 3 && documents.candidates.every((document) => requiredCandidateSources[document.title].every((id) => document.travelerReadinessReview?.sourceIds?.includes(id))),
    candidatesRemainBlockedResearchDrafts: documents.candidates.length === 3 && documents.candidates.every((document) => document.canonicalCreationStatus === 'researching' && document.travelerReadinessReview?.overallStatus === 'blocked' && document.travelerReadinessReview?.deliveryDecision === 'blocked'),
    noAcceptedCoordinates: documents.candidates.every((document) => document.coordinateDecision !== 'accepted'),
    noCandidateActivationOrChannels: documents.candidates.every((document) => !document.hasActive && !document.hasChannels),
    noAccessibilityOrMediaApproval: documents.candidates.every((document) => document.travelerReadinessReview?.accessibilityStatus !== 'published' && document.travelerReadinessReview?.mediaStatus !== 'rights_cleared'),
    allFactsDraftAndChannelFree: documents.facts.length === 3 && documents.facts.every((document) => document.verificationStatus === 'source_verified' && (document.channels || []).length === 0),
    bothAuditsDraftAndResearching: documents.audits.length === 2 && documents.audits.every((document) => document.status === 'researching'),
    nothingPublished: documents.publishedFacts.length === 0 && documents.publishedAudits.length === 0,
  },
  newSources: documents.newSources,
  blockedSources: documents.blockedSources,
  facts: documents.facts,
  audits: documents.audits,
  candidates: documents.candidates,
}

console.log(JSON.stringify(state, null, 2))
