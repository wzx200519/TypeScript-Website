import { useState, useEffect } from "react"

type Frontmatter = {
  title?: string | null
  disable_toc?: boolean | null
  handbook?: boolean | null
  oneline?: string | null
  preamble?: string | null
  deprecated_by?: string | null
  deprecation_redirects?: (string | null)[] | null
  experimental?: boolean | null
}

export function useHandbookFrontmatter(frontmatter: Frontmatter | null | undefined) {
  const [deprecationURL, setDeprecationURL] = useState(frontmatter?.deprecated_by)

  useEffect(() => {
    if (typeof document !== "undefined" && document.location.hash) {
      const redirects = frontmatter?.deprecation_redirects || []
      const hash = document.location.hash.slice(1)
      const indexOfHash = redirects.indexOf(hash)
      if (indexOfHash !== -1) {
        const redirectUrl = redirects[indexOfHash + 1]
        if (redirectUrl) {
          setDeprecationURL(redirectUrl)
        }
      }
    }
  }, [frontmatter])

  return {
    deprecationURL,
    showSidebar: !frontmatter?.disable_toc,
    showExperimental: !!frontmatter?.experimental,
    isHandbook: !!frontmatter?.handbook,
    title: frontmatter?.title,
    preamble: frontmatter?.preamble,
    oneline: frontmatter?.oneline || ""
  }
}
