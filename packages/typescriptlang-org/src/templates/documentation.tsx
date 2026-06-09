import React, { useCallback, useEffect, useState } from "react"
import { graphql } from "gatsby"
import { Layout } from "../components/layout"
import { Sidebar, SidebarToggleButton } from "../components/layout/Sidebar"
import { getDocumentationNavForLanguage } from "../lib/documentationNavigation"
import { Intl } from "../components/Intl"

import "./documentation.scss"
import "./markdown.scss"

import { NextPrev } from "../components/handbook/NextPrev"
import { createInternational } from "../lib/createInternational"
import { useIntl } from "react-intl"
import { createIntlLink } from "../components/IntlLink"
import { handbookCopy } from "../copy/en/handbook"
import { Contributors } from "../components/handbook/Contributors"
import { overrideSubNavLinksWithSmoothScroll, updateSidebarOnScroll } from "./scripts/setupSubNavigationSidebar"
import { setupLikeDislikeButtons } from "./scripts/setupLikeDislikeButtons"
import { DislikeUnfilledSVG, LikeUnfilledSVG } from "../components/svgs/documentation"
import Helmet from "react-helmet"

import { useTableOfContents } from "../hooks/useTableOfContents"
import { useTwoslashHighlight } from "../hooks/useTwoslashHighlight"
import { useResponsiveImages } from "../hooks/useResponsiveImages"
import {
  MarkdownHeadingTree,
  parseFrontmatter,
  resolveDeprecationRedirect,
  type DocumentFrontmatter,
} from "../utils/markdown"

type Props = {
  pageContext: {
    id: string | undefined
    nextID: string
    previousID: string
    repoPath: string
    slug: string
    lang: string
    modifiedTime: string
  }
  data: GatsbyTypes.GetDocumentBySlugQuery
  path: string
}

type MarkdownPost = {
  html: string | null | undefined
  headings: GatsbyTypes.Maybe<Pick<GatsbyTypes.MarkdownHeading, "value" | "depth">>[] | null | undefined
  frontmatter: DocumentFrontmatter | null | undefined
}

const HandbookTemplate: React.FC<Props> = (props) => {
  const post: MarkdownPost = {
    html: props.data.markdownRemark?.html,
    headings: props.data.markdownRemark?.headings,
    frontmatter: props.data.markdownRemark?.frontmatter as DocumentFrontmatter | null | undefined,
  }

  if (!post.frontmatter) throw new Error(`No front-matter found for the file with props: ${props}`)
  if (!post.html) throw new Error(`No html found for the file with props: ${props}`)

  const fm = parseFrontmatter(post.frontmatter)
  const [deprecationURL, setDeprecationURL] = useState<string | null>(fm.deprecationURL)

  const i = createInternational<typeof handbookCopy>(useIntl())
  const IntlLink = createIntlLink(props.pageContext.lang)

  const selectedID = props.pageContext.id || "NO-ID"
  const navigation = getDocumentationNavForLanguage(props.pageContext.lang)

  const { showSidebar, tree, slug } = useTableOfContents(post.headings, {
    maxDepth: 3,
    disabled: fm.disableToc,
  })

  const onTwoslashReady = useCallback(() => {
    overrideSubNavLinksWithSmoothScroll()
    window.addEventListener("scroll", updateSidebarOnScroll, { passive: true, capture: true })
    updateSidebarOnScroll()
    setupLikeDislikeButtons(props.pageContext.slug, i)
  }, [props.pageContext.slug, i])

  useTwoslashHighlight({ enabled: true, containerSelector: ".markdown", onReady: onTwoslashReady })
  useResponsiveImages({ enabled: true, containerSelector: ".markdown", maxWidth: 590, lazy: true })

  useEffect(() => {
    if (document.location.hash) {
      const redirected = resolveDeprecationRedirect(post.frontmatter!.deprecation_redirects, document.location.hash)
      if (redirected) setDeprecationURL(redirected)
    }

    return () => {
      window.removeEventListener("scroll", updateSidebarOnScroll)
    }
  }, [post.frontmatter])

  return (
    <Layout
      title={`${fm.prefix} - ${fm.title}`}
      description={fm.oneline || ""}
      lang={props.pageContext.lang}
      skipToAnchor="#handbook-content"
    >
      <section id="doc-layout">
        <SidebarToggleButton />

        <div
          className="page-popup"
          id="page-helpful-popup"
          role="status"
          aria-live="polite"
          style={{ opacity: 0, display: "none" }}
        >
          <p>Was this page helpful?</p>
          <div>
            <button className="first" id="like-button-popup" title="Like this page">
              <LikeUnfilledSVG />
            </button>
            <button id="dislike-button-popup" title="Dislike this page">
              <DislikeUnfilledSVG />
            </button>
          </div>
        </div>

        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `
          nav#sidebar > ul > li.closed ul {
            display: block !important;
           }
        `,
            }}
          />
        </noscript>

        <Sidebar navItems={navigation} selectedID={selectedID} />
        <div id="handbook-content" role="article">
          {deprecationURL && (
            <>
              <Helmet>
                <link
                  rel="canonical"
                  href={`https://www.typescriptlang.org${post.frontmatter!.deprecated_by}`}
                />
              </Helmet>
              <div id="deprecated-header">
                <div id="deprecated-content">
                  <div id="deprecated-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7.5" stroke="black" />
                      <path d="M8 3V9" stroke="black" />
                      <path d="M8 11L8 13" stroke="black" />
                    </svg>
                  </div>
                  <div>
                    <h3>{i("handb_deprecated_title")}</h3>
                    <p>
                      {i("handb_deprecated_subtitle")}
                      <IntlLink className="deprecation-redirect-link" to={deprecationURL}>
                        {i("handb_deprecated_subtitle_link")}
                      </IntlLink>
                    </p>
                  </div>
                </div>
                <div id="deprecated-action">
                  <IntlLink className="deprecation-redirect-link" to={deprecationURL}>
                    {i("handb_deprecated_subtitle_action")}
                  </IntlLink>
                </div>
              </div>
            </>
          )}

          {fm.experimental && (
            <div id="deprecated-header">
              <div id="deprecated-content">
                <div id="deprecated-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7.5" stroke="black" />
                    <path d="M8 3V9" stroke="black" />
                    <path d="M8 11L8 13" stroke="black" />
                  </svg>
                </div>
                <div>
                  <h3>{i("handb_experimental_title")}</h3>
                  <p>{i("handb_experimental_subtitle")}</p>
                </div>
              </div>
            </div>
          )}

          <h1>{fm.title}</h1>
          {fm.preamble && <div className="preamble" dangerouslySetInnerHTML={{ __html: fm.preamble }} />}
          <article>
            <div className="whitespace raised">
              <div className="markdown" dangerouslySetInnerHTML={{ __html: post.html! }} />
            </div>
            {showSidebar && (
              <aside className="handbook-toc">
                <nav
                  className={deprecationURL ? "deprecated" : ""}
                  aria-label="table of contents"
                >
                  <>
                    <h5>{i("handb_on_this_page")}</h5>
                    <MarkdownHeadingTree
                      tree={tree}
                      slug={slug}
                      className="handbook-on-this-page-section-list"
                    />
                  </>
                  <div id="like-dislike-subnav" role="status" aria-live="polite">
                    <h5>{i("handb_like_dislike_title")}</h5>
                    <div>
                      <button title="Like this page" id="like-button">
                        <LikeUnfilledSVG /> {i("handb_like_desc")}
                      </button>
                      <button title="Dislike this page" id="dislike-button">
                        <DislikeUnfilledSVG /> {i("handb_dislike_desc")}
                      </button>
                    </div>
                  </div>
                </nav>
              </aside>
            )}
          </article>

          <NextPrev
            next={props.data.next as any}
            prev={props.data.prev as any}
            i={i}
            IntlLink={IntlLink as any}
          />
          <Contributors
            lang={props.pageContext.lang}
            i={i}
            path={props.pageContext.repoPath}
            lastEdited={props.pageContext.modifiedTime}
          />
        </div>
      </section>
    </Layout>
  )
}

export default (props: Props) => (
  <Intl locale={props.pageContext.lang}>
    <HandbookTemplate {...props} />
  </Intl>
)

export const pageQuery = graphql`
  query GetDocumentBySlug($slug: String!, $previousID: String, $nextID: String) {
    markdownRemark(frontmatter: { permalink: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      headings {
        value
        depth
      }
      frontmatter {
        permalink
        title
        disable_toc
        handbook
        oneline
        preamble
        deprecated_by
        deprecation_redirects
        experimental
      }
    }

    prev: file(id: { eq: $previousID }) {
      childMarkdownRemark {
        frontmatter {
          title
          oneline
          permalink
        }
      }
    }

    next: file(id: { eq: $nextID }) {
      childMarkdownRemark {
        frontmatter {
          title
          oneline
          permalink
        }
      }
    }
  }
`
