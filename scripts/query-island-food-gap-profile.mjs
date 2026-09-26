import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})

const today = '2026-08-05'
const missingSlugs = [
  'abacos',
  'acklins-crooked-island',
  'andros',
  'bimini',
  'cat-island',
  'eleuthera-harbour-island',
  'grand-bahama',
  'long-island',
  'mayaguana',
  'nassau-paradise-island',
  'ragged-island',
  'san-salvador',
  'the-exumas',
]

const documents = await client.fetch(`{
  "destinations": *[_type == "destination" && !(_id match "drafts.*") && islandId in $missingSlugs] | order(islandId asc) {
    _id, "slug": islandId, name
  },
  "facts": *[_type == "islandFact" && _id match "drafts.*" && topic == "food" && destination->islandId in $missingSlugs] | order(destination->islandId asc, title asc) {
    _id, title, claim, confidence, verificationStatus, checkedAt, nextReviewAt,
    "slug": destination->islandId,
    "sources": sources[]->{_id, title, url, sourceClass, authorityLevel, status, nextReviewAt}
  },
  "sources": *[_type == "researchSource" && "food" in topics && count(destinations[@->islandId in $missingSlugs]) > 0] | order(_id asc) {
    _id, title, url, publisher, sourceClass, authorityLevel, status, checkedAt, nextReviewAt,
    "slugs": destinations[]->islandId
  }
}`, {missingSlugs}, {perspective: 'raw'})

const result = {
  generatedAt: new Date().toISOString(),
  boundary: 'A candidate source is current, active, routed to the island and explicitly routed to food. It is a research lead, not automatic support for a fact or current restaurant operation.',
  counts: {
    missingFoodCells: missingSlugs.length,
    existingFoodFactDrafts: documents.facts.length,
    routedFoodSources: documents.sources.length,
  },
  islands: documents.destinations.map((destination) => {
    const facts = documents.facts.filter((fact) => fact.slug === destination.slug)
    const candidateSources = documents.sources.filter((source) =>
      source.status === 'active' && source.nextReviewAt >= today && source.slugs?.includes(destination.slug),
    )
    return {
      slug: destination.slug,
      name: destination.name,
      existingFacts: facts,
      candidateSources,
      candidateCount: candidateSources.length,
    }
  }),
}

if (documents.destinations.length !== missingSlugs.length) {
  throw new Error(`Expected ${missingSlugs.length} destinations, found ${documents.destinations.length}`)
}

console.log(JSON.stringify(result, null, 2))
