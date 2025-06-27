import React, { useEffect, useState } from 'react';
import {
    ChartComponent,
    SeriesCollectionDirective,
    SeriesDirective,
    Inject,
    ColumnSeries,
    LineSeries,
    Tooltip,
    Legend,
    Category, type ValueType,
} from '@syncfusion/ej2-react-charts';

import { Client, Databases } from 'appwrite';
import type { Models } from 'appwrite';

const monthColorMap: { [key: string]: string } = {
    January: '#A8DADC',
    February: '#FBC4AB',
    March: '#CDB4DB',
    April: '#B5EAD7',
    May: '#FFDAC1',
    June: '#DAD4EF',
    July: '#FFD6A5',
    August: '#FDFFB6',
    September: '#A0C4FF',
    October: '#BDB2FF',
    November: '#FFADAD',
    December: '#CAFFBF',
    Jan: '#A8DADC',
    Feb: '#FBC4AB',
    Mar: '#CDB4DB',
    Apr: '#B5EAD7',
    Jun: '#DAD4EF',
    Jul: '#FFD6A5',
    Aug: '#FDFFB6',
    Sep: '#A0C4FF',
    Oct: '#BDB2FF',
    Nov: '#FFADAD',
    Dec: '#CAFFBF',
};

const chartPrimaryXAxis = { valueType: 'Category' as ValueType, title: 'Month' };
const chartPrimaryYAxis = { title: 'Users', labelFormat: '{value}k' };

interface UserGrowth {
    month: string;
    count: number;
    month_index: number;
}

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('YOUR_PROJECT_ID');

const databases = new Databases(client);

const Lifetime: React.FC = () => {
    const [userGrowthData, setUserGrowthData] = useState<UserGrowth[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await databases.listDocuments<Models.Document>(
                    'YOUR_DATABASE_ID',
                    'YOUR_COLLECTION_ID'
                );

                const mappedData: UserGrowth[] = response.documents
                    .map((doc) => ({
                        month: doc.month,
                        count: doc.count,
                        month_index: doc.month_index,
                    }))
                    .sort((a, b) => a.month_index - b.month_index);

                setUserGrowthData(mappedData);
            } catch (err) {
                console.warn('Using default mock data due to error:', err);

                const mockData: UserGrowth[] = [
                    { month: 'Jan', count: 2.4, month_index: 1 },
                    { month: 'Feb', count: 1.9, month_index: 2 },
                    { month: 'Mar', count: 3.1, month_index: 3 },
                    { month: 'Apr', count: 1.7, month_index: 4 },
                    { month: 'May', count: 2.0, month_index: 5 },
                    { month: 'Jun', count: 2.1, month_index: 6 },
                ];

                setUserGrowthData(mockData);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="rounded-xl border p-4 shadow-sm bg-white">
            <h3 className="font-semibold text-lg mb-2">User Growth</h3>
            <ChartComponent
                primaryXAxis={chartPrimaryXAxis}
                primaryYAxis={chartPrimaryYAxis}
                tooltip={{ enable: true }}
                pointRender={(args) => {
                    const month = args.point.x as string;
                    args.fill = monthColorMap[month] || '#A8DADC';
                }}
            >
                <Inject services={[ColumnSeries, LineSeries, Tooltip, Legend, Category]} />
                <SeriesCollectionDirective>
                    <SeriesDirective
                        dataSource={userGrowthData}
                        xName="month"
                        yName="count"
                        type="Column"
                        name="User Score"
                        marker={{ visible: true }}
                    />
                    <SeriesDirective
                        dataSource={userGrowthData}
                        xName="month"
                        yName="count"
                        type="Line"
                        name="Trend"
                        marker={{ visible: true }}
                    />
                </SeriesCollectionDirective>
            </ChartComponent>
        </div>
    );
};

export default Lifetime;

