/* 程序化 Canvas 贴图库（参数化配色，全站通用） */
(function (LS8) {
  function makeTex(w, h, draw, opts) {
    opts = opts || {};
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.encoding = THREE.sRGBEncoding;
    if (opts.repeat) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    return tex;
  }

  /* 浅木纹桌面 */
  function wood(opts) {
    opts = opts || {};
    return makeTex(512, 512, function (ctx, w, h) {
      ctx.fillStyle = opts.base || "#dcbd8f";
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 90; i++) {
        var y = Math.random() * h;
        ctx.strokeStyle = "rgba(150,105,55," + (0.05 + Math.random() * 0.06) + ")";
        ctx.lineWidth = 1 + Math.random() * 2.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (var x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.5);
        ctx.stroke();
      }
      for (var k = 0; k < 26; k++) {
        ctx.fillStyle = "rgba(170,125,70," + (0.06 + Math.random() * 0.06) + ")";
        ctx.fillRect(Math.random() * w, Math.random() * h, 60 + Math.random() * 120, 2 + Math.random() * 5);
      }
    }, { repeat: [5, 5] });
  }

  /* 切割垫（可配色） */
  function mat(opts) {
    opts = opts || {};
    var a = opts.a || "#22345c", b = opts.b || "#18244a";
    var grid = opts.grid || "rgba(120,150,210,0.16)";
    var grid2 = opts.grid2 || "rgba(130,160,220,0.28)";
    var tick = opts.tick || "rgba(190,205,235,0.4)";
    var title = opts.title || "BENCH MAT · 60 x 40";
    return makeTex(1024, 680, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, a); g.addColorStop(0.5, b); g.addColorStop(1, b);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (var x = 40; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (var y = 40; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = grid2;
      ctx.lineWidth = 1.6;
      for (var x2 = 200; x2 < w; x2 += 200) { ctx.beginPath(); ctx.moveTo(x2, 0); ctx.lineTo(x2, h); ctx.stroke(); }
      for (var y2 = 200; y2 < h; y2 += 200) { ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(w, y2); ctx.stroke(); }
      ctx.fillStyle = tick;
      ctx.font = "13px monospace";
      for (var t = 0; t < w; t += 100) ctx.fillText(String(t / 40 + 10), t + 4, 16);
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = "rgba(190,205,235,0.35)";
      ctx.fillText(title, 24, h - 20);
    });
  }

  /* PCB：基色 + 走线 + 焊盘 + 丝印 */
  function pcb(base, trace, silk, silk2) {
    return makeTex(512, 384, function (ctx, w, h) {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = trace;
      ctx.lineWidth = 2;
      var n = 26, seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < n; i++) {
        ctx.beginPath();
        var x = rnd() * w, y = rnd() * h;
        ctx.moveTo(x, y);
        for (var s = 0; s < 4; s++) {
          if (rnd() > 0.5) x += (rnd() - 0.5) * 140; else y += (rnd() - 0.5) * 100;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      for (var p = 0; p < 90; p++) {
        ctx.beginPath();
        ctx.arc(rnd() * w, rnd() * h, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (silk) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 30px monospace";
        ctx.fillText(silk, 22, 46);
        ctx.font = "15px monospace";
        if (silk2) ctx.fillText(silk2, 22, 70);
      }
    });
  }

  /* 便签纸 */
  function note(bg, ink, lines, rot) {
    return makeTex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, w, 26);
      ctx.save();
      ctx.translate(w / 2 + 6, 58);
      ctx.rotate(rot || -0.05);
      ctx.font = "italic 24px 'Marker Felt', 'Segoe Print', cursive";
      ctx.fillStyle = ink;
      lines.forEach(function (ln, i) { ctx.fillText(ln, -w / 2 + 16, i * 34); });
      ctx.restore();
    });
  }

  /* LED 数码管屏 */
  function led(text) {
    return makeTex(512, 160, function (ctx, w, h) {
      ctx.fillStyle = "#140404";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2a0a08";
      for (var x = 14; x < w - 14; x += 58) ctx.fillRect(x, 20, 50, h - 40);
      if (text) {
        ctx.font = "bold 74px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255,70,50,0.9)";
        ctx.shadowBlur = 22;
        ctx.fillStyle = "#ff4a38";
        ctx.fillText(text, w / 2, h / 2 + 4, w - 30);
      }
    });
  }

  /* 屏幕通用：深色底 + 内容绘制回调（可重复调用刷新同一 canvas） */
  function dynamic(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.encoding = THREE.sRGBEncoding;
    return { canvas: c, ctx: c.getContext("2d"), tex: tex, w: w, h: h };
  }

  /* 天空渐变（可配色） */
  function sky(opts) {
    opts = opts || {};
    var stops = opts.stops || ["#f6d9e8", "#f3e6d8", "#dfe6f2", "#e6e2f0"];
    return makeTex(1024, 512, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, w * 0.4, h);
      g.addColorStop(0, stops[0]); g.addColorStop(0.35, stops[1]);
      g.addColorStop(0.65, stops[2]); g.addColorStop(1, stops[3]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      function blob(x, y, r, c) {
        var rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, c);
        rg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      (opts.blobs || [
        [w * 0.16, h * 0.2, 240, "rgba(244,166,208,0.5)"],
        [w * 0.8, h * 0.3, 260, "rgba(160,190,240,0.45)"],
        [w * 0.5, h * 0.14, 200, "rgba(230,200,240,0.4)"]
      ]).forEach(function (b) { blob(b[0], b[1], b[2], b[3]); });
    });
  }

  LS8.Textures = { makeTex: makeTex, wood: wood, mat: mat, pcb: pcb, note: note, led: led, dynamic: dynamic, sky: sky };
})(window.LS8 = window.LS8 || {});
