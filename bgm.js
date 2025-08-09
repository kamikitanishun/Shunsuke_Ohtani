// bgm.js — サイト全体BGM（同意ダイアログ：サイトと同じフォント/中央揃え）
(() => {
  'use strict';

  const CONSENT_KEY = 'BGM_CONSENT_V1';
  const TIME_KEY    = 'BGM_TIME_V1';
  const SRC         = 'Frost.mp3';
  const VOLUME      = 1.0;
  const SAVE_EVERY_MS = 1500;

  // ===== オーディオ =====
  let audio = document.getElementById('site-bgm');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'site-bgm';
    audio.src = SRC;
    audio.loop = true;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.style.display = 'none';
    audio.volume = VOLUME;
    document.body.appendChild(audio);
  }

  // ===== 位置保存/復元 =====
  function saveTimeNow() {
    try {
      sessionStorage.setItem(TIME_KEY, JSON.stringify({ t: audio.currentTime || 0, ts: Date.now() }));
    } catch (_) {}
  }
  function restoreTimeWhenReady() {
    try {
      const raw = sessionStorage.getItem(TIME_KEY);
      if (!raw) return;
      const { t, ts } = JSON.parse(raw) || {};
      if (typeof t !== 'number' || typeof ts !== 'number') return;

      const apply = () => {
        const dur = audio.duration;
        if (!isFinite(dur) || dur <= 0) return;
        const elapsed = Math.max(0, (Date.now() - ts) / 1000);
        let target = (t + elapsed) % dur;
        if (target < 0.05) target = 0.05;
        try { audio.currentTime = target; } catch(_) {}
      };
      if (isFinite(audio.duration) && audio.duration > 0) apply();
      else audio.addEventListener('loadedmetadata', apply, { once: true });
    } catch (_) {}
  }

  function tryPlayWithFallback() {
    const tryPlay = () =>
      audio.play().catch(() => {
        const resume = () => {
          audio.play().finally(() => {
            window.removeEventListener('pointerdown', resume);
            window.removeEventListener('keydown', resume);
            window.removeEventListener('touchend', resume);
          });
        };
        window.addEventListener('pointerdown', resume, { once: true, passive: true });
        window.addEventListener('keydown',     resume, { once: true });
        window.addEventListener('touchend',    resume, { once: true, passive: true });
      });
    tryPlay();
  }

  // ===== 同意ダイアログ（中央・サイトのフォントを継承） =====
  function showConsent() {
    const style = document.createElement('style');
    style.textContent = `
      .bgm-consent__backdrop {
        position: fixed; inset: 0; z-index: 9999;
        display: grid; place-items: center;
        background: rgba(0,0,0,.55);
        backdrop-filter: blur(2px);
      }
      .bgm-consent__panel {
        /* サイト設定を継承 */
        font: inherit; font-family: inherit; letter-spacing: inherit; line-height: inherit;
        color: inherit; text-align: center;

        background: rgba(17,17,17,.92);
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 14px;
        width: min(92vw, 440px);
        padding: 22px 24px;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
      }
      .bgm-consent__title {
        margin: 0 0 12px; font-weight: 600; font-size: clamp(16px, 2.2vw, 18px);
      }
      .bgm-consent__text {
        margin: 0 0 18px; opacity: .9; font-size: clamp(13px, 2vw, 14px);
      }
      .bgm-consent__actions { display: flex; justify-content: center; }
      .bgm-consent__btn {
        appearance: none; cursor: pointer;
        font: inherit; font-weight: 600; letter-spacing: inherit;
        color: inherit; background: transparent;
        border: 1px solid currentColor; border-radius: 10px;
        padding: 10px 22px; min-width: 120px;
      }
      .bgm-consent__btn:hover { background: currentColor; color: #000; }
      .bgm-consent__btn:active { transform: translateY(1px); }

      @media (prefers-color-scheme: light) {
        .bgm-consent__panel { background: rgba(255,255,255,.98); border-color: rgba(0,0,0,.12); }
        .bgm-consent__btn:hover { color: #fff; background: #111; }
      }
    `;
    document.head.appendChild(style);

    const backdrop = document.createElement('div');
    backdrop.className = 'bgm-consent__backdrop';
    backdrop.innerHTML = `
      <div class="bgm-consent__panel" role="dialog" aria-modal="true" aria-labelledby="bgm-consent-title">
        <h2 class="bgm-consent__title" id="bgm-consent-title">このページでは音楽が流れます</h2>
        <p class="bgm-consent__text">スピーカー/音量にご注意ください。OKを押すとBGMが再生されます。</p>
        <div class="bgm-consent__actions">
          <button class="bgm-consent__btn" id="bgm-ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const ok = document.getElementById('bgm-ok');
    ok.addEventListener('click', () => {
      try { localStorage.setItem(CONSENT_KEY, '1'); } catch(_){}
      backdrop.remove();
      restoreTimeWhenReady();
      tryPlayWithFallback();
    }, { once: true });
  }

  // ===== 初期化 =====
  restoreTimeWhenReady();

  let consent = false;
  try { consent = localStorage.getItem(CONSENT_KEY) === '1'; } catch(_){}

  if (consent) {
    tryPlayWithFallback();
  } else {
    showConsent();
  }

  // 保存フック
  const save = () => saveTimeNow();
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);

  let timer = null;
  audio.addEventListener('play', () => {
    if (timer) clearInterval(timer);
    timer = setInterval(saveTimeNow, SAVE_EVERY_MS);
  });
  audio.addEventListener('pause', () => { if (timer) { clearInterval(timer); timer = null; } });
})();
