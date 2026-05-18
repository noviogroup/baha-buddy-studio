import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Used internally to identify this settings document',
      initialValue: 'Baha Buddy Site Settings',
    }),
    defineField({
      name: 'featuredArticle',
      title: 'Featured Article',
      type: 'reference',
      to: [{type: 'article'}],
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      description: 'Main headline on the marketing homepage',
    }),
    defineField({
      name: 'heroSubheadline',
      title: 'Hero Subheadline',
      type: 'string',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'featuredDestinations',
      title: 'Featured Destinations',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'destination'}]}],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'featuredExperiences',
      title: 'Featured Experiences',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'experience'}]}],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'announcementBar',
      title: 'Announcement Bar',
      type: 'object',
      fields: [
        {name: 'enabled', title: 'Enabled', type: 'boolean', initialValue: false},
        {name: 'text', title: 'Text', type: 'string'},
        {name: 'url', title: 'Link URL', type: 'url'},
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        {name: 'instagram', title: 'Instagram URL', type: 'url'},
        {name: 'facebook', title: 'Facebook URL', type: 'url'},
        {name: 'tiktok', title: 'TikTok URL', type: 'url'},
        {name: 'twitter', title: 'X / Twitter URL', type: 'url'},
      ],
    }),
    defineField({
      name: 'appStoreUrl',
      title: 'App Store URL',
      type: 'url',
    }),
    defineField({
      name: 'googlePlayUrl',
      title: 'Google Play URL',
      type: 'url',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
