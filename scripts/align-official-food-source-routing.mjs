import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_OFFICIAL_FOOD_ROUTING === '1'
const checkedAt = '2026-08-05'
const manifestPath = '/private/tmp/baha-buddy-official-food-source-routing-manifest.json'

const configuration = [
  ['research-source-bmot-abacos', 'abacos'],
  ['research-source-bmot-acklins-crooked-island', 'acklins-crooked-island'],
  ['research-source-bmot-andros', 'andros'],
  ['research-source-bmot-bimini', 'bimini'],
  ['research-source-bmot-cat-island', 'cat-island'],
  ['research-source-bmot-eleuthera-harbour-island', 'eleuthera-harbour-island'],
  ['research-source-bmot-grand-bahama', 'grand-bahama'],
  ['research-source-bmot-long-island', 'long-island'],
  ['research-source-bmot-mayaguana', 'mayaguana'],
  ['research-source-bmot-nassau-paradise-island', 'nassau-paradise-island'],
  ['research-source-bmot-ragged-island', 'ragged-island'],
  ['research-source-bmot-san-salvador', 'san-salvador'],
  ['research-source-bmot-the-exumas', 'the-exumas'],
]

const sourceIds = configuration.map(([sourceId]) => sourceId)
const sources = await client.fetch(`*[_id in $sourceIds] {
  _id, _rev, title, status, nextReviewAt, topics,
  "slugs": destinations[]->islandId
}`, {sourceIds}, {perspective: 'raw'})

if (sources.length !== configuration.length) {
  throw new Error(`Expected ${configuration.length} source records, found ${sources.length}`)
}

const sourceById = new Map(sources.map((source) => [source._id, source]))
const rows = configuration.map(([sourceId, slug]) => {
  const source = sourceById.get(sourceId)
  if (!source?._rev) throw new Error(`Missing revision for ${sourceId}`)
  if (source.status !== 'active' || !source.nextReviewAt || source.nextReviewAt < checkedAt) {
    throw new Error(`Source is not current and active: ${sourceId}`)
  }
  if (!source.slugs?.includes(slug)) throw new Error(`Source is not routed to ${slug}: ${sourceId}`)
  const before = [...new Set(source.topics || [])]
  const after = before.includes('food') ? before : [...before, 'food']
  return {sourceId, slug, revision: source._rev, before, after, changed: before.length !== after.length}
})

const preflight = {
  exactSourceCount: rows.length === 13,
  allCurrentActiveAndDestinationRouted: rows.every((row) => {
    const source = sourceById.get(row.sourceId)
    return source.status === 'active' && source.nextReviewAt >= checkedAt && source.slugs.includes(row.slug)
  }),
  onlyFoodIsAdded: rows.every((row) => row.after.filter((topic) => !row.before.includes(topic)).every((topic) => topic === 'food')),
  noTopicRemovedOrReordered: rows.every((row) => row.before.every((topic, index) => row.after[index] === topic)),
}

if (Object.values(preflight).some((value) => !value)) {
  throw new Error(`Preflight failed: ${JSON.stringify(preflight)}`)
}

const results = []
if (apply) {
  for (const row of rows) {
    if (!row.changed) {
      results.push({sourceId: row.sourceId, status: 'already_routed'})
      continue
    }
    const updated = await client
      .patch(row.sourceId)
      .set({topics: row.after})
      .ifRevisionId(row.revision)
      .commit()
    results.push({sourceId: row.sourceId, status: 'updated', revision: updated._rev})
  }
}

const verification = apply
  ? await client.fetch(`*[_id in $sourceIds] {_id, topics}`, {sourceIds}, {perspective: 'raw'})
  : []
const verified = !apply || verification.length === sourceIds.length && verification.every((source) => source.topics?.includes('food'))

const manifest = {
  generatedAt: new Date().toISOString(),
  mode: apply ? 'apply' : 'dry_run',
  counts: {
    sourcesReviewed: rows.length,
    sourcesNeedingChange: rows.filter((row) => row.changed).length,
    sourcesChanged: results.filter((row) => row.status === 'updated').length,
  },
  preflight,
  verified,
  boundary: 'Only the food topic is appended to existing current official-island-profile source records. No status, dates, authority, destination routing, URL, ownership plan, source content, fact, audit, delivery channel, approval, or Supabase data is changed.',
  rows: rows.map(({revision, ...row}) => row),
  results,
}

if (!verified) throw new Error('Post-apply food-routing verification failed')
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify(manifest, null, 2))
