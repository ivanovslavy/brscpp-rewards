export default function GembaLogo({ size = 36, animated = false }) {
  if (animated) {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gembaGradientAnim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5">
              <animate attributeName="stop-color" values="#4F46E5;#06B6D4;#4F46E5" dur="6s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#06B6D4">
              <animate attributeName="stop-color" values="#06B6D4;#4F46E5;#06B6D4" dur="6s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>
        </defs>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 256 256" to="360 256 256" dur="30s" repeatCount="indefinite"/>
          <circle cx="256" cy="256" r="220" fill="none" stroke="url(#gembaGradientAnim)" strokeWidth="12" opacity="0.3"/>
        </g>
        <circle cx="256" cy="256" r="170" fill="none" stroke="url(#gembaGradientAnim)" strokeWidth="16"/>
        <path d="M256 130 A126 126 0 1 0 382 256 L300 256" fill="none" stroke="url(#gembaGradientAnim)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="256" cy="130" r="12" fill="#4F46E5"><animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="382" cy="256" r="12" fill="#06B6D4"><animate attributeName="r" values="10;14;10" dur="2.4s" repeatCount="indefinite"/></circle>
        <circle cx="256" cy="382" r="12" fill="#4F46E5"><animate attributeName="r" values="10;14;10" dur="1.8s" repeatCount="indefinite"/></circle>
        <circle cx="130" cy="256" r="12" fill="#06B6D4"><animate attributeName="r" values="10;14;10" dur="2.2s" repeatCount="indefinite"/></circle>
        <circle cx="300" cy="256" r="10" fill="#6366F1"><animate attributeName="r" values="8;12;8" dur="1.6s" repeatCount="indefinite"/></circle>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gembaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="220" fill="none" stroke="url(#gembaGrad)" strokeWidth="12" opacity="0.3"/>
      <circle cx="256" cy="256" r="170" fill="none" stroke="url(#gembaGrad)" strokeWidth="16"/>
      <path d="M256 130 A126 126 0 1 0 382 256 L300 256" fill="none" stroke="url(#gembaGrad)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="256" cy="130" r="12" fill="#4F46E5"/>
      <circle cx="382" cy="256" r="12" fill="#06B6D4"/>
      <circle cx="256" cy="382" r="12" fill="#4F46E5"/>
      <circle cx="130" cy="256" r="12" fill="#06B6D4"/>
      <circle cx="300" cy="256" r="10" fill="#6366F1"/>
    </svg>
  );
}
