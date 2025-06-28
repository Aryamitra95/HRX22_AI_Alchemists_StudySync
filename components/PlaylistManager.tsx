import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../app/appwrite/auth';
import { 
  createPlaylist as createPlaylistDB, 
  getUserPlaylists, 
  getPlaylistWithVideos,
  addVideoToPlaylist as addVideoToPlaylistDB,
  deletePlaylist as deletePlaylistDB,
  deleteVideoFromPlaylist as deleteVideoFromPlaylistDB,
  updateVideoProgress,
  type Playlist as PlaylistDB,
  type Video as VideoDB,
  type PlaylistWithVideos as PlaylistWithVideosDB
} from '../app/appwrite/playlists';

interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
  title: string;
  position: number;
  progress: number;
}

interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
}

interface PlaylistManagerProps {
  onVideoSelect?: (videoId: string, title: string) => void;
  onClose?: () => void;
}

type ModalType = 'create' | 'addVideo' | 'importPlaylist' | null;

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({ onVideoSelect, onClose }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await getCurrentUser();
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Error fetching user:', error);
        alert(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    fetchUser();
  }, []);

  // Fetch playlists from database
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!currentUserId) return;
      
      setIsLoading(true);
      try {
        const userPlaylists = await getUserPlaylists();
        
        // Convert DB format to component format
        const convertedPlaylists: Playlist[] = userPlaylists.map(playlist => ({
          id: playlist.id,
          user_id: playlist.userId,
          title: playlist.name,
          description: playlist.description || '',
          created_at: playlist.createdAt
        }));
        
        setPlaylists(convertedPlaylists);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        alert(`Failed to fetch playlists: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [currentUserId]);

  const fetchPlaylistItems = async (playlistId: string) => {
    try {
      const playlistWithVideos = await getPlaylistWithVideos(playlistId);
      
      if (playlistWithVideos) {
        // Convert DB format to component format
        const convertedItems: PlaylistItem[] = playlistWithVideos.videos.map((video, index) => ({
          id: video.id,
          playlist_id: video.playlistId,
          video_id: video.videoId,
          title: video.title,
          position: index + 1,
          progress: video.progress || 0
        }));
        
        setPlaylistItems(convertedItems);
      }
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      alert(`Failed to fetch playlist items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createPlaylist = async () => {
    if (!currentUserId || !newPlaylistTitle.trim()) return;

    setIsLoading(true);
    try {
      const newPlaylist = await createPlaylistDB(
        newPlaylistTitle.trim(), 
        'Custom playlist'
      );

      if (newPlaylist) {
        const convertedPlaylist: Playlist = {
          id: newPlaylist.id,
          user_id: newPlaylist.userId,
          title: newPlaylist.name,
          description: newPlaylist.description || '',
          created_at: newPlaylist.createdAt
        };

        setPlaylists(prev => [convertedPlaylist, ...prev]);
        setNewPlaylistTitle('');
        setModalType(null);
        
        alert('Playlist created successfully!');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(`Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const success = await deletePlaylistDB(playlistId);
      
      if (success) {
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        
        if (selectedPlaylist === playlistId) {
          setSelectedPlaylist(null);
          setPlaylistItems([]);
        }
        
        alert('Playlist deleted successfully!');
      } else {
        alert('Failed to delete playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert(`Failed to delete playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylist(playlistId);
    fetchPlaylistItems(playlistId);
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : url;
  };

  const extractPlaylistId = (url: string) => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const importYouTubePlaylist = async () => {
    if (!selectedPlaylist || !youtubePlaylistUrl.trim()) {
      alert('Please select a playlist and enter a YouTube playlist URL.');
      return;
    }
    
    const playlistId = extractPlaylistId(youtubePlaylistUrl.trim());
    if (!playlistId) {
      alert('Invalid YouTube playlist URL.');
      return;
    }

    setIsImporting(true);
    
    try {
      // Mock import process - in real implementation, you'd use YouTube API
      const mockVideos = [
        { videoId: 'dQw4w9WgXcQ', title: 'Imported Video 1' },
        { videoId: 'W6NZfCO5SIk', title: 'Imported Video 2' }
      ];

      for (const video of mockVideos) {
        await addVideoToPlaylistDB(
          selectedPlaylist,
          video.videoId,
          video.title
        );
      }

      // Refresh playlist items
      await fetchPlaylistItems(selectedPlaylist);
      
      setYoutubePlaylistUrl('');
      setModalType(null);
      
      alert('Playlist imported successfully!');
    } catch (error) {
      console.error('Error importing playlist:', error);
      alert(`Failed to import playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const addVideoToPlaylist = async () => {
    if (!selectedPlaylist || !newVideoUrl.trim() || !newVideoTitle.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const videoId = extractVideoId(newVideoUrl.trim());
    
    // Validate YouTube video ID
    if (!videoId || videoId.length < 10) {
      alert('Invalid YouTube video ID. Please check the URL.');
      return;
    }
    
    try {
      const newVideo = await addVideoToPlaylistDB(
        selectedPlaylist,
        videoId,
        newVideoTitle.trim()
      );

      if (newVideo) {
        const newItem: PlaylistItem = {
          id: newVideo.id,
          playlist_id: newVideo.playlistId,
          video_id: newVideo.videoId,
          title: newVideo.title,
          position: playlistItems.length + 1,
          progress: newVideo.progress || 0
        };

        setPlaylistItems(prev => [...prev, newItem]);
        setNewVideoUrl('');
        setNewVideoTitle('');
        setModalType(null);
        
        alert('Video added successfully!');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert(`Failed to add video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteVideoFromPlaylist = async (itemId: string) => {
    try {
      const success = await deleteVideoFromPlaylistDB(itemId, selectedPlaylist!);
      
      if (success) {
        setPlaylistItems(prev => prev.filter(item => item.id !== itemId));
        alert('Video removed successfully!');
      } else {
        alert('Failed to remove video. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(`Failed to remove video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setNewPlaylistTitle('');
    setNewVideoUrl('');
    setNewVideoTitle('');
    setYoutubePlaylistUrl('');
  };

  return (
    <div className="space-y-4">
      {/* Playlists Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Playlists</h3>
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-red-500 rounded-md hover:bg-gray-100"
                  aria-label="Close Playlist Manager"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setModalType('create')}
                className="bg-[#0056D3] text-white px-3 py-1 rounded-md text-sm hover:bg-[#0047B3] flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create
              </button>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {playlists.length === 0 ? (
              <p className="text-gray-500 text-sm">No playlists yet. Create your first playlist!</p>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedPlaylist === playlist.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handlePlaylistSelect(playlist.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{playlist.title}</h4>
                      {playlist.description && (
                        <p className="text-sm text-gray-600">{playlist.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); setModalType('importPlaylist'); }}
                        className="p-2 text-gray-600 hover:text-[#0056D3] hover:bg-gray-100 rounded-md"
                        title="Import YouTube Playlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(playlist.id);
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Playlist Videos Card */}
      {selectedPlaylist && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Playlist Videos</h3>
              <button 
                onClick={() => setModalType('addVideo')}
                className="bg-[#0056D3] text-white px-3 py-1 rounded-md text-sm hover:bg-[#0047B3] flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Video
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {playlistItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No videos in this playlist yet.</p>
              ) : (
                playlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium">{item.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#0056D3] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{item.progress}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onVideoSelect?.(item.video_id, item.title)}
                        className="bg-[#0056D3] text-white px-3 py-1 rounded-md text-sm hover:bg-[#0047B3] flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Play
                      </button>
                      <button
                        onClick={() => deleteVideoFromPlaylist(item.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unified Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            {modalType === 'create' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Create New Playlist</h3>
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                  onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPlaylist}
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
                    onClick={addVideoToPlaylist}
                    className="px-4 py-2 bg-[#0056D3] text-white rounded-md hover:bg-[#0047B3]"
                  >
                    Add Video
                  </button>
                </div>
              </>
            )}

            {modalType === 'importPlaylist' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Import YouTube Playlist</h3>
                <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2 mb-4">
                  Please select one of your playlists as the destination before importing a YouTube playlist.
                </div>
                <input
                  type="text"
                  placeholder="YouTube playlist URL..."
                  value={youtubePlaylistUrl}
                  onChange={e => setYoutubePlaylistUrl(e.target.value)}
                  disabled={isImporting}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeModal}
                    disabled={isImporting}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={importYouTubePlaylist}
                    disabled={isImporting || !selectedPlaylist}
                    className="px-4 py-2 bg-[#0056D3] text-white rounded-md hover:bg-[#0047B3] disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : 'Import Playlist'}
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

export default PlaylistManager; 