import { useEffect, useRef } from "react";

/** Oszilloskop: zeichnet das Zeitsignal des AnalyserNodes. */
export function Scope({ getAnalyser }: { getAnalyser: () => AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const g = canvas.getContext("2d")!;
    let raf = 0;
    let buf: Uint8Array<ArrayBuffer> | null = null;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      g.clearRect(0, 0, w, h);
      const analyser = getAnalyser();
      if (!analyser) return;
      if (!buf || buf.length !== analyser.fftSize) {
        buf = new Uint8Array(analyser.fftSize);
      }
      analyser.getByteTimeDomainData(buf);

      g.lineWidth = 2;
      g.strokeStyle = "#f2e88a";
      g.shadowColor = "#f2e88a";
      g.shadowBlur = 12;
      g.beginPath();
      for (let i = 0; i < buf.length; i++) {
        const x = (i / (buf.length - 1)) * w;
        const y = (buf[i] / 255) * h;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [getAnalyser]);

  return <canvas ref={canvasRef} className="scope" width={900} height={160} />;
}
