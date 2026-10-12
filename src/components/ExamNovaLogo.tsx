import React from 'react';

interface ExamNovaLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  lightBackground?: boolean;
}

export const ExamNovaLogo: React.FC<ExamNovaLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  textSize = 'md',
  textColor = 'text-white',
  lightBackground = false,
}) => {
  const navyColor = lightBackground ? '#07173D' : '#0B1E48';
  const cyanGradientStart = '#00C2FF';
  const cyanGradientEnd = '#22D3EE';

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  }[textSize];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Vector Logo Icon matching uploaded ExamNova logo */}
      <div 
        className="shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-xs"
        style={{ width: size, height: size, background: '#ffffff', padding: '4px' }}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="enCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={cyanGradientStart} />
              <stop offset="100%" stopColor={cyanGradientEnd} />
            </linearGradient>
          </defs>

          {/* Top Cyan Crossbar (Parallelogram) */}
          <polygon
            points="248,272 324,272 344,232 268,232"
            fill="url(#enCyanGrad)"
          />

          {/* Bottom Cyan Crossbar (Parallelogram) */}
          <polygon
            points="222,324 340,324 360,284 242,284"
            fill="url(#enCyanGrad)"
          />

          {/* Top Navy Circuit Arm & Node */}
          <circle cx="410" cy="180" r="15" fill={navyColor} />
          
          {/* Outer Top Path */}
          <path
            d="M 195 310 L 115 310 L 105 295 L 195 295 L 255 180 L 410 180"
            fill="none"
            stroke={navyColor}
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="miter"
            strokeMiterlimit="4"
          />

          {/* Inner Top Parallel Navy Path */}
          <path
            d="M 115 310 L 195 310 L 260 198 L 398 198 L 390 216 L 270 216 L 210 324 L 90 324"
            fill="none"
            stroke={navyColor}
            strokeWidth="10"
            strokeLinejoin="miter"
            strokeMiterlimit="4"
          />

          {/* Middle Navy Divider Bar */}
          <polygon
            points="242,246 342,246 334,260 234,260"
            fill={navyColor}
          />

          {/* Bottom Baseline Navy Arm & Node */}
          <circle cx="90" cy="324" r="15" fill={navyColor} />
          
          {/* Bottom Base Track */}
          <path
            d="M 90 324 L 340 324"
            stroke={navyColor}
            strokeWidth="11"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Styled Wordmark */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight ${textColor} ${textClasses}`}>
              Exam<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Nova</span>
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Smart Examination Section
          </span>
        </div>
      )}
    </div>
  );
};
