import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * `placeholder: true` marks sample entries that exist only to shape the design
 * until the real content is migrated from the current site. They render with a
 * visible "Sample" tag and must be deleted before launch.
 */
const messages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/messages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      series: z.string().optional(),
      summary: z.string(),
      image: image(),
      youtubeId: z.string().optional(),
      featured: z.boolean().default(false),
      placeholder: z.boolean().default(false),
    }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      authors: z.string().default('Emmanuel & Ruth Makandiwa'),
      cover: image(),
      order: z.number().default(0),
      links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
      placeholder: z.boolean().default(false),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      start: z.coerce.date(),
      end: z.coerce.date().optional(),
      location: z.string(),
      summary: z.string(),
      image: image().optional(),
      link: z.url().optional(),
      placeholder: z.boolean().default(false),
    }),
});

export const collections = { messages, books, events };
