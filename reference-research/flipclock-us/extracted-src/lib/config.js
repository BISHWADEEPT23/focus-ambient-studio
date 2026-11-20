import storage from './core/storage.js';

let resolveReady;
const ready = new Promise((resolve) => {
	resolveReady = resolve;
});

const modes = {
	twelveHour: "12hr",
	twentyFourHour: "24hr"
},
	timeModeDefault = modes.twelveHour,
	fontDefault = 'default';

const cache = {};

// preload!
Promise.all([
	storage.get('font'),
	storage.get('timeMode'),
	storage.get('showSeconds'),
	storage.get('toolbar')
]).then(([font, timeMode, showSeconds, toolbar]) => {
	cache.timeMode = timeMode ?? timeModeDefault;
	cache.showSeconds = showSeconds === "true" || showSeconds === true;
	cache.font = font ?? fontDefault;
	cache.toolbar = toolbar ?? "false";

	console.log("Loaded settings", cache);

	resolveReady(cache);
});

const exports = {};
export default exports;

exports.ready = () => ready;

function get(key) {return cache[key];}
function set(key, value) {
	cache[key] = value;
	return storage.set(key, value);
};

exports.get = get;
exports.set = set;

exports.setFont = (font) => set('font', font);
exports.getFont = () => get('font');

exports.setTimeMode = (mode) => set('timeMode', mode);
exports.getTimeMode = () => get('timeMode');

exports.setShowSeconds = (showSeconds) => set('showSeconds', showSeconds ? "true" : "false");
exports.getShowSeconds = () => get('showSeconds');

exports.data = () => cache;

exports.modes = modes;

