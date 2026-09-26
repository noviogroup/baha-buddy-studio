import {defineArrayMember, defineField, defineType} from 'sanity'

/** Review-only emergency facility evidence. Activation and live readiness never belong in this document. */
export default defineType({
  name: 'emergencyFacility',
  title: 'Emergency Facility',
  type: 'document',
  description: 'A dated authority-listed facility record. Source verification does not mean the facility is activated, open, accessible, or operational now.',
  groups: [
    {name: 'identity', title: 'Facility', default: true},
    {name: 'evidence', title: 'Published Evidence'},
    {name: 'location', title: 'Historical Location Review'},
    {name: 'workflow', title: 'Review & Delivery'},
  ],
  fields: [
    defineField({name: 'title', title: 'Facility Name', type: 'string', group: 'identity', validation: (Rule) => Rule.required().max(180)}),
    defineField({name: 'destination', title: 'Destination', type: 'reference', group: 'identity', to: [{type: 'destination'}], validation: (Rule) => Rule.required()}),
    defineField({
      name: 'facilityKind',
      title: 'Facility Kind',
      type: 'string',
      group: 'identity',
      options: {list: [
        {title: 'Hurricane shelter', value: 'hurricane_shelter'},
        {title: 'Special-needs shelter', value: 'special_needs_shelter'},
        {title: 'Aftermath facility', value: 'aftermath_facility'},
        {title: 'Other emergency facility', value: 'other'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'settlement', title: 'Published Address / Settlement', type: 'string', group: 'identity', validation: (Rule) => Rule.required().max(180)}),
    defineField({name: 'publishedCapacity', title: 'Published Capacity', type: 'number', group: 'evidence', description: 'Dated list value only; never present this as live usable capacity.', validation: (Rule) => Rule.required().integer().min(1)}),
    defineField({name: 'publishedForYear', title: 'Official List Year', type: 'number', group: 'evidence', validation: (Rule) => Rule.required().integer().min(2000).max(2100)}),
    defineField({name: 'sourceEntryNumber', title: 'Source Entry Number', type: 'number', group: 'evidence', validation: (Rule) => Rule.required().integer().min(1)}),
    defineField({name: 'sourceDesignation', title: 'Source Designation Note', type: 'string', group: 'evidence', description: 'Exact qualifying label in the authority list; it is not proof of feature-level accessibility.', validation: (Rule) => Rule.max(260)}),
    defineField({name: 'source', title: 'Supporting Source', type: 'reference', group: 'evidence', to: [{type: 'researchSource'}], validation: (Rule) => Rule.required()}),
    defineField({name: 'checkedAt', title: 'Evidence Checked', type: 'date', group: 'evidence', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'historicalLocationReview',
      title: 'Historical GIS Reconciliation',
      type: 'emergencyLocationReview',
      group: 'location',
      description: 'Crosswalk against an older public GIS source. A coordinate candidate remains non-consumer evidence until separately accepted and current operating context is verified.',
    }),
    defineField({name: 'nextReviewAt', title: 'Review Again By', type: 'date', group: 'workflow', validation: (Rule) => Rule.required()}),
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
    defineField({name: 'reviewNotes', title: 'Operational and Accessibility Caveats', type: 'text', rows: 5, group: 'workflow', validation: (Rule) => Rule.required().max(1200)}),
    defineField({
      name: 'channels',
      title: 'Approved Delivery Channels',
      type: 'array',
      group: 'workflow',
      description: 'Leave empty until activation-safe consumer rules and editorial approval exist.',
      of: [defineArrayMember({type: 'string'})],
      options: {list: [{title: 'Web', value: 'web'}, {title: 'Mobile', value: 'mobile'}, {title: 'Buddy planning context', value: 'buddy'}]},
      initialValue: [],
    }),
  ],
  preview: {
    select: {title: 'title', destination: 'destination.name', settlement: 'settlement', capacity: 'publishedCapacity', status: 'verificationStatus', locationStatus: 'historicalLocationReview.reconciliationStatus'},
    prepare({title, destination, settlement, capacity, status, locationStatus}) {
      return {title: title || 'Untitled emergency facility', subtitle: [destination, settlement, capacity ? `published cap ${capacity}` : null, status, locationStatus].filter(Boolean).join(' · ')}
    },
  },
  orderings: [
    {title: 'Island and facility', name: 'islandFacility', by: [{field: 'destination.name', direction: 'asc'}, {field: 'title', direction: 'asc'}]},
    {title: 'Official list order', name: 'sourceEntryNumber', by: [{field: 'publishedForYear', direction: 'desc'}, {field: 'sourceEntryNumber', direction: 'asc'}]},
    {title: 'Review date', name: 'reviewDate', by: [{field: 'nextReviewAt', direction: 'asc'}]},
  ],
})
