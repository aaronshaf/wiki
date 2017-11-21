import React from 'react'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

export default class Sitemap extends React.Component {
  render() {
    const articles = Array.from(
      this.props.articleTitlesByPath.entries()
    ).map(([path, title]) => {
      return (
        <li key={path}>
          <Link className="nav-link" to={path}>
            {title}
          </Link>
        </li>
      )
    })
    return (
      <article className="article" id="article">
        <Helmet>
          <title>{`Sitemap`}</title>
        </Helmet>
        <div className="article-inner">
          <div className="article-inner-inner">
            <div id="asides" />
            <div className="article-content">
              <div className="article-content-inner">
                <h1>Sitemap</h1>
                <ul>{articles}</ul>
              </div>
            </div>
          </div>
        </div>
      </article>
    )
  }
}
