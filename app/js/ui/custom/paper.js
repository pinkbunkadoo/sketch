const Const = require('../../const');
const Point = require('../../geom/point');
const DisplayList = require('../../display_list');
const Base = require('../base');
const Tools = require('../../tools/');
const Stroke = require('../../stroke');

class Paper extends Base {
  constructor() {
    super();

    this.el = document.getElementById('paper');

    this.canvasWidth = this.el.offsetWidth;
    this.canvasHeight = this.el.offsetHeight;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.canvas.style.pointerEvents = 'none';
    this.el.appendChild(this.canvas);

    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = this.canvasWidth;
    this.overlayCanvas.height = this.canvasHeight;

    this.scale = 1.0;
    this.width = Const.WIDTH;
    this.height = Const.HEIGHT;

    this.bitmap = document.createElement('canvas');
    this.bitmap.width = this.width;
    this.bitmap.height = this.height;

    this.tx = 0;
    this.ty = 0;

    this.tx = (this.width / 2) >> 0;
    this.ty = (this.height / 2) >> 0;

    this.globalAlpha = 1.0;

    this.tool = null;
    this.mode = null;

    this.tools = {};
    this.tools.pointer = new Tools.Pointer();
    this.tools.pencil = new Tools.Pencil();
    this.tools.line = new Tools.Line();
    this.tools.polygon = new Tools.Polygon();
    this.tools.hand = new Tools.Hand();
    this.tools.zoom = new Tools.Zoom();

    this.displayList = new DisplayList();
    this.mouseDown = false;

    this.cursorX = 0;
    this.cursorY = 0;
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    this.overlayCanvas.width = this.canvasWidth;
    this.overlayCanvas.height = this.canvasHeight;
  }

  setCameraPosition(x, y) {
    this.tx = x;
    this.ty = y;
  }

  center() {
    this.setCameraPosition((this.width / 2) >> 0, (this.height / 2) >> 0);
    this.setZoom(1);
    this.render();
  }

  panCameraBy(x, y) {
    this.setCameraPosition(this.tx + x, this.ty + y);
    this.render();
  }

  setZoom(value) {
    if (value <= 5 && value >= 0.05) {
      this.scale = ((value * 100) >> 0) / 100;
      if (this.scale == 1) {
        this.tx = this.tx >> 0;
        this.ty = this.ty >> 0;
      }
    }
  }

  zoomIn() {
    var self = this;
    var level = Const.ZOOM_LEVELS.find(function(element) {
      return element > self.scale;
    });
    if (level) this.setZoom(level);
    this.render();
  }

  zoomOut() {
    var level;
    for (var i = Const.ZOOM_LEVELS.length - 1; i >= 0; i--) {
      level = Const.ZOOM_LEVELS[i]
      if (level < this.scale) break;
    }
    if (level) this.setZoom(level);
    this.render();
  }

  zoomCameraBy(x) {
    var value = this.scale;
    value = value + x;
    this.setZoom(value);
  }

  screenToWorld(x, y) {
    var widthHalf = (this.canvas.width / 2) >> 0;
    var heightHalf = (this.canvas.height / 2) >> 0;

    var px = x - widthHalf;
    var py = y - heightHalf;

    var sx = px / this.scale;
    var sy = py / this.scale;

    var tx = sx + this.tx;
    var ty = sy + this.ty;

    return new Point(tx, ty);
  }

  worldToScreen(x, y) {
    var tx = x - (this.tx);
    var ty = y - (this.ty);

    var sx = (tx * this.scale);
    var sy = (ty * this.scale);

    var widthHalf = (this.canvas.width / 2) >> 0;
    var heightHalf = (this.canvas.height / 2) >> 0;

    return new Point(sx + widthHalf, sy + heightHalf);
  }

  setTool(name) {
    let tool = this.tools[name];
    if (tool) {
      if (tool !== this.tool) {
        if (this.tool) {
          this.tool.blur();
        }
        this.tool = tool;
        this.tool.focus();
        this.setCursor(this.tool.cursor);
      }
    } else {
      console.log('setTool', name, 'doesn\'t exist');
    }
  }

  setCursor(name) {
    app.setCursor(name);
  }

  renderDots(stroke) {
    // var ctx = this.canvas.getContext('2d');
    // ctx.lineWidth = 1;
    // ctx.fillStyle = 'white';
    // ctx.strokeStyle = 'black';
    //
    // for (var j = 0; j < stroke.points.length; j++) {
    //   var p = stroke.points[j];
    //   p = this.worldToScreen(p.x, p.y);
    //   var x = (p.x >> 0) + 0.5, y = (p.y >> 0) + 0.5;
    //   ctx.beginPath();
    //   // ctx.rect(x - 1, y - 1, 3, 3);
    //   ctx.rect(x - 1, y - 1, 2, 2);
    //   ctx.fill();
    //   ctx.stroke();
    // }
  }

  clear() {
    var ctx = this.canvas.getContext('2d');
    // ctx.fillStyle = Const.COLOR_WORKSPACE.toHexString();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    var p1 = this.worldToScreen(0, 0);
    ctx.fillStyle = Const.COLOR_PAPER.toHexString();
    ctx.fillRect((p1.x >> 0), (p1.y >> 0), this.width * this.scale, this.height * this.scale);
    ctx.restore();
  }

  clearOverlay() {
    let ctx = this.overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
  }

  // clearDisplayList() {
  //   this.displayList = [];
  // }
  //
  // addDisplayItem(item) {
  //   this.displayList.push(item);
  //   // console.log('display item', item);
  // }

  renderPath(ctx, points, params) {
    if (points.length) {
      let transform = params.transform;

      ctx.save();
      // ctx.globalCompositeOperation = 'difference';
      ctx.lineWidth = params.thickness ? params.thickness : Const.LINE_WIDTH;
      ctx.fillStyle = params.fill ? params.fill.toHexString() : 'transparent';
      ctx.strokeStyle = params.color ? params.color.toHexString() : Const.COLOR_STROKE.toHexString();

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();

      for (let i = 0; i < points.length; i++) {
        let point = points[i];
        let p;

        if (transform) {
          p = transform.apply(point);
        } else {
          p = this.worldToScreen(point.x, point.y);
        }

        if (i == 0)
          ctx.moveTo(p.x, p.y);
        else
          ctx.lineTo(p.x, p.y);
      }

      // if (fill) {
      //   ctx.fillStyle = fill;
      //   ctx.fill();
      //   ctx.globalAlpha = 1;
      // }

      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  renderDisplayItem(ctx, item, transform=null) {
    let points = item.points;
    if (points.length) {
      this.renderPath(ctx, points, { color: item.color, fill: item.fill, thickness: item.thickness, transform: transform });
    }
  }

  render() {
    this.clearOverlay();
    if (this.tool) this.tool.render(this.overlayCanvas.getContext('2d'));

    this.clear();
    let ctx = this.canvas.getContext('2d');

    for (let i = 0; i < this.displayList.items.length; i++) {
      let item = this.displayList.items[i];
      this.renderDisplayItem(ctx, item);
    }

    ctx.drawImage(this.overlayCanvas, 0, 0);
  }

  renderDisplayListToCanvas(canvas, displayList, transform=null) {
    // console.log(canvas, displayList, transform);
    let ctx = canvas.getContext('2d');
    for (let i = 0; i < displayList.items.length; i++) {
      let item = displayList.items[i];
      this.renderDisplayItem(ctx, item, transform);
    }
  }

  onFocus(event) {
    if (this.tool) {
      this.tool.focus();
    }
  }

  onBlur(event) {
    this.mode = null;
    if (this.tool) {
      this.tool.blur();
    }
  }

  onMouseDown(event) {
    this.mouseDown = true;

    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      this.center();
    }

    if (this.tool) {
      this.tool.handleEvent(event);
    }
  }

  onMouseUp(event) {
    this.mouseDown = false;
  }

  onMouseMove(event) {
    if (document.pointerLockElement === this.canvas) {
      this.cursorX += event.movementX;
      this.cursorY += event.movementY;
    } else {
      this.cursorX = event.clientX;
      this.cursorY = event.clientY;
    }
  }

  onKeyDown(event) {
    if (this.tool) this.tool.handleEvent(event);
  }

  onKeyUp(event) {
    if (this.tool) this.tool.handleEvent(event);
  }

  onPaste(event) {
    // console.log(event.clipboardData.types);
  }

  handleEvent(event) {
    if (event.type === 'mousedown') {
      this.onMouseDown(event);
    }
    else if (event.type === 'mousemove') {
      this.onMouseMove(event);
    }
    else if (event.type === 'mouseup') {
      this.onMouseUp(event);
    }
    else if (event.type === 'keydown') {
      this.onKeyDown(event);
    }
    else if (event.type === 'keyup') {
      this.onKeyUp(event);
    }
    else if (event.type === 'paste') {
      this.onPaste(event);
    }
    else if (event.type === 'blur') {
      this.onBlur(event);
    }
    else if (event.type === 'focus') {
      this.onFocus(event);
    }
  }
}

module.exports = Paper;