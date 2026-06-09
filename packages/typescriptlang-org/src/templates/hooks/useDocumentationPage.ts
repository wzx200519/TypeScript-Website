import { useEffect, useMemo, useState } from "react"
import { setupLikeDislikeButtons } from "../scripts/setupLikeDislikeButtons"
import {
  overrideSubNavLinksWithSmoothScroll,
  updateSidebarOnScroll,
} from "../scripts/setupSubNavigationSidebar"
import {
  DocumentationPageContext,
  DocumentationRenderablePost,
  getDocumentationPrefix,
  resolveDeprecationUrl,
} from "../utils/documentationPage"

export const useDocumentationPage = (
  post: DocumentationRenderablePost,
  pageContext: DocumentationPageContext,
  i: (...args: any[]) => string
) => {
  const [deprecationURL, setDeprecationURL] = useState(() => resolveDeprecationUrl(post.frontmatter))

  useEffect(() => {
    setDeprecationURL(resolveDeprecationUrl(post.frontmatter, document.location.hash))

    const removeSmoothScrollHandlers = overrideSubNavLinksWithSmoothScroll()
    const scrollListenerOptions = { passive: true, capture: true } as const
    window.addEventListener("scroll", updateSidebarOnScroll, scrollListenerOptions)
    updateSidebarOnScroll()

    const removeLikeDislikeHandlers = setupLikeDislikeButtons(pageContext.slug, i)

    return () => {
      removeSmoothScrollHandlers()
      removeLikeDislikeHandlers()
      window.removeEventListener("scroll", updateSidebarOnScroll, true)
    }
  }, [i, pageContext.slug, post.frontmatter])

  return useMemo(
    () => ({
      deprecationURL,
      description: post.frontmatter.oneline || "",
      prefix: getDocumentationPrefix(post.frontmatter.handbook),
      selectedID: pageContext.id || "NO-ID",
      showExperimental: Boolean(post.frontmatter.experimental),
      title: post.frontmatter.title || "",
    }),
    [deprecationURL, pageContext.id, post.frontmatter]
  )
}
