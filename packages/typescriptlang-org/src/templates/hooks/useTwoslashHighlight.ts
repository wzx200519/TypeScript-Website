import { RefObject, useEffect, useMemo } from "react"
import { enhanceRenderedMarkdown, getRenderedMarkdownMetadata } from "../utils/documentationPage"

export const useTwoslashHighlight = (
  containerRef: RefObject<HTMLElement | null>,
  markdownHtml: string
) => {
  const metadata = useMemo(() => getRenderedMarkdownMetadata(markdownHtml), [markdownHtml])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    enhanceRenderedMarkdown(container)
  }, [containerRef, markdownHtml])

  return {
    ...metadata,
    markdownHtml,
  }
}
