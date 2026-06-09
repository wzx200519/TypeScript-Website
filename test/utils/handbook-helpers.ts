import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

export interface HandbookHeading {
  title: string;
  level: string;
  file: string;
}

const HANDBOOK_ROOT = join(
  __dirname,
  '..',
  '..',
  'packages',
  'documentation',
  'copy',
  'en',
  'handbook-v2'
);

const HEADING_REGEX = /^(#{1,6})\s+(.+?)\s*$/gm;

function collectMarkdownFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      collectMarkdownFiles(full, acc);
    } else if (entry.endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

function parseHeadingsInFile(filePath: string): HandbookHeading[] {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = relative(process.cwd(), filePath);
  const results: HandbookHeading[] = [];
  let match: RegExpExecArray | null;

  while ((match = HEADING_REGEX.exec(content)) !== null) {
    const hashes = match[1];
    const title = match[2].trim();
    results.push({
      title,
      level: `h${hashes.length}`,
      file: relativePath,
    });
  }

  return results;
}

export function getHandbookHeadings(): HandbookHeading[] {
  const files = collectMarkdownFiles(HANDBOOK_ROOT);
  const headings: HandbookHeading[] = [];
  for (const file of files) {
    headings.push(...parseHeadingsInFile(file));
  }
  return headings;
}
