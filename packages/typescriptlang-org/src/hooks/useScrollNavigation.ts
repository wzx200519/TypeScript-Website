import { useEffect, useCallback, useRef } from "react"

export interface ScrollNavigationOptions {
  offset?: number
  passive?: boolean
}

export function useScrollNavigation(options: ScrollNavigationOptions = {}) {
  const { offset = 100, passive = true } = options
  const currentAnchorRef = useRef<HTMLAnchorElement | null>(null)

  const updateActiveLink = useCallback(() => {
    const subnavLinks = document.querySelectorAll<HTMLAnchorElement>(
      "#handbook-content nav ul li a"
    )

    const fromTop = window.scrollY
    let currentPossibleAnchor: HTMLAnchorElement | undefined

    subnavLinks.forEach((link) => {
      try {
        const section = document.querySelector<HTMLDivElement>(
          decodeURIComponent(link.hash)
        )
        if (!section) {
          return
        }
        const isBelow = section.offsetTop - offset <= fromTop
        if (isBelow) currentPossibleAnchor = link
      } catch (error) {
        return
      }
    })

    subnavLinks.forEach((link) => {
      if (link === currentPossibleAnchor) {
        link.classList.add("current")
      } else {
        link.classList.remove("current")
      }
    })

    currentAnchorRef.current = currentPossibleAnchor || null
  }, [offset])

  const setupSmoothScroll = useCallback(() => {
    const subnavLinks = document.querySelectorAll<HTMLAnchorElement>(
      "#handbook-content nav ul li a"
    )

    const handlers: Array<{ link: HTMLAnchorElement; handler: EventListener }> = []

    subnavLinks.forEach((link) => {
      const handler = (event: Event) => {
        event.preventDefault()

        const hash = (event.target as HTMLAnchorElement).hash
        const id = decodeURIComponent(hash).slice(1)
        const target = document.querySelector(`[id="${id}"]`)

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" })
          document.location.hash = hash
        }
      }

      link.addEventListener("click", handler)
      handlers.push({ link, handler })
    })

    return () => {
      handlers.forEach(({ link, handler }) => {
        link.removeEventListener("click", handler)
      })
    }
  }, [])

  useEffect(() => {
    const cleanup = setupSmoothScroll()

    window.addEventListener("scroll", updateActiveLink, {
      passive,
      capture: true,
    })
    updateActiveLink()

    return () => {
      cleanup()
      window.removeEventListener("scroll", updateActiveLink, true)
    }
  }, [setupSmoothScroll, updateActiveLink, passive])

  return {
    currentAnchor: currentAnchorRef.current,
    updateActiveLink,
    setupSmoothScroll,
  }
}