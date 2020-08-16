## Geneva

Geneva is a way to make ordinary data more dynamic. It allows you to include code within YAML or JSON documents for the purpose of keeping specifications lightweight yet extensible.

**Beware**: please do not run this code in production settings yet. This is an experimental library for testing out an idea. If you desire to use this kind of approach, consider testing this extensively and contributing back or writing something that works for you.

## Install

This is currently in alpha for 1.0.0. There is an older version of Geneva that does not use Ramda and is not as easy to use.

```shell
npm install geneva
```

## Why do this?

Since JSON parsers are everywhere, what if we turned JSON into its own little language? To make a usable language, we need a standard library, and Ramda is a great fit for that. Geneva mashes JSON/YAML and Ramda together to make a simple way to define Ramda code as JSON/YAML that can be passed around and evaluated as desired.

It's just for fun. But it's not too far off from tools like CloudFormation or Azure's ARM that put a bunch of code-like structure in YAML. Maybe this will spark some ideas of creating a little language that can be used for writing and processing configurations.

## Making specifications dynamic

One main benefit of Geneva is that it can make static specifications dynamic. Instead of bloating a specification with ways to define variables, reference those variables, or do operations like join strings, use Geneva to provide all of them on top of a specification.

The example below defines parameters, computed values, and finally passes them all to the `definition`. This definition could be OpenAPI, AsyncAPI, or any other JSON/YAML-based specification.

```yml
parameters:
  - name: firstName
    check: ref:isString
  - name: lastName
    required: true
computed:
  - name: fullName
    compute:
      fn:template: "{{firstName}} {{lastName}}"
definition:
  greeting:
    fn:template: |-
      Hello, {{fullName}}
```

You can evaluate this with code like:

```js
const { ConfigBuilder } = require("geneva");
const config = ConfigBuilder.fromYAML(yamlAbove);
const run = config.build({ firstName: "Jane", lastName: "Doe" });
const results = run();
// results is equal to { "greeting": "Hello, Jane Doe" }
```

## Language overview

Geneva allows you to pass in data and process that data as if it were code. Geneva looks for objects with one key that is the function name prefixed with "fn:" and an array of arguments to pass to the array.

For example, to call the `sum` function with `1` and `2` as the arguments, do something like this:

```yml
# YAML example
fn:sum: [1, 2]
```

This is using Ramda's `sum` function, so it is the same as:

```javascript
R.sum([1, 2]);
```

Geneva also allows for defining variables and referencing those variables throughout your code. This example shows code that defines a variable and then uses that variable in the next call. The way Geneva knows that a string is a reference is by prepending "ref:" to the variable name.

```yml
fn:do:
  - fn:def: [x, 10]
  - fn:sum: [ref:x, 5]
# result is 15
```

This example used `do`, which is a special function that evaluates everything and returns the value of the last function.

The reason for appending these special characters is so that plain data can be passed in. This means that it can evaluate code in deeply-nested objects.

### Supported functions

Geneva includes functions from the following libraries for use in your code.

1. [Ramda function](https://ramdajs.com/docs/)
1. [Ramda Adjunct](https://char0n.github.io/ramda-adjunct/)
1. [Saunter](https://github.com/smizell/saunter)

### Defining functions

Geneva has limited support of functions (also called lambdas in this project). Any function defined will essentially freeze the existing scope and then scope all variables within it during the call. This means that functions cannot see any changes after they are defined, and they cannot make changes to the outer scope when they are called.

```yml
fn:do:
  - fn:def:
      - square
      - fn:lambda:
          - n
          - fn:multiply: [ref:n, ref:n]
  - fn:square: [4]
```

This defines a function as a variable `square` and then calls that function. The result from this code will be 16.

There is a `defn` shortcut for defining functions more easily.

```yml
fn:do:
  - fn:defn:
      - square
      - [n]
      - fn:multiply: [ref:n, ref:n]
  - fn:square: [4]
```

### Conditionals

You can use an `if` statement in the code.

```yml
fn:if:
  - true
  - "Success!"
  - "Fail :("
```

If you leave out the else statement and the condition fails, you will get `null` (sorry).

### Quote and Eval

Code can be "quoted" in the sense that it can be treated as a normal array rather than code. This allows for creating code on the fly (like a macro) if you so choose.

```yml
fn:quote:
  - fn:sum: [1, 2]
# returns fn:sum: [1, 2] unevaluated
```

You can evaluate quoted code as well.

```yml
fn:eval:
  - fn:quote:
      - fn:add: [1, 2]
# returns 3
```

### Templates

Geneva includes a `template` function that uses Mustache and allows for rendering string that contain references. It will not allow for referencing anything in the provided in the supported libraries. It will however give you access to the local scope.

```yml
fn:do:
  - fn:def: [name, Jane Doe]
  - fn:template: Hello, {{name}}
# returns Hello, Jane Doe
```

You can also use `templateFile` to specify a file path and run that as a template instead. It will load file and run it just like calling the `template` function, which gives the template access to the scope.

```yml
fn:do:
  - fn:def: [name, Jane Doe]
  - fn:templateFile: ./say-hello.mustache
```

This is useful if you want to keep templates out of your main file.

Check out the [Mustache manual](https://mustache.github.io/) for more information on using Mustache templates.

### Including other files

You can use the `include` function to pull in a file and execute it in the current scope. It's expecting a YAML file. It will load it, parse it, then execute it.

```yml
fn:do:
  - fn:def: [name, Jane Doe]
  - fn:include: ./my-code.yml
```

In this example, the `my-code.yml` will have access to the `name` value.

### Reading a file

Sometimes you just want to pull something out of a file. You can do this with `readFile`.

```yml
fn:readFile: ./my-file.txt
```

This does not execute the file or render as a template.

## Usage

### Using in JavaScript

You first need a code runner.

```javascript
const { Geneva } = require("geneva");
const geneva = new Geneva();
```

You can then run code as such:

```javascript
// returns 3
geneva.run({ "fn:sum": [1, 2] });
```

If you are using JSON or YAML, you'll need to parse it first.

#### Initial data

You can pass initial data into Geneva in order to set up the scope before your code ever runs.

```javascript
const geneva = new Geneva({
  initial: {
    foo: "bar",
  },
});
geneva.run("ref:foo"); // returns bar
```

Plain JavaScript functions may also be passed in and called directly in the code.

```javascript
const geneva = new Geneva({
  initial: {
    hello: (name) => `Hello, ${name}`,
  },
});
geneva.run({ "fn:hello": ["World"] }); // return Hello, World
```

#### Forms

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
// return Hello, bar
geneva.run({
  "fn:hello": {
    "fn:join": ["b", "a", "r"],
  },
});
```

#### Custom runtime

Lastly, if you want to your own runtime to play with, you can call `geneva.buildRuntime()`, which takes the same options as `geneva.run`. This will give you access to the runtime to inspect and change the scope.

### From the command line

If you install Geneva globally, you'll get the command line tool `geneva`.

#### Definition

```
geneva definition ./definition.yml ./params.yml
```

This will load a definition file and params and run them.

#### REPL

```
geneva repl
```

This will give you a prompt where you can directly type YAMP in Geneva code. Use `.help` to see other available commands.
