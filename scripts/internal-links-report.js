const path = require('path')
const fs = require('fs')
const glob = require('glob-promise')
const articles = require('../public/articles.json')
const matter = require('gray-matter')
const remark = require('remark')
const recommended = require('remark-preset-lint-recommended')
const remarkHtml = require('remark-html')
const cheerio = require('cheerio')
const color = require('cli-color')
const progress = require('cli-progress')
const artices = require('../build/articles.json')

const progressBar = new progress.Bar({}, progress.Presets.shades_classic)

// const articleAliases = require('../public/article-aliases.json')
const badLinkCounts = new Map()

const articlesPaths = new Set(articles.map(([path]) => path))

let badLinks = 0
let distinctBadLinks = 0

async function main() {
  const articleFiles = await glob(`${__dirname}/../articles/**`)
  progressBar.start(articleFiles.length, 0)
  for (articleFile of articleFiles) {
    progressBar.increment()
    const fileStats = fs.lstatSync(articleFile)
    if (fileStats.isFile() === false) {
      continue
    }
    // console.log(articleFile)
    const fileContent = fs.readFileSync(articleFile, { encoding: 'utf8' })
    const matterResult = matter(fileContent)
    let content = matterResult.content
    const html = await new Promise((resolve, reject) => {
      remark()
        .use(recommended)
        .use(remarkHtml)
        .process(matterResult.content, (err, result) => {
          if (err != null) {
            console.error(report(err))
            reject(err)
          } else {
            resolve(result)
          }
        })
    })
    const $ = cheerio.load(html.contents)

    $('a').each(function(i, a) {
      const href = $(this)
        .attr('href')
        .split('#')[0]
      if (href && isLocalLink(href)) {
        //  && isAnchor(href) === false
        const lowerHref = href.toLowerCase()
        if (articlesPaths.has(href) === false) {
          badLinks++
          // console.log(color.red(`${href}`))
          if (badLinkCounts.has(href)) {
            badLinkCounts.set(href, badLinkCounts.get(href) + 1)
          } else {
            badLinkCounts.set(href, 1)
            distinctBadLinks++
          }
        }
      }
    })
  }
  progressBar.stop()
  console.log(
    Array.from(badLinkCounts.entries())
      .sort((a, b) => (a[1] > b[1] ? -1 : 1))
      .map(([link, count]) => link)
      // .slice(0, 1200)
      .join(', ')
  )
  console.log(`Total bad links: ${distinctBadLinks} / ${badLinks}`)
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})

function isAnchor(href) {
  return href.startsWith('#')
}

function isLocalLink(href) {
  return (/^https?:\/\//.test(href) || href.substr(0, 2) === '//') === false
}
