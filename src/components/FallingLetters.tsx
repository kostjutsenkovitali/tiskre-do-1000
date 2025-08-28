// src/components/FallingLetters.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as CANNON from "cannon-es";
// If you want to merge multiple child meshes into one for the collider, uncomment:
// import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Props = {
  letterModels: string[];          // e.g. ["/letters/A.glb", "/letters/B.glb", ...]
  height?: number | string;        // canvas container height
  groundSize?: number;             // visual ground plane size (meters)
};

export default function FallingLetters({
  letterModels,
  height = "70vh",
  groundSize = 8,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    // @ts-ignore older three fallback
    renderer.outputColorSpace = THREE.SRGBColorSpace ?? renderer.outputEncoding;
    container.appendChild(renderer.domElement);

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 4.5, 10);
    camera.lookAt(0, 1, 0);
    scene.add(camera);

    // --- Lights ---
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    scene.add(dir);

    // --- Cannon world ---
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Materials (friction/bounce)
    const matGround = new CANNON.Material("ground");
    const matLetter = new CANNON.Material("letter");
    world.addContactMaterial(
      new CANNON.ContactMaterial(matGround, matLetter, {
        friction: 0.5,
        restitution: 0.1, // lower = less bouncy
      })
    );
    world.addContactMaterial(
      new CANNON.ContactMaterial(matLetter, matLetter, {
        friction: 0.6,
        restitution: 0.05,
      })
    );

    // --- Ground (visual) ---
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.1,
      roughness: 0.9,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotateX(-Math.PI / 2);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // --- Ground (physics) ---
    const groundBody = new CANNON.Body({
      mass: 0,
      material: matGround,
      shape: new CANNON.Plane(),
    });
    // rotate plane so its normal points up (Y+)
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // --- Optional walls to contain pile ---
    const wallH = 2.5;
    const wallT = 0.2;
    const half = groundSize / 2;
    const wallShape = new CANNON.Box(new CANNON.Vec3(half, wallH, wallT));
    const mkWall = (x: number, z: number, rotY: number) => {
      const b = new CANNON.Body({ mass: 0, material: matGround });
      b.addShape(wallShape);
      b.position.set(x, wallH, z);
      b.quaternion.setFromEuler(0, rotY, 0);
      world.addBody(b);
    };
    mkWall(0, -half, 0);              // back
    mkWall(0, half, 0);               // front
    mkWall(-half, 0, Math.PI / 2);    // left
    mkWall(half, 0, Math.PI / 2);     // right

    // --- GLTF loader(s) ---
    const loader = new GLTFLoader();
    // If your GLBs are DRACO-compressed, enable this:
    try {
      const draco = new DRACOLoader();
      draco.setDecoderPath("/draco/"); // put decoder files in /public/draco/
      loader.setDRACOLoader(draco);
    } catch {}

    // Utility: create a Cannon Trimesh from a Three BufferGeometry
    function trimeshFromGeometry(geom: THREE.BufferGeometry): CANNON.Trimesh {
      // Ensure geometry is indexed
      const g = geom.index ? geom : geom.toNonIndexed();
      const pos = g.attributes.position.array as Float32Array;
      const idx = g.index!.array as Uint16Array | Uint32Array | number[];
      // Trimesh expects flat arrays
      const vertices = new Float32Array(pos); // already flat
      const indices =
        idx instanceof Uint16Array || idx instanceof Uint32Array
          ? idx
          : new Uint32Array(idx);
      return new CANNON.Trimesh(vertices, indices);
    }

    // Fallback simple box collider from bounding box
    function boxShapeFromGeometry(geom: THREE.BufferGeometry): CANNON.Box {
      geom.computeBoundingBox();
      const bb = geom.boundingBox!;
      const sx = (bb.max.x - bb.min.x) / 2;
      const sy = (bb.max.y - bb.min.y) / 2;
      const sz = (bb.max.z - bb.min.z) / 2;
      return new CANNON.Box(new CANNON.Vec3(Math.max(sx, 0.001), Math.max(sy, 0.001), Math.max(sz, 0.001)));
    }

    // Map physics bodies to meshes
    const letterPairs: { mesh: THREE.Object3D; body: CANNON.Body }[] = [];

    // Loader for each letter GLB
    const loadLetters = async () => {
      for (let i = 0; i < letterModels.length; i++) {
        const url = letterModels[i];
        await new Promise<void>((resolve, reject) => {
          loader.load(
            url,
            (gltf) => {
              // Find/collect meshes under the scene
              const root = gltf.scene;
              root.traverse((o) => {
                if ((o as THREE.Mesh).isMesh) {
                  const m = o as THREE.Mesh;
                  m.castShadow = true;
                  m.receiveShadow = false;
                }
              });

              // If your GLB has multiple child meshes, you can:
              // A) use the whole group visually, and
              // B) build a single collider from the BIGGEST mesh (simple), or
              // C) build a Trimesh from the first visible mesh, or
              // D) merge geometries (commented—needs BufferGeometryUtils).
              let targetMesh: THREE.Mesh | null = null;
              root.traverse((o) => {
                if ((o as THREE.Mesh).isMesh && !targetMesh) targetMesh = o as THREE.Mesh;
              });
              if (!targetMesh) { resolve(); return; }

              // Optional global scale if your letters are tiny/huge
              const GLOBAL_SCALE = 1; // tweak if needed
              root.scale.setScalar(GLOBAL_SCALE);

              // Visual placement (we’ll sync to physics every frame)
              scene.add(root);

              // Physics body
              const body = new CANNON.Body({
                mass: 1.2,                 // heavier = less bounce
                material: matLetter,
                linearDamping: 0.01,
                angularDamping: 0.02,
                allowSleep: true,
                sleepSpeedLimit: 0.15,
                sleepTimeLimit: 0.5,
              });

              // Collider: try precise Trimesh, fall back to Box if degenerate
              let shape: CANNON.Shape;
              try {
                shape = trimeshFromGeometry(targetMesh.geometry as THREE.BufferGeometry);
                // If letter is very thin, you can thicken it visually (extrusion in the DCC)
                // or just rely on Trimesh which respects actual thickness.
              } catch {
                shape = boxShapeFromGeometry(targetMesh.geometry as THREE.BufferGeometry);
              }
              body.addShape(shape);

              // Randomized starting position above ground
              const spread = Math.min(groundSize * 0.35, 2.5);
              body.position.set(
                (Math.random() * 2 - 1) * spread,
                3 + Math.random() * 2 + i * 0.05, // stagger a bit
                (Math.random() * 2 - 1) * spread
              );
              body.quaternion.setFromEuler(
                Math.random() * 0.5,
                Math.random() * Math.PI * 2,
                Math.random() * 0.5
              );

              world.addBody(body);
              letterPairs.push({ mesh: root, body });
              resolve();
            },
            undefined,
            (err) => reject(err)
          );
        });
      }
    };

    // Kick off loads
    loadLetters().catch(console.error);

    // --- Animate ---
    let raf = 0;
    let last = performance.now();
    const fixedTimeStep = 1 / 60;

    function tick() {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000); // clamp
      last = now;

      // Step physics (you can substep for stability if needed)
      world.step(fixedTimeStep, dt, 3);

      // Sync Three mesh transforms from Cannon bodies
      for (const { mesh, body } of letterPairs) {
        mesh.position.set(body.position.x, body.position.y, body.position.z);
        mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
      }

      renderer.render(scene, camera);
    }
    tick();

    // --- Resize ---
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);
    window.addEventListener("resize", onResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      // optional: dispose geometries/materials/textures…
    };
  }, [letterModels, groundSize]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
