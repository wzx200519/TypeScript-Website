import { useState, useEffect } from "react"

export interface DeprecationInfo {
  deprecatedBy: string | null
  deprecationRedirects: readonly string[]
  shouldRedirect: boolean
  redirectURL: string | null
}

export function useDeprecation(
  deprecatedBy: string | null | undefined,
  deprecationRedirects: readonly string[] | null | undefined
): DeprecationInfo {
  const [redirectURL, setRedirectURL] = useState<string | null>(
    deprecatedBy || null
  )

  useEffect(() => {
    if (document.location.hash) {
      const redirects = deprecationRedirects || []
      const indexOfHash = redirects.indexOf(document.location.hash.slice(1))
      if (indexOfHash !== -1) {
        setRedirectURL(redirects[indexOfHash + 1])
      }
    }
  }, [deprecationRedirects])

  return {
    deprecatedBy: deprecatedBy || null,
    deprecationRedirects: deprecationRedirects || [],
    shouldRedirect: !!redirectURL,
    redirectURL,
  }
}