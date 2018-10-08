const socket = io.connect(window.href);
const zoneShape = [28, 29];
let player, cnv;
let playerLoaded = false;
let changingZones = false;
let leaderboard;
let foes = {};
let pacmaze = ["###### ############## ######","#....# #.....##.....# #....#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#..........................#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#......##....##....##......#","######.##### ## #####.######","     #.##### ## #####.#     ","     #.##    ##    ##.#     ","######.## ######## ##.######","      .   #      #   .      ","######.## #      # ##.######","     #.## #      # ##.#     ","     #.## ######## ##.#     ","     #.##          ##.#     ","     #.## ######## ##.#     ","######.## ######## ##.######","#......##....##....##......#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#..........................#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#....# #.....##.....# #....#","###### ############## ######"];

function setup() {
  cnv = createCanvas(window.innerHeight * 0.95, window.innerHeight * 0.95);
  cnv.parent("canvas-container");

  leaderboard = new Leaderboard("leaderboard-container");

  Ply.dialog("prompt", {
    title: "Choose a Screen Name",
    form: {name: "Ethan, Jason, etc..."}
  }).done(ui => {
    player = new Pacman({
      name: ui.data.name,
      discriminator: Math.floor(Math.random() * 9000 + 1000),
      pos: {x: 14, y: 17},
      zone: 0
    });
    socket.emit("start", player);
    setInterval(() => socket.emit("score updated", player), 10 * 1000);
  });
}

function draw() {

  if (player && playerLoaded && !changingZones) {
    if (frameCount % 6 == 0) {

      if (player.pos.x <= 0 || player.pos.x >= zoneShape[0] - 1 || player.pos.y <= 0 || player.pos.y >= zoneShape[1] - 1) {

        socket.emit("zone changed", player);
        socket.emit("position updated", {
          discriminator: player.discriminator,
          warping: true
        });
        changingZones = true;

      } else {

        background(0);
        renderPacmaze();

        renderFoes();

        player.render(width * 0.03571, height * 0.03448);
        player.update();

        if (pacmaze[player.pos.y][player.pos.x] == "#") player.bonk();
        else if (pacmaze[player.pos.y][player.pos.x] == ".") {
          injectPacmaze(" ", player.pos.x, player.pos.y);
          const tempx = player.pos.x * 1, tempy = player.pos.y * 1;
          player.eat();
        }

        if (player.pos.x != player.ppos.x || player.pos.y != player.ppos.y) {
          socket.emit("position updated", {
            discriminator: player.discriminator,
            x: player.pos.x,
            y: player.pos.y,
            z: player.zone
          });
        }

        controls();
      }
    }
  }

}

function windowResized() {
  resizeCanvas(window.innerHeight * 0.95, window.innerHeight * 0.95);
}

// SOCKET EVENTS
socket.on("discriminator", data => {
  player["discriminator"] = data;
  playerLoaded = true;
});

socket.on("foe updated", data => {
  if (data.status == "warping") delete foes[data.discriminator];
  else if (data.status == "here") {
    if (foes[data.discriminator])
      foes[data.discriminator].pos = {x: data.x, y: data.y};
    else {
      foes[data.discriminator] = {
        pos: {x: data.x, y: data.y},
        name: data.name,
        discriminator: data.discriminator
      };
    }
  }
  // console.log(foes);
});

socket.on("maze updated", data => {
  try {
    if (player.zone == data.zone)
      injectPacmaze(data.sym, data.x, data.y, false);
  } catch(err) {
    console.error("Maze cannot be updated while warping between zones.")
  }
});

socket.on("leaderboard updated", data => {
  //console.log(data);
  //leaderboard.update(data);
});

socket.on("zone changed", data => {
  if (player.discriminator == data.discriminator) {
    console.log(`currently in zone #${data.zoneIndex}`);
    pacmaze = data.zone;
    foes = data.foes;
    player.zone = data.zoneIndex;
    player.pos.x = player.ppos.x = data.pos.x;
    player.pos.y = player.ppos.y = data.pos.y;
    changingZones = false;
  }
});

// HELPER FUNCTIONS
function renderPacmaze() {
  const w = width / zoneShape[0], h = height / zoneShape[1];
  pacmaze.forEach((row, i) => row.split("").forEach((cell, j) => {
    if (cell == "#") {
      fill(0, 0, 255);
      rect(j * w, i * h, w, h);
    } else if (cell == ".") {
      fill(255);
      ellipse(j * w + (w * 0.5), i * h + (h * 0.5), w * 0.5, h * 0.5);
    } else if (cell == "@") {
      fill(255);
      ellipse(j * w + (w * 0.5), i * h + (h * 0.5), w, h);
    }
  }));
}

function renderFoes() {
  Object.values(foes).forEach(foe => {
    Pacman.render(
      foe.pos.x, foe.pos.y,
      width * 0.03571, height * 0.03448
    );
  });
}

function injectPacmaze(sym, x, y, emit = true) {
  const temp = pacmaze[y];
  const gimme = temp.slice(0, x) + sym + temp.slice(x + 1);
  pacmaze[y] = gimme;
  if (emit) socket.emit("maze updated", {zone: player.zone, sym: sym, x: x, y: y});
}

function transposePacmaze() {
  let gimmeMaze = [];
  for (let x = 0; x < pacmaze[0].length; x++) {
    let gimmeRow = "";
    for (let y = 0; y < pacmaze.length; y++)
      gimmeRow += pacmaze[y][x];
    gimmeMaze.push(gimmeRow);
  } return gimmeMaze;
}

function controls() {
  const gimmeVel = keyIsDown(RIGHT_ARROW) ? {x: 1, y: 0} :
                   keyIsDown(UP_ARROW) ? {x: 0, y: -1} :
                   keyIsDown(LEFT_ARROW) ? {x: -1, y: 0} :
                   keyIsDown(DOWN_ARROW) ? {x: 0, y: 1} : null;
  try {
    if (gimmeVel) {
      const nextCell = pacmaze[player.pos.y + gimmeVel.y][player.pos.x + gimmeVel.x];
      if (nextCell == "." || nextCell == "@" || nextCell == " ") player.update(gimmeVel);
    }
  } catch(err) {
    console.error("Velocity cannot be changed while warping between zones.");
  }

}
