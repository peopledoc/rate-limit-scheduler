import '@babel/polyfill'

const range = function(n: number): Array<void> {
  return [...Array(n).values()]
}

type AsyncFunc = () => Promise<any>
type UpdateFunc = () => Process
type RateLimitUpdateFunc = (_: any) => RateLimit

interface Process {
  job: AsyncFunc
  updater: RateLimitUpdateFunc
  resolve: Function
}

class RateLimit {
  remaining: number = 0
  limit: number = 1
  reset: number = 0

  update(r: RateLimit): RateLimit {
    let limitDefault = { limit: Math.max(this.remaining, 1) }
    return Object.assign(this, limitDefault, r)
  }
}

class AsyncPool {
  private _inFlight: number = 0
  private _queue: Array<Process> = []
  rateLimit: RateLimit = new RateLimit()

  private async _next(): Promise<any> {
    let [c] = this._queue.splice(0, 1)
    this._inFlight++
    let result = await c.job()
    let rateUpdate = await c.updater(result)
    this.rateLimit.update(rateUpdate)
    this._inFlight--
    c.resolve(result)
  }

  run(quantity: number = 1) {
    quantity = Math.min(quantity, this._queue.length)
    this.rateLimit.remaining = Math.max(0, this.rateLimit.remaining - quantity)

    range(quantity).forEach(() => this._next())
  }

  get inFlight() {
    return this._inFlight
  }

  get isEmpty() {
    return !this._queue.length
  }

  append(p: Process) {
    this._queue.push(p)
  }
}

const _controlGenerator = function* (pool: AsyncPool) {
  while (true) {
    let qty = 0
    if (pool.rateLimit.reset < Date.now()) {
      pool.rateLimit.remaining = Math.max(pool.rateLimit.remaining, Math.max(0, pool.rateLimit.limit - pool.inFlight))
      pool.rateLimit.reset = Infinity
    }
    if (pool.isEmpty) {
      qty = 0
    } else if (pool.rateLimit.remaining > 0) {
      qty = Math.max(0, pool.rateLimit.remaining - pool.inFlight)
    } else {
      qty = 0
    }
    yield qty
  }
}


class RateLimitScheduler {
  private _activeControl: any
  private _timer: any = undefined
  private _pool: AsyncPool = new AsyncPool()

  constructor() {
    this._activeControl = _controlGenerator(this._pool)
  }

  private _startSchedule() {
    this._timer = setInterval(() => {
      let quantity: number = this._activeControl.next().value
      this._pool.run(quantity)
    }, 1)
  }

  schedule(job: AsyncFunc, updater: RateLimitUpdateFunc): Promise<Process> {
    return new Promise((resolve) => {
      let p: Process = { job, updater, resolve }
      this._pool.append(p)
    })
  }

  start() {
    this._timer ? null : this._startSchedule()
  }

  stop() {
    clearInterval(this._timer)
  }
}

export default RateLimitScheduler

// TODO decouple/detach AsyncPool and RateLimit
