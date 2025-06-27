import React, { useEffect, useState } from "react";

interface FocusTimerProps {
    isPlaying: boolean;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ isPlaying }) => {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [sessionCount, setSessionCount] = useState(0);
    const [isBreak, setIsBreak] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        if (isPlaying) {
            timer = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        if (!isBreak) {
                            const nextBreak = (sessionCount + 1) % 4 === 0 ? 15 : 5;
                            setMinutes(nextBreak);
                            setIsBreak(true);
                        } else {
                            setMinutes(25);
                            setSessionCount((prev) => prev + 1);
                            setIsBreak(false);
                        }
                        setSeconds(0);
                    } else {
                        setMinutes((m) => m - 1);
                        setSeconds(59);
                    }
                } else {
                    setSeconds((s) => s - 1);
                }
            }, 1000);
        }

        return () =>  clearInterval(timer);
    }, [isPlaying, minutes, seconds, isBreak, sessionCount]);

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
        </div>
    );
};

export default FocusTimer;
