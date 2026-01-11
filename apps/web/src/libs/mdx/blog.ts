import fs from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

// Blog post frontmatter schema
export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  featured?: boolean;
  author?: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

// Path to blog content directory
const BLOG_CONTENT_PATH = path.join(process.cwd(), 'content', 'blog');

/**
 * Get all blog posts with metadata (sorted by date, newest first)
 */
export async function getAllPosts(): Promise<BlogPostMeta[]> {
  // Ensure content directory exists
  if (!fs.existsSync(BLOG_CONTENT_PATH)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_CONTENT_PATH).filter(file => file.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const slug = filename.replace('.mdx', '');
    const filePath = path.join(BLOG_CONTENT_PATH, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      category: data.category || 'Uncategorized',
      date: data.date || new Date().toISOString().split('T')[0],
      readTime: data.readTime || '5 min read',
      featured: data.featured || false,
      author: data.author || 'medartus',
    } as BlogPostMeta;
  });

  // Sort by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_CONTENT_PATH, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title || slug,
    excerpt: data.excerpt || '',
    category: data.category || 'Uncategorized',
    date: data.date || new Date().toISOString().split('T')[0],
    readTime: data.readTime || '5 min read',
    featured: data.featured || false,
    author: data.author || 'medartus',
    content,
  };
}

/**
 * Get the featured blog post (or the most recent one)
 */
export async function getFeaturedPost(): Promise<BlogPostMeta | null> {
  const posts = await getAllPosts();

  // Find featured post, or return the most recent one
  const featured = posts.find(post => post.featured);
  return featured || posts[0] || null;
}

/**
 * Get all post slugs for static generation
 */
export async function getAllPostSlugs(): Promise<string[]> {
  if (!fs.existsSync(BLOG_CONTENT_PATH)) {
    return [];
  }

  return fs
    .readdirSync(BLOG_CONTENT_PATH)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace('.mdx', ''));
}
