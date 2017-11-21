const path = require('path')
const tar = require('tar')
const request = require('request-promise-native')

async function main() {
  await request({
    uri: 'https://[[subdomain]].netlify.com/articles.tgz'
  })
  await tar.c(
    { gzip: true, file: path.join(__dirname, '..', 'build', 'articles.tgz') },
    ['.prerender-cache']
  )
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
