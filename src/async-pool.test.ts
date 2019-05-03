import AsyncPool from './async-pool';

import * as mocha from 'mocha';
import * as chai from 'chai';

const expect = chai.expect;
describe('Async pool', () => {

  beforeEach(function() {
    let mockState = { reset: 0, remaining: 0 }
    this.mockProcess = {
      job() { return Promise.resolve() },
      updater() { return mockState },
      resolve() {}
    }
  })

  it('should instanciate' , () => {
    expect(new AsyncPool()).to.be.instanceOf(AsyncPool);
  });

  it('should accept to append Process instances', function() {
    let ap = new AsyncPool()
    expect(ap.length).to.equal(0, 'it starts with an empty queue')
    ap.append(this.mockProcess)
    expect(ap.length).to.equal(1, 'the mock process is appended to the queue')
  })

});

