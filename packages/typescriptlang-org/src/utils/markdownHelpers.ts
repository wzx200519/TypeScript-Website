import { HeadingNode } from "../hooks/useTableOfContents"

export function renderMarkdownContent(html: string | null): { __html: string } {
  if (!html) {
    return { __html: "" }
  }
  return { __html: html }
}

export function extractFrontmatter<T extends Record<string, any>>(
  frontmatter: any
): T {
  if (!frontmatter) {
    throw new Error("No front-matter found")
  }
  return frontmatter as T
}

export function processPreamble(preamble: string | null | undefined): {
  __html: string
} | null {
  if (!preamble) {
    return null
  }
  return { __html: preamble }
}

export function getDocumentPrefix(isHandbook: boolean): string {
  return isHandbook ? "Handbook" : "Documentation"
}

export function shouldShowTableOfContents(
  disableToc: boolean | null | undefined
): boolean {
  return disableToc !== true
}

export function isExperimentalDocument(
  experimental: boolean | null | undefined
): boolean {
  return !!experimental
}

export function buildCanonicalURL(
  deprecatedBy: string | null | undefined
): string | null {
  if (!deprecatedBy) {
    return null
  }
  return `https://www.typescriptlang.org${deprecatedBy}`
}