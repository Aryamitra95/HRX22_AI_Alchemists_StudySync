import React, { useEffect, useState } from 'react';

interface QuizItem {
    question: string;
    options: string[];
    answer: string;
}

interface SummarizerProps {
    videoId: string;
    timestamp: number;
}

const Summarizer: React.FC<SummarizerProps> = ({ videoId, timestamp }) => {
    const [summary, setSummary] = useState('');
    const [quiz, setQuiz] = useState<QuizItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSummaryAndQuiz = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:5000/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        link: `https://www.youtube.com/watch?v=${videoId}`,
                        time_stamp: timestamp,
                    }),
                });

                const data = await response.json();
                setSummary(data.summary);
                setQuiz(data.quiz);
            } catch (error) {
                console.error('Failed to fetch summary and quiz:', error);
            } finally {
                setLoading(false);
            }
        };

        if (videoId) fetchSummaryAndQuiz();
    }, [videoId, timestamp]);

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-xl border border-gray-200">
            {loading ? (
                <p className="text-center text-blue-600 font-semibold">Generating summary and quiz...</p>
            ) : (
                <>
                    {summary && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold mb-2 text-blue-800">Summary</h2>
                            <p className="text-gray-700 leading-relaxed">{summary}</p>
                        </div>
                    )}

                    {quiz.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-green-700">Quiz</h2>
                            {quiz.map((q, index) => (
                                <div key={index} className="mb-6 p-4 border border-gray-300 rounded-lg">
                                    <p className="font-medium mb-2">
                                        Q{index + 1}: {q.question}
                                    </p>
                                    <ul className="list-disc ml-5 text-gray-700">
                                        {q.options.map((opt, i) => (
                                            <li key={i}>{opt}</li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 font-semibold text-sm text-green-600">
                                        Answer: {q.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Summarizer;
