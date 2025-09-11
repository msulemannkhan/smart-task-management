import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketConfig {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(config: WebSocketConfig = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = config;

  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  
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
          
          // Show notification for task changes by other users
          if (message.data?.user_id && message.data.user_id !== user?.id) {
            toast({
              title: `Task ${message.type.replace('task_', '')}`,
              description: message.data.title || 'A task has been modified',
              status: 'info',
              duration: 3000,
              isClosable: true,
              position: 'bottom-right',
            });
          }
          break;

        case 'project_created':
        case 'project_updated':
        case 'project_deleted':
          // Invalidate project queries
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          break;

        case 'activity_created':
          // Invalidate activity queries
          queryClient.invalidateQueries({ queryKey: ['userActivities'] });
          break;

        case 'task_assigned':
          // Show notification when task is assigned to user
          if (message.data?.assignee_id === user?.id) {
            toast({
              title: 'New Task Assigned',
              description: `You have been assigned: ${message.data.title}`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
              position: 'top',
            });
          }
          break;

        case 'task_completed':
          // Celebrate task completion
          if (message.data?.user_id === user?.id) {
            toast({
              title: 'Task Completed! 🎉',
              description: message.data.title,
              status: 'success',
              duration: 3000,
              isClosable: true,
              position: 'top-right',
            });
          }
          break;

        case 'pong':
          // Handle ping/pong for connection health
          console.log('WebSocket pong received');
          break;

        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
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
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to real-time updates. Retrying...',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'bottom-right',
        });
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
          toast({
            title: 'Connection Lost',
            description: 'Unable to reconnect to real-time updates. Please refresh the page.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
            position: 'top',
          });
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

  // Connect on mount and disconnect on unmount
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

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