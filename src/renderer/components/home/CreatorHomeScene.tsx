import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Low-poly floating geometry scene for the Creator Home background.
 * - Pure three.js, no react-three-fiber needed
 * - Purple brand palette, low-intensity lighting
 * - Respects prefers-reduced-motion (pauses animation)
 * - Cleans up fully on unmount (no leaked contexts)
 */
export function CreatorHomeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Respect reduced-motion pref
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // ── Scene + camera ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0f0116, 8, 22);

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 10);

    // ── Renderer ────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Lighting ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x4a1e8a, 0.6));

    const keyLight = new THREE.DirectionalLight(0x8a5cf6, 1.1);
    keyLight.position.set(5, 6, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x907ab7, 0.5); // was 0x5c6aff
    rimLight.position.set(-6, -3, -4);

    scene.add(rimLight);

    // ── Materials: reusable, flat-shaded for low-poly look ──────────────
    const materials = [
      new THREE.MeshStandardMaterial({
        color: 0x51119d, // brand-700
        roughness: 0.4,
        metalness: 0.3,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x5a13b0, // brand-500
        roughness: 0.5,
        metalness: 0.2,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x907ab7, // brand-300
        roughness: 0.3,
        metalness: 0.5,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x6a1cc4, // deep violet — variation, still purple
        roughness: 0.4,
        metalness: 0.4,
        flatShading: true,
        emissive: 0x2a1050,
        emissiveIntensity: 0.3,
      }),
    ];

    // Wireframe variant for a couple of objects
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x907ab7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    // ── Geometries: a mixed set of low-poly primitives ──────────────────
    const geometries: THREE.BufferGeometry[] = [
      new THREE.IcosahedronGeometry(0.8, 0), // low-poly sphere
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.TetrahedronGeometry(0.9, 0),
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.DodecahedronGeometry(0.75, 0),
      new THREE.TorusGeometry(0.6, 0.22, 8, 16),
      new THREE.ConeGeometry(0.6, 1.2, 5),
    ];

    // ── Populate the scene — floating meshes on the right side ──────────
    type FloatingMesh = {
      mesh: THREE.Mesh;
      rotSpeed: THREE.Vector3;
      bobSpeed: number;
      bobAmp: number;
      basePos: THREE.Vector3;
    };

    const floaters: FloatingMesh[] = [];

    // Distribute floaters over the right side using a jittered grid.
    // Prevents the "cluster in one spot" problem of pure random placement.
    const COLS = 4; // horizontal cells
    const ROWS = 4; // vertical cells
    const X_MIN = 0.5,
      X_MAX = 7.5;
    const Y_MIN = -3.5,
      Y_MAX = 3.5;
    const Z_MIN = -5,
      Z_MAX = -1;
    const cellW = (X_MAX - X_MIN) / COLS;
    const cellH = (Y_MAX - Y_MIN) / ROWS;

    let i = 0;
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const geom = geometries[i % geometries.length];
        const useWire = i % 5 === 0;
        const mat = useWire ? wireMat : materials[i % materials.length];
        const mesh = new THREE.Mesh(geom, mat);

        // Cell-center + jitter (±45% of cell size) keeps them inside the cell
        const jitterX = (Math.random() - 0.5) * cellW * 0.9;
        const jitterY = (Math.random() - 0.5) * cellH * 0.9;

        const basePos = new THREE.Vector3(
          X_MIN + cellW * (col + 0.5) + jitterX,
          Y_MIN + cellH * (row + 0.5) + jitterY,
          Z_MIN + Math.random() * (Z_MAX - Z_MIN),
        );
        mesh.position.copy(basePos);

        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        );

        const scale = 0.55 + Math.random() * 0.6;
        mesh.scale.setScalar(scale);

        scene.add(mesh);
        floaters.push({
          mesh,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.006,
            (Math.random() - 0.5) * 0.006,
            (Math.random() - 0.5) * 0.004,
          ),
          bobSpeed: 0.3 + Math.random() * 0.4,
          bobAmp: 0.15 + Math.random() * 0.25,
          basePos,
        });
        i++;
      }
    }
    // ── Subtle starfield across the whole scene ─────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starCount = 80;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -5 + Math.random() * 4;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x907ab7,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── Resize handler ──────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    // ── Animation loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();

    const tick = () => {
      const t = clock.getElapsedTime();

      if (!reduceMotion) {
        for (const f of floaters) {
          f.mesh.rotation.x += f.rotSpeed.x;
          f.mesh.rotation.y += f.rotSpeed.y;
          f.mesh.rotation.z += f.rotSpeed.z;
          f.mesh.position.y = f.basePos.y + Math.sin(t * f.bobSpeed) * f.bobAmp;
        }
        // Slow camera orbit — barely perceptible, adds depth
        camera.position.x = Math.sin(t * 0.08) * 0.4;
        camera.position.y = Math.cos(t * 0.06) * 0.2;
        camera.lookAt(0, 0, 0);

        stars.rotation.y = t * 0.02;
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();

      floaters.forEach(({ mesh }) => {
        scene.remove(mesh);
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      wireMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
