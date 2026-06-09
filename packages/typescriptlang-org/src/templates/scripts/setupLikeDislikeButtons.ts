export const setupLikeDislikeButtons = (_slug: string, i: any) => {
  const likeButton = document.getElementById("like-button")
  const dislikeButton = document.getElementById("dislike-button")
  const likeButtonPopup = document.getElementById("like-button-popup")
  const dislikeButtonPopup = document.getElementById("dislike-button-popup")

  if (!likeButton || !dislikeButton || !likeButtonPopup || !dislikeButtonPopup) {
    return () => {}
  }

  const clicked = () => {
    const newContent: string = i("handb_thanks")

    const textSectionNav = document.getElementById("like-dislike-subnav")
    const popoverPopup = document.getElementById("page-helpful-popup")

    if (textSectionNav) {
      textSectionNav.innerHTML = `<h5>${newContent}</h5>`
    }

    if (popoverPopup) {
      popoverPopup.innerHTML = `<p>${newContent}</p>`
    }
  }

  likeButton.addEventListener("click", clicked)
  dislikeButton.addEventListener("click", clicked)
  likeButtonPopup.addEventListener("click", clicked)
  dislikeButtonPopup.addEventListener("click", clicked)

  const onScroll = () => {
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
    const footer = document.getElementById("site-footer")
    if (!footer) {
      return
    }

    const bottomOfWindow = y > height - footer.clientHeight + 150
    const popup = document.getElementById("page-helpful-popup")
    const nav = document.getElementById("like-dislike-subnav")
    if (!popup || !nav) {
      return
    }

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

  const scrollListenerOptions = { passive: true, capture: true } as const

  window.addEventListener("scroll", onScroll, scrollListenerOptions)
  onScroll()

  return () => {
    likeButton.removeEventListener("click", clicked)
    dislikeButton.removeEventListener("click", clicked)
    likeButtonPopup.removeEventListener("click", clicked)
    dislikeButtonPopup.removeEventListener("click", clicked)
    window.removeEventListener("scroll", onScroll, true)
  }
}
