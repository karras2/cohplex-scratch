var socket = io.connect({transports: ['websocket']});
let storage = ["textInput", "token"];
for (let item of storage) if (localStorage[item]) document.getElementById(item).value = localStorage[item];

let system;
function start() {
    if (event.keyCode == 13) {
        document.getElementById('textInput').style.display = 'none';
        document.getElementById('token').style.display = 'none';
        document.getElementById('canvas').style.display = 'block';
        for (let item of storage) localStorage[item] = document.getElementById(item).value;
        system = new System(document.getElementById('textInput').value, document.getElementById('token').value);
        system.drawObject.resize();
    }
}
