import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-04'})

const sourceId = 'research-source-moh-family-islands-health-clinics'
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
  'ragged-island',
  'rum-cay',
  'san-salvador',
  'the-exumas',
]

const [source, destinationDocuments] = await Promise.all([
  client.fetch(`*[_id == $sourceId][0]{_id, _rev, destinations[]{_key, _ref}}`, {sourceId}, {perspective: 'raw'}),
  client.fetch(
    `*[_type == "destination" && !(_id match "drafts.*") && islandId in $islandSlugs]{_id, islandId}`,
    {islandSlugs},
    {perspective: 'raw'},
  ),
])

if (!source?._id || !source?._rev) throw new Error(`Missing live source document: ${sourceId}`)

const destinationBySlug = new Map(destinationDocuments.map((document) => [document.islandId, document._id]))
const missingSlugs = islandSlugs.filter((slug) => !destinationBySlug.has(slug))
if (missingSlugs.length) throw new Error(`Missing published destinations: ${missingSlugs.join(', ')}`)

const desiredDestinations = islandSlugs.map((slug) => ({
  _type: 'reference',
  _key: `destination-${slug}`,
  _ref: destinationBySlug.get(slug),
}))
const currentRefs = (source.destinations || []).map((reference) => reference._ref).sort()
const desiredRefs = desiredDestinations.map((reference) => reference._ref).sort()

if (JSON.stringify(currentRefs) === JSON.stringify(desiredRefs)) {
  console.log(JSON.stringify({sourceId, status: 'already_aligned', destinationCount: desiredDestinations.length}, null, 2))
  process.exit(0)
}

const updated = await client
  .patch(sourceId)
  .set({destinations: desiredDestinations})
  .ifRevisionId(source._rev)
  .commit()

console.log(JSON.stringify({
  sourceId,
  status: 'updated',
  previousDestinationCount: currentRefs.length,
  destinationCount: desiredDestinations.length,
  revision: updated._rev,
}, null, 2))
