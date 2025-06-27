import React, {
    forwardRef,
    useImperativeHandle,
    useRef
} from 'react';
import ReactPlayer from 'react-player';
import type { ReactPlayerProps } from 'react-player';

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
        const playerRef = useRef<ReactPlayer | null>(null);

        useImperativeHandle(ref, () => ({
            getCurrentTime: () => {
                return playerRef.current?.getCurrentTime() ?? 0;
            }
        }));

        return (
            <ReactPlayer
                ref={playerRef}
                url={url}
                playing={playing}
                controls
                width="100%"
                height="100%"
                onPlay={onPlay}
                onPause={onPause}
            />
        );
    }
);

export default YouTubePlayer;


