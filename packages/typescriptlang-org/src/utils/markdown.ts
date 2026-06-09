import type { MarkdownHeadingTreeNode } from "../hooks/useTableOfContents"
import slugger from "github-slugger"

type Slugger = ReturnType<typeof slugger>

export type DocumentFrontmatter = {
  permalink?: string | null
  title?: string | null
  oneline?: string | null
  preamble?: string | null
  deprecated_by?: string | null
  deprecation_redirects?: (string | null)[] | null
  disable_toc?: boolean | null
  experimental?: boolean | null
  handbook?: boolean | null
}

export type ParsedFrontmatter = {
  title: string
  oneline: string
  preamble: string
  disableToc: boolean
  experimental: boolean
  isHandbook: boolean
  deprecationURL: string | null
  prefix: "Handbook" | "Documentation"
}

export function parseFrontmatter(fm: DocumentFrontmatter | null | undefined): ParsedFrontmatter {
  if (!fm) {
    return {
      title: "",
      oneline: "",
      preamble: "",
      disableToc: false,
      experimental: false,
      isHandbook: false,
      deprecationURL: null,
      prefix: "Documentation",
    }
  }

  const isHandbook = Boolean(fm.handbook)
  return {
    title: String(fm.title || ""),
    oneline: String(fm.oneline || ""),
    preamble: String(fm.preamble || ""),
    disableToc: Boolean(fm.disable_toc),
    experimental: Boolean(fm.experimental),
    isHandbook,
    deprecationURL: fm.deprecated_by ? String(fm.deprecated_by) : null,
    prefix: isHandbook ? "Handbook" : "Documentation",
  }
}

export function resolveDeprecationRedirect(
  redirects: (string | null)[] | null | undefined,
  hash: string
): string | null {
  if (!redirects || redirects.length === 0) return null
  const clean = hash.startsWith("#") ? hash.slice(1) : hash
  const index = redirects.indexOf(clean)
  if (index === -1) return null
  const next = redirects[index + 1]
  return next ? String(next) : null
}

export function MarkdownHeadingTree(props: {
  tree: MarkdownHeadingTreeNode[]
  slug: Slugger
  className?: string
}) {
  return (
    <ul className={props.className}>
      {props.tree.map((heading) => {
        const id = props.slug.slug(heading.value, false)
        return (
          <li key={id}>
            <a href={"#" + id}>{heading.value}</a>
            {heading.children?.length ? (
              <MarkdownHeadingTree tree={heading.children} slug={props.slug} />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
