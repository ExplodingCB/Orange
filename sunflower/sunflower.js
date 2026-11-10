// The homepage sunflower: a procedural 3D model, repainted every frame as oil dabs so it
// sits in the same hand as the sky (background-src/paint.py).
//
// How a frame is made:
//   1. The shaded model is drawn to an offscreen target (colour + depth). Wind is applied
//      in the vertex shader.
//   2. A paint buffer (colour + paint height) gets a thin underpainting from that target,
//      then a few thousand brush dabs. Every dab is pinned to a point on the model and
//      goes through the same wind as the mesh, so the brushwork rides the flower and
//      doesn't boil. A dab takes the shaded colour at its anchor, plus broken colour.
//   3. The height buffer is lit from the upper left with a faint sheen, like paint.py
//      lights the background, and canvas weave shows where paint is thin.
// Dab sizes are in the painting's own "units" (paint.py's `unit`), so they match the
// background's dabs at any viewport size.

const TAU = Math.PI * 2;
const GOLDEN = TAU * (1 - 1 / 1.618033988749895); // 137.508 degrees
const { sin, cos, sqrt, pow, abs, min, max, round, ceil, exp, PI } = Math;
const clamp = (x, a, b) => min(b, max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rng = (s) => () => {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// ---------------------------------------------------------------- shaders

const COMMON = /* glsl */`
precision highp float;
uniform mat4 uM[7];   // 1 = head, 2.. = leaves (0 unused: the stem bends in dfm)
uniform vec4 uW;      // stem tip offset x, z; flutter strength; time
uniform vec4 uV;      // world -> clip scale and offset
uniform float uDrop;
const vec3 SUN = vec3(-.5503, .6003, .5803);
const vec3 LEM = vec3(.965, .824, .29), CAD = vec3(.945, .725, .157), ORA = vec3(.89, .604, .11),
    SIE = vec3(.769, .435, .071), LAV = vec3(.63, .6, .72),
    UMB = vec3(.247, .141, .063), RAW = vec3(.478, .29, .11), OCH = vec3(.85, .64, .2), VIO = vec3(.42, .32, .52),
    G1 = vec3(.561, .682, .353), G2 = vec3(.42, .58, .275), G3 = vec3(.239, .4, .282), G4 = vec3(.427, .561, .525);

// The one wind deformation, shared by the mesh and by every dab anchor.
// f = (along 0..1, across -1..1, phase, flutter amplitude), m = (part, material, ao, flutter rad/s)
vec3 dfm(vec3 p, vec3 n, vec4 f, vec4 m) {
    if (m.x < .5) {   // stem: a cantilever, displacement grows with height squared
        float q = f.x * f.x;
        return p + vec3(uW.x * q, -uDrop * q * f.x, uW.y * q);
    }
    float a = uW.w * m.w + f.z * 50.;
    p += n * (uW.z * f.w * f.x * ((sin(a) + .5 * sin(a * 1.73 + f.z * 9.)) * f.x + .7 * f.y * sin(a * .71 + f.z * 31.)));
    return (uM[int(m.x + .5)] * vec4(p, 1.)).xyz;
}
vec3 rotn(vec3 n, vec4 m) { return m.x < .5 ? n : mat3(uM[int(m.x + .5)]) * n; }
vec3 r4(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    t = clamp(t, 0., 1.) * 3.;
    return t < 1. ? mix(a, b, t) : t < 2. ? mix(b, c, t - 1.) : mix(c, d, t - 2.);
}
// Shading moves through hues as well as values: warm in the light, cool in shadow.
// mt: 0 stem, 1 leaf, 2 petal, 3 disk, 4 bract, 5 meadow grass. q = (along, across).
vec3 shade(float mt, vec3 n, vec2 q, float ao, float j) {
    if (mt > 4.5) return n * (1. + j);   // meadow grass carries its own colour
    float bk = step(n.z, 0.);
    n *= 1. - 2. * bk;
    float wr = mt < 1.5 ? .22 : .5;   // leaves and stem turn harder from light to shade
    float t = clamp((dot(n, SUN) + wr) / (1. + wr), 0., 1.) * ao + j;
    float sk = .5 + .5 * n.y;
    vec3 c;
    if (mt > 2.5 && mt < 3.5) {
        float w = clamp(.1 + .6 * q.x * q.x + .7 * (t - .5) + .3 * q.y, 0., 1.);
        c = mix(UMB, RAW, w);
        c = mix(c, mix(RAW, OCH, .3 + .7 * q.y) * (.75 + .3 * t), smoothstep(.74, .88, q.x));
        c = mix(c, VIO, clamp(1. - t, 0., 1.) * .25 * sk);
    } else if (mt > 1.5 && mt < 2.5) {
        t = t * .82 + .12 * q.x - .1 * (1. - abs(q.y)) * (1. - q.x);
        c = t < .25 ? mix(mix(SIE, LAV, .6), SIE, clamp(t * 4., 0., 1.)) : r4(SIE, ORA, CAD, LEM, (t - .25) / .75);
        c = mix(c, LAV, clamp(.7 - t, 0., 1.) * .3 * sk);
        c = mix(c, vec3(.83, .76, .47), bk * .35);
    } else {
        t = mt > 3.5 ? t * .8 : pow(max(t, 0.), .8) * (mt > .5 ? 1.06 : 1.2);
        c = r4(mix(G3, G4, .5), G3, G2, G1, t);
        if (mt > .5 && mt < 1.5) {
            c = mix(c, G1 + .07, .6 * smoothstep(.12, 0., abs(q.y)));
            c = mix(c, G4, bk * .4);
        } else if (mt < .5) c = mix(c, vec3(.62, .68, .36), .18);
        c = mix(c, G4, clamp(1. - t, 0., 1.) * .28 * sk);
    }
    return c;
}`;

const MESH_VS = COMMON + /* glsl */`
in vec3 aP, aN; in vec4 aF, aM;
out vec3 vN; out vec4 vF, vM;
void main() {
    vec3 p = dfm(aP, aN, aF, aM);
    vN = rotn(aN, aM); vF = aF; vM = aM;
    gl_Position = vec4(p.xy * uV.xy + uV.zw, -p.z * .5, 1.);
}`;

const MESH_FS = COMMON + /* glsl */`
uniform float uHide;
in vec3 vN; in vec4 vF, vM;
out vec4 o;
void main() {
    if (vM.x < .5 && vF.x < uHide) discard;   // the foot of the stem is left to the grass
    o = vec4(shade(vM.y, normalize(vN), vF.xy, vM.z, 0.), 1.);
}`;

const QUAD_VS = /* glsl */`
precision highp float;
in vec3 aP; out vec2 vUv;
void main() { vUv = aP.xy * .5 + .5; gl_Position = vec4(aP.xy, 0., 1.); }`;

// Underpainting: the shaded model, pulled in from its outline so that only dabs ever
// draw the silhouette, laid thin and a little warm like paint.py's ground.
const BASE_FS = /* glsl */`
precision highp float;
uniform sampler2D uT; uniform vec2 uE;
in vec2 vUv;
layout(location = 0) out vec4 o0; layout(location = 1) out vec4 o1;
void main() {
    vec4 c = texture(uT, vUv);
    float a = min(min(texture(uT, vUv + uE).a, texture(uT, vUv - uE).a),
        min(texture(uT, vUv + vec2(uE.x, -uE.y)).a, texture(uT, vUv + vec2(-uE.x, uE.y)).a));
    a = smoothstep(.3, .95, min(a, c.a)) * .9;
    if (a < .004) discard;
    o0 = vec4(mix(c.rgb, vec3(.847, .765, .627), .1) * a, a);
    o1 = vec4(.2 * a, 0., 0., a * .7);
}`;

const DAB_VS = COMMON + /* glsl */`
uniform highp sampler2D uZ;
uniform vec2 uR;      // target size in device px
uniform float uU;     // device px per painting unit
in vec2 aC;
in vec3 aP, aD, aN; in vec4 aF, aM, aS;   // aS = (length, width, seed, opacity)
out vec2 vQ, vO; out vec4 vS; out vec3 vA, vB;
float h1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
vec3 h3(float x) { return vec3(h1(x), h1(x + 1.7), h1(x + 3.1)) - .5; }
vec3 accent(float mt, float r) {
    if (mt > 1.5 && mt < 2.5) return r < .3 ? vec3(.97, .91, .66) : r < .55 ? vec3(.91, .63, .44) : r < .8 ? vec3(.66, .66, .85) : vec3(.78, .69, .48);
    if (mt > 2.5 && mt < 3.5) return r < .35 ? OCH : r < .65 ? VIO : r < .85 ? vec3(.6, .29, .13) : G4;
    return r < .22 ? vec3(.85, .8, .475) : r < .45 ? G1 : r < .7 ? G4 : r < .85 ? vec3(.64, .71, .416) : vec3(.78, .69, .48);
}
void main() {
    vec3 p = dfm(aP, aN, aF, aM), p1 = dfm(aP + aD * .03, aN, aF, aM);
    vec2 c = p.xy * uV.xy + uV.zw;
    vec2 d = (p1.xy - p.xy) * uV.xy * uR * .5;
    float fs = clamp(length(d) / (.03 * uV.x * uR.x * .5), 0., 1.);   // 1 flat-on, 0 end-on
    d = normalize(d + vec2(1e-4, 0.));
    float wid = aS.y, len = max(aS.x * mix(.45, 1., fs), wid * 1.3);
    float vis = 1.;
    if (aM.y < 4.5) {   // hidden behind something nearer? Several taps, so dabs fade instead of popping.
        float z = .5 - p.z * .25 - .004;
        vec2 uv = c * .5 + .5, e = 1.6 * uU / uR;
        vis = 2. * step(z, texture(uZ, uv).r) + step(z, texture(uZ, uv + vec2(e.x, 0.)).r) + step(z, texture(uZ, uv - vec2(e.x, 0.)).r)
            + step(z, texture(uZ, uv + vec2(0., e.y)).r) + step(z, texture(uZ, uv - vec2(0., e.y)).r);
        vis = smoothstep(.15, .6, vis / 6.);
    }
    float pad = wid * .5 + 3.;
    vec2 q = vec2(mix(-pad, len + pad, aC.x), aC.y * pad);
    vec2 px = (d * (q.x - len * .5) + vec2(-d.y, d.x) * q.y) * uU;
    gl_Position = vis < .01 ? vec4(2., 2., 2., 1.) : vec4(c + px * 2. / uR, 0., 1.);
    float s = aS.z;
    vQ = q;
    vS = vec4(len, wid, h1(s) * 512., h1(s + .37) * 128.);
    vO = vec2(vis * aS.w * (.85 + .15 * h1(s + .9)), (h1(s + .6) - .5) * 3.);
    // Broken colour: two nearby tones on one brush, now and then an accent.
    bool grass = aM.y > 4.5;   // grass: aN and aF.yzw are two colours picked from the painting
    vec3 n = grass ? aN : normalize(rotn(aN, aM));
    float j = (h1(s + 1.) - .5) * .26;
    vA = shade(aM.y, n, aF.xy, aM.z, j);
    vB = shade(aM.y, grass ? aF.yzw : normalize(n + h3(s + 2.) * .6), aF.xy, aM.z, j + (h1(s + 5.) - .5) * .3);
    if (h1(s + 6.) < .5) vB = mix(vB, accent(aM.y, h1(s + 7.)), .3 + .3 * h1(s + 8.));
    if (h1(s + 9.) < .18) vA = mix(vA, accent(aM.y, h1(s + 10.)), .15 + .15 * h1(s + 11.));
    vA = vA * (1. + h3(s + 12.) * .05) + (h1(s + 15.) - .5) * .05;
    vB = vB * (1. + h3(s + 16.) * .05) + (h1(s + 19.) - .5) * .05;
}`;

// One dab, the same recipe as dab() in paint.py: round start, ragged dry end, two colours
// dragged into each other, bristle ridges and paint pushed up along the sides.
const DAB_FS = /* glsl */`
precision highp float;
uniform sampler2D uSt;
in vec2 vQ, vO; in vec4 vS; in vec3 vA, vB;
layout(location = 0) out vec4 o0; layout(location = 1) out vec4 o1;
float st(float a, float v) { return texture(uSt, vec2(a / 512., v / 128.)).r; }
void main() {
    float len = vS.x, t = vQ.x / len, tc = clamp(t, 0., 1.);
    float v = vQ.y - vO.y * (1. - (2. * tc - 1.) * (2. * tc - 1.));
    float hw = vS.y * .5 * (1. - .25 * tc * tc);
    float side = smoothstep(hw + .8, hw - .8, abs(v));
    float cap = hw * .8 * sqrt(clamp(1. - v * v / (hw * hw), 0., 1.));
    float start = smoothstep(-cap - .8, -cap + .8, vQ.x);
    float s = st(vQ.x + vS.z, v + vS.w);
    float dry = .45;
    float endl = len * (1. - dry * pow(1. - st(vS.z, v + vS.w), 1.5));
    float shape = side * start * smoothstep(endl + 1.2, endl - 1.2, vQ.x);
    float thin = clamp((t - .55) / .45, 0., 1.) * dry;
    float alpha = shape * vO.x * (1. - thin * smoothstep(.53, .47, s) * .8);
    if (alpha < .004) discard;
    vec3 c = mix(vA, vB, smoothstep(.35, .75, st(vS.z + 300., v + vS.w))) * (.95 + .1 * s);
    float rim = smoothstep(.55, .95, abs(v) / hw) * side;
    float thick = (.6 + .4 * s + .25 * rim) * (1. - .5 * thin);
    o0 = vec4(c * alpha, alpha);
    o1 = vec4(thick * alpha, 0., 0., alpha * .7);
}`;

// Light the paint relief from the upper left, as paint.py does at the end.
const LIGHT_FS = /* glsl */`
precision highp float;
uniform sampler2D uC, uH; uniform vec2 uR; uniform float uU;
in vec2 vUv; out vec4 o;
float hgt(vec2 d) {
    vec2 uv = vUv + d * uU / uR;
    float h = texture(uH, uv).r;
    // Linen weave, fixed to the screen, showing where the paint is thin.
    vec2 w = (gl_FragCoord.xy + d * uU) / (uU * 3.2), s = sin(w * 3.14159);
    float th = mod(floor(w.x) + floor(w.y), 2.) > .5 ? s.x * s.x : s.y * s.y;
    return h + .12 * (.5 + (th - .5) * .6) * clamp(1. - h, 0., 1.);
}
void main() {
    vec4 c = texture(uC, vUv);
    if (c.a < .004) { o = vec4(0.); return; }
    float a = hgt(vec2(-1., 1.)), b = hgt(vec2(0., 1.)), cc = hgt(vec2(1., 1.)), d = hgt(vec2(-1., 0.)),
        e = hgt(vec2(1., 0.)), f = hgt(vec2(-1., -1.)), g = hgt(vec2(0., -1.)), h = hgt(vec2(1., -1.));
    vec2 gr = vec2(cc + 2. * e + h - a - 2. * d - f, a + 2. * b + cc - f - 2. * g - h) / 8.;
    vec3 n = normalize(vec3(-gr * 3.2, 1.));
    const vec3 L = vec3(-.5503, .6003, .5803);
    float diff = dot(n, L);
    float spec = pow(clamp(dot(n, normalize(L + vec3(0., 0., 1.))), 0., 1.), 30.);
    o = vec4(c.rgb * (1. + .26 * (diff - L.z)) + .05 * spec * c.a, c.a);
}`;

// ---------------------------------------------------------------- surfaces

// A petal (or bract) in head space. The head faces +z with its neck at the origin.
// u runs base to tip, v across. It leaves the rim at angle p0 above the disk plane and
// curls back by `droop` radians along its length; cupped across, twisted along.
function petalS(th, L, W, p0, droop, twist, cup, rb, zb) {
    const cr = cos(th), sr = sin(th), d = droop || 1e-4;
    return (u, v) => {
        const a = p0 - d * u, sa = sin(a), ca = cos(a);
        const w = W * 1.75 * pow(max(u, 0) + .12, .6) * pow(max(1 - u, 0), .55);
        const lat = v * w, up = cup * v * v * w, ct = cos(twist * u), sn = sin(twist * u);
        const k = lat * sn + up * ct, tt = lat * ct - up * sn;
        const r = rb + L * (sin(p0) - sa) / d - k * sa;
        return [cr * r - sr * tt, sr * r + cr * tt, zb + L * (ca - cos(p0)) / d + k * ca];
    };
}

// A heart-shaped leaf in its own space: x along the midrib, y up out of the blade, z across.
// The midrib arcs down through `a` radians; the blade folds along it and its edges curl.
function leafS(Lb, W, a, lp, fold, curl, ph) {
    return (u, v) => {
        const w = W * 2.05 * sqrt(max(u, 0) + .08) * pow(max(1 - u, 0), .9);
        const t = a * (u - .3 * v * v * pow(max(1 - u, 0), 3));   // lobes sweep back past the petiole
        const av = abs(v);
        const h = w * (fold * av - .35 * av * av * av + curl * v * v * sin(u * 8 + ph + v * 1.5));
        return [lp + Lb * sin(t) / a + sin(t) * h, -Lb * (1 - cos(t)) / a + cos(t) * h, v * w];
    };
}

const DISK_R = .22, DISK_Z = .085;
const domeS = (u, v) => [DISK_R * u * cos(v * PI), DISK_R * u * sin(v * PI), DISK_Z + .03 * (1 - u * u) - .012 * exp(-u * u / .09)];

// Position, unit tangents and normal of a surface at (u, v).
function frame(S, u, v) {
    const e = 2e-3, uc = clamp(u, .03, .96);
    const du = sub(S(uc + e, v), S(uc - e, v)), dv = sub(S(uc, v + e), S(uc, v - e));
    return { p: S(u, v), du: unit3(du), dv: unit3(dv), n: unit3(cross(du, dv)) };
}

// ---------------------------------------------------------------- the model and its dabs

function build(THREE, W, H, unit, meadow) {
    const r = rng(20261110), R = (a, b) => a + (b - a) * r();
    const P = [], N = [], F = [], M = [], I = [], dabs = [];
    const vert = (p, n, f, m) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); F.push(f[0], f[1], f[2], f[3]); M.push(m[0], m[1], m[2], m[3]); return P.length / 3 - 1; };
    const grid = (S, nu, nv, at, v0 = -1) => {
        const b = P.length / 3;
        for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
            const u = i / nu, v = v0 + (1 - v0) * j / nv, a = at(u, v);
            vert(S(u, v), frame(S, u, v).n, a, a.slice(4));
        }
        for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
            const a = b + i * (nv + 1) + j, c = a + nv + 1;
            I.push(a, c, a + 1, a + 1, c, c + 1);
        }
    };

    // ---- head: 34 + 21 ray petals, bracts behind, a domed disk of 610 florets
    const petals = [];
    const ring = (n, off, L0, W0, p0, dr, rb, zb, amp, ao) => {
        for (let i = 0; i < n; i++) {
            const L = L0 * R(.86, 1.14);
            petals.push({
                S: petalS((i + off + R(-.2, .2)) * TAU / n, L, W0 * R(.88, 1.12), p0 + R(-.1, .1), dr + R(-.28, .3) + (r() < .12 ? .55 : 0), R(-.5, .5), R(.25, .6), rb, zb),
                L, W: W0, ph: r(), amp: amp * R(.7, 1.3), ao, fq: R(9, 15),
                lit: R(.84, 1) * (1 - .2 * (.5 + .5 * cos((i + off) * TAU / n + .75))),   // lower right is away from the sun
            });
        }
    };
    ring(34, 0, .3, .05, .2, .5, DISK_R * .97, DISK_Z - .004, .02, .45);
    ring(21, .5, .26, .046, .5, .45, DISK_R * .95, DISK_Z + .006, .011, .72);
    const petalAt = (pt) => (u, v) => [u, v, pt.ph, pt.amp, 1, 2, (pt.ao + (1 - pt.ao) * sstep(0, .55, u)) * pt.lit, pt.fq];
    for (const pt of petals) grid(pt.S, 9, 4, petalAt(pt));
    const bracts = [];
    for (let i = 0; i < 21; i++) {
        const L = R(.17, .23), S = petalS((i + .25 + R(-.2, .2)) * TAU / 21, L, .055, -.3, -.6, 0, .3, DISK_R * .8, DISK_Z - .03);
        bracts.push({ S, L });
        grid(S, 4, 2, (u, v) => [u, v, 0, 0, 1, 4, .7 + .3 * u, 0]);
    }
    grid((u, v) => {   // receptacle: the green cup the head sits in
        const rr = .028 + (DISK_R * 1.02 - .028) * pow(1 - u, .65), a = v * PI;
        return [rr * cos(a), rr * sin(a), (DISK_Z - .006) * pow(1 - u, 1.4)];
    }, 4, 24, () => [0, 0, 0, 0, 1, 4, .75, 0]);
    grid(domeS, 6, 32, (u) => [u, 0, 0, 0, 1, 3, 1 - .15 * exp(-u * u / .09), 0]);
    const NF = 610;
    for (let i = 0; i < NF; i++) {   // florets in Fibonacci phyllotaxis
        const u = sqrt((i + .5) / NF), th = i * GOLDEN, fr = frame(domeS, u, th / PI);
        const n = fr.n[2] < 0 ? fr.n.map((x) => -x) : fr.n;
        const rho = DISK_R * .045 * (.7 + .6 * u), h = rho * (u > .82 ? 2.2 : 1.2);
        const tip = vert([fr.p[0] + n[0] * h, fr.p[1] + n[1] * h, fr.p[2] + n[2] * h], n, [u, 1, 0, 0], [1, 3, 1, 0]);
        for (let j = 0; j < 6; j++) {
            const a = j * TAU / 6 + i, ca = cos(a) * rho, sa = sin(a) * rho;
            const o = [fr.du[0] * ca + fr.dv[0] * sa, fr.du[1] * ca + fr.dv[1] * sa, fr.du[2] * ca + fr.dv[2] * sa];
            vert([fr.p[0] + o[0], fr.p[1] + o[1], fr.p[2] + o[2]], unit3([n[0] + o[0] / rho * 1.2, n[1] + o[1] / rho * 1.2, n[2] + o[2] / rho * 1.2]), [u, 0, 0, 0], [1, 3, .72, 0]);
            I.push(tip, tip + 1 + j, tip + 1 + (j + 1) % 6);
        }
    }

    // ---- framing. The head is turned toward the sun, up and to the left.
    const hz = new THREE.Vector3(-.5, .1, .86).normalize();
    const hx = new THREE.Vector3(0, 1, 0).cross(hz).normalize();
    const headR = new THREE.Matrix4().makeBasis(hx, hz.clone().cross(hx), hz);
    let x0 = 9, x1 = -9, y1 = -9;
    const he = headR.elements;
    for (let i = 0; i < P.length; i += 3) {
        const x = he[0] * P[i] + he[4] * P[i + 1] + he[8] * P[i + 2], y = he[1] * P[i] + he[5] * P[i + 1] + he[9] * P[i + 2];
        x0 = min(x0, x); x1 = max(x1, x); y1 = max(y1, y);
    }
    const ppw = .5 * W / (x1 - x0);           // CSS px per world unit: the head spans half the box
    const wW = W / ppw, wH = H / ppw, k = ppw / unit;   // k: painting units per world unit
    const neck = new THREE.Vector3(-.13, .92 * wH - y1, .05);   // head top 8% below the box top

    // Colour of the painted meadow behind a point (world units from the foot of the stem).
    const pick = (x, y) => meadow?.(x * ppw, y * ppw) || [.42 + .2 * r(), .58 + .12 * r(), .28 + .06 * r()];

    // ---- stem: tapered, a gentle S, hooking forward into the back of the head
    const hy = neck.y, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(.1, .3 * hy, .03), V3(0, .62 * hy, -.02), V3(-.13, .86 * hy, -.07),
        neck.clone().addScaledVector(hz, -.14).add(V3(0, -.02, 0)), neck]);
    const Ls = curve.getLength(), HIDE = .045;
    const stemR = (s) => .034 - .013 * s + .01 * sstep(.93, 1, s);
    const stemS = (s, v) => {
        const sc = clamp(s, 0, 1), c = curve.getPointAt(sc), t = curve.getTangentAt(sc);
        const e2 = V3(1, 0, 0).cross(t).normalize(), e1 = t.clone().cross(e2), a = v * TAU, rr = stemR(sc);
        return [c.x + rr * (cos(a) * e1.x + sin(a) * e2.x), c.y + rr * (cos(a) * e1.y + sin(a) * e2.y) + (s - sc) * Ls, c.z + rr * (cos(a) * e1.z + sin(a) * e2.z)];
    };
    grid(stemS, 48, 10, (u, v) => [u, v, 0, 0, 0, 0, 1 - .3 * sstep(.72, .95, u), 0], 0);

    // ---- leaves: alternate, heart-shaped, the lower ones bigger and drooping more
    const leaves = [
        [.2, 3.4, .62, .14, .45, 1.5], [.33, -.25, .57, .13, .5, 1.35], [.46, 2.85, .5, .12, .6, 1.15],
        [.59, .3, .42, .1, .7, .95], [.71, 3.4, .32, .08, .8, .75],
    ].map(([s, az, Lb, lp, el, a], i) => {
        const lf = { s, az, el, Lb, W: Lb * .42, ph: r(), fq: R(7, 11), amp: .07 * Lb, c: curve.getPointAt(s) };
        lf.S = leafS(Lb, lf.W, a, lp, R(.38, .55), R(.1, .18), R(0, 6));
        lf.roll = (cos(az) > 0 ? 1 : -1) * R(.9, 1.2);   // rolled so the blade shows its face
        grid(lf.S, 14, 10, (u, v) => [u, v, lf.ph, lf.amp, 2 + i, 1, .78 + .22 * u, lf.fq]);
        lf.pS = (u, v) => [u * lp * 1.05, .011 * cos(v * TAU) - .004, .011 * sin(v * TAU)];
        grid(lf.pS, 3, 6, () => [1, 0, lf.ph, 0, 2 + i, 0, .85, 0], 0);
        return lf;
    });

    // ---- pose: where the head and leaves sit for a given bend of the stem
    const mats = Array.from({ length: 7 }, () => new THREE.Matrix4());
    const A = new THREE.Matrix4(), B = new THREE.Matrix4();
    const wind = new THREE.Vector4(), dropU = { value: 0 };
    // th, thz: angle of the stem tip (rad) across and in depth. thl: th as the head feels it, late.
    const pose = (th, thz, thl, flut, t) => {
        const D = th * Ls / 2, Dz = thz * Ls / 2, drop = dropU.value = (D * D + Dz * Dz) / Ls * 2 / 3;
        wind.set(D, Dz, flut, t);
        mats[1].makeTranslation(neck.x + D, neck.y - drop, neck.z + Dz)
            .multiply(A.makeRotationZ(-thl)).multiply(A.makeRotationX(.5 * abs(thl) + thz + .012 * flut * sin(t * 1.3))).multiply(headR);
        leaves.forEach((lf, i) => {
            const q = lf.s * lf.s, tw = flut * (.07 * sin(lf.fq * t * .5 + lf.ph * 40) + .04 * sin(lf.fq * t * .93 + lf.ph * 90));
            mats[2 + i].makeTranslation(lf.c.x + D * q, lf.c.y - drop * q * lf.s, lf.c.z + Dz * q)
                .multiply(A.makeRotationZ(-th * lf.s)).multiply(A.makeRotationY(lf.az))
                .multiply(A.makeRotationZ(lf.el + max(th, 0) + .03 * tw)).multiply(B.makeRotationX(lf.roll + tw));
        });
    };
    pose(0, 0, 0, 0, 0);

    // ---- dabs. Sizes in painting units; `key` sorts them far to near.
    const dab = (S, u, v, ang, f, m, len, wid, op = 1, key = 0) => {
        const fr = frame(S, u, v), ca = cos(ang), sa = sin(ang), p = fr.p;
        const d = unit3([fr.du[0] * ca + fr.dv[0] * sa, fr.du[1] * ca + fr.dv[1] * sa, fr.du[2] * ca + fr.dv[2] * sa]);
        const e = mats[m[0]].elements, z = m[0] ? e[2] * p[0] + e[6] * p[1] + e[10] * p[2] + e[14] : p[2];
        dabs.push([z + key, ...p, ...d, ...fr.n, f[0], f[1], f[2], f[3], ...m, len, wid, r() * 100, op]);
    };
    for (const pt of petals) {   // lengthwise, one to three strokes long
        const Lu = pt.L * k, n = max(2, round(Lu / 16)), two = pt.W * 1.6 * k > 15;
        for (let j = 0; j < n; j++) for (let c = 0; c < (two ? 2 : 1); c++) {
            const u = (j + .5) / n * .9 + .05 + R(-.04, .04), v = two ? (c ? .42 : -.42) + R(-.1, .1) : R(-.2, .2);
            dab(pt.S, u, v, R(-.12, .12), petalAt(pt)(u, v), [1, 2, petalAt(pt)(u, v)[6], pt.fq],
                clamp(Lu / n * 1.7, 9, 30), clamp(pt.W * 1.6 * k * (two ? .6 : .85) * (1.1 - .35 * u), 4.5, 9));
        }
    }
    for (const b of bracts) dab(b.S, .55, 0, 0, [.55, 0, 0, 0], [1, 4, .85, 0], clamp(b.L * k * .75, 9, 24), R(5, 6.5));
    const Rk = DISK_R * k, nd = round(PI * Rk * Rk / 55 * 2.4);
    for (let j = 0; j < nd; j++) {   // along the spiral of the florets
        const i = (j + r()) / nd * NF * .86, u = sqrt(i / NF), ao = 1 - .15 * exp(-u * u / .09);
        dab(domeS, u, Math.floor(i) * GOLDEN / PI, 1.15 + R(-.15, .15), [u, r(), 0, 0], [1, 3, ao, 0], R(8, 13), R(4.5, 6.2), 1, .012);
    }
    for (let j = 0, nr = round(TAU * Rk / 4.2); j < nr; j++) {   // the ring of yellow-tipped florets
        const u = R(.86, .97);
        dab(domeS, u, (j + R(-.3, .3)) / nr * 2, R(-.25, .25), [u, R(.6, 1), 0, 0], [1, 3, 1, 0], R(7, 10), R(4.5, 5.5), 1, .06);
    }
    for (let j = 0, n = ceil(Ls * k / 10); j < n; j++) {   // lengthwise up the stem, a lit side and a shaded side
        const s = (j + .5 + R(-.2, .2)) / n, wu = stemR(s) * 2 * k, ao = 1 - .3 * sstep(.72, .95, s);
        if (s < HIDE + .01) continue;
        const op = sstep(HIDE, HIDE + .05, s) * .6 + .4;
        for (let c = 0; c < 2; c++) {   // shaded side first, then the lit side over it
            const v = (c ? .39 : .11) + R(-.02, .02);
            dab(stemS, s, v, R(-.03, .03), [s, v, 0, 0], [0, 0, ao, 0], R(20, 30), clamp(wu * .55, 4.5, 7), op, c * .01);
        }
    }
    leaves.forEach((lf, i) => {   // out from the midrib, then the midrib itself on top
        const at = (u, v) => [u, v, lf.ph, lf.amp], mm = (u) => [2 + i, 1, .78 + .22 * u, lf.fq];
        const nu = ceil(lf.Lb * k / 8);
        for (let a = 0; a < nu; a++) {
            const u0 = (a + .5) / nu, hw = lf.W * 2.05 * sqrt(u0 + .08) * pow(1 - u0, .9) * k, nv = max(1, round(hw / 6.5));
            for (let sg = -1; sg <= 1; sg += 2) for (let b = 0; b < nv; b++) {
                const u = clamp(u0 + R(-.3, .3) / nu, .02, .97), v = sg * min(.93, (b + .55 + R(-.2, .2)) / nv);
                dab(lf.S, u, v, sg * (.85 + R(-.2, .2)), at(u, v), mm(u), clamp(R(12, 20), 8, hw * 1.5 + 8), R(5, 8));
            }
        }
        for (let a = 0, n = ceil(lf.Lb * k / 14); a < n; a++) {
            const u = (a + .5 + R(-.2, .2)) / n * .9;
            dab(lf.S, u, 0, R(-.08, .08), at(u, 0), mm(u), R(14, 20), R(4.5, 5), 1, .05);
        }
        dab(lf.pS, .5, .25, 0, [1, 0, lf.ph, 0], [2 + i, 0, .85, 0], clamp(lf.Lb * k * .3, 9, 22), 5);
    });
    // Meadow grass in front of the foot of the stem: upright, leaning with the wind like the
    // field's own dabs. These don't move. Kept clear of the canvas edge so nothing is cut.
    for (let j = 0, n = round(clamp(22 + k * .06, 24, 36)); j < n; j++) {
        const near = j < n * .55, len = R(12, 30), wid = R(3.4, 7.6), lean = .17 + R(-.3, .3);
        const x = (near ? R(-9, 9) : R(-46, 46)) / k, yb = max(near ? R(2, 21) : R(2, 13), wid * .5 + 3) / k, y = yb + len / k * .5;
        const c1 = pick(x + R(-4, 4) / k, y + R(-4, 4) / k), c2 = pick(x + R(-14, 14) / k, y + R(-10, 10) / k);
        dabs.push([9 - yb, x, y, .5, sin(lean), cos(lean), 0, ...c1, 0, ...c2, 0, 5, 1, 0, len, wid, r() * 100, 1]);
    }

    dabs.sort((a, b) => a[0] - b[0]);
    const nI = dabs.length, D = new Float32Array(nI * 21);
    dabs.forEach((d, i) => D.set(d.slice(1), i * 21));

    const geo = new THREE.BufferGeometry();
    const fa = (a, n) => new THREE.BufferAttribute(new Float32Array(a), n);
    geo.setAttribute('aP', fa(P, 3)); geo.setAttribute('aN', fa(N, 3)); geo.setAttribute('aF', fa(F, 4)); geo.setAttribute('aM', fa(M, 4));
    geo.setIndex(I);
    const dg = new THREE.InstancedBufferGeometry();
    dg.setAttribute('aC', fa([0, -1, 1, -1, 0, 1, 1, 1], 2));
    dg.setIndex([0, 1, 2, 2, 1, 3]);
    const ib = new THREE.InstancedInterleavedBuffer(D, 21);
    [['aP', 3], ['aD', 3], ['aN', 3], ['aF', 4], ['aM', 4], ['aS', 4]].reduce((o, [name, n]) => (dg.setAttribute(name, new THREE.InterleavedBufferAttribute(ib, n, o)), o + n), 0);
    dg.instanceCount = nI;
    return { geo, dg, mats, wind, dropU, pose, view: new THREE.Vector4(2 / wW, 2 / wH, 0, -1), hide: HIDE };
}

// Brush streaks, as in paint.py's Canvas.streak: noise smeared far along the stroke and
// barely across it. 1 texel per unit along, 2 per unit across.
function streaks(THREE) {
    const W = 512, H = 256, n = W * H, r = rng(7);
    const box = (s, rad, ax) => {
        const d = new Float32Array(n), L = ax ? H : W, st = ax ? W : 1, lines = ax ? W : H, ls = ax ? 1 : W;
        for (let m = 0; m < lines; m++) {
            const o = m * ls;
            let acc = 0;
            for (let i = -rad; i <= rad; i++) acc += s[o + ((i + L) % L) * st];
            for (let i = 0; i < L; i++) {
                d[o + i * st] = acc / (2 * rad + 1);
                acc += s[o + ((i + rad + 1) % L) * st] - s[o + ((i - rad + L) % L) * st];
            }
        }
        return d;
    };
    const norm = (a) => {
        let m = 0, v = 0;
        for (let i = 0; i < n; i++) m += a[i];
        m /= n;
        for (let i = 0; i < n; i++) v += (a[i] - m) * (a[i] - m);
        const s = sqrt(v / n) * 4 + 1e-6;
        return a.map((x) => clamp(.5 + (x - m) / s, 0, 1));
    };
    const layer = (rx, ry) => {
        let a = Float32Array.from({ length: n }, r);
        for (let i = 0; i < 3; i++) a = box(box(a, rx, 0), ry, 1);
        return norm(a);
    };
    const fine = layer(14, 1), coarse = layer(30, 4);
    const tex = new THREE.DataTexture(Uint8Array.from(norm(fine.map((x, i) => x * .65 + coarse[i] * .35)), (x) => x * 255), W, H, THREE.RedFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}

// ---------------------------------------------------------------- mounting

function mount(THREE, host) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) throw new Error('WebGL2 is not available');
    const R = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    const standIn = host.querySelector('.sunflower-placeholder');
    let shaderFailed = false, dead = false, raf = 0, shown = false, seen = true, model = null, last = 0;
    R.debug.onShaderError = () => { shaderFailed = true; };
    R.autoClear = false;
    R.setClearColor(0, 0);

    const coarse = matchMedia('(pointer: coarse)'), still = matchMedia('(prefers-reduced-motion: reduce)');
    const rtM = new THREE.WebGLRenderTarget(4, 4, { depthTexture: new THREE.DepthTexture(4, 4), generateMipmaps: false });
    const rtP = new THREE.WebGLRenderTarget(4, 4, { count: 2, depthBuffer: false, generateMipmaps: false });
    const streak = streaks(THREE);
    const U = {
        uM: { value: null }, uW: { value: null }, uV: { value: null }, uDrop: { value: 0 }, uHide: { value: 0 },
        uR: { value: new THREE.Vector2() }, uU: { value: 1 }, uE: { value: new THREE.Vector2() },
        uZ: { value: rtM.depthTexture }, uT: { value: rtM.texture }, uSt: { value: streak },
        uC: { value: rtP.textures[0] }, uH: { value: rtP.textures[1] },
    };
    const mat = (vertexShader, fragmentShader, o) => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader, fragmentShader, uniforms: U, depthTest: false, depthWrite: false, ...o });
    const over = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
    const mMesh = mat(MESH_VS, MESH_FS, { side: THREE.DoubleSide, depthTest: true, depthWrite: true, blending: THREE.NoBlending });
    const mDab = mat(DAB_VS, DAB_FS, over), mBase = mat(QUAD_VS, BASE_FS, over), mLight = mat(QUAD_VS, LIGHT_FS, { blending: THREE.NoBlending });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('aP', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    tri.setIndex([0, 1, 2]);   // three needs an index when there is no attribute called position
    const cam = new THREE.Camera();
    const obj = (g, m) => { const o = new THREE.Mesh(g, m); o.frustumCulled = false; return o; };
    const mesh = obj(tri, mMesh), dabs = obj(tri, mDab), base = obj(tri, mBase), light = obj(tri, mLight);

    // ---- wind: one signal. Layered sines that never line up, plus a gust every 4 to 9 s,
    // pushing a damped spring so the stem overshoots and settles like a real one.
    const rnd = Math.random;
    let T = rnd() * 600, th = .02, vth = 0, tz = 0, vtz = 0, flut = .3, nextGust = T + 2 + rnd() * 4;
    const gusts = [], hist = [];
    const stepWind = (dt) => {
        for (let left = min(dt, .1); left > 1e-5; left -= 1 / 120) {
            const h = min(left, 1 / 120);
            T += h;
            if (T > nextGust) { gusts.push([T, .45 + .55 * rnd(), .7 + .5 * rnd()]); nextGust = T + 4 + 5 * rnd(); }
            if (gusts.length && T - gusts[0][0] > 14) gusts.shift();
            let g = 0;
            for (const [t0, a, d] of gusts) { const x = (T - t0) / d; g += a * x * exp(1 - x); }
            const n1 = .5 * sin(.53 * T + 1.3) + .3 * sin(.91 * T + 4.1) + .2 * sin(1.67 * T + .5);
            const f = .021 + .042 * n1 + .1 * g, fz = .012 * sin(.41 * T + 2.2) + .008 * sin(1.13 * T) + .02 * g;
            vth += (10.2 * (f - th) - 2.6 * vth) * h; th += vth * h;   // 0.5 Hz, damping 0.4
            vtz += (10.2 * (fz - tz) - 2.6 * vtz) * h; tz += vtz * h;
            flut = .3 + .25 * (.5 + .5 * sin(1.9 * T + 2) * sin(.7 * T)) + 1.1 * g;
        }
        hist.push([T, th]);
        while (hist.length > 2 && hist[1][0] < T - .4) hist.shift();   // the head follows 0.4 s late
    };
    const lagged = () => {
        const [a, b] = hist, t = T - .4;
        return !b || t <= a[0] ? a[1] : a[1] + (b[1] - a[1]) * clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    };

    const draw = () => {
        if (!model) return;
        if (still.matches) model.pose(.02, 0, .02, 0, 0); else model.pose(th, tz, hist.length ? lagged() : th, flut, T);
        U.uDrop.value = model.dropU.value;
        R.setRenderTarget(rtM); R.clear(); R.render(mesh, cam);
        R.setRenderTarget(rtP); R.clear(); R.render(base, cam); R.render(dabs, cam);
        R.setRenderTarget(null); R.clear(); R.render(light, cam);
        if (shaderFailed) throw new Error('shader failed to compile');
        if (!shown) {   // the stand-in goes once a real frame is on screen
            shown = true;
            requestAnimationFrame(() => { if (!dead) standIn?.remove(); });
        }
    };
    const fail = (e) => { if (dead) return; destroy(); console.warn('Sunflower: 3D view unavailable, keeping the drawing.', e); };
    const tick = (now) => {
        raf = 0;
        if (dead) return;
        try {
            stepWind(last ? (now - last) / 1000 : 1 / 60);
            last = now;
            draw();
        } catch (e) { return fail(e); }
        kick();
    };
    const settle = (n) => requestAnimationFrame(() => {
        if (dead || running()) return;
        try { draw(); } catch (e) { return fail(e); }
        if (n > 1) settle(n - 1);
    });
    const running = () => seen && !document.hidden && !still.matches;
    // Start or stop the loop to match the page's state. In reduced motion, one still frame.
    const kick = (redraw) => {
        if (dead) return;
        if (redraw) try { draw(); } catch (e) { return fail(e); }
        if (running()) { if (!raf) raf = requestAnimationFrame(tick); return; }
        cancelAnimationFrame(raf); raf = 0; last = 0;
        // Stopped: repeat the frame a few times so every buffer in the swap chain holds it.
        if (redraw) settle(3);
    };

    // The page's own background painting, read back so the grass strokes at the foot of the
    // stem can take their colours from the meadow they stand in (paint.py's pick()).
    let field = null, fieldUrl = '';
    const readField = () => {
        const url = /url\(["']?(.+?)["']?\)/.exec(getComputedStyle(document.body).backgroundImage)?.[1];
        if (!url || url === fieldUrl) return;
        fieldUrl = url;
        const img = new Image();
        img.onload = () => {
            if (dead || url !== fieldUrl) return;
            try {
                const c = document.createElement('canvas'), w = c.width = img.naturalWidth >> 2, h = c.height = img.naturalHeight >> 2;
                const g = c.getContext('2d', { willReadFrequently: true });
                g.drawImage(img, 0, 0, w, h);
                field = { url, d: g.getImageData(0, 0, w, h).data, w, h, iw: img.naturalWidth, ih: img.naturalHeight };
                sized = ''; resize();
            } catch (e) { /* keep the fallback greens */ }
        };
        img.src = url;
    };
    const meadowAt = (W, H) => {
        if (!field || field.url !== fieldUrl) return null;
        const root = document.documentElement.getBoundingClientRect(), box = host.getBoundingClientRect();
        const pos = getComputedStyle(document.body).backgroundPosition.split(' ').map((x) => parseFloat(x) / 100);
        if (pos.length !== 2 || pos.some(isNaN)) return null;
        const sc = max(root.width / field.iw, root.height / field.ih);
        const ox = (root.width - field.iw * sc) * pos[0], oy = (root.height - field.ih * sc) * pos[1];
        const bx = box.left - root.left + W / 2, by = box.top - root.top + H;
        return (x, y) => {
            const i = (clamp(round((by - y - oy) / sc / 4), 0, field.h - 1) * field.w + clamp(round((bx + x - ox) / sc / 4), 0, field.w - 1)) * 4;
            return [field.d[i] / 255, field.d[i + 1] / 255, field.d[i + 2] / 255];
        };
    };

    let sized = '';
    const resize = () => {
        if (dead) return;
        const W = host.clientWidth, H = host.clientHeight, root = document.documentElement;
        const vw = root.clientWidth, vh = max(root.clientHeight, root.scrollHeight);
        const dpr = min(devicePixelRatio || 1, coarse.matches ? 1.5 : 2);
        readField();
        const key = [W, H, vw, vh, dpr, fieldUrl].join();
        if (W < 8 || H < 8 || key === sized) return;
        sized = key;
        // CSS px per painting unit: how big paint.py's dabs come out on this screen.
        const unit = matchMedia('(max-aspect-ratio: 4/5)').matches ? max(vw / 1200, vh / 2400) * 2.6 : max(vw / 2560, vh / 1600) * 1.75;
        try {
            const next = build(THREE, W, H, unit, meadowAt(W, H));
            model?.geo.dispose(); model?.dg.dispose();
            model = next;
            mesh.geometry = model.geo; dabs.geometry = model.dg;
            U.uM.value = model.mats; U.uW.value = model.wind; U.uV.value = model.view; U.uHide.value = model.hide;
            R.setPixelRatio(dpr); R.setSize(W, H, false);
            const w = canvas.width, h = canvas.height;
            rtM.setSize(w, h); rtP.setSize(w, h);
            U.uR.value.set(w, h); U.uU.value = unit * dpr; U.uE.value.set(2.2 * unit * dpr / w, 2.2 * unit * dpr / h);
            kick(true);
        } catch (e) { fail(e); }
    };

    const ro = new ResizeObserver(resize);
    const io = new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; kick(); });
    const onVis = () => kick(), onStill = () => kick(true), onLost = (e) => { e.preventDefault(); fail('context lost'); };
    function destroy() {
        if (dead) return;
        dead = true;
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        still.removeEventListener('change', onStill);
        coarse.removeEventListener('change', resize);
        removeEventListener('resize', resize);
        removeEventListener('pagehide', destroy);
        canvas.removeEventListener('webglcontextlost', onLost);
        model?.geo.dispose(); model?.dg.dispose(); tri.dispose();
        [mMesh, mDab, mBase, mLight, rtM, rtM.depthTexture, rtP, streak].forEach((x) => x.dispose());
        R.dispose();
        if (!gl.isContextLost()) R.forceContextLoss();
        canvas.remove();
        if (standIn && !standIn.isConnected) host.appendChild(standIn);
    }
    host.appendChild(canvas);
    document.addEventListener('visibilitychange', onVis);
    still.addEventListener('change', onStill);
    coarse.addEventListener('change', resize);
    addEventListener('resize', resize);   // the dab scale follows the viewport, not only the box
    addEventListener('pagehide', destroy);
    canvas.addEventListener('webglcontextlost', onLost);
    ro.observe(host); io.observe(host);
    resize();
    return destroy;
}

async function start() {
    const host = document.getElementById('sunflower');
    if (!host) return;
    try {
        const THREE = await import('three');
        mount(THREE, host);
    } catch (e) {
        host.querySelector('canvas')?.remove();
        console.warn('Sunflower: 3D view unavailable, keeping the drawing.', e);
    }
}
start();
// Coming back from the back/forward cache after pagehide tore everything down.
addEventListener('pageshow', (e) => { if (e.persisted) start(); });
