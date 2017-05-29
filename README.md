# Lodash is not (only) for list manipulation!

In this article I would like to share with you my appreciation for one of my favorite Javascript library.
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

<!--
**Disclaimer**: this article is neither a introduction to Lodash nor detailed guide to it's function.
If you are not familiar with some of functions that are used in following examples or you don't know Lodash at all,
[official documentation page](https://lodash.com/docs) is an excellent source of information.
-->

**Disclaimer**: This article assumes that the reader is familiar with concept of **higher-order functions** and knows how functions like `_.curry()` and `_.partial()` works.
Moreover, in this article when I refer to *"Lodash"* I mean `lodash/fp` variant of Lodash.
If you haven't heard about `lodash/fp`, higher-order functions or just need some refresh of your memory, please have a look at my previous article on [Higher-order functions in Lodash](HIGHER_ORDER_FUNCTIONS.md).

<!--
In the begining of article I asserted that Lodash is not only list manipulation library, so lets leave last example behind and move forward to something more interesting.
-->

One of the things I love in Lodash is that it is extremely flexible and adaptable.
Even if you don't find function that you need, there is a high chance that you can build one with just a few lines of code.
Author of Lodash placed throughout it's codebase hooks and extension points that allows further customizations.
One form of such extension points are **Customizers**.

## Customizers

**Customizers** are similar to Object-Oriented [*Strategy pattern*](https://en.wikipedia.org/wiki/Strategy_pattern) from GoF Design Patterns book.
You can vastly change object behavior by substituting one strategy to another.  
<!--Before we jump to more complicated example lets explore `_.merge()` function.-->
Let's have a look at how customizers works in practice.
Suppose we have a partial contact information, that we would like to combine into one object:
```javascript
var contact1 = {
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
As you might expect `_.merge()` function does the job for us and merges two objects.
However, if same property is present in both merged objects property value from last object wins.
In our example it is unfortunate, as we loose information about one of the contact's phone number.
Fortunately there is an alternative version of `_.merge()` that accepts an additional function which allows to customize a way in which properties are merged.
Let's give it a try:

```javascript
function customizer(src, dst){
  if(_.isArray(src)){
    return _.concat(src, dst);
  }
}
_.mergeWith(customizer, concact1, contact2);
< {
<   name: 'Sherlock Holmes',
<   address: 'Baker Street',
<   phone: ['555-123-456', '555-654-321']
< }
```
**Bonus**: Alternatively `customizer` can be written this way:
```javascript
var customizer = _.cond([[_.isArray, _.concat]]);
```

If one of merged properties points to an array then our customizer returns a new array that will include values from both merged objects.
Notice that if merged value is not an array our customizer won't return any value (or to put it in another way - it will return `undefined`).
In such case Lodash will fallback to default strategy.


But why should we limit ourselves just to arrays concatenation?

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
Remember that all `lodash/fp` functions are auto-curried, so we can pass them subset of parameters, as well as,
parameter placeholders `_` and in result we will get new function with some of the parameters fixed.

The resulting `patch()` is a higher-order function that returns new function that transforms objects based on provided *recipe*. Recipes are formulated in a pretty declarative way, by explicitly telling which function use to merge given property.

**Note**: order of parameters in `_.mergeWith(customizer, object, source)` is a little bit unfortunate, as accepts data (`object`) parameter as a second and not last parameter.
If it would be the other way we could fully benefit from curring and define `patch` simply as `var patch = _.mergeWith(customizer)`.
This order of parameters forced us to skip second of its parameter using `_`.
Alternatively, we could re-arrange parameters like this:
```javascript
var mergeWithRearg = _.rearg(_.mergeWith, [0, 2, 1]);
var patch = mergeWithRearg(customizer);
```
or just:
```javascript
var patch = _.flip(_.mergeWith(customizer));
```
<!--
Thanks to `lodash/fp` patch does not mutate parameters, but returns altered copy. Subsequent patches can be combined together using `_.flow()` function.
-->

Now we can create *patches* and apply them to a source objects:

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

Alternatively we can extract some helper functions, and split every edition to separate patch to make things more explicit.
Then we can combine subsequent patches together using `_.flow()` function:

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

<!--
`_.mergeWith()` is great example of how customizers can be used to bend Lodash to
Just with bunch of simple yet flexible building blocks and few lines of code you can build sophisticated constructs.
-->

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
