const Geneva = require('../lib/base');
const chai = require('chai');
const expect = chai.expect;

describe('Lambda', () => {
  context('when a basic lambda is defined', () => {
    it('should be callable', () => {
      const geneva = new Geneva();
      const result = geneva.run(
        ['!do',
          ['!def', 'foo',
            ['!lambda', ['a', 'b'],
              ['!sum', ['~a', '~b']]]],
          ['!foo', 5, 6]]
      );
      expect(result).to.equal(11);
    });
  });

  context('global scope', () => {
    context('when a variable is defined first', () =>{
      it('should be accessible', () => {
        const geneva = new Geneva();
        const result = geneva.run(
          ['!do',
            ['!def', 'foo', 'bar'],
            ['!def', 'callFoo',
              ['!lambda', [], '~foo']],
            ['!callFoo']]
        );
        expect(result).to.equal('bar');
      });
    });

    context('when a variable is defined after', () =>{
      it('should not be accessible', () => {
        const geneva = new Geneva();
        const runner = () => {
          const result = geneva.run(
            ['!do',
              ['!def', 'getFoo',
                ['!lambda', [], '~foo']],
              ['!def', 'foo', 'bar'],
              ['!getFoo']]
          );
        }
        expect(runner).to.throw;
      });
    });
  });

  context('when a more complex lambda is defined', () => {
    it('returns the correct value for nested calls', () => {
      const geneva = new Geneva();
      const result = geneva.run( 
        ['!do',
          [['!lambda', [],
            [['!lambda', ['x'], '~x'], 42]]]]
      );
      expect(result).to.equal(42)
    });

    it('returns handles scope correctly', () => {
      const geneva = new Geneva();
      const result = geneva.run( 
        ['!do',
          ['!def', 'x', 42],
          // Define a nested lambda function
          ['!def', 'foo',
            ['!fn', [],
              [['!fn', [], '~x']]]],
          // Change the value of x
          ['!def', 'x', 100],
          // It should return the original value
          ['!foo']]
      );
      expect(result).to.equal(42)
    });
  });
});