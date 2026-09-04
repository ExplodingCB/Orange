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
            cur: 2
        };

        function roadX(r) {
            const c = journey.cols;
            const halfRoad = c < 24 ? 3 : 5;
            const amplitude = Math.max(0, Math.min(c * 0.16, c / 2 - halfRoad - 2));
            return c * 0.5 + amplitude * Math.sin(r * 0.05 + journey.phase);
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
            // Three depth layers: far (misty, blurred), mid, near (sharp, by the road)
            const mkGrid = () => Array.from({ length: j.rows }, () => new Array(j.cols).fill(' '));
            const far = mkGrid(), mid = mkGrid(), near = mkGrid();
            const road = mkGrid(), markings = mkGrid();
            const narrow = j.cols < 24;
            const hw = narrow ? 3 : 5;
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
                    stamp(random() < 0.45 ? far : mid, t, bx + Math.floor(random() * 5) - 2, r);
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
                    const off = narrow ? hw + 1 : 7 + Math.floor(random() * 5);
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
                if (fits(t, x0, r0)) stamp(random() < 0.5 ? mid : near, t, x0, r0);
            }

            // Undergrowth scattered on the forest floor
            const tufts = ',.\'"';
            for (let i = 0; i < Math.floor(j.cols * j.rows / 140); i++) {
                const x = Math.floor(random() * j.cols);
                const r = 8 + Math.floor(random() * (j.rows - 8));
                if (!occupied(r, x)) mid[r][x] = tufts[Math.floor(random() * tufts.length)];
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
                if (rr % 5 < 3) {
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

            document.getElementById('scene-far').textContent = far.map(row => row.join('')).join('\n');
            document.getElementById('scene-mid').textContent = mid.map(row => row.join('')).join('\n');
            document.getElementById('scene-near').textContent = near.map(row => row.join('')).join('\n');
            document.getElementById('lane-markings').textContent = markings.map(row => row.join('')).join('\n');
            j.road.textContent = road.map(row => row.join('')).join('\n');
        }

        const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
        let animationFrame = 0;

        function driveCar() {
            animationFrame = 0;
            const j = journey;
            if (document.hidden || j.rows < 12 || j.cols < 10 || getComputedStyle(j.el).display === 'none') return;
            const target = Math.min(j.rows - 8, Math.max(2,
                (scrollY + innerHeight * 0.45 - j.el.offsetTop) / j.lineH));
            const distance = target - j.cur;
            j.cur += motionPreference.matches || Math.abs(distance) < 0.02 ? distance : distance * 0.1;
            const xPx = roadX(j.cur) * j.charW;
            const yPx = j.cur * j.lineH;
            const dxPx = (roadX(j.cur + 2) - roadX(j.cur - 2)) / 4 * j.charW;
            const deg = -Math.atan2(dxPx, j.lineH) * 180 / Math.PI;
            j.carEl.style.transform = `translate(${xPx}px, ${yPx}px) translate(-50%, -50%) rotate(${deg}deg)`;
            if (!motionPreference.matches && Math.abs(target - j.cur) >= 0.02) queueDrive();
        }

        function queueDrive() {
            if (!animationFrame) animationFrame = requestAnimationFrame(driveCar);
        }

        function refreshJourney() {
            buildJourney();
            queueDrive();
        }

        refreshJourney();
        addEventListener('scroll', queueDrive, { passive: true });
        addEventListener('load', refreshJourney);
        document.fonts.ready.then(refreshJourney);
        motionPreference.addEventListener('change', queueDrive);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationFrame);
                animationFrame = 0;
            } else queueDrive();
        });
        let resizeTimer;
        addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(refreshJourney, 150);
        });
