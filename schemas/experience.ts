import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'experience',
  title: 'Experience',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {hotspot: true},
      fields: [{name: 'alt', title: 'Alt Text', type: 'string'}],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Water Sports', value: 'water_sports'},
          {title: 'Snorkeling & Diving', value: 'snorkeling_diving'},
          {title: 'Boating & Sailing', value: 'boating_sailing'},
          {title: 'Fishing', value: 'fishing'},
          {title: 'Nature & Wildlife', value: 'nature_wildlife'},
          {title: 'Cultural', value: 'cultural'},
          {title: 'Food & Culinary', value: 'food_culinary'},
          {title: 'Nightlife', value: 'nightlife'},
          {title: 'Family', value: 'family'},
          {title: 'Wellness & Spa', value: 'wellness_spa'},
        ],
      },
    }),
    defineField({
      name: 'destination',
      title: 'Destination',
      type: 'reference',
      to: [{type: 'destination'}],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      options: {
        list: [
          {title: 'Free', value: 'free'},
          {title: '$ (Under $50)', value: '$'},
          {title: '$$ ($50-$150)', value: '$$'},
          {title: '$$$ ($150+)', value: '$$$'},
        ],
      },
    }),
    defineField({
      name: 'durationHours',
      title: 'Duration (hours)',
      type: 'number',
    }),
    defineField({
      name: 'bookingUrl',
      title: 'Booking URL',
      type: 'url',
    }),
    defineField({
      name: 'tips',
      title: 'Tips',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'heroImage', subtitle: 'category'},
  },
})
