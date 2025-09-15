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
  useColorModeValue,
  Flex,
  Icon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Divider,
  HStack,
} from "@chakra-ui/react"
import { useState, FormEvent } from "react"
import { useAuth } from "../context/AuthContext"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { getUserFriendlyError, getRetryMessage } from "../utils/errorMessages"
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  
  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary")
  const cardBg = useColorModeValue("white", "dark.bg.tertiary")
  const textColor = useColorModeValue("gray.900", "gray.100")
  const mutedTextColor = useColorModeValue("gray.600", "gray.400")
  const inputBg = useColorModeValue("white", "dark.bg.secondary")
  const borderColor = useColorModeValue("gray.200", "gray.700")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      toast({
        title: "Login successful",
        description: "Welcome back!",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      // Redirect to dashboard after successful login
      navigate("/dashboard")
    } catch (error) {
      const friendlyError = getUserFriendlyError(error)
      const retryMessage = getRetryMessage(error)
      
      setError(friendlyError.message)
      toast({
        title: friendlyError.title,
        description: `${friendlyError.message} ${retryMessage}`,
        status: friendlyError.type === 'info' ? 'info' : 'error',
        duration: 6000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      minH="100vh"
      bg={bgColor}
      align="center"
      justify="center"
      p={4}
    >
      <Box w="full" maxW="450px">
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
                Welcome Back
              </Heading>
              <Text color={mutedTextColor} fontSize="md">
                Sign in to continue to Smart Task
              </Text>
            </VStack>
          </VStack>

          {/* Login Card */}
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
                <VStack spacing={6}>
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
                        placeholder="Enter your password"
                        autoComplete="current-password"
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
                  </FormControl>

                  <HStack w="full" justify="flex-end">
                    <Link
                      as={RouterLink}
                      to="/forgot-password"
                      color="primary.500"
                      fontSize="sm"
                      fontWeight="medium"
                      _hover={{ color: "primary.600", textDecoration: "none" }}
                    >
                      Forgot Password?
                    </Link>
                  </HStack>

                  <Button
                    type="submit"
                    colorScheme="primary"
                    size="lg"
                    w="full"
                    h={12}
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    borderRadius="xl"
                    fontSize="sm"
                    fontWeight="semibold"
                    rightIcon={!isLoading ? <Icon as={FiArrowRight} boxSize={4} /> : undefined}
                    _hover={{
                      boxShadow: "xl"
                    }}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>

                  <HStack w="full">
                    <Divider borderColor={borderColor} />
                    <Text fontSize="xs" color={mutedTextColor} px={3}>
                      OR
                    </Text>
                    <Divider borderColor={borderColor} />
                  </HStack>

                  <Text textAlign="center" fontSize="sm" color={mutedTextColor}>
                    Don't have an account?{" "}
                    <Link 
                      as={RouterLink} 
                      to="/register" 
                      color="primary.500" 
                      fontWeight="semibold"
                      _hover={{ color: "primary.600", textDecoration: "none" }}
                    >
                      Create one now
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