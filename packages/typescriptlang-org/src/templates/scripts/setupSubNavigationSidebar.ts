export const overrideSubNavLinksWithSmoothScroll = () => {
  const subnavLinks = document.querySelectorAll<HTMLAnchorElement>(
    "#handbook-content nav ul li a"
  )

  const listeners = Array.from(subnavLinks).map(link => {
    const onClick = (event: MouseEvent) => {
      event.preventDefault()

      const currentTarget = event.currentTarget as HTMLAnchorElement | null
      const hash = currentTarget?.hash
      if (!hash) {
        return
      }

      const id = decodeURIComponent(hash).slice(1)
      const target = document.querySelector<HTMLElement>(`[id="${id}"]`)
      if (!target) {
        return
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" })
      document.location.hash = hash
    }

    link.addEventListener("click", onClick)

    return () => {
      link.removeEventListener("click", onClick)
    }
  })

  return () => {
    listeners.forEach(removeListener => removeListener())
  }
}

export const updateSidebarOnScroll = () => {
  const subnavLinks = document.querySelectorAll<HTMLAnchorElement>(
    "#handbook-content nav ul li a"
  )

  const fromTop = window.scrollY
  let currentPossibleAnchor: HTMLAnchorElement | undefined
  const offset = 100

  subnavLinks.forEach(link => {
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

  subnavLinks.forEach(link => {
    if (link === currentPossibleAnchor) {
      link.classList.add("current")
    } else {
      link.classList.remove("current")
    }
  })
}
