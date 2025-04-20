fetch("ranking.json")
  .then((res) => res.json())
  .then((data) => {
    const rankingText = data.join(" / ");
    document.getElementById("ranking-text").textContent = rankingText;
  })
  .catch((err) => {
    console.error("ランキング取得失敗:", err);
    document.getElementById("ranking-text").textContent = "ランキング取得に失敗しました";
  });
