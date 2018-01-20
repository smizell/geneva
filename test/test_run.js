const Geneva = require('../lib/base');
const chai = require('chai');
const expect = chai.expect;

describe('Geneva', () => {
  describe('run', () => {
    context('when given valid code', () => {
      it('returns the output', () => {
        const geneva = new Geneva();
        const result = geneva.run(['!identity', 42]);
        expect(result.output).to.equal(42);
      });
    });
  });
});