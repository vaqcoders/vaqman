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
const zoneShape = [28, 29];
const zonesShape = [10, 3];

for (let i = 0; i < zonesShape[0] * zonesShape[1]; i++)
  zones.push(Object.values(pacmaze_boilerplate))

io.sockets.on("connection", socket => {

  console.log("We have a new client: " + socket.id);

  socket.on("start", data => {
    console.log(`${data.name} has joined`);
    players[data.discriminator] = data;
    console.log(`current number of players: ${Object.values(players).length}`)
  });

  socket.on("score updated", data => {
    console.log(`${data.name} has a score of ${data.points}`);
    topTen = createLeaderboard();
    io.emit("score updated", topTen);
  });

  socket.on("position updated", data => {
    console.log(`${data.name} has a score of ${data.points}`);
    players[data.discriminator].pos.x = data.pos.x;
    players[data.discriminator].pos.y = data.pos.y;
  });

  socket.on("eaten", data => {
    // self-destruct
  });

  socket.on("maze updated", data => {
    injectPacmaze(data.zone, data.sym, data.x, data.y);
    if (data.sym == " ")
      setTimeout(() => injectPacmaze(data.zone, ".", data.x, data.y), 10 * 1000);
  });

  socket.on("zone changed", data => {
    const z = data.zone, // current zone
          l = zones.length - 1, // final zone
          y = Math.min(zonesShape[1], l); // height of zone shape

    // baseline = previous zone that % y == 0
    let baseline = 0;
    for (let i = 1; i < y; i++)
      if ((z - (y - i)) % y == 0) baseline = (z - (y - i));

    let gimmeZone, gimmePos, gimmeVel;

    if (data.pos.x <= 0) {
      // choose leftward zone
      gimmeZone = z - y; // baseline - y + (z % y);
    } else if (data.pos.x >= zoneShape[0]) {
      // choose rightward zone
      gimmeZone = z + y;
    } else if (data.pos.y <= 0) {
      // choose upwards zone 6 | 21
      gimmeZone = (z - 1 < baseline) ? (baseline + (y - 1)) : (z - 1);
    } else if (data.pos.y >= zoneShape[1]) {
      // choose downwards zone 6 | 21
      gimmeZone = (z + 1 > baseline + (y - 1)) ? baseline : z + 1;
    }
    io.emit("zone changed", {
      discriminator: data.discriminator,
      zone: zones[gimmeZone],
      zoneIndex: gimmeZone,
      pos: gimmePos,
      vel: gimmeVel
    });
  });

  socket.on("exit", data => {
    console.log(`${data.name} has left.`);
    delete players[data.discriminator];
  });

  socket.on("disconnect", data => {

  });

});

// HELPER FUNCTIONS
function createLeaderboard() {
  return Object.values(players)
    .sort((a, b) => a.points - b.points)
    .slice(0, 9);
}

function injectPacmaze(zone, sym, x, y) {
  const temp = zones[zone][y];
  const gimme = temp.slice(0, x) + sym + temp.slice(x + 1);
  zones[zone][y] = gimme;
  io.emit("maze updated", {zone, sym, x, y});
}

function findBlankZone() {
  Object.values(players).reduce((acc, cur, i) => {
    acc.delete(cur.zone);
    return acc;
  }, new Set(Array.apply(null, {length: zones.length}).map(Number.call, Number)))[0];
}
