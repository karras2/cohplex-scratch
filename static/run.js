var socket = io.connect({
  transports: ['websocket']
});
let storage = ["textInput", "token"];
for (let item of storage)
  if (localStorage[item]) document.getElementById(item).value = localStorage[item];

let system;
let loaded = false;

function start() {
  if (event.keyCode == 13) {
    if (!loaded) return;
    document.getElementById('textInput').style.display = 'none';
    document.getElementById('token').style.display = 'none';
    document.getElementById('canvas').style.display = 'block';
    for (let item of storage) localStorage[item] = document.getElementById(item).value;
    system = new System(document.getElementById('textInput').value, document.getElementById('token').value);
    system.drawObject.resize();
  }
}

let removeElement = (parent, e) => parent.removeChild(document.getElementById(e));

window.onload = () => {
  let lerp = (a, b, x) => a + x * (b - a);
  removeElement(document.querySelector("center"), "loadingText");
  let html = `<div id="textInputContainer" class="text-input-div">
    <center><h1 id="title" class="head">This is the tale of...</h1></center>
    <input id="textInput" onkeypress="start()" class="text-input" placeholder="This is the tale of..." autofocus>
    <input id="token" class="token-input" type="password" placeholder="Put a developer token here...">
  </div>`;
  document.body.innerHTML += html;
  loaded = true;
  document.body.style.backgroundImage = "url('https://cdn.glitch.com/cb589383-631b-4d6c-845a-0d18ce5a3ee3%2Fefabd7e3-e9a4-4c2b-ab67-8fa1fa315359.image.png?v=1614524041533')";
  document.body.style.backgroundRepeat = "repeat";
  document.body.style.backgroundSize = "cover";
};