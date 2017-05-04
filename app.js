/* globals _ */

console.log = function(text){
    
    if(_.isObject(text)){
        text = JSON.stringify(text, null, 2);
    }
    
    var oldText = $('#out').text();
    $('#out').text(oldText + text + '\n');
};

$(document).ready(function(){

    var state = { items: [666] };

    var merge = _.partial(_.mergeWith, state, _, customizer);

    var append = function(array) { return _.curry(_.concat, 2)(_)(array); };

    var patch = function(diff){
        return function(x){
            return _.mergeWith({}, diff, function(obj, y){
                if(y === _.partial.placeholder){
                    return x;
                }
                if(_.isFunction(y)){
                    return _.curry(y)(_)(x);
                }
            });
        };
    };

    var addItem = patch({
        items: append(_)
    });
    
//    console.log(append(_)(123)(345));
    merge(addItem('Hello World'));

    console.log(state);
});


function customizer(obj, fn){
    if(_.isFunction(fn)){
       return fn.call(null, obj);
    }
}

