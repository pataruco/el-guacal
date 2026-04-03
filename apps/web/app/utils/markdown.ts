import { marked } from 'marked';

interface Frontmatter {
  [key: string]: string;
}

interface ParsedMarkdown {
  data: Frontmatter;
  content: string;
}

export function parseFrontmatter(raw: string): ParsedMarkdown {
  const trimmed = raw.trim();

  if (!trimmed.startsWith('---')) {
    return { content: trimmed, data: {} };
  }

  const endIndex = trimmed.indexOf('---', 3);
  if (endIndex === -1) {
    return { content: trimmed, data: {} };
  }

  const frontmatterBlock = trimmed.slice(3, endIndex).trim();
  const content = trimmed.slice(endIndex + 3).trim();

  const data: Frontmatter = {};
  for (const line of frontmatterBlock.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { content, data };
}

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
