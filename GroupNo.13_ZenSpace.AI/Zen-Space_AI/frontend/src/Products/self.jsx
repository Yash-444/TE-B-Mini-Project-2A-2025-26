import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ProductViewer = () => {
  const containerRef = useRef();
  const [sceneData, setSceneData] = useState({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    productGroup: null,
  });

  const [colors, setColors] = useState({
    primary: "#deb887",
    secondary: "#333333",
  });

  const [activeProduct, setActiveProduct] = useState("shelf");

  // ------------------ Initialize Scene ------------------
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdddddd);

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;

    // Lighting
    scene.add(new THREE.AmbientLight(0x404040, 1.2));
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    scene.add(hemisphereLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setSceneData({ scene, camera, renderer, controls, productGroup: null });

    const onResize = () => {
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", onResize);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  // ------------------ Load Product ------------------
  useEffect(() => {
    if (!sceneData.scene) return;
    const { scene, camera, controls } = sceneData;

    // Remove previous
    if (sceneData.productGroup) {
      scene.remove(sceneData.productGroup);
    }

    const primaryMat = new THREE.MeshStandardMaterial({
      color: colors.primary,
      roughness: 0.8,
      metalness: 0.1,
    });

    const secondaryMat = new THREE.MeshStandardMaterial({
      color: colors.secondary,
      roughness: 0.6,
      metalness: 0.2,
    });

    let group;
    if (activeProduct === "shelf") group = createShelvingUnit(primaryMat, secondaryMat);
    else if (activeProduct === "table") group = createCoffeeTable(primaryMat);
    else if (activeProduct === "box") group = createDecorativeBox(primaryMat, secondaryMat);

    scene.add(group);

    // Auto-center camera
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;
    camera.position.set(center.x, center.y, center.z + cameraZ);
    controls.target.copy(center);
    controls.update();

    setSceneData((prev) => ({ ...prev, productGroup: group }));
  }, [activeProduct, colors, sceneData.scene]);

  // ------------------ Product Models ------------------
  const createShelvingUnit = (primaryMaterial, secondaryMaterial) => {
    const SHELF_WIDTH = 3.0,
      SHELF_HEIGHT = 2.5,
      SHELF_DEPTH = 0.5,
      BOARD_THICKNESS = 0.05,
      NUM_COLS = 4,
      TOTAL_ROWS = 3;
    const group = new THREE.Group();

    const backGeom = new THREE.BoxGeometry(
      SHELF_WIDTH,
      SHELF_HEIGHT,
      BOARD_THICKNESS / 2
    );
    const backMesh = new THREE.Mesh(backGeom, primaryMaterial);
    backMesh.position.z = -SHELF_DEPTH / 2 + BOARD_THICKNESS / 4;
    group.add(backMesh);

    const sideGeom = new THREE.BoxGeometry(
      BOARD_THICKNESS,
      SHELF_HEIGHT,
      SHELF_DEPTH
    );
    const sideL = new THREE.Mesh(sideGeom, primaryMaterial);
    sideL.position.x = -SHELF_WIDTH / 2 + BOARD_THICKNESS / 2;
    const sideR = sideL.clone();
    sideR.position.x = SHELF_WIDTH / 2 - BOARD_THICKNESS / 2;
    group.add(sideL, sideR);

    const horizGeom = new THREE.BoxGeometry(
      SHELF_WIDTH,
      BOARD_THICKNESS,
      SHELF_DEPTH
    );
    const topShelf = new THREE.Mesh(horizGeom, primaryMaterial);
    topShelf.position.y = SHELF_HEIGHT / 2 - BOARD_THICKNESS / 2;
    const bottomShelf = topShelf.clone();
    bottomShelf.position.y = -SHELF_HEIGHT / 2 + BOARD_THICKNESS / 2;
    group.add(topShelf, bottomShelf);

    const vertDividerGeom = new THREE.BoxGeometry(
      BOARD_THICKNESS,
      SHELF_HEIGHT - BOARD_THICKNESS,
      SHELF_DEPTH
    );
    for (let i = 1; i < NUM_COLS; i++) {
      const divider = new THREE.Mesh(vertDividerGeom, primaryMaterial);
      divider.position.x = -SHELF_WIDTH / 2 + (i * SHELF_WIDTH) / NUM_COLS;
      group.add(divider);
    }

    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.3,
    });

    const SHELF_INNER_W =
      (SHELF_WIDTH - (NUM_COLS + 1) * BOARD_THICKNESS) / NUM_COLS;
    const SHELF_INNER_H =
      (SHELF_HEIGHT - (TOTAL_ROWS + 1) * BOARD_THICKNESS) / TOTAL_ROWS;
    const drawerCenterY =
      SHELF_HEIGHT / 2 -
      ((TOTAL_ROWS - 1) * SHELF_HEIGHT) / TOTAL_ROWS -
      SHELF_INNER_H / 2 -
      BOARD_THICKNESS / 2;
    const drawerFaceGeom = new THREE.BoxGeometry(
      SHELF_INNER_W,
      SHELF_INNER_H,
      BOARD_THICKNESS / 2
    );
    const handleGeom = new THREE.BoxGeometry(
      SHELF_INNER_W * 0.5,
      BOARD_THICKNESS / 4,
      BOARD_THICKNESS
    );

    for (let i = 0; i < NUM_COLS; i++) {
      const drawerGroup = new THREE.Group();
      drawerGroup.position.y = drawerCenterY;
      drawerGroup.position.x =
        -SHELF_WIDTH / 2 +
        (i * SHELF_WIDTH) / NUM_COLS +
        SHELF_WIDTH / NUM_COLS / 2;

      const drawerFace = new THREE.Mesh(drawerFaceGeom, secondaryMaterial);
      drawerFace.position.z = SHELF_DEPTH / 2 - BOARD_THICKNESS / 4;
      const handleMesh = new THREE.Mesh(handleGeom, handleMaterial);
      handleMesh.position.set(0, 0, SHELF_DEPTH / 2 + BOARD_THICKNESS / 2);
      drawerGroup.add(drawerFace, handleMesh);
      group.add(drawerGroup);
    }
    return group;
  };

  const createCoffeeTable = (primaryMaterial) => {
    const TABLE_WIDTH = 2.0,
      TABLE_HEIGHT = 0.8,
      TABLE_DEPTH = 1.0,
      LEG_THICKNESS = 0.1,
      TOP_THICKNESS = 0.08;
    const group = new THREE.Group();

    const topGeom = new THREE.BoxGeometry(
      TABLE_WIDTH,
      TOP_THICKNESS,
      TABLE_DEPTH
    );
    const topMesh = new THREE.Mesh(topGeom, primaryMaterial);
    topMesh.position.y = TABLE_HEIGHT / 2 - TOP_THICKNESS / 2;
    group.add(topMesh);

    const legGeom = new THREE.BoxGeometry(
      LEG_THICKNESS,
      TABLE_HEIGHT - TOP_THICKNESS,
      LEG_THICKNESS
    );
    const positions = [
      { x: TABLE_WIDTH / 2 - LEG_THICKNESS / 2, z: TABLE_DEPTH / 2 - LEG_THICKNESS / 2 },
      { x: -TABLE_WIDTH / 2 + LEG_THICKNESS / 2, z: TABLE_DEPTH / 2 - LEG_THICKNESS / 2 },
      { x: TABLE_WIDTH / 2 - LEG_THICKNESS / 2, z: -TABLE_DEPTH / 2 + LEG_THICKNESS / 2 },
      { x: -TABLE_WIDTH / 2 + LEG_THICKNESS / 2, z: -TABLE_DEPTH / 2 + LEG_THICKNESS / 2 },
    ];
    positions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeom, primaryMaterial);
      leg.position.set(pos.x, 0, pos.z);
      group.add(leg);
    });
    return group;
  };

  const createDecorativeBox = (primaryMaterial, secondaryMaterial) => {
    const BOX_SIZE = 1.5,
      BOX_HEIGHT = 0.5;
    const group = new THREE.Group();
    const baseGeom = new THREE.BoxGeometry(BOX_SIZE, BOX_HEIGHT, BOX_SIZE);
    const baseMesh = new THREE.Mesh(baseGeom, primaryMaterial);
    group.add(baseMesh);

    const latticeGroup = new THREE.Group();
    const pieceGeom = new THREE.BoxGeometry(BOX_SIZE * 1.1, 0.02, 0.04);
    for (let i = 0; i < 24; i++) {
      const piece = new THREE.Mesh(pieceGeom, secondaryMaterial);
      piece.rotation.y = (i / 24) * Math.PI * 2;
      latticeGroup.add(piece);
    }
    latticeGroup.position.y = BOX_HEIGHT / 2 + 0.02;
    group.add(latticeGroup);
    return group;
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      <div className="p-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Interactive 3D Product Viewer</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeProduct === "shelf"
            ? "Click and drag to rotate. Click a drawer to open it!"
            : "Click and drag to rotate the product."}
        </p>
      </div>

      {/* Product Buttons */}
      <div className="absolute top-24 left-6 z-10 flex flex-col space-y-2">
        {["shelf", "table", "box"].map((type) => (
          <button
            key={type}
            onClick={() => setActiveProduct(type)}
            className={`px-4 py-2 rounded-lg shadow-md focus:outline-none ${
              activeProduct === type
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {type === "shelf"
              ? "Shelving Unit"
              : type === "table"
              ? "Coffee Table"
              : "Decorative Box"}
          </button>
        ))}
      </div>

      {/* Color Controls */}
      <div
        id="controls-panel"
        className="absolute top-5 right-5 p-4 bg-white/90 rounded-md shadow-md space-y-3"
      >
        <h2 className="text-lg font-bold">Customize</h2>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Primary Color:
          </label>
          <input
            type="color"
            value={colors.primary}
            onChange={(e) =>
              setColors((prev) => ({ ...prev, primary: e.target.value }))
            }
            className="w-full h-8 border rounded"
          />
        </div>
        {(activeProduct === "shelf" || activeProduct === "box") && (
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Secondary Color:
            </label>
            <input
              type="color"
              value={colors.secondary}
              onChange={(e) =>
                setColors((prev) => ({ ...prev, secondary: e.target.value }))
              }
              className="w-full h-8 border rounded"
            />
          </div>
        )}
      </div>

      {/* 3D Scene */}
      <div
        ref={containerRef}
        id="scene-container"
        className="w-screen h-[80vh] flex justify-center items-center"
      />
    </div>
  );
};

export default ProductViewer;
