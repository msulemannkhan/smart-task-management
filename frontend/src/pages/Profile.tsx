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
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import useCustomToast from "../hooks/useToast";
import { useQuery } from "@tanstack/react-query";
import { TaskService } from "../services/taskService";
import { ActivityService } from "../services/activityService";
import { DetailPanelSkeleton } from "../components/ui/SkeletonLoaders";
import { UserService } from "../services/userService";
import { useDropzone } from "react-dropzone";

export function Profile() {
  const { user, token, updateUser } = useAuth();
  const toast = useCustomToast();
  const { colorMode, toggleColorMode } = useColorMode();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    bio: user?.user_metadata?.bio || "",
    avatar: user?.user_metadata?.avatar_url || "",
  });
  
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "dark.border.subtle");
  const textMuted = useColorModeValue("gray.600", "gray.400");

  // Fetch user stats
  const { data: taskStats, isLoading: loadingTasks } = useQuery({
    queryKey: ["userTaskStats", user?.id],
    queryFn: async () => {
      const tasks = await TaskService.getAllTasks(token!);
      const userTasks = tasks.filter((t: any) => t.user_id === user?.id);
      return {
        total: userTasks.length,
        completed: userTasks.filter((t: any) => t.status === "done").length,
        inProgress: userTasks.filter((t: any) => t.status === "in_progress").length,
        pending: userTasks.filter((t: any) => t.status === "todo").length,
      };
    },
    enabled: !!token && !!user,
  });

  // Avatar upload with react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      setUploadingAvatar(true);
      
      try {
        const result = await UserService.uploadAvatar(token!, file);
        const avatarUrl = `http://localhost:8000${result.avatar_url}`;
        setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
        setTempProfileData(prev => ({ ...prev, avatar: avatarUrl }));
        if (user) {
          updateUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: avatarUrl } });
        }
        toast.success("Avatar uploaded successfully");
      } catch (error) {
        console.error('Avatar upload error:', error);
        toast.error("Failed to upload avatar");
      } finally {
        setUploadingAvatar(false);
      }
    }
  });

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setTempProfileData(profileData);
  };

  const handleSaveProfile = async () => {
    try {
      await UserService.updateProfile(token!, {
        full_name: tempProfileData.fullName,
        bio: tempProfileData.bio,
      });
      
      setProfileData(tempProfileData);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
      
      if (user) {
        updateUser({ 
          ...user, 
          user_metadata: { 
            ...user.user_metadata, 
            full_name: tempProfileData.fullName,
            bio: tempProfileData.bio
          } 
        });
      }
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setTempProfileData(profileData);
  };

  const completionRate = taskStats
    ? Math.round((taskStats.completed / taskStats.total) * 100) || 0
    : 0;

  const tabIconProps = {
    mr: 2,
    boxSize: 4,
  };

  if (loadingTasks) {
    return <DetailPanelSkeleton />;
  }

  return (
    <Box h="full" bg={bgColor} overflowY="auto">
      <Box maxW="7xl" mx="auto" p={6}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Box>
            <Heading size="lg">Account</Heading>
            <Text color={textMuted} fontSize="sm" mt={1}>
              Manage your profile and preferences
            </Text>
          </Box>

          {/* Main Content with Tabs */}
          <Card bg={cardBg} borderRadius="xl" overflow="hidden">
            <CardBody p={0}>
              <Tabs orientation="vertical" variant="line" colorScheme="primary">
                <TabList borderRightWidth="1px" borderColor={borderColor} p={4}>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiUser} {...tabIconProps} />
                    Profile
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
                      <Card bg={cardBg} borderRadius="xl" overflow="hidden">
                        <CardHeader
                          bgGradient="linear(to-r, primary.400, purple.400)"
                          color="white"
                          py={8}
                        >
                          <VStack spacing={4}>
                            <Box position="relative">
                              <Box {...getRootProps()} cursor="pointer">
                                <input {...getInputProps()} />
                                <Avatar
                                  size="2xl"
                                  name={profileData.fullName || user?.email}
                                  src={profileData.avatar}
                                  border="4px solid white"
                                  position="relative"
                                />
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
                                    <Spinner color="white" />
                                  </Box>
                                )}
                                <IconButton
                                  aria-label="Upload avatar"
                                  icon={<FiCamera />}
                                  size="sm"
                                  colorScheme="whiteAlpha"
                                  position="absolute"
                                  bottom="0"
                                  right="0"
                                  borderRadius="full"
                                />
                              </Box>
                              {isDragActive && (
                                <Text fontSize="sm" mt={2}>Drop image here...</Text>
                              )}
                            </Box>
                            <VStack spacing={0}>
                              <Heading size="lg">{profileData.fullName || "User"}</Heading>
                              <Text opacity={0.9}>{profileData.email}</Text>
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
                                <FormControl>
                                  <FormLabel>Full Name</FormLabel>
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
                                  <FormLabel>Email</FormLabel>
                                  <Input value={profileData.email} isDisabled />
                                </FormControl>

                                <FormControl>
                                  <FormLabel>Bio</FormLabel>
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

                                <HStack justify="flex-end" spacing={2}>
                                  <Button variant="ghost" onClick={handleCancelEdit}>
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
                              <>
                                <Box>
                                  <Text fontWeight="semibold" mb={1}>
                                    Bio
                                  </Text>
                                  <Text color={textMuted}>
                                    {profileData.bio || "No bio added yet"}
                                  </Text>
                                </Box>

                                <Divider />

                                <Box>
                                  <Text fontWeight="semibold" mb={1}>
                                    Member Since
                                  </Text>
                                  <HStack color={textMuted}>
                                    <Icon as={FiCalendar} />
                                    <Text>
                                      {user?.created_at
                                        ? new Date(user.created_at).toLocaleDateString()
                                        : "Unknown"}
                                    </Text>
                                  </HStack>
                                </Box>
                              </>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Stats Grid */}
                      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                        <Card bg={cardBg} p={4}>
                          <Stat>
                            <StatLabel color={textMuted}>Total Tasks</StatLabel>
                            <StatNumber>{taskStats?.total || 0}</StatNumber>
                            <StatHelpText>
                              <Icon as={FiTarget} mr={1} />
                              All time
                            </StatHelpText>
                          </Stat>
                        </Card>

                        <Card bg={cardBg} p={4}>
                          <Stat>
                            <StatLabel color={textMuted}>Completed</StatLabel>
                            <StatNumber color="green.500">
                              {taskStats?.completed || 0}
                            </StatNumber>
                            <StatHelpText>
                              <Icon as={FiCheckCircle} mr={1} />
                              {completionRate}% rate
                            </StatHelpText>
                          </Stat>
                        </Card>

                        <Card bg={cardBg} p={4}>
                          <Stat>
                            <StatLabel color={textMuted}>In Progress</StatLabel>
                            <StatNumber color="blue.500">
                              {taskStats?.inProgress || 0}
                            </StatNumber>
                            <StatHelpText>
                              <Icon as={FiClock} mr={1} />
                              Active now
                            </StatHelpText>
                          </Stat>
                        </Card>

                        <Card bg={cardBg} p={4}>
                          <Stat>
                            <StatLabel color={textMuted}>Productivity</StatLabel>
                            <StatNumber>{completionRate}%</StatNumber>
                            <Progress
                              value={completionRate}
                              colorScheme={completionRate > 70 ? "green" : completionRate > 40 ? "yellow" : "red"}
                              size="sm"
                              mt={2}
                              borderRadius="full"
                            />
                          </Stat>
                        </Card>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  {/* Appearance Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={4}>
                          Appearance Settings
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Customize how TaskHub looks and feels
                        </Text>
                      </Box>

                      <VStack align="stretch" spacing={4}>
                        {/* Theme Mode */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between" mb={4}>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">Theme Mode</Text>
                              <Text fontSize="sm" color={textMuted}>
                                Choose your preferred color scheme
                              </Text>
                            </VStack>
                          </HStack>
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
                        </Box>
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