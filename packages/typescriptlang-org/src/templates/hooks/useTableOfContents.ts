import { useMemo } from "react"

export type MarkdownHeadingTreeNode = {
  value: string
  depth: number
  children?: MarkdownHeadingTreeNode[]
}

export function useTableOfContents(
  sidebarHeaders: { value?: string | null, depth?: number | null }[] | null | undefined
) {
  return useMemo(() => {
    const tree: MarkdownHeadingTreeNode[] = []
    const stack: { node: MarkdownHeadingTreeNode; depth: number }[] = []

    if (!sidebarHeaders) return tree;

    sidebarHeaders.forEach(header => {
      const value = header?.value;
      const depth = header?.depth;
      
      if (value === undefined || value === null || depth === undefined || depth === null) return;
      
      const newNode: MarkdownHeadingTreeNode = {
        value,
        depth
      }

      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop()
      }

      if (stack.length === 0) {
        tree.push(newNode)
      } else {
        const topNode = stack[stack.length - 1].node;
        if (!topNode.children) {
          topNode.children = [];
        }
        topNode.children.push(newNode);
      }

      stack.push({ node: newNode, depth })
    })

    return tree
  }, [sidebarHeaders])
}
