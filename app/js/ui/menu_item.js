const Base = require('./base');
const Spacer = require('./spacer');
const Label = require('./label');
const Container = require('./container');
const Icon = require('./icon');

class MenuItem extends Container {
  constructor(params={}) {
    super();

    this.title = params.title;
    this.shortcut = params.shortcut;
    this.icon = params.icon;
    this.click = params.click;

    this.addClass('menu-item');

    if (this.icon) {
      let icon = new Icon({ resource: this.icon });
      icon.addClass('menu-item-icon');
      this.add(icon);
    } else {
      let spacer = new Spacer();
      spacer.addClass('menu-item-icon');
      this.add(spacer);
    }

    this.titleLabel = new Label({ title: this.title });
    this.titleLabel.addClass('menu-item-title');
    this.add(this.titleLabel);

    this.shortcutLabel = new Label({ title: this.shortcut });
    this.shortcutLabel.addClass('menu-item-shortcut');
    this.add(this.shortcutLabel);


    this.el.addEventListener('mousedown', () => {
    });

    this.el.addEventListener('click', () => {
      if (this.click) this.click();
    });
  }

  // parseShortcut(shortcut) {
  //   let parts = shortcut.split('+');
  //   for (var i = 0; i < parts.length; i++) {
  //     let part = parts[i];
  //     if (part == 'CommandOrControl') {
  //       parts[i] =
  //     }
  //   }
  // }
}

module.exports = MenuItem;
