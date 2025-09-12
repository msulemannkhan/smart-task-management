import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
  useColorModeValue,
  Container,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const cardBg = useColorModeValue("white", "gray.800");
  const textMuted = useColorModeValue("gray.600", "gray.400");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9200'}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxW="md" mt={20}>
        <Card bg={cardBg}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert
                status="success"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                height="200px"
                borderRadius="md"
              >
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Check your email!
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  We've sent a password reset link to {email}. Please check your
                  inbox and follow the instructions to reset your password.
                </AlertDescription>
              </Alert>
              
              <Button
                variant="ghost"
                leftIcon={<FiArrowLeft />}
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")} py={20}>
      <Container maxW="md">
        <Card bg={cardBg}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <VStack spacing={2} align="center">
                <Heading size="lg">Forgot Password?</Heading>
                <Text color={textMuted} fontSize="sm" textAlign="center">
                  No worries! Enter your email address and we'll send you a link
                  to reset your password.
                </Text>
              </VStack>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired isInvalid={!!error}>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                      size="lg"
                    />
                    <FormErrorMessage>{error}</FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Sending..."
                  >
                    Send Reset Link
                  </Button>
                </VStack>
              </form>

              <VStack spacing={2} pt={2}>
                <Text fontSize="sm" color={textMuted}>
                  Remember your password?{" "}
                  <Link
                    as={RouterLink}
                    to="/login"
                    color="blue.500"
                    fontWeight="medium"
                  >
                    Back to Login
                  </Link>
                </Text>
                <Text fontSize="sm" color={textMuted}>
                  Don't have an account?{" "}
                  <Link
                    as={RouterLink}
                    to="/register"
                    color="blue.500"
                    fontWeight="medium"
                  >
                    Sign Up
                  </Link>
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}