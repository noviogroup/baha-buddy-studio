import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const checkedAt = '2026-08-05'
const nextAnnualReviewAt = '2027-08-05'
const expected = [
  ['abacos', 'culture'],
  ['berry-islands', 'culture'],
  ['berry-islands', 'nature'],
  ['grand-bahama', 'culture'],
  ['inagua', 'culture'],
  ['mayaguana', 'culture'],
  ['ragged-island', 'culture'],
  ['the-exumas', 'culture'],
  ['bimini', 'nature'],
  ['cat-island', 'nature'],
  ['rum-cay', 'nature'],
]

const slugs = [...new Set(expected.map(([slug]) => slug))]
const factIds = expected.map(([slug, topic]) => `drafts.island-fact-official-topic-baseline-${topic}-${slug}`)
const auditIds = slugs.map((slug) => `drafts.island-research-audit-${checkedAt}-official-culture-nature-baseline-${slug}`)

const documents = await client.fetch(`{
  "totalFactDrafts": count(*[_type == "islandFact" && _id match "drafts.*"]),
  "totalAuditDrafts": count(*[_type == "islandResearchAudit" && _id match "drafts.*"]),
  "facts": *[_id in $factIds] | order(destination->islandId asc, topic asc) {
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

const expectedKey = ([slug, topic]) => `${slug}:${topic}`
const actualFactKeys = new Set(documents.facts.map((document) => `${document.destinationSlug}:${document.topic}`))
const expectedFactsBySlug = new Map(slugs.map((slug) => [slug, expected.filter(([expectedSlug]) => expectedSlug === slug).length]))
const guardrails = {
  allElevenFactsPresent: documents.facts.length === 11,
  allTenAuditsPresent: documents.audits.length === 10,
  everyExpectedCellPresent: expected.every((row) => actualFactKeys.has(expectedKey(row))),
  allFactsAreCurrentSourceVerifiedHighConfidenceDrafts: documents.facts.every((document) => ['culture', 'nature'].includes(document.topic) && document.checkedAt === checkedAt && document.nextReviewAt === nextAnnualReviewAt && document.volatility === 'stable' && document.confidence === 'high' && document.verificationStatus === 'source_verified'),
  everyFactUsesOneCurrentActiveTopicSource: documents.facts.every((document) => document.sources?.length === 1 && document.sources.every((source) => source.status === 'active' && source.nextReviewAt >= checkedAt && source.topics?.includes(document.topic))),
  allFactsRemainChannelFree: documents.facts.every((document) => (document.channels || []).length === 0),
  allAuditsRemainResearchingWithOpenGates: documents.audits.every((document) => {
    const expectedFacts = expectedFactsBySlug.get(document.destinationSlug)
    return document.status === 'researching' && document.openP0 === expectedFacts + 1 && document.openP1 === 1 && document.resolved === expectedFacts
  }),
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
    cultureCells: documents.facts.filter((document) => document.topic === 'culture').length,
    natureCells: documents.facts.filter((document) => document.topic === 'nature').length,
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

if (Object.values(guardrails).some((value) => !value)) process.exitCode = 1
console.log(JSON.stringify(state, null, 2))
