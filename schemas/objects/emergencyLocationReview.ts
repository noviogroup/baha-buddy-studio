import {defineField, defineType} from 'sanity'

/** Historical facility-location crosswalk. Never represents live shelter readiness. */
export default defineType({
  name: 'emergencyLocationReview',
  title: 'Historical Location Reconciliation',
  type: 'object',
  options: {collapsible: true, collapsed: false},
  fields: [
    defineField({
      name: 'source',
      title: 'Historical Location Source',
      type: 'reference',
      to: [{type: 'researchSource'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sourceDatasetYear',
      title: 'Source Dataset Year',
      type: 'number',
      description: 'This is the year of the historical location dataset, not an inspection or activation year.',
      validation: (Rule) => Rule.required().integer().min(2000).max(2100),
    }),
    defineField({name: 'checkedAt', title: 'Crosswalk Checked', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'reconciliationStatus',
      title: 'Reconciliation Status',
      type: 'string',
      options: {list: [
        {title: 'Exact candidate', value: 'exact_candidate'},
        {title: 'Strong name variant', value: 'strong_name_variant'},
        {title: 'Strong location variant', value: 'strong_location_variant'},
        {title: 'Conflict or ambiguous', value: 'conflict_or_ambiguous'},
        {title: 'Matched, but source has no coordinates', value: 'matched_without_coordinates'},
        {title: 'Unmatched', value: 'unmatched'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'sourceObjectId', title: 'GIS Object ID', type: 'number', validation: (Rule) => Rule.integer().min(1)}),
    defineField({name: 'sourceFacilityName', title: 'GIS Facility Name', type: 'string', validation: (Rule) => Rule.max(220)}),
    defineField({name: 'sourceIsland', title: 'GIS Island Label', type: 'string', validation: (Rule) => Rule.max(120)}),
    defineField({name: 'sourceSettlement', title: 'GIS Settlement', type: 'string', validation: (Rule) => Rule.max(180)}),
    defineField({name: 'sourceStreet', title: 'GIS Street', type: 'string', validation: (Rule) => Rule.max(180)}),
    defineField({
      name: 'candidateLocation',
      title: 'Historical Coordinate Candidate',
      type: 'geopoint',
      description: 'A 2023 candidate only. It is not an approved traveler destination, current shelter entrance, route, inspection result, or activation status.',
      hidden: ({parent}) => !['exact_candidate', 'strong_name_variant', 'strong_location_variant'].includes(parent?.reconciliationStatus),
    }),
    defineField({
      name: 'nameMatchScore',
      title: 'Name Match Score',
      type: 'number',
      readOnly: true,
      validation: (Rule) => Rule.min(0).max(1),
    }),
    defineField({
      name: 'locationMatchScore',
      title: 'Settlement / Street Match Score',
      type: 'number',
      readOnly: true,
      validation: (Rule) => Rule.min(0).max(1),
    }),
    defineField({
      name: 'reviewDecision',
      title: 'Editorial Coordinate Decision',
      type: 'string',
      options: {list: [
        {title: 'Pending review', value: 'pending'},
        {title: 'Accepted as historical location evidence', value: 'accepted'},
        {title: 'Rejected', value: 'rejected'},
        {title: 'Not applicable—no coordinate candidate', value: 'not_applicable'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Crosswalk Notes',
      type: 'text',
      rows: 5,
      description: 'Explain spelling variants, conflicting settlements, duplicate GIS points, or why no candidate was carried forward.',
      validation: (Rule) => Rule.required().max(1200),
    }),
  ],
  preview: {
    select: {status: 'reconciliationStatus', decision: 'reviewDecision', name: 'sourceFacilityName'},
    prepare({status, decision, name}) {
      return {title: name || 'No historical match', subtitle: [status, decision].filter(Boolean).join(' · ')}
    },
  },
})
