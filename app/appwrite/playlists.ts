'use client';

import { database, appwriteConfig } from "./client";
import { ID, Query } from "appwrite";
import { getCurrentUser } from "./auth";

// Collection IDs - you'll need to create these in your Appwrite console
const PLAYLISTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PLAYLISTS_COLLECTION_ID || 'playlists';
const VIDEOS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_VIDEOS_COLLECTION_ID || 'videos';

export interface Video {
  id: string;
  title: string;
  videoId: string; // YouTube video ID
  progress?: number;
  playlistId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  videoCount: number;
}

export interface PlaylistWithVideos extends Playlist {
  videos: Video[];
}

/**
 * Create a new playlist
 */
export const createPlaylist = async (name: string, description?: string): Promise<Playlist | null> => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    const playlist = await database.createDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      ID.unique(),
      {
        name,
        userId: currentUserId,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        videoCount: 0
      }
    );

    return {
      id: playlist.$id,
      name: playlist.name,
      userId: playlist.userId,
      description: playlist.description,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      videoCount: playlist.videoCount
    };
  } catch (error) {
    console.error("Error creating playlist:", error);
    alert(`Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Get all playlists for a user
 */
export const getUserPlaylists = async (): Promise<Playlist[]> => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    const response = await database.listDocuments(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      [Query.equal("userId", currentUserId), Query.orderDesc("updatedAt")]
    );

    return response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      userId: doc.userId,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      videoCount: doc.videoCount
    }));
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    alert(`Failed to fetch playlists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

/**
 * Get a playlist with all its videos
 */
export const getPlaylistWithVideos = async (playlistId: string): Promise<PlaylistWithVideos | null> => {
  try {
    // Get playlist
    const playlist = await database.getDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      playlistId
    );

    // Get videos for this playlist
    const videosResponse = await database.listDocuments(
      appwriteConfig.databaseId,
      VIDEOS_COLLECTION_ID,
      [Query.equal("playlistId", playlistId), Query.orderAsc("createdAt")]
    );

    const videos = videosResponse.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      videoId: doc.videoId,
      progress: doc.progress || 0,
      playlistId: doc.playlistId,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return {
      id: playlist.$id,
      name: playlist.name,
      userId: playlist.userId,
      description: playlist.description,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      videoCount: playlist.videoCount,
      videos
    };
  } catch (error) {
    console.error("Error fetching playlist with videos:", error);
    alert(`Failed to fetch playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Add a video to a playlist
 */
export const addVideoToPlaylist = async (
  playlistId: string, 
  videoId: string, 
  title: string
): Promise<Video | null> => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    // Validate YouTube video ID
    if (!videoId || videoId.length < 10) {
      throw new Error("Invalid YouTube video ID");
    }

    // Create video document
    const video = await database.createDocument(
      appwriteConfig.databaseId,
      VIDEOS_COLLECTION_ID,
      ID.unique(),
      {
        videoId,
        title,
        playlistId,
        userId: currentUserId,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    // Update playlist video count
    const playlist = await database.getDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      playlistId
    );

    await database.updateDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      playlistId,
      {
        videoCount: playlist.videoCount + 1,
        updatedAt: new Date().toISOString()
      }
    );

    return {
      id: video.$id,
      title: video.title,
      videoId: video.videoId,
      progress: video.progress,
      playlistId: video.playlistId,
      userId: video.userId,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt
    };
  } catch (error) {
    console.error("Error adding video to playlist:", error);
    alert(`Failed to add video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

/**
 * Update video progress
 */
export const updateVideoProgress = async (videoId: string, progress: number): Promise<boolean> => {
  try {
    await database.updateDocument(
      appwriteConfig.databaseId,
      VIDEOS_COLLECTION_ID,
      videoId,
      {
        progress,
        updatedAt: new Date().toISOString()
      }
    );
    return true;
  } catch (error) {
    console.error("Error updating video progress:", error);
    alert(`Failed to update progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Delete a playlist and all its videos
 */
export const deletePlaylist = async (playlistId: string): Promise<boolean> => {
  try {
    // Delete all videos in the playlist first
    const videosResponse = await database.listDocuments(
      appwriteConfig.databaseId,
      VIDEOS_COLLECTION_ID,
      [Query.equal("playlistId", playlistId)]
    );

    // Delete each video
    for (const video of videosResponse.documents) {
      await database.deleteDocument(
        appwriteConfig.databaseId,
        VIDEOS_COLLECTION_ID,
        video.$id
      );
    }

    // Delete the playlist
    await database.deleteDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      playlistId
    );

    return true;
  } catch (error) {
    console.error("Error deleting playlist:", error);
    alert(`Failed to delete playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Delete a video from a playlist
 */
export const deleteVideoFromPlaylist = async (videoId: string, playlistId: string): Promise<boolean> => {
  try {
    // Delete the video
    await database.deleteDocument(
      appwriteConfig.databaseId,
      VIDEOS_COLLECTION_ID,
      videoId
    );

    // Update playlist video count
    const playlist = await database.getDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      playlistId
    );

    await database.updateDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      playlistId,
      {
        videoCount: Math.max(0, playlist.videoCount - 1),
        updatedAt: new Date().toISOString()
      }
    );

    return true;
  } catch (error) {
    console.error("Error deleting video from playlist:", error);
    alert(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Update playlist details
 */
export const updatePlaylist = async (
  playlistId: string, 
  updates: { name?: string; description?: string }
): Promise<boolean> => {
  try {
    await database.updateDocument(
      appwriteConfig.databaseId,
      PLAYLISTS_COLLECTION_ID,
      playlistId,
      {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    );
    return true;
  } catch (error) {
    console.error("Error updating playlist:", error);
    alert(`Failed to update playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Get all playlists with videos for a user (optimized for dashboard)
 */
export const getUserPlaylistsWithVideos = async (): Promise<PlaylistWithVideos[]> => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) {
      throw new Error("User not authenticated");
    }

    // Get all playlists
    const playlists = await getUserPlaylists();
    
    // Get all videos for this user
    const videosResponse = await database.listDocuments(
      appwriteConfig.databaseId,
      VIDEOS_COLLECTION_ID,
      [Query.equal("userId", currentUserId)]
    );

    const videos = videosResponse.documents.map(doc => ({
      id: doc.$id,
      title: doc.title,
      videoId: doc.videoId,
      progress: doc.progress || 0,
      playlistId: doc.playlistId,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    // Group videos by playlist
    const playlistsWithVideos = playlists.map(playlist => ({
      ...playlist,
      videos: videos.filter(video => video.playlistId === playlist.id)
    }));

    return playlistsWithVideos;
  } catch (error) {
    console.error("Error fetching user playlists with videos:", error);
    alert(`Failed to fetch playlists with videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}; 