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
const axios = require('axios').create({
  timeout: 10000
})
const parseLinkHeader = require('parse-link-header')
const shuffle = require('lodash/shuffle')

// const progressBar = new progress.Bar({}, progress.Presets.shades_classic)

// const articleAliases = require('../public/article-aliases.json')
const badLinkCounts = new Map()

const articlesPaths = new Set(articles.map(([path]) => path))

let badLinks = 0
let distinctBadLinks = 0
let badExternalLinkFound = false

async function main() {
  const articleFiles = await glob(`${__dirname}/../articles/**`)

  // progressBar.start(articleFiles.length, 0)
  for (articleFile of shuffle(articleFiles)) {
    const fileStats = fs.lstatSync(articleFile)
    if (fileStats.isFile() === false) {
      continue
    }
    console.log(`${articleFile}\n`)
    // progressBar.increment()
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

    const links = []
    $('a').each(function(i, a) {
      const href = $(this).attr('href')
      if (href && isExternalLink(href)) {
        links.push([$(this).text(), $(this).attr('href')])
      }
    })

    for (let [textContent, href] of links) {
      let response
      console.log(`  ${textContent}`)
      // console.log(href)
      try {
        response = await axios.get(href)
        // console.log('response')
        if (response.headers && response.headers.link) {
          const parsedLinks = parseLinkHeader(response.headers.link)
          if (
            parsedLinks &&
            parsedLinks.canonical &&
            parsedLinks.canonical.url
          ) {
            if (parsedLinks.canonical.url !== href) {
              console.log(color.blue(`  old: ${href}`))
              href = parsedLinks.canonical.url
            }
          }
        }
        console.log(color.green(`  ${response.status}: ${href}`))
      } catch (response) {
        if (
          typeof response === 'object' &&
          response.response &&
          response.response.status
        ) {
          console.log(color.red(`  ${response.response.status}: ${href}`))
        } else {
          console.log(color.red(`  Error: ${href}`))
        }
        badExternalLinkFound = true
      }
      console.log('')
    }
    if (badExternalLinkFound) {
      process.exit(0)
    }
  }
  // progressBar.stop()
  console.log(
    Array.from(badLinkCounts.entries())
      .sort((a, b) => (a[1] > b[1] ? -1 : 1))
      .map(([link, count]) => link)
      // .slice(0, 1200)
      .join(', ')
  )
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})

function isAnchor(href) {
  return href.startsWith('#')
}

function isExternalLink(href) {
  return /^https?:\/\//.test(href) || href.substr(0, 2) === '//'
}
