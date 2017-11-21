const path = require('path')
const fs = require('fs')
const glob = require('glob-promise')
const remark = require('remark')
const recommended = require('remark-preset-lint-recommended')
const remarkHtml = require('remark-html')
const tocFromParsedMarkdown = require('mdast-util-toc')
const toHAST = require(`mdast-util-to-hast`)
const report = require('vfile-reporter')
const matter = require('gray-matter')
const jsonfile = require('jsonfile')
const mkdirp = require('mkdirp-promise')
const progress = require('cli-progress')

const progressBar1 = new progress.Bar({}, progress.Presets.shades_classic)
const progressBar2 = new progress.Bar({}, progress.Presets.shades_classic)

async function main() {
  const asideFiles = await glob(`${__dirname}/../asides/**`)
  const asideFilesByBasename = {}
  progressBar1.start(asideFiles.length, 0)
  for (asideFile of asideFiles) {
    progressBar1.increment()
    const fileStats = fs.lstatSync(asideFile)
    if (fileStats.isFile() === false) {
      continue
    }
    const name = path.basename(asideFile, '.md')
    asideFilesByBasename[name] = asideFile
  }
  progressBar1.stop()

  const articleFiles = await glob(`${__dirname}/../articles/**`)
  progressBar2.start(articleFiles.length, 0)
  const articleMetaData = []
  const allArticleHeadings = []
  const allArticleAliases = []

  for (articleFile of articleFiles) {
    progressBar2.increment()
    const fileStats = fs.lstatSync(articleFile)
    if (fileStats.isFile() === false) {
      continue
    }
    const name = path.basename(articleFile, '.md')
    const fileContent = fs.readFileSync(articleFile, { encoding: 'utf8' })
    const matterResult = matter(fileContent)
    const frontMatter = matterResult.data
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
    const parsedMarkdownNode = remark().parse(matterResult.content)
    let toc = tocFromParsedMarkdown(parsedMarkdownNode, {
      maxDepth: 2
    })
    let articleTitle
    let articleHeadings
    try {
      articleTitle =
        toc.map.children[0].children[0].children[0].children[0].value
      if (toc.map.children[0].children.length > 1) {
        articleHeadings = toc.map.children[0].children[1].children.map(
          child => [
            child.children[0].children[0].children[0].value,
            child.children[0].children[0].url
          ]
        )
      }
    } catch (error) {
      articleTitle = name
    }

    const asides = await Promise.all(
      (frontMatter.asides || [])
        .filter(asideId => asideId && asideFilesByBasename[asideId])
        .map(asideId => {
          return getAside(asideFilesByBasename[asideId])
        })
    )

    await mkdirp(path.join(__dirname, '..', 'public', 'articles'))
    const _file = path.join(
      __dirname,
      '..',
      'public',
      'articles',
      `${name}.json`
    )
    jsonfile.writeFileSync(
      _file,
      {
        title: articleTitle,
        // frontMatter,
        html: html.contents,
        asides
      },
      { spaces: 0 }
    )
    articleMetaData.push([name, articleTitle])
    allArticleHeadings.push([name, articleHeadings])
    allArticleAliases.push([name, frontMatter.aliases])
  }

  progressBar2.stop()

  const _file = path.join(__dirname, '..', 'public', 'articles.json')
  jsonfile.writeFileSync(_file, articleMetaData)

  const _file2 = path.join(__dirname, '..', 'public', 'article-headings.json')
  jsonfile.writeFileSync(_file2, allArticleHeadings)

  const _file3 = path.join(__dirname, '..', 'public', 'article-aliases.json')
  jsonfile.writeFileSync(_file3, allArticleAliases)
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})

async function getAside(file) {
  const fileContent = fs.readFileSync(file, { encoding: 'utf8' })
  const html = await new Promise((resolve, reject) => {
    remark()
      .use(recommended)
      .use(remarkHtml)
      .process(fileContent, (err, result) => {
        if (err != null) {
          console.error(report(err))
          reject(err)
        } else {
          resolve(result.contents)
        }
      })
  })
  return html
}
