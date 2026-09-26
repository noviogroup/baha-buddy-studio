import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'contentCollection',
  title: 'Curated Collection',
  type: 'document',
  description: 'Editor-controlled rails and themed groupings such as Romantic Escapes, Family Favorites, or Weekend in Exuma.',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().max(100)}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'text', rows: 3, validation: (Rule) => Rule.max(300)}),
    defineField({name: 'heroImage', title: 'Collection Image', type: 'contentImage'}),
    defineField({
      name: 'items',
      title: 'Curated Items',
      type: 'array',
      of: [
        defineArrayMember({type: 'reference', to: [
          {type: 'destination'},
          {type: 'article'},
          {type: 'experience'},
          {type: 'guidedTour'},
          {type: 'itinerary'},
          {type: 'deal'},
        ]}),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'placement',
      title: 'Placement',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {list: [
        {title: 'Web home', value: 'web_home'},
        {title: 'Web Explore', value: 'web_explore'},
        {title: 'Mobile home', value: 'mobile_home'},
        {title: 'Mobile Explore', value: 'mobile_explore'},
        {title: 'Destination pages', value: 'destination'},
      ]},
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'audience', title: 'Audience or Theme', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}}),
    defineField({name: 'activeFrom', title: 'Active From', type: 'datetime'}),
    defineField({name: 'activeUntil', title: 'Active Until', type: 'datetime'}),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
    defineField({name: 'order', title: 'Display Order', type: 'number', initialValue: 99}),
    defineField({name: 'action', title: 'Collection Action', type: 'callToAction'}),
    defineField({name: 'seo', title: 'Search & Sharing', type: 'seo'}),
  ],
  preview: {select: {title: 'title', media: 'heroImage', placement: 'placement'}, prepare({title, media, placement}) { return {title, subtitle: Array.isArray(placement) ? placement.join(' · ') : 'No placement', media} }},
  orderings: [{title: 'Manual order', name: 'manualOrder', by: [{field: 'featured', direction: 'desc'}, {field: 'order', direction: 'asc'}]}],
})
