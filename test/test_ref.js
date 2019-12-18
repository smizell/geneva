const { Geneva } = require('../lib/base');
const chai = require('chai');
const expect = chai.expect;

describe('References', () => {
  context('when adding a global reference', () => {
    it('can be referenced in a function call', () => {
      const geneva = new Geneva();
      const result = geneva.run(
        ['!do',
          ['!def', 'x', 42],
          ['!identity', '~x']]);
      expect(result).to.equal(42);
    });
  });
});
