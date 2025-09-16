import {
  Avatar as ChakraAvatar,
  AvatarBadge,
  Box,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiUser } from "react-icons/fi";

interface AvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  id?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showBadge?: boolean;
  badgeColor?: string;
  showInitials?: boolean;
  fallbackIcon?: boolean;
}

export function Avatar({
  src,
  name,
  email,
  id,
  size = "md",
  showBadge = false,
  badgeColor = "green.500",
  showInitials = true,
  fallbackIcon = false,
}: AvatarProps) {
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

  const getInitials = () => {
    if (!showInitials) return "";

    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }

    if (email) {
      return email[0].toUpperCase();
    }

    return fallbackIcon ? null : "?";
  };

  const getBackgroundColor = () => {
    const str = id || name || email || "";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgColors[Math.abs(hash) % bgColors.length];
  };

  const getAvatarUrl = () => {
    if (!src) return undefined;

    // Handle full URLs
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }

    // Handle relative URLs - prepend backend URL
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:9200";

    // Ensure no double slashes
    const cleanPath = src.startsWith("/") ? src : `/${src}`;
    return `${baseUrl}${cleanPath}`;
  };

  const avatarUrl = getAvatarUrl();
  const initials = getInitials();

  return (
    <ChakraAvatar
      size={size}
      src={avatarUrl}
      bg={!avatarUrl ? getBackgroundColor() : undefined}
      icon={fallbackIcon && !initials ? <FiUser /> : undefined}
    >
      {!avatarUrl && initials && (
        <Text
          fontSize={size === "xs" ? "2xs" : size === "sm" ? "xs" : "sm"}
          fontWeight="bold"
          color="white"
        >
          {initials}
        </Text>
      )}
      {showBadge && <AvatarBadge boxSize="1.25em" bg={badgeColor} />}
    </ChakraAvatar>
  );
}
