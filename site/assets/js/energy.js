// Energy classification explainer. Slider runs on a log scale from 50 to 2,047 ADC levels,
// so the project's real thresholds (172 and 594) sit at one third and two thirds,
// the same way they split the dB range (92.1 / 102.9 / 113.6 / 124.3).
const MIN = 50, MAX = 2047, T1 = 172, T2 = 594;
const LEVELS = [
  { name: 'ระดับ 1 เล็กน้อย (Minor)', db: '92.1 – 102.9', color: 'var(--g)' },
  { name: 'ระดับ 2 ปานกลาง (Warning)', db: '102.9 – 113.6', color: 'var(--y)' },
  { name: 'ระดับ 3 รุนแรง (Critical)', db: '113.6 – 124.3', color: 'var(--r)' },
];
const lg = (a) => Math.log(a / MIN) / Math.log(MAX / MIN);

export function initEnergy() {
  const slider = document.getElementById('ampSlider');
  if (!slider) return;
  const box = slider.closest('.energy');
  const ampEl = document.getElementById('ampVal');
  const nameEl = document.getElementById('lvName');
  const dbEl = document.getElementById('lvDb');
  const fill = document.getElementById('evFill');
  // slider position is 0..1000 on a log scale
  slider.min = '0'; slider.max = '1000'; slider.step = '1';
  const posOf = (a) => Math.round(lg(a) * 1000);
  const ampOf = (p) => Math.round(MIN * Math.pow(MAX / MIN, p / 1000));
  slider.value = String(posOf(300));
  box.style.setProperty('--t1', `${(lg(T1) * 100).toFixed(2)}%`);
  box.style.setProperty('--t2', `${(lg(T2) * 100).toFixed(2)}%`);
  box.style.setProperty('--a1', (lg(T1) * 100).toFixed(2));
  box.style.setProperty('--a2', ((lg(T2) - lg(T1)) * 100).toFixed(2));
  let lastLv = -1;
  function update() {
    const p = +slider.value, a = ampOf(p);
    const lv = a < T1 ? 0 : a < T2 ? 1 : 2;
    const L = LEVELS[lv];
    ampEl.textContent = a.toLocaleString('en-US');
    box.style.setProperty('--lv', L.color);
    box.style.setProperty('--p', (p / 1000).toFixed(3));
    box.style.setProperty('--ang', `${(-90 + (p / 1000) * 180).toFixed(1)}deg`);
    slider.setAttribute('aria-valuetext', `แอมพลิจูด ${a} ระดับ, ${L.name}`);
    if (lv !== lastLv) {
      nameEl.textContent = L.name; dbEl.textContent = L.db; lastLv = lv;
    }
  }
  slider.addEventListener('input', update);
  update();
  if (fill) fill.style.willChange = 'height';
}
