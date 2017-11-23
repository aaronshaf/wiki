const ncp = require('ncp')
const path = require('path')

console.log(process.cwd())
console.log()

function copyPublic() {
  return new Promise((resolve, reject) => {
    ncp(
      path.join(__dirname, '..', 'public'),
      path.join(process.cwd(), 'public'),
      err => {
        if (err) {
          return console.error(err)
        }
        resolve()
      }
    )
  })
}

function copySrc() {
  return new Promise((resolve, reject) => {
    ncp(
      path.join(__dirname, '..', 'src'),
      path.join(process.cwd(), 'src'),
      err => {
        if (err) {
          return console.error(err)
        }
        resolve()
      }
    )
  })
}

function main() {
  return Promise.all([copyPublic(), copySrc()])
}

const isParent = module.parent == null
if (isParent) {
  main()
} else {
  module.exports = main
}
