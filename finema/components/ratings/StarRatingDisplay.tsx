interface StarRatingDisplayProps {
  value: number | null;
  count?: number;
  size?: "sm" | "md";
  showEmpty?: boolean;
}

function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 1.5}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  );
}

export function StarRatingDisplay({
  value,
  count,
  size = "md",
  showEmpty = false,
}: StarRatingDisplayProps) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  if (value === null && !showEmpty) {
    return null;
  }

  if (value === null) {
    return <span className="text-sm text-finema-muted">No ratings yet</span>;
  }

  const rounded = Math.round(value);
  const displayValue = value.toFixed(1);

  return (
    <div className="inline-flex items-center gap-1.5 text-finema-text">
      <div className="flex items-center gap-0.5 text-yellow-400">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} filled={i < rounded} className={starSize} />
        ))}
      </div>
      <span className={size === "sm" ? "text-xs font-medium" : "text-sm font-medium"}>
        {displayValue}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-finema-muted text-xs">({count})</span>
      )}
    </div>
  );
}
