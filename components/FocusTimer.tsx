import React, { useEffect, useState } from "react";

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60;     // 5 minutes in seconds
const LONG_BREAK = 15 * 60;     // 15 minutes in seconds

const FocusTimer: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
    const [sessionCount, setSessionCount] = useState(0);
    const [isBreak, setIsBreak] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;

        if (isPlaying) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev > 0) return prev - 1;
                    // Timer finished
                    if (!isBreak) {
                        // Start break
                        const nextBreak = (sessionCount + 1) % 4 === 0 ? LONG_BREAK : SHORT_BREAK;
                        setIsBreak(true);
                        setTimeLeft(nextBreak);
                    } else {
                        // Start focus session
                        setIsBreak(false);
                        setSessionCount((prev) => prev + 1);
                        setTimeLeft(FOCUS_DURATION);
                    }
                    return 0;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [isPlaying, isBreak, sessionCount]);

    const handleToggle = () => {
        setIsPlaying((prev) => !prev);
    };

    // Derive minutes and seconds from timeLeft
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-[#e8f7fc] rounded-3xl shadow-[0_10px_40px_rgba(0,150,255,0.2)] text-center w-64">
            <p className="text-md font-semibold text-blue-700 tracking-wide">
                {isBreak ? "Break Time" : "Focus Time"}
            </p>

            <div className="flex gap-4 justify-center items-center">
                <div className="bg-white text-blue-800 rounded-xl w-20 h-24 flex justify-center items-center shadow-inner text-5xl font-bold">
                    {String(minutes).padStart(2, "0")}
                </div>
                <span className="text-4xl font-bold text-blue-600">:</span>
                <div className="bg-white text-blue-800 rounded-xl w-20 h-24 flex justify-center items-center shadow-inner text-5xl font-bold">
                    {String(seconds).padStart(2, "0")}
                </div>
            </div>

            <p className="text-xs text-blue-500">
                Session {sessionCount + 1} of 4
            </p>

            <button
                onClick={handleToggle}
                className={`mt-4 px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400`}
            >
                {isPlaying ? (
                    <>
                        {/* Animated Pause Icon */}
                        <svg
                            className="w-6 h-6 animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                        >
                            <rect x="6" y="5" width="4" height="14" rx="2" className="fill-current text-white" />
                            <rect x="14" y="5" width="4" height="14" rx="2" className="fill-current text-white" />
                        </svg>
                        Pause
                    </>
                ) : (
                    <>
                        {/* Animated Play Icon */}
                        <svg
                            className="w-6 h-6 animate-bounce"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <polygon points="5,3 19,12 5,21" className="fill-current text-white" />
                        </svg>
                        Play
                    </>
                )}
            </button>
        </div>
    );
};

export default FocusTimer;
