import { Avatar } from "./Avatar";

interface UserAvatarProps {
  user?: {
    id?: string;
    email?: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showBadge?: boolean;
  badgeColor?: string;
}

export function UserAvatar({
  user,
  size = "md",
  showBadge = false,
  badgeColor = "green.500",
}: UserAvatarProps) {
  return (
    <Avatar
      src={user?.avatar_url}
      name={user?.full_name || user?.username}
      email={user?.email}
      id={user?.id}
      size={size}
      showBadge={showBadge}
      badgeColor={badgeColor}
      showInitials={true}
      fallbackIcon={false}
    />
  );
}
