import fs from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

// Documentation frontmatter schema
export type DocMeta = {
  slug: string;
  title: string;
  description: string;
  order: number;
  section: string;
};

export type Doc = DocMeta & {
  content: string;
};

export type DocSection = {
  title: string;
  docs: DocMeta[];
};

export type DocsNavigation = {
  sections: DocSection[];
  flatDocs: DocMeta[];
};

// Path to docs content directory
const DOCS_CONTENT_PATH = path.join(process.cwd(), 'content', 'docs');

/**
 * Recursively get all MDX files from a directory
 */
function getMdxFiles(dir: string, basePath: string = ''): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      files.push(...getMdxFiles(fullPath, relativePath));
    } else if (entry.name.endsWith('.mdx')) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Get all documentation pages with metadata
 */
export async function getAllDocs(): Promise<DocMeta[]> {
  const files = getMdxFiles(DOCS_CONTENT_PATH);

  const docs = files.map((relativePath) => {
    const slug = relativePath.replace('.mdx', '').replace(/\\/g, '/');
    const filePath = path.join(DOCS_CONTENT_PATH, relativePath);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title || slug.split('/').pop() || slug,
      description: data.description || '',
      order: data.order ?? 999,
      section: data.section || 'General',
    } as DocMeta;
  });

  // Sort by order
  return docs.sort((a, b) => a.order - b.order);
}

/**
 * Get a single documentation page by slug
 */
export async function getDocBySlug(slug: string): Promise<Doc | null> {
  // Handle both flat and nested slugs
  const filePath = path.join(DOCS_CONTENT_PATH, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: data.title || slug.split('/').pop() || slug,
    description: data.description || '',
    order: data.order ?? 999,
    section: data.section || 'General',
    content,
  };
}

/**
 * Get docs organized by section for sidebar navigation
 */
export async function getDocsSidebar(): Promise<DocsNavigation> {
  const docs = await getAllDocs();

  // Group docs by section
  const sectionMap = new Map<string, DocMeta[]>();

  for (const doc of docs) {
    const existing = sectionMap.get(doc.section) || [];
    existing.push(doc);
    sectionMap.set(doc.section, existing);
  }

  // Convert to array of sections, sorted by the minimum order in each section
  const sections: DocSection[] = Array.from(sectionMap.entries())
    .map(([title, sectionDocs]) => ({
      title,
      docs: sectionDocs.sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => {
      const aMin = Math.min(...a.docs.map(d => d.order));
      const bMin = Math.min(...b.docs.map(d => d.order));
      return aMin - bMin;
    });

  return {
    sections,
    flatDocs: docs,
  };
}

/**
 * Get previous and next docs for navigation
 */
export async function getDocNavigation(
  currentSlug: string,
): Promise<{ prev: DocMeta | null; next: DocMeta | null }> {
  const docs = await getAllDocs();
  const currentIndex = docs.findIndex(doc => doc.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? docs[currentIndex - 1] ?? null : null,
    next: currentIndex < docs.length - 1 ? docs[currentIndex + 1] ?? null : null,
  };
}

/**
 * Get all doc slugs for static generation
 */
export async function getAllDocSlugs(): Promise<string[]> {
  const files = getMdxFiles(DOCS_CONTENT_PATH);
  return files.map(file => file.replace('.mdx', '').replace(/\\/g, '/'));
}
