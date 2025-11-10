import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

function Visualize3D({ model }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Responsive sizing
    const width = currentMount.clientWidth || 800;
    const height = currentMount.clientHeight || 480;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(8, 5, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Room geometry
    const roomGeometry = new THREE.BoxGeometry(10, 6, 10);
    const roomMaterial = new THREE.MeshLambertMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const room = new THREE.Mesh(roomGeometry, roomMaterial);
    scene.add(room);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xd1d5db });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3;
    floor.receiveShadow = true;
    scene.add(floor);

    // Lighting
    scene.add(new THREE.AmbientLight(0x404040, 0.6));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Controls: rotation & zoom
    let isRotating = false;
    let previousMousePosition = { x: 0, y: 0 };
    let zoom = 12; // Camera distance, smaller = closer

    const minZoom = 6, maxZoom = 40;

    const onMouseDown = (event) => {
      isRotating = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event) => {
      if (isRotating) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaMove.x * 0.01;
        spherical.phi += deltaMove.y * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        spherical.radius = zoom;
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };

    const onMouseUp = () => {
      isRotating = false;
    };

    // Zoom handler
    const onWheel = (event) => {
      event.preventDefault();
      // event.deltaY > 0 is zooming out
      zoom += event.deltaY * 0.01;
      zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.radius = zoom;
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animate
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);

      cancelAnimationFrame(animationId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [model]);

  return (
    <div className="bg-gray-100 rounded-lg overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-96 flex items-center justify-center"
        style={{ width: "100%", height: "480px", minHeight: "360px" }}
      />
      <div className="p-4 bg-white border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Click and drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
}

export default Visualize3D;
