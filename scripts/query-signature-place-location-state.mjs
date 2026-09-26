import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const sourceIds = [
  'research-source-bmot-public-map-dataset',
  'research-source-operator-elbow-reef-lighthouse-visit',
  'research-source-bnt-inagua-national-park',
  'research-source-bmot-hoffmans-cay-blue-hole',
  'research-source-bmot-glass-window-bridge',
  'research-source-bmot-deans-blue-hole',
  'research-source-bmot-booby-cay',
  'research-source-bmot-watlings-blue-hole',
]

const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_id in $sourceIds]{_id, status},
  "facts": *[_type == "islandFact" && _id match "drafts.island-fact-signature-location-*"]{_id, title, verificationStatus, channels},
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.*" && title match "*signature-place location evidence*"]{
    _id,
    title,
    "island": destination->islandId,
    status,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"])
  },
  "placeDrafts": *[_type == "placeEditorial" && _id match "drafts.*" && defined(catalogLocationReview.reconciliationStatus)]{
    _id,
    title,
    islandName,
    active,
    channels,
    "status": catalogLocationReview.reconciliationStatus,
    "decision": catalogLocationReview.reviewDecision,
    "candidateCount": count(catalogLocationReview.candidates)
  },
  "publishedLocationOverlays": *[_type == "placeEditorial" && !(_id match "drafts.*") && defined(catalogLocationReview.reconciliationStatus)]{_id},
  "publishedLocationFacts": *[_type == "islandFact" && !(_id match "drafts.*") && _id match "island-fact-signature-location-*"]{_id},
  "publishedLocationAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*") && title match "*signature-place location evidence*"]{_id}
}`, {sourceIds})

function countStatus(status) {
  return documents.placeDrafts.filter((document) => document.status === status).length
}

const state = {
  production: {
    documents: documents.totalDocuments,
    sources: documents.totalSources,
    factDrafts: documents.totalFactDrafts,
    auditDrafts: documents.totalAuditDrafts,
  },
  counts: {
    sources: documents.sources.length,
    factDrafts: documents.facts.length,
    auditDrafts: documents.audits.length,
    placeReviewDrafts: documents.placeDrafts.length,
    canonicalPointCandidateDrafts: documents.placeDrafts.filter((document) => ['official_point_candidate', 'official_points_consistent'].includes(document.status)).length,
    conflictDrafts: countStatus('official_point_conflict'),
    relatedSiteOnlyDrafts: countStatus('official_related_site_point_only'),
    noCanonicalPointDrafts: documents.placeDrafts.filter((document) => ['identity_without_point', 'area_identity_no_point', 'official_identity_source_no_point'].includes(document.status)).length,
    placeReviewDraftsActive: documents.placeDrafts.filter((document) => document.active === true).length,
    placeReviewDraftsWithChannels: documents.placeDrafts.filter((document) => (document.channels || []).length > 0).length,
    acceptedCoordinateDecisions: documents.placeDrafts.filter((document) => document.decision === 'accepted').length,
    publishedLocationOverlays: documents.publishedLocationOverlays.length,
    publishedLocationFacts: documents.publishedLocationFacts.length,
    publishedLocationAudits: documents.publishedLocationAudits.length,
  },
  reconciliationStatuses: Object.fromEntries(
    [...new Set(documents.placeDrafts.map((document) => document.status))]
      .sort()
      .map((status) => [status, countStatus(status)]),
  ),
  audits: documents.audits.sort((left, right) => String(left.island).localeCompare(String(right.island))),
}

console.log(JSON.stringify(state, null, 2))
