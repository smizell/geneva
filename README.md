Geneva
------

This is an example of a JSON flavor of Lisp. This is just for fun at this point, so please do not take this too seriously!

## Example

```javascript
geneva = Geneva();

var example = geneva.run(
  ["if", ["=", 5, 5],
    ["inc", 5],
    ["+", 4, 4]]
)

// Should print 6
console.log(example);
```