import RateLimitScheduler from './index';

import * as mocha from 'mocha';
import * as chai from 'chai';

const expect = chai.expect;
describe('Rate Limit Scheduler', () => {

  it('should instanciate' , () => {
    expect(new RateLimitScheduler()).to.be.instanceOf(RateLimitScheduler);
  });

});
