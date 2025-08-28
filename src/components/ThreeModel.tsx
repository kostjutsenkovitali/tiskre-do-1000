// src/components/ThreeModel.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

type Props = {
  modelPath: string;              // e.g. "/models/thing.glb"
  height?: number | string;       // container height, e.g. "60vh"
  /** Where to place the model vertically after centering to bounds */
  align?: "center" | "bottom" | "top";
  /** Extra vertical offset in world units: negative = move down, positive = up */
  yOffset?: number;
  /**
   * How tightly to fit the model's height into the ortho frustum height.
   * 1 = exact fit; 0.9 = 10% padding. Default 0.9
   */
  fitPadding?: number;
  /** Optional background color (null => transparent) */
  background?: number | null;
};

export default function ThreeModel({
  modelPath,
  height = "60vh",
  align = "center",
  yOffset = 0,
  fitPadding = 0.9,
  background = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ----- Renderer -----
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: background === null });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    // @ts-ignore compat across three versions
    renderer.outputColorSpace = THREE.SRGBColorSpace ?? renderer.outputEncoding;
    container.appendChild(renderer.domElement);

    // ----- Scene & Camera (Orthographic for flat look) -----
    const scene = new THREE.Scene();
    if (background !== null) scene.background = new THREE.Color(background);

    // We use a fixed "frustum height" in world units; width depends on aspect.
    const FRUSTUM_H = 3; // world units tall
    const aspect = Math.max(1e-6, container.clientWidth / container.clientHeight);
    const camera = new THREE.OrthographicCamera(
      (-FRUSTUM_H * aspect) / 2,
      (FRUSTUM_H * aspect) / 2,
      FRUSTUM_H / 2,
      -FRUSTUM_H / 2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // ----- Lights -----
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    // ----- Loaders -----
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    const DRACO_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";
    draco.setDecoderPath(DRACO_PATH);
    // @ts-ignore optional API
    if (typeof (draco as any).setWasmPath === "function") {
      // @ts-ignore
      (draco as any).setWasmPath(DRACO_PATH);
    } else {
      draco.setDecoderConfig({ type: "wasm" });
    }
    draco.preload();
    loader.setDRACOLoader(draco);

    let root: THREE.Object3D | null = null;

    // ---- Fit, center, and align model (key for centering + vertical shifting) ----
    function centerAlignAndFit(target: THREE.Object3D) {
      // 1) Compute bounds in current scale
      const box = new THREE.Box3().setFromObject(target);
      if (box.isEmpty()) return;

      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // 2) First, move model so its center is at the origin (0,0,0)
      target.position.x -= center.x;
      target.position.y -= center.y;
      target.position.z -= center.z;

      // 3) Scale to fit the height of the ortho frustum with padding
      // Ortho height visible = FRUSTUM_H; we keep a margin via fitPadding
      const pad = THREE.MathUtils.clamp(fitPadding, 0.1, 1.0); // safety
      const scaleBy = (FRUSTUM_H * pad) / Math.max(1e-6, size.y);
      target.scale.setScalar(scaleBy);

      // 4) Recompute bounds after scaling & re-centering to know min/max/center
      const box2 = new THREE.Box3().setFromObject(target);
      const min = box2.min.clone();
      const max = box2.max.clone();
      const c2 = box2.getCenter(new THREE.Vector3());

      // 5) Align vertically per prop
      if (align === "bottom") {
        // Put min.y at y = -FRUSTUM_H/2 * pad  (a bit above bottom, still safe)
        const desiredMin = -FRUSTUM_H * 0.5 * pad;
        const delta = desiredMin - min.y;
        target.position.y += delta;
      } else if (align === "top") {
        const desiredMax = FRUSTUM_H * 0.5 * pad;
        const delta = desiredMax - max.y;
        target.position.y += delta;
      } else {
        // "center": keep the model centered at origin (already done above),
        // but if the scaled center drifted, correct it
        target.position.y -= c2.y;
      }

      // 6) Apply extra user offset (negative moves down, positive up)
      if (yOffset) target.position.y += yOffset;
    }

    // Keep camera frustum in sync with container aspect
    function updateCamera() {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      const a = w / h;
      camera.left = (-FRUSTUM_H * a) / 2;
      camera.right = (FRUSTUM_H * a) / 2;
      camera.top = FRUSTUM_H / 2;
      camera.bottom = -FRUSTUM_H / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);

      // Re-fit model to the updated frustum (keeps it centered after resize)
      if (root) centerAlignAndFit(root);
      render();
    }

    // Render loop
    let raf = 0;
    const render = () => renderer.render(scene, camera);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      render();
    };
    tick();

    // Load model
    loader.load(
      modelPath,
      (gltf) => {
        root = gltf.scene;
        scene.add(root);
        centerAlignAndFit(root);
        render();
      },
      undefined,
      (err) => console.error("Failed to load GLB", err)
    );

    // Resize handling
    const ro = new ResizeObserver(updateCamera);
    ro.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();

      if (root) {
        root.traverse((o: any) => {
          o.geometry?.dispose?.();
          const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
          mats.forEach((m: any) => {
            m.map?.dispose?.();
            m.normalMap?.dispose?.();
            m.roughnessMap?.dispose?.();
            m.metalnessMap?.dispose?.();
            m.dispose?.();
          });
        });
        scene.remove(root);
        root = null;
      }

      draco.dispose?.();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelPath, align, yOffset, fitPadding, background]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
