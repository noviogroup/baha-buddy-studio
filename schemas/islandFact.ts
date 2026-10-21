import {defineArrayMember, defineField, defineType} from 'sanity'

/** A single evidence-backed claim kept separate from public destination copy. */
export default defineType({
  name: 'islandFact',
  title: 'Verified Island Fact',
  type: 'document',
  description: 'Research evidence for editors and Buddy. Approval is required before a fact is delivered to travelers.',
  groups: [
    {name: 'fact', title: 'Fact', default: true},
    {name: 'evidence', title: 'Evidence'},
    {name: 'workflow', title: 'Workflow'},
  ],
  fields: [
    defineField({name: 'title', title: 'Internal Title', type: 'string', group: 'fact', validation: (Rule) => Rule.required().max(140)}),
    defineField({
      name: 'scope',
      title: 'Applies To',
      type: 'string',
      group: 'fact',
      description: 'Bahamas-wide facts (emergency numbers, hurricane season) are stored once and given to Buddy for every island.',
      options: {list: [{title: 'One island', value: 'island'}, {title: 'All of The Bahamas', value: 'national'}], layout: 'radio'},
      initialValue: 'island',
    }),
    defineField({
      name: 'destination',
      title: 'Destination',
      type: 'reference',
      group: 'fact',
      to: [{type: 'destination'}],
      hidden: ({parent}) => parent?.scope === 'national',
      validation: (Rule) => Rule.custom((value, context) => {
        const scope = (context.parent as {scope?: string} | undefined)?.scope
        if (scope === 'national') return value ? 'A Bahamas-wide fact has no destination.' : true
        return value ? true : 'Choose the island this fact is about.'
      }),
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'string',
      group: 'fact',
      options: {list: [
        {title: 'Overview & identity', value: 'overview'},
        {title: 'Access & transport', value: 'access'},
        {title: 'Stays', value: 'stays'},
        {title: 'Food & drink', value: 'food'},
        {title: 'Experiences', value: 'experiences'},
        {title: 'Beaches & nature', value: 'nature'},
        {title: 'Culture & history', value: 'culture'},
        {title: 'Seasonality & weather', value: 'seasonality'},
        {title: 'Safety & practical guidance', value: 'safety'},
        {title: 'Accessibility', value: 'accessibility'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'claim', title: 'Verified Claim', type: 'text', rows: 5, group: 'fact', description: 'A narrow factual statement. Avoid live prices, availability, and guaranteed schedules.', validation: (Rule) => Rule.required().min(20).max(1800)}),
    defineField({name: 'travelerGuidance', title: 'Traveler Guidance', type: 'text', rows: 4, group: 'fact', description: 'Optional traveler-facing interpretation. Keep uncertainty and limitations explicit.', validation: (Rule) => Rule.max(1200)}),
    defineField({
      name: 'travelerFitTags',
      title: 'Traveler Fit',
      type: 'array',
      group: 'fact',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags', list: [
        'foodie', 'history', 'shopping', 'nightlife', 'sea_water', 'boating',
        'fishing', 'diving', 'eco_nature', 'birding', 'culture', 'romance',
        'family', 'adventure', 'seclusion', 'luxury',
      ].map((value) => ({title: value.replaceAll('_', ' '), value}))},
    }),
    defineField({
      name: 'sources',
      title: 'Supporting Sources',
      type: 'array',
      group: 'evidence',
      of: [defineArrayMember({type: 'reference', to: [{type: 'researchSource'}]})],
      validation: (Rule) => Rule.required().min(1).error('Every fact needs at least one reviewed source.'),
    }),
    defineField({name: 'checkedAt', title: 'Fact Checked', type: 'date', group: 'evidence', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'nextReviewAt',
      title: 'Review Again By',
      type: 'date',
      group: 'evidence',
      description: 'Counted from Fact Checked: stable within 24 months, seasonal 6 months, operational 90 days. Buddy shortens later dates to that window.',
      validation: (Rule) => Rule.required().custom((value, context) => {
        const parent = context.parent as {checkedAt?: string; volatility?: string} | undefined
        if (!value || !parent?.checkedAt || !parent.volatility || parent.volatility === 'live') return true
        const checked = new Date(`${parent.checkedAt}T00:00:00Z`)
        const max = parent.volatility === 'operational'
          ? new Date(checked.getTime() + 90 * 86_400_000)
          : new Date(Date.UTC(checked.getUTCFullYear(), checked.getUTCMonth() + (parent.volatility === 'seasonal' ? 6 : 24), checked.getUTCDate()))
        const limit = max.toISOString().slice(0, 10)
        return value <= limit ? true : `A ${parent.volatility} fact is reviewed by ${limit}.`
      }),
    }),
    defineField({
      name: 'expiresAt',
      title: 'Notice Ends',
      type: 'datetime',
      group: 'evidence',
      description: 'For dated notices only (a temporary airport closure). Buddy stops using the fact at this moment. The end of a notice never means the situation is resolved.',
    }),
    defineField({
      name: 'affectsGatewayCodes',
      title: 'Affects Gateways',
      type: 'array',
      group: 'evidence',
      description: 'IATA codes of gateways this notice affects (e.g. TYM). While the notice runs, they are left out of Island Match.',
      of: [defineArrayMember({type: 'string', validation: (Rule) => Rule.uppercase().length(3)})],
      options: {layout: 'tags'},
      hidden: ({parent}) => !parent?.expiresAt,
    }),
    defineField({
      name: 'volatility',
      title: 'Volatility',
      type: 'string',
      group: 'evidence',
      options: {list: [
        {title: 'Stable — review within 24 months', value: 'stable'},
        {title: 'Seasonal — review within 6 months', value: 'seasonal'},
        {title: 'Operational — review within 90 days', value: 'operational'},
        {title: 'Live — do not treat as canonical CMS data', value: 'live'},
      ]},
      validation: (Rule) => Rule.required().custom((value) => value === 'live' ? 'Live availability, prices, weather, and schedules must come from runtime providers.' : true),
    }),
    defineField({
      name: 'confidence',
      title: 'Confidence',
      type: 'string',
      group: 'workflow',
      options: {list: [
        {title: 'High — primary source or strong corroboration', value: 'high'},
        {title: 'Medium — credible but incomplete', value: 'medium'},
        {title: 'Low — research lead only', value: 'low'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'verificationStatus',
      title: 'Verification Status',
      type: 'string',
      group: 'workflow',
      options: {list: [
        {title: 'Researching', value: 'researching'},
        {title: 'Source verified', value: 'source_verified'},
        {title: 'Editorial review', value: 'editorial_review'},
        {title: 'Approved', value: 'approved'},
        {title: 'Retired', value: 'retired'},
      ]},
      initialValue: 'researching',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'editorNotes', title: 'Editor Notes', type: 'text', rows: 4, group: 'workflow', validation: (Rule) => Rule.max(1200)}),
    defineField({name: 'conflictGroup', title: 'Conflict Review Group', type: 'string', group: 'workflow', description: 'Facts sharing a conflict group remain separate until an editor adjudicates them.', validation: (Rule) => Rule.max(120)}),
    defineField({name: 'sourceExcerpt', title: 'Internal Source Excerpt', type: 'text', rows: 3, group: 'evidence', description: 'Short internal-only excerpt used to verify the extraction against the source.', validation: (Rule) => Rule.max(700)}),
    defineField({name: 'extractionModel', title: 'Extraction Model', type: 'string', group: 'workflow', readOnly: true}),
    defineField({name: 'extractionPromptVersion', title: 'Extraction Prompt Version', type: 'string', group: 'workflow', readOnly: true}),
    defineField({
      name: 'channels',
      title: 'Approved Delivery Channels',
      type: 'array',
      group: 'workflow',
      description: 'Only set after approval and consumer review.',
      of: [defineArrayMember({type: 'string'})],
      options: {list: [{title: 'Web', value: 'web'}, {title: 'Mobile', value: 'mobile'}, {title: 'Buddy planning context', value: 'buddy'}]},
    }),
  ],
  preview: {
    select: {title: 'title', destination: 'destination.name', scope: 'scope', topic: 'topic', status: 'verificationStatus', confidence: 'confidence'},
    prepare({title, destination, scope, topic, status, confidence}) {
      return {title: title || 'Untitled fact', subtitle: [scope === 'national' ? 'All of The Bahamas' : destination, topic, status, confidence].filter(Boolean).join(' · ')}
    },
  },
  orderings: [
    {title: 'Island and topic', name: 'islandTopic', by: [{field: 'destination.name', direction: 'asc'}, {field: 'topic', direction: 'asc'}, {field: 'title', direction: 'asc'}]},
    {title: 'Review date', name: 'reviewDate', by: [{field: 'nextReviewAt', direction: 'asc'}]},
  ],
})
