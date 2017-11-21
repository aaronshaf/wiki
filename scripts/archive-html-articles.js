const path = require('path')
const tar = require('tar')

async function main() {
  await tar.c(
    { gzip: true, file: path.join(__dirname, '..', 'build', 'articles.tgz') },
    ['.prerender-cache']
  )
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
