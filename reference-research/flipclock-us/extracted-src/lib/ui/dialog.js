import {$} from '../../vendor/jquery.js';
import Twig from '../../vendor/twig.js';

const exports = {};
export default exports;

var twig = Twig.twig,
  dialogs = {},
  count = 0,
  load_callback,
  config = {
    active_dialog_class: "active_dialog"
  },
  ready = false,
  onready = [];

twig({
  id: 'dialog',
  href: "templates/dialog.twig",
  load: function() {
    ready = true;
    while (onready.length > 0) {
      var fn = onready.shift();
      fn();
    }
  }
});

exports.get = function(id) {
  return dialogs[id];
};

exports.show = function(id) {
  // Show dialog
  $('#' + id).addClass(config.active_dialog_class);
};
exports.hide = function(e) {
  if (e && e.returnValue === false) return false;
  // Hide dialog
  $("." + config.active_dialog_class).removeClass(config.active_dialog_class);
};

exports.create = function(params, callback) {
  count++;
  var id = params.id,
    href = params.template,
    data = params.data,
    container = params.container,
    title = params.title;

  twig({
    href: href,
    load: function(template) {
      var readyFn = function() {
        var content = template.render(data || {});

        content = twig({ref: 'dialog'}).render({
          "id": id,
          "content": content,
          "title": title,
        });

        content = $(content);
        dialogs[id] = content;

        container && container.append(content);
        callback && callback(content);

        count--;

        if (count === 0 && load_callback) {
          load_callback();
          load_callback = undefined;
        }
      };

      if (ready)
        readyFn()
      else
        onready.push(readyFn);
    }
  });

  return exports;
};

exports.complete = function(callback) {
  if (count > 0) {
    load_callback = callback;
  } else {
    callback();
  }
};
