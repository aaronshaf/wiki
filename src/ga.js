;(function(i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r
  i[r] =
    i[r] ||
    function() {
      ;(i[r].q = i[r].q || []).push(arguments)
    }
  i[r].l = 1 * new Date()
  a = s.createElement(o)
  m = s.getElementsByTagName(o)[0]
  a.async = 1
  a.src = g
  m.parentNode.insertBefore(a, m)
})(
  window,
  document,
  'script',
  'https://www.google-analytics.com/analytics.js',
  'ga'
)

const ga = window.ga

ga('create', process.env.REACT_APP_GA, 'auto')
ga('set', 'forceSSL', true)
ga(
  'set',
  'hostname',
  process.env.PUBLIC_URL.replace('http://', '').replace('https://', '')
)

export default ga
