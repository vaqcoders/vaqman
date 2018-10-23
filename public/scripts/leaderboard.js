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
    h1.textContent = "Top Players:";

    const info = document.createElement("small");
    info.textContent = `${json.players} in lobby`;

    const tb = json.topTen.reduce((acc, cur, i) => {
      const tr = document.createElement("tr");
      tr.className = "leaderboard-entry";

      const td1 = document.createElement("td");
      td1.className = "placement";
      td1.textContent = i + 1;

      const td2 = document.createElement("td");
      td2.className = "name-on-leaderboard";
      td2.textContent = cur.name;

      const td3 = document.createElement("td");
      td3.className = "points-on-leaderboard";
      td3.textContent = cur.points;

      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);

      acc.appendChild(tr);
      return acc;

    }, document.createElement("table"));

    div.appendChild(h1);
    div.appendChild(info);
    div.appendChild(tb);

    this.el = div;
    return div;

  }

}
