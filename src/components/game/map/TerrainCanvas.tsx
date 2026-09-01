/**
 * The shaded ground, painted once into a canvas and then just scaled.
 *
 * Building the heightfield costs real work (rasterising the coast, a distance
 * sweep, several octaves of noise per pixel), so it happens once per grid size
 * and is cached. Resizing the panel does not rebuild it; the browser scales the
 * bitmap, which is what you want anyway because relief shading at a fixed sun
 * angle should not change when a window does.
 */
import { useEffect, useRef, useState } from "react";
import { buildField, paintField, type Field } from "./terrain";
import { MAP_W, MAP_H } from "./projection";

/** Grid resolution. 16:10, and high enough that ridges have detail to catch. */
const GRID_W = 768;
const GRID_H = Math.round((GRID_W * MAP_H) / MAP_W);

let cached: { field: Field; bitmap: HTMLCanvasElement } | null = null;

function render(): HTMLCanvasElement {
  if (cached) return cached.bitmap;
  const field = buildField(GRID_W, GRID_H);
  const img = paintField(field);
  const bitmap = document.createElement("canvas");
  bitmap.width = GRID_W;
  bitmap.height = GRID_H;
  bitmap.getContext("2d")!.putImageData(img, 0, 0);
  cached = { field, bitmap };
  return bitmap;
}

export function TerrainCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // Yield once so the panel paints before the field is built, rather than
    // the map appearing to hang on open.
    //
    // A timer, not requestAnimationFrame: rAF does not fire while the page is
    // not compositing, so a map opened in a background tab, or in a window the
    // user has behind another, would never build its ground and would show an
    // empty panel forever with no error.
    const id = window.setTimeout(() => {
      try {
        const bitmap = render();
        canvas.width = GRID_W;
        canvas.height = GRID_H;
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
        setReady(true);
      } catch (err) {
        // A map that fails to build should say so rather than leaving a blank
        // panel that looks like a styling problem.
        console.error("terrain build failed", err);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        opacity: ready ? 1 : 0,
        transition: "opacity 320ms ease",
        imageRendering: "auto",
      }}
    />
  );
}
