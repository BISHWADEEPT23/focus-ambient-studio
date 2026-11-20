import {$} from '../../vendor/jquery.js';
import {blink} from "../ui/blinker.js";
import {loadFlipclock} from "./flipclock.js";
import {layout} from "./layout/countdown.js";

var countdown_blink;

export function initCountdown() {
  $(document).on({
    "countdown_minute_up": function() {
      var value = parseInt($("#countdown_min").html(), 10);
      if (value < 99) $("#countdown_min").html(value + 1);
    },
    "countdown_minute_down": function() {
      var value = parseInt($("#countdown_min").html(), 10);
      if (value > 0) $("#countdown_min").html(value - 1);
    },
    "countdown_hour_up": function() {
      var value = parseInt($("#countdown_hour").html(), 10);
      if (value < 99) $("#countdown_hour").html(value + 1);
    },
    "countdown_hour_down": function() {
      var value = parseInt($("#countdown_hour").html(), 10);
      if (value > 0) $("#countdown_hour").html(value - 1);
    },
    "countdown_second_up": function() {
      var value = parseInt($("#countdown_sec").html(), 10);
      if (value < 99) $("#countdown_sec").html(value + 1);
    },
    "countdown_second_down": function() {
      var value = parseInt($("#countdown_sec").html(), 10);
      if (value > 0) $("#countdown_sec").html(value - 1);
    },
    "countdown_start": function() {
      var sec = parseInt($("#countdown_sec").html(), 10),
        min = parseInt($("#countdown_min").html(), 10),
        hour = parseInt($("#countdown_hour").html(), 10),
        string = hour + 'h' + min + 'm' + sec + 's',
        url = '#/c/' + string;

      $(document).trigger('hide_dialog');
      document.location = url;
    }
  });
}

export function loadCountdown(params) {
  params.done = function() {
    countdown_blink = blink({
      target: $("#container")
    });
  };
  params.unload = function() {
    countdown_blink && countdown_blink.stop();
    countdown_blink = undefined;
  }
  params.container = $("#container");
  params.start = true;

  return loadFlipclock(layout, params);
};