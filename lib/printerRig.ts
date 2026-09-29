import * as THREE from "three";

/**
 * A procedural "timelapse" of a bed-slinger printer (Bambu A1 layout) printing
 * a square pyramid, built in plain three.js so the per-frame logic lives in
 * one class instead of being spread across React state.
 *
 * Styled like a real timelapse: the toolhead stays parked out of the way and
 * the print simply grows. Growth is a clipping plane rising smoothly through
 * the finished, layer-lined model, with a flat cap at the cut — so it's
 * continuous (no per-layer popping) while the layer lines stay visible.
 *
 * Units are millimetres. Bed top surface is y = 0.
 */

const BASE = 64; // pyramid base side
const HEIGHT = 41; // ~Giza proportions
const LAYER_H = 0.6;
const LAYERS = Math.round(HEIGHT / LAYER_H);

const FADE_IN = 0.8;
const PRINT_TIME = 13; // s for the whole print to grow
const HOLD = 3.4;
const FADE_OUT = 0.9;
export const CYCLE = PRINT_TIME + HOLD + FADE_OUT;
/** A moment in the cycle with the print finished and fully visible. */
export const FINISHED_TIME = PRINT_TIME + HOLD * 0.6;

const PARK = new THREE.Vector3(96, HEIGHT + 30, 0);

function smooth(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Textured-PEI plate look: warm dark base with fine light speckle. */
function createPeiTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2e2a24";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = Math.random();
    const v = n > 0.985 ? 70 : n > 0.9 ? 22 : (n - 0.5) * 16;
    img.data[i] += v;
    img.data[i + 1] += v * 0.92;
    img.data[i + 2] += v * 0.8;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 8;
  return tex;
}

/** One printed layer: a square slab whose sides are fully rounded (bevel =
 *  half the layer height), which is what gives a real FDM print its ridged
 *  layer lines once light rakes across it. */
function createLayerGeometry(side: number) {
  const bevel = LAYER_H * 0.45;
  const inner = Math.max(0.4, side - bevel * 2);
  const shape = new THREE.Shape();
  shape.moveTo(-inner / 2, -inner / 2);
  shape.lineTo(inner / 2, -inner / 2);
  shape.lineTo(inner / 2, inner / 2);
  shape.lineTo(-inner / 2, inner / 2);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: LAYER_H - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: Math.min(bevel, inner / 2),
    bevelSegments: 3,
  });
  // Extrusion runs along +Z; stand it up so the layer's bottom sits on y = 0.
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  return geo;
}

export class PrinterRig {
  readonly root = new THREE.Group();
  private readonly bed = new THREE.Group();
  private readonly gantry = new THREE.Group();
  private readonly toolhead = new THREE.Group();
  private readonly clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  private readonly cap: THREE.Mesh;
  private readonly disposables: { dispose(): void }[] = [];

  constructor() {
    const track = <T extends { dispose(): void }>(x: T) => {
      this.disposables.push(x);
      return x;
    };
    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, cast = true, receive = true) => {
      const m = new THREE.Mesh(track(geo), mat);
      m.castShadow = cast;
      m.receiveShadow = receive;
      return m;
    };

    const shell = track(new THREE.MeshStandardMaterial({ color: "#d4d4cf", roughness: 0.55, metalness: 0.05 }));
    const darkMetal = track(new THREE.MeshStandardMaterial({ color: "#1d1d20", roughness: 0.4, metalness: 0.7 }));
    const rail = track(new THREE.MeshStandardMaterial({ color: "#b4b9bf", roughness: 0.18, metalness: 1 }));
    const brass = track(new THREE.MeshStandardMaterial({ color: "#c9a25a", roughness: 0.28, metalness: 1 }));
    const fan = track(new THREE.MeshStandardMaterial({ color: "#161618", roughness: 0.7 }));
    const pei = track(createPeiTexture());
    const plate = track(
      new THREE.MeshStandardMaterial({ map: pei, roughnessMap: pei, roughness: 0.85, metalness: 0.35, color: "#ffffff" })
    );
    // Silk gold PLA — a touch of metalness and clearcoat is what silk filament
    // actually looks like under a single hard light.
    const pla = track(
      new THREE.MeshPhysicalMaterial({
        color: "#d8a94a",
        roughness: 0.34,
        metalness: 0.45,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffe2a0"),
        clippingPlanes: [this.clip],
        clipShadows: true,
      })
    );
    const capMat = track(pla.clone());
    capMat.clippingPlanes = [];
    const floorMat = track(new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.92 }));

    // Table + printer base (fixed).
    const floor = mesh(new THREE.PlaneGeometry(1400, 1400), floorMat, false, true);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -34;
    this.root.add(floor);
    const base = mesh(new THREE.BoxGeometry(250, 18, 330), shell);
    base.position.set(0, -25, 0);
    this.root.add(base);
    for (const x of [-48, 48]) {
      const r = mesh(new THREE.CylinderGeometry(3, 3, 320, 24), rail);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, -12, 0);
      this.root.add(r);
    }

    // Bed (slides along Z).
    const heatbed = mesh(new THREE.BoxGeometry(186, 5, 186), darkMetal);
    heatbed.position.y = -4.3;
    this.bed.add(heatbed);
    const sheet = mesh(new THREE.BoxGeometry(180, 1.6, 180), plate, false, true);
    sheet.position.y = -0.8;
    this.bed.add(sheet);
    for (let i = 0; i < LAYERS; i++) {
      const side = BASE * (1 - (i + 0.5) / LAYERS);
      const layer = mesh(createLayerGeometry(side), pla);
      layer.position.y = i * LAYER_H;
      this.bed.add(layer);
    }
    // Solid top face at the growth cut, resized every frame.
    const capGeo = new THREE.PlaneGeometry(1, 1);
    capGeo.rotateX(-Math.PI / 2);
    this.cap = mesh(capGeo, capMat, false, true);
    this.bed.add(this.cap);
    this.root.add(this.bed);

    // Z column (fixed) on the left, like the A1.
    const column = mesh(new THREE.BoxGeometry(18, 260, 22), shell);
    column.position.set(-138, 95, -8);
    this.root.add(column);
    const cap = mesh(new THREE.BoxGeometry(34, 14, 34), shell);
    cap.position.set(-138, 229, -8);
    this.root.add(cap);

    // Gantry: X beam (rises with each layer).
    const beam = mesh(new THREE.BoxGeometry(280, 14, 14), darkMetal);
    beam.position.set(-6, 22, -16);
    this.gantry.add(beam);
    const carriage = mesh(new THREE.BoxGeometry(30, 22, 16), shell);
    carriage.position.set(-138, 22, -8);
    this.gantry.add(carriage);

    // Toolhead (moves along X on the beam).
    const body = mesh(new THREE.BoxGeometry(28, 30, 24), shell);
    body.position.set(0, 20, 0);
    this.toolhead.add(body);
    const fanDisc = mesh(new THREE.CylinderGeometry(8.5, 8.5, 1.2, 40), fan);
    fanDisc.rotation.x = Math.PI / 2;
    fanDisc.position.set(0, 21, 12.3);
    this.toolhead.add(fanDisc);
    const hub = mesh(new THREE.CylinderGeometry(3, 3, 1.6, 24), shell);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, 21, 12.8);
    this.toolhead.add(hub);
    const block = mesh(new THREE.BoxGeometry(10, 5, 10), rail);
    block.position.set(0, 4.5, 0);
    this.toolhead.add(block);
    const nozzle = mesh(new THREE.ConeGeometry(2, 3.2, 24), brass);
    nozzle.rotation.x = Math.PI;
    nozzle.position.set(0, 1.6, 0);
    this.toolhead.add(nozzle);
    const tube = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 35, -2),
          new THREE.Vector3(0, 70, -10),
          new THREE.Vector3(-30, 130, -50),
          new THREE.Vector3(-90, 170, -70),
        ]),
        48,
        2,
        12
      ),
      track(new THREE.MeshPhysicalMaterial({ color: "#f4f4f0", roughness: 0.3, transmission: 0.3, thickness: 2 }))
    );
    this.toolhead.add(tube);
    this.gantry.add(this.toolhead);
    this.root.add(this.gantry);

    // Parked for the whole shot, like a real timelapse frame.
    this.toolhead.position.x = PARK.x;
    this.gantry.position.y = PARK.y;
  }

  /** Advance the scene to `time` seconds into the loop. Returns the
   *  black-overlay opacity (0 = fully visible) for the fade between loops. */
  update(time: number): number {
    const t = ((time % CYCLE) + CYCLE) % CYCLE;
    // Gentle ease at both ends so the growth starts and settles softly.
    const p = Math.min(1, t / PRINT_TIME);
    const eased = p < 0.04 ? smooth(p / 0.04) * 0.04 : p > 0.97 ? 0.97 + smooth((p - 0.97) / 0.03) * 0.03 : p;
    const h = Math.max(0.001, eased * HEIGHT);
    this.clip.constant = h;

    const side = BASE * (1 - h / HEIGHT) - LAYER_H * 0.2;
    this.cap.visible = side > 0.3 && h < HEIGHT - 0.01;
    this.cap.scale.set(Math.max(side, 0.01), 1, Math.max(side, 0.01));
    this.cap.position.y = h - 0.002;

    if (t < FADE_IN) return 1 - smooth(t / FADE_IN);
    if (t > CYCLE - FADE_OUT) return smooth((t - (CYCLE - FADE_OUT)) / FADE_OUT);
    return 0;
  }

  /** Slow cinematic drift, plus a view offset that parks the printer off to
   *  the right on wide screens / lower on tall ones, clear of the hero copy. */
  updateCamera(camera: THREE.PerspectiveCamera, time: number, width: number, height: number) {
    // Very slow, low-amplitude drift — reads as a steady camera, not a sway.
    const a = 0.32 + Math.sin(time * 0.04) * 0.07;
    const r = 330 - Math.sin(time * 0.03) * 6;
    camera.position.set(Math.sin(a) * r, 120 + Math.sin(time * 0.035) * 2, Math.cos(a) * r);
    camera.lookAt(0, 30, 0);
    const wide = width / height > 1.1;
    camera.setViewOffset(width, height, wide ? -width * 0.24 : 0, wide ? -height * 0.04 : -height * 0.2, width, height);
    camera.updateProjectionMatrix();
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}
