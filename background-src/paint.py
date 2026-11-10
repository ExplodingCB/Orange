#!/usr/bin/env python3
"""Paints the homepage sky and meadow as an impressionist oil painting.

    pip install numpy scipy pillow
    python3 background-src/paint.py            writes assets/sky-wide.webp and assets/sky-tall.webp
    python3 background-src/paint.py --preview  half-size PNGs in background-src/out/, faster

Everything is seeded, so a run gives the same painting every time. Change SEED
for a different one.

How it works: a target picture (sky gradient, sun glow, a few soft clouds, the
meadow) decides what colour belongs where. The canvas gets a thin, warm
underpainting, then thousands of short opaque dabs, each picking up the target
colour with a little broken colour mixed in (lavender, rose, cream in the sky;
ochre and blue-green in the grass) and laid along a flow field. Every dab also
builds up a paint height map with bristle ridges and pushed-up edges, and that
height map is lit from the sun's side at the end, so the impasto catches light.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom

ROOT = Path(__file__).resolve().parent.parent
SEED = 20261110


def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    if np.ndim(t):
        t = np.asarray(t, np.float32)[..., None]
    return a * (1 - t) + b * t


# A sunny-day impressionist palette: no black, cool shadows, warm light.
SKY_TOP = hexc('#5d8fcf')
SKY_MID = hexc('#8cb6e0')
SKY_LOW = hexc('#c3d8e9')
HAZE = hexc('#efe3cc')
GLOW = hexc('#fbf3d6')
CLOUD = hexc('#f6f1e6')
CLOUD_SHADE = hexc('#b6bad6')
TREES = hexc('#7d9a95')
TREES_SHADE = hexc('#5f7d86')
FIELD_FAR = hexc('#a9b97c')
FIELD_MID = hexc('#7fa451')
FIELD_NEAR = hexc('#56823e')
GRASS_SHADE = hexc('#3d6648')
GRASS_LIGHT = hexc('#c9c66c')
GROUND = hexc('#d8c3a0')

SKY_ACCENTS = [hexc('#a9a8d8'), hexc('#e6c8cf'), hexc('#f3e8cc'), hexc('#a7d0d2'), hexc('#7aa0d8')]
GRASS_ACCENTS = [hexc('#d9cc79'), hexc('#8fae5a'), hexc('#6d8f86'), hexc('#a3b56a'), hexc('#c7b07a')]


class Canvas:
    def __init__(self, w, h, unit, seed):
        self.w, self.h, self.u = w, h, unit
        self.rng = np.random.default_rng(seed)
        self.yy, self.xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = self.rng
        fine = gaussian_filter(r.random((512, 1024), np.float32), (0.9 * unit, 14 * unit), mode='wrap')
        coarse = gaussian_filter(r.random((512, 1024), np.float32), (2.4 * unit, 30 * unit), mode='wrap')
        self.streak = self._norm(self._norm(fine) * 0.65 + self._norm(coarse) * 0.35)

    @staticmethod
    def _norm(a):
        a = a - a.mean()
        return np.clip(0.5 + a / (a.std() * 4 + 1e-6), 0, 1).astype(np.float32)

    def noise(self, sigma):
        f = max(1, int(sigma / 4))
        small = self.rng.random((self.h // f + 2, self.w // f + 2), np.float32)
        small = gaussian_filter(small, sigma / f, mode='reflect')
        return self._norm(zoom(small, f, order=1)[:self.h, :self.w])

    def weave(self):
        """Linen canvas: a fine over-under weave that shows where the paint is thin."""
        p = 3.2 * self.u
        wx = np.sin(self.xx / p * np.pi) ** 2
        wy = np.sin(self.yy / p * np.pi) ** 2
        cell = (np.floor(self.xx / p) + np.floor(self.yy / p)) % 2
        thread = np.where(cell > 0, wx, wy)
        jitter = gaussian_filter(self.rng.random((self.h, self.w), np.float32), 0.8 * self.u)
        return self._norm(thread * 0.7 + jitter * 0.3)


def paint(w, h, unit, L, seed=SEED):
    C = Canvas(w, h, unit, seed)
    r = C.rng
    X, Y = C.xx / w, C.yy / h
    hz = L['horizon']
    hzp = hz * h
    sx, sy, sr = L['sun']

    # ---- the target picture ----
    sun_d = np.hypot(C.xx - sx * w, C.yy - sy * h) / (sr * w)
    t_sky = np.clip(Y / hz, 0, 1)
    sky = mix(SKY_TOP, SKY_MID, smoothstep(0, 0.6, t_sky))
    sky = mix(sky, SKY_LOW, smoothstep(0.5, 1.0, t_sky))
    sky = mix(sky, HAZE, 0.55 * smoothstep(0.78, 1.0, t_sky))
    sky = mix(sky, GLOW, 0.95 * smoothstep(3.4, 0.3, sun_d) ** 1.6)

    cloud = np.zeros((h, w), np.float32)
    shade = np.zeros((h, w), np.float32)
    lumpy = C.noise(22 * unit)
    for cx, cy, cw, chh, puffs in L['clouds']:
        for _ in range(puffs):
            px = cx + r.normal(0, cw * 0.28)
            # Puffs nearer the middle pile up higher: a dome on a flat base.
            lift = np.exp(-((px - cx) / (cw * 0.35)) ** 2)
            py = cy - abs(r.normal(0, chh * 0.25)) * (0.4 + lift)
            rx = cw * r.uniform(0.12, 0.26)
            ry = min(rx * (w / h) * r.uniform(0.5, 0.8), chh * 0.8)
            d = np.hypot((X - px) / rx, (Y - py) / ry) + (lumpy - 0.5) * 0.5
            blob = smoothstep(1.05, 0.55, d) * smoothstep(cy + chh * 0.32, cy + chh * 0.05, Y)
            cloud = np.maximum(cloud, blob)
            shade = np.maximum(shade, blob * smoothstep(py - ry * 0.1, py + ry * 0.9, Y))
    cloud = gaussian_filter(cloud, 6 * unit)
    shade = gaussian_filter(shade, 8 * unit)
    cloud_col = mix(CLOUD, CLOUD_SHADE, np.clip(shade * 0.9, 0, 1))
    cloud_col = mix(cloud_col, GLOW, 0.3 * smoothstep(6, 2, sun_d))
    sky = mix(sky, cloud_col, np.clip(cloud * 0.95, 0, 1))

    tree_top = hzp - (14 + 24 * C.noise(30 * unit)[0] + 22 * C.noise(140 * unit)[0]) * unit
    TT = tree_top[None, :]
    trees = smoothstep(TT - 3 * unit, TT + 3 * unit, C.yy)
    field_t = np.clip((C.yy - hzp) / (h - hzp), 0, 1)
    field = mix(FIELD_FAR, FIELD_MID, smoothstep(0, 0.45, field_t))
    field = mix(field, FIELD_NEAR, smoothstep(0.35, 1.0, field_t))
    field = mix(field, GRASS_LIGHT, 1.4 * np.clip(C.noise(90 * unit) - 0.45, 0, 1) * (1 - field_t * 0.4))
    field = mix(field, GRASS_SHADE, 0.9 * np.clip(0.45 - C.noise(55 * unit), 0, 1) * field_t)
    # Lighter under the links in the lower left so the icons read.
    field = mix(field, FIELD_FAR, 0.45 * smoothstep(0.45, 0.0, X) * field_t)
    ground = smoothstep(hzp - 1 * unit, hzp + 4 * unit, C.yy)
    treecol = mix(TREES, TREES_SHADE, smoothstep(0.3, 1, (C.yy - TT) / (hzp - TT + 1)))
    target = mix(sky, mix(treecol, field, ground), trees).astype(np.float32)

    # ---- flow field: which way the brush travels ----
    cl = gaussian_filter(cloud, 10 * unit)
    gy, gx = np.gradient(cl)
    tang = np.arctan2(gx, -gy)  # along the cloud's contours
    tang = np.where(np.cos(tang) < 0, tang + np.pi, tang)  # a stroke has no head or tail
    gmag = np.clip(np.hypot(gx, gy) * 160 * unit, 0, 1)
    wander = (C.noise(180 * unit) - 0.5) * np.radians(26)
    base = np.radians(-4) + wander

    def blend_ang(a, b, t):
        return np.arctan2(np.sin(a) * (1 - t) + np.sin(b) * t, np.cos(a) * (1 - t) + np.cos(b) * t)

    sky_ang = blend_ang(base, tang, gmag * 0.55)
    grass_ang = np.radians(-90 + 10) + (C.noise(40 * unit) - 0.5) * np.radians(50)

    # ---- underpainting: thin and warm, showing in the gaps ----
    img = gaussian_filter(target, (8 * unit, 8 * unit, 0)) * 0.9 + GROUND * 0.1
    height = np.zeros((h, w), np.float32)

    def dab(x, y, length, width, ang, col, col2, opacity=0.95, dry=0.4, load=1.0, bend=0.0):
        ca, sa = np.cos(ang), np.sin(ang)
        x0, y0 = x - ca * length / 2, y - sa * length / 2
        pad = width / 2 + abs(bend) + 2 * unit
        xs = [x0, x0 + ca * length]
        ys = [y0, y0 + sa * length]
        bx0, bx1 = int(max(0, min(xs) - pad)), int(min(w, max(xs) + pad + 1))
        by0, by1 = int(max(0, min(ys) - pad)), int(min(h, max(ys) + pad + 1))
        if bx1 - bx0 < 2 or by1 - by0 < 2:
            return
        Xl = C.xx[by0:by1, bx0:bx1] - x0
        Yl = C.yy[by0:by1, bx0:bx1] - y0
        a = Xl * ca + Yl * sa
        v = -Xl * sa + Yl * ca
        t = a / length
        v = v - bend * (1 - (2 * t - 1) ** 2)
        hw = width / 2 * (1 - 0.25 * np.clip(t, 0, 1) ** 2)
        side = smoothstep(hw + 0.8 * unit, hw - 0.8 * unit, np.abs(v))
        cap = hw * 0.8 * np.sqrt(np.clip(1 - (v / np.maximum(hw, 1e-3)) ** 2, 0, 1))
        start = smoothstep(-cap - 0.8 * unit, -cap + 0.8 * unit, a)
        ou, ov = r.integers(0, 1024), r.integers(0, 512)
        vi = (v + ov).astype(np.int32) % 512
        ai = (a + ou).astype(np.int32) % 1024
        st = C.streak[vi, ai]
        endl = length * (1 - dry * (1 - C.streak[vi, ou]) ** 1.5)
        end = smoothstep(endl + 1.2 * unit, endl - 1.2 * unit, a)
        shape = side * start * end
        # Paint runs thin toward the end of the stroke and skips.
        thin = np.clip((t - 0.55) / 0.45, 0, 1) * dry
        alpha = shape * opacity * (1 - thin * (st < 0.5) * 0.8)
        # Two colours on one brush drag into each other across the stroke.
        cross = C.streak[vi, (ou + 300) % 1024]
        c = mix(col, col2, smoothstep(0.35, 0.75, cross))
        c = c * (0.95 + 0.10 * st[..., None])
        A = alpha[..., None]
        img[by0:by1, bx0:bx1] = img[by0:by1, bx0:bx1] * (1 - A) + c * A
        # Impasto: bristle ridges, with paint shoved up along the sides.
        rim = smoothstep(0.55, 0.95, np.abs(v) / np.maximum(hw, 1e-3)) * side
        thick = load * (0.6 + 0.4 * st + 0.25 * rim) * (1 - 0.5 * thin)
        height[by0:by1, bx0:bx1] = height[by0:by1, bx0:bx1] * (1 - alpha * 0.7) + thick * alpha

    def pick(x, y):
        return target[int(np.clip(y, 0, h - 1)), int(np.clip(x, 0, w - 1))]

    def jitter(c, amt):
        return np.clip(c * (1 + r.normal(0, amt, 3).astype(np.float32) * 0.5) + r.normal(0, amt * 0.6), 0, 1)

    def sky_pass(n, lmin, lmax, wmin, wmax, accent, dry):
        for _ in range(n):
            x = r.uniform(0, w - 1)
            y = r.uniform(0, tree_top[int(x)] + 3 * unit)
            col = jitter(pick(x + r.normal(0, 5 * unit), y + r.normal(0, 5 * unit)), 0.045)
            col2 = jitter(pick(x + r.normal(0, 16 * unit), y + r.normal(0, 16 * unit)), 0.05)
            if r.random() < accent:
                col2 = mix(col2, SKY_ACCENTS[r.integers(len(SKY_ACCENTS))], r.uniform(0.25, 0.5))
            if r.random() < accent * 0.4:
                col = mix(col, SKY_ACCENTS[r.integers(len(SKY_ACCENTS))], r.uniform(0.15, 0.3))
            ang = sky_ang[int(y), int(x)] + r.normal(0, 0.12)
            dab(x, y, r.uniform(lmin, lmax) * unit, r.uniform(wmin, wmax) * unit, ang, col, col2,
                opacity=r.uniform(0.85, 1.0), dry=dry, bend=r.normal(0, 2) * unit)

    def land_pass(n, accent, scale):
        for _ in range(n):
            x = r.uniform(0, w - 1)
            y = r.uniform(tree_top[int(x)] - 1 * unit, h - 1)
            ft = float(np.clip((y - hzp) / (h - hzp), 0, 1))
            col = jitter(pick(x + r.normal(0, 4 * unit), y + r.normal(0, 4 * unit)), 0.045)
            col2 = jitter(pick(x + r.normal(0, 14 * unit), y + r.normal(0, 10 * unit)), 0.05)
            if r.random() < accent:
                col2 = mix(col2, GRASS_ACCENTS[r.integers(len(GRASS_ACCENTS))], r.uniform(0.3, 0.55))
            if r.random() < 0.25 * ft:
                col = mix(col, GRASS_SHADE, r.uniform(0.25, 0.5))
            if y < hzp + 2 * unit:  # treeline: small upright dabs
                ln, wd = r.uniform(7, 14), r.uniform(5, 9)
                ang = np.radians(-90) + r.normal(0, 0.35)
            else:
                horiz = float(smoothstep(0.3, 0.0, ft))  # far field is laid in sideways
                ln = r.uniform(10, 24) * (0.5 + ft) * (1 - horiz) + horiz * r.uniform(14, 28)
                wd = r.uniform(3.5, 7) * (0.7 + 0.5 * ft)
                ang = blend_ang(grass_ang[int(y), int(x)], np.radians(-3), horiz) + r.normal(0, 0.15)
            dab(x, y, ln * unit * scale, wd * unit * scale, ang, col, col2,
                opacity=r.uniform(0.85, 1.0), dry=0.5, load=1.1)

    k = w * h / (2560 * 1600) * (1.75 / unit) ** 2
    d = L['density']
    sky_pass(int(d * 9000 * k * hz), 24, 46, 8, 13, 0.4, 0.35)
    land_pass(int(d * 5000 * k * (1 - hz) / 0.16), 0.45, 1.0)
    sky_pass(int(d * 7000 * k * hz), 12, 26, 5, 9, 0.5, 0.45)
    land_pass(int(d * 6000 * k * (1 - hz) / 0.16), 0.5, 0.8)

    # ---- light the paint ----
    hgt = gaussian_filter(height, 1.0 * unit)
    hgt = hgt + 0.12 * C.weave() * np.clip(1 - height, 0, 1)
    gy, gx = np.gradient(hgt)
    s = 3.2 * unit
    nx, ny = -gx * s, -gy * s
    nl = np.sqrt(nx * nx + ny * ny + 1)
    lx, ly, lz = -0.55, -0.6, 0.58  # from the upper left, where the sun is
    ll = np.sqrt(lx * lx + ly * ly + lz * lz)
    diff = (nx * lx + ny * ly + lz) / (nl * ll)
    img = img * (1 + 0.26 * (diff - lz / ll))[..., None]
    # A faint oily sheen on ridges that face the light.
    hx, hy, hzz = lx / ll, ly / ll, lz / ll + 1
    hl = np.sqrt(hx * hx + hy * hy + hzz * hzz)
    spec = np.clip((nx * hx + ny * hy + hzz) / (nl * hl), 0, 1) ** 30
    img = img + 0.05 * spec[..., None]
    return np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)


WIDE = dict(
    horizon=0.84,
    sun=(0.27, 0.13, 0.07),
    clouds=[
        (0.75, 0.36, 0.30, 0.16, 14),
        (0.43, 0.66, 0.26, 0.08, 10),
    ],
    density=1.0,
)

TALL = dict(
    horizon=0.86,
    sun=(0.30, 0.10, 0.13),
    clouds=[
        (0.74, 0.47, 0.6, 0.09, 11),
    ],
    density=1.0,
)


def main():
    preview = '--preview' in sys.argv
    k = 0.5 if preview else 1.0
    jobs = [('sky-wide', 2560, 1600, 1.75, WIDE), ('sky-tall', 1200, 2400, 2.6, TALL)]
    for name, w, h, unit, layout in jobs:
        img = Image.fromarray(paint(int(w * k), int(h * k), unit * k, layout))
        if preview:
            out = ROOT / 'background-src' / 'out' / f'{name}.png'
            out.parent.mkdir(exist_ok=True)
            img.save(out)
        else:
            out = ROOT / 'assets' / f'{name}.webp'
            img.save(out, 'WEBP', quality=86, method=6)
        print(f'{out.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {out.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
