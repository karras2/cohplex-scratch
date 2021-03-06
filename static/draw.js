function DrawObject(camera) { // 그리기 담당
  "use strict";

  this.canvas = document.getElementById("canvas");
  this.ctx = canvas.getContext("2d", {
    alpha: false
  });
  this.gm = "ffa";

  this.objCanvas = document.createElement("canvas");
  this.objCtx = this.objCanvas.getContext("2d");

  this.dCanvas = document.createElement("canvas");
  this.dCtx = this.dCanvas.getContext("2d");

  this.uiCanvas = document.createElement("canvas");
  this.uiCtx = this.uiCanvas.getContext("2d");

  this.backgroundColor = new RGB(205, 205, 205);
  
  this.drawDisconnected = function() {
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = "#990000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;
    let text = "Disconnected. Refresh to play again!";
    this.ctx.font = "50px Ubuntu";
    let width = this.ctx.measureText(text).width;
    let height = this.ctx.measureText("M").width;
    this.ctx.fillStyle = "#fff";
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 5;
    this.ctx.strokeText(text, this.canvas.width / 2 - width / 2, this.canvas.height / 2 - height / 2);
    this.ctx.fillText(text, this.canvas.width / 2 - width / 2, this.canvas.height / 2 - height / 2);
  };
  
  this.drawReconnecting = function() {
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;
    let text = "Attempting to reconnect, please wait...";
    this.ctx.font = "50px Ubuntu";
    let width = this.ctx.measureText(text).width;
    let height = this.ctx.measureText("M").width;
    this.ctx.fillStyle = "#fff";
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 5;
    this.ctx.strokeText(text, this.canvas.width / 2 - width / 2, this.canvas.height / 2 - height / 2);
    this.ctx.fillText(text, this.canvas.width / 2 - width / 2, this.canvas.height / 2 - height / 2);
  };
  
  this.drawRecords = function() {
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;
    let textConfig = [{
      text: "You were killed by: " + this.recordData.killedBy,
      x: innerWidth * 0.5,
      y: innerHeight * 0.2,
      size: 40
    }, {
      text: "Final Score: " + this.recordData.score,
      x: innerWidth * 0.3,
      y: innerHeight * 0.4,
      size: 30
    }, {
      text: "Level: " + this.recordData.level,
      x: innerWidth * 0.3,
      y: innerHeight * 0.55,
      size: 30
    }, {
      text: "(Press enter to respawn)",
      x: innerWidth * 0.5,
      y: innerHeight * 0.625,
      size: 20
    }];
    for (let textObj of textConfig) {
      let { text, x, y, size } = textObj;
      this.ctx.font = size + "px Ubuntu";
      let width = this.ctx.measureText(text).width;
      let height = this.ctx.measureText("M").width;
      this.ctx.fillStyle = "#fff";
      this.ctx.strokeStyle = "#000";
      this.ctx.lineWidth = 5;
      this.ctx.strokeText(text, x - width / 2, y - height / 2);
      this.ctx.fillText(text, x - width / 2, y - height / 2);
    }
  };

  this.mapSize = {
    x: 0,
    y: 0
  };

  this.sight = 1;
  this.showSight = 2.3;

  socket.on('mapSize', (data, gamemode) => {
    this.mapSize = data;
    this.gm = gamemode;
  });

  this.camera = {
    x: 0,
    y: 0,
    z: 1,
    uiz: 1
  };

  this.getCanvasSize = function() {
    return [this.canvas.width, this.canvas.height, this.camera.uiz];
  }
  
  this.recordData = {};

  this.getCameraSet = function() {
    return {
      x: this.camera.x + this.canvas.width / 2 / this.camera.uiz / this.sight,
      y: this.camera.y + this.canvas.height / 2 / this.camera.uiz / this.sight,
      z: this.camera.z,
    }
  }

  this.setSight = function(sight) {
    this.sight = sight;
  }

  this.resize = function() {
    this.canvas.width = this.objCanvas.width = this.dCanvas.width = this.uiCanvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = this.objCanvas.height = this.dCanvas.height = this.uiCanvas.height = window.innerHeight * window.devicePixelRatio;
    this.dCtx.lineCap = this.uiCtx.lineCap = "round";
    this.dCtx.lineJoin = this.uiCtx.lineJoin = "round";
    this.ctx.imageSmoothingEnabled = false;
    this.objCtx.imageSmoothingEnabled = false;
    this.dCtx.imageSmoothingEnabled = false;
    this.uiCtx.imageSmoothingEnabled = false;
    socket.emit('windowResized', {
      screenWidth: this.canvas.width,
      screenHeight: this.canvas.height
    });
  }

  this.setCursor = function(style) {
    this.canvas.style.cursor = style;
  }

  this.im = {
    x: 0,
    y: 0
  };

  this.cameraSet = function(camera) {
    if (this.canvas.width < this.canvas.height / 9 * 16) this.camera.z = this.canvas.height / 900; // 화면 크기에 따른 줌값 조정
    else this.camera.z = this.canvas.width / 1600;

    this.camera.uiz = this.camera.z; // *1.78 은 1레벨 탱크의 시야 *1.43 은 45레벨 탱크의 시야 *1.229 는 75레벨 탱크의 시야

    this.camera.z *= this.showSight;
    this.showSight -= (this.showSight - this.sight) / 10;

    this.camera.x -= (this.camera.x - camera.x + this.canvas.width / 2 / this.camera.uiz / this.sight) / 10;
    this.camera.y -= (this.camera.y - camera.y + this.canvas.height / 2 / this.camera.uiz / this.sight) / 10;
  }

  this.backgroundDraw = function() {
    this.objCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.dCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.uiCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.globalAlpha = 1;


    this.ctx.fillStyle = this.backgroundColor.getDarkRGB(0.1).getRGBValue();
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = this.backgroundColor.getRGBValue();
    this.ctx.fillRect((-this.mapSize.x - this.camera.x) * this.camera.z, (-this.mapSize.y - this.camera.y) * this.camera.z, this.mapSize.x * 2 * this.camera.z, this.mapSize.y * 2 * this.camera.z);

    this.ctx.globalAlpha = 0.15;
    if (this.gm.includes("tdm")) {
      this.ctx.fillStyle = new RGB(0, 176, 225).getRGBValue();
      this.ctx.fillRect((-this.mapSize.x - this.camera.x) * this.camera.z, (-this.mapSize.y - this.camera.y) * this.camera.z, (this.mapSize.x * 2 * 0.15) * this.camera.z, this.mapSize.y * 2 * this.camera.z);
      this.ctx.fillStyle = new RGB(241, 78, 84).getRGBValue();
      this.ctx.fillRect(((-this.mapSize.x - this.camera.x) + (this.mapSize.x * 2 * 0.85)) * this.camera.z, (-this.mapSize.y - this.camera.y) * this.camera.z, (this.mapSize.x * 2 * 0.15)* this.camera.z, this.mapSize.y * 2 * this.camera.z);
    }
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath(); // 격자 그리기
    for (let i = -this.camera.x % 12.9 * this.camera.z; i <= this.canvas.width; i += 12.9 * this.camera.z) {
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
    }
    for (let i = -this.camera.y % 12.9 * this.camera.z; i <= this.canvas.height; i += 12.9 * this.camera.z) {
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
    }
    this.ctx.strokeStyle = "black";
    this.ctx.globalAlpha = 0.1;
    this.ctx.lineWidth = 0.4;
    this.ctx.stroke();
  }

  this.objectDraw = function(obj, order) {
    for (let i = 0; i < order.length; i++) {
      if (obj[order[i].id]) {
        obj[order[i].id].draw(this.ctx, this.camera);
      }
    }
  }

  this.objectStatusDraw = function(obj) {
    if (!system) return;
    if (!system.controlTank) return;
    for (let key in obj) {
      if (obj[key] && obj[key].drawName && obj[key].id !== system.controlTank.id) {
        obj[key].drawName(this.dCtx, this.camera);
      }
    }
    for (let key in obj) {
      if (obj[key] && obj[key].drawHPBar) {
        obj[key].drawHPBar(this.dCtx, this.camera);
      }
    }
    this.ctx.globalAlpha = 1;
    this.ctx.drawImage(this.dCanvas, 0, 0);
  }

  this.uiDraw = function(ui) {
    for (let i = 0; i < ui.length; i++) {
      ui[i].draw(this.uiCtx, this.camera.uiz, this.gm);
    }

    this.ctx.globalAlpha = 0.7;
    this.ctx.drawImage(this.uiCanvas, 0, 0);
  }

  window.onload = this.resize.bind(this);
  window.onresize = this.resize.bind(this);

  window.onbeforeunload = function() {
    return "정말 나가실 건가요?";
  }
}

function RGB(r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.setRGB = function(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  this.getRGBValue = function() {
    return "rgb(" + Math.round(this.r) + "," + Math.round(this.g) + "," + Math.round(this.b) + ")";
  }
  this.getDarkRGB = function(per) {
    if (per == null) per = 0.25;
    let r = (0 - this.r) * per + this.r;
    let g = (0 - this.g) * per + this.g;
    let b = (0 - this.b) * per + this.b;
    return new RGB(r, g, b);
  }
  this.getLightRGB = function(per) {
    if (per == null) per = 0.25;
    let r = (255 - this.r) * per + this.r;
    let g = (255 - this.g) * per + this.g;
    let b = (255 - this.b) * per + this.b;
    return new RGB(r, g, b);
  }
  this.getRedRGB = function(per) {
    let r = (255 - this.r) * per + this.r;
    let g = (0 - this.g) * per + this.g;
    let b = (0 - this.b) * per + this.b;
    return new RGB(r, g, b);
  }
}

function drawUpgrade(I, x, y, s, name, id, color) {
  let box = document.getElementById("upgradeBox" + I);
  box.width = box.height = s;
  box.style.top = y + "px";
  box.style.left = x + "px";
  box.style.position = "absolute";
  box.style.border = "2.5px solid black";
  box.style.borderRadius = "2px";
  let ctx = box.getContext("2d");
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, s, s);
  let text = name;
  ctx.font = "30px Ubuntu";
  let w = ctx.measureText(text).width / 2;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.fillText(name, s / 2 - w, s * 0.85);
  ctx.strokeText(name, s / 2 - w, s * 0.85);
  box.onclick = () => socket.emit("upgradeTank", id);
};

for (let i = 0; i < 10; i ++) {
  let elem = document.createElement("canvas");
  elem.id = "upgradeBox" + i;
  document.body.appendChild(elem);
}

function Button(text) {
  "use strict";

  this.x1;
  this.y1;
  this.x2;
  this.y2;
  this.isBeingHovered = false;
  this.tankData = false;

  this.text = new Text(text, 12.5);

  this.color = new RGB(127, 127, 127);

  this.setPosition = function(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.rot = 0;
    this.darkened = false;
    this.text.setPosition((x1 + x2) / 2, y1 + (y2 - y1) * 0.85);
  }

  this.setColor = function(color, darkened) {
    this.color = color;
    this.darkened = darkened || false;
  }

  this.inMousePoint = function(x, y) {
    if (this.x1 < x && this.x2 > x && this.y1 < y && this.y2 > y) {
      return true;
    } else return false;
  }
  
  this.setTank = function(tank) {
    this.tankData = tank;
  }

  this.onclick = false;
  
  this.draw = function(ctx, z) {
    this.rot += 0.01;
    ctx.fillStyle = this.darkened ? this.color.getLightRGB().getRGBValue() : this.color.getRGBValue();
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 8 * z;
    ctx.strokeRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
    ctx.fillRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
    ctx.fillStyle = this.darkened ? this.color.getRGBValue() : this.color.getDarkRGB().getRGBValue();
    if (!this.isBeingHovered) ctx.fillRect(this.x1, (this.y1 + this.y2) / 2 + 6.5 * z, this.x2 - this.x1, (this.y2 - this.y1) / 2 - 6.5 * z);
    if (this.tankData) {
      let x = this.x1 + this.x2;
      x /= 2;
      let y = this.y1 + this.y2;
      y /= 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.rot);
      this.tankData.x = 0;
      this.tankData.y = 0;
      this.tankData.imRotate += 0.01;
      this.tankData.showRadius = 17.5;
      this.tankData.drawUI(ctx);
      ctx.restore();
    }
    if (this.text.text) this.text.draw(ctx, z);
  }
}

function Bar(c, radius, drawTank) {
  "use strict";

  this.x1;
  this.x2;
  this.y;
  this.tankData = false;
  this.percent;
  this.radius = radius;

  this.color = c || new RGB(0, 0, 0);
  // this is totally not melting my brain, i wish there was a documentation
  this.setPosition = function(x1, x2, y, p) {  // set and draw the tank here., no not here lmfao. in this general Bar function. put the draw in the this.draw, and make a function for it to be set.
    this.x1 = x1;
    this.x2 = x2;
    this.y = y;
    this.percent = p;
  }

  this.setRadius = function(r) {
    this.radius = r;
  }

  this.setColor = function(c) {
    this.color = c;
  };

  this.inMousePoint = function(x, y) {
    return false;  
  }
  
  this.setTank = function(tankData) {
    this.tankData = tankData;
  }
  this.draw = function(ctx, z) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y + this.radius / 2 * z);
    ctx.lineTo(this.x2, this.y + this.radius / 2 * z);
    ctx.closePath();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = this.radius / 2 * z;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.x1, this.y + this.radius / 2 * z);
    ctx.lineTo(this.x1 + (this.x2 - this.x1) * this.percent, this.y + this.radius / 2 * z);
    ctx.closePath();
    ctx.lineWidth = this.radius / 2.7 * z;
    ctx.strokeStyle = this.color.getRGBValue();
    ctx.stroke();
    if (this.tankData && drawTank) {
      let x = this.x2;
      x /= 2;
      let y = this.y;
      y /= 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.rot);
      this.tankData.x = 0;
      this.tankData.y = 0;
      this.tankData.imRotate += 0.01;
      this.tankData.showRadius = 17.5;
      this.tankData.drawUI(ctx);
      ctx.restore();
    }
  }
}

function Text(text, size, rotate, align, enable) {
  "use strict";

  this.text = text;
  this.size = size;
  this.x;
  this.y;
  this.align = align || "center";
  this.rotate = rotate || 0;
  this.enable = enable || enable === undefined;

  this.inMousePoint = function(x, y) {
    return false;
  }

  this.setPosition = function(x, y, rotate) {
    this.x = x;
    this.y = y;
    this.rotate = rotate || this.rotate;
  }

  this.setEnable = function(b) {
    this.enable = b;
  }

  this.setText = function(text) {
    this.text = text;
  }

  this.setSize = function(size) {
    this.size = size;
  }

  this.draw = function(ctx, z) {
    if (this.enable) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = this.size * 0.2 * z;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotate);
      ctx.textAlign = this.align;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      ctx.font = this.size * z + "px Ubuntu";

      ctx.strokeText(this.text, 0, 0);
      ctx.fillText(this.text, 0, 0);
      ctx.restore();
    }
  }
}

function MiniMap() {
  "use strict";

  this.x;
  this.y;
  this.pointX;
  this.pointY;
  this.pointRotate;
  this.color = new RGB(205, 205, 205);
  this.borderColor = new RGB(87, 87, 87);
  this.miniMapSize = 146;
  this.border = 4.5;
  this.point = [
    [-3, -2.5],
    [4, 0],
    [-3, 2.5]
  ].map((a) => [Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2)), Math.atan2(a[1], a[0])]);

  this.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
  };

  this.setPointPosition = function(x, y, rotate) {
    this.pointX = x * this.miniMapSize + this.border;
    this.pointY = y * this.miniMapSize + this.border;
    this.pointRotate = rotate;
  };

  this.drawPoint = function(ctx, i, z, start) {
    var x = this.x + (this.pointX + this.point[i][0] * Math.cos(this.pointRotate + this.point[i][1]) - this.miniMapSize) * z;
    var y = this.y + (this.pointY + this.point[i][0] * Math.sin(this.pointRotate + this.point[i][1]) - this.miniMapSize) * z;
    if (start)
      ctx.moveTo(x, y);
    else
      ctx.lineTo(x, y);
  }

  this.draw = function(ctx, z, gm) {

    ctx.fillStyle = this.color.getRGBValue();
    ctx.strokeStyle = this.borderColor.getRGBValue();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = this.border * z;
    ctx.beginPath();
    ctx.rect(this.x - this.miniMapSize * z + 4 * z, this.y - this.miniMapSize * z + 4 * z, this.miniMapSize * z, this.miniMapSize * z);
    ctx.fill();
    if (gm.includes("tdm")) {
      ctx.fillStyle = new RGB(0, 176, 225).getRGBValue();
      ctx.fillRect(this.x - this.miniMapSize * z + 4 * z, this.y - this.miniMapSize * z + 4 * z, this.miniMapSize * z * 0.15, this.miniMapSize * z);
      ctx.fillStyle = new RGB(241, 78, 84).getRGBValue();
      ctx.fillRect((this.x - this.miniMapSize * z + 4 * z) + (this.miniMapSize * z * 0.85), this.y - this.miniMapSize * z + 4 * z, this.miniMapSize * z * 0.15, this.miniMapSize * z);
    }
    ctx.save();

    ctx.clip();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    for (var i = 0; i < this.point.length + 1; i++)
      this.drawPoint(ctx, i % this.point.length, z, i == 0);
    ctx.fill();

    ctx.restore();

    ctx.beginPath();
    ctx.rect(this.x - this.miniMapSize * z + 4 * z, this.y - this.miniMapSize * z + 4 * z, this.miniMapSize * z, this.miniMapSize * z);
    ctx.stroke();
  };

  this.inMousePoint = function(x, y) {
    return false;
  };
}

function ScoreBoard() {
  "use strict";

  this.x;
  this.y;
  this.tankData = false;
  this.width = 167;

  this.scoreBoardTitle = new Text("Scoreboard:", 20);
  this.scoreBoardBar = [];
  this.scoreBoardText = [];
  this.scoreBoardList = [];

  for (let i = 0; i < 10; i++) {
    this.scoreBoardBar[i] = new Bar(new RGB(66, 255, 145), 33); // wait wdym
    this.scoreBoardText[i] = new Text("", 13); // do it in the bar function. It will enable each thing to be separate.
  }
  this.setTank = function(tank) {
    this.tankData = tank;
  }
  this.setPosition = function(x, y, z, a) {
    this.x = x;
    this.y = y;

    this.scoreBoardList = a;

    this.scoreBoardTitle.setPosition(x, y);


    for (var i = 0; i < this.scoreBoardList.length; i++) {
      let per = this.scoreBoardList[i].score / this.scoreBoardList[0].score;
      if (this.scoreBoardList[0].score === 0) per = 1;
      this.scoreBoardBar[i].setPosition(x - this.width / 2 * z, x + this.width / 2 * z, y + (5 + 20 * i) * z, per);
      if (this.scoreBoardList[i].name) this.scoreBoardText[i].setText(this.scoreBoardList[i].name + ' - ' + String(this.scoreBoardList[i].score));
      else this.scoreBoardText[i].setText(String(this.scoreBoardList[i].score));
      this.scoreBoardText[i].setPosition(x, y + (25 + 20 * i) * z); // what?
      this.scoreBoardBar[i].setTank(this.scoreBoardList[i].tank)
    }
  }

  this.draw = function(ctx, z) {
    this.scoreBoardTitle.draw(ctx, z);
    for (var i = 0; i < this.scoreBoardList.length; i++) {
      this.scoreBoardBar[i].draw(ctx, z);
      this.scoreBoardText[i].draw(ctx, z);
    }
    if (this.tankData) {
      let x = this.x;
      x /= 2;
      let y = this.y1 + this.y2;
      y /= 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.rot);
      this.tankData.x = 0;
      this.tankData.y = 0;
      this.tankData.imRotate += 0.01;
      this.tankData.showRadius = 17.5;
      this.tankData.drawUI(ctx);
      ctx.restore();
    }
  };

  this.inMousePoint = function(x, y) {
    return false;
  };
}