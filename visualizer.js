const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const barCount = 157; // 増やして密度もアップ
const barWidth = 1;
const barSpacing = 4.6;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)"; // より薄め

  const centerY = canvas.height / 2;
  const halfCount = barCount / 2;

  // 最大オフセットを画面幅の半分に拡大（左右端まで）
  const maxOffset = canvas.width * 0.5;

  for (let i = 0; i < halfCount; i++) {
    const height = Math.random() * canvas.height * 0.5;

    // 割合でバーの位置を決定（均等に広がる）
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

  requestAnimationFrame(draw);
}

draw();
