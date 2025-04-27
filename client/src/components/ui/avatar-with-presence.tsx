import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarWithPresenceProps = {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "away" | "busy" | null;
  className?: string;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export function AvatarWithPresence({
  src,
  name,
  size = "md",
  status = null,
  className
}: AvatarWithPresenceProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-12 w-12"
  };

  const statusClasses = {
    online: "bg-success-500",
    offline: "bg-neutral-300",
    away: "bg-yellow-500",
    busy: "bg-destructive"
  };

  const statusSize = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3"
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClasses[size])}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      
      {status && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            statusSize[size],
            statusClasses[status]
          )}
        />
      )}
    </div>
  );
}
