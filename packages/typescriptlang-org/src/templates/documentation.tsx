import React, { useRef } from "react"
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
import { DislikeUnfilledSVG, LikeUnfilledSVG } from "../components/svgs/documentation"
import Helmet from "react-helmet"
import { useDocumentationPage } from "./hooks/useDocumentationPage"
import { useTableOfContents } from "./hooks/useTableOfContents"
import { useTwoslashHighlight } from "./hooks/useTwoslashHighlight"
import {
  DocumentationPageContext,
  DocumentationRenderablePost,
  TableOfContentsItem,
} from "./utils/documentationPage"

type Props = {
  pageContext: DocumentationPageContext
  data: GatsbyTypes.GetDocumentBySlugQuery
  path: string
}

type DocumentationNoticeProps = {
  title: string
  description: React.ReactNode
  action?: React.ReactNode
}

const DocumentationNotice = ({ title, description, action }: DocumentationNoticeProps) => {
  return (
    <div id="deprecated-header">
      <div id="deprecated-content">
        <div id="deprecated-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="black" /><path d="M8 3V9" stroke="black" /><path d="M8 11L8 13" stroke="black" /></svg>
        </div>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {action && <div id="deprecated-action">{action}</div>}
    </div>
  )
}

const TableOfContentsTree = (props: { items: TableOfContentsItem[]; className?: string }) => {
  return (
    <ul className={props.className}>
      {props.items.map(item => (
        <li key={item.id}>
          <a href={"#" + item.id}>{item.value}</a>
          {item.children.length ? <TableOfContentsTree items={item.children} /> : null}
        </li>
      ))}
    </ul>
  )
}

const HandbookTemplate: React.FC<Props> = props => {
  const post = props.data.markdownRemark
  if (!post) {
    console.log("Could not render:", JSON.stringify(props))
    return <div></div>
  }

  if (!post.frontmatter) throw new Error(`No front-matter found for the file with props: ${props}`)
  if (!post.html) throw new Error(`No html found for the file with props: ${props}`)

  const renderablePost = post as DocumentationRenderablePost
  const i = createInternational<typeof handbookCopy>(useIntl())
  const IntlLink = createIntlLink(props.pageContext.lang)
  const navigation = getDocumentationNavForLanguage(props.pageContext.lang)
  const markdownRef = useRef<HTMLDivElement>(null)

  const { deprecationURL, description, prefix, selectedID, showExperimental, title } = useDocumentationPage(
    renderablePost,
    props.pageContext,
    i as any
  )
  const { items: tableOfContentsItems, showTableOfContents } = useTableOfContents(
    renderablePost.headings as any,
    renderablePost.frontmatter.disable_toc
  )
  const { markdownHtml } = useTwoslashHighlight(markdownRef, renderablePost.html)

  return (
    <Layout title={`${prefix} - ${title}`} description={description} lang={props.pageContext.lang} skipToAnchor="#handbook-content">
      <section id="doc-layout">
        <SidebarToggleButton />

        <div className="page-popup" id="page-helpful-popup" role="status" aria-live="polite" style={{ opacity: 0, display: "none" }}>
          <p>Was this page helpful?</p>
          <div>
            <button className="first" id="like-button-popup" title="Like this page"><LikeUnfilledSVG /></button>
            <button id="dislike-button-popup" title="Dislike this page"><DislikeUnfilledSVG /></button>
          </div>
        </div>

        <noscript>
          <style dangerouslySetInnerHTML={{
            __html: `
          nav#sidebar > ul > li.closed ul {
            display: block !important;
           }
        ` }} />
        </noscript>

        <Sidebar navItems={navigation} selectedID={selectedID} />
        <div id="handbook-content" role="article">
          {deprecationURL &&
            <>
              <Helmet>
                <link rel="canonical" href={`https://www.typescriptlang.org${renderablePost.frontmatter.deprecated_by}`} />
              </Helmet>
              <DocumentationNotice
                title={i("handb_deprecated_title")}
                description={<>{i("handb_deprecated_subtitle")}<IntlLink className="deprecation-redirect-link" to={deprecationURL}>{i("handb_deprecated_subtitle_link")}</IntlLink></>}
                action={<IntlLink className="deprecation-redirect-link" to={deprecationURL}>{i("handb_deprecated_subtitle_action")}</IntlLink>}
              />
            </>
          }

          {showExperimental &&
            <DocumentationNotice
              title={i("handb_experimental_title")}
              description={i("handb_experimental_subtitle")}
            />
          }

          <h1>{title}</h1>
          {renderablePost.frontmatter.preamble && <div className="preamble" dangerouslySetInnerHTML={{ __html: renderablePost.frontmatter.preamble }} />}
          <article>
            <div className="whitespace raised">
              <div ref={markdownRef} className="markdown" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
            </div>
            {showTableOfContents &&
              <aside className="handbook-toc">
                <nav className={deprecationURL ? "deprecated" : ""} aria-label="table of contents">
                  <h5>{i("handb_on_this_page")}</h5>
                  <TableOfContentsTree items={tableOfContentsItems} className="handbook-on-this-page-section-list" />
                  <div id="like-dislike-subnav" role="status" aria-live="polite">
                    <h5>{i("handb_like_dislike_title")}</h5>
                    <div>
                      <button title="Like this page" id="like-button"><LikeUnfilledSVG /> {i("handb_like_desc")}</button>
                      <button title="Dislike this page" id="dislike-button"><DislikeUnfilledSVG /> {i("handb_dislike_desc")}</button>
                    </div>
                  </div>
                </nav>
              </aside>
            }
          </article>

          <NextPrev next={props.data.next as any} prev={props.data.prev as any} i={i} IntlLink={IntlLink as any} />
          <Contributors lang={props.pageContext.lang} i={i} path={props.pageContext.repoPath} lastEdited={props.pageContext.modifiedTime} />
        </div>
      </section>
    </Layout>
  )
}

export default (props: Props) => <Intl locale={props.pageContext.lang}><HandbookTemplate {...props} /></Intl>

export const pageQuery = graphql`
  query GetDocumentBySlug($slug: String!, $previousID: String, $nextID: String) {    
    markdownRemark(frontmatter: { permalink: {eq: $slug}}) {
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

    prev: file(id: { eq: $previousID } ) {
      childMarkdownRemark  {
        frontmatter {
          title
          oneline
          permalink
        }
      }
    }

    next: file(id: { eq: $nextID } ) {
      childMarkdownRemark  {
        frontmatter {
          title
          oneline
          permalink
        }
      }
    }
  }
`
