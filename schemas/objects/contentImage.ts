import {defineField, defineType} from 'sanity'

/**
 * Shared editorial image with the accessibility and rights metadata required
 * for publishing across web and mobile.
 */
export default defineType({
  name: 'contentImage',
  title: 'Content Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'externalUrl',
      title: 'Imported or External Image URL',
      type: 'string',
      description: 'Used by migrated records until an editor uploads a managed Sanity image. May be an https:// URL or a Baha Buddy /assets path.',
      validation: (Rule) => Rule.custom((value) => !value || value.startsWith('https://') || value.startsWith('http://') || value.startsWith('/') ? true : 'Use an http(s) URL or a root-relative /assets path.'),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      description: 'Describe the image for travelers who cannot see it. Leave blank only when decorative.',
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: 'credit',
      title: 'Photo Credit',
      type: 'string',
      description: 'Photographer, creator, tourism board, hotel, or other rights holder.',
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      description: 'Optional source or licensing URL for the editorial record.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'subjectIdentity',
      title: 'Subject / Place Identity',
      type: 'string',
      description: 'The verified island, place, activity, landmark, person, or community shown.',
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: 'rightsStatus',
      title: 'Rights Review Status',
      type: 'string',
      options: {list: [
        {title: 'Pending evidence', value: 'pending'},
        {title: 'Approved partnership asset', value: 'approved_partner'},
        {title: 'Approved licensed asset', value: 'approved_licensed'},
        {title: 'Restricted — do not publish', value: 'restricted'},
        {title: 'Expired — do not publish', value: 'expired'},
      ]},
      initialValue: 'pending',
    }),
    defineField({
      name: 'licenseName',
      title: 'License / Permission Name',
      type: 'string',
      description: 'Exact agreement, written permission, stock license, or partnership authorization governing this asset.',
      validation: (Rule) => Rule.max(180),
    }),
    defineField({
      name: 'rightsEvidence',
      title: 'Rights Evidence',
      type: 'reference',
      to: [{type: 'researchSource'}],
      description: 'Internal source record containing the agreement or permission evidence.',
    }),
    defineField({
      name: 'permittedChannels',
      title: 'Permitted Product Channels',
      type: 'array',
      of: [{type: 'string'}],
      options: {list: [
        {title: 'Web', value: 'web'},
        {title: 'Mobile', value: 'mobile'},
        {title: 'Buddy cards', value: 'buddy'},
        {title: 'Sharing surfaces', value: 'sharing'},
        {title: 'App stores', value: 'app_store'},
      ], layout: 'grid'},
    }),
    defineField({name: 'usageTermStart', title: 'Usage Term Starts', type: 'date'}),
    defineField({name: 'usageTermEnd', title: 'Usage Term Ends', type: 'date'}),
    defineField({
      name: 'cropRules',
      title: 'Crop / Adaptation Rules',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(600),
    }),
    defineField({
      name: 'usageRestrictions',
      title: 'Usage Restrictions',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(800),
    }),
    defineField({
      name: 'checksumSha256',
      title: 'Original SHA-256',
      type: 'string',
      description: 'Used to reject duplicate source assets before upload.',
      validation: (Rule) => Rule.regex(/^[a-f0-9]{64}$/).warning('Use a lowercase 64-character SHA-256 digest.'),
    }),
    defineField({
      name: 'altTextReviewedAt',
      title: 'Alt Text Reviewed At',
      type: 'datetime',
    }),
  ],
})
