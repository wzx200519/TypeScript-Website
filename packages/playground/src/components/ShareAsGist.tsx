import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface ShareAsGistProps {
  code: string;
  tsVersion: string;
}

function getSafeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'gist.github.com') {
      return parsedUrl.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function formatRateLimitReset(resetEpoch: number): string {
  const resetDate = new Date(resetEpoch * 1000);
  const minutes = Math.ceil((resetDate.getTime() - Date.now()) / 60000);
  if (minutes <= 0) return 'a moment';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

export const ShareAsGist: React.FC<ShareAsGistProps> = ({ code, tsVersion }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleShare = useCallback(async () => {
    if (!code.trim()) {
      setError('Cannot share empty code.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setGistUrl(null);
    setCopied(false);

    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description: `TypeScript Playground Code (TS ${tsVersion})`,
          public: false,
          files: {
            'playground.ts': {
              content: code,
            },
            'tsconfig.json': {
              content: JSON.stringify(
                {
                  compilerOptions: {
                    target: 'ESNext',
                    module: 'ESNext',
                    strict: true,
                  },
                },
                null,
                2
              ),
            },
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          const resetEpoch = response.headers.get('X-RateLimit-Reset');
          if (resetEpoch) {
            const waitTime = formatRateLimitReset(Number(resetEpoch));
            throw new Error(`GitHub API rate limit exceeded. Reset in ${waitTime}.`);
          }
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        if (response.status === 401) {
          throw new Error('Authentication required. Anonymous gists may be restricted.');
        }
        throw new Error(`Failed to create gist (HTTP ${response.status}).`);
      }

      const data = await response.json();

      if (!data.html_url) {
        throw new Error('Invalid response from GitHub API: Missing Gist URL.');
      }

      const safeUrl = getSafeUrl(data.html_url);
      if (!safeUrl) {
        throw new Error('Invalid Gist URL returned from API.');
      }

      if (controller.signal.aborted) return;
      setGistUrl(safeUrl);

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(safeUrl);
          if (!controller.signal.aborted) {
            setCopied(true);
          }
        } catch {
          // Clipboard write failed silently
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'An unexpected network error occurred while creating the gist.';
      setError(message);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [code, tsVersion]);

  const isDisabled = isLoading || !code.trim();

  return (
    <div className="share-as-gist-container">
      <button
        onClick={handleShare}
        disabled={isDisabled}
        className="share-button"
        aria-label={isLoading ? 'Creating Gist' : 'Share as Gist'}
        aria-busy={isLoading}
      >
        {isLoading ? 'Creating Gist...' : 'Share as Gist'}
      </button>

      <div aria-live="polite">
        {error && (
          <div className="error-message" role="alert" style={{ color: 'red', marginTop: '8px' }}>
            {error}
          </div>
        )}

        {gistUrl && (
          <div className="success-message" style={{ marginTop: '8px' }}>
            <p style={{ margin: '0 0 4px 0', color: 'green' }}>Gist created successfully!</p>
            <div className="gist-url-container">
              <a
                href={gistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gist-link"
              >
                {gistUrl}
              </a>
              {copied && (
                <span className="copied-text" style={{ marginLeft: '8px', color: 'gray', fontSize: '0.9em' }}>
                  {' '}(Copied to clipboard!)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
