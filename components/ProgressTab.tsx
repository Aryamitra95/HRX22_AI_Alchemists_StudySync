import React, { useState, useEffect } from 'react';
import { getUser } from '../app/appwrite/auth';
import { 
  createPlaylist as createPlaylistDB, 
  getUserPlaylistsWithVideos,
  addVideoToPlaylist as addVideoToPlaylistDB,
  deletePlaylist as deletePlaylistDB,
  deleteVideoFromPlaylist as deleteVideoFromPlaylistDB,
  updateVideoProgress,
  type PlaylistWithVideos as PlaylistWithVideosDB
} from '../app/appwrite/playlists';

interface Video {
  id: string;
  title: string;
  progress?: number; // percent watched
}

interface Playlist {
  id: string;
  name: string;
  videos: Video[];
}

interface ProgressTabProps {
  playlists: Playlist[];
  onPlaylistSelect?: (playlistId: string) => void;
  onVideoSelect?: (videoId: string, title: string) => void;
  onAddPlaylist?: (name: string) => void;
  onAddVideoToPlaylist?: (playlistId: string, videoId: string, title: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  onDeleteVideo?: (playlistId: string, videoId: string) => void;
  onPlaylistsUpdate?: (playlists: Playlist[]) => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({ 
  playlists, 
  onPlaylistSelect, 
  onVideoSelect,
  onAddPlaylist,
  onAddVideoToPlaylist,
  onDeletePlaylist,
  onDeleteVideo,
  onPlaylistsUpdate
}) => {
  const [user, setUser] = useState<any>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(playlists[0]?.id || null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

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

  // Fetch playlists from database when user is available
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const userPlaylistsWithVideos = await getUserPlaylistsWithVideos(user.name || 'user1');
        
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
        
        // Update parent component with new playlists
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate(convertedPlaylists);
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [user]);

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    setIsLoading(true);
    try {
      const newPlaylist = await createPlaylistDB(
        newPlaylistName.trim(), 
        user.name || 'user1',
        'Custom playlist'
      );

      if (newPlaylist) {
        const convertedPlaylist: Playlist = {
          id: newPlaylist.id,
          name: newPlaylist.name,
          videos: []
        };

        // Update parent component
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate([convertedPlaylist, ...playlists]);
        }
        
        setNewPlaylistName('');
        setShowCreatePlaylist(false);
        
        // Call parent handler if provided
        if (onAddPlaylist) {
          onAddPlaylist(newPlaylistName.trim());
        }
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!user || !selectedPlaylistId || !newVideoUrl.trim() || !newVideoTitle.trim()) return;

    setIsLoading(true);
    try {
      // Extract video ID from YouTube URL
      const videoId = extractVideoId(newVideoUrl.trim());
      
      const newVideo = await addVideoToPlaylistDB(
        selectedPlaylistId,
        videoId,
        newVideoTitle.trim(),
        user.name || 'user1'
      );

      if (newVideo) {
        // Update the selected playlist with new video
        const updatedPlaylists = playlists.map(playlist => {
          if (playlist.id === selectedPlaylistId) {
            return {
              ...playlist,
              videos: [...playlist.videos, {
                id: newVideo.id,
                title: newVideo.title,
                progress: newVideo.progress || 0
              }]
            };
          }
          return playlist;
        });

        // Update parent component
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate(updatedPlaylists);
        }

        setNewVideoUrl('');
        setNewVideoTitle('');
        setShowAddVideo(false);
        
        // Call parent handler if provided
        if (onAddVideoToPlaylist) {
          onAddVideoToPlaylist(selectedPlaylistId, videoId, newVideoTitle.trim());
        }
      }
    } catch (error) {
      console.error('Error adding video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const success = await deletePlaylistDB(playlistId);
      
      if (success) {
        const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
        
        // Update parent component
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate(updatedPlaylists);
        }
        
        if (selectedPlaylistId === playlistId) {
          setSelectedPlaylistId(updatedPlaylists[0]?.id || null);
        }
        
        // Call parent handler if provided
        if (onDeletePlaylist) {
          onDeletePlaylist(playlistId);
        }
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handleDeleteVideo = async (playlistId: string, videoId: string) => {
    try {
      const success = await deleteVideoFromPlaylistDB(videoId, playlistId);
      
      if (success) {
        const updatedPlaylists = playlists.map(playlist => {
          if (playlist.id === playlistId) {
            return {
              ...playlist,
              videos: playlist.videos.filter(video => video.id !== videoId)
            };
          }
          return playlist;
        });

        // Update parent component
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate(updatedPlaylists);
        }
        
        // Call parent handler if provided
        if (onDeleteVideo) {
          onDeleteVideo(playlistId, videoId);
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : url;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Your Playlists</h3>
            <button
              onClick={() => setShowCreatePlaylist(true)}
              disabled={isLoading}
              className="bg-[#0056D3] text-white px-3 py-1 rounded-md text-sm hover:bg-[#0047B3] flex items-center gap-1 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Playlist
            </button>
          </div>
        </div>
        <div className="p-4">
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0056D3]"></div>
              <p className="text-sm text-gray-500 mt-2">Loading playlists...</p>
            </div>
          )}
          
          {!isLoading && (
            <>
              <div className="flex gap-2 mb-4 flex-wrap">
                {playlists.map(playlist => (
                  <div key={playlist.id} className="relative group">
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        playlist.id === selectedPlaylistId 
                          ? 'bg-[#0056D3] text-white' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-[#0056D3]'
                      }`}
                      onClick={() => {
                        setSelectedPlaylistId(playlist.id);
                        onPlaylistSelect?.(playlist.id);
                      }}
                    >
                      {playlist.name}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete playlist"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {selectedPlaylist ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900">Videos in "{selectedPlaylist.name}"</h4>
                    <button
                      onClick={() => setShowAddVideo(true)}
                      className="text-[#0056D3] text-sm hover:text-[#0047B3] flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Video
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {selectedPlaylist.videos.length === 0 && (
                      <li className="text-gray-500 text-sm">No videos in this playlist.</li>
                    )}
                    {selectedPlaylist.videos.map(video => (
                      <li key={video.id} className="flex items-center gap-2 group">
                        <button
                          className="px-2 py-1 text-left text-sm text-[#0056D3] hover:text-[#0047B3] hover:bg-blue-50 rounded flex-1"
                          onClick={() => onVideoSelect?.(video.id, video.title)}
                        >
                          {video.title}
                        </button>
                        {video.progress !== undefined && (
                          <span className="text-xs text-gray-500">{video.progress}% watched</span>
                        )}
                        <button
                          onClick={() => handleDeleteVideo(selectedPlaylist.id, video.id)}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove video"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Select a playlist to view its videos.</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Playlist Dialog */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Playlist</h3>
            <input
              type="text"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreatePlaylist(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={isLoading}
                className="px-4 py-2 bg-[#0056D3] text-white rounded-md hover:bg-[#0047B3] disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Dialog */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Video to Playlist</h3>
            <input
              type="text"
              placeholder="YouTube URL..."
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <input
              type="text"
              placeholder="Video title..."
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddVideo(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={isLoading}
                className="px-4 py-2 bg-[#0056D3] text-white rounded-md hover:bg-[#0047B3] disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTab; 