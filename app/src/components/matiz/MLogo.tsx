export function MLogo({
  size = 32,
  stroke = "#F5F1E8",
  dot = "#FF5E3A",
  dotOff = false,
}: {
  size?: number;
  stroke?: string;
  dot?: string;
  dotOff?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Matiz"
    >
      <path
        d="M 22 74 L 22 34 Q 22 26 29 26 Q 34 26 37 33 L 50 60 L 63 33 Q 66 26 71 26 Q 78 26 78 34 L 78 74"
        stroke={stroke}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!dotOff && <circle cx="82" cy="26" r="4.4" fill={dot} />}
    </svg>
  );
}
