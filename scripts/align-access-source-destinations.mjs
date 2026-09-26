import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-04'})

const sourceConfigurations = {
  'research-source-doa-airports': [
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
  ],
  'research-source-bahamas-ferries-travel': [
    'abacos',
    'andros',
    'cat-island',
    'eleuthera-harbour-island',
    'grand-bahama',
    'nassau-paradise-island',
    'the-exumas',
  ],
}

const allSlugs = [...new Set(Object.values(sourceConfigurations).flat())]
const [sources, destinationDocuments] = await Promise.all([
  client.fetch(
    `*[_id in $sourceIds]{_id, _rev, destinations[]{_key, _ref}}`,
    {sourceIds: Object.keys(sourceConfigurations)},
    {perspective: 'raw'},
  ),
  client.fetch(
    `*[_type == "destination" && !(_id match "drafts.*") && islandId in $allSlugs]{_id, islandId}`,
    {allSlugs},
    {perspective: 'raw'},
  ),
])

const sourceById = new Map(sources.map((source) => [source._id, source]))
const destinationBySlug = new Map(destinationDocuments.map((document) => [document.islandId, document._id]))
const missingSlugs = allSlugs.filter((slug) => !destinationBySlug.has(slug))
if (missingSlugs.length) throw new Error(`Missing published destinations: ${missingSlugs.join(', ')}`)

const results = []
for (const [sourceId, islandSlugs] of Object.entries(sourceConfigurations)) {
  const source = sourceById.get(sourceId)
  if (!source?._rev) throw new Error(`Missing live source document: ${sourceId}`)
  const desiredDestinations = islandSlugs.map((slug) => ({
    _type: 'reference',
    _key: `destination-${slug}`,
    _ref: destinationBySlug.get(slug),
  }))
  const currentRefs = (source.destinations || []).map((reference) => reference._ref).sort()
  const desiredRefs = desiredDestinations.map((reference) => reference._ref).sort()
  if (JSON.stringify(currentRefs) === JSON.stringify(desiredRefs)) {
    results.push({sourceId, status: 'already_aligned', destinationCount: desiredDestinations.length})
    continue
  }
  const updated = await client
    .patch(sourceId)
    .set({destinations: desiredDestinations})
    .ifRevisionId(source._rev)
    .commit()
  results.push({
    sourceId,
    status: 'updated',
    previousDestinationCount: currentRefs.length,
    destinationCount: desiredDestinations.length,
    revision: updated._rev,
  })
}

console.log(JSON.stringify(results, null, 2))
