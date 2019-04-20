module.exports = function() {
  let queue = []
  let inFlight = 0
  let threshold = 1
  let remaining = 0
  let reset = 0

  let control = function* () {
    while(true) {
      let qty = 0
      if (reset < Date.now()) {
        remaining = Math.max(remaining, Math.max(0, threshold - inFlight))
        reset = Infinity
      }
      if (!queue.length) {
        qty = 0
      } else if (remaining > 0) {
        qty = Math.max(0, remaining - inFlight)
      } else {
        qty = 0
      }
      items = queue.splice(0, qty)
      remaining = Math.max(0, remaining - items.length)
      yield items
    }
  }

  async function _executeCommand (c) {
    inFlight++
    let result = await c.job()
    let {
      remaining: _remaining = remaining,
      reset: _reset  = reset
    } = await c.updater(result)
    remaining = _remaining
    reset = _reset
    threshold = Math.max(threshold, remaining + 1)
    inFlight--
    c.resolve(result)
  }

  class RateLimiterManager {
    constructor() {
      this._activeControl = control()
      this._currentTimer = undefined
      this._advanceScheduler()
    }

    _advanceScheduler() {
      this._currentTimer = setTimeout(()=> {
        let commands = this._activeControl.next().value
        commands.forEach(_executeCommand)
        this._advanceScheduler()
      }, 0)
    }

    schedule(job, updater) {
      return new Promise((resolve)=> {
        queue.push({ job, updater, resolve })
      })
    }
  }

  return new RateLimiterManager();
}
