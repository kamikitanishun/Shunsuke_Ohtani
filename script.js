// ランキングを取得して表示
fetch("ranking.json")
  .then(response => response.json())
  .then(data => {
    const ticker = document.getElementById("ticker");
    if (!ticker) throw new Error("ticker element not found");

    ticker.innerHTML = data.map(item => {
      return `<a href="${item.url}" target="_blank">${item.rank}位: ${item.title}</a>`;
    }).join(" / ");
  })
  .catch(error => {
    console.error("ランキング取得失敗:", error);
  });

// メニューリンクに点滅アニメーションを加えてから遷移
document.querySelectorAll('.menu a').forEach(link => {
  const targetHref = link.getAttribute('href');

  link.addEventListener('click', function (e) {
    e.preventDefault(); // 通常の遷移を防ぐ
    link.classList.add('blink');

    setTimeout(() => {
      link.classList.remove('blink');
      window.location.href = targetHref; // アニメーション後に遷移
    }, 1200); // 点滅が終わる時間に合わせる
  });
});
