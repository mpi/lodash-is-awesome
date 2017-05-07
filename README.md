# Lodash is Awesome!

In this article I would like to share with you my appreciation for one of my favorite library.
This library is Lodash.
Most of people know Lodash from constructs like this:

```javascript
var cities = require('./cities.json');

_(cities)
  .filter(c => c.population >= 5000000)
  .countBy('country')
  .toPairs()
  .map(c => _.zipObject(['country', 'numOfCities'], c))
  .orderBy('numOfCities', 'desc')
  .take(5)
  .value();
```

But Lodash is much more than list manipulation library.
In this post I would like to shed a light at some less popular, yet in my opinion, extremely useful Lodash features.

**Disclaimer**: this article is neither a introduction to Lodash nor detailed guide to it's function.
If you are not familiar with some of functions that are used in following examples or you don't know Lodash at all,
official documentation page is an excellent source of information.

## Higher-Order functions

In order to better understand power of Lodash, we have to understand concept of **higher-order functions**. 

> **Higher-order function** are functions that accept (as parameters) and/or return other functions.

Let's take a look at a simple function:

```javascript
function mul(a, b){
  return a * b;
}
```
Let's play a little bit with this function:

```javascript
> mul(21, 2)
< 42
```
Suppose we often use this function to double a given value. We can create then new helper function like this:
```javascript
function dbl(v){
  return mul(v, 2);
}
```
Now we can quickly double values like this:
```javascript
> dbl(5)
< 10
```
What we see here is a classical function delegation (one function delegates to another).

Yet, there is another, more functional, way to accomplish similar result (reuse of function code).

### Partial

It is known as partial application. Witch parial application we can create `dbl()` function in following way:
```javascript
var dbl = partial(mul, 2);
```
Partial takes function passed as first parameter, binds some of it's parameters to a fixed value and returns new function with reduced arity (number of parameters).
Parial is great example of higher-order function as it both accepts and returns function.
Let's imagine how implementation of partial in JavaScript could look like.
```javascript
function partial(fn) {
  var fixed = [].slice.apply(arguments, [1]);
  return function() {
    var args = fixed.concat([].slice.apply(arguments));
    return fn.apply(this, args);
  };
}
```
Our function takes and stores in local variable (`fixed`) all except first parameters then returns new function that calls our original function `fn` with parameter list prepended with parameters stored in `fixed` variable.
This Vanilla JS implementation is simplistic yet powerfull.

Notice ugly invocations of `slice.apply()`. They are neceseary because `arguments` object in JavaScript is not a real array, therefore it doesn't have `slice` method, so we use `Function.prototype.apply()`.

We can rewrite this function and already benefit from using Lodash.
This is because Lodash also accepts `arguments` as a function parameter wherever array parameter is expected.
You can also easily convert any array-like object to actual array using `_.toArray()`.
Our enhanced implementation would look like this:
```javascript
function partial(fn) {
  var bound = _.tail(arguments);
  return function() {
    var args = _.concat(bound, arguments);
    return fn.apply(this, args);
  };
}
```
But we don't have to write our own implementation of `partial`, as Lodash already has it: `_.partial()`, and as you will see in next example, it is much more powerful than this simplistic one.

Let's say we have a `div()` function that divides numbers, defined as:
```javascript
function div(a, b){
  return a / b;
}
```
Now we would like to reuse our `div(a, b)` function to create a new `half(n)` function that divides given number by half, just as we did in our previous scenario. At first glance it is similar to our `mul`/`dbl` scenario. But earlier, order of parameters was irrelevant. Now we need to fix second parameter and leave first parameter *loose*. We cannot do it with our naive implementation, but fortunately authors of Lodash took it into consideration and provided a solution for such cases.
In Lodash we can *skip* parameter binding using a *placeholder* like this:
```javascript
var half = _.partial(div, _, 2);
var inv = _.partial(div, 1);
```
This way we created two new functions one that halves and the other that inverts:
```javascript
> half(5);
< 2.5
> inv(5);
< 0.2
```

### Curring

Lodash offers one more function similar to `_.partial()`. This function is `_.curry()`. Let's give it a spin:

```javascript
> var divC = _.curry(div);
> divC(4, 2)
< 2
> divC(4)(2)
< 2
> divC(4)
< [Function]
> var half = divC(_, 2);
> half(4)
< 2
```
After transforming function with `_.curry()` we get a brand new function that will accumulate and fix parameters from subsequent invocations until all expected parameters are specified, in which case original function is invoked.
Parameters can be specified one-by-one or in batches.
As you can see you can also *skip* parameters using `_` placeholder.

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

## `_.partial() and _.curry()` in action

Let's use `_.partial()` and `_.curry()` to rewrite our initial example:

```javascript
var gte = v => _.partial(_.gte, _, v);
var zipObject = _.curry(_.zipObject);

var countriesWithLargestCities = _(cities)
  .filter(_.conforms({ population: gte(5000000) }))
  .countBy('country')
  .toPairs()
  .map(zipObject(['country', 'numOfCities']))
  .orderBy('numOfCities', 'desc')
  .take(5)
  .value();
```

Alternatively, we could define `var gte = _.curryRight(_.gte)`.
`_.curryRight()` is similar to `_.curry()` but it binds parameters in reverse order (starting from the last one).

## Lodash/fp

Once I got used to use `_.curry()` and `_.partial()` on daily basis I've noticed that most of the time I `curry` most of the functions.
Moreover, most of the time I skipped first parameter (or use `*Right()` variant of aforementioned functions).

Then I stumbled upon `lodash/fp` variant of Lodash, which
> promotes a more functional programming (FP) friendly style by exporting an instance of lodash with its methods wrapped to produce immutable auto-curried iteratee-first data-last methods.

`Lodash/fp` basically introduces following changes:
1. **curried** functions - all functions are curried by default,
2. **fixed** arity - all functions have fixed arity, so they don't pose problems (as shown before) with curring. Any functions that have optional parameters are split to 2 separate functions (e.g. `_.curry(fn, arity?)` is split into `_.curry(fn)` and `_.curryN(fn, arity)`),
3. **rearanged** parameters - functions parameters are re-aranged so data is expected as a last parameter, because in real life usecases you most of the time want to fix iteratee parameters and leave data parameters *open*,
4. **immutable** parameters - functions no longer mutate passed parameters,
5. **capped** iteratee callbacks - have arity caped to 1, so they don't pose problems with curring (see 2.),
6. no more **chaining** - function chaining using `_.chain()` or `_()` is no longer supported. Instead `_.flow()` can be used.

For more details and motivation for each individual change go to Lodash FP guide.
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

## Lodash is not only for list manipulation

In the begining of article I asserted that Lodash is not only list manipulation library, so lets leave last example behind and move forward to something more interesting.

**Disclaimer**: from now on I will refer to and use only functions from `lodash/fp` module.

### `_.merge()` and `_.mergeWith()`

Before we jump to more complicated example lets explore `_.merge()` function.
```javascript
var concact1 = {
  name: 'Sherlock Holmes',
  phone: ['555-123-456']
};
var contact2 = {
  address: 'Baker Street',
  phone: ['555-654-321']
};
_.merge(concact1, concact2);
< {
<   name: 'Sherlock Holmes',
<   address: 'Baker Street',
<   phone: ['555-654-321']
< }
```
As you might expect `_.merge()` function merges two objects. If given property is present in both merged objects property from last object wins.
In our example it is unfortunate, as we loose info about one of the contact's phone number.
Fortunately there is an alternative version of `_.merge()` that accepts an additional function which can customize a way in which properties are merged. Let's give it a try:

```javascript
function customizer(a, b){
  if(_.isArray(a)){
    return _.concat(a, b);
  }
}
_.mergeWith(customizer, concact1, contact2);
< {
<   name: 'Sherlock Holmes',
<   address: 'Baker Street',
<   phone: ['555-123-456', '555-654-321']
< }
```
**For experts**: Alternatively `customizer` can be written this way:
```javascript
var customizer = _.cond([[_.isArray, _.concat]]);
```

`_.mergeWith()` is great example of Lodash power that comes from flexibility. Just with bunch of simple yet flexible building blocks and few lines of code you can build sophisticated constructs.

But why should we stop on arrays concatanation?

Here is how we can make our customizer even more generic:
```javascript
function customizer(val, fn){
  if(_.isFunction(fn)){
    return fn.apply(this, [val]);
  }
}
```
Now we will fix this customizer to as a first parameter of `_.mergeWith()`. Let's call this resulting function `patch`:
```javascript
var patch = recipe => _.mergeWith(customizer, _, recipe);
```

The resulting `patch()` is a higher-order function that returns new function that transforms objects based on provided *recipe*. Recipes are formulated in a pretty declarative way.

**Note**: order of parameters in `_.mergeWith(customizer, object, source)` is a little bit unfortunate, as accepts data (`object`) parameter as a second and not last parameter.
If it would be the other way we could fully benefit from curring and define `patch` simply as `var patch = _.mergeWith(customier)`.
This order of parameters forced us to skip second of its parameter using `_`.
Alternatively, we could re-arrange parameters like this:
```javascript
var mergeWithRearg = _.rearg(_.mergeWith, [0, 2,1 ]);
var patch = mergeWithRearg(customizer);
```

Thanks to `lodash/fp` patch does not mutate parameters, but returns altered copy. Subsequent patches can be combined together using `_.flow()` function.

```javascript
var transform = patch({
  phone: _.concat('555-999-000'),
  favorite: _.negate(_.identity),
  recentCalls: _.head
});

transform({
  fullName: 'John Doe',
  phone: ['555-123-456'],
  favorite: false,
  recentCalls: [
    { time: '2017-01-02 12:32:12', dir: 'outbound' },
    { time: '2016-12-20 20:00:45', dir: 'inbound' },
    // ...
  ]
});

< {
<   contact: 'John Doe',
<   phone: [ '555-999-000', '555-123-456' ],
<   favorite: true,
<   recentCalls: { time: '2017-01-02 12:32:12', dir: 'outbound' }
< }
```

Alternatively we can extract some helper functions to make things more explicit:

```javascript
var addPhoneNumber = phone => patch({phone: _.concat(phone)});
var toggle = _.negate(_.identity);
var toggleFavourite = patch({favorite: toggle});
var mostRecentCallOnly = patch({recentCalls: _.head});

var transform2 = _.flow([
    addPhoneNumber('555-999-000'),
    toggleFavourite,
    mostRecentCallOnly
]);
```

# To-Do list implementation

Let's see how far we can push this simple implementation. How complicated logic can we express using this naive `patch()` function, before we fall back to more classical (imperative) style of programming?
As a benchmark let's try to implement all features of famous TodoMVC project. Of course we will focus on domain/model part and we will skip any UI/view related parts.

Let's enumerate all features of To-Do List supported by TodoMVC:
1. create new To-Do item,
2. mark all items as completed,
3. clear all completed items.
4. toggle single item as completed/active,
5. rename single item,
6. remove single item.
<!--7. show all/show active/show completed filter.-->

We will go with one-by-one with this list, but first lets define how model of our To-Do list will look like:

```javascript
var model = {
  items: [
    { title: 'Implement To-Do list with Lodash', completed: false}
  ]
};
```

## 1. Creating new To-Do item

Adding new To-Do item is pretty straightforward after what we learned from previous examples.
```javascript
var addItem = item => patch({
  items: _.concat({title: item})
});
```

## 2. Mark all items as completed

First we will create function for completing single item and then we will apply it to all items in list:
```javascript
var complete = patch({
  completed: true
});
var forAll = _.map;
var completeAll = patch({
  items: forAll(complete)
});
```
We have also created an alias `forAll` for `_.map` function as it will be improve readability.

## 3. Clear all completed items

Now we jump to requirement number 6 as is it pretty similar to

```javascript
var isCompleted = _.matches({
  complete: true
});
var removeIf = _.reject;
var clearCompleted = patch({
  items: removeIf(isCompleted)
});
```
Similarly we created `removeIf` as an alias for `_.reject`.

## 4. Toggle single item as completed/active,

Defining function that will toggle completed flag for single item is easy:
```javascript
var toggle = _.negate(_.identity);
var toggleItem = patch({
  completed: toggle
});
```
Toggling single item in To-Do list and leave all the others intact, is a whole different story.
In order to do it, we will first create new higher-order function that will invoke function passed as parameter conditionally, based on given predicate:
```javascript
function onlyIf(fn, condFn){
  return function(){
    var args = _.toArray(arguments);
    if(condFn.apply(this, args)){
      return fn.apply(this, args);
    }
  };
}
function pow(n) { return n*n; }
var powN = onlyIf(pow, _.isNumber);
powN(4);
< 16
powN('4');
< undefined
```
`onlyIf()` function is a little bit too imperative. Maybe `Lodash` can help us with this somehow? Of course it can!
Take a look at `_.cond()`. Now we have:
```javascript
var onlyIf = (fn, condFn) => _.cond([[condFn, fn]]);
var powN = onlyIf(pow, _.isNumber);
powN(4);
< 16
```
Now we need one more function:
```javascript
var otherwise = (fn, defaultFn) => _.cond([[_.flow([fn, _.negate(_.isUndefined)]), fn][_.T, defaultFn]]);
var powN = otherwise(onlyIf(pow, _.isNumber), _.constant('number expected!'));
powN(4);
< 16
powN('4');
< 'number expected!'
```
I must say that this looks a little bit too extreme with `otherwise()`, and probably imperative version would look much more understandable. I leave reader with task (of rewriting this function) as an excercise.
Fragment `otherwise(onlyIf(pow), _.isNumber), _.constant('number expected!')` is not much better. It doesn't read naturally. Definatelly it is less readable than `powN(n){ return _.isNumber(n) ? n * n : 'number expected!'}`. Maybe we went one bridge too far.
But let's try one more trick. Let's assign both function to `Function.prototype` and pass original function as `this` parameter:
```javascript
Function.prototype.onlyIf = function(condFn) {
  return _.cond([[condFn, this]]);
};
Function.prototype.otherwise = function(defaultFn) {
  var noResult = _.flow([this, _.isUndefined]);
  return _.cond([[noResult, defaultFn], [_.T, this]]);
};

var powN = pow.onlyIf(_.isNumber).otherwise(_.constant('number expected!'));
powN(4);
< 16
powN('4');
< 'number expected!'
```

He had to switch from arrow notation (`() => {}`) to function expression, as arrow functions do not bind own `this` parameter.
Now we can get back to our task. Toggling particular item.
```javascript
var completeIf = (condFn) => patch({
  items: forAll(complete.onlyIf(condFn).otherwise(_.identity))
});
```
Additionally we will create own customized matcher. We can use our previous customizer, adding support for regexp's:
```javascript
function customizer(val, op){
  if(_.isFunction(op)){
    return op.apply(this, [val]);
  }
  if(_.isRegExp(op)){
    return op.test(val);
  }
}
var matches = _.isMatchWith(customizer);
```
Our enhanced customizer effectively transformed `_.isMatchWith()` into something even more flexible than `_.conforms()` as it allows to match object properties against: fixed values, regular expressions and function predicates:

```javascript
var involvesLearning = matches({ title: /[Ll]earn/ });
involvesLearning({
  title: 'Learn Function Programming'
});
< true
involvesLearning({
  title: 'Walk the dog'
});
< false
var hasNonEmptyTitle = matches({ title: _.negate(_.isEmpty) });
hasNonEmptyTitle({
  title: ''
})
< false
```

## 5. Rename single item + 6. remove single item

With helper functions introduced in previous paragraphs, remaining two functionalities are dead simple:
```javascript
var changeTitleTo => title => patch({
  title: title
});
var hasTitle = title => matches({
  title: title
});
var renameItem = (newTitle, oldTitle) => patch({
  items: forAll(changeTitleTo(newTitle).onlyIf(hasTitle(oldTitle).otherwise(_.identity)))
});
var removeItem = (title) => patch({
  items: removeIf(hasTitle(oldTitle))
});

```

## All the pieces together

Let's put all the pieces together. I have split function definitions in two groups.
First group consist of more abstract and more reusable (higher-order) functions.
Second group includes more domain-specific functions.

```javascript
var _ = require('lodash/fp');

function customizer(val, op){
  if(_.isFunction(op)){
    return op.apply(this, [val]);
  }
  if(_.isRegExp(op)){
    return op.test(val);
  }
}

// general-purpose, higher-order functions:

var patch = recipe => _.mergeWith(customizer, _, recipe);
var matches = _.isMatchWith(customizer);
var forAll = _.map;
var removeIf = _.reject;
var toggle = _.negate(_.identity);

Function.prototype.onlyIf = function(condFn) {
  return _.cond([[condFn, this]]);
};
Function.prototype.otherwise = function(defaultFn) {
  var noResult = _.flow([this, _.isUndefined]);
  return _.cond([[noResult, defaultFn], [_.T, this]]);
};

// domain-specific functions:

var addItem = item => patch({
  items: _.concat({title: item})
});
var complete = patch({
  completed: true
});
var completeAll = patch({
  items: forAll(complete)
});
var isCompleted = matches({
  complete: true
});
var clearCompleted = patch({
  items: removeIf(isCompleted)
});
var toggleItem = patch({
  completed: toggle
});
var completeItemIf = condFn => patch({
  items: forAll(complete.onlyIf(condFn).otherwise(_.identity))
});
var changeTitleTo = title => patch({
  title: title
});
var hasTitle = title => matches({
  title: title
});
var renameItem = (newTitle, oldTitle) => patch({
  items: forAll(changeTitleTo(newTitle).onlyIf(hasTitle(oldTitle)).otherwise(_.identity))
});
var removeItem = (title) => patch({
  items: removeIf(hasTitle(oldTitle))
});

// demo:

var program = _.flow([
  addItem('Learn Lodash'),
  addItem('Learn FP'),
  addItem('Write Blog Post'),
  renameItem('Learn Functional Programming', 'Learn FP'),
  completeItemIf(hasTitle(/Learn/))
]);

console.log(program({items: []}));
```

You can also find full listing in my [Github repo](http://github.com/mpi/lodash-is-awesome/) or
play around with it at this [JS Fiddle](https://jsfiddle.net/67bdchwg/1/).

# Summary
TBD
