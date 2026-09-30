        // ---- Small firs, used throughout the scene ----
        const TREES = [
`      ^
     /|\\
     /|\\
    //|\\\\
    //|\\\\
    //|\\\\
   ///|\\\\\\
   ///|\\\\\\
  ////|\\\\\\\\
  ////|\\\\\\\\
 /////|\\\\\\\\\\
 /////|\\\\\\\\\\
//////|\\\\\\\\\\\\
      |
      |`,
`     ^
    /|\\
    /|\\
   //|\\\\
   //|\\\\
  ///|\\\\\\
  ///|\\\\\\
 ////|\\\\\\\\
 ////|\\\\\\\\
/////|\\\\\\\\\\
     |
     |`,
`    ^
   /|\\
   /|\\
  //|\\\\
  //|\\\\
 ///|\\\\\\
////|\\\\\\\\
    |
    |`,
`   ^
  /|\\
 //|\\\\
///|\\\\\\
   |`
        ].map(t => t.split('\n'));

        // ---- Journey: winding road, big firs, scroll-driven car ----
        const BIG_TREES = [
String.raw`       ^
      /|\
      /|\
     //|\\
      /|\
     //|\\
    ///|\\\
     //|\\
    ///|\\\
   ////|\\\\
    ///|\\\
   ////|\\\\
  /////|\\\\\
   ////|\\\\
  /////|\\\\\
 //////|\\\\\\
       |
       |`,
String.raw`     ^
    /|\
    /|\
   //|\\
    /|\
   //|\\
  ///|\\\
   //|\\
  ///|\\\
 ////|\\\\
/////|\\\\\
     |
     |`
        ].map(t => t.split('\n'));

        // sword ferns, salal, the stuff between the trunks
        const FLORA = [
            [String.raw`\|/`],
            [String.raw`\\|//`],
            [String.raw` \|/`, String.raw`\\|//`],
            ['.oOo.']
        ];

        const journey = {
            el: document.querySelector('.journey'),
            road: document.getElementById('road'),
            carEl: document.getElementById('car'),
            fs: 13, charW: 13 * 0.6, lineH: 13 * 1.15,
            rows: 0, cols: 0, phase: 1.8,
            cur: 2, center: 0, amp: 0, fade: 0,
            lit: document.getElementById('lit'), litGrid: null, litKey: '', hw: 7, lane: 0,
            traffic: [], junctions: [], inView: true
        };

        function roadX(r) {
            return journey.center + journey.amp * Math.sin(r * 0.05 + journey.phase);
        }

        function buildJourney() {
            const j = journey;
            let seed = 42;
            const random = () => {
                seed = (seed * 16807) % 2147483647;
                return (seed - 1) / 2147483646;
            };
            if (!j.el || getComputedStyle(j.el).display === 'none') return;
            // On phones, give the name and portrait the full width before the road starts.
            const heading = document.querySelector('.intro-heading');
            if (matchMedia('(max-width: 700px)').matches && heading && j.el.offsetParent) {
                const headingBottom = heading.getBoundingClientRect().bottom;
                const parentTop = j.el.offsetParent.getBoundingClientRect().top;
                j.el.style.top = `${Math.round(headingBottom - parentTop + 24)}px`;
            } else {
                j.el.style.removeProperty('top');
            }
            j.fs = parseFloat(getComputedStyle(j.road).fontSize);
            j.charW = j.fs * 0.6;
            j.lineH = j.fs * 1.15;
            j.cols = Math.ceil(j.el.clientWidth / j.charW);
            j.rows = Math.ceil(j.el.clientHeight / j.lineH);
            // The scene bleeds off the right edge of the window, so the road is pinned to the
            // page column (--road-at, --road-span as fractions of it) rather than to the scene.
            const css = getComputedStyle(j.el);
            const shellW = j.el.offsetParent ? j.el.offsetParent.clientWidth : j.el.clientWidth;
            const roadAt = parseFloat(css.getPropertyValue('--road-at'));
            const span = (parseFloat(css.getPropertyValue('--road-span')) || 0) * shellW / j.charW || j.cols;
            j.center = roadAt ? (shellW * roadAt - j.el.offsetLeft) / j.charW : j.cols / 2;
            // Three depth layers: far (misty, blurred), mid, near (sharp, by the road)
            const mkGrid = () => Array.from({ length: j.rows }, () => new Array(j.cols).fill(' '));
            const far = mkGrid(), mid = mkGrid(), near = mkGrid();
            const road = mkGrid(), markings = mkGrid();
            const narrow = j.cols < 24;
            // Two lanes wide enough for the car on desktop; on phones it's a single-lane track
            const hw = narrow ? 3 : 7;
            j.hw = hw;
            j.lane = narrow ? 0 : -hw / 2;
            j.amp = Math.max(0, Math.min(span * 0.16, span / 2 - hw - 2));
            // Trees thin out toward the text instead of stopping at a hard edge
            j.fade = roadAt ? Math.max(0, j.center - j.amp - hw - 12) : 0;
            const thins = x => j.fade > 0 && random() > Math.pow(Math.max(0, x) / j.fade, 1.6);
            if (j.rows < 12 || j.cols < 10) {
                j.carEl.style.visibility = 'hidden';
                return;
            }
            j.carEl.style.visibility = 'visible';

            const stamp = (g, t, x0, r0) => {
                t.forEach((line, i) => {
                    const r = r0 + i;
                    if (r < 0 || r >= j.rows) return;
                    for (let c = 0; c < line.length; c++) {
                        const ch = line[c];
                        const x = x0 + c;
                        if (ch !== ' ' && x >= 0 && x < j.cols) g[r][x] = ch;
                    }
                });
            };
            const occupied = (r, x) => far[r][x] !== ' ' || mid[r][x] !== ' ' || near[r][x] !== ' ';

            // Distant ridge along the very top
            let hPrev = 3;
            for (let x = 0; x < j.cols; x++) {
                let h = hPrev;
                const roll = random();
                if (roll < 0.42) h = Math.min(6, hPrev + 1);
                else if (roll < 0.84) h = Math.max(0, hPrev - 1);
                far[7 - h][x] = h > hPrev ? '/' : h < hPrev ? '\\' : (random() < 0.2 ? '^' : '-');
                hPrev = h;
            }

            // Creeks crossing the page; they get bridged where they meet the road
            const creeks = [];
            if (j.rows > 55) creeks.push(Math.floor(j.rows * (0.40 + random() * 0.08)));
            if (j.rows > 170) creeks.push(Math.floor(j.rows * (0.72 + random() * 0.08)));
            creeks.forEach(rc => {
                for (let x = 0; x < j.cols; x++) {
                    mid[rc][x] = '~';
                    if (random() < 0.3) mid[rc - 1][x] = '~';
                    if (random() < 0.3) mid[rc + 1][x] = '~';
                }
            });

            // Forest: staggered bands of firs, each tree landing at a random depth
            const forestEdge = j.cols - 8;
            for (let bx = 1; bx < forestEdge; bx += 14 + Math.floor(random() * 7)) {
                let r = 9 + Math.floor(random() * 14);
                while (r < j.rows - 6) {
                    const t = random() < 0.4
                        ? BIG_TREES[Math.floor(random() * BIG_TREES.length)]
                        : TREES[Math.floor(random() * TREES.length)];
                    const x0 = bx + Math.floor(random() * 5) - 2;
                    if (!thins(x0)) stamp(random() < 0.45 ? far : mid, t, x0, r);
                    r += t.length + 3 + Math.floor(random() * 12);
                }
            }

            // Trees hugging both shoulders of the road
            const sideTrees = (side) => {
                let r = 4 + Math.floor(random() * 5);
                while (r < j.rows - 10) {
                    const t = narrow ? TREES[TREES.length - 1] : random() < 0.45
                        ? BIG_TREES[Math.floor(random() * BIG_TREES.length)]
                        : TREES[Math.floor(random() * TREES.length)];
                    const tw = Math.max(...t.map(l => l.length));
                    const xc = roadX(r + t.length / 2);
                    const off = narrow ? hw + 1 : hw + 2 + Math.floor(random() * 5);
                    const x0 = side > 0 ? Math.round(xc + off) : Math.round(xc - off - tw);
                    stamp(near, t, x0, r);
                    r += Math.ceil(t.length * 0.5) + 1 + Math.floor(random() * 5);
                }
            };
            sideTrees(-1);
            sideTrees(1);

            // Ferns and shrubs tucked into whatever gaps are left
            const fits = (t, x0, r0) => {
                for (let i = 0; i < t.length; i++) {
                    const r = r0 + i;
                    if (r < 9 || r >= j.rows) return false;
                    for (let c = 0; c < t[i].length; c++) {
                        const x = x0 + c;
                        if (x < 0 || x >= j.cols || occupied(r, x)) return false;
                    }
                }
                return true;
            };
            for (let i = 0; i < Math.floor(j.cols * j.rows / 420); i++) {
                const t = FLORA[Math.floor(random() * FLORA.length)];
                const x0 = Math.floor(random() * j.cols);
                const r0 = Math.floor(random() * j.rows);
                if (fits(t, x0, r0) && !thins(x0)) stamp(random() < 0.5 ? mid : near, t, x0, r0);
            }

            // Undergrowth scattered on the forest floor
            const tufts = ',.\'"';
            for (let i = 0; i < Math.floor(j.cols * j.rows / 140); i++) {
                const x = Math.floor(random() * j.cols);
                const r = 8 + Math.floor(random() * (j.rows - 8));
                if (!occupied(r, x) && !thins(x)) mid[r][x] = tufts[Math.floor(random() * tufts.length)];
            }

            // A few birds over the canopy
            for (let i = 0; i < 3 + Math.floor(j.rows / 40); i++) {
                const x = 2 + Math.floor(random() * (j.cols - 6));
                const r = Math.floor(random() * j.rows);
                if (!occupied(r, x) && !occupied(r, x + 2)) {
                    far[r][x] = 'v';
                    if (random() < 0.5) far[r][x + 2] = 'v';
                }
            }

            // Road: clear the corridor in every layer, then draw edges + centerline up close
            for (let rr = 0; rr < j.rows; rr++) {
                const xc = roadX(rr);
                const slope = roadX(rr + 1) - xc;
                const edge = slope > 0.28 ? '\\' : slope < -0.28 ? '/' : '|';
                const L = Math.round(xc - hw), R = Math.round(xc + hw);
                for (let x = L; x <= R; x++) {
                    if (x >= 0 && x < j.cols) { far[rr][x] = ' '; mid[rr][x] = ' '; near[rr][x] = ' '; }
                }
                if (L >= 0 && L < j.cols) road[rr][L] = edge;
                if (R >= 0 && R < j.cols) road[rr][R] = edge;
                if (!narrow && rr % 5 < 3) {
                    const cx = Math.round(xc);
                    if (cx >= 0 && cx < j.cols) markings[rr][cx] = '|';
                }
            }

            // Bridge decks where the creeks cross the road
            creeks.forEach(rc => {
                const xc = roadX(rc);
                for (let x = Math.round(xc - hw) - 1; x <= Math.round(xc + hw) + 1; x++) {
                    if (x < 0 || x >= j.cols) continue;
                    road[rc - 1][x] = '=';
                    road[rc + 1][x] = '=';
                }
            });

            // Ramps off the oncoming lane. Each one peels away from the road's edge on a gentle curve:
            // exits leave upward and off to the right, on-ramps curve in from the lower right to a stop line.
            j.junctions = [];
            const hide = (rr, x) => {
                if (rr >= 0 && rr < j.rows && x >= 0 && x < j.cols) far[rr][x] = mid[rr][x] = near[rr][x] = ' ';
            };
            // An edge as a line of characters: slashes where it leans, underscores where it runs flat
            const drawEdge = (J, colAt, d0, d1) => {
                for (let d = d0; d < d1; d++) {
                    const r = J.row0 + J.dir * d, next = r + J.dir;
                    const upper = Math.min(r, next), lower = upper + 1;
                    if (upper < 0 || lower >= j.rows) continue;
                    const xu = colAt(J, J.dir < 0 ? d + 1 : d), xl = colAt(J, J.dir < 0 ? d : d + 1);
                    const cu = Math.round(xu), cl = Math.round(xl);
                    if (cu >= 0 && cu < j.cols) road[upper][cu] = xu - xl > 0.35 ? '/' : xl - xu > 0.35 ? '\\' : '|';
                    for (let x = Math.min(cu, cl) + 1; x < Math.max(cu, cl); x++) if (x >= 0 && x < j.cols) road[upper][x] = '_';
                }
            };
            if (!narrow) {
                const edgeAt = rr => Math.round(roadX(rr) + hw);
                // Curve tighter when there's less room beside the road
                const room = j.cols - (j.center + j.amp + hw);
                const a = Math.max(0.06, Math.min(0.16, room / 260));
                const count = Math.max(2, Math.floor(j.rows / 60));
                const firstIsExit = random() < 0.5;
                for (let i = 0; i < count; i++) {
                    const type = (j.junctions.length % 2 === 0) === firstIsExit ? 'exit' : 'on';
                    const J = { type, dir: type === 'exit' ? -1 : 1, a, row0: 0 };
                    // How far along the ramp its two edges have pulled apart, and where it leaves the screen
                    let gore = 0;
                    while (a * gore * gore - rampWidth(J, gore) < 1 && gore < 30) gore += 0.25;
                    let end = Math.ceil(gore);
                    while (a * end * end < j.cols - (j.center - j.amp + hw) + 6 && end < 40) end += 1;
                    J.gore = gore;
                    J.end = end;
                    let r = Math.round(j.rows * (i + 0.5) / count + (random() - 0.5) * 12);
                    const span = rr => J.dir < 0 ? [rr - end - 2, rr + 6] : [rr - 6, rr + end + 2];
                    // Keep clear of the bridges, the faded ends of the scene and the other ramps
                    for (let tries = 0; tries < 6; tries++) {
                        const [lo, hi] = span(r);
                        if (!creeks.some(rc => rc > lo - 4 && rc < hi + 4)) break;
                        r += J.dir < 0 ? -9 : 9;
                    }
                    const [lo, hi] = span(r);
                    if (lo < 12 || hi > j.rows - 6 || creeks.some(rc => rc > lo - 4 && rc < hi + 4)) continue;
                    if (j.junctions.some(K => { const [kl, kh] = K.span; return lo < kh + 8 && hi > kl - 8; })) continue;
                    J.row0 = r;
                    J.span = [lo, hi];

                    for (let d = 0; d <= end; d++) {
                        const rr = r + J.dir * d;
                        const outer = rampCol(J, d) + rampWidth(J, d) / 2;
                        for (let x = edgeAt(rr) + 1; x <= Math.ceil(outer) + 2; x++) hide(rr, x);
                        // The road's own edge opens up where the ramp tapers in
                        if (d <= gore) road[rr][edgeAt(rr)] = ' ';
                    }
                    drawEdge(J, (K, d) => rampCol(K, d) + rampWidth(K, d) / 2, 0, end);
                    drawEdge(J, (K, d) => rampCol(K, d) - rampWidth(K, d) / 2, Math.ceil(gore), end);

                    if (type === 'on') {
                        // A stop line across the ramp where cars wait for a gap
                        J.stop = Math.ceil(gore) + 3;
                        const sr = r + J.stop;
                        const inner = Math.round(rampCol(J, J.stop) - rampWidth(J, J.stop) / 2);
                        const outer = Math.round(rampCol(J, J.stop) + rampWidth(J, J.stop) / 2);
                        for (let x = inner + 1; x < outer; x++) if (x >= 0 && x < j.cols) road[sr][x] = '-';
                    }
                    j.junctions.push(J);
                }
            }

            document.getElementById('scene-far').textContent = far.map(row => row.join('')).join('\n');
            document.getElementById('scene-mid').textContent = mid.map(row => row.join('')).join('\n');
            document.getElementById('scene-near').textContent = near.map(row => row.join('')).join('\n');
            document.getElementById('lane-markings').textContent = markings.map(row => row.join('')).join('\n');
            j.road.textContent = road.map(row => row.join('')).join('\n');

            // Everything the headlights can land on, front layer first
            j.litGrid = road.map((row, r) => row.map((ch, x) =>
                [ch, markings[r][x], near[r][x], mid[r][x], far[r][x]].find(c => c !== ' ') || ' '));
            j.litKey = '';
            buildTraffic(random, narrow);
        }

        // Headlights: the characters just ahead of each vehicle are redrawn warm, dimming with distance
        function lightRoad() {
            const j = journey;
            // The phone strip is too narrow for a pool of light to read as anything but two rails
            if (!j.lit || !j.litGrid || j.hw <= 3) return;
            // Once the car leaves the road for a joyride, its headlights leave with it
            const lamps = (free.on ? [] : [{ front: Math.round(j.cur + 2.5), dir: 1, lane: j.lane }])
                .concat(j.traffic.filter(v => v.mode === 'lane')
                    .map(v => ({ front: Math.round(v.row - v.len / 2 - 0.5), dir: -1, lane: -j.lane })));
            const key = (free.on ? 'free:' : '') + lamps.map(l => l.front).join();
            if (key === j.litKey) return;
            j.litKey = key;
            const reach = 9;
            const glow = new Map();
            lamps.forEach(({ front, dir, lane }) => {
                for (let d = 0; d < reach; d++) {
                    const r = front + dir * d;
                    if (r < 0 || r >= j.rows) continue;
                    const xc = roadX(r) + lane, half = 3 + d * 0.6, g = 1 - d / reach;
                    if (!glow.has(r)) glow.set(r, new Array(j.cols).fill(0));
                    const row = glow.get(r);
                    for (let x = Math.max(0, Math.ceil(xc - half)); x <= Math.min(j.cols - 1, xc + half); x++) {
                        row[x] = Math.max(row[x], g);
                    }
                }
            });
            const last = Math.max(-1, ...glow.keys());
            const lines = [];
            for (let r = 0; r <= last; r++) {
                const row = glow.get(r);
                if (!row) { lines.push(''); continue; }
                let line = '';
                for (let x = 0; x < j.cols;) {
                    const g = row[x];
                    let run = '';
                    while (x < j.cols && row[x] === g) run += g ? j.litGrid[r][x++] : (x++, ' ');
                    line += g ? `<span style="opacity:${g.toFixed(2)}">${run.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>` : run;
                }
                lines.push(line.trimEnd());
            }
            j.lit.innerHTML = lines.join('\n');
        }

        const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
        let animationFrame = 0, lastFrame = 0;

        function place(el, row, lane) {
            const j = journey;
            const xPx = (roadX(row) + lane + 0.5) * j.charW;
            const dxPx = (roadX(row + 2) - roadX(row - 2)) / 4 * j.charW;
            const deg = -Math.atan2(dxPx, j.lineH) * 180 / Math.PI;
            el.style.transform = `translate(${xPx}px, ${row * j.lineH}px) translate(-50%, -50%) rotate(${deg}deg)`;
            return { px: xPx, py: row * j.lineH, deg };
        }

        // Oncoming traffic in the other lane, heading up the page. Phones only have one lane.
        // Speeds are in rows per second; trucks are slower.
        const VEHICLES = [
            { shape: ".--.\n|==|\n|  |\n'--'", speed: [5, 10], mass: 1 },
            { shape: ".--.\n|==|\n|  |\n'--'", speed: [5, 10], mass: 1 },
            { shape: ".--.\n|==|\n|--|\n|  |\n|  |\n'--'", speed: [3.5, 5.5], mass: 1.8 }
        ];
        const PAINT = ['#a9b6bf', '#c9c09c', '#9fb39a', '#b7a9a0'];

        // A ramp is measured by d, rows travelled away from where it meets the lane. Its outer edge
        // swings out from the road's edge by a·d², and its width is held constant across the curve.
        function rampWidth(J, d) {
            const slope = 2 * J.a * d * journey.charW / journey.lineH;
            return journey.hw * Math.sqrt(1 + slope * slope);
        }
        function rampCol(J, d) {
            return roadX(J.row0 + J.dir * d) + journey.hw + J.a * d * d - rampWidth(J, d) / 2;
        }
        function rampPos(J, d) {
            return { x: (rampCol(J, d) + 0.5) * journey.charW, y: (J.row0 + J.dir * d) * journey.lineH };
        }
        // Pixels travelled per unit of d, and the heading when moving towards larger (+1) or smaller (-1) d
        function rampStretch(J, d) {
            const a = rampPos(J, d), b = rampPos(J, d + 0.05);
            return Math.hypot(b.x - a.x, b.y - a.y) / 0.05;
        }
        function rampHeading(J, d, sense) {
            const a = rampPos(J, d), b = rampPos(J, d + 0.05);
            return Math.atan2(sense * (b.x - a.x), -sense * (b.y - a.y)) * 180 / Math.PI;
        }

        function buildTraffic(random, narrow) {
            const j = journey;
            j.traffic.forEach(v => v.el.remove());
            j.traffic = [];
            if (narrow) return;
            const count = Math.max(3, Math.round(j.rows / 32));
            const ramps = j.junctions.filter(J => J.type === 'on');
            for (let i = 0; i < count; i++) {
                const kind = VEHICLES[Math.floor(random() * VEHICLES.length)];
                const el = document.createElement('div');
                el.className = 'car-wrap traffic';
                const body = document.createElement('pre');
                body.className = 'car';
                body.style.color = PAINT[Math.floor(random() * PAINT.length)];
                // The back row doubles as brake lights
                const lines = kind.shape.split('\n');
                body.textContent = lines.slice(0, -1).join('\n') + '\n';
                const tail = document.createElement('span');
                tail.className = 'tail';
                tail.textContent = lines[lines.length - 1];
                body.appendChild(tail);
                el.appendChild(body);
                j.el.appendChild(el);
                const v = { el, kind, lenPx: el.offsetHeight, wPx: el.offsetWidth, braking: false };
                v.len = v.lenPx / j.lineH;
                setPace(v);
                j.traffic.push(v);
                if (ramps.length && random() < 0.25) joinRamp(v, ramps[Math.floor(random() * ramps.length)]);
                else Object.assign(v, { mode: 'lane', row: (i + random() * 0.4) * j.rows / count, speed: v.want });
            }
        }

        function setPace(v) {
            const [lo, hi] = v.kind.speed;
            v.want = (lo + Math.random() * (hi - lo)) * journey.lineH;
        }

        const onRamp = v => v.mode === 'on' || v.mode === 'wait';
        const rowOf = v => v.mode === 'lane' ? v.row : v.J.row0 + v.J.dir * v.d;
        // Cars that take up the oncoming lane: those in it, and those still close to it on a ramp
        const inLane = v => v.mode === 'lane'
            || ((v.mode === 'exit' || v.mode === 'merge') && v.J.a * v.d * v.d < 6);

        // Queue up at an on-ramp, starting just off the right edge of the window
        function joinRamp(v, J) {
            const W = journey.el.clientWidth;
            let d = J.end;
            while (rampPos(J, d).x - v.lenPx / 2 < W && d < J.end + 30) d += 0.5;
            journey.traffic.forEach(o => {
                if (o !== v && o.J === J && onRamp(o)) d = Math.max(d, o.d + ((o.lenPx + v.lenPx) / 2 + 12) / rampStretch(J, o.d));
            });
            Object.assign(v, { mode: 'on', J, d, speed: v.want * 0.6 });
        }

        function joinAtBottom(v) {
            const j = journey;
            const tail = Math.max(0, ...j.traffic.filter(o => o !== v && o.mode === 'lane').map(o => o.row));
            Object.assign(v, {
                mode: 'lane', J: null, decided: null, speed: v.want,
                row: Math.max(j.rows + v.len, tail + v.len + 6) + Math.random() * 25
            });
        }

        // Off the map: come back from the bottom of the road, or wait at an on-ramp
        function recycle(v) {
            setPace(v);
            const ramps = journey.junctions.filter(J => J.type === 'on');
            if (ramps.length && Math.random() < 0.4) {
                const J = ramps[Math.floor(Math.random() * ramps.length)];
                if (journey.traffic.filter(o => o.J === J && onRamp(o)).length < 3) {
                    joinRamp(v, J);
                    return;
                }
            }
            joinAtBottom(v);
        }

        // Ease towards the cruising speed, but never closer than a couple of car lengths
        function follow(v, gap, dt) {
            const target = Math.min(v.want, Math.max(0, (gap - 10) * 2.2));
            const change = target - v.speed;
            v.speed = Math.max(0, v.speed + Math.max(-400 * dt, Math.min(60 * dt, change)));
            v.braking = change < -8 || (v.speed < 4 && target < 4);
        }

        // Nearest gap to anything in the lane ahead (further up the page)
        function laneGap(v, lane) {
            const L = journey.lineH, row = rowOf(v);
            let gap = Infinity;
            lane.forEach(o => {
                const d = (row - rowOf(o)) * L;
                if (o !== v && d > 0) gap = Math.min(gap, d - (v.lenPx + o.lenPx) / 2);
            });
            return gap;
        }

        function stepTraffic(dt) {
            const j = journey, W = j.el.clientWidth;
            const lane = j.traffic.filter(inLane);
            const exits = j.junctions.filter(J => J.type === 'exit');

            j.traffic.forEach(v => {
                const J = v.J;
                if (v.mode === 'lane') {
                    follow(v, laneGap(v, lane), dt);
                    v.row -= v.speed / j.lineH * dt;
                    const E = exits.find(K => v.row <= K.row0 && v.row > K.row0 - 1.5);
                    if (E && v.decided !== E) {
                        v.decided = E;
                        if (Math.random() < 0.45) Object.assign(v, { mode: 'exit', J: E, d: E.row0 - v.row });
                    }
                    if (v.row < -v.len - 2) recycle(v);
                } else if (v.mode === 'exit') {
                    const stretch = rampStretch(J, v.d);
                    let gap = Infinity;
                    j.traffic.forEach(o => {
                        if (o !== v && o.mode === 'exit' && o.J === J && o.d > v.d) gap = Math.min(gap, (o.d - v.d) * stretch - (v.lenPx + o.lenPx) / 2);
                    });
                    follow(v, gap, dt);
                    v.d += v.speed * dt / stretch;
                    if (rampPos(J, v.d).x - v.lenPx > W || v.d > J.end + 30) recycle(v);
                } else if (v.mode === 'on') {
                    const stretch = rampStretch(J, v.d);
                    const stopAt = J.stop + (v.lenPx / 2 + 4) / rampStretch(J, J.stop);
                    let gap = (v.d - stopAt) * stretch + 10, leader = false;
                    j.traffic.forEach(o => {
                        if (o !== v && o.J === J && onRamp(o) && o.d < v.d) {
                            gap = Math.min(gap, (v.d - o.d) * stretch - (v.lenPx + o.lenPx) / 2);
                            leader = true;
                        }
                    });
                    follow(v, gap, dt);
                    v.d -= v.speed * dt / stretch;
                    if (!leader && (v.d - stopAt) * stretch < 1) {
                        // Full stop at the line, then wait a beat
                        Object.assign(v, { d: stopAt, mode: 'wait', speed: 0, wait: 0.8 + Math.random() * 1.2 });
                    }
                } else if (v.mode === 'wait') {
                    v.braking = true;
                    v.wait -= dt;
                    const clear = !j.traffic.some(o => o !== v && ((o.mode === 'merge' && o.J === J)
                        || (inLane(o) && rowOf(o) > J.row0 - 6 && rowOf(o) < J.row0 + J.stop + 22)));
                    if (v.wait <= 0 && clear) Object.assign(v, { mode: 'merge', speed: 0 });
                } else if (v.mode === 'merge') {
                    follow(v, laneGap(v, lane), dt);
                    v.speed = Math.max(v.speed, 12);
                    v.d -= v.speed * dt / rampStretch(J, Math.max(0, v.d));
                    if (v.d <= 0) Object.assign(v, { mode: 'lane', row: J.row0 + v.d, J: null, decided: null });
                }
                if (v.braking !== v.shown) {
                    v.shown = v.braking;
                    v.el.classList.toggle('braking', v.braking);
                }
            });
        }

        // Returns true while traffic should keep moving
        function moveTraffic(dt) {
            const j = journey;
            if (!j.traffic.length) return false;
            const flowing = !motionPreference.matches && j.inView;
            if (flowing && dt) stepTraffic(dt);
            // Where each car is drawn (inside the scene) and which way it faces, for collisions
            j.traffic.forEach(v => {
                if (v.mode === 'knocked') return;
                if (v.mode === 'lane') {
                    Object.assign(v, place(v.el, v.row, -j.lane));
                    return;
                }
                const p = rampPos(v.J, v.d);
                const deg = rampHeading(v.J, v.d, v.mode === 'exit' ? 1 : -1);
                Object.assign(v, { px: p.x, py: p.y, deg });
                v.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${deg}deg)`;
            });
            return flowing;
        }

        function frame(t) {
            animationFrame = 0;
            const j = journey;
            if (document.hidden || j.rows < 12 || j.cols < 10 || getComputedStyle(j.el).display === 'none') {
                lastFrame = 0;
                return;
            }
            const dt = lastFrame ? Math.min(0.1, (t - lastFrame) / 1000) : 0;
            lastFrame = t;
            const settling = free.on ? driveFree(dt) : driveCar();
            const flowing = moveTraffic(dt);
            const crashing = stepWrecks(dt);
            showKeysHint();
            lightRoad();
            if (settling || flowing || crashing) queueDrive();
            else lastFrame = 0;
        }

        // The last stretch of road that isn't lost in the scene's faded bottom edge
        const roadEnd = () => journey.rows - Math.ceil(journey.rows * 0.07) - 2;
        const atPageBottom = () => scrollY + innerHeight >= document.documentElement.scrollHeight - 8;

        // Returns true while the car is still catching up with the scroll position
        function driveCar() {
            const j = journey;
            // Scrolled all the way down, the car rolls on to the end of the road
            const target = atPageBottom() ? roadEnd() : Math.min(roadEnd(), Math.max(2,
                (scrollY + innerHeight * 0.45 - j.el.offsetTop) / j.lineH));
            const distance = target - j.cur;
            j.cur += motionPreference.matches || Math.abs(distance) < 0.02 ? distance : distance * 0.1;
            // Keep right: the car heads down the page, so its lane is the one on screen left.
            // (place() adds 0.5 because a character in column x is drawn centred on x + 0.5.)
            place(j.carEl, j.cur, j.lane);
            return !motionPreference.matches && Math.abs(target - j.cur) >= 0.02;
        }

        function queueDrive() {
            if (!animationFrame) animationFrame = requestAnimationFrame(frame);
        }

        // At the end of the road the arrow keys take the wheel: drive anywhere on the page, Esc to go back.
        // Heading is in degrees clockwise from straight up the page; the car's nose is drawn pointing down.
        const free = { on: false, keys: new Set(), x: 0, y: 0, heading: 180, speed: 0, maxX: 0, maxY: 0 };
        const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

        function atRoadEnd() {
            const j = journey;
            return j.rows >= 12 && j.carEl.style.visibility !== 'hidden'
                && atPageBottom() && Math.abs(j.cur - roadEnd()) < 1.5;
        }

        // Once the car is parked at the end of the road, arrow keys painted on the road behind it hint
        // that it can be driven. Only for keyboards, and only until someone has taken the wheel once.
        const keysHint = document.getElementById('keys-hint');
        const hasKeyboard = matchMedia('(hover: hover) and (pointer: fine)');
        let hasDriven = false;
        try { hasDriven = localStorage.getItem('drove-off-road') === '1'; } catch (e) {}

        function showKeysHint() {
            if (!keysHint) return;
            const j = journey, show = !hasDriven && !free.on && hasKeyboard.matches && atRoadEnd();
            if (show) {
                const x = (roadX(j.cur - 4.5) + 0.5) * j.charW, y = (j.cur - 4.5) * j.lineH;
                keysHint.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
            }
            keysHint.classList.toggle('shown', show);
        }

        function takeWheel() {
            const j = journey, box = j.carEl.getBoundingClientRect(), doc = document.documentElement;
            const tilt = j.carEl.style.transform.match(/rotate\(([-\d.e]+)deg\)/);
            Object.assign(free, {
                on: true, speed: 0,
                x: box.left + box.width / 2 + scrollX,
                y: box.top + box.height / 2 + scrollY,
                heading: (tilt ? parseFloat(tilt[1]) : 0) + 180,
                maxX: doc.clientWidth - 30,
                maxY: doc.scrollHeight - 30
            });
            // Out of the forest's clipped, faded frame and onto the page itself
            j.carEl.classList.add('free');
            document.body.appendChild(j.carEl);
            hasDriven = true;
            try { localStorage.setItem('drove-off-road', '1'); } catch (e) {}
            showKeysHint();
        }

        function handBack() {
            free.on = false;
            free.keys.clear();
            journey.carEl.classList.remove('free');
            journey.el.appendChild(journey.carEl);
            queueDrive();
        }

        // Returns true while the car is rolling or a key is held.
        // The arrows point where on the screen to go; the car swings round towards it in an arc.
        function driveFree(dt) {
            const k = free.keys;
            const dx = k.has('ArrowRight') - k.has('ArrowLeft');
            const dy = k.has('ArrowDown') - k.has('ArrowUp');
            if (dx || dy) {
                const want = Math.atan2(dx, -dy) * 180 / Math.PI;
                const off = ((want - free.heading) % 360 + 540) % 360 - 180;
                const turn = (90 + 200 * Math.min(1, free.speed / 150)) * dt;
                free.heading += Math.max(-turn, Math.min(turn, off));
                // Full speed once lined up, easing off while swinging round a tight turn
                const top = 380 * Math.max(0.35, Math.cos(off * Math.PI / 180));
                free.speed += Math.max(-300 * dt, Math.min(260 * dt, top - free.speed));
            } else {
                free.speed = Math.max(0, free.speed - 220 * dt);
            }
            const rad = free.heading * Math.PI / 180;
            free.x += Math.sin(rad) * free.speed * dt;
            free.y -= Math.cos(rad) * free.speed * dt;
            if (free.x < 30 || free.x > free.maxX || free.y < 30 || free.y > free.maxY) {
                // Bump against the edge of the page
                free.x = Math.max(30, Math.min(free.maxX, free.x));
                free.y = Math.max(30, Math.min(free.maxY, free.y));
                free.speed = Math.min(free.speed, 40);
            }
            journey.carEl.style.transform =
                `translate(${free.x}px, ${free.y}px) translate(-50%, -50%) rotate(${free.heading - 180}deg)`;
            // Scroll along to keep the car on screen
            // (instant, or the page's smooth scrolling restarts every frame and never catches up)
            const margin = Math.min(160, innerHeight / 4);
            if (free.y - scrollY < margin) scrollTo({ top: free.y - margin, behavior: 'instant' });
            else if (free.y - scrollY > innerHeight - margin) scrollTo({ top: free.y - innerHeight + margin, behavior: 'instant' });
            return k.size > 0 || free.speed !== 0;
        }

        // Whacking traffic. Every car is a capsule (a rounded rectangle). A hit knocks a car off its route
        // and loose onto the page, where it slides and spins, can be shoved around or into other cars,
        // and once it's sat still a while, fades away and rejoins traffic.
        const clamp01 = x => Math.max(0, Math.min(1, x));

        // Everything that can collide, in page coordinates, with velocity in px/s
        function bodies() {
            const j = journey, list = [];
            if (free.on) {
                const rad = free.heading * Math.PI / 180;
                list.push({
                    player: true, x: free.x, y: free.y, deg: free.heading, spin: 0,
                    vx: Math.sin(rad) * free.speed, vy: -Math.cos(rad) * free.speed,
                    w: j.carEl.offsetWidth, l: j.carEl.offsetHeight, m: 1.2
                });
            }
            let origin = null;
            j.traffic.forEach(v => {
                const b = { v, w: v.wPx, l: v.lenPx, m: v.kind.mass };
                if (v.mode === 'knocked') {
                    Object.assign(b, { x: v.kx, y: v.ky, deg: v.deg, vx: v.vx, vy: v.vy, spin: v.spin });
                } else if (v.px !== undefined) {
                    if (!origin) {
                        const r = j.el.getBoundingClientRect();
                        origin = { x: r.left + scrollX, y: r.top + scrollY };
                    }
                    const rad = v.deg * Math.PI / 180;
                    Object.assign(b, {
                        x: origin.x + v.px, y: origin.y + v.py, deg: v.deg, spin: 0,
                        vx: Math.sin(rad) * v.speed, vy: -Math.cos(rad) * v.speed
                    });
                } else return;
                list.push(b);
            });
            return list;
        }

        // The capsule's spine, end to end along the direction it faces
        function spine(b) {
            const rad = b.deg * Math.PI / 180, ux = Math.sin(rad), uy = -Math.cos(rad);
            const h = Math.max(0, (b.l - b.w) / 2);
            return [b.x - ux * h, b.y - uy * h, b.x + ux * h, b.y + uy * h];
        }

        // Closest points between two line segments (Ericson, Real-Time Collision Detection, 5.1.9)
        function closest([ax, ay, bx, by], [cx, cy, dx, dy]) {
            const d1x = bx - ax, d1y = by - ay, d2x = dx - cx, d2y = dy - cy, rx = ax - cx, ry = ay - cy;
            const a = d1x * d1x + d1y * d1y, e = d2x * d2x + d2y * d2y, f = d2x * rx + d2y * ry;
            let s = 0, t = 0;
            if (a > 1e-6 && e > 1e-6) {
                const c = d1x * rx + d1y * ry, b = d1x * d2x + d1y * d2y, denom = a * e - b * b;
                s = denom > 1e-6 ? clamp01((b * f - c * e) / denom) : 0;
                t = (b * s + f) / e;
                if (t < 0) { t = 0; s = clamp01(-c / a); }
                else if (t > 1) { t = 1; s = clamp01((b - c) / a); }
            } else if (a > 1e-6) {
                s = clamp01(-(d1x * rx + d1y * ry) / a);
            } else if (e > 1e-6) {
                t = clamp01(f / e);
            }
            return [ax + d1x * s, ay + d1y * s, cx + d2x * t, cy + d2y * t];
        }

        function knock(v) {
            Object.assign(v, { mode: 'knocked', J: null, age: 0, spin: 0, fading: 0, braking: false, shown: false });
            v.maxY = document.documentElement.scrollHeight - 40;
            v.el.classList.remove('braking');
            v.el.classList.add('wreck');
            // Out of the scene and loose on the page
            document.body.appendChild(v.el);
        }

        function collide(A, B) {
            const [px, py, qx, qy] = closest(spine(A), spine(B));
            let nx = px - qx, ny = py - qy, dist = Math.hypot(nx, ny);
            const reach = (A.w + B.w) / 2;
            if (dist >= reach) return;
            if (dist < 1e-3) {
                nx = A.x - B.x;
                ny = A.y - B.y;
                dist = Math.hypot(nx, ny) || 1;
            }
            const len = Math.hypot(nx, ny) || 1;
            nx /= len;
            ny /= len;
            [A, B].forEach(b => { if (b.v && b.v.mode !== 'knocked') knock(b.v); });
            // Push the two apart, the lighter one further
            const overlap = reach - Math.min(dist, reach), total = A.m + B.m;
            A.x += nx * overlap * B.m / total;
            A.y += ny * overlap * B.m / total;
            B.x -= nx * overlap * A.m / total;
            B.y -= ny * overlap * A.m / total;
            const closing = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
            if (closing >= 0) return;
            const J = -1.4 * closing / (1 / A.m + 1 / B.m);
            const cx = (px + qx) / 2, cy = (py + qy) / 2;
            [[A, 1], [B, -1]].forEach(([b, sign]) => {
                const ix = sign * J * nx, iy = sign * J * ny;
                b.vx += ix / b.m;
                b.vy += iy / b.m;
                // Off-centre hits set it spinning
                const torque = (cx - b.x) * iy - (cy - b.y) * ix;
                b.spin += torque / (b.m * (b.l * b.l + b.w * b.w) / 12) * 180 / Math.PI;
                // Anything you hit yourself gets a fresh lease before it's towed away
                if ((A.player || B.player) && b.v) {
                    b.v.age = 0;
                    b.v.fading = 0;
                    b.v.el.classList.remove('gone');
                }
            });
            if (-closing > 60) spark(cx, cy);
        }

        function spark(x, y) {
            const s = document.createElement('span');
            s.className = 'spark';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = '*';
            s.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
            document.body.appendChild(s);
            setTimeout(() => s.remove(), 450);
        }

        function tow(v) {
            v.fading = 0;
            v.el.classList.remove('wreck', 'gone');
            journey.el.appendChild(v.el);
            recycle(v);
        }

        // Returns true while there's a loose car on the page
        function stepWrecks(dt) {
            const j = journey;
            if (!free.on && !j.traffic.some(v => v.mode === 'knocked')) return false;
            const list = bodies();
            const loose = b => b.player || b.v.mode === 'knocked';
            for (let i = 0; i < list.length; i++) {
                for (let k = i + 1; k < list.length; k++) {
                    const A = list[i], B = list[k];
                    if (!loose(A) && !loose(B)) continue;
                    if (Math.hypot(A.x - B.x, A.y - B.y) > (A.l + B.l) / 2 + 4) continue;
                    collide(A, B);
                }
            }
            list.forEach(b => {
                if (b.player) {
                    const rad = free.heading * Math.PI / 180;
                    free.x = b.x;
                    free.y = b.y;
                    free.speed = Math.max(0, b.vx * Math.sin(rad) - b.vy * Math.cos(rad));
                } else if (b.v.mode === 'knocked') {
                    Object.assign(b.v, { kx: b.x, ky: b.y, vx: b.vx, vy: b.vy, spin: b.spin, deg: b.deg });
                }
            });

            const maxX = document.documentElement.clientWidth - 30;
            let any = false;
            j.traffic.forEach(v => {
                if (v.mode !== 'knocked') return;
                any = true;
                // Tyres scrubbing: slide and spin both die away
                const drag = Math.exp(-2.2 * dt);
                v.vx *= drag;
                v.vy *= drag;
                v.spin *= Math.exp(-3 * dt);
                v.kx += v.vx * dt;
                v.ky += v.vy * dt;
                v.deg += v.spin * dt;
                if (v.kx < 30 || v.kx > maxX) { v.kx = Math.max(30, Math.min(maxX, v.kx)); v.vx *= -0.4; }
                if (v.ky < 30 || v.ky > v.maxY) { v.ky = Math.max(30, Math.min(v.maxY, v.ky)); v.vy *= -0.4; }
                v.el.style.transform = `translate(${v.kx}px, ${v.ky}px) translate(-50%, -50%) rotate(${v.deg}deg)`;
                v.age += dt;
                if (!v.fading && v.age > 6 && Math.hypot(v.vx, v.vy) < 15) {
                    v.fading = 0.7;
                    v.el.classList.add('gone');
                } else if (v.fading) {
                    v.fading -= dt;
                    if (v.fading <= 0) tow(v);
                }
            });
            return any;
        }


        addEventListener('keydown', e => {
            if (!ARROWS.includes(e.key) && !(free.on && e.key === 'Escape')) return;
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
            if (e.key === 'Escape') {
                handBack();
                return;
            }
            if (!free.on) {
                if (!atRoadEnd()) return;
                takeWheel();
            }
            e.preventDefault();
            free.keys.add(e.key);
            queueDrive();
        });
        addEventListener('keyup', e => free.keys.delete(e.key));
        addEventListener('blur', () => free.keys.clear());

        function refreshJourney() {
            buildJourney();
            queueDrive();
        }

        refreshJourney();
        // Only keep traffic moving while the road is on screen
        if (journey.el && 'IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                journey.inView = entry.isIntersecting;
                queueDrive();
            }).observe(journey.el);
        }
        addEventListener('scroll', queueDrive, { passive: true });
        addEventListener('load', refreshJourney);
        document.fonts.ready.then(refreshJourney);
        motionPreference.addEventListener('change', queueDrive);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationFrame);
                animationFrame = 0;
                lastFrame = 0;
            } else queueDrive();
        });
        let resizeTimer;
        addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(refreshJourney, 150);
        });
