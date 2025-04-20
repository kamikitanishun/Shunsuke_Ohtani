fetch("ranking.json")
  .then((response) => response.json())
  .then((data) => {
    const ticker = document.getElementById("ticker");
    if (!ticker) {
      console.error("ticker が見つかりません");
      return;
    }

    const items = data.map(item => {
      return `<a href="${item.url}" target="_blank">${item.rank}位: ${item.title}</a>`;
    });

    ticker.innerHTML = items.join(" ／ ");
  })
  .catch((error) => {
    console.error("ランキング取得失敗:", error);
  });
