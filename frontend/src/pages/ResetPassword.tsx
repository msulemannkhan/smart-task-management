import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Link,
  useColorModeValue,
  Container,
  Card,
  CardBody,
  InputGroup,
  InputRightElement,
  IconButton,
  Progress,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const cardBg = useColorModeValue("white", "gray.800");
  const textMuted = useColorModeValue("gray.600", "gray.400");

  // Password strength validation
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
  const passwordStrengthPercent = (passwordStrength / 5) * 100;
  
  const getPasswordStrengthColor = () => {
    if (passwordStrengthPercent <= 20) return "red";
    if (passwordStrengthPercent <= 40) return "orange";
    if (passwordStrengthPercent <= 60) return "yellow";
    if (passwordStrengthPercent <= 80) return "blue";
    return "green";
  };

  useEffect(() => {
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 3) {
      setError("Password is too weak. Please meet at least 3 requirements.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9200'}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
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
                  Password Reset Successful!
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  Your password has been successfully reset. You will be
                  redirected to the login page in a few seconds...
                </AlertDescription>
              </Alert>
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
                <Heading size="lg">Reset Your Password</Heading>
                <Text color={textMuted} fontSize="sm" textAlign="center">
                  Please enter your new password below
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
                  <FormControl isRequired>
                    <FormLabel>New Password</FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                    
                    {password && (
                      <>
                        <Progress
                          value={passwordStrengthPercent}
                          size="xs"
                          colorScheme={getPasswordStrengthColor()}
                          mt={2}
                          borderRadius="full"
                        />
                        <FormHelperText>
                          <List spacing={1} mt={2}>
                            <ListItem fontSize="xs">
                              <ListIcon
                                as={passwordChecks.minLength ? FiCheck : FiX}
                                color={passwordChecks.minLength ? "green.500" : "red.500"}
                              />
                              At least 8 characters
                            </ListItem>
                            <ListItem fontSize="xs">
                              <ListIcon
                                as={passwordChecks.hasUpperCase ? FiCheck : FiX}
                                color={passwordChecks.hasUpperCase ? "green.500" : "red.500"}
                              />
                              One uppercase letter
                            </ListItem>
                            <ListItem fontSize="xs">
                              <ListIcon
                                as={passwordChecks.hasLowerCase ? FiCheck : FiX}
                                color={passwordChecks.hasLowerCase ? "green.500" : "red.500"}
                              />
                              One lowercase letter
                            </ListItem>
                            <ListItem fontSize="xs">
                              <ListIcon
                                as={passwordChecks.hasNumber ? FiCheck : FiX}
                                color={passwordChecks.hasNumber ? "green.500" : "red.500"}
                              />
                              One number
                            </ListItem>
                            <ListItem fontSize="xs">
                              <ListIcon
                                as={passwordChecks.hasSpecialChar ? FiCheck : FiX}
                                color={passwordChecks.hasSpecialChar ? "green.500" : "red.500"}
                              />
                              One special character
                            </ListItem>
                          </List>
                        </FormHelperText>
                      </>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Confirm New Password</FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          variant="ghost"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                    {confirmPassword && password !== confirmPassword && (
                      <FormErrorMessage>Passwords do not match</FormErrorMessage>
                    )}
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Resetting..."
                    isDisabled={passwordStrength < 3 || password !== confirmPassword}
                  >
                    Reset Password
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
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}