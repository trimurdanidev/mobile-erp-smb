// ── Audio Feedback Service ─────────────────────────
export const playBeep = (type: "success" | "error") => {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    if (type === "success") {
      // ── 2 nada naik (beep beep) ──
      const times = [0, 0.15];
      const freqs = [880, 1100];

      times.forEach((time, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + time);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + time + 0.12,
        );

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.12);
      });
    } else {
      // ── 1 nada rendah panjang (beeep) ──
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }

    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    console.warn("Audio tidak tersedia:", e);
  }
};

// ── Notifikasi "kencling" (seperti lonceng/chime) ──
export const playNotifSound = () => {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // 3 nada kencling: ding → dang → ding tinggi
    const notes = [
      { freq: 1318.5, time: 0, dur: 0.35 }, // E6
      { freq: 1046.5, time: 0.18, dur: 0.35 }, // C6
      { freq: 1567.9, time: 0.36, dur: 0.55 }, // G6 (nada paling tinggi, paling lama)
    ];

    notes.forEach(({ freq, time, dur }) => {
      // Oscillator utama (sine — bersih kayak lonceng)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Oscillator harmonik (overtone tipis biar lebih "metalik")
      const oscHarm = ctx.createOscillator();
      const gainHarm = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      oscHarm.connect(gainHarm);
      gainHarm.connect(ctx.destination);

      // Nada utama
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + time + 0.01); // attack cepat
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + time + dur,
      );

      // Harmonik (2x frekuensi, volume kecil)
      oscHarm.type = "sine";
      oscHarm.frequency.setValueAtTime(freq * 2, ctx.currentTime + time);
      gainHarm.gain.setValueAtTime(0, ctx.currentTime + time);
      gainHarm.gain.linearRampToValueAtTime(
        0.08,
        ctx.currentTime + time + 0.01,
      );
      gainHarm.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + time + dur * 0.6,
      );

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);

      oscHarm.start(ctx.currentTime + time);
      oscHarm.stop(ctx.currentTime + time + dur * 0.6);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.warn("Audio tidak tersedia:", e);
  }
};
