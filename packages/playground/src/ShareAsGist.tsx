import type React from "react"

export interface ShareAsGistProps {
  code: string
  tsVersion: string
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

interface GistFile {
  content: string
}

interface GistData {
  description: string
  public: boolean
  files: {
    [filename: string]: GistFile
  }
}

interface GistResponse {
  html_url: string
  id: string
  message?: string
}

export const ShareAsGist: React.FC<ShareAsGistProps> = ({ 
  code, 
  tsVersion, 
  onSuccess, 
  onError 
}) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle")
  const [gistUrl, setGistUrl] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const escapeHtml = (unsafe: string): string => {
    if (typeof unsafe !== "string") return ""
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  const createGist = async (): Promise<void> => {
    setIsLoading(true)
    setStatus("idle")
    setErrorMessage(null)
    setGistUrl(null)

    try {
      const tsConfig = {
        compilerOptions: {
          target: "es2015",
          module: "esnext",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      }

      const gistData: GistData = {
        description: `TypeScript ${tsVersion} Playground Code`,
        public: true,
        files: {
          "index.ts": {
            content: code
          },
          "tsconfig.json": {
            content: JSON.stringify(tsConfig, null, 2)
          },
          "README.md": {
            content: `# TypeScript Playground Code

This gist contains code shared from the TypeScript Playground, using TypeScript ${tsVersion}.

## Files
- \`index.ts\`: The main TypeScript code
- \`tsconfig.json\`: Recommended compiler configuration

## View in Playground
You can view this code in the TypeScript Playground at https://www.typescriptlang.org/play.
`
          }
        }
      }

      const response = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(gistData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.message || `Failed to create gist: ${response.status} ${response.statusText}`
        
        if (response.status === 403) {
          throw new Error("GitHub API rate limit exceeded. Please try again later or use a personal access token.")
        }
        if (response.status === 422) {
          throw new Error("Invalid gist data. Please check your code and try again.")
        }
        
        throw new Error(errorMsg)
      }

      const data: GistResponse = await response.json()
      
      if (!data.html_url) {
        throw new Error("Gist created but no URL returned from GitHub.")
      }

      setGistUrl(data.html_url)
      setStatus("success")
      
      try {
        await navigator.clipboard.writeText(data.html_url)
      } catch (clipboardError) {
        console.warn("Failed to copy to clipboard:", clipboardError)
      }

      if (onSuccess) {
        onSuccess(data.html_url)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred while creating the gist."
      setErrorMessage(message)
      setStatus("error")
      
      if (onError) {
        onError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resetState = (): void => {
    setStatus("idle")
    setErrorMessage(null)
    setGistUrl(null)
  }

  return (
    <div className="share-as-gist">
      <div className="share-as-gist-content">
        {status === "idle" && (
          <>
            <p className="share-as-gist-description">
              Share your code as a GitHub Gist. This will create a public gist with your code and a tsconfig.json file.
            </p>
            <button
              className="share-as-gist-button"
              onClick={createGist}
              disabled={isLoading}
            >
              {isLoading ? "Creating Gist..." : "Share as Gist"}
            </button>
          </>
        )}

        {status === "success" && gistUrl && (
          <>
            <div className="share-as-gist-success">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <h3>Gist Created!</h3>
              <p>Your gist has been created and the URL has been copied to your clipboard.</p>
            </div>
            <div className="share-as-gist-url">
              <a href={escapeHtml(gistUrl)} target="_blank" rel="noopener noreferrer">
                {escapeHtml(gistUrl)}
              </a>
            </div>
            <button className="share-as-gist-button secondary" onClick={resetState}>
              Create Another Gist
            </button>
          </>
        )}

        {status === "error" && errorMessage && (
          <>
            <div className="share-as-gist-error">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Error Creating Gist</h3>
              <p>{escapeHtml(errorMessage)}</p>
            </div>
            <button className="share-as-gist-button secondary" onClick={resetState}>
              Try Again
            </button>
          </>
        )}
      </div>
      
      <style>{`
        .share-as-gist {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        .share-as-gist-content {
          padding: 16px;
        }
        
        .share-as-gist-description {
          color: #666;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        
        .share-as-gist-button {
          background-color: #007acc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .share-as-gist-button:hover:not(:disabled) {
          background-color: #005a9e;
        }
        
        .share-as-gist-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .share-as-gist-button.secondary {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .share-as-gist-button.secondary:hover:not(:disabled) {
          background-color: #e0e0e0;
        }
        
        .share-as-gist-success {
          text-align: center;
          margin-bottom: 16px;
        }
        
        .success-icon {
          width: 48px;
          height: 48px;
          color: #28a745;
          margin: 0 auto 12px;
        }
        
        .share-as-gist-success h3 {
          margin: 0 0 8px;
          color: #333;
        }
        
        .share-as-gist-success p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        .share-as-gist-url {
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          word-break: break-all;
        }
        
        .share-as-gist-url a {
          color: #007acc;
          text-decoration: none;
        }
        
        .share-as-gist-url a:hover {
          text-decoration: underline;
        }
        
        .share-as-gist-error {
          text-align: center;
          margin-bottom: 16px;
        }
        
        .error-icon {
          width: 48px;
          height: 48px;
          color: #dc3545;
          margin: 0 auto 12px;
        }
        
        .share-as-gist-error h3 {
          margin: 0 0 8px;
          color: #dc3545;
        }
        
        .share-as-gist-error p {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

export default ShareAsGist
