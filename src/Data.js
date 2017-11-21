import React from 'react'

const ArticleDataNotLoading = 'ArticleDataNotLoading'
const ArticleDataLoading = 'ArticleDataLoading'
// const ArticleAliasesError = 'ArticleAliasesError'
const ArticleDataLoaded = 'ArticleDataLoaded'

export default class Data extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      articlePathsByAlias: new Map(),
      // articleHeadings: [],
      articleTitlesByPath: new Map(),
      status: ArticleDataNotLoading
    }
  }

  componentDidMount() {
    this.ensureAllArticlesLoaded()
  }

  ensureAllArticlesLoaded = () => {
    switch (this.state.status) {
      case ArticleDataLoaded:
        return Promise.resolve()
      case ArticleDataLoading:
        return this.loadArticleDataPromise
      case ArticleDataNotLoading:
        this.loadArticleDataPromise = this.loadArticleData()
        return this.loadArticleDataPromise
      default:
        throw new Error('unexpected state in <Data>')
    }
  }

  loadArticleData = async () => {
    this.setState({ status: ArticleDataLoading })

    const articleTitlesByPath = await fetch('/articles.json', {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    })
      .then(response => response.json())
      .catch(error => console.error({ error }))

    const articlePathsByAlias = await fetch('/article-aliases.json', {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    }).then(async response => {
      const articleAliasesByPath = await response.json()
      const articlePathsByAlias = articleAliasesByPath.reduce(
        (state, [path, aliases]) => {
          return state.concat(
            aliases instanceof Array ? aliases.map(alias => [alias, path]) : []
          )
        },
        []
      )
      return articlePathsByAlias
    })

    this.setState({
      articlePathsByAlias: new Map(articlePathsByAlias),
      articleTitlesByPath: new Map(articleTitlesByPath),
      status: ArticleDataLoaded
    })
  }

  render() {
    return this.props.render(
      this.ensureAllArticlesLoaded,
      this.state.articleTitlesByPath,
      this.state.articlePathsByAlias
    )
  }
}
