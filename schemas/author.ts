import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Public Name', type: 'string', validation: (Rule) => Rule.required().max(80)}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'role', title: 'Role or Byline', type: 'string', validation: (Rule) => Rule.max(100)}),
    defineField({name: 'bio', title: 'Bio', type: 'text', rows: 5, validation: (Rule) => Rule.max(800)}),
    defineField({name: 'photo', title: 'Photo', type: 'contentImage'}),
    defineField({
      name: 'expertise',
      title: 'Expertise',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'socialLinks',
      title: 'Public Profile Links',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'profileLink',
          title: 'Profile Link',
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({name: 'url', title: 'URL', type: 'url', validation: (Rule) => Rule.required().uri({scheme: ['https']})}),
          ],
          preview: {select: {title: 'label', subtitle: 'url'}},
        }),
      ],
    }),
    defineField({name: 'active', title: 'Active', type: 'boolean', initialValue: true}),
  ],
  preview: {select: {title: 'name', subtitle: 'role', media: 'photo'}},
})
