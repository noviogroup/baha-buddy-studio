import article from './article'
import destination from './destination'
import experience from './experience'
import deal from './deal'
import tip from './tip'
import siteSettings from './siteSettings'
import socialVideo from './socialVideo'
import travelerStory from './travelerStory'

/**
 * Schema registry. Order here drives the sidebar navigation order in
 * Studio. Roughly grouped: content (article, tip), curated lists
 * (destination, experience), commerce (deal), social (socialVideo,
 * travelerStory), and configuration (siteSettings).
 */
export const schemaTypes = [
  article,
  destination,
  experience,
  deal,
  tip,
  socialVideo,
  travelerStory,
  siteSettings,
]
