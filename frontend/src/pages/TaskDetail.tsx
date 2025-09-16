import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Badge,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
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
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Progress,
  Image,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  AvatarGroup,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Fade,
  ScaleFade,
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
  FiSend,
  FiFile,
  FiImage,
  FiFileText,
  FiCheckCircle,
  FiShare2,
  FiCopy,
  FiRefreshCw,
} from "react-icons/fi";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { motion } from "framer-motion";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { TaskService } from "../services/taskService";
import { ProjectService } from "../services/projectService";
import type { Task } from "../types/task";
import { TaskStatus, TaskPriority } from "../types/task";
import { useUsers } from "../hooks/useUsers";
import { UserAvatar } from "../components/common/UserAvatar";
import api from "../services/api";
import { AttachmentService, type Attachment } from "../services/attachmentService";

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


export function TaskDetail() {
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
  const [newTag, setNewTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced color mode values for better dark mode support
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const borderColor = useColorModeValue("gray.200", "dark.border.subtle");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const hoverBg = useColorModeValue("gray.50", "dark.bg.hover");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("blue.500", "blue.400");
  const successColor = useColorModeValue("green.500", "green.400");
  const warningColor = useColorModeValue("orange.500", "orange.400");
  const errorColor = useColorModeValue("red.500", "red.400");

  // Fetch task data
  const {
    data: task,
    isLoading,
    error,
    refetch: refetchTask,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => TaskService.getTask(taskId!),
    enabled: !!taskId,
  });

  // Fetch users for assignment
  const { data: users = [] } = useUsers();

  // Fetch comments
  const {
    data: comments = [],
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/comments`);
      return response.data.comments || [];
    },
    enabled: !!taskId,
  });

  // Fetch activities
  const {
    data: activities = [],
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["task-activities", taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/activities`);
      return response.data.activities || [];
    },
    enabled: !!taskId,
  });

  // Fetch attachments
  const {
    data: attachments = [],
    isLoading: attachmentsLoading,
    refetch: refetchAttachments,
  } = useQuery({
    queryKey: ["task-attachments", taskId],
    queryFn: () => AttachmentService.getTaskAttachments(taskId!),
    enabled: !!taskId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: (updates: Partial<Task>) =>
      TaskService.updateTask(taskId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Task updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Failed to update task",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/tasks/${taskId}/comments`, { content }),
    onSuccess: () => {
      refetchComments();
      setNewComment("");
      toast({
        title: "Comment added",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: () => TaskService.deleteTask(taskId!),
    onSuccess: () => {
      toast({
        title: "Task deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: "Failed to delete task",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  // Upload attachments mutation
  const uploadAttachmentsMutation = useMutation({
    mutationFn: (files: File[]) =>
      AttachmentService.uploadTaskAttachments(taskId!, files),
    onSuccess: () => {
      refetchAttachments();
      toast({
        title: "Files uploaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to upload files",
        description: error.response?.data?.detail || "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split("T")[0] : undefined,
        assignee_id: task.assignee?.id,
        tags: task.tags || [],
      });
    }
  }, [task]);

  const handleSave = () => {
    if (!editedTask.title?.trim()) {
      toast({
        title: "Title is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updates = {
      ...editedTask,
      due_date: editedTask.due_date
        ? new Date(editedTask.due_date).toISOString()
        : undefined,
    };

    updateTaskMutation.mutate(updates);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  const handleShare = () => {
    const taskUrl = `${window.location.origin}/tasks/${taskId}`;
    navigator.clipboard.writeText(taskUrl).then(() => {
      toast({
        title: "Link copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchTask(),
        refetchComments(),
        refetchActivities(),
        refetchAttachments(),
      ]);
      toast({
        title: "Data refreshed",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to refresh data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "gray";
      case TaskPriority.MEDIUM:
        return "blue";
      case TaskPriority.HIGH:
        return "orange";
      case TaskPriority.URGENT:
        return "red";
      case TaskPriority.CRITICAL:
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "gray";
      case TaskStatus.IN_PROGRESS:
        return "blue";
      case TaskStatus.IN_REVIEW:
        return "purple";
      case TaskStatus.DONE:
        return "green";
      case TaskStatus.BLOCKED:
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    return status.replace("_", " ").toUpperCase();
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg={bgColor} p={6}>
        <VStack align="center" justify="center" h="80vh">
          <Spinner size="xl" color={accentColor} thickness="4px" />
          <Text color={textColor} fontSize="lg">
            Loading task...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box minH="100vh" bg={bgColor} p={6}>
        <VStack align="center" justify="center" h="80vh" spacing={6}>
          <Alert status="error" maxW="md" borderRadius="lg">
            <AlertIcon />
            <Text>Task not found or failed to load</Text>
          </Alert>
          <Button
            leftIcon={<FiArrowLeft />}
            onClick={() => navigate(-1)}
            colorScheme="blue"
          >
            Go Back
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <MotionBox
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      minH="100vh"
      bg={bgColor}
    >
      <Box p={{ base: 4, md: 6 }}>
        <VStack align="stretch" spacing={6}>
          {/* Enhanced Header */}
          <MotionCard
            variants={cardVariants}
            bg={cardBg}
            borderRadius="2xl"
            shadow="md"
            border="1px"
            borderColor={borderColor}
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${
                task.project?.color || accentColor
              } 0%, ${accentColor} 50%, ${
                task.project?.color || accentColor
              } 100%)`,
              opacity: 0.8,
            }}
          >
            <CardBody p={6}>
              <VStack align="stretch" spacing={6}>
                {/* Top Navigation */}
                <HStack justify="space-between" align="center">
                  <HStack spacing={4}>
                    <Button
                      variant="ghost"
                      leftIcon={<FiArrowLeft />}
                      onClick={() => navigate(-1)}
                      size="sm"
                      color={textColor}
                      _hover={{ bg: hoverBg }}
                    >
                      Back
                    </Button>
                    {task.project && (
                      <>
                        <Divider
                          orientation="vertical"
                          h="6"
                          borderColor={borderColor}
                        />
                        <HStack spacing={2}>
                          <Box
                            w={4}
                            h={4}
                            bg={task.project.color}
                            borderRadius="md"
                          />
                          <Text fontSize="sm" color={mutedColor} fontWeight="medium">
                            {task.project.name}
                          </Text>
                        </HStack>
                      </>
                    )}
                  </HStack>

                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Refresh"
                      icon={<FiRefreshCw />}
                      variant="ghost"
                      size="sm"
                      isLoading={isRefreshing}
                      onClick={handleRefresh}
                      color={textColor}
                      _hover={{ bg: hoverBg }}
                    />
                    <IconButton
                      aria-label="Share task"
                      icon={<FiShare2 />}
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      color={textColor}
                      _hover={{ bg: hoverBg }}
                    />
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                      />
                      <MenuList>
                        <MenuItem
                          icon={<FiEdit2 />}
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          {isEditing ? "Cancel Edit" : "Edit Task"}
                        </MenuItem>
                        <MenuItem icon={<FiCopy />} onClick={handleShare}>
                          Copy Link
                        </MenuItem>
                        <Divider />
                        <MenuItem
                          icon={<FiTrash2 />}
                          onClick={onOpen}
                          color="red.500"
                        >
                          Delete Task
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </HStack>

                {/* Task Title */}
                {isEditing ? (
                  <Input
                    value={editedTask.title || ""}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    placeholder="Task title..."
                    fontSize="2xl"
                    fontWeight="bold"
                    variant="flushed"
                    size="lg"
                    color={textColor}
                    _focus={{ borderColor: accentColor }}
                  />
                ) : (
                  <Heading
                    size="xl"
                    color={textColor}
                    fontWeight="bold"
                    lineHeight="tight"
                  >
                    {task.title}
                  </Heading>
                )}

                {/* Status and Priority */}
                <HStack spacing={4} flexWrap="wrap">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={mutedColor} fontWeight="semibold" textTransform="uppercase">
                      Status
                    </Text>
                    {isEditing ? (
                      <Select
                        value={editedTask.status || task.status}
                        onChange={(e) =>
                          setEditedTask({
                            ...editedTask,
                            status: e.target.value as TaskStatus,
                          })
                        }
                        size="sm"
                        maxW="150px"
                      >
                        {Object.values(TaskStatus).map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Badge
                        colorScheme={getStatusColor(task.status)}
                        variant="solid"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="semibold"
                      >
                        {getStatusLabel(task.status)}
                      </Badge>
                    )}
                  </VStack>

                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color={mutedColor} fontWeight="semibold" textTransform="uppercase">
                      Priority
                    </Text>
                    {isEditing ? (
                      <Select
                        value={editedTask.priority || task.priority}
                        onChange={(e) =>
                          setEditedTask({
                            ...editedTask,
                            priority: e.target.value as TaskPriority,
                          })
                        }
                        size="sm"
                        maxW="150px"
                      >
                        {Object.values(TaskPriority).map((priority) => (
                          <option key={priority} value={priority}>
                            {getPriorityLabel(priority)}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Badge
                        colorScheme={getPriorityColor(task.priority)}
                        variant="solid"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="semibold"
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    )}
                  </VStack>

                  {task.assignee && (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color={mutedColor} fontWeight="semibold" textTransform="uppercase">
                        Assignee
                      </Text>
                      {isEditing ? (
                        <Select
                          value={editedTask.assignee_id || ""}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              assignee_id: e.target.value,
                            })
                          }
                          size="sm"
                          maxW="200px"
                        >
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name || user.username}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <HStack spacing={2}>
                          <UserAvatar
                            user={task.assignee}
                            size="sm"
                            src={task.assignee.avatar_url}
                          />
                          <Text fontSize="sm" fontWeight="medium" color={textColor}>
                            {task.assignee.full_name || task.assignee.username}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  )}

                  {(task.due_date || isEditing) && (
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color={mutedColor} fontWeight="semibold" textTransform="uppercase">
                        Due Date
                      </Text>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedTask.due_date || ""}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              due_date: e.target.value,
                            })
                          }
                          size="sm"
                          maxW="150px"
                        />
                      ) : task.due_date ? (
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {format(new Date(task.due_date), "MMM dd, yyyy")}
                        </Text>
                      ) : null}
                    </VStack>
                  )}
                </HStack>

                {/* Action Buttons */}
                {isEditing && (
                  <HStack spacing={3}>
                    <Button
                      colorScheme="blue"
                      leftIcon={<FiSave />}
                      onClick={handleSave}
                      isLoading={updateTaskMutation.isPending}
                      size="sm"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </HStack>
                )}
              </VStack>
            </CardBody>
          </MotionCard>

          {/* Main Content Grid */}
          <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={6}>
            {/* Left Column - Main Content */}
            <Box gridColumn={{ xl: "1 / 3" }}>
              <VStack align="stretch" spacing={6}>
                {/* Description */}
                <MotionCard variants={cardVariants} bg={cardBg} borderRadius="xl" shadow="md" border="1px" borderColor={borderColor}>
                  <CardBody p={6}>
                    <VStack align="stretch" spacing={4}>
                      <Heading size="md" color={textColor} fontWeight="bold">
                        Description
                      </Heading>
                      {isEditing ? (
                        <Textarea
                          value={editedTask.description || ""}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              description: e.target.value,
                            })
                          }
                          placeholder="Add a description..."
                          rows={6}
                          resize="vertical"
                          borderColor={borderColor}
                          _focus={{ borderColor: accentColor }}
                        />
                      ) : (
                        <Box
                          p={4}
                          bg={hoverBg}
                          borderRadius="lg"
                          border="1px"
                          borderColor={borderColor}
                          minH="120px"
                        >
                          <Text
                            color={task.description ? textColor : mutedColor}
                            lineHeight="tall"
                            whiteSpace="pre-wrap"
                          >
                            {task.description || "No description provided"}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </MotionCard>

                {/* Comments and Activities */}
                <MotionCard variants={cardVariants} bg={cardBg} borderRadius="xl" shadow="md" border="1px" borderColor={borderColor}>
                  <CardBody p={0}>
                    <Tabs colorScheme="blue" variant="line">
                      <TabList px={6} pt={4}>
                        <Tab
                          color={textColor}
                          _selected={{
                            color: accentColor,
                            borderColor: accentColor,
                            fontWeight: "semibold",
                          }}
                        >
                          <HStack spacing={2}>
                            <Icon as={FiMessageSquare} />
                            <Text>Comments ({comments.length})</Text>
                          </HStack>
                        </Tab>
                        <Tab
                          color={textColor}
                          _selected={{
                            color: accentColor,
                            borderColor: accentColor,
                            fontWeight: "semibold",
                          }}
                        >
                          <HStack spacing={2}>
                            <Icon as={FiActivity} />
                            <Text>Activity ({activities.length})</Text>
                          </HStack>
                        </Tab>
                      </TabList>

                      <TabPanels>
                        {/* Comments Panel */}
                        <TabPanel px={6} py={6}>
                          <VStack align="stretch" spacing={4}>
                            {/* Add Comment */}
                            <HStack spacing={3}>
                              <UserAvatar user={{ full_name: "You" }} size="sm" />
                              <VStack flex={1} align="stretch" spacing={2}>
                                <Textarea
                                  placeholder="Add a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  resize="vertical"
                                  minH="80px"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: accentColor }}
                                />
                                <HStack justify="flex-end">
                                  <Button
                                    colorScheme="blue"
                                    size="sm"
                                    rightIcon={<FiSend />}
                                    onClick={handleAddComment}
                                    isLoading={addCommentMutation.isPending}
                                    isDisabled={!newComment.trim()}
                                  >
                                    Comment
                                  </Button>
                                </HStack>
                              </VStack>
                            </HStack>

                            <Divider borderColor={borderColor} />

                            {/* Comments List */}
                            {commentsLoading ? (
                              Array.from({ length: 3 }).map((_, i) => (
                                <HStack key={i} align="start" spacing={3}>
                                  <SkeletonCircle size="10" />
                                  <VStack align="start" flex={1} spacing={1}>
                                    <Skeleton height="4" width="120px" />
                                    <Skeleton height="3" width="80px" />
                                    <SkeletonText mt="2" noOfLines={2} spacing="2" />
                                  </VStack>
                                </HStack>
                              ))
                            ) : comments.length > 0 ? (
                              comments.map((comment) => (
                                <Fade key={comment.id} in>
                                  <HStack align="start" spacing={3}>
                                    <UserAvatar
                                      user={comment.user}
                                      size="sm"
                                      src={comment.user.avatar_url}
                                    />
                                    <VStack align="start" flex={1} spacing={1}>
                                      <HStack spacing={2} align="center">
                                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                                          {comment.user.full_name}
                                        </Text>
                                        <Text fontSize="xs" color={mutedColor}>
                                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </Text>
                                      </HStack>
                                      <Box
                                        p={3}
                                        bg={hoverBg}
                                        borderRadius="lg"
                                        border="1px"
                                        borderColor={borderColor}
                                      >
                                        <Text fontSize="sm" color={textColor} lineHeight="tall">
                                          {comment.content}
                                        </Text>
                                      </Box>
                                    </VStack>
                                  </HStack>
                                </Fade>
                              ))
                            ) : (
                              <Box textAlign="center" py={8}>
                                <Icon as={FiMessageSquare} boxSize={8} color={mutedColor} mb={2} />
                                <Text color={mutedColor} fontSize="sm">
                                  No comments yet. Be the first to comment!
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </TabPanel>

                        {/* Activities Panel */}
                        <TabPanel px={6} py={6}>
                          <VStack align="stretch" spacing={4}>
                            {activitiesLoading ? (
                              Array.from({ length: 3 }).map((_, i) => (
                                <HStack key={i} align="start" spacing={3}>
                                  <SkeletonCircle size="8" />
                                  <VStack align="start" flex={1} spacing={1}>
                                    <Skeleton height="4" width="200px" />
                                    <Skeleton height="3" width="80px" />
                                  </VStack>
                                </HStack>
                              ))
                            ) : activities.length > 0 ? (
                              activities.map((activity) => (
                                <Fade key={activity.id} in>
                                  <HStack align="start" spacing={3}>
                                    <Box p={2} bg={accentColor} borderRadius="lg">
                                      <Icon as={FiActivity} color="white" boxSize={3} />
                                    </Box>
                                    <VStack align="start" flex={1} spacing={1}>
                                      <Text fontSize="sm" color={textColor}>
                                        <Text as="span" fontWeight="semibold">
                                          {activity.user.full_name}
                                        </Text>{" "}
                                        {activity.action}
                                      </Text>
                                      <Text fontSize="xs" color={mutedColor}>
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                </Fade>
                              ))
                            ) : (
                              <Box textAlign="center" py={8}>
                                <Icon as={FiActivity} boxSize={8} color={mutedColor} mb={2} />
                                <Text color={mutedColor} fontSize="sm">
                                  No activity yet
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </CardBody>
                </MotionCard>
              </VStack>
            </Box>

            {/* Right Column - Sidebar */}
            <VStack align="stretch" spacing={6}>
              {/* Task Stats */}
              <MotionCard variants={cardVariants} bg={cardBg} borderRadius="xl" shadow="md" border="1px" borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack align="stretch" spacing={4}>
                    <Heading size="sm" color={textColor} fontWeight="bold">
                      Task Details
                    </Heading>
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={mutedColor}>
                          Created
                        </Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {format(new Date(task.created_at), "MMM dd, yyyy")}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={mutedColor}>
                          Updated
                        </Text>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                          {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                        </Text>
                      </HStack>
                      {task.completed_at && (
                        <HStack justify="space-between">
                          <Text fontSize="sm" color={mutedColor}>
                            Completed
                          </Text>
                          <Text fontSize="sm" color={successColor} fontWeight="medium">
                            {format(new Date(task.completed_at), "MMM dd, yyyy")}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </VStack>
                </CardBody>
              </MotionCard>

              {/* Attachments */}
              <MotionCard variants={cardVariants} bg={cardBg} borderRadius="xl" shadow="md" border="1px" borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between">
                      <Heading size="sm" color={textColor} fontWeight="bold">
                        Attachments ({attachments.length})
                      </Heading>
                      <IconButton
                        aria-label="Upload attachment"
                        icon={<FiPaperclip />}
                        variant="ghost"
                        size="sm"
                        color={textColor}
                        _hover={{ bg: hoverBg }}
                        onClick={() => fileInputRef.current?.click()}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            uploadAttachmentsMutation.mutate(files);
                          }
                          // Reset input
                          if (e.target) {
                            e.target.value = '';
                          }
                        }}
                      />
                    </HStack>

                    {attachmentsLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <HStack key={i} spacing={3}>
                          <SkeletonCircle size="8" />
                          <VStack align="start" flex={1} spacing={1}>
                            <Skeleton height="3" width="80px" />
                            <Skeleton height="2" width="60px" />
                          </VStack>
                        </HStack>
                      ))
                    ) : attachments.length > 0 ? (
                      attachments.map((attachment) => (
                        <HStack key={attachment.id} spacing={3}>
                          <Icon as={FiFile} color={mutedColor} />
                          <VStack align="start" flex={1} spacing={1}>
                            <Text fontSize="sm" color={textColor} fontWeight="medium" noOfLines={1}>
                              {attachment.name}
                            </Text>
                            <Text fontSize="xs" color={mutedColor}>
                              {(attachment.size / 1024).toFixed(1)} KB
                            </Text>
                          </VStack>
                          <IconButton
                            aria-label="Download"
                            icon={<FiDownload />}
                            variant="ghost"
                            size="sm"
                            color={mutedColor}
                            _hover={{ bg: hoverBg, color: textColor }}
                            onClick={async () => {
                              try {
                                const blob = await AttachmentService.downloadAttachment(attachment.id);
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = attachment.name;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } catch (error) {
                                toast({
                                  title: "Download failed",
                                  status: "error",
                                  duration: 3000,
                                  isClosable: true,
                                });
                              }
                            }}
                          />
                        </HStack>
                      ))
                    ) : (
                      <Box textAlign="center" py={6}>
                        <Icon as={FiPaperclip} boxSize={6} color={mutedColor} mb={2} />
                        <Text color={mutedColor} fontSize="sm">
                          No attachments yet
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </MotionCard>

              {/* Quick Actions */}
              <MotionCard variants={cardVariants} bg={cardBg} borderRadius="xl" shadow="md" border="1px" borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack align="stretch" spacing={4}>
                    <Heading size="sm" color={textColor} fontWeight="bold">
                      Quick Actions
                    </Heading>
                    <VStack spacing={3}>
                      <Button
                        leftIcon={<FiCheckCircle />}
                        colorScheme={task.status === TaskStatus.DONE ? "gray" : "green"}
                        variant="outline"
                        size="sm"
                        w="full"
                        onClick={() => {
                          const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
                          updateTaskMutation.mutate({ status: newStatus });
                        }}
                        isLoading={updateTaskMutation.isPending}
                      >
                        {task.status === TaskStatus.DONE ? "Reopen Task" : "Mark Complete"}
                      </Button>
                      <Button
                        leftIcon={<FiEdit2 />}
                        variant="outline"
                        size="sm"
                        w="full"
                        onClick={() => setIsEditing(!isEditing)}
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ bg: hoverBg }}
                      >
                        {isEditing ? "Cancel Edit" : "Edit Task"}
                      </Button>
                      <Button
                        leftIcon={<FiShare2 />}
                        variant="outline"
                        size="sm"
                        w="full"
                        onClick={handleShare}
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ bg: hoverBg }}
                      >
                        Share Task
                      </Button>
                    </VStack>
                  </VStack>
                </CardBody>
              </MotionCard>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Delete Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete this task? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={() => deleteTaskMutation.mutate()}
              isLoading={deleteTaskMutation.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
}

export default TaskDetail;