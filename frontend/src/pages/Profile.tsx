import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Spinner,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
  Flex,
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
  RadioGroup,
  Stack,
  Radio,
  useColorMode,
  Badge,
  List,
  ListItem,
  ListIcon,
  Switch,
  Select,
  Tooltip,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  FiEdit2,
  FiSave,
  FiCamera,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiTarget,
  FiUser,
  FiEdit,
  FiMoon,
  FiSun,
  FiMail,
  FiBell,
  FiShield,
  FiKey,
  FiGlobe,
  FiActivity,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import useCustomToast from "../hooks/useToast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "../services/taskService";
import { ActivityService } from "../services/activityService";
import { DetailPanelSkeleton } from "../components/ui/SkeletonLoaders";
import { UserService } from "../services/userService";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { Avatar } from "../components/common/Avatar";

export function Profile() {
  const { user, token, updateUser } = useAuth();
  const toast = useCustomToast();
  const queryClient = useQueryClient();
  const { colorMode, toggleColorMode } = useColorMode();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    avatar: user?.avatar_url || "",
    department: user?.department || "",
    location: user?.location || "",
    website: user?.website || "",
  });

  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);

  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "dark.border.primary");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "dark.bg.hover");

  // Fetch user stats
  const { data: taskStats, isLoading: loadingTasks } = useQuery({
    queryKey: ["userTaskStats", user?.id],
    queryFn: async () => {
      const tasks = await TaskService.getAllTasks(token!);
      const userTasks = tasks.filter((t: any) => t.user_id === user?.id);
      const now = new Date();
      const thisWeek = userTasks.filter((t: any) => {
        const taskDate = new Date(t.created_at);
        const daysDiff =
          (now.getTime() - taskDate.getTime()) / (1000 * 3600 * 24);
        return daysDiff <= 7;
      });
      const thisMonth = userTasks.filter((t: any) => {
        const taskDate = new Date(t.created_at);
        return (
          taskDate.getMonth() === now.getMonth() &&
          taskDate.getFullYear() === now.getFullYear()
        );
      });

      return {
        total: userTasks.length,
        completed: userTasks.filter((t: any) => t.status === "done").length,
        inProgress: userTasks.filter((t: any) => t.status === "in_progress")
          .length,
        pending: userTasks.filter((t: any) => t.status === "todo").length,
        overdue: userTasks.filter((t: any) => {
          return (
            t.due_date && new Date(t.due_date) < now && t.status !== "done"
          );
        }).length,
        thisWeek: thisWeek.length,
        thisWeekCompleted: thisWeek.filter((t: any) => t.status === "done")
          .length,
        thisMonth: thisMonth.length,
        thisMonthCompleted: thisMonth.filter((t: any) => t.status === "done")
          .length,
      };
    },
    enabled: !!token && !!user,
  });

  // Avatar upload with react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploadingAvatar(true);

      try {
        const result = await UserService.uploadAvatar(file);
        const avatarUrl = result.avatar_url.startsWith("http")
          ? result.avatar_url
          : `${import.meta.env.VITE_API_URL || 'http://localhost:9200'}${result.avatar_url}`;

        setProfileData((prev) => ({ ...prev, avatar: avatarUrl }));
        setTempProfileData((prev) => ({ ...prev, avatar: avatarUrl }));

        // Update user context with new avatar
        if (user) {
          updateUser({
            ...user,
            avatar_url: result.avatar_url,
          });
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["userActivities"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });

        toast.success("Avatar uploaded successfully");
      } catch (error: any) {
        console.error("Avatar upload error:", error);
        toast.error(error?.response?.data?.detail || "Failed to upload avatar");
      } finally {
        setUploadingAvatar(false);
      }
    },
  });

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setTempProfileData(profileData);
  };

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await UserService.updateProfile({
        full_name: tempProfileData.fullName,
        bio: tempProfileData.bio,
        department: tempProfileData.department,
        location: tempProfileData.location,
        website: tempProfileData.website,
      });

      setProfileData({
        ...tempProfileData,
        avatar: updatedProfile.avatar_url || tempProfileData.avatar
      });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");

      // Update the user context with the latest data
      if (user) {
        updateUser({
          ...user,
          full_name: updatedProfile.full_name,
          bio: updatedProfile.bio,
          avatar_url: updatedProfile.avatar_url,
          department: (updatedProfile as any).department,
          location: (updatedProfile as any).location,
          website: (updatedProfile as any).website,
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error?.response?.data?.detail || "Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setTempProfileData(profileData);
  };

  const completionRate = taskStats
    ? Math.round((taskStats.completed / taskStats.total) * 100) || 0
    : 0;

  const weeklyProductivity = taskStats
    ? Math.round((taskStats.thisWeekCompleted / taskStats.thisWeek) * 100) || 0
    : 0;

  const tabIconProps = {
    mr: 2,
    boxSize: 4,
  };

  const achievements = [
    {
      icon: FiAward,
      label: "First Task",
      description: "Completed your first task",
      earned: true,
    },
    {
      icon: FiTrendingUp,
      label: "Week Streak",
      description: "Completed tasks 7 days in a row",
      earned: true,
    },
    {
      icon: FiTarget,
      label: "Goal Crusher",
      description: "Complete 50 tasks",
      earned: taskStats?.completed >= 50,
    },
    {
      icon: FiActivity,
      label: "Always Active",
      description: "Log in 30 days in a row",
      earned: false,
    },
  ];

  if (loadingTasks) {
    return <DetailPanelSkeleton />;
  }

  return (
    <Box h="full" bg={bgColor} overflowY="auto">
      <Box maxW="7xl" mx="auto" p={6}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg">Account Settings</Heading>
            <Text color={textMuted} fontSize="sm" mt={1}>
              Manage your profile, preferences and security
            </Text>
          </Box>

          {/* Main Content with Tabs */}
          <Card
            bg={cardBg}
            borderRadius="xl"
            overflow="hidden"
            border="1px"
            borderColor={borderColor}
          >
            <CardBody p={0}>
              <Tabs orientation="vertical" variant="line" colorScheme="primary">
                <TabList
                  borderRightWidth="1px"
                  borderColor={borderColor}
                  p={4}
                  minW="200px"
                >
                  <Tab justifyContent="flex-start">
                    <Icon as={FiUser} {...tabIconProps} />
                    Profile
                  </Tab>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiBell} {...tabIconProps} />
                    Notifications
                  </Tab>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiShield} {...tabIconProps} />
                    Security
                  </Tab>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiEdit} {...tabIconProps} />
                    Appearance
                  </Tab>
                </TabList>

                <TabPanels p={6}>
                  {/* Profile Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      {/* Profile Header Card */}
                      <Card
                        bg={cardBg}
                        borderRadius="xl"
                        overflow="hidden"
                        border="1px"
                        borderColor={borderColor}
                      >
                        <CardHeader
                          bgGradient="linear(to-r, primary.400, purple.400)"
                          color="white"
                          py={8}
                        >
                          <VStack spacing={4}>
                            <Box position="relative">
                              <Box
                                {...getRootProps()}
                                cursor="pointer"
                                position="relative"
                                borderRadius="full"
                                transition="all 0.2s"
                                _hover={{ opacity: 0.9 }}
                              >
                                <input {...getInputProps()} />
                                <Box
                                  border="4px solid white"
                                  borderRadius="full"
                                  boxShadow="xl"
                                >
                                  <Avatar
                                    src={profileData.avatar || user?.avatar_url}
                                    name={
                                      profileData.fullName || user?.full_name
                                    }
                                    email={user?.email}
                                    id={user?.id}
                                    size="2xl"
                                    showInitials={true}
                                    fallbackIcon={false}
                                  />
                                </Box>
                                {uploadingAvatar && (
                                  <Box
                                    position="absolute"
                                    top="0"
                                    left="0"
                                    right="0"
                                    bottom="0"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    bg="blackAlpha.600"
                                    borderRadius="full"
                                  >
                                    <Spinner color="white" size="lg" />
                                  </Box>
                                )}
                                <Box
                                  position="absolute"
                                  bottom="0"
                                  right="0"
                                  bg="white"
                                  borderRadius="full"
                                  p={1.5}
                                  boxShadow="md"
                                >
                                  <Icon
                                    as={FiCamera}
                                    color="gray.700"
                                    boxSize={4}
                                  />
                                </Box>
                              </Box>
                              {isDragActive && (
                                <Text
                                  fontSize="sm"
                                  mt={2}
                                  color="white"
                                  fontWeight="medium"
                                >
                                  Drop image here...
                                </Text>
                              )}
                            </Box>
                            <VStack spacing={0}>
                              <Heading size="lg">
                                {profileData.fullName || "User"}
                              </Heading>
                              <Text opacity={0.9}>{profileData.email}</Text>
                              {profileData.department && (
                                <Badge
                                  mt={2}
                                  colorScheme="whiteAlpha"
                                  variant="subtle"
                                >
                                  {profileData.department}
                                </Badge>
                              )}
                            </VStack>
                            {!isEditingProfile && (
                              <Button
                                leftIcon={<FiEdit2 />}
                                size="sm"
                                variant="solid"
                                bg="whiteAlpha.200"
                                _hover={{ bg: "whiteAlpha.300" }}
                                onClick={handleEditProfile}
                              >
                                Edit Profile
                              </Button>
                            )}
                          </VStack>
                        </CardHeader>

                        <CardBody>
                          <VStack align="stretch" spacing={4}>
                            {isEditingProfile ? (
                              <>
                                <SimpleGrid
                                  columns={{ base: 1, md: 2 }}
                                  gap={4}
                                >
                                  <FormControl>
                                    <FormLabel fontSize="sm">
                                      Full Name
                                    </FormLabel>
                                    <Input
                                      value={tempProfileData.fullName}
                                      onChange={(e) =>
                                        setTempProfileData({
                                          ...tempProfileData,
                                          fullName: e.target.value,
                                        })
                                      }
                                      placeholder="Enter your full name"
                                    />
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontSize="sm">Email</FormLabel>
                                    <Input
                                      value={profileData.email}
                                      isDisabled
                                    />
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontSize="sm">
                                      Department
                                    </FormLabel>
                                    <Input
                                      value={tempProfileData.department}
                                      onChange={(e) =>
                                        setTempProfileData({
                                          ...tempProfileData,
                                          department: e.target.value,
                                        })
                                      }
                                      placeholder="e.g. Engineering"
                                    />
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontSize="sm">
                                      Location
                                    </FormLabel>
                                    <Input
                                      value={tempProfileData.location}
                                      onChange={(e) =>
                                        setTempProfileData({
                                          ...tempProfileData,
                                          location: e.target.value,
                                        })
                                      }
                                      placeholder="e.g. New York, USA"
                                    />
                                  </FormControl>
                                </SimpleGrid>

                                <FormControl>
                                  <FormLabel fontSize="sm">Bio</FormLabel>
                                  <Textarea
                                    value={tempProfileData.bio}
                                    onChange={(e) =>
                                      setTempProfileData({
                                        ...tempProfileData,
                                        bio: e.target.value,
                                      })
                                    }
                                    placeholder="Tell us about yourself"
                                    rows={4}
                                  />
                                </FormControl>

                                <FormControl>
                                  <FormLabel fontSize="sm">Website</FormLabel>
                                  <Input
                                    value={tempProfileData.website}
                                    onChange={(e) =>
                                      setTempProfileData({
                                        ...tempProfileData,
                                        website: e.target.value,
                                      })
                                    }
                                    placeholder="https://example.com"
                                  />
                                </FormControl>

                                <HStack justify="flex-end" spacing={2}>
                                  <Button
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    colorScheme="primary"
                                    leftIcon={<FiSave />}
                                    onClick={handleSaveProfile}
                                  >
                                    Save Changes
                                  </Button>
                                </HStack>
                              </>
                            ) : (
                              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Box>
                                  <Text fontSize="sm" color={textMuted} mb={1}>
                                    Bio
                                  </Text>
                                  <Text>
                                    {profileData.bio || "No bio added yet"}
                                  </Text>
                                </Box>

                                <Box>
                                  <Text fontSize="sm" color={textMuted} mb={1}>
                                    Department
                                  </Text>
                                  <Text>
                                    {profileData.department || "Not specified"}
                                  </Text>
                                </Box>

                                <Box>
                                  <Text fontSize="sm" color={textMuted} mb={1}>
                                    Location
                                  </Text>
                                  <HStack>
                                    <Icon as={FiGlobe} color={textMuted} />
                                    <Text>
                                      {profileData.location || "Not specified"}
                                    </Text>
                                  </HStack>
                                </Box>

                                <Box>
                                  <Text fontSize="sm" color={textMuted} mb={1}>
                                    Member Since
                                  </Text>
                                  <HStack>
                                    <Icon as={FiCalendar} color={textMuted} />
                                    <Text>
                                      {user?.created_at
                                        ? format(
                                            new Date(user.created_at),
                                            "MMMM d, yyyy"
                                          )
                                        : "Unknown"}
                                    </Text>
                                  </HStack>
                                </Box>
                              </SimpleGrid>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Stats Grid */}
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
                        <Card
                          bg={cardBg}
                          p={4}
                          border="1px"
                          borderColor={borderColor}
                        >
                          <Stat>
                            <StatLabel color={textMuted} fontSize="sm">
                              Total Tasks
                            </StatLabel>
                            <StatNumber fontSize="2xl">
                              {taskStats?.total || 0}
                            </StatNumber>
                            <StatHelpText>
                              <Icon as={FiTarget} mr={1} />
                              All time
                            </StatHelpText>
                          </Stat>
                        </Card>

                        <Card
                          bg={cardBg}
                          p={4}
                          border="1px"
                          borderColor={borderColor}
                        >
                          <Stat>
                            <StatLabel color={textMuted} fontSize="sm">
                              Completed
                            </StatLabel>
                            <StatNumber fontSize="2xl" color="green.500">
                              {taskStats?.completed || 0}
                            </StatNumber>
                            <StatHelpText>
                              <Icon as={FiCheckCircle} mr={1} />
                              {completionRate}% rate
                            </StatHelpText>
                          </Stat>
                        </Card>

                        <Card
                          bg={cardBg}
                          p={4}
                          border="1px"
                          borderColor={borderColor}
                        >
                          <Stat>
                            <StatLabel color={textMuted} fontSize="sm">
                              This Week
                            </StatLabel>
                            <StatNumber fontSize="2xl" color="blue.500">
                              {taskStats?.thisWeek || 0}
                            </StatNumber>
                            <StatHelpText>
                              <Icon as={FiClock} mr={1} />
                              {weeklyProductivity}% done
                            </StatHelpText>
                          </Stat>
                        </Card>

                        <Card
                          bg={cardBg}
                          p={4}
                          border="1px"
                          borderColor={borderColor}
                        >
                          <Stat>
                            <StatLabel color={textMuted} fontSize="sm">
                              Productivity
                            </StatLabel>
                            <StatNumber fontSize="2xl">
                              {completionRate}%
                            </StatNumber>
                            <Progress
                              value={completionRate}
                              colorScheme={
                                completionRate > 70
                                  ? "green"
                                  : completionRate > 40
                                  ? "yellow"
                                  : "red"
                              }
                              size="sm"
                              mt={2}
                              borderRadius="full"
                            />
                          </Stat>
                        </Card>
                      </SimpleGrid>

                      {/* Achievements */}
                      <Card
                        bg={cardBg}
                        p={6}
                        border="1px"
                        borderColor={borderColor}
                      >
                        <VStack align="stretch" spacing={4}>
                          <Heading size="md">Achievements</Heading>
                          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            {achievements.map((achievement, index) => (
                              <HStack
                                key={index}
                                p={3}
                                borderRadius="lg"
                                bg={
                                  achievement.earned ? hoverBg : "transparent"
                                }
                                opacity={achievement.earned ? 1 : 0.5}
                                spacing={3}
                              >
                                <Box
                                  p={2}
                                  borderRadius="lg"
                                  bg={
                                    achievement.earned
                                      ? "primary.100"
                                      : "gray.100"
                                  }
                                  color={
                                    achievement.earned
                                      ? "primary.600"
                                      : "gray.400"
                                  }
                                >
                                  <Icon as={achievement.icon} boxSize={5} />
                                </Box>
                                <VStack align="start" spacing={0} flex={1}>
                                  <Text fontWeight="medium" fontSize="sm">
                                    {achievement.label}
                                  </Text>
                                  <Text fontSize="xs" color={textMuted}>
                                    {achievement.description}
                                  </Text>
                                </VStack>
                                {achievement.earned && (
                                  <Icon as={FiCheckCircle} color="green.500" />
                                )}
                              </HStack>
                            ))}
                          </SimpleGrid>
                        </VStack>
                      </Card>
                    </VStack>
                  </TabPanel>

                  {/* Notifications Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={2}>
                          Notification Preferences
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Choose how you want to be notified about updates
                        </Text>
                      </Box>

                      <VStack align="stretch" spacing={4}>
                        <Card p={4} border="1px" borderColor={borderColor}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={FiMail} />
                                <Text fontWeight="medium">
                                  Email Notifications
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color={textMuted}>
                                Receive updates and reminders via email
                              </Text>
                            </VStack>
                            <Switch
                              size="lg"
                              isChecked={emailNotifications}
                              onChange={(e) =>
                                setEmailNotifications(e.target.checked)
                              }
                            />
                          </HStack>
                        </Card>

                        <Card p={4} border="1px" borderColor={borderColor}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={FiBell} />
                                <Text fontWeight="medium">
                                  Desktop Notifications
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color={textMuted}>
                                Show desktop alerts for important updates
                              </Text>
                            </VStack>
                            <Switch
                              size="lg"
                              isChecked={desktopNotifications}
                              onChange={(e) =>
                                setDesktopNotifications(e.target.checked)
                              }
                            />
                          </HStack>
                        </Card>

                        <Card p={6} border="1px" borderColor={borderColor}>
                          <VStack align="stretch" spacing={4}>
                            <Text fontWeight="medium">Notification Events</Text>
                            <List spacing={3}>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text fontSize="sm">Task assigned to me</Text>
                                  <Switch defaultChecked />
                                </HStack>
                              </ListItem>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text fontSize="sm">Task comments</Text>
                                  <Switch defaultChecked />
                                </HStack>
                              </ListItem>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text fontSize="sm">
                                    Task due date reminders
                                  </Text>
                                  <Switch defaultChecked />
                                </HStack>
                              </ListItem>
                              <ListItem>
                                <HStack justify="space-between">
                                  <Text fontSize="sm">Project updates</Text>
                                  <Switch />
                                </HStack>
                              </ListItem>
                            </List>
                          </VStack>
                        </Card>
                      </VStack>
                    </VStack>
                  </TabPanel>

                  {/* Security Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={2}>
                          Security Settings
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Manage your account security and authentication
                        </Text>
                      </Box>

                      <Card p={6} border="1px" borderColor={borderColor}>
                        <VStack align="stretch" spacing={4}>
                          <Box>
                            <HStack mb={2}>
                              <Icon as={FiKey} />
                              <Text fontWeight="medium">Password</Text>
                            </HStack>
                            <Text fontSize="sm" color={textMuted} mb={3}>
                              Last changed 30 days ago
                            </Text>
                            <Button variant="outline" size="sm">
                              Change Password
                            </Button>
                          </Box>

                          <Divider />

                          <Box>
                            <HStack mb={2}>
                              <Icon as={FiShield} />
                              <Text fontWeight="medium">
                                Two-Factor Authentication
                              </Text>
                              <Badge colorScheme="red" fontSize="xs">
                                Disabled
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color={textMuted} mb={3}>
                              Add an extra layer of security to your account
                            </Text>
                            <Button
                              variant="outline"
                              size="sm"
                              colorScheme="green"
                            >
                              Enable 2FA
                            </Button>
                          </Box>

                          <Divider />

                          <Box>
                            <Text fontWeight="medium" mb={2}>
                              Login Sessions
                            </Text>
                            <Text fontSize="sm" color={textMuted} mb={3}>
                              Currently logged in from 2 devices
                            </Text>
                            <Button
                              variant="outline"
                              size="sm"
                              colorScheme="red"
                            >
                              Sign Out All Devices
                            </Button>
                          </Box>
                        </VStack>
                      </Card>
                    </VStack>
                  </TabPanel>

                  {/* Appearance Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={2}>
                          Appearance Settings
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Customize how TaskHub looks and feels
                        </Text>
                      </Box>

                      <VStack align="stretch" spacing={4}>
                        {/* Theme Mode */}
                        <Card p={6} border="1px" borderColor={borderColor}>
                          <VStack align="stretch" spacing={4}>
                            <Box>
                              <Text fontWeight="medium" mb={2}>
                                Theme Mode
                              </Text>
                              <Text fontSize="sm" color={textMuted} mb={4}>
                                Choose your preferred color scheme
                              </Text>
                            </Box>
                            <RadioGroup
                              value={colorMode}
                              onChange={(value) => {
                                if (value !== colorMode) {
                                  toggleColorMode();
                                }
                              }}
                            >
                              <Stack direction="row" spacing={4}>
                                <Radio value="light">
                                  <HStack spacing={2}>
                                    <Icon as={FiSun} />
                                    <Text>Light</Text>
                                  </HStack>
                                </Radio>
                                <Radio value="dark">
                                  <HStack spacing={2}>
                                    <Icon as={FiMoon} />
                                    <Text>Dark</Text>
                                  </HStack>
                                </Radio>
                              </Stack>
                            </RadioGroup>
                          </VStack>
                        </Card>

                        {/* Language */}
                        <Card p={6} border="1px" borderColor={borderColor}>
                          <VStack align="stretch" spacing={4}>
                            <Box>
                              <Text fontWeight="medium" mb={2}>
                                Language
                              </Text>
                              <Text fontSize="sm" color={textMuted} mb={4}>
                                Select your preferred language
                              </Text>
                            </Box>
                            <Select defaultValue="en">
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="de">German</option>
                              <option value="ja">Japanese</option>
                            </Select>
                          </VStack>
                        </Card>

                        {/* Date Format */}
                        <Card p={6} border="1px" borderColor={borderColor}>
                          <VStack align="stretch" spacing={4}>
                            <Box>
                              <Text fontWeight="medium" mb={2}>
                                Date & Time Format
                              </Text>
                              <Text fontSize="sm" color={textMuted} mb={4}>
                                Choose how dates and times are displayed
                              </Text>
                            </Box>
                            <Select defaultValue="mdy">
                              <option value="mdy">MM/DD/YYYY</option>
                              <option value="dmy">DD/MM/YYYY</option>
                              <option value="ymd">YYYY-MM-DD</option>
                            </Select>
                          </VStack>
                        </Card>
                      </VStack>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Box>
  );
}
