import React from 'react'
import Helmet from 'react-helmet'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { getArticle } from './crud/articles'

const ArticlesLoading = 'ArticlesLoading'
// const ArticlesError = 'ArticlesError'
const ArticlesLoaded = 'ArticlesLoaded'
const SuggestionsLoading = 'SuggestionsLoading'
const SuggestionsNotFound = 'SuggestionsNotFound'
const SuggestionsFound = 'SuggestionsFound'

class Suggestions extends React.Component {
  constructor(props, context) {
    super(props, context)
    this._isMounted = false
    this.state = {
      status: ArticlesLoading,
      suggestions: [],
      titles: []
    }
  }

  componentDidMount() {
    this._isMounted = true
    this.update()
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  componentWillReceiveProps() {
    this.update()
  }

  update = () => {
    const articleMap = new Map(
      Array.from(this.props.articleTitlesByPath.entries()).map(
        ([path, Title]) => [Title, path]
      )
    )
    this.setState(
      {
        articleMap,
        articleTitles: Array.from(articleMap.keys()),
        status: ArticlesLoaded
      },
      this.search
    )
  }

  search = () => {
    const originalQuery = this.props.query
    this.setState({ status: SuggestionsLoading }, () => {
      import('fuzzysort').then(fuzzysort => {
        if (this._isMounted === false) {
          return
        }
        if (originalQuery !== this.props.query) {
          return
        }
        const transformedQuery = (this.props.query || '').replace(/[-_.]/g, '')
        fuzzysort
          .goAsync(transformedQuery, this.state.articleTitles, { limit: 20 })
          .then(results => {
            if (this._isMounted === false) {
              return
            }
            if (results.length > 0) {
              getArticle(this.state.articleMap.get(results[0].target))
            }
            const isOnFastConnection =
              navigator.connection &&
              navigator.connection.downlink >= 5 &&
              navigator.connection.downlink <= 50
            if (isOnFastConnection) {
              results
                .slice(1, 10)
                .forEach(result =>
                  getArticle(this.state.articleMap.get(result.target))
                )
            }
            this.setState(
              {
                suggestions: results,
                status:
                  results.length > 0 ? SuggestionsFound : SuggestionsNotFound
              },
              () => {
                const articlePath = this.props.match.params.articlePath
                const alreadyThere =
                  this.state.suggestions.length > 0 &&
                  articlePath ===
                    this.state.articleMap.get(this.state.suggestions[0].target)

                const hasSingleSuggestion =
                  this.state.suggestions.length === 1 &&
                  articlePath !==
                    this.state.articleMap.get(this.state.suggestions[0].target)
                const hasOutlier =
                  this.state.suggestions.length > 1 &&
                  this.state.suggestions[0].score > -100 &&
                  this.state.suggestions[1].score < -15000

                if (
                  alreadyThere === false &&
                  (hasSingleSuggestion || hasOutlier)
                ) {
                  this.context.router.history.push(
                    this.state.articleMap.get(this.state.suggestions[0].target)
                  )
                }
              }
            )
          })
      })
    })
  }

  render() {
    switch (this.state.status) {
      case SuggestionsNotFound:
        return (
          <article className="article" id="article">
            <div className="article-inner">
              <div className="article-inner-inner">
                <div id="asides" />
                <div className="article-content">
                  <div className="article-content-inner">
                    <h1>Not found</h1>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
      case ArticlesLoading:
      case SuggestionsLoading:
      case ArticlesLoaded:
      default:
        const suggestions = this.state.suggestions.map(suggestion => {
          const title = suggestion.target.split('').map((character, index) => {
            return suggestion.indexes.includes(index) ? (
              <strong key={index}>{character}</strong>
            ) : (
              <span key={index}>{character}</span>
            )
          })
          return (
            <li key={suggestion.target}>
              <Link to={this.state.articleMap.get(suggestion.target)}>
                {title}
              </Link>
            </li>
          )
        })
        return (
          <article className="article" id="article">
            <Helmet>
              <title>{`${this.props.query} - ${
                process.env.REACT_APP_SITE_TITLE
              } Search`}</title>
              <meta name="robots" content="noindex" />
            </Helmet>
            <div className="article-inner">
              <div className="article-inner-inner">
                <div id="asides" />
                <div className="article-content">
                  <div className="article-content-inner">
                    <h1>Perhaps you are looking for...</h1>
                    <div id="article-content">{suggestions}</div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
    }
  }
}

Suggestions.contextTypes = {
  router: PropTypes.shape({
    history: PropTypes.object.isRequired
  })
}

export default Suggestions
