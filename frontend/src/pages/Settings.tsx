import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Switch,
  Button,
  FormControl,
  FormLabel,
  Select,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useColorMode,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  SimpleGrid,
  Badge,
  Flex,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Input,
  RadioGroup,
  Stack,
  Radio,
  Tooltip,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import {
  FiTrash2,
  FiDownload,
  FiShield,
  FiBell,
  FiGlobe,
  FiUser,
  FiEdit,
  FiLock,
  FiDatabase,
  FiMoon,
  FiSun,
  FiMonitor,
  FiMail,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiSave,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import useCustomToast from "../hooks/useToast";

export function Settings() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { logout } = useAuth();
  const toast = useCustomToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "dark.bg.hover");

  const [settings, setSettings] = useState({
    // Appearance
    colorMode: colorMode,
    fontSize: "medium",
    compactMode: false,
    animations: true,

    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    taskReminders: true,
    mentionNotifications: true,
    projectUpdates: true,
    notificationSound: true,
    quietHours: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",

    // Preferences
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    weekStart: "sunday",
    autoSave: true,
    defaultView: "kanban",
    taskSort: "priority",

    // Privacy
    profileVisibility: "public",
    activityTracking: true,
    dataSharing: false,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    // TODO: Implement actual save to backend
    toast.success("Settings saved successfully");
    setHasUnsavedChanges(false);
  };

  const handleExportData = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: "Preparing your data export...",
      success: "Data export ready for download",
      error: "Failed to export data",
    });
  };

  const handleDeleteAccount = () => {
    toast.warning("Please contact support to complete account deletion");
    onClose();
  };

  const tabIconProps = {
    mr: 2,
    boxSize: 4,
  };

  return (
    <Box h="full" bg={bgColor} overflowY="auto">
      <Box maxW="6xl" mx="auto" p={6}>
        <VStack align="stretch" spacing={6}>
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg">Settings</Heading>
              <Text color={textMuted} fontSize="sm" mt={1}>
                Customize your workspace and preferences
              </Text>
            </Box>
            {hasUnsavedChanges && (
              <Button
                leftIcon={<FiSave />}
                colorScheme="primary"
                onClick={handleSaveSettings}
              >
                Save Changes
              </Button>
            )}
          </Flex>

          {/* Settings Tabs */}
          <Card bg={cardBg} borderRadius="xl" overflow="hidden">
            <CardBody p={0}>
              <Tabs orientation="vertical" variant="line" colorScheme="primary">
                <TabList borderRightWidth="1px" borderColor={borderColor} p={4}>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiEdit} {...tabIconProps} />
                    Appearance
                  </Tab>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiBell} {...tabIconProps} />
                    Notifications
                  </Tab>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiGlobe} {...tabIconProps} />
                    Preferences
                  </Tab>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiShield} {...tabIconProps} />
                    Privacy & Security
                  </Tab>
                  <Tab justifyContent="flex-start">
                    <Icon as={FiDatabase} {...tabIconProps} />
                    Data Management
                  </Tab>
                </TabList>

                <TabPanels p={6}>
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
                              <Radio value="system" isDisabled>
                                <HStack spacing={2}>
                                  <Icon as={FiMonitor} />
                                  <Text>System</Text>
                                  <Badge colorScheme="yellow" fontSize="xs">
                                    Coming Soon
                                  </Badge>
                                </HStack>
                              </Radio>
                            </Stack>
                          </RadioGroup>
                        </Box>

                        {/* Font Size */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">Font Size</Text>
                              <Text fontSize="sm" color={textMuted}>
                                Adjust text size for better readability
                              </Text>
                            </VStack>
                            <Select
                              value={settings.fontSize}
                              onChange={(e) =>
                                handleSettingChange("fontSize", e.target.value)
                              }
                              w="150px"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </Select>
                          </HStack>
                        </Box>

                        {/* Compact Mode */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">Compact Mode</Text>
                              <Text fontSize="sm" color={textMuted}>
                                Reduce spacing between elements
                              </Text>
                            </VStack>
                            <Switch
                              isChecked={settings.compactMode}
                              onChange={(e) =>
                                handleSettingChange(
                                  "compactMode",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>

                        {/* Animations */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">Enable Animations</Text>
                              <Text fontSize="sm" color={textMuted}>
                                Show smooth transitions and effects
                              </Text>
                            </VStack>
                            <Switch
                              isChecked={settings.animations}
                              onChange={(e) =>
                                handleSettingChange(
                                  "animations",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>
                      </VStack>
                    </VStack>
                  </TabPanel>

                  {/* Notifications Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={4}>
                          Notification Preferences
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Control how and when you receive notifications
                        </Text>
                      </Box>

                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        {/* Email Notifications */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Icon as={FiMail} color="blue.500" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" fontSize="sm">
                                  Email Notifications
                                </Text>
                                <Text fontSize="xs" color={textMuted}>
                                  Receive updates via email
                                </Text>
                              </VStack>
                            </HStack>
                            <Switch
                              isChecked={settings.emailNotifications}
                              onChange={(e) =>
                                handleSettingChange(
                                  "emailNotifications",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>

                        {/* Push Notifications */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Icon as={FiBell} color="purple.500" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" fontSize="sm">
                                  Push Notifications
                                </Text>
                                <Text fontSize="xs" color={textMuted}>
                                  Browser notifications
                                </Text>
                              </VStack>
                            </HStack>
                            <Switch
                              isChecked={settings.pushNotifications}
                              onChange={(e) =>
                                handleSettingChange(
                                  "pushNotifications",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>

                        {/* Task Reminders */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Icon as={FiClock} color="orange.500" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" fontSize="sm">
                                  Task Reminders
                                </Text>
                                <Text fontSize="xs" color={textMuted}>
                                  Due date notifications
                                </Text>
                              </VStack>
                            </HStack>
                            <Switch
                              isChecked={settings.taskReminders}
                              onChange={(e) =>
                                handleSettingChange(
                                  "taskReminders",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>

                        {/* Weekly Reports */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Icon as={FiCalendar} color="green.500" />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium" fontSize="sm">
                                  Weekly Reports
                                </Text>
                                <Text fontSize="xs" color={textMuted}>
                                  Productivity summaries
                                </Text>
                              </VStack>
                            </HStack>
                            <Switch
                              isChecked={settings.weeklyReports}
                              onChange={(e) =>
                                handleSettingChange(
                                  "weeklyReports",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>
                      </SimpleGrid>

                      {/* Quiet Hours */}
                      <Box
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={borderColor}
                      >
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">Quiet Hours</Text>
                              <Text fontSize="sm" color={textMuted}>
                                Pause notifications during specific hours
                              </Text>
                            </VStack>
                            <Switch
                              isChecked={settings.quietHours}
                              onChange={(e) =>
                                handleSettingChange(
                                  "quietHours",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                          {settings.quietHours && (
                            <HStack spacing={4}>
                              <FormControl>
                                <FormLabel fontSize="sm">From</FormLabel>
                                <Input
                                  type="time"
                                  value={settings.quietHoursStart}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "quietHoursStart",
                                      e.target.value
                                    )
                                  }
                                  size="sm"
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">To</FormLabel>
                                <Input
                                  type="time"
                                  value={settings.quietHoursEnd}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "quietHoursEnd",
                                      e.target.value
                                    )
                                  }
                                  size="sm"
                                />
                              </FormControl>
                            </HStack>
                          )}
                        </VStack>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Preferences Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={4}>
                          General Preferences
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Customize your workspace behavior
                        </Text>
                      </Box>

                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Language</FormLabel>
                          <Select
                            value={settings.language}
                            onChange={(e) =>
                              handleSettingChange("language", e.target.value)
                            }
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="ja">Japanese</option>
                            <option value="zh">Chinese</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Timezone</FormLabel>
                          <Select
                            value={settings.timezone}
                            onChange={(e) =>
                              handleSettingChange("timezone", e.target.value)
                            }
                          >
                            <option value="UTC">UTC</option>
                            <option value="EST">Eastern Time</option>
                            <option value="PST">Pacific Time</option>
                            <option value="CET">Central European Time</option>
                            <option value="JST">Japan Standard Time</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Date Format</FormLabel>
                          <Select
                            value={settings.dateFormat}
                            onChange={(e) =>
                              handleSettingChange("dateFormat", e.target.value)
                            }
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Time Format</FormLabel>
                          <Select
                            value={settings.timeFormat}
                            onChange={(e) =>
                              handleSettingChange("timeFormat", e.target.value)
                            }
                          >
                            <option value="12h">12 Hour</option>
                            <option value="24h">24 Hour</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Week Starts On</FormLabel>
                          <Select
                            value={settings.weekStart}
                            onChange={(e) =>
                              handleSettingChange("weekStart", e.target.value)
                            }
                          >
                            <option value="sunday">Sunday</option>
                            <option value="monday">Monday</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Default Task View</FormLabel>
                          <Select
                            value={settings.defaultView}
                            onChange={(e) =>
                              handleSettingChange("defaultView", e.target.value)
                            }
                          >
                            <option value="kanban">Kanban Board</option>
                            <option value="list">List View</option>
                            <option value="grid">Grid View</option>
                          </Select>
                        </FormControl>
                      </SimpleGrid>

                      {/* Auto-save */}
                      <Box
                        p={4}
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={borderColor}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">Auto-save</Text>
                            <Text fontSize="sm" color={textMuted}>
                              Automatically save changes as you work
                            </Text>
                          </VStack>
                          <Switch
                            isChecked={settings.autoSave}
                            onChange={(e) =>
                              handleSettingChange("autoSave", e.target.checked)
                            }
                            colorScheme="primary"
                          />
                        </HStack>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Privacy & Security Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={4}>
                          Privacy & Security
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Manage your privacy settings and security preferences
                        </Text>
                      </Box>

                      <VStack align="stretch" spacing={4}>
                        {/* Profile Visibility */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <VStack align="stretch" spacing={3}>
                            <Text fontWeight="medium">Profile Visibility</Text>
                            <RadioGroup
                              value={settings.profileVisibility}
                              onChange={(value) =>
                                handleSettingChange("profileVisibility", value)
                              }
                            >
                              <Stack spacing={2}>
                                <Radio value="public">
                                  <HStack spacing={2}>
                                    <Text fontSize="sm">Public</Text>
                                    <Text fontSize="xs" color={textMuted}>
                                      Anyone can view your profile
                                    </Text>
                                  </HStack>
                                </Radio>
                                <Radio value="team">
                                  <HStack spacing={2}>
                                    <Text fontSize="sm">Team Only</Text>
                                    <Text fontSize="xs" color={textMuted}>
                                      Only team members can view
                                    </Text>
                                  </HStack>
                                </Radio>
                                <Radio value="private">
                                  <HStack spacing={2}>
                                    <Text fontSize="sm">Private</Text>
                                    <Text fontSize="xs" color={textMuted}>
                                      Only you can view
                                    </Text>
                                  </HStack>
                                </Radio>
                              </Stack>
                            </RadioGroup>
                          </VStack>
                        </Box>

                        {/* Activity Tracking */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">Activity Tracking</Text>
                              <Text fontSize="sm" color={textMuted}>
                                Allow tracking of your activity for analytics
                              </Text>
                            </VStack>
                            <Switch
                              isChecked={settings.activityTracking}
                              onChange={(e) =>
                                handleSettingChange(
                                  "activityTracking",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>

                        {/* Data Sharing */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">
                                Anonymous Data Sharing
                              </Text>
                              <Text fontSize="sm" color={textMuted}>
                                Help improve TaskHub with anonymous usage data
                              </Text>
                            </VStack>
                            <Switch
                              isChecked={settings.dataSharing}
                              onChange={(e) =>
                                handleSettingChange(
                                  "dataSharing",
                                  e.target.checked
                                )
                              }
                              colorScheme="primary"
                            />
                          </HStack>
                        </Box>

                        {/* Two-Factor Authentication */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={FiShield} color="green.500" />
                                <Text fontWeight="medium">
                                  Two-Factor Authentication
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color={textMuted}>
                                Add an extra layer of security to your account
                              </Text>
                            </VStack>
                            <Badge colorScheme="yellow">Coming Soon</Badge>
                          </HStack>
                        </Box>
                      </VStack>
                    </VStack>
                  </TabPanel>

                  {/* Data Management Tab */}
                  <TabPanel>
                    <VStack align="stretch" spacing={6}>
                      <Box>
                        <Heading size="md" mb={4}>
                          Data Management
                        </Heading>
                        <Text fontSize="sm" color={textMuted}>
                          Export your data or manage your account
                        </Text>
                      </Box>

                      <VStack align="stretch" spacing={4}>
                        {/* Export Data */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon as={FiDownload} color="blue.500" />
                                <Text fontWeight="medium">
                                  Export Your Data
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color={textMuted}>
                                Download a copy of all your TaskHub data
                              </Text>
                            </VStack>
                            <Button
                              leftIcon={<FiDownload />}
                              variant="outline"
                              size="sm"
                              onClick={handleExportData}
                            >
                              Export Data
                            </Button>
                          </HStack>
                        </Box>

                        {/* Data Retention */}
                        <Box
                          p={4}
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={borderColor}
                        >
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Icon as={FiDatabase} color="purple.500" />
                              <Text fontWeight="medium">Data Retention</Text>
                            </HStack>
                            <Text fontSize="sm" color={textMuted}>
                              Your data is retained for 90 days after account
                              deletion
                            </Text>
                            <Button
                              size="sm"
                              variant="link"
                              colorScheme="primary"
                            >
                              Learn More →
                            </Button>
                          </VStack>
                        </Box>

                        {/* Danger Zone */}
                        <Box
                          p={4}
                          borderWidth="2px"
                          borderRadius="lg"
                          borderColor="red.200"
                          bg={useColorModeValue("red.50", "red.900")}
                        >
                          <VStack align="stretch" spacing={3}>
                            <HStack>
                              <Icon as={FiAlertCircle} color="red.500" />
                              <Text fontWeight="bold" color="red.600">
                                Danger Zone
                              </Text>
                            </HStack>
                            <Text
                              fontSize="sm"
                              color={useColorModeValue("red.700", "red.300")}
                            >
                              Once you delete your account, there is no going
                              back. Please be certain.
                            </Text>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">Delete Account</Text>
                                <Text fontSize="sm" color={textMuted}>
                                  Permanently delete your account and all data
                                </Text>
                              </VStack>
                              <Button
                                colorScheme="red"
                                variant="outline"
                                size="sm"
                                leftIcon={<FiTrash2 />}
                                onClick={onOpen}
                              >
                                Delete Account
                              </Button>
                            </HStack>
                          </VStack>
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

      {/* Delete Account Confirmation */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="start" spacing={3}>
                <Text>
                  Are you absolutely sure you want to delete your account?
                </Text>
                <Box
                  p={3}
                  bg={useColorModeValue("red.50", "red.900")}
                  borderRadius="md"
                >
                  <Text fontSize="sm" fontWeight="medium" color="red.600">
                    This action cannot be undone. This will permanently delete:
                  </Text>
                  <VStack align="start" mt={2} spacing={1}>
                    <Text fontSize="sm">• All your projects and tasks</Text>
                    <Text fontSize="sm">• Your profile and settings</Text>
                    <Text fontSize="sm">• All associated data and files</Text>
                  </VStack>
                </Box>
                <Text fontSize="sm" color={textMuted}>
                  Please type <strong>DELETE</strong> to confirm.
                </Text>
                <Input placeholder="Type DELETE to confirm" />
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                I understand, delete my account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
