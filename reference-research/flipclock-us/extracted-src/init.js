
// Prevent scrolling on Android / iOS devices
document.ontouchmove = function(e) {e.preventDefault();}
document.ontouchstart = function(e) {e.preventDefault();}

import config from './lib/config.js';
import {boot} from './app.js';

config.ready().then(() => boot());

