const path = require('path')
const fs = require('fs')
const glob = require('glob-promise')

const assetManifest = require(path.join(
  process.cwd(),
  'build',
  'asset-manifest.json'
))

async function main() {
  const articleFiles = await glob(path.join(process.cwd(), 'articles', '**'))
  const articlesNames = articleFiles
    .filter(articleFile => fs.lstatSync(articleFile).isFile())
    .map(articleFile => path.basename(articleFile, '.md'))
  let toml =
    `/
  Link: </${assetManifest['main.js']}>; rel=preload; as=script
  Link: </${assetManifest['main.css']}>; rel=preload; as=style
  Link: <https://fonts.googleapis.com>; rel=preconnect; crossorigin
  Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin
` +
    articlesNames
      .map(
        articleName => `
/${articleName}
  Link: </${assetManifest['main.js']}>; rel=preload; as=script
  Link: </${assetManifest['main.css']}>; rel=preload; as=style
  Link: <https://fonts.googleapis.com>; rel=preconnect; crossorigin
  Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin
`
      )
      .join('')

  fs.writeFileSync(path.join(process.cwd(), 'build', '_headers'), toml)
}

const isParent = module.parent == null
if (isParent) {
  main()
} else {
  module.exports = main
}
