'use strict';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const SAT = require('sat');
const io = require('socket.io')(server);

io.set('heartbeat timeout', 60000);
io.set('heartbeat interval', 25000);

const util = require('./lib/utility');
const objUtil = require('./lib/objectSet');
const userUtil = require('./lib/userSet');
const bulletUtil = require('./lib/bulletSet');
const shapeUtil = require('./lib/shapeSet');

const quadtree = require('./lib/QuadTree');
const readline = require('readline');

process.on("uncaughtexception", e => {
  console.log("Error:",e);
});

let V = SAT.Vector;
let C = SAT.Circle;

const upgrades = {
  "Tank": {
    "lvl15": [1, 6, 7, 8],
    "lvl30": [35]
  },
  "Twin": {
    "lvl30": [3, 13, 4],
  },
  "Sniper": {
    "lvl30": [15, 19, 11, 30]
  },
  "Machine Gun": {
    "lvl30": [10, 20],
    "lvl45": [29]
  },
  "Flank Guard": {
    "lvl30": [4, 9]
  },
  "Triple Shot": {
    "lvl45": [14, 40, 2],
  },
  "Twin Flank": {
    "lvl45": [18, 46]
  },
  "Quad Tank": {
    "lvl45": [5]
  },
  "Destroyer": {
    "lvl45": [47, 25, 51, 52]
  },
  "Gunner": {
    "lvl45": [37, 41, 31]
  },
  "Assassin": {
    "lvl45": [22, 21]
  },
  "Hunter": {
    "lvl45": [28, 41]
  },
  "Overseer": {
    "lvl45": [12, 32, 50, 46, 26, 17]
  },
  "Trapper": {
    "lvl45": [33, 42, 31, 32, 34]
  },
  "Tri Angle": {
    "lvl45": [24, 23]
  },
  "Smasher": {
    "lvl45": [49, 36, 48, 58]
  },
  "Developer": {
    "dev": [0, 62, 63, 27, 16, 64]
  },
  "Beta Tanks": {
    "dev": [53, 55, 54, 56, 57, 59]
  },
  "Dominators": {
    "dev": [43, 44, 45]
  },
  "Bosses": {
    "dev": [60]
  }
};

let getUpgrades = u => {
  if (u.controlObject.level < 15) return [];
  if (!upgrades[u.controlObject.tankType]) return [];
  let ups = [];
  if (upgrades[u.controlObject.tankType].lvl15 && u.controlObject.level >= 15) ups.push(...upgrades[u.controlObject.tankType].lvl15);
  if (upgrades[u.controlObject.tankType].lvl30 && u.controlObject.level >= 30) ups.push(...upgrades[u.controlObject.tankType].lvl30);
  if (upgrades[u.controlObject.tankType].lvl45 && u.controlObject.level >= 45) ups.push(...upgrades[u.controlObject.tankType].lvl45);
  if (upgrades[u.controlObject.tankType].dev) ups.push(...upgrades[u.controlObject.tankType].dev);
  return ups;
};

var gameSet = {
  gameMode: "ffa",
  maxPlayer: 10,
  tokens: ["TOKEN_wrjgdsnfTihD48970MFBlw_TOKEN"],
  mapSize: {
    x: 1250,
    y: 1250
  },
  lastTeamID: -1
};

let users = [];
global.objects = [];
global.objID = (function() {
  var id = 1;
  return function() {
    return id++;
  }
})();

let sockets = {};

let tankLength = 65;

let tree = new quadtree(-gameSet.mapSize.x * 2, -gameSet.mapSize.y * 2, gameSet.mapSize.x * 4, gameSet.mapSize.y * 4);
let sendTree = new quadtree(-gameSet.mapSize.x * 2, -gameSet.mapSize.y * 2, gameSet.mapSize.x * 4, gameSet.mapSize.y * 4);

app.use(express.static(__dirname + '/static'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

app.get('/token', (req, res) => {
  res.sendFile(__dirname + '/static/token.html');
});

app.get('/ping', (req, res) => {
  res.json({
    ok: true
  });
});

app.get("/data", (req, res) => {
  let mode = gameSet.gameMode;
  res.json({
    players: users.length + "/" + gameSet.maxPlayer,
    mode: mode.replace("ffa", "Free For All").replace("tdm", " Team Death Match")
  });
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var recursiveAsyncReadLine = function() {
  rl.question('Command: ', function(answer) {
    if (answer == 'exit') //we need some base case, for recursion
      return rl.close(); //closing RL and returning from function.
    eval(answer);
    recursiveAsyncReadLine(); //Calling this function again to ask new question
  });
};
recursiveAsyncReadLine();

io.on('connection', (socket) => {
  let currentPlayer = {
    id: socket.id,
    moveRotate: null,
    isDev: false,
    mouse: {
      left: false,
      right: false
    },
    target: {
      x: 0,
      y: 0
    },
    camera: {
      x: 0,
      y: 0,
      z: 1
    },
    k: false,
    kTime: 0,
    o: false,
    changeTank: false,
    changeTime: 0,
    controlObject: null,
    sendRecords: e => socket.emit("records", e),
    team: ++gameSet.lastTeamID % 2 === 0 ? 0 : 1,
    isAlive: false
  };
  //gameSet.mapSize.x+= 50;
  //gameSet.mapSize.y+= 50;

  shapeUtil.extendMaxShape(10);

  tree = sendTree = new quadtree(-gameSet.mapSize.x * 2, -gameSet.mapSize.y * 2, gameSet.mapSize.x * 4, gameSet.mapSize.y * 4);

  io.emit('mapSize', gameSet.mapSize, gameSet.gameMode);

  socket.on('login', (name, key) => { // 탱크 생성.
    let testAlive = () => {
      if (currentPlayer.controlObject == null) return true;
      if (currentPlayer.controlObject.isDead) return false;
      return true;
    };
    if (sockets[socket.id] && testAlive()) {
      console.log('New socket opened! (But closed)');
      return false;
    } else {
      if (typeof key !== "string" || key == undefined || key == null) key = "";
      if (key.length && gameSet.tokens.includes(key)) currentPlayer.isDev = true;
      //if (name === gameSet.devToken) name = "Oblivion Q. Plain";
      if (name.replace(/[\0-\x7f]|([0-\u07ff]|(.))/g, "$&$1$2").length > 25) {
        name = '';
        console.log('Invalid name, I guess...');
      }
      console.log('New socket opened.');
      sockets[socket.id] = socket;
      if (currentPlayer.isDev) console.log("A dev joined!");
      let obj = {
        objType: 'tank', // 오브젝트 타입. tank, bullet, drone, shape, boss 총 5가지가 있다.
        type: 0, // 오브젝트의 종류값.
        owner: currentPlayer, // 오브젝트의 부모.
        id: objID(), // 오브젝트의 고유 id.
        team: -1, // 오브젝트의 팀값.
        x: util.randomRange(-gameSet.mapSize.x, gameSet.mapSize.x), // 오브젝트의 좌표값.
        y: util.randomRange(-gameSet.mapSize.y, gameSet.mapSize.y),
        dx: 0.0, // 오브젝트의 속도값.
        dy: 0.0,
        level: 1, // 오브젝트의 레벨값.
        exp: 0, // 오브젝트의 경험치값.
        speed: function() {
          return (0.07 + (0.007 * obj.stats[7])) * Math.pow(0.985, obj.level - 1);
        }, // (0.07+(0.007*speedStat))*0.0985^(level-1)
        healthPer: 1, // 오브젝트의 이전 프레임 체력 비율값.
        health: 50, // 오브젝트의 체력값.
        maxHealth: function() {
          return 48 + obj.level * 2 + obj.stats[1] * 20;
        }, // 48+level*2+maxHealthStat*20
        lastHealth: 48, // 오브젝트의 이전 프레임 체력값.
        lastMaxHealth: 50, // 오브젝트의 이전 프레임 최대체력값.
        damage: function() {
          return 20 + obj.stats[2] * 4;
        }, // 20+bodyDamageStat*4
        radius: function() {
          return (13 * Math.pow(1.01, (obj.level - 1))) * (obj.realSize || 1);
        }, // 12.9*1.01^(level-1)
        rotate: 0, // 오브젝트의 방향값.
        bound: 1, // 오브젝트의 반동값.
        stance: 1, // 오브젝트의 반동 감소값.
        invTime: -1, // 오브젝트의 은신에 걸리는 시간.
        opacity: 1, // 오브젝트의 투명도값.
        name: name, // 오브젝트의 이름값.
        sight: function() {
          return userUtil.setUserSight(obj);
        }, // 오브젝트의 시야값.
        guns: [], // 오브젝트의 총구 목록.
        stats: [0, 0, 0, 0, 0, 0, 0, 0], // 오브젝트의 스탯값.
        maxStats: [7, 7, 7, 7, 7, 7, 7, 7], // 오브젝트의 최대 스탯값.
        stat: 0, // 오브젝트의 남은 스탯값.
        spawnTime: Date.now(), // 오브젝트의 스폰 시각.
        hitTime: Date.now(), // 오브젝트의 피격 시각.
        deadTime: -1, // 오브젝트의 죽은 시각.
        hitObject: null, // 오브젝트의 피격 오브젝트.
        moveAi: null, // 오브젝트의 이동 AI. 플레이어의 조종권한이 없을 때 실행하는 함수입니다.
        event: { // 여기 있는 값들은 모두 "함수" 입니다.

        },
        variable: {

        },
        upgrades: [],
        isBorder: true, // 오브젝트가 맵 밖을 벗어날 수 없는가?
        isCanDir: true, // 오브젝트의 방향을 조정할 수 있나?
        isCollision: false, // 오브젝트가 충돌계산을 마쳤나?
        isDead: false, // 오브젝트가 죽었나?
        isShot: false,
        isMove: false, // 오브젝트가 현재 움직이는가?
        setAlive: () => currentPlayer.isAlive = false
      };
      obj.team = obj.id;
      if (gameSet.gameMode.includes("tdm")) {
        obj.team = currentPlayer.team;
        let w = gameSet.mapSize.x * 2;
        if (obj.team === 0) obj.x = util.randomRange(-w / 2, -w / 2 + w * 0.15);
        if (obj.team === 1) obj.x = util.randomRange((w / 2) * 0.85, w / 2);
      }

      currentPlayer.controlObject = obj;

      userUtil.setUserTank(currentPlayer.controlObject);

      users.push(currentPlayer);
      objects.push(currentPlayer.controlObject);
      socket.emit('mapSize', gameSet.mapSize, gameSet.gameMode);
      io.emit('mapSize', gameSet.mapSize, gameSet.gameMode);
    }
  });

  socket.on('ping!', (data) => {
    if (!data) return;
    socket.emit('pong!', data);
  });

  socket.on('mousemove', (data) => { // 마우스 좌표, 탱크의 방향
    if (!data) return; // null 값을 받으면 서버 정지
    if (currentPlayer.controlObject) {
      currentPlayer.target.x = data.x - currentPlayer.controlObject.x;
      currentPlayer.target.y = data.y - currentPlayer.controlObject.y;
    }
  });

  socket.on('leftMouse', (data) => {
    currentPlayer.mouse.left = data;
  });

  socket.on('rightMouse', (data) => {
    if (currentPlayer.controlObject && currentPlayer.controlObject.event) {
      if (!currentPlayer.mouse.right && data) currentPlayer.controlObject.event.rightDownEvent();
      if (currentPlayer.mouse.right && !data) currentPlayer.controlObject.event.rightUpEvent();
    }
    currentPlayer.mouse.right = data;
  });

  socket.on('moveRotate', (data) => {
    if (isNaN(Number(data))) return;
    currentPlayer.moveRotate = data;
  });

  socket.on('keyK', (data) => {
    currentPlayer.k = data;
  });

  socket.on('keyO', (data) => {
    currentPlayer.o = data;
  });

  socket.on('changeTank', (data) => {
    currentPlayer.changeTank = data;
  });
  
  socket.on("upgradeTank", (data) => {
    let ups = getUpgrades(currentPlayer);
    if (!ups.includes(data)) return;
    console.log("Valid upgrade!");
    currentPlayer.controlObject.type = data;
    userUtil.setUserTank(currentPlayer.controlObject);
  });

  socket.on('stat', (num) => {
    if (currentPlayer.controlObject && currentPlayer.controlObject.stat > 0 && currentPlayer.controlObject.stats[num] < currentPlayer.controlObject.maxStats[num]) {
      currentPlayer.controlObject.stats[num]++;
      currentPlayer.controlObject.stat--;
    }
  });

  socket.on('disconnect', () => { // 연결 끊김
    if (sockets[socket.id]) {
      console.log('Socket closed.');

      tree = sendTree = new quadtree(-gameSet.mapSize.x * 2, -gameSet.mapSize.y * 2, gameSet.mapSize.x * 4, gameSet.mapSize.y * 4);

      shapeUtil.extendMaxShape(-10);

      currentPlayer.controlObject.owner = null;
      users.splice(util.findIndex(users, currentPlayer.id), 1);

      io.emit('mapSize', gameSet.mapSize, gameSet.gameMode);
    }
  });
});

function getParent(obj) {
  let newObj = obj;
  for (let i = 0; i < 100; i ++) {
    if (!newObj.owner) continue;
    if (!newObj.owner.objType) continue;
    newObj = newObj.owner;
  }
  return newObj;
}

function collisionCheck(aUser, bUser) { // 충돌 시 계산
  let dir = Math.atan2(aUser.y - bUser.y, aUser.x - bUser.x);

  if (aUser === bUser.owner || bUser === aUser.owner) return;
  let doMotion = true;
  if (gameSet.gameMode.includes("tdm") && aUser.team == bUser.team && (aUser.objType === "tank" || bUser.objType === "tank") && (["bullet", "drone"].includes(aUser.objType) || ["bullet", "drone"].includes(bUser.objType))) doMotion = false

  if (doMotion) {
    aUser.dx += Math.cos(dir) * Math.min(bUser.bound * aUser.stance, 6) / 5;
    aUser.dy += Math.sin(dir) * Math.min(bUser.bound * aUser.stance, 6) / 5;
    bUser.dx -= Math.cos(dir) * Math.min(aUser.bound * bUser.stance, 6) / 5;
    bUser.dy -= Math.sin(dir) * Math.min(aUser.bound * bUser.stance, 6) / 5;
  }

  if (aUser.team !== -1 && bUser.team !== -1 && aUser.team === bUser.team) return;

  io.emit('objectHit', aUser.id);
  io.emit('objectHit', bUser.id);

  aUser.hitTime = Date.now();
  bUser.hitTime = Date.now();

  aUser.hitObject = bUser;
  bUser.hitObject = aUser;

  if (bUser.lastHealth - util.isF(aUser.damage) <= 0) {
    aUser.health -= util.isF(bUser.damage) * (bUser.lastHealth / util.isF(aUser.damage));
  } else {
    aUser.health -= util.isF(bUser.damage);
  }
  if (aUser.lastHealth - util.isF(bUser.damage) <= 0) {
    bUser.health -= util.isF(aUser.damage) * (aUser.lastHealth / util.isF(bUser.damage));
  } else {
    bUser.health -= util.isF(aUser.damage);
  }
  if (aUser.health < 0) aUser.health = 0;
  if (bUser.health < 0) bUser.health = 0;
}

function tickPlayer(p) { // 플레이어를 기준으로 반복되는 코드입니다.
  if (p.controlObject && !p.controlObject.isDead) {
    p.camera.x = p.controlObject.x;
    p.camera.y = p.controlObject.y;

    if (p.controlObject.sight)
      p.camera.z = util.isF(p.controlObject.sight);
    else
      p.camera.z = 1;
    if (p.controlObject.event) {
      if (p.controlObject.event.rightEvent && p.mouse.right) {
        p.controlObject.event.rightEvent(p.controlObject);
      }
    }
    if (typeof(p.moveRotate) !== "number") {
      p.controlObject.isMove = false;
    } else {
      p.controlObject.dx += Math.cos(p.moveRotate) * util.isF(p.controlObject.speed);
      p.controlObject.dy += Math.sin(p.moveRotate) * util.isF(p.controlObject.speed);
      p.controlObject.isMove = true;
    }
    if (p.controlObject.isCanDir) {
      p.controlObject.rotate = Math.atan2(p.target.y, p.target.x);
    }

    if (p.isDev) {
      if (p.o) {
        p.controlObject.hitObject = p.controlObject;
        p.controlObject.health = 0;
      }
    }
  }
}

function tickObject(obj, index) {
  objUtil.moveObject(obj);

  if (obj.isDead) return;

  if (obj.health <= 0) {
    obj.health = 0;
    obj.isDead = true;
    if (obj.objType === "tank" && obj.owner) {
      obj.setAlive();
      let parent = getParent(obj.hitObject);
      obj.owner.sendRecords({
        score: obj.exp,
        level: obj.level,
        killedBy: parent.name
      });
    }
    if (obj.hitObject && obj.hitObject.event) {
      if (obj.hitObject.event.killEvent) {
        if (!obj.hitObject.event.killEvent(getParent(obj.hitObject), obj)) return false;
      }
    }
    if (obj.event) {
      if (obj.event.deadEvent) {
        if (!obj.event.deadEvent(getParent(obj), obj.hitObject)) return false;
      }
    }
  }

  switch (obj.objType) {
    case "tank":
      let sc = userUtil.setUserLevel(obj);
      if (!obj.isCanDir) {
        obj.rotate += 0.02;
      }
      if (obj.lastMaxHealth !== util.isF(obj.maxHealth)) {
        obj.healthPer = obj.health / obj.lastMaxHealth;
        obj.health = util.isF(obj.maxHealth) * obj.healthPer;
        obj.lastMaxHealth = util.isF(obj.maxHealth);
      }
      if (obj.owner) {
        userUtil.healTank(obj);
        if (obj.owner.isDev) {
          if (obj.owner.k && obj.level < 45 && obj.owner.kTime <= 0) {
            obj.exp = sc;
            obj.owner.kTime += 50;
          }
          obj.owner.kTime = Math.max(obj.owner.kTime - 1000 / 60, 0);
          if (obj.owner.changeTank) {
            obj.type = 61;
            userUtil.setUserTank(obj);
            /*if (obj.owner.changeTime <= 0) {
              obj.type = obj.type == 0 ? tankLength - 1 : obj.type - 1;
              userUtil.setUserTank(obj);
              obj.owner.changeTime += 1;
            }*/
            obj.owner.changeTank = false;
          }
          obj.owner.changeTime = Math.max(obj.owner.changeTime - 1000 / 60, 0);
        }
      } else {
        userUtil.afkTank(obj);
      }
      break;
    case "bullet":
      obj.time -= 1000 / 60;
      obj.isOwnCol = Math.max(obj.isOwnCol - 1000 / 60, 0);
      if (obj.time <= 0) {
        obj.isDead = true;
        if (obj.hitObject && obj.hitObject.event) {
          if (obj.hitObject.event.killEvent) {
            if (!obj.hitObject.event.killEvent(getParent(obj.hitObject), obj)) return false;
          }
        }
        if (obj.event) {
          if (obj.event.deadEvent) {
            if (!obj.event.deadEvent(obj, obj.hitObject)) return false;
          }
        }
      }
      break;
    case "drone":
      break;
    case "shape":
      obj.rotate += 0.1 / obj.radius;
      obj.x += 0.1 * Math.cos(obj.rotate);
      obj.y += 0.1 * Math.sin(obj.rotate);
      objUtil.healObject(obj);
      break;
    default:
      break;
  }

  if (obj.moveAi) {
    obj.moveAi(obj);
  }
  if (obj.isBorder) {
    if (obj.x > gameSet.mapSize.x + 51.6) obj.x = gameSet.mapSize.x + 51.6;
    if (obj.x < -gameSet.mapSize.x - 51.6) obj.x = -gameSet.mapSize.x - 51.6;
    if (obj.y > gameSet.mapSize.y + 51.6) obj.y = gameSet.mapSize.y + 51.6;
    if (obj.y < -gameSet.mapSize.y - 51.6) obj.y = -gameSet.mapSize.y - 51.6;
  }
  if (gameSet.gameMode.includes("tdm")) {
    let coll = false;
    if (obj.x < -gameSet.mapSize.x + gameSet.mapSize.x * 0.3 && obj.team !== 0) coll = true;
    if (obj.x > gameSet.mapSize.x * 0.7 && obj.team !== 1) coll = true;
    if (coll && ["tank", "drone", "bullet"].includes(obj.objType)) {
      obj.health = -1;
      if (obj.objType === "tank" && obj.owner) {
        obj.setAlive();
        obj.owner.sendRecords({
          score: obj.exp,
          level: obj.level,
          killedBy: "A base"
        });
      }
    }
  }
  if (obj.guns) {
    bulletUtil.gunSet(obj, index, io);
  }

  tree.retrieve(obj).forEach((u) => {
    let res = new SAT.Response();
    let isCol = SAT.testCircleCircle(new C(new V(obj.x, obj.y), util.isF(obj.radius)), new C(new V(u.x, u.y), util.isF(u.radius)), res);
    if (isCol) {
      collisionCheck(obj, u);
    }
  });

  tree.insert(obj);

  if (obj.isMove || obj.isShot || obj.invTime < 0) {
    obj.opacity = Math.min(obj.opacity + 0.1, 1);
  } else {
    obj.opacity = Math.max(obj.opacity - 1 / 60 / obj.invTime, 0);
  }

  obj.lastHealth = obj.health;
}

function moveloop() {
  tree.clear();
  const ulen = users.length;
  for (let i = 0; i < ulen; i++) {
    tickPlayer(users[i]);
  }
  shapeUtil.spawnShape(gameSet.mapSize);
  let olen = objects.length;
  for (let i = 0; i < olen; i++) {
    tickObject(objects[i], i);
  }
  for (let i = 0; i < olen; i++) {
    let o = objects[i];
    if (o.isDead) {
      if (o.deadTime === -1) {
        o.deadTime = 1000;
        if (o.guns) {
          const glen = o.guns.length;
          for (let j = 0; j < glen; j++) {
            if (!o.guns[j]) continue;
            const blen = o.guns[j].bullets.length;
            for (let k = 0; k < blen; k++) {
              o.guns[j].bullets[k].isDead = true;
            }
          }
        }
      } else if (o.deadTime < 0) {
        objects.splice(i, 1);
        olen--;
      } else {
        o.deadTime -= 1000 / 60;
      }
    }
  };
}

function sendUpdates() {
  sendTree.clear();
  var scoreBoardList = [];
  const olen = objects.length;
  for (let i = 0; i < olen; i++) {
    let f = objects[i];
    if (!f.isDead && f.objType === "tank") {
      scoreBoardList.push({
        name: f.name,
        score: f.exp
      });
    }
    sendTree.insert(f);
  };
  scoreBoardList = scoreBoardList.sort(function(a, b) {
    return Math.sign(b.score - a.score);
  }).slice(0, 10);
  const ulen = users.length;
  for (let i = 0; i < ulen; i++) {
    let u = users[i]; // what are you doing?
    let objList = sendTree.retrieve({
      x: u.camera.x + 1280 / u.camera.z,
      y: u.camera.y + 720 / u.camera.z,
      x2: u.camera.x - 1280 / u.camera.z,
      y2: u.camera.y - 720 / u.camera.z
    }, true);
    let visibleObject = [];
    const olen = objList.length;
    for (let j = 0; j < olen; j++) {
      let f = objList[j];
      let r = util.isF(f.radius);
      if (f.x > u.camera.x - 1280 / u.camera.z - r &&
        f.x < u.camera.x + 1280 / u.camera.z + r &&
        f.y > u.camera.y - 720 / u.camera.z - r &&
        f.y < u.camera.y + 720 / u.camera.z + r && f.opacity > 0) {
        switch (f.objType) {
          case "tank":
            visibleObject.push({
              objType: "tank",
              id: f.id,
              x: util.floor(f.x, 2),
              y: util.floor(f.y, 2),
              radius: util.floor(r, 1),
              rotate: util.floor(f.rotate, 2),
              maxHealth: util.floor(f.lastMaxHealth, 1),
              health: util.floor(f.health, 1),
              opacity: util.floor(f.opacity, 2),
              type: f.type,
              score: f.exp,
              name: f.name,
              owner: (f.owner) ? f.owner.id : null,
              isDead: f.isDead,
              team: f.team
            });
            break;
          case "bullet":
          case "drone":
            visibleObject.push({
              objType: f.objType,
              id: f.id,
              x: util.floor(f.x, 2),
              y: util.floor(f.y, 2),
              radius: util.floor(r, 1),
              rotate: util.floor(f.rotate, 2),
              type: f.type,
              owner: f.owner.id,
              isDead: f.isDead,
              team: f.team
            });
            break;
          case "shape":
            visibleObject.push({
              objType: "shape",
              id: f.id,
              x: util.floor(f.x, 2),
              y: util.floor(f.y, 2),
              radius: util.floor(r, 1),
              rotate: util.floor(f.rotate, 2),
              maxHealth: util.floor(util.isF(f.maxHealth), 1),
              health: util.floor(f.health, 1),
              type: f.type,
              isDead: f.isDead
            });
            break;
          default:
            break;
        }
      }
    }
    sockets[u.id].emit('objectList', visibleObject);
    sockets[u.id].emit('playerSet', {
      level: u.controlObject.level,
      camera: u.camera,
      isRotate: u.controlObject.isCanDir,
      stat: u.controlObject.stat,
      stats: u.controlObject.stats,
      maxStats: u.controlObject.maxStats,
      upgrades: getUpgrades(u)
    });
    sockets[u.id].emit('scoreboardlist', scoreBoardList);
  };
}

setInterval(moveloop, 1000 / 60);
setInterval(sendUpdates, 1000 / 30);
server.listen(3000, () => {
  console.log("Server started!");
});