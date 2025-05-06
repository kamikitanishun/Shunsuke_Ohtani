const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 音楽と同期する処理
const audio = new Audio("frost.mp3");
audio.crossOrigin = "anonymous"; // 同じドメインなら不要
audio.loop = true;
audio.play();

const context = new (window.AudioContext || window.webkitAudioContext)();
const src = context.createMediaElementSource(audio);
const analyser = context.createAnalyser();

src.connect(analyser);
analyser.connect(context.destination);
analyser.fftSize = 512;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

const barCount = 157;
const barWidth = 1;
const barSpacing = 4.6;

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";

  const centerY = canvas.height / 2;
  const halfCount = barCount / 2;
  const maxOffset = canvas.width * 0.5;

  for (let i = 0; i < halfCount; i++) {
    const height = (dataArray[i] / 255) * canvas.height * 0.5;
    const ratio = i / halfCount;
    const offset = ratio * maxOffset;

    // 左側
    ctx.fillRect(
      canvas.width / 2 - offset,
      centerY - height / 2,
      barWidth,
      height
    );

    // 右側
    ctx.fillRect(
      canvas.width / 2 + offset,
      centerY - height / 2,
      barWidth,
      height
    );
  }
}

draw();
