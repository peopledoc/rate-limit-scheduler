const MAX_CALLS_PER_INTERVAL = 30
const RESET_INTERVAL = 20 * 1000 // ms
const MAX_NETWORK_LATENCY = 2 * 1000 // ms
const MAX_PROCESSING_TIME = 2 * 1000 // ms

// Utility function
function timeout(delay) {
  return new Promise((resolve)=> setTimeout(resolve, delay))
}

module.exports = function(config = {}) {
  // These options tune the behavior of the server
  const {
    resetInterval = RESET_INTERVAL,
    maxCallsPerInterval = MAX_CALLS_PER_INTERVAL,
    maxNetworkLatency = MAX_NETWORK_LATENCY,
    maxProcessingTime = MAX_PROCESSING_TIME
  } = config

  // Defines the state of the fake server
  let remainingCalls = maxCallsPerInterval
  let resetTime

  // Resets the allowance in due time
  const _scheduler = setInterval(()=> {
    if (resetTime && resetTime < Date.now()) {
      console.log('[server] Resetting the rate limit')
      remainingCalls = maxCallsPerInterval
      resetTime = null
    }
  }, 1)

  async function execute(index = '???') {
    let networkDelay = Math.random() * maxNetworkLatency
    console.log(`[server,${index}] Network transport for request: ${Math.floor(networkDelay)}ms`)
    await timeout(networkDelay)

    let processingTime = Math.random() * maxProcessingTime
    console.log(`[server,${index}] Processing time: ${Math.floor(processingTime)}ms`)
    await timeout(processingTime)
    if (remainingCalls === maxCallsPerInterval) {
      resetTime = Date.now() + resetInterval
    }
    if (remainingCalls <= 0) {
      throw new Error(`[server,${index}] Fails to process call ${index}, ${remainingCalls} / ${resetTime}`)
    }
    remainingCalls--
    networkDelay = Math.random() * maxNetworkLatency
    console.log(`[server,${index}] Network transport for response: ${Math.floor(networkDelay)}ms`)
    await timeout(networkDelay)
    return { reset: resetTime, remaining: remainingCalls, index }
  }

  return {
    shutdown() {
      console.log('[server] Shutting down the server')
      clearInterval(_scheduler)
    },
    execute(...args) {
      return execute(...args)
    }
  }
}
