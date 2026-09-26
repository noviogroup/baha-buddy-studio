#!/usr/bin/env node

import {createHash} from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const workspace = path.resolve(here, '../..')
const packageRoot = path.join(workspace, 'docs/info-gathering/2026-08-15-bahamas-specialist-portal')
const sourceOutput = '/private/tmp/baha-buddy-tourism-board-intake.ndjson'
const extractionOutput = '/private/tmp/baha-buddy-tourism-board-claude-extraction-jobs.json'
const checkedAt = '2026-08-15'
const stableReviewAt = '2028-08-15'
const packageId = 'bahamas-specialist-portal-2026-08-15'
const partnershipPermissionId = 'research-source-tourism-partnership-product-imagery-authorization-2026-08-17'

const destinationIds = {
  'acklins-crooked-island': 'dest-acklins-crooked-island',
  inagua: 'dest-inagua',
  mayaguana: 'dest-mayaguana',
  bimini: 'dest-bimini',
  'eleuthera-harbour-island': 'dest-eleuthera',
  'grand-bahama': 'dest-grand-bahama',
  'long-island': 'dest-long-island',
  'nassau-paradise-island': 'dest-nassau',
  'ragged-island': 'dest-ragged-island',
  'rum-cay': 'dest-rum-cay',
  'berry-islands': 'dest-berry-islands',
  andros: 'dest-andros',
  'cat-island': 'dest-cat-island',
  'san-salvador': 'dest-san-salvador',
  abacos: 'dest-abacos',
  'the-exumas': 'dest-exuma',
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
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

function ref(id, key = 'destination') {
  return {_key: `${key}-${id}`, _type: 'reference', _ref: id}
}

function slugsFor(value) {
  const text = value.toLowerCase()
  const slugs = []
  const matches = [
    ['nassau-paradise-island', /nassau|paradise island|new providence/],
    ['grand-bahama', /grand bahama|freeport|lucaya/],
    ['the-exumas', /exuma/],
    ['eleuthera-harbour-island', /eleuthera|harbour island|spanish wells/],
    ['abacos', /abaco/], ['andros', /andros/], ['bimini', /bimini/],
    ['cat-island', /cat island/], ['long-island', /long island/],
    ['inagua', /inagua/], ['berry-islands', /berry island/],
    ['san-salvador', /san salvador/], ['rum-cay', /rum cay/],
    ['acklins-crooked-island', /acklins|crooked island|long cay/],
    ['mayaguana', /mayaguana/], ['ragged-island', /ragged island/],
  ]
  for (const [slug, pattern] of matches) if (pattern.test(text)) slugs.push(slug)
  if (/southern islands|southern bahamas/.test(text)) {
    for (const slug of ['acklins-crooked-island', 'inagua', 'mayaguana', 'ragged-island']) {
      if (!slugs.includes(slug)) slugs.push(slug)
    }
  }
  return slugs
}

function sourceDocument({id, title, url, checksum, slugs, topics, notes}) {
  return {
    _id: id,
    _type: 'researchSource',
    title,
    url,
    publisher: 'The Bahamas Ministry of Tourism, Investments & Aviation',
    checksumSha256: checksum,
    sourcePackage: packageId,
    sourceClass: 'national_tourism',
    authorityLevel: 'primary',
    destinations: slugs.map((slug) => ref(destinationIds[slug])),
    topics,
    checkedAt,
    nextReviewAt: stableReviewAt,
    status: 'active',
    notes,
  }
}

const factManifest = parseCsv(fs.readFileSync(path.join(packageRoot, 'fact-sheet-manifest.csv'), 'utf8'))
const imageryManifest = parseCsv(fs.readFileSync(path.join(packageRoot, 'imagery-manifest.csv'), 'utf8'))
const trainingText = fs.readFileSync(path.join(packageRoot, 'islands-training-captured-text.txt'), 'utf8')
const trainingBlocks = trainingText
  .split(/^={40,}$/m)
  .map((block) => block.trim())
  .filter((block) => /^SLIDE\s+\d+\s+OF\s+25/m.test(block))

if (factManifest.length !== 12) throw new Error(`Expected 12 fact sheets; found ${factManifest.length}`)
if (trainingBlocks.length !== 25) throw new Error(`Expected 25 training slides; found ${trainingBlocks.length}`)
if (imageryManifest.length !== 31) throw new Error(`Expected 31 imagery records; found ${imageryManifest.length}`)

const documents = []
const extractionJobs = []
const sourceByUrl = new Map()

for (const row of factManifest) {
  const slugs = slugsFor(`${row.title} ${row.filename}`)
  const id = `tourism-source-${sha256(row.source_url).slice(0, 24)}`
  const source = sourceDocument({
    id,
    title: `${row.title} 2026 Fact Sheet`,
    url: row.source_url,
    checksum: row.sha256,
    slugs,
    topics: ['overview', 'access', 'stays', 'food', 'experiences', 'nature', 'culture', 'seasonality', 'safety', 'accessibility'],
    notes: 'Official authenticated fact sheet. It is evidence for narrow draft claims; operational details require a 90-day fact review and live values remain runtime-only.',
  })
  documents.push(source)
  sourceByUrl.set(row.source_url, source)
  const extractedPath = path.join(packageRoot, row.extracted_text)
  extractionJobs.push({
    sourceId: id,
    sourceUrl: row.source_url,
    sourceTitle: source.title,
    destinationSlugs: slugs,
    text: fs.readFileSync(extractedPath, 'utf8'),
  })
}

for (const block of trainingBlocks) {
  const sourceUrl = block.match(/^SOURCE:\s*(https:\/\/\S+)/m)?.[1]
  if (!sourceUrl) throw new Error('Training block lacks a source URL')
  const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const title = lines.find((line) => !/^SLIDE\s+/i.test(line) && !/^SOURCE:/i.test(line)) ?? 'Training slide'
  const slugs = slugsFor(block)
  const checksum = sha256(block.replace(/\s+/g, ' ').trim())
  const id = `tourism-source-${sha256(sourceUrl).slice(0, 24)}`
  const source = sourceDocument({
    id,
    title: `Bahamas Specialist training: ${title}`.slice(0, 180),
    url: sourceUrl,
    checksum,
    slugs,
    topics: ['overview', 'access', 'stays', 'food', 'experiences', 'nature', 'culture', 'seasonality'],
    notes: 'Official authenticated training slide. Quiz prompts and promotional advisor language are research context, not traveler-facing claims.',
  })
  documents.push(source)
  sourceByUrl.set(sourceUrl, source)
  extractionJobs.push({sourceId: id, sourceUrl, sourceTitle: source.title, destinationSlugs: slugs, text: block})
}

const photos = imageryManifest.filter((row) => row.asset_class === 'destination_photo')
const maps = imageryManifest.filter((row) => row.asset_class === 'embedded_map_capture')
const marketing = imageryManifest.filter((row) => row.scope_status.toLowerCase().includes('excluded'))
if (photos.length !== 15 || maps.length !== 13 || marketing.length !== 3) {
  throw new Error(`Unexpected imagery split: ${photos.length} photos, ${maps.length} maps, ${marketing.length} excluded`)
}

documents.push({
  _id: partnershipPermissionId,
  _type: 'researchSource',
  title: 'Baha Buddy tourism partnership product imagery authorization',
  url: 'https://www.bahamasagents.com/main',
  publisher: 'Baha Buddy Board / The Bahamas Ministry of Tourism, Investments & Aviation partnership',
  checksumSha256: sha256('Board-confirmed owned-product imagery authorization|2026-08-17|web|mobile|buddy|sharing|app_store'),
  sourcePackage: packageId,
  sourceClass: 'internal_product',
  authorityLevel: 'primary',
  destinations: Object.values(destinationIds).map((id) => ref(id)),
  topics: ['media'],
  checkedAt: '2026-08-17',
  nextReviewAt: '2028-08-17',
  status: 'active',
  notes: 'The Board confirmed the tourism partnership and authorized Baha Buddy to use and adapt the supplied destination photographs across owned web, mobile, Buddy-card, sharing, and app-store surfaces. Portal map captures and promotional showcase creatives remain excluded.',
})

for (const row of photos) {
  const slugs = slugsFor(`${row.page_context} ${row.filename}`)
  const destinationSlug = slugs[0]
  const source = sourceByUrl.get(row.observed_page_url)
  if (!source) throw new Error(`Missing training source for ${row.observed_page_url}`)
  documents.push({
    _id: `tourism-image-${row.sha256.slice(0, 24)}`,
    _type: 'imageCandidate',
    title: `Tourism partnership candidate: ${row.page_context}`.slice(0, 180),
    ...(destinationSlug ? {destination: ref(destinationIds[destinationSlug])} : {}),
    subjectLabel: row.page_context,
    subjectType: 'unknown_mixed',
    identityStatus: 'source_page_label_only',
    identityEvidence: [ref(source._id, 'identity-source')],
    identityNotes: row.subject_status,
    reviewImage: {
      _type: 'contentImage',
      externalUrl: row.source_asset_url,
      sourceUrl: row.observed_page_url,
      credit: 'The Bahamas Ministry of Tourism, Investments & Aviation',
      subjectIdentity: row.page_context,
      rightsStatus: 'approved_partner',
      licenseName: 'Board-confirmed Baha Buddy tourism partnership product imagery authorization (2026-08-17)',
      rightsEvidence: {_type: 'reference', _ref: partnershipPermissionId},
      permittedChannels: ['web', 'mobile', 'buddy', 'sharing', 'app_store'],
      usageTermStart: '2026-08-17',
      cropRules: 'Responsive crops, focal-point adjustments, compression, and accessibility overlays are permitted. Do not materially alter the represented destination, people, or activity.',
      usageRestrictions: 'Baha Buddy owned product channels only. Embedded portal maps and promotional showcase creatives are excluded. Destination-level approval does not identify an unnamed property, operator, or individual.',
      checksumSha256: row.sha256,
    },
    sourceAssetId: row.source_asset_name,
    sourceAssetUrl: row.source_asset_url,
    sourcePageUrl: row.observed_page_url,
    intendedUses: ['destination_hero', 'destination_gallery'],
    width: Number(row.width),
    height: Number(row.height),
    checksumSha256: row.sha256,
    rightsHolder: 'The Bahamas Ministry of Tourism, Investments & Aviation',
    rightsStatus: 'direct_permission_recorded',
    licenseName: 'Board-confirmed Baha Buddy tourism partnership product imagery authorization (2026-08-17)',
    requiredCredit: 'The Bahamas Ministry of Tourism, Investments & Aviation',
    usageRestrictions: 'Baha Buddy owned product channels only. Embedded portal maps and promotional showcase creatives are excluded. Destination-level approval does not identify an unnamed property, operator, or individual.',
    rightsEvidence: [ref(partnershipPermissionId, 'rights-source')],
    currentConditionBoundary: 'The photograph supports visual identity review only and does not prove current opening, access, safety, availability, price, schedule, or condition.',
    altTextStatus: 'no_exact_image',
    reviewStatus: 'approved',
    approvalStatus: 'approved_for_content',
    checkedAt: '2026-08-17',
    nextReviewAt: '2028-08-17',
    reviewNotes: 'The Board confirmed the partnership authorization and approved use across Baha Buddy owned product channels. Use only at destination level unless a more exact subject or place identity is documented.',
  })
}

const byIdentity = new Map()
for (const document of documents) {
  const identity = document._type === 'researchSource'
    ? `${document.url}|${document.checksumSha256}`
    : `${document._type}|${document.checksumSha256 ?? document._id}`
  if (!byIdentity.has(identity)) byIdentity.set(identity, document)
}

fs.writeFileSync(sourceOutput, `${Array.from(byIdentity.values()).map((doc) => JSON.stringify(doc)).join('\n')}\n`)
fs.writeFileSync(extractionOutput, `${JSON.stringify(extractionJobs, null, 2)}\n`)

console.log(JSON.stringify({
  sources: documents.filter((document) => document._type === 'researchSource').length,
  imageCandidates: documents.filter((document) => document._type === 'imageCandidate').length,
  excludedMaps: maps.length,
  excludedMarketingCreatives: marketing.length,
  extractionJobs: extractionJobs.length,
  sourceOutput,
  extractionOutput,
}, null, 2))
