const Geneva = require('../lib/base');
const chai = require('chai');
const expect = chai.expect;

describe('Defn', () => {
  context('when used', () => {
    const geneva = new Geneva();
    const result = geneva.run(
      ['!do',
        ['!defn', 'square', ['n'],
          ['!multiply', '~n', '~n']],
        ['!square', 4]]
    );
    expect(result).to.equal(16);
  });
});