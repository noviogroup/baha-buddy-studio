import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'destination',
  title: 'Destination',
  type: 'document',
  description: 'Editorial island profile joined to the canonical Supabase islands row through Island ID.',
  groups: [
    {name: 'overview', title: 'Overview', default: true},
    {name: 'planning', title: 'Trip Planning'},
    {name: 'media', title: 'Media'},
    {name: 'delivery', title: 'Delivery'},
  ],
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', group: 'overview', validation: (Rule) => Rule.required().max(100)}),
    defineField({
      name: 'slug',
      title: 'Public Slug',
      type: 'slug',
      group: 'delivery',
      options: {source: 'name', maxLength: 96},
      description: 'Canonical traveler-facing slug used by destination URLs.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'islandId',
      title: 'Canonical Island ID',
      description: 'Must exactly match the Supabase islands.slug and the app/web route slug (for example eleuthera-harbour-island).',
      type: 'string',
      group: 'delivery',
      validation: (Rule) => Rule.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    }),
    defineField({
      name: 'routeAliases',
      title: 'Legacy Slug Aliases',
      type: 'array',
      group: 'delivery',
      description: 'Old or shorthand slugs used only for redirects and lookup compatibility.',
      of: [defineArrayMember({type: 'string', validation: (Rule) => Rule.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)})],
      options: {layout: 'tags'},
    }),
    defineField({name: 'tagline', title: 'Tagline', type: 'string', group: 'overview', validation: (Rule) => Rule.required().max(140)}),
    defineField({name: 'overview', title: 'Overview', type: 'richText', group: 'overview', validation: (Rule) => Rule.required().min(1).warning('Add an editorial overview before featuring this destination.')}),
    defineField({name: 'heroImage', title: 'Hero Image', type: 'contentImage', group: 'media'}),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      group: 'overview',
      of: [
        defineArrayMember({
          name: 'destinationHighlight',
          title: 'Highlight',
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required().max(80)}),
            defineField({name: 'icon', title: 'Icon Name or Emoji', type: 'string', validation: (Rule) => Rule.max(40)}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 2, validation: (Rule) => Rule.max(240)}),
          ],
          preview: {select: {title: 'label', subtitle: 'description'}},
        }),
      ],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({name: 'bestTimeToVisit', title: 'Best Time to Visit', type: 'string', group: 'planning', validation: (Rule) => Rule.max(180)}),
    defineField({name: 'gettingThere', title: 'Getting There', type: 'text', rows: 5, group: 'planning', description: 'How travelers reach the island. Routes change, so Buddy treats this as operational: review it at least every 90 days. Never put temporary closures here — use an expiring Island Fact.', validation: (Rule) => Rule.max(1200)}),
    defineField({name: 'gettingThereReviewedAt', title: 'Getting There Last Checked', type: 'date', group: 'planning', description: 'When the Getting There text was last checked against a source. Buddy stops using it 90 days later. Falls back to Last Reviewed.'}),
    defineField({
      name: 'airports',
      title: 'Airport & Ferry Gateways',
      type: 'array',
      group: 'planning',
      of: [
        defineArrayMember({
          name: 'gateway',
          title: 'Gateway',
          type: 'object',
          fields: [
            defineField({name: 'code', title: 'IATA Code', type: 'string', validation: (Rule) => Rule.uppercase().length(3)}),
            defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required().max(120)}),
            defineField({name: 'type', title: 'Type', type: 'string', options: {list: [{title: 'Airport', value: 'airport'}, {title: 'Ferry or water taxi', value: 'ferry'}, {title: 'Port', value: 'port'}]}, validation: (Rule) => Rule.required()}),
            defineField({name: 'note', title: 'Traveler Note', type: 'text', rows: 2, description: 'Short, durable advice. No temporary closures or dates.', validation: (Rule) => Rule.max(300)}),
            defineField({
              name: 'serviceClassification',
              title: 'Service Type',
              type: 'string',
              description: 'What an operator source shows today. Unknown is Unverified, never Charter only. Only Scheduled service makes the island eligible for Island Match.',
              options: {list: [
                {title: 'Scheduled', value: 'scheduled'},
                {title: 'Scheduled and charter', value: 'scheduled_and_charter'},
                {title: 'Charter only', value: 'charter_only'},
                {title: 'Seasonal', value: 'seasonal'},
                {title: 'Unverified', value: 'unverified'},
              ]},
              initialValue: 'unverified',
            }),
            defineField({
              name: 'serviceSources',
              title: 'Service Sources',
              type: 'array',
              description: 'Operator pages supporting the service type. Required for anything but Unverified.',
              of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})],
              validation: (Rule) => Rule.custom((value, context) => {
                const classification = (context.parent as {serviceClassification?: string} | undefined)?.serviceClassification
                return classification && classification !== 'unverified' && !(Array.isArray(value) && value.length)
                  ? 'Add the operator source for this service type.'
                  : true
              }),
            }),
            defineField({name: 'serviceCheckedAt', title: 'Service Checked', type: 'date', description: 'Buddy uses the service type only once it has a check date.'}),
            defineField({
              name: 'serviceNextReviewAt',
              title: 'Service Review By',
              type: 'date',
              description: 'At most 90 days after the check. Later dates are shortened to 90 days.',
              validation: (Rule) => Rule.custom((value, context) => {
                const checked = (context.parent as {serviceCheckedAt?: string} | undefined)?.serviceCheckedAt
                if (!value || !checked) return true
                const max = new Date(Date.parse(`${checked}T00:00:00Z`) + 90 * 86_400_000).toISOString().slice(0, 10)
                return value <= max ? true : `Service claims are reviewed within 90 days (by ${max}).`
              }),
            }),
          ],
          preview: {select: {title: 'name', code: 'code', type: 'type', service: 'serviceClassification'}, prepare({title, code, type, service}) { return {title, subtitle: [code, type, service].filter(Boolean).join(' · ')} }},
        }),
      ],
    }),
    defineField({
      name: 'tripFit',
      title: 'Trip Fit',
      type: 'object',
      group: 'planning',
      fields: [
        defineField({name: 'vibe', title: 'Vibe', type: 'string', validation: (Rule) => Rule.max(80)}),
        defineField({name: 'recommendedStay', title: 'Recommended Stay', type: 'string', description: 'Example: 4–6 days', validation: (Rule) => Rule.max(40)}),
        defineField({name: 'pace', title: 'Pace', type: 'string', validation: (Rule) => Rule.max(60)}),
        defineField({name: 'bestFor', title: 'Best For', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}}),
        defineField({name: 'notIdealFor', title: 'Not Ideal For', type: 'text', rows: 2, validation: (Rule) => Rule.max(300)}),
      ],
    }),
    defineField({name: 'practicalNotes', title: 'Practical Notes', type: 'richText', group: 'planning', description: 'Shown on web and mobile. Buddy does not use it: safety goes in Safety Notes, and entry or passport rules come from the live entry-requirements data.'}),
    defineField({name: 'safetyNotes', title: 'Safety Notes', type: 'richText', group: 'planning', description: 'Island safety guidance for Buddy: water, getting around at night, emergency help. Never passport or entry rules — Buddy drops those. Reviewed every 90 days.'}),
    defineField({name: 'faqs', title: 'Destination FAQs', type: 'array', group: 'planning', of: [defineArrayMember({type: 'faqItem'})], validation: (Rule) => Rule.max(12)}),
    defineField({name: 'gallery', title: 'Gallery', type: 'array', group: 'media', of: [defineArrayMember({type: 'contentImage'})], validation: (Rule) => Rule.max(20)}),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', group: 'delivery', initialValue: false}),
    defineField({name: 'order', title: 'Sort Order', type: 'number', group: 'delivery', initialValue: 99}),
    defineField({
      name: 'evidenceSources',
      title: 'Editorial Evidence Sources',
      type: 'array',
      group: 'delivery',
      description: 'Reviewed repository sources supporting this profile. Operational details still require a fresh responsible-source check.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})],
    }),
    defineField({
      name: 'editorialReviewStatus',
      title: 'Editorial Evidence Status',
      type: 'string',
      group: 'delivery',
      options: {list: [
        {title: 'Legacy — not evidence reviewed', value: 'legacy_unreviewed'},
        {title: 'Researching', value: 'researching'},
        {title: 'Ready for editorial review', value: 'ready_for_review'},
        {title: 'Blocked', value: 'blocked'},
        {title: 'Approved', value: 'approved'},
      ]},
    }),
    defineField({
      name: 'editorialReviewNotes',
      title: 'Editorial Evidence Notes',
      type: 'text',
      rows: 5,
      group: 'delivery',
      validation: (Rule) => Rule.max(1800),
    }),
    defineField({
      name: 'channels',
      title: 'Delivery Channels',
      type: 'array',
      group: 'delivery',
      of: [defineArrayMember({type: 'string'})],
      options: {list: [{title: 'Web', value: 'web'}, {title: 'Mobile', value: 'mobile'}, {title: 'Buddy planning context', value: 'buddy'}]},
      initialValue: ['web', 'mobile', 'buddy'],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'reviewedAt', title: 'Last Reviewed', type: 'date', group: 'delivery'}),
    defineField({name: 'source', title: 'Imported Source', type: 'contentSource', group: 'delivery'}),
    defineField({name: 'seo', title: 'Search & Sharing', type: 'seo', group: 'delivery'}),
  ],
  preview: {
    select: {title: 'name', media: 'heroImage', islandId: 'islandId', featured: 'featured'},
    prepare({title, media, islandId, featured}) {
      return {title: title || 'Untitled destination', subtitle: `${islandId ?? 'Island ID missing'}${featured ? ' · Featured' : ''}`, media}
    },
  },
  orderings: [{title: 'Manual order', name: 'manualOrder', by: [{field: 'order', direction: 'asc'}, {field: 'name', direction: 'asc'}]}],
})
