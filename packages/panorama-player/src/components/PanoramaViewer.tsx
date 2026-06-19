import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Hotspot, StoryNode, ViewMode } from "../types";

interface PanoramaViewerProps {
  node: StoryNode;
  hotspots: Hotspot[];
  seenHotspots: string[];
  autoDrift: boolean;
  reducedMotion: boolean;
  onHotspot: (hotspot: Hotspot) => void;
  viewMode: ViewMode;
}

interface HotspotPosition {
  id: string;
  x: number | string;
  y: number | string;
  visible: boolean;
}

export default function PanoramaViewer(props: PanoramaViewerProps) {
  if (props.viewMode === "flat") {
    return <FlatMediaViewer {...props} />;
  }

  return <SphericalPanoramaViewer {...props} />;
}

function SphericalPanoramaViewer({
  node,
  hotspots,
  seenHotspots,
  autoDrift,
  reducedMotion,
  onHotspot,
}: PanoramaViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const pointerRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    lon: 0,
    lat: 0,
    fov: 74,
    lastInteraction: Date.now(),
  });
  const hotspotsRef = useRef(hotspots);
  const [positions, setPositions] = useState<HotspotPosition[]>([]);
  const [assetState, setAssetState] = useState<"loading" | "ready" | "fallback">("loading");
  const [fov, setFov] = useState(74);

  const seenSet = useMemo(() => new Set(seenHotspots), [seenHotspots]);

  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(74, mount.clientWidth / mount.clientHeight, 0.1, 1200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.SphereGeometry(500, 96, 48);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    materialRef.current = material;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let frameId = 0;

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const animate = () => {
      const pointer = pointerRef.current;
      if (autoDrift && !reducedMotion && !pointer.dragging && Date.now() - pointer.lastInteraction > 1800) {
        pointer.lon += 0.035;
      }

      pointer.lat = Math.max(-72, Math.min(72, pointer.lat));
      camera.fov = pointer.fov;
      camera.updateProjectionMatrix();

      const target = sphericalToVector(pointer.lon, pointer.lat, 500);
      camera.lookAt(target);
      renderer.render(scene, camera);
      setPositions(projectHotspots(camera, renderer.domElement, hotspotsRef.current));
      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      textureRef.current?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      cameraRef.current = null;
      materialRef.current = null;
      textureRef.current = null;
    };
  }, [autoDrift, reducedMotion]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) {
      return;
    }

    setAssetState("loading");
    let cancelled = false;
    let videoEl: HTMLVideoElement | null = null;
    let videoTexture: THREE.VideoTexture | null = null;

    const isVideo = isVideoAsset(node.panorama);

    if (isVideo) {
      videoEl = document.createElement("video");
      videoEl.src = node.panorama;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.autoplay = true;

      videoEl.play().catch((err) => {
        console.warn("Autoplay was prevented, waiting for interaction:", err);
        const playOnInteraction = () => {
          if (videoEl) {
            videoEl.play().catch(() => {});
          }
          window.removeEventListener("pointerdown", playOnInteraction);
        };
        window.addEventListener("pointerdown", playOnInteraction);
      });

      videoTexture = new THREE.VideoTexture(videoEl);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;

      const handleCanPlay = () => {
        if (cancelled) return;
        if (videoTexture) {
          replaceTexture(material, textureRef, videoTexture);
          setAssetState("ready");
        }
      };

      videoEl.addEventListener("canplaythrough", handleCanPlay);

      if (videoEl.readyState >= 3) {
        handleCanPlay();
      }

      return () => {
        cancelled = true;
        if (videoEl) {
          videoEl.removeEventListener("canplaythrough", handleCanPlay);
          videoEl.pause();
          videoEl.src = "";
          videoEl.load();
        }
        if (videoTexture) {
          videoTexture.dispose();
        }
      };
    } else {
      const loader = new THREE.TextureLoader();
      loader.load(
        node.panorama,
        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          replaceTexture(material, textureRef, texture);
          setAssetState("ready");
        },
        undefined,
        () => {
          if (cancelled) {
            return;
          }
          const texture = createFallbackTexture(node);
          replaceTexture(material, textureRef, texture);
          setAssetState("fallback");
        },
      );

      return () => {
        cancelled = true;
      };
    }
  }, [node]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current.dragging = true;
    pointerRef.current.lastX = event.clientX;
    pointerRef.current.lastY = event.clientY;
    pointerRef.current.lastInteraction = Date.now();
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (!pointer.dragging) {
      return;
    }
    const dx = event.clientX - pointer.lastX;
    const dy = event.clientY - pointer.lastY;
    pointer.lon -= dx * 0.12;
    pointer.lat += dy * 0.12;
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    pointer.lastInteraction = Date.now();
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointerRef.current.dragging = false;
    pointerRef.current.lastInteraction = Date.now();
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pointer = pointerRef.current;
    const newFov = Math.max(20, Math.min(130, pointer.fov + event.deltaY * 0.025));
    pointer.fov = newFov;
    setFov(newFov);
    pointer.lastInteraction = Date.now();
  }, []);

  return (
    <div
      className="panorama"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      ref={mountRef}
      style={
        {
          "--fallback-from": node.palette.from,
          "--fallback-via": node.palette.via,
          "--fallback-to": node.palette.to,
        } as React.CSSProperties
      }
    >
      <div className="vignette" />
      <div className="horizon-glow" />
      {positions.map((position) => {
        const hotspot = hotspots.find((item) => item.id === position.id);
        if (!hotspot || !position.visible) {
          return null;
        }
        const seen = seenSet.has(`${node.id}:${hotspot.id}`);
        return (
          <button
            className={`hotspot ${seen ? "is-seen" : ""}`}
            key={position.id}
            onClick={(event) => {
              event.stopPropagation();
              onHotspot(hotspot);
            }}
            style={{ left: position.x, top: position.y }}
            title={hotspot.description}
            type="button"
          >
            <span />
            <strong>{hotspot.label}</strong>
          </button>
        );
      })}
      {assetState === "loading" && <div className="asset-state">载入全景</div>}
      {assetState === "fallback" && <div className="asset-state">临时全景</div>}
      <div
        className="zoom-controller"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="zoom-header">
          <span className="zoom-label">视角远近</span>
          <span className="zoom-value">{Math.round(fov)}°</span>
        </div>
        <div className="zoom-slider-container">
          <input
            className="zoom-slider"
            max="130"
            min="20"
            onChange={(event) => {
              const val = Number(event.target.value);
              setFov(val);
              pointerRef.current.fov = val;
              pointerRef.current.lastInteraction = Date.now();
            }}
            type="range"
            value={Math.round(fov)}
          />
        </div>
      </div>
    </div>
  );
}

function FlatMediaViewer({ node, hotspots, seenHotspots, onHotspot }: PanoramaViewerProps) {
  const [assetState, setAssetState] = useState<"loading" | "ready" | "fallback">("loading");
  const seenSet = useMemo(() => new Set(seenHotspots), [seenHotspots]);
  const positions = useMemo(() => projectFlatHotspots(hotspots), [hotspots]);
  const isVideo = isVideoAsset(node.panorama);

  useEffect(() => {
    setAssetState("loading");
  }, [node.panorama]);

  return (
    <div
      className="panorama panorama-flat"
      style={
        {
          "--fallback-from": node.palette.from,
          "--fallback-via": node.palette.via,
          "--fallback-to": node.palette.to,
        } as React.CSSProperties
      }
    >
      {assetState !== "fallback" &&
        (isVideo ? (
          <video
            autoPlay
            className="flat-media"
            key={node.panorama}
            loop
            muted
            onCanPlay={() => setAssetState("ready")}
            onError={() => setAssetState("fallback")}
            onLoadedData={() => setAssetState("ready")}
            playsInline
            preload="auto"
            src={node.panorama}
          />
        ) : (
          <img
            alt=""
            className="flat-media"
            key={node.panorama}
            onError={() => setAssetState("fallback")}
            onLoad={() => setAssetState("ready")}
            src={node.panorama}
          />
        ))}
      <div className="flat-media-shade" />
      <div className="vignette" />
      <div className="horizon-glow" />
      {positions.map((position) => {
        const hotspot = hotspots.find((item) => item.id === position.id);
        if (!hotspot || !position.visible) {
          return null;
        }
        const seen = seenSet.has(`${node.id}:${hotspot.id}`);
        return (
          <button
            className={`hotspot ${seen ? "is-seen" : ""}`}
            key={position.id}
            onClick={(event) => {
              event.stopPropagation();
              onHotspot(hotspot);
            }}
            style={{ left: position.x, top: position.y }}
            title={hotspot.description}
            type="button"
          >
            <span />
            <strong>{hotspot.label}</strong>
          </button>
        );
      })}
      {assetState === "loading" && <div className="asset-state">载入平面</div>}
      {assetState === "fallback" && <div className="asset-state">临时平面</div>}
    </div>
  );
}

function replaceTexture(
  material: THREE.MeshBasicMaterial,
  textureRef: React.MutableRefObject<THREE.Texture | null>,
  texture: THREE.Texture,
) {
  textureRef.current?.dispose();
  textureRef.current = texture;
  material.map = texture;
  material.needsUpdate = true;
}

function sphericalToVector(yaw: number, pitch: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - pitch);
  const theta = THREE.MathUtils.degToRad(yaw);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function projectHotspots(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
  hotspots: Hotspot[],
): HotspotPosition[] {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  return hotspots.map((hotspot) => {
    const world = sphericalToVector(hotspot.yaw, hotspot.pitch, 500);
    const visible = world.clone().normalize().dot(direction) > 0.12;
    const projected = world.clone().project(camera);
    return {
      id: hotspot.id,
      x: ((projected.x + 1) / 2) * width,
      y: ((-projected.y + 1) / 2) * height,
      visible: visible && projected.z < 1 && projected.x > -1.2 && projected.x < 1.2 && projected.y > -1.2 && projected.y < 1.2,
    };
  });
}

function projectFlatHotspots(hotspots: Hotspot[]): HotspotPosition[] {
  return hotspots.map((hotspot) => ({
    id: hotspot.id,
    x: `${((normalizeYaw(hotspot.yaw) + 180) / 360) * 100}%`,
    y: `${((90 - clampPitch(hotspot.pitch)) / 180) * 100}%`,
    visible: true,
  }));
}

function normalizeYaw(yaw: number): number {
  return ((((yaw + 180) % 360) + 360) % 360) - 180;
}

function clampPitch(pitch: number): number {
  return Math.max(-90, Math.min(90, pitch));
}

function isVideoAsset(src: string): boolean {
  return src.toLowerCase().endsWith(".mp4");
}

function createFallbackTexture(node: StoryNode): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const sky = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  sky.addColorStop(0, node.palette.from);
  sky.addColorStop(0.45, node.palette.via);
  sky.addColorStop(1, node.palette.to);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ground = ctx.createLinearGradient(0, canvas.height * 0.58, 0, canvas.height);
  ground.addColorStop(0, "rgba(10, 11, 13, 0)");
  ground.addColorStop(1, "rgba(10, 11, 13, 0.86)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 64; i += 1) {
    const x = (i / 64) * canvas.width;
    const h = 80 + Math.sin(i * 1.8) * 44 + (i % 5) * 18;
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 228, 164, 0.26)" : "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(x, canvas.height * 0.52 - h, 10 + (i % 4) * 12, h);
  }
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.48, 10, canvas.width * 0.5, canvas.height * 0.5, 720);
  glow.addColorStop(0, "rgba(255, 231, 190, 0.24)");
  glow.addColorStop(1, "rgba(255, 231, 190, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

