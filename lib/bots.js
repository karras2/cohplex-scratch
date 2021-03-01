'use strict';

const util = require('./utility');
const utilObj = require('./objectSet');
const utilUser = require('./userSet');

exports.spawnBot = function(mapSize, objID) {
  let xx = util.randomRange(-mapSize.x, mapSize.x);
  let yy = util.randomRange(-mapSize.y, mapSize.y);
  let obj = {
        objType: 'tank', // 오브젝트 타입. tank, bullet, drone, shape, boss 총 5가지가 있다.
        type: 0, // 오브젝트의 종류값.
        owner: null, // 오브젝트의 부모.
        id: objID(), // 오브젝트의 고유 id.
        team: -1, // 오브젝트의 팀값.
        x: spawnData ? spawnData.x : util.randomRange(-gameSet.mapSize.x, gameSet.mapSize.x), // 오브젝트의 좌표값.
        y: spawnData ? spawnData.y : util.randomRange(-gameSet.mapSize.y, gameSet.mapSize.y),
        dx: 0.0, // 오브젝트의 속도값.
        dy: 0.0,
        level: 1, // 오브젝트의 레벨값.
        exp: spawnData ? spawnData.xp : 0, // 오브젝트의 경험치값.
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
}