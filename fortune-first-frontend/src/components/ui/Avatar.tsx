import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Renders the real profile picture when one exists, falling back to the
// initials circle every avatar spot in the app used to reimplement on its own.
export function Avatar({ src, name, size = 36, className = '' }: AvatarProps) {
  const baseClasses = `flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`;
  const style = { width: size, height: size };

  if (src) {
    return (
      <span className={baseClasses} style={style}>
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`${baseClasses} bg-primary/10 font-bold text-primary`}
      style={{ ...style, fontSize: size * 0.4 }}
    >
      {getInitials(name) || '?'}
    </span>
  );
}
