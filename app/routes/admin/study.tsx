import React,{useState, useRef, useEffect} from 'react'
import ReactMarkdown from 'react-markdown';
import {FocusTimer, Header, ScoreGraph, Summarizer, WebcamFeed, YoutubePlayer, PlaylistManager} from "../../../components";
import AudioVisualizer from 'components/AudioVisualizer';
import { getUser } from '../../appwrite/auth';
import { getUserPlaylistsWithVideos } from '../../appwrite/playlists';

interface YouTubePlayerHandle {
    getCurrentTime: () => number;
}
interface QuizItem {
    question: string;
    options: string[];
    answer: string;
}

interface Video {
    id: string;
    title: string;
    progress?: number;
}

interface Playlist {
    id: string;
    name: string;
    videos: Video[];
}

const Study: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
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
    const [distractionScore, setDistractionScore] = useState(0);
    const [showPlaylistManager, setShowPlaylistManager] = useState(false);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    
    // Quiz modal state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    // Get user data on component mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getUser();
                setUser(userData);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUser();
    }, []);

    // Fetch playlists when user is available
    useEffect(() => {
        const fetchPlaylists = async () => {
            if (!user) return;
            
            try {
                const userPlaylistsWithVideos = await getUserPlaylistsWithVideos();
                
                // Convert DB format to component format
                const convertedPlaylists: Playlist[] = userPlaylistsWithVideos.map(playlist => ({
                    id: playlist.id,
                    name: playlist.name,
                    videos: playlist.videos.map(video => ({
                        id: video.id,
                        title: video.title,
                        progress: video.progress
                    }))
                }));
                
                setPlaylists(convertedPlaylists);
            } catch (error) {
                console.error('Error fetching playlists:', error);
            }
        };

        fetchPlaylists();
    }, [user]);

    useEffect(() => {
        console.log('Distraction score updated:', distractionScore);
    }, [distractionScore]);

    useEffect(() => {
        const source = new EventSource('http://localhost:5000/distracted_feed');
        
        source.onmessage = (e) => {
            console.log('Received distraction data:', e.data);
            const value = parseFloat(e.data);
            setDistractionScore(value);
        };
        
        source.onerror = (e) => {
            console.error('EventSource error:', e);
        };
        
        source.onopen = () => {
            console.log('EventSource connected to distraction feed');
        };
        
        return () => {
            console.log('Closing EventSource connection');
            source.close();
        };
    }, []);

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

    const handleVideoSelect = (videoId: string, title: string) => {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        setInputUrl(youtubeUrl);
        setUrl(youtubeUrl);
        setShowPlaylistManager(false);
        alert(`Selected: ${title}`);
    };

    const handlePlaylistsUpdate = (updatedPlaylists: Playlist[]) => {
        setPlaylists(updatedPlaylists);
    };

    // Modal handlers
    const handleOpenModal = () => {
        setShowModal(true);
        resetQuiz();
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Quiz handlers
    const handleAnswerSelect = (answer: string) => {
        if (isAnswered || !quiz || !quiz[currentQuestionIndex]) return; // Prevent multiple selections and null access
        
        setSelectedAnswer(answer);
        setIsAnswered(true);
        
        // Update score if answer is correct
        if (answer === quiz[currentQuestionIndex].answer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (!quiz || currentQuestionIndex < quiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        }
    };

    const handleFinishQuiz = () => {
        setShowModal(false);
        // Reset quiz state
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setScore(0);
    };

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setScore(0);
    };

    const videoId = getVideoId(url);
    return (
        <main className="dashboard wrapper">
            <div className="min-h-screen bg-white text-black p-6">
                {/* Playlist Manager Button */}
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={() => setShowPlaylistManager(true)}
                        className="bg-[#0056D3] text-white px-4 py-2 rounded-md hover:bg-[#0047B3] flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        Manage Playlists
                    </button>
                </div>

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
                                <div className="mb-4">
                                    <label htmlFor="distraction-bar" className="block text-sm font-medium text-gray-700">
                                        Distraction Level: {distractionScore.toFixed(1)}%
                                    </label>
                                    <progress
                                        id="distraction-bar"
                                        className="w-full h-2 bg-gray-200 rounded"
                                        max={100}
                                        value={distractionScore}
                                    />
                                </div>
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
                            <div className="bg-[#f0f9ff] rounded-xl border border-blue-300/40 p-4 w-full">
                                <AudioVisualizer />
                            </div>
                        </div>
                    )}
                </div>

                {/* Playlist Manager Modal */}
                {showPlaylistManager && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                            <PlaylistManager 
                                onVideoSelect={handleVideoSelect}
                                onClose={() => setShowPlaylistManager(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Custom Modal Window */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Quiz</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            {quiz && quiz.length > 0 && currentQuestionIndex < quiz.length ? (
                                <div className="text-gray-700">
                                    {/* Progress indicator */}
                                    <div className="mb-4 text-sm text-gray-500">
                                        Question {currentQuestionIndex + 1} of {quiz.length}
                                    </div>
                                    
                                    {/* Current question */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-4">
                                            {quiz[currentQuestionIndex].question}
                                        </h3>
                                        
                                        {/* Answer options */}
                                        <div className="space-y-3">
                                            {quiz[currentQuestionIndex].options.map((option, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleAnswerSelect(option)}
                                                    disabled={isAnswered}
                                                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                                                        selectedAnswer === option
                                                            ? option === quiz[currentQuestionIndex].answer
                                                                ? 'bg-green-100 border-green-500 text-green-700'
                                                                : 'bg-red-100 border-red-500 text-red-700'
                                                            : isAnswered && option === quiz[currentQuestionIndex].answer
                                                            ? 'bg-green-100 border-green-500 text-green-700'
                                                            : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                                                    } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Navigation button */}
                                    {isAnswered && (
                                        <div className="flex justify-end">
                                            {currentQuestionIndex < quiz.length - 1 ? (
                                                <button
                                                    onClick={handleNextQuestion}
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    Next
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleFinishQuiz}
                                                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                                                >
                                                    Finish
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-700">
                                    <p>No quiz questions available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* {!isPlaying && url && (
                    <div className=" mt-6 bg-[#f0f9ff] rounded-2xl border border-blue-300 shadow-[0_0_20px_rgba(0,200,120,0.15)] p-4 transition-all mt-6">
                        {currentTimestamp > 0 ? (
                        <Summarizer videoId={videoId} timestamp={currentTimestamp} />
                        ) : (
                        <div className="text-gray-500 italic text-center">AI Summarizer</div>
                        )}
                    </div>

                )} */}
                {url &&(
                <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-md rounded-xl border border-gray-200">
                {loading ? (
                    <p className="text-center text-blue-600 font-semibold">Generating summary and quiz...</p>
                ) : (
                    <>
                        {summary && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold mb-2 text-blue-800">Summary</h2>
                                <p className="text-gray-700 leading-relaxed"><ReactMarkdown>{summary}</ReactMarkdown></p>
                                {quiz && quiz.length > 0 && (
                                    <button
                                        onClick={handleOpenModal}
                                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Open Quiz
                                    </button>
                                )}
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
)}



            </div>
            
        </main>

    )
}

export default Study