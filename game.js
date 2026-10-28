/* =========================================================
   Michito Chichen — a 6x6 matching game
   ========================================================= */

/* ---------- Pictures ----------
   18 pairs: 9 cat photos (placeholders 1-9) and 9 photos of us (placeholders A-I).
   When the real photos are ready, put them in the images/ folder and fill in
   "image" with the file path, for example: image: 'images/cats/cat1.jpg'.
   Leave image empty ('') to keep showing the placeholder. */
const PAIRS = [
  { id: 'cat1', kind: 'cat', label: '1', image: 'images/cats/cat1.png' },
  { id: 'cat2', kind: 'cat', label: '2', image: 'images/cats/cat2.png' },
  { id: 'cat3', kind: 'cat', label: '3', image: 'images/cats/cat3.png' },
  { id: 'cat4', kind: 'cat', label: '4', image: 'images/cats/cat4.png' },
  { id: 'cat5', kind: 'cat', label: '5', image: 'images/cats/cat5.png' },
  { id: 'cat6', kind: 'cat', label: '6', image: 'images/cats/cat6.jpg' },
  { id: 'cat7', kind: 'cat', label: '7', image: 'images/cats/cat7.jpg' },
  { id: 'cat8', kind: 'cat', label: '8', image: 'images/cats/cat8.jpg' },
  { id: 'cat9', kind: 'cat', label: '9', image: 'images/cats/cat9.jpg' },
  { id: 'us1', kind: 'us', label: 'A', image: 'images/us/us1.jpg' },
  { id: 'us2', kind: 'us', label: 'B', image: 'images/us/us2.jpg' },
  { id: 'us3', kind: 'us', label: 'C', image: 'images/us/us3.jpg' },
  { id: 'us4', kind: 'us', label: 'D', image: 'images/us/us4.jpg' },
  { id: 'us5', kind: 'us', label: 'E', image: 'images/us/us5.jpg' },
  { id: 'us6', kind: 'us', label: 'F', image: 'images/us/us6.jpg' },
  { id: 'us7', kind: 'us', label: 'G', image: 'images/us/us7.jpg' },
  { id: 'us8', kind: 'us', label: 'H', image: 'images/us/us8.jpg' },
  { id: 'us9', kind: 'us', label: 'I', image: 'images/us/us9.jpg' },
];

const MAX_MOVES = 26;          // win in 26 or fewer ("under 27")
const INK = '#5B3A2E';
const GOLD = '#E0A82E';

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const boardEl = $('#board');
const bandEl = $('#band');
const moveEl = $('#moveCount');
const movesBox = document.querySelector('.moves');
const pairEl = $('#pairCount');
const mochilaEl = $('#mochila');
const mochilaArt = $('#mochilaArt');
const dock = $('#catDock');
const catArt = $('#catArt');
const tacosEl = $('#tacos');
const soundBtn = $('#soundBtn');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

/* =========================================================
   Sound (all made in the browser, no audio files)
   ========================================================= */
const Sound = {
  ctx: null,
  master: null,
  on: true,
  songNodes: [],
  noiseBuf: null,

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.on ? 0.32 : 0;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  setOn(v) {
    this.on = v;
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.32 : 0, this.ctx.currentTime, 0.02);
    if (!v) this.stopSong();
  },

  ok() { return this.ctx && this.on; },

  tone(freq, t, dur, { type = 'sine', vol = 0.2, attack = 0.005, list = null } = {}) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
    if (list) list.push(o);
    return o;
  },

  noise(t, dur, { vol = 0.2, freq = 1200, q = 1, type = 'bandpass' } = {}) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + dur + 0.02);
  },

  flip() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.tone(700, t, 0.07, { type: 'triangle', vol: 0.12 });
    this.tone(1050, t + 0.03, 0.06, { type: 'triangle', vol: 0.06 });
  },
  match() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    [784, 988, 1319].forEach((f, i) => this.tone(f, t + i * 0.07, 0.25, { type: 'triangle', vol: 0.15 }));
  },
  wrong() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.tone(233, t, 0.14, { type: 'square', vol: 0.05 });
    this.tone(196, t + 0.13, 0.22, { type: 'square', vol: 0.05 });
  },
  munch() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.07, { vol: 0.35, freq: 2200, q: 0.8 });
    this.noise(t + 0.06, 0.05, { vol: 0.2, freq: 3200, q: 0.8 });
  },
  crash() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) this.noise(t + i * 0.09 + Math.random() * 0.04, 0.18, { vol: 0.28, freq: rand(1500, 4500), q: 1.5 });
    this.tone(90, t, 0.4, { type: 'sine', vol: 0.25 });
  },
  rumble() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.5, { vol: 0.25, freq: 180, q: 0.7, type: 'lowpass' });
  },
  sad() {
    if (!this.ok()) return;
    const c = this.ctx;
    const t0 = c.currentTime + 0.05;
    const notes = [[392, 0.38], [370, 0.38], [349, 0.38], [330, 1.1]];
    let t = t0;
    notes.forEach(([f, d], i) => {
      const o = c.createOscillator();
      const flt = c.createBiquadFilter();
      const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      if (i === 3) {
        const lfo = c.createOscillator();
        const lg = c.createGain();
        lfo.frequency.value = 5; lg.gain.value = 6;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t); lfo.stop(t + d);
        o.frequency.linearRampToValueAtTime(f * 0.94, t + d);
      }
      flt.type = 'lowpass'; flt.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
      g.gain.setValueAtTime(0.16, t + d - 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(flt).connect(g).connect(this.master);
      o.start(t); o.stop(t + d + 0.05);
      t += d;
    });
  },

  /* ---------- Mariachi song: an original little ranchera in D, 3/4 ---------- */
  stopSong() {
    this.songNodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } });
    this.songNodes = [];
  },

  trumpet(freq, t, dur, vol) {
    const c = this.ctx;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.value = freq; o2.frequency.value = freq * 1.003;
    lfo.frequency.value = 5.6;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(dur > 0.5 ? freq * 0.012 : 0, t + Math.min(dur, 0.35));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.05);
    f.frequency.exponentialRampToValueAtTime(1700, t + dur);
    f.Q.value = 2;
    const o2g = c.createGain(); o2g.gain.value = 0.35;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.025);
    g.gain.exponentialRampToValueAtTime(vol * 0.7, t + 0.12);
    g.gain.setValueAtTime(vol * 0.7, t + Math.max(0.12, dur - 0.06));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(o2g).connect(f); f.connect(g).connect(this.master);
    [o, o2, lfo].forEach((n) => { n.start(t); n.stop(t + dur + 0.05); this.songNodes.push(n); });
  },

  pluck(freq, t, vol, len = 0.7) {
    this.tone(freq, t, len, { type: 'triangle', vol, attack: 0.003, list: this.songNodes });
    this.tone(freq * 2, t, len * 0.4, { type: 'sine', vol: vol * 0.35, attack: 0.003, list: this.songNodes });
  },

  playSong() {
    if (!this.ok()) return;
    this.stopSong();
    const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const SCALE = [0, 2, 4, 5, 7, 9, 11];
    const deg = (d) => 62 + 12 * Math.floor(d / 7) + SCALE[((d % 7) + 7) % 7];
    const CH = {
      D: { bass: [38, 45], strum: [50, 54, 57, 62] },
      A7: { bass: [33, 40], strum: [57, 61, 64, 67] },
      G: { bass: [31, 38], strum: [55, 59, 62, 67] },
    };
    const melody = [
      [[4, 1], [2, 1], [4, 1]], [[7, 2], [6, 1]], [[6, 1], [5, 1], [4, 1]], [[3, 2], [1, 1]],
      [[1, 1], [3, 1], [6, 1]], [[8, 2], [6, 1]], [[7, 1], [4, 1], [2, 1]], [[7, 3]],
      [[9, 1], [8, 1], [7, 1]], [[3, 1], [5, 1], [7, 1]], [[9, 2], [7, 1]], [[6, 1], [8, 1], [6, 1]],
      [[4, 1], [6, 1], [8, 1]], [[10, 2], [8, 1]], [[8, 1], [6, 1], [4, 1]], [[7, 3]],
    ];
    const chords = ['D', 'D', 'A7', 'A7', 'A7', 'A7', 'D', 'D', 'D', 'G', 'D', 'A7', 'A7', 'A7', 'A7', 'D'];
    const beat = 60 / 168;
    const start = this.ctx.currentTime + 0.15;
    const intro = 2;
    const totalBars = intro + chords.length;

    for (let b = 0; b < totalBars; b++) {
      const name = b < intro ? 'D' : chords[b - intro];
      const ch = CH[name];
      const t = start + b * 3 * beat;
      this.pluck(midi(ch.bass[b % 2]), t, 0.32, 0.5);
      [1, 2].forEach((k) => {
        ch.strum.forEach((m, j) => this.pluck(midi(m), t + k * beat + j * 0.012, 0.07, 0.35));
      });
    }

    let t = start + intro * 3 * beat;
    melody.forEach((bar) => {
      bar.forEach(([d, beats]) => {
        const dur = beats * beat;
        this.trumpet(midi(deg(d)), t, dur * 0.92, 0.12);
        this.trumpet(midi(deg(d - 2)), t, dur * 0.92, 0.08);
        t += dur;
      });
    });

    const end = start + totalBars * 3 * beat;
    CH.D.strum.concat([66, 69, 74]).forEach((m, j) => this.pluck(midi(m), end + j * 0.02, 0.08, 1.4));
    this.pluck(midi(38), end, 0.35, 1.2);
    this.trumpet(midi(74), end, 1.3, 0.1);
    this.trumpet(midi(78), end, 1.3, 0.08);
  },
};

try { Sound.on = localStorage.getItem('michito-sound') !== 'off'; } catch (e) { /* storage blocked */ }
soundBtn.setAttribute('aria-pressed', String(Sound.on));
soundBtn.setAttribute('aria-label', Sound.on ? 'Sound on' : 'Sound off');
soundBtn.addEventListener('click', () => {
  Sound.init();
  Sound.setOn(!Sound.on);
  soundBtn.setAttribute('aria-pressed', String(Sound.on));
  soundBtn.setAttribute('aria-label', Sound.on ? 'Sound on' : 'Sound off');
  try { localStorage.setItem('michito-sound', Sound.on ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
});

/* =========================================================
   Artwork (SVG)
   ========================================================= */
const ICON_PAW = `<svg class="ph-icon" viewBox="0 0 36 36" aria-hidden="true"><g fill="currentColor"><ellipse cx="18" cy="23" rx="7" ry="6"/><circle cx="9.5" cy="15" r="3"/><circle cx="14.5" cy="10.5" r="3"/><circle cx="21.5" cy="10.5" r="3"/><circle cx="26.5" cy="15" r="3"/></g></svg>`;
const ICON_HEART = `<svg class="ph-icon" viewBox="0 0 36 36" aria-hidden="true"><path fill="currentColor" d="M18 31 C 6 22 3 16 5 11 C 7 6 14 5 18 11 C 22 5 29 6 31 11 C 33 16 30 22 18 31 Z"/></svg>`;

const MOCHILA_SVG = `
<svg viewBox="0 0 140 150" aria-hidden="true">
  <path d="M34 50 L28 16 L58 38 Z" fill="#FDA4AF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M106 50 L112 16 L82 38 Z" fill="#FDA4AF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M37 42 L34 25 L50 37 Z" fill="#C4B5FD"/>
  <path d="M103 42 L106 25 L90 37 Z" fill="#C4B5FD"/>
  <path d="M55 34 Q70 12 85 34" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="20" y="32" width="100" height="110" rx="32" fill="#FDA4AF" stroke="${INK}" stroke-width="3.5"/>
  <path d="M20 110 Q10 112 12 128" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M120 110 Q130 112 128 128" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <rect x="36" y="90" width="68" height="40" rx="15" fill="#A7F3D0" stroke="${INK}" stroke-width="3"/>
  <rect x="42" y="96" width="56" height="28" rx="10" fill="none" stroke="#1B8F6A" stroke-width="1.6" stroke-dasharray="4 3"/>
  <g fill="#1B8F6A" transform="translate(70 111)">
    <ellipse cx="0" cy="3" rx="5.5" ry="4.5"/><circle cx="-6.5" cy="-3" r="2.2"/><circle cx="-2.3" cy="-6.5" r="2.2"/><circle cx="2.3" cy="-6.5" r="2.2"/><circle cx="6.5" cy="-3" r="2.2"/>
  </g>
  <g class="flap">
    <path d="M22 66 Q22 34 54 34 L86 34 Q118 34 118 66 L118 72 Q70 90 22 72 Z" fill="#C4B5FD" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M50 58 q5 5 10 0 M80 58 q5 5 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="45" cy="66" r="4" fill="#FDA4AF" opacity="0.8"/><circle cx="95" cy="66" r="4" fill="#FDA4AF" opacity="0.8"/>
    <rect x="62" y="72" width="16" height="14" rx="4" fill="#FDE68A" stroke="${INK}" stroke-width="3"/>
  </g>
</svg>`;

const FUR = '#F6B26B', STRIPE = '#D9822B', CREAM = '#FFE8C7';
const CAT_SVG = `
<svg viewBox="0 0 200 170" aria-hidden="true">
  <g class="cat-body-g">
    <path d="M152 150 C 196 150, 200 104, 176 92" stroke="${INK}" stroke-width="21" fill="none" stroke-linecap="round"/>
    <path d="M152 150 C 196 150, 200 104, 176 92" stroke="${FUR}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M190 122 l-12 -3 M186 104 l-11 2" stroke="${STRIPE}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="100" cy="132" rx="66" ry="34" fill="${FUR}" stroke="${INK}" stroke-width="3.5"/>
    <path d="M66 108 q7 10 0 20 M134 108 q-7 10 0 20 M150 122 q-8 6 -4 16" stroke="${STRIPE}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="100" cy="144" rx="34" ry="17" fill="${CREAM}"/>
    <ellipse cx="78" cy="160" rx="16" ry="9" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="122" cy="160" rx="16" ry="9" fill="${FUR}" stroke="${INK}" stroke-width="3"/>
    <path d="M74 164 v-5 M82 164 v-5 M118 164 v-5 M126 164 v-5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="head-g">
    <g class="ears-g">
      <path d="M62 64 L60 22 L94 44 Z" fill="${FUR}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M138 64 L140 22 L106 44 Z" fill="${FUR}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M68 54 L67 32 L85 45 Z" fill="#FDA4AF"/>
      <path d="M132 54 L133 32 L115 45 Z" fill="#FDA4AF"/>
    </g>
    <ellipse cx="100" cy="80" rx="47" ry="40" fill="${FUR}" stroke="${INK}" stroke-width="3.5"/>
    <g stroke="${STRIPE}" stroke-width="4.5" stroke-linecap="round" fill="none">
      <path d="M100 43 v12"/><path d="M87 46 l3 10"/><path d="M113 46 l-3 10"/>
      <path d="M54 80 h11"/><path d="M55 89 h10"/><path d="M146 80 h-11"/><path d="M145 89 h-10"/>
    </g>
    <ellipse cx="100" cy="97" rx="19" ry="13" fill="${CREAM}"/>
    <circle cx="71" cy="94" r="7" fill="#FDA4AF" opacity="0.75"/>
    <circle cx="129" cy="94" r="7" fill="#FDA4AF" opacity="0.75"/>
    <path d="M95 89 h10 l-5 6 z" fill="#E86A8A" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
    <g stroke="${INK}" stroke-width="1.8" stroke-linecap="round">
      <path d="M80 96 L48 91"/><path d="M80 101 L50 104"/><path d="M120 96 L152 91"/><path d="M120 101 L150 104"/>
    </g>
    <g class="face-sleep" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round">
      <path d="M73 78 q9 7 18 0"/><path d="M109 78 q9 7 18 0"/>
      <path d="M93 100 q3.5 4 7 0 q3.5 4 7 0"/>
    </g>
    <g class="face-awake">
      <g stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M73 81 q9 -10 18 0"/><path d="M109 81 q9 -10 18 0"/></g>
      <path d="M89 99 q11 16 22 0 z" fill="#8A3346" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M94 105 q6 5 12 0 q-6 -4 -12 0" fill="#FDA4AF"/>
    </g>
    <g class="face-chew">
      <g stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M73 81 q9 -10 18 0"/><path d="M109 81 q9 -10 18 0"/><path d="M91 101 q9 7 18 0"/></g>
      <circle cx="74" cy="98" r="10" fill="#FDA4AF" opacity="0.6"/><circle cx="126" cy="98" r="10" fill="#FDA4AF" opacity="0.6"/>
    </g>
    <g class="face-sad">
      <circle cx="82" cy="80" r="5.5" fill="${INK}"/><circle cx="118" cy="80" r="5.5" fill="${INK}"/>
      <circle cx="84" cy="78" r="1.8" fill="#fff"/><circle cx="120" cy="78" r="1.8" fill="#fff"/>
      <g stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round">
        <path d="M71 71 L88 65"/><path d="M129 71 L112 65"/><path d="M90 105 q10 -9 20 0"/>
      </g>
    </g>
    <path class="tear" d="M80 89 q-5 8 0 11 q5 -3 0 -11 z" fill="#7FC7F0" stroke="#4A9BC9" stroke-width="1.2"/>
  </g>
</svg>`;

const TACO_SVG = `
<svg viewBox="0 0 60 42">
  <path d="M9 18 q3 -9 8 -4 q3 -9 9 -4 q3 -9 9 -4 q4 -8 8 -3 q4 -6 8 0 L52 20 L8 20 Z" fill="#7CC66B" stroke="#3E8A33" stroke-width="1.5"/>
  <path d="M10 20 q4 -6 8 -2 q4 -6 8 -2 q4 -6 8 -2 q4 -6 8 -2 q4 -4 8 1 L50 22 L10 22 Z" fill="#9A5B34"/>
  <circle cx="18" cy="13" r="3" fill="#E85A5A"/><circle cx="33" cy="11" r="3" fill="#E85A5A"/><circle cx="44" cy="14" r="2.6" fill="#E85A5A"/>
  <path d="M24 15 l3 -4 M38 15 l2 -4" stroke="#FDE68A" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M4 18 A26 22 0 0 0 56 18 Z" fill="#F7C948" stroke="#B9851E" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="20" cy="27" r="1.3" fill="#D9A22A"/><circle cx="31" cy="32" r="1.3" fill="#D9A22A"/><circle cx="41" cy="25" r="1.3" fill="#D9A22A"/>
</svg>`;

/* ---------- Mariachi cats ---------- */
const BAND = [
  { name: 'orange tabby', fur: '#F6B26B', pattern: 'tabby', stripe: '#D9822B', muzzle: '#FFE8C7', suit: '#B9A6F7', tie: '#E85A8A', hat: '#F3D27A', inst: 'violin' },
  { name: 'tuxedo', fur: '#3A3A44', pattern: 'tux', muzzle: '#FFFFFF', eye: '#FFE9A8', suit: '#86E3BE', tie: '#E85A5A', hat: '#7C4DBE', inst: 'trumpet' },
  { name: 'calico', fur: '#FFF8EE', pattern: 'calico', p1: '#F2A65A', p2: '#3A3A44', muzzle: '#FFFFFF', suit: '#F9A3B5', tie: '#7C4DBE', hat: '#F3D27A', inst: 'guitar' },
  { name: 'gray tabby', fur: '#A8A9B4', pattern: 'tabby', stripe: '#6E7080', muzzle: '#E9E9EE', suit: '#F8DC74', tie: '#1B8F6A', hat: '#F7A1B3', inst: 'guitarron' },
  { name: 'siamese', fur: '#F3E3C3', pattern: 'siamese', point: '#6B4A3A', eye: '#FFE9A8', suit: '#9FD3F7', tie: '#E85A8A', hat: '#86E3BE', inst: 'trumpet' },
  { name: 'spotty', fur: '#FFFFFF', pattern: 'spots', spot: '#9CA3AF', muzzle: '#FFF1F3', suit: '#F7B98B', tie: '#7C4DBE', hat: '#B9A6F7', inst: 'maracas' },
];

function xf(tf, x, y) {
  const [tx, ty, a, s] = tf;
  const r = (a * Math.PI) / 180;
  return [tx + s * (x * Math.cos(r) - y * Math.sin(r)), ty + s * (x * Math.sin(r) + y * Math.cos(r))];
}

function paw(x, y, fur) {
  return `<circle cx="${x}" cy="${y}" r="6" fill="${fur}" stroke="${INK}" stroke-width="2"/>`;
}

function instrument(c) {
  const wood = (w, dark) => `
    <circle cx="-8" cy="0" r="17" fill="${w}" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="12" cy="0" r="13" fill="${w}" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="2" cy="0" rx="13" ry="10.5" fill="${w}"/>
    <circle cx="4" cy="0" r="5" fill="${INK}"/>
    <rect x="-21" y="-4" width="4" height="8" rx="1" fill="${dark}"/>
    <rect x="22" y="-3.5" width="32" height="7" rx="2" fill="${dark}" stroke="${INK}" stroke-width="2"/>
    <rect x="52" y="-5.5" width="10" height="11" rx="2" fill="${dark}" stroke="${INK}" stroke-width="2"/>
    <path d="M-19 -1.5 H56 M-19 1.5 H56" stroke="#FFF3D6" stroke-width="0.8"/>`;
  switch (c.inst) {
    case 'guitar':
      return [{ tf: [56, 130, -24, 1], cls: 'strum', svg: wood('#E0A262', '#8B5A2B'), paws: [[42, 5], [2, -13]] }];
    case 'guitarron':
      return [{ tf: [56, 132, -18, 1.12], cls: 'strum', svg: wood('#A8673A', '#6B4423'), paws: [[40, 5], [0, -14]] }];
    case 'violin':
      return [
        {
          tf: [70, 106, -30, 1], cls: '', paws: [[34, 0]],
          svg: `<circle cx="0" cy="0" r="9.5" fill="#C0602F" stroke="${INK}" stroke-width="2.2"/>
                <circle cx="13" cy="0" r="7.5" fill="#C0602F" stroke="${INK}" stroke-width="2.2"/>
                <ellipse cx="6.5" cy="0" rx="8" ry="6" fill="#C0602F"/>
                <path d="M3 -4 q2 4 0 8 M10 -4 q-2 4 0 8" stroke="${INK}" stroke-width="1.3" fill="none"/>
                <rect x="19" y="-2.2" width="16" height="4.4" rx="1.5" fill="#5B3A2E"/>
                <circle cx="37" cy="0" r="3" fill="#5B3A2E"/>`,
        },
        {
          tf: [64, 112, 22, 1], cls: 'saw', paws: [[-22, 0]],
          svg: `<path d="M-26 0 H28" stroke="#8B5A2B" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M-24 3 H26" stroke="#FFF3D6" stroke-width="1.2"/>`,
        },
      ];
    case 'trumpet':
      return [{
        tf: [60, 88, -12, 1], cls: 'toot', paws: [[3, 9], [19, 10]],
        svg: `<rect x="0" y="-3" width="30" height="6" rx="2" fill="#F2C14E" stroke="${INK}" stroke-width="2"/>
              <rect x="6" y="3" width="20" height="5" rx="2.5" fill="none" stroke="${GOLD}" stroke-width="2"/>
              <rect x="9" y="-10" width="3.5" height="7" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/>
              <rect x="15" y="-10" width="3.5" height="7" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/>
              <rect x="21" y="-10" width="3.5" height="7" fill="${GOLD}" stroke="${INK}" stroke-width="1.4"/>
              <path d="M28 -4 L45 -13 Q48 0 45 13 L28 4 Z" fill="#F2C14E" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
              <ellipse cx="45.5" cy="0" rx="3" ry="13" fill="#F8D77A" stroke="${INK}" stroke-width="2"/>`,
      }];
    case 'maracas': {
      const m = (col) => `<path d="M0 0 V15" stroke="#8B5A2B" stroke-width="3.5" stroke-linecap="round"/>
        <ellipse cx="0" cy="-6" rx="8" ry="10" fill="${col}" stroke="${INK}" stroke-width="2"/>
        <path d="M-7 -6 l3.5 -3 l3.5 3 l3.5 -3 l3.5 3" stroke="#fff" stroke-width="1.6" fill="none"/>`;
      return [
        { tf: [28, 116, -10, 1], cls: 'shake', svg: m('#7CC66B'), paws: [[0, 12]] },
        { tf: [92, 116, 10, 1], cls: 'shake', svg: m('#E85A5A'), paws: [[0, 12]] },
      ];
    }
    default:
      return [];
  }
}

function mariachiSVG(c, i) {
  const eye = c.eye || INK;
  const earFill = c.point || c.fur;
  const clip = `hc${i}`;
  let pattern = '';
  if (c.pattern === 'tabby') {
    pattern = `<g stroke="${c.stripe}" stroke-width="3.5" stroke-linecap="round" fill="none">
      <path d="M60 55 v7"/><path d="M52 56 l2 6"/><path d="M68 56 l-2 6"/>
      <path d="M34 72 h8"/><path d="M35 80 h7"/><path d="M86 72 h-8"/><path d="M85 80 h-7"/></g>`;
  } else if (c.pattern === 'calico') {
    pattern = `<circle cx="40" cy="60" r="15" fill="${c.p1}"/><circle cx="82" cy="62" r="12" fill="${c.p2}"/><circle cx="76" cy="95" r="6" fill="${c.p1}"/>`;
  } else if (c.pattern === 'spots') {
    pattern = `<circle cx="44" cy="60" r="8" fill="${c.spot}"/><circle cx="78" cy="66" r="9" fill="${c.spot}"/><circle cx="40" cy="84" r="4" fill="${c.spot}"/>`;
  } else if (c.pattern === 'siamese') {
    pattern = `<ellipse cx="60" cy="81" rx="17" ry="14" fill="${c.point}"/>`;
  } else if (c.pattern === 'tux') {
    pattern = `<path d="M60 58 L44 100 L76 100 Z" fill="#FFFFFF"/>`;
  }
  const muzzle = c.pattern === 'siamese' ? '' : `<ellipse cx="60" cy="85" rx="11" ry="8" fill="${c.muzzle}"/>`;
  const blowing = c.inst === 'trumpet';
  const mouth = blowing
    ? `<circle cx="47" cy="86" r="7" fill="#FDA4AF" opacity="0.7"/><circle cx="73" cy="86" r="7" fill="#FDA4AF" opacity="0.7"/>`
    : `<ellipse cx="60" cy="89" rx="3.6" ry="4.6" fill="#8A3346" stroke="${INK}" stroke-width="1.5"/>
       <circle cx="46" cy="84" r="4.5" fill="#FDA4AF" opacity="0.7"/><circle cx="74" cy="84" r="4.5" fill="#FDA4AF" opacity="0.7"/>`;

  const groups = instrument(c);
  const allPaws = [];
  groups.forEach((g) => g.paws.forEach(([x, y]) => allPaws.push(xf(g.tf, x, y))));
  allPaws.sort((a, b) => a[0] - b[0]);
  const shoulders = [[44, 108], [76, 108]];
  const sleeves = allPaws.slice(0, 2).map(([x, y], k) => {
    const [sx, sy] = allPaws.length === 1 ? shoulders[1] : shoulders[k];
    return `<path d="M${sx} ${sy} L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
            <path d="M${sx} ${sy} L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${c.suit}" stroke-width="8" stroke-linecap="round"/>`;
  }).join('');
  const inst = groups.map((g) => `
    <g transform="translate(${g.tf[0]} ${g.tf[1]}) rotate(${g.tf[2]}) scale(${g.tf[3]})">
      <g class="inst ${g.cls}">${g.svg}${g.paws.map(([x, y]) => paw(x, y, c.fur)).join('')}</g>
    </g>`).join('');

  return `
<svg viewBox="0 0 120 180" role="img" aria-label="${c.name} cat playing ${c.inst === 'guitarron' ? 'guitarrón' : c.inst}">
  <defs><clipPath id="${clip}"><circle cx="60" cy="74" r="26"/></clipPath></defs>
  <path d="M82 146 Q110 146 103 114" stroke="${INK}" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M82 146 Q110 146 103 114" stroke="${c.pattern === 'siamese' ? c.point : c.fur}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <rect x="45" y="146" width="12" height="22" rx="4" fill="${c.suit}" stroke="${INK}" stroke-width="2.2"/>
  <rect x="63" y="146" width="12" height="22" rx="4" fill="${c.suit}" stroke="${INK}" stroke-width="2.2"/>
  <ellipse cx="50" cy="170" rx="9" ry="5" fill="${INK}"/><ellipse cx="70" cy="170" rx="9" ry="5" fill="${INK}"/>
  <path d="M36 152 Q34 100 60 97 Q86 100 84 152 Z" fill="${c.suit}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M52 99 L60 121 L68 99 Z" fill="#FFFFFF"/>
  <g fill="${GOLD}"><circle cx="44" cy="118" r="2.2"/><circle cx="43" cy="130" r="2.2"/><circle cx="43" cy="142" r="2.2"/><circle cx="76" cy="118" r="2.2"/><circle cx="77" cy="130" r="2.2"/><circle cx="77" cy="142" r="2.2"/></g>
  <path d="M60 102 L50 96.5 L50 107.5 Z M60 102 L70 96.5 L70 107.5 Z" fill="${c.tie}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="60" cy="102" r="2.6" fill="${c.tie}" stroke="${INK}" stroke-width="1.4"/>
  <circle cx="60" cy="74" r="26" fill="${c.fur}" stroke="${INK}" stroke-width="2.5"/>
  <g clip-path="url(#${clip})">${pattern}</g>
  <circle cx="60" cy="74" r="26" fill="none" stroke="${INK}" stroke-width="2.5"/>
  ${muzzle}
  <g stroke="${eye}" stroke-width="2.8" fill="none" stroke-linecap="round"><path d="M46 72 q5.5 -6 11 0"/><path d="M63 72 q5.5 -6 11 0"/></g>
  <path d="M57 80 h6 l-3 3.5 z" fill="#E86A8A"/>
  ${mouth}
  <g stroke="${c.pattern === 'tux' || c.pattern === 'siamese' ? '#E9E9EE' : INK}" stroke-width="1.2" stroke-linecap="round">
    <path d="M48 84 L30 81"/><path d="M48 87 L31 89"/><path d="M72 84 L90 81"/><path d="M72 87 L89 89"/>
  </g>
  <g class="hat">
    <path d="M45 44 Q46 14 60 12 Q74 14 75 44 Z" fill="${c.hat}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M46 34 Q60 39 74 34 L74.6 41 Q60 46 45.4 41 Z" fill="${GOLD}"/>
    <ellipse cx="60" cy="46" rx="47" ry="9.5" fill="${c.hat}" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="60" cy="46" rx="40" ry="6.5" fill="none" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/>
  </g>
  <path d="M38 62 L30 30 L52 50 Z" fill="${earFill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M82 62 L90 30 L68 50 Z" fill="${earFill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M38 52 L34 37 L46 48 Z" fill="#FDA4AF"/><path d="M82 52 L86 37 L74 48 Z" fill="#FDA4AF"/>
  ${sleeves}
  ${inst}
</svg>`;
}

/* =========================================================
   Game state
   ========================================================= */
const state = {
  first: null,
  second: null,
  lock: false,
  over: false,
  moves: 0,
  matched: 0,
  streak: 0,
};
let eatToken = 0;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function frontHTML(p) {
  if (p.image) {
    const alt = p.kind === 'cat' ? `Cat photo ${p.label}` : `Photo of us ${p.label}`;
    return `<img src="${p.image}" alt="${alt}" draggable="false">`;
  }
  return `<span class="ph">${p.label}</span>${p.kind === 'cat' ? ICON_PAW : ICON_HEART}`;
}

function buildBoard() {
  boardEl.innerHTML = '';
  const deck = shuffle(PAIRS.flatMap((p) => [p, p]));
  deck.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile';
    btn.dataset.id = p.id;
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', `Tile ${idx + 1}, face down`);
    btn.innerHTML = `
      <div class="inner">
        <div class="face back"></div>
        <div class="face front kind-${p.kind}">${frontHTML(p)}</div>
      </div>`;
    btn.addEventListener('click', () => onTile(btn, p, idx));
    boardEl.appendChild(btn);
  });
}

function setMoves(n, bump = true) {
  state.moves = n;
  moveEl.textContent = n;
  movesBox.classList.toggle('danger', n >= MAX_MOVES - 4);
  if (bump) {
    movesBox.classList.remove('bump');
    void movesBox.offsetWidth;
    movesBox.classList.add('bump');
  }
}

function setCat(mode) {
  dock.classList.remove('sleeping', 'awake', 'chewing', 'sad');
  dock.classList.add(mode);
}

/* ---------- Turn logic ---------- */
function onTile(btn, p, idx) {
  Sound.init();
  if (state.lock || state.over) return;
  if (btn.classList.contains('flipped') || btn.classList.contains('gone')) return;

  btn.classList.add('flipped');
  btn.setAttribute('aria-label', `Tile ${idx + 1}, ${p.kind === 'cat' ? 'cat' : 'photo'} ${p.label}`);
  Sound.flip();

  if (!state.first) {
    state.first = btn;
    return;
  }
  state.second = btn;
  state.lock = true;
  setMoves(state.moves + 1);
  setTimeout(resolveTurn, 600);
}

async function resolveTurn() {
  const a = state.first;
  const b = state.second;
  const isMatch = a.dataset.id === b.dataset.id;

  if (isMatch) {
    state.matched++;
    state.streak++;
    Sound.match();
    flyToMochila([a, b]);
    if (state.streak >= 2) catEat(state.streak - 1);
    await wait(250);
  } else {
    state.streak = 0;
    Sound.wrong();
    a.classList.add('shake');
    b.classList.add('shake');
    await wait(500);
    a.classList.remove('shake', 'flipped');
    b.classList.remove('shake', 'flipped');
    [a, b].forEach((t) => t.setAttribute('aria-label', t.getAttribute('aria-label').replace(/,.*$/, ', face down')));
    await wait(320);
  }

  state.first = null;
  state.second = null;

  if (state.matched === PAIRS.length && state.moves <= MAX_MOVES) {
    win();
  } else if (state.moves > MAX_MOVES || state.matched === PAIRS.length) {
    lose();
  } else {
    state.lock = false;
  }
}

/* ---------- Match: fly into mi mochila ---------- */
function flyToMochila(tiles) {
  const svg = mochilaArt.querySelector('svg');
  const mr = svg.getBoundingClientRect();
  const tx = mr.left + mr.width * 0.5;
  const ty = mr.top + mr.height * 0.32;
  mochilaEl.classList.add('open');

  tiles.forEach((t, i) => {
    const r = t.getBoundingClientRect();
    const fly = t.querySelector('.face.front').cloneNode(true);
    fly.classList.add('flyer');
    Object.assign(fly.style, {
      left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
      inset: 'auto', transform: 'none', position: 'fixed',
    });
    fly.style.left = `${r.left}px`;
    fly.style.top = `${r.top}px`;
    document.body.appendChild(fly);
    t.classList.add('gone');

    const dx = tx - (r.left + r.width / 2);
    const dy = ty - (r.top + r.height / 2);
    const spin = i ? 1 : -1;
    const anim = fly.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 110}px) scale(0.85) rotate(${spin * 25}deg)`, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(${spin * 60}deg)`, opacity: 0.7 },
    ], { duration: 780, delay: i * 110, easing: 'cubic-bezier(.45,0,.6,1)', fill: 'forwards' });

    anim.onfinish = () => {
      fly.remove();
      if (i === tiles.length - 1) {
        pairEl.textContent = state.matched;
        mochilaEl.classList.remove('gulp');
        void mochilaEl.offsetWidth;
        mochilaEl.classList.add('gulp');
        setTimeout(() => mochilaEl.classList.remove('open'), 180);
      }
    };
  });
}

/* ---------- Streak: the cat eats tacos ---------- */
async function catEat(count) {
  const token = ++eatToken;
  tacosEl.innerHTML = '';
  setCat('awake');

  const tacos = [];
  for (let i = 0; i < count; i++) {
    const t = document.createElement('div');
    t.className = 'taco pop';
    t.innerHTML = TACO_SVG;
    t.style.animationDelay = `${i * 0.08}s`;
    tacosEl.appendChild(t);
    tacos.push(t);
  }
  await wait(420 + count * 80);

  for (const t of tacos) {
    if (token !== eatToken) return;
    t.classList.remove('pop');
    t.style.animation = 'none';
    const cr = catArt.getBoundingClientRect();
    const mouthX = cr.left + cr.width * 0.5;
    const mouthY = cr.top + cr.height * (99 / 170);
    const tr = t.getBoundingClientRect();
    const dx = mouthX - (tr.right - tr.width * 0.2);
    const dy = mouthY - (tr.top + tr.height * 0.45);
    t.style.transition = 'transform 0.28s ease-out, clip-path 0.12s ease';
    t.style.transform = `translate(${dx}px, ${dy}px) rotate(-8deg)`;
    await wait(290);
    if (token !== eatToken) return;
    setCat('chewing');
    for (const bite of [32, 64, 100]) {
      t.style.clipPath = `inset(0 ${bite}% 0 0)`;
      Sound.munch();
      await wait(240);
      if (token !== eatToken) return;
    }
    t.remove();
  }

  setCat('awake');
  await wait(1200);
  if (token === eatToken && !state.over) setCat('sleeping');
}

function stopEating() {
  eatToken++;
  tacosEl.innerHTML = '';
}

/* ---------- Lose ---------- */
async function lose() {
  state.over = true;
  state.lock = true;
  stopEating();
  setCat('sleeping');
  await wait(450);

  Sound.rumble();
  boardEl.classList.add('tremble');
  await wait(520);
  boardEl.classList.remove('tremble');

  Sound.crash();
  boardEl.classList.add('broken');
  boardEl.querySelectorAll('.tile').forEach((t) => {
    if (t.classList.contains('gone')) return;
    t.classList.remove('shake');
    t.style.setProperty('--dx', `${rand(-140, 140).toFixed(0)}px`);
    t.style.setProperty('--rot', `${rand(-260, 260).toFixed(0)}deg`);
    t.style.animationDelay = `${rand(0, 0.5).toFixed(2)}s`;
    t.classList.add('fall');
  });
  await wait(1700);

  boardEl.style.visibility = 'hidden';
  setCat('sad');
  dock.classList.add('center');
  Sound.sad();
  await wait(1050);
  if (state.over) dock.classList.add('talking');
}

/* ---------- Win ---------- */
async function win() {
  state.over = true;
  state.lock = true;
  await wait(1000);
  stopEating();

  const colors = ['#A7F3D0', '#C4B5FD', '#FDE68A', '#FDA4AF', '#9FD3F7'];
  const flags = Array.from({ length: 12 }, (_, i) => `<span style="background:${colors[i % colors.length]};animation-delay:${(i * 0.15).toFixed(2)}s"></span>`).join('');
  const notes = Array.from({ length: 9 }, (_, i) =>
    `<span class="note" style="left:${(6 + i * 11).toFixed(0)}%;animation-delay:${(i * 0.37).toFixed(2)}s;font-size:${18 + (i % 3) * 6}px">${i % 2 ? '♫' : '♪'}</span>`).join('');

  bandEl.innerHTML = `
    <div class="papel" aria-hidden="true">${flags}</div>
    <h2>¡Ganaste!</h2>
    <p>All 18 pairs in ${state.moves} moves</p>
    <div class="players">${BAND.map((c, i) => `<div class="player">${mariachiSVG(c, i)}</div>`).join('')}</div>
    <div class="notes" aria-hidden="true">${notes}</div>
    <div style="display:flex;gap:10px;justify-content:center;position:relative;z-index:2">
      <button class="pill-btn" type="button" id="encoreBtn">Encore ♪</button>
      <button class="pill-btn big" type="button" id="winAgainBtn">Play again</button>
    </div>`;
  boardEl.style.display = 'none';
  bandEl.hidden = false;
  setCat('awake');

  $('#encoreBtn').addEventListener('click', () => { Sound.init(); Sound.playSong(); });
  $('#winAgainBtn').addEventListener('click', newGame);
  Sound.playSong();
}

/* ---------- New game ---------- */
function newGame() {
  Sound.stopSong();
  stopEating();
  document.querySelectorAll('.flyer').forEach((f) => f.remove());
  Object.assign(state, { first: null, second: null, lock: false, over: false, matched: 0, streak: 0 });
  setMoves(0, false);
  pairEl.textContent = '0';
  dock.classList.remove('center', 'talking');
  setCat('sleeping');
  bandEl.hidden = true;
  bandEl.innerHTML = '';
  boardEl.className = 'board';
  boardEl.style.display = '';
  boardEl.style.visibility = '';
  buildBoard();
}

/* ---------- Boot ---------- */
mochilaArt.innerHTML = MOCHILA_SVG;
catArt.innerHTML = CAT_SVG;
$('#restartBtn').addEventListener('click', newGame);
$('#tryAgainBtn').addEventListener('click', newGame);
newGame();
