import React,{useState, useRef} from 'react'
import ReactMarkdown from 'react-markdown';
import {FocusTimer, Header, ScoreGraph, Summarizer, WebcamFeed, YoutubePlayer} from "../../../components";

interface YouTubePlayerHandle {
    getCurrentTime: () => number;
}
interface QuizItem {
    question: string;
    options: string[];
    answer: string;
}

const Study: React.FC = () => {
    const user = { name: 'Aryamitra'}
    const [inputUrl, setInputUrl] = useState("");
    const playerRef = useRef<YouTubePlayerHandle>(null);
    const [currentTimestamp, setCurrentTimestamp] = useState(0);
    const [url, setUrl] = useState("");
    const [summary, setSummary] = useState('');
    const [quiz, setQuiz] = useState<QuizItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const getVideoId = (url: string): string => {
        try {
            const urlObj = new URL(url);
            return urlObj.searchParams.get('v') || '';
        } catch {
            return '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputUrl.trim().includes("youtube.com/watch")) {
            alert("Enter a valid YouTube link.");
            return;
        }

        const trimmedUrl = inputUrl.trim();
        setUrl(trimmedUrl);         // Load into player
        setIsPlaying(false);        // Reset player state
        setShowVideo(true);         // Trigger webcam or similar

        alert("Starting concentration monitoring... Please turn on your camera.");

        const videoId = getVideoId(inputUrl);

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ link: trimmedUrl, time_stamp: currentTimestamp }),
            });

            const data = await response.json();
            setSummary(data.summary);
            setQuiz(data.quiz);

            if (iframeRef.current) {
                iframeRef.current.contentWindow?.postMessage(
                    '{"event":"command","func":"pauseVideo","args":""}',
                    '*'
                );
            }

            alert('Distraction detected. Summary shown.');
        } catch (error) {
            console.error(error);
            alert('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const videoId = getVideoId(url);
    return (
        <main className="dashboard wrapper">
            <div className="min-h-screen bg-white text-black p-6">
                <div className="flex justify-start items-start gap-20">
                    {/* Left Section: Input + Player + ScoreGraph */}
                    <div className="flex flex-col gap-4 w-full max-w-2xl">
                        {/* Input Box */}
                        <form onSubmit={handleSubmit} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Enter YouTube URL"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded bg-white text-black"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Load Video
                            </button>
                        </form>

                        {/* Player Box with faded border */}
                        {url && (
                            <div className="bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-4 transition-all">
                                <div className="aspect-video w-full">
                                    <YoutubePlayer
                                        ref={playerRef}
                                        url={url}
                                        playing={isPlaying}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => {
                                            setIsPlaying(false);
                                            const currentTime = playerRef.current?.getCurrentTime();
                                            if (currentTime !== undefined) {
                                                setCurrentTimestamp(Math.floor(currentTime));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                        )}


                        {/* Score Graph Box - same width and alignment as player */}
                        {url && (
                            <div className="bg-[#f0f9ff] rounded-2xl border border-blue-300 shadow-[0_0_20px_rgba(0,200,120,0.15)] p-4 transition-all">
                                <ScoreGraph />
                            </div>
                        )}
                    </div>

                    {/* Right Section: Timer + Webcam */}
                    {url && (
                        <div className="flex flex-col items-center gap-6 w-72">
                            {/* Timer Container */}
                            <div className="bg-[#f0f9ff] rounded-xl border border-blue-300/40 p-4 w-full">
                                <FocusTimer isPlaying={isPlaying} />
                            </div>

                            {/* Webcam Container */}
                            <div className="bg-[#f0f9ff] rounded-xl border border-blue-300/40 p-4 w-full">
                                <WebcamFeed showStreamImage={true} />
                            </div>
                        </div>
                    )}
                </div>
                {/* {!isPlaying && url && (
                    <div className=" mt-6 bg-[#f0f9ff] rounded-2xl border border-blue-300 shadow-[0_0_20px_rgba(0,200,120,0.15)] p-4 transition-all mt-6">
                        {currentTimestamp > 0 ? (
                        <Summarizer videoId={videoId} timestamp={currentTimestamp} />
                        ) : (
                        <div className="text-gray-500 italic text-center">AI Summarizer</div>
                        )}
                    </div>

                )} */}
                <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-xl border border-gray-200">
                {loading ? (
                    <p className="text-center text-blue-600 font-semibold">Generating summary and quiz...</p>
                ) : (
                    <>
                        {summary && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-2 text-blue-800">Summary</h2>
                                <p className="text-gray-700 leading-relaxed"><ReactMarkdown>{summary}</ReactMarkdown></p>
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




            </div>
        </main>

    )
}
export default Study
