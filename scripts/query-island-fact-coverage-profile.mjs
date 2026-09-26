import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const today = '2026-08-05'
const topics = [
  'overview',
  'access',
  'stays',
  'food',
  'experiences',
  'nature',
  'culture',
  'seasonality',
  'safety',
  'accessibility',
]

const documents = await client.fetch(`{
  "destinations": *[
    _type == "destination" && !(_id match "drafts.*") && defined(islandId)
  ] | order(islandId asc) {
    _id,
    "slug": islandId,
    name
  },
  "facts": *[
    _type == "islandFact" && _id match "drafts.*"
  ] | order(destination->islandId asc, topic asc, title asc) {
    _id,
    title,
    "slug": destination->islandId,
    topic,
    checkedAt,
    nextReviewAt,
    volatility,
    confidence,
    verificationStatus,
    travelerGuidance,
    channels,
    "sources": sources[]->{_id, title, status, authorityLevel, nextReviewAt}
  },
  "sources": *[_type == "researchSource"] | order(_id asc) {
    _id,
    title,
    url,
    publisher,
    sourceClass,
    authorityLevel,
    topics,
    status,
    nextReviewAt,
    "slugs": destinations[]->islandId
  },
  "publishedFacts": count(*[_type == "islandFact" && !(_id match "drafts.*")])
}`, {}, {perspective: 'raw'})

const destinationBySlug = new Map(documents.destinations.map((destination) => [destination.slug, destination]))

function isCurrent(fact) {
  return Boolean(fact.checkedAt && fact.nextReviewAt && fact.nextReviewAt >= today)
}

function hasOnlyUsableSources(fact) {
  return fact.sources?.length > 0 && fact.sources.every((source) =>
    source.status === 'active' && source.nextReviewAt && source.nextReviewAt >= today,
  )
}

function isEditoriallyUsableDraft(fact) {
  return fact.verificationStatus === 'source_verified' &&
    ['high', 'medium'].includes(fact.confidence) &&
    isCurrent(fact) &&
    hasOnlyUsableSources(fact)
}

const rows = documents.destinations.flatMap((destination) => topics.map((topic) => {
  const facts = documents.facts.filter((fact) => fact.slug === destination.slug && fact.topic === topic)
  const usable = facts.filter(isEditoriallyUsableDraft)
  return {
    slug: destination.slug,
    name: destination.name,
    topic,
    drafts: facts.length,
    sourceVerified: facts.filter((fact) => fact.verificationStatus === 'source_verified').length,
    current: facts.filter(isCurrent).length,
    usableActiveSourceDrafts: usable.length,
    highConfidenceUsableDrafts: usable.filter((fact) => fact.confidence === 'high').length,
    usableDraftsWithTravelerGuidance: usable.filter((fact) => fact.travelerGuidance?.trim()).length,
    approved: facts.filter((fact) => fact.verificationStatus === 'approved').length,
    withChannels: facts.filter((fact) => (fact.channels || []).length > 0).length,
    unusableSourceStatusDrafts: facts.filter((fact) => fact.sources?.some((source) => source.status !== 'active')).length,
    factIds: facts.map((fact) => fact._id),
  }
}))

const missing = rows.filter((row) => row.usableActiveSourceDrafts === 0)

function candidateSourcesFor(row) {
  return documents.sources.filter((source) =>
    source.status === 'active' &&
    source.nextReviewAt >= today &&
    source.slugs?.includes(row.slug) &&
    source.topics?.includes(row.topic),
  ).sort((left, right) => {
    const authorityRank = {primary: 0, corroborating: 1, discovery_only: 2}
    const classRank = {government: 0, conservation: 1, national_tourism: 2, operator: 3}
    return (authorityRank[left.authorityLevel] ?? 9) - (authorityRank[right.authorityLevel] ?? 9) ||
      (classRank[left.sourceClass] ?? 9) - (classRank[right.sourceClass] ?? 9) ||
      left._id.localeCompare(right._id)
  }).slice(0, 8).map(({_id, title, url, publisher, sourceClass, authorityLevel}) => ({
    _id, title, url, publisher, sourceClass, authorityLevel,
  }))
}

const islands = documents.destinations.map((destination) => {
  const islandRows = rows.filter((row) => row.slug === destination.slug)
  return {
    slug: destination.slug,
    name: destination.name,
    topicsWithUsableDrafts: islandRows.filter((row) => row.usableActiveSourceDrafts > 0).length,
    topicsMissingUsableDrafts: islandRows.filter((row) => row.usableActiveSourceDrafts === 0).map((row) => row.topic),
    usableActiveSourceDrafts: islandRows.reduce((sum, row) => sum + row.usableActiveSourceDrafts, 0),
    highConfidenceUsableDrafts: islandRows.reduce((sum, row) => sum + row.highConfidenceUsableDrafts, 0),
    approvedDrafts: islandRows.reduce((sum, row) => sum + row.approved, 0),
  }
})

const result = {
  generatedAt: new Date().toISOString(),
  methodology: {
    scope: 'All live draft islandFact documents joined to the 16 published canonical destinations in the raw Sanity perspective.',
    usableDraft: `Source verified; medium or high confidence; fact and every cited source reviewed through at least ${today}; every cited source status active.`,
    boundary: 'Usable here means internally reviewable evidence, not approved or traveler-deliverable content. Delivery still requires verificationStatus=approved and explicit channels.',
  },
  counts: {
    destinations: documents.destinations.length,
    topics: topics.length,
    matrixCells: rows.length,
    factDrafts: documents.facts.length,
    publishedFacts: documents.publishedFacts,
    usableActiveSourceDrafts: documents.facts.filter(isEditoriallyUsableDraft).length,
    missingIslandTopicCells: missing.length,
    completeIslandTopicCells: rows.length - missing.length,
    missingCellsWithCandidateSources: missing.filter((row) => candidateSourcesFor(row).length > 0).length,
    missingCellsWithoutCandidateSources: missing.filter((row) => candidateSourcesFor(row).length === 0).length,
    approvedDrafts: documents.facts.filter((fact) => fact.verificationStatus === 'approved').length,
    draftsWithChannels: documents.facts.filter((fact) => (fact.channels || []).length > 0).length,
  },
  missingByTopic: Object.fromEntries(topics.map((topic) => [
    topic,
    missing.filter((row) => row.topic === topic).map((row) => row.slug),
  ])),
  islands,
  missingCells: missing.map(({slug, name, topic, drafts, sourceVerified, unusableSourceStatusDrafts, factIds}) => ({
    slug,
    name,
    topic,
    drafts,
    sourceVerified,
    unusableSourceStatusDrafts,
    factIds,
    candidateSources: candidateSourcesFor({slug, topic}),
  })),
}

if (destinationBySlug.size !== 16 || rows.length !== 160) {
  throw new Error(`Expected 16 destinations and 160 matrix cells; found ${destinationBySlug.size} and ${rows.length}`)
}

console.log(JSON.stringify(result, null, 2))
