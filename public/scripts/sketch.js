const socket = io.connect(window.href);
const zoneShape = [28, 29];
let player, cnv;
let playerLoaded = false;
let changingZones = false;
let leaderboard;
let foes = {};
let pacmaze = ["###### ############## ######","#....# #.....##.....# #....#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#..........................#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#......##....##....##......#","######.##### ## #####.######","     #.##### ## #####.#     ","     #.##    ##    ##.#     ","######.## ######## ##.######","      .   #      #   .      ","######.## #      # ##.######","     #.## #      # ##.#     ","     #.## ######## ##.#     ","     #.##          ##.#     ","     #.## ######## ##.#     ","######.## ######## ##.######","#......##....##....##......#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#..........................#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#....# #.....##.....# #....#","###### ############## ######"];

const S = new Stats();
S.dom.style.top = S.dom.style.left = "";
S.dom.style.bottom = S.dom.style.right = "0";
document.body.appendChild(S.dom);

function setup() {
  cnv = createCanvas(window.innerHeight * 0.95, window.innerHeight * 0.95);
  cnv.parent("canvas-container");

  leaderboard = new Leaderboard("leaderboard-container");

  Ply.dialog("prompt", {
    title: "Choose a Screen Name",
    form: {name: "Ethan, Jason, etc..."}
  }).always(ui => {
    player = new Pacman({
      name: ui.data.name || "guest",
      discriminator: Math.floor(Math.random() * 9000 + 1000),
      pos: {x: 14, y: 17},
      zone: 0 // Math.floor(Math.random() * 36)
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

        const sym = pacmaze[player.pos.y][player.pos.x];
        if (sym == "#") player.bonk();
        else if (sym == ".") {
          injectPacmaze(" ", player.pos.x, player.pos.y);
          renderScore();
          player.eat();
        } else if (sym == "@") {
          injectPacmaze("!", player.pos.x, player.pos.y);
          player.activate();
        }

        // Check if collision with other players
        if (!player.active) {
          Object.values(foes).forEach(foe => {
            if (foe.active && foe.pos.x == player.pos.x && foe.pos.y == player.pos.y)
              window.location.href = window.location.href + " ";
          });
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

  S.update();
}

function windowResized() {
  resizeCanvas(window.innerHeight * 0.95, window.innerHeight * 0.95);
}

// SOCKET EVENTS
socket.on("introduction", data => {
  player.discriminator = data.discriminator;
  pacmaze = data.zone;
  playerLoaded = true;
});

socket.on("foe updated", data => {
  const {status, name, discriminator, x, y} = data;
  if (status == "warping") delete foes[discriminator];
  else if (status == "activated") foes[discriminator].active = true;
  else if (status == "deactivated") foes[discriminator].active = false;
  else if (status == "here") {
    if (foes[discriminator])
      foes[discriminator].pos = {x, y};
    else {
      foes[discriminator] = {
        pos: {x, y},
        name: name,
        discriminator: discriminator
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

socket.on("deactivate", data => player.deactivate());

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
  const w = width / zoneShape[0],
        h = height / zoneShape[1];
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
    Pacman.render(foe, width * 0.03571, height * 0.03448);
  });
}

function renderScore() {
  document.getElementById("score-container").textContent = player.points;
  document.getElementById("zone-container").textContent = `Zone: ${player.zone}`;
}

function injectPacmaze(sym, x, y, emit = true) {
  const temp = pacmaze[y];
  const gimme = temp.slice(0, x) + sym + temp.slice(x + 1);
  pacmaze[y] = gimme;
  if (emit) socket.emit("maze updated", {
    zone: player.zone,
    discriminator: player.discriminator,
    sym: sym,
    x: x,
    y: y
  });
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
