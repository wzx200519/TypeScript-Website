import { useEffect } from "react"

export function useResponsiveImages(contentRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const images = container.querySelectorAll("img")
    
    images.forEach(img => {
      if (!img.getAttribute("loading")) {
        img.setAttribute("loading", "lazy")
      }
      if (!img.classList.contains("responsive-img")) {
        img.classList.add("responsive-img")
      }
    })
  }, [contentRef])
}
