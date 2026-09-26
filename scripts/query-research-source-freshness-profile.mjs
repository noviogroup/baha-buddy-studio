import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const outputPath = process.env.RESEARCH_SOURCE_PROFILE_OUTPUT || '/private/tmp/baha-buddy-research-source-freshness-profile.json'
const today = '2026-08-05'

const sources = await client.fetch(`*[_type == "researchSource"] | order(_id asc){
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  url,
  publisher,
  sourceClass,
  authorityLevel,
  destinations[]{
    _type,
    _key,
    _ref,
    "slug": @->islandId,
    "name": @->name
  },
  topics,
  checkedAt,
  nextReviewAt,
  status,
  notes,
  replacementBoundary,
  replacementSources[]{_type, _key, _ref},
  reviewPlan{
    workflowStatus,
    freshnessStatus,
    cadenceBand,
    cadenceDays,
    sourceRelationship
  },
  "referenceCount": count(*[references(^._id)]),
  "factReferenceCount": count(*[_type == "islandFact" && references(^._id)]),
  "auditReferenceCount": count(*[_type == "islandResearchAudit" && references(^._id)]),
  "candidateReferenceCount": count(*[_type == "canonicalPlaceCandidate" && references(^._id)]),
  "placeReferenceCount": count(*[_type == "placeEditorial" && references(^._id)]),
  "facilityReferenceCount": count(*[_type == "emergencyFacility" && references(^._id)])
}`)

function daysBetween(left, right) {
  if (!left || !right) return null
  return Math.round((Date.parse(`${right}T00:00:00Z`) - Date.parse(`${left}T00:00:00Z`)) / 86_400_000)
}

function freshnessStatus(source) {
  if (['unavailable', 'rejected'].includes(source.status)) return 'unavailable_or_rejected'
  if (source.status === 'needs_recheck') return 'needs_recheck'
  if (!source.nextReviewAt) return 'review_date_missing'
  if (source.nextReviewAt < today) return 'overdue'
  if (source.nextReviewAt === today) return 'due_today'
  return 'current'
}

function replacementRecorded(source) {
  return ['unavailable', 'rejected'].includes(source.status)
    && (source.replacementSources || []).length > 0
    && Boolean(source.replacementBoundary)
}

function cadenceBand(source) {
  const days = daysBetween(source.checkedAt, source.nextReviewAt)
  if (days == null) return 'unassigned'
  if (days <= 35) return '30_day'
  if (days <= 100) return '90_day'
  if (days <= 200) return '180_day'
  if (days <= 400) return 'annual'
  return 'long_term'
}

function sourceRelationship(source) {
  if (source.authorityLevel === 'discovery_only') return 'discovery_lead_only'
  if (source.authorityLevel === 'corroborating') return 'corroborating_source'
  if (['government', 'conservation', 'transport_operator', 'operator'].includes(source.sourceClass)) return 'responsible_or_owning_publisher'
  if (source.sourceClass === 'national_tourism') return 'official_context_publisher'
  return 'primary_source_scope_requires_review'
}

const rows = sources.map((source) => ({
  ...source,
  destinationSlugs: [...new Set((source.destinations || []).map((destination) => destination.slug).filter(Boolean))],
  freshnessStatus: freshnessStatus(source),
  replacementRecorded: replacementRecorded(source),
  cadenceDays: source.reviewPlan?.cadenceDays ?? daysBetween(source.checkedAt, source.nextReviewAt),
  cadenceBand: source.reviewPlan?.cadenceBand ?? cadenceBand(source),
  sourceRelationship: source.reviewPlan?.sourceRelationship ?? sourceRelationship(source),
}))

function countBy(values, field) {
  return Object.fromEntries(
    [...new Set(values.map((value) => value[field] || 'missing'))]
      .sort()
      .map((key) => [key, values.filter((value) => (value[field] || 'missing') === key).length]),
  )
}

const islandGroups = new Map()
for (const row of rows) {
  for (const destination of row.destinations || []) {
    if (!destination.slug) continue
    const group = islandGroups.get(destination.slug) || {slug: destination.slug, name: destination.name, sources: []}
    group.sources.push(row)
    islandGroups.set(destination.slug, group)
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  asOf: today,
  methodology: {
    scope: 'All production researchSource documents in the raw Sanity perspective.',
    freshnessRule: 'Status and nextReviewAt are evaluated independently. Existing checkedAt-to-nextReviewAt intervals are profiled rather than silently replaced with a new cadence.',
    ownershipRule: 'Government, conservation, transport, and venue/operator primary sources are treated as responsible or owning publishers for their own scope. National tourism pages remain official context but do not automatically own live operation, safety, accessibility, or asset rights.',
    caveat: 'A source can cover multiple islands and is counted once globally but once within each referenced island. A missing destination reference is a routing gap, not proof that the source is irrelevant.',
  },
  counts: {
    sources: rows.length,
    islandGroups: islandGroups.size,
    sourcesWithNoDestination: rows.filter((row) => row.destinationSlugs.length === 0).length,
    multiIslandSources: rows.filter((row) => row.destinationSlugs.length > 1).length,
    sourcesWithNoNextReviewAt: rows.filter((row) => !row.nextReviewAt).length,
    sourcesWithNoReferences: rows.filter((row) => row.referenceCount === 0).length,
    sourcesReferencedByFacts: rows.filter((row) => row.factReferenceCount > 0).length,
    sourcesReferencedByAudits: rows.filter((row) => row.auditReferenceCount > 0).length,
    sourcesReferencedByPlaceWorkflows: rows.filter((row) => row.candidateReferenceCount > 0 || row.placeReferenceCount > 0).length,
    byFreshnessStatus: countBy(rows, 'freshnessStatus'),
    byCadenceBand: countBy(rows, 'cadenceBand'),
    bySourceClass: countBy(rows, 'sourceClass'),
    byAuthorityLevel: countBy(rows, 'authorityLevel'),
    bySourceRelationship: countBy(rows, 'sourceRelationship'),
  },
  islands: [...islandGroups.values()].sort((left, right) => left.slug.localeCompare(right.slug)).map((group) => ({
    slug: group.slug,
    name: group.name,
    sourceCount: group.sources.length,
    responsibleOrOwningPublisher: group.sources.filter((source) => source.sourceRelationship === 'responsible_or_owning_publisher').length,
    officialContextPublisher: group.sources.filter((source) => source.sourceRelationship === 'official_context_publisher').length,
    primarySourceScopeRequiresReview: group.sources.filter((source) => source.sourceRelationship === 'primary_source_scope_requires_review').length,
    corroboratingOrDiscovery: group.sources.filter((source) => ['corroborating_source', 'discovery_lead_only'].includes(source.sourceRelationship)).length,
    current: group.sources.filter((source) => source.freshnessStatus === 'current').length,
    dueOrOverdue: group.sources.filter((source) => ['due_today', 'overdue', 'needs_recheck'].includes(source.freshnessStatus)).length,
    unavailableOrRejected: group.sources.filter((source) => source.freshnessStatus === 'unavailable_or_rejected').length,
    missingReviewDate: group.sources.filter((source) => source.freshnessStatus === 'review_date_missing').length,
    sourceIdsRequiringAttention: group.sources
      .filter((source) => source.freshnessStatus !== 'current' && !source.replacementRecorded)
      .map((source) => ({_id: source._id, title: source.title, status: source.freshnessStatus, nextReviewAt: source.nextReviewAt || null})),
  })),
  sources: rows,
}

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({output: outputPath, counts: report.counts, islands: report.islands}, null, 2))
