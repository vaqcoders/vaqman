class Leaderboard {

  constructor(parent) {
    this.el;
    this.parent = document.getElementById(parent);
  }

  update(json) {
    this.createElement(json);
    this.parent.innerHTML = "";
    this.parent.appendChild(this.el);
  }

  createElement(json) {

    const div = document.createElement("div");
    div.className = "leaderboard";

    const h1 = document.createElement("h1");
    h1.textContent = `Top Players (${json.players})`;

    const ol = json.topTen.reduce((acc, cur, i) => {
      const li = document.createElement("li");

      const mark = document.createElement("mark");
      mark.textContent = cur.name;

      const small = document.createElement("small");
      small.textContent = cur.points;

      li.appendChild(mark);
      li.appendChild(small);
      
      acc.appendChild(li);
      return acc;

    }, document.createElement("ol"));

    div.appendChild(h1);
    div.appendChild(ol);

    this.el = div;
    return div;

  }

}
