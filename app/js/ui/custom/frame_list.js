const Base = require('../base');
const Mouse = require('../../mouse');
const Container = require('../container');
const Spacer = require('../spacer');
const Divider = require('../divider');
const Label = require('../label');
const Icon = require('../icon');
const Button = require('../button');
const Scroller = require('../scroller');
const FrameListItem = require('./frame_list_item');
// const Frame = require('../../frame');

class FrameList extends Container {
  constructor() {
    super();

    this.grab = false;
    this.dragAmount = 0;
    this.velocity = 0;
    this.timerId = null;
    this.velocityTimeoutId = null;

    this.el = document.getElementById('frame-list');

    this.items = [];
    this.selection = null;

    this.container = new Container();
    this.container.el = document.getElementById('frame-list-container');

    this.frameListNew = new Container();
    this.frameListNew.addClass('frame-list-item');
    this.frameListNew.addClass('new');
    // this.frameListNew.el.onclick = () => {
      // this.emit('new-frame');
    // };
    let icon = new Icon({ resource: 'plus', invert: true });
    icon.el.style.width = (32 * app.unit) + 'px';
    icon.el.style.height = (32 * app.unit) + 'px';
    icon.el.style.pointerEvents = 'none';
    this.frameListNew.add(icon);

    this.items.push(this.frameListNew);
    this.container.add(this.frameListNew);

    this.add(this.container);

    // this.marker = new Container({ id: 'frame-list-marker', fromDOMElement:true });
    // this.add(this.marker);

    // this.nodule = new Container({ id: 'frame-list-nodule' });
    // this.marker.add(this.nodule);

    // let e = document.createElement('div');
    // e.id = 'frame-list-nodule';
    // this.marker.addDomElement(e);

    this.el.addEventListener('mousedown', this);
  }

  refreshFrameNumbers() {
    for (var i = 0; i < this.items.length; i++) {
      let item = this.items[i];
      if (item instanceof FrameListItem) {
        item.setNumber(i + 1);
      }
    }
  }

  addFrame() {
    this.insertFrame(this.items.length-1);
  }

  insertFrame(index) {
    let frameListItem = new FrameListItem(this.thumbnailWidth, this.thumbnailHeight);
    frameListItem.on('select', (item) => {
      this.emit('select', { index: this.items.indexOf(item) });
    });
    this.items.splice(index, 0, frameListItem);
    this.container.insert(index, frameListItem);
    this.refreshFrameNumbers();
  }

  removeFrame(index) {
    this.container.remove(this.items[index]);
    this.items.splice(index, 1);
    this.refreshFrameNumbers();
  }

  removeAll() {
    this.clear();
    this.items = [];
    this.selection = null;
  }

  get(index) {
    return this.items[index];
  }

  select(index) {
    if (this.selection) {
      this.selection.removeClass('selected');
      this.selection.deselect();
    }

    this.selection = this.items[index];
    this.selection.addClass('selected');

    this.selection.select();

    let item = this.selection;
    let width = this.container.el.scrollWidth;
    let margin = 8;

    if (item.el.offsetLeft + item.el.offsetWidth > this.el.scrollLeft + this.el.offsetWidth) {
      this.el.scrollLeft = item.el.offsetLeft - this.el.offsetWidth + item.el.offsetWidth + margin;

    } else if (item.el.offsetLeft < this.el.scrollLeft) {
      this.el.scrollLeft = item.el.offsetLeft - margin;
    }

    if (index === this.items.length - 2) {
      this.el.scrollLeft = this.frameListNew.el.offsetLeft;
    } else if (index === 0) {
      this.el.scrollLeft = 0;
    }
  }

  setThumbnailSize(width, height) {
    this.thumbnailWidth = width;
    this.thumbnailHeight = height;
    this.frameListNew.el.style.width = this.thumbnailWidth + 'px';
    // this.frameListNew.el.style.height = this.thumbnailHeight + 'px';
  }

  render(params) {
    if (params.cmd === 'select') {
      this.select(params.index);
    }
    else if (params.cmd === 'frameAdd') {
      this.addFrame();
    }
    else if (params.cmd === 'frameInsert') {
      this.insertFrame(params.index);
    }
    else if (params.cmd === 'frameRemove') {
      this.removeFrame(params.index);
    }
    else if (params.cmd === 'removeAll') {
      this.removeAll();
    }
    else if (params.cmd === 'update') {
    }
    if (this.selection) {
      // this.nodule.el.style.left = (this.selection.offsetLeft / this.container.offsetWidth) + 'px';
      // this.nodule.el.style.width = (this.selection.offsetWidth / this.container.scrollWidth) + 'px';
      // let width = (this.selection.el.offsetWidth / this.container.el.scrollWidth);
      // console.log(this.el.scrollWidth);
    }
  }

  beginCapture() {
    app.capture(this);
  }

  endCapture() {
    app.release(this);
  }

  onMouseDown(event) {
    var target = event.target;
    this.dragAmount = 0;
    this.beginCapture();
  }

  onMouseUp(event) {
    var target = event.target;
    var point = Mouse.getPosition(event);

    if (this.grab) {
      this.clearVelocityTimeout();
      if (Math.abs(this.velocity) > 1) this.startMomentumTimer();
    } else {
      if (event.target !== this.el) {
        // console.log(event.target, this.frameListNew.el);
        if (event.target === this.frameListNew.el) {
          this.emit('new-frame');
        } else {
          let index = event.target.dataset.index;
          if (index !== undefined) {
            this.emit('select', { index: index - 1 });
          }
        }
      }
    }
    this.endCapture();
    this.grab = false;
  }

  stopMomentumTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  startMomentumTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.decay = 1;
    this.timerId = setInterval(() => {
      this.velocity = this.velocity * this.decay;
      this.el.scrollLeft += this.velocity;
      this.emit('scroll');
      this.decay *= 0.995;
      if (Math.abs(this.velocity) < 1) {
        this.stopMomentumTimer();
      }
    }, 1000/60);
  }

  clearVelocityTimeout() {
    clearTimeout(this.velocityTimeoutId);
    this.velocityTimeoutId = null;
  }

  onMouseMove(event) {
    var point = Mouse.getPosition(event);
    if (this.grab) {
      let deltaX = -event.movementX;
      this.velocity = deltaX;
      this.el.scrollLeft += deltaX;

      this.emit('scroll');

      clearTimeout(this.velocityTimeoutId);
      this.velocityTimeoutId = setTimeout(() => { this.velocity = 0; }, 100);
    } else {
      if (event.buttons & 1) {
        this.dragAmount += event.movementX;
        if (Math.abs(this.dragAmount) > 3) {
          this.grab = true;
        }
      }
    }
  }

  onWheel(event) {
    let deltaX = event.deltaX;
    this.el.scrollLeft += deltaX;
    this.emit('scroll');
  }

  handleEvent(event) {
    if (event.type == 'mousedown') {
      this.onMouseDown(event);
    }
    else if (event.type == 'mouseup') {
      this.onMouseUp(event);
    }
    else if (event.type == 'mousemove') {
      this.onMouseMove(event);
    }
    else if (event.type == 'resize') {
      // this.onResize(event);
    }
    else if (event.type == 'wheel') {
      this.onWheel(event);
    }
    else if (event.type == 'blur') {
      this.onBlur(event);
    }
  }
}

module.exports = FrameList;