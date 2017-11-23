const path = require('path')
const fs = require('fs')

async function main() {
  const articles = require(path.join(process.cwd(), 'public', 'articles.json'))
  const aliases = require(path.join(
    process.cwd(),
    'public',
    'article-aliases.json'
  ))

  const articleRedirectText = articles
    .map(([path, title]) => `/${path} /index.html 200`)
    .join('\n')

  const aliasRedirectText = aliases
    .filter(([to, froms]) => froms && froms.length > 0)
    .map(([to, froms]) => froms.map(from => `/${from} /${to} 302`).join('\n'))
    .join('\n')

  fs.writeFileSync(
    path.join(process.cwd(), 'build', '_redirects'),
    `/    /index.html   200

${articleRedirectText}

${aliasRedirectText}

/articles/* /404.html 404

/*    /index.html   404`
  )
}

const isParent = module.parent == null
if (isParent) {
  main()
} else {
  module.exports = main
}
