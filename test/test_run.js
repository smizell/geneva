const Geneva = require('../lib/base');
const chai = require('chai');
const expect = chai.expect;

describe('Geneva', () => {
  describe('run', () => {
    context('when given valid code', () => {
      it('returns the output', () => {
        const geneva = new Geneva();
        const result = geneva.run(['!identity', 42]);
        expect(result).to.equal(42);
      });
    });

    context('when given nested code', () => {
      it('returns the output', () => {
        const geneva = new Geneva();
        const result = geneva.run(['!identity', ['!identity', 42]]);
        expect(result).to.equal(42);
      });
    });
  });
});