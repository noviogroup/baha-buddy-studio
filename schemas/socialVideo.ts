import {defineField, defineType} from 'sanity'

/**
 * socialVideo — Editor-curated TikTok / Instagram / YouTube content
 * surfaced on Explore Community → Trending Videos.
 *
 * Both mobile (`_SocialVideoCard` in
 * `Baha-Buddy-V2/lib/features/explore/screens/explore_screen.dart`)
 * and web (`SocialVideoCard` in
 * `bahabuddy-web/src/components/explore/ExploreTabs.tsx`) consume this
 * shape. Until this schema is populated in Studio, both surfaces fall
 * back to hardcoded video lists.
 *
 * Why this exists as its own document type instead of being part of
 * the `experience` schema: a social video is a third-party piece of
 * content with a creator handle, view count, and platform attribution
 * that doesn't fit Experience's "things to do" semantics. Keeping
 * them separate also lets us moderate UGC-adjacent content under a
 * different permission scope when we wire that.
 *
 * The actual playback is currently a decorative play-button affordance
 * on both surfaces. When TikTok and Instagram oEmbed are wired, the
 * `videoUrl` field below will drive the real iframe.
 */
export default defineType({
  name: 'socialVideo',
  title: 'Social Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Short headline shown on the card (e.g. "Swimming with pigs in Exuma!")',
      validation: (Rule) => Rule.required().max(80),
    }),

    defineField({
      name: 'creator',
      title: 'Creator Handle',
      type: 'string',
      description: 'With the @ prefix (e.g. "@islandhopper"). Displayed verbatim.',
      validation: (Rule) =>
        Rule.required()
          .max(40)
          .custom((value) =>
            !value || value.startsWith('@')
              ? true
              : 'Creator handle must start with @',
          ),
    }),

    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          {title: 'TikTok', value: 'tiktok'},
          {title: 'Instagram', value: 'instagram'},
          {title: 'YouTube', value: 'youtube'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'thumbnailImage',
      title: 'Thumbnail',
      type: 'image',
      description:
        "The card's background image. Prefer a still that captures the moment — videos with a single human/animal subject work best for thumbnails.",
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alt Text', type: 'string'}),
      ],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description:
        'Direct link to the source video on TikTok / Instagram / YouTube. Currently used only for attribution; will drive real playback once oEmbed is wired.',
      validation: (Rule) =>
        Rule.uri({allowRelative: false, scheme: ['https']}),
    }),

    defineField({
      name: 'viewsLabel',
      title: 'View Count Label',
      type: 'string',
      description:
        'Display-ready string like "2.3M views" or "890K views". Pre-formatted so editors choose the rounding (the raw number on the source platform may include partial decimals or change daily).',
      validation: (Rule) => Rule.required().max(20),
    }),

    defineField({
      name: 'accentTone',
      title: 'Accent Tone',
      type: 'string',
      description:
        'Drives the dark gradient overlay color on the card. Pick the tone that contrasts best with the thumbnail.',
      options: {
        list: [
          {title: 'Sky (default — best for ocean/sky)', value: 'sky'},
          {title: 'Coral (warm — best for sunsets/beaches/people)', value: 'coral'},
          {title: 'Amber (warm — best for food/markets)', value: 'amber'},
          {title: 'Brand (deep blue — best for diving/dramatic)', value: 'brand'},
        ],
        layout: 'radio',
      },
      initialValue: 'sky',
    }),

    defineField({
      name: 'buddyPrompt',
      title: 'Plan-this Chat Prompt',
      type: 'text',
      rows: 2,
      description:
        'Pre-filled chat prompt that opens when the user taps "Plan this". Write it in first-person ("I want to…") so it reads naturally as if the user typed it.',
      validation: (Rule) => Rule.required().min(15).max(200),
    }),

    defineField({
      name: 'destination',
      title: 'Related Destination',
      type: 'reference',
      to: [{type: 'destination'}],
      description: 'Optional. Links the video to a specific island for filtering.',
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Featured videos surface first on Explore Community.',
      initialValue: false,
    }),

    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description:
        'Lower numbers surface first within the featured/unfeatured tier. Defaults to 99.',
      initialValue: 99,
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      creator: 'creator',
      platform: 'platform',
      media: 'thumbnailImage',
    },
    prepare({title, creator, platform, media}) {
      const platformLabel = platform
        ? platform.charAt(0).toUpperCase() + platform.slice(1)
        : '—'
      return {
        title: title || 'Untitled video',
        subtitle: `${platformLabel} · ${creator ?? ''}`,
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Manual order (featured first)',
      name: 'manualOrder',
      by: [
        {field: 'featured', direction: 'desc'},
        {field: 'order', direction: 'asc'},
        {field: 'publishedAt', direction: 'desc'},
      ],
    },
    {
      title: 'Most recent first',
      name: 'publishedDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
})
