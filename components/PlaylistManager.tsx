import React, { useState, useEffect } from 'react';
import { getUser } from '../app/appwrite/auth';

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

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({ onVideoSelect, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [showAddPlaylistDialog, setShowAddPlaylistDialog] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    if (user) {
      // Mock playlists data
      setPlaylists([
        {
          id: '1',
          user_id: user.name || 'user1',
          title: 'React Tutorials',
          description: 'Learn React from scratch',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: user.name || 'user1',
          title: 'JavaScript Fundamentals',
          description: 'Core JavaScript concepts',
          created_at: new Date().toISOString()
        }
      ]);
    }
  }, [user]);

  const fetchPlaylistItems = async (playlistId: string) => {
    // Mock playlist items data
    setPlaylistItems([
      {
        id: '1',
        playlist_id: playlistId,
        video_id: 'dQw4w9WgXcQ',
        title: 'React Basics - Getting Started',
        position: 1,
        progress: 75
      },
      {
        id: '2',
        playlist_id: playlistId,
        video_id: 'W6NZfCO5SIk',
        title: 'JavaScript Tutorial for Beginners',
        position: 2,
        progress: 30
      }
    ]);
  };

  const createPlaylist = async () => {
    if (!user || !newPlaylistTitle.trim()) return;

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      user_id: user.name || 'user1',
      title: newPlaylistTitle.trim(),
      description: 'Custom playlist',
      created_at: new Date().toISOString()
    };

    setPlaylists(prev => [newPlaylist, ...prev]);
    setNewPlaylistTitle('');
    setShowCreateDialog(false);
    
    // Show success message
    alert('Playlist created successfully!');
  };

  const deletePlaylist = async (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    
    if (selectedPlaylist === playlistId) {
      setSelectedPlaylist(null);
      setPlaylistItems([]);
    }
    
    alert('Playlist deleted successfully!');
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
    
    // Mock import process
    setTimeout(() => {
      const newItems: PlaylistItem[] = [
        {
          id: Date.now().toString(),
          playlist_id: selectedPlaylist,
          video_id: 'dQw4w9WgXcQ',
          title: 'Imported Video 1',
          position: playlistItems.length + 1,
          progress: 0
        },
        {
          id: (Date.now() + 1).toString(),
          playlist_id: selectedPlaylist,
          video_id: 'W6NZfCO5SIk',
          title: 'Imported Video 2',
          position: playlistItems.length + 2,
          progress: 0
        }
      ];

      setPlaylistItems(prev => [...prev, ...newItems]);
      setYoutubePlaylistUrl('');
      setShowAddPlaylistDialog(false);
      setIsImporting(false);
      
      alert('Playlist imported successfully!');
    }, 2000);
  };

  const addVideoToPlaylist = async () => {
    if (!selectedPlaylist || !newVideoUrl.trim() || !newVideoTitle.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const videoId = extractVideoId(newVideoUrl.trim());
    
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      playlist_id: selectedPlaylist,
      video_id: videoId,
      title: newVideoTitle.trim(),
      position: playlistItems.length + 1,
      progress: 0
    };

    setPlaylistItems(prev => [...prev, newItem]);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setShowAddVideoDialog(false);
    
    alert('Video added successfully!');
  };

  const deleteVideoFromPlaylist = async (itemId: string) => {
    setPlaylistItems(prev => prev.filter(item => item.id !== itemId));
    alert('Video removed successfully!');
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
                onClick={() => setShowCreateDialog(true)}
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
                        onClick={e => { e.stopPropagation(); setShowAddPlaylistDialog(true); }}
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
                onClick={() => setShowAddVideoDialog(true)}
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

      {/* Create Playlist Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
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
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                className="px-4 py-2 bg-[#0056D3] text-white rounded-md hover:bg-[#0047B3]"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Dialog */}
      {showAddVideoDialog && (
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
                onClick={() => setShowAddVideoDialog(false)}
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
          </div>
        </div>
      )}

      {/* Import YouTube Playlist Dialog */}
      {showAddPlaylistDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
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
                onClick={() => setShowAddPlaylistDialog(false)}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager; 