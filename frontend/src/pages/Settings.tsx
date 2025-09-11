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
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { FiTrash2, FiDownload, FiShield } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export function Settings() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { logout } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    taskReminders: true,
    language: "en",
    timezone: "UTC",
    autoSave: true,
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast({
      title: "Setting updated",
      status: "success",
      duration: 2000,
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export will be ready shortly",
      status: "info",
      duration: 3000,
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion requested",
      description: "Please contact support to complete this process",
      status: "warning",
      duration: 5000,
    });
    onClose();
  };

  return (
    <Box
      h="full"
      p={6}
      bg="white"
      _dark={{ bg: "black", color: "gray.100" }}
      color="gray.800"
      boxShadow={{ base: "sm", _dark: "md" }}
    >
      <VStack align="stretch" spacing={6} maxW="2xl" mx="auto">
        {/* Header */}
        <Heading size="lg">Settings</Heading>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">Appearance</Heading>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Dark Mode</Text>
                  <Text fontSize="sm" color="gray.600">
                    Toggle between light and dark themes
                  </Text>
                </VStack>
                <Switch
                  isChecked={colorMode === "dark"}
                  onChange={toggleColorMode}
                  colorScheme="blue"
                />
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <Heading size="md">Notifications</Heading>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Email Notifications</Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive notifications via email
                  </Text>
                </VStack>
                <Switch
                  isChecked={settings.emailNotifications}
                  onChange={(e) =>
                    handleSettingChange("emailNotifications", e.target.checked)
                  }
                  colorScheme="blue"
                />
              </HStack>

              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Push Notifications</Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive browser push notifications
                  </Text>
                </VStack>
                <Switch
                  isChecked={settings.pushNotifications}
                  onChange={(e) =>
                    handleSettingChange("pushNotifications", e.target.checked)
                  }
                  colorScheme="blue"
                />
              </HStack>

              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Weekly Reports</Text>
                  <Text fontSize="sm" color="gray.600">
                    Receive weekly productivity reports
                  </Text>
                </VStack>
                <Switch
                  isChecked={settings.weeklyReports}
                  onChange={(e) =>
                    handleSettingChange("weeklyReports", e.target.checked)
                  }
                  colorScheme="blue"
                />
              </HStack>

              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Task Reminders</Text>
                  <Text fontSize="sm" color="gray.600">
                    Get reminded about upcoming due dates
                  </Text>
                </VStack>
                <Switch
                  isChecked={settings.taskReminders}
                  onChange={(e) =>
                    handleSettingChange("taskReminders", e.target.checked)
                  }
                  colorScheme="blue"
                />
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <Heading size="md">Preferences</Heading>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Language</FormLabel>
                <Select
                  value={settings.language}
                  onChange={(e) =>
                    handleSettingChange("language", e.target.value)
                  }
                  aria-label="Select language"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Timezone</FormLabel>
                <Select
                  value={settings.timezone}
                  onChange={(e) =>
                    handleSettingChange("timezone", e.target.value)
                  }
                  aria-label="Select timezone"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="CET">Central European Time</option>
                </Select>
              </FormControl>

              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Auto-save</Text>
                  <Text fontSize="sm" color="gray.600">
                    Automatically save changes as you work
                  </Text>
                </VStack>
                <Switch
                  isChecked={settings.autoSave}
                  onChange={(e) =>
                    handleSettingChange("autoSave", e.target.checked)
                  }
                  colorScheme="blue"
                />
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <HStack spacing={2}>
              <FiShield />
              <Heading size="md">Data & Privacy</Heading>
            </HStack>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Export Data</Text>
                  <Text fontSize="sm" color="gray.600">
                    Download a copy of your data
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiDownload />}
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                >
                  Export
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Danger Zone */}
        <Card borderColor="red.200">
          <CardHeader>
            <HStack spacing={2}>
              <FiTrash2 color="red" />
              <Heading size="md" color="red.600">
                Danger Zone
              </Heading>
            </HStack>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">Delete Account</Text>
                  <Text fontSize="sm" color="gray.600">
                    Permanently delete your account and all data
                  </Text>
                </VStack>
                <Button
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  onClick={onOpen}
                >
                  Delete Account
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Delete Account Confirmation */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete your account? This action cannot
              be undone. All your data, including projects, tasks, and settings
              will be permanently removed.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                Delete Account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
