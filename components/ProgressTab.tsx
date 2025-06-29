import React, { useState } from 'react';
import { getCurrentUser } from '../app/appwrite/auth';
import { 
  createPlaylist as createPlaylistDB, 
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
  onPlaylistsUpdate?: () => void;
}

type ModalType = 'createPlaylist' | 'addVideo' | null;

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
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(playlists[0]?.id || null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setIsLoading(true);
    try {
      const newPlaylist = await createPlaylistDB(
        newPlaylistName.trim(), 
        'Custom playlist'
      );
      if (newPlaylist) {
        setNewPlaylistName('');
        setModalType(null);
        if (onAddPlaylist) {
          onAddPlaylist(newPlaylistName.trim());
        }
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate();
        }
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(`Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!selectedPlaylistId || !newVideoUrl.trim() || !newVideoTitle.trim()) return;
    setIsLoading(true);
    try {
      const videoId = extractVideoId(newVideoUrl.trim());
      if (!videoId || videoId.length < 10) {
        alert('Invalid YouTube video ID. Please check the URL.');
        return;
      }
      const newVideo = await addVideoToPlaylistDB(
        selectedPlaylistId,
        videoId,
        newVideoTitle.trim()
      );
      if (newVideo) {
        setNewVideoUrl('');
        setNewVideoTitle('');
        setModalType(null);
        if (onAddVideoToPlaylist) {
          onAddVideoToPlaylist(selectedPlaylistId, videoId, newVideoTitle.trim());
        }
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate();
        }
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert(`Failed to add video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const success = await deletePlaylistDB(playlistId);
      if (success) {
        if (onDeletePlaylist) {
          onDeletePlaylist(playlistId);
        }
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate();
        }
        if (selectedPlaylistId === playlistId) {
          setSelectedPlaylistId(playlists[0]?.id || null);
        }
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert(`Failed to delete playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteVideo = async (playlistId: string, videoId: string) => {
    try {
      const success = await deleteVideoFromPlaylistDB(videoId, playlistId);
      if (success) {
        if (onDeleteVideo) {
          onDeleteVideo(playlistId, videoId);
        }
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate();
        }
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : url;
  };

  const closeModal = () => {
    setModalType(null);
    setNewPlaylistName('');
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Your Playlists</h3>
          <button
            onClick={() => setModalType('createPlaylist')}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Playlist
          </button>
        </div>
        <div className="p-6 bg-gray-50">
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 mt-2">Loading playlists...</p>
            </div>
          )}
          
          {!isLoading && (
            <>
              <div className="flex gap-3 mb-6 flex-wrap">
                {playlists.map(playlist => (
                  <div key={playlist.id} className="relative group">
                    <button
                      className={`px-5 py-2 rounded-lg text-sm font-semibold shadow transition-all ${
                        playlist.id === selectedPlaylistId
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-600'
                      }`}
                      onClick={() => {
                        setSelectedPlaylistId(playlist.id);
                        onPlaylistSelect?.(playlist.id);
                      }}
                    >
                      {playlist.name}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="Delete playlist"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {selectedPlaylist ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Videos in <span className="text-blue-600 font-bold">"{selectedPlaylist.name}"</span>
                    </h4>
                    <button
                      onClick={() => setModalType('addVideo')}
                      className="text-blue-600 text-sm font-semibold hover:text-blue-800 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Video
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {selectedPlaylist.videos.length === 0 && (
                      <li className="text-gray-400 text-sm italic">No videos in this playlist.</li>
                    )}
                    {selectedPlaylist.videos.map(video => (
                      <li key={video.id} className="flex items-center gap-2 group bg-white rounded-lg px-3 py-2 shadow hover:bg-blue-50 transition">
                        <button
                          className="flex-1 text-left text-blue-700 font-medium hover:text-blue-900"
                          onClick={() => onVideoSelect?.(video.id, video.title)}
                        >
                          {video.title}
                        </button>
                        {video.progress !== undefined && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                            {video.progress}% watched
                          </span>
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
                <div className="text-gray-400 text-sm italic">Select a playlist to view its videos.</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Unified Modal */}
      {modalType && (
        <div className="flex items-center justify-center ">
        
          <div className="bg-white rounded-lg p-6 w-96">
            {modalType === 'createPlaylist' && (
              <>
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
                    onClick={closeModal}
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
              </>
            )}

            {modalType === 'addVideo' && (
              <>
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
                    onClick={closeModal}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
    
  );
};

export default ProgressTab; 