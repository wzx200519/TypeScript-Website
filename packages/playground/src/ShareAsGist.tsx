import React, { useState, useRef, useEffect } from 'react';

export interface ShareAsGistProps {
  /** 当前编辑器的代码 */
  code: string;
  /** 当前 TypeScript 的版本号 */
  tsVersion: string;
  /** 成功创建并复制 gist 链接后的回调（可选） */
  onSuccess?: (gistUrl: string) => void;
  /** 发生错误时的回调（可选） */
  onError?: (error: Error) => void;
}

export const ShareAsGist: React.FC<ShareAsGistProps> = ({ code, tsVersion, onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 清理未完成的请求
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleShare = async () => {
    if (isLoading) return;

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setErrorMsg(null);
    setCopied(false);
    setGistUrl(null);

    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `TypeScript Playground Code (TS v${tsVersion})`,
          public: false, // 创建为 secret gist
          files: {
            'playground.ts': {
              content: code || '// Empty'
            }
          }
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          throw new Error('请求被拒绝或速率限制 (Rate limit exceeded)。请稍后再试。');
        }
        if (response.status === 401 || response.status === 404 || response.status === 422) {
          throw new Error('未授权或请求无效：GitHub API 可能不再支持完全匿名的 Gist 创建，请检查 API 要求。');
        }
        throw new Error(`网络失败或 GitHub Gist API 错误: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      
      if (!data || !data.html_url) {
        throw new Error('GitHub Gist API 返回的数据无效。');
      }

      const newGistUrl = data.html_url;
      setGistUrl(newGistUrl);
      
      try {
        await navigator.clipboard.writeText(newGistUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (clipboardError) {
        console.error('复制到剪贴板失败', clipboardError);
      }
      
      onSuccess?.(newGistUrl);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 请求被取消，不需要报错
        return;
      }
      const errorMessage = err instanceof Error ? err.message : '发生未知错误';
      setErrorMsg(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="share-as-gist-container" style={styles.container}>
      <button 
        onClick={handleShare}
        disabled={isLoading || !code.trim()}
        style={isLoading || !code.trim() ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
      >
        {isLoading ? '正在创建 Gist...' : '分享为 Gist'}
      </button>

      {/* 
        React 默认会对渲染的字符串进行转义，从而避免 XSS 风险。
        切勿在此处使用 dangerouslySetInnerHTML。
      */}
      {errorMsg && (
        <div className="error-message" role="alert" style={styles.error}>
          {errorMsg}
        </div>
      )}

      {gistUrl && (
        <div className="success-message" style={styles.success}>
          <p style={{ margin: '0 0 4px 0' }}>Gist 创建成功！</p>
          <div style={styles.urlContainer}>
            <a 
              href={gistUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={styles.link}
            >
              {gistUrl}
            </a>
            {copied && <span style={styles.copiedText}>(已复制到剪贴板)</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// 简单的内联样式对象
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    maxWidth: '400px',
  },
  button: {
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: '#3178c6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#a0b9d9',
    cursor: 'not-allowed',
  },
  error: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '14px',
  },
  success: {
    fontSize: '14px',
    backgroundColor: '#e8f5e9',
    padding: '8px',
    borderRadius: '4px',
  },
  urlContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  link: {
    color: '#3178c6',
    textDecoration: 'none',
    wordBreak: 'break-all' as const,
  },
  copiedText: {
    color: '#2e7d32',
    fontSize: '12px',
  }
};
