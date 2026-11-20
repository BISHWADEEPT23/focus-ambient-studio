import * as environment from './environment.js';

const exports = {};
export default exports;

exports.get = (key) => {
	return new Promise((resolve, reject) => {
		if (environment.chrome) {
			chrome.storage.sync.get(null, function(objs) {
				resolve(objs[key]);
			});
		} else {
			resolve(localStorage[key]);
		}
	});
};

exports.set = function(key, value) {
	return new Promise((resolve, reject) => {
		if (environment.chrome) {
			var obj = {};
			obj[key] = value;
			chrome.storage.sync.set(obj, () => resolve());
		} else {
			localStorage[key] = value;
			resolve();
		}
	});
};
