import { useEffect, useRef, useCallback } from "react"

interface UseTwoslashHighlightOptions {
  containerRef: React.RefObject<HTMLElement | null>
  enabled?: boolean
}

export function useTwoslashHighlight({
  containerRef,
  enabled = true,
}: UseTwoslashHighlightOptions) {
  const observerRef = useRef<MutationObserver | null>(null)

  const setupTwoslashInteractions = useCallback((container: HTMLElement) => {
    const preElements = container.querySelectorAll<HTMLPreElement>("pre.shiki.twoslash")
    preElements.forEach(pre => {
      if (pre.dataset.twoslashSetup) return
      pre.dataset.twoslashSetup = "true"

      const tryButton = pre.querySelector<HTMLAnchorElement>(".code-container > a")
      if (tryButton && !tryButton.getAttribute("aria-label")) {
        tryButton.setAttribute("aria-label", "Try this code in the TypeScript Playground")
      }

      const errorElements = pre.querySelectorAll<HTMLElement>(".error")
      errorElements.forEach(error => {
        const errorCode = error.querySelector(".code")
        if (errorCode) {
          error.setAttribute("role", "alert")
        }
      })

      const lspElements = pre.querySelectorAll<HTMLElement>("data-lsp")
      lspElements.forEach(lsp => {
        lsp.setAttribute("tabindex", "0")
      })
    })
  }, [])

  const initObserver = useCallback(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    setupTwoslashInteractions(container)

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new MutationObserver((mutations: MutationRecord[]) => {
      let shouldSetup = false
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldSetup = true
          break
        }
      }
      if (shouldSetup) {
        setupTwoslashInteractions(container)
      }
    })

    observerRef.current.observe(container, {
      childList: true,
      subtree: true,
    })
  }, [containerRef, enabled, setupTwoslashInteractions])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    setupTwoslashInteractions(container)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [containerRef, enabled, setupTwoslashInteractions])

  return { reScan: () => initObserver() }
}