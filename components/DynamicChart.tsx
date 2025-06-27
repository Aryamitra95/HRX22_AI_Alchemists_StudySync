import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Client, Databases } from 'appwrite';
import type { Models } from 'appwrite';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const client = new Client().setEndpoint('https://cloud.appwrite.io/v1').setProject('YOUR_PROJECT_ID');
const databases = new Databases(client);

interface AnalyticsData {
    day: string;
    income: number;
    expense: number;
}

const DynamicLineChart = () => {
    const [data, setData] = useState<AnalyticsData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await databases.listDocuments<Models.Document>('YOUR_DATABASE_ID', 'analytics');
                const mapped = response.documents.map((doc) => ({
                    day: doc.day,
                    income: Number(doc.income),
                    expense: Number(doc.expense),
                })) as AnalyticsData[];
                setData(mapped);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const chartData = {
        labels: data.map((item) => item.day),
        datasets: [
            {
                label: 'Income',
                data: data.map((item) => item.income),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.3)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'white',
            },
            {
                label: 'Expense',
                data: data.map((item) => item.expense),
                borderColor: 'rgba(59, 130, 246, 0.5)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'white',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `$${context.parsed.y}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="rounded-xl border p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-lg mb-2">Sales Analytics</h3>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default DynamicLineChart;