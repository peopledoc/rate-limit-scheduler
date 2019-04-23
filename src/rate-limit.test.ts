import RateLimit from './rate-limit';
import { IRateLimitState } from './rate-limit';

import * as mocha from 'mocha';
import * as chai from 'chai';

const expect = chai.expect;

describe('RateLimit', () => {

  it('allows zero calls', function() {
    const rl = new RateLimit()
    expect(rl.available).to.equal(0)
  })

  it('allows to change the parameters', function() {
    const rl = new RateLimit()
    let state = rl.update({ remaining: 123, reset: 345, limit: 987 })
    expect(rl.available).to.equal(123)

    expect(state.remaining).to.equal(123)
    expect(state.reset).to.equal(345)
    expect(state.limit).to.equal(987)
  })

  describe('the limit of possible calls', function() {
    it('defaults to 1 when not specified and no remaining queries are available', function() {
      let rl = new RateLimit()
      let state = rl.update({ remaining: 0, reset: 345 })
      expect(state.limit).to.equal(1, 'the limit defaults to 1')
    })

    it('defaults to the remaining when not specified', function() {
      let rl = new RateLimit()
      let state = rl.update({ remaining: 12, reset: 345 })
      expect(state.limit).to.equal(12, 'it is set to the remaining queries')
    })

    it('can be inferred', function() {
      let rl = new RateLimit()
      rl.update({ remaining: 10, reset: 345 })
      let state = rl.update({ remaining: 20, reset: 345 })
      expect(state.limit).to.equal(20, 'the limit is inferred from the previous max remaining queries')

      rl = new RateLimit()
      rl.update({ remaining: 30, reset: 345 })
      state = rl.update({ remaining: 10, reset: 345 })
      expect(state.limit).to.equal(30, 'the limit is inferred from the max remaining queries ever declared')
    })

    it('is always set as specified, when specified', function() {
      let rl = new RateLimit()
      let state = rl.update({ remaining: 10, reset: 345, limit: 12 })
      expect(state.limit).to.equal(12)
    })

    it('is capped by the remaining value and past limit values', function() {
      let rl = new RateLimit()
      let state = rl.update({ remaining: 10, reset: 345, limit: 12 })

      state = rl.update({ remaining: 10, reset: 345, limit: 15 })
      expect(state.limit).to.equal(15, 'it is updated')

      state = rl.update({ remaining: 100, reset: 345, limit: 15 })
      expect(state.limit).to.equal(15, 'the limit is not overridden even when the remaining is greater')

      state = rl.update({ remaining: 100, reset: 345 })
      expect(state.limit).to.equal(100, 'the limit is overridden when the remaining is greater and the limit is unspecified')
    })
  })

  it('consumes calls and updates state', function() {
    let rl = new RateLimit()
    rl.update({ remaining: 10, reset: 999 })

    expect(rl.available).to.equal(10)
    rl.consume(3)
    expect(rl.available).to.equal(7)

    rl.consume(10)
    expect(rl.available).to.equal(0, 'it blocks at 0')
  })

  describe('reset', function() {
    it('resets when the reset date is behind', function() {
      let rl = new RateLimit()
      let state = rl.update({ remaining: 10, reset: 999, limit: 12 })
      let resetState = rl.doReset()

      expect(state.reset).to.not.equal(resetState.reset)
      expect(state.remaining).to.not.equal(resetState.remaining)
      expect(state.limit).to.equal(resetState.limit)

      expect(resetState.reset).to.equal(Infinity, 'it does not suppose any further reset')
      expect(resetState.remaining).to.equal(12)
    })

    it('does not reset when the reset date is in the future', function() {
      let rl = new RateLimit()
      let state = rl.update({ remaining: 10, reset: Date.now() + 1, limit: 12 })
      let resetState = rl.doReset()
      expect(state.reset).to.equal(resetState.reset)
      expect(state.remaining).to.equal(resetState.remaining)
      expect(state.limit).to.equal(resetState.limit)
    })

    it('resets the number of remaining calls (pretty conservatively, by removing running calls)', function() {
      let rl = new RateLimit()
      rl.update({ remaining: 10, reset: 0, limit: 12 })

      let resetState = rl.doReset(5)
      expect(resetState.remaining).to.equal(7)
    })

    it('limits the number of remaining calls to zero during a reset', function() {
      let rl = new RateLimit()
      rl.update({ remaining: 10, reset: 0, limit: 12 })

      let resetState = rl.doReset(50)
      expect(resetState.remaining).to.equal(0)
    })
  })

  it('decreases the number of remaining items', function() {
    let rl = new RateLimit()
    rl.update({ remaining: 10, reset: 0, limit: Infinity })

    rl.consume(3)
    expect(rl.available).to.equal(7)

    rl.consume(50)
    expect(rl.available).to.equal(0)
  })
});

