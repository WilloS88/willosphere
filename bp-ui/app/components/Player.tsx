// app/components/JamendoPlayer.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

type Track = {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
};

export default function JamendoPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // in seconds
  const [duration, setDuration] = useState(0); // in seconds
  const progressRef = useRef<HTMLDivElement>(null);

  const clientId = "6bb8fefb"; // ← nahraď vlastním Jamendo klíčem

  useEffect(() => {
    fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=5&fuzzytags=chill&license_ccmatch=true&audioformat=mp31`,
    )
      .then((res) => res.json())
      .then((data) => setTracks(data.results))
      .catch((err) => console.error("Chyba při načítání skladeb:", err));
  }, []);

  // Effect for updating progress
  useEffect(() => {
    if (!audio) return;
    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration);
    };
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audio]);

  const togglePlay = (track: Track) => {
    if (audio && currentTrackId === track.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    } else {
      if (audio) {
        audio.pause();
      }
      const newAudio = new Audio(track.audio);
      newAudio.play();
      setAudio(newAudio);
      setCurrentTrackId(track.id);
      setIsPlaying(true);
      setProgress(0);
      // duration will be set on first timeupdate
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleBarClick = (e: React.MouseEvent) => {
    if (!audio || !progressRef.current) return;
    const { width, left } = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - left;
    const newTime = (clickX / width) * duration;
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h2 className="text-xl font-bold">🎵 Jamendo Player</h2>
      {tracks.length === 0 && <p>Načítám skladby...</p>}
      {tracks.map((track) => {
        const isCurrent = currentTrackId === track.id;
        const buttonText = isCurrent && isPlaying ? "⏸ Pauza" : "▶️ Přehrát";

        return (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-md border p-4 shadow-sm transition-all ${
              isCurrent ? "bg-blue-100" : "bg-white"
            }`}
          >
            <p className="font-semibold">{track.name}</p>
            <p className="text-sm text-gray-600">by {track.artist_name}</p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`mt-3 rounded-md px-4 py-1 text-sm font-medium ${
                isCurrent && isPlaying
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
              onClick={() => togglePlay(track)}
            >
              {buttonText}
            </motion.button>

            {isCurrent && (
              <div className="mt-4 space-y-1">
                {/* Progress Bar */}
                <div
                  ref={progressRef}
                  className="h-2 w-full cursor-pointer rounded bg-gray-300"
                  onClick={handleBarClick}
                >
                  <div
                    className="h-2 rounded bg-blue-600"
                    style={{ width: `${(progress / duration) * 100}%` }}
                  />
                </div>
                {/* Time Display */}
                <div className="flex justify-between text-xs text-gray-700">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
