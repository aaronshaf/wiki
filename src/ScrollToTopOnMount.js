import React from 'react'

export default class ScrollToTopOnMount extends React.Component {
  componentDidMount(prevProps) {
    const element = document.querySelector('.article-inner')
    if (typeof element.scrollTo === 'function') {
      element.scrollTo(0, 0)
    } else {
      element.scrollTop = 0
      element.scrollLeft = 0
    }
  }

  render() {
    return null
  }
}
