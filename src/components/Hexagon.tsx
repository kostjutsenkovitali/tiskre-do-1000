// src/components/Hexagon.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import { bus } from "@/utils/visibilityBus";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { sf } from "@/lib/shopify";
import { GET_BLOG_WITH_ARTICLES, LIST_ARTICLES } from "@/lib/queries/blog";
import { SHOPIFY_BLOG_HANDLE } from "@/lib/shopify";
import { usePathname } from "next/navigation";
import { articlePath, detectLocaleFromPath } from "@/lib/paths";
import { useI18n } from "@/contexts/I18nProvider";
import { languageToShopify } from "@/i18n/config";

/* =========================================================
   Types
   ========================================================= */
type Article = {
  id?: string;
  handle: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  url: string;
};
type Slide = {
  id: string | number;
  title: string;
  quote: string;
  imageUrl: string;
  url: string;
};

// Props for the component
type HexagonProps = {
  initialSlides?: Slide[];
};

/* =========================================================
   Config
   ========================================================= */
// Vertical gradient from #f8f8f8 (top) to #b8c8c8 (bottom)
const GRADIENT_BG = "linear-gradient(to bottom, #f8f8f8 0%, #b8c8c8 100%)";

const FRAME_COLOR = "#9ca3af";
const FRAME_THICKNESS_PX = 4;
const SHOW_DEBUG_ORBIT = false;

// 3× bigger object (3D payload)
const OBJECT_SCALE_MULT = 3;

/* =========================================================
   Tiny helpers for HTML content
   ========================================================= */
const LABEL_STYLE = {
  color: "white",
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: "uppercase" as const,
};
const TITLE_STYLE = { color: "white", fontWeight: 800, lineHeight: 1.1 };
const QUOTE_STYLE = { color: "white", fontWeight: 500, lineHeight: 1.35 };

/* =========================================================
   Debug (optional)
   ========================================================= */
function OrbitDebug({
  a, b, y, onChange,
}: {
  a: number; b: number; y: number;
  onChange: (a: number, b: number, y: number) => void;
}) {
  if (!SHOW_DEBUG_ORBIT) return null;
  return (
    <div style={{
      position: "fixed", right: 12, top: 12, zIndex: 4000, padding: 12,
      background: "rgba(15,15,15,0.9)", color: "#fff", borderRadius: 12,
      fontFamily: "monospace", fontSize: 12
    }}>
      <div style={{ marginBottom: 8, opacity: 0.85 }}>3D ORBIT</div>
      <label style={{ display: "block", marginBottom: 8 }}>
        a = {a.toFixed(1)}
        <input type="range" min={1} max={30} step={0.1} value={a}
          onChange={(e) => onChange(parseFloat((e.target as HTMLInputElement).value), b, y)}
          style={{ width: 200 }} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        b = {b.toFixed(1)}
        <input type="range" min={1} max={30} step={0.1} value={b}
          onChange={(e) => onChange(a, parseFloat((e.target as HTMLInputElement).value), y)}
          style={{ width: 200 }} />
      </label>
      <label style={{ display: "block" }}>
        y (base) = {y.toFixed(2)}
        <input type="range" min={-6} max={6} step={0.05} value={y}
          onChange={(e) => onChange(a, b, parseFloat((e.target as HTMLInputElement).value))}
          style={{ width: 200 }} />
      </label>
    </div>
  );
}

// No scroll lock used for this flight

/* =========================================================
   Component
   ========================================================= */
export default function Hexagon({ initialSlides }: HexagonProps) {
  const sizingVars = { "--s": "clamp(240px, 40vmin, 600px)", "--scale": 1.2 } as CSSProperties;

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const { t } = useI18n();

  const [slides, setSlides] = useState<Slide[] | null>(initialSlides || null);
  const [index, setIndex] = useState(0);

  // Debugging: log when slides change
  useEffect(() => {
    console.log("Hexagon: slides updated", slides);
  }, [slides]);

  // Active ONLY when this section or footer visible (kept)
  const [hexVisible, setHexVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const activeRef = useRef(false);
  const orbitEnabledRef = useRef(false); // orbit paused until handoff
  const cloneOrbitRef = useRef(false); // when true, clone rides the ellipse
  const cloneRollRef = useRef(0); // gentle roll accumulator
  const bigHexVisibleRef = useRef(false); // big hex hidden during/after flight
  const flightRunningRef = useRef(false);
  const armedRef = useRef(true);
  useEffect(() => {
    activeRef.current = hexVisible || footerVisible;
    if (canvasRef.current) {
      const forced = (canvasRef.current as any).__forceVisible as boolean | undefined;
      if (!forced) canvasRef.current.style.opacity = activeRef.current ? "1" : "0";
    }
    // Notify footer reveal only when Hexagon itself becomes visible
    bus.emit("footer:reveal", hexVisible === true);
  }, [hexVisible, footerVisible]);

  /* ===== fetch posts (Shopify) - only if no initial slides provided ===== */
  useEffect(() => {
    // If we already have slides from props, don't fetch again
    if (initialSlides) {
      // If initialSlides is an empty array, we still want to set it to show the fallback
      setSlides(initialSlides);
      return;
    }
    
    let cancelled = false;
    (async () => {
      try {
        const locale = detectLocaleFromPath(pathname || "/");
        // Convert locale to Shopify language code using proper mapping
        const shopifyLanguage = languageToShopify[locale as keyof typeof languageToShopify] || "EN";
        console.log("Fetching blog posts for locale:", locale, "language:", shopifyLanguage);
        const preferred = await sf<{ blog?: { articles?: { nodes?: any[] } } }>(
          GET_BLOG_WITH_ARTICLES,
          { blogHandle: SHOPIFY_BLOG_HANDLE, first: 4, language: shopifyLanguage }
        );
        console.log("Preferred blog response:", preferred);
        let nodes = preferred?.blog?.articles?.nodes || [];
        if (!nodes.length) {
          console.log("No articles in preferred blog, trying list articles");
          const all = await sf<{ articles?: { nodes?: any[] } }>(LIST_ARTICLES, { first: 4, language: shopifyLanguage });
          console.log("List articles response:", all);
          nodes = all?.articles?.nodes || [];
        }
        console.log("Final nodes:", nodes);
        const items: Slide[] = nodes.slice(0, 4).map((n: any) => ({
          id: n.id || n.handle,
          title: n.title || "Untitled",
          quote: truncateForQuote(stripHtml(n.excerpt || "")),
          imageUrl: n.image?.url || "/placeholder.jpg",
          url: articlePath(locale, n.handle),
        }));
        console.log("Mapped items:", items);
        if (!cancelled) setSlides(items);
      } catch (e) {
        console.error("Hexagon: failed to load Shopify articles", e);
        if (!cancelled) setSlides([]);
      }
    })();
    return () => { cancelled = true; };
  }, [initialSlides, pathname]);

  useEffect(() => {
    if (!slides || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides]);

  const current = useMemo(
    () => {
      if (!slides || slides.length === 0) {
        // Return a fallback slide when no data is available
        return {
          id: "fallback",
          title: "No posts available",
          quote: "Please check back later for updates.",
          imageUrl: "/placeholder.jpg",
          url: "#"
        };
      }
      return slides[index % slides.length];
    },
    [slides, index]
  );

  // Debug chip for flight start signal
  const [flyDbg, setFlyDbg] = useState<{ ts: number; count: number } | null>(null);
  const [logoRectDbg, setLogoRectDbg] = useState<DOMRect | null>(null);
  const [targetRectDbg, setTargetRectDbg] = useState<DOMRect | null>(null);
  const [flightState, setFlightState] = useState<"idle" | "starting" | "flying" | "done">("idle");
  useEffect(() => {
    const offStart = bus.on("hex:logo-flyToHex:start", () => {
      setFlyDbg((p) => ({ ts: Date.now(), count: (p?.count || 0) + 1 }));
      // auto hide after 2.5s
      setTimeout(() => setFlyDbg((q) => (q && Date.now() - q.ts > 2000 ? null : q)), 2500);
      setFlightState("starting");
      setTimeout(() => setFlightState((s) => (s === "starting" ? "flying" : s)), 200);
    });
    const offDone = bus.on("header:logo-flyToHex:done", () => {
      setFlightState("done");
    });
    const offLogoRect = bus.on("header:logoRect", (r: any) => {
      try { setLogoRectDbg(r as DOMRect); } catch {}
    });
    const offTargetRect = bus.on("hex:targetRect", (r: any) => {
      try { setTargetRectDbg(r as DOMRect); } catch {}
    });
    return () => { offStart(); offDone(); offLogoRect(); offTargetRect(); };
  }, []);

  /* ===== Flight control: trigger when ≥97% visible, no scroll lock ===== */
  const lockYRef = useRef(0);
  useEffect(() => {
    const section = sectionRef.current; if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.97 && armedRef.current && !flightRunningRef.current) {
        // Debounce + request header rect
        setTimeout(() => {
          if (!armedRef.current || flightRunningRef.current) return;
          bus.emit("header:queryLogoRect");
          bus.emit("header:hideTinyLogo");
          bus.emit("hex:logo-flyToHex:start");
          armedRef.current = false;
        }, 300);
      }
    }, { threshold: 0.97 });
    observer.observe(section);
    // Re-arm when flight completes
    const offDone = bus.on("header:logo-flyToHex:done", () => { armedRef.current = true; });
    return () => { observer.disconnect(); offDone(); };
  }, []);

  // Visibility watchers: section + footer (kept)
  useEffect(() => {
    const sec = sectionRef.current;
    const footer = document.querySelector<HTMLElement>("footer");
    if (!sec) return;

    const opts: IntersectionObserverInit = { threshold: 0.1 };
    const ob1 = new IntersectionObserver(([entry]) => setHexVisible(!!entry?.isIntersecting), opts);
    ob1.observe(sec);

    let ob2: IntersectionObserver | null = null;
    if (footer) {
      ob2 = new IntersectionObserver(([entry]) => setFooterVisible(!!entry?.isIntersecting), opts);
      ob2.observe(footer);
    }
    return () => { ob1.disconnect(); ob2?.disconnect(); };
  }, []);

  /* =========================================================
     THREE SCENE
     ========================================================= */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;

    // Renderer (use layout viewport width to avoid 100vw scrollbar issue)
    const getW = () => document.documentElement.clientWidth || window.innerWidth;
    const getH = () => window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(getW(), getH(), false);
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = true;

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, getW() / getH(), 0.1, 1000);
    camera.position.set(0, 0, 22);
    camera.lookAt(0, 0, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(8, 10, 6);
    scene.add(dirLight);

    // Orbit groups
    const orbitPlane = new THREE.Group(); scene.add(orbitPlane);
    const flyer = new THREE.Group(); orbitPlane.add(flyer);
    const payload = new THREE.Group(); flyer.add(payload);

    // Dummy mesh (replaced by GLB when loaded)
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xdfe7ff, metalness: 0.2, roughness: 0.35 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.5, roughness: 0.6 });
    const shuttle = new THREE.Group();
    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 8, 16), hullMat); fuselage.rotation.z = Math.PI / 2; shuttle.add(fuselage);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.35, 20), darkMat); nose.position.x = 0.6; nose.rotation.z = -Math.PI / 2; shuttle.add(nose);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 16), darkMat); tail.position.x = -0.6; tail.rotation.z = Math.PI / 2; shuttle.add(tail);
    payload.add(shuttle);

    // GLB load (big hex in orbit)
    try {
      const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
      const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
      loader.load(
        "/hexagon/hex.glb",
        (gltf) => {
          const model = gltf.scene as THREE.Group;
          model.traverse((o: any) => {
            if (o.isMesh) { o.frustumCulled = false; if (o.material && 'side' in o.material) o.material.side = THREE.DoubleSide; }
          });
          // normalize and face +X
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3(); box.getSize(size);
          const s = 1.2 / Math.max(size.x, size.y, size.z, 1);
          model.scale.setScalar(s * 1.15);
          model.rotation.y = Math.PI / 2;
          payload.add(model);
          shuttle.visible = false;
          // Keep big hex visibility following our ref flag
          model.visible = !!bigHexVisibleRef.current;
          // Save a pointer if we later need to toggle
          (payload as any).__bigHex = model;
        },
        undefined as unknown as (e: ProgressEvent) => void,
        (err) => { console.warn("GLB load failed:", err); }
      );
    } catch (e) { console.error(e); }

    // Header logo prototype (loaded on first need): hextext.glb → child "hexblack-1"
    const logoPrototypeRef: { black?: THREE.Object3D | null; blue?: THREE.Object3D | null } = { black: null, blue: null };
    async function ensureLogoPrototype(): Promise<{ black?: THREE.Object3D; blue?: THREE.Object3D }> {
      if (logoPrototypeRef.black || logoPrototypeRef.blue) return logoPrototypeRef as any;
      return new Promise((resolve) => {
        try {
          const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
          const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
          loader.load(
            "/hexagon/hextext.glb",
            (gltf) => {
              const scene = gltf.scene;
              logoPrototypeRef.black = (scene.getObjectByName("hexblack-1") as THREE.Object3D) || undefined;
              logoPrototypeRef.blue  = (scene.getObjectByName("hexblue-1")  as THREE.Object3D) || undefined;
              resolve(logoPrototypeRef as any);
            },
            undefined as unknown as (e: ProgressEvent) => void,
            () => {
              // fallback: simple capsule
              const hull = new THREE.Mesh(
                new THREE.CapsuleGeometry(0.6, 1.0, 8, 16),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
              );
              logoPrototypeRef.black = hull;
              resolve(logoPrototypeRef as any);
            }
          );
        } catch {
          const g = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x999999 }));
          logoPrototypeRef.black = g;
          resolve(logoPrototypeRef as any);
        }
      });
    }

    // Flight state
    const flight = {
      running: false,
      clone: null as THREE.Object3D | null,
      t0: 0,
      dur: 3000,
      start: { pos: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) },
      end: { pos: new THREE.Vector3(0, 0.1, -0.6), scale: new THREE.Vector3(1.15,1.15,1.15) },
      cancelRequested: false,
    };

    // Helpers: map DOMRect center to world pos at given z using a ray
    function ndcFromClient(cx: number, cy: number) {
      const x = (cx / (getW() || 1)) * 2 - 1;
      const y = -(cy / (getH() || 1)) * 2 + 1;
      return new THREE.Vector2(x, y);
    }
    function worldAtZFromNdc(ndc: THREE.Vector2, zWorld: number): THREE.Vector3 {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      const t = (zWorld - ray.ray.origin.z) / ray.ray.direction.z;
      return ray.ray.at(t, new THREE.Vector3());
    }

    // Listen for rect events and store for debug and mapping
    let headerRect: DOMRect | null = null;
    let targetRect: DOMRect | null = null;
    const offLogoRect = bus.on("header:logoRect", (r: any) => { headerRect = r as DOMRect; });

    // Start flight (spawn clone and animate)
    async function startFlight() {
      if (flight.running) return;
      flight.cancelRequested = false;
      bus.emit("header:hideTinyLogo");

      // Pause orbit visuals
      orbitPlane.visible = false;

      // Set dynamic end target at closest-to-camera point, including vertical oscillation
      {
        const a = 20, b = 14.6, yOffset = -3.1; // keep in sync with orbit math
        const dist = camera.position.z;
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const worldH = 2 * Math.tan(vFov / 2) * dist;
        const ampWorld = (window.innerHeight * 0.15 / (window.innerHeight || 1)) * worldH;
        flight.end.pos.set(0, yOffset + ampWorld, b);
      }

      // Ensure prototypes (black/blue) and choose blue for flight
      const proto = await ensureLogoPrototype();
      // Ask header to suppress its own hexblack during flight
      bus.emit("header:suppressHexBlack");
      let cloneSrc: THREE.Object3D | undefined = proto.blue || proto.black;
      const clone = (cloneSrc ? cloneSrc.clone(true) : new THREE.Mesh(new THREE.SphereGeometry(0.6), new THREE.MeshStandardMaterial({ color: 0x3aa0ff }))) as THREE.Object3D;
      clone.visible = true;
      scene.add(clone);
      flight.clone = clone;

      // Wait briefly for headerRect if not present
      let rect = headerRect;
      if (!rect) {
        const giveUpAt = performance.now() + 200;
        while (!rect && performance.now() < giveUpAt) {
          await new Promise((r) => setTimeout(r, 40));
          rect = headerRect;
        }
      }
      rect = rect || new DOMRect(getW()/2 - 60, getH()/2 - 60, 120, 120);
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const ndc = ndcFromClient(cx, cy);
      const startPos = worldAtZFromNdc(ndc, 2.5); // slightly in front of scene
      clone.position.copy(startPos);
      clone.rotation.set(0, 0, 0);
      // Approximate start scale based on rect height vs viewport height
      const startScale = Math.max(0.4, Math.min(2.0, rect.height / (getH() || 1) * 4));
      clone.scale.setScalar(startScale);

      // Set end scale to 5× the start scale
      const endScale = startScale * 5;
      flight.end.scale.set(endScale, endScale, endScale);

      flight.start.pos.copy(clone.position);
      flight.start.scale.copy(clone.scale);
      flight.t0 = performance.now();
      flight.running = true;
      flightRunningRef.current = true;
      // Force canvas on top and visible
      canvas.style.zIndex = "9999";
      canvas.style.opacity = "1";
      (canvas as any).__forceVisible = true;
    }

    // Reset/cleanup flight
    function cancelFlight() {
      flight.cancelRequested = true;
      if (flight.clone) {
        scene.remove(flight.clone);
        (flight.clone as any) = null;
        flight.clone = null;
      }
      orbitPlane.visible = true;
      flight.running = false;
      flightRunningRef.current = false;
      // Restore canvas opacity management
      canvas.style.zIndex = "";
      (canvas as any).__forceVisible = false;
      canvas.style.opacity = activeRef.current ? "1" : "0";
      bus.emit("header:showTinyLogo");
    }

    const offStartSignal = bus.on("hex:logo-flyToHex:start", () => {
      // Interpret this as Hexagon’s own start signal
      startFlight();
    });
    const offReset = bus.on("header:resetLogoFlight", () => cancelFlight());

    // Resize (use layout viewport width)
    const onResize = () => {
      const w = getW(), h = getH();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    // Helpers
    const pxToWorldY = (px: number) => {
      const dist = camera.position.z;
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const worldH = 2 * Math.tan(vFov / 2) * dist;
      return (px / (window.innerHeight || 1)) * worldH;
    };

    // Animate
    const clock = new THREE.Clock();
    const REV_RATE = 0.0625; // rev/s
    let t = 0;
    let rafId = 0;

    const animate = () => {
      const dt = clock.getDelta();

      // Only advance orbit when not flying
      const active = activeRef.current && orbitEnabledRef.current && !flight.running;

      // Orbit math
      const { a, b, yOffset } = { a: 20, b: 14.6, yOffset: -3.1 }; // use state if you want live controls
      if (active) t = (t + dt * REV_RATE) % 1;
      const angle = t * Math.PI * 2;

      const x = a * Math.cos(angle);
      const z = b * Math.sin(angle);
      flyer.position.set(x, 0, z);

      // tilt by x position
      const tiltDeg = -15 * (x / (a || 1));
      orbitPlane.rotation.set(0, 0, THREE.MathUtils.degToRad(tiltDeg));

      // vertical oscillation
      const ampWorld = pxToWorldY(window.innerHeight * 0.15);
      orbitPlane.position.y = yOffset + Math.sin(angle) * ampWorld;

      // face along tangent
      const tx = -a * Math.sin(angle);
      const tz =  b * Math.cos(angle);
      flyer.rotation.y = Math.atan2(tz, tx);

      // gentle roll
      payload.rotation.z += dt * 0.3;

      // depth scale and z-index flip
      const depth01 = (z / (b || 1) + 1) / 2; // 0..1
      const scale = (0.8 + 0.7 * depth01) * OBJECT_SCALE_MULT;
      payload.scale.setScalar(scale);

      if (canvasRef.current) canvasRef.current.style.zIndex = z >= 0 ? "9999" : "0";

      // Flight animation
      if (flight.running && flight.clone) {
        const now = performance.now();
        const t01 = Math.min(1, (now - flight.t0) / flight.dur);
        const ease = (t: number) => (t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2);
        const k = ease(t01);

        // Quadratic Bezier control point for a slight upward arc
        const p0 = flight.start.pos;
        const p2 = flight.end.pos;
        const ctrl = new THREE.Vector3((p0.x + p2.x) / 2, Math.max(p0.y, p2.y) + 1.2, (p0.z + p2.z) / 2);
        const p = new THREE.Vector3().set(
          (1 - k) * (1 - k) * p0.x + 2 * (1 - k) * k * ctrl.x + k * k * p2.x,
          (1 - k) * (1 - k) * p0.y + 2 * (1 - k) * k * ctrl.y + k * k * p2.y,
          (1 - k) * (1 - k) * p0.z + 2 * (1 - k) * k * ctrl.z + k * k * p2.z
        );
        flight.clone.position.copy(p);
        const s = new THREE.Vector3().set(
          flight.start.scale.x + (flight.end.scale.x - flight.start.scale.x) * k,
          flight.start.scale.y + (flight.end.scale.y - flight.start.scale.y) * k,
          flight.start.scale.z + (flight.end.scale.z - flight.start.scale.z) * k
        );
        flight.clone.scale.copy(s);

        if (t01 >= 1) {
          // Snap to exact end, keep parked
          flight.clone.position.copy(flight.end.pos);
          flight.clone.scale.copy(flight.end.scale);
          flight.running = false;
          flightRunningRef.current = false;
          orbitPlane.visible = true; // resume other content
          // Enable orbit and hand off the clone to follow the ellipse
          orbitEnabledRef.current = true;
          cloneOrbitRef.current = true;
          // Force orbit phase to closest-to-camera and sync rotation
          t = 0.25 + 0.001; // small nudge to ensure motion
          const a = 20;
          const yaw = Math.atan2(0, -a);
          flight.clone.rotation.set(0, yaw, 0);
          // Restore canvas opacity/z-index
          canvas.style.zIndex = "";
          (canvas as any).__forceVisible = false;
          canvas.style.opacity = activeRef.current ? "1" : "0";
          bus.emit("header:logo-flyToHex:done");
        }
      }

      // render
      // If clone is in orbit-follow mode, mirror the ellipse math to it
      if (cloneOrbitRef.current && flight.clone) {
        const a = 20, b = 14.6, yOffset = -3.1; // keep in sync with orbit math
        const x = a * Math.cos(angle);
        const z = b * Math.sin(angle);
        const ampWorld = pxToWorldY(window.innerHeight * 0.15);
        flight.clone.position.set(x, yOffset + Math.sin(angle) * ampWorld, z);
        // facing along tangent
        const tx = -a * Math.sin(angle);
        const tz =  b * Math.cos(angle);
        const tiltDeg = -15 * (x / (a || 1));
        cloneRollRef.current += dt * 0.3; // gentle roll similar to payload
        flight.clone.rotation.set(
          0,
          Math.atan2(tz, tx),
          THREE.MathUtils.degToRad(tiltDeg) + cloneRollRef.current
        );
      }

      renderer.render(scene, camera);

      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // cleanup
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      offStartSignal();
      offReset();
      offLogoRect();
      
      renderer.dispose();
      scene.clear();
    };
  }, []);

  /* =========================================================
     Render (DOM)
     ========================================================= */
  return (
    <section
      ref={sectionRef}
      aria-label="Two-Window Posts"
      style={{
        ...sizingVars,
        position: "relative",
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        overscrollBehavior: "none",
        background: "transparent",
      }}
      className="w-full min-h-screen"
    >
      {/* Debug HUD removed */}
      {/* Gradient layer (always at the very back) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: GRADIENT_BG,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          zIndex: 0,
        }}
      />

      {/* Three.js Canvas (above gradient) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0"
        style={{
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0,
          transition: "opacity 180ms linear",
        }}
      />

      {/* Goose window (scrolls with section) */}
      <figure
        aria-hidden
        style={{
          position: "absolute",
          top: -14,
          left: 12,
          width: "min(44vmin, 560px)",
          height: "min(36vmin, 440px)",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <img
          src="/popular/goose.png"
          alt="Popular"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          loading="eager"
          decoding="async"
        />
      </figure>

      {/* Main windows (content on top) */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
        <div className="flex flex-wrap items-center justify-center" style={{ gap: "min(8vw, 48px)" }}>
          {/* Window 1: Title + SNIPPET */}
          <figure
            style={{
              width: "calc(var(--s) * var(--scale))",
              height: "calc(var(--s) * var(--scale))",
              background: "#000",
              position: "relative",
              overflow: "hidden",
              border: `${FRAME_THICKNESS_PX}px solid ${FRAME_COLOR}`,
              boxShadow: `0 0 0 ${FRAME_THICKNESS_PX}px ${FRAME_COLOR}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
              textAlign: "center",
            } as CSSProperties}
          >
            <div style={{ ...LABEL_STYLE, fontSize: "clamp(13px, 1.333vw, 19px)", opacity: 0.95 }}>
              {t("Common.latestFromOurPosts")}
            </div>
            <div
              style={{ ...TITLE_STYLE, fontSize: "clamp(24px, 3.2vw, 40px)", marginTop: 10, marginBottom: 12 }}
              dangerouslySetInnerHTML={{ __html: escapeHtml(current?.title || "No posts available") }}
            />
            <blockquote
              style={{
                ...QUOTE_STYLE,
                fontSize: "clamp(18px, 1.6vw, 24px)",
                maxWidth: "92%",
                opacity: 0.95,
              }}
            >
              {current?.quote || "Please check back later for updates."}
            </blockquote>
          </figure>

          {/* Window 2: Image + button with straight corners */}
          <figure
            style={{
              width: "calc(var(--s) * var(--scale) * 2)",
              height: "calc(var(--s) * var(--scale))",
              background: "#111",
              position: "relative",
              overflow: "hidden",
              border: `${FRAME_THICKNESS_PX}px solid ${FRAME_COLOR}`,
              boxShadow: `0 0 0 ${FRAME_THICKNESS_PX}px ${FRAME_COLOR}`,
            } as CSSProperties}
          >
            {current?.imageUrl && current.imageUrl !== "/placeholder.jpg" ? (
              <img
                src={current.imageUrl}
                alt={current.title}
                loading="eager"
                decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
              />
            ) : (
              <div style={{ 
                color: "white", 
                fontSize: "clamp(13px, 1.333vw, 19px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%"
              }}>
                No image available
              </div>
            )}

            {/* Fixed CTA button bottom-right — straight corners */}
            <a
              href={current?.url || "#"}
              target="_self"
              rel="noopener"
              style={{
                position: "absolute",
                right: 14,
                bottom: 12,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  fontSize: "clamp(13px, 1.333vw, 19px)",
                  border: "2px solid rgba(255,255,255,0.85)",
                  padding: "10px 14px",
                  borderRadius: 0,
                  background: "rgba(0,0,0,0.45)",
                  backdropFilter: "blur(2px)",
                  display: "inline-block",
                }}
              >
                {t("Common.readMore")}
              </span>
            </a>
          </figure>
        </div>
      </div>

      <OrbitDebug
        a={20}
        b={14.6}
        y={-3.1}
        onChange={() => {}}
      />
    </section>
  );
}

/* =========================================================
   Plain helpers
   ========================================================= */
function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = html
    .replace(/\[\/.+?\]/g, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ");
  return decodeBasicEntities(tmp).replace(/\s+/g, " ").trim();
}
function decodeBasicEntities(s: string): string {
  if (!s) return "";
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
function truncateForQuote(s: string, max = 220): string {
  if (!s) return "";
  const clean = s.trim();
  if (clean.length <= max) return clean;
  const boundary = clean.lastIndexOf(". ", max - 1);
  const cut = boundary > 80 ? boundary + 1 : max;
  return clean.slice(0, cut).trim() + "…";
}
function escapeHtml(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function fallbackFromUrl(url: string): Slide {
  return {
    id: Math.random(),
    title: "Post Unavailable",
    quote: "Content could not be loaded.",
    imageUrl: "/placeholder.jpg",
    url,
  };
}
