require('dotenv').config()

const path = require('path')
const fs = require('fs')
const glob = require('glob-promise')
const Sitemap = require('sitemap')

const SITE_URL = process.env.PUBLIC_URL
const ONE_DAY = 86400

async function main() {
  const urls = [
    {
      url: '/',
      changefreq: 'weekly',
      priority: 0.8,
      lastmodrealtime: true,
      lastmodfile: path.join(__dirname, '..', 'articles/main-page.md')
    }
  ]

  const articleFiles = await glob(`${__dirname}/../articles/**`)
  for (articleFile of articleFiles) {
    const fileStats = fs.lstatSync(articleFile)
    if (fileStats.isFile() === false) {
      continue
    }
    const name = path.basename(articleFile, '.md')
    urls.push({
      url: `/${name}`,
      changefreq: 'weekly',
      priority: 0.5,
      lastmodrealtime: true,
      lastmodfile: articleFile
    })
  }

  const sitemap = Sitemap.createSitemap({
    hostname: SITE_URL,
    cacheTime: ONE_DAY,
    urls
  })
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'sitemap.xml'),
    sitemap.toString()
  )
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
