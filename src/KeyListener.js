import { Component } from 'react'
import PropTypes from 'prop-types'
import random from 'lodash/random'

class KeyListener extends Component {
  componentDidMount() {
    window.addEventListener('keypress', this.handleKeyPress)
  }

  componentWillUnmount() {
    window.removeEventListener('keypress', this.handleKeyPress)
  }

  handleKeyPress = event => {
    const input = document.querySelector('.Navbar-search-input')
    if (event.target === input) {
      return
    }
    switch (event.key) {
      case 'r':
        const entries = Array.from(this.props.articleTitlesByPath.entries())
        const [articlePath] = entries[random(0, entries.length - 1)]
        this.context.router.history.push(articlePath)
        break
      case '/':
        console.debug('/')
        input.focus()
        event.preventDefault()
        break
      default:
        break
    }
  }

  render() {
    return null
  }
}

KeyListener.contextTypes = {
  router: PropTypes.shape({
    history: PropTypes.object.isRequired
  })
}

export default KeyListener
