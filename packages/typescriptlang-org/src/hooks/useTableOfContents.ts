import { useMemo } from "react"
import slugger from "github-slugger"

export type HeadingNode = {
  value: string
  depth: number
  children?: HeadingNode[]
}

export type TableOfContentsItem = {
  id: string
  value: string
  depth: number
  children?: TableOfContentsItem[]
}

export function useTableOfContents(
  headings: readonly ({ readonly value?: string | null; readonly depth?: number | null } | null)[] | null | undefined
) {
  return useMemo(() => {
    if (!headings || headings.length === 0) {
      return []
    }

    const filteredHeadings = headings.filter(
      (h): h is { value: string; depth: number } =>
        h != null && h.value != null && h.depth != null && h.depth <= 3
    )

    return buildHeadingTree(filteredHeadings)
  }, [headings])
}

export function buildHeadingTree(
  headings: Array<{ value: string; depth: number }>
): HeadingNode[] {
  const tree: HeadingNode[] = []
  const stack: { node: HeadingNode; depth: number }[] = []

  headings.forEach((heading) => {
    const newNode: HeadingNode = {
      value: heading.value,
      depth: heading.depth,
    }

    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
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

    stack.push({ node: newNode, depth: heading.depth })
  })

  return tree
}

export function useHeadingSlug() {
  return useMemo(() => {
    const slug = slugger()
    return (value: string) => slug.slug(value, false)
  }, [])
}

export function flattenHeadingTree(tree: HeadingNode[]): TableOfContentsItem[] {
  const result: TableOfContentsItem[] = []
  const slug = slugger()

  const traverse = (nodes: HeadingNode[]) => {
    nodes.forEach((node) => {
      const item: TableOfContentsItem = {
        id: slug.slug(node.value, false),
        value: node.value,
        depth: node.depth,
      }
      if (node.children && node.children.length > 0) {
        item.children = flattenHeadingTree(node.children)
      }
      result.push(item)
    })
  }

  traverse(tree)
  return result
}