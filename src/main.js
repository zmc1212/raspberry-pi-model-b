/* 入口：初始化各模块、主循环、交互（拖拽/点击零件/空格暂停/R 重播） */
(function (LS8) {
  var lastT = performance.now();
  var raycaster = null, mouse = new THREE.Vector2();
  var downX = 0, downY = 0;

  function boot() {
    LS8.SceneInit();
    var S3 = LS8.Scene3D;

    LS8.orbitCtl = new LS8.Orbit(S3.camera, S3.renderer.domElement);
    LS8.Labels.init();
    LS8.Parts.init();
    LS8.Cables.init();
    LS8.Dashboard.build();
    LS8.Timeline.init();
    LS8.Timeline.start();

    raycaster = new THREE.Raycaster();
    bindInteractions(S3);

    window.addEventListener("resize", function () {
      var stage = document.getElementById("stage");
      S3.camera.aspect = stage.clientWidth / stage.clientHeight;
      S3.camera.updateProjectionMatrix();
      S3.renderer.setSize(stage.clientWidth, stage.clientHeight);
    });

    window.addEventListener("keydown", function (e) {
      if (e.code === "Space") {
        e.preventDefault();
        var p = LS8.Timeline.togglePause();
        document.getElementById("phase-text").style.opacity = p ? "0.5" : "1";
      } else if (e.code === "KeyR") {
        LS8.Timeline.restart();
        document.getElementById("phase-text").style.opacity = "1";
      } else if (e.code === "KeyD") {
        document.body.classList.toggle("no-dash");
      } else if (/^Digit[1-8]$/.test(e.code)) {
        var ids = LS8.Timeline.phaseIds;
        LS8.Timeline.seek(ids[Number(e.code.slice(5)) - 1]);
        document.getElementById("phase-text").style.opacity = "1";
      }
    });

    loop();
  }

  function bindInteractions(S3) {
    var dom = S3.renderer.domElement;
    dom.style.touchAction = "none";
    dom.addEventListener("pointerdown", function (e) { downX = e.clientX; downY = e.clientY; });
    dom.addEventListener("pointerup", function (e) {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;  // 拖拽不算点击
      var rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, S3.camera);
      var groups = [];
      LS8.Parts.list().forEach(function (p) { if (p.group.visible) groups.push(p.group); });
      var hits = raycaster.intersectObjects(groups, true);
      if (hits.length) {
        var g = hits[0].object;
        while (g && !g.userData.tagAnchor) g = g.parent;
        if (g) {
          var meta = null;
          LS8.Parts.list().forEach(function (p) { if (p.group === g) meta = p; });
          if (meta) LS8.Labels.announce(meta.id, g, meta.name, meta.sub, performance.now(), 2200);
        }
      }
    });
    dom.addEventListener("pointermove", function (e) {
      var rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, S3.camera);
      var groups = [];
      LS8.Parts.list().forEach(function (p) { if (p.group.visible) groups.push(p.group); });
      dom.style.cursor = raycaster.intersectObjects(groups, true).length ? "pointer" : "";
    });
  }

  function loop() {
    requestAnimationFrame(loop);
    var now = performance.now();
    var dt = Math.min((now - lastT) / 1000, 0.12);
    lastT = now;

    LS8.Timeline.update(dt);          // 内部判断暂停
    LS8.orbitCtl.update(dt);
    LS8.SceneUpdate(dt);
    LS8.Labels.update();
    LS8.Scene3D.renderer.render(LS8.Scene3D.scene, LS8.Scene3D.camera);
    if (!window.LS8_BOOTED) window.LS8_BOOTED = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window.LS8 = window.LS8 || {});
