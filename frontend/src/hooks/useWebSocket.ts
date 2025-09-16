import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import useCustomToast from './useToast';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketConfig {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  initialDelay?: number; // Delay before first connection attempt
}

export function useWebSocket(config: WebSocketConfig = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    initialDelay = 3000, // 3 second delay after login
  } = config;

  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const toast = useCustomToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const pingInterval = useRef<number | null>(null);

  // Get WebSocket URL from environment
  const getWebSocketUrl = () => {
    if (!token) return null;
    
    // Use dedicated WebSocket URL if available, otherwise construct from API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:9200';
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    
    return `${wsUrl}/api/v1/ws/${token}`;
  };

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Validate message structure
      if (!message || typeof message.type !== 'string') {
        console.warn('Invalid WebSocket message format:', message);
        return;
      }

      setLastMessage(message);

      // Handle different message types
      switch (message.type) {
        case 'task_created':
        case 'task_updated':
        case 'task_deleted':
          // Invalidate task queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['recentTasks'] });
          queryClient.invalidateQueries({ queryKey: ['allTasks'] });
          queryClient.invalidateQueries({ queryKey: ['taskStats'] });
          queryClient.invalidateQueries({ queryKey: ['userActivities'] });

          // Also invalidate project-specific data if project_id is provided
          if (message.data?.project_id) {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', message.data.project_id] });
            queryClient.invalidateQueries({ queryKey: ['projectActivities', message.data.project_id] });
          }

          // Show notification for task changes by other users
          if (message.data?.user_id && message.data.user_id !== user?.id) {
            const action = message.type.replace('task_', '');
            const userName = message.data?.user_name || 'Someone';
            toast.info(`${userName} ${action} task: ${message.data.title || 'A task has been modified'}`);
          }
          break;

        case 'task_comment_added':
          // Invalidate task comments and show notification
          if (message.data?.task_id) {
            queryClient.invalidateQueries({ queryKey: ['taskComments', message.data.task_id] });
          }

          // Notify assigned user about new comments
          if (message.data?.assignee_id === user?.id && message.data?.user_id !== user?.id) {
            const userName = message.data?.user_name || 'Someone';
            toast.info(`💬 ${userName} commented on your task: ${message.data.task_title}`);
          }
          break;

        case 'project_created':
        case 'project_updated':
        case 'project_deleted':
          // Invalidate project queries
          queryClient.invalidateQueries({ queryKey: ['projects'] });

          // Show notification for project changes
          if (message.data?.user_id && message.data.user_id !== user?.id) {
            const action = message.type.replace('project_', '');
            const userName = message.data?.user_name || 'Someone';
            toast.info(`${userName} ${action} project: ${message.data.name || 'A project'}`);
          }
          break;

        case 'project_member_added':
        case 'project_member_removed':
          // Invalidate project members
          if (message.data?.project_id) {
            queryClient.invalidateQueries({ queryKey: ['projectMembers', message.data.project_id] });
          }

          // Show notification if current user is affected
          if (message.data?.user_id === user?.id) {
            const action = message.type === 'project_member_added' ? 'added to' : 'removed from';
            toast.info(`You were ${action} project: ${message.data.project_name}`);
          }
          break;

        case 'user_online':
        case 'user_offline':
          // Handle user presence updates
          queryClient.invalidateQueries({ queryKey: ['onlineUsers'] });
          break;

        case 'activity_created':
          // Invalidate activity queries
          queryClient.invalidateQueries({ queryKey: ['userActivities'] });
          queryClient.invalidateQueries({ queryKey: ['recentActivities'] });

          // Invalidate project activities if project_id is provided
          if (message.data?.project_id) {
            queryClient.invalidateQueries({ queryKey: ['projectActivities', message.data.project_id] });
          }
          break;

        case 'task_assigned':
          // Show notification when task is assigned to user
          if (message.data?.assignee_id === user?.id) {
            const userName = message.data?.user_name || 'Someone';
            toast.warning(`📋 New Task Assigned: ${userName} assigned you: ${message.data.title}`);
          }

          // Invalidate task queries
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['userTasks'] });
          break;

        case 'task_completed':
          // Celebrate task completion
          if (message.data?.user_id === user?.id) {
            toast.success(`🎉 Task Completed: ${message.data.title}`);
          } else {
            // Show notification when team member completes a task
            const userName = message.data?.user_name || 'Someone';
            toast.success(`✅ ${userName} completed: ${message.data.title}`);
          }

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['taskStats'] });
          break;

        case 'pong':
          // Handle ping/pong for connection health
          console.log('WebSocket pong received');
          break;

        default:
          console.warn('Unknown WebSocket message type:', message.type, 'Full message:', message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      console.error('Raw message data:', event.data);
    }
  }, [queryClient, toast, user]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token) {
      console.log('No token available for WebSocket connection');
      setConnectionStatus('disconnected');
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    // Clean up existing connection
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setConnectionStatus('connecting');
    
    try {
      const wsUrl = getWebSocketUrl();
      if (!wsUrl) {
        console.log('WebSocket URL not available (no token)');
        setConnectionStatus('disconnected');
        return;
      }
      
      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Start ping interval to keep connection alive
        pingInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.current.onmessage = handleMessage;

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        
        // Show user-friendly error message
        toast.error('Connection Error: Failed to connect to real-time updates. Retrying...');
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }

        // Handle different close codes
        const shouldReconnect = event.code !== 1000 && // Normal closure
                               event.code !== 1001 && // Going away
                               event.code !== 1005 && // No status received
                               event.code !== 1006;   // Abnormal closure

        // Auto-reconnect logic with exponential backoff
        if (autoReconnect && shouldReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const backoffDelay = Math.min(reconnectInterval * Math.pow(2, reconnectAttempts.current - 1), 30000);
          
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts}) in ${backoffDelay}ms...`);
          
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, backoffDelay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached. Stopping reconnection.');
          toast.warning('Connection Lost: Unable to reconnect to real-time updates. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [token, autoReconnect, reconnectInterval, maxReconnectAttempts, handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString(),
      }));
      return true;
    }
    console.warn('WebSocket not connected, cannot send message');
    return false;
  }, []);

  // Connect on mount with delay and disconnect on unmount
  useEffect(() => {
    let delayTimeout: NodeJS.Timeout | null = null;
    
    if (token) {
      // Delay initial connection to avoid immediate connection after login
      delayTimeout = setTimeout(() => {
        connect();
      }, initialDelay);
    }

    return () => {
      if (delayTimeout) {
        clearTimeout(delayTimeout);
      }
      disconnect();
    };
  }, [token]); // Remove connect and disconnect from deps to avoid reconnection loop

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnectAttempts: reconnectAttempts.current,
  };
}