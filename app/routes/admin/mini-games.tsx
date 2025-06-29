import React, { useState, useRef } from 'react';
import MiniGames from '../../../components/MiniGames';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress: number;
    maxProgress: number;
}

interface GameCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    gameCount: number;
    color: string;
}

const MiniGamesPage = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const gamesSectionRef = useRef<HTMLDivElement>(null);

    // Mock data for achievements
    const achievements: Achievement[] = [
        {
            id: '1',
            name: 'First Steps',
            description: 'Complete your first game',
            icon: '🎯',
            unlocked: true,
            progress: 1,
            maxProgress: 1
        },
        {
            id: '2',
            name: 'Speed Demon',
            description: 'Complete 10 games in under 5 minutes each',
            icon: '⚡',
            unlocked: false,
            progress: 7,
            maxProgress: 10
        },
        {
            id: '3',
            name: 'Perfect Score',
            description: 'Get 100% accuracy in any game',
            icon: '🏆',
            unlocked: true,
            progress: 1,
            maxProgress: 1
        },
        {
            id: '4',
            name: 'Streak Master',
            description: 'Play games for 7 consecutive days',
            icon: '🔥',
            unlocked: false,
            progress: 4,
            maxProgress: 7
        }
    ];

    const gameCategories: GameCategory[] = [
        {
            id: 'memory',
            name: 'Memory Enhancing',
            description: 'Improve your memory and recall',
            icon: '🧠',
            gameCount: 5,
            color: 'bg-blue-500'
        },
        {
            id: 'focus',
            name: 'Focus Training',
            description: 'Enhance concentration skills',
            icon: '🎯',
            gameCount: 3,
            color: 'bg-green-500'
        },
        {
            id: 'speed',
            name: 'Speed Challenges',
            description: 'Test your reaction time',
            icon: '⚡',
            gameCount: 4,
            color: 'bg-yellow-500'
        },
        {
            id: 'logic',
            name: 'Logic Puzzles',
            description: 'Solve complex problems',
            icon: '🧩',
            gameCount: 6,
            color: 'bg-purple-500'
        }
    ];

    const unlockedAchievements = achievements.filter(a => a.unlocked).length;
    const totalAchievements = achievements.length;

    const handleStartChallenge = () => {
        gamesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">🎮 Mini Games</h1>
                            <p className="text-gray-600 mt-1">Train your brain with fun educational games</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAchievements(!showAchievements)}
                                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <span className="mr-2">🏆</span>
                                Achievements ({unlockedAchievements}/{totalAchievements})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Games Played</p>
                                <p className="text-2xl font-bold text-gray-900">24</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🎮</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Best Score</p>
                                <p className="text-2xl font-bold text-gray-900">98%</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🏆</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Current Streak</p>
                                <p className="text-2xl font-bold text-gray-900">5 days</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🔥</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Time</p>
                                <p className="text-2xl font-bold text-gray-900">2.5h</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">⏱️</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Game Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {gameCategories.map((category) => (
                        <div
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all cursor-pointer ${
                                selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                        >
                            <div className="text-center">
                                <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                    <span className="text-3xl">{category.icon}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                                <div className="text-sm text-gray-500">{category.gameCount} games available</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Achievements Panel */}
                {showAchievements && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {achievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className={`p-4 rounded-lg border transition-all ${
                                        achievement.unlocked
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center mb-3">
                                        <span className="text-2xl mr-3">{achievement.icon}</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                                            <p className="text-sm text-gray-600">{achievement.description}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${
                                                achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {achievement.progress}/{achievement.maxProgress}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Daily Challenge */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Daily Challenge</h2>
                            <p className="text-blue-100">Complete today's memory challenge to earn bonus points!</p>
                        </div>
                        <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors" onClick={handleStartChallenge}>
                            Start Challenge
                        </button>
                    </div>
                </div>

                {/* Mini Games Component */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200" ref={gamesSectionRef}>
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">
                            {selectedCategory 
                                ? `${gameCategories.find(c => c.id === selectedCategory)?.name} Games`
                                : 'All Games'
                            }
                        </h2>
                    </div>
                    <div className="p-6">
                        <MiniGames />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default MiniGamesPage;
