import React from "react";

interface SessionTimerProps {
    sessionTime: number;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ sessionTime }) => {
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl shadow-lg text-center w-full">
            <p className="text-md font-semibold text-gray-700 tracking-wide">
                Session Duration
            </p>

            <div className="flex gap-2 justify-center items-center">
                <div className="bg-white text-gray-800 rounded-xl w-16 h-20 flex justify-center items-center shadow-inner text-3xl font-bold">
                    {formatTime(sessionTime).split(':')[0]}
                </div>
                <span className="text-2xl font-bold text-gray-600">:</span>
                <div className="bg-white text-gray-800 rounded-xl w-16 h-20 flex justify-center items-center shadow-inner text-3xl font-bold">
                    {formatTime(sessionTime).split(':')[1]}
                </div>
                <span className="text-2xl font-bold text-gray-600">:</span>
                <div className="bg-white text-gray-800 rounded-xl w-16 h-20 flex justify-center items-center shadow-inner text-3xl font-bold">
                    {formatTime(sessionTime).split(':')[2]}
                </div>
            </div>

            <p className="text-xs text-gray-500">
                {sessionTime > 0 ? "Session in progress" : "Session not started"}
            </p>
        </div>
    );
};

export default SessionTimer; 