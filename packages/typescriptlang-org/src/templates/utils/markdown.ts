import slugger from "github-slugger"

export type MarkdownHeadingTreeNode = {
  value: string
  depth: number
  children?: MarkdownHeadingTreeNode[]
}

export function buildHeadingTree(
  sidebarHeaders: readonly GatsbyTypes.Maybe<Pick<GatsbyTypes.MarkdownHeading, "value" | "depth">>[]
): MarkdownHeadingTreeNode[] {
  const tree: MarkdownHeadingTreeNode[] = []
  const stack: { node: MarkdownHeadingTreeNode; depth: number }[] = []

  sidebarHeaders.forEach(header => {
    const value = header?.value!
    const depth = header?.depth!
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