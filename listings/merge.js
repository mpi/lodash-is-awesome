var _  = require('lodash/fp');

var concact1 = {
  name: 'Sherlock Holmes',
  phone: ['555-123-456']
};
var contact2 = {
  address: 'Baker Street',
  phone: ['555-654-321']
};
console.log(_.merge(concact1, contact2));

// var concatArrays = _.cond([[_.isArray, _.concat]]);
function concatArrays(a, b){
  if(_.isArray(a)){
    return _.concat(a, b);
  }
}

console.log(_.mergeWith(concatArrays, concact1, contact2));
