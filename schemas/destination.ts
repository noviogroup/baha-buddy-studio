import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'destination',
  title: 'Destination',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'islandId',
      title: 'Island ID',
      description: 'Matches the island slug in the Supabase islands table',
      type: 'string',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alt Text', type: 'string'}),
      ],
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: 'overview',
      title: 'Overview',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'label', title: 'Label', type: 'string'},
            {name: 'icon', title: 'Icon', type: 'string'},
          ],
        },
      ],
    }),
    defineField({
      name: 'bestTimeToVisit',
      title: 'Best Time to Visit',
      type: 'string',
    }),
    defineField({
      name: 'gettingThere',
      title: 'Getting There',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', title: 'Alt Text', type: 'string'}],
        },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Sort Order',
      type: 'number',
      initialValue: 99,
    }),
  ],
  preview: {
    select: {title: 'name', media: 'heroImage', subtitle: 'tagline'},
  },
})
