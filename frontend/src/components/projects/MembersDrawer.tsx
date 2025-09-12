import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Select,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Spinner,
  Box,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useState, useRef } from "react";
import {
  useProjectMembers,
  useAddProjectMember,
  useUpdateProjectMember,
  useRemoveProjectMember,
} from "../../hooks/useProjectMembers";
import { useUsers } from "../../hooks/useUsers";
import type { ProjectMemberRole } from "../../services/projectMemberService";

interface MembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function MembersDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
}: MembersDrawerProps) {
  const toast = useToast();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // Dark mode support
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const cardBg = useColorModeValue('white', 'dark.bg.tertiary');
  const drawerBg = useColorModeValue('white', 'dark.bg.secondary');

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>("member");
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: members, isLoading: membersLoading } =
    useProjectMembers(projectId);
  const { data: users, isLoading: usersLoading } = useUsers();
  const addMemberMutation = useAddProjectMember();
  const updateMemberMutation = useUpdateProjectMember();
  const removeMemberMutation = useRemoveProjectMember();

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast({
        title: "Please select a user",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        project_id: projectId,
        user_id: selectedUserId,
        role: selectedRole,
      });

      setSelectedUserId("");
      setSelectedRole("member");

      toast({
        title: "Member added successfully",
        status: "success",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Failed to add member",
        description: error.response?.data?.detail || "An error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: ProjectMemberRole
  ) => {
    try {
      await updateMemberMutation.mutateAsync({
        project_id: projectId,
        member_id: memberId,
        role: newRole,
      });

      toast({
        title: "Member role updated",
        status: "success",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update member role",
        description: error.response?.data?.detail || "An error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    onDeleteOpen();
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await removeMemberMutation.mutateAsync({
        project_id: projectId,
        member_id: memberToDelete.id,
      });

      toast({
        title: "Member removed successfully",
        status: "success",
        duration: 3000,
      });

      onDeleteClose();
      setMemberToDelete(null);
    } catch (error: any) {
      toast({
        title: "Failed to remove member",
        description: error.response?.data?.detail || "An error occurred",
        status: "error",
        duration: 5000,
      });
    }
  };

  // Filter out users who are already members
  const availableUsers =
    users?.users.filter(
      (user) => !members?.members.some((member) => member.user_id === user.id)
    ) || [];

  const getRoleBadgeColor = (role: ProjectMemberRole) => {
    switch (role) {
      case "owner":
        return "purple";
      case "admin":
        return "red";
      case "manager":
        return "orange";
      case "member":
        return "blue";
      case "guest":
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg={drawerBg}>
          <DrawerCloseButton />
          <DrawerHeader>
            <Text>Project Members</Text>
            <Text fontSize="sm" color="gray.500" fontWeight="normal">
              {projectName}
            </Text>
          </DrawerHeader>

          <DrawerBody>
            <VStack spacing={6} align="stretch">
              {/* Add New Member Section */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  Add New Member
                </Text>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">Select User</FormLabel>
                    <Select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      placeholder="Choose a user..."
                      isDisabled={usersLoading || availableUsers.length === 0}
                    >
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user?.full_name || user?.username || user?.email || "Unknown User"}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Role</FormLabel>
                    <Select
                      value={selectedRole}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as ProjectMemberRole)
                      }
                      aria-label="Select role for new member"
                    >
                      <option value="guest">Guest</option>
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </Select>
                  </FormControl>

                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={handleAddMember}
                    isLoading={addMemberMutation.isPending}
                    isDisabled={!selectedUserId || availableUsers.length === 0}
                    w="full"
                  >
                    Add Member
                  </Button>
                </VStack>
              </Box>

              {/* Current Members Section */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  Current Members ({members?.total || 0})
                </Text>

                {membersLoading ? (
                  <Box textAlign="center" py={4}>
                    <Spinner />
                  </Box>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {members?.members.map((member) => (
                      <HStack
                        key={member.id}
                        p={3}
                        border="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        justify="space-between"
                      >
                        <HStack spacing={3}>
                          <Avatar
                            size="sm"
                            name={member.user?.full_name || member.user?.username || member.user?.email || "Unknown User"}
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {member.user?.full_name || member.user?.username || "Unknown"}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {member.user?.email || "No email"}
                            </Text>
                          </VStack>
                        </HStack>

                        <HStack spacing={2}>
                          <Select
                            size="sm"
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                member.id,
                                e.target.value as ProjectMemberRole
                              )
                            }
                            isDisabled={
                              member.role === "owner" ||
                              updateMemberMutation.isPending
                            }
                            minW="100px"
                            aria-label="Member role"
                          >
                            <option value="guest">Guest</option>
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                            {member.role === "owner" && (
                              <option value="owner">Owner</option>
                            )}
                          </Select>

                          <Badge
                            colorScheme={getRoleBadgeColor(member.role)}
                            fontSize="xs"
                          >
                            {member.role}
                          </Badge>

                          {member.role !== "owner" && (
                            <IconButton
                              aria-label="Remove member"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() =>
                                handleDeleteMember(
                                  member.id,
                                  member.user?.full_name || member.user?.username || member.user?.email || "Unknown User"
                                )
                              }
                              isLoading={removeMemberMutation.isPending}
                            />
                          )}
                        </HStack>
                      </HStack>
                    ))}

                    {members?.members.length === 0 && (
                      <Text textAlign="center" color="gray.500" py={4}>
                        No members found
                      </Text>
                    )}
                  </VStack>
                )}
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Member
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove{" "}
              <strong>{memberToDelete?.name}</strong> from this project? This
              action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteMember}
                ml={3}
                isLoading={removeMemberMutation.isPending}
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
