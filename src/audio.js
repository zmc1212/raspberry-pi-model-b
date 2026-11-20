/* WebAudio 合成音效（零素材）。默认开启：页面加载即尝试出声（浏览器自动播放策略可能
   拦截未交互页面，被拦截时首次点击/按键/触摸页面立即恢复），右上角按钮可开关。 */
(function (NS) {
  if (!NS || NS.Audio) return;
  var ctx = null, master = null, enabled = true, btn = null;

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    ctx.onstatechange = refresh; // 自动播放被放行/拦截时同步按钮提示
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0;
    master.connect(ctx.destination);
    return true;
  }

  function refresh() {
    if (btn) {
      btn.textContent = enabled ? "🔊" : "🔇";
      if (btn.classList) btn.classList.toggle("audio-wait", enabled && (!ctx || ctx.state === "suspended"));
    }
    if (master) master.gain.value = enabled ? 0.5 : 0;
  }

  function resume() {
    if (!ensure()) return;
    if (ctx.state === "suspended" && ctx.resume) {
      var p = ctx.resume();
      if (p && p.catch) p.catch(function () {});
    }
    refresh();
  }

  function unlock() { resume(); }

  function toggle() {
    enabled = !enabled;
    if (enabled) resume();
    refresh();
  }

  function tone(freq, dur, type, vol, slideTo, when) {
    if (!ctx) return;
    var t0 = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, freq) {
    if (!ctx) return;
    var t0 = ctx.currentTime;
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq || 1500;
    var g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
  }

  var SFX = {
    land: function () { tone(150 + Math.random() * 90, 0.05, "square", 0.10); noise(0.04, 0.06, 2000); },
    insert: function () { tone(120, 0.09, "square", 0.14); noise(0.06, 0.09, 1200); },
    power: function () { tone(60, 1.0, "sawtooth", 0.10, 130); noise(0.6, 0.03, 500); },
    beep: function () { tone(880, 0.16, "square", 0.12); },
    chirp: function () { for (var i = 0; i < 6; i++) tone(i % 2 ? 980 : 770, 0.1, "sine", 0.07, 0, i * 0.11); },
    chime: function () { tone(660, 0.14, "sine", 0.12); tone(990, 0.22, "sine", 0.12, 0, 0.12); },
    type: function () { tone(1600 + Math.random() * 500, 0.02, "square", 0.04); },
    note: function (freq, dur, wave) { tone(freq, dur || 0.35, wave || "square", 0.15); }
  };

  function play(name, a, b, c) {
    if (!enabled || !ctx || ctx.state !== "running" || !SFX[name]) return;
    try { SFX[name](a, b, c); } catch (e) { /* 音频失败不影响页面 */ }
  }

  function init() {
    var stl = document.createElement("style");
    stl.textContent = ".audio-toggle{position:absolute;top:168px;right:28px;z-index:8;width:34px;height:34px;border-radius:50%;border:1px solid rgba(35,40,48,.3);background:rgba(251,248,238,.92);font-size:15px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(30,24,8,.2)}"
      + ".audio-toggle.audio-wait::after{content:\"点击页面任意处开启声音\";position:absolute;top:50%;right:44px;transform:translateY(-50%);white-space:nowrap;font-size:11px;color:#6E5A32;background:rgba(251,248,238,.92);border:1px solid rgba(35,40,48,.25);border-radius:4px;padding:3px 8px;pointer-events:none}";
    document.head.appendChild(stl);
    btn = document.createElement("button");
    btn.className = "audio-toggle";
    btn.textContent = "🔊";
    btn.title = "声音开关（默认开启；浏览器拦截自动播放时，点击页面任意处即生效）";
    btn.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
    var sheet = document.getElementById("sheet");
    if (sheet) sheet.appendChild(btn);
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });
    resume(); // 页面加载即尝试启动声音：浏览器放行则立刻有声，拦截则首次交互自动恢复
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  NS.Audio = { play: play, note: play };
})(window.LS8 || window.C64B);
