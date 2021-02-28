var socket = io.connect({ transports: ['websocket'] });
let storage = ["textInput"];

let system;
let resources = [];
let resourcesLoaded = 0;
let loaded = resources.length ? 0 : 1;

function start() {
  if (event.keyCode == 13) {
    if (loaded < 2) return;
    document.getElementById('textInput').style.display = 'none';
    document.getElementById('canvas').style.display = 'block';
    for (let item of storage) localStorage[item] = document.getElementById(item).value;
    system = new System(document.getElementById('textInput').value, localStorage.token);
    system.drawObject.resize();
  }
}

let removeElement = (parent, e) => parent.removeChild(document.getElementById(e));

for (let { url, then } of resources) fetch(url).then(res => res.json()).then(json => {
  resourcesLoaded ++;
  then(json);
  if (resourcesLoaded === resources.length) loaded ++;
});

window.onload = () => {
  window.lerp = (a, b, x) => a + x * (b - a);
  removeElement(document.querySelector("center"), "loadingText");
  document.body.style.backgroundImage = "url('https://cdn.glitch.com/cb589383-631b-4d6c-845a-0d18ce5a3ee3%2Fefabd7e3-e9a4-4c2b-ab67-8fa1fa315359.image.png?v=1614524041533')";
  document.body.style.backgroundRepeat = "repeat";
  document.body.style.backgroundSize = "cover";
  loaded ++;
};

function onLoad() {
  document.body.innerHTML += `
  <center>
    <div id="textInputContainer" position="fixed" style="width: 600px;left: calc(50% - 300px)">
      <h1 id="title" class="head">This is the tale of...</h1>
      <input id="textInput" onkeypress="start()" class="text-input" autofocus>
    </div>
  </center>`;
  for (let item of storage)
    if (localStorage[item]) document.getElementById(item).value = localStorage[item];
}

let loadInterval = setInterval(() => {
  if (loaded === 2) onLoad(), clearInterval(loadInterval);
}, 500);