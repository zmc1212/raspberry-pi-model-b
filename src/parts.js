/* Raspberry Pi Model B 零件 + 飞行装配控制器 */
(function (LS8) {
  var list = [];
  var root = null;
  var seatedCount = 0;
  var flying = false, phaseOut = false;
  var t0 = 0;

  function chipTop(text, sub) {
    return LS8.Textures.makeTex(128, 64, function (ctx, w, h) {
      ctx.fillStyle = "#14151a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, w / 2, 26);
      if (sub) { ctx.font = "11px monospace"; ctx.fillText(sub, w / 2, 46); }
    });
  }

  function setAnchor(g, y) { g.userData.tagAnchor = new THREE.Vector3(0, y, 0); }

  function build() {
    var M = LS8.Scene3D.M, mesh = LS8.Scene3D.mesh;
    var defs = [];

    function def(id, name, sub, pos, yaw, anchorY, buildFn, delay, mid) {
      var g = buildFn();
      g.position.set(pos[0], pos[1], pos[2]);
      g.rotation.y = yaw || 0;
      setAnchor(g, anchorY);
      root.add(g);
      defs.push({ id: id, name: name, sub: sub, group: g, target: g.position.clone(),
        yaw: yaw || 0, anchorY: anchorY, delay: delay || 0, mid: mid || null });
    }

    /* 1 · BCM2835 SoC + PoP RAM（两层堆叠，rev2 512MB） */
    def("soc", "处理器 BCM2835", "POP RAM · 512 MB", [0.1, 0.115, -0.05], 0.06, 0.16,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.3, 0.035, 0.3), M.chip, 0, 0.02, 0));
        g.add(mesh(new THREE.BoxGeometry(0.26, 0.03, 0.26), new THREE.MeshStandardMaterial({ color: 0x31405e, roughness: 0.4 }), 0, 0.055, 0));
        return g;
      }, 0);
    /* 2 · LAN9512 USB/以太网芯片 */
    def("lan", "网络芯片 LAN9512", "USB HUB + ETH", [0.42, 0.115, 0.18], -0.08, 0.1,
      function () { return (function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.24, 0.03, 0.24), M.chip, 0, 0.015, 0));
        return g;
      })(); }, 0.6);
    /* 3 · USB-A 双层堆叠（右缘，RJ45 下方） */
    def("usb", "USB 口 ×2", "USB · DUAL STACK", [0.76, 0.115, 0.08], -Math.PI / 2, 0.14,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.34, 0.09, 0.16), M.silver, 0, 0.05, 0));
        g.add(mesh(new THREE.BoxGeometry(0.34, 0.09, 0.16), M.silver, 0, 0.14, 0));
        g.add(mesh(new THREE.BoxGeometry(0.3, 0.06, 0.02), M.dark, 0, 0.1, -0.08));
        return g;
      }, 0.5);
    /* 4 · RJ45 以太网口（右缘上部，与 USB 相邻——真实 Model B 布局） */
    def("eth", "以太网口 RJ45", "MAGJACK · 10/100 + LED", [0.76, 0.115, -0.28], -Math.PI / 2, 0.14,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.36, 0.14, 0.17),
          new THREE.MeshStandardMaterial({ color: 0x2f4f3f, roughness: 0.55 }), 0, 0.07, 0));
        g.add(mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), M.plastic, -0.1, 0.1, -0.085));
        g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8),
          new THREE.MeshStandardMaterial({ color: 0xffd23c, emissive: 0xffd23c, emissiveIntensity: 0, roughness: 0.3 }), 0.12, 0.12, -0.086).rotateX(Math.PI / 2));
        return g;
      }, 1.0);
    /* 5 · HDMI（下缘中部） */
    def("hdmi", "HDMI 接口", "TYPE A · 19 PIN", [0.25, 0.115, 0.52], Math.PI, 0.12,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.26, 0.07, 0.15), M.silver, 0, 0.04, 0));
        g.add(mesh(new THREE.BoxGeometry(0.22, 0.03, 0.02), M.dark, 0, 0.05, -0.075));
        return g;
      }, 1.5);
    /* 6 · RCA 视频（下缘左） */
    def("rca", "RCA 视频口", "COMPOSITE VIDEO", [-0.6, 0.115, 0.52], 0, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12),
          new THREE.MeshStandardMaterial({ color: 0xe8b93c, roughness: 0.4 }), 0, 0.03, 0));
        return g;
      }, 2.0);
    /* 6b · 3.5mm 音频 jack（下缘，RCA 与电源之间） */
    def("jack", "3.5mm 音频口", "4-POLE · AV JACK", [-0.42, 0.115, 0.52], 0, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), M.plastic, 0, 0.03, 0));
        g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), M.dark, 0, 0.05, 0));
        return g;
      }, 2.8);
    /* 6c · CSI / DSI FFC 座（上缘 GPIO 侧） */
    def("csi", "CSI 摄像头座", "CAMERA · FFC · 26 PIN", [-0.3, 0.115, -0.42], 0, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.18, 0.045, 0.07), M.white, 0, 0.028, 0));
        g.add(mesh(new THREE.BoxGeometry(0.14, 0.02, 0.02), M.dark, 0, 0.05, 0));
        return g;
      }, 3.1);
    def("dsi", "DSI 显示屏座", "DISPLAY · FFC · 15 PIN", [-0.05, 0.115, -0.42], 0, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.14, 0.045, 0.07), M.white, 0, 0.028, 0));
        g.add(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), M.dark, 0, 0.05, 0));
        return g;
      }, 3.4);
    /* 8 · GPIO 26Pin 排针 */
    def("gpio", "GPIO 排针", "HEADER · 26 PIN · 2x13", [0.05, 0.115, -0.5], 0, 0.14,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.46, 0.05, 0.09), M.plastic, 0, 0.045, 0));
        for (var i = 0; i < 13; i++) {
          g.add(mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), M.gold, -0.42 + i * 0.07, 0.08, -0.02));
          g.add(mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), M.gold, -0.42 + i * 0.07, 0.08, 0.02));
        }
        return g;
      }, 6);
    /* 9 · microUSB 电源座（下缘左，真实位置） */
    def("pwr", "电源座 microUSB", "PWR · 5V 700MA", [-0.24, 0.115, 0.52], 0, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.12, 0.06, 0.09), M.plastic, 0, 0.03, 0));
        return g;
      }, 2.5);
    /* 10 · SD 卡（底面插槽，从下方压入——真实 Model B 布局） */
    def("sd", "SD 卡", "8 GB CLASS 4 · BOTTOM SLOT", [-0.72, 0.078, 0.15], 0, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.24, 0.03, 0.32),
          new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.45 }), 0, 0, 0));
        return g;
      }, 0.3, { mid: [-1.15, 0.078, 0.15] });
    /* 10b · P5 排针（rev2 特有，底面 2x4） */
    def("p5", "P5 排针", "REV2 · 2x4 · BOTTOM", [-0.45, 0.078, -0.42], Math.PI, 0.08,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.18, 0.045, 0.08), M.plastic, 0, 0.024, 0));
        for (var i = 0; i < 4; i++) {
          g.add(mesh(new THREE.BoxGeometry(0.02, 0.05, 0.02), M.gold, -0.06 + i * 0.04, 0.06, -0.02));
          g.add(mesh(new THREE.BoxGeometry(0.02, 0.05, 0.02), M.gold, -0.06 + i * 0.04, 0.06, 0.02));
        }
        return g;
      }, 0.9);
    /* 11 · 状态 LED（ACT 绿 + PWR 红，HDMI/电源角——rev2 真实位置） */
    def("leds", "状态灯", "ACT · PWR LED · REV2", [-0.5, 0.112, 0.44], -0.15, 0.08,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x3ddc6f, emissive: 0x3ddc6f, emissiveIntensity: 0, roughness: 0.3 }), -0.035, 0, 0));
        g.add(mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 0, roughness: 0.3 }), 0.035, 0, 0));
        return g;
      }, 2.4);
    /* 12 · 晶振 */
    def("xtal", "晶振 25 MHZ", "CRYSTAL · LAN REF", [0.72, 0.115, 0.2], 0.4, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 10), M.silver, 0, 0, 0).rotateX(Math.PI / 2));
        return g;
      }, 1.2);
    /* 13 · 电源稳压器组 */
    def("reg", "稳压电路", "LDO + BUCK · NCP1117 · 3.3V/1.8V", [-0.5, 0.115, 0.3], 0.1, 0.08,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.12, 0.03, 0.08), M.dark, 0, 0.015, 0));
        g.add(mesh(new THREE.BoxGeometry(0.08, 0.035, 0.1), M.chip, 0.11, 0.017, 0));
        return g;
      }, 1.8);
    /* 14 · microUSB 电源线插头（带短线） */
    def("plug", "电源插头", "PSU · 5V · MICRO USB", [-1.5, 0.093, -0.4], 0.15, 0.1,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.BoxGeometry(0.2, 0.1, 0.14), M.plastic, 0, 0.05, 0));
        g.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8), M.dark, 0.08, 0.08, 0).rotateZ(Math.PI / 2));
        return g;
      }, 0.4);
    /* 15 · 螺丝盒 */
    def("tray", "螺丝组", "SCREWS · M2.5", [-2.4, 0.093, 1.6], -0.25, 0.16,
      function () {
        var g = new THREE.Group();
        g.add(mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.1, 20), M.plastic, 0, 0.05, 0));
        g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), M.dark, 0, 0.1, 0));
        for (var i = 0; i < 6; i++) {
          var s = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.055, 6), M.silver,
            (Math.random() - 0.5) * 0.22, 0.12, (Math.random() - 0.5) * 0.22);
          s.rotation.z = Math.PI / 2 + (Math.random() - 0.5);
          g.add(s);
        }
        return g;
      }, 0);

    return defs;
  }

  /* ============ 飞行控制（通用骨架） ============ */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function init() {
    root = new THREE.Group();
    LS8.Scene3D.scene.add(root);
    list = build();
    list.forEach(function (p) {
      p.duration = 1.15;
      p.start = new THREE.Vector3(-7.8 - Math.random() * 2, 0.6 + Math.random() * 1.6, -1.6 + Math.random() * 2.2);
      p.midPoint = new THREE.Vector3(
        p.start.x + (p.target.x - p.start.x) * 0.42,
        1.9 + Math.random() * 0.7,
        p.start.z + (p.target.z - p.start.z) * 0.55 - 0.3
      );
      p.group.visible = false;
      p.begun = false;
    });
  }

  function bez(p0, p1, p2, t) {
    var a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t;
    return new THREE.Vector3(
      a * p0.x + b * p1.x + c * p2.x,
      a * p0.y + b * p1.y + c * p2.y,
      a * p0.z + b * p1.z + c * p2.z
    );
  }

  function begin(now, ids, span) {
    flying = true; phaseOut = false;
    t0 = now;
    /* 阶段内归一化错峰：按 ids 顺序均分 span，保证全部零件在本阶段内落座 */
    var seq = [];
    if (ids) {
      ids.forEach(function (id) {
        for (var k = 0; k < list.length; k++) if (list[k].id === id) { seq.push(list[k]); break; }
      });
    } else {
      seq = list.slice();
    }
    var step = seq.length > 1 ? Math.max(0.18, (span || 2.2) / (seq.length - 1)) : 0;
    seq.forEach(function (p, i) {
      p.flyDelay = i * step;
      p.begun = true;
      p.sealed = false;
      p.landed = false; p.tagShown = false;
      p.group.visible = false;
      if (p.line) { LS8.Scene3D.scene.remove(p.line); p.line = null; }
      var pts = [];
      for (var k = 0; k <= 30; k++) pts.push(bez(p.start, p.midPoint, p.target, k / 30));
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var line = new THREE.Line(geo, new THREE.LineDashedMaterial({
        color: 0xff7ab8, dashSize: 0.11, gapSize: 0.075, transparent: true, opacity: 0.8
      }));
      line.computeLineDistances();
      LS8.Scene3D.scene.add(line);
      p.line = line;
      p.lineUntil = Infinity;
    });
  }

  function flyOut(now) {
    if (!flying) return;
    phaseOut = true;
    t0 = now;
    list.forEach(function (p, i) {
      if (!p.begun || !p.group.visible) return;
      p.outDelay = i * 0.12;
      p.outDone = false;
      p.outStart = p.group.position.clone();
      p.outMid = new THREE.Vector3(p.outStart.x - 2.2, 2.4, p.outStart.z - 0.6);
      var pts = [];
      for (var k = 0; k <= 30; k++) pts.push(bez(p.outStart, p.outMid, p.start, k / 30));
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var line = new THREE.Line(geo, new THREE.LineDashedMaterial({
        color: 0xff7ab8, dashSize: 0.11, gapSize: 0.075, transparent: true, opacity: 0.6
      }));
      line.computeLineDistances();
      LS8.Scene3D.scene.add(line);
      p.outLine = line;
    });
  }

  function update(now) {
    if (!flying) return;
    list.forEach(function (p) {
      if (!p.begun || p.sealed) return;
      if (!phaseOut) {
        if (p.landed) {
          /* 已落座：钉在目标位，阶段切换 t0 清零也不重飞 */
          p.group.position.copy(p.target);
          p.group.rotation.y = p.yaw;
        } else {
          var t = (now - t0 - p.flyDelay) / p.duration;
          if (t <= 0) return;
          if (!p.tagShown) {
            p.tagShown = true;
            p.group.visible = true;
            LS8.Labels.announce(p.id, p.group, p.name, p.sub, performance.now(), 2600);
          }
          var tt = easeInOut(Math.min(t, 1));
          p.group.position.copy(bez(p.start, p.midPoint, p.target, tt));
          p.group.rotation.y = p.yaw + (1 - tt) * 1.2;
          if (t >= 1 && !p.landed) {
            p.landed = true;
            seatedCount++;
            if (LS8.Audio) LS8.Audio.play("land");
            p.lineUntil = now + 0.55;
          }
        }
        if (p.line) {
          if (now > p.lineUntil) {
            LS8.Scene3D.scene.remove(p.line);
            p.line.geometry.dispose(); p.line.material.dispose();
            p.line = null;
          } else if (p.landed) {
            p.line.material.opacity = Math.max(0, (p.lineUntil - now) / 0.55) * 0.8;
          }
        }
      } else {
        if (!p.begun || p.outDone || !p.group.visible) return;
        var ot = (now - t0 - p.outDelay) / 0.85;
        if (ot <= 0) return;
        var ott = easeInOut(Math.min(ot, 1));
        p.group.position.copy(bez(p.outStart, p.outMid, p.start, ott));
        p.group.rotation.y = p.yaw + ott * 1.6;
        if (p.outLine) p.outLine.material.opacity = Math.max(0.1, 0.6 - ott * 0.5);
        if (ot >= 1) {
          p.outDone = true;
          seatedCount = Math.max(0, seatedCount - 1);
          p.group.visible = false;
          if (p.outLine) {
            LS8.Scene3D.scene.remove(p.outLine);
            p.outLine.geometry.dispose(); p.outLine.material.dispose();
            p.outLine = null;
          }
        }
      }
    });
  }

  function sealAll() {
    flying = true; phaseOut = false;
    list.forEach(function (p) {
      p.sealed = true;
      p.begun = true; p.landed = true; p.tagShown = true;
      p.group.visible = true;
      p.group.position.copy(p.target);
      p.group.rotation.y = p.yaw;
      if (p.line) { LS8.Scene3D.scene.remove(p.line); p.line = null; }
    });
    seatedCount = list.length;
  }

  function reset() {
    flying = false; phaseOut = false; seatedCount = 0;
    list.forEach(function (p) {
      p.begun = false; p.landed = false; p.sealed = false;
      p.group.visible = false;
      if (p.line) { LS8.Scene3D.scene.remove(p.line); p.line = null; }
      if (p.outLine) { LS8.Scene3D.scene.remove(p.outLine); p.outLine = null; }
    });
  }

  function groupById(id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].group;
    return null;
  }

  LS8.Parts = {
    init: init, begin: begin, flyOut: flyOut, update: update, reset: reset,
    group: groupById, sealAll: sealAll,
    get seatedCount() { return seatedCount; },
    get flying() { return flying && !phaseOut; },
    list: function () { return list; }
  };
})(window.LS8 = window.LS8 || {});
