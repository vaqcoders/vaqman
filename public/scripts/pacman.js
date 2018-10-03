class Pacman {

  constructor(config) {
    this.id = config.id;
    this.pos = config.pos;
    this.ppos = {x: config.pos.x, y: config.pos.y};
    this.points = 0;
    this.active = {
      timestamp: 0,
      isActive: false
    };
    this.vel = {x: 0, y: 0};
    this.pvel = {x: 0, y: 0};
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

  render(xscl, yscl, xoff, yoff) {
    const midoffx = xscl * 0.5,
          midoffy = yscl * 0.5;
    fill(255, 255, 0);
    ellipse(this.pos.x * xscl + midoffx, this.pos.y * yscl + midoffy, xscl);
  }

  bonk() {
    this.pos.x = this.ppos.x;
    this.pos.y = this.ppos.y;
    this.vel.x = this.pvel.x;
    this.vel.y = this.pvel.y;
    console.log("bonk");
  }

}
