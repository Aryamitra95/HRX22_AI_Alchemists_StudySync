import React, { useEffect, useRef } from "react";

const AudioVisualizer = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        const setupAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioCtx = new AudioContext();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();

                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                source.connect(analyser);

                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;
                dataArrayRef.current = dataArray;

                draw();
            } catch (err) {
                console.error("Microphone access denied", err);
            }
        };

        const draw = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx || !analyserRef.current || !dataArrayRef.current) return;

            const drawVisualizer = () => {
                const WIDTH = canvas.width;
                const HEIGHT = canvas.height;
                const centerX = WIDTH / 2;
                const centerY = HEIGHT / 2;
                const radius = 60;

                ctx.clearRect(0, 0, WIDTH, HEIGHT);
                analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);

                const bars = dataArrayRef.current!.length;
                for (let i = 0; i < bars; i++) {
                    const value = dataArrayRef.current![i];
                    const barLength = value / 3;
                    const angle = (i / bars) * 2 * Math.PI;

                    const x1 = centerX + Math.cos(angle) * radius;
                    const y1 = centerY + Math.sin(angle) * radius;
                    const x2 = centerX + Math.cos(angle) * (radius + barLength);
                    const y2 = centerY + Math.sin(angle) * (radius + barLength);

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `rgba(30, 144, 255, ${value / 255})`; // DodgerBlue
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                requestAnimationFrame(drawVisualizer);
            };

            drawVisualizer();
        };

        setupAudio();

        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    return (
        <div className="flex bg-white border border-blue-300/40 rounded-2xl shadow-[0_0_30px_rgba(0,170,255,0.25)] p-3 w-full h-full justify-center items-center relative">
            <canvas
                ref={canvasRef}
                width={280}
                height={280}
                style={{
                    display: "block",
                }}
            />
        </div>
    );
};

export default AudioVisualizer;