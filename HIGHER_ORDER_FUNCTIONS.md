# Higher-order functions in Lodash

In this article I would like to explain concept of higher-order functions and
how they are omni-present in my favorite Javascript library: Lodash.

<!--
**Disclaimer**: this article has been extracted from a longer article about Lodash. If you are already
                familiar with concept of **higher-order functions** and functions like `_.partial()` and
                `_.merge()` you might be interested in [this](README.md) article.
-->


<!--In order to better understand power of Lodash, we have to understand concept of **higher-order functions**. -->

**Higher-order functions** are great way of making code more flexible and reusable as well as making code more declarative,
but before we we jump to the definition let's take a look at a simple example.
We will define function that multiplies two values:

```javascript
function multiply(a, b){
  return a * b;
}
```
Let's play a little bit with this function:

```javascript
> multiply(21, 2)
< 42
```
Suppose, that we often use this function to double a given value. We can create then new helper function like this:
```javascript
function double(v){
  return multiply(v, 2);
}
```
Now we can easily double values:
```javascript
> double(5)
< 10
```
What we see here, is a classical function delegation (one function delegates to another).

Yet, it is not the only possible way to accomplish similar result.
In languages in which functions are first class citizens (such as Javascript),
there is another, more functional way to define `double()` function.
It is known as **partial function application**.

## Partial application

According to [Wikipedia](https://en.wikipedia.org/wiki/Partial_application):
> **partial function application** *[...]* refers to the process of fixing a number of arguments to a function, producing another function of smaller arity.

With partial application we can create `double()` function in a following way:
```javascript
var double = partial(mul, 2);
```
Partial takes function passed as first parameter, binds some of it's parameters to a fixed value and returns new function with reduced arity (number of parameters).
Let's speculate how implementation of partial in JavaScript could look like.
```javascript
function partial(fn) {
  var fixed = [].slice.apply(arguments, [1]); /* 1 */
  return function() { /* 2 */
    var args = fixed.concat([].slice.apply(arguments));
    return fn.apply(this, args); /* 3 */
  };
}
```

Our function takes and stores in local variable (`fixed`) all except first parameters (1). Then it returns new function (2) that calls our original function `fn` with parameter list prepended with parameters stored in `fixed` variable (3).
This Vanilla JS implementation is simplistic yet powerfull.

Notice ugly invocations of `slice.apply()`. They are neceseary because `arguments` object in JavaScript is not a real array, therefore it doesn't have `slice` method, so we use `Function.prototype.apply()`.

If we have used ECMAScript 2015 (ES6), we could simplify code by using [*rest operator*](https://developer.mozilla.org/pl/docs/Web/JavaScript/Reference/Functions/rest_parameters):
```javascript
function partial(fn, ...args) {
  return function(...newArgs) {
    return fn.apply(this, args.concat(newArgs));
  };
}
```
However, if we want to stick to ES 5, we can rewrite this function and already benefit from using Lodash.
This is because Lodash accepts `arguments` as a function parameter wherever array parameter is expected.
You can also easily convert any array-like object to actual array using [`_.toArray()`][toArray].
Our enhanced implementation would look like this:
```javascript
function partial(fn) {
  var fixed = _.tail(arguments);
  return function() {
    return fn.apply(this, _.concat(bound, arguments));
  };
}
```

But luckily, we don't have to write our own implementation of `partial`, as Lodash already has one: [`_.partial()`][partial].
Moreover, as you will see in next example, it is much more powerful than this simplistic one.

Say we have a `divide()` function that divides two numbers, defined as:
```javascript
function divide(a, b){
  return a / b;
}
```
Now we would like to reuse our `divide(a, b)` function to create a new `half(n)` function that divides given number by half, just as we did in our previous scenario. At first glance it is similar to our `multiple`/`double` example.
However, code:
```javascript
var half = _.partial(divide, 2);
> half(4);
< 0.5
```
... returns, as you can see, invalid results.

This happens, because earlier order of parameters was irrelevant (multiplication is [commutative](https://en.wikipedia.org/wiki/Commutative_property)).
Now we need to fix second parameter and leave first parameter *loose*. We cannot do it with our naive implementation, but fortunately authors of Lodash took it into consideration and provided a solution for such cases.
In Lodash we can *skip* parameter binding using a *placeholder* like this:
```javascript
var half = _.partial(divide, _, 2);
var invert = _.partial(divide, 1);
```
This way we created two new functions one that halves and the other that inverts:
```javascript
> half(5);
< 2.5
> invert(5);
< 0.2
```

## Curring

Lodash offers one more function similar to `_.partial()`. This function is [`_.curry()`][curry]. Let's give it a try:

```javascript
> var divideC = _.curry(divide);
> divideC(4, 2)
< 2
> divideC(4)(2)
< 2
> divideC(4)
< [Function]
> var half = divideC(_, 2);
> half(4)
< 2
```
After transforming function with `_.curry()` we get a brand new function that will accumulate and fix parameters from subsequent invocations until all expected parameters are specified, in which case original function is invoked.
Parameters can be specified one-by-one or in batches.
As you can see you can also *skip* parameters using `_` placeholder, just as with `_.partial()`.

### Limitations of `_.curry()`

`_.curry()` is more powerful than `_.partial()` but it also has some limitations. Take a look at following example:

```javascript
> var parseIntC = _.curry(parseInt);
> parseInt('123')
< 123
> parseIntC('123')
< [Function]
> parseIntC('123')(10)
< 123
```
What happened here? Well, `parseInt(string, radix=10)` has second, optional argument. Lodash cannot tell what is actual arity of function, and will assume arity based on `Function.prototype.length` property which is equal to number of parameters specified in function declaration.
Similar case applies to situation when function accepts variable number of parameters using `arguments` object (a.k.a variadic parameters).
This can lead to very unexpected and error-prone behavior.
In such cases it is recommended to provide correct arity of function when curring:
```javascript
> var parseIntC = _.curry(parseInt, 1);
> parseIntC('123')
< 123
```

## Other **higher-order** functions in Lodash

`_.partial()` and `_.curry()` are great example of higher-order functions as both of them accepts and returns functions.

> **Higher-order function** are functions that accept (as parameters) and/or return other functions.

Entire Lodash library is full of higher-order functions. The most notable of them are:
[`_.identity()`][identity], [`_.negate()`][negate], [`_.memoize()`][memoize],
[`_.constant()`][constant], [`_.property()`][property], [`_.iteratee()`][iteratee],
[`_.matches()`][matches], [`_.conforms()`][conforms], [`_.overSome()`][overSome], [`_.overEvery()`][overEvery],
[`_.flow()`][flow].

If you are using Lodash (or plan to use) on a daily basis it is good to be aware of their existence, as they considerably reduce amount of code that has to be written.
Furthermore, they contribute to improvement of readability of code.
I wont go into details of describing each of those functions as [Lodash docs][docs] are excellent in this matter.
I will make only one exception: `_.flow()`. Flow function is one of the most useful in library - it allows to compose new functions by chaining other functions one after another.
Output (return value) of every subsequent function becomes an input for next function in sequence. It is similar to pipe (`|`) operator in Linux `bash`.
From mathematical point of view it is a classical function composition:
```javascript
_.flow([f, g, h])(x) <=> f(g(h(x)))
```
Thanks to `_.flow()` it is easy to *assemble* new functions from existing ones:
```javascript
var sumAll = _.flow([_.concat, _.flattenDeep, _.sum]);
_.sum(1, 2, [3, 4]);
> 0
sumAll(1, 2, [3, 4]);
> 10
```
`_.flow()` is similar to [`_.chain()`][chain], however unlike `_.chain()`, which binds to data in very first invocation,
result of `_.flow()` is a function that accepts data at the end.
This implies it can be assigned to variable or passed as parameter, allowing it to be effectively reused for different data sets.

Below you have code that enumerates 5 countries with largest cities in the world.
I have used the ES 2015 arrow function notation for brevity:

```javascript
var cities = require('./cities.json');

_(cities)
  .filter(c => c.population >= 5000000)
  .countBy(c => c.country)
  .toPairs()
  .map(c => _.zipObject(['country', 'numOfCities'], c))
  .orderBy(c => c.numOfCities, 'desc')
  .take(5)
  .value();
```
`cities.json` contains data about 91 largest cities in the world.
Data about population taken from [Wikipedia](https://en.wikipedia.org/wiki/List_of_cities_proper_by_population).

Now, let's use `_.partial()` and `_.curry()` to rewrite this example:

```javascript
var greatherThan = threshold => _.partial(_.gte, _, threshold);
var populationGreatherThan = threshold => _.conforms({ population: greatherThan(threshold) });
var zipObject = _.curry(_.zipObject);

_(cities)
  .filter(populationGreatherThan(5000000))
  .countBy(_.property('country'))
  .toPairs()
  .map(zipObject(['country', 'numOfCities']))
  .orderBy(_.property('numOfCities'), 'desc')
  .take(5)
  .value();
```

Alternatively, we could define as `var greatherThan = _.curryRight(_.gte)`.
`_.curryRight()` is similar to `_.curry()` but it binds parameters in reverse order (starting from the last one).

Furthermore, for functions that accept `iteratee` argument (functions like `_.map()`, `_.countBy()`, `_.groupBy()`, ...), Lodash automatically wraps `iteratee` argument with `_.iteratee()` function, which in order for string parameters delegates to `_.property()` function.
Therefore, code can be shortened even further:

```javascript
var greatherThan = _.curryRight(_.gte)
var populationGreatherThan = threshold => _.conforms({ population: greatherThan(threshold) });
var zipObject = _.curry(_.zipObject);

_(cities)
  .filter(populationGreatherThan(5000000))
  .countBy('country')
  .toPairs()
  .map(zipObject(['country', 'numOfCities']))
  .orderBy('numOfCities', 'desc')
  .take(5)
  .value();
```

## Lodash/fp

Once I got used to use `_.curry()` and `_.partial()` on daily basis I've noticed that most of the time I *curry* most of the functions.
Moreover, most of the time I skipped first parameter (or use `*Right()` variant of aforementioned functions).

Then I stumbled upon `lodash/fp` variant of Lodash, which
> promotes a more functional programming (FP) friendly style by exporting an instance of lodash with its methods wrapped to produce immutable auto-curried iteratee-first data-last methods.

`Lodash/fp` basically introduces following changes:
1. **curried** functions - all functions are curried by default,
2. **fixed** arity - all functions have fixed arity, so they don't cause problems (as shown before) with curring. Any functions that have optional parameters are split to 2 separate functions (e.g. `_.curry(fn, arity?)` is split into `_.curry(fn)` and `_.curryN(fn, arity)`),
3. **rearanged** parameters - functions parameters are re-arranged so data is expected as a last parameter, because in real life usecases you most of the time want to fix iteratee parameters and leave data parameters *open*,
4. **immutable** parameters - functions no longer mutate passed parameters, but returns altered copy of object,
5. **capped** iteratee callbacks - have arity caped to 1, so they don't pose problems with curring (see 2.),
6. no more **chaining** - function chaining using [`_.chain()` or `_()`][chain] is no longer supported. Instead [`_.flow()`][flow] can be used.

For more details and motivation for each individual change go to [Lodash FP guide](https://github.com/lodash/lodash/wiki/FP-Guide).
In short all of those changes together result in much more declarative, error-prone and boilerplate-free code.

Once again our example rewritten to `lodash/fp` style would look like this:
```javascript
_.flow([
  _.filter(_.conforms({ population: _.gte(_, 5000000) })),
  _.countBy('country'),
  _.toPairs,
  _.map(_.zipObject(['country', 'numOfCities'])),
  _.orderBy('numOfCities', 'desc'),
  _.take(5)
])(cities);
```
As you can see, there is no more `_.curry()` invocations as functions are curried by default.
`_.chain()` invocation has been replaced with `_.flow()` and cities parameter is passed at the end.
If we would saved result of `_.flow()` to a variable, then we could reuse it for different cities dataset.

# Summary

Understanding **higher-order functions**, especially `_.partial()` and `_.curry()`, is crucial if we want to benefit to the maximum  extent from functional libraries like Lodash.

In my upcoming article I will show that Lodash is not only list manipulation library.  
I will show how higher-order functions and customizers can improve readability at the same time reducing number of lines of code.

[docs]: https://lodash.com/docs/
[toArray]: https://lodash.com/docs/#toArray
[partial]: https://lodash.com/docs/#partial
[curry]: https://lodash.com/docs/#curry
[flow]: https://lodash.com/docs/#flow
[identity]: https://lodash.com/docs/#identity
[negate]: https://lodash.com/docs/#negate
[memoize]: https://lodash.com/docs/#memoize
[constant]: https://lodash.com/docs/#constant
[property]: https://lodash.com/docs/#property
[iteratee]: https://lodash.com/docs/#iteratee
[matches]: https://lodash.com/docs/#matches
[conforms]: https://lodash.com/docs/#conforms
[overSome]: https://lodash.com/docs/#overSome
[overEvery]: https://lodash.com/docs/#overEvery
[chain]: https://lodash.com/docs/#chain
