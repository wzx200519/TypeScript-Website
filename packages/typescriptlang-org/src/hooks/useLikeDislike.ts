import { useEffect, useCallback, useState } from "react"

export interface LikeDislikeResult {
  liked: boolean
  disliked: boolean
  feedback: string | null
}

export function useLikeDislike(
  slug: string,
  intl: (key: string) => string
) {
  const [result, setResult] = useState<LikeDislikeResult>({
    liked: false,
    disliked: false,
    feedback: null,
  })

  const handleFeedback = useCallback(
    (type: "like" | "dislike") => {
      const message =
        type === "like" ? intl("handb_thanks") : intl("handb_thanks")

      setResult({
        liked: type === "like",
        disliked: type === "dislike",
        feedback: message,
      })

      const textSectionNav = document.getElementById("like-dislike-subnav")
      const popoverPopup = document.getElementById("page-helpful-popup")

      if (textSectionNav) {
        textSectionNav.innerHTML = `<h5>${message}</h5>`
      }
      if (popoverPopup) {
        popoverPopup.innerHTML = `<p>${message}</p>`
      }
    },
    [intl]
  )

  const setupButtons = useCallback(() => {
    const likeButton = document.getElementById("like-button")
    const dislikeButton = document.getElementById("dislike-button")
    const likeButtonPopup = document.getElementById("like-button-popup")
    const dislikeButtonPopup = document.getElementById("dislike-button-popup")

    if (likeButton) {
      likeButton.onclick = () => handleFeedback("like")
    }
    if (dislikeButton) {
      dislikeButton.onclick = () => handleFeedback("dislike")
    }
    if (likeButtonPopup) {
      likeButtonPopup.onclick = () => handleFeedback("like")
    }
    if (dislikeButtonPopup) {
      dislikeButtonPopup.onclick = () => handleFeedback("dislike")
    }
  }, [handleFeedback])

  const setupScrollPopup = useCallback(() => {
    const handler = () => {
      const body = document.body
      const html = document.documentElement

      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      )

      const y = Math.max(window.pageYOffset) + window.innerHeight
      const footerH = document.getElementById("site-footer")?.clientHeight || 0
      const bottomOfWindow = y > height - footerH + 150

      const popup = document.getElementById("page-helpful-popup")
      const nav = document.getElementById("like-dislike-subnav")

      if (popup && nav) {
        const popupOpacity = bottomOfWindow ? "1" : "0"
        if (popup.style.opacity !== popupOpacity) {
          popup.style.display = bottomOfWindow ? "block" : "none"
          popup.style.opacity = popupOpacity
        }

        const navOpacity = bottomOfWindow ? "0" : "1"
        if (nav.style.opacity !== navOpacity) {
          nav.style.opacity = navOpacity
        }
      }
    }

    window.addEventListener("scroll", handler, { passive: true, capture: true })

    return () => {
      window.removeEventListener("scroll", handler, true)
    }
  }, [])

  useEffect(() => {
    setupButtons()
    const cleanup = setupScrollPopup()
    return cleanup
  }, [setupButtons, setupScrollPopup])

  return result
}