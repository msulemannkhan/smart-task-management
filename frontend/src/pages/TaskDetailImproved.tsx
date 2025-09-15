import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  ButtonGroup,
  IconButton,
  Input,
  Textarea,
  Select,
  Badge,
  Divider,
  Avatar,
  AvatarGroup,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  useToast,
  Flex,
  Icon,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Card,
  CardBody,
  Grid,
  GridItem,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  chakra,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiEdit2,
  FiSave,
  FiX,
  FiTrash2,
  FiPaperclip,
  FiClock,
  FiCalendar,
  FiUser,
  FiFlag,
  FiFolder,
  FiMessageSquare,
  FiActivity,
  FiCheck,
  FiAlertCircle,
  FiMoreVertical,
  FiTag,
  FiLink,
  FiDownload,
  FiEye,
  FiPlus,
  FiSearch,
} from "react-icons/fi";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { TaskService } from "../services/taskService";
import { ProjectService } from "../services/projectService";
import { Task, TaskStatus, TaskPriority } from "../types/task";
import { useUsers } from "../hooks/useUsers";
import { UserAvatar } from "../components/common/UserAvatar";
import { api } from "../api/client";

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  action: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  created_at: string;
  details: Record<string, any>;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_by: {
    id: string;
    full_name: string;
    email: string;
  };
  uploaded_at: string;
}

export function TaskDetailImproved() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newTag, setNewTag] = useState("");

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Enhanced color mode values for better contrast
  const bgColor = useColorModeValue("gray.50", "#0a0e1a");
  const cardBg = useColorModeValue("white", "#141922");
  const borderColor = useColorModeValue("gray.200", "#2d3447");
  const sidebarBg = useColorModeValue("white", "#1c2333");
  const hoverBg = useColorModeValue("gray.50", "#252c3d");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const accentBg = useColorModeValue("blue.50", "blue.900");
  const accentColor = useColorModeValue("blue.600", "blue.300");

  // Fetch task data
  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => TaskService.getById(taskId!),
    enabled: !!taskId,
  });

  // Other queries remain the same...
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: ProjectService.list,
  });

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/comments`);
        return response.data as Comment[];
      } catch (error) {
        return [];
      }
    },
    enabled: !!taskId,
  });

  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/attachments`);
        return response.data as Attachment[];
      } catch (error) {
        return [];
      }
    },
    enabled: !!taskId,
  });

  const { data: usersResponse } = useUsers();
  const users = usersResponse?.users || [];

  // Mutations remain the same...
  const updateTaskMutation = useMutation({
    mutationFn: (updates: Partial<Task>) => TaskService.update(taskId!, updates),
    onSuccess: () => {
      toast({
        title: "Task updated successfully",
        status: "success",
        duration: 3000,
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => TaskService.deleteTask(taskId!),
    onSuccess: () => {
      toast({
        title: "Task deleted successfully",
        status: "success",
        duration: 3000,
      });
      navigate("/tasks");
    },
  });

  // Helper functions
  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      [TaskStatus.TODO]: "gray",
      [TaskStatus.IN_PROGRESS]: "blue",
      [TaskStatus.IN_REVIEW]: "purple",
      [TaskStatus.DONE]: "green",
      [TaskStatus.BLOCKED]: "red",
      [TaskStatus.BACKLOG]: "orange",
      [TaskStatus.CANCELLED]: "gray",
    };
    return colors[status] || "gray";
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      [TaskPriority.LOW]: "green",
      [TaskPriority.MEDIUM]: "yellow",
      [TaskPriority.HIGH]: "orange",
      [TaskPriority.CRITICAL]: "red",
    };
    return colors[priority] || "gray";
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    const icons = {
      [TaskPriority.LOW]: "↓",
      [TaskPriority.MEDIUM]: "→",
      [TaskPriority.HIGH]: "↑",
      [TaskPriority.CRITICAL]: "⚡",
    };
    return icons[priority] || "→";
  };

  const isOverdue = task?.due_date && isAfter(new Date(), new Date(task.due_date)) && task.status !== TaskStatus.DONE;

  useEffect(() => {
    if (task && !isEditing) {
      setEditedTask({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        project_id: task.project_id,
        assignee_id: task.assignee_id,
        tags: task.tags || [],
      });
    }
  }, [task, isEditing]);

  const handleSave = () => {
    if (!editedTask.title?.trim()) {
      toast({
        title: "Task title is required",
        status: "error",
        duration: 3000,
      });
      return;
    }
    updateTaskMutation.mutate(editedTask);
  };

  const handleQuickUpdate = (field: string, value: any) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const updatedTags = [...(editedTask.tags || []), newTag.trim()];
    setEditedTask({ ...editedTask, tags: updatedTags });
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (editedTask.tags || []).filter(tag => tag !== tagToRemove);
    setEditedTask({ ...editedTask, tags: updatedTags });
  };

  if (isLoading) {
    return (
      <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <chakra.div
            className="spinner"
            borderColor={accentColor}
            borderTopColor="transparent"
            borderWidth="3px"
            borderRadius="full"
            w="40px"
            h="40px"
            animation="spin 0.8s linear infinite"
          />
          <Text color={mutedColor}>Loading task details...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Icon as={FiAlertCircle} boxSize={12} color="red.500" />
          <Text fontSize="lg" color={mutedColor}>Task not found</Text>
          <Button onClick={() => navigate("/tasks")} leftIcon={<FiArrowLeft />}>
            Back to Tasks
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Box
        bg={cardBg}
        borderBottom="1px"
        borderColor={borderColor}
        px={6}
        py={4}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <IconButton
              aria-label="Back"
              icon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate("/tasks")}
            />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" color={mutedColor}>
                Tasks / {task.project?.name || "No Project"}
              </Text>
              <Heading size="md" color={textColor}>
                Task Details
              </Heading>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            {isEditing ? (
              <>
                <Button
                  leftIcon={<FiSave />}
                  colorScheme="blue"
                  onClick={handleSave}
                  isLoading={updateTaskMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  leftIcon={<FiX />}
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  leftIcon={<FiEdit2 />}
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                  />
                  <MenuList bg={cardBg} borderColor={borderColor}>
                    <MenuItem
                      icon={<FiLink />}
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link copied",
                          status: "success",
                          duration: 2000,
                        });
                      }}
                    >
                      Copy Link
                    </MenuItem>
                    <MenuItem
                      icon={<FiTrash2 />}
                      color="red.500"
                      onClick={onDeleteOpen}
                    >
                      Delete Task
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={6}>
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          {/* Left Column - Main Content */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Task Header Card */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    {/* Title and Status */}
                    <Flex justify="space-between" align="start" gap={4}>
                      {isEditing ? (
                        <Input
                          value={editedTask.title}
                          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                          size="lg"
                          fontSize="2xl"
                          fontWeight="bold"
                          placeholder="Task title"
                          bg={hoverBg}
                          borderColor={borderColor}
                        />
                      ) : (
                        <Heading size="lg" color={textColor}>
                          {task.title}
                        </Heading>
                      )}
                      <HStack>
                        <Badge
                          colorScheme={getStatusColor(task.status)}
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge
                          colorScheme={getPriorityColor(task.priority)}
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {getPriorityIcon(task.priority)} {task.priority}
                        </Badge>
                      </HStack>
                    </Flex>

                    {/* Description */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={mutedColor} mb={2}>
                        Description
                      </Text>
                      {isEditing ? (
                        <Textarea
                          value={editedTask.description}
                          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                          minH="120px"
                          resize="vertical"
                          placeholder="Add a description..."
                          bg={hoverBg}
                          borderColor={borderColor}
                        />
                      ) : (
                        <Box
                          p={4}
                          bg={hoverBg}
                          borderRadius="lg"
                          minH="80px"
                        >
                          <Text color={task.description ? textColor : mutedColor}>
                            {task.description || "No description provided"}
                          </Text>
                        </Box>
                      )}
                    </Box>

                    {/* Tags */}
                    {(task.tags?.length > 0 || isEditing) && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color={mutedColor} mb={2}>
                          Tags
                        </Text>
                        <Wrap spacing={2}>
                          {(isEditing ? editedTask.tags : task.tags)?.map((tag) => (
                            <WrapItem key={tag}>
                              <Tag
                                size="md"
                                borderRadius="full"
                                variant="subtle"
                                colorScheme="blue"
                              >
                                <TagLabel>{tag}</TagLabel>
                                {isEditing && (
                                  <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                                )}
                              </Tag>
                            </WrapItem>
                          ))}
                          {isEditing && (
                            <WrapItem>
                              <InputGroup size="sm" maxW="200px">
                                <Input
                                  value={newTag}
                                  onChange={(e) => setNewTag(e.target.value)}
                                  placeholder="Add tag"
                                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                                  borderRadius="full"
                                />
                              </InputGroup>
                            </WrapItem>
                          )}
                        </Wrap>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Tabs for Comments, Activity, Attachments */}
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody p={0}>
                  <Tabs index={activeTab} onChange={setActiveTab}>
                    <TabList borderBottomColor={borderColor} px={4}>
                      <Tab>
                        <HStack spacing={2}>
                          <Icon as={FiMessageSquare} />
                          <Text>Comments</Text>
                          <Badge colorScheme="gray" borderRadius="full">
                            {comments.length}
                          </Badge>
                        </HStack>
                      </Tab>
                      <Tab>
                        <HStack spacing={2}>
                          <Icon as={FiActivity} />
                          <Text>Activity</Text>
                        </HStack>
                      </Tab>
                      <Tab>
                        <HStack spacing={2}>
                          <Icon as={FiPaperclip} />
                          <Text>Attachments</Text>
                          <Badge colorScheme="gray" borderRadius="full">
                            {attachments.length}
                          </Badge>
                        </HStack>
                      </Tab>
                    </TabList>

                    <TabPanels>
                      {/* Comments Panel */}
                      <TabPanel>
                        <VStack align="stretch" spacing={4}>
                          {/* Add Comment */}
                          <HStack align="start" spacing={3}>
                            <UserAvatar user={users[0]} size="sm" />
                            <InputGroup flex={1}>
                              <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                minH="80px"
                                bg={hoverBg}
                                borderColor={borderColor}
                              />
                            </InputGroup>
                          </HStack>
                          {newComment && (
                            <HStack justify="flex-end">
                              <Button size="sm" variant="ghost" onClick={() => setNewComment("")}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => {
                                  // Add comment logic
                                  setNewComment("");
                                }}
                              >
                                Comment
                              </Button>
                            </HStack>
                          )}

                          <Divider borderColor={borderColor} />

                          {/* Comments List */}
                          {comments.length > 0 ? (
                            <VStack align="stretch" spacing={4}>
                              {comments.map((comment) => (
                                <HStack key={comment.id} align="start" spacing={3}>
                                  <UserAvatar user={comment.user} size="sm" />
                                  <Box flex={1}>
                                    <HStack mb={1}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {comment.user.full_name}
                                      </Text>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                      </Text>
                                    </HStack>
                                    <Text fontSize="sm" color={textColor}>
                                      {comment.content}
                                    </Text>
                                  </Box>
                                </HStack>
                              ))}
                            </VStack>
                          ) : (
                            <Text color={mutedColor} textAlign="center" py={4}>
                              No comments yet
                            </Text>
                          )}
                        </VStack>
                      </TabPanel>

                      {/* Activity Panel */}
                      <TabPanel>
                        <Text color={mutedColor} textAlign="center" py={8}>
                          Activity tracking coming soon
                        </Text>
                      </TabPanel>

                      {/* Attachments Panel */}
                      <TabPanel>
                        <VStack align="stretch" spacing={4}>
                          <Button
                            leftIcon={<FiPaperclip />}
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            isLoading={isUploading}
                          >
                            Upload Files
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={(e) => {
                              // Handle file upload
                            }}
                          />

                          {attachments.length > 0 ? (
                            <VStack align="stretch" spacing={2}>
                              {attachments.map((attachment) => (
                                <HStack
                                  key={attachment.id}
                                  p={3}
                                  bg={hoverBg}
                                  borderRadius="lg"
                                  justify="space-between"
                                >
                                  <HStack flex={1}>
                                    <Icon as={FiPaperclip} color={mutedColor} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="medium">
                                        {attachment.name}
                                      </Text>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {(attachment.size / 1024).toFixed(2)} KB • {attachment.uploaded_by.full_name}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  <HStack>
                                    <IconButton
                                      aria-label="Download"
                                      icon={<FiDownload />}
                                      size="sm"
                                      variant="ghost"
                                      as="a"
                                      href={attachment.url}
                                      download
                                    />
                                  </HStack>
                                </HStack>
                              ))}
                            </VStack>
                          ) : (
                            <Text color={mutedColor} textAlign="center" py={4}>
                              No attachments yet
                            </Text>
                          )}
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>

          {/* Right Column - Sidebar */}
          <GridItem>
            <Card bg={sidebarBg} borderColor={borderColor} borderWidth="1px" position="sticky" top="100px">
              <CardBody>
                <VStack align="stretch" spacing={6}>
                  {/* Quick Actions */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={mutedColor} mb={3}>
                      Quick Actions
                    </Text>
                    <Button
                      w="full"
                      colorScheme={task.status === TaskStatus.DONE ? "gray" : "green"}
                      leftIcon={<FiCheck />}
                      onClick={() => handleQuickUpdate("status", TaskStatus.DONE)}
                      isDisabled={task.status === TaskStatus.DONE}
                    >
                      Mark Complete
                    </Button>
                  </Box>

                  <Divider borderColor={borderColor} />

                  {/* Details */}
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="sm" fontWeight="medium" color={mutedColor}>
                      Details
                    </Text>

                    {/* Status */}
                    <Box>
                      <HStack mb={2}>
                        <Icon as={FiActivity} color={mutedColor} />
                        <Text fontSize="sm" color={mutedColor}>Status</Text>
                      </HStack>
                      {isEditing ? (
                        <Select
                          value={editedTask.status}
                          onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
                          size="sm"
                          bg={hoverBg}
                          borderColor={borderColor}
                        >
                          {Object.values(TaskStatus).map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge colorScheme={getStatusColor(task.status)} variant="subtle" px={2} py={1}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      )}
                    </Box>

                    {/* Priority */}
                    <Box>
                      <HStack mb={2}>
                        <Icon as={FiFlag} color={mutedColor} />
                        <Text fontSize="sm" color={mutedColor}>Priority</Text>
                      </HStack>
                      {isEditing ? (
                        <Select
                          value={editedTask.priority}
                          onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })}
                          size="sm"
                          bg={hoverBg}
                          borderColor={borderColor}
                        >
                          {Object.values(TaskPriority).map((priority) => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge colorScheme={getPriorityColor(task.priority)} variant="subtle" px={2} py={1}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </Badge>
                      )}
                    </Box>

                    {/* Assignee */}
                    <Box>
                      <HStack mb={2}>
                        <Icon as={FiUser} color={mutedColor} />
                        <Text fontSize="sm" color={mutedColor}>Assignee</Text>
                      </HStack>
                      {isEditing ? (
                        <Select
                          value={editedTask.assignee_id}
                          onChange={(e) => setEditedTask({ ...editedTask, assignee_id: e.target.value || undefined })}
                          size="sm"
                          bg={hoverBg}
                          borderColor={borderColor}
                        >
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </option>
                          ))}
                        </Select>
                      ) : task.assignee ? (
                        <HStack>
                          <UserAvatar user={task.assignee} size="xs" />
                          <Text fontSize="sm">{task.assignee.full_name || task.assignee.email}</Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={mutedColor}>Unassigned</Text>
                      )}
                    </Box>

                    {/* Due Date */}
                    <Box>
                      <HStack mb={2}>
                        <Icon as={FiCalendar} color={mutedColor} />
                        <Text fontSize="sm" color={mutedColor}>Due Date</Text>
                      </HStack>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedTask.due_date || ""}
                          onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value || undefined })}
                          size="sm"
                          bg={hoverBg}
                          borderColor={borderColor}
                        />
                      ) : task.due_date ? (
                        <HStack>
                          <Text fontSize="sm" color={isOverdue ? "red.500" : textColor}>
                            {format(new Date(task.due_date), "MMM d, yyyy")}
                          </Text>
                          {isOverdue && (
                            <Badge colorScheme="red" fontSize="xs">Overdue</Badge>
                          )}
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={mutedColor}>No due date</Text>
                      )}
                    </Box>

                    {/* Project */}
                    <Box>
                      <HStack mb={2}>
                        <Icon as={FiFolder} color={mutedColor} />
                        <Text fontSize="sm" color={mutedColor}>Project</Text>
                      </HStack>
                      {isEditing ? (
                        <Select
                          value={editedTask.project_id || ""}
                          onChange={(e) => setEditedTask({ ...editedTask, project_id: e.target.value || undefined })}
                          size="sm"
                          bg={hoverBg}
                          borderColor={borderColor}
                        >
                          <option value="">No project</option>
                          {projectsData?.projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </Select>
                      ) : task.project ? (
                        <HStack>
                          <Box w={3} h={3} bg={task.project.color} borderRadius="full" />
                          <Text fontSize="sm">{task.project.name}</Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={mutedColor}>No project</Text>
                      )}
                    </Box>

                    {/* Created */}
                    <Box>
                      <HStack mb={2}>
                        <Icon as={FiClock} color={mutedColor} />
                        <Text fontSize="sm" color={mutedColor}>Created</Text>
                      </HStack>
                      <Text fontSize="sm">
                        {format(new Date(task.created_at), "MMM d, yyyy")}
                      </Text>
                    </Box>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent bg={cardBg}>
          <ModalHeader>Delete Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this task? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                deleteTaskMutation.mutate();
                onDeleteClose();
              }}
              isLoading={deleteTaskMutation.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}