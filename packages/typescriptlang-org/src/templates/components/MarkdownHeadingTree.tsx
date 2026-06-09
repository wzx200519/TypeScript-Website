import React from "react"
import slugger from "github-slugger"
import { MarkdownHeadingTreeNode } from "../utils/markdown"

interface MarkdownHeadingTreeProps {
  tree: MarkdownHeadingTreeNode[]
  slug: typeof slugger
  className?: string
}

export const MarkdownHeadingTree: React.FC<MarkdownHeadingTreeProps> = ({ tree, slug, className }) => {
  return (
    <ul className={className}>
      {tree.map(heading => {
        const id = slug.slug(heading.value, false)
        return (
          <li key={id}>
            <a href={'#' + id}>{heading.value}</a>
            {heading.children?.length ? (
              <MarkdownHeadingTree tree={heading.children} slug={slug} />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}