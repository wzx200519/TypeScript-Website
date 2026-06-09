import { useEffect, useRef, useState } from "react"

export type TwoslashHighlightOptions = {
  enabled?: boolean
  containerSelector?: string
  onReady?: () => void
}

export type TwoslashHighlightResult = {
  ready: boolean
  blocks: number
  containerRef: React.RefObject<HTMLElement>
}

function findTwoslashBlocks(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(
    container.querySelectorAll<HTMLElement>(".shiki-twoslash, pre.twoslash, pre.shiki")
  )
}

function normalizeBlocks(blocks: HTMLElement[]): number {
  let count = 0
  blocks.forEach((block) => {
    const err = block.querySelectorAll<HTMLElement>(".twoslash-error, .twoslash-error-line")
    err.forEach((el) => {
      el.setAttribute("aria-label", "TypeScript error")
      el.setAttribute("role", "note")
    })
    count += 1
  })
  return count
}

function addTryButtons(blocks: HTMLElement[], locale: string): void {
  blocks.forEach((block) => {
    const codeEl = block.querySelector<HTMLElement>("code")
    if (!codeEl) return
    if (block.querySelector(".twoslash-try")) return
    const btn = document.createElement("button")
    btn.className = "twoslash-try"
    btn.setAttribute("type", "button")
    btn.setAttribute("data-locale", locale)
    btn.textContent = locale === "zh" ? "在 Playground 中打开" : "Try in Playground"
    block.appendChild(btn)
  })
}

export function useTwoslashHighlight(
  options: TwoslashHighlightOptions = {}
): TwoslashHighlightResult {
  const { enabled = true, containerSelector = ".markdown", onReady } = options
  const containerRef = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const [blocks, setBlocks] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setReady(true)
      return
    }

    let cancelled = false
    const root =
      containerRef.current ||
      (document.querySelector<HTMLElement>(containerSelector) as HTMLElement | null)

    const run = () => {
      if (cancelled) return
      const found = findTwoslashBlocks(root)
      const normalized = normalizeBlocks(found)
      setBlocks(normalized)
      setReady(true)
      onReady?.()
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
      run()
    } else {
      const handler = () => run()
      document.addEventListener("DOMContentLoaded", handler, { once: true })
      return () => {
        cancelled = true
        document.removeEventListener("DOMContentLoaded", handler)
      }
    }

    return () => {
      cancelled = true
    }
  }, [enabled, containerSelector, onReady])

  return {
    ready,
    blocks,
    containerRef,
  }
}

export { addTryButtons }
