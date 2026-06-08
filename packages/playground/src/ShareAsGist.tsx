import * as React from "react"

const GITHUB_GIST_API_URL = "https://api.github.com/gists"
const DEFAULT_FILE_NAME = "playground.ts"
const VERSION_FILE_NAME = "typescript-version.txt"
const DEFAULT_BUTTON_LABEL = "分享为 Gist"
const DEFAULT_EMPTY_CODE_MESSAGE = "当前没有可分享的代码。"
const DEFAULT_LOADING_MESSAGE = "正在创建 Gist..."
const DEFAULT_SUCCESS_MESSAGE = "Gist 链接已复制到剪贴板。"
const DEFAULT_COPY_FAILURE_MESSAGE = "Gist 已创建，但浏览器阻止了自动复制，请手动复制下面的链接。"
const DEFAULT_NETWORK_ERROR_MESSAGE = "无法连接到 GitHub Gist，请检查网络后重试。"
const DEFAULT_RATE_LIMIT_MESSAGE = "GitHub Gist API 当前已达到速率限制，请稍后再试。"
const DEFAULT_RESPONSE_ERROR_MESSAGE = "GitHub Gist 返回了无效响应，请稍后再试。"
const DEFAULT_CREATE_ERROR_MESSAGE = "创建 Gist 失败，请稍后再试。"

export type ShareAsGistStatus = "idle" | "loading" | "success" | "error"

export interface ShareAsGistProps {
  code: string
  tsVersion: string
  fileName?: string
  className?: string
  buttonLabel?: string
  onSuccess?: (result: ShareAsGistSuccessResult) => void
  onError?: (result: ShareAsGistErrorResult) => void
}

export interface ShareAsGistSuccessResult {
  gistUrl: string
  copiedToClipboard: boolean
}

export interface ShareAsGistErrorResult {
  message: string
}

export interface GitHubGistFile {
  content: string
}

export interface CreateAnonymousGistRequest {
  description: string
  public: boolean
  files: Record<string, GitHubGistFile>
}

export interface CreateAnonymousGistResponse {
  html_url?: string
}

export interface GitHubApiErrorResponse {
  message?: string
}

const sanitizeFileName = (value: string | undefined) => {
  const trimmedValue = (value || DEFAULT_FILE_NAME).trim()
  const normalizedValue = trimmedValue.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return normalizedValue || DEFAULT_FILE_NAME
}

const sanitizeVersion = (value: string) => {
  const trimmedValue = value.trim()
  return trimmedValue || "unknown"
}

const isRateLimited = (response: Response) => {
  const remainingRequests = response.headers.get("x-ratelimit-remaining")
  return response.status === 403 || response.status === 429 || remainingRequests === "0"
}

const getSafeGistUrl = (value: string | undefined) => {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.hostname !== "gist.github.com") {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

const copyTextToClipboard = async (value: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(value)
    return true
  }

  return false
}

const getCreateErrorMessage = (response: Response, apiError: GitHubApiErrorResponse | null) => {
  if (isRateLimited(response)) {
    return DEFAULT_RATE_LIMIT_MESSAGE
  }

  const message = apiError?.message?.trim()
  if (message === "Not Found") {
    return DEFAULT_CREATE_ERROR_MESSAGE
  }

  return DEFAULT_CREATE_ERROR_MESSAGE
}

const getUnexpectedErrorMessage = (error: unknown) => {
  if (error instanceof TypeError) {
    return DEFAULT_NETWORK_ERROR_MESSAGE
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return DEFAULT_CREATE_ERROR_MESSAGE
}

export const ShareAsGist = ({
  code,
  tsVersion,
  fileName,
  className,
  buttonLabel = DEFAULT_BUTTON_LABEL,
  onSuccess,
  onError,
}: ShareAsGistProps) => {
  const [status, setStatus] = React.useState<ShareAsGistStatus>("idle")
  const [gistUrl, setGistUrl] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)

  const canShare = code.trim().length > 0
  const resolvedFileName = React.useMemo(() => sanitizeFileName(fileName), [fileName])
  const resolvedTsVersion = React.useMemo(() => sanitizeVersion(tsVersion), [tsVersion])

  const handleShare = React.useCallback(async () => {
    if (!canShare || status === "loading") {
      return
    }

    setStatus("loading")
    setErrorMessage(null)
    setStatusMessage(null)
    setGistUrl(null)

    const payload: CreateAnonymousGistRequest = {
      description: `Shared from TypeScript Playground (TypeScript ${resolvedTsVersion})`,
      public: false,
      files: {
        [resolvedFileName]: { content: code },
        [VERSION_FILE_NAME]: { content: resolvedTsVersion },
      },
    }

    try {
      const response = await fetch(GITHUB_GIST_API_URL, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify(payload),
      })

      let apiError: GitHubApiErrorResponse | null = null
      let apiResponse: CreateAnonymousGistResponse | null = null

      try {
        const json = (await response.json()) as CreateAnonymousGistResponse | GitHubApiErrorResponse
        if (response.ok) {
          apiResponse = json as CreateAnonymousGistResponse
        } else {
          apiError = json as GitHubApiErrorResponse
        }
      } catch {
        if (!response.ok) {
          throw new Error(getCreateErrorMessage(response, null))
        }

        throw new Error(DEFAULT_RESPONSE_ERROR_MESSAGE)
      }

      if (!response.ok) {
        throw new Error(getCreateErrorMessage(response, apiError))
      }

      const nextGistUrl = getSafeGistUrl(apiResponse?.html_url)
      if (!nextGistUrl) {
        throw new Error(DEFAULT_RESPONSE_ERROR_MESSAGE)
      }

      const copiedToClipboard = await copyTextToClipboard(nextGistUrl)
      const nextStatusMessage = copiedToClipboard ? DEFAULT_SUCCESS_MESSAGE : DEFAULT_COPY_FAILURE_MESSAGE

      setStatus("success")
      setGistUrl(nextGistUrl)
      setStatusMessage(nextStatusMessage)
      onSuccess?.({ gistUrl: nextGistUrl, copiedToClipboard })
    } catch (error) {
      const message = getUnexpectedErrorMessage(error)
      setStatus("error")
      setErrorMessage(message)
      onError?.({ message })
    }
  }, [canShare, code, onError, onSuccess, resolvedFileName, resolvedTsVersion, status])

  const classNames = ["share-as-gist", className].filter(Boolean).join(" ")
  const isLoading = status === "loading"

  return (
    <div className={classNames}>
      <button type="button" onClick={handleShare} disabled={!canShare || isLoading} aria-busy={isLoading}>
        {isLoading ? DEFAULT_LOADING_MESSAGE : buttonLabel}
      </button>
      {!canShare ? (
        <p role="status" aria-live="polite">
          {DEFAULT_EMPTY_CODE_MESSAGE}
        </p>
      ) : null}
      {statusMessage ? (
        <p role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      ) : null}
      {gistUrl ? (
        <p>
          <a href={gistUrl} target="_blank" rel="noopener noreferrer">
            {gistUrl}
          </a>
        </p>
      ) : null}
    </div>
  )
}

export default ShareAsGist
