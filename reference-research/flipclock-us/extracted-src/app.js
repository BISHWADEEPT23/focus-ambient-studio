// 3rd Party Libraries
import {$} from './vendor/jquery.js';
import {Spinner} from './vendor/spin.js';

// Core functionality
import environment from './lib/core/environment.js';
import config from './lib/config.js';
import {parseTimeOutOfParams} from './lib/utils.js';

// Clock UI
import {loadFlipclock} from './lib/clock/flipclock.js';
import {initCountdown, loadCountdown} from './lib/clock/countdown.js';

import {layout as timeAMPM} from './lib/clock/layout/flipclock.js';
import {layout as timeAMPMsec} from './lib/clock/layout/flipclockSeconds.js';
import {layout as countdownLayout} from './lib/clock/layout/countdown.js';

const APP_VERSION = '2.2';

const layouts = {
  timeAMPM,
  timeAMPMsec,
  countdown: countdownLayout,
};

// UI Elements
import dialog from './lib/ui/dialog.js';
import buttons from './lib/ui/buttons.js';
import {initToggle} from './lib/ui/toggle.js';

var layout,
  active_page = '',
  active_font,
  appCache = window.applicationCache,
  // App configuration
  App = {
    page: {
      clock: "clock",
      countdown: "countdown"
    }
  };

config.ready().then(() => {
  active_font = config.getFont();
});

export function boot() {
  initCountdown();

  $(document).on({
    "hide_dialog": dialog.hide,
    "save_settings": function() {
      var options_dialog = dialog.get('options');
      dialog.hide();

      // lock in changes
      $(".toggle", options_dialog).each(function(i) {
        var toggle = $(this);
        toggle.trigger('confirm');

        // write to settings
        var binding = toggle.data('binding'),
          value = toggle.data('value');

        config.set(binding, value);
      });

      // reset UI if clock is visible
      if (active_page === App.page.clock) {
        stopClock();
        initClock();
        resize();
      }

      updateFont();
    },
    "hide_settings": function() {
      var options_dialog = dialog.get('options');
      dialog.hide();

      // reset settings
      $(".toggle", options_dialog).trigger('reset');
    },
    "fullscreen": function() {
      if (environment.isFullscreen()) {
        environment.restore();
      } else {
        environment.fullscreen();
      }
    }
  });

  $(window).resize(resize);

  function hashchange() {
    var splitHash = [],
      section = '',
      data = '';

    var hash = location.hash;

    if (hash.indexOf("#") >= 0) {
      hash = hash.replace("#!", "");
      hash = hash.replace("#", "");
      splitHash = hash.split("/");
      section = splitHash[1];
      data = splitHash[2];
    }

    switch (section) {
      // Handle countdown clocks
      case "c":
      case "countdown":
        stopClock();
        active_page = App.page.countdown;
        var params = parseTimeOutOfParams(data)

        layout = loadCountdown(params);
        break;

      // Default to clock mode
      default:
        if (active_page === App.page.clock) break;
        stopClock();
        active_page = App.page.clock;
        initClock();
    }

    // hide and reposition the clock.
    resize(false);

    // resize again, and show after some delay for the UI
    // to update...
    setTimeout(function resizeFix() {
      resize(true);
    }, 50);
  }

  // Routing
  $(window).on('hashchange', hashchange);

  let init = false;
  let updating = false;
  let spinner;

  function startSpinner() {
    // show loader
    const opts = {
      lines: 15, // The number of lines to draw
      length: 13, // The length of each line
      width: 2, // The line thickness
      radius: 15, // The radius of the inner circle
      corners: 0.6, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      color: '#eee', // #rgb or #rrggbb
      speed: 0.7, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: 'auto', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    };

    $(() => {
      var el = $('body').get(0);
      spinner = new Spinner(opts).spin(el);
    });
  }

  function stopSpinner() {
    spinner && spinner.stop();
  }

  function documentReady() {
    // only run once
    if (init) return;
    init = true;

    stopSpinner();
    updateFont();

    // Setup dialogs
    dialog.create({
      id: "about",
      title: "About",
      template: "templates/about.twig",
      container: $("#body"),
      data: {
        thisYear: new Date().getFullYear(),
        version: APP_VERSION,
      },
    }).create({
      id: "countdown",
      title: "Countdown",
      template: "templates/countdown.twig",
      container: $("#body")
    }).create({
      id: "options",
      title: "Options",
      template: "templates/options.twig",
      container: $("#body"),
      data: config.data()
    }, (content) => {
      initToggle($(".toggle", content));
    }).complete(() => {
      $(".dialog_container").bind("touchend mouseup", (e) => {
        if (e.target.className.indexOf("dialog_container") > -1) {
          dialog.hide();
        }
      });
    });

    // Prevent clicks on the toolback from propigating to the container and
    // closing the toolbar.
    $("#toolbar").on("click", (e) => {
      e.preventDefault();
      return false;
    });

    // Open the toolbar on init if it was previously open.
    if (config.get('toolbar') === 'true') {
      document.body.classList.add("toolbar_active");
    }

    function toggle_toolbar(e) {
      if (e.returnValue === false) return false;
      const isActive = document.body.classList.toggle("toolbar_active");
      config.set('toolbar', isActive ? 'true' : 'false');
      e.preventDefault();
    }

    $("#container, #toolbarContainer").bind({
      click: toggle_toolbar,
      touchstart: toggle_toolbar
    });
    $("#container").addClass("blink_transition");
    buttons.init();

    hashchange();
  }

  if (appCache) {
    $(startSpinner);

    $(appCache).bind({
      "downloading": function(e) {
        updating = true;
      },
      "updateready": function(e) {
        // reload for newest version of site
        appCache.swapCache();
        window.location.reload();
      },
      "error noupdate cached": function(e) {
        $(documentReady);
      },
    });

    // In order to hande the user disallowing use of the appCache in FF,
    //
    setTimeout(function lateInit() {
      if (!updating)
        $(documentReady);
    }, 500);
  } else {
    $(documentReady);
  }
};

function center(element) {
  var element_width = element.outerWidth(),
    element_height = element.outerHeight(),
    window_width = $("body").width(),
    window_height = $("body").height();

  if (element_height < window_height) {
    element.css("top", ((window_height - element_height) / 2) + 'px');
  }
  if (element_width < window_width) {
    element.css("left", ((window_width - element_width) / 2) + 'px');
  }
}

function resize(e) {
  if (e === false) {
    $(".time_box, .countdown_box").hide();
  } else {
    $(".time_box, .countdown_box").show();

    $(".time_box").get(0) && center($(".time_box"));
    $(".countdown_box").get(0) && center($(".countdown_box"));
  }
}

function stopClock() {
  // Clear any existing clock/timer
  $("#container").empty();
  if (layout) {
    layout.stop(false);
    layout.unload();
  }
}

function initClock() {
  var params = {
    container: $("#container"),
    start: true
  },
    format = config.getShowSeconds() ?
      layouts.timeAMPMsec :
      layouts.timeAMPM;

  layout = loadFlipclock(format, params);
}

function updateFont() {
  $(body).removeClass("font_" + active_font);
  active_font = config.getFont();
  $(body).addClass("font_" + active_font);
}
