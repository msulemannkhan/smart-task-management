import { useState, useEffect } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export interface OnlineUser {
  id: string;
  full_name?: string;
  username?: string;
  email: string;
  avatar_url?: string;
  last_seen: string;
  status: 'online' | 'away' | 'offline';
}

export function useUserPresence(projectId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, lastMessage, sendMessage } = useWebSocketContext();
  const { user } = useAuth();

  // Fetch initial online users
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const endpoint = projectId
          ? `/users/online?project_id=${projectId}`
          : '/users/online';
        const response = await api.get(endpoint);
        setOnlineUsers(response.data.users || []);
      } catch (error) {
        console.error('Failed to fetch online users:', error);
        setOnlineUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
  }, [projectId]);

  // Send presence updates when connection status changes
  useEffect(() => {
    if (isConnected && user) {
      // Send online status
      sendMessage('user_presence', {
        status: 'online',
        project_id: projectId,
        user_id: user.id,
        timestamp: new Date().toISOString()
      });

      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        sendMessage('user_heartbeat', {
          status: 'online',
          project_id: projectId,
          user_id: user.id,
          timestamp: new Date().toISOString()
        });
      }, 30000); // Every 30 seconds

      return () => {
        // Send offline status when unmounting
        sendMessage('user_presence', {
          status: 'offline',
          project_id: projectId,
          user_id: user.id,
          timestamp: new Date().toISOString()
        });
        clearInterval(heartbeatInterval);
      };
    }
  }, [isConnected, user, projectId, sendMessage]);

  // Listen for presence updates via WebSocket
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'user_online':
          setOnlineUsers(prev => {
            const filtered = prev.filter(u => u.id !== lastMessage.data.user_id);
            return [...filtered, {
              id: lastMessage.data.user_id,
              full_name: lastMessage.data.full_name,
              username: lastMessage.data.username,
              email: lastMessage.data.email,
              avatar_url: lastMessage.data.avatar_url,
              last_seen: lastMessage.data.timestamp,
              status: 'online'
            }];
          });
          break;

        case 'user_offline':
          setOnlineUsers(prev =>
            prev.filter(u => u.id !== lastMessage.data.user_id)
          );
          break;

        case 'user_away':
          setOnlineUsers(prev =>
            prev.map(u =>
              u.id === lastMessage.data.user_id
                ? { ...u, status: 'away' as const, last_seen: lastMessage.data.timestamp }
                : u
            )
          );
          break;
      }
    }
  }, [lastMessage]);

  // Update status when user becomes active/inactive
  useEffect(() => {
    let awayTimeout: NodeJS.Timeout;

    const handleUserActivity = () => {
      if (isConnected && user) {
        sendMessage('user_presence', {
          status: 'online',
          project_id: projectId,
          user_id: user.id,
          timestamp: new Date().toISOString()
        });
      }

      // Set user as away after 5 minutes of inactivity
      clearTimeout(awayTimeout);
      awayTimeout = setTimeout(() => {
        if (isConnected && user) {
          sendMessage('user_presence', {
            status: 'away',
            project_id: projectId,
            user_id: user.id,
            timestamp: new Date().toISOString()
          });
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      clearTimeout(awayTimeout);
    };
  }, [isConnected, user, projectId, sendMessage]);

  const updateStatus = (status: 'online' | 'away' | 'offline') => {
    if (isConnected && user) {
      sendMessage('user_presence', {
        status,
        project_id: projectId,
        user_id: user.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    onlineUsers,
    loading,
    updateStatus,
    isUserOnline: (userId: string) => onlineUsers.some(u => u.id === userId && u.status === 'online'),
    getUserStatus: (userId: string) => {
      const user = onlineUsers.find(u => u.id === userId);
      return user?.status || 'offline';
    }
  };
}