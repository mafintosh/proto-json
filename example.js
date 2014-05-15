var proto = require('./');

var schema = proto([{
	name:'lol',
	type:'double'
}]);

console.log(schema.infer({lol:42, foo:true}));