import { useEffect, useCallback, useState } from "react"

export interface TwoslashCodeBlock {
  element: HTMLElement
  code: string
  language: string
}

export function useTwoslashHighlight() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
      return true
    } catch (error) {
      console.error("Failed to copy code:", error)
      return false
    }
  }, [])

  const setupCodeBlockInteractions = useCallback(() => {
    const codeBlocks = document.querySelectorAll<HTMLElement>(
      'pre code[data-language], pre.twoslash[data-language]'
    )

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.closest('pre')
      if (!pre) return

      const copyButton = pre.querySelector('.copy-button') as HTMLButtonElement | null
      if (copyButton && !copyButton.dataset.initialized) {
        copyButton.dataset.initialized = 'true'
        copyButton.addEventListener('click', async () => {
          const code = codeBlock.textContent || ''
          const success = await copyToClipboard(code)
          if (success) {
            const originalText = copyButton.textContent
            copyButton.textContent = 'Copied!'
            setTimeout(() => {
              copyButton.textContent = originalText
            }, 2000)
          }
        })
      }

      const tryButton = pre.querySelector('.try-button') as HTMLButtonElement | null
      if (tryButton && !tryButton.dataset.initialized) {
        tryButton.dataset.initialized = 'true'
        tryButton.addEventListener('click', () => {
          const code = codeBlock.textContent || ''
          const playgroundUrl = `/play?code=${encodeURIComponent(code)}`
          window.open(playgroundUrl, '_blank')
        })
      }
    })
  }, [copyToClipboard])

  const highlightErrors = useCallback(() => {
    const errorElements = document.querySelectorAll<HTMLElement>('.twoslash-error-line')
    errorElements.forEach((element) => {
      if (!element.dataset.errorHighlighted) {
        element.dataset.errorHighlighted = 'true'
        element.style.cursor = 'pointer'
        element.addEventListener('mouseenter', () => {
          const errorPopup = element.querySelector('.error-popup') as HTMLElement | null
          if (errorPopup) {
            errorPopup.style.display = 'block'
          }
        })
        element.addEventListener('mouseleave', () => {
          const errorPopup = element.querySelector('.error-popup') as HTMLElement | null
          if (errorPopup) {
            errorPopup.style.display = 'none'
          }
        })
      }
    })
  }, [])

  const setupHoverInfo = useCallback(() => {
    const hoverTargets = document.querySelectorAll<HTMLElement>('[data-hover-info]')
    hoverTargets.forEach((target) => {
      if (!target.dataset.hoverInitialized) {
        target.dataset.hoverInitialized = 'true'
        target.style.cursor = 'pointer'
        target.style.borderBottom = '1px dotted currentColor'
        
        target.addEventListener('mouseenter', (e) => {
          const hoverInfo = target.getAttribute('data-hover-info')
          if (hoverInfo) {
            showTooltip(e as MouseEvent, hoverInfo, target)
          }
        })
        
        target.addEventListener('mouseleave', () => {
          hideTooltip()
        })
      }
    })
  }, [])

  useEffect(() => {
    setupCodeBlockInteractions()
    highlightErrors()
    setupHoverInfo()
  }, [setupCodeBlockInteractions, highlightErrors, setupHoverInfo])

  return {
    copiedCode,
    copyToClipboard,
    setupCodeBlockInteractions,
    highlightErrors,
    setupHoverInfo,
  }
}

function showTooltip(event: MouseEvent, content: string, target: HTMLElement) {
  hideTooltip()
  
  const tooltip = document.createElement('div')
  tooltip.id = 'twoslash-tooltip'
  tooltip.style.cssText = `
    position: absolute;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', monospace;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    max-width: 400px;
    white-space: pre-wrap;
    pointer-events: none;
  `
  tooltip.textContent = content
  
  document.body.appendChild(tooltip)
  
  const rect = target.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()
  
  let top = rect.top - tooltipRect.height - 8
  let left = rect.left
  
  if (top < 0) {
    top = rect.bottom + 8
  }
  
  if (left + tooltipRect.width > window.innerWidth) {
    left = window.innerWidth - tooltipRect.width - 8
  }
  
  tooltip.style.top = `${top + window.scrollY}px`
  tooltip.style.left = `${left}px`
}

function hideTooltip() {
  const existing = document.getElementById('twoslash-tooltip')
  if (existing) {
    existing.remove()
  }
}