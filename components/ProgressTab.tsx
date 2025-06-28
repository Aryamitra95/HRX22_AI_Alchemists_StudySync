import React, { useState } from 'react';

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
}

export const ProgressTab: React.FC<ProgressTabProps> = ({ 
  playlists, 
  onPlaylistSelect, 
  onVideoSelect,
  onAddPlaylist,
  onAddVideoToPlaylist,
  onDeletePlaylist,
  onDeleteVideo
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(playlists[0]?.id || null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() && onAddPlaylist) {
      onAddPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const handleAddVideo = () => {
    if (selectedPlaylistId && newVideoUrl.trim() && newVideoTitle.trim() && onAddVideoToPlaylist) {
      // Extract video ID from YouTube URL
      const videoId = extractVideoId(newVideoUrl.trim());
      onAddVideoToPlaylist(selectedPlaylistId, videoId, newVideoTitle.trim());
      setNewVideoUrl('');
      setNewVideoTitle('');
      setShowAddVideo(false);
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
              className="bg-[#0056D3] text-white px-3 py-1 rounded-md text-sm hover:bg-[#0047B3] flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Playlist
            </button>
          </div>
        </div>
        <div className="p-4">
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
                {onDeletePlaylist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist(playlist.id);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete playlist"
                  >
                    ×
                  </button>
                )}
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
                    {onDeleteVideo && (
                      <button
                        onClick={() => onDeleteVideo(selectedPlaylist.id, video.id)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove video"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Select a playlist to view its videos.</div>
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
                className="px-4 py-2 bg-[#0056D3] text-white rounded-md hover:bg-[#0047B3]"
              >
                Create
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
                className="px-4 py-2 bg-[#0056D3] text-white rounded-md hover:bg-[#0047B3]"
              >
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTab; 