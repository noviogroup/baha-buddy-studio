import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const sourceIds = [
  'research-source-bmot-queens-staircase',
  'research-source-bmot-queens-staircase-natural-wonder',
  'research-source-bmot-fountain-of-youth-bimini',
  'research-source-bmot-fort-fincastle',
  'research-source-operator-dolphin-house-museum',
  'research-source-operator-dolphin-house-contact',
  'research-source-bmot-acklins-lucayan-indian-sites',
  'research-source-bmot-st-peter-st-paul-catholic-church',
]

const candidateIds = [
  'drafts.canonical-place-candidate-bimini-fountain-of-youth',
  'drafts.canonical-place-candidate-nassau-paradise-island-queen-s-staircase',
  'drafts.canonical-place-candidate-nassau-paradise-island-fort-fincastle',
  'drafts.canonical-place-candidate-acklins-crooked-island-ancient-lucayan-sites',
  'drafts.canonical-place-candidate-long-island-twin-churches',
  'drafts.canonical-place-candidate-bimini-dolphin-house-museum',
  'drafts.canonical-place-candidate-cat-island-sir-sidney-poitier-s-boyhood-home',
  'drafts.canonical-place-candidate-ragged-island-pigeon-cay',
]
const publishedCandidateIds = candidateIds.map((id) => id.replace(/^drafts\./, ''))

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_id in $sourceIds]{_id, title, url, checkedAt, status},
  "facts": *[_type == "islandFact" && _id match "drafts.island-fact-signature-adjudication-*"]{
    _id, title, verificationStatus, channels
  },
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.island-research-audit-2026-08-05-signature-place-source-adjudication-*"]{
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
    adjudicatedAt,
    "locationStatus": locationReview.reconciliationStatus,
    "decision": locationReview.reviewDecision,
    "pointCandidates": locationReview.candidates[]{
      sourceRecordId,
      relationship,
      confidence,
      location
    },
    "hasActive": defined(active),
    "hasChannels": defined(channels)
  },
  "publishedCandidates": *[_id in $publishedCandidateIds]{_id},
  "publishedFacts": *[_type == "islandFact" && !(_id match "drafts.*") && _id match "island-fact-signature-adjudication-*"]{_id},
  "publishedAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && _id match "island-research-audit-2026-08-05-signature-place-source-adjudication-*"]{_id}
}`, {sourceIds, candidateIds, publishedCandidateIds})

const sourceById = new Map(documents.sources.map((source) => [source._id, source]))
const queenAddress = sourceById.get('research-source-bmot-queens-staircase')
const queenNatural = sourceById.get('research-source-bmot-queens-staircase-natural-wonder')

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
    acceptedCoordinateDecisions: documents.candidates.filter((document) => document.decision === 'accepted').length,
    candidateDocsWithActiveField: documents.candidates.filter((document) => document.hasActive).length,
    candidateDocsWithChannelsField: documents.candidates.filter((document) => document.hasChannels).length,
    factDraftsWithChannels: documents.facts.filter((document) => (document.channels || []).length > 0).length,
    publishedCandidates: documents.publishedCandidates.length,
    publishedFacts: documents.publishedFacts.length,
    publishedAudits: documents.publishedAudits.length,
  },
  guardrails: {
    allEightSourcesPresent: documents.sources.length === 8,
    allEightFactsAreDraftsAndChannelFree: documents.facts.length === 8 && documents.facts.every((document) => (document.channels || []).length === 0),
    allSixAuditsAreDrafts: documents.audits.length === 6,
    allEightCandidatesRemainResearching: documents.candidates.length === 8 && documents.candidates.every((document) => document.canonicalCreationStatus === 'researching'),
    noAcceptedCoordinates: documents.candidates.every((document) => document.decision !== 'accepted'),
    noCandidateActivationOrChannels: documents.candidates.every((document) => !document.hasActive && !document.hasChannels),
    noPublishedTrancheDocuments: documents.publishedCandidates.length === 0 && documents.publishedFacts.length === 0 && documents.publishedAudits.length === 0,
    queenSourceIdsAreDistinct: Boolean(queenAddress && queenNatural && queenAddress._id !== queenNatural._id),
    queenAddressSourceRestored: queenAddress?.url === 'https://www.bahamas.com/plan-your-trip/things-to-do/the-queens-staircase',
    queenNaturalSourceSeparated: queenNatural?.url === 'https://www.bahamas.com/natural-wonders/queens-staircase',
  },
  sourceAdjudicationStatuses: Object.fromEntries(
    [...new Set(documents.candidates.map((document) => document.sourceAdjudicationStatus))]
      .filter(Boolean)
      .sort()
      .map((status) => [status, documents.candidates.filter((document) => document.sourceAdjudicationStatus === status).length]),
  ),
  sources: documents.sources.sort((left, right) => left._id.localeCompare(right._id)),
  candidates: documents.candidates.sort((left, right) => left._id.localeCompare(right._id)),
  audits: documents.audits.sort((left, right) => String(left.island).localeCompare(String(right.island))),
}

console.log(JSON.stringify(state, null, 2))
