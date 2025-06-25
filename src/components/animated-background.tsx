'use client';

import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
      <div className="absolute w-[40vmax] h-[40vmax] bg-primary/20 rounded-full -top-[10vmax] -left-[10vmax] animate-blob" />
      <div className="absolute w-[30vmax] h-[30vmax] bg-accent/20 rounded-full -bottom-[5vmax] -right-[5vmax] animate-blob animation-delay-2000" />
      <div className="absolute w-[25vmax] h-[25vmax] bg-primary/10 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000" />
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
