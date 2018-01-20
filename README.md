Geneva
------

This is a weird and quirky Lisp-flavored JSON that uses Lodash for the standard library. This is just for fun, so please do not take this too seriously!

**Beware**: there could be gotchas and safety issues with running code like this in a production environment, **especially** if you allow outside users to run their own Geneva code through this on your system. Ideally, it would be great to ensure this code is safe from outside users, but this is unknown. For real, please do not use this for anything other than fun.

## Why do this?

I had this thought, that since JSON parsers are everywhere, what if you turned JSON into its own little language? To make a usable language, you need a nice standard library, and Lodash is the perfect fit for that. Geneva mashes JSON, Lisp, and Lodash together to make a simple way to define Lodash code as JSON that can be passed around and evaluated as desired.

So it's just for fun. But it's not too far off from tools like CloudFormation or Azure's ARM that put a bunch of code-like structure in YAML. Maybe this will spark some ideas of creating a little language that can be used for writing and processing configurations.

## Language Overview

Geneva allows you to pass in JSON and process that JSON as if it were code. The way that it knows something is code is by looking for arrays (i.e. lists) where the first item in the list is callable. Something is callable when it has a bang (!) as the first character. In the example below, you see that `sum` is the function and `[1, 2]` is the single argument passed to the function.

```javascript
['!sum', [1, 2]]
```

This is using Lodash's `sum` function, so it is the same as:

```javascript
lodash.sum([1, 2]);
```

Any Lodash function is available in the code.

Geneva also allows for definig variables and referencing those variables throughout your code. This example shows code that defines a variable and then uses that variable in the next call. The way Geneva knows that a string is a reference is by appending the tilde (~) to the variable name.

```javascript
['!do',
  ['!def', 'x', 10],
  ['!sum', ['~x', 5]]]
```

This example used `do`, which is a special function that evaluates everything and returns the value of the last function.

The reason for appending these special characters is so that plain JSON can be passed in. This means that you could have code as values in an object, even deeply nested.

### Functions

Geneva has limited support of functions (also called lambdas in this project). Any function defined will essentially freeze the existing scope and then scope all variables within it during the call. This means that functions cannot see any changes after they are defined, and they cannot make changes to the outer scope when they are called.

```javascript
['!do',
  ['!def', 'square',
    ['!fn', ['n'], ['!multiply', '~n', '~n']]],
  ['!square', 4]]
```

This defines a function as a variable `square` and then calls that function. The result from this code will be 16.

Functions can also be invoked immediately by making them the first item in an array.

```javascript
[['!fn', ['n'], ['!multiply', '~n', '~n']], 4] // returns 16
```

Lastly, the `fn` function is aliased as `lambda` if that works better for you.

### Conditionals

You can use an `if` statement in the code.

```javascript
['!if', true, 'Success!', 'Fail :(']
```

If you leave out the else statement and the condition fails, you will get `null` (sorry).

### Quote and Eval

Code can be "quoted" in the sense that it can be treated as a normal array rather than code. This allows for creating code on the fly (like a macro) if you so choose.

```javascript
['!quote', ['!sum', [1, 2]]]
// returns ['!sum', [1, 2]] unevaluated
```

You can evaluate quoted code as well.

```javascript
// returns 3
['!eval',
  ['!quote', ['!sum', [1, 2]]]]
```

## Install

```shell
npm install geneva
```

## Usage

You first need a code runner.

```javascript
const Geneva = require('geneva');
const geneva = new Geneva();
```

You can then run code as such:

```javascript
geneva.run(['!sum', [1, 2]]); // returns 3
```

If you are using JSON, you'll need to parse it first.

