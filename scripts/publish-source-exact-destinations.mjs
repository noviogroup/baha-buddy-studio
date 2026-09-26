#!/usr/bin/env node

import crypto from 'node:crypto'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-30'}).withConfig({
  useCdn: false,
  perspective: 'raw',
})
const apply = process.env.APPLY_SOURCE_EXACT_DESTINATIONS === '1'
const reviewDate = '2026-08-30'
const approvedRights = new Set(['approved_partner', 'approved_licensed'])
const fitTaxonomy = new Set([
  'foodie', 'history', 'shopping', 'nightlife', 'sea_water', 'boating',
  'fishing', 'diving', 'eco_nature', 'birding', 'culture', 'romance',
  'family', 'adventure', 'seclusion', 'luxury',
])

function keyFor(prefix, value) {
  return `${prefix}-${crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)}`
}

function block(text, index) {
  return {
    _type: 'block',
    _key: keyFor(`paragraph-${index}`, text),
    style: 'normal',
    markDefs: [],
    children: [{
      _type: 'span',
      _key: keyFor(`span-${index}`, text),
      text,
      marks: [],
    }],
  }
}

function isDeliverableImage(image) {
  return Boolean(
    image?.asset?._ref &&
    approvedRights.has(image.rightsStatus) &&
    image.permittedChannels?.includes('web') &&
    image.permittedChannels?.includes('mobile') &&
    image.alt?.trim() &&
    image.credit?.trim() &&
    image.subjectIdentity?.trim() &&
    image.rightsEvidence?._ref,
  )
}

function uniqueRefs(facts) {
  const ids = [...new Set(facts.flatMap((fact) =>
    Array.isArray(fact.sources) ? fact.sources.map((source) => source?._ref).filter(Boolean) : []
  ))].sort()
  return ids.map((id) => ({
    _type: 'reference',
    _key: keyFor('evidence', id),
    _ref: id,
  }))
}

function orderedFacts(facts, topics, limit, maxLength = Number.POSITIVE_INFINITY) {
  const topicOrder = new Map(topics.map((topic, index) => [topic, index]))
  return facts
    .filter((fact) => topicOrder.has(fact.topic) && fact.claim.length <= maxLength)
    .sort((left, right) =>
      topicOrder.get(left.topic) - topicOrder.get(right.topic) ||
      left.title.localeCompare(right.title) ||
      left._id.localeCompare(right._id)
    )
    .slice(0, limit)
}

function joinedClaims(facts, maxLength) {
  const claims = []
  let length = 0
  for (const fact of facts) {
    const nextLength = length + fact.claim.length + (claims.length > 0 ? 2 : 0)
    if (nextLength > maxLength) continue
    claims.push(fact.claim)
    length = nextLength
  }
  return claims.join('\n\n') || undefined
}

function cleanGallery(images) {
  const seen = new Set()
  return (images || []).filter((image) => {
    if (!isDeliverableImage(image)) return false
    const identity = image.checksumSha256 || image.asset._ref
    if (seen.has(identity)) return false
    seen.add(identity)
    return true
  })
}

function topTravelerFitTags(facts, limit = 6) {
  const counts = new Map()
  for (const tag of facts.flatMap((fact) => fact.travelerFitTags || [])) {
    if (!fitTaxonomy.has(tag)) continue
    counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts]
    .sort(([leftTag, leftCount], [rightTag, rightCount]) =>
      rightCount - leftCount || leftTag.localeCompare(rightTag)
    )
    .slice(0, limit)
    .map(([tag]) => tag)
}

function buildDestination(destination) {
  const facts = destination.facts
  if (!facts.length) throw new Error(`${destination.islandId} has no approved source-exact facts`)
  for (const fact of facts) {
    if (!fact.claim?.trim() || !fact.sources?.some((source) => source?._ref)) {
      throw new Error(`${fact._id} lacks an exact claim or evidence source`)
    }
  }

  const overviewFacts = orderedFacts(
    facts,
    ['overview', 'nature', 'culture', 'experiences', 'food'],
    3,
  )
  if (!overviewFacts.length) overviewFacts.push(facts[0])

  const highlightFacts = orderedFacts(
    facts,
    ['nature', 'culture', 'experiences', 'food', 'overview'],
    6,
    240,
  )
  const accessFacts = orderedFacts(facts, ['access'], 6)
  const seasonalityFacts = orderedFacts(facts, ['seasonality'], 1, 180)
  const practicalFacts = orderedFacts(facts, ['safety', 'accessibility'], 4)
  const bestFor = topTravelerFitTags(facts)
  const heroImage = isDeliverableImage(destination.heroImage) ? destination.heroImage : undefined
  const gallery = cleanGallery(destination.gallery)
  const evidenceSources = uniqueRefs(facts)

  const document = {
    _id: destination._id,
    _type: 'destination',
    name: destination.name,
    slug: destination.slug,
    islandId: destination.islandId,
    ...(destination.routeAliases?.length ? {routeAliases: destination.routeAliases} : {}),
    tagline: `Source-backed guide to ${destination.name}`,
    overview: overviewFacts.map((fact, index) => block(fact.claim, index)),
    highlights: highlightFacts.map((fact) => ({
      _type: 'destinationHighlight',
      _key: keyFor('highlight', fact._id),
      label: fact.title,
      description: fact.claim,
    })),
    ...(seasonalityFacts[0] ? {bestTimeToVisit: seasonalityFacts[0].claim} : {}),
    ...(joinedClaims(accessFacts, 1200) ? {gettingThere: joinedClaims(accessFacts, 1200)} : {}),
    ...(bestFor.length ? {tripFit: {bestFor}} : {}),
    ...(practicalFacts.length ? {
      practicalNotes: practicalFacts.map((fact, index) => block(fact.claim, index)),
    } : {}),
    ...(heroImage ? {heroImage} : {}),
    ...(gallery.length ? {gallery} : {}),
    faqs: [],
    featured: Boolean(destination.featured),
    order: Number.isFinite(destination.order) ? destination.order : 99,
    evidenceSources,
    editorialReviewStatus: 'approved',
    editorialReviewNotes: `Deterministically rebuilt on ${reviewDate} from ${facts.length} approved source-exact tourism facts. No model-authored destination copy is present. Only asset-level rights-approved imagery is retained; missing imagery intentionally renders the neutral product state.`,
    channels: ['web', 'mobile', 'buddy'],
    reviewedAt: reviewDate,
    seo: {
      _type: 'seo',
      metaTitle: `${destination.name} | Baha Buddy`,
      metaDescription: `Source-backed Bahamas destination guidance for ${destination.name}.`,
    },
  }

  return {
    document,
    report: {
      islandId: destination.islandId,
      approvedFacts: facts.length,
      overviewFacts: overviewFacts.length,
      highlights: highlightFacts.length,
      evidenceSources: evidenceSources.length,
      hero: Boolean(heroImage),
      gallery: gallery.length,
      bestFor: bestFor.length,
      hasSeasonality: Boolean(seasonalityFacts[0]),
      hasAccess: Boolean(document.gettingThere),
      practicalFacts: practicalFacts.length,
    },
  }
}

const destinations = await client.fetch(`
  *[_type == "destination" && !(_id in path("drafts.**"))] | order(islandId asc) {
    _id,
    name,
    slug,
    islandId,
    routeAliases,
    heroImage,
    gallery,
    featured,
    order,
    "facts": *[
      _type == "islandFact" &&
      !(_id in path("drafts.**")) &&
      destination._ref == ^._id &&
      verificationStatus == "approved" &&
      "web" in coalesce(channels, []) &&
      "mobile" in coalesce(channels, []) &&
      "buddy" in coalesce(channels, []) &&
      nextReviewAt >= $reviewDate
    ] | order(topic asc, title asc) {
      _id,
      title,
      topic,
      claim,
      travelerFitTags,
      sources,
      checkedAt,
      nextReviewAt,
      volatility,
      confidence
    }
  }
`, {reviewDate})

if (destinations.length !== 16) {
  throw new Error(`Expected 16 canonical destinations; found ${destinations.length}`)
}

const plans = destinations.map(buildDestination)
const report = {
  mode: apply ? 'apply' : 'dry_run',
  generatedAt: new Date().toISOString(),
  destinations: plans.map((plan) => plan.report),
  totals: {
    destinations: plans.length,
    approvedFacts: plans.reduce((sum, plan) => sum + plan.report.approvedFacts, 0),
    heroImages: plans.filter((plan) => plan.report.hero).length,
    galleryImages: plans.reduce((sum, plan) => sum + plan.report.gallery, 0),
    destinationsUsingNeutralMediaState: plans.filter((plan) => !plan.report.hero).length,
  },
  guardrails: {
    allDestinationsHaveEvidence: plans.every((plan) => plan.report.approvedFacts > 0),
    allDestinationsHaveEvidenceSources: plans.every((plan) => plan.report.evidenceSources > 0),
    onlyRightsApprovedMediaRetained: true,
    generatedOrLegacyMediaFallbackAllowed: false,
    modelAuthoredDestinationCopyAllowed: false,
  },
}

if (!apply) {
  console.log(JSON.stringify(report, null, 2))
  console.log('\nDry run only. Set APPLY_SOURCE_EXACT_DESTINATIONS=1 to replace the 16 published profiles.')
  process.exit(0)
}

let transaction = client.transaction()
for (const plan of plans) transaction = transaction.createOrReplace(plan.document)
await transaction.commit({autoGenerateArrayKeys: true})

console.log(JSON.stringify(report, null, 2))
