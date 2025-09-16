import React from 'react';
import {
  Box,
  Circle,
  HStack,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
  AvatarGroup,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from './Avatar';
import { useUserPresence, type OnlineUser } from '../../hooks/useUserPresence';

interface OnlineStatusIndicatorProps {
  userId: string;
  size?: 'xs' | 'sm' | 'md';
  showText?: boolean;
}

export function OnlineStatusIndicator({ userId, size = 'sm', showText = false }: OnlineStatusIndicatorProps) {
  const { getUserStatus } = useUserPresence();
  const status = getUserStatus(userId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green.400';
      case 'away': return 'yellow.400';
      default: return 'gray.400';
    }
  };

  const getStatusSize = () => {
    switch (size) {
      case 'xs': return 2;
      case 'sm': return 3;
      case 'md': return 4;
      default: return 3;
    }
  };

  if (status === 'offline') return null;

  return (
    <HStack spacing={1}>
      <Circle size={getStatusSize()} bg={getStatusColor(status)} />
      {showText && (
        <Text fontSize="xs" color={getStatusColor(status)} fontWeight="medium">
          {status}
        </Text>
      )}
    </HStack>
  );
}

interface OnlineUsersListProps {
  projectId?: string;
  maxDisplay?: number;
  compact?: boolean;
}

export function OnlineUsersList({ projectId, maxDisplay = 5, compact = false }: OnlineUsersListProps) {
  const { onlineUsers, loading } = useUserPresence(projectId);
  const borderColor = useColorModeValue('gray.200', 'dark.border.subtle');
  const bgColor = useColorModeValue('white', 'dark.bg.tertiary');
  const textColor = useColorModeValue('gray.700', 'gray.300');

  if (loading) {
    return (
      <Text fontSize="sm" color="gray.500">
        Loading...
      </Text>
    );
  }

  if (onlineUsers.length === 0) {
    return (
      <Text fontSize="sm" color="gray.500">
        No one is online
      </Text>
    );
  }

  if (compact) {
    return (
      <HStack spacing={2}>
        <AvatarGroup size="xs" max={maxDisplay}>
          {onlineUsers.slice(0, maxDisplay).map((user) => (
            <Tooltip
              key={user.id}
              label={`${user.full_name || user.username || user.email} (${user.status})`}
            >
              <Box position="relative">
                <Avatar
                  src={user.avatar_url}
                  name={user.full_name || user.username}
                  email={user.email}
                  id={user.id}
                  size="xs"
                  showInitials
                  fallbackIcon={false}
                />
                <Circle
                  size={2}
                  bg={user.status === 'online' ? 'green.400' : 'yellow.400'}
                  position="absolute"
                  bottom={0}
                  right={0}
                  border="2px solid"
                  borderColor={bgColor}
                />
              </Box>
            </Tooltip>
          ))}
        </AvatarGroup>
        {onlineUsers.length > maxDisplay && (
          <Text fontSize="xs" color="gray.500">
            +{onlineUsers.length - maxDisplay}
          </Text>
        )}
      </HStack>
    );
  }

  return (
    <VStack align="stretch" spacing={2}>
      {onlineUsers.slice(0, maxDisplay).map((user) => (
        <HStack key={user.id} spacing={3}>
          <Box position="relative">
            <Avatar
              src={user.avatar_url}
              name={user.full_name || user.username}
              email={user.email}
              id={user.id}
              size="sm"
              showInitials
              fallbackIcon={false}
            />
            <Circle
              size={3}
              bg={user.status === 'online' ? 'green.400' : 'yellow.400'}
              position="absolute"
              bottom={0}
              right={0}
              border="2px solid"
              borderColor={bgColor}
            />
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color={textColor} fontWeight="medium">
              {user.full_name || user.username || user.email}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {user.status} • {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}
            </Text>
          </VStack>
        </HStack>
      ))}
      {onlineUsers.length > maxDisplay && (
        <Text fontSize="xs" color="gray.500" textAlign="center">
          {onlineUsers.length - maxDisplay} more online
        </Text>
      )}
    </VStack>
  );
}

interface OnlineCountBadgeProps {
  projectId?: string;
}

export function OnlineCountBadge({ projectId }: OnlineCountBadgeProps) {
  const { onlineUsers, loading } = useUserPresence(projectId);

  if (loading || onlineUsers.length === 0) return null;

  return (
    <HStack spacing={1}>
      <Circle size={2} bg="green.400" />
      <Text fontSize="xs" color="green.600" fontWeight="medium">
        {onlineUsers.length} online
      </Text>
    </HStack>
  );
}