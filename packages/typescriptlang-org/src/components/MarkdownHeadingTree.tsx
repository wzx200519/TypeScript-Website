import React, { useMemo } from "react"
import slugger from "github-slugger"
import { HeadingNode } from "../hooks/useTableOfContents"

interface MarkdownHeadingTreeProps {
  tree: HeadingNode[]
  className?: string
}

const HeadingTreeItem: React.FC<{
  heading: HeadingNode
  slug: ReturnType<typeof slugger>
}> = ({ heading, slug }) => {
  const id = slug.slug(heading.value, false)
  return (
    <li key={id}>
      <a href={"#" + id}>{heading.value}</a>
      {heading.children?.length ? (
        <ul>
          {heading.children.map((child) => (
            <HeadingTreeItem key={child.value} heading={child} slug={slug} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export const MarkdownHeadingTree: React.FC<MarkdownHeadingTreeProps> = ({
  tree,
  className,
}) => {
  const slug = useMemo(() => slugger(), [])

  return (
    <ul className={className}>
      {tree.map((heading) => (
        <HeadingTreeItem key={heading.value} heading={heading} slug={slug} />
      ))}
    </ul>
  )
}

interface SimpleHeadingListProps {
  headings: Array<{ value?: string | null; depth?: number | null }>
  maxDepth?: number
}

export const SimpleHeadingList: React.FC<SimpleHeadingListProps> = ({
  headings,
  maxDepth = 3,
}) => {
  const slug = slugger()
  const filteredHeadings = headings.filter(
    (h) => h.depth != null && h.depth <= maxDepth
  )

  return (
    <ul>
      {filteredHeadings.map((heading, index) => {
        const id = slug.slug(heading.value || "", false)
        return (
          <li key={id || index}>
            <a href={"#" + id}>{heading.value}</a>
          </li>
        )
      })}
    </ul>
  )
}