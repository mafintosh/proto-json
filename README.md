# proto-json

Schema thingy for protobuf (with proto/json support)

	npm install proto-json

## Usage

``` js
var proto = require('proto-json');

var schema = proto(aprotothing);

schema.validate(obj); // returns true or false
schema.infer(obj);    // update the schema by infering stuff from obj

var json = schema.toJSON();
```

## License

MIT