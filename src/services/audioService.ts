// ── Audio Feedback Service ─────────────────────────
//
// Perubahan utama dari versi sebelumnya:
// 1. SATU AudioContext dipakai ulang (sebelumnya bikin + close context di
//    setiap beep → ini yang bikin suara telat/putus saat scan beruntun).
// 2. Context di-resume otomatis saat ada interaksi pertama (kebijakan
//    autoplay browser bikin context "suspended" sebelum ada gesture).
// 3. Beep sejenis yang datang < 60ms setelah beep sebelumnya di-skip,
//    supaya scanner HID yang kebaca ganda nggak bikin suara numpuk.
// 4. Node oscillator/gain dilepas setelah selesai (nggak bocor memori).

let ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  try {
    if (!ctx || ctx.state === "closed") {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC({ latencyHint: "interactive" });
    }
    if (ctx.state === "suspended") {
      // Tidak di-await: kalau belum ada gesture, resume() ditolak diam-diam
      // dan akan dicoba lagi lewat listener unlock di bawah.
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch (e) {
    console.warn("Audio tidak tersedia:", e);
    return null;
  }
};

// ── Unlock otomatis pada interaksi pertama (tap / tombol keyboard / scan HID) ──
const UNLOCK_EVENTS = ["pointerdown", "touchstart", "keydown"] as const;

const unlockAudio = () => {
  const c = getCtx();
  if (c && c.state === "running") {
    UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlockAudio));
  }
};

if (typeof window !== "undefined") {
  UNLOCK_EVENTS.forEach((ev) =>
    window.addEventListener(ev, unlockAudio, { passive: true }),
  );
}

// ── Helper: 1 nada dengan envelope ──
const tone = (
  c: AudioContext,
  opts: {
    freq: number;
    start: number; // detik, relatif ke sekarang
    dur: number;
    type: OscillatorType;
    volume: number;
    attack?: number; // detik; 0 = langsung
  },
) => {
  const { freq, start, dur, type, volume, attack = 0 } = opts;
  const t0 = c.currentTime + start;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  if (attack > 0) {
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + attack);
  } else {
    gain.gain.setValueAtTime(volume, t0);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

  osc.start(t0);
  osc.stop(t0 + dur);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
};

// ── Beep scan ──
const lastBeepAt: Record<string, number> = {};
const MIN_GAP_MS = 60;

export const playBeep = (type: "success" | "error") => {
  const now = performance.now();
  if (now - (lastBeepAt[type] ?? 0) < MIN_GAP_MS) return;
  lastBeepAt[type] = now;

  const c = getCtx();
  if (!c) return;

  if (type === "success") {
    // 2 nada naik (beep beep)
    tone(c, { freq: 880, start: 0, dur: 0.12, type: "sine", volume: 0.3 });
    tone(c, { freq: 1100, start: 0.15, dur: 0.12, type: "sine", volume: 0.3 });
  } else {
    // 1 nada rendah panjang (beeep)
    tone(c, { freq: 220, start: 0, dur: 0.4, type: "square", volume: 0.2 });
  }
};

// ── Notifikasi "kencling" (seperti lonceng/chime) ──
export const playNotifSound = () => {
  const c = getCtx();
  if (!c) return;

  // 3 nada kencling: ding → dang → ding tinggi
  const notes = [
    { freq: 1318.5, time: 0, dur: 0.35 }, // E6
    { freq: 1046.5, time: 0.18, dur: 0.35 }, // C6
    { freq: 1567.9, time: 0.36, dur: 0.55 }, // G6 (paling tinggi, paling lama)
  ];

  notes.forEach(({ freq, time, dur }) => {
    // Nada utama (sine — bersih kayak lonceng)
    tone(c, {
      freq,
      start: time,
      dur,
      type: "sine",
      volume: 0.35,
      attack: 0.01,
    });
    // Harmonik (2x frekuensi, volume kecil) biar lebih "metalik"
    tone(c, {
      freq: freq * 2,
      start: time,
      dur: dur * 0.6,
      type: "sine",
      volume: 0.08,
      attack: 0.01,
    });
  });
};
