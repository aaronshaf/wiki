import idb from 'idb'

const STORAGE_LIMIT = 50
const memoryStorage = new Map()
const DATABASE_NAME = 'wiki'
const OBJECT_STORE_NAME = 'articles'

const activeFetches = new Map()

let didIdbOpenFail = false

const dbPromise = idb
  .open(DATABASE_NAME, 1, upgradeDB => {
    switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore(OBJECT_STORE_NAME)
        break
      default:
        break
    }
  })
  .catch(error => {
    didIdbOpenFail = true
    console.error('Error opening database', error)
  })

if (window.WIKI_PRELOAD && window.WIKI_PRELOAD.articlePath) {
  putArticle(window.WIKI_PRELOAD.articlePath, window.WIKI_PRELOAD.json)
}

function saveToMemoryStorage(key, value) {
  if (memoryStorage.size >= STORAGE_LIMIT) {
    memoryStorage.delete(memoryStorage.keys().next().value)
  }
  memoryStorage.set(key, value)
}

export function putArticle(key, value) {
  saveToMemoryStorage(key, value)
  return didIdbOpenFail
    ? null
    : dbPromise.then(db => {
        if (db == null) {
          console.warn('IndexedDB database not available?')
        } else {
          const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite')
          tx.objectStore(OBJECT_STORE_NAME).put(value, key)
          return tx.complete
        }
      })
}

export function isArticleReady(key) {
  return memoryStorage.has(key)
}

export async function getArticle(key) {
  if (memoryStorage.has(key)) {
    return memoryStorage.get(key)
  }

  const returnValue = didIdbOpenFail
    ? null
    : await dbPromise.then(db => {
        if (db == null) {
          console.warn('IndexedDB database not available?')
          return null
        }
        return db
          .transaction(OBJECT_STORE_NAME)
          .objectStore(OBJECT_STORE_NAME)
          .get(key)
      })
  if (returnValue != null) {
    saveToMemoryStorage(key, returnValue)
    fetchArticle(key)
    return returnValue
  }

  return fetchArticle(key)
}

async function fetchArticle(key) {
  const url = `/articles/${key}.json`
  const fetchPromise = activeFetches.has(url)
    ? activeFetches.get(url)
    : fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      }).then(response => (response.status === 404 ? null : response.json()))
  if (activeFetches.has(url) === false) {
    activeFetches.set(url, fetchPromise)
  }
  const json = await fetchPromise
  activeFetches.delete(url)
  putArticle(key, json)
  return json
}
