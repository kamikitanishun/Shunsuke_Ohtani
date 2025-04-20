document.addEventListener("DOMContentLoaded", () => {
  fetch('ranking.json')
    .then(res => res.json())
    .then(data => {
      const ticker = document.getElementById("ticker");
      if (!ticker) {
        console.error("ticker 要素が見つかりません");
        return;
      }

      // HTMLをリンク付きで生成
      ticker.innerHTML = data
        .map(item => `<a href="${item.link}" target="_blank">${item.title}</a>`)
        .join(" ／ ");
    })
    .catch(err => {
      console.error("ランキング取得失敗:", err);
    });
});
