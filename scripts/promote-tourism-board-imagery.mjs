#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-17'}).withConfig({useCdn: false, perspective: 'raw'})
const apply = process.env.APPLY_TOURISM_BOARD_IMAGERY === '1'
const here = path.dirname(fileURLToPath(import.meta.url))
const workspace = path.resolve(here, '../..')
const packageRoot = path.join(workspace, 'docs/info-gathering/2026-08-15-bahamas-specialist-portal')
const manifestPath = path.join(packageRoot, 'imagery-manifest.csv')
const permissionSourceId = 'research-source-tourism-partnership-product-imagery-authorization-2026-08-17'

const placements = {
  's01-nassau-hero.avif': ['dest-nassau', 'hero', "Travelers walking through the Queen's Staircase in Nassau", "Queen's Staircase, Nassau"],
  's01-nassau-02.jpg': ['dest-nassau', 'gallery', 'Visitors enjoying clear turquoise water from a sandy Nassau beach', 'Beach experience, Nassau and Paradise Island'],
  's01-nassau-03.jpg': ['dest-nassau', 'gallery', 'Travelers gathered around a casino table in Nassau and Paradise Island', 'Casino experience, Nassau and Paradise Island'],
  's03-grand-bahama-hero.avif': ['dest-grand-bahama', 'hero', 'A visitor meeting a stingray in the shallow waters of Grand Bahama', 'Marine experience, Grand Bahama'],
  's04-grand-bahama-02.jpg': ['dest-grand-bahama', 'gallery', 'A family sharing a beachfront meal on Grand Bahama', 'Beachfront dining, Grand Bahama'],
  's06-eleuthera-harbour-01.jpg': ['dest-eleuthera', 'gallery', 'Boats entering a marina on Eleuthera and Harbour Island', 'Marina, Eleuthera and Harbour Island'],
  's06-eleuthera-harbour-hero.avif': ['dest-eleuthera', 'hero', 'Travelers riding horses along a pink-sand beach on Eleuthera and Harbour Island', 'Pink-sand beach experience, Eleuthera and Harbour Island'],
  's08-exumas-hero.avif': ['dest-exuma', 'hero', 'A couple snorkeling together in the clear water of The Exumas', 'Snorkeling, The Exumas'],
  's08-exumas-02.jpg': ['dest-exuma', 'gallery', 'A couple walking along a white sandbar surrounded by turquoise water in The Exumas', 'Sandbar, The Exumas'],
  's11-bimini-hero.avif': ['dest-bimini', 'hero', 'A diver swimming near a shark in the blue water off Bimini', 'Diving experience, Bimini'],
  's13-berry-islands-hero.avif': ['dest-berry-islands', 'hero', 'A couple traveling by small boat through the clear water of the Berry Islands', 'Boating, Berry Islands'],
  's18-long-island-hero.avif': ['dest-long-island', 'hero', 'A couple kayaking through calm turquoise water off Long Island', 'Kayaking, Long Island'],
  's22-acklins-crooked-hero.avif': ['dest-acklins-crooked-island', 'hero', 'A couple traveling by boat along the coast of Acklins and Crooked Island', 'Boating, Acklins and Crooked Island'],
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [headers, ...body] = rows
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

function imageValue(row, assetId, alt, subjectIdentity) {
  return {
    _type: 'contentImage',
    _key: `tourism-partner-${row.sha256.slice(0, 16)}`,
    asset: {_type: 'reference', _ref: assetId},
    alt,
    caption: subjectIdentity,
    credit: 'The Bahamas Ministry of Tourism, Investments & Aviation',
    sourceUrl: row.observed_page_url,
    subjectIdentity,
    rightsStatus: 'approved_partner',
    licenseName: 'Board-confirmed Baha Buddy tourism partnership product imagery authorization (2026-08-17)',
    rightsEvidence: {_type: 'reference', _ref: permissionSourceId},
    permittedChannels: ['web', 'mobile', 'buddy', 'sharing', 'app_store'],
    usageTermStart: '2026-08-17',
    cropRules: 'Responsive crops, focal-point adjustments, compression, and accessibility overlays are permitted. Do not materially alter the represented destination, people, or activity.',
    usageRestrictions: 'Baha Buddy owned product channels only. Embedded portal maps and promotional showcase creatives are excluded. Do not use this destination-level approval to identify an unnamed property, operator, or individual.',
    checksumSha256: row.sha256,
    altTextReviewedAt: '2026-08-17T12:00:00.000Z',
  }
}

const rows = parseCsv(fs.readFileSync(manifestPath, 'utf8'))
const photos = rows.filter((row) => row.asset_class === 'destination_photo')
const excludedMaps = rows.filter((row) => row.asset_class === 'embedded_map_capture')
const excludedMarketing = rows.filter((row) => row.scope_status.toLowerCase().includes('excluded'))
const selected = photos.filter((row) => placements[row.filename])
const held = photos.filter((row) => !placements[row.filename])

if (photos.length !== 15 || excludedMaps.length !== 13 || excludedMarketing.length !== 3) {
  throw new Error(`Unexpected package split: ${photos.length} photos, ${excludedMaps.length} maps, ${excludedMarketing.length} excluded marketing assets`)
}
if (selected.length !== 13 || held.length !== 2) {
  throw new Error(`Expected 13 destination placements and 2 regional holds; found ${selected.length} and ${held.length}`)
}

const plan = []
for (const row of selected) {
  const [destinationId, placement, alt, subjectIdentity] = placements[row.filename]
  const localPath = path.join(packageRoot, row.relative_path)
  if (!fs.existsSync(localPath)) throw new Error(`Missing captured original: ${localPath}`)
  const duplicate = await client.fetch(
    `*[_type == "destination" && (heroImage.checksumSha256 == $checksum || $checksum in gallery[].checksumSha256)][0]._id`,
    {checksum: row.sha256},
  )
  plan.push({row, destinationId, placement, alt, subjectIdentity, localPath, duplicate})
}

const report = {
  mode: apply ? 'apply' : 'dry_run',
  selected: plan.map(({row, destinationId, placement, duplicate}) => ({filename: row.filename, destinationId, placement, status: duplicate ? 'already_present' : 'ready'})),
  held: held.map((row) => ({filename: row.filename, reason: 'Regional page context is not precise enough for a single-island placement.'})),
  excluded: {maps: excludedMaps.length, promotionalCreatives: excludedMarketing.length},
}

if (!apply) {
  console.log(JSON.stringify(report, null, 2))
  console.log('\nDry run only. Set APPLY_TOURISM_BOARD_IMAGERY=1 to upload and place the selected originals.')
  process.exit(0)
}

await client.createOrReplace({
  _id: permissionSourceId,
  _type: 'researchSource',
  title: 'Baha Buddy tourism partnership product imagery authorization',
  url: 'https://www.bahamasagents.com/main',
  publisher: 'Baha Buddy Board / The Bahamas Ministry of Tourism, Investments & Aviation partnership',
  sourcePackage: 'bahamas-specialist-portal-2026-08-15',
  sourceClass: 'internal_product',
  authorityLevel: 'primary',
  topics: ['media'],
  checkedAt: '2026-08-17',
  nextReviewAt: '2028-08-17',
  status: 'active',
  notes: 'The Board confirmed the tourism partnership and authorized Baha Buddy to use and adapt the supplied destination photographs across owned web, mobile, Buddy-card, sharing, and app-store surfaces. Portal map captures and promotional showcase creatives remain excluded.',
})

for (const item of plan) {
  if (item.duplicate) continue
  const asset = await client.assets.upload('image', fs.createReadStream(item.localPath), {
    filename: `tourism-partner-${item.row.filename}`,
    title: item.subjectIdentity,
  })
  const contentImage = imageValue(item.row, asset._id, item.alt, item.subjectIdentity)
  const destination = await client.getDocument(item.destinationId)
  if (!destination) throw new Error(`Destination does not exist: ${item.destinationId}`)
  const patch = client.patch(item.destinationId)
  if (item.placement === 'hero') patch.set({heroImage: contentImage})
  else patch.setIfMissing({gallery: []}).append('gallery', [contentImage])
  await patch.commit({autoGenerateArrayKeys: true})
  console.log(`Placed ${item.row.filename} as ${item.destinationId}.${item.placement}`)
}

console.log(JSON.stringify(report, null, 2))
