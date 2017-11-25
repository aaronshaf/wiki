import './minimal.css'

function main() {
  const articlePath = window.location.pathname.substr(1) || 'main-page'
  const url = `/articles/${articlePath}.json`

  function reqListener() {
    if (this.status === 200 && this.responseText.substr(0, 1) === '{') {
      const json = JSON.parse(this.responseText)
      document
        .getElementsByClassName('article-content-inner')
        .item(0).innerHTML =
        json.html
      const asidesHtml = json.asides
        .map(aside => `<aside class="aside">${aside}</aside>`)
        .join('')
      document
        .getElementsByClassName('article-primary-asides')
        .item(0).innerHTML = asidesHtml
      window.WIKI_PRELOAD = {
        articlePath,
        json
      }
    }

    if (typeof Promise === 'undefined') {
      console.error('Promise not supported')
    }
    const isPolyfillNeeded =
      typeof Map === 'undefined' ||
      typeof Map.prototype.entries === 'undefined' ||
      typeof Object.prototype.entries === 'undefined'
    Promise.all([
      isPolyfillNeeded ? import('babel-polyfill') : Promise.resolve()
    ])
      .then(() => import('./load'))
      .catch(error => {
        console.error(error)
      })
  }

  var oReq = new XMLHttpRequest()
  oReq.addEventListener('load', reqListener)
  oReq.open('GET', url)
  oReq.withCredentials = true
  oReq.send()
}

main()
