/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AudioControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for spiritual ambient music
    // Using a placeholder URL for mystic music - in real prod we'd use our own asset
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a1b2b8d1.mp3?filename=mystic-ambient-background-music-2212.mp3");
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play blocked by browser", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume]);

  return (
    <div className="fixed bottom-24 right-4 lg:bottom-32 lg:right-8 z-[60] flex items-center gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-full border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-75 lg:scale-100 origin-bottom-right">
      <AnimatePresence>
        {isPlaying && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center px-1 overflow-hidden"
          >
             <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-amber-500/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="text-amber-500 hover:text-amber-300 transition-colors p-1.5 rounded-full hover:bg-amber-500/10"
        title={isPlaying ? "Mudo" : "Ouvir o Astral"}
      >
        {isPlaying ? <Volume2 size={16} strokeWidth={2.5} /> : <VolumeX size={16} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
