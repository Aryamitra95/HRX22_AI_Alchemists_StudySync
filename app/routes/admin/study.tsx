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

// Sample quiz data for testing
const sampleQuizData: QuizItem[] = [
    {
        question: "What is the main purpose of React?",
        options: [
            "To create static websites",
            "To build user interfaces",
            "To handle database operations",
            "To manage server-side logic"
        ],
        answer: "To build user interfaces"
    },
    {
        question: "Which hook is used to manage state in functional components?",
        options: [
            "useEffect",
            "useState",
            "useContext",
            "useReducer"
        ],
        answer: "useState"
    },
    {
        question: "What does JSX stand for?",
        options: [
            "JavaScript XML",
            "JavaScript Extension",
            "JavaScript Syntax",
            "JavaScript Expression"
        ],
        answer: "JavaScript XML"
    },
    {
        question: "How do you pass data from parent to child component?",
        options: [
            "Using state",
            "Using props",
            "Using context",
            "Using refs"
        ],
        answer: "Using props"
    }
];

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
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);

    // Study session state
    const [sessionTime, setSessionTime] = useState(0);
    const [showSidebar, setShowSidebar] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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

    // Session timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setSessionTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

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
        setUrl(trimmedUrl);
        setIsPlaying(false);
        setShowVideo(true);

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
        // Use sample quiz data if no quiz is loaded from API
        const quizToUse = quiz && quiz.length > 0 ? quiz : sampleQuizData;
        if (!quizToUse || quizToUse.length === 0) {
            alert('No quiz questions available. Please load a video first.');
            return;
        }
        setQuiz(quizToUse);
        resetQuiz();
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Quiz handlers
    const handleAnswerSelect = (answer: string) => {
        if (isAnswered || !quiz || !quiz[currentQuestionIndex]) return;
        
        setSelectedAnswer(answer);
        setIsAnswered(true);
        
        // Update score if answer is correct
        if (answer === quiz[currentQuestionIndex].answer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (!quiz || currentQuestionIndex >= quiz.length - 1) return;
        
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
    };

    const handleFinishQuiz = () => {
        setIsQuizCompleted(true);
    };

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setScore(0);
        setIsQuizCompleted(false);
    };

    const handleCloseQuiz = () => {
        setShowModal(false);
        resetQuiz();
    };

    const getFocusColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getFocusStatus = (score: number) => {
        if (score >= 80) return 'Focused';
        if (score >= 60) return 'Mild Distraction';
        return 'Distracted';
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const videoId = getVideoId(url);
    
    return (
        <main className="min-h-screen bg-gray-50">
            {/* Modern Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Study Session</h1>
                            <p className="text-gray-600">Focus on your learning goals</p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-center">
                                <div className="text-sm text-gray-500">Focus Level</div>
                                <div className={`text-lg font-semibold ${getFocusColor(100 - distractionScore)}`}>
                                    {getFocusStatus(100 - distractionScore)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-500">Session Time</div>
                                <div className="text-lg font-semibold text-gray-900">{formatTime(sessionTime)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Main Content Panel (70%) */}
                <div className={`${showSidebar ? 'w-7/12' : 'w-full'} transition-all duration-300`}>
                    <div className="p-6">
                        {/* Video Input */}
                        <div className="mb-6">
                            <form onSubmit={handleSubmit} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter YouTube URL"
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Load Video
                                </button>
                            </form>
                        </div>

                        {/* Video Player */}
                        {url && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Focus Level</span>
                                        <span className={`text-sm font-semibold ${getFocusColor(100 - distractionScore)}`}>
                                            {getFocusStatus(100 - distractionScore)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                100 - distractionScore >= 80 ? 'bg-green-500' : 
                                                100 - distractionScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${100 - distractionScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="aspect-video w-full rounded-lg overflow-hidden">
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

                        {/* Summary and Quiz Section */}
                        {url && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-blue-600 font-semibold">Generating summary and quiz...</p>
                                    </div>
                                ) : (
                                    <>
                                        {summary && (
                                            <div className="mb-6">
                                                <h2 className="text-xl font-bold mb-4 text-gray-900">Summary</h2>
                                                <div className="prose max-w-none">
                                                    <ReactMarkdown>{summary}</ReactMarkdown>
                                                </div>
                                                {quiz && quiz.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenModal}
                                                        className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                                    >
                                                        Take Quiz ({quiz.length} questions)
                                                    </button>
                                                )}
                                                {(!quiz || quiz.length === 0) && (
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenModal}
                                                        className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                                    >
                                                        Try Sample Quiz (4 questions)
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Panel (30%) */}
                {showSidebar && (
                    <div className="w-5/12 bg-white border-l border-gray-200 p-6">
                        <div className="space-y-6">
                            {/* Focus Tracking */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Focus Tracking</h3>
                                
                                {/* Circular Progress */}
                                <div className="flex justify-center mb-4">
                                    <div className="relative">
                                        <svg className="w-24 h-24 transform -rotate-90">
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="40"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                className="text-gray-200"
                                            />
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="40"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                strokeDashoffset={`${2 * Math.PI * 40 * ((100-distractionScore) / 100)}`}
                                                className={`transition-all duration-300 ${
                                                    100-distractionScore >= 80 ? 'text-green-500' : 
                                                    100-distractionScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                                                }`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-xl font-bold ${getFocusColor(100-distractionScore)}`}>
                                                {Math.round(distractionScore)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-lg font-semibold ${getFocusColor(100-distractionScore)}`}>
                                        {getFocusStatus(100-distractionScore)}
                                    </p>
                                </div>
                            </div>

                            {/* Webcam Feed */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Focus Monitor</h3>
                                <WebcamFeed showStreamImage={true} />
                            </div>

                            {/* Study Timer */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Study Timer</h3>
                                <FocusTimer isPlaying={isPlaying} />
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Audio Analysis</h3>
                                <AudioVisualizer />
                            </div>
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

            {/* Quiz Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Quiz</h2>
                            <button
                                onClick={handleCloseQuiz}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        
                        {quiz && quiz.length > 0 ? (
                            isQuizCompleted ? (
                                // Quiz completion screen
                                <div className="text-gray-700 text-center">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-green-600 mb-2">
                                            Quiz Completed!
                                        </h3>
                                        <div className="text-4xl font-bold text-blue-600 mb-2">
                                            {score}/{quiz.length}
                                        </div>
                                        <div className="text-lg text-gray-600 mb-4">
                                            {Math.round((score / quiz.length) * 100)}% Score
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {score === quiz.length ? "Perfect score! 🎉" : 
                                             score >= quiz.length * 0.8 ? "Great job! 👍" :
                                             score >= quiz.length * 0.6 ? "Good effort! 👏" : "Keep practicing! 💪"}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={resetQuiz}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            Retake Quiz
                                        </button>
                                        <button
                                            onClick={handleCloseQuiz}
                                            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : currentQuestionIndex < quiz.length ? (
                                // Active quiz screen
                                <div className="text-gray-700">
                                    {/* Progress indicator and score */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="text-sm text-gray-500">
                                                Question {currentQuestionIndex + 1} of {quiz.length}
                                            </div>
                                            <div className="text-sm font-semibold text-blue-600">
                                                Score: {score}/{currentQuestionIndex + 1}
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
                                            ></div>
                                        </div>
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
                                                        isAnswered
                                                            ? option === quiz[currentQuestionIndex].answer
                                                                ? 'bg-green-100 border-green-500 text-green-700 font-semibold'
                                                                : selectedAnswer === option
                                                                    ? 'bg-red-100 border-red-500 text-red-700 font-semibold'
                                                                    : 'bg-gray-50 border-gray-300 text-gray-700'
                                                            : selectedAnswer === option
                                                                ? 'bg-blue-100 border-blue-500 text-blue-700'
                                                                : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-700'
                                                    } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{option}</span>
                                                        {isAnswered && (
                                                            <span className="text-lg">
                                                                {option === quiz[currentQuestionIndex].answer 
                                                                    ? '✓' 
                                                                    : selectedAnswer === option && option !== quiz[currentQuestionIndex].answer 
                                                                    ? '✗' 
                                                                    : ''
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Answer feedback */}
                                    {isAnswered && (
                                        <div className={`mb-4 p-4 rounded-lg ${
                                            selectedAnswer === quiz[currentQuestionIndex].answer
                                                ? 'bg-green-50 border border-green-200'
                                                : 'bg-red-50 border border-red-200'
                                        }`}>
                                            <div className="flex items-center">
                                                <span className={`text-lg mr-2 ${
                                                    selectedAnswer === quiz[currentQuestionIndex].answer
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}>
                                                    {selectedAnswer === quiz[currentQuestionIndex].answer ? '✓' : '✗'}
                                                </span>
                                                <span className={`font-semibold ${
                                                    selectedAnswer === quiz[currentQuestionIndex].answer
                                                        ? 'text-green-700'
                                                        : 'text-red-700'
                                                }`}>
                                                    {selectedAnswer === quiz[currentQuestionIndex].answer 
                                                        ? `Correct! The answer is: ${quiz[currentQuestionIndex].answer}` 
                                                        : `Incorrect. The correct answer is: ${quiz[currentQuestionIndex].answer}`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
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
                                <div className="text-gray-700 text-center">
                                    <p>Loading quiz questions...</p>
                                </div>
                            )
                        ) : (
                            <div className="text-gray-700 text-center">
                                <p>No quiz questions available. Please load a video first.</p>
                                <button
                                    onClick={handleCloseQuiz}
                                    className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    )
}

export default Study