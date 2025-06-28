import React, { useState, useEffect, useRef } from 'react';
import { FocusTimer, ScoreGraph } from "./index";

// --- Game Data and Types ---
interface GameData {
  title: string;
  description: string;
  difficulty: number;
  timeLimit: number;
  category: string;
  icon: string;
  pairs?: Array<{ term: string; definition: string }>;
  categories?: Record<string, string[]>;
  events?: Array<{ name: string; order: number }>;
}

const GAME_DATA: Record<string, GameData> = {
  'term-match': {
    title: 'Term Match',
    description: 'Match the terms with their definitions',
    difficulty: 2,
    timeLimit: 60,
    category: 'Vocabulary',
    icon: '🔤',
    pairs: [
      { term: 'Algorithm', definition: 'A step-by-step procedure for solving a problem' },
      { term: 'Variable', definition: 'A storage location with an associated name' },
      { term: 'Function', definition: 'A reusable block of code that performs a specific task' },
      { term: 'Loop', definition: 'A programming construct that repeats a block of code' },
    ]
  },
  'ai-quiz': {
    title: 'AI Quiz Generator',
    description: 'Generate custom quizzes from any content',
    difficulty: 3,
    timeLimit: 120,
    category: 'AI',
    icon: '🧠'
  },
  'snake': {
    title: 'Snake',
    description: 'Classic snake game with educational twist',
    difficulty: 1,
    timeLimit: 120,
    category: 'Logic',
    icon: '🐍'
  },
  'tic-tac-toe': {
    title: 'Tic Tac Toe',
    description: 'Play against AI with strategic thinking',
    difficulty: 1,
    timeLimit: 60,
    category: 'Logic',
    icon: '⭕'
  },
  'concept-sort': {
    title: 'Concept Sort',
    description: 'Drag and drop concepts into the correct categories',
    difficulty: 3,
    timeLimit: 90,
    category: 'Logic',
    icon: '📂',
    categories: {
      'Data Types': ['String', 'Integer', 'Boolean', 'Array'],
      'Control Structures': ['If Statement', 'For Loop', 'While Loop', 'Switch'],
      'Operations': ['Addition', 'Comparison', 'Assignment', 'Logical AND']
    }
  },
  'timeline-challenge': {
    title: 'Timeline Challenge',
    description: 'Arrange these events in chronological order',
    difficulty: 3,
    timeLimit: 75,
    category: 'Logic',
    icon: '📅',
    events: [
      { name: 'Variable Declaration', order: 1 },
      { name: 'Function Definition', order: 2 },
      { name: 'Function Call', order: 3 },
      { name: 'Return Statement', order: 4 },
    ]
  }
};

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const MiniGames: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [score, setScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizContent, setQuizContent] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);

  // Gemini API configuration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  const generateQuizWithGemini = async (content: string, difficulty: string, numQuestions: number) => {
    try {
      const prompt = `Generate ${numQuestions} multiple choice questions based on this content: "${content}". \nDifficulty level: ${difficulty}.\n\nReturn a JSON array with this exact format:\n[\n  {\n    "id": "1",\n    "question": "Question text here?",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": 0,\n    "explanation": "Explanation of why this is correct"\n  }\n]\n\nMake sure correctAnswer is 0-3 (index of correct option).`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) {
        throw new Error('No response from Gemini API');
      }
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Quiz generation error:', error);
      throw error;
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      case 5: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    return labels[level] || 'Unknown';
  };

  const handleGameSelect = (gameType: string) => {
    setSelectedGame(gameType);
    setGameState('playing');
    setScore(0);
    setCurrentScore(0);
    setIsPlaying(true);
    setTimeLeft(GAME_DATA[gameType].timeLimit);
  };

  const handleBackToMenu = () => {
    setGameState('menu');
    setSelectedGame(null);
    setScore(0);
    setCurrentScore(0);
    setIsPlaying(false);
    setTimeLeft(0);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectAnswers(0);
    setShowExplanation(false);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            setGameState('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  // --- AI Quiz Game ---
  const AIQuizGame = () => {
    const handleGenerateQuiz = async () => {
      if (!quizContent.trim()) {
        alert('Please enter some content for the quiz');
        return;
      }
      setIsGeneratingQuiz(true);
      try {
        const questions = await generateQuizWithGemini(quizContent, quizDifficulty, numQuestions);
        setQuizQuestions(questions);
        setCurrentQuestionIndex(0);
        setCorrectAnswers(0);
        setIsAnswered(false);
        setSelectedAnswer(null);
        setShowExplanation(false);
      } catch (error) {
        alert('Failed to generate quiz. Please try again.');
      } finally {
        setIsGeneratingQuiz(false);
      }
    };

    const handleAnswerSelect = (answerIndex: number) => {
      if (isAnswered) return;
      setSelectedAnswer(answerIndex);
      setIsAnswered(true);
      if (answerIndex === quizQuestions[currentQuestionIndex].correctAnswer) {
        setCorrectAnswers(prev => prev + 1);
        setCurrentScore(prev => prev + 10);
      }
      setShowExplanation(true);
    };

    const handleNextQuestion = () => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setShowExplanation(false);
      } else {
        const finalScore = Math.round((correctAnswers / quizQuestions.length) * 100);
        setScore(finalScore);
        setGameState('completed');
      }
    };

    const handlePlayAgain = () => {
      setQuizQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setCorrectAnswers(0);
      setQuizContent('');
    };

    if (quizQuestions.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{GAME_DATA['ai-quiz'].title}</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate custom quizzes from any content using AI!
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content or Topic:</label>
              <textarea
                placeholder="Enter content, paste text, or describe a topic for quiz generation..."
                value={quizContent}
                onChange={(e) => setQuizContent(e.target.value)}
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty:</label>
                <select 
                  value={quizDifficulty} 
                  onChange={(e) => setQuizDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-black"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Questions:</label>
                <select 
                  value={numQuestions} 
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-black"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>
            </div>
            <button 
              onClick={handleGenerateQuiz} 
              disabled={!quizContent.trim() || isGeneratingQuiz}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isGeneratingQuiz ? 'Generating Quiz...' : 'Generate Quiz'}
            </button>
          </div>
        </div>
      );
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{GAME_DATA['ai-quiz'].title}</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
            <span>Score: {correctAnswers}/{currentQuestionIndex + (isAnswered ? 1 : 0)}</span>
          </div>
          <div className="bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-6">
            <h4 className="text-lg font-medium mb-4">{currentQuestion.question}</h4>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    selectedAnswer === index
                      ? index === currentQuestion.correctAnswer
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-red-100 border-red-500 text-red-800'
                      : isAnswered && index === currentQuestion.correctAnswer
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
            {showExplanation && currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">Explanation:</h5>
                <p className="text-blue-700 text-sm">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
          {isAnswered && (
            <div className="flex justify-between">
              <button 
                onClick={handlePlayAgain}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Restart Quiz
              </button>
              <button 
                onClick={handleNextQuestion}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Term Match Game ---
  const TermMatchGame = () => {
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
    const [lastMatch, setLastMatch] = useState<boolean | null>(null);
    const gameData = GAME_DATA['term-match'];

    const handleCardClick = (id: string, index: number, isTerm: boolean) => {
      if (selectedCards.length === 2 || matchedPairs.has(index)) return;
      const newSelected = [...selectedCards, id];
      setSelectedCards(newSelected);
      if (newSelected.length === 2) {
        const [first, second] = newSelected;
        const firstIdx = parseInt(first.split('-')[1]);
        const secondIdx = parseInt(second.split('-')[1]);
        if (
          ((first.startsWith('term') && second.startsWith('def')) ||
            (first.startsWith('def') && second.startsWith('term')))
          && firstIdx === secondIdx
        ) {
          setTimeout(() => {
            setMatchedPairs(prev => new Set([...prev, firstIdx]));
            setSelectedCards([]);
            setLastMatch(true);
            setCurrentScore(prev => prev + 10);
          }, 500);
        } else {
          setTimeout(() => {
            setSelectedCards([]);
            setLastMatch(false);
          }, 800);
        }
      }
    };

    useEffect(() => {
      if (matchedPairs.size === gameData.pairs!.length) {
        setTimeout(() => {
          setScore(matchedPairs.size * 10);
          setGameState('completed');
        }, 500);
      }
    }, [matchedPairs]);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{gameData.title}</h3>
        </div>
        <p className="text-sm text-gray-600">{gameData.description}</p>
        <div className="grid grid-cols-2 gap-4">
          {gameData.pairs!.map((pair, index) => (
            <React.Fragment key={index}>
              <div
                className={`bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-4 cursor-pointer transition-colors ${
                  selectedCards.includes(`term-${index}`) ? 'bg-blue-100' : ''
                } ${matchedPairs.has(index) ? 'bg-green-100' : ''}`}
                onClick={() => handleCardClick(`term-${index}`, index, true)}
              >
                <div className="font-medium text-center">{pair.term}</div>
              </div>
              <div
                className={`bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-4 cursor-pointer transition-colors ${
                  selectedCards.includes(`def-${index}`) ? 'bg-blue-100' : ''
                } ${matchedPairs.has(index) ? 'bg-green-100' : ''}`}
                onClick={() => handleCardClick(`def-${index}`, index, false)}
              >
                <div className="text-sm text-center">{pair.definition}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="font-semibold">Score: {matchedPairs.size * 10}</span>
        </div>
        {lastMatch === false && <div className="text-red-500 text-center">Not a match!</div>}
        {lastMatch === true && <div className="text-green-600 text-center">Matched!</div>}
      </div>
    );
  };

  // --- Snake Game ---
  const SnakeGame = () => {
    const boardSize = 10;
    const [snake, setSnake] = useState([[5, 5]]);
    const [direction, setDirection] = useState<[number, number]>([0, 1]);
    const [food, setFood] = useState<[number, number]>([2, 2]);
    const [gameOver, setGameOver] = useState(false);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (gameOver) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowUp') setDirection([-1, 0]);
        if (e.key === 'ArrowDown') setDirection([1, 0]);
        if (e.key === 'ArrowLeft') setDirection([0, -1]);
        if (e.key === 'ArrowRight') setDirection([0, 1]);
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [gameOver]);

    useEffect(() => {
      if (gameOver) return;
      const id = setInterval(() => {
        setSnake(prev => {
          const newHead = [prev[0][0] + direction[0], prev[0][1] + direction[1]];
          if (
            newHead[0] < 0 || newHead[0] >= boardSize ||
            newHead[1] < 0 || newHead[1] >= boardSize ||
            prev.some(([x, y]) => x === newHead[0] && y === newHead[1])
          ) {
            setGameOver(true);
            setScore(prev.length * 10);
            return prev;
          }
          let newSnake = [newHead, ...prev];
          if (newHead[0] === food[0] && newHead[1] === food[1]) {
            setFood([
              Math.floor(Math.random() * boardSize),
              Math.floor(Math.random() * boardSize)
            ]);
            setCurrentScore(prev => prev + 10);
          } else {
            newSnake.pop();
          }
          return newSnake;
        });
      }, 200);
      setIntervalId(id);
      return () => clearInterval(id);
    }, [direction, food, gameOver]);

    useEffect(() => {
      if (gameOver && intervalId) clearInterval(intervalId);
      if (gameOver) setTimeout(() => setGameState('completed'), 1000);
    }, [gameOver]);

    const handlePlayAgain = () => {
      setSnake([[5, 5]]);
      setDirection([0, 1]);
      setFood([2, 2]);
      setGameOver(false);
      setScore(0);
    };

    return (
      <div className="flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-4">
          <h3 className="text-lg font-semibold">{GAME_DATA['snake'].title}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-4">
          <div className="grid grid-cols-10 gap-0.5 bg-gray-800 p-2 rounded">
            {Array.from({ length: boardSize * boardSize }).map((_, i) => {
              const x = Math.floor(i / boardSize);
              const y = i % boardSize;
              const isSnake = snake.some(([sx, sy]) => sx === x && sy === y);
              const isHead = snake[0][0] === x && snake[0][1] === y;
              const isFood = food[0] === x && food[1] === y;
              return (
                <div
                  key={i}
                  className={`w-5 h-5 rounded ${isHead ? 'bg-green-400' : isSnake ? 'bg-green-700' : isFood ? 'bg-red-500' : 'bg-gray-900'}`}
                />
              );
            })}
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="font-semibold">Score: {snake.length * 10}</span>
        </div>
        {gameOver && <div className="text-red-500 mt-2">Game Over!</div>}
        <div className="text-xs text-gray-400 mt-1">Use arrow keys to move</div>
        {gameOver && (
          <button 
            onClick={handlePlayAgain}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Play Again
          </button>
        )}
      </div>
    );
  };

  // --- Tic Tac Toe Game ---
  const TicTacToeGame = () => {
    const [board, setBoard] = useState<(null | 'X' | 'O')[]>(Array(9).fill(null));
    const [isX, setIsX] = useState(true);
    const [winner, setWinner] = useState<null | 'X' | 'O' | 'draw'>(null);

    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    const checkWinner = (b: (null | 'X' | 'O')[]) => {
      for (const [a, bIdx, c] of lines) {
        if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) return b[a];
      }
      if (b.every(cell => cell)) return 'draw';
      return null;
    };

    const aiMove = (b: (null | 'X' | 'O')[]) => {
      // Try to win
      for (const [a, bIdx, c] of lines) {
        if (b[a] === 'O' && b[bIdx] === 'O' && b[c] === null) return c;
        if (b[a] === 'O' && b[c] === 'O' && b[bIdx] === null) return bIdx;
        if (b[bIdx] === 'O' && b[c] === 'O' && b[a] === null) return a;
      }
      // Block X
      for (const [a, bIdx, c] of lines) {
        if (b[a] === 'X' && b[bIdx] === 'X' && b[c] === null) return c;
        if (b[a] === 'X' && b[c] === 'X' && b[bIdx] === null) return bIdx;
        if (b[bIdx] === 'X' && b[c] === 'X' && b[a] === null) return a;
      }
      // Otherwise random
      const empty = b.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
      if (empty.length > 0) {
        return empty[Math.floor(Math.random() * empty.length)];
      }
      return null;
    };

    const handleClick = (idx: number) => {
      if (board[idx] || winner) return;
      const newBoard = [...board];
      newBoard[idx] = isX ? 'X' : 'O';
      setBoard(newBoard);
      setIsX(!isX);
    };

    useEffect(() => {
      const w = checkWinner(board);
      if (w) {
        setWinner(w);
        setTimeout(() => {
          setScore(w === 'X' ? 100 : w === 'draw' ? 50 : 0);
          setGameState('completed');
        }, 1000);
      } else if (!isX) {
        const move = aiMove(board);
        if (move !== null && winner === null) {
          setTimeout(() => {
            setBoard(b => {
              const nb = [...b];
              nb[move] = 'O';
              return nb;
            });
            setIsX(true);
          }, 500);
        }
      }
    }, [board, isX]);

    const handlePlayAgain = () => {
      setBoard(Array(9).fill(null));
      setIsX(true);
      setWinner(null);
      setScore(0);
    };

    return (
      <div className="flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-4">
          <h3 className="text-lg font-semibold">{GAME_DATA['tic-tac-toe'].title}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-4">
          <div className="grid grid-cols-3 gap-1 bg-gray-800 p-2 rounded">
            {board.map((cell, i) => (
              <button
                key={i}
                className={`w-12 h-12 text-2xl font-bold rounded bg-gray-900 text-white ${cell ? 'cursor-not-allowed' : 'hover:bg-blue-600'}`}
                onClick={() => handleClick(i)}
                disabled={!!cell || !!winner}
              >
                {cell}
              </button>
            ))}
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="font-semibold">Score: {winner === 'X' ? 100 : winner === 'draw' ? 50 : winner === 'O' ? 0 : 0}</span>
        </div>
        {winner && <div className="mt-2 text-lg font-semibold text-green-400">{winner === 'draw' ? 'Draw!' : `${winner} wins!`}</div>}
        <div className="text-xs text-gray-400 mt-1">You are X. AI is O.</div>
        {winner && (
          <button 
            onClick={handlePlayAgain}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Play Again
          </button>
        )}
      </div>
    );
  };

  if (gameState === 'playing' && selectedGame) {
    return (
      <main className="dashboard wrapper">
        <div className="min-h-screen bg-white text-black p-6">
          <div className="flex justify-start items-start gap-20">
            {/* Left Section: Game + ScoreGraph */}
            <div className="flex flex-col gap-4 w-full max-w-2xl">
              {/* Game Container */}
              <div className="bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-4 transition-all">
                {selectedGame === 'term-match' && <TermMatchGame />}
                {selectedGame === 'ai-quiz' && <AIQuizGame />}
                {selectedGame === 'snake' && <SnakeGame />}
                {selectedGame === 'tic-tac-toe' && <TicTacToeGame />}
                {(selectedGame === 'concept-sort' || selectedGame === 'timeline-challenge') && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold mb-4">{GAME_DATA[selectedGame].title}</h3>
                    <p>This game is coming soon!</p>
                    <button 
                      onClick={handleBackToMenu}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Back to Menu
                    </button>
                  </div>
                )}
              </div>
              {/* Score Graph Box */}
              <div className="bg-[#f0f9ff] rounded-2xl border border-blue-300 shadow-[0_0_20px_rgba(0,200,120,0.15)] p-4 transition-all">
                <ScoreGraph />
              </div>
            </div>
            {/* Right Section: Timer + Current Score */}
            <div className="flex flex-col items-center gap-6 w-72">
              {/* Timer Container */}
              <div className="bg-[#f0f9ff] rounded-xl border border-blue-300/40 p-4 w-full">
                <FocusTimer isPlaying={isPlaying} />
              </div>
              {/* Current Score Container */}
              <div className="bg-[#f0f9ff] rounded-xl border border-blue-300/40 p-4 w-full">
                <div className="text-center">
                  <h4 className="font-semibold text-lg mb-2">Current Score</h4>
                  <div className="text-3xl font-bold text-blue-600">{currentScore}</div>
                  <div className="text-sm text-gray-600 mt-1">Time Left: {timeLeft}s</div>
                </div>
              </div>
              {/* Back to Menu Button */}
              <div className="w-full">
                <button 
                  onClick={handleBackToMenu}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (gameState === 'completed') {
    return (
      <main className="dashboard wrapper">
        <div className="min-h-screen bg-white text-black p-6">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] p-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">Great Job!</h3>
              <p className="text-gray-600 mb-4">You scored {score} points!</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleBackToMenu}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Back to Menu
                </button>
                {selectedGame && (
                  <button 
                    onClick={() => handleGameSelect(selectedGame)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Play Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard wrapper">
      <div className="min-h-screen bg-white text-black p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Educational Games</h1>
          <p className="text-gray-600">Choose from our collection of learning games</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(GAME_DATA).map(([gameType, game]) => (
            <div key={gameType} className="bg-white rounded-2xl border border-blue-200 shadow-[0_0_20px_rgba(0,150,255,0.15)] hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{game.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{game.title}</h3>
                      <p className="text-sm text-gray-500">{game.category}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                    {getDifficultyLabel(game.difficulty)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{game.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span>⏱️</span>
                      <span>{game.timeLimit}s</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>⭐</span>
                      <span>{game.difficulty}/5</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => handleGameSelect(gameType)}
                >
                  🎮 Play Game
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default MiniGames; 