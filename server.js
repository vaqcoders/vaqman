const express = require("express");
const app = express();
const pacmaze_boilerplate = ["###### ############## ######","#....# #.....##.....# #....#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#..........................#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#......##....##....##......#","######.##### ## #####.######","     #.##### ## #####.#     ","     #.##    ##    ##.#     ","######.## ######## ##.######","      .   #      #   .      ","######.## #      # ##.######","     #.## #      # ##.#     ","     #.## ######## ##.#     ","     #.##          ##.#     ","     #.## ######## ##.#     ","######.## ######## ##.######","#......##....##....##......#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#..........................#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#....# #.....##.....# #....#","###### ############## ######"];

const server = app.listen(process.env.PORT || 8080, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log("Listening at http://" + host + ":" + port);
});

app.use(express.static("public"));
const io = require("socket.io")(server);

let players = {};
let topTen = [];
let zones = [];
let playersByZone = {};
const zoneShape = [28, 29];
const zonesShape = [6, 6];

for (let i = 0; i < zonesShape[0] * zonesShape[1]; i++)
  zones.push(Object.values(pacmaze_boilerplate));

io.sockets.on("connection", socket => {

  console.log("We have a new client: " + socket.id);

  // ON START
  socket.on("start", data => {
    players[socket.id] = data;
    players[socket.id]["discriminator"] = socket.id;

    if (playersByZone[data.zone]) playersByZone[data.zone].add(socket.id);
    else playersByZone[data.zone] = new Set([socket.id]);

    socket.emit("introduction", {
      discriminator: socket.id,
      zone: zones[data.zone]
    });

    playersByZone[data.zone].forEach(discriminator => {
      if (socket.id == discriminator) return;
      io.to(`${discriminator}`).emit("foe updated", {
        x: data.pos.x,
        y: data.pos.y,
        name: players[socket.id].name,
        discriminator: socket.id,
        status: "here"
      });
    });

    console.log(`${data.name} has joined`);
    console.log(`current number of players: ${Object.keys(players).length}`);
  });

  // ON SCORE UPDATED
  socket.on("score updated", data => {
    players[data.discriminator].points = data.points;
  });

  // ON POSITION UPDATED
  socket.on("position updated", data => {
    players[data.discriminator].pos.x = data.x;
    players[data.discriminator].pos.y = data.y;
    if (playersByZone[data.z]) {
      playersByZone[data.z].forEach(discriminator => {
        if (socket.id == discriminator) return;
        io.to(`${discriminator}`).emit("foe updated", {
          x: data.x,
          y: data.y,
          name: players[data.discriminator].name,
          discriminator: data.discriminator,
          status: "here"
        });
      });
    }
  });

  socket.on("eaten", data => {
    const {foe, name, points} = data;
    io.to(`${foe}`)
      .emit("eaten", {name, points});
  });

  // ON MAZE UPDATED
  socket.on("maze updated", data => {
    injectPacmaze(data.zone, data.sym, data.x, data.y);
    if (data.sym == " ")
      setTimeout(() => injectPacmaze(data.zone, ".", data.x, data.y), 10 * 1000);
    else if (data.sym == "!") {
      players[socket.id].active = true;
      playersByZone[data.zone].forEach(discriminator => {
        if (socket.id == discriminator || !discriminator) return;
        io.to(`${discriminator}`).emit("foe updated", {
          name: players[data.discriminator].name,
          discriminator: data.discriminator,
          status: "activated"
        });
      });
      setTimeout(() => {
        socket.emit("deactivate", {active: false});
        players[socket.id].active = false;
        playersByZone[data.zone].forEach(discriminator => {
          if (socket.id == discriminator) return;
          io.to(`${discriminator}`).emit("foe updated", {
            name: players[data.discriminator].name,
            discriminator: data.discriminator,
            status: "deactivated"
          });
        });
      }, 5 * 1000);
      setTimeout(() => injectPacmaze(data.zone, "@", data.x, data.y), 25 * 1000);
    }
  });

  // ON ZONE CHANGED
  socket.on("zone changed", data => {
    const response = findNextZone(data);
    // console.log(`${data.name} from ${data.zone} to ${response.zoneIndex}`);

    playersByZone[data.zone].delete(data.discriminator);
    if (playersByZone[response.zoneIndex]) playersByZone[response.zoneIndex].add(data.discriminator);
    else playersByZone[response.zoneIndex] = new Set([data.discriminator]);

    let gimmeFoes = {};
    if (playersByZone[response.zoneIndex]) {

      gimmeFoes = [...playersByZone[response.zoneIndex]]
        .filter(discriminator => discriminator != socket.id)
        .map(discriminator => players[discriminator])
        .reduce((acc, cur) => {
          if (cur) acc[cur.discriminator] = cur;
          return acc;
        }, {});

      playersByZone[data.zone].forEach(discriminator => {
        if (socket.id == discriminator) return;
        io.to(`${discriminator}`).emit("foe updated", {
          status: "warping",
          name: players[data.discriminator].name,
          discriminator: data.discriminator
        });
      });

    }

    socket.emit("zone changed", {
      discriminator: data.discriminator,
      foes: gimmeFoes,
      zone: zones[response.zoneIndex],
      zoneIndex: response.zoneIndex,
      pos: response.pos,
      vel: response.vel
    });

  });

  // ON DISCONNECT
  socket.on("disconnect", data => {
    if (!players[socket.id]) return;
    console.log(`${players[socket.id].name} has left.`);
    const affectedZone = players[socket.id].zone;
    playersByZone[affectedZone].delete(socket.id);
    playersByZone[affectedZone].forEach(discriminator => {
      io.to(`${discriminator}`).emit("foe updated", {
        status: "warping",
        discriminator: socket.id
      });
    });
    delete players[socket.id];
  });

});

// INTERVALS
setInterval(() => {
  topTen = createLeaderboard();
  io.emit("leaderboard updated", {
    players: Object.keys(players).length,
    topTen: topTen
  });
}, 5 * 1000); // update leaderboard every 5 seconds

// HELPER FUNCTIONS
function createLeaderboard() {
  return Object.values(players)
    .sort((a, b) => b.points - a.points)
    .slice(0, 9);
}

function injectPacmaze(zone, sym, x, y) {
  const temp = zones[zone][y];
  const gimme = temp.slice(0, x) + sym + temp.slice(x + 1);
  zones[zone][y] = gimme;
  playersByZone[zone].forEach(discriminator => {
    io.to(`${discriminator}`)
      .emit("maze updated", {zone, sym, x, y});
  });
}

function findBlankZone() {
  Object.values(players).reduce((acc, cur, i) => {
    acc.delete(cur.zone);
    return acc;
  }, new Set(Array.apply(null, {length: zones.length}).map(Number.call, Number)))[0];
}

function findNextZone(data) {
  const z = data.zone, // current zone
        l = zones.length - 1, // final zone
        y = zonesShape[1]; // height of zone shape

  let baseline;
  for (let i = 0; i < y; i++) {
    if ((z - i) % y == 0) {
      baseline = z - i;
      break;
    }
  }

  let gimmeZone, gimmePos, gimmeVel;

  if (data.pos.x <= 0) {
    // choose leftward zone
    gimmeZone = (z - y < 0) ? l - (y - z) + 1 : z - y;
    gimmePos = {x: zoneShape[0] - 2, y: data.pos.y};
    gimmeVel = {x: -1, y: 0};

  } else if (data.pos.x >= zoneShape[0] - 2) {
    // choose rightward zone
    gimmeZone = (z + y > l) ? (z - baseline || 0) : z + y;
    gimmePos = {x: 1, y: data.pos.y};
    gimmeVel = {x: 1, y: 0};

  } else if (data.pos.y <= 0) {
    // choose upwards zone
    gimmeZone = (z - 1 < baseline) ? (baseline + (y - 1)) : (z - 1);
    gimmePos = {x: data.pos.x, y: zoneShape[1] - 2};
    gimmeVel = {x: 0, y: -1};

  } else if (data.pos.y >= zoneShape[1] - 2) {
    // choose downwards zone
    gimmeZone = (z + 1 > baseline + (y - 1)) ? baseline : z + 1;
    gimmePos = {x: data.pos.x, y: 1};
    gimmeVel = {x: 0, y: 1};
  }

  return {
    zoneIndex: gimmeZone,
    pos: gimmePos,
    vel: gimmeVel
  };

}
