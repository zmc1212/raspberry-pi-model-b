/* 仪表盘：启动终端 · GPIO · SoC · 网络 */
(function (LS8) {
  var ctxTerm;
  var tw, th;
  var dom = {};
  var termLines = [];

  function mkCanvas(id, h) {
    var c = document.getElementById(id);
    var w = c.clientWidth || 200;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = w * dpr; c.height = h * dpr;
    c.style.height = h + "px";
    var ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h };
  }

  function buildDOM() {
    document.getElementById("dash").innerHTML =
      '<section class="panel"><header><i class="dot" style="background:#3ddc6f"></i><b>启动终端</b><span class="meta">CONSOLE · TTY1 · 80x24</span></header>' +
      '<div class="body"><canvas id="c-term"></canvas></div></section>' +

      '<section class="panel"><header><i class="dot" style="background:#e8c53c"></i><b>GPIO 排针</b><span class="meta">26 PIN · REV 2 · 3.3V LOGIC</span></header>' +
      '<div class="body"><div style="display:grid;grid-template-columns:repeat(13,1fr);gap:3px" id="gpio-grid"></div>' +
      '<div class="axis"><span>1 — 13</span><span>14 — 26</span></div>' +
      '<div class="axis"><span id="gpio-note">高阻态 HI-Z</span><span id="gpio-act">0 个活动引脚</span></div></div></section>' +

      '<section class="panel"><header><i class="dot orange" style="background:#f2a53a"></i><b>SoC 核心</b><span class="meta">BCM2835 · ARM11 · VideoCore IV</span></header>' +
      '<div class="body"><svg viewBox="0 0 84 66" style="width:64px;height:50px;display:block;float:left">' +
      '<path d="M10 52 A26 26 0 0 1 74 52" fill="none" stroke="rgba(232,228,216,.14)" stroke-width="7" stroke-linecap="round"/>' +
      '<path id="soc-arc" d="M10 52 A26 26 0 0 1 74 52" fill="none" stroke="#f2a53a" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 999"/></svg>' +
      '<div style="font-size:15px;font-weight:700;margin-top:-30px;text-align:center;position:relative" id="soc-temp">41°</div>' +
      '<div class="iq-stats" style="clear:both">' +
      '<div class="r"><span>主频 CORE</span><b id="soc-freq">—</b></div>' +
      '<div class="r"><span>电压 VOLT</span><b id="soc-volt">—</b></div>' +
      '<div class="r"><span>内存 MEM</span><b>512 MB</b></div>' +
      '<div class="iq-chips" style="margin-top:auto"><span class="chip" id="ch-gpu">GPU 正常</span><span class="chip" id="ch-lx">LINUX</span></div>' +
      '</div></div></section>' +

      '<section class="panel"><header><i class="dot" style="background:#5b8cff"></i><b>eth0 网络</b><span class="meta">LAN9512 · 100BASE</span></header>' +
      '<div class="body"><div class="iq-stats" style="height:80px">' +
      '<div class="r"><span>链路 LINK</span><b id="net-link">断开</b></div>' +
      '<div class="r"><span>IP</span><b id="net-ip">—</b></div>' +
      '<div class="r"><span>接收 RX</span><b id="net-rx">0 KB</b></div>' +
      '<div class="r"><span>SSH</span><b id="net-ssh">—</b></div>' +
      '<div class="iq-chips" style="margin-top:auto"><span class="chip" id="ch-lnk">已连接</span><span class="chip" id="ch-ssh">SSH</span></div>' +
      '</div></div></section>';

    var grid = document.getElementById("gpio-grid");
    for (var i = 0; i < 26; i++) {
      var cell = document.createElement("div");
      cell.style.cssText = "height:12px;border-radius:3px;background:rgba(232,228,216,.12)";
      grid.appendChild(cell);
    }

    var t = mkCanvas("c-term", 92); ctxTerm = t.ctx; tw = t.w; th = t.h;

    dom = {
      cells: grid.children,
      gpioNote: document.getElementById("gpio-note"), gpioAct: document.getElementById("gpio-act"),
      arc: document.getElementById("soc-arc"), temp: document.getElementById("soc-temp"),
      freq: document.getElementById("soc-freq"), volt: document.getElementById("soc-volt"),
      gpu: document.getElementById("ch-gpu"), lx: document.getElementById("ch-lx"),
      link: document.getElementById("net-link"), ip: document.getElementById("net-ip"),
      rx: document.getElementById("net-rx"), ssh: document.getElementById("net-ssh"),
      lnk: document.getElementById("ch-lnk"), sshC: document.getElementById("ch-ssh")
    };
  }

  function termType(line) {
    termLines.push(line);
    if (LS8.Audio) LS8.Audio.play("type");
    if (termLines.length > 6) termLines.shift();
  }
  function termClear() { termLines = []; }

  function drawTerm(st) {
    var ctx = ctxTerm, W = tw, H = th;
    ctx.fillStyle = "#0a0f16";
    ctx.fillRect(0, 0, W, H);
    if (!st.bootOn) {
      ctx.fillStyle = "rgba(232,228,216,0.18)";
      ctx.font = "9px monospace";
      ctx.fillText("— 无信号 —", 10, H / 2);
      return;
    }
    ctx.font = "9.5px monospace";
    termLines.forEach(function (ln, i) {
      ctx.fillStyle = ln.indexOf("login") >= 0 ? "#7fd8d8" : "#9ec9a8";
      if (ln.indexOf("Welcome") >= 0) ctx.fillStyle = "#e8e4d8";
      ctx.fillText(ln, 8, 14 + i * 13);
    });
    if (Math.sin(st.time * 5) > 0) {
      ctx.fillStyle = "#9ec9a8";
      var y = 14 + Math.min(termLines.length, 6) * 13 - 3;
      ctx.fillText("█", 8, y);
    }
  }

  /* PWM 硬件引脚仅 BCM18 = 物理 12（rev2），blink 只动这一脚 */
  var GPIO_ACT = [12];

  function update(st, dt) {
    drawTerm(st);

    var act = st.loginDone ? GPIO_ACT : [];
    for (var i = 0; i < 26; i++) {
      var on = act.indexOf(i + 1) >= 0;
      dom.cells[i].style.background = on
        ? (Math.sin(st.time * (3 + i % 4)) > 0 ? "#e8c53c" : "#c89a20")
        : "rgba(232,228,216,.12)";
    }
    dom.gpioNote.textContent = st.loginDone ? "输出 · PWM 闪烁 · BCM18" : "高阻态 HI-Z";
    dom.gpioAct.textContent = act.length + " 个活动引脚";

    var frac = Math.max(0, Math.min(1, (st.socTemp - 30) / 30));
    dom.arc.setAttribute("stroke-dasharray", (frac * 81.7) + " 999");
    dom.temp.textContent = st.socTemp.toFixed(0) + "°";
    dom.freq.textContent = st.power ? "700 MHZ" : "—";
    dom.volt.textContent = st.power ? "1.20 V" : "—";
    dom.gpu.className = "chip" + (st.power ? " on" : "");
    dom.lx.className = "chip" + (st.loginDone ? " lock" : "");

    var up = st.loginDone;
    dom.link.textContent = up ? "100 FD" : (st.power ? "断开" : "—");
    dom.link.style.color = up ? "#57c46b" : "rgba(232,228,216,0.6)";
    dom.ip.textContent = up ? "192.168.1.42" : "—";
    dom.rx.textContent = up ? Math.floor(st.rxKb) + " KB" : "0 KB";
    dom.ssh.textContent = up ? "端口 22" : "—";
    dom.lnk.className = "chip" + (up ? " on" : "");
    dom.sshC.className = "chip" + (up ? " lock" : "");
  }

  LS8.Dashboard = {
    build: buildDOM,
    update: update,
    termType: termType,
    termClear: termClear
  };
})(window.LS8 = window.LS8 || {});
