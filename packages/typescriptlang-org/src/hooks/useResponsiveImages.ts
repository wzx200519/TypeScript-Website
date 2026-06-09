import { useEffect, useRef } from "react"

export type ResponsiveImageOptions = {
  enabled?: boolean
  containerSelector?: string
  maxWidth?: number
  lazy?: boolean
}

export type ResponsiveImageResult = {
  containerRef: React.RefObject<HTMLElement>
  processed: number
}

function applyResponsiveStyles(img: HTMLImageElement, maxWidth: number): void {
  const computed = window.getComputedStyle(img)
  if (computed.maxWidth && computed.maxWidth !== "none") return
  img.style.maxWidth = `${maxWidth}px`
  img.style.width = "100%"
  img.style.height = "auto"
  img.style.display = "block"
  img.style.boxSizing = "border-box"
  if (!img.alt) {
    img.alt = ""
  }
}

function applyLazyLoading(img: HTMLImageElement): void {
  if (img.hasAttribute("loading")) return
  img.setAttribute("loading", "lazy")
  img.setAttribute("decoding", "async")
}

function wrapFigure(img: HTMLImageElement): void {
  if (img.parentElement?.tagName === "FIGURE") return
  const figure = document.createElement("figure")
  figure.className = "responsive-figure"
  const caption = img.getAttribute("title")
  if (img.parentElement) {
    img.parentElement.insertBefore(figure, img)
  }
  figure.appendChild(img)
  if (caption) {
    const fc = document.createElement("figcaption")
    fc.textContent = caption
    figure.appendChild(fc)
  }
}

export function useResponsiveImages(options: ResponsiveImageOptions = {}): ResponsiveImageResult {
  const { enabled = true, containerSelector = ".markdown", maxWidth = 590, lazy = true } = options
  const containerRef = useRef<HTMLElement>(null)
  const processedRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const root =
      containerRef.current ||
      (document.querySelector<HTMLElement>(containerSelector) as HTMLElement | null)
    if (!root) return

    const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
    images.forEach((img) => {
      applyResponsiveStyles(img, maxWidth)
      if (lazy) applyLazyLoading(img)
      wrapFigure(img)
      processedRef.current += 1
    })
  }, [enabled, containerSelector, maxWidth, lazy])

  return { containerRef, processed: processedRef.current }
}
