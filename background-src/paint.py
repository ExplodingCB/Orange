#!/usr/bin/env python3
"""Paints the homepage sky: a sunny watercolor with the brush strokes left in.

    pip install numpy scipy pillow
    python3 background-src/paint.py            writes assets/sky-wide.webp and assets/sky-tall.webp
    python3 background-src/paint.py --preview  half-size PNGs in background-src/out/, faster

Everything is seeded, so a run gives the same painting every time. Change SEED
for a different one.

How it works: each pigment has its own density layer. Brush strokes, washes and
blooms add density, and the final colour is the paper colour multiplied by
each pigment's transmittance raised to its density, the way glazes stack on
real paper. Strokes are built from bristle streaks with dry-brush ends, pool
pigment at their edges, and granulate into the paper's tooth.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom

ROOT = Path(__file__).resolve().parent.parent
SEED = 20261110

PAPER = np.array([250, 247, 238], np.float32) / 255

# Transmittance of one unit of each pigment, per RGB channel.
PIGMENTS = {
    'ultramarine': (0.36, 0.47, 0.86),
    'cerulean':    (0.52, 0.76, 0.90),
    'cobalt':      (0.44, 0.58, 0.88),
    'lemon':       (0.99, 0.94, 0.52),
    'peach':       (0.99, 0.86, 0.74),
    'rose':        (0.98, 0.84, 0.86),
    'shadow':      (0.80, 0.78, 0.89),
    'ochre':       (0.94, 0.80, 0.52),
    'sap':         (0.62, 0.78, 0.38),
    'hooker':      (0.42, 0.56, 0.36),
    'distant':     (0.62, 0.74, 0.76),
}
GRANULATES = {'ultramarine': 0.55, 'cobalt': 0.35, 'cerulean': 0.30, 'shadow': 0.45, 'distant': 0.4}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


class Painting:
    def __init__(self, w, h, unit, seed):
        self.w, self.h, self.u = w, h, unit
        self.rng = np.random.default_rng(seed)
        self.layers = {k: np.zeros((h, w), np.float32) for k in PIGMENTS}
        self.yy, self.xx = np.mgrid[0:h, 0:w].astype(np.float32)
        self.paper = self._paper()
        # Bristle streaks: long along the stroke, thin across it. Sampled by every stroke.
        r = self.rng
        fine = gaussian_filter(r.random((1024, 2048), np.float32), (1.1 * unit, 36 * unit), mode='wrap')
        clump = gaussian_filter(r.random((1024, 2048), np.float32), (4.5 * unit, 70 * unit), mode='wrap')
        self.streak = self._norm(fine) * 0.6 + self._norm(clump) * 0.4
        self.streak = self._norm(self.streak)

    @staticmethod
    def _norm(a):
        a = a - a.mean()
        return np.clip(0.5 + a / (a.std() * 4 + 1e-6), 0, 1).astype(np.float32)

    def noise(self, sigma, shape=None):
        """Smooth noise in [0, 1] at a feature size of about sigma pixels, made cheaply at low resolution."""
        h, w = shape or (self.h, self.w)
        f = max(1, int(sigma / 4))
        small = self.rng.random((h // f + 2, w // f + 2), np.float32)
        small = gaussian_filter(small, sigma / f, mode='reflect')
        big = zoom(small, f, order=1)[:h, :w]
        return self._norm(big)

    def fbm(self, sigmas, weights):
        out = sum(wt * self.noise(s) for s, wt in zip(sigmas, weights))
        return self._norm(out)

    def _paper(self):
        u = self.u
        r = self.rng
        h = (gaussian_filter(r.random((self.h, self.w), np.float32), 1.1 * u) * 0.30
             + gaussian_filter(r.random((self.h, self.w), np.float32), 2.8 * u) * 0.40
             + gaussian_filter(r.random((self.h, self.w), np.float32), 7.0 * u) * 0.30)
        return self._norm(h)

    # ---- marks ----

    def stroke(self, pigments, x, y, length, width, angle, load=0.5, bend=0.0, dry=0.35,
               soft=1.2, edge=0.7, streaky=0.55, mask=None):
        """One flat-brush stroke centred on (x, y). pigments: {name: share}."""
        u = self.u
        ca, sa = np.cos(angle), np.sin(angle)
        x0, y0 = x - ca * length / 2, y - sa * length / 2
        pad = width + abs(bend) + 8 * u
        corners_x = [x0 - pad, x0 + ca * length + pad, x0 + pad, x0 + ca * length - pad]
        corners_y = [y0 - pad, y0 + sa * length + pad, y0 + pad, y0 + sa * length - pad]
        bx0, bx1 = int(max(0, min(corners_x))), int(min(self.w, max(corners_x) + 1))
        by0, by1 = int(max(0, min(corners_y))), int(min(self.h, max(corners_y) + 1))
        if bx1 <= bx0 or by1 <= by0:
            return
        X = self.xx[by0:by1, bx0:bx1] - x0
        Y = self.yy[by0:by1, bx0:bx1] - y0
        a = X * ca + Y * sa          # along the stroke
        v = -X * sa + Y * ca         # across it
        t = a / length
        v = v - bend * (1 - (2 * t - 1) ** 2)

        r = self.rng
        # Wobbly edges and a slight taper toward the end.
        wob = np.interp(a, np.linspace(-pad, length + pad, 9), r.normal(0, 1, 9)).astype(np.float32)
        wob2 = np.interp(a, np.linspace(-pad, length + pad, 40), r.normal(0, 1, 40)).astype(np.float32)
        hw = width / 2 * (1 + 0.16 * wob + 0.05 * wob2) * (1 - 0.28 * np.clip(t, 0, 1) ** 2)
        side = smoothstep(hw + soft * u, hw - soft * u, np.abs(v))
        # Rounded start where the loaded brush first touches down.
        cap = hw * 0.9 * np.sqrt(np.clip(1 - (v / np.maximum(hw, 1)) ** 2, 0, 1))
        start = smoothstep(-cap - soft * u, -cap + soft * u, a)
        # Bristles run dry at different points, so the end breaks into streaks.
        ou, ov = r.integers(0, 2048), r.integers(0, 1024)
        vi = ((v + ov).astype(np.int32)) % 1024
        ai = ((a * 0.5 + ou).astype(np.int32)) % 2048
        st = self.streak[vi, ai]
        bristle_end = length * (1 - dry * (1 - self.streak[vi, ou % 2048]) ** 1.3)
        end = smoothstep(bristle_end + 1.5 * u, bristle_end - 1.5 * u, a)
        shape = side * start * end

        # Pigment: heavy where the brush lands, thinning out, streaky inside.
        along = 1 - 0.45 * np.clip(t, 0, 1)
        d = load * shape * along * ((1 - streaky) + streaky * st * 1.6)
        # Dry brush skips the high points of the paper near the end.
        skip = smoothstep(0.62 - 0.25 * dry * np.clip(t, 0, 1), 0.72, self.paper[by0:by1, bx0:bx1])
        d *= 1 - skip * np.clip((t - 0.35) / 0.65, 0, 1) * dry * 1.4
        # Pigment pools at the edge as the stroke dries.
        if edge > 0:
            eb = gaussian_filter(shape, 2.6 * u)
            d += load * edge * shape * np.clip(1 - eb, 0, 1) * 1.3
        if mask is not None:
            d *= mask[by0:by1, bx0:bx1]
        for name, share in pigments.items():
            self.layers[name][by0:by1, bx0:bx1] += d * share

    def wash(self, name, density):
        self.layers[name] += density.astype(np.float32)

    def bloom(self, name, x, y, radius, strength):
        """A backrun: wet paint pushed outward, leaving a pale centre and a cauliflower edge."""
        r = self.rng
        n = self.noise(radius * 0.18)
        dist = np.hypot(self.xx - x, self.yy - y) / radius
        dist = dist + (n - 0.5) * 0.55
        inside = smoothstep(1.0, 0.94, dist)
        rim = inside * smoothstep(0.82, 0.99, dist)
        layer = self.layers[name]
        layer *= 1 - 0.45 * strength * inside * (1 - rim)
        layer += strength * 0.35 * rim * (0.6 + 0.4 * r.random())

    # ---- finish ----

    def render(self):
        log = np.zeros((self.h, self.w, 3), np.float32)
        pg = self.paper - 0.5
        for name, d in self.layers.items():
            g = GRANULATES.get(name, 0.12)
            dd = d * (1 + g * pg * 1.5)
            log += dd[..., None] * np.log(np.array(PIGMENTS[name], np.float32))[None, None, :]
        img = PAPER[None, None, :] * np.exp(log)
        # The paper's tooth catches the light from the upper left.
        p = self.paper
        relief = p - np.roll(np.roll(p, 1, 0), 1, 1)
        img *= (1 + 0.035 * relief)[..., None]
        img *= (0.985 + 0.015 * p)[..., None]
        return np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)


def paint(w, h, unit, layout, seed=SEED):
    P = Painting(w, h, unit, seed)
    r = P.rng
    X, Y = P.xx / w, P.yy / h
    aspect = w / h
    horizon = layout['horizon']
    sx, sy, sr = layout['sun']  # sun centre (fractions) and radius (fraction of width)
    sun_d = np.hypot((P.xx - sx * w), (P.yy - sy * h)) / (sr * w)
    sun_d = sun_d * (1 + 0.5 * (P.noise(30 * unit) - 0.5)) * (1 + 0.6 * (P.noise(110 * unit) - 0.5))

    # Clouds: clustered blobs of untouched paper with lost-and-found edges.
    cloud = np.zeros((h, w), np.float32)
    cloud_shadow = np.zeros((h, w), np.float32)
    edge_noise = P.noise(7 * unit) * 0.5 + P.noise(26 * unit) * 0.5
    for cx, cy, cw, ch, puffs in layout['clouds']:
        for _ in range(puffs):
            px = cx + r.normal(0, cw * 0.32)
            py = cy + r.normal(0, ch * 0.22) - abs(r.normal(0, ch * 0.18))
            rx = cw * r.uniform(0.16, 0.34)
            ry = rx * aspect * r.uniform(0.55, 0.85) if aspect > 1 else rx * aspect * r.uniform(0.9, 1.3)
            ry = min(ry, ch * 0.7)
            d = np.hypot((X - px) / rx, (Y - py) / ry)
            d = d + (edge_noise - 0.5) * 0.7
            blob = smoothstep(1.0, 0.8, d)
            cloud = np.maximum(cloud, blob)
            cloud_shadow = np.maximum(cloud_shadow, blob * smoothstep(py - ry * 0.05, py + ry * 0.85, Y))
    flat_bottom = smoothstep(horizon - 0.02, horizon - 0.25, Y)
    cloud *= flat_bottom ** 0.3
    cloud = gaussian_filter(cloud, 1.5 * unit)
    soft = gaussian_filter(cloud, 7 * unit)
    lost = smoothstep(0.35, 0.65, P.noise(30 * unit))
    cloud = np.clip(cloud * (1 - lost * 0.7) + soft * lost * 0.85, 0, 1)
    cloud_shadow = gaussian_filter(cloud_shadow, 8 * unit) * cloud

    # The sun is bare paper ringed by warm glow; blue stays clear of the glow so it never turns green.
    sun_clear = smoothstep(2.9, 1.7, sun_d)
    sky_mask = (1 - cloud * 0.95) * (1 - sun_clear)
    P.wash('shadow', 0.4 * cloud_shadow * (0.5 + P.noise(14 * unit)))
    P.wash('rose', 0.12 * cloud * (1 - cloud_shadow))
    sky_mask *= smoothstep(horizon + 0.005, horizon - 0.04, Y)
    # Where the sky was cut in around a cloud, the wash dried with a darker rim.
    rim = np.clip(gaussian_filter(cloud, 3 * unit) - cloud, 0, 1) * (1 - lost) * smoothstep(horizon - 0.05, horizon - 0.2, Y)
    P.wash('cerulean', 1.6 * rim)
    P.wash('ultramarine', 0.6 * rim)

    # 1. Wet-in-wet underwash, graded from deep at the top to pale at the horizon.
    blot = P.fbm([60 * unit, 160 * unit], [0.6, 0.4])
    grade = np.clip(1 - Y / horizon, 0, 1)
    P.wash('cerulean', 0.55 * (0.35 + 0.65 * grade) * (0.75 + 0.5 * blot) * sky_mask)
    P.wash('ultramarine', 0.32 * grade ** 1.6 * (0.7 + 0.6 * blot) * sky_mask)
    P.wash('rose', 0.35 * smoothstep(horizon - 0.32, horizon, Y) * (1 - cloud * 0.6) * smoothstep(horizon + 0.01, horizon - 0.02, Y))
    warm = P.noise(25 * unit)
    P.wash('lemon', 0.38 * smoothstep(2.6, 1.2, sun_d) * smoothstep(0.7, 1.5, sun_d) * (0.4 + warm))
    P.wash('peach', 0.30 * smoothstep(3.4, 1.4, sun_d) * smoothstep(1.0, 1.9, sun_d) * (0.4 + warm))
    # Loose warm strokes swept around the glow.
    for _ in range(layout['sun_strokes']):
        ang = r.uniform(0, 2 * np.pi)
        rad = r.uniform(1.4, 2.4) * sr * w
        x, y = sx * w + np.cos(ang) * rad, sy * h + np.sin(ang) * rad
        P.stroke({'lemon': 0.7, 'peach': 0.3}, x, y, r.uniform(60, 150) * unit, r.uniform(14, 30) * unit,
                 ang + np.pi / 2 + r.normal(0, 0.3), load=r.uniform(0.15, 0.32), dry=0.6, edge=0.4,
                 mask=smoothstep(3.0, 2.2, sun_d) * smoothstep(0.8, 1.3, sun_d))

    # 2. Broad sky strokes on top of the wash, deeper and denser toward the top.
    rows = layout['sky_rows']
    for i in range(rows):
        fy = (i + 0.5) / rows * (horizon - 0.06)
        n = int(layout['strokes_per_row'] * (1.25 - fy / horizon))
        for _ in range(max(3, n)):
            x = r.uniform(-0.1, 1.1) * w
            y = (fy + r.normal(0, 0.35 / rows)) * h
            depth = np.clip(1 - y / (h * horizon), 0, 1)
            width = r.uniform(26, 58) * unit * (0.8 + 0.5 * depth)
            length = r.uniform(140, 420) * unit
            ang = np.radians(r.normal(-4, 5))
            mix_u = 0.25 + 0.6 * depth ** 1.3
            pig = {'ultramarine': mix_u, 'cerulean': 1 - mix_u}
            if r.random() < 0.18:
                pig = {'cobalt': 1.0}
            P.stroke(pig, x, y, length, width, ang, load=r.uniform(0.18, 0.42) * (0.55 + 0.6 * depth),
                     bend=r.normal(0, 10) * unit, dry=r.uniform(0.25, 0.65), mask=sky_mask)

    # 3. Shorter broken dabs, Monet-style, scattered through the middle sky.
    for _ in range(layout['dabs']):
        x = r.uniform(0, 1) * w
        y = r.uniform(0.05, horizon - 0.05) * h
        if sun_d[int(y), int(x)] < 2.4:
            continue
        P.stroke({'cerulean': 0.6, 'cobalt': 0.4}, x, y, r.uniform(40, 110) * unit, r.uniform(12, 26) * unit,
                 np.radians(r.normal(-8, 7)), load=r.uniform(0.12, 0.3), dry=r.uniform(0.4, 0.8),
                 streaky=0.7, mask=sky_mask)

    # 4. Cloud shadows: soft violet-grey dabs on the undersides.
    ys, xs = np.nonzero(cloud_shadow[::8, ::8] > 0.35)
    picks = r.choice(len(ys), size=min(len(ys), layout['shadow_dabs']), replace=False) if len(ys) else []
    for k in picks:
        y, x = ys[k] * 8, xs[k] * 8
        P.stroke({'shadow': 0.9, 'cerulean': 0.1}, x, y, r.uniform(36, 90) * unit, r.uniform(14, 30) * unit,
                 np.radians(r.normal(-8, 14)), load=r.uniform(0.1, 0.25), dry=0.5, soft=4.0, edge=0.25,
                 mask=np.clip(cloud_shadow * 1.6, 0, 1))
    # Warm light on the tops of the clouds nearest the sun.
    ys, xs = np.nonzero((cloud[::8, ::8] > 0.6) & (cloud_shadow[::8, ::8] < 0.2))
    picks = r.choice(len(ys), size=min(len(ys), layout['shadow_dabs'] // 3), replace=False) if len(ys) else []
    for k in picks:
        y, x = ys[k] * 8, xs[k] * 8
        P.stroke({'peach': 0.7, 'lemon': 0.3}, x, y, r.uniform(30, 70) * unit, r.uniform(10, 22) * unit,
                 np.radians(r.normal(-6, 14)), load=r.uniform(0.15, 0.3), dry=0.6, edge=0.3, mask=cloud)

    # 5. A few backruns where the sky wash was still wet.
    for bx, by, br in layout['blooms']:
        P.bloom('cerulean', bx * w, by * h, br * w, 0.8)

    # 6. Ground: a hazy treeline, then the meadow.
    hz = horizon * h
    tree_top = hz - (18 + 26 * P.noise(30 * unit)[0:1, :]) * unit - 22 * unit * P.noise(140 * unit)[0:1, :]
    tree = smoothstep(tree_top - 2 * unit, tree_top + 2 * unit, P.yy) * smoothstep(hz + 30 * unit, hz + 8 * unit, P.yy)
    P.wash('distant', 0.9 * tree * (0.7 + 0.5 * blot))
    P.wash('cerulean', 0.25 * tree)
    for _ in range(layout['tree_dabs']):
        x = r.uniform(0, 1) * w
        y = hz - r.uniform(0, 30) * unit
        P.stroke({'distant': 0.6, 'sap': 0.25, 'cerulean': 0.15}, x, y, r.uniform(16, 40) * unit, r.uniform(10, 22) * unit,
                 np.radians(r.normal(-90, 25)), load=r.uniform(0.25, 0.5), dry=0.5, mask=tree)

    meadow = smoothstep(hz - 2 * unit, hz + 8 * unit, P.yy)
    depth = np.clip((P.yy - hz) / (h - hz + 1), 0, 1)
    pale_left = 1 - 0.45 * smoothstep(0.55, 0.0, X)  # keep the meadow light under the links
    P.wash('ochre', 0.55 * meadow * (0.7 + 0.6 * blot))
    P.wash('sap', meadow * (0.35 + 0.65 * depth) * (0.75 + 0.5 * P.noise(50 * unit)) * pale_left)
    # Horizontal strokes laying in the field, then grass flicked upward.
    for _ in range(layout['field_strokes']):
        x = r.uniform(-0.05, 1.05) * w
        y = r.uniform(hz + 6 * unit, h)
        dep = (y - hz) / (h - hz)
        P.stroke({'sap': 0.7, 'ochre': 0.3}, x, y, r.uniform(120, 320) * unit, r.uniform(14, 34) * unit,
                 np.radians(r.normal(-2, 3)), load=r.uniform(0.2, 0.45) * (0.5 + dep) * (1 - 0.4 * (x / w < 0.5)),
                 dry=r.uniform(0.4, 0.8), mask=meadow)
    for _ in range(layout['grass']):
        x = r.uniform(0, 1) * w
        dep = r.random() ** 0.7
        y = hz + dep * (h - hz) + 10 * unit
        ln = r.uniform(18, 50) * unit * (0.6 + dep)
        pig = {'hooker': 0.6, 'sap': 0.4} if r.random() < 0.55 else {'sap': 0.8, 'ochre': 0.2}
        P.stroke(pig, x, y - ln / 2, ln, r.uniform(3, 7) * unit * (0.7 + dep), np.radians(r.normal(-90, 14)),
                 load=r.uniform(0.3, 0.7) * (0.45 + 0.55 * dep) * (0.55 if x / w < 0.5 else 1), dry=0.7, soft=0.8,
                 streaky=0.3, mask=meadow)
    # A scatter of wildflowers in the grass.
    for _ in range(layout['flowers']):
        x = r.uniform(0, 1) * w
        y = hz + (r.random() ** 0.8) * (h - hz) + 6 * unit
        pig = {'lemon': 1.0} if r.random() < 0.6 else {'ochre': 0.5, 'peach': 0.5}
        P.stroke(pig, x, y, r.uniform(5, 10) * unit, r.uniform(4, 8) * unit, r.uniform(0, 3.14),
                 load=r.uniform(0.6, 1.0), dry=0.2, edge=0.3, streaky=0.2)

    # 7. Spatters flicked off the brush.
    for _ in range(layout['spatter']):
        x, y = r.uniform(0, w), r.uniform(0, hz)
        rad = r.uniform(0.8, 3.2) * unit
        d = np.hypot(P.xx[max(0, int(y - 8)):int(y + 8), max(0, int(x - 8)):int(x + 8)] - x,
                     P.yy[max(0, int(y - 8)):int(y + 8), max(0, int(x - 8)):int(x + 8)] - y)
        P.layers['cerulean'][max(0, int(y - 8)):int(y + 8), max(0, int(x - 8)):int(x + 8)] += 0.5 * smoothstep(rad, rad * 0.6, d)

    return P.render()


WIDE = dict(
    horizon=0.855,
    sun=(0.30, 0.17, 0.055),
    clouds=[
        (0.70, 0.30, 0.20, 0.13, 9),
        (0.92, 0.52, 0.16, 0.10, 7),
        (0.47, 0.60, 0.18, 0.08, 7),
        (0.12, 0.70, 0.16, 0.06, 6),
        (0.62, 0.74, 0.22, 0.05, 6),
    ],
    blooms=[(0.86, 0.13, 0.05), (0.08, 0.40, 0.04), (0.55, 0.43, 0.035)],
    sun_strokes=26, sky_rows=14, strokes_per_row=11, dabs=170, shadow_dabs=150,
    tree_dabs=320, field_strokes=90, grass=1300, flowers=110, spatter=60,
)

TALL = dict(
    horizon=0.875,
    sun=(0.34, 0.11, 0.095),
    clouds=[
        (0.80, 0.36, 0.45, 0.10, 8),
        (0.25, 0.55, 0.40, 0.07, 7),
        (0.75, 0.68, 0.45, 0.05, 6),
    ],
    blooms=[(0.85, 0.12, 0.10), (0.12, 0.42, 0.08)],
    sun_strokes=14, sky_rows=18, strokes_per_row=4, dabs=130, shadow_dabs=80,
    tree_dabs=110, field_strokes=30, grass=500, flowers=40, spatter=25,
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
            img.save(out, 'WEBP', quality=84, method=6)
        print(f'{out.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {out.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
