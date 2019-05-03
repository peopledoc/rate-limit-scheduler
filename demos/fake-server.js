let RateLimiterManager = require('../build')
let generateServer = require('../tests/fake-server')

let scheduler = new RateLimiterManager()
scheduler.start()
let fakeServer = generateServer()

let updater = function(data) {
  let { reset, remaining, index } = data
  console.log(`[updater,${index}] Remaining: ${remaining}, Resetting in ${reset - Date.now()}ms`)
  return {
    remaining,
    reset
  }
}



let promises = []
for (let i = 0; i < 200; i++) {
  let scheduled = scheduler.schedule(()=> fakeServer.execute(i), updater)
  promises.push(scheduled)
}

Promise.all(promises).then((r)=> {
  fakeServer.shutdown()
  scheduler.stop()
})
