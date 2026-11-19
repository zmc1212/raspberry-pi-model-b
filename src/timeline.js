/* 时间线：PoP 堆叠 → 连接器 → GPIO → SD 卡 → 上电 → 内核 → 登录 → 归位 */
(function (LS8) {
  var phases = [
    { id: "pop", name: "PoP 堆叠 · BCM2835 + RAM", dur: 3.6, dot: "blue",
      cam: { theta: -0.62, phi: 0.96, r: 4.4, target: [0.1, 0.15, 0.1] }, drift: 0.03 },
    { id: "conn", name: "连接器接入 · USB ETH HDMI", dur: 4.2, dot: "teal",
      cam: { theta: -1.7, phi: 0.95, r: 3.4, target: [0.35, 0.15, 0.15] }, drift: 0.015 },
    { id: "gpio", name: "GPIO 排针 · 26 PIN", dur: 3.0, dot: "teal",
      cam: { theta: -1.1, phi: 1.0, r: 3.0, target: [0.05, 0.15, -0.4] }, drift: 0.01 },
    { id: "sd", name: "SD 卡插入 · 8 GB", dur: 2.8, dot: "yellow",
      cam: { theta: -2.4, phi: 1.0, r: 3.2, target: [-0.85, 0.05, 0.1] }, drift: 0.01 },
    { id: "power", name: "通电 · 5V 700MA", dur: 2.6, dot: "green",
      cam: { theta: -0.85, phi: 0.92, r: 3.8, target: [0.1, 0.15, 0.1] }, drift: 0.012 },
    { id: "kernel", name: "内核启动 · KERNEL", dur: 3.6, dot: "yellow",
      cam: { theta: -1.5, phi: 1.02, r: 4.2, target: [0.1, 0.15, 0.1] }, drift: 0.01 },
    { id: "login", name: "登录终端 · PI", dur: 3.4, dot: "pink",
      cam: { theta: -0.75, phi: 0.94, r: 4.8, target: [0.1, 0.15, 0.1] }, drift: 0.02 },
    { id: "home", name: "零件归位", dur: 5.0, dot: "yellow",
      cam: { theta: -0.62, phi: 1.0, r: 7.0, target: [0.1, 0.2, 0.1] }, drift: 0.03 }
  ];

  var PINNED = {
    pop: function () {
      return [{ id: "p-soc", obj: LS8.Parts.group("soc"), text: "PoP 堆叠芯片", sub: "POP · ARM11 + 256MB" }];
    },
    conn: function () {
      return [
        { id: "p-eth", obj: LS8.Parts.group("eth"), text: "以太网网口", sub: "LAN9512 · MAGJACK" },
        { id: "p-us", obj: LS8.Parts.group("usb"), text: "USB 双层堆叠", sub: "USB DUAL STACK", tone: "white" }
      ];
    },
    gpio: function () {
      return [{ id: "p-gp", obj: LS8.Parts.group("gpio"), text: "GPIO 排针", sub: "GPIO · 26 PIN" }];
    },
    sd: function () {
      return [{ id: "p-sd", obj: LS8.Parts.group("sd"), text: "SD 卡就位", sub: "SD · RASPBIAN" }];
    },
    login: function () {
      return [{ id: "p-pl", obj: LS8.Parts.group("plug"), text: "microUSB 电源", sub: "5V · 700 MA" }];
    }
  };

  var POWER_AT = 4;

  var state = {};
  var idx = -1, pt = 0, paused = false;
  var typed = 0;
  var dom = {};

  function resetState() {
    state = {
      time: 0, power: false, bootOn: false, loginDone: false,
      socTemp: 41, rxKb: 0
    };
    typed = 0;
    LS8.Dashboard.termClear();
  }

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    dom = {
      mode: $("st-mode"), arm: $("st-arm"), temp: $("st-temp"), parts: $("st-parts"),
      pill: $("phase-text"), dot: $("phase-dot")
    };
  }

  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  var PHASE_SFX = { sd: "insert", power: "power", kernel: "chirp", login: "chime" };

  function enterPhase(i) {
    idx = i; pt = 0;
    var ph = phases[i];
    if (ph.id === "pop") {
      LS8.Parts.begin(0, ["soc", "lan", "xtal", "reg", "leds", "tray"], ph.dur - 1.4);
      LS8.Labels.clearAnnounce();
    } else if (ph.id === "conn") {
      LS8.Parts.begin(0, ["usb", "eth", "hdmi", "rca", "jack", "csi", "dsi", "pwr"], ph.dur - 1.4);
    } else if (ph.id === "gpio") {
      LS8.Parts.begin(0, ["gpio", "p5"], ph.dur - 1.4);
    } else if (ph.id === "sd") {
      LS8.Parts.begin(0, ["sd"], ph.dur - 1.4);
    } else if (ph.id === "power") {
      LS8.Parts.begin(0, ["plug"], ph.dur - 1.4);
      LS8.Cables.begin(0);
      state.power = true;
    } else if (ph.id === "kernel") {
      state.bootOn = true;
    } else if (ph.id === "login") {
      // 登录打字在 update 推进
    } else if (ph.id === "home") {
      LS8.Parts.flyOut(0);
    }
    if (LS8.Audio && PHASE_SFX[ph.id]) LS8.Audio.play(PHASE_SFX[ph.id]);
    var pins = PINNED[ph.id];
    LS8.Labels.setPinned(pins ? pins() : []);
  }

  function restartCycle() {
    LS8.Parts.reset();
    LS8.Cables.reset();
    LS8.Labels.clearAnnounce();
    resetState();
    enterPhase(0);
  }

  var TERM_SCRIPT = [
    [0.4, "[    0.000000] Booting Linux on physical CPU 0"],
    [0.9, "[    0.281000] Linux version 3.1.9+ (kernel@pi)"],
    [1.4, "[    0.412000] mmc0: SD card detected"],
    [1.9, "[    1.128000] smsc95xx: link up, 100Mbps"],
    [2.5, "[    2.310000] random: initializing urandom seed"],
    [3.0, "Raspbian GNU/Linux 7 raspberrypi tty1"],
    [3.8, "raspberrypi login: pi"],
    [4.6, "Password:"],
    [5.6, "The programs included with the Debian GNU"],
    [6.2, "/Linux system are free software..."],
    [6.9, "pi@raspberrypi:~$ _"]
  ];

  function update(dt) {
    if (paused) return;
    dt = Math.min(dt, 0.12);
    state.time += dt;
    pt += dt;

    var ph = phases[idx];
    if (pt >= ph.dur) {
      if (idx >= phases.length - 1) restartCycle();
      else enterPhase(idx + 1);
      ph = phases[idx];
    }

    LS8.orbitCtl.autoDrift = ph.drift;
    LS8.orbitCtl.flyTo(ph.cam);

    LS8.Parts.update(pt);
    LS8.Cables.update(pt);

    /* 终端打字（kernel + login 阶段推进） */
    if (state.bootOn) {
      var base = ph.id === "kernel" ? 0 : 5.2;
      var t = (state.termT = (state.termT || 0) + dt) ;
      while (typed < TERM_SCRIPT.length && t + base > TERM_SCRIPT[typed][0]) {
        LS8.Dashboard.termType(TERM_SCRIPT[typed][1]);
        typed++;
      }
      if (typed >= 9) state.loginDone = true;
    }

    /* SoC 温度与流量 */
    if (state.power) {
      state.socTemp = 41 + 17 * smooth((state.time - (powerOnAt || 0)) / 10);
      state.rxKb = state.loginDone ? state.rxKb + dt * 24 : 0;
    }
    if (state.power && !powerOnAt) powerOnAt = state.time;

    /* DOM */
    dom.mode.textContent = state.loginDone ? "在线 UP" : (state.bootOn ? "启动 BOOT" : (state.power ? "就绪 READY" : "关机 OFF"));
    dom.mode.className = "mode" + (state.loginDone ? " lock" : "");
    dom.arm.textContent = state.power ? "700 MHZ" : "—";
    dom.temp.textContent = state.power ? state.socTemp.toFixed(0) + "°C" : "—";
    var partsN = LS8.Parts.seatedCount;
    dom.parts.textContent = partsN + " / 18";
    var label = ph.name;
    if (ph.id === "conn") label = ph.name + " · " + partsN + " / 18";
    dom.pill.textContent = label;
    dom.dot.className = ph.dot;

    LS8.Dashboard.update(state, dt);
  }

  var powerOnAt = 0;

  LS8.Timeline = {
    init: function () { resetState(); cacheDom(); },
    start: function () { enterPhase(0); },
    restart: restartCycle,
    seek: function (id) {
      var i = -1;
      for (var k = 0; k < phases.length; k++) if (phases[k].id === id) i = k;
      if (i < 0) return;
      LS8.Parts.reset();
      LS8.Cables.reset();
      LS8.Labels.clearAnnounce();
      resetState();
      powerOnAt = 0;
      if (i >= 1) { LS8.Parts.begin(0); LS8.Parts.sealAll(); }
      if (i >= POWER_AT) {
        LS8.Cables.completeAll();
        state.power = true;
        state.socTemp = 55;
      }
      enterPhase(i);
      if (i >= 6) {   // kernel / login：补打字
        state.bootOn = true;
        var t = i >= 7 ? 7 : 4;
        while (typed < TERM_SCRIPT.length && t > TERM_SCRIPT[typed][0] - (i >= 7 ? 5.2 : 0)) {
          LS8.Dashboard.termType(TERM_SCRIPT[typed][1]);
          typed++;
        }
        state.termT = t;
        if (typed >= 9) state.loginDone = true;
        if (i >= 7) state.rxKb = 512;
      }
    },
    update: update,
    togglePause: function () { paused = !paused; return paused; },
    get paused() { return paused; },
    get phaseId() { return phases[idx] ? phases[idx].id : ""; },
    get phaseIds() { return phases.map(function (p) { return p.id; }); }
  };
})(window.LS8 = window.LS8 || {});
