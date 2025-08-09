// visualizer.js — Reaction-Diffusion（状態引き継ぎ＆即時復元／ノーフェード）
(() => {
  'use strict';
  if (window.__RD_VIZ_PERSIST_NOFADE__) return;
  window.__RD_VIZ_PERSIST_NOFADE__ = true;

  // ===== 調整パラメータ =====
  const TARGET_CELL_SIZE_CSS = 12;
  const MAX_DPR = 2;
  const STEP_FPS = 12;        // スローのまま
  const SIM_STEPS = 2;
  const TRAIL_FADE = 0.055;
  const BLUR_PX = 2.2;
  const CRISP_ALPHA = 0.22;
  const BASE_ALPHA = 0.31;

  // 色（#005E7C）
  const COL_R = 0, COL_G = 94, COL_B = 124;

  // Gray–Scott
  const DA = 1.0, DB = 0.5;
  const FEED = 0.034, KILL = 0.060;

  // 状態保存キー
  const STATE_KEY = 'rdviz_state_v2';     // ← v2 に更新（互換切替）
  const STATE_MAX_AGE_MS = 5 * 60 * 1000; // 5分
  const RESET = /(?:\?|&)reset=1(?:&|$)/.test(location.search);

  // ========= Canvas =========
  const CANVAS_ID = 'viz-overlay';
  let canvas = document.getElementById(CANVAS_ID);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = CANVAS_ID;
    document.body.prepend(canvas);
  }
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '0',
    pointerEvents: 'none',
    background: 'transparent',
    display: 'block',
    // ★ フェードイン/トランジション抑止
    transition: 'none',
    animation: 'none',
    opacity: '1'
  });
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  ctx.imageSmoothingEnabled = false;

  // 低解像テクスチャ（後で拡大）
  const tex = document.createElement('canvas');
  const ttx = tex.getContext('2d', { alpha: true });
  ttx.imageSmoothingEnabled = false;

  // ========= Grid / Fields =========
  let dpr, W, H, COLS, ROWS, N;
  let A, B, A2, B2, noise, noisePhase = 0;
  let img, imgData;

  // ====== Base64 ユーティリティ（Float32Array <-> base64） ======
  const f32ToB64 = f32 => {
    const u8 = new Uint8Array(f32.buffer); let s = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < u8.length; i += CHUNK) s += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
    return btoa(s);
  };
  const b64ToF32 = b64 => {
    const bin = atob(b64); const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Float32Array(u8.buffer);
  };

  // ====== 状態保存/復元（＋スナップショット） ======
  function saveState() {
    try {
      if (!A || !B || !noise) return;
      const snap = tex.toDataURL('image/webp', 0.6); // 小さく軽い
      const payload = {
        t: Date.now(),
        cols: COLS, rows: ROWS, noisePhase,
        A: f32ToB64(A), B: f32ToB64(B), noise: f32ToB64(noise),
        snap // ← 即時復元用
      };
      sessionStorage.setItem(STATE_KEY, JSON.stringify(payload));
    } catch (_) { /* 容量超などは無視 */ }
  }
  function clearState(){ try{ sessionStorage.removeItem(STATE_KEY);}catch(_){} }

  let restoredSnap = null;
  function tryRestore() {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (!obj || (Date.now() - obj.t) > STATE_MAX_AGE_MS) return false;
      if (obj.cols !== COLS || obj.rows !== ROWS) return false;

      const Ar = b64ToF32(obj.A), Br = b64ToF32(obj.B), Nr = b64ToF32(obj.noise);
      if (Ar.length !== N || Br.length !== N || Nr.length !== N) return false;

      A.set(Ar); B.set(Br); noise.set(Nr);
      noisePhase = +obj.noisePhase || 0;
      restoredSnap = obj.snap || null;
      return true;
    } catch (_) { return false; }
  }

  // ========= 初期化 =========
  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    W = Math.max(1, Math.floor(window.innerWidth * dpr));
    H = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.width = W; canvas.height = H;

    const cellPx = Math.max(6, Math.min(18, Math.round(TARGET_CELL_SIZE_CSS * dpr)));
    COLS = Math.max(20, Math.floor(W / cellPx));
    ROWS = Math.max(12, Math.floor(H / cellPx));
    N = COLS * ROWS;

    tex.width = COLS; tex.height = ROWS;
    A = new Float32Array(N); B = new Float32Array(N);
    A2 = new Float32Array(N); B2 = new Float32Array(N);
    noise = new Float32Array(N);
    img = ttx.createImageData(COLS, ROWS);
    imgData = img.data;

    let restored = false;
    if (!RESET) restored = tryRestore();
    if (!restored) {
      for (let i = 0; i < N; i++) { A[i] = 1.0; B[i] = 0.0; noise[i] = (Math.random()*2 - 1); }
      seedSpots(Math.floor(N * 0.004));
      restoredSnap = null;
      clearState();
      noisePhase = 0;
    }

    // ★ 即時復元：配列 or スナップショットから“その場で”描く
    instantFirstPaint(restored);
  }
  window.addEventListener('resize', fit, { passive: true });

  function seedSpots(count) {
    for (let k = 0; k < count; k++) {
      const cx = (Math.random() * COLS) | 0;
      const cy = (Math.random() * ROWS) | 0;
      const r  = 2 + (Math.random() * 4) | 0;
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const xx = (cx + x + COLS) % COLS;
        const yy = (cy + y + ROWS) % ROWS;
        if (x*x + y*y <= r*r) B[yy * COLS + xx] = 1.0;
      }
    }
  }

  // 9点ラプラシアン
  function lap(F, x, y) {
    const xm = (x - 1 + COLS) % COLS, xp = (x + 1) % COLS;
    const ym = (y - 1 + ROWS) % ROWS, yp = (y + 1) % ROWS;
    const i  = y * COLS + x;
    return (
      -1.0 * F[i] +
      0.2 * (F[y*COLS + xm] + F[y*COLS + xp] + F[ym*COLS + x] + F[yp*COLS + x]) +
      0.05 * (F[ym*COLS + xm] + F[ym*COLS + xp] + F[yp*COLS + xm] + F[yp*COLS + xp])
    );
  }

  function simStep(dt, t) {
    const fPhase = 0.25 * Math.sin(t * 0.25) + 0.5 * Math.cos(t * 0.15);
    const fAmp = 0.003;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;
        const a = A[i], b = B[i];
        const lapA = lap(A, x, y);
        const lapB = lap(B, x, y);
        const fLoc = FEED + fAmp * (noise[i] * Math.sin(noisePhase + i * 0.0007) + fPhase);

        const react = a * b * b;
        let a2 = a + (DA * lapA - react + fLoc * (1 - a)) * dt;
        let b2 = b + (DB * lapB + react - (KILL + fLoc) * b) * dt;

        if (a2 < 0) a2 = 0; else if (a2 > 1) a2 = 1;
        if (b2 < 0) b2 = 0; else if (b2 > 1) b2 = 1;

        A2[i] = a2; B2[i] = b2;
      }
    }
    // スワップ
    let tmp = A; A = A2; A2 = tmp;
    tmp = B; B = B2; B2 = tmp;

    if (Math.random() < 0.02) seedSpots(1);
    noisePhase += 0.015 * dt;
  }

  // ===== 即時初描画（ここで“ノーフェード”を実現） =====
  let suppressFadeFrames = 8; // 初回は残像フェードを抑える
  function paintTexFromFields() {
    for (let i = 0, p = 0; i < N; i++, p += 4) {
      const v = B[i];
      let a = (v - 0.20) * 1.6;
      if (a < 0) a = 0; if (a > 1) a = 1;
      a *= BASE_ALPHA;
      imgData[p  ] = COL_R;
      imgData[p+1] = COL_G;
      imgData[p+2] = COL_B;
      imgData[p+3] = (a * 255) | 0;
    }
    ttx.putImageData(img, 0, 0);
  }
  function drawTexToScreen() {
    // ぼかし → 薄い芯
    ctx.save(); ctx.filter = `blur(${BLUR_PX}px)`; ctx.drawImage(tex, 0, 0, W, H); ctx.restore();
    if (CRISP_ALPHA > 0) { ctx.save(); ctx.globalAlpha = CRISP_ALPHA; ctx.drawImage(tex, 0, 0, W, H); ctx.restore(); }
  }
  function instantFirstPaint(restoredArrays) {
    // （1）配列を復元できたときは即時レンダリング
    if (restoredArrays) {
      paintTexFromFields();
      drawTexToScreen();
      return;
    }
    // （2）スナップショットがあれば即描画
    if (restoredSnap) {
      const imgEl = new Image();
      imgEl.onload = () => {
        ttx.clearRect(0,0,tex.width,tex.height);
        ttx.drawImage(imgEl, 0, 0, tex.width, tex.height);
        drawTexToScreen();
      };
      imgEl.src = restoredSnap;
    }
  }

  // ===== 描画フレーム =====
  function drawFrame() {
    // 初期の数フレームはフェードしない（チラつき防止）
    if (suppressFadeFrames <= 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${TRAIL_FADE})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else {
      suppressFadeFrames--;
    }

    // Bからテクスチャ更新 → 画面へ
    paintTexFromFields();
    drawTexToScreen();
  }

  // ========= ループ =========
  let last = 0, acc = 0, dtDraw = 1 / STEP_FPS;
  function frame(ts) {
    if (!last) last = ts;
    let delta = (ts - last) / 1000;
    if (delta > 0.25) delta = 0.25;
    acc += delta;

    const tsec = ts / 1000;
    for (let s = 0; s < SIM_STEPS; s++) simStep(1.0, tsec);

    if (acc >= dtDraw) { drawFrame(); acc = 0; }
    last = ts;
    requestAnimationFrame(frame);
  }

  // ========= 起動 & 保存 =========
  fit();
  requestAnimationFrame(frame);
  window.addEventListener('pagehide', saveState);
  window.addEventListener('beforeunload', saveState);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveState();
  });
  if (RESET) clearState();
})();
