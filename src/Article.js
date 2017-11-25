import React from 'react'
import Helmet from 'react-helmet'
import PropTypes from 'prop-types'
import Suggestions from './Suggestions'
import ScrollToTopOnMount from './ScrollToTopOnMount'
import Spinner from './Spinner'
import { isArticleReady, getArticle } from './crud/articles'

const ArticleLoading = 'ArticleLoading'
const ArticleNotFound = 'ArticleNotFound'
const ArticleLoaded = 'ArticleLoaded'

class Article extends React.PureComponent {
  constructor(props, context) {
    super(props, context)

    const isCurrentArticlePreloaded =
      window.WIKI_PRELOAD &&
      window.WIKI_PRELOAD.articlePath &&
      this.props.match.params.articlePath === window.WIKI_PRELOAD.articlePath
    console.log({ isCurrentArticlePreloaded })
    if (isCurrentArticlePreloaded) {
      const article = window.WIKI_PRELOAD.json
      this.state = {
        asides: article.asides,
        html: article.html,
        title: article.title,
        status: ArticleLoaded
      }
    } else {
      this.state = {
        asides: [],
        status: ArticleLoading,
        html: '',
        title: ''
      }
    }
  }

  componentDidUpdate(prevProps) {
    const pathChanged =
      prevProps.match.params.articlePath !== this.props.match.params.articlePath
    if (pathChanged) {
      this.loadPage(this.props)
    }
    this.updateActiveLinks()
  }

  updateActiveLinks() {
    const links = Array.from(document.querySelectorAll('.article-inner a'))
    links.forEach(a => {
      const isLinkActive =
        a.getAttribute('href') === this.props.match.params.articlePath
      if (isLinkActive) {
        a.classList.add('active')
      } else {
        a.classList.remove('active')
      }
    })
  }

  componentDidMount() {
    this.loadPage(this.props)
    this.div.addEventListener('pointerdown', this.handlePreload)
    this.updateActiveLinks()
  }

  componentWillUnmount() {
    this.div.removeEventListener('pointerdown', this.handlePreload)
  }

  async loadPage(props) {
    const articlePath = props.match.params.articlePath || 'main-page'
    const shouldRedirect =
      this.props.articleTitlesByPath.has(articlePath) === false &&
      this.props.articlePathsByAlias.has(articlePath)
    if (shouldRedirect) {
      this.context.router.history.push(
        this.props.articlePathsByAlias.get(articlePath)
      )
      return
    }

    const isNotFound =
      this.props.articleTitlesByPath.size > 0 &&
      this.props.articleTitlesByPath.has(articlePath) === false

    if (isNotFound) {
      return this.notFound()
    }

    // TODO: don't go into loading state if article immediately available

    if (isArticleReady(articlePath)) {
      return this.loadPage2(articlePath)
    }

    if (this.props.articleTitlesByPath.has(articlePath)) {
      this.setState(
        {
          status: ArticleLoading,
          title: this.props.articleTitlesByPath.get(articlePath),
          // html: ''
          asides: []
        },
        () => this.loadPage2(articlePath)
      )
    } else {
      this.setState(
        {
          status: ArticleLoading,
          title: '',
          html: '',
          asides: []
        },
        () => this.loadPage2(articlePath)
      )
    }
  }

  loadPage2 = async articlePath => {
    const article = await getArticle(articlePath)
    const updatedArticlePath =
      this.props.match.params.articlePath || 'main-page'
    if (updatedArticlePath !== articlePath) {
      return
    }
    if (article == null) {
      this.notFound()
    } else {
      this.setState(
        {
          asides: article.asides,
          html: article.html,
          title: article.title,
          status: ArticleLoaded
        },
        () => {
          if (window.location.hostname.indexOf('localhost') !== 0) {
            import('./ga').then(({ default: ga }) => {
              ga('send', {
                hitType: 'pageview',
                page: window.location.pathname,
                title: article.title
              })
            })
          }
          const element = document.querySelector('.article-inner')
          if (typeof element.scrollTo === 'function') {
            element.scrollTo(0, 0)
          } else {
            element.scrollTop = 0
            element.scrollLeft = 0
          }
        }
      )
    }
  }

  notFound = async () => {
    const articlePath = this.props.match.params.articlePath
    await this.props.ensureAllArticlesLoaded()

    const shouldRedirect =
      this.props.articleTitlesByPath.has(articlePath) === false &&
      this.props.articlePathsByAlias.has(articlePath)
    if (shouldRedirect) {
      this.context.router.history.push(
        this.props.articlePathsByAlias.get(articlePath)
      )
    } else {
      this.setState({ status: ArticleNotFound })
    }
  }

  handleClick = event => {
    if (event.target.nodeName === 'A') {
      if (event.metaKey === true || event.shiftKey === true) {
        return
      }
      const href = event.target.getAttribute('href')
      const isExternalLink =
        /^https?:\/\//.test(href) || href.substr(0, 2) === '//'
      if (isExternalLink) {
        return false
      }
      const parser = document.createElement('a')
      parser.href = href
      const pathnameWithoutSlash =
        parser.pathname.indexOf('/') === 0
          ? parser.pathname.substr(1)
          : parser.pathname

      if (this.props.articlePathsByAlias.has(pathnameWithoutSlash)) {
        event.preventDefault()
        this.context.router.history.push(
          this.props.articlePathsByAlias.get(pathnameWithoutSlash)
        )
      } else if (this.props.articleTitlesByPath.has(pathnameWithoutSlash)) {
        event.preventDefault()
        this.context.router.history.push(pathnameWithoutSlash)
      }
    }
  }

  handlePreload = event => {
    const isOverLink = event.target.nodeName === 'A'
    if (isOverLink) {
      const href = event.target.getAttribute('href')
      const isExternalLink =
        /^https?:\/\//.test(href) || href.substr(0, 2) === '//'
      if (isExternalLink) {
        return false
      }
      const parser = document.createElement('a')
      parser.href = href
      const pathnameWithoutSlash =
        parser.pathname.indexOf('/') === 0
          ? parser.pathname.substr(1)
          : parser.pathname

      if (this.props.articlePathsByAlias.has(pathnameWithoutSlash)) {
        getArticle(this.props.articlePathsByAlias.get(pathnameWithoutSlash))
      } else if (this.props.articleTitlesByPath.has(pathnameWithoutSlash)) {
        getArticle(pathnameWithoutSlash)
      }
    }
  }

  setDivRef = node => {
    if (node instanceof HTMLElement) {
      this.div = node
    }
  }

  render() {
    const siteTitleWithDescription = `${process.env.REACT_APP_SITE_TITLE} | ${
      process.env.REACT_APP_SITE_DESCRIPTION
    }`
    const fullTitle = this.props.match.params.articlePath
      ? `${this.state.title} | ${process.env.REACT_APP_SITE_TITLE}`
      : siteTitleWithDescription

    switch (this.state.status) {
      case ArticleNotFound:
        return (
          <Suggestions
            articlePathsByAlias={this.props.articlePathsByAlias}
            articleTitlesByPath={this.props.articleTitlesByPath}
            match={this.props.match}
            query={this.props.match.params.articlePath}
          />
        )
      case ArticleLoading: {
        const asides = this.state.asides.map((aside, index) => (
          <aside
            className="aside"
            dangerouslySetInnerHTML={{ __html: aside }}
            key={index}
          />
        ))
        console.log('ArticleLoading')
        return (
          <div className="article" id="article" ref={this.setDivRef}>
            <Helmet>
              <title>{fullTitle}</title>
              <link
                href={`${process.env.PUBLIC_URL}/${
                  this.props.match.params.articlePath
                }`}
                rel="canonical"
              />
            </Helmet>
            <div className="article-inner">
              <div className="article-inner-inner">
                <div className="article-content">
                  <article className="article-content-inner">
                    <h1>{this.state.title}</h1>
                    <p>
                      <Spinner />
                    </p>
                  </article>
                </div>
                <div id="asides" className="article-primary-asides">
                  {asides}
                </div>
                <div className="article-secondary-asides" />
              </div>
            </div>
          </div>
        )
      }
      case ArticleLoaded: {
        const asides = this.state.asides.map((aside, index) => (
          <aside
            className="aside"
            dangerouslySetInnerHTML={{ __html: aside }}
            key={index}
          />
        ))

        return (
          <div className="article" id="article" ref={this.setDivRef}>
            <ScrollToTopOnMount />
            <Helmet>
              <title>{fullTitle}</title>
              <link
                href={`${process.env.PUBLIC_URL}/${
                  this.props.match.params.articlePath
                }`}
                rel="canonical"
              />
            </Helmet>
            <div className="article-inner">
              <div
                className="article-inner-inner"
                onClick={this.handleClick}
                onMouseMove={this.handlePreload}
                onTouchStart={this.handlePreload}
              >
                <div className="article-content">
                  <article
                    className="article-content-inner article-content-inner--rendered"
                    dangerouslySetInnerHTML={{
                      __html: this.state.html
                    }}
                  />
                </div>
                <div id="asides" className="article-primary-asides">
                  {asides}
                </div>
                <div className="article-secondary-asides" />
              </div>
            </div>
          </div>
        )
      }
      default:
        break
    }
  }
}

Article.contextTypes = {
  router: PropTypes.shape({
    history: PropTypes.object.isRequired
  })
}

export default Article
