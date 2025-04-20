fetch('ranking.json')
  .then(res => res.json())
  .then(data => {
    const ticker = document.getElementById("ticker");
    ticker.textContent = data.join(" ／ ");
  })
  .catch(err => {
    console.error("ランキング取得失敗:", err);
  });
