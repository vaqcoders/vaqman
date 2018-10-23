class Leaderboard {

  constructor(parent) {
    this.el;
    this.parent = $(`#${parent}`);
  }

  update(json) {
    this.createElement(json);
    this.parent.html("");
    this.parent.append(this.el);
  }

  createElement(json) {

    const div = $("<div></div>");
    div.addClass("leaderboard");

    const h1 = $("<h1></h1>").text("Top Players:");

    const info = $("<small></small>").text(`${json.players} in lobby`);

    const tb = json.topTen.reduce((acc, cur, i) => {
      const tr = $("<tr></tr>");
      tr.addClass("leaderboard-entry");

      const td1 = $("<td></td>").text(i + 1);
      td1.addClass("placement");

      const td2 = $("<td></td>").text(cur.name);
      td2.addClass("name-on-leaderboard");

      const td3 = $("<td></td>").text(cur.points);
      td3.addClass("points-on-leaderboard");

      tr.append(td1, td2, td3);

      acc.append(tr);
      return acc;

    }, $("<table></table>"));

    div.append(h1, info, tb);

    this.el = div;
    return div;

  }

}
