const axios = require('axios')
const { join } = require('path')
const { promisify } = require('util')
const { writeFile, mkdir, exists } = require('fs')

const mkdirAsync = promisify(mkdir)
const existsAsync = promisify(exists)
const writeFileAsync = promisify(writeFile)

const TWITTER_AUTH = require('./TWITTER_AUTH.json')
const Twitter = new require('twitter')(TWITTER_AUTH)

const searchGithubRepos = async (q) => {
  try {
    const url = 'https://api.github.com/search/repositories'
    const params = { q, sort: 'stars', order: 'desc', per_page: 10 }
    return await axios.get(url, { params })
  } catch (error) {
    console.error(error)
  }
}

const searchTweets = async (q) => {
  try {
    return await new Promise((resolve, reject) => {
      Twitter.get('search/tweets', { q }, (error, tweets) => {
        if (error) reject(error)
        resolve(tweets)
      })
    })
  } catch (error) {
    console.error(error)
  }
}

const Main = (async () => {
  const { data: { items: repos } } = await searchGithubRepos('reactive')

  const results = {}
  for (const repo of repos) {
    const { name } = repo
    const tweets = await searchTweets(name)

    results[name] = tweets.statuses
  }

  const resultsDir = join(__dirname, 'results')
  if (!(await existsAsync(resultsDir))) await mkdirAsync(resultsDir)

  const resultFileName = join(resultsDir, `${Date.now()}.json`)
  await writeFileAsync(resultFileName, JSON.stringify(results, {}, 2), 'utf8')
})()
