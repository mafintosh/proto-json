var deduceType = function(val, nested) {
	if (Buffer.isBuffer(val)) return 'bytes';
	if (nested && Array.isArray(val)) return 'array';

	var t = typeof val;

	switch (t) {
		case 'boolean': return 'bool';
		case 'number':  return 'double';
		case 'object':  return 'json';
		case 'string':  return 'string';
	}

	throw new Error('Unknown type: '+t);
};

var indexSchemaEach = function(index, prefix, obj, parent) {
	if (obj === null || obj === undefined) return;

	index[prefix] = [parent, obj];

	if (obj.type === 'object') {
		if (!obj.fields) return;
		for (var i = 0; i < obj.fields.length; i++) indexSchemaEach(index, prefix+'.'+obj.fields[i].name, obj.fields[i], obj);
		return;
	}

	if (obj.type === 'array') {
		if (obj.items) indexSchemaEach(index, prefix+'.*', obj.items, obj);
		return;
	}
};

var visitEach = function(obj, fn, prefix, parent) {
	if (obj === null || obj === undefined) return true;
	if (!fn(prefix, obj, parent)) return false;

	if (Array.isArray(obj)) {
		for (var i = 0; i < obj.length; i++) if (!visitEach(obj[i], fn, prefix+'.*', obj)) return false;
		return true;
	}

	if (typeof obj === 'object') {
		var keys = Object.keys(obj);
		for (var i = 0; i < keys.length; i++) if (!visitEach(obj[keys[i]], fn, prefix+'.'+keys[i], obj)) return false;
		return true;
	}

	return true;
};

var visit = function(obj, fn) {
	visitEach(obj, fn, '$', null);
};

var indexSchema = function(obj) {
	var index = {};
	indexSchemaEach(index, '$', obj, null);
	return index;
};

var NestedSchema = function(schema) {

};

NestedSchema.prototype.infer = function() {

};

NestedSchema.prototype.validate = function() {

};

NestedSchema.prototype.toJSON = function() {

};

var ShallowSchema = function(schema) {
	this.schema = schema || [];
	this.index = {};

	if (this.schema.fields) this.schema = this.schema.fields;

	for (var i = 0; i < this.schema.length; i++) {
		var sh = this.schema[i];
		var type = sh.type;
		if (type === 'object' || type === 'array') type = 'json';
		sh.type = type;
		this.index[sh.name] = type;
	}
};

ShallowSchema.prototype.infer = function(obj) {
	var keys = Object.keys(obj);
	var updated = false;
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var type = this.index[key];
		var objType = deduceType(obj[key], false);
		if (!type) {
			this.index[key] = objType;
			this.schema.push({name:key, tag:this.schema.length, type:objType});
			updated = true;
		} else {
			if (type !== objType) return false;
		}
	}
	if (updated) return this.schema;
	return null;
};

ShallowSchema.prototype.validate = function(obj, opts) {
	var strict = opts && opts.strict;
	var keys = Object.keys(obj);
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var type = this.index[key];

		if (strict && !type) return false;
		if (!type) continue;

		var objType = deduceType(obj[key]);
		if (type !== objType) return false;
	}
	return true;
};

ShallowSchema.prototype.toJSON = function() {
	return this.schema;
};

module.exports = function(schema) {
	return new ShallowSchema(schema);
};