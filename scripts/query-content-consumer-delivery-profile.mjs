import fs from 'node:fs'
import sanityCli from 'sanity/cli'

const {getCliClient} = sanityCli
const client = getCliClient({apiVersion: '2026-08-05'}).withConfig({useCdn: false, perspective: 'raw'})
const outputPath = process.env.CONTENT_DELIVERY_PROFILE_OUTPUT || '/private/tmp/baha-buddy-content-consumer-delivery-profile.json'

const documentTypes = [
  'article',
  'author',
  'canonicalPlaceCandidate',
  'contentCollection',
  'contentPage',
  'deal',
  'destination',
  'emergencyFacility',
  'experience',
  'faq',
  'guidedTour',
  'islandFact',
  'islandResearchAudit',
  'itinerary',
  'legacyCopyInventory',
  'navigation',
  'placeEditorial',
  'researchSource',
  'siteSettings',
  'socialVideo',
  'tip',
  'travelerStory',
]

const consumerTypes = [
  'article',
  'contentPage',
  'deal',
  'destination',
  'experience',
  'guidedTour',
  'siteSettings',
  'socialVideo',
  'tip',
  'travelerStory',
]

const researchTypes = [
  'canonicalPlaceCandidate',
  'emergencyFacility',
  'islandFact',
  'islandResearchAudit',
  'legacyCopyInventory',
  'placeEditorial',
  'researchSource',
]

const documents = await client.fetch(`*[_type in $documentTypes] | order(_type asc, _id asc){
  _id,
  _type,
  _createdAt,
  _updatedAt,
  title,
  name,
  routePath,
  islandId,
  "slug": slug.current,
  channels,
  verificationStatus,
  active,
  featured
}`, {documentTypes})

const isDraft = (document) => document._id.startsWith('drafts.')
const displayTitle = (document) => document.title || document.name || document.routePath || document.slug || document.islandId || document._id
const hasChannel = (document, channel) => Array.isArray(document.channels) && document.channels.includes(channel)

function summarizeType(type) {
  const rows = documents.filter((document) => document._type === type)
  const published = rows.filter((document) => !isDraft(document))
  const drafts = rows.filter(isDraft)
  return {
    type,
    rawDocuments: rows.length,
    publishedDocuments: published.length,
    draftDocuments: drafts.length,
    publishedWithoutChannels: published.filter((document) => !Array.isArray(document.channels) || document.channels.length === 0).length,
    publishedForWeb: published.filter((document) => hasChannel(document, 'web')).length,
    publishedForMobile: published.filter((document) => hasChannel(document, 'mobile')).length,
    publishedForBuddy: published.filter((document) => hasChannel(document, 'buddy')).length,
    publishedActive: published.filter((document) => document.active === true).length,
    publishedInactive: published.filter((document) => document.active === false).length,
    publishedFeatured: published.filter((document) => document.featured === true).length,
    publishedWithoutChannelDocuments: published
      .filter((document) => !Array.isArray(document.channels) || document.channels.length === 0)
      .map((document) => ({_id: document._id, title: displayTitle(document)})),
  }
}

const typeSummaries = documentTypes.map(summarizeType)
const publishedFacts = documents.filter((document) => document._type === 'islandFact' && !isDraft(document))
const approvedFacts = publishedFacts.filter((document) => document.verificationStatus === 'approved')
const researchDocuments = documents.filter((document) => researchTypes.includes(document._type))
const consumerDocuments = documents.filter((document) => consumerTypes.includes(document._type))
const publishedConsumerDocuments = consumerDocuments.filter((document) => !isDraft(document))

const report = {
  generatedAt: new Date().toISOString(),
  methodology: {
    perspective: 'raw',
    publicationRule: 'A document is published when its Sanity ID does not start with drafts..',
    strictDeliveryRule: 'Research evidence is eligible for a traveler consumer only when it is published, verificationStatus is approved, and the target channel is explicitly present.',
    legacyConsumerRule: 'Existing article/tip/destination/content-page consumers currently also accept published documents with no channels. This profile separates that legacy behavior from the strict rule.',
  },
  counts: {
    rawDocuments: documents.length,
    publishedDocuments: documents.filter((document) => !isDraft(document)).length,
    draftDocuments: documents.filter(isDraft).length,
    consumerRawDocuments: consumerDocuments.length,
    consumerPublishedDocuments: publishedConsumerDocuments.length,
    consumerPublishedWithoutChannels: publishedConsumerDocuments.filter((document) => !Array.isArray(document.channels) || document.channels.length === 0).length,
    researchRawDocuments: researchDocuments.length,
    researchPublishedDocuments: researchDocuments.filter((document) => !isDraft(document)).length,
    researchDraftDocuments: researchDocuments.filter(isDraft).length,
    publishedIslandFacts: publishedFacts.length,
    approvedPublishedIslandFacts: approvedFacts.length,
    strictWebFacts: approvedFacts.filter((document) => hasChannel(document, 'web')).length,
    strictMobileFacts: approvedFacts.filter((document) => hasChannel(document, 'mobile')).length,
    strictBuddyFacts: approvedFacts.filter((document) => hasChannel(document, 'buddy')).length,
  },
  types: typeSummaries,
  publishedRouteIndex: {
    destinations: documents
      .filter((document) => document._type === 'destination' && !isDraft(document))
      .map((document) => ({
        _id: document._id,
        name: displayTitle(document),
        islandId: document.islandId || null,
        slug: document.slug || null,
        webPath: document.islandId ? `/explore/island/${document.islandId}` : null,
        channels: document.channels || [],
      })),
    articles: documents
      .filter((document) => document._type === 'article' && !isDraft(document))
      .map((document) => ({
        _id: document._id,
        title: displayTitle(document),
        slug: document.slug || null,
        guidePath: document.slug ? `/guides/${document.slug}` : null,
        explorePath: document.slug ? `/explore/articles/${document.slug}` : null,
        channels: document.channels || [],
      })),
    contentPages: documents
      .filter((document) => document._type === 'contentPage' && !isDraft(document))
      .map((document) => ({_id: document._id, title: displayTitle(document), routePath: document.routePath || null, channels: document.channels || []})),
  },
  strictResearchDelivery: {
    approvedPublishedFacts: approvedFacts.map((document) => ({
      _id: document._id,
      title: displayTitle(document),
      channels: document.channels || [],
    })),
    guards: {
      noUnapprovedFactIsStrictlyDeliverable: publishedFacts.every((document) => {
        const delivered = ['web', 'mobile', 'buddy'].some((channel) => hasChannel(document, channel))
        return !delivered || document.verificationStatus === 'approved'
      }),
      noDraftFactCountedAsStrictlyDeliverable: documents
        .filter((document) => document._type === 'islandFact' && isDraft(document))
        .every((document) => !approvedFacts.some((approved) => approved._id === document._id)),
    },
  },
}

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({
  output: outputPath,
  counts: report.counts,
  guards: report.strictResearchDelivery.guards,
  types: report.types,
}, null, 2))
