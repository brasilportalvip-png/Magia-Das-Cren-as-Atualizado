import { motion } from "motion/react";
import { useEffect, useState } from "react";

const PABLO_VIDEO_URL =
  "https://portalvipbrasil.com.br/wp-content/uploads/2026/06/Cigano-Pablo-otimizado.mp4";

export default function CharacterAvatar() {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] flex flex-col items-center justify-center overflow-hidden">
      {/* Vídeo de fundo */}
      <video
  autoPlay
  muted
  loop
  playsInline
  onLoadedMetadata={(e) => {
    e.currentTarget.playbackRate = 1;
  }}
  className="absolute inset-0 w-full h-full object-cover opacity-20"
>
        <source src={PABLO_VIDEO_URL} type="video/mp4" />
      </video>

      {/* Escurecimento do fundo */}
      <div className="absolute inset-0 bg-black/60 z-[1]" />

      {/* Atmosfera */}
      <div className="absolute inset-0 z-[2]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.20)_0%,_transparent_70%)] animate-pulse" />

        <div className="spiritual-particles">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [1, 2, 1],
                y: [0, -100 - Math.random() * 150],
                x: [0, (Math.random() - 0.5) * 100],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              className="absolute w-1 h-1 bg-amber-400 rounded-full blur-[1px]"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: "10%",
              }}
            />
          ))}
        </div>
      </div>

      {/* Avatar */}
      <div className="relative z-10 flex flex-col items-center scale-90 xs:scale-100 lg:scale-100">
        <div className="relative group">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="w-[200px] h-[200px] xs:w-[240px] xs:h-[240px] md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px] xl:w-[380px] xl:h-[380px] relative rounded-full overflow-hidden border-4 border-amber-500/60 shadow-[0_0_120px_rgba(245,158,11,0.45)] bg-black/70 group-hover:border-amber-400 transition-colors"
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-95 scale-105 group-hover:scale-110 transition-transform duration-700"
            >
              <source src={PABLO_VIDEO_URL} type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10" />

            <div className="absolute inset-0 mix-blend-screen opacity-50 pointer-events-none z-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 blur-[100px] animate-pulse" />
            </div>

            {blink && (
              <div className="absolute top-1/3 left-0 w-full h-2 bg-amber-100/10 blur-md z-20" />
            )}
          </motion.div>

          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-600/90 px-6 py-1.5 rounded-full text-[10px] lg:text-xs font-black tracking-[0.3em] lg:tracking-[0.4em] shadow-[0_0_30px_rgba(217,119,6,0.5)] text-white whitespace-nowrap z-30 border border-white/20 uppercase">
            Cigano Pablo
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-20 -z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
              className="w-[280px] h-[280px] xs:w-[350px] xs:h-[350px] md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px] flex items-center justify-center"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Tetragrammaton_Pentagram.svg"
                alt="Tetragrammaton"
                className="w-full h-full invert brightness-200 sepia-[1] hue-rotate-[0deg] saturate-[5]"
              />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-[280px] xs:max-w-md text-center px-4"
        >
          <p className="text-sm lg:text-lg font-serif italic text-amber-100/90 leading-relaxed drop-shadow-lg">
            "As estrelas sussurram segredos que só o seu coração pode ouvir agora. O que deseja desvendar nos caminhos da sua alma?"
          </p>

          <div className="h-[1px] w-24 lg:w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-4 lg:mt-6" />
        </motion.div>
      </div>
    </div>
  );
}