/**
 * Audio Siren Synthesizer menggunakan Web Audio API
 * Menghasilkan suara sirine darurat khas ambulans/damkar tanpa perlu unduhan file eksternal.
 */

let audioCtx: AudioContext | null = null;
let currentSirenStop: (() => void) | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Memutar suara sirine darurat (dual-tone wail siren)
 * @param cycles Jumlah siklus ayunan nada sirine (default: 4 siklus ~ 3.2 detik)
 * @param volume Tingkat volume (0.0 - 1.0, default: 0.35)
 */
export function playSosSiren(cycles = 4, volume = 0.35): () => void {
  if (typeof window === "undefined") return () => {};

  try {
    // Hentikan sirine sebelumnya jika masih aktif
    if (currentSirenStop) {
      currentSirenStop();
      currentSirenStop = null;
    }

    const ctx = getAudioContext();
    if (!ctx) return () => {};

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Karakter gelombang sawtooth untuk suara sirine tajam khas sirine darurat
    osc.type = "sawtooth";

    // Filter lowpass agar suaranya mantap dan nyaman di telinga
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, now);

    // Durasi per gelombang naik-turun: 0.8 detik
    const cycleDuration = 0.8;
    const totalDuration = cycles * cycleDuration;

    // Modulasi nada: berosilasi antara 620 Hz dan 1080 Hz
    osc.frequency.setValueAtTime(620, now);
    for (let i = 0; i < cycles; i++) {
      const cycleStart = now + i * cycleDuration;
      // Naik ke 1080 Hz
      osc.frequency.linearRampToValueAtTime(1080, cycleStart + cycleDuration * 0.5);
      // Turun kembali ke 620 Hz
      osc.frequency.linearRampToValueAtTime(620, cycleStart + cycleDuration);
    }

    // Envelope gain: fade-in halus di awal dan fade-out di akhir
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.1);
    gain.gain.setValueAtTime(volume, now + totalDuration - 0.2);
    gain.gain.linearRampToValueAtTime(0.001, now + totalDuration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + totalDuration);

    let isStopped = false;
    const stopFn = () => {
      if (isStopped) return;
      isStopped = true;
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Abaikan
          }
        }, 60);
      } catch {
        // Abaikan
      }
    };

    currentSirenStop = stopFn;

    // Bersihkan referensi setelah selesai
    setTimeout(() => {
      if (currentSirenStop === stopFn) {
        currentSirenStop = null;
      }
    }, totalDuration * 1000 + 100);

    return stopFn;
  } catch (err) {
    console.warn("Gagal memutar sirine SOS:", err);
    return () => {};
  }
}

/**
 * Menghentikan suara sirine darurat seketika
 */
export function stopSosSiren(): void {
  if (currentSirenStop) {
    currentSirenStop();
    currentSirenStop = null;
  }
}
