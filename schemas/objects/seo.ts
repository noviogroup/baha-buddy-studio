import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'seo',
  title: 'Search & Sharing',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Aim for 50–60 characters. Product code may add the Baha Buddy suffix.',
      validation: (Rule) => Rule.max(70).warning('Search engines commonly truncate titles over 60 characters.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Aim for 140–160 characters and make the traveler benefit clear.',
      validation: (Rule) => Rule.max(180).warning('Search engines commonly truncate descriptions over 160 characters.'),
    }),
    defineField({
      name: 'socialImage',
      title: 'Social Sharing Image',
      type: 'contentImage',
      description: 'Optional 1.91:1 image. The hero image is used when this is blank.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL Override',
      type: 'url',
      description: 'Leave blank unless this content is canonically published elsewhere.',
      validation: (Rule) => Rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from Search Engines',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
