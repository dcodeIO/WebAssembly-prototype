exports.combine = function(target, var_args) {
	target = target || {};
	Array.prototype.slice.call(arguments, 1).forEach(function(arg) {
		for (var i in arg)
			if (arg.hasOwnProperty(i))
				target[i] = arg[i];
	});
	return target;
};

exports.invert = function(obj) {
	var inv = [];
	Object.keys(obj).forEach(function(key) {
		inv[obj[key]] = key;
	});
	return inv;
};
