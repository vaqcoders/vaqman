class Pacman {

  constructor(config) {
    this.id = config.id;
    this.pos = config.pos;
    this.points = 0;
    this.active = {
      timestamp: 0,
      isActive: false
    };
  }
  
}
