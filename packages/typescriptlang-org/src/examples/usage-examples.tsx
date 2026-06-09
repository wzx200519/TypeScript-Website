import React from 'react'
import {
  useTableOfContents,
  useTwoslashHighlight,
  useScrollNavigation,
  useDeprecation,
  useLikeDislike,
} from '../hooks'
import { MarkdownHeadingTree } from '../components/MarkdownHeadingTree'
import {
  extractFrontmatter,
  getDocumentPrefix,
  shouldShowTableOfContents,
  isExperimentalDocument,
  buildCanonicalURL,
  processPreamble,
} from '../utils/markdownHelpers'

export const ExampleUsage: React.FC = () => {
  const mockHeadings = [
    { value: 'Introduction', depth: 1 },
    { value: 'Getting Started', depth: 2 },
    { value: 'Installation', depth: 3 },
    { value: 'Configuration', depth: 3 },
    { value: 'Advanced Topics', depth: 2 },
  ]

  const mockFrontmatter = {
    title: 'Example Document',
    disable_toc: false,
    handbook: true,
    experimental: false,
    deprecated_by: '/new-docs',
    deprecation_redirects: ['old-hash', 'new-hash'],
    oneline: 'An example document',
    preamble: '<p>This is a preamble</p>',
  }

  const tableOfContents = useTableOfContents(mockHeadings)
  const deprecationInfo = useDeprecation(
    mockFrontmatter.deprecated_by,
    mockFrontmatter.deprecation_redirects
  )

  useScrollNavigation({ offset: 100 })
  useTwoslashHighlight()

  const showSidebar = shouldShowTableOfContents(mockFrontmatter.disable_toc)
  const isExperimental = isExperimentalDocument(mockFrontmatter.experimental)
  const prefix = getDocumentPrefix(mockFrontmatter.handbook)
  const canonicalURL = buildCanonicalURL(mockFrontmatter.deprecated_by)
  const preambleHTML = processPreamble(mockFrontmatter.preamble)

  return (
    <div>
      <h1>{mockFrontmatter.title}</h1>
      <p>Document Prefix: {prefix}</p>
      <p>Show Sidebar: {showSidebar.toString()}</p>
      <p>Is Experimental: {isExperimental.toString()}</p>
      <p>Canonical URL: {canonicalURL}</p>

      {deprecationInfo.shouldRedirect && (
        <div className="deprecation-warning">
          This document is deprecated. Redirect to: {deprecationInfo.redirectURL}
        </div>
      )}

      {preambleHTML && (
        <div className="preamble" dangerouslySetInnerHTML={preambleHTML} />
      )}

      {showSidebar && (
        <aside>
          <h3>Table of Contents</h3>
          <MarkdownHeadingTree tree={tableOfContents} />
        </aside>
      )}
    </div>
  )
}

export const MinimalExample: React.FC = () => {
  const headings = [
    { value: 'Section 1', depth: 1 },
    { value: 'Subsection 1.1', depth: 2 },
    { value: 'Section 2', depth: 1 },
  ]

  const toc = useTableOfContents(headings)

  return (
    <nav>
      <MarkdownHeadingTree tree={toc} className="toc-list" />
    </nav>
  )
}

export const TwoslashExample: React.FC = () => {
  useTwoslashHighlight()

  return (
    <div>
      <h2>Code Block with Twoslash</h2>
      <pre>
        <code className="language-typescript" data-language="typescript">
          {`const greeting: string = "Hello, TypeScript!"
console.log(greeting)`}
        </code>
      </pre>
    </div>
  )
}

export const ScrollNavigationExample: React.FC = () => {
  useScrollNavigation({
    offset: 150,
    passive: true,
  })

  return (
    <article>
      <h2 id="section-1">Section 1</h2>
      <p>Content for section 1...</p>

      <h2 id="section-2">Section 2</h2>
      <p>Content for section 2...</p>

      <h2 id="section-3">Section 3</h2>
      <p>Content for section 3...</p>
    </article>
  )
}

export const LikeDislikeExample: React.FC = () => {
  const intl = (key: string) => {
    const messages: Record<string, string> = {
      handb_thanks: 'Thank you for your feedback!',
      handb_like_desc: 'Like',
      handb_dislike_desc: 'Dislike',
    }
    return messages[key] || key
  }

  const result = useLikeDislike('/example-page', intl)

  return (
    <div>
      <h3>Was this page helpful?</h3>
      <button id="like-button">👍 Like</button>
      <button id="dislike-button">👎 Dislike</button>
      {result.feedback && <p>{result.feedback}</p>}
    </div>
  )
}

export const DeprecationExample: React.FC = () => {
  const deprecationInfo = useDeprecation(
    '/new-documentation',
    ['old-section', 'new-section']
  )

  return (
    <div>
      {deprecationInfo.shouldRedirect && (
        <div className="deprecation-banner">
          <h3>⚠️ Document Deprecated</h3>
          <p>
            This document has been moved. Please visit our new documentation at:{' '}
            <a href={deprecationInfo.redirectURL!}>{deprecationInfo.redirectURL}</a>
          </p>
        </div>
      )}
    </div>
  )
}