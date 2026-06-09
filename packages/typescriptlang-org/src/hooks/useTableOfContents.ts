import { useMemo } from "react"
import slugger from "github-slugger"

export type MarkdownHeading = {
  value?: string | null
  depth?: number | null
}

export type MarkdownHeadingTreeNode = {
  value: string
  depth: number
  id: string
  children?: MarkdownHeadingTreeNode[]
}

export type TableOfContentsOptions = {
  maxDepth?: number
  disabled?: boolean
}

export type TableOfContentsResult = {
  showSidebar: boolean
  tree: MarkdownHeadingTreeNode[]
  slug: ReturnType<typeof slugger>
}

function headerListToTree(
  sidebarHeaders: MarkdownHeading[],
  slug: ReturnType<typeof slugger>
): MarkdownHeadingTreeNode[] {
  const tree: MarkdownHeadingTreeNode[] = []
  const stack: { node: MarkdownHeadingTreeNode; depth: number }[] = []

  sidebarHeaders.forEach((header) => {
    const value = header?.value!
    const depth = header?.depth!
    const id = slug.slug(value, false)
    const newNode: MarkdownHeadingTreeNode = { value, depth, id }

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      tree.push(newNode)
    } else {
      const topNode = stack[stack.length - 1].node
      if (!topNode.children) {
        topNode.children = []
      }
      topNode.children.push(newNode)
    }

    stack.push({ node: newNode, depth })
  })

  return tree
}

export function useTableOfContents(
  headings: MarkdownHeading[] | undefined | null,
  options: TableOfContentsOptions = {}
): TableOfContentsResult {
  const { maxDepth = 3, disabled = false } = options

  const filteredHeaders = useMemo(
    () => (headings || []).filter((h) => (h?.depth || 0) <= maxDepth) as MarkdownHeading[],
    [headings, maxDepth]
  )

  const { tree, slug } = useMemo(() => {
    const slug = slugger()
    const tree = headerListToTree(filteredHeaders, slug)
    return { tree, slug }
  }, [filteredHeaders])

  return {
    showSidebar: !disabled,
    tree,
    slug,
  }
}
