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
                    onPlaylistsUpdate={handlePlaylistsUpdate}
                />
            </div>

        </main>

    )
}
export default Dashboard
