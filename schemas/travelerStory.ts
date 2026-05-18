import {defineField, defineType} from 'sanity'

/**
 * travelerStory — Editor-curated testimonial cards surfaced on Explore
 * Community → Traveler Stories.
 *
 * Both mobile (`_TravelerStory` in
 * `Baha-Buddy-V2/lib/features/explore/screens/explore_screen.dart`)
 * and web (`TravelerStoryCard` in
 * `bahabuddy-web/src/components/explore/ExploreTabs.tsx`) consume
 * this shape. Until this schema is populated in Studio, both surfaces
 * fall back to hardcoded stories.
 *
 * These are short-form, marketing-grade testimonials. Different from
 * a hypothetical future "trip reports" or "user-generated trips"
 * surface — those would be authenticated-user content moderated
 * through a separate flow. Traveler Stories are editor-vetted social
 * proof.
 *
 * Avatar: optional image upload. When no image is provided, the card
 * renders the traveler's first initial in a colored circle. The
 * fallback path is the common case in early days, so don't gate
 * publishing on having an avatar.
 */
export default defineType({
  name: 'travelerStory',
  title: 'Traveler Story',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Traveler Name',
      type: 'string',
      description:
        'Public display name (e.g. "Sarah & Mike", "The Johnsons", "Marcus"). First initial is used in the avatar fallback when no image is provided.',
      validation: (Rule) => Rule.required().max(40),
    }),

    defineField({
      name: 'tripSummary',
      title: 'Trip Summary',
      type: 'string',
      description:
        'One-line description (e.g. "5 days in Exuma", "7 days island hopping"). Shown directly under the name.',
      validation: (Rule) => Rule.required().max(60),
    }),

    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      description:
        'The testimonial itself. Plain text only — no Markdown. Quote marks are added by the UI, so write the body without surrounding quotes.',
      validation: (Rule) => Rule.required().min(20).max(280),
    }),

    defineField({
      name: 'partyType',
      title: 'Party Type',
      type: 'string',
      description:
        'Drives the colored pill in the card header (Solo brand-blue, Couple coral, Family palm-green). Pick the one that best describes who travelled.',
      options: {
        list: [
          {title: 'Solo', value: 'solo'},
          {title: 'Couple', value: 'couple'},
          {title: 'Family', value: 'family'},
          {title: 'Friends', value: 'friends'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'destination',
      title: 'Primary Destination',
      type: 'reference',
      to: [{type: 'destination'}],
      description:
        'Optional. Links the story to a specific island for filtering on island detail pages later.',
    }),

    defineField({
      name: 'tripDurationDays',
      title: 'Trip Duration (days)',
      type: 'number',
      description:
        'Optional. Used by analytics and filtering ("week-long trips", "long weekends") — not displayed directly (the trip summary string already covers display).',
      validation: (Rule) => Rule.min(1).max(60).integer(),
    }),

    defineField({
      name: 'avatarImage',
      title: 'Avatar (optional)',
      type: 'image',
      description:
        "Optional traveler photo. When omitted, the card falls back to the traveler's first initial in a colored circle. Editor permission required.",
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alt Text', type: 'string'}),
      ],
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Featured stories surface first on Explore Community.',
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
      title: 'name',
      summary: 'tripSummary',
      partyType: 'partyType',
      media: 'avatarImage',
    },
    prepare({title, summary, partyType, media}) {
      const partyLabel = partyType
        ? partyType.charAt(0).toUpperCase() + partyType.slice(1)
        : '—'
      return {
        title: title || 'Untitled story',
        subtitle: summary ? `${partyLabel} · ${summary}` : partyLabel,
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
