## Geneva

This is a weird and quirky Lisp-flavored JSON that uses Ramda for the standard library. This is just for fun, so please do not take this too seriously!

**Beware**: there could be gotchas and safety issues with running code like this in a production environment, **especially** if you allow outside users to run their own Geneva code through this on your system. Ideally, it would be great to ensure this code is safe from outside users, but this is unknown. For real, please do not use this for anything other than fun.

## Why do this?

I had this thought, that since JSON parsers are everywhere, what if you turned JSON into its own little language? To make a usable language, you need a nice standard library, and Ramda is the perfect fit for that. Geneva mashes JSON, Lisp, and Ramda together to make a simple way to define Ramda code as JSON that can be passed around and evaluated as desired.

So it's just for fun. But it's not too far off from tools like CloudFormation or Azure's ARM that put a bunch of code-like structure in YAML. Maybe this will spark some ideas of creating a little language that can be used for writing and processing configurations.

## Language Overview

Geneva allows you to pass in JSON and process that JSON as if it were code. The way that it knows something is code is by looking for arrays (i.e. lists) where the first item in the list is callable. Something is callable when it has a bang (!) as the first character. In the example below, you see that `sum` is the function and `[1, 2]` is the single argument passed to the function.

```javascript
["!sum", [1, 2]];
```

This is using Ramda's `sum` function, so it is the same as:

```javascript
R.sum([1, 2]);
```

Any Ramda function is available in the code.

Geneva also allows for defining variables and referencing those variables throughout your code. This example shows code that defines a variable and then uses that variable in the next call. The way Geneva knows that a string is a reference is by appending the tilde (~) to the variable name.

```javascript
["!do", ["!def", "x", 10], ["!sum", ["~x", 5]]];
```

This example used `do`, which is a special function that evaluates everything and returns the value of the last function.

The reason for appending these special characters is so that plain JSON can be passed in. This means that you could have code as values in an object, even deeply nested.

### Functions

Geneva has limited support of functions (also called lambdas in this project). Any function defined will essentially freeze the existing scope and then scope all variables within it during the call. This means that functions cannot see any changes after they are defined, and they cannot make changes to the outer scope when they are called.

```javascript
[
  "!do",
  ["!def", "square", ["!fn", ["n"], ["!multiply", "~n", "~n"]]],
  ["!square", 4],
];
```

This defines a function as a variable `square` and then calls that function. The result from this code will be 16.

Functions can also be invoked immediately by making them the first item in an array.

```javascript
// returns 16
[["!fn", ["n"], ["!multiply", "~n", "~n"]], 4];
```

There is a `defn` shortcut for defining functions more easily.

```javascript
["!do", ["!defn", "square", ["n"], ["!multiply", "~n", "~n"]], ["!square", 4]];
```

Lastly, the `fn` function is aliased as `lambda` if that works better for you.

### Conditionals

You can use an `if` statement in the code.

```javascript
["!if", true, "Success!", "Fail :("];
```

If you leave out the else statement and the condition fails, you will get `null` (sorry).

### Quote and Eval

Code can be "quoted" in the sense that it can be treated as a normal array rather than code. This allows for creating code on the fly (like a macro) if you so choose.

```javascript
["!quote", ["!sum", [1, 2]]];
// returns ['!sum', [1, 2]] unevaluated
```

You can evaluate quoted code as well.

```javascript
// returns 3
["!eval", ["!quote", ["!sum", [1, 2]]]];
```

### Read String

You can also pass in JSON to the `readString` function to evaluate code from a string. This also allows you to build code. Note that the value for `readString` MUST be valid JSON because it will be parsed as JSON when the function is run. The function itself will return the parsed value as a `quote` function call.

```javascript
// This return 42
["!eval", ["!readString", '["!identity", 42]']];
```

## Install

This is currently in alpha for 1.0.0. There is an older version of Geneva that does not use Ramda and is not as easy to use.

```shell
npm install geneva
```

## Usage

You first need a code runner.

```javascript
const { Geneva } = require("geneva");
const geneva = new Geneva();
```

You can then run code as such:

```javascript
geneva.run(["!sum", [1, 2]]); // returns 3
```

If you are using JSON, you'll need to parse it first.

### Initial Data

You can pass initial data into Geneva in order to set up the scope before your code ever runs.

```javascript
const geneva = new Geneva({
  initial: {
    foo: "bar",
  },
});
geneva.run("~foo"); // returns bar
```

Plain JavaScript functions may also be passed in and called directly in the code.

```javascript
const geneva = new Geneva({
  initial: {
    hello: (name) => `Hello, ${name}`,
  },
});
geneva.run(["!hello", "World"]); // return Hello, World
```

If you want to be able to evaluate code at runtime in your own function, you can pass in a special form to do so. This will pass in the raw code to your function along with the runtime for the given scope. Note that the runtime you get will be scoped to where the code is called, so the context will affect the scope.

This essentially allows you to modify the way the code itself executes. With great power comes great responsibility.

```javascript
const geneva = new Geneva({
  forms: {
    hello: (runtime, args) => {
      // Evaluate the code passed to it
      const name = runtime.run(args[0]);
      return `Hello, ${name}`;
    },
  },
});
geneva.run(["!hello", ["!join", "", ["b", "a", "r"]]]); // return Hello, bar
```

Lastly, if you want to your own runtime to play with, you can call `geneva.buildRuntime()`, which takes the same options as `geneva.run`. This will give you access to the runtime to inspect and change the scope.

## REPL

There is a REPL to use by running the `geneva` command. This will give you a prompt where you can directly type in Geneva code. Use `.help` to see other available commands.
