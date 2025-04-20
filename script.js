fetch("ranking.json?v=" + new Date().getTime())
  .then((response) => response.json())
  .then((data) => {
    console.log(data); // データ構造をコンソールで確認
    const ticker = document.getElementById("ticker");
    if (!ticker) {
      console.error("ticker が見つかりません");
      return;
    }

    // ランキングデータがあるか確認
    if (data && data.length > 0) {
      const items = data.map(item => {
        return `<a href="${item.url}" target="_blank">${item.rank}位: ${item.title}</a>`;
      });

      ticker.innerHTML = items.join(" ／ ");
    } else {
      ticker.innerHTML = "ランキングデータがありません";
    }
  })
  .catch((error) => {
    console.error("ランキング取得失敗:", error);
  });
