import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Container,
  Code,
  Collapse,
  useDisclosure,
  Icon,
} from "@chakra-ui/react";
import { FiRefreshCw, FiHome, FiAlertTriangle, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

// Error details component
function ErrorDetails({ error, errorInfo }: { error: Error | null; errorInfo: ErrorInfo | null }) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!error) return null;

  return (
    <VStack align="stretch" spacing={3} w="full">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        rightIcon={<Icon as={isOpen ? FiChevronUp : FiChevronDown} />}
      >
        {isOpen ? "Hide" : "Show"} Error Details
      </Button>
      
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" spacing={3}>
          <Box>
            <Text fontWeight="bold" fontSize="sm" mb={1}>
              Error Message:
            </Text>
            <Code p={3} borderRadius="md" w="full" whiteSpace="pre-wrap">
              {error.message}
            </Code>
          </Box>
          
          {error.stack && (
            <Box>
              <Text fontWeight="bold" fontSize="sm" mb={1}>
                Stack Trace:
              </Text>
              <Code
                p={3}
                borderRadius="md"
                w="full"
                maxH="200px"
                overflowY="auto"
                fontSize="xs"
                whiteSpace="pre-wrap"
              >
                {error.stack}
              </Code>
            </Box>
          )}
          
          {errorInfo?.componentStack && (
            <Box>
              <Text fontWeight="bold" fontSize="sm" mb={1}>
                Component Stack:
              </Text>
              <Code
                p={3}
                borderRadius="md"
                w="full"
                maxH="200px"
                overflowY="auto"
                fontSize="xs"
                whiteSpace="pre-wrap"
              >
                {errorInfo.componentStack}
              </Code>
            </Box>
          )}
        </VStack>
      </Collapse>
    </VStack>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Send to error tracking service (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === "production") {
      // this.logErrorToService(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }} py={20}>
          <Container maxW="lg">
            <VStack spacing={6} align="center">
              {/* Error Icon */}
              <Box
                p={4}
                bg="red.100"
                _dark={{ bg: "red.900" }}
                borderRadius="full"
              >
                <Icon
                  as={FiAlertTriangle}
                  boxSize={12}
                  color="red.500"
                  _dark={{ color: "red.300" }}
                />
              </Box>

              {/* Error Message */}
              <VStack spacing={3} textAlign="center">
                <Heading size="lg">Oops! Something went wrong</Heading>
                <Text color="gray.600" _dark={{ color: "gray.400" }}>
                  We're sorry for the inconvenience. The application encountered an unexpected error.
                </Text>
              </VStack>

              {/* Error Alert */}
              <Alert
                status="error"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                borderRadius="lg"
                p={6}
              >
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Application Error
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  {this.state.error?.message || "An unexpected error occurred"}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <HStack spacing={3}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  colorScheme="blue"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  leftIcon={<FiHome />}
                  variant="outline"
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>
                <Button
                  variant="ghost"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </HStack>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === "development" && (
                <Box w="full" mt={6}>
                  <ErrorDetails
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                  />
                </Box>
              )}

              {/* Error Count Warning */}
              {this.state.errorCount > 2 && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Multiple errors detected. Please reload the page if the problem persists.
                  </Text>
                </Alert>
              )}
            </VStack>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Hook for error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error("Error handled:", error, errorInfo);
    
    // You can add custom error handling logic here
    // For example, sending to an error tracking service
    
    // Throw the error to be caught by the nearest error boundary
    throw error;
  };
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}