"use client";

interface SparklineProps {
  data: { date: string; count: number }[];
  className?: string;
}

export function MiniSparkline({ data, className = "" }: SparklineProps) {
  if (!data.length) {
    return <span className={`text-xs text-muted ${className}`}>No clicks in range</span>;
  }

  const max = Math.max(...data.map((d) => Number(d.count)), 1);
  const width = 120;
  const height = 32;
  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = height - (Number(d.count) / max) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`text-neon ${className}`}
      width={width}
      height={height}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points.join(" ")}
      />
    </svg>
  );
}
