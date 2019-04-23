import '@babel/polyfill'
import RateLimit from './rate-limit'
import { IRateLimitState } from './rate-limit'

const range = function(n: number): Array<void> {
  return [...Array(n).values()]
}

type AsyncFunc = () => Promise<any>
type RateLimitUpdateFunc = (_: any) => IRateLimitState

interface Process {
  job: AsyncFunc
  updater: RateLimitUpdateFunc
  resolve: Function
}

class AsyncPool {
  private _inFlight: number = 0
  private _queue: Array<Process> = []
  private _rateLimit: RateLimit = new RateLimit()

  private async _runOne(): Promise<any> {
    let [c] = this._queue.splice(0, 1)
    this._inFlight++
    let result = await c.job()
    let rateUpdate = await c.updater(result)
    this._rateLimit.update(rateUpdate)
    this._inFlight--
    c.resolve(result)
  }

  private get _drainSize() {
    let qty = 0
    if (!this._queue.length) {
      qty = 0
    } else if (this._rateLimit.available > 0) {
      qty = Math.max(0, this._rateLimit.available - this._inFlight)
    } else {
      qty = 0
    }
    return qty
  }

  drain() {
    this._rateLimit.doReset(this._inFlight)

    let runnable = Math.min(this._drainSize, this._queue.length)
    this._rateLimit.consume(runnable)

    range(runnable).forEach(() => this._runOne())
  }

  append(p: Process) {
    this._queue.push(p)
  }
}


class RateLimitScheduler {
  private _timer: any = undefined
  private _pool: AsyncPool = new AsyncPool()

  private _startSchedule() {
    this._timer = setInterval(() => {
      this._pool.drain()
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
