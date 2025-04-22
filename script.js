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

document.addEventListener("DOMContentLoaded", () => {
  const aboutLink = document.querySelector('a[href="#about"]');
  const aboutSection = document.querySelector("#about");

  if (aboutLink && aboutSection) {
    aboutLink.addEventListener("click", (e) => {
      e.preventDefault();
      aboutSection.classList.toggle("hidden");
    });
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const ticker = document.getElementById("ticker");

  // 現在の時間を取得してstartTimeとして保存（存在しない場合のみ）
  if (!sessionStorage.getItem("tickerStart")) {
    sessionStorage.setItem("tickerStart", Date.now());
  }

  const startTime = parseInt(sessionStorage.getItem("tickerStart"), 10);
  const now = Date.now();
  const elapsed = now - startTime;

  // アニメーションの全体長さ（ミリ秒）※ CSS の animation-duration と合わせる
  const duration = 50000; // 50秒

  // 現在の経過率
  const progress = (elapsed % duration) / duration;

  // CSSアニメーションを途中から開始するように設定
  ticker.style.animation = `scroll ${duration}ms linear infinite`;
  ticker.style.animationDelay = `-${progress * duration}ms`;
});


