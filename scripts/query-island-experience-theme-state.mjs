import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const checkedAt = '2026-08-05'
const nextAnnualReviewAt = '2027-08-05'
const slugs = [
  'abacos',
  'acklins-crooked-island',
  'andros',
  'berry-islands',
  'cat-island',
  'eleuthera-harbour-island',
  'inagua',
  'long-island',
  'mayaguana',
  'nassau-paradise-island',
  'ragged-island',
  'rum-cay',
  'san-salvador',
  'the-exumas',
]

const factIds = slugs.map((slug) => `drafts.island-fact-official-experience-theme-${slug}`)
const auditIds = slugs.map((slug) => `drafts.island-research-audit-${checkedAt}-official-experience-theme-baseline-${slug}`)

const documents = await client.fetch(`{
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "facts": *[_id in $factIds] | order(destination->islandId asc) {
    _id, title, topic, checkedAt, nextReviewAt, volatility, confidence,
    verificationStatus, channels,
    "destinationSlug": destination->islandId,
    "sources": sources[]->{_id, status, nextReviewAt, topics}
  },
  "audits": *[_id in $auditIds] | order(destination->islandId asc) {
    _id, title, status, auditedAt, nextAuditAt,
    "destinationSlug": destination->islandId,
    "openP0": count(gaps[priority == "p0" && status in ["open", "researching"]]),
    "openP1": count(gaps[priority == "p1" && status in ["open", "researching"]]),
    "resolved": count(gaps[status == "resolved"]),
    "sourceIds": sources[]._ref
  },
  "publishedFacts": *[_id in $publishedFactIds]{_id},
  "publishedAudits": *[_id in $publishedAuditIds]{_id}
}`, {
  factIds,
  auditIds,
  publishedFactIds: factIds.map((id) => id.replace(/^drafts\./, '')),
  publishedAuditIds: auditIds.map((id) => id.replace(/^drafts\./, '')),
}, {perspective: 'raw'})

const guardrails = {
  allFourteenFactsPresent: documents.facts.length === 14,
  allFourteenAuditsPresent: documents.audits.length === 14,
  oneFactPerExpectedIsland: new Set(documents.facts.map((document) => document.destinationSlug)).size === 14 && slugs.every((slug) => documents.facts.some((document) => document.destinationSlug === slug)),
  allFactsAreCurrentSourceVerifiedHighConfidenceDrafts: documents.facts.every((document) => document.topic === 'experiences' && document.checkedAt === checkedAt && document.nextReviewAt === nextAnnualReviewAt && document.volatility === 'stable' && document.confidence === 'high' && document.verificationStatus === 'source_verified'),
  everyFactUsesOneCurrentActiveExperienceSource: documents.facts.every((document) => document.sources?.length === 1 && document.sources.every((source) => source.status === 'active' && source.nextReviewAt >= checkedAt && source.topics?.includes('experiences'))),
  allFactsRemainChannelFree: documents.facts.every((document) => (document.channels || []).length === 0),
  allAuditsRemainResearchingWithOpenGates: documents.audits.every((document) => document.status === 'researching' && document.openP0 === 2 && document.openP1 === 1 && document.resolved === 1),
  noPublishedPackageDocuments: documents.publishedFacts.length === 0 && documents.publishedAudits.length === 0,
}

const state = {
  production: {
    factDrafts: documents.totalFactDrafts,
    auditDrafts: documents.totalAuditDrafts,
  },
  counts: {
    factDrafts: documents.facts.length,
    auditDrafts: documents.audits.length,
    islandsCovered: new Set(documents.facts.map((document) => document.destinationSlug)).size,
    openP0DeliveryGates: documents.audits.reduce((sum, document) => sum + document.openP0, 0),
    openP1EnrichmentGaps: documents.audits.reduce((sum, document) => sum + document.openP1, 0),
    resolvedEvidenceCells: documents.audits.reduce((sum, document) => sum + document.resolved, 0),
    publishedFacts: documents.publishedFacts.length,
    publishedAudits: documents.publishedAudits.length,
  },
  guardrails,
  facts: documents.facts,
  audits: documents.audits,
}

console.log(JSON.stringify(state, null, 2))
