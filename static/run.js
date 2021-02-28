var socket = io.connect({ transports: ['websocket'] });
let storage = ["textInput", "token"];
for (let item of storage)
  if (localStorage[item]) document.getElementById(item).value = localStorage[item];

let system;
let resources = [];
let resourcesLoaded = 0;
let loaded = resources.length ? 0 : 1;

function start() {
  if (event.keyCode == 13) {
    if (loaded < 2) return;
    document.getElementById('textInput').style.display = 'none';
    document.getElementById('token').style.display = 'none';
    document.getElementById('canvas').style.display = 'block';
    for (let item of storage) localStorage[item] = document.getElementById(item).value;
    system = new System(document.getElementById('textInput').value, document.getElementById('token').value);
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
  let lerp = (a, b, x) => a + x * (b - a);
  removeElement(document.querySelector("center"), "loadingText");
  var animation=0;
  function getWidth() {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
}

function getHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );
}
  function Loop(){
    
    animation=lerp(animation,Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  )/2.25,0.05);
    document.getElementById("textInputContainer").style.top=animation+"px" 
    window.requestAnimationFrame(Loop);
  };
  Loop();
  document.getElementById("textInputContainer").display = "block"
  document.body.style.backgroundImage = "url('https://cdn.glitch.com/cb589383-631b-4d6c-845a-0d18ce5a3ee3%2Fefabd7e3-e9a4-4c2b-ab67-8fa1fa315359.image.png?v=1614524041533')";
  document.body.style.backgroundRepeat = "repeat";
  document.body.style.backgroundSize = "cover";
  loaded ++;
};