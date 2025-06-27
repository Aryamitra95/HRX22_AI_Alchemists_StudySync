import React, { useEffect, useRef, useState } from 'react';

interface WebcamFeedProps {
    onVideoReady?: (video: HTMLVideoElement | null) => void;
    paused?: boolean;
    showStreamImage?: boolean;
}

const WebcamFeed: React.FC<WebcamFeedProps> = ({ paused }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [useBrowserCamera, setUseBrowserCamera] = useState(false);

    useEffect(() => {
        if (!paused && useBrowserCamera) {
            const getWebcam = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                } catch (err) {
                    console.error('Failed to access webcam:', err);
                }
            };
            getWebcam();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [paused, useBrowserCamera]);

    const handleFlaskError = () => {
        console.warn('Falling back to browser camera.');
        setUseBrowserCamera(true);
    };

    return (
        <div className="bg-white border border-blue-300/40 rounded-2xl shadow-[0_0_30px_rgba(0,170,255,0.25)] p-3 w-full max-w-xs mx-auto relative">
            {!paused ? (
                useBrowserCamera ? (
                    <video
                        ref={videoRef}
                        width={240}
                        height={180}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-auto object-cover bg-black rounded-lg"
                        style={{ aspectRatio: '4 / 3' }}
                    />
                ) : (
                    <img
                        src="http://localhost:5000/video_feed"
                        alt="Webcam Feed"
                        onError={handleFlaskError}
                        className="w-full h-auto object-cover bg-black rounded-lg"
                        style={{ aspectRatio: '4 / 3' }}
                    />
                )
            ) : (
                <div className="w-full h-[180px] flex items-center justify-center bg-black rounded-lg">
                    <span className="text-white text-sm font-semibold">Webcam Paused</span>
                </div>
            )}
            <div className="text-xs text-center text-gray-600 pt-2">Webcam Preview</div>
        </div>
    );
};


export default WebcamFeed;
