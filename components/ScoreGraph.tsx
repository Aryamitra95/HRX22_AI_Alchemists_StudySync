import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Label
} from 'recharts';

const ScoreGraph = () => {
    const [data, setData] = useState([
        { score: 65, time: Date.now() - 40000 },
        { score: 72, time: Date.now() - 30000 },
        { score: 88, time: Date.now() - 20000 },
        { score: 55, time: Date.now() - 10000 },
        { score: 62, time: Date.now() }
    ]);
    const [score, setScore] = useState(62);
    const [status, setStatus] = useState('Focused');

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:5000/score_feed');
        eventSource.onmessage = (event) => {
            const newScore = parseFloat(event.data);
            setScore(newScore);
            setStatus(newScore <= 40 ? 'Distracted' : 'Focused');
            setData((prevData) => {
                const newData = [...prevData, { score: newScore, time: Date.now() }];
                return newData.length > 30 ? newData.slice(newData.length - 30) : newData;
            });
        };
        return () => eventSource.close();
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3ba776" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3ba776" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={false} axisLine={false}>
                        <Label value="Time" offset={-5} position="insideBottom" />
                    </XAxis>
                    <YAxis domain={[0, 100]}>
                        <Label value="Score (%)" angle={-90} position="insideLeft" />
                    </YAxis>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3ba776"
                        strokeWidth={2}
                        dot={false}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
        <span
            className={`text-xl font-bold tracking-wide ${
                status === 'Distracted'
                    ? 'text-red-500 drop-shadow-[1px_1px_0_#991b1b]'
                    : 'text-green-500 drop-shadow-[1px_1px_0_#065f46]'
            }`}
        >
          {status}
        </span>
            </div>
        </div>
    );
};

export default ScoreGraph;
