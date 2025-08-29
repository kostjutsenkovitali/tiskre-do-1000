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
  },
  ref
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const mixerRef = useRef<THREE.AnimationMixer>();
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const clipsRef = useRef<THREE.AnimationClip[]>([]);
  const clockRef = useRef(new THREE.Clock());
  const rootRef = useRef<THREE.Object3D | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.6, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 3, 2);
    scene.add(dir);

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
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

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
