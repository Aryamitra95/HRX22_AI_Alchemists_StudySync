import React, { useState, useEffect, useCallback } from 'react'
import {Header, Lifetime, Month, ProgressTab} from "../../../components";
import {getUser} from "~/appwrite/auth";
import {getUserPlaylistsWithVideos} from '../../appwrite/playlists';
import type {Route} from './+types/dashboard';

interface User {
    name: string;
    // other user properties
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

export const clientLoader = async ()=> await getUser();

const Dashboard = ({loaderData}:Route.ComponentProps) => {
    const user = (loaderData ?? null) as User | null;
    
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [studyStats, setStudyStats] = useState({
        totalStudyTime: 0,
        videosCompleted: 0,
        currentStreak: 7,
        focusScore: 85
    });

    // Fetch playlists from Appwrite
    const fetchPlaylists = useCallback(async () => {
        try {
            const userPlaylistsWithVideos = await getUserPlaylistsWithVideos();
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
            
            // Calculate stats from playlists
            const totalVideos = convertedPlaylists.reduce((acc, playlist) => acc + playlist.videos.length, 0);
            const completedVideos = convertedPlaylists.reduce((acc, playlist) => 
                acc + playlist.videos.filter(video => video.progress === 100).length, 0
            );
            
            setStudyStats(prev => ({
                ...prev,
                videosCompleted: completedVideos,
                totalStudyTime: Math.floor(Math.random() * 50) + 20 // Mock data for now
            }));
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    }, []);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    // This will be called by ProgressTab after any mutation
    const handlePlaylistsUpdate = () => {
        fetchPlaylists();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                {getGreeting()}, {user?.name ?? 'Guest'}! 👋
                            </h1>
                            <p className="text-blue-100 text-lg">
                                Ready to boost your learning today?
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{studyStats.currentStreak}</div>
                            <div className="text-blue-100">Day Streak 🔥</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Study Time</p>
                                <p className="text-2xl font-bold text-gray-900">{studyStats.totalStudyTime}h</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Videos Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{studyStats.videosCompleted}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Current Streak</p>
                                <p className="text-2xl font-bold text-gray-900">{studyStats.currentStreak} days</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Focus Score</p>
                                <p className="text-2xl font-bold text-gray-900">{studyStats.focusScore}%</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="flex gap-4">
                        <a href="/study" className="flex-1 flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Start Study Session
                        </a>
                        <a href="/reports" className="flex-1 flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            View Reports
                        </a>
                        <a href="/admin/playlist" className="flex-1 flex items-center justify-center p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Playlist
                        </a>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Lifetime Progress</h3>
                        <Lifetime/>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Overview</h3>
                        <Month/>
                    </div>
                </div>

                {/* Progress Tab Component */}
                
                    <div className="p-6">
                        <ProgressTab 
                            playlists={playlists}
                            onPlaylistsUpdate={handlePlaylistsUpdate}
                        />
                    </div>
                
            </div>
        </main>
    )
}

export default Dashboard
