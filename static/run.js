var socket = io.connect({ transports: ['websocket'] });
let storage = ["textInput"];

let system;
let resources = [{
  url: `https://${window.location.hostname}/data`,
  then: console.log,
  crucial: true,
  script: "Something"
}];
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

for (let { url, then, crucial, script } of resources) fetch(url).then(res => res.json()).then(json => {
  resourcesLoaded ++;
  then(json);
  if (resourcesLoaded === resources.length) loaded ++;
}).catch(error => {
  if (crucial) return crucialError([script, error]);
  console.log("Error loading script", script, ". Not crucial, but if you are seeing this it would help if you reported it...");
});

window.onload = () => {
  if (loaded < 0) return;
  window.lerp = (a, b, x) => a + x * (b - a);
  loaded ++;
};

function onLoad() {
  removeElement(document.querySelector("center"), "loadingText");
  document.body.style.backgroundImage = "url('https://cdn.glitch.com/cb589383-631b-4d6c-845a-0d18ce5a3ee3%2Fefabd7e3-e9a4-4c2b-ab67-8fa1fa315359.image.png?v=1614524041533')";
  document.body.style.backgroundRepeat = "repeat";
  document.body.style.backgroundSize = "cover";
  document.body.innerHTML += `
  <center>
    <div id="textInputContainer" position="fixed" style="width: 600px;left: calc(50%)">
      <h1 id="title" class="head">This is the tale of...</h1>
      <input id="textInput" onkeypress="start()" class="text-input" autofocus>
    </div>
  </center>`;
  for (let item of storage)
    if (localStorage[item]) document.getElementById(item).value = localStorage[item];
}

function crucialError(e) {
  document.getElementById("loadingText").textContent = "Error, please check logs and report it in the discord server!";
  console.log("Unable to load a crucial script. Script name:", e[0], "Error:", e[1]);
  loaded -= 10;
}

let loadInterval = setInterval(() => {
  if (loaded === 2) onLoad(), clearInterval(loadInterval);
}, 500);