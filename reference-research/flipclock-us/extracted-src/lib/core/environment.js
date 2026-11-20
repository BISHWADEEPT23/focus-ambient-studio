import {$} from '../../vendor/jquery.js';

const exports = {};
export default exports;

exports.chromeBrowser = typeof chrome !== "undefined";

// chrome store app
exports.chrome = typeof chrome !== "undefined" && typeof chrome.storage !== "undefined";

function canFullscreen() {
	var elem = document.body;

	if (exports.chrome ||
		elem.requestFullscreen ||
		elem.mozRequestFullScreen ||
		elem.webkitRequestFullscreen) {
		return true;
	}

	return false;
};


if (exports.chromeBrowser) {
	$("html").addClass("chrome-browser");
}

$(() => {
	if (canFullscreen()) {
		$("html").addClass("fullscreen-capable");
	}
});

exports.isFullscreen = function() {
	if (exports.chrome) {
		return chrome.app.window.current().isFullscreen();
	} else if ("mozFullScreenElement" in document) {
		return document.mozFullScreenElement !== null;
	} else if ("webkitFullscreenElement" in document) {
		return document.webkitFullscreenElement !== null;
	} else if ("fullscreenElement" in document) {
		return document.fullscreenElement !== null;
	}

	return false;
};

exports.fullscreen = function() {
	var elem = document.body;
	if (exports.chrome) {
		chrome.app.window.current().fullscreen();
	} else if (elem.requestFullscreen) {
		elem.requestFullscreen();
	} else if (elem.mozRequestFullScreen) {
		elem.mozRequestFullScreen();
	} else if (elem.webkitRequestFullscreen) {
		elem.webkitRequestFullscreen();
	} else {
		// unsupported
		return false;
	}

	$("html").addClass("fullscreen-enabled");
};

exports.restore = function() {
	var elem = document;
	if (exports.chrome) {
		chrome.app.window.current().restore();
	} else if (elem.cancelFullscreen) {
		elem.cancelFullscreen();
	} else if (elem.mozCancelFullScreen) {
		elem.mozCancelFullScreen();
	} else if (elem.webkitCancelFullScreen) {
		elem.webkitCancelFullScreen();
	} else {
		return false;
	}

	$("html").removeClass("fullscreen-enabled");
};

// keep the current state updated
setInterval(function environmentUpdate() {
	if (exports.isFullscreen()) {
		$("html").addClass("fullscreen-enabled");
	} else {
		$("html").removeClass("fullscreen-enabled");
	}
}, 100);


