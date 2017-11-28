import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Helmet from 'react-helmet'
import ErrorBoundary from './ErrorBoundary'
import Article from './Article'
import Sitemap from './Sitemap'
import PrimaryNav from './PrimaryNav'
import Data from './Data'
import KeyListener from './KeyListener'
import './App.css'

class App extends Component {
  render() {
    return (
      <Data
        render={(
          ensureAllArticlesLoaded,
          articleTitlesByPath,
          articlePathsByAlias
        ) => (
          <Router>
            <div className="app">
              <Helmet>
                <title>{process.env.SITE_TITLE}</title>
                {/* <link
                  as="fetch"
                  href={`/articles/main-page.json`}
                  rel="prefetch"
                  type="application/json"
                />
                <link
                  as="fetch"
                  href={`/articles.json`}
                  rel="prefetch"
                  type="application/json"
                />
                />
                <link
                  as="fetch"
                  href={`/article-aliases.json`}
                  rel="prefetch"
                  type="application/json"
                /> */}
              </Helmet>
              <div className="app-inner">
                <Route path="/:articlePath?" component={PrimaryNav} />
                <KeyListener articleTitlesByPath={articleTitlesByPath} />
                <main className="app-container">
                  <ErrorBoundary>
                    <Switch>
                      <Route
                        render={() => (
                          <Sitemap
                            articlePathsByAlias={articlePathsByAlias}
                            articleTitlesByPath={articleTitlesByPath}
                            ensureAllArticlesLoaded={ensureAllArticlesLoaded}
                          />
                        )}
                        exact
                        path="/sitemap"
                      />
                      <Route
                        exact
                        path="/:articlePath?"
                        render={({ match }) => (
                          <Article
                            articlePathsByAlias={articlePathsByAlias}
                            articleTitlesByPath={articleTitlesByPath}
                            ensureAllArticlesLoaded={ensureAllArticlesLoaded}
                            match={match}
                          />
                        )}
                      />
                    </Switch>
                  </ErrorBoundary>
                </main>
              </div>
            </div>
          </Router>
        )}
      />
    )
  }
}

export default App
