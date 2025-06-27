import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type {ChartOptions} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type Trend = {
    day: string;
    percentage: number;
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TripTrendsChart = () => {
    const [data, setData] = useState<Trend[]>([]);

    useEffect(() => {
        // ✅ Dummy data for testing
        const dummyData = [
            { day: 'Monday', percentage: 20 },
            { day: 'Tuesday', percentage: 15 },
            { day: 'Wednesday', percentage: 25 },
            { day: 'Thursday', percentage: 30 },
            { day: 'Friday', percentage: 40 },  // Highlighted
            { day: 'Saturday', percentage: 35 },
            { day: 'Sunday', percentage: 28 },
        ];
        setData(dummyData);
    }, []);

    const chartData = {
        labels: data.map((item) => item.day),
        datasets: [
            {
                label: 'Weekly',
                data: data.map((item) => item.percentage),
                backgroundColor: data.map((item) =>
                    item.day === 'Friday' ? 'rgba(99, 102, 241, 1)' : 'rgba(99, 102, 241, 0.2)'
                ),
                borderRadius: 8,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        scales: {
            y: {
                beginAtZero: true,
                max: 60,
                ticks: {
                    callback: (tickValue) => typeof tickValue === 'number' ? `${tickValue}%` : tickValue,
                    stepSize: 20,
                },
                grid: {
                    color: 'rgba(0,0,0,0.05)',
                },
                border:{
                    display: false
                }
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.parsed.y}%`,
                },
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    };


    return (
        <div className="rounded-xl border p-4 shadow-sm w-full h-[300px] bg-white">
            <h3 className="font-semibold text-lg mb-2">Concentration Level (by Day)</h3>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default TripTrendsChart;
