import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Link,
  Alert,
  AlertIcon,
  Heading,
  Container,
  useToast,
  HStack,
  Icon,
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Divider,
  Progress,
} from "@chakra-ui/react"
import { FiCheck, FiX, FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi"
import { useState, FormEvent, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { Link as RouterLink, useNavigate } from "react-router-dom"

export function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  
  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary")
  const cardBg = useColorModeValue("white", "dark.bg.tertiary")
  const textColor = useColorModeValue("gray.900", "gray.100")
  const mutedTextColor = useColorModeValue("gray.600", "gray.400")
  const inputBg = useColorModeValue("white", "dark.bg.secondary")
  const borderColor = useColorModeValue("gray.200", "gray.700")

  // Real-time password validation
  const passwordValidation = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
    }
  }, [password])

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const isPasswordMatching = password && confirmPassword && password === confirmPassword
  const isFormValid = email && fullName && isPasswordValid && isPasswordMatching

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Double-check all validations before submitting
    if (!isFormValid) {
      if (!email || !password || !confirmPassword || !fullName) {
        setError("Please fill in all required fields")
      } else if (password !== confirmPassword) {
        setError("Passwords do not match")
      } else if (!isPasswordValid) {
        setError("Please ensure your password meets all requirements")
      }
      return
    }

    setIsLoading(true)
    try {
      await register(email, password, fullName || undefined)
      toast({
        title: "Registration successful",
        description: "Welcome to Smart Task Management!",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      // Redirect to dashboard after successful registration
      navigate("/dashboard")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed"
      setError(errorMessage)
      toast({
        title: "Registration failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password validation item component
  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <HStack spacing={2}>
      <Icon 
        as={isValid ? FiCheck : FiX} 
        color={isValid ? "green.500" : "gray.400"}
        boxSize={4}
      />
      <Text 
        fontSize="sm" 
        color={isValid ? "green.600" : "gray.500"}
        fontWeight={isValid ? "medium" : "normal"}
      >
        {text}
      </Text>
    </HStack>
  )

  return (
    <Flex
      minH="100vh"
      bg={bgColor}
      align="center"
      justify="center"
      p={4}
    >
      <Box w="full" maxW="500px">
      <VStack spacing={8}>
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Box
              w={16}
              h={16}
              bg="primary.500"
              borderRadius="2xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="lg"
            >
              <Text fontSize="2xl" fontWeight="bold" color="white">
                ST
              </Text>
            </Box>
            <VStack spacing={2}>
              <Heading size="xl" color={textColor} fontWeight="bold">
                Create Account
          </Heading>
              <Text color={mutedTextColor} fontSize="md" textAlign="center">
                Join Smart Task to organize your work
          </Text>
              <Text color="primary.500" fontSize="xs" textAlign="center" mt={2}>
            📧 Email verification required after registration
          </Text>
            </VStack>
        </VStack>

          {/* Register Card */}
          <Card 
            w="full" 
            bg={cardBg} 
            boxShadow="xl" 
            borderRadius="2xl"
            border="1px"
            borderColor={borderColor}
          >
            <CardBody p={8}>
            <form onSubmit={handleSubmit}>
                <VStack spacing={5}>
                {error && (
                    <Alert 
                      status="error" 
                      borderRadius="xl"
                      bg="red.50"
                      border="1px"
                      borderColor="red.200"
                    >
                      <AlertIcon color="red.500" />
                      <Text fontSize="sm" color="red.700">{error}</Text>
                  </Alert>
                )}

                <FormControl>
                    <FormLabel color={textColor} fontWeight="medium" fontSize="sm">
                      Full Name <Text as="span" color={mutedTextColor}>(optional)</Text>
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={FiUser} color={mutedTextColor} boxSize={5} />
                      </InputLeftElement>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        bg={inputBg}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="xl"
                        h={12}
                        fontSize="sm"
                        _hover={{ borderColor: "primary.300" }}
                        _focus={{ 
                          borderColor: "primary.500", 
                          boxShadow: "0 0 0 3px rgba(132, 84, 255, 0.1)",
                          bg: inputBg
                        }}
                        _placeholder={{ color: mutedTextColor }}
                      />
                    </InputGroup>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel color={textColor} fontWeight="medium" fontSize="sm">
                      Email Address
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={FiMail} color={mutedTextColor} boxSize={5} />
                      </InputLeftElement>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        autoComplete="email"
                        bg={inputBg}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="xl"
                        h={12}
                        fontSize="sm"
                        _hover={{ borderColor: "primary.300" }}
                        _focus={{ 
                          borderColor: "primary.500", 
                          boxShadow: "0 0 0 3px rgba(132, 84, 255, 0.1)",
                          bg: inputBg
                        }}
                        _placeholder={{ color: mutedTextColor }}
                      />
                    </InputGroup>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel color={textColor} fontWeight="medium" fontSize="sm">
                      Password
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={FiLock} color={mutedTextColor} boxSize={5} />
                      </InputLeftElement>
                  <Input
                        type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        bg={inputBg}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="xl"
                        h={12}
                        fontSize="sm"
                        _hover={{ borderColor: "primary.300" }}
                        _focus={{ 
                          borderColor: "primary.500", 
                          boxShadow: "0 0 0 3px rgba(132, 84, 255, 0.1)",
                          bg: inputBg
                        }}
                        _placeholder={{ color: mutedTextColor }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          icon={<Icon as={showPassword ? FiEyeOff : FiEye} />}
                          variant="ghost"
                          size="sm"
                          color={mutedTextColor}
                          onClick={() => setShowPassword(!showPassword)}
                          _hover={{ color: textColor }}
                        />
                      </InputRightElement>
                    </InputGroup>
                  
                  {/* Password validation display */}
                  {password && (
                      <Box 
                        mt={3} 
                        p={4} 
                        bg={useColorModeValue("gray.50", "dark.bg.secondary")} 
                        borderRadius="xl" 
                        border="1px" 
                        borderColor={borderColor}
                      >
                        <Text fontSize="xs" color={mutedTextColor} mb={3} fontWeight="medium">
                          Password Requirements:
                        </Text>
                      <VStack spacing={2} align="stretch">
                        <ValidationItem 
                          isValid={passwordValidation.minLength} 
                          text="Minimum 8 characters" 
                        />
                        <ValidationItem 
                          isValid={passwordValidation.hasLowercase} 
                          text="At least one lowercase letter" 
                        />
                        <ValidationItem 
                          isValid={passwordValidation.hasUppercase} 
                          text="At least one uppercase letter" 
                        />
                        <ValidationItem 
                          isValid={passwordValidation.hasNumber} 
                          text="At least one number" 
                        />
                      </VStack>
                        <Progress 
                          value={Object.values(passwordValidation).filter(Boolean).length * 25} 
                          colorScheme={isPasswordValid ? "green" : "red"}
                          size="sm"
                          mt={3}
                          borderRadius="full"
                        />
                    </Box>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={confirmPassword && !isPasswordMatching}>
                    <FormLabel color={textColor} fontWeight="medium" fontSize="sm">
                      Confirm Password
                    </FormLabel>
                    <InputGroup>
                      <InputLeftElement>
                        <Icon as={FiLock} color={mutedTextColor} boxSize={5} />
                      </InputLeftElement>
                  <Input
                        type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                        bg={inputBg}
                        border="1px"
                        borderColor={confirmPassword && !isPasswordMatching ? "red.500" : borderColor}
                        borderRadius="xl"
                        h={12}
                        fontSize="sm"
                        _hover={{ borderColor: confirmPassword && !isPasswordMatching ? "red.500" : "primary.300" }}
                        _focus={{ 
                          borderColor: confirmPassword && !isPasswordMatching ? "red.500" : "primary.500", 
                          boxShadow: confirmPassword && !isPasswordMatching ? "0 0 0 3px rgba(245, 101, 101, 0.1)" : "0 0 0 3px rgba(132, 84, 255, 0.1)",
                          bg: inputBg
                        }}
                        _placeholder={{ color: mutedTextColor }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          icon={<Icon as={showConfirmPassword ? FiEyeOff : FiEye} />}
                          variant="ghost"
                          size="sm"
                          color={mutedTextColor}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          _hover={{ color: textColor }}
                        />
                      </InputRightElement>
                    </InputGroup>
                  
                  {/* Password matching validation */}
                  {confirmPassword && (
                    <Box mt={2}>
                      <ValidationItem 
                        isValid={isPasswordMatching} 
                        text="Passwords match" 
                      />
                    </Box>
                  )}
                </FormControl>

                <Button
                  type="submit"
                    colorScheme="primary"
                  size="lg"
                  w="full"
                    h={12}
                  isLoading={isLoading}
                  isDisabled={!isFormValid}
                  loadingText="Creating account..."
                    borderRadius="xl"
                    fontSize="sm"
                    fontWeight="semibold"
                    rightIcon={!isLoading && isFormValid ? <Icon as={FiArrowRight} boxSize={4} /> : undefined}
                  opacity={!isFormValid ? 0.6 : 1}
                  cursor={!isFormValid ? "not-allowed" : "pointer"}
                    _hover={isFormValid ? {
                      boxShadow: "xl"
                    } : {}}
                    transition="all 0.2s"
                >
                  Create Account
                </Button>

                  <HStack w="full">
                    <Divider borderColor={borderColor} />
                    <Text fontSize="xs" color={mutedTextColor} px={3}>
                      OR
                    </Text>
                    <Divider borderColor={borderColor} />
                  </HStack>

                  <Text textAlign="center" fontSize="sm" color={mutedTextColor}>
                  Already have an account?{" "}
                    <Link 
                      as={RouterLink} 
                      to="/login" 
                      color="primary.500" 
                      fontWeight="semibold"
                      _hover={{ color: "primary.600", textDecoration: "none" }}
                    >
                    Sign in here
                  </Link>
                </Text>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
      </Box>
    </Flex>
  )
}