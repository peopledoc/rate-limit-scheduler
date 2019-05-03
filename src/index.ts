import '@babel/polyfill'
import AsyncPool from './async-pool'
import { Process } from './async-pool'
import { AsyncFunc, RateLimitUpdateFunc } from './function-types'

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
