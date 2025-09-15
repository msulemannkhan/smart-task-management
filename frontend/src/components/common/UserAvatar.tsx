import {
  Avatar,
  AvatarBadge,
  Box,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

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
  const bgColors = useColorModeValue(
    [
      "blue.500",
      "teal.500",
      "purple.500",
      "pink.500",
      "orange.500",
      "cyan.500",
    ],
    ["blue.600", "teal.600", "purple.600", "pink.600", "orange.600", "cyan.600"]
  );

  // Get initials from name or email
  const getInitials = () => {
    if (!user) return "?";

    if (user.full_name) {
      const parts = user.full_name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }

    if (user.username) {
      return user.username[0].toUpperCase();
    }

    if (user.email) {
      return user.email[0].toUpperCase();
    }

    return "?";
  };

  // Generate consistent color based on user ID or email
  const getBackgroundColor = () => {
    const str = user?.id || user?.email || "";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgColors[Math.abs(hash) % bgColors.length];
  };

  const getName = () => {
    return user?.full_name || user?.username || user?.email || "Unknown User";
  };

  const getAvatarUrl = () => {
    if (!user?.avatar_url) return undefined;
    if (user.avatar_url.startsWith("http")) return user.avatar_url;
    return `http://localhost:8000${user.avatar_url}`;
  };

  return (
    <Avatar
      size={size}
      src={getAvatarUrl()}
      bg={!user?.avatar_url ? getBackgroundColor() : undefined}
    >
      {!user?.avatar_url && (
        <Text
          fontSize={size === "xs" ? "2xs" : size === "sm" ? "xs" : "sm"}
          fontWeight="bold"
          color="white"
        >
          {getInitials()}
        </Text>
      )}
      {showBadge && <AvatarBadge boxSize="1.25em" bg={badgeColor} />}
    </Avatar>
  );
}
