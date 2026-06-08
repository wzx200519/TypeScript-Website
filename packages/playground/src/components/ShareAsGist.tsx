import React, { useState, useCallback } from 'react';

export interface ShareAsGistProps {
  /**
   * The current code in the editor
   */
  code: string;
  /**
   * The TypeScript version currently selected
   */
  tsVersion: string;
}

export const ShareAsGist: React.FC<ShareAsGistProps> = ({ code, tsVersion }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Validate URL to prevent XSS via javascript: URIs
  const getSafeUrl = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'gist.github.com') {
        return parsedUrl.toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleShare = useCallback(async () => {
    if (!code.trim()) {
      setError('Cannot share empty code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGistUrl(null);
    setCopied(false);

    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description: `TypeScript Playground Code (TS ${tsVersion})`,
          public: false, // Create as a secret gist
          files: {
            'playground.ts': {
              content: code,
            },
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to create gist: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.html_url) {
        throw new Error('Invalid response from GitHub API: Missing Gist URL.');
      }

      const safeUrl = getSafeUrl(data.html_url);
      if (!safeUrl) {
        throw new Error('Invalid Gist URL returned from API.');
      }

      setGistUrl(safeUrl);

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(safeUrl);
          setCopied(true);
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected network error occurred while creating the gist.');
    } finally {
      setIsLoading(false);
    }
  }, [code, tsVersion]);

  return (
    <div className="share-as-gist-container">
      <button 
        onClick={handleShare} 
        disabled={isLoading || !code.trim()}
        className="share-button"
      >
        {isLoading ? 'Creating Gist...' : 'Share as Gist'}
      </button>

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
            {copied && <span className="copied-text" style={{ marginLeft: '8px', color: 'gray', fontSize: '0.9em' }}> (Copied to clipboard!)</span>}
          </div>
        </div>
      )}
    </div>
  );
};
