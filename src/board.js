/* 场景：渲染器 / 灯光 / 木桌 / 绿垫 / Raspberry Pi Model B 裸板 */
(function (LS8) {
  var M = {};

  function mesh(geo, mat, x, y, z, cast, receive) {
    var m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y, z);
    m.castShadow = cast !== false;
    m.receiveShadow = receive !== false;
    return m;
  }

  function init() {
    var stage = document.getElementById("stage");
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    var softGL = false;
    try {
      var gl = renderer.getContext();
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      var gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "";
      softGL = /swiftshader|software|basic render/i.test(String(gpu));
    } catch (e) { /* 默认 */ }
    renderer.setPixelRatio(softGL ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = softGL ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.physicallyCorrectLights = true;
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.background = LS8.Textures.sky({
      stops: ["#e2f2e6", "#eef2e2", "#e2ecf0", "#e8e8f0"],
      blobs: [
        [205, 102, 240, "rgba(150,220,170,0.4)"],
        [819, 153, 260, "rgba(150,200,225,0.4)"]
      ]
    });

    var camera = new THREE.PerspectiveCamera(38, stage.clientWidth / stage.clientHeight, 0.1, 80);
    camera.position.set(4.5, 4.2, 6.4);

    scene.add(new THREE.HemisphereLight(0xfff2df, 0x8a7f66, 1.0));
    var sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(4.5, 8, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(softGL ? 1024 : 2048, softGL ? 1024 : 2048);
    sun.shadow.camera.left = -6.5; sun.shadow.camera.right = 6.5;
    sun.shadow.camera.top = 6.5; sun.shadow.camera.bottom = -6.5;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 22;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    var desk = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 46),
      new THREE.MeshStandardMaterial({ map: LS8.Textures.wood(), roughness: 0.92 })
    );
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    scene.add(desk);

    var topMat = new THREE.MeshStandardMaterial({
      map: LS8.Textures.mat({ a: "#1d3a2c", b: "#14291f", grid: "rgba(150,220,180,0.13)", grid2: "rgba(160,230,190,0.2)", tick: "rgba(200,240,215,0.4)", title: "RPI BENCH MAT · 60 x 40" }),
      roughness: 0.82
    });
    var sideMat = new THREE.MeshStandardMaterial({ color: 0x0f2018, roughness: 0.85 });
    var matMesh = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.09, 4.8),
      [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
    matMesh.position.y = 0.048;
    matMesh.rotation.y = 0.045;
    matMesh.receiveShadow = true;
    matMesh.castShadow = true;
    scene.add(matMesh);

    /* ---- 共享材质 ---- */
    M.plastic = new THREE.MeshStandardMaterial({ color: 0x1d1f26, roughness: 0.85 });
    M.dark = new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.8 });
    M.silver = new THREE.MeshStandardMaterial({ color: 0xc9cdd4, metalness: 0.75, roughness: 0.32 });
    M.alu = new THREE.MeshStandardMaterial({ color: 0xd8dade, metalness: 0.6, roughness: 0.4 });
    M.gold = new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.85, roughness: 0.35 });
    M.navy = new THREE.MeshStandardMaterial({ color: 0x2a3a66, roughness: 0.5 });
    M.pink = new THREE.MeshStandardMaterial({ color: 0xe84f8e, roughness: 0.5 });
    M.white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.4 });
    M.chip = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.4, metalness: 0.2 });
    M.rpiGreen = new THREE.MeshStandardMaterial({
      map: LS8.Textures.pcb("#2e9e5b", "rgba(96,200,130,0.42)", "Raspberry Pi (C)", "MODEL B REV 2.0 · (C) 2012"),
      roughness: 0.62
    });

    /* ---- Pi 裸板（静态，较小 1.7×1.1） ---- */
    var boardGroup = new THREE.Group();
    boardGroup.position.set(0.1, 0.095, 0.1);
    boardGroup.rotation.y = 0.03;
    var g = boardGroup;

    g.add(mesh(new THREE.BoxGeometry(1.72, 0.035, 1.1), M.rpiGreen, 0, 0.018, 0));

    // 安装孔（rev2 非对称内缩真实位置）
    [[-0.73, -0.35], [0.74, -0.4], [-0.7, 0.44], [0.74, 0.41]].forEach(function (p) {
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 10), M.gold, p[0], 0.04, p[1]));
    });
    // GPIO 焊盘排（顶缘预置焊点）
    for (var i = 0; i < 13; i++) {
      g.add(mesh(new THREE.BoxGeometry(0.025, 0.012, 0.05), M.gold, -0.42 + i * 0.07, 0.04, -0.5));
    }
    // SD 卡槽缝（底面，真实 Model B 卡从下方插入）
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.025, 0.55), M.dark, -0.86, 0.002, 0.05));
    // 小散件
    for (var c = 0; c < 8; c++) {
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.02, 0.04), M.chip, -0.3 + (c % 4) * 0.2, 0.04, 0.3 + Math.floor(c / 4) * 0.12));
    }

    scene.add(boardGroup);

    LS8.Scene3D = {
      scene: scene, camera: camera, renderer: renderer,
      board: boardGroup, mesh: mesh, M: M,
      setFanSpeed: function () { /* 无旋转件 */ }
    };
  }

  function update() { /* 无 */ }

  LS8.SceneInit = init;
  LS8.SceneUpdate = update;
})(window.LS8 = window.LS8 || {});
