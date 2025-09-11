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
  useToast,
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
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export function Profile() {
  const { user, token } = useAuth();
  const toast = useToast();
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

      toast({
        title: "Profile updated successfully",
        status: "success",
        duration: 3000,
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: "Please try again later",
        status: "error",
        duration: 5000,
      });
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
      toast({
        title: "All fields are required",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "New passwords do not match",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password must be at least 8 characters",
        status: "error",
        duration: 3000,
      });
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

      toast({
        title: "Password changed successfully",
        description: "Your password has been updated",
        status: "success",
        duration: 3000,
      });

      // Reset form and close modal
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onPasswordModalClose();
    } catch (error) {
      toast({
        title: "Failed to change password",
        description:
          error instanceof Error ? error.message : "Please try again later",
        status: "error",
        duration: 5000,
      });
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
      <Box h="full" bg="white" p={6}>
        <VStack align="center" justify="center" h="full">
          <Spinner size="lg" />
          <Text>Loading profile...</Text>
        </VStack>
      </Box>
    );
  }

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
        <HStack justify="space-between" align="center">
          <Heading size="lg">My Profile</Heading>
          {!isEditing ? (
            <Button
              leftIcon={<FiEdit2 />}
              colorScheme="blue"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <HStack spacing={2}>
              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                onClick={handleSave}
                isLoading={isLoading}
              >
                Save Changes
              </Button>
              <Button
                leftIcon={<FiX />}
                variant="outline"
                onClick={handleCancel}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
            </HStack>
          )}
        </HStack>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <HStack spacing={4}>
              <Avatar
                size="xl"
                name={user.full_name || user.email}
                src={user.avatar_url}
              />
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="semibold">
                  {user.full_name || "User"}
                </Text>
                <Text color="gray.600">{user.email}</Text>
                <Badge colorScheme="green" variant="subtle">
                  Active
                </Badge>
              </VStack>
            </HStack>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  isReadOnly={!isEditing}
                  bg={isEditing ? "white" : "gray.50"}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email Address</FormLabel>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  isReadOnly={!isEditing}
                  bg={isEditing ? "white" : "gray.50"}
                  type="email"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  isReadOnly={!isEditing}
                  bg={isEditing ? "white" : "gray.50"}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiShield />
                <Heading size="md">Security</Heading>
              </HStack>
            </HStack>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">Password</Text>
                  <Text fontSize="sm" color="gray.600">
                    Last changed 30 days ago
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

              <HStack justify="space-between">
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">Two-Factor Authentication</Text>
                  <Text fontSize="sm" color="gray.600">
                    Add an extra layer of security
                  </Text>
                </VStack>
                <Badge colorScheme="yellow">Coming Soon</Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <Heading size="md">Account Information</Heading>
          </CardHeader>

          <Divider />

          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Account Created</Text>
                <Text color="gray.600">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Unknown"}
                </Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="medium">Last Updated</Text>
                <Text color="gray.600">
                  {user.updated_at
                    ? new Date(user.updated_at).toLocaleDateString()
                    : "Unknown"}
                </Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontWeight="medium">User ID</Text>
                <Text color="gray.600" fontSize="sm" fontFamily="mono">
                  {user.id}
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={onPasswordModalClose}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
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
