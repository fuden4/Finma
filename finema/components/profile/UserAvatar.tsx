interface UserAvatarProps {
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(displayName: string | null, email: string): string {
  const source = displayName?.trim() || email.trim() || "User";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
};

export function UserAvatar({
  displayName,
  email,
  avatarUrl,
  size = "sm",
  className = "",
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName ?? email}
        className={`rounded-full object-cover border border-white/10 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-finema-accent/20 border border-white/10 flex items-center justify-center font-semibold text-finema-text ${sizeClass} ${className}`}
      aria-hidden
    >
      {getInitials(displayName, email)}
    </div>
  );
}
