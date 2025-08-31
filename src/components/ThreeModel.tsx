"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

export type ThreeModelHandle = {
  play: (clipName?: string, fadeIn?: number) => void;
  stop: (fadeOut?: number) => void;
  setSpeed: (speed: number) => void;
  playChild: (childName: string, opts?: { fadeIn?: number; procedural?: boolean }) => void;
  getScene: () => THREE.Scene | null;
};

type Props = {
  // New API
  src?: string;
  dracoDecoderPath?: string;
  className?: string;
  initialClip?: string;
  // Back-compat props (used in Header)
  modelPath?: string;
  height?: number | string;
  /** If true, render with an OrthographicCamera and unlit materials for a flat 2D look */
  flat?: boolean;
  /** Additional scale multiplier applied after fitting (1 = original fit) */
  scale?: number;
  /** Optional union bbox from INC files to align GLB to absolute zero in world space */
  fitBBox?: { xmin: number; ymin: number; xmax: number; ymax: number };
  /** World-space origin (x,y,z) to place model against; defaults to [0,0,0] */
  origin?: [number, number, number];
};

export default forwardRef<ThreeModelHandle, Props>(function ThreeModel(
  {
    src,
    // Use hosted DRACO decoders by default to avoid 404s when local files are missing
    dracoDecoderPath = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
    className,
    initialClip,
    modelPath,
    height,
    flat = false,
    scale = 1,
    fitBBox,
    origin = [0, 0, 0],
  },
  ref
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const perspRef = useRef<THREE.PerspectiveCamera>();
  const orthoRef = useRef<THREE.OrthographicCamera>();
  const mixerRef = useRef<THREE.AnimationMixer>();
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const clipsRef = useRef<THREE.AnimationClip[]>([]);
  const clockRef = useRef(new THREE.Clock());
  const rootRef = useRef<THREE.Object3D | null>(null);
  const [ready, setReady] = useState(false);

  // Helper to center and fit in ortho camera for flat mode (used when no fitBBox provided)
  function centerAlignAndFit(target: THREE.Object3D, frustumH: number, isFlat: boolean) {
    if (!isFlat) return;
    const box = new THREE.Box3().setFromObject(target);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    target.position.x -= center.x;
    target.position.y -= center.y;
    target.position.z -= center.z;
    const scaleBy = (frustumH * 0.9) / Math.max(1e-6, size.y);
    target.scale.setScalar(scaleBy);
  }

  // Helper to center and fit object for a PerspectiveCamera within the mount element
  function fitInPerspective(mount: HTMLDivElement, camera: THREE.PerspectiveCamera, target: THREE.Object3D, padding = 1.05) {
    // 1) Compute bounds
    const box = new THREE.Box3().setFromObject(target);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 2) Recenter model at origin
    target.position.x -= center.x;
    target.position.y -= center.y;
    target.position.z -= center.z;

    // 3) Compute distances to fit width/height
    const w = Math.max(1, mount.clientWidth);
    const h = Math.max(1, mount.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const distY = (size.y / 2) / Math.tan(vFov / 2);
    const distX = (size.x / 2) / Math.tan(hFov / 2);
    const distance = padding * Math.max(distX, distY);

    // 4) Place camera on +Z looking at origin
    camera.position.set(0, 0, distance + Math.max(0, size.z / 2));
    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance * 10 + size.z;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera setup
    let camera: THREE.Camera;
    const FRUSTUM_H = 3; // world units tall for ortho fit
    if (flat) {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      const aspect = w / h;
      const ortho = new THREE.OrthographicCamera(
        (-FRUSTUM_H * aspect) / 2,
        (FRUSTUM_H * aspect) / 2,
        FRUSTUM_H / 2,
        -FRUSTUM_H / 2,
        0.1,
        1000
      );
      ortho.position.set(0, 0, 10);
      ortho.lookAt(0, 0, 0);
      camera = ortho;
      orthoRef.current = ortho;
    } else {
      const persp = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      persp.position.set(0, 0.6, 2);
      camera = persp;
      perspRef.current = persp;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    mount.appendChild(renderer.domElement);

    if (!flat) {
      scene.add(new THREE.AmbientLight(0xffffff, 1));
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(2, 3, 2);
      scene.add(dir);
    }

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath(dracoDecoderPath);
    // Some versions expose setWasmPath; set both for compatibility
    // @ts-ignore optional API
    if (typeof (draco as any).setWasmPath === "function") {
      // @ts-ignore
      (draco as any).setWasmPath(dracoDecoderPath);
    }
    draco.preload?.();
    loader.setDRACOLoader(draco);

    let raf = 0;

    loader.load(
      src || modelPath || "",
      (gltf) => {
        const model = gltf.scene;
        rootRef.current = model;
        model.traverse((o) => {
          if (!o.name) o.name = o.uuid;
          // Replace materials with unlit for flat mode
          if (flat && (o as any).isMesh) {
            const mesh = o as THREE.Mesh;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const basicMaterials = materials.map((m: any) => {
              const mat = new THREE.MeshBasicMaterial({
                map: m?.map || null,
                color: m?.color ? (m.color as THREE.Color).getHex() : 0xffffff,
                transparent: m?.transparent || false,
                opacity: typeof m?.opacity === "number" ? m.opacity : 1,
              });
              return mat;
            });
            mesh.material = Array.isArray(mesh.material) ? (basicMaterials as any) : (basicMaterials[0] as any);
          }
        });
        scene.add(model);

        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;
        clipsRef.current = gltf.animations || [];

        if (clipsRef.current.length) {
          const wanted =
            (initialClip && clipsRef.current.find((c) => c.name === initialClip)) ||
            clipsRef.current[0];
          const action = mixer.clipAction(wanted);
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
          currentActionRef.current = action;
        }

        // For flat mode with absolute world alignment (fitBBox provided):
        if (flat && fitBBox) {
          // Compute model bounds
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const worldW = Math.max(1e-6, fitBBox.xmax - fitBBox.xmin);
          const worldH = Math.max(1e-6, fitBBox.ymax - fitBBox.ymin);
          const sx = worldW / Math.max(1e-6, size.x);
          const sy = worldH / Math.max(1e-6, size.y);
          const s = Math.min(sx, sy);
          const sz = s * 0.001; // keep z tiny for flatness
          model.scale.multiply(new THREE.Vector3(s, s, sz));
          // Recompute and place model so its min corner is at origin
          const scaled = new THREE.Box3().setFromObject(model);
          const min = scaled.min.clone();
          model.position.x += -min.x + origin[0];
          model.position.y += -min.y + origin[1];
          model.position.z += -min.z + origin[2];
        } else if (flat) {
          // Default flat fit behavior (no absolute alignment)
          centerAlignAndFit(model, FRUSTUM_H, flat);
          if (typeof scale === "number" && scale !== 1) {
            model.scale.multiplyScalar(scale);
          }
        } else {
          // Fit for perspective camera
          if (perspRef.current) {
            fitInPerspective(mount, perspRef.current, model, 1.08);
          }
          if (typeof scale === "number" && scale !== 1) {
            model.scale.multiplyScalar(scale);
            if (perspRef.current) fitInPerspective(mount, perspRef.current, model, 1.08);
          }
        }

        setReady(true);
      },
      undefined,
      (e) => {
        console.error("GLB load error:", e);
        setReady(true);
      }
    );

    const onFrame = () => {
      raf = requestAnimationFrame(onFrame);
      const dt = clockRef.current.getDelta();
      mixerRef.current?.update(dt);
      renderer.render(scene, camera);
    };
    onFrame();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      if (orthoRef.current) {
        if (fitBBox) {
          // Map camera frustum directly to world extents so (0,0) is consistent
          orthoRef.current.left = fitBBox.xmin;
          orthoRef.current.right = fitBBox.xmax;
          orthoRef.current.top = fitBBox.ymax;
          orthoRef.current.bottom = fitBBox.ymin;
          orthoRef.current.updateProjectionMatrix();
        } else {
          const a = Math.max(1e-6, w / h);
          orthoRef.current.left = (-FRUSTUM_H * a) / 2;
          orthoRef.current.right = (FRUSTUM_H * a) / 2;
          orthoRef.current.top = FRUSTUM_H / 2;
          orthoRef.current.bottom = -FRUSTUM_H / 2;
          orthoRef.current.updateProjectionMatrix();
          const target = rootRef.current;
          if (target) centerAlignAndFit(target, FRUSTUM_H, flat);
        }
      } else if (perspRef.current) {
        perspRef.current.aspect = w / h;
        perspRef.current.updateProjectionMatrix();
        const target = rootRef.current;
        if (target) fitInPerspective(mount, perspRef.current, target, 1.08);
      }
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    rendererRef.current = renderer;
    sceneRef.current = scene;

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      mixerRef.current?.stopAllAction();
      scene.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.();
          if (obj.material?.dispose) obj.material.dispose();
        }
      });
    };
  }, [src, modelPath, dracoDecoderPath, initialClip]);

  function makeSubclipForChild(childName: string): THREE.AnimationClip | null {
    const clips = clipsRef.current;
    if (!clips.length) return null;
    const tracks: THREE.KeyframeTrack[] = [];
    for (const clip of clips) {
      for (const t of clip.tracks) {
        if (t.name.startsWith(childName + ".")) {
          tracks.push(t);
        }
      }
    }
    if (!tracks.length) return null;
    return new THREE.AnimationClip(`${childName}__derived`, -1, tracks);
  }

  function makeProceduralSpin(child: THREE.Object3D): THREE.AnimationClip {
    const times = [0, 0.75, 1.5];
    const values = [0, Math.PI, Math.PI * 2];
    const track = new THREE.NumberKeyframeTrack(`${child.name}.rotation[y]`, times, values);
    return new THREE.AnimationClip(`${child.name}__spin`, 1.5, [track]);
  }

  function playAction(clip: THREE.AnimationClip, fadeIn = 0.2) {
    if (!mixerRef.current) return;
    const action = mixerRef.current.clipAction(clip);
    action.reset().setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    const prev = currentActionRef.current;
    if (prev && prev !== action) prev.fadeOut(fadeIn);
    action.fadeIn(fadeIn).play();
    currentActionRef.current = action;
  }

  useImperativeHandle(ref, () => ({
    getScene: () => sceneRef.current || null,
    play: (clipName?: string, fadeIn = 0.2) => {
      if (!mixerRef.current) return;
      const clips = clipsRef.current;
      const clip = clipName ? clips.find((c) => c.name === clipName) : clips[0];
      if (!clip) return;
      playAction(clip, fadeIn);
    },
    stop: (fadeOut = 0.2) => {
      currentActionRef.current?.fadeOut(fadeOut);
    },
    setSpeed: (speed: number) => {
      if (mixerRef.current) mixerRef.current.timeScale = speed;
    },
    playChild: (childName: string, opts) => {
      const fadeIn = opts?.fadeIn ?? 0.2;
      const root = rootRef.current;
      if (!root) return;
      const child = root.getObjectByName(childName);
      if (!child) {
        console.warn(`[ThreeModel] Child '${childName}' not found in GLB.`);
        return;
      }
      const sub = makeSubclipForChild(childName);
      if (sub) {
        playAction(sub, fadeIn);
        return;
      }
      if (opts?.procedural) {
        const spin = makeProceduralSpin(child);
        playAction(spin, fadeIn);
      } else {
        console.warn(`[ThreeModel] No tracks found for '${childName}'. Pass {procedural:true} to generate a simple spin.`);
      }
    },
  }));

  return (
    <div
      className={className}
      ref={mountRef}
      style={{ width: "100%", height: height ?? "100%" }}
      aria-busy={!ready}
    />
  );
});
