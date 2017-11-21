const path = require('path')
const fs = require('fs')
const glob = require('glob-promise')

const assetManifest = require(path.join(
  __dirname,
  '..',
  'build',
  'asset-manifest.json'
))

async function main() {
  const articleFiles = await glob(`${__dirname}/../articles/**`)
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

  fs.writeFileSync(path.join(__dirname, '..', 'build', '_headers'), toml)
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
