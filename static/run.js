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

window.onload = () => {
  document.getElementById("title").textContent = "diep.io";
  loaded = true;
  document.body.style.backgroundImage = "url('https://cdn.glitch.com/cb589383-631b-4d6c-845a-0d18ce5a3ee3%2Fefabd7e3-e9a4-4c2b-ab67-8fa1fa315359.image.png?v=1614524041533')";
  //document.body.style.backgroundPosition = "center";
  document.body.style.backgroundRepeat = "repeat";
  document.body.style.backgroundSize = "cover";
};