import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
  Spinner,
  InputGroup,
  InputRightElement,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useColorModeValue,
  Flex,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Progress,
  SimpleGrid,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  FiEdit2,
  FiSave,
  FiX,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiUser,
  FiMail,
  FiCalendar,
  FiActivity,
  FiAward,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import useCustomToast from "../hooks/useToast";
import { useQuery } from "@tanstack/react-query";
import { TaskService } from "../services/taskService";
import { ActivityService } from "../services/activityService";
import { SkeletonLoader } from "../components/ui/SkeletonLoader";

export function Profile() {
  const { user, token } = useAuth();
  const toast = useCustomToast();
  
  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const statBg = useColorModeValue("white", "dark.bg.secondary");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
  });

  // Password change modal state
  const {
    isOpen: isPasswordModalOpen,
    onOpen: onPasswordModalOpen,
    onClose: onPasswordModalClose,
  } = useDisclosure();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const stats = await TaskService.getTaskStats(undefined);
      return stats;
    },
  });
  
  // Fetch recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ["userActivities"],
    queryFn: async () => {
      const response = await ActivityService.getRecentActivities(undefined, 10);
      return response.activities;
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement user profile update API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock API call

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile. Please try again later");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:9200"
        }/api/v1/users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to change password");
      }

      toast.success("Password changed successfully");

      // Reset form and close modal
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onPasswordModalClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Box h="full" bg={bgColor} p={6}>
        <VStack align="center" justify="center" h="full">
          <Spinner size="lg" color="primary.500" />
          <Text color={textMuted}>Loading profile...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box h="full" bg={bgColor} overflowY="auto">
      <Box maxW="7xl" mx="auto" p={6}>
        <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={6}>
          {/* Left Sidebar - Profile Overview */}
          <GridItem>
            <VStack spacing={6}>
              {/* Profile Card */}
              <Card bg={cardBg} borderRadius="xl" overflow="hidden" w="full">
                <Box
                  h="100px"
                  bgGradient="linear(to-r, primary.400, primary.600)"
                  position="relative"
                >
                  <IconButton
                    aria-label="Change cover"
                    icon={<FiCamera />}
                    size="sm"
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme="whiteAlpha"
                  />
                </Box>
                <CardBody pt={0}>
                  <VStack spacing={4}>
                    <Avatar
                      size="2xl"
                      name={user.full_name || user.email}
                      src={user.avatar_url}
                      mt="-50px"
                      border="4px solid"
                      borderColor={cardBg}
                      position="relative"
                    >
                      <IconButton
                        aria-label="Change avatar"
                        icon={<FiCamera />}
                        size="sm"
                        position="absolute"
                        bottom={0}
                        right={0}
                        borderRadius="full"
                        colorScheme="primary"
                      />
                    </Avatar>
                    <VStack spacing={1}>
                      <Text fontSize="xl" fontWeight="bold">
                        {user.full_name || "User"}
                      </Text>
                      <Text color={textMuted} fontSize="sm">
                        {user.email}
                      </Text>
                      <Badge colorScheme="green" variant="subtle">
                        <Icon as={FiCheckCircle} mr={1} />
                        Active
                      </Badge>
                    </VStack>
                    {user.bio && (
                      <Text fontSize="sm" color={textMuted} textAlign="center">
                        {user.bio}
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
              
              {/* Stats Card */}
              <Card bg={cardBg} borderRadius="xl" w="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Text fontWeight="semibold" fontSize="sm" color={textMuted}>
                      STATISTICS
                    </Text>
                    <SimpleGrid columns={2} gap={4} w="full">
                      <Stat>
                        <StatLabel fontSize="xs">Total Tasks</StatLabel>
                        <StatNumber fontSize="lg">
                          {userStats?.total || 0}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="xs">Completed</StatLabel>
                        <StatNumber fontSize="lg" color="green.500">
                          {userStats?.completed || 0}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="xs">In Progress</StatLabel>
                        <StatNumber fontSize="lg" color="orange.500">
                          {userStats?.in_progress || 0}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="xs">Completion Rate</StatLabel>
                        <StatNumber fontSize="lg">
                          {userStats?.total
                            ? Math.round(
                                (userStats.completed / userStats.total) * 100
                              )
                            : 0}
                          %
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>

          {/* Right Content - Tabs */}
          <GridItem>
            <Card bg={cardBg} borderRadius="xl">
              <CardBody>
                <Tabs colorScheme="primary">
                  <TabList>
                    <Tab>
                      <Icon as={FiUser} mr={2} />
                      Profile
                    </Tab>
                    <Tab>
                      <Icon as={FiShield} mr={2} />
                      Security
                    </Tab>
                    <Tab>
                      <Icon as={FiActivity} mr={2} />
                      Activity
                    </Tab>
                  </TabList>
                  
                  <TabPanels>
                    {/* Profile Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <Flex justify="space-between" align="center">
                          <Heading size="md">Profile Information</Heading>
                          {!isEditing ? (
                            <Button
                              leftIcon={<FiEdit2 />}
                              colorScheme="primary"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditing(true)}
                            >
                              Edit Profile
                            </Button>
                          ) : (
                            <HStack spacing={2}>
                              <Button
                                leftIcon={<FiSave />}
                                colorScheme="primary"
                                size="sm"
                                onClick={handleSave}
                                isLoading={isLoading}
                              >
                                Save
                              </Button>
                              <Button
                                leftIcon={<FiX />}
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                isDisabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </HStack>
                          )}
                        </Flex>
                        
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                          <FormControl>
                            <FormLabel display="flex" alignItems="center">
                              <Icon as={FiUser} mr={2} />
                              Full Name
                            </FormLabel>
                            <Input
                              value={formData.full_name}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  full_name: e.target.value,
                                }))
                              }
                              isReadOnly={!isEditing}
                              bg={isEditing ? cardBg : useColorModeValue("gray.50", "dark.bg.secondary")}
                              borderColor={borderColor}
                            />
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel display="flex" alignItems="center">
                              <Icon as={FiMail} mr={2} />
                              Email Address
                            </FormLabel>
                            <Input
                              value={formData.email}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, email: e.target.value }))
                              }
                              isReadOnly={!isEditing}
                              bg={isEditing ? cardBg : useColorModeValue("gray.50", "dark.bg.secondary")}
                              borderColor={borderColor}
                              type="email"
                            />
                          </FormControl>
                        </SimpleGrid>
                        
                        <FormControl>
                          <FormLabel>Bio</FormLabel>
                          <Textarea
                            value={formData.bio}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, bio: e.target.value }))
                            }
                            isReadOnly={!isEditing}
                            bg={isEditing ? cardBg : useColorModeValue("gray.50", "dark.bg.secondary")}
                            borderColor={borderColor}
                            placeholder="Tell us about yourself..."
                            rows={4}
                          />
                        </FormControl>
                        
                        <Divider />
                        
                        <VStack spacing={3} align="stretch">
                          <Text fontWeight="semibold" fontSize="sm" color={textMuted}>
                            ACCOUNT DETAILS
                          </Text>
                          <HStack justify="space-between">
                            <HStack>
                              <Icon as={FiCalendar} color={textMuted} />
                              <Text fontSize="sm">Account Created</Text>
                            </HStack>
                            <Text fontSize="sm" color={textMuted}>
                              {user.created_at
                                ? new Date(user.created_at).toLocaleDateString()
                                : "Unknown"}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <HStack>
                              <Icon as={FiClock} color={textMuted} />
                              <Text fontSize="sm">Last Updated</Text>
                            </HStack>
                            <Text fontSize="sm" color={textMuted}>
                              {user.updated_at
                                ? new Date(user.updated_at).toLocaleDateString()
                                : "Unknown"}
                            </Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </TabPanel>

                    {/* Security Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md">Security Settings</Heading>
                        
                        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={FiLock} color="primary.500" />
                                <Text fontWeight="medium">Password</Text>
                              </HStack>
                              <Text fontSize="sm" color={textMuted}>
                                Secure your account with a strong password
                              </Text>
                            </VStack>
                            <Button
                              leftIcon={<FiLock />}
                              size="sm"
                              variant="outline"
                              onClick={onPasswordModalOpen}
                            >
                              Change Password
                            </Button>
                          </HStack>
                        </Box>
                        
                        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={FiShield} color="green.500" />
                                <Text fontWeight="medium">Two-Factor Authentication</Text>
                              </HStack>
                              <Text fontSize="sm" color={textMuted}>
                                Add an extra layer of security to your account
                              </Text>
                            </VStack>
                            <Badge colorScheme="yellow">Coming Soon</Badge>
                          </HStack>
                        </Box>
                        
                        <Box p={4} borderWidth="1px" borderRadius="lg" borderColor={borderColor}>
                          <VStack align="start" spacing={3}>
                            <HStack>
                              <Icon as={FiActivity} color="blue.500" />
                              <Text fontWeight="medium">Login Activity</Text>
                            </HStack>
                            <Text fontSize="sm" color={textMuted}>
                              Monitor recent login attempts and active sessions
                            </Text>
                            <Button size="sm" variant="link" colorScheme="primary">
                              View Activity →
                            </Button>
                          </VStack>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Activity Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <Heading size="md">Recent Activity</Heading>
                        
                        {recentActivities && recentActivities.length > 0 ? (
                          <VStack spacing={3} align="stretch">
                            {recentActivities.map((activity) => (
                              <HStack
                                key={activity.id}
                                p={3}
                                borderWidth="1px"
                                borderRadius="lg"
                                borderColor={borderColor}
                                spacing={3}
                              >
                                <Icon
                                  as={FiActivity}
                                  color="primary.500"
                                  boxSize={5}
                                />
                                <VStack align="start" flex={1} spacing={0}>
                                  <Text fontSize="sm">{activity.description}</Text>
                                  <Text fontSize="xs" color={textMuted}>
                                    {new Date(activity.created_at).toLocaleString()}
                                  </Text>
                                </VStack>
                              </HStack>
                            ))}
                          </VStack>
                        ) : (
                          <Box
                            p={8}
                            textAlign="center"
                            borderWidth="1px"
                            borderRadius="lg"
                            borderColor={borderColor}
                          >
                            <Icon as={FiActivity} boxSize={12} color={textMuted} mb={3} />
                            <Text color={textMuted}>No recent activity</Text>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Box>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={onPasswordModalClose}
        size="md"
      >
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader>Change Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Current Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={
                        showCurrentPassword ? "Hide password" : "Show password"
                      }
                      icon={showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>New Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                      icon={showNewPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirm New Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {passwordData.newPassword &&
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <Text fontSize="sm" color="red.500">
                    Passwords do not match
                  </Text>
                )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPasswordModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handlePasswordChange}
              isLoading={isChangingPassword}
              loadingText="Changing..."
              isDisabled={
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword ||
                passwordData.newPassword !== passwordData.confirmPassword
              }
            >
              Change Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
