import {
    get,
    set,
} from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm";

let player = document.getElementById("player");
let canvas = document.getElementById("cnvFood");
let beforeSnap = document.getElementById("beforeSnap");
let afterSnap = document.getElementById("afterSnap");
let snapName = document.getElementById("snapName");
let btnStart = document.getElementById("btnStart");
let btnStop = document.getElementById("btnStop");
let blobVideo;
let start = false;
let stop = false;
let recorder = null;
let startCapture = function () {                
    beforeSnap.classList.remove("d-none");
    beforeSnap.classList.add("d-flex", "flex-column", "align-items-center");
    btnStop.disabled = true;
    btnStart.disabled = false;
    afterSnap.classList.remove("d-flex", "flex-column", "align-items-center");
    afterSnap.classList.add("d-none");
    if (!("mediaDevices" in navigator)) {
        // fallback to file upload button, ili sl.
        // vidjet i custom API-je: webkitGetUserMedia i mozGetUserMedia
    } else {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => { 
                player.srcObject = stream;              
                recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});
                let chunks = [];
                console.log(recorder);
                recorder.ondataavailable = function(event) {
                    console.log(event.data);
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    };
                    if (stop == true) {
                        recorder.stop();
                    }
                };
                recorder.onstart = function() {
                    console.log("start");
                }
                recorder.onstop = function() {
                    blobVideo = new Blob(chunks, {type: 'video/mp4'});
                    stopCapture();
                };
            })
            .catch((err) => {
                alert("Media stream not working");
                console.log(err);
            });
    }
};

startCapture();

let startRecording = function () {
}

let stopCapture = function () {
    afterSnap.classList.remove("d-none");
    afterSnap.classList.add("d-flex", "flex-column", "align-items-center");
    beforeSnap.classList.remove("d-flex", "flex-column", "align-items-center");
    beforeSnap.classList.add("d-none");
    player.srcObject.getVideoTracks().forEach(function (track) {
        track.stop();
    });
};

document
    .getElementById("btnUpload")
    .addEventListener("click", function (event) {
        event.preventDefault();
        if (!snapName.value.trim()) {
            alert("Give it a cathcy name!");
            return false;
        }
        if ("serviceWorker" in navigator && "SyncManager" in window) {
            let url = canvas.toDataURL();
            fetch(url)
                .then((res) => res.blob())
                .then((blob) => {
                    let ts = new Date().toISOString();
                    let id = ts + snapName.value.replace(/\s/g, "_"); // ws->_
                    set(id, {
                        id,
                        ts,
                        title: snapName.value,
                        video: blobVideo,
                    });
                    return navigator.serviceWorker.ready;
                })
                .then((swRegistration) => {
                    return swRegistration.sync.register("sync-snaps");
                })
                .then(() => {
                    console.log("Queued for sync");
                    startCapture();
                })
                .catch((error) => {
                    alert(error);
                    console.log(error);
                });
        } else {
            // fallback
            // pokusati poslati, pa ako ima mreze onda dobro...
            alert("TODO - vaš preglednik ne podržava bckg sync...");
        }
    });

document.getElementById("btnStop").addEventListener("click", function(event) {
    stop = true;
    event.preventDefault();
    canvas.width = player.getBoundingClientRect().width;
    canvas.height = player.getBoundingClientRect().height;
    canvas
        .getContext("2d")
        .drawImage(player, 0, 0, canvas.width, canvas.height);
});

document.getElementById("btnStart").addEventListener("click", function(event) {
    btnStop.disabled = false;
    btnStart.disabled = true;
    recorder.start(1000);
})
