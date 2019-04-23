export interface IRateLimitState {
  remaining: number
  limit?: number
  reset: number
}

class RateLimitState implements IRateLimitState {
  remaining: number = 0
  limit: number = 1
  reset: number = 0
}

export default class RateLimit {
  private _state = new RateLimitState()

  update(r: IRateLimitState): IRateLimitState {
    let limitDefault = { limit: Math.max(this._state.limit, this._state.remaining, r.remaining, 1) }
    let newState = Object.assign({}, this._state, limitDefault, r)
    Object.assign(this._state, newState)
    return { ...this._state }
  }

  doReset(inFlight: number = 0) {
    if (this._state.reset < Date.now()) {
      // this.remaining = Math.max(this.remaining, Math.max(0, this.limit - inFlight))
      this._state.remaining = Math.max(0, this._state.limit - inFlight)
      this._state.reset = Infinity
    }
    return {...this._state}
  }

  consume(running: number = 0) {
    this._state.remaining = Math.max(0, this._state.remaining - running)
  }

  get available() {
    return this._state.remaining
  }
}
