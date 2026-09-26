import article from './article'
import author from './author'
import contentCollection from './contentCollection'
import contentPage from './contentPage'
import canonicalPlaceCandidate from './canonicalPlaceCandidate'
import destination from './destination'
import emergencyFacility from './emergencyFacility'
import experience from './experience'
import deal from './deal'
import faq from './faq'
import guidedTour from './guidedTour'
import imageCandidate from './imageCandidate'
import itinerary from './itinerary'
import islandFact from './islandFact'
import islandResearchAudit from './islandResearchAudit'
import legacyCopyInventory from './legacyCopyInventory'
import navigation from './navigation'
import placeEditorial from './placeEditorial'
import tip from './tip'
import siteSettings from './siteSettings'
import socialVideo from './socialVideo'
import travelerStory from './travelerStory'
import researchSource from './researchSource'
import callToAction from './objects/callToAction'
import contentImage from './objects/contentImage'
import contentSource from './objects/contentSource'
import contentSection from './objects/contentSection'
import emergencyLocationReview from './objects/emergencyLocationReview'
import faqItem from './objects/faqItem'
import placeLocationReview from './objects/placeLocationReview'
import placeContentReadinessReview from './objects/placeContentReadinessReview'
import researchSourceReviewPlan from './objects/researchSourceReviewPlan'
import placeTravelerReadinessReview from './objects/placeTravelerReadinessReview'
import richText from './objects/richText'
import seo from './objects/seo'

/**
 * Canonical schema registry. The custom desk structure in `../structure.ts`
 * owns editor-facing navigation, while this registry includes both documents
 * and the reusable object types they share.
 */
export const schemaTypes = [
  // Reusable objects
  contentImage,
  contentSource,
  richText,
  seo,
  callToAction,
  contentSection,
  emergencyLocationReview,
  placeLocationReview,
  placeContentReadinessReview,
  researchSourceReviewPlan,
  placeTravelerReadinessReview,
  faqItem,

  // Documents
  article,
  author,
  contentPage,
  canonicalPlaceCandidate,
  contentCollection,
  destination,
  emergencyFacility,
  experience,
  guidedTour,
  imageCandidate,
  itinerary,
  islandFact,
  islandResearchAudit,
  legacyCopyInventory,
  deal,
  tip,
  faq,
  socialVideo,
  travelerStory,
  researchSource,
  navigation,
  placeEditorial,
  siteSettings,
]
