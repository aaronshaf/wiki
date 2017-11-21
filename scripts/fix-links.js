const path = require('path')
const fs = require('fs')
const glob = require('glob-promise')
const matter = require('gray-matter')
const remark = require('remark')
const recommended = require('remark-preset-lint-recommended')
const remarkHtml = require('remark-html')
const cheerio = require('cheerio')
const articles = require('../public/articles.json')
const articleAliasesByPath = require('../public/article-aliases.json')
const omit = require('lodash/omit')
const pickBy = require('lodash/pickBy')
const identity = require('lodash/identity')
const yaml = require('js-yaml')
const fuzzysort = require('fuzzysort')
const inquirer = require('inquirer')

const articleTitlesByPath = new Map(articles)
const articleTitles = Array.from(articleTitlesByPath.keys())
const articlesPaths = new Set(articles.map(([path]) => path))

const cachedReplacements = new Map()
const pathsToSkip = new Set()

const _articlePathsByAlias = articleAliasesByPath.reduce(
  (state, [path, aliases]) => {
    return state.concat(
      aliases instanceof Array ? aliases.map(alias => [alias, path]) : []
    )
  },
  []
)
const articlePathsByAlias = new Map(_articlePathsByAlias)
// const articleAliases = Array.from(articlePathsByAlias.keys())

async function main() {
  const articleFiles = await glob(`${__dirname}/../asides/**`)
  for (articleFile of articleFiles) {
    const fileStats = fs.lstatSync(articleFile)
    if (fileStats.isFile() === false) {
      continue
    }
    const fileContent = fs.readFileSync(articleFile, { encoding: 'utf8' })
    const matterResult = matter(fileContent)
    const matterResultWithoutContent = pickBy(
      omit(matterResult, ['content']),
      identity
    )
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
      links.push([$(this).text(), $(this).attr('href')])
    })

    for (const [textContent, href] of links) {
      if (isLocalLink(href)) {
        const lowerHref = href.toLowerCase()
        if (articlesPaths.has(href)) {
          // console.log(`Found: ${href}`)
        } else if (pathsToSkip.has(href)) {
          console.log(`Skipping ${href}`)
        } else if (articlesPaths.has(lowerHref)) {
          console.log(`${href} --> ${lowerHref}`)
          content = content.replace(`](${href})`, `](${lowerHref})`)
          content = content.replace(`](<${href}>)`, `](${lowerHref})`)
          writeFile(articleFile, matterResultWithoutContent.data, content)
        } else if (articlesPaths.has(lowerHref.replace(/_/g, '-'))) {
          const newHref = lowerHref.replace(/_/g, '-')
          console.log(`${href} --> ${newHref}`)
          content = content.replace(`](${href})`, `](${newHref})`)
          content = content.replace(`](<${href}>)`, `](${newHref})`)
          writeFile(articleFile, matterResultWithoutContent.data, content)
        } else if (false && href.includes('::')) {
          const newHref = href.split('::')[1]
          console.log(
            `[${textContent}](${href})`,
            textContent.split('::')[textContent.split('::').length - 1]
          )
          content = content.replace(
            `[${textContent}](${href})`,
            textContent.split('::')[textContent.split('::').length - 1]
          )
          writeFile(articleFile, matterResultWithoutContent.data, content)
        } else if (articlePathsByAlias.has(href)) {
          const newHref = articlePathsByAlias.get(href)
          console.log(`${href} --> ${newHref}`)
          content = content.replace(`](${href})`, `](${newHref})`)
          content = content.replace(`](<${href}>)`, `](${newHref})`)
          writeFile(articleFile, matterResultWithoutContent.data, content)
        } else if (cachedReplacements.has(href)) {
          const newHref = cachedReplacements.get(href)
          console.log(`${href} --> ${newHref}`)
          content = content.replace(`](${href})`, `](${newHref})`)
          content = content.replace(`](<${href}>)`, `](${newHref})`)
          // writeFile(articleFile, matterResultWithoutContent.data, content)
        } else if (true) {
          console.log(`${href}`)
          content = content.replace(`[${textContent}](${href})`, textContent)
          writeFile(articleFile, matterResultWithoutContent.data, content)
        } else if (false) {
          let transformedQuery = lowerHref.replace(/[-_\.,()]/g, '')
          transformedQuery = transformedQuery.substr(0, transformedQuery.length)
          let results
          try {
            results = await fuzzysort.goAsync(transformedQuery, articleTitles, {
              limit: 20
            })
          } catch (error) {
            console.log(error)
          }
          if (results.length > 0) {
            // const hasSingleSuggestion = results.length === 1
            const hasOutlier =
              results.length > 0 &&
              results[0].score > -50 &&
              (results.length === 1 || results[1].score < -15000)
            if (hasOutlier) {
              const newHref = results[0].target
              console.log(`${href} --> ${newHref} ?`)
              const { shouldReplace } = await inquirer.prompt([
                {
                  name: 'shouldReplace',
                  type: 'confirm',
                  message: 'Replace?',
                  default: false
                }
              ])
              if (shouldReplace) {
                content = content.replace(`](${href})`, `](${newHref})`)
                content = content.replace(`](<${href}>)`, `](${newHref})`)
                writeFile(articleFile, matterResultWithoutContent.data, content)
                cachedReplacements.set(href, newHref)
              } else {
                pathsToSkip.add(href)
              }
            }
          }
        }
      }
    }
  }
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})

function isLocalLink(href) {
  return (/^https?:\/\//.test(href) || href.substr(0, 2) === '//') === false
}

function writeFile(articleFile, frontMatterObject, content) {
  const frontMatter = yaml.safeDump(frontMatterObject)
  const newFileContent = `---
${frontMatter}---
${content}`
  fs.writeFileSync(articleFile, newFileContent)
}
