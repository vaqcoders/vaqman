const socket = io.connect(window.href);
let player, cnv;
let changingZones = false;
let pacmaze = ["###### ############## ######","#....# #.....##.....# #....#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#..........................#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#......##....##....##......#","######.##### ## #####.######","     #.##### ## #####.#     ","     #.##    ##    ##.#     ","######.## ######## ##.######","      .   #      #   .      ","######.## #      # ##.######","     #.## #      # ##.#     ","     #.## ######## ##.#     ","     #.##          ##.#     ","     #.## ######## ##.#     ","######.## ######## ##.######","#......##....##....##......#","#.####.##.########.##.####.#","#.####.##.########.##.####.#","#..........................#","#.#### #####.##.##### ####.#","#@#### #####.##.##### ####@#","#.#### #####.##.##### ####.#","#....# #.....##.....# #....#","###### ############## ######"];

function setup() {
  cnv = createCanvas(window.innerHeight * 0.95, window.innerHeight * 0.95);
  cnv.parent("canvas-container");

  Ply.dialog("prompt", {
    title: "Choose a Screen Name",
    form: {name: "Ethan, Jason, etc..."}
  }).done(ui => {
    console.log(ui)
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
  if (player && !changingZones) {
    if (frameCount % 6 == 0) {

      if (player.pos.x < 0 || player.pos.x > 28 || player.pos.y < 0 || player.pos.y > 29) {
        socket.emit("zone changed", player);
        changingZones = true;
      } else {
        background(0);
        renderPacmaze();

        player.render(width * 0.03571, height * 0.03448);
        player.update();

        if (pacmaze[player.pos.y][player.pos.x] == "#") player.bonk();
        else if (pacmaze[player.pos.y][player.pos.x] == ".") {
          injectPacmaze(" ", player.pos.x, player.pos.y);
          const tempx = player.pos.x * 1, tempy = player.pos.y * 1;
          player.eat();
        }
      }
    }

    controls();
  }
}

function windowResized() {
  resizeCanvas(window.innerHeight * 0.95, window.innerHeight * 0.95);
}

// SOCKET EVENTS
socket.on("maze updated", data => {
  if (player.zone == data.zone)
    injectPacmaze(data.sym, data.x, data.y, false);
});

socket.on("zone changed", data => {
  if (player.discriminator == data.discriminator) {
    pacmaze = data.zone;
    player.zone = data.zone;
    player.pos.x = data.x;
    player.pos.y = data.y;
    changingZones = false;
  }
})

// HELPER FUNCTIONS
function renderPacmaze() {
  const w = width / 28, h = height / 29;
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
  if (gimmeVel) {
    const nextCell = pacmaze[player.pos.y + gimmeVel.y][player.pos.x + gimmeVel.x];
    if (nextCell == "." || nextCell == "@" || nextCell == " ") player.update(gimmeVel);
  }
}
