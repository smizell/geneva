Geneva
------

This is an example of Lisp-flavored JSON. This is just for fun at this point, so please do not take this too seriously!

## Example

```javascript
// The ! is used to call a function
// The ~ is used to pass around variables
geneva = Geneva();

// For this logic example, the = function may 
// look odd because it starts with a !. This is
// calling the = function, not testing for inequality,
// which is done with !not=

// Should be equal to 6
var logicExample = geneva.run(
  ["!if", ["!=", 5, 5],
    ["!inc", 5],
    ["!+", 4, 4]]);

// Should return [2, 3, 4]
var mapExample = geneva.run(["!map", "~inc", [1, 2, 3]]);

// Should return 8
var reduceExample = geneva.run(["!reduce", "~+", [2, 3, 3]]);

// Function support
// Should return 14
var fnExample = geneva.run(
  ["!do",
    ["!defn", "add-four", ["x"],
      ["!+", "~x", 4]],
    ["!add-four", 10]]);

// Filter to return all even values
var filtered = geneva.run(["!filter", "~even?", [1, 2, 3, 4, 10, 11]]);

// Solve FizzBuzz
var fizzBuzz = geneva.run(
  ["!map",
    ["!fn", ["x"], ["!cond", ["!zero?", ["!mod", "~x", 15]], "FizzBuzz",
                             ["!zero?", ["!mod", "~x", 5]], "Buzz",
                             ["!zero?", ["!mod", "~x", 3]], "Fizz",
                             ":else", "~x"]],
    ["!range", 1, 101]])
```

## Available Functions

* identity
* def
* inc
* +
* -
* mod
* fn
* defn
* do
* let
* =
* not=
* if
* cond
* map
* reduce
* filter
* concat
* range
* zero?
* even?
* odd?
* str
* join
* split
