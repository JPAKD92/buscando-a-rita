// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://wnsbsqmeszmwrugxjpvf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Induc2JzcW1lc3ptd3J1Z3hqcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTk2NDUsImV4cCI6MjA5NzM5NTY0NX0.0cvwFeRu3qhM2dN4JQ56yXC_Or0IDeQjvbnMMgRNwQ0';

// ===== AUDIO ENGINE (Web Audio API) =====
let audioCtx = null;
let musicGain = null;
let musicPlaying = false;
let musicMuted = false;
let musicNodes = [];

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playNote(freq, duration, type, vol, delay) {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime + (delay || 0));
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (delay || 0) + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + (delay || 0));
  osc.stop(ctx.currentTime + (delay || 0) + duration);
}

function playCorrectSound() {
  if (musicMuted) return;
  playNote(523, 0.12, 'sine', 0.2, 0);
  playNote(659, 0.12, 'sine', 0.2, 0.1);
  playNote(784, 0.25, 'sine', 0.25, 0.2);
}

function playIncorrectSound() {
  if (musicMuted) return;
  playNote(310, 0.15, 'square', 0.12, 0);
  playNote(280, 0.15, 'square', 0.12, 0.12);
  playNote(220, 0.35, 'square', 0.1, 0.24);
}

function playTimeoutSound() {
  if (musicMuted) return;
  playNote(400, 0.1, 'triangle', 0.15, 0);
  playNote(350, 0.1, 'triangle', 0.15, 0.08);
  playNote(300, 0.1, 'triangle', 0.15, 0.16);
  playNote(200, 0.4, 'triangle', 0.12, 0.24);
}

function playTickSound() {
  if (musicMuted) return;
  playNote(800, 0.05, 'sine', 0.06, 0);
}

function playClueSound() {
  if (musicMuted) return;
  [523, 587, 659, 784, 880].forEach((f, i) => playNote(f, 0.15, 'sine', 0.12, i * 0.1));
}

function playVictorySound() {
  if (musicMuted) return;
  const notes = [523, 587, 659, 784, 880, 1047];
  notes.forEach((f, i) => playNote(f, 0.2, 'sine', 0.15, i * 0.12));
}

// Background music: simple looping melody
let musicInterval = null;
const melodyNotes = [
  [262, 0.4], [294, 0.4], [330, 0.4], [262, 0.4],
  [262, 0.4], [294, 0.4], [330, 0.4], [262, 0.4],
  [330, 0.4], [349, 0.4], [392, 0.8],
  [330, 0.4], [349, 0.4], [392, 0.8],
  [392, 0.2], [440, 0.2], [392, 0.2], [349, 0.2], [330, 0.4], [262, 0.4],
  [392, 0.2], [440, 0.2], [392, 0.2], [349, 0.2], [330, 0.4], [262, 0.4],
  [262, 0.4], [196, 0.4], [262, 0.8],
  [262, 0.4], [196, 0.4], [262, 0.8],
];

function startMusic() {
  if (musicPlaying || musicMuted) return;
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  musicPlaying = true;
  let noteIdx = 0;
  let nextTime = ctx.currentTime + 0.1;

  function scheduleNotes() {
    while (nextTime < ctx.currentTime + 2) {
      const [freq, dur] = melodyNotes[noteIdx % melodyNotes.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, nextTime);
      gain.gain.exponentialRampToValueAtTime(0.001, nextTime + dur * 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(nextTime);
      osc.stop(nextTime + dur);
      musicNodes.push(osc);
      nextTime += dur;
      noteIdx++;
    }
  }

  scheduleNotes();
  musicInterval = setInterval(() => {
    if (!musicPlaying) return;
    musicNodes = musicNodes.filter(n => { try { return n.context.currentTime < n._stopTime; } catch(e) { return false; } });
    scheduleNotes();
  }, 1000);
}

function stopMusic() {
  musicPlaying = false;
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
}

function toggleMusic() {
  musicMuted = !musicMuted;
  const btn = document.getElementById('music-toggle');
  btn.textContent = musicMuted ? '🔇' : '🎵';
  btn.classList.toggle('muted', musicMuted);
  if (musicMuted) stopMusic();
  else startMusic();
}

// ===== TIMER =====
let timerInterval = null;
let timerSeconds = 10;
const TIMER_MAX = 10;
const CIRCUMFERENCE = 2 * Math.PI * 17; // ~106.8

function startTimer() {
  clearTimer();
  timerSeconds = TIMER_MAX;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 3 && timerSeconds > 0) playTickSound();
    if (timerSeconds <= 0) {
      clearTimer();
      timeUp();
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay() {
  const num = document.getElementById('timer-number');
  const ring = document.getElementById('timer-ring-fill');
  if (!num || !ring) return;
  num.textContent = timerSeconds;
  const offset = CIRCUMFERENCE * (1 - timerSeconds / TIMER_MAX);
  ring.style.strokeDashoffset = offset;
  ring.classList.remove('warning', 'danger');
  num.classList.remove('danger');
  if (timerSeconds <= 3) { ring.classList.add('danger'); num.classList.add('danger'); }
  else if (timerSeconds <= 5) { ring.classList.add('warning'); }
}

function timeUp() {
  if (state.answered) return;
  state.answered = true;
  playTimeoutSound();
  const q = state.levelQuestions[state.currentQuestion];
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
  });
  const icon = document.getElementById('feedback-icon');
  const text = document.getElementById('feedback-text');
  icon.textContent = '⏰';
  text.textContent = `¡Se acabó el tiempo! ${q.explanation}`;
  document.getElementById('feedback-btn').textContent = state.currentQuestion >= 2 ? 'Ver pista 🔍' : 'Siguiente →';
  document.getElementById('feedback-panel').classList.remove('hidden');
  document.getElementById('feedback-overlay').classList.remove('hidden');
}

// ===== CONFETTI =====
function launchConfetti() {
  const colors = ['#FF6B8A','#FFD93D','#4CAF50','#42A5F5','#AB47BC','#FF8C42'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;top:-10px;background:${colors[Math.floor(Math.random()*colors.length)]};width:${Math.random()*8+6}px;height:${Math.random()*8+6}px;border-radius:${Math.random()>0.5?'50%':'2px'};animation-duration:${Math.random()*2+1.5}s;animation-delay:${Math.random()*0.8}s;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

// ===== SVG AVATARES =====
function getCharSVG(char, size) {
  const h = size * 1.25;
  if (char === 'justina') return `<svg viewBox="0 0 160 200" width="${size}" height="${h}" style="display:block"><ellipse cx="80" cy="65" rx="45" ry="48" fill="#C8A25C"/><ellipse cx="80" cy="50" rx="42" ry="35" fill="#D4B06A"/><path d="M38,65 Q35,110 50,130" fill="#C8A25C"/><path d="M122,65 Q125,110 110,130" fill="#C8A25C"/><ellipse cx="80" cy="78" rx="32" ry="34" fill="#FDDCB5"/><ellipse cx="68" cy="78" rx="5" ry="6" fill="white"/><ellipse cx="92" cy="78" rx="5" ry="6" fill="white"/><circle cx="69" cy="79" r="3.5" fill="#5B3A1A"/><circle cx="93" cy="79" r="3.5" fill="#5B3A1A"/><circle cx="70" cy="77.5" r="1.3" fill="white"/><circle cx="94" cy="77.5" r="1.3" fill="white"/><circle cx="60" cy="88" r="6" fill="#FFB5A0" opacity="0.4"/><circle cx="100" cy="88" r="6" fill="#FFB5A0" opacity="0.4"/><path d="M72,92 Q80,100 88,92" fill="none" stroke="#D4777A" stroke-width="2" stroke-linecap="round"/><path d="M50,115 Q48,140 45,170 L115,170 Q112,140 110,115 Q95,108 80,108 Q65,108 50,115Z" fill="#FF7EB3"/><rect x="72" y="107" width="16" height="10" rx="3" fill="#FDDCB5"/></svg>`;
  if (char === 'emilia') return `<svg viewBox="0 0 160 200" width="${size}" height="${h}" style="display:block"><ellipse cx="80" cy="65" rx="46" ry="50" fill="#1A1A1A"/><ellipse cx="80" cy="50" rx="43" ry="36" fill="#2D2D2D"/><path d="M36,65 Q33,115 48,135" fill="#1A1A1A"/><path d="M124,65 Q127,115 112,135" fill="#1A1A1A"/><ellipse cx="80" cy="78" rx="32" ry="34" fill="#FDE8D8"/><ellipse cx="68" cy="78" rx="5" ry="6" fill="white"/><ellipse cx="92" cy="78" rx="5" ry="6" fill="white"/><circle cx="69" cy="79" r="3.5" fill="#3D2010"/><circle cx="93" cy="79" r="3.5" fill="#3D2010"/><circle cx="70" cy="77.5" r="1.3" fill="white"/><circle cx="94" cy="77.5" r="1.3" fill="white"/><circle cx="60" cy="88" r="6" fill="#FFB5A0" opacity="0.35"/><circle cx="100" cy="88" r="6" fill="#FFB5A0" opacity="0.35"/><path d="M72,92 Q80,100 88,92" fill="none" stroke="#D4777A" stroke-width="2" stroke-linecap="round"/><path d="M50,115 Q48,140 45,170 L115,170 Q112,140 110,115 Q95,108 80,108 Q65,108 50,115Z" fill="#AB47BC"/><rect x="72" y="107" width="16" height="10" rx="3" fill="#FDE8D8"/></svg>`;
  return `<svg viewBox="0 0 160 200" width="${size}" height="${h}" style="display:block"><ellipse cx="80" cy="60" rx="40" ry="38" fill="#A0784C"/><ellipse cx="80" cy="50" rx="37" ry="28" fill="#B8905E"/><ellipse cx="80" cy="78" rx="32" ry="34" fill="#F5D0A9"/><ellipse cx="68" cy="78" rx="5" ry="6" fill="white"/><ellipse cx="92" cy="78" rx="5" ry="6" fill="white"/><circle cx="69" cy="79" r="3.5" fill="#3D2B1A"/><circle cx="93" cy="79" r="3.5" fill="#3D2B1A"/><circle cx="70" cy="77.5" r="1.3" fill="white"/><circle cx="94" cy="77.5" r="1.3" fill="white"/><circle cx="60" cy="88" r="6" fill="#FFB5A0" opacity="0.35"/><circle cx="100" cy="88" r="6" fill="#FFB5A0" opacity="0.35"/><path d="M72,92 Q80,99 88,92" fill="none" stroke="#C4777A" stroke-width="2" stroke-linecap="round"/><path d="M50,115 Q48,140 45,170 L115,170 Q112,140 110,115 Q95,108 80,108 Q65,108 50,115Z" fill="#5B9FE8"/><rect x="72" y="107" width="16" height="10" rx="3" fill="#F5D0A9"/></svg>`;
}

function getRitaSVG(size) {
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" style="display:block"><ellipse cx="100" cy="135" rx="55" ry="45" fill="#FAFAFA" stroke="#E0D5C8" stroke-width="2"/><ellipse cx="75" cy="125" rx="18" ry="14" fill="#8B6914" opacity="0.6" transform="rotate(-15 75 125)"/><ellipse cx="120" cy="140" rx="15" ry="10" fill="#3D3D3D" opacity="0.5" transform="rotate(10 120 140)"/><circle cx="100" cy="80" r="38" fill="#FAFAFA" stroke="#E0D5C8" stroke-width="2"/><polygon points="70,55 60,20 85,48" fill="#FAFAFA" stroke="#E0D5C8" stroke-width="2"/><polygon points="130,55 140,20 115,48" fill="#FAFAFA" stroke="#E0D5C8" stroke-width="2"/><polygon points="72,52 65,28 83,48" fill="#FFB5B5" opacity="0.5"/><polygon points="128,52 135,28 117,48" fill="#FFB5B5" opacity="0.5"/><ellipse cx="82" cy="68" rx="14" ry="10" fill="#8B6914" opacity="0.5" transform="rotate(-10 82 68)"/><ellipse cx="122" cy="72" rx="10" ry="8" fill="#3D3D3D" opacity="0.4" transform="rotate(15 122 72)"/><ellipse cx="86" cy="78" rx="8" ry="9" fill="white" stroke="#555" stroke-width="1.5"/><ellipse cx="114" cy="78" rx="8" ry="9" fill="white" stroke="#555" stroke-width="1.5"/><ellipse cx="88" cy="79" rx="5" ry="6" fill="#2E8B57"/><ellipse cx="116" cy="79" rx="5" ry="6" fill="#2E8B57"/><circle cx="89" cy="77" r="2.5" fill="#1A5C38"/><circle cx="117" cy="77" r="2.5" fill="#1A5C38"/><circle cx="90" cy="76" r="1.2" fill="white"/><circle cx="118" cy="76" r="1.2" fill="white"/><ellipse cx="100" cy="88" rx="4" ry="3" fill="#FFB5B5"/><path d="M96,91 Q100,96 104,91" fill="none" stroke="#C4888A" stroke-width="1.5" stroke-linecap="round"/><line x1="60" y1="82" x2="82" y2="86" stroke="#CCC" stroke-width="1.2"/><line x1="58" y1="90" x2="80" y2="89" stroke="#CCC" stroke-width="1.2"/><line x1="118" y1="86" x2="140" y2="82" stroke="#CCC" stroke-width="1.2"/><line x1="120" y1="89" x2="142" y2="90" stroke="#CCC" stroke-width="1.2"/><path d="M150,140 Q170,120 165,95 Q162,85 155,90" fill="none" stroke="#E0D5C8" stroke-width="6" stroke-linecap="round"/><ellipse cx="75" cy="172" rx="12" ry="8" fill="#FAFAFA" stroke="#E0D5C8" stroke-width="1.5"/><ellipse cx="125" cy="172" rx="12" ry="8" fill="#FAFAFA" stroke="#E0D5C8" stroke-width="1.5"/></svg>`;
}

// ===== GENERADOR DE PREGUNTAS MATEMÁTICAS =====
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateMathQuestions(difficulty, count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    let q, correct, opts;
    if (difficulty === 'facil') {
      const type = randInt(0, 2);
      if (type === 0) { // suma simple
        const a = randInt(1, 9), b = randInt(1, 9);
        correct = a + b; q = `¿Cuánto es ${a} + ${b}?`;
      } else if (type === 1) { // resta simple
        const a = randInt(5, 15), b = randInt(1, a - 1);
        correct = a - b; q = `¿Cuánto es ${a} - ${b}?`;
      } else { // contar
        const n = randInt(2, 8);
        const emoji = ['🍎','🌟','🐱','🎈','🦋','🌸'][randInt(0,5)];
        q = `¿Cuántos hay? ${emoji.repeat(n)}`;
        correct = n;
      }
      opts = generateMathOptions(correct, 1, 18);
    } else if (difficulty === 'medio') {
      const type = randInt(0, 3);
      if (type === 0) { // suma
        const a = randInt(10, 50), b = randInt(5, 40);
        correct = a + b; q = `¿Cuánto es ${a} + ${b}?`;
      } else if (type === 1) { // resta
        const a = randInt(20, 80), b = randInt(5, a - 5);
        correct = a - b; q = `¿Cuánto es ${a} - ${b}?`;
      } else if (type === 2) { // multiplicación simple
        const a = randInt(2, 5), b = randInt(2, 6);
        correct = a * b; q = `¿Cuánto es ${a} × ${b}?`;
      } else { // doble operación
        const a = randInt(2, 10), b = randInt(2, 10), c = randInt(1, 5);
        correct = a + b + c; q = `¿Cuánto es ${a} + ${b} + ${c}?`;
      }
      opts = generateMathOptions(correct, 2, 99);
    } else { // dificil
      const type = randInt(0, 4);
      if (type === 0) { // multiplicación
        const a = randInt(3, 12), b = randInt(3, 12);
        correct = a * b; q = `¿Cuánto es ${a} × ${b}?`;
      } else if (type === 1) { // división exacta
        const b = randInt(2, 10), correct_val = randInt(2, 12);
        const a = b * correct_val;
        correct = correct_val; q = `¿Cuánto es ${a} ÷ ${b}?`;
      } else if (type === 2) { // potencia
        const base = randInt(2, 6);
        correct = base * base; q = `¿Cuánto es ${base}²? (${base} × ${base})`;
      } else if (type === 3) { // operación combinada
        const a = randInt(3, 10), b = randInt(2, 5), c = randInt(1, 10);
        correct = a * b + c; q = `¿Cuánto es ${a} × ${b} + ${c}?`;
      } else { // fracciones conceptuales
        const whole = randInt(2, 5) * 2;
        correct = whole / 2; q = `¿Cuánto es la mitad de ${whole}?`;
      }
      opts = generateMathOptions(correct, 3, 150);
    }
    questions.push({ q, options: opts.map(String), correct: opts.indexOf(correct), explanation: `La respuesta correcta es ${correct}.` });
  }
  return questions;
}

function generateMathOptions(correct, spread, max) {
  const opts = new Set([correct]);
  let attempts = 0;
  while (opts.size < 4 && attempts < 50) {
    let wrong = correct + randInt(-spread * 3, spread * 3);
    if (wrong <= 0) wrong = randInt(1, correct + spread * 2);
    if (wrong > max) wrong = randInt(Math.max(1, correct - spread * 3), correct - 1);
    if (wrong !== correct && wrong > 0) opts.add(wrong);
    attempts++;
  }
  while (opts.size < 4) opts.add(correct + opts.size);
  return shuffle([...opts]);
}

// ===== BANCO DE PREGUNTAS ESTÁTICAS =====
const staticQuestions = {
  facil: {
    patio: [
      { q: "¿De qué color es el cielo cuando hay sol?", options: ["Rojo", "Azul", "Verde", "Negro"], correct: 1, explanation: "El cielo se ve azul en un día soleado." },
      { q: "¿Cuántas patas tiene un perro?", options: ["2", "3", "4", "6"], correct: 2, explanation: "Los perros tienen 4 patas." },
      { q: "¿Qué animal dice 'miau'?", options: ["Perro", "Gato", "Pato", "Vaca"], correct: 1, explanation: "El gato dice 'miau'." },
      { q: "¿De qué color es el pasto?", options: ["Azul", "Rojo", "Verde", "Blanco"], correct: 2, explanation: "El pasto es verde." },
      { q: "¿Qué sale de noche en el cielo?", options: ["El sol", "Las estrellas", "La lluvia", "Las nubes"], correct: 1, explanation: "De noche podemos ver las estrellas." },
      { q: "¿Cómo se llama el sonido del perro?", options: ["Miau", "Muuu", "Guau", "Pío"], correct: 2, explanation: "El perro hace 'guau', que se llama ladrido." },
      { q: "¿De qué color es el sol?", options: ["Azul", "Verde", "Amarillo", "Rojo"], correct: 2, explanation: "Vemos el sol de color amarillo." },
      { q: "¿Qué animal vuela?", options: ["Pez", "Pájaro", "Gato", "Perro"], correct: 1, explanation: "Los pájaros tienen alas y pueden volar." },
      { q: "¿Cuántos ojos tenemos?", options: ["1", "2", "3", "4"], correct: 1, explanation: "Las personas tenemos 2 ojos." },
      { q: "¿Qué usamos para caminar?", options: ["Manos", "Orejas", "Pies", "Ojos"], correct: 2, explanation: "Usamos los pies para caminar." },
      { q: "¿Cuántas orejas tenemos?", options: ["1", "2", "3", "4"], correct: 1, explanation: "Tenemos 2 orejas, una de cada lado." },
      { q: "¿De qué color es una banana?", options: ["Roja", "Azul", "Amarilla", "Verde"], correct: 2, explanation: "La banana madura es amarilla." },
      { q: "¿Qué animal nada en el agua?", options: ["Perro", "Gato", "Pez", "Gallina"], correct: 2, explanation: "Los peces viven y nadan en el agua." },
      { q: "¿Qué usamos para oler?", options: ["Boca", "Nariz", "Ojos", "Pies"], correct: 1, explanation: "Usamos la nariz para oler." },
      { q: "¿De qué color es una frutilla?", options: ["Azul", "Roja", "Amarilla", "Verde"], correct: 1, explanation: "Las frutillas son rojas." },
    ],
    cocina: [
      { q: "¿Dónde guardamos la leche para que esté fría?", options: ["Horno", "Heladera", "Mesa", "Cajón"], correct: 1, explanation: "La leche se guarda en la heladera." },
      { q: "¿Con qué comemos la sopa?", options: ["Tenedor", "Cuchillo", "Cuchara", "Vaso"], correct: 2, explanation: "Comemos la sopa con cuchara." },
      { q: "¿De qué color es la leche?", options: ["Azul", "Roja", "Blanca", "Verde"], correct: 2, explanation: "La leche es blanca." },
      { q: "¿Qué tomamos en el desayuno?", options: ["Sopa", "Leche", "Ensalada", "Carne"], correct: 1, explanation: "En el desayuno solemos tomar leche o jugo." },
      { q: "¿Qué fruta es amarilla y larga?", options: ["Manzana", "Banana", "Naranja", "Uva"], correct: 1, explanation: "La banana es amarilla y alargada." },
      { q: "¿Dónde cocinamos la comida?", options: ["Cama", "Cocina", "Baño", "Jardín"], correct: 1, explanation: "Cocinamos en la cocina." },
      { q: "¿De qué fruta hacemos jugo naranja?", options: ["Manzana", "Limón", "Naranja", "Uva"], correct: 2, explanation: "El jugo de naranja se hace con naranjas." },
      { q: "¿Qué alimento es redondo y rojo?", options: ["Banana", "Tomate", "Leche", "Pan"], correct: 1, explanation: "El tomate es redondo y rojo." },
      { q: "¿De dónde sale el agua en la cocina?", options: ["Horno", "Heladera", "Canilla", "Techo"], correct: 2, explanation: "El agua sale de la canilla." },
      { q: "¿Qué ponen las gallinas?", options: ["Leche", "Miel", "Huevos", "Queso"], correct: 2, explanation: "Las gallinas ponen huevos." },
      { q: "¿Qué es dulce: limón o miel?", options: ["Limón", "Miel", "Los dos", "Ninguno"], correct: 1, explanation: "La miel es dulce y el limón es ácido." },
      { q: "¿Con qué cortamos el pan?", options: ["Cuchara", "Tenedor", "Cuchillo", "Plato"], correct: 2, explanation: "Usamos el cuchillo para cortar." },
      { q: "¿De qué animal viene la leche?", options: ["Gallina", "Vaca", "Perro", "Pez"], correct: 1, explanation: "La leche viene de la vaca." },
      { q: "¿Qué comida es redonda con queso?", options: ["Sopa", "Pizza", "Ensalada", "Pan"], correct: 1, explanation: "La pizza es redonda y tiene queso." },
      { q: "¿Qué verdura es naranja?", options: ["Lechuga", "Tomate", "Zanahoria", "Papa"], correct: 2, explanation: "La zanahoria es de color naranja." },
    ],
    living: [
      { q: "¿Dónde nos sentamos para ver tele?", options: ["Mesa", "Sillón", "Piso", "Cama"], correct: 1, explanation: "Nos sentamos en el sillón." },
      { q: "¿Qué aparato usamos para ver dibujitos?", options: ["Radio", "Televisor", "Reloj", "Espejo"], correct: 1, explanation: "Vemos dibujitos en el televisor." },
      { q: "¿Qué forma tiene una pelota?", options: ["Cuadrada", "Redonda", "Triangular", "Plana"], correct: 1, explanation: "La pelota es redonda." },
      { q: "¿Cuántas letras tiene 'SOL'?", options: ["2", "3", "4", "5"], correct: 1, explanation: "S-O-L tiene 3 letras." },
      { q: "¿Con qué cubrimos el piso?", options: ["Sábana", "Alfombra", "Toalla", "Papel"], correct: 1, explanation: "Cubrimos el piso con una alfombra." },
      { q: "¿Qué nos da luz de noche?", options: ["Ventana", "Lámpara", "Alfombra", "Puerta"], correct: 1, explanation: "La lámpara nos da luz." },
      { q: "¿Dónde guardamos los juguetes?", options: ["Heladera", "Caja", "Horno", "Canilla"], correct: 1, explanation: "Guardamos los juguetes en una caja o estante." },
      { q: "¿Qué objeto nos muestra la hora?", options: ["Espejo", "Reloj", "Cuadro", "Florero"], correct: 1, explanation: "El reloj nos dice qué hora es." },
      { q: "¿Cuántas letras tiene 'GATO'?", options: ["3", "4", "5", "6"], correct: 1, explanation: "G-A-T-O tiene 4 letras." },
      { q: "¿Dónde vemos nuestra cara?", options: ["Ventana", "Televisor", "Espejo", "Cuadro"], correct: 2, explanation: "En el espejo vemos nuestra cara." },
      { q: "¿De qué color es la nieve?", options: ["Azul", "Blanca", "Gris", "Verde"], correct: 1, explanation: "La nieve es blanca." },
      { q: "¿Qué usamos para dibujar?", options: ["Cuchara", "Lápiz", "Vaso", "Zapato"], correct: 1, explanation: "Dibujamos con lápiz o crayones." },
      { q: "¿Cuántos dedos tiene una mano?", options: ["3", "4", "5", "6"], correct: 2, explanation: "Cada mano tiene 5 dedos." },
      { q: "¿Qué leemos antes de dormir?", options: ["Comida", "Un cuento", "Televisor", "Zapatos"], correct: 1, explanation: "Antes de dormir podemos leer un cuento." },
      { q: "¿Qué instrumento tiene teclas?", options: ["Guitarra", "Piano", "Flauta", "Tambor"], correct: 1, explanation: "El piano tiene teclas blancas y negras." },
    ],
    jardin: [
      { q: "¿De qué color son las hojas de los árboles?", options: ["Rojas", "Azules", "Verdes", "Blancas"], correct: 2, explanation: "Las hojas suelen ser verdes." },
      { q: "¿Qué necesitan las plantas para vivir?", options: ["Televisión", "Agua y sol", "Pintura", "Juguetes"], correct: 1, explanation: "Las plantas necesitan agua y sol." },
      { q: "¿Qué animal tiene alas de colores?", options: ["Hormiga", "Mariposa", "Perro", "Pez"], correct: 1, explanation: "Las mariposas tienen alas de colores." },
      { q: "¿De dónde viene la lluvia?", options: ["Del piso", "De las nubes", "Del sol", "Del río"], correct: 1, explanation: "La lluvia cae de las nubes." },
      { q: "¿Qué animal hace 'bzzzz'?", options: ["Perro", "Abeja", "Gato", "Rana"], correct: 1, explanation: "Las abejas hacen 'bzzzz' al volar." },
      { q: "¿De qué color son las rosas más comunes?", options: ["Azules", "Verdes", "Rojas", "Negras"], correct: 2, explanation: "Las rosas más conocidas son rojas." },
      { q: "¿Dónde vive un pajarito?", options: ["Cueva", "Nido", "Casa", "Río"], correct: 1, explanation: "Los pájaros viven en nidos." },
      { q: "¿Qué animal salta y dice 'croac'?", options: ["Perro", "Gato", "Rana", "Pájaro"], correct: 2, explanation: "La rana salta y dice 'croac'." },
      { q: "¿Cuántas patas tiene una hormiga?", options: ["4", "6", "8", "2"], correct: 1, explanation: "Las hormigas tienen 6 patas." },
      { q: "¿Qué sale después de la lluvia con sol?", options: ["Nieve", "Arcoíris", "Estrellas", "Luna"], correct: 1, explanation: "El arcoíris aparece después de la lluvia." },
      { q: "¿Qué crece de una semilla?", options: ["Una piedra", "Una planta", "Un juguete", "Un libro"], correct: 1, explanation: "De las semillas crecen plantas." },
      { q: "¿En qué estación hace mucho frío?", options: ["Verano", "Primavera", "Invierno", "Otoño"], correct: 2, explanation: "En invierno hace mucho frío." },
      { q: "¿Qué insecto hace miel?", options: ["Mosca", "Abeja", "Hormiga", "Araña"], correct: 1, explanation: "Las abejas producen miel." },
      { q: "¿De qué color es una naranja?", options: ["Verde", "Azul", "Naranja", "Roja"], correct: 2, explanation: "La naranja es de color naranja." },
      { q: "¿Las plantas respiran?", options: ["Sí", "No", "Solo de día", "Solo de noche"], correct: 0, explanation: "Sí, las plantas respiran como los seres vivos." },
    ],
    escondite: [
      { q: "¿Cuántos días tiene una semana?", options: ["5", "6", "7", "8"], correct: 2, explanation: "La semana tiene 7 días." },
      { q: "¿Qué usamos para escuchar?", options: ["Ojos", "Orejas", "Nariz", "Boca"], correct: 1, explanation: "Escuchamos con las orejas." },
      { q: "¿Cuántas estaciones del año hay?", options: ["2", "3", "4", "5"], correct: 2, explanation: "Hay 4 estaciones: primavera, verano, otoño e invierno." },
      { q: "¿Cómo se dice 'perro' en inglés?", options: ["Cat", "Dog", "Bird", "Fish"], correct: 1, explanation: "'Perro' en inglés es 'dog'." },
      { q: "¿Qué figura tiene 3 lados?", options: ["Círculo", "Cuadrado", "Triángulo", "Rectángulo"], correct: 2, explanation: "El triángulo tiene 3 lados." },
      { q: "¿Cuántos colores tiene el arcoíris?", options: ["3", "5", "7", "10"], correct: 2, explanation: "El arcoíris tiene 7 colores." },
      { q: "¿Qué animal es el más grande del mar?", options: ["Tiburón", "Delfín", "Ballena", "Pulpo"], correct: 2, explanation: "La ballena es el animal más grande del mar." },
      { q: "¿Cómo se dice 'gato' en inglés?", options: ["Dog", "Cat", "Cow", "Rat"], correct: 1, explanation: "'Gato' en inglés es 'cat'." },
      { q: "¿Qué día viene después del lunes?", options: ["Miércoles", "Domingo", "Martes", "Jueves"], correct: 2, explanation: "Después del lunes viene el martes." },
      { q: "¿De qué color es el chocolate?", options: ["Blanco", "Marrón", "Rojo", "Verde"], correct: 1, explanation: "El chocolate es marrón." },
      { q: "¿Cuántas vocales hay?", options: ["3", "4", "5", "6"], correct: 2, explanation: "Las vocales son A, E, I, O, U: 5." },
      { q: "¿Qué sentido usamos para ver?", options: ["Oído", "Tacto", "Vista", "Gusto"], correct: 2, explanation: "Usamos la vista para ver." },
      { q: "¿Cuál es la primera letra del abecedario?", options: ["B", "Z", "A", "M"], correct: 2, explanation: "La primera letra es la A." },
      { q: "¿Cuántas patas tiene un gato?", options: ["2", "4", "6", "8"], correct: 1, explanation: "Los gatos tienen 4 patas." },
      { q: "¿Qué planeta es nuestro hogar?", options: ["Marte", "Luna", "Tierra", "Sol"], correct: 2, explanation: "Vivimos en el planeta Tierra." },
    ]
  },
  medio: {
    patio: [
      { q: "¿Qué planeta es el tercero desde el Sol?", options: ["Marte", "Venus", "Tierra", "Júpiter"], correct: 2, explanation: "La Tierra es el tercer planeta del sistema solar." },
      { q: "¿En qué estación caen las hojas?", options: ["Primavera", "Verano", "Otoño", "Invierno"], correct: 2, explanation: "En otoño, muchos árboles pierden sus hojas." },
      { q: "¿Cuál es el animal más grande del mundo?", options: ["Elefante", "Jirafa", "Ballena azul", "Tiburón"], correct: 2, explanation: "La ballena azul es el animal más grande." },
      { q: "¿De dónde viene la leche que tomamos?", options: ["Del río", "De la vaca", "Del árbol", "De la lluvia"], correct: 1, explanation: "La leche generalmente proviene de las vacas." },
      { q: "¿Qué necesitan las plantas para crecer?", options: ["Agua y sol", "Chocolate", "Arena", "Pintura"], correct: 0, explanation: "Las plantas necesitan agua, sol y nutrientes." },
      { q: "¿Cuántos lados tiene un triángulo?", options: ["2", "3", "4", "5"], correct: 1, explanation: "Un triángulo tiene 3 lados." },
      { q: "¿Qué insecto produce miel?", options: ["Mosca", "Mariposa", "Abeja", "Hormiga"], correct: 2, explanation: "Las abejas producen miel del néctar." },
      { q: "¿En qué continente está Argentina?", options: ["Europa", "Asia", "América del Sur", "África"], correct: 2, explanation: "Argentina está en América del Sur." },
      { q: "¿Cuántas vocales tiene el abecedario?", options: ["3", "4", "5", "6"], correct: 2, explanation: "Las vocales son A, E, I, O, U: 5." },
      { q: "¿Qué parte del cuerpo usamos para oler?", options: ["Ojos", "Boca", "Nariz", "Orejas"], correct: 2, explanation: "Usamos la nariz para oler." },
      { q: "¿Cuántos colores tiene el arcoíris?", options: ["5", "6", "7", "8"], correct: 2, explanation: "El arcoíris tiene 7 colores." },
      { q: "¿Cómo se llama la cría del gato?", options: ["Cachorro", "Gatito", "Pollito", "Ternero"], correct: 1, explanation: "A la cría del gato se la llama gatito." },
      { q: "¿Cuántos días tiene una semana?", options: ["5", "6", "7", "8"], correct: 2, explanation: "La semana tiene 7 días." },
      { q: "¿Cómo se llama el sonido del perro?", options: ["Mugido", "Ladrido", "Maullido", "Relincho"], correct: 1, explanation: "El sonido del perro se llama ladrido." },
      { q: "¿De qué color es el cielo en un día soleado?", options: ["Rojo", "Verde", "Azul", "Amarillo"], correct: 2, explanation: "El cielo se ve azul por cómo la luz se dispersa." },
    ],
    cocina: [
      { q: "¿Qué electrodoméstico calienta comida rápido?", options: ["Heladera", "Microondas", "Lavarropas", "Ventilador"], correct: 1, explanation: "El microondas calienta la comida rápidamente." },
      { q: "¿De qué color es la banana por dentro?", options: ["Roja", "Verde", "Blanca/amarilla", "Azul"], correct: 2, explanation: "La banana es blanca o amarilla clara por dentro." },
      { q: "¿Qué se usa para hervir agua?", options: ["Pava o cacerola", "Cuchillo", "Plato", "Servilleta"], correct: 0, explanation: "Usamos la pava o cacerola para hervir agua." },
      { q: "¿Cuántas comidas principales hacemos por día?", options: ["1", "2", "3 o 4", "10"], correct: 2, explanation: "Hacemos desayuno, almuerzo, merienda y cena." },
      { q: "¿De qué animal viene la carne vacuna?", options: ["Pollo", "Cerdo", "Vaca", "Pescado"], correct: 2, explanation: "La carne vacuna proviene de la vaca." },
      { q: "¿Qué fruta es roja con semillitas afuera?", options: ["Naranja", "Frutilla", "Banana", "Manzana"], correct: 1, explanation: "La frutilla tiene semillitas en su superficie." },
      { q: "¿Qué líquido usamos para freír?", options: ["Agua", "Leche", "Aceite", "Jugo"], correct: 2, explanation: "Se usa aceite para freír los alimentos." },
      { q: "¿Cómo se llama la comida del mediodía?", options: ["Desayuno", "Almuerzo", "Merienda", "Cena"], correct: 1, explanation: "La comida del mediodía se llama almuerzo." },
      { q: "¿Para qué sirve el colador?", options: ["Para cortar", "Para colar líquidos", "Para calentar", "Para enfriar"], correct: 1, explanation: "El colador separa los sólidos del líquido." },
      { q: "¿Cuál es comida típica argentina con masa y carne?", options: ["Sushi", "Empanada", "Hamburguesa", "Taco"], correct: 1, explanation: "La empanada es un plato típico argentino." },
      { q: "¿Qué verdura es naranja y crece bajo tierra?", options: ["Tomate", "Lechuga", "Zanahoria", "Pepino"], correct: 2, explanation: "La zanahoria crece debajo de la tierra." },
      { q: "¿Dónde se guardan los alimentos fríos?", options: ["Horno", "Armario", "Heladera", "Cajón"], correct: 2, explanation: "La heladera mantiene los alimentos fríos." },
      { q: "¿Con qué se corta el pan?", options: ["Tenedor", "Cuchara", "Cuchillo", "Vaso"], correct: 2, explanation: "El cuchillo se usa para cortar el pan." },
      { q: "¿Qué comida es redonda con queso arriba?", options: ["Ensalada", "Pizza", "Sopa", "Sándwich"], correct: 1, explanation: "La pizza es redonda con queso derretido." },
      { q: "¿Con qué se revuelve la sopa?", options: ["Tenedor", "Cuchillo", "Cuchara", "Plato"], correct: 2, explanation: "La cuchara sirve para revolver la sopa." },
    ],
    living: [
      { q: "¿Qué aparato usamos para ver películas?", options: ["Radio", "Televisor", "Teléfono fijo", "Reloj"], correct: 1, explanation: "El televisor nos permite ver películas." },
      { q: "¿Qué usamos para iluminar una habitación?", options: ["Almohada", "Lámpara", "Alfombra", "Cortina"], correct: 1, explanation: "La lámpara produce luz." },
      { q: "¿Dónde guardamos los libros?", options: ["Heladera", "Biblioteca", "Horno", "Bañera"], correct: 1, explanation: "Los libros van en bibliotecas o estantes." },
      { q: "¿Qué sentido usamos para escuchar música?", options: ["Vista", "Oído", "Tacto", "Gusto"], correct: 1, explanation: "Usamos el oído para escuchar." },
      { q: "¿De qué material son las ventanas?", options: ["Madera", "Tela", "Vidrio", "Papel"], correct: 2, explanation: "Las ventanas tienen vidrio para dejar pasar la luz." },
      { q: "¿Qué usamos para cambiar de canal?", options: ["Cuchara", "Control remoto", "Llave", "Lápiz"], correct: 1, explanation: "El control remoto cambia de canal." },
      { q: "¿Cuántos sentidos tenemos?", options: ["3", "4", "5", "6"], correct: 2, explanation: "Tenemos 5 sentidos: vista, oído, olfato, gusto y tacto." },
      { q: "¿Qué objeto nos permite vernos?", options: ["Ventana", "Televisor", "Espejo", "Cuadro"], correct: 2, explanation: "El espejo refleja nuestra imagen." },
      { q: "¿Qué color se forma mezclando azul y amarillo?", options: ["Rojo", "Naranja", "Verde", "Violeta"], correct: 2, explanation: "Azul + amarillo = verde." },
      { q: "¿Qué instrumento tiene teclas blancas y negras?", options: ["Guitarra", "Piano", "Flauta", "Tambor"], correct: 1, explanation: "El piano tiene teclas blancas y negras." },
      { q: "¿Cuál es la primera letra del abecedario?", options: ["B", "Z", "A", "M"], correct: 2, explanation: "La letra A es la primera." },
      { q: "¿Qué mueble tiene respaldo para la espalda?", options: ["Banco", "Silla", "Piso", "Escalón"], correct: 1, explanation: "La silla tiene respaldo." },
      { q: "¿Cómo se llama el mueble donde comemos?", options: ["Silla", "Cama", "Mesa", "Armario"], correct: 2, explanation: "Comemos en la mesa." },
      { q: "¿Qué hacemos cuando leemos un libro?", options: ["Escuchamos", "Miramos letras", "Olemos", "Tocamos"], correct: 1, explanation: "Al leer miramos las letras y palabras." },
      { q: "¿Qué forma tiene una pelota?", options: ["Cuadrada", "Triangular", "Redonda", "Rectangular"], correct: 2, explanation: "La pelota tiene forma redonda (esférica)." },
    ],
    jardin: [
      { q: "¿Cómo se llama la parte de la planta bajo tierra?", options: ["Hoja", "Flor", "Raíz", "Tallo"], correct: 2, explanation: "La raíz está bajo tierra y absorbe nutrientes." },
      { q: "¿En qué estación florecen muchas plantas?", options: ["Invierno", "Otoño", "Primavera", "Ninguna"], correct: 2, explanation: "En primavera muchas plantas florecen." },
      { q: "¿Qué herramienta corta el pasto?", options: ["Pala", "Cortadora", "Martillo", "Escoba"], correct: 1, explanation: "La cortadora de pasto corta el césped." },
      { q: "¿Qué animal tiene caparazón y camina lento?", options: ["Conejo", "Tortuga", "Ratón", "Pájaro"], correct: 1, explanation: "La tortuga tiene caparazón." },
      { q: "¿Cómo se llama el proceso en que las plantas hacen alimento?", options: ["Digestión", "Respiración", "Fotosíntesis", "Evaporación"], correct: 2, explanation: "La fotosíntesis permite a las plantas producir alimento." },
      { q: "¿Qué ave canta al amanecer?", options: ["Búho", "Pingüino", "Gallo", "Pato"], correct: 2, explanation: "El gallo canta al amanecer." },
      { q: "¿Qué se forma en el cielo después de la lluvia?", options: ["Nieve", "Arcoíris", "Granizo", "Estrellas"], correct: 1, explanation: "El arcoíris aparece con lluvia y sol." },
      { q: "¿Cómo se llama la casa de los pájaros?", options: ["Madriguera", "Cueva", "Nido", "Colmena"], correct: 2, explanation: "Los pájaros construyen nidos." },
      { q: "¿Cuántas patas tiene una araña?", options: ["4", "6", "8", "10"], correct: 2, explanation: "Las arañas tienen 8 patas." },
      { q: "¿Cuántas estaciones del año hay?", options: ["2", "3", "4", "5"], correct: 2, explanation: "Hay 4 estaciones." },
      { q: "¿Qué parte de la planta atrae insectos?", options: ["Raíz", "Tallo", "Hoja", "Flor"], correct: 3, explanation: "La flor atrae insectos para la polinización." },
      { q: "¿Qué hacemos con una regadera?", options: ["Barrer", "Regar plantas", "Pintar", "Cocinar"], correct: 1, explanation: "La regadera echa agua a las plantas." },
      { q: "¿De qué color es el sol?", options: ["Azul", "Verde", "Amarillo", "Rojo"], correct: 2, explanation: "Vemos el sol de color amarillo." },
      { q: "¿Qué animal pequeño construye hormigueros?", options: ["Abeja", "Hormiga", "Mariposa", "Araña"], correct: 1, explanation: "Las hormigas construyen hormigueros." },
      { q: "¿Qué insecto vuela entre las flores?", options: ["Hormiga", "Cucaracha", "Mariposa", "Escarabajo"], correct: 2, explanation: "Las mariposas vuelan entre las flores." },
    ],
    escondite: [
      { q: "¿Cómo se dice 'gato' en inglés?", options: ["Dog", "Cat", "Bird", "Fish"], correct: 1, explanation: "'Gato' en inglés es 'cat'." },
      { q: "¿Cuál es el océano más grande?", options: ["Atlántico", "Índico", "Pacífico", "Ártico"], correct: 2, explanation: "El océano Pacífico es el más extenso." },
      { q: "¿Qué gas necesitamos para respirar?", options: ["Hidrógeno", "Nitrógeno", "Oxígeno", "Helio"], correct: 2, explanation: "Necesitamos oxígeno para vivir." },
      { q: "¿Qué animal es el mejor amigo del hombre?", options: ["Gato", "Perro", "Caballo", "Pez"], correct: 1, explanation: "El perro es el mejor amigo del hombre." },
      { q: "¿Cómo se llama el satélite de la Tierra?", options: ["Sol", "Luna", "Marte", "Estrella"], correct: 1, explanation: "La Luna es el satélite natural de la Tierra." },
      { q: "¿Qué invento nos permite hablar a distancia?", options: ["Bicicleta", "Teléfono", "Reloj", "Paraguas"], correct: 1, explanation: "El teléfono permite comunicarnos a distancia." },
      { q: "¿De qué se hacen los lápices?", options: ["Metal", "Plástico", "Madera y grafito", "Vidrio"], correct: 2, explanation: "Los lápices son de madera con grafito." },
      { q: "¿Qué animal cambia de color?", options: ["Perro", "Camaleón", "Gato", "Loro"], correct: 1, explanation: "El camaleón cambia de color." },
      { q: "¿De qué color es la bandera argentina?", options: ["Roja y blanca", "Celeste y blanca", "Verde y amarilla", "Azul y roja"], correct: 1, explanation: "La bandera argentina es celeste y blanca." },
      { q: "¿Cuántos minutos tiene una hora?", options: ["30", "45", "60", "100"], correct: 2, explanation: "Una hora tiene 60 minutos." },
      { q: "¿Qué animal produce seda?", options: ["Araña", "Gusano de seda", "Abeja", "Hormiga"], correct: 1, explanation: "El gusano de seda produce seda." },
      { q: "¿Cómo se llama la estrella más cercana?", options: ["Luna", "Marte", "Sol", "Plutón"], correct: 2, explanation: "El Sol es la estrella más cercana." },
      { q: "¿Cuántos huesos tiene un adulto?", options: ["106", "156", "206", "306"], correct: 2, explanation: "Un adulto tiene aproximadamente 206 huesos." },
      { q: "¿Cuál es el animal terrestre más rápido?", options: ["León", "Guepardo", "Caballo", "Canguro"], correct: 1, explanation: "El guepardo corre a más de 100 km/h." },
      { q: "¿Qué instrumento mide la temperatura?", options: ["Regla", "Balanza", "Termómetro", "Brújula"], correct: 2, explanation: "El termómetro mide la temperatura." },
    ]
  },
  dificil: {
    patio: [
      { q: "¿Cuál es el planeta más grande del sistema solar?", options: ["Saturno", "Neptuno", "Júpiter", "Urano"], correct: 2, explanation: "Júpiter es el planeta más grande del sistema solar." },
      { q: "¿Qué gas liberan las plantas durante la fotosíntesis?", options: ["Nitrógeno", "Dióxido de carbono", "Oxígeno", "Helio"], correct: 2, explanation: "Las plantas liberan oxígeno durante la fotosíntesis." },
      { q: "¿Cuántos continentes hay en el mundo?", options: ["4", "5", "6", "7"], correct: 3, explanation: "Hay 7 continentes: América, Europa, Asia, África, Oceanía, y Antártida (algunos modelos dividen América en 2)." },
      { q: "¿Cómo se llama la capa de aire que rodea la Tierra?", options: ["Litósfera", "Atmósfera", "Hidrósfera", "Biósfera"], correct: 1, explanation: "La atmósfera es la capa de gases que rodea la Tierra." },
      { q: "¿Qué animal es un mamífero que vuela?", options: ["Águila", "Murciélago", "Mariposa", "Colibrí"], correct: 1, explanation: "El murciélago es el único mamífero que vuela." },
      { q: "¿Cuántos lados tiene un hexágono?", options: ["4", "5", "6", "8"], correct: 2, explanation: "Un hexágono tiene 6 lados." },
      { q: "¿En qué país está la Torre Eiffel?", options: ["Italia", "España", "Francia", "Inglaterra"], correct: 2, explanation: "La Torre Eiffel está en París, Francia." },
      { q: "¿Qué invento creó Thomas Edison?", options: ["Teléfono", "Lamparita eléctrica", "Auto", "Avión"], correct: 1, explanation: "Edison perfeccionó la lamparita eléctrica." },
      { q: "¿Cómo se llama el sistema de huesos del cuerpo?", options: ["Muscular", "Nervioso", "Esquelético", "Digestivo"], correct: 2, explanation: "El sistema esquelético está formado por los huesos." },
      { q: "¿Qué tipo de animal es la ballena?", options: ["Pez", "Reptil", "Mamífero", "Anfibio"], correct: 2, explanation: "La ballena es un mamífero marino." },
      { q: "¿Cuántos planetas tiene el sistema solar?", options: ["6", "7", "8", "9"], correct: 2, explanation: "El sistema solar tiene 8 planetas." },
      { q: "¿Qué órgano bombea la sangre?", options: ["Pulmón", "Hígado", "Corazón", "Cerebro"], correct: 2, explanation: "El corazón bombea la sangre por todo el cuerpo." },
      { q: "¿Cómo se dice 'mariposa' en inglés?", options: ["Ladybug", "Butterfly", "Dragonfly", "Beetle"], correct: 1, explanation: "'Mariposa' en inglés es 'butterfly'." },
      { q: "¿En qué continente está Egipto?", options: ["Asia", "Europa", "África", "América"], correct: 2, explanation: "Egipto está en el continente africano." },
      { q: "¿Qué porcentaje de la Tierra es agua?", options: ["30%", "50%", "70%", "90%"], correct: 2, explanation: "Aproximadamente el 70% de la Tierra está cubierta de agua." },
    ],
    cocina: [
      { q: "¿Qué vitamina nos da el jugo de naranja?", options: ["Vitamina A", "Vitamina B", "Vitamina C", "Vitamina D"], correct: 2, explanation: "La naranja es rica en vitamina C." },
      { q: "¿A cuántos grados hierve el agua?", options: ["50°C", "80°C", "100°C", "150°C"], correct: 2, explanation: "El agua hierve a 100°C al nivel del mar." },
      { q: "¿Qué mineral fortalece los huesos y está en la leche?", options: ["Hierro", "Calcio", "Potasio", "Sodio"], correct: 1, explanation: "El calcio fortalece los huesos y dientes." },
      { q: "¿De qué cereal se hace el pan?", options: ["Arroz", "Maíz", "Trigo", "Avena"], correct: 2, explanation: "El pan se hace con harina de trigo." },
      { q: "¿Qué grupo de alimentos nos da energía rápida?", options: ["Carnes", "Verduras", "Carbohidratos", "Agua"], correct: 2, explanation: "Los carbohidratos (pan, pasta, arroz) nos dan energía." },
      { q: "¿Cuántos litros de agua se recomienda tomar por día?", options: ["1 litro", "2 litros", "5 litros", "10 litros"], correct: 1, explanation: "Se recomienda tomar unos 2 litros de agua por día." },
      { q: "¿De qué país es original la pizza?", options: ["Francia", "España", "Italia", "Grecia"], correct: 2, explanation: "La pizza es originaria de Italia." },
      { q: "¿Qué nutriente nos dan las carnes?", options: ["Vitamina C", "Proteínas", "Fibra", "Azúcar"], correct: 1, explanation: "Las carnes son ricas en proteínas." },
      { q: "¿Cuántos gramos tiene un kilogramo?", options: ["10", "100", "1000", "10000"], correct: 2, explanation: "Un kilogramo tiene 1000 gramos." },
      { q: "¿Qué fruto seco es el ingrediente principal del mazapán?", options: ["Nuez", "Almendra", "Maní", "Avellana"], correct: 1, explanation: "El mazapán se hace con almendras." },
      { q: "¿Qué tipo de alimento es el yogur?", options: ["Cereal", "Lácteo", "Carne", "Verdura"], correct: 1, explanation: "El yogur es un producto lácteo." },
      { q: "¿Cómo se dice 'agua' en inglés?", options: ["Milk", "Juice", "Water", "Soda"], correct: 2, explanation: "'Agua' en inglés es 'water'." },
      { q: "¿De qué están hechos los fideos?", options: ["Arroz", "Harina y agua", "Maíz", "Leche"], correct: 1, explanation: "Los fideos se hacen con harina y agua." },
      { q: "¿Qué órgano procesa los alimentos que comemos?", options: ["Corazón", "Pulmón", "Estómago", "Cerebro"], correct: 2, explanation: "El estómago procesa los alimentos." },
      { q: "¿Cuántas cucharaditas de té entran en una cucharada?", options: ["2", "3", "4", "5"], correct: 1, explanation: "Una cucharada equivale a 3 cucharaditas." },
    ],
    living: [
      { q: "¿Quién pintó la Mona Lisa?", options: ["Picasso", "Da Vinci", "Van Gogh", "Miguel Ángel"], correct: 1, explanation: "Leonardo Da Vinci pintó la Mona Lisa." },
      { q: "¿Cuántas notas musicales hay?", options: ["5", "6", "7", "8"], correct: 2, explanation: "Hay 7 notas: Do, Re, Mi, Fa, Sol, La, Si." },
      { q: "¿Qué tipo de energía usa una lámpara?", options: ["Solar", "Eléctrica", "Eólica", "Nuclear"], correct: 1, explanation: "Las lámparas usan energía eléctrica." },
      { q: "¿Cuántos grados tiene un ángulo recto?", options: ["45°", "90°", "180°", "360°"], correct: 1, explanation: "Un ángulo recto mide 90 grados." },
      { q: "¿Cómo se dice 'libro' en inglés?", options: ["Notebook", "Book", "Paper", "Page"], correct: 1, explanation: "'Libro' en inglés es 'book'." },
      { q: "¿Quién escribió 'El Principito'?", options: ["Borges", "Saint-Exupéry", "García Márquez", "Cervantes"], correct: 1, explanation: "Antoine de Saint-Exupéry escribió El Principito." },
      { q: "¿Qué significa la palabra 'biodiversidad'?", options: ["Muchas plantas", "Variedad de seres vivos", "Mucha agua", "Muchos países"], correct: 1, explanation: "Biodiversidad es la variedad de seres vivos en un lugar." },
      { q: "¿Cuántos milímetros tiene un centímetro?", options: ["5", "10", "100", "1000"], correct: 1, explanation: "Un centímetro tiene 10 milímetros." },
      { q: "¿Qué instrumento mide el peso?", options: ["Termómetro", "Reloj", "Balanza", "Regla"], correct: 2, explanation: "La balanza mide el peso de los objetos." },
      { q: "¿En qué año llegó el hombre a la Luna?", options: ["1959", "1965", "1969", "1975"], correct: 2, explanation: "El hombre llegó a la Luna en 1969." },
      { q: "¿Qué inventor creó el teléfono?", options: ["Edison", "Bell", "Tesla", "Newton"], correct: 1, explanation: "Alexander Graham Bell inventó el teléfono." },
      { q: "¿Cuántos centímetros tiene un metro?", options: ["10", "50", "100", "1000"], correct: 2, explanation: "Un metro tiene 100 centímetros." },
      { q: "¿Qué significa 'herbívoro'?", options: ["Come carne", "Come plantas", "Come de todo", "No come"], correct: 1, explanation: "Herbívoro significa que come plantas." },
      { q: "¿Cuántas caras tiene un cubo?", options: ["4", "5", "6", "8"], correct: 2, explanation: "Un cubo tiene 6 caras." },
      { q: "¿Qué tipo de triángulo tiene todos los lados iguales?", options: ["Isósceles", "Escaleno", "Equilátero", "Rectángulo"], correct: 2, explanation: "El triángulo equilátero tiene los 3 lados iguales." },
    ],
    jardin: [
      { q: "¿Qué gas absorben las plantas del aire?", options: ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Helio"], correct: 2, explanation: "Las plantas absorben CO2 para la fotosíntesis." },
      { q: "¿Cómo se llama el estudio de los insectos?", options: ["Botánica", "Zoología", "Entomología", "Geología"], correct: 2, explanation: "La entomología estudia los insectos." },
      { q: "¿Qué tipo de animal es una rana?", options: ["Reptil", "Mamífero", "Anfibio", "Pez"], correct: 2, explanation: "La rana es un anfibio: vive en agua y tierra." },
      { q: "¿Cómo se reproduce la mayoría de las plantas?", options: ["Huevos", "Semillas", "Leche", "Agua"], correct: 1, explanation: "La mayoría de las plantas se reproduce por semillas." },
      { q: "¿Qué planeta es conocido como 'el planeta rojo'?", options: ["Venus", "Marte", "Júpiter", "Saturno"], correct: 1, explanation: "Marte es conocido como el planeta rojo." },
      { q: "¿Cuántos años tiene un siglo?", options: ["10", "50", "100", "1000"], correct: 2, explanation: "Un siglo son 100 años." },
      { q: "¿Qué animal es el símbolo nacional de Argentina?", options: ["Cóndor", "Águila", "Hornero", "Tucán"], correct: 2, explanation: "El hornero es el ave nacional de Argentina." },
      { q: "¿Cómo se dice 'flor' en inglés?", options: ["Tree", "Leaf", "Flower", "Garden"], correct: 2, explanation: "'Flor' en inglés es 'flower'." },
      { q: "¿Qué capa de la Tierra está formada por agua?", options: ["Atmósfera", "Litósfera", "Hidrósfera", "Biósfera"], correct: 2, explanation: "La hidrósfera es la capa de agua de la Tierra." },
      { q: "¿Qué insecto pasa por la etapa de crisálida?", options: ["Hormiga", "Abeja", "Mariposa", "Escarabajo"], correct: 2, explanation: "La mariposa pasa por oruga → crisálida → mariposa." },
      { q: "¿Cuántos huesos tiene el cuerpo humano al nacer?", options: ["206", "270", "300", "350"], correct: 2, explanation: "Un bebé nace con unos 300 huesos que se fusionan." },
      { q: "¿Qué es la clorofila?", options: ["Un animal", "Un mineral", "Lo que da color verde a las plantas", "Un tipo de agua"], correct: 2, explanation: "La clorofila es el pigmento verde de las plantas." },
      { q: "¿Cuántas patas tiene un ciempiés realmente?", options: ["100", "Entre 30 y 354", "Exactamente 50", "200"], correct: 1, explanation: "Los ciempiés tienen entre 30 y 354 patas, nunca 100." },
      { q: "¿Qué tipo de animal es una serpiente?", options: ["Anfibio", "Mamífero", "Reptil", "Insecto"], correct: 2, explanation: "Las serpientes son reptiles." },
      { q: "¿Qué fenómeno causa las estaciones del año?", options: ["La Luna", "La inclinación de la Tierra", "Las nubes", "El viento"], correct: 1, explanation: "La inclinación del eje terrestre causa las estaciones." },
    ],
    escondite: [
      { q: "¿Cuál es el río más largo del mundo?", options: ["Amazonas", "Nilo", "Misisipi", "Paraná"], correct: 0, explanation: "El río Amazonas es el más largo del mundo." },
      { q: "¿Qué científico formuló la teoría de la relatividad?", options: ["Newton", "Einstein", "Galileo", "Darwin"], correct: 1, explanation: "Albert Einstein formuló la teoría de la relatividad." },
      { q: "¿En qué país están las pirámides de Giza?", options: ["México", "China", "Egipto", "India"], correct: 2, explanation: "Las pirámides de Giza están en Egipto." },
      { q: "¿Cuántos jugadores tiene un equipo de fútbol en la cancha?", options: ["9", "10", "11", "12"], correct: 2, explanation: "Cada equipo tiene 11 jugadores en la cancha." },
      { q: "¿Qué elemento químico tiene el símbolo 'O'?", options: ["Oro", "Osmio", "Oxígeno", "Olmo"], correct: 2, explanation: "El símbolo 'O' representa al oxígeno." },
      { q: "¿Cuántos segundos tiene un minuto?", options: ["30", "60", "90", "100"], correct: 1, explanation: "Un minuto tiene 60 segundos." },
      { q: "¿Qué animal es el más alto del mundo?", options: ["Elefante", "Jirafa", "Oso", "Camello"], correct: 1, explanation: "La jirafa es el animal más alto." },
      { q: "¿Cómo se dice 'escuela' en inglés?", options: ["House", "School", "Church", "Park"], correct: 1, explanation: "'Escuela' en inglés es 'school'." },
      { q: "¿Cuántos meses tiene un año?", options: ["10", "11", "12", "13"], correct: 2, explanation: "Un año tiene 12 meses." },
      { q: "¿Qué instrumento usa un médico para escuchar el corazón?", options: ["Termómetro", "Estetoscopio", "Microscopio", "Telescopio"], correct: 1, explanation: "El estetoscopio permite escuchar los latidos del corazón." },
      { q: "¿En qué océano está la fosa más profunda?", options: ["Atlántico", "Índico", "Pacífico", "Ártico"], correct: 2, explanation: "La Fosa de las Marianas está en el océano Pacífico." },
      { q: "¿Qué significa 'omnívoro'?", options: ["Come plantas", "Come carne", "Come de todo", "No come"], correct: 2, explanation: "Omnívoro significa que come tanto plantas como carne." },
      { q: "¿Cuál es la capital de Brasil?", options: ["Río de Janeiro", "São Paulo", "Brasilia", "Salvador"], correct: 2, explanation: "La capital de Brasil es Brasilia." },
      { q: "¿Cuántos lados tiene un pentágono?", options: ["4", "5", "6", "7"], correct: 1, explanation: "Un pentágono tiene 5 lados." },
      { q: "¿Qué fuerza nos mantiene en el suelo?", options: ["Magnetismo", "Gravedad", "Electricidad", "Viento"], correct: 1, explanation: "La gravedad es la fuerza que nos mantiene en el suelo." },
    ]
  }
};

// ===== DATOS DE NIVELES =====
const levels = [
  { id: "patio", name: "El Patio", icon: "🏡", sceneClass: "scene-patio", description: "Rita fue vista correteando por el patio. ¡Explorá cada rincón!", clue: "Rita dejó huellas pequeñas cerca de la puerta de entrada..." },
  { id: "cocina", name: "La Cocina", icon: "🍳", sceneClass: "scene-cocina", description: "¡Parece que Rita estuvo buscando algo de comer! Revisá la cocina.", clue: "Hay pelitos blancos y marrones cerca del plato de comida..." },
  { id: "living", name: "El Living", icon: "🛋️", sceneClass: "scene-living", description: "El living está lleno de escondites. ¡Rita podría estar detrás de algún mueble!", clue: "El sillón tiene marcas de garras pequeñas en la tela..." },
  { id: "jardin", name: "El Jardín", icon: "🌻", sceneClass: "scene-jardin", description: "El jardín es enorme y lleno de plantas. Rita ama esconderse entre los arbustos.", clue: "Hay pisadas de gato en la tierra húmeda del jardín..." },
  { id: "escondite", name: "El Escondite Final", icon: "✨", sceneClass: "scene-escondite", description: "¡Estás muy cerca! Todas las pistas te trajeron hasta acá.", clue: "¡Escuchás un pequeño 'miau' detrás de una caja de cartón!" }
];

// ===== LOGROS =====
const achievementsDef = [
  { id: "explorer", name: "Explorador/a", icon: "🗺️", condition: s => s >= 30, desc: "Completar con al menos 30 puntos" },
  { id: "genius", name: "Genio", icon: "🧠", condition: s => s >= 100, desc: "Conseguir 100 puntos o más" },
  { id: "perfect", name: "Perfecto", icon: "🌟", condition: s => s >= 150, desc: "Puntaje perfecto: 150 puntos" },
  { id: "finder", name: "Encontró a Rita", icon: "🐱", condition: s => s >= 80, desc: "Juntar suficientes pistas" }
];

// ===== ESTADO =====
let state = {
  character: null,
  difficulty: null,
  currentLevel: 0,
  currentQuestion: 0,
  score: 0,
  cluesFound: [],
  levelQuestions: [],
  answered: false
};

// ===== NAVEGACIÓN =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goToStart() { stopMusic(); clearTimer(); showScreen('screen-start'); updateHighScoreDisplay(); }
function goToCharacterSelect() { showScreen('screen-select'); }

function updateHighScoreDisplay() {
  const best = localStorage.getItem('rita-best-score');
  const el = document.getElementById('high-score-start');
  el.textContent = best ? `🏆 Mejor puntaje: ${best} puntos` : '';
}

// ===== PERSONAJE =====
function selectCharacter(char) {
  state.character = char;
  showScreen('screen-difficulty');
}

function getCharName() {
  return { justina: 'Justina', leon: 'León', emilia: 'Emilia' }[state.character] || 'Jugador';
}

function getDiffLabel() {
  return { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' }[state.difficulty] || '';
}

// ===== DIFICULTAD =====
function selectDifficulty(diff) {
  state.difficulty = diff;
  state.currentLevel = 0;
  state.score = 0;
  state.cluesFound = [];
  startMusic();
  showLevelIntro();
}

// ===== GENERAR PREGUNTAS PARA UN NIVEL =====
function getQuestionsForLevel() {
  const level = levels[state.currentLevel];
  const diff = state.difficulty;
  const bank = staticQuestions[diff][level.id];
  const staticPick = shuffle([...bank]).slice(0, 2);
  const mathPick = generateMathQuestions(diff, 1);
  return shuffle([...staticPick, ...mathPick]);
}

// ===== INTRO NIVEL =====
function showLevelIntro() {
  const level = levels[state.currentLevel];
  document.getElementById('level-number-badge').textContent = `NIVEL ${state.currentLevel + 1} · ${getDiffLabel()}`;
  document.getElementById('level-scene').className = `level-scene ${level.sceneClass}`;
  document.getElementById('level-scene').textContent = level.icon;
  document.getElementById('level-title').textContent = level.name;
  document.getElementById('level-description').textContent = level.description + ` ¡Vamos, ${getCharName()}!`;
  document.getElementById('player-avatar-intro-container').innerHTML = `<div class="mini-avatar">${getCharSVG(state.character, 30)}</div>`;
  document.getElementById('player-name-intro').textContent = getCharName();
  showScreen('screen-level-intro');
}

// ===== INICIAR NIVEL =====
function startLevel() {
  state.levelQuestions = getQuestionsForLevel();
  state.currentQuestion = 0;
  state.answered = false;
  updateGameUI();
  showQuestion();
  showScreen('screen-question');
}

function updateGameUI() {
  document.getElementById('player-avatar-game-container').innerHTML = getCharSVG(state.character, 24);
  document.getElementById('player-name-game').textContent = getCharName();
  document.getElementById('score-display').textContent = state.score;
  document.getElementById('level-badge').textContent = `${state.currentLevel + 1}/5`;
  const progress = ((state.currentLevel * 3 + state.currentQuestion) / 15) * 100;
  document.getElementById('progress-bar').style.width = `${progress}%`;
  for (let i = 0; i < 5; i++) {
    const paw = document.getElementById(`paw-${i}`);
    if (paw) paw.className = `paw ${i < state.currentLevel ? 'active' : ''}`;
  }
}

// ===== PREGUNTA =====
function showQuestion() {
  const q = state.levelQuestions[state.currentQuestion];
  document.getElementById('question-counter').textContent = `Pregunta ${state.currentQuestion + 1} de 3`;
  document.getElementById('question-text').textContent = q.q;
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => answerQuestion(i);
    grid.appendChild(btn);
  });
  document.getElementById('feedback-panel').classList.add('hidden');
  document.getElementById('feedback-overlay').classList.add('hidden');
  state.answered = false;
  updateGameUI();
  startTimer();
}

// ===== RESPONDER =====
function answerQuestion(index) {
  if (state.answered) return;
  state.answered = true;
  clearTimer();
  const q = state.levelQuestions[state.currentQuestion];
  const buttons = document.querySelectorAll('.option-btn');
  const isCorrect = index === q.correct;
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    if (i === index && !isCorrect) btn.classList.add('incorrect');
  });
  const icon = document.getElementById('feedback-icon');
  const text = document.getElementById('feedback-text');
  if (isCorrect) {
    state.score += 10;
    icon.textContent = '🎉';
    text.textContent = `¡Correcto, ${getCharName()}! +10 puntos`;
    playCorrectSound();
  } else {
    icon.textContent = '😅';
    text.textContent = q.explanation;
    playIncorrectSound();
  }
  document.getElementById('score-display').textContent = state.score;
  document.getElementById('feedback-btn').textContent = state.currentQuestion >= 2 ? 'Ver pista 🔍' : 'Siguiente →';
  document.getElementById('feedback-panel').classList.remove('hidden');
  document.getElementById('feedback-overlay').classList.remove('hidden');
}

function nextQuestion() {
  state.currentQuestion++;
  if (state.currentQuestion >= 3) showClue();
  else showQuestion();
}

// ===== PISTA =====
function showClue() {
  const level = levels[state.currentLevel];
  state.cluesFound.push(level.clue);
  playClueSound();
  document.getElementById('clue-text').textContent = level.clue;
  const container = document.getElementById('clues-collected');
  container.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const chip = document.createElement('span');
    chip.className = `clue-chip ${i < state.cluesFound.length ? '' : 'locked'}`;
    chip.textContent = i < state.cluesFound.length ? `Pista ${i + 1} ✓` : `Pista ${i + 1} 🔒`;
    container.appendChild(chip);
  }
  showScreen('screen-clue');
}

function goToNextLevel() {
  state.currentLevel++;
  if (state.currentLevel >= 5) showFinal();
  else showLevelIntro();
}

// ===== FINAL =====
function showFinal() {
  const found = state.score >= 80;
  const charName = getCharName();
  const finalScene = document.getElementById('final-scene');
  finalScene.innerHTML = found ? getRitaSVG(140) : '🐱❓';
  document.getElementById('final-title').textContent = found ? `¡${charName} encontró a Rita!` : 'Rita sigue escondida...';
  document.getElementById('final-message').textContent = found
    ? `¡Felicitaciones, ${charName}! Gracias a todas las pistas y tu inteligencia, encontraste a Rita escondida detrás de una caja de cartón. ¡Rita ronronea feliz de verte!`
    : `${charName} no juntó suficientes pistas esta vez. ¡Pero podés intentarlo de nuevo! Necesitás al menos 80 puntos para encontrar a Rita.`;
  document.getElementById('final-score-value').textContent = `${state.score} / 150`;
  const stars = Math.min(5, Math.floor(state.score / 30));
  document.getElementById('final-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  const best = parseInt(localStorage.getItem('rita-best-score') || '0');
  if (state.score > best) localStorage.setItem('rita-best-score', state.score);
  if (found) { setTimeout(launchConfetti, 400); playVictorySound(); }
  const panel = document.getElementById('achievements-panel');
  panel.innerHTML = '';
  achievementsDef.forEach(a => {
    const unlocked = a.condition(state.score);
    const div = document.createElement('div');
    div.className = `achievement ${unlocked ? '' : 'locked'}`;
    div.innerHTML = `<span>${a.icon}</span><span>${a.name}</span>`;
    div.title = a.desc;
    panel.appendChild(div);
  });
  document.getElementById('ranking-form').style.display = '';
  document.getElementById('ranking-status').textContent = '';
  document.getElementById('player-real-name').value = '';
  showScreen('screen-final');
}

// ===== REINICIAR =====
function restartGame() {
  state = { character: null, difficulty: null, currentLevel: 0, currentQuestion: 0, score: 0, cluesFound: [], levelQuestions: [], answered: false };
  goToCharacterSelect();
}

// ===== RANKING (SUPABASE) =====
async function submitRanking() {
  const nameInput = document.getElementById('player-real-name');
  const nombre = nameInput.value.trim();
  const status = document.getElementById('ranking-status');
  if (!nombre) {
    status.textContent = '¡Escribí tu nombre primero!';
    status.className = 'ranking-status error';
    nameInput.focus();
    return;
  }
  status.textContent = 'Guardando...';
  status.className = 'ranking-status';
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rita_ranking`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ nombre, personaje: getCharName(), puntaje: state.score, dificultad: state.difficulty || 'medio' })
    });
    if (res.ok) {
      status.textContent = '✅ ¡Puntaje guardado en el ranking!';
      status.className = 'ranking-status success';
      document.getElementById('ranking-form').style.display = 'none';
    } else throw new Error();
  } catch (e) {
    status.textContent = '❌ No se pudo guardar. Intentá de nuevo.';
    status.className = 'ranking-status error';
  }
}

async function showRanking() {
  showScreen('screen-ranking');
  const currentDiff = state.difficulty || 'medio';
  document.querySelectorAll('.rank-tab').forEach(t => t.classList.toggle('active', t.dataset.diff === currentDiff));
  loadRankingData(currentDiff);
}

function switchRankingTab(diff) {
  document.querySelectorAll('.rank-tab').forEach(t => t.classList.toggle('active', t.dataset.diff === diff));
  loadRankingData(diff);
}

async function loadRankingData(diff) {
  const container = document.getElementById('ranking-table-container');
  container.innerHTML = '<p class="ranking-loading">Cargando ranking...</p>';
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rita_ranking?select=nombre,personaje,puntaje,created_at&dificultad=eq.${diff}&order=puntaje.desc,created_at.asc&limit=20`,
      { headers: { 'apikey': SUPABASE_KEY } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data.length) { container.innerHTML = '<p class="ranking-empty">Todavía no hay puntajes en esta dificultad. ¡Sé el primero!</p>'; return; }
    const medals = ['🥇', '🥈', '🥉'];
    container.innerHTML = `<table class="ranking-table"><thead><tr><th>#</th><th>Nombre</th><th>Personaje</th><th>Puntos</th></tr></thead><tbody>${
      data.map((r, i) => `<tr><td><span class="rank-medal">${medals[i] || (i + 1)}</span></td><td class="rank-name">${escapeHtml(r.nombre)}</td><td class="rank-char">${escapeHtml(r.personaje)}</td><td class="rank-score">${r.puntaje}</td></tr>`).join('')
    }</tbody></table>`;
  } catch (e) {
    container.innerHTML = '<p class="ranking-empty">No se pudo cargar el ranking.</p>';
  }
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// ===== UTILS =====
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== INIT =====
updateHighScoreDisplay();
