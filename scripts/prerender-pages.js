const fs = require('fs')
const path = require('path')
const express = require('express')
const serveStatic = require('serve-static')
const articles = require('../build/articles.json')
const puppeteer = require('puppeteer')
const glob = require('glob-promise')
const sortBy = require('lodash/sortBy')
const reverse = require('lodash/reverse')
const mkdirp = require('mkdirp-promise')
// const sleep = require('sleep-promise')

const PORT = 3001

const app = express()
app.use((req, res, next) => {
  if (path.extname(req.path) === '') {
    res.send(
      fs.readFileSync(path.join(__dirname, '..', 'build', 'index.html'), 'utf8')
    )
  } else {
    next()
  }
})
app.use(
  serveStatic(path.join(__dirname, '..', 'build'), {
    index: ['index.html'],
    extensions: ['html']
  })
)
const server = app.listen(PORT)

async function main() {
  await mkdirp(path.join(__dirname, '..', '.prerender-cache'))

  try {
    const browser = await puppeteer.launch({
      // dumpio: true
    })
    const page = await browser.newPage()
    const basePath = `http://localhost:${PORT}`
    // page.setRequestInterceptionEnabled(true)
    // page.on('request', async interceptedRequest => {
    // if (
    //   interceptedRequest.url.endsWith('.png') ||
    //   interceptedRequest.url.endsWith('.jpg')
    // )
    //   interceptedRequest.abort()
    // else interceptedRequest.continue()
    // console.log(request.resourceType)
    // await interceptedRequest.continue()
    // return
    // if (
    //   ['image', 'font', 'stylesheet'].includes(
    //     interceptedRequest.resourceType.toLowerCase()
    //   )
    // ) {
    //   await interceptedRequest.abort()
    // } else if (interceptedRequest.url.startsWith(basePath) === false) {
    //   await interceptedRequest.abort()
    // } else {
    //   await interceptedRequest.continue()
    // }
    // })

    // TODO: with through every file in .prerender-cache, check to see if it
    // corresponds with a markdown files

    const _articleFiles = await glob(`${__dirname}/../articles/**`)
    const articleFiles = _articleFiles.filter(articlePath => {
      const fileStats = fs.lstatSync(articlePath)
      return fileStats.isFile()
    })
    const articleFilesWithModifiedDate = articleFiles.map(articlePath => {
      const markdownMtime = fs.lstatSync(articlePath).mtime
      return {
        articlePath,
        markdownMtime
      }
    })

    const sortedArticleFiles = reverse(
      sortBy(articleFilesWithModifiedDate, ['mtime', 'name'])
    )

    let numberOfArticlesRendered = 0
    for (const { articlePath, markdownMtime } of sortedArticleFiles) {
      const basename = path.basename(articlePath, '.md')
      let shouldPrerender = false
      const prerenderFile = path.join(
        __dirname,
        '..',
        '.prerender-cache',
        `${basename}.html`
      )

      // If the file doesn't exist
      if (fs.existsSync(prerenderFile) == false) {
        shouldPrerender = true
      } else {
        const prerenderMtime = fs.lstatSync(articlePath).mtime
        // If the prerender-cache is too old
        if (prerenderMtime < markdownMtime) {
          shouldPrerender = true
        }
      }
      if (shouldPrerender == false) {
        continue
      }
      numberOfArticlesRendered++
      if (numberOfArticlesRendered > 50) {
        continue
      }

      process.stdout.write(`${basename} `)
      const goToUrl = `http://localhost:${PORT}/${
        basename === 'main-page' ? '' : basename
      }`
      await page.goto(goToUrl, {
        waitUntil: ['networkidle2']
      })
      await page
        .mainFrame()
        .waitForSelector('.article-content-inner--rendered', {
          timeout: 5000
        })

      const content = await page.content()
      fs.writeFileSync(
        `${path.join(
          __dirname,
          '..',
          '.prerender-cache',
          basename === 'main-page' ? 'index' : basename
        )}.html`,
        content
      )
    }
    await page.close()
  } catch (error) {
    console.log(error)
  }

  server.close()
  setTimeout(() => process.exit(0), 3000)
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
