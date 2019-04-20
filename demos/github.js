let fetch = require('node-fetch')
let scheduler = require('../index')()

function _call() {
  return fetch('https://api.github.com/search/issues\?q\=label:good-first-issue')
}

function _update(res) {
  let r = {
    reset: res.headers.get('x-ratelimit-reset') * 1000,
    remaining: res.headers.get('x-ratelimit-remaining')
  }
  return r
}

let p = []
for (let i = 0; i < 20; i++) {
  console.log(`scheduling ${i}`)
  _p = scheduler.schedule(_call, _update).then((d)=> {
    if (!d.ok) {
      throw new Error('Fail')
    }
    console.log('success', d.status)
  })
  p.push(_p)
}

Promise.all(p).then(()=> process.exit(0))

// TODO: erreur dès le premier appel
