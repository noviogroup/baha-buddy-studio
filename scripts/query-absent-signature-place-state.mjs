import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const sourceIds = [
  'research-source-bnt-andros-west-side-national-park',
  'research-source-bnt-peterson-cay-national-park',
  'research-source-bnt-union-creek-reserve',
  'research-source-bmot-bimini-dolphin-house-profile',
  'research-source-bmot-sapona-shipwreck',
  'research-source-bmot-queens-staircase-natural-wonder',
  'research-source-bmot-government-house-nassau',
  'research-source-operator-port-lucaya-marketplace',
  'research-source-operator-gerace-research-centre',
]

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_id in $sourceIds]{_id, status},
  "facts": *[_type == "islandFact" && _id match "drafts.island-fact-canonical-candidate-*"]{_id, title, verificationStatus, channels},
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.*" && title match "*missing canonical signature-place candidates*"]{
    _id,
    title,
    "island": destination->islandId,
    status,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]])
  },
  "candidates": *[_type == "canonicalPlaceCandidate" && _id match "drafts.*"]{
    _id,
    title,
    islandName,
    featureType,
    canonicalCreationStatus,
    "status": locationReview.reconciliationStatus,
    "decision": locationReview.reviewDecision,
    "candidateCount": count(locationReview.candidates),
    "hasActive": defined(active),
    "hasChannels": defined(channels)
  },
  "publishedCandidates": *[_type == "canonicalPlaceCandidate" && !(_id match "drafts.*")]{_id},
  "publishedFacts": *[_type == "islandFact" && !(_id match "drafts.*") && _id match "island-fact-canonical-candidate-*"]{_id},
  "publishedAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && title match "*missing canonical signature-place candidates*"]{_id}
}`, {sourceIds})

function countStatus(status) {
  return documents.candidates.filter((document) => document.status === status).length
}

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
    canonicalPlaceCandidateDrafts: documents.candidates.length,
    pointCandidateDrafts: countStatus('official_point_candidate') + countStatus('official_points_consistent'),
    pointConflictDrafts: countStatus('official_point_conflict'),
    invalidPointDrafts: countStatus('official_invalid_point'),
    relatedSiteOnlyDrafts: countStatus('official_related_site_point_only'),
    areaIdentityDrafts: countStatus('area_identity_no_point'),
    sourceIdentityWithoutPointDrafts: countStatus('official_identity_source_no_point') + countStatus('identity_without_point'),
    approvedForSupabase: documents.candidates.filter((document) => document.canonicalCreationStatus === 'approved_for_supabase').length,
    acceptedCoordinateDecisions: documents.candidates.filter((document) => document.decision === 'accepted').length,
    candidateDocsWithActiveField: documents.candidates.filter((document) => document.hasActive).length,
    candidateDocsWithChannelsField: documents.candidates.filter((document) => document.hasChannels).length,
    publishedCandidates: documents.publishedCandidates.length,
    publishedFacts: documents.publishedFacts.length,
    publishedAudits: documents.publishedAudits.length,
  },
  reconciliationStatuses: Object.fromEntries(
    [...new Set(documents.candidates.map((document) => document.status))]
      .sort()
      .map((status) => [status, countStatus(status)]),
  ),
  audits: documents.audits.sort((left, right) => String(left.island).localeCompare(String(right.island))),
}

console.log(JSON.stringify(state, null, 2))
