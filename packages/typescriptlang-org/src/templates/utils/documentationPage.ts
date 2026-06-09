declare const require: (id: string) => any

const createSlugger = require("github-slugger")

export type DocumentationPost = NonNullable<GatsbyTypes.GetDocumentBySlugQuery["markdownRemark"]>
export type DocumentationFrontmatter = NonNullable<DocumentationPost["frontmatter"]>
export type DocumentationRenderablePost = DocumentationPost & {
  frontmatter: DocumentationFrontmatter
  html: string
}
export type DocumentationHeading = GatsbyTypes.Maybe<Pick<GatsbyTypes.MarkdownHeading, "value" | "depth">>

export type DocumentationPageContext = {
  id: string | undefined
  nextID: string
  previousID: string
  repoPath: string
  slug: string
  lang: string
  modifiedTime: string
}

export type TableOfContentsItem = {
  id: string
  value: string
  depth: number
  children: TableOfContentsItem[]
}

const maxTableOfContentsDepth = 3

export const filterTableOfContentsHeadings = (headings: readonly DocumentationHeading[] = []) => {
  return headings.filter(
    (heading): heading is { value: string; depth: number } =>
      Boolean(heading?.value) && typeof heading?.depth === "number" && heading.depth <= maxTableOfContentsDepth
  )
}

export const createTableOfContents = (headings: readonly DocumentationHeading[] = []) => {
  const tableOfContents: TableOfContentsItem[] = []
  const stack: TableOfContentsItem[] = []
  const slug = createSlugger()

  filterTableOfContentsHeadings(headings).forEach(heading => {
    const node: TableOfContentsItem = {
      id: slug.slug(heading.value, false),
      value: heading.value,
      depth: heading.depth,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      tableOfContents.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  })

  return tableOfContents
}

export const getDocumentationPrefix = (handbook: DocumentationFrontmatter["handbook"]) => {
  return handbook ? "Handbook" : "Documentation"
}

export const resolveDeprecationUrl = (
  frontmatter: DocumentationFrontmatter,
  hash: string | undefined = undefined
) => {
  const fallbackUrl = frontmatter.deprecated_by ?? undefined
  if (!hash) {
    return fallbackUrl
  }

  const requestedSection = hash.replace(/^#/, "")
  if (!requestedSection) {
    return fallbackUrl
  }

  const redirects = (frontmatter.deprecation_redirects ?? []).filter(
    (entry): entry is string => Boolean(entry)
  )

  const matchedRedirectIndex = redirects.indexOf(requestedSection)
  if (matchedRedirectIndex === -1) {
    return fallbackUrl
  }

  return redirects[matchedRedirectIndex + 1] ?? fallbackUrl
}

export const getRenderedMarkdownMetadata = (markdownHtml: string) => {
  return {
    hasTwoslash: /class=["'][^"']*\btwoslash\b/.test(markdownHtml),
    hasResponsiveImages: /gatsby-resp-image|<img[\s>]/.test(markdownHtml),
  }
}

export const enhanceRenderedMarkdown = (container: HTMLElement) => {
  container.querySelectorAll<HTMLElement>("pre.twoslash").forEach(block => {
    block.dataset.twoslash = "true"
  })

  container
    .querySelectorAll<HTMLElement>(".gatsby-resp-image-wrapper, .gatsby-resp-image-link")
    .forEach(wrapper => {
      wrapper.dataset.responsiveImage = "true"
    })

  container.querySelectorAll<HTMLImageElement>("img").forEach(image => {
    image.dataset.responsiveImage = "true"
  })
}
