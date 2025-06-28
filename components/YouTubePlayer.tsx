import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect
} from 'react';

// Define the props accepted by this player
interface YouTubePlayerProps {
    url: string;
    playing: boolean;
    onPlay: () => void;
    onPause: () => void;
}

// Define the methods that can be accessed through the ref
export interface YouTubePlayerHandle {
    getCurrentTime: () => number;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
    ({ url, playing, onPlay, onPause }, ref) => {
        const iframeRef = useRef<HTMLIFrameElement | null>(null);
        const [videoId, setVideoId] = useState<string>('');
        const [isReady, setIsReady] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [isClient, setIsClient] = useState(false);

        // Ensure we're on the client side
        useEffect(() => {
            setIsClient(true);
        }, []);

        // Extract video ID from URL
        useEffect(() => {
            if (!url) return;
            
            try {
                const urlObj = new URL(url);
                let id = '';
                
                if (urlObj.hostname.includes('youtube.com')) {
                    id = urlObj.searchParams.get('v') || '';
                } else if (urlObj.hostname.includes('youtu.be')) {
                    id = urlObj.pathname.slice(1) || '';
                }
                
                if (id) {
                    setVideoId(id);
                    setError(null);
                } else {
                    setError('Invalid YouTube URL');
                }
            } catch (err) {
                setError('Invalid URL format');
            }
        }, [url]);

        // Handle play/pause through iframe API
        useEffect(() => {
            if (!iframeRef.current || !isReady) return;

            const iframe = iframeRef.current;
            
            if (playing) {
                iframe.contentWindow?.postMessage(
                    '{"event":"command","func":"playVideo","args":""}',
                    '*'
                );
            } else {
                iframe.contentWindow?.postMessage(
                    '{"event":"command","func":"pauseVideo","args":""}',
                    '*'
                );
            }
        }, [playing, isReady]);

        useImperativeHandle(ref, () => ({
            getCurrentTime: () => {
                // This would need to be implemented with iframe messaging
                // For now, return 0 as a fallback
                return 0;
            }
        }));

        const handleIframeLoad = () => {
            setIsReady(true);
            setError(null);
        };

        const handleIframeError = () => {
            setError('Failed to load video');
            setIsReady(false);
        };

        // Don't render on server side
        if (!isClient) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading player...</p>
                    </div>
                </div>
            );
        }

        if (!videoId) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center p-4">
                        <p className="text-gray-600">Enter a YouTube URL to load video</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center p-4">
                        <p className="text-red-600 mb-2">{error}</p>
                        <p className="text-sm text-gray-600">Please check your YouTube URL</p>
                    </div>
                </div>
            );
        }

        const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&modestbranding=1&rel=0&showinfo=0&controls=1&fs=1&iv_load_policy=3&cc_load_policy=0&autoplay=0&playsinline=1`;

        return (
            <div className="relative w-full h-full">
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Loading video...</p>
                        </div>
                    </div>
                )}

                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                />
            </div>
        );
    }
);

YouTubePlayer.displayName = 'YouTubePlayer';

export default YouTubePlayer;


