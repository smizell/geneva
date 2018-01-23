const Geneva = require('../lib/base');
const chai = require('chai');
const expect = chai.expect;

describe('Read String', () => {
  context('when used', () => {
    it('creates a quote of the string', () => {
      const geneva = new Geneva();
      const result = geneva.run(['!readString', '["!identity", 42]']);
      expect(result).to.deep.equal(['!quote', ['!identity', 42]]);
    });
  })
});