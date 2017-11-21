const path = require('path')
const fs = require('fs')

const articles = require('../public/articles.json')
const aliases = require('../public/article-aliases.json')

async function main() {
  const articleRedirectText = articles
    .map(([path, title]) => `/${path} /index.html 200`)
    .join('\n')

  const aliasRedirectText = aliases
    .filter(([to, froms]) => froms && froms.length > 0)
    .map(([to, froms]) => froms.map(from => `/${from} /${to} 302`).join('\n'))
    .join('\n')

  fs.writeFileSync(
    path.join(__dirname, '..', 'build', '_redirects'),
    `/    /index.html   200

${articleRedirectText}

${aliasRedirectText}

/articles/* /404.html 404

/*    /index.html   404`
  )
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
