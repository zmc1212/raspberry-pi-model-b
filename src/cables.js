/* Raspberry Pi 布线：microUSB 电源线 / HDMI 线 / 网线 */
(function (LS8) {
  var cables = [];
  var root = null;
  var running = false, t0 = 0, done = false;

  var SPECS = [
    { // 电源线：插头 → microUSB 座 → 出画面左
      pts: [[-1.4, 0.1, -0.4], [-1.05, 0.1, -0.36], [-0.9, 0.11, -0.33]],
      color: 0x17181d, r: 0.012, delay: 0, strands: 1
    },
    { // HDMI 线：HDMI 口 → 出画面右
      pts: [[-0.68, 0.12, -0.36], [-1.1, 0.12, -0.55], [-1.7, 0.1, -0.85]],
      color: 0x17181d, r: 0.013, delay: 0.4, strands: 1
    },
    { // 网线：RJ45 → 出画面后
      pts: [[0.6, 0.14, -0.45], [0.85, 0.12, -0.8], [1.25, 0.1, -1.25]],
      color: 0x3f7fa8, r: 0.013, delay: 0.8, strands: 1
    }
  ];

  function init() {
    root = new THREE.Group();
    LS8.Scene3D.scene.add(root);
  }

  function buildCable(spec) {
    var meshes = [];
    for (var k = 0; k < spec.strands; k++) {
      var pts = spec.pts.map(function (p) {
        return new THREE.Vector3(p[0], p[1] + k * 0.004, p[2] + k * 0.02);
      });
      var curve = new THREE.CatmullRomCurve3(pts);
      var geo = new THREE.TubeGeometry(curve, 64, spec.r, 8, false);
      var mat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.62, metalness: 0.12 });
      var m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.geometry.setDrawRange(0, 0);
      root.add(m);
      meshes.push(m);
    }
    return { spec: spec, meshes: meshes };
  }

  function begin(now) {
    running = true; done = false; t0 = now;
    cables = SPECS.map(buildCable);
  }

  function update(now) {
    if (!running || done) return;
    cables.forEach(function (c) {
      var t = (now - t0 - c.spec.delay) / 1.1;
      if (t <= 0) return;
      var f = Math.min(1, t);
      var ease = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      c.meshes.forEach(function (m) {
        var total = m.geometry.index.count;
        m.geometry.setDrawRange(0, Math.floor(total * ease / 6) * 6);
      });
    });
    if ((now - t0) > 3.2) done = true;
  }

  function completeAll() {
    running = true; done = true;
    if (!cables.length) cables = SPECS.map(buildCable);
    cables.forEach(function (c) {
      c.meshes.forEach(function (m) {
        m.geometry.setDrawRange(0, m.geometry.index.count);
      });
    });
  }

  function reset() {
    running = false; done = false;
    root.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    root.clear();
    cables = [];
  }

  LS8.Cables = { init: init, begin: begin, update: update, reset: reset, completeAll: completeAll };
})(window.LS8 = window.LS8 || {});
