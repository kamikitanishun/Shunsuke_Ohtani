// メニューリンクに点滅アニメーションを加えてから遷移
document.querySelectorAll('.menu a').forEach(link => {
  const targetHref = link.getAttribute('href');

  link.addEventListener('click', function (e) {
    e.preventDefault(); // 通常の遷移を防ぐ
    link.classList.add('blink');

    setTimeout(() => {
      link.classList.remove('blink');
      window.location.href = targetHref; // アニメーション後に遷移
    }, 650); // 点滅が終わる時間に合わせる
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
