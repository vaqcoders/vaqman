class Pacman {

  constructor(config) {
    this.discriminator = config.discriminator;
    this.name = config.name || config.discriminator;
    this.pos = config.pos;
    this.ppos = {x: config.pos.x, y: config.pos.y};
    this.points = 0;
    this.active = false;
    this.vel = {x: 0, y: 0};
    this.pvel = {x: 0, y: 0};
    this.zone = config.zone;
  }

  update(vel) {
    if (vel) {
      this.pvel = {x: this.vel.x, y: this.vel.y};
      this.vel = vel;
    } else {
      this.ppos.x = this.pos.x;
      this.ppos.y = this.pos.y;
      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;
    }
  }

  render(xscl, yscl, xoff = 0, yoff = 0) {
    const midoffx = xscl * 0.5,
          midoffy = yscl * 0.5;
    const x = this.pos.x * xscl + midoffx,
          y = this.pos.y * yscl + midoffy;
    if (!this.active) fill(255, 255, 0);
    else fill(255, 100, 0);
    ellipse(x, y, xscl);

    fill(255, 255, 0);
    textAlign(CENTER);
    fill(255, 0, 0);
    text(this.name, x, y);
  }

  static render(foe, xscl, yscl, xoff = 0, yoff = 0) {
    const midoffx = xscl * 0.5,
          midoffy = yscl * 0.5;
    const x = foe.pos.x * xscl + midoffx,
          y = foe.pos.y * yscl + midoffy;
    if (!foe.active) fill(255, 255, 0);
    else fill(255, 100, 0);
    ellipse(x, y, xscl);

    fill(255, 255, 0);
    textAlign(CENTER);
    fill(255, 0, 0);
    text(foe.name, x, y);
  }

  eat() {
    this.points++;
  }

  activate() {
    this.active = true;
    console.log(`${this.name} has been activated!!!`);
  }

  deactivate() {
    this.active = false;
    console.log(`${this.name} has been deactivated...`);
  }

  bonk() {
    this.pos.x = this.ppos.x;
    this.pos.y = this.ppos.y;
    //this.vel.x = this.pvel.x;
    //this.vel.y = this.pvel.y;
  }

}
