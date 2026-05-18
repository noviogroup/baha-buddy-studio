import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'deal',
  title: 'Deal',
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
          {title: 'Hotel', value: 'hotel'},
          {title: 'Resort', value: 'resort'},
          {title: 'Package', value: 'package'},
          {title: 'Activity', value: 'activity'},
          {title: 'Dining', value: 'dining'},
          {title: 'Transport', value: 'transport'},
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
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'discountPercent',
      title: 'Discount %',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price (USD)',
      type: 'number',
    }),
    defineField({
      name: 'dealPrice',
      title: 'Deal Price (USD)',
      type: 'number',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Button Label',
      type: 'string',
      initialValue: 'Book Now',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'CTA URL',
      type: 'url',
    }),
    defineField({
      name: 'validFrom',
      title: 'Valid From',
      type: 'datetime',
    }),
    defineField({
      name: 'validUntil',
      title: 'Valid Until',
      type: 'datetime',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'title', media: 'heroImage', subtitle: 'category'},
  },
})
