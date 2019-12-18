const { Geneva } = require('../lib/base');
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

    context('when a function that does not exist', () => {
      it('throws an error', () => {
        const geneva = new Geneva();
        expect(() => geneva.run(['!foo', 'bar'])).to.throw;
      });
    });

    context('when given a plain object', () => {
      it('returns the object', () => {
        const geneva = new Geneva();
        const result = geneva.run({ foo: 'bar' });
        expect(result).to.deep.equal({ foo: 'bar' });
      });
    });


    context('when given an object with code', () => {
      it('processes the code in the object', () => {
        const geneva = new Geneva();
        const result = geneva.run({ foo: ['!sum', [1, 3]] });
        expect(result).to.deep.equal({ foo: 4 });
      });
    });
  });
});
