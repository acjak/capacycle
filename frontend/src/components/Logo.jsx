import { useTheme } from "../theme.jsx";

export default function Logo({ size = 24 }) {
  const { colors: c } = useTheme();

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer cycle ring */}
      <circle cx="16" cy="16" r="13" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="58 24" transform="rotate(-30 16 16)" />
      {/* Inner progress arc */}
      <circle cx="16" cy="16" r="8" stroke={c.green} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="32 20" transform="rotate(60 16 16)" />
      {/* Center dot */}
      <circle cx="16" cy="16" r="2.5" fill={c.accent} />
    </svg>
  );
}
