#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(studioRoot, '..')
const webRoot = path.join(workspaceRoot, 'bahabuddy-web')
const mobileRoot = path.join(workspaceRoot, 'Baha-Buddy-V2')
const outputPath = process.argv[2] || '/private/tmp/baha-buddy-sanity-content-import.ndjson'
const importedAt = new Date().toISOString()
const reviewedAt = importedAt.slice(0, 10)
const projectId = '593u37vh'
const dataset = 'production'

const webRequire = createRequire(path.join(webRoot, 'package.json'))
const esbuild = webRequire('esbuild')
const ts = webRequire('typescript')

function loadEnv(filePath) {
  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    values[match[1]] = value
  }
  return values
}

const env = loadEnv(path.join(webRoot, '.env.local'))
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase URL/key missing from bahabuddy-web/.env.local')

async function fetchTable(table) {
  const rows = []
  for (let start = 0; ; start += 1000) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Range: `${start}-${start + 999}`,
      },
    })
    if (!response.ok) throw new Error(`${table}: ${response.status} ${(await response.text()).slice(0, 200)}`)
    const page = await response.json()
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

async function fetchExistingSanityDocuments() {
  const query = '*[!(_id in path("_.**"))]'
  const url = `https://${projectId}.api.sanity.io/v2026-08-04/data/query/${dataset}?query=${encodeURIComponent(query)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Sanity read failed: ${response.status} ${(await response.text()).slice(0, 200)}`)
  return (await response.json()).result || []
}

function hash(value) {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(36)
}

function cleanText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim()
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : [trimmed]
    } catch {
      return [trimmed]
    }
  }
  return value == null ? [] : [value]
}

function textValues(value) {
  return asArray(value).map((item) => cleanText(typeof item === 'object' ? item.name || item.label || item.title || item.url || item : item)).filter(Boolean)
}

function imageUrls(value) {
  return asArray(value).map((item) => typeof item === 'string' ? item : item?.url || item?.src || item?.image_url).filter((item) => typeof item === 'string' && item.trim())
}

function slugify(value) {
  return cleanText(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96) || `item-${hash(String(value))}`
}

function portableText(value, prefix = 'text') {
  const text = typeof value === 'string' ? value.trim() : cleanText(value)
  if (!text) return []
  return text.split(/\n\s*\n/).map((paragraph, index) => block(paragraph, 'normal', `${prefix}-${index}`)).filter((item) => item.children[0].text)
}

function block(value, style = 'normal', keySeed = value) {
  const text = cleanText(value)
  return {
    _type: 'block',
    _key: `b-${hash(String(keySeed))}`,
    style,
    markDefs: [],
    children: [{_type: 'span', _key: `s-${hash(`${keySeed}:span`)}`, marks: [], text}],
  }
}

function contentImage(url, alt, credit) {
  if (!url) return undefined
  return {_type: 'contentImage', externalUrl: url, alt: cleanText(alt).slice(0, 180), ...(credit ? {credit} : {})}
}

function source({system = 'supabase', table, recordId, sourcePath, sourceKey, ownership = 'editorial_overlay', notes}) {
  return {_type: 'contentSource', system, ...(table ? {table} : {}), ...(recordId ? {recordId: String(recordId)} : {}), ...(sourcePath ? {sourcePath} : {}), ...(sourceKey ? {sourceKey} : {}), ownership, importedAt, ...(notes ? {notes} : {})}
}

function reference(id) {
  return id ? {_type: 'reference', _ref: id} : undefined
}

function withoutSystemFields(document) {
  return Object.fromEntries(Object.entries(document || {}).filter(([key]) => !key.startsWith('_')))
}

function mapExperienceCategory(value) {
  const category = cleanText(value).toLowerCase()
  if (/snork|div/.test(category)) return 'snorkeling_diving'
  if (/boat|sail|charter|kayak/.test(category)) return 'boating_sailing'
  if (/fish/.test(category)) return 'fishing'
  if (/food|culinary|restaurant/.test(category)) return 'food_culinary'
  if (/culture|history|historic|museum|landmark|art/.test(category)) return 'cultural'
  if (/night|bar|club/.test(category)) return 'nightlife'
  if (/family|kid/.test(category)) return 'family'
  if (/wellness|spa/.test(category)) return 'wellness_spa'
  if (/shop|market/.test(category)) return 'shopping_markets'
  if (/water|surf|paddle/.test(category)) return 'water_sports'
  return 'nature_wildlife'
}

function mapDealCategory(value, partnerName = '') {
  const category = cleanText(value).toLowerCase()
  if (category === 'accommodation') return /resort/i.test(partnerName) ? 'resort' : 'hotel'
  if (category === 'tour') return 'activity'
  if (['package', 'activity', 'dining', 'transport'].includes(category)) return category
  return 'destination_campaign'
}

function mapFaqCategory(value) {
  const category = cleanText(value).toLowerCase()
  if (/book|payment|stay|hotel/.test(category)) return 'bookings'
  if (/safe|access/.test(category)) return 'safety_accessibility'
  if (/transport|flight|ferry|weather|requirement|logistic/.test(category)) return 'logistics'
  if (/partner/.test(category)) return 'partners'
  if (/account|profile/.test(category)) return 'account'
  if (/island|destination|beach|food|culture|history|activity/.test(category)) return 'destinations'
  return 'planning'
}

function mapArticleCategory(value) {
  const category = cleanText(value).toLowerCase()
  if (/food/.test(category)) return 'food_dining'
  if (/adventure|div|sail|beach/.test(category)) return 'adventure'
  if (/budget|planning/.test(category)) return 'planning_basics'
  if (/culture|history/.test(category)) return 'culture'
  if (/tip/.test(category)) return 'insider_tips'
  return 'travel_guide'
}

function mapGuidedTourCategory(value) {
  const category = cleanText(value).toLowerCase()
  if (/food/.test(category)) return 'food_drink'
  if (/history|culture|landmark/.test(category)) return 'culture_history'
  if (/water|beach|snork|boat|dive/.test(category)) return 'water_adventure'
  if (/nature|wildlife/.test(category)) return 'nature_wildlife'
  return 'sightseeing'
}

async function loadBundledWebModule(relativePath) {
  const absolutePath = path.join(webRoot, relativePath)
  const result = await esbuild.build({entryPoints: [absolutePath], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent'})
  const module = {exports: {}}
  const run = new Function('module', 'exports', 'require', '__filename', '__dirname', result.outputFiles[0].text)
  run(module, module.exports, webRequire, absolutePath, path.dirname(absolutePath))
  return module.exports
}

function visibleStatus(value, fallback = true) {
  if (!value) return fallback
  return ['active', 'published', 'approved', 'live'].includes(cleanText(value).toLowerCase())
}

function destinationIdForSlug(slug) {
  if (slug === 'nassau-paradise-island') return 'dest-nassau'
  if (slug === 'the-exumas') return 'dest-exuma'
  if (slug === 'eleuthera-harbour-island') return 'dest-eleuthera'
  return `dest-${slugify(slug)}`
}

function jsxPlainText(fragment) {
  return fragment
    .replace(/\{\s*['"]\s+['"]\s*\}/g, ' ')
    .replace(/\{\s*SUPPORT_EMAIL\s*\}/g, 'support@bahabuddy.com')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractUtilityPage(relativePath) {
  const absolutePath = path.join(webRoot, relativePath)
  if (!fs.existsSync(absolutePath)) return null
  const contents = fs.readFileSync(absolutePath, 'utf8')
  const routePath = contents.match(/activePath="([^"]+)"/)?.[1]
  const title = contents.match(/<UtilityContentLayout[\s\S]*?\btitle="([^"]+)"/)?.[1]
  if (!routePath || !title) return null
  const subtitle = contents.match(/<UtilityContentLayout[\s\S]*?\bsubtitle="([^"]+)"/)?.[1]
  const effectiveDate = contents.match(/\beffectiveDate="([^"]+)"/)?.[1]
  const sections = []
  for (const [index, match] of [...contents.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)].entries()) {
    const fragment = match[1]
    const heading = jsxPlainText(fragment.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/)?.[1] || `Section ${index + 1}`)
    const pieces = [...fragment.matchAll(/<(?:p|li)[^>]*>([\s\S]*?)<\/(?:p|li)>/g)].map((item) => jsxPlainText(item[1])).filter(Boolean)
    if (!heading && !pieces.length) continue
    sections.push({_type: 'contentSection', _key: `section-${hash(`${routePath}:${heading}`)}`, anchor: slugify(heading), heading, body: portableText(pieces.join('\n\n'), `${routePath}:${heading}`), layout: 'default'})
  }
  const routeName = routePath.replace(/^\//, '')
  const pageType = ['privacy', 'terms', 'accessibility'].includes(routeName) ? (routeName === 'accessibility' ? 'accessibility' : 'legal') : routeName === 'help' ? 'help' : routeName === 'how-it-works' ? 'how_it_works' : /partner|property/.test(routeName) ? 'partner' : routeName === 'about' ? 'marketing' : 'utility'
  return {
    _id: `page-${slugify(routeName || 'home')}`,
    _type: 'contentPage',
    title,
    slug: {_type: 'slug', current: slugify(routeName || 'home')},
    routePath,
    pageType,
    subtitle,
    sections: sections.length ? sections : [{_type: 'contentSection', _key: 'section-review', heading: 'Content review needed', body: portableText('This page was detected in source code but its current layout needs manual editorial review.'), layout: 'default'}],
    ...(effectiveDate ? {effectiveDate: new Date(effectiveDate).toISOString().slice(0, 10)} : {}),
    versionLabel: 'Imported from web source',
    channels: ['web'],
    publishedAt: importedAt,
    source: source({system: 'web_source', sourcePath: relativePath, sourceKey: routePath, ownership: 'sanity_canonical', notes: 'Initial copy imported from the existing public web page.'}),
    seo: {_type: 'seo', metaTitle: title, metaDescription: subtitle},
  }
}

function isHumanCopy(value) {
  const text = cleanText(value)
  if (text.length < 12 || !/\s/.test(text)) return false
  if (/^(https?:|\/|@\/|package:|[.#\[])/.test(text)) return false
  if (/\b(?:px-|py-|bg-|text-|rounded-|flex|grid|hover:|sm:|md:|lg:|font-|border-|items-|justify-|space-|gap-|w-|h-|max-w-|min-h-)\b/.test(text)) return false
  if (/^[a-z0-9_.:/?=&-]+$/i.test(text)) return false
  return true
}

function extractWebCopy(relativePath) {
  const absolutePath = path.join(webRoot, relativePath)
  const contents = fs.readFileSync(absolutePath, 'utf8')
  const file = ts.createSourceFile(relativePath, contents, ts.ScriptTarget.Latest, true, relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const entries = []
  const seen = new Set()
  function visit(node) {
    let value = null
    let context = ts.SyntaxKind[node.kind]
    if (ts.isJsxText(node)) value = node.text
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) value = node.text
    if (value && isHumanCopy(value)) {
      const parent = node.parent
      const excluded = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || (ts.isJsxAttribute(parent) && ['className', 'href', 'src', 'id', 'key'].includes(parent.name.text)) || (ts.isPropertyAssignment(parent) && ['href', 'slug', 'path', 'className', 'id', 'key', 'image', 'icon'].includes(parent.name.getText(file).replace(/["']/g, '')))
      const text = cleanText(value)
      if (!excluded && !seen.has(text)) {
        seen.add(text)
        const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1
        entries.push({_type: 'legacyCopyEntry', _key: `copy-${hash(`${relativePath}:${line}:${text}`)}`, line, key: `${slugify(relativePath)}-l${line}-${hash(text)}`, value: text, context, status: 'needs_review'})
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return entries
}

function extractMobileCopy(relativePath) {
  const absolutePath = path.join(mobileRoot, relativePath)
  const contents = fs.readFileSync(absolutePath, 'utf8')
  const entries = []
  const seen = new Set()
  const regex = /(['"])((?:\\.|(?!\1).)*)\1/g
  for (const match of contents.matchAll(regex)) {
    const before = contents.slice(Math.max(0, match.index - 80), match.index)
    if (/import\s*$|\.from\(\s*$|asset|routeName|table/i.test(before)) continue
    const value = match[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n')
    if (!isHumanCopy(value)) continue
    const text = cleanText(value)
    if (seen.has(text)) continue
    seen.add(text)
    const line = contents.slice(0, match.index).split('\n').length
    entries.push({_type: 'legacyCopyEntry', _key: `copy-${hash(`${relativePath}:${line}:${text}`)}`, line, key: `${slugify(relativePath)}-l${line}-${hash(text)}`, value: text, context: 'Dart string', status: 'needs_review'})
  }
  return entries
}

function walkFiles(root, relativeRoot, extensions, ignoredParts = []) {
  const output = []
  const start = path.join(root, relativeRoot)
  if (!fs.existsSync(start)) return output
  for (const entry of fs.readdirSync(start, {withFileTypes: true})) {
    const relativePath = path.join(relativeRoot, entry.name)
    if (ignoredParts.some((part) => relativePath.includes(part))) continue
    if (entry.isDirectory()) output.push(...walkFiles(root, relativePath, extensions, ignoredParts))
    else if (extensions.some((extension) => entry.name.endsWith(extension))) output.push(relativePath)
  }
  return output
}

const [
  islands,
  attractions,
  bahamasDeals,
  places,
  cruiseItineraries,
  cruiseStops,
  selfTours,
  tourStops,
  islandFaqs,
  historicLandmarks,
  existingSanity,
  articleModule,
  islandConfigModule,
] = await Promise.all([
  fetchTable('islands'),
  fetchTable('bahamas_attractions'),
  fetchTable('bahamas_deals'),
  fetchTable('places'),
  fetchTable('cruise_itineraries'),
  fetchTable('cruise_itinerary_stops'),
  fetchTable('self_tours'),
  fetchTable('tour_stops'),
  fetchTable('island_faq'),
  fetchTable('historic_landmarks'),
  fetchExistingSanityDocuments(),
  loadBundledWebModule('src/lib/article-content.ts'),
  loadBundledWebModule('src/lib/island-config.ts'),
])

const documents = []
const existingDestinations = new Map(existingSanity.filter((item) => item._type === 'destination').flatMap((item) => [[item.slug?.current, item], [item.islandId, item]].filter(([key]) => key)))
const configs = islandConfigModule.ISLAND_CONFIGS || []
const configByCanonicalSlug = new Map(configs.map((config) => [config.dbSlug || config.slug, config]))
const aliasByCanonicalSlug = new Map()
for (const config of configs) {
  const canonicalSlug = config.dbSlug || config.slug
  if (canonicalSlug !== config.slug) aliasByCanonicalSlug.set(canonicalSlug, [...(aliasByCanonicalSlug.get(canonicalSlug) || []), config.slug])
}

const islandIdBySlug = new Map()
const islandIdByName = new Map()
for (const [index, row] of islands.entries()) {
  const config = configByCanonicalSlug.get(row.slug)
  const existing = existingDestinations.get(row.slug) || existingDestinations.get(config?.slug)
  const id = existing?._id || destinationIdForSlug(row.slug)
  const imported = {
    _id: id,
    _type: 'destination',
    name: row.short_name || row.name,
    slug: {_type: 'slug', current: row.slug},
    islandId: row.slug,
    routeAliases: [...new Set([...(aliasByCanonicalSlug.get(row.slug) || []), ...(existing?.routeAliases || [])])],
    tagline: row.tagline || config?.tagline || cleanText(row.description).slice(0, 137),
    overview: portableText(config?.description || row.description, `destination:${row.slug}`),
    heroImage: contentImage(row.hero_image_url || config?.heroImage, `${row.name} in the Bahamas`),
    highlights: textValues(row.highlights).slice(0, 12).map((label) => ({_type: 'destinationHighlight', _key: `highlight-${hash(`${row.slug}:${label}`)}`, label})),
    bestTimeToVisit: config?.bestTime,
    gettingThere: cleanText(row.getting_there),
    airports: textValues(row.airport_codes).map((code) => ({_type: 'gateway', _key: `airport-${slugify(code)}`, code: code.toUpperCase().slice(0, 3), name: `${code.toUpperCase()} airport`, type: 'airport'})),
    tripFit: {_type: 'object', vibe: config?.vibe || textValues(row.vibe_tags)[0], recommendedStay: config?.tripLength, bestFor: textValues(row.best_for)},
    practicalNotes: portableText(textValues(row.travel_tips).join('\n\n'), `destination:${row.slug}:tips`),
    featured: Boolean(row.featured),
    order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
    channels: ['web', 'mobile', 'buddy'],
    reviewedAt,
    source: source({table: 'islands', recordId: row.id, ownership: 'editorial_overlay', notes: 'Sanity owns editorial presentation; Supabase retains canonical island identity and operational joins.'}),
    seo: {_type: 'seo', metaTitle: row.short_name || row.name, metaDescription: cleanText(row.description).slice(0, 300)},
  }
  const merged = {...imported, ...withoutSystemFields(existing), _id: id, _type: 'destination'}
  merged.slug = imported.slug
  merged.islandId = row.slug
  merged.routeAliases = imported.routeAliases
  merged.source = imported.source
  if (!existing?.heroImage?.asset) merged.heroImage = imported.heroImage
  documents.push(merged)
  islandIdBySlug.set(row.slug, id)
  islandIdByName.set(cleanText(row.name).toLowerCase(), id)
  if (row.short_name) islandIdByName.set(cleanText(row.short_name).toLowerCase(), id)
}
for (const [canonical, aliases] of aliasByCanonicalSlug.entries()) for (const alias of aliases) islandIdBySlug.set(alias, islandIdBySlug.get(canonical))

function findDestinationId(slugOrName) {
  const value = cleanText(slugOrName)
  if (!value) return undefined
  const normalized = slugify(value)
  if (islandIdBySlug.has(normalized)) return islandIdBySlug.get(normalized)
  const lower = value.toLowerCase()
  if (islandIdByName.has(lower)) return islandIdByName.get(lower)
  if (/new providence|nassau/.test(lower)) return islandIdBySlug.get('nassau-paradise-island')
  if (/exuma/.test(lower)) return islandIdBySlug.get('the-exumas')
  if (/eleuthera|harbour island/.test(lower)) return islandIdBySlug.get('eleuthera-harbour-island')
  return undefined
}

for (const [index, row] of attractions.entries()) {
  const destinationId = findDestinationId(row.island)
  const shortDescription = cleanText(row.short_description || row.description).slice(0, 240)
  documents.push({
    _id: `experience-attraction-${row.id}`,
    _type: 'experience',
    title: row.name,
    slug: {_type: 'slug', current: `${slugify(row.name)}-${String(row.id).slice(0, 8)}`},
    heroImage: contentImage(row.image_url || imageUrls(row.photos)[0], row.name),
    category: mapExperienceCategory(row.category),
    ...(destinationId ? {destination: reference(destinationId)} : {}),
    shortDescription,
    description: portableText(row.description || row.short_description, `attraction:${row.id}`),
    priceRange: ['$','$$','$$$','free'].includes(cleanText(row.price_range).toLowerCase()) ? cleanText(row.price_range).toLowerCase() : undefined,
    bestFor: textValues(row.tags),
    bookingUrl: /^https:\/\//.test(row.source_url || row.website || '') ? row.source_url || row.website : undefined,
    supabaseRecordId: row.id,
    tips: textValues(row.pros).slice(0, 12),
    safetyNote: textValues(row.cons).join(' · ').slice(0, 500),
    featured: index < 12,
    order: index,
    active: true,
    channels: ['web', 'mobile', 'buddy'],
    tags: textValues(row.tags),
    publishedAt: row.created_at || importedAt,
    reviewedAt,
    source: source({table: 'bahamas_attractions', recordId: row.id}),
  })
}

for (const [index, row] of bahamasDeals.entries()) {
  const destinationId = findDestinationId(row.island)
  documents.push({
    _id: `deal-bahamas-${row.id}`,
    _type: 'deal',
    title: row.title,
    slug: {_type: 'slug', current: `${slugify(row.title)}-${String(row.id).slice(0, 8)}`},
    heroImage: contentImage(row.image_url || imageUrls(row.photos)[0], row.title),
    category: mapDealCategory(row.deal_type, row.resort_name),
    ...(destinationId ? {destination: reference(destinationId)} : {}),
    partnerName: row.resort_name,
    description: cleanText(row.description).slice(0, 600),
    dealPrice: row.price_from_usd == null ? undefined : Number(row.price_from_usd),
    priceNote: cleanText(row.price_unit).replace(/_/g, ' '),
    ctaLabel: 'View Deal',
    providerRecordId: row.id,
    validUntil: row.valid_through ? `${row.valid_through}T23:59:59.000Z` : undefined,
    active: row.is_active !== false,
    featured: index < 8,
    order: index,
    sponsored: false,
    channels: ['web', 'mobile'],
    reviewedAt,
    source: source({table: 'bahamas_deals', recordId: row.id, notes: 'Display price is planning copy only; checkout must verify provider pricing.'}),
  })
}

const cruiseStopsByItinerary = new Map()
for (const stop of cruiseStops) cruiseStopsByItinerary.set(stop.itinerary_id, [...(cruiseStopsByItinerary.get(stop.itinerary_id) || []), stop])
for (const [index, row] of cruiseItineraries.entries()) {
  const stops = (cruiseStopsByItinerary.get(row.id) || []).sort((a, b) => Number(a.stop_order) - Number(b.stop_order))
  const baseId = `itinerary-supabase-${row.id}`
  const isPublished = visibleStatus(row.status, false)
  documents.push({
    _id: isPublished ? baseId : `drafts.${baseId}`,
    _type: 'itinerary',
    title: row.title,
    slug: {_type: 'slug', current: row.slug},
    summary: cleanText(row.short_description || row.full_description).slice(0, 300),
    heroImage: contentImage(row.hero_image_url, row.title),
    destination: reference(findDestinationId(row.island) || islandIdBySlug.get('nassau-paradise-island')),
    itineraryType: row.itinerary_type === 'cruise_day' ? 'cruise_day' : 'day_trip',
    durationHours: Math.max(1, Number(row.duration_max_minutes || row.duration_min_minutes || 60) / 60),
    bestFor: textValues(row.traveler_types),
    introduction: portableText(row.full_description, `itinerary:${row.id}:intro`),
    stops: stops.map((stop) => ({
      _type: 'itineraryStop',
      _key: `stop-${stop.id}`,
      day: 1,
      time: stop.suggested_arrival_offset_minutes == null ? `Stop ${stop.stop_order}` : `${stop.suggested_arrival_offset_minutes} min after start`,
      title: stop.name,
      description: cleanText(stop.description || stop.baha_tip || stop.stop_type).slice(0, 800),
      durationMinutes: Math.max(5, Number(stop.suggested_duration_minutes || 20)),
      mapLabel: cleanText(stop.address),
      travelerNote: cleanText(stop.baha_tip || stop.safety_notes).slice(0, 300),
    })),
    logistics: portableText(`Plan for a ${row.default_return_buffer_minutes || 90}-minute return-to-ship buffer. Mobility level: ${row.mobility_level || 'moderate'}.`, `itinerary:${row.id}:logistics`),
    safetyNote: `Live timing, route conditions, and return-to-ship guidance must be verified on the travel date.`,
    sourceRecordId: row.id,
    channels: ['web', 'mobile', 'buddy'],
    featured: isPublished && index < 3,
    order: index,
    publishedAt: isPublished ? row.updated_at || importedAt : importedAt,
    source: source({table: 'cruise_itineraries', recordId: row.id, ownership: 'editorial_overlay', notes: `Imported with Supabase status: ${row.status || 'unknown'}. Live prices and bookings remain in Supabase.`}),
    seo: {_type: 'seo', metaTitle: row.title, metaDescription: cleanText(row.short_description).slice(0, 300)},
  })
}

const tourStopsByTour = new Map()
for (const stop of tourStops) tourStopsByTour.set(stop.tour_id, [...(tourStopsByTour.get(stop.tour_id) || []), stop])
for (const [index, row] of selfTours.entries()) {
  const stops = (tourStopsByTour.get(row.id) || []).sort((a, b) => Number(a.sequence) - Number(b.sequence))
  const durationMinutes = Number(row.estimated_duration) || Math.max(60, stops.reduce((sum, stop) => sum + Number(stop.duration_sec || 0) / 60, 0))
  documents.push({
    _id: `guided-tour-self-${row.id}`,
    _type: 'guidedTour',
    title: row.title,
    slug: {_type: 'slug', current: `${slugify(row.title)}-${String(row.id).slice(0, 8)}`},
    tagline: cleanText(row.route_summary || row.description || `Explore ${row.island} at your own pace.`).slice(0, 160),
    heroImage: contentImage(row.cover_image_url, row.title),
    category: mapGuidedTourCategory(row.theme),
    destination: reference(findDestinationId(row.island) || islandIdBySlug.get('nassau-paradise-island')),
    durationHours: Math.max(0.5, durationMinutes / 60),
    description: cleanText(row.description || row.route_summary).slice(0, 3000),
    highlights: stops.slice(0, 12).map((stop) => stop.name),
    photos: stops.flatMap((stop) => imageUrls(stop.image_urls).slice(0, 1).map((url) => contentImage(url, stop.name))).slice(0, 16),
    itinerary: stops.map((stop) => ({_type: 'tourItineraryStep', _key: `step-${stop.id}`, time: `Stop ${stop.sequence}`, stepTitle: stop.name, stepDescription: cleanText(stop.description || stop.visitor_tips).slice(0, 500)})),
    meetingPoint: cleanText(row.starting_point),
    providerRecordId: row.id,
    active: row.is_active !== false,
    featured: Boolean(row.featured),
    order: index,
    publishedAt: row.updated_at || importedAt,
    source: source({table: 'self_tours', recordId: row.id, ownership: 'editorial_overlay', notes: 'Tour execution, route state, purchases, and live sessions remain in Supabase.'}),
    seo: {_type: 'seo', metaTitle: row.title, metaDescription: cleanText(row.description).slice(0, 300)},
  })
}

for (const [index, row] of islandFaqs.entries()) {
  const baseId = `faq-supabase-${row.id}`
  const isPublished = visibleStatus(row.status, true)
  documents.push({
    _id: isPublished ? baseId : `drafts.${baseId}`,
    _type: 'faq',
    question: cleanText(row.question || row.faq_title).slice(0, 180),
    answer: portableText(row.answer, `faq:${row.id}`),
    category: mapFaqCategory(row.category),
    ...(findDestinationId(row.island_slug || row.island_name) ? {destination: reference(findDestinationId(row.island_slug || row.island_name))} : {}),
    audiences: textValues(row.traveller_type),
    channels: ['web', 'mobile', 'buddy'],
    featured: Number(row.priority) <= 3,
    order: Number.isFinite(Number(row.priority)) ? Number(row.priority) : index,
    reviewedAt,
    source: source({table: 'island_faq', recordId: row.id, ownership: 'editorial_overlay'}),
  })
}

for (const row of places) {
  const urls = [...new Set([row.primary_image_url, ...imageUrls(row.gallery_images)].filter(Boolean))]
  documents.push({
    _id: `place-supabase-${row.id}`,
    _type: 'placeEditorial',
    title: row.name,
    slug: {_type: 'slug', current: `${slugify(row.slug || row.name)}-${String(row.id).slice(0, 8)}`},
    ...(findDestinationId(row.island_id || row.island_name) ? {destination: reference(findDestinationId(row.island_id || row.island_name))} : {}),
    islandName: row.island_name,
    category: row.category || 'place',
    subcategory: row.subcategory,
    shortDescription: cleanText(row.short_description || row.description).slice(0, 300),
    description: portableText(row.description || row.short_description, `place:${row.id}`),
    primaryImage: contentImage(urls[0], row.name),
    gallery: urls.slice(1, 31).map((url) => contentImage(url, row.name)),
    address: row.address,
    website: /^https?:\/\//.test(row.website || '') ? row.website : undefined,
    phone: row.phone,
    openingHours: cleanText(row.opening_hours),
    tags: textValues(row.tags),
    bestFor: textValues(row.best_for),
    amenities: textValues(row.amenities),
    buddyTips: textValues(row.buddy_tips),
    active: row.is_active !== false && row.status !== 'archived',
    featured: Boolean(row.featured),
    channels: ['web', 'mobile', 'buddy'],
    source: source({table: 'places', recordId: row.id, ownership: 'editorial_overlay', notes: 'Ratings, review counts, coordinates, live status, pricing, and provider identity remain in Supabase.'}),
    reviewedAt,
    seo: {_type: 'seo', metaTitle: row.name, metaDescription: cleanText(row.short_description || row.description).slice(0, 300)},
  })
}

for (const row of historicLandmarks) {
  documents.push({
    _id: `place-landmark-${row.id}`,
    _type: 'placeEditorial',
    title: row.name,
    slug: {_type: 'slug', current: `${slugify(row.name)}-${String(row.id).slice(0, 8)}`},
    ...(findDestinationId(row.island_slug || row.island_name) ? {destination: reference(findDestinationId(row.island_slug || row.island_name))} : {}),
    islandName: row.island_name,
    category: 'historic_landmark',
    subcategory: row.landmark_type,
    shortDescription: cleanText(row.short_description || row.why_it_matters).slice(0, 300),
    description: portableText([row.short_description, row.why_it_matters].filter(Boolean).join('\n\n'), `landmark:${row.id}`),
    website: /^https?:\/\//.test(row.source_url || '') ? row.source_url : undefined,
    openingHours: cleanText(row.opening_hours),
    visitorTips: portableText(row.visitor_tips, `landmark:${row.id}:tips`),
    accessibilityNotes: cleanText(row.accessibility_notes),
    active: visibleStatus(row.status, true),
    featured: false,
    channels: ['web', 'mobile', 'buddy'],
    source: source({table: 'historic_landmarks', recordId: row.id, ownership: 'editorial_overlay'}),
    reviewedAt: row.last_reviewed || reviewedAt,
  })
}

const articleDestinationHints = {
  'pink-sand-harbour-island': 'eleuthera-harbour-island',
  'swimming-pigs-exuma': 'the-exumas',
  'andros-diving': 'andros',
  'nassau-100-dollars-a-day': 'nassau-paradise-island',
  'abacos-sailing': 'abacos',
}
for (const [index, article] of Object.values(articleModule.ARTICLES || {}).entries()) {
  const body = [...portableText(article.intro, `article:${article.slug}:intro`)]
  for (const section of article.sections || []) {
    body.push(block(section.heading, 'h2', `article:${article.slug}:${section.heading}`), ...portableText(section.body, `article:${article.slug}:${section.heading}:body`))
  }
  if (article.callout) body.push(block(article.callout.title, 'h2', `article:${article.slug}:callout`), ...portableText(article.callout.body, `article:${article.slug}:callout-body`))
  const destinationId = findDestinationId(articleDestinationHints[article.slug])
  documents.push({
    _id: `article-hardcoded-${article.slug}`,
    _type: 'article',
    title: article.title,
    slug: {_type: 'slug', current: article.slug},
    heroImage: contentImage(article.heroImage, article.title),
    excerpt: cleanText(article.subtitle).slice(0, 300),
    body,
    category: mapArticleCategory(article.category),
    ...(destinationId ? {relatedDestination: reference(destinationId)} : {}),
    readTimeMinutes: Number.parseInt(article.readTime, 10) || 6,
    buddyPrompt: article.buddyPrompt,
    planningSummary: cleanText(article.intro).slice(0, 1000),
    channels: ['web', 'mobile', 'buddy'],
    publishedAt: importedAt,
    reviewedAt,
    featured: index < 4,
    order: index,
    tags: [cleanText(article.category).toLowerCase()],
    source: source({system: 'web_source', sourcePath: 'src/lib/article-content.ts', sourceKey: article.slug, ownership: 'sanity_canonical', notes: 'Copied from the hardcoded article store so future editorial changes can happen in Sanity.'}),
    seo: {_type: 'seo', metaTitle: article.title, metaDescription: cleanText(article.subtitle).slice(0, 300)},
  })
}

const utilityPageFiles = [
  'src/app/about/page.tsx',
  'src/app/how-it-works/page.tsx',
  'src/app/help/page.tsx',
  'src/app/accessibility/page.tsx',
  'src/app/partners/page.tsx',
  'src/app/tourism-board-partnerships/page.tsx',
  'src/app/list-your-property/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/terms/page.tsx',
]
for (const relativePath of utilityPageFiles) {
  const page = extractUtilityPage(relativePath)
  if (page) documents.push(page)
}

const stayPage = fs.readFileSync(path.join(webRoot, 'src/app/stays/page.tsx'), 'utf8')
const stayFaqBlock = stayPage.match(/const faqs = \[([\s\S]*?)\n\s*\];/)?.[1] || ''
for (const [index, match] of [...stayFaqBlock.matchAll(/question:\s*"((?:\\.|[^"])*)"[\s\S]*?answer:\s*"((?:\\.|[^"])*)"/g)].entries()) {
  const question = match[1].replace(/\\"/g, '"')
  const answer = match[2].replace(/\\"/g, '"')
  documents.push({_id: `faq-web-stays-${slugify(question)}`, _type: 'faq', question, answer: portableText(answer, `stay-faq:${index}`), category: 'bookings', channels: ['web'], featured: false, order: index, reviewedAt, source: source({system: 'web_source', sourcePath: 'src/app/stays/page.tsx', sourceKey: `StayFaqSection.${index}`, ownership: 'sanity_canonical'})})
}

const mobileTipsSource = fs.readFileSync(path.join(mobileRoot, 'lib/features/home/widgets/home_sections.dart'), 'utf8')
const tipsBlock = mobileTipsSource.match(/static const _tips = \[([\s\S]*?)\n\s*\];/)?.[1] || ''
const dartTipRegex = /_Tip\(\s*('(?:\\.|[^'])*')\s*,\s*('(?:\\.|[^'])*')/g
for (const [index, match] of [...tipsBlock.matchAll(dartTipRegex)].entries()) {
  const decode = (literal) => new Function(`return ${literal}`)()
  const title = decode(match[1])
  const body = decode(match[2])
  const category = /payment/i.test(title) ? 'money_budget' : /transfer/i.test(title) ? 'getting_around' : /food/i.test(title) ? 'food_drink' : /gear/i.test(title) ? 'packing' : 'local_knowledge'
  documents.push({_id: `tip-mobile-${slugify(title)}`, _type: 'tip', title, body, category, channels: ['mobile', 'buddy'], featured: false, order: index, publishedAt: importedAt, reviewedAt, source: source({system: 'mobile_source', sourcePath: 'lib/features/home/widgets/home_sections.dart', sourceKey: `TravelTipCard._tips.${index}`, ownership: 'sanity_canonical'})})
}

const primaryNav = [
  ['Search', '/search'], ['Stays', '/stays'], ['Flights', '/flights'], ['Explore', '/explore'], ['Destinations', '/destinations'], ['Guides', '/guides'], ['Deals', '/deals'], ['Concierge', '/concierge-trip-plan'],
]
documents.push({_id: 'navigation-web-primary', _type: 'navigation', title: 'Web Primary Navigation', key: 'web_primary', active: true, items: primaryNav.map(([label, itemPath]) => ({_type: 'navigationItem', _key: `nav-${slugify(label)}`, label, path: itemPath})), source: source({system: 'web_source', sourcePath: 'src/components/marketplace/MarketplacePublicHeader.tsx', sourceKey: 'productLinks', ownership: 'sanity_canonical'})})

const footerColumns = {
  'Travel products': [['Search','/search'],['Stays','/stays'],['Flights','/flights'],['Explore','/explore'],['Guides','/guides'],['Guided tours','/nassau-cruise-itineraries'],['Deals','/deals'],['Concierge','/concierge-trip-plan']],
  'Bahamas destinations': [['Nassau','/explore/island/nassau-paradise-island'],['Paradise Island','/explore/island/paradise-island'],['Exuma','/explore/island/the-exumas'],['Eleuthera','/explore/island/eleuthera-harbour-island'],['Harbour Island','/explore/island/harbour-island'],['Grand Bahama','/explore/island/grand-bahama'],['Bimini','/explore/island/bimini'],['Abacos','/explore/island/abacos'],['Andros','/explore/island/andros'],['Long Island','/explore/island/long-island']],
  'Traveler support': [['My trips','/dashboard'],['My bookings','/profile/bookings'],['Help center','/help'],['Contact support','mailto:support@bahabuddy.com'],['Travel requirements','/how-it-works'],['Sign in','/login']],
  'Company': [['About','/about'],['Partner with us','/partners'],['List your property','/list-your-property'],['Novio Group','https://noviogroup.com'],['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Accessibility','/accessibility'],['How Baha Buddy works','/how-it-works']],
}
documents.push({_id: 'navigation-web-footer', _type: 'navigation', title: 'Web Footer Navigation', key: 'web_footer', active: true, items: Object.entries(footerColumns).flatMap(([section, items]) => items.map(([label, itemPath]) => ({_type: 'navigationItem', _key: `footer-${slugify(`${section}-${label}`)}`, section, label, path: itemPath, openInNewTab: itemPath.startsWith('http')}))), source: source({system: 'web_source', sourcePath: 'src/components/Footer.tsx', sourceKey: 'FOOTER_COLUMNS', ownership: 'sanity_canonical'})})

// Keep legacy hand-authored Sanity articles/tips and bring them up to the
// current delivery contract without replacing them with source-derived copy.
const generatedIdsBeforeLegacyRepair = new Set(documents.map((document) => document._id.replace(/^drafts\./, '')))
for (const existing of existingSanity) {
  if (!['article', 'tip'].includes(existing._type) || generatedIdsBeforeLegacyRepair.has(existing._id.replace(/^drafts\./, ''))) continue
  documents.push({
    ...withoutSystemFields(existing),
    _id: existing._id,
    _type: existing._type,
    channels: Array.isArray(existing.channels) && existing.channels.length ? existing.channels : ['web', 'mobile', 'buddy'],
    source: existing.source || source({system: 'sanity', sourceKey: existing._id, ownership: 'sanity_canonical', notes: 'Legacy hand-authored Sanity record retained and upgraded to the current delivery contract.'}),
  })
}

const webCopyFiles = walkFiles(webRoot, 'src', ['.ts', '.tsx'], ['/api/', '/_archive/', '/types/', '/sanity/schemas.deprecated/'])
const mobileCopyFiles = walkFiles(mobileRoot, 'lib', ['.dart'], ['/models/', '/providers/', '/services/'])
for (const relativePath of webCopyFiles) {
  const entries = extractWebCopy(relativePath)
  if (!entries.length) continue
  documents.push({_id: `legacy-copy-web-${hash(relativePath)}`, _type: 'legacyCopyInventory', title: relativePath, surface: 'web', sourcePath: relativePath, entries, source: source({system: 'web_source', sourcePath: relativePath, sourceKey: 'user-facing-string-inventory', ownership: 'cleanup_inventory', notes: 'Edits here are an editorial review queue until the owning consumer is wired to canonical Sanity content.'}), reviewed: false})
}
for (const relativePath of mobileCopyFiles) {
  const entries = extractMobileCopy(relativePath)
  if (!entries.length) continue
  documents.push({_id: `legacy-copy-mobile-${hash(relativePath)}`, _type: 'legacyCopyInventory', title: relativePath, surface: 'mobile', sourcePath: relativePath, entries, source: source({system: 'mobile_source', sourcePath: relativePath, sourceKey: 'user-facing-string-inventory', ownership: 'cleanup_inventory', notes: 'Edits here are an editorial review queue until the owning consumer is wired to canonical Sanity content.'}), reviewed: false})
}

const uniqueDocuments = [...new Map(documents.map((document) => [document._id, document])).values()]
fs.writeFileSync(outputPath, `${uniqueDocuments.map((document) => JSON.stringify(document)).join('\n')}\n`)

const counts = uniqueDocuments.reduce((result, document) => {
  const type = document._type
  result[type] = (result[type] || 0) + 1
  return result
}, {})
console.log(JSON.stringify({outputPath, sourceCounts: {islands: islands.length, attractions: attractions.length, bahamasDeals: bahamasDeals.length, places: places.length, cruiseItineraries: cruiseItineraries.length, cruiseStops: cruiseStops.length, selfTours: selfTours.length, tourStops: tourStops.length, islandFaqs: islandFaqs.length, historicLandmarks: historicLandmarks.length, hardcodedArticles: Object.keys(articleModule.ARTICLES || {}).length}, documentCounts: counts, totalDocuments: uniqueDocuments.length}, null, 2))
