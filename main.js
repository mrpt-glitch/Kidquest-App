const KEY = "kidquest-v1";
const TABS = [
  ["missions", "\uD83D\uDE80", "Missions"],
  ["learn", "\uD83D\uDCDA", "Learn"],
  ["prizes", "\uD83C\uDF81", "Prizes"],
  ["family", "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66", "Family"],
];

const blank = () => ({
  pin: "",
  familyName: "Espinoza",
  kids: [
    { id: "oliver", name: "Oliver", icon: "\uD83E\uDDB8", stars: 0 },
    { id: "arianna", name: "Arianna", icon: "\uD83C\uDF1F", stars: 0 },
  ],
  items: { missions: [], learn: [], prizes: [] },
  done: {},
});

let state = load();
let kidId = state.kids[0] ? state.kids[0].id : "oliver";
let tab = "missions";
let unlocked = !state.pin;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    s.kids = s.kids || blank().kids;
    s.items = s.items || { missions: [], learn: [], prizes: [] };
    s.items.missions = s.items.missions || [];
    s.items.learn = s.items.learn || [];
    s.items.prizes = s.items.prizes || [];
    s.done = s.done || {};
    return s;
  } catch (e) {
    return blank();
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
const kid = () => state.kids.find((k) => k.id === kidId) || state.kids[0];
const items = () => (state.items[tab] || []).filter((i) => !i.kidId || i.kidId === kidId || i.kidId === "all");

function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstChild;
}

function render() {
  const root = document.getElementById("app");
  if (!unlocked) {
    root.innerHTML = "<h1>KidQuest</h1><p class=\"muted\">Family PIN</p><div class=\"card\"><input id=\"pinIn\" type=\"password\" inputmode=\"numeric\" maxlength=\"6\" placeholder=\"PIN\"/><button class=\"btn primary\" id=\"pinGo\">Open</button></div>";
    document.getElementById("pinGo").onclick = function () {
      if (document.getElementById("pinIn").value === state.pin) {
        unlocked = true;
        render();
      } else alert("Wrong PIN");
    };
    return;
  }

  const k = kid();
  const list = items();
  const first = list.find((i) => !isDone(i));
  const next = first ? list[list.indexOf(first) + 1] : null;

  root.innerHTML = "";
  root.append(
    el("<div class=\"row\"><h1>KidQuest</h1><div class=\"stars grow\" style=\"text-align:right\">" + k.icon + " " + k.stars + " \u2605</div></div>"),
    el("<p class=\"muted\">" + (state.familyName || "Family") + " family</p>")
  );

  const kidsRow = el("<div class=\"row\" style=\"margin:10px 0\"></div>");
  state.kids.forEach((x) => {
    const b = el("<button class=\"kid-chip " + (x.id === kidId ? "on" : "") + "\">" + x.icon + " " + x.name + "</button>");
    b.onclick = function () {
      kidId = x.id;
      render();
    };
    kidsRow.append(b);
  });
  root.append(kidsRow);

  if (tab !== "family" && first) {
    root.append(
      el(
        "<div class=\"card firstthen\"><div class=\"muted\">FIRST</div><div class=\"task\"><div class=\"icon\">" +
          (first.icon || "\u2B50") +
          "</div><div><b>" +
          (first.time || "") +
          " " +
          first.title +
          "</b><div class=\"muted\">" +
          (first.note || "") +
          "</div></div></div><div class=\"muted\" style=\"margin-top:10px\">THEN</div><div>" +
          (next ? (next.icon || "\u2B50") + " " + next.title : "All done") +
          "</div></div>"
      )
    );
  }

  if (tab === "family") {
    root.append(familyView());
  } else {
    if (!list.length) root.append(el("<div class=\"empty\">No " + tab + " yet.<br>Add one below.</div>"));
    list.forEach((item) => root.append(taskCard(item)));
    root.append(addForm());
  }

  const nav = el("<nav class=\"nav\"></nav>");
  TABS.forEach(function (t) {
    const b = el("<button class=\"" + (tab === t[0] ? "on" : "") + "\">" + t[1] + "<br>" + t[2] + "</button>");
    b.onclick = function () {
      tab = t[0];
      render();
    };
    nav.append(b);
  });
  root.append(nav);
}

function isDone(item) {
  const day = new Date().toISOString().slice(0, 10);
  return !!state.done[kidId + ":" + item.id + ":" + day];
}
function toggleDone(item) {
  const day = new Date().toISOString().slice(0, 10);
  const key = kidId + ":" + item.id + ":" + day;
  const k = kid();
  if (state.done[key]) {
    delete state.done[key];
    k.stars = Math.max(0, (k.stars || 0) - (item.stars || 1));
  } else {
    state.done[key] = true;
    k.stars = (k.stars || 0) + (item.stars || 1);
  }
  save();
  render();
}

function taskCard(item) {
  const done = tab !== "prizes" && isDone(item);
  const c = el(
    "<div class=\"card task " +
      (done ? "done" : "") +
      "\"><div class=\"icon\">" +
      (item.icon || "\u2B50") +
      "</div><div class=\"grow\"><b>" +
      (item.time ? item.time + " \u00B7 " : "") +
      item.title +
      "</b><div class=\"muted\">" +
      (item.note || "") +
      " \u00B7 " +
      (item.stars || 1) +
      "\u2605</div></div><button class=\"btn\">" +
      (tab === "prizes" ? "Redeem" : done ? "Undo" : "Done") +
      "</button></div>"
  );
  c.querySelector("button").onclick = function () {
    if (tab === "prizes") {
      const k = kid();
      const cost = item.stars || 1;
      if ((k.stars || 0) < cost) return alert("Not enough stars");
      k.stars -= cost;
      save();
      render();
      return;
    }
    toggleDone(item);
  };
  c.ondblclick = function () {
    if (confirm("Delete this?")) {
      state.items[tab] = state.items[tab].filter(function (x) {
        return x.id !== item.id;
      });
      save();
      render();
    }
  };
  return c;
}

function addForm() {
  const wrap = el(
    "<div class=\"card\"><b>Add " +
      tab +
      "</b><label>Title</label><input id=\"tTitle\" placeholder=\"Name\"/><label>Emoji</label><input id=\"tIcon\" placeholder=\"\uD83E\uDDF9\" maxlength=\"4\"/><label>Time optional</label><input id=\"tTime\" placeholder=\"07:00\"/><label>Note / goal</label><input id=\"tNote\" placeholder=\"Read 60% of the page\"/><label>Stars</label><input id=\"tStars\" type=\"number\" value=\"1\" min=\"1\"/><button class=\"btn primary\" id=\"tAdd\">Save</button></div>"
  );
  wrap.querySelector("#tAdd").onclick = function () {
    const title = wrap.querySelector("#tTitle").value.trim();
    if (!title) return alert("Add a title");
    state.items[tab].push({
      id: "i" + Date.now(),
      kidId: kidId,
      title: title,
      icon: wrap.querySelector("#tIcon").value.trim() || "\u2B50",
      time: wrap.querySelector("#tTime").value.trim(),
      note: wrap.querySelector("#tNote").value.trim(),
      stars: Math.max(1, +wrap.querySelector("#tStars").value || 1),
    });
    save();
    render();
  };
  return wrap;
}

function familyView() {
  const box = el("<div></div>");
  box.append(
    el(
      "<div class=\"card\"><b>Family</b><p class=\"muted\">People stay here. Missions, Learn, and Prizes start empty.</p><label>Family name</label><input id=\"famName\" value=\"" +
        (state.familyName || "") +
        "\"/><label>Parent PIN optional</label><input id=\"famPin\" value=\"" +
        (state.pin || "") +
        "\" inputmode=\"numeric\" placeholder=\"Leave blank\"/><button class=\"btn primary\" id=\"famSave\">Save family</button></div>"
    )
  );
  state.kids.forEach(function (k) {
    box.append(
      el(
        "<div class=\"card task\"><div class=\"icon\">" +
          k.icon +
          "</div><div class=\"grow\"><b>" +
          k.name +
          "</b><div class=\"muted\">" +
          (k.stars || 0) +
          " stars</div></div></div>"
      )
    );
  });
  const add = el(
    "<div class=\"card\"><b>Add family member</b><input id=\"nName\" placeholder=\"Name\"/><input id=\"nIcon\" placeholder=\"Emoji\" maxlength=\"4\"/><button class=\"btn primary\" id=\"nAdd\">Add</button></div>"
  );
  box.append(add);
  box.querySelector("#famSave").onclick = function () {
    state.familyName = box.querySelector("#famName").value.trim() || "Family";
    state.pin = box.querySelector("#famPin").value.trim();
    save();
    alert("Saved");
  };
  add.querySelector("#nAdd").onclick = function () {
    const name = add.querySelector("#nName").value.trim();
    if (!name) return;
    state.kids.push({
      id: name.toLowerCase().replace(/\s+/g, "-") + Date.now(),
      name: name,
      icon: add.querySelector("#nIcon").value.trim() || "\uD83D\uDE42",
      stars: 0,
    });
    save();
    render();
  };
  return box;
}

render();
