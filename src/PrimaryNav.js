import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import './PrimaryNav.css'

class PrimaryNav extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      searchQuery: this.props.match.params.articlePath
    }
  }

  handleSearchChange = event => {
    const shouldRedirect =
      event.target.value !== this.props.match.params.articlePath
    // TODO: don't redirect if we already only have one match
    if (shouldRedirect) {
      this.context.router.history.push(event.target.value || '')
    }
  }

  setInputRef = node => {
    if (node instanceof HTMLElement) {
      this.input = node
    }
  }

  render() {
    return (
      <nav className="PrimaryNav primary-header app-navbar">
        <div className="PrimaryNav--first-column">
          <Link className="PrimaryNav-site-title" to="/">
            {process.env.REACT_APP_SITE_TITLE || 'Untitled Site'}
          </Link>
        </div>
        <form action="https://www.google.com/search">
          <input
            type="hidden"
            name="sitesearch"
            value={process.env.PUBLIC_URL}
          />
          <input
            className="Navbar-search-input"
            name="q"
            onChange={this.handleSearchChange}
            placeholder="Search"
            ref={this.setInputRef}
            type="search"
          />
        </form>
      </nav>
    )
  }
}

PrimaryNav.contextTypes = {
  router: PropTypes.shape({
    history: PropTypes.object.isRequired
  })
}

export default PrimaryNav
