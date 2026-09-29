"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PrinterRig, FINISHED_TIME } from "@/lib/printerRig";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function Scene({ onFade, still }: { onFade: (opacity: number) => void; still: boolean }) {
  const [rig] = useState(() => new PrinterRig());
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const time = useRef(still ? FINISHED_TIME : 0);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    /* eslint-disable react-hooks/immutability -- live three.js scene object, not React state */
    scene.environment = env.texture;
    scene.environmentIntensity = 0.35;
    scene.background = new THREE.Color("#0b0b0d");
    scene.fog = new THREE.Fog("#0b0b0d", 320, 700);
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
      rig.dispose();
    };
    /* eslint-enable react-hooks/immutability */
  }, [gl, scene, rig]);

  useFrame((state, delta) => {
    if (!still) time.current += Math.min(delta, 0.1);
    const fade = rig.update(still ? FINISHED_TIME : time.current);
    rig.updateCamera(state.camera as THREE.PerspectiveCamera, time.current, state.size.width, state.size.height);
    onFade(fade);
  });

  return (
    <>
      <primitive object={rig.root} />
      <hemisphereLight args={["#bcc6ff", "#1a140c", 0.25]} />
      {/* Key: warm, hard-ish, from front-left — rakes across the layer lines. */}
      <spotLight
        position={[-150, 230, 170]}
        angle={0.42}
        penumbra={0.7}
        intensity={9}
        decay={0}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.4}
      />
      {/* Cool rim from behind-right, separates the print from the dark chamber. */}
      <directionalLight position={[160, 120, -200]} intensity={1.6} color="#9fb4ff" />
      {/* Chamber LED bar above the build area. */}
      <pointLight position={[0, 200, 40]} intensity={1.1} decay={0} color="#ffffff" />
    </>
  );
}

/**
 * Hero background: a live-rendered timelapse of the pyramid printing. Only
 * renders while the hero is on screen; with reduced motion it shows the
 * finished print, still.
 */
export default function PrintTimelapse() {
  const wrap = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const reduced = usePrefersReducedMotion();
  const setFade = (opacity: number) => {
    if (fade.current) fade.current.style.opacity = String(opacity);
  };

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} aria-hidden className="absolute inset-0 z-0 bg-[#0b0b0d]">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 30, near: 1, far: 1500, position: [0, 120, 330] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
        frameloop={reduced ? "demand" : onScreen ? "always" : "never"}
      >
        <Scene onFade={setFade} still={reduced} />
      </Canvas>
      <div ref={fade} className="pointer-events-none absolute inset-0 bg-[#0b0b0d]" style={{ opacity: 1 }} />
    </div>
  );
}
