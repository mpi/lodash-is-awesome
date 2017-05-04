var _ = require('lodash/fp');

function customizer(fn, a){
  if(_.isFunction(fn)){
    return fn.apply(this, [a]);
  }
}

var patch = _.mergeWith(customizer);

var transform = patch({
  phone: _.concat('555-999-000'),
  favorite: _.negate(_.identity),
  recentCalls: _.head
});

var contact = {
  contact: 'John Doe',
  phone: ['555-123-456'],
  favorite: false,
  recentCalls: [
    { time: '2017-01-02 12:32:12', dir: 'outbound' },
    { time: '2016-12-20 20:00:45', dir: 'inbound' },
    // ...
  ]
};

console.log(transform(contact));

var addPhoneNumber = phone => patch({phone: _.concat(phone)});
var toggle = _.negate(_.identity);
var toggleFavourite = patch({favorite: toggle});
var mostRecentCallOnly = patch({recentCalls: _.head});

var transform2 = _.flow([
    addPhoneNumber('555-999-000'),
    toggleFavourite,
    mostRecentCallOnly
]);

console.log(transform2(contact));
console.log(contact);
