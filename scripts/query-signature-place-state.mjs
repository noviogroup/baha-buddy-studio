import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const islandSlugs = [
  'abacos',
  'acklins-crooked-island',
  'andros',
  'berry-islands',
  'bimini',
  'cat-island',
  'eleuthera-harbour-island',
  'grand-bahama',
  'inagua',
  'long-island',
  'mayaguana',
  'nassau-paradise-island',
  'ragged-island',
  'rum-cay',
  'san-salvador',
  'the-exumas',
]
const sourceIds = ['research-source-operator-androsia', 'research-source-operator-nagb']
const documents = await client.fetch(`{
  "totalDocuments": count(*),
  "totalSources": count(*[_type == "researchSource"]),
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "sources": *[_id in $sourceIds]{_id, status},
  "facts": *[_type == "islandFact" && _id match "drafts.*"]{_id, title, verificationStatus, channels},
  "audits": *[_type == "islandResearchAudit" && _id match "drafts.*"] {
    _id,
    title,
    "island": destination->islandId,
    status,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"])
  },
  "placeDrafts": *[_type == "placeEditorial" && _id match "drafts.*"]{_id, active, channels, catalogReviewStatus, "sourceNotes": source.notes},
  "publishedSignatureOverlays": *[_type == "placeEditorial" && !(_id match "drafts.*") && defined(catalogReviewStatus)]{_id},
  "publishedSignatureFacts": *[_type == "islandFact" && !(_id match "drafts.*")]{_id, title},
  "publishedSignatureAudits": *[_type == "islandResearchAudit" && !(_id match "drafts.*")]{_id, title}
}`, {
  sourceIds,
})

const facts = documents.facts.filter((document) => document.title?.includes('source-backed catalog identity') || document.title?.includes('current identity and access caveat'))
const audits = documents.audits.filter((document) => document.title?.includes('official signature-place catalog crosswalk')).sort((left, right) => String(left.island).localeCompare(String(right.island)))
const placeDrafts = documents.placeDrafts.filter((document) => document.catalogReviewStatus || document.sourceNotes?.includes('Official signature-place review draft'))
const publishedFacts = documents.publishedSignatureFacts.filter((document) => document.title?.includes('source-backed catalog identity') || document.title?.includes('current identity and access caveat'))
const publishedAudits = documents.publishedSignatureAudits.filter((document) => document.title?.includes('official signature-place catalog crosswalk'))
const countStatus = (status) => placeDrafts.filter((document) => document.catalogReviewStatus === status).length
const state = {
  production: {
    documents: documents.totalDocuments,
    sources: documents.totalSources,
    factDrafts: documents.totalFactDrafts,
    auditDrafts: documents.totalAuditDrafts,
  },
  counts: {
    sources: documents.sources.length,
    factDrafts: facts.length,
    auditDrafts: audits.length,
    placeReviewDrafts: placeDrafts.length,
    placeReviewDraftsActive: placeDrafts.filter((document) => document.active === true).length,
    placeReviewDraftsWithChannels: placeDrafts.filter((document) => (document.channels || []).length > 0).length,
    publishedSignatureOverlays: documents.publishedSignatureOverlays.length,
    publishedSignatureFacts: publishedFacts.length,
    publishedSignatureAudits: publishedAudits.length,
  },
  reviewStatuses: {
    exactCandidate: countStatus('exact_candidate'),
    nameVariant: countStatus('name_variant'),
    locationBlocked: countStatus('location_blocked'),
    islandAssignmentConflict: countStatus('island_assignment_conflict'),
  },
  audits,
}

console.log(JSON.stringify(state, null, 2))
