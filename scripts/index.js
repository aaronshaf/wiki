#! /usr/bin/env node
const shell = require('shelljs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const sleep = require('sleep-promise')

const copyFiles = require('./copy-app-files')
const createSitemap = require('./create-sitemap')
const createHeaders = require('./create-headers')
const createRedirects = require('./create-redirects')
const indexArticles = require('./reindex-articles')

async function build() {
  // Reintroduce when `build wiki` command is used
  // console.log('(1) Copying public/ and /src...')
  // await copyFiles()

  console.log('(1) Indexing articles and asides...')
  await indexArticles()

  console.log('(2) Creating sitemap...')
  await createSitemap()

  console.log('(3) Generating main assets...')
  shell.exec(`${path.join('node_modules', '.bin', 'react-scripts')} build`)

  await sleep(1000)

  console.log('(4) Creating headers...')
  await createHeaders()

  await sleep(1000)

  console.log('(5) Creating redirects...')
  await createRedirects()

  console.log('(6) removing service worker files')
  shell.rm('-rf', path.join(process.cwd(), 'build', 'service-worker.js'))
  shell.rm('-rf', path.join(process.cwd(), 'build', 'manifest.json'))
  shell.rm('-rf', path.join(process.cwd(), 'build', 'asset-manifest.json'))
}

try {
  // if (argv._ && argv._[0] === 'build') {
  build()
  // }
} catch (error) {
  console.error(error)
}
