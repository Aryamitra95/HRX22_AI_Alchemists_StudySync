import React, { useState } from 'react'
import {Header, Lifetime, Month, ProgressTab} from "../../../components";
import {getUser} from "~/appwrite/auth";
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
    
    const [playlists, setPlaylists] = useState<Playlist[]>([
        {
            id: '1',
            name: 'React Fundamentals',
            videos: [
                { id: 'video1', title: 'Introduction to React', progress: 75 },
                { id: 'video2', title: 'Components and Props', progress: 50 },
                { id: 'video3', title: 'State and Lifecycle', progress: 0 }
            ]
        },
        {
            id: '2',
            name: 'Advanced JavaScript',
            videos: [
                { id: 'video4', title: 'ES6 Features', progress: 100 },
                { id: 'video5', title: 'Async/Await', progress: 25 }
            ]
        }
    ]);

    const handlePlaylistSelect = (playlistId: string) => {
        console.log('Selected playlist:', playlistId);
        // Handle playlist selection - could open in video player
    };

    const handleVideoSelect = (videoId: string, title: string) => {
        console.log('Selected video:', videoId, title);
        // Handle video selection - could open in video player
    };

    const handleAddPlaylist = (name: string) => {
        console.log('Adding playlist:', name);
        // This will be handled by ProgressTab internally with Appwrite
    };

    const handleAddVideoToPlaylist = (playlistId: string, videoId: string, title: string) => {
        console.log('Adding video to playlist:', playlistId, videoId, title);
        // This will be handled by ProgressTab internally with Appwrite
    };

    const handleDeletePlaylist = (playlistId: string) => {
        console.log('Deleting playlist:', playlistId);
        // This will be handled by ProgressTab internally with Appwrite
    };

    const handleDeleteVideo = (playlistId: string, videoId: string) => {
        console.log('Deleting video from playlist:', playlistId, videoId);
        // This will be handled by ProgressTab internally with Appwrite
    };

    const handlePlaylistsUpdate = (updatedPlaylists: Playlist[]) => {
        setPlaylists(updatedPlaylists);
    };

    return (
        <main className="dashboard wrapper">
            <Header
            title ={`Welcome ${user?.name ?? 'Guest'}👋`}
            description = "Track concentration level."
            />
            <div className="charts-container grid grid-cols-2 gap-4 mb-6">
                <Lifetime/>
                <Month/>
            </div>

            {/* Progress Tab Component */}
            <div className="mt-6">
                <ProgressTab 
                    playlists={playlists}
                    onPlaylistSelect={handlePlaylistSelect}
                    onVideoSelect={handleVideoSelect}
                    onAddPlaylist={handleAddPlaylist}
                    onAddVideoToPlaylist={handleAddVideoToPlaylist}
                    onDeletePlaylist={handleDeletePlaylist}
                    onDeleteVideo={handleDeleteVideo}
                    onPlaylistsUpdate={handlePlaylistsUpdate}
                />
            </div>

        </main>

    )
}
export default Dashboard
