import {
  Box,
  HStack,
  Text,
  Icon,
  Tooltip,
  useColorModeValue,
  Fade,
} from '@chakra-ui/react';
import { FiWifi, FiWifiOff, FiAlertCircle } from 'react-icons/fi';
import { useWebSocketContext } from '../context/WebSocketContext';

export function ConnectionStatus() {
  const { isConnected, connectionStatus } = useWebSocketContext();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: FiWifi,
          color: 'green.500',
          text: 'Connected',
          tooltip: 'Real-time updates active',
        };
      case 'connecting':
        return {
          icon: FiWifi,
          color: 'yellow.500',
          text: 'Connecting...',
          tooltip: 'Establishing connection',
        };
      case 'error':
        return {
          icon: FiAlertCircle,
          color: 'red.500',
          text: 'Connection Error',
          tooltip: 'Failed to connect to server',
        };
      case 'disconnected':
      default:
        return {
          icon: FiWifiOff,
          color: 'gray.500',
          text: 'Disconnected',
          tooltip: 'Real-time updates inactive',
        };
    }
  };

  const config = getStatusConfig();

  // Only show when not connected or having issues
  if (connectionStatus === 'connected') {
    return null;
  }

  return (
    <Fade in={true}>
      <Box
        position="fixed"
        bottom={4}
        right={4}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        px={3}
        py={2}
        boxShadow="sm"
        zIndex="toast"
      >
        <Tooltip label={config.tooltip} placement="top">
          <HStack spacing={2}>
            <Icon
              as={config.icon}
              color={config.color}
              boxSize={4}
              className={connectionStatus === 'connecting' ? 'pulse' : ''}
            />
            <Text fontSize="sm" color={config.color} fontWeight="medium">
              {config.text}
            </Text>
          </HStack>
        </Tooltip>
      </Box>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
          .pulse {
            animation: pulse 1.5s infinite;
          }
        `}
      </style>
    </Fade>
  );
}