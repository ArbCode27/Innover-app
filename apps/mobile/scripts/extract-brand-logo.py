"""
Extrae `brand-logo.png` (fondo transparente, sin manchas/glow) y `splash.png`
(logo sobre blanco) desde el splash original del repo.

Uso:
  python apps/mobile/scripts/extract-brand-logo.py

Requisitos: pillow, numpy
"""

from __future__ import annotations

import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parents[3]
ASSETS = Path(__file__).resolve().parents[1] / "assets"
ORIGINAL_COMMIT = "0c4667b"
PAD = 72


def _restore_original() -> Image.Image:
    subprocess.run(
        ["git", "checkout", ORIGINAL_COMMIT, "--", "apps/mobile/assets/splash.png"],
        cwd=REPO,
        check=True,
    )
    return Image.open(ASSETS / "splash.png").convert("RGBA")


def _keep_mask(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    bright = (r + g + b) / 3.0
    sat = np.where(mx == 0, 0.0, (mx - mn) / np.maximum(mx, 1.0))

    # Estrella: rojo saturado (excluye glow rosado claro).
    is_red = (
        (r > 150)
        & (r - g > 45)
        & (r - b > 45)
        & (sat > 0.28)
        & (bright < 210)
    )
    is_navy = (bright < 165) & (b >= g - 10) & (sat > 0.12) & ((mx - mn) > 16)
    is_cyan = (
        (b > 130)
        & (g > 100)
        & (r < 200)
        & (b > r + 10)
        & (sat > 0.18)
        & (bright < 220)
    )
    is_dark = (bright < 85) & (sat > 0.06)
    core = is_red | is_navy | is_cyan | is_dark

    core_u8 = (core.astype(np.uint8) * 255)
    keep = (
        np.array(Image.fromarray(core_u8, "L").filter(ImageFilter.MaxFilter(3)))
        > 0
    )

    is_glow = (bright >= 175) & (sat <= 0.35) & ~is_red & ~is_cyan
    is_pink_glow = (r > 200) & (g > 180) & (b > 180)
    keep &= ~is_glow
    keep &= ~is_pink_glow
    keep &= ~((r >= 248) & (g >= 248) & (b >= 248))
    return keep


def _harden_alpha(image: Image.Image) -> Image.Image:
    arr = np.asarray(image).copy()
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)
    a = arr[:, :, 3]
    bright = (r + g + b) / 3.0
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = np.where(mx == 0, 0.0, (mx - mn) / np.maximum(mx, 1.0))
    is_red = (r > 150) & (r - g > 45) & (r - b > 45) & (sat > 0.28)
    is_cyan = (b > 130) & (g > 100) & (r < 200) & (b > r + 10) & (sat > 0.18)
    drop = ((bright >= 175) & (sat <= 0.35) & ~is_red & ~is_cyan) | (
        (r > 200) & (g > 180) & (b > 180)
    )
    keep = (a > 128) & ~drop
    arr[:, :, 3] = np.where(keep, 255, 0).astype(np.uint8)
    arr[:, :, 0][~keep] = 0
    arr[:, :, 1][~keep] = 0
    arr[:, :, 2][~keep] = 0
    return Image.fromarray(arr, "RGBA")


def main() -> None:
    src = _restore_original()
    rgba = np.asarray(src).copy()
    r = rgba[:, :, 0].astype(np.float32)
    g = rgba[:, :, 1].astype(np.float32)
    b = rgba[:, :, 2].astype(np.float32)
    keep = _keep_mask(r, g, b)

    out = np.zeros_like(rgba)
    out[:, :, 0] = np.where(keep, rgba[:, :, 0], 0)
    out[:, :, 1] = np.where(keep, rgba[:, :, 1], 0)
    out[:, :, 2] = np.where(keep, rgba[:, :, 2], 0)
    out[:, :, 3] = np.where(keep, 255, 0).astype(np.uint8)

    ys, xs = np.where(keep)
    if len(xs) == 0:
        raise SystemExit("No logo content found")

    left = max(0, int(xs.min()) - PAD)
    top = max(0, int(ys.min()) - PAD)
    right = min(out.shape[1], int(xs.max()) + 1 + PAD)
    bottom = min(out.shape[0], int(ys.max()) + 1 + PAD)
    cropped = Image.fromarray(out, "RGBA").crop((left, top, right, bottom))

    w, h = cropped.size
    brand = cropped.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
    brand = _harden_alpha(brand)
    brand.save(ASSETS / "brand-logo.png", optimize=True)

    splash = Image.new("RGBA", brand.size, (255, 255, 255, 255))
    splash.paste(brand, (0, 0), brand)
    splash.convert("RGB").save(ASSETS / "splash.png", optimize=True)

    print(f"wrote brand-logo.png + splash.png {brand.size[0]}x{brand.size[1]}")


if __name__ == "__main__":
    main()
