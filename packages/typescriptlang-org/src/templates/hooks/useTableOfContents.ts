import { useMemo } from "react"
import slugger from "github-slugger"
import { buildHeadingTree, MarkdownHeadingTreeNode } from "../utils/markdown"

type HeadingItem = GatsbyTypes.Maybe<Pick<GatsbyTypes.MarkdownHeading, "value" | "depth">>

interface UseTableOfContentsOptions {
  headings: readonly HeadingItem[] | null | undefined
  maxDepth?: number
  disableToc?: boolean
}

interface UseTableOfContentsResult {
  headingTree: MarkdownHeadingTreeNode[]
  isVisible: boolean
  slug: typeof slugger
}

export function useTableOfContents({
  headings,
  maxDepth = 3,
  disableToc = false,
}: UseTableOfContentsOptions): UseTableOfContentsResult {
  const slug = useMemo(() => slugger(), [])

  const headingTree = useMemo(() => {
    if (!headings) return []
    const filtered = headings.filter(h => (h?.depth || 0) <= maxDepth)
    return buildHeadingTree(filtered)
  }, [headings, maxDepth])

  const isVisible = headingTree.length > 0 && !disableToc

  return { headingTree, isVisible, slug }
}