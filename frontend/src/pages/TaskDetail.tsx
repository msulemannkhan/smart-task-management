import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
  Textarea,
  Select,
  Input,
  Avatar,
  IconButton,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  Grid,
  GridItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Tooltip,
  Tag,
  TagLabel,
  TagCloseButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Circle,
  useColorModeValue,
  Icon,
  Card,
  CardBody,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  ButtonGroup,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiEdit2,
  FiSave,
  FiX,
  FiSend,
  FiShare2,
  FiPaperclip,
  FiCalendar,
  FiUser,
  FiTrash2,
  FiBookmark,
  FiLink,
  FiMessageSquare,
  FiActivity,
  FiCheckSquare,
  FiMoreHorizontal,
  FiChevronDown,
  FiAlertCircle,
  FiPlus,
  FiFlag,
  FiFolder,
  FiFile,
  FiUpload,
  FiDownload,
  FiEye,
} from "react-icons/fi";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "../services/taskService";
import { ProjectService } from "../services/projectService";
import { TaskStatus, TaskPriority, type Task, type User } from "../types/task";
import { useUsers } from "../hooks/useUsers";
import { useAuth } from "../context/AuthContext";
import {
  format,
  formatDistanceToNow,
  isBefore,
  differenceInDays,
} from "date-fns";
import api from "../services/api";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  user: User;
  created_at: string;
  updated_at?: string;
  edited?: boolean;
}

interface Activity {
  id: string;
  type: string;
  action: string;
  user: User;
  created_at: string;
  details?: any;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_by: User | any;
  uploaded_at: string;
}

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Enhanced color mode values for better dark mode support
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const borderColor = useColorModeValue("gray.200", "dark.border.subtle");
  const sidebarBg = useColorModeValue("white", "dark.bg.tertiary");
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
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => TaskService.getById(taskId!),
    enabled: !!taskId,
  });

  // Fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: ProjectService.list,
  });

  // Fetch comments
  const {
    data: comments = [],
    refetch: refetchComments,
    isLoading: isLoadingComments,
  } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/comments`);
        return response.data as Comment[];
      } catch (error) {
        console.error("Failed to fetch comments:", error);
        return [];
      }
    },
    enabled: !!taskId,
  });

  // Fetch activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["activities", taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/activities`);
        return response.data as Activity[];
      } catch (error) {
        // Activities might not be implemented yet
        return [];
      }
    },
    enabled: !!taskId,
  });

  // Fetch attachments
  const {
    data: attachments = [],
    refetch: refetchAttachments,
    isLoading: isLoadingAttachments,
  } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      try {
        const response = await api.get(`/tasks/${taskId}/attachments`);
        return response.data as Attachment[];
      } catch (error) {
        // Attachments might not be implemented yet
        return [];
      }
    },
    enabled: !!taskId,
  });

  // Fetch available users for assignment
  const { data: usersResponse } = useUsers();
  const users = usersResponse?.users || [];

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: (updates: Partial<Task>) =>
      TaskService.update(taskId!, updates),
    onSuccess: () => {
      toast({
        title: "Task updated successfully",
        status: "success",
        duration: 3000,
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/tasks/${taskId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      toast({
        title: "Comment added",
        status: "success",
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => {
      const response = await api.put(`/tasks/${taskId}/comments/${commentId}`, {
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      setEditingComment(null);
      setEditedCommentContent("");
      refetchComments();
      toast({
        title: "Comment updated",
        status: "success",
        duration: 2000,
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
    },
    onSuccess: () => {
      refetchComments();
      toast({
        title: "Comment deleted",
        status: "success",
        duration: 2000,
      });
    },
  });

  // Delete task mutation
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
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    },
  });

  // Initialize edited task when task data loads
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEditing) {
        handleCancel();
      }
      if (e.metaKey && e.key === "Enter" && isEditing) {
        handleSave();
      }
      if (e.key === "e" && !isEditing && !e.target) {
        setIsEditing(true);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isEditing]);

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

  const handleCancel = () => {
    setIsEditing(false);
    if (task) {
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
  };

  const handleQuickUpdate = (field: string, value: any) => {
    updateTaskMutation.mutate({ [field]: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      refetchAttachments();
      toast({
        title: `${files.length} file(s) uploaded successfully`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to upload files",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const updatedTags = [...(editedTask.tags || []), newTag.trim()];
    setEditedTask({ ...editedTask, tags: updatedTags });
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (editedTask.tags || []).filter(
      (tag) => tag !== tagToRemove
    );
    setEditedTask({ ...editedTask, tags: updatedTags });
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
      case TaskStatus.CANCELLED:
        return "orange";
      default:
        return "gray";
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
        return "purple";
      default:
        return "gray";
    }
  };

  const formatDueDate = (date: string | Date | null) => {
    if (!date) return "No due date";
    const dueDate = new Date(date);
    const now = new Date();
    const diff = differenceInDays(dueDate, now);
    
    if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    if (diff <= 7) return `Due in ${diff} days`;
    return format(dueDate, "MMM dd, yyyy");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return FiCheckSquare;
      case "comment":
        return FiMessageSquare;
      case "attachment":
        return FiPaperclip;
      case "assignment":
        return FiUser;
      default:
        return FiActivity;
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="40px" />
          <Grid templateColumns={{ base: "1fr", lg: "1fr 400px" }} gap={6}>
            <GridItem>
              <VStack spacing={4} align="stretch">
                <SkeletonText mt="4" noOfLines={4} spacing="4" />
                <Skeleton height="200px" />
                <SkeletonText mt="4" noOfLines={6} spacing="4" />
              </VStack>
            </GridItem>
            <GridItem>
              <VStack spacing={4} align="stretch">
                <Skeleton height="60px" />
                <Skeleton height="60px" />
                <Skeleton height="60px" />
                <Skeleton height="60px" />
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    );
  }

  if (error || !task) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error instanceof Error ? error.message : "Task not found"}
        </Alert>
        <Button
          mt={4}
          leftIcon={<FiArrowLeft />}
          onClick={() => navigate("/tasks")}
        >
          Back to Tasks
        </Button>
      </Container>
    );
  }

  const currentProject = projectsData?.projects.find(
    (p) => p.id === task.project_id
  );
  const assignee = users.find((u) => u.id === task.assignee_id);
  const isOverdue =
    task.due_date && isBefore(new Date(task.due_date), new Date());

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        {/* Enhanced Header with Breadcrumb and Actions */}
        <VStack spacing={6} align="stretch" mb={8}>
          <Card
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            shadow="sm"
          >
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <Breadcrumb
                  spacing="8px"
                  separator={<FiChevronDown color={mutedColor} />}
                >
          <BreadcrumbItem>
                    <BreadcrumbLink
                      as={Link}
                      to="/tasks"
                      color={accentColor}
                      _hover={{
                        color: accentColor,
                        textDecoration: "underline",
                      }}
                    >
              Tasks
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentProject && (
            <BreadcrumbItem>
                      <BreadcrumbLink
                        as={Link}
                        to={`/projects/${currentProject.id}`}
                        color={accentColor}
                        _hover={{
                          color: accentColor,
                          textDecoration: "underline",
                        }}
                      >
                {currentProject.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink
                      href="#"
                      color={textColor}
                      fontWeight="semibold"
                    >
                      {task.title}
                    </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <IconButton
              aria-label="Back to tasks"
              icon={<FiArrowLeft />}
              variant="ghost"
                      color={textColor}
                      _hover={{ bg: hoverBg }}
              onClick={() => navigate("/tasks")}
            />
                    <VStack align="start" spacing={1}>
                      <Heading size="lg" color={textColor}>
                        Task Details
                      </Heading>
                      <Text fontSize="sm" color={mutedColor}>
                        Manage and track your task progress
                      </Text>
                    </VStack>
          </HStack>

                  <HStack spacing={3}>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="Share task">
                <Button
                  leftIcon={<FiShare2 />}
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link copied to clipboard",
                      status: "success",
                      duration: 2000,
                    });
                  }}
                          color={textColor}
                          borderColor={borderColor}
                          _hover={{ bg: hoverBg, borderColor: accentColor }}
                >
                  Share
                </Button>
              </Tooltip>
            </ButtonGroup>

            <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreHorizontal />}
                        variant="outline"
                        size="sm"
                        color={textColor}
                        borderColor={borderColor}
                        _hover={{ bg: hoverBg, borderColor: accentColor }}
                      />
                      <MenuList bg={cardBg} borderColor={borderColor}>
                        <MenuItem
                          icon={<FiLink />}
                          color={textColor}
                          _hover={{ bg: hoverBg }}
                        >
                          Copy link
                        </MenuItem>
                        <MenuItem
                          icon={<FiDownload />}
                          color={textColor}
                          _hover={{ bg: hoverBg }}
                        >
                          Export as PDF
                        </MenuItem>
                        <MenuItem
                          icon={<FiEye />}
                          color={textColor}
                          _hover={{ bg: hoverBg }}
                        >
                          Watch task
                        </MenuItem>
                        <MenuDivider borderColor={borderColor} />
                        <MenuItem
                          icon={<FiTrash2 />}
                          color={errorColor}
                          _hover={{ bg: hoverBg }}
                          onClick={onDeleteOpen}
                        >
                  Delete task
                </MenuItem>
              </MenuList>
            </Menu>

            {isEditing ? (
              <ButtonGroup size="sm">
                <Button
                  leftIcon={<FiSave />}
                  colorScheme="blue"
                  onClick={handleSave}
                  isLoading={updateTaskMutation.isPending}
                          _hover={{
                            transform: "translateY(-1px)",
                            shadow: "lg",
                          }}
                >
                  Save
                </Button>
                        <Button
                          leftIcon={<FiX />}
                          variant="ghost"
                          onClick={handleCancel}
                          color={textColor}
                          _hover={{ bg: hoverBg }}
                        >
                  Cancel
                </Button>
              </ButtonGroup>
            ) : (
              <Button
                leftIcon={<FiEdit2 />}
                colorScheme="blue"
                size="sm"
                onClick={() => setIsEditing(true)}
                        _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
              >
                Edit
              </Button>
            )}
          </HStack>
        </Flex>
              </VStack>
            </CardBody>
          </Card>
      </VStack>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 400px" }} gap={6}>
        {/* Left Column - Main Content */}
        <GridItem>
          <VStack spacing={6} align="stretch">
              {/* Enhanced Task Title and Status */}
              <Card
                bg={cardBg}
                borderColor={borderColor}
                borderWidth="1px"
                shadow="sm"
                _hover={{ shadow: "md" }}
                transition="all 0.2s ease"
              >
                <CardBody p={8}>
                  <VStack align="stretch" spacing={6}>
                  {isEditing ? (
                      <VStack align="stretch" spacing={4}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={mutedColor}
                          mb={2}
                        >
                          Task Title
                        </Text>
                    <Input
                      value={editedTask.title || ""}
                      onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              title: e.target.value,
                            })
                      }
                      size="lg"
                      fontSize="2xl"
                      fontWeight="bold"
                          placeholder="Enter task title..."
                          bg={sidebarBg}
                          borderColor={borderColor}
                          _focus={{
                            borderColor: accentColor,
                            boxShadow: `0 0 0 1px ${accentColor}`,
                          }}
                        />
                      </VStack>
                    ) : (
                      <VStack align="stretch" spacing={4}>
                        <HStack
                          justify="space-between"
                          align="flex-start"
                          wrap="wrap"
                        >
                          <Heading
                            size="xl"
                            color={textColor}
                            fontWeight="bold"
                            lineHeight="1.2"
                            maxW="70%"
                          >
                        {task.title}
                      </Heading>
                          <HStack spacing={3} flexWrap="wrap">
                        <Badge
                          colorScheme={getStatusColor(task.status)}
                          fontSize="sm"
                              px={4}
                              py={2}
                              borderRadius="full"
                              fontWeight="semibold"
                              textTransform="capitalize"
                        >
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge
                          colorScheme={getPriorityColor(task.priority)}
                          fontSize="sm"
                              px={4}
                              py={2}
                              borderRadius="full"
                              fontWeight="semibold"
                              textTransform="capitalize"
                        >
                          {task.priority}
                        </Badge>
                      </HStack>
                    </HStack>

                        {/* Task Metadata */}
                        <HStack spacing={6} flexWrap="wrap">
                          <HStack spacing={2}>
                            <Icon as={FiUser} color={mutedColor} boxSize={4} />
                            <Text fontSize="sm" color={mutedColor}>
                              {assignee
                                ? assignee.full_name || assignee.email
                                : "Unassigned"}
                            </Text>
                          </HStack>
                          {task.due_date && (
                            <HStack spacing={2}>
                              <Icon
                                as={FiCalendar}
                                color={isOverdue ? errorColor : mutedColor}
                                boxSize={4}
                              />
                              <Text
                                fontSize="sm"
                                color={isOverdue ? errorColor : mutedColor}
                                fontWeight={isOverdue ? "semibold" : "normal"}
                              >
                                {formatDueDate(task.due_date)}
                              </Text>
                              {isOverdue && (
                                <Icon
                                  as={FiAlertCircle}
                                  color={errorColor}
                                  boxSize={4}
                                />
                              )}
                            </HStack>
                          )}
                          {currentProject && (
                            <HStack spacing={2}>
                              <Icon
                                as={FiFolder}
                                color={currentProject.color}
                                boxSize={4}
                              />
                              <Text fontSize="sm" color={mutedColor}>
                                {currentProject.name}
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      </VStack>
                    )}

                    {/* Enhanced Description */}
                  <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color={mutedColor}
                        mb={3}
                      >
                      Description
                    </Text>
                    {isEditing ? (
                        <VStack align="stretch" spacing={2}>
                      <Textarea
                        value={editedTask.description || ""}
                        onChange={(e) =>
                              setEditedTask({
                                ...editedTask,
                                description: e.target.value,
                              })
                        }
                        minH="120px"
                        resize="vertical"
                            placeholder="Add a detailed description for this task..."
                            bg={sidebarBg}
                            borderColor={borderColor}
                            _focus={{
                              borderColor: accentColor,
                              boxShadow: `0 0 0 1px ${accentColor}`,
                            }}
                          />
                          <Text fontSize="xs" color={mutedColor}>
                            Provide context, requirements, and any additional
                            details
                          </Text>
                        </VStack>
                    ) : (
                      <Box
                          p={6}
                        bg={sidebarBg}
                          borderRadius="lg"
                          minH="100px"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <Text
                            color={textColor}
                            whiteSpace="pre-wrap"
                            lineHeight="1.6"
                            fontSize="md"
                          >
                            {task.description || (
                              <Text color={mutedColor} fontStyle="italic">
                                No description provided. Click Edit to add
                                details about this task.
                              </Text>
                            )}
                        </Text>
                      </Box>
                    )}
                  </Box>

                    {/* Enhanced Tags */}
                  {(isEditing || (task.tags && task.tags.length > 0)) && (
                    <Box>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={mutedColor}
                          mb={3}
                        >
                        Tags
                      </Text>
                        <Wrap spacing={3}>
                          {(isEditing ? editedTask.tags : task.tags)?.map(
                            (tag) => (
                          <WrapItem key={tag}>
                            <Tag
                              size="md"
                              borderRadius="full"
                              variant="solid"
                              colorScheme="blue"
                                  px={4}
                                  py={2}
                                  _hover={{
                                    transform: "translateY(-1px)",
                                    shadow: "md",
                                  }}
                                  transition="all 0.2s ease"
                                >
                                  <TagLabel fontWeight="medium">{tag}</TagLabel>
                              {isEditing && (
                                    <TagCloseButton
                                      onClick={() => handleRemoveTag(tag)}
                                      _hover={{ bg: "red.500", color: "white" }}
                                    />
                              )}
                            </Tag>
                          </WrapItem>
                            )
                          )}
                        {isEditing && (
                          <WrapItem>
                              <HStack
                                spacing={2}
                                p={2}
                                bg={sidebarBg}
                                borderRadius="full"
                                border="1px solid"
                                borderColor={borderColor}
                              >
                              <Input
                                size="sm"
                                  placeholder="Add tag..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                  }
                                }}
                                  width="120px"
                                  border="none"
                                  bg="transparent"
                                  _focus={{ boxShadow: "none" }}
                              />
                              <IconButton
                                aria-label="Add tag"
                                icon={<FiPlus />}
                                size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                onClick={handleAddTag}
                                  isDisabled={!newTag.trim()}
                              />
                            </HStack>
                          </WrapItem>
                        )}
                      </Wrap>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>

              {/* Enhanced Tabs for Comments, Activity, and Attachments */}
              <Card
                bg={cardBg}
                borderColor={borderColor}
                borderWidth="1px"
                shadow="sm"
                _hover={{ shadow: "md" }}
                transition="all 0.2s ease"
              >
                <CardBody p={0}>
                  <Tabs
                    index={activeTab}
                    onChange={setActiveTab}
                    variant="enclosed"
                  >
                    <TabList
                      bg={sidebarBg}
                      borderBottom="1px solid"
                      borderColor={borderColor}
                      px={6}
                      py={2}
                    >
                      <Tab
                        color={textColor}
                        _selected={{
                          color: accentColor,
                          borderColor: accentColor,
                          bg: cardBg,
                          fontWeight: "semibold",
                        }}
                        _hover={{ color: accentColor }}
                      >
                      <HStack spacing={2}>
                          <Icon as={FiMessageSquare} />
                        <Text>Comments</Text>
                          <Badge
                            colorScheme="blue"
                            borderRadius="full"
                            fontSize="xs"
                            px={2}
                            py={1}
                          >
                          {comments.length}
                        </Badge>
                      </HStack>
                    </Tab>
                      <Tab
                        color={textColor}
                        _selected={{
                          color: accentColor,
                          borderColor: accentColor,
                          bg: cardBg,
                          fontWeight: "semibold",
                        }}
                        _hover={{ color: accentColor }}
                      >
                      <HStack spacing={2}>
                          <Icon as={FiActivity} />
                        <Text>Activity</Text>
                      </HStack>
                    </Tab>
                      <Tab
                        color={textColor}
                        _selected={{
                          color: accentColor,
                          borderColor: accentColor,
                          bg: cardBg,
                          fontWeight: "semibold",
                        }}
                        _hover={{ color: accentColor }}
                      >
                      <HStack spacing={2}>
                          <Icon as={FiPaperclip} />
                        <Text>Attachments</Text>
                          <Badge
                            colorScheme="blue"
                            borderRadius="full"
                            fontSize="xs"
                            px={2}
                            py={1}
                          >
                          {attachments.length}
                        </Badge>
                      </HStack>
                    </Tab>
                  </TabList>

                  <TabPanels>
                      {/* Enhanced Comments Tab */}
                      <TabPanel px={6} py={6}>
                        <VStack align="stretch" spacing={6}>
                        {isLoadingComments ? (
                          <>
                            <HStack align="start" spacing={3}>
                              <SkeletonCircle size="10" />
                              <VStack align="stretch" flex={1} spacing={2}>
                                <Skeleton height="20px" width="150px" />
                                <SkeletonText noOfLines={2} spacing="2" />
                              </VStack>
                            </HStack>
                          </>
                        ) : comments.length > 0 ? (
                          comments.map((comment) => (
                              <HStack
                                key={comment.id}
                                align="start"
                                spacing={3}
                              >
                              <Avatar
                                size="sm"
                                  name={
                                    comment.user?.full_name ||
                                    comment.user?.email
                                  }
                              />
                              <VStack align="stretch" flex={1} spacing={1}>
                                <HStack justify="space-between">
                                  <HStack spacing={2}>
                                    <Text fontWeight="semibold" fontSize="sm">
                                        {comment.user?.full_name ||
                                          comment.user?.email}
                                    </Text>
                                    <Text fontSize="xs" color={mutedColor}>
                                        {formatDistanceToNow(
                                          new Date(comment.created_at),
                                          {
                                        addSuffix: true,
                                          }
                                        )}
                                    </Text>
                                    {comment.edited && (
                                      <Text fontSize="xs" color={mutedColor}>
                                        (edited)
                                      </Text>
                                    )}
                                  </HStack>
                                  {comment.user_id === user?.id && (
                                    <HStack spacing={1}>
                                      <IconButton
                                        aria-label="Edit comment"
                                        icon={<FiEdit2 />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingComment(comment.id);
                                            setEditedCommentContent(
                                              comment.content
                                            );
                                        }}
                                      />
                                      <IconButton
                                        aria-label="Delete comment"
                                        icon={<FiTrash2 />}
                                        size="xs"
                                        variant="ghost"
                                        color="red.500"
                                          onClick={() =>
                                            deleteCommentMutation.mutate(
                                              comment.id
                                            )
                                          }
                                      />
                                    </HStack>
                                  )}
                                </HStack>
                                {editingComment === comment.id ? (
                                  <VStack align="stretch" spacing={2}>
                                    <Textarea
                                      value={editedCommentContent}
                                        onChange={(e) =>
                                          setEditedCommentContent(
                                            e.target.value
                                          )
                                        }
                                      size="sm"
                                    />
                                    <HStack spacing={2}>
                                      <Button
                                        size="xs"
                                        colorScheme="blue"
                                        onClick={() =>
                                          updateCommentMutation.mutate({
                                            commentId: comment.id,
                                            content: editedCommentContent,
                                          })
                                        }
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingComment(null);
                                          setEditedCommentContent("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </HStack>
                                  </VStack>
                                ) : (
                                    <Text
                                      fontSize="sm"
                                      color={textColor}
                                      whiteSpace="pre-wrap"
                                    >
                                    {comment.content}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          ))
                        ) : (
                          <Text color={mutedColor} textAlign="center" py={4}>
                            No comments yet. Be the first to comment!
                          </Text>
                        )}

                        <Divider />

                        {/* Add Comment */}
                        <HStack align="start" spacing={3}>
                            <Avatar
                              size="sm"
                              name={user?.full_name || user?.email}
                            />
                          <VStack align="stretch" flex={1} spacing={2}>
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              size="sm"
                              resize="vertical"
                              minH="80px"
                            />
                            <HStack justify="flex-end">
                              <Button
                                leftIcon={<FiSend />}
                                colorScheme="blue"
                                size="sm"
                                isDisabled={!newComment.trim()}
                                isLoading={addCommentMutation.isPending}
                                onClick={() => {
                                  if (newComment.trim()) {
                                    addCommentMutation.mutate(newComment);
                                  }
                                }}
                              >
                                Comment
                              </Button>
                            </HStack>
                          </VStack>
                        </HStack>
                      </VStack>
                    </TabPanel>

                    {/* Activity Tab */}
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={4}>
                        {isLoadingActivities ? (
                          <SkeletonText noOfLines={5} spacing="4" />
                        ) : activities.length > 0 ? (
                          activities.map((activity) => {
                              const ActivityIcon = getActivityIcon(
                                activity.type
                              );
                            return (
                                <HStack
                                  key={activity.id}
                                  align="start"
                                  spacing={3}
                                >
                                <Circle size="32px" bg={hoverBg}>
                                    <Icon
                                      as={ActivityIcon}
                                      boxSize={4}
                                      color={mutedColor}
                                    />
                                </Circle>
                                <VStack align="stretch" flex={1} spacing={0}>
                                  <Text fontSize="sm">
                                    <Text as="span" fontWeight="semibold">
                                        {activity.user?.full_name ||
                                          activity.user?.email}
                                    </Text>{" "}
                                    {activity.action}
                                  </Text>
                                  <Text fontSize="xs" color={mutedColor}>
                                      {formatDistanceToNow(
                                        new Date(activity.created_at),
                                        {
                                      addSuffix: true,
                                        }
                                      )}
                                  </Text>
                                </VStack>
                              </HStack>
                            );
                          })
                        ) : (
                          <Text color={mutedColor} textAlign="center" py={4}>
                              Activity will appear here when changes are made to
                              this task.
                          </Text>
                        )}
                      </VStack>
                    </TabPanel>

                    {/* Attachments Tab */}
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={4}>
                        <HStack>
                          <Input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleFileUpload}
                          />
                          <Button
                            leftIcon={<FiUpload />}
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            isLoading={isUploading}
                            loadingText="Uploading..."
                          >
                            Upload Files
                          </Button>
                        </HStack>

                        {isLoadingAttachments ? (
                          <SkeletonText noOfLines={3} spacing="4" />
                        ) : attachments.length > 0 ? (
                          attachments.map((attachment) => (
                            <HStack
                              key={attachment.id}
                              p={3}
                              bg={hoverBg}
                              borderRadius="md"
                              justify="space-between"
                            >
                              <HStack spacing={3}>
                                  <Icon
                                    as={FiFile}
                                    boxSize={5}
                                    color={mutedColor}
                                  />
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">
                                    {attachment.name}
                                  </Text>
                                  <Text fontSize="xs" color={mutedColor}>
                                    {(attachment.size / 1024).toFixed(2)} KB •{" "}
                                      {formatDistanceToNow(
                                        new Date(attachment.uploaded_at),
                                        {
                                      addSuffix: true,
                                        }
                                      )}
                                    {attachment.uploaded_by?.full_name && (
                                        <>
                                          {" "}
                                          • by{" "}
                                          {attachment.uploaded_by.full_name}
                                        </>
                                    )}
                                  </Text>
                                </VStack>
                              </HStack>
                              <HStack spacing={1}>
                                <IconButton
                                  aria-label="Download"
                                  icon={<FiDownload />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    try {
                                        const response = await api.get(
                                          `/tasks/attachments/${attachment.id}/download`,
                                          {
                                            responseType: "blob",
                                          }
                                        );
                                        const url = window.URL.createObjectURL(
                                          new Blob([response.data])
                                        );
                                        const link =
                                          document.createElement("a");
                                      link.href = url;
                                        link.setAttribute(
                                          "download",
                                          attachment.name
                                        );
                                      document.body.appendChild(link);
                                      link.click();
                                      link.remove();
                                      window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                      toast({
                                        title: "Failed to download file",
                                        status: "error",
                                        duration: 3000,
                                      });
                                    }
                                  }}
                                />
                                  {(attachment.uploaded_by?.id === user?.id ||
                                    task.creator_id === user?.id) && (
                                  <IconButton
                                    aria-label="Delete"
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    variant="ghost"
                                    color="red.500"
                                    onClick={async () => {
                                        if (
                                          !window.confirm(
                                            "Are you sure you want to delete this attachment?"
                                          )
                                        )
                                          return;
                                        try {
                                          await api.delete(
                                            `/tasks/${taskId}/attachments/${attachment.id}`
                                          );
                                        refetchAttachments();
                                        toast({
                                          title: "Attachment deleted",
                                          status: "success",
                                          duration: 2000,
                                        });
                                      } catch (error) {
                                        toast({
                                            title:
                                              "Failed to delete attachment",
                                          status: "error",
                                          duration: 3000,
                                        });
                                      }
                                    }}
                                  />
                                )}
                              </HStack>
                            </HStack>
                          ))
                        ) : (
                          <Text color={mutedColor} textAlign="center" py={4}>
                            No attachments yet. Upload files to get started.
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
          <Card
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            position="sticky"
            top={4}
          >
            <CardBody>
              <VStack align="stretch" spacing={6}>
                {/* Quick Actions */}
                <Box>
                  <Button
                      colorScheme={
                        task.status === TaskStatus.DONE ? "green" : "blue"
                      }
                    size="sm"
                    width="full"
                    leftIcon={<FiCheckSquare />}
                    onClick={() => {
                      const newStatus =
                        task.status === TaskStatus.DONE
                          ? TaskStatus.TODO
                          : TaskStatus.DONE;
                      handleQuickUpdate("status", newStatus);
                    }}
                  >
                    {task.status === TaskStatus.DONE
                      ? "Reopen Task"
                      : "Mark Complete"}
                  </Button>
                </Box>

                <Divider />

                {/* Status */}
                <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={mutedColor}
                      mb={2}
                    >
                    Status
                  </Text>
                  {isEditing ? (
                    <Select
                      value={editedTask.status || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          status: e.target.value as TaskStatus,
                        })
                      }
                      size="sm"
                    >
                      {Object.values(TaskStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Menu>
                      <MenuButton
                        as={Button}
                        rightIcon={<FiChevronDown />}
                        size="sm"
                        width="full"
                        variant="outline"
                      >
                        <Badge colorScheme={getStatusColor(task.status)}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </MenuButton>
                      <MenuList>
                        {Object.values(TaskStatus).map((status) => (
                          <MenuItem
                            key={status}
                              onClick={() =>
                                handleQuickUpdate("status", status)
                              }
                          >
                              <Badge
                                colorScheme={getStatusColor(status)}
                                mr={2}
                              >
                              {status.replace("_", " ")}
                            </Badge>
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  )}
                </Box>

                {/* Priority */}
                <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={mutedColor}
                      mb={2}
                    >
                    Priority
                  </Text>
                  {isEditing ? (
                    <Select
                      value={editedTask.priority || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      size="sm"
                    >
                      {Object.values(TaskPriority).map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Menu>
                      <MenuButton
                        as={Button}
                        rightIcon={<FiChevronDown />}
                        size="sm"
                        width="full"
                        variant="outline"
                      >
                        <HStack>
                            <Icon
                              as={FiFlag}
                              color={`${getPriorityColor(task.priority)}.500`}
                            />
                          <Text>{task.priority}</Text>
                        </HStack>
                      </MenuButton>
                      <MenuList>
                        {Object.values(TaskPriority).map((priority) => (
                          <MenuItem
                            key={priority}
                              onClick={() =>
                                handleQuickUpdate("priority", priority)
                              }
                          >
                            <Icon
                              as={FiFlag}
                              color={`${getPriorityColor(priority)}.500`}
                              mr={2}
                            />
                            {priority}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Menu>
                  )}
                </Box>

                {/* Assignee */}
                <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={mutedColor}
                      mb={2}
                    >
                    Assignee
                  </Text>
                  {isEditing ? (
                    <Select
                      value={editedTask.assignee_id || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          assignee_id: e.target.value || undefined,
                        })
                      }
                      size="sm"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Popover>
                      <PopoverTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          width="full"
                          leftIcon={<FiUser />}
                        >
                          {assignee ? (
                            <HStack spacing={2}>
                                <Avatar
                                  size="xs"
                                  name={assignee.full_name || assignee.email}
                                />
                                <Text>
                                  {assignee.full_name || assignee.email}
                                </Text>
                            </HStack>
                          ) : (
                            "Unassigned"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>Assign to</PopoverHeader>
                        <PopoverBody>
                          <VStack align="stretch" spacing={2}>
                            <Input
                              placeholder="Search users..."
                              size="sm"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                              <VStack
                                align="stretch"
                                maxH="200px"
                                overflowY="auto"
                              >
                              <Button
                                variant="ghost"
                                size="sm"
                                justifyContent="flex-start"
                                  onClick={() =>
                                    handleQuickUpdate("assignee_id", null)
                                  }
                              >
                                Unassigned
                              </Button>
                              {users
                                .filter(
                                  (u) =>
                                    !searchQuery ||
                                      u.full_name
                                        ?.toLowerCase()
                                        .includes(searchQuery.toLowerCase()) ||
                                      u.email
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase())
                                )
                                .map((user) => (
                                  <Button
                                    key={user.id}
                                    variant="ghost"
                                    size="sm"
                                    justifyContent="flex-start"
                                      onClick={() =>
                                        handleQuickUpdate(
                                          "assignee_id",
                                          user.id
                                        )
                                      }
                                  >
                                    <HStack spacing={2}>
                                      <Avatar
                                        size="xs"
                                        name={user.full_name || user.email}
                                      />
                                        <Text>
                                          {user.full_name || user.email}
                                        </Text>
                                    </HStack>
                                  </Button>
                                ))}
                            </VStack>
                          </VStack>
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                  )}
                </Box>

                {/* Due Date */}
                <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={mutedColor}
                      mb={2}
                    >
                    Due Date
                  </Text>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={
                        editedTask.due_date
                            ? new Date(editedTask.due_date)
                                .toISOString()
                                .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          due_date: e.target.value || undefined,
                        })
                      }
                      size="sm"
                    />
                  ) : (
                    <HStack
                      p={2}
                      bg={isOverdue ? "red.50" : hoverBg}
                      borderRadius="md"
                      spacing={2}
                    >
                      <Icon
                        as={FiCalendar}
                        color={isOverdue ? "red.500" : mutedColor}
                      />
                      <Text
                        fontSize="sm"
                        color={isOverdue ? "red.500" : textColor}
                        fontWeight={isOverdue ? "semibold" : "normal"}
                      >
                        {formatDueDate(task.due_date)}
                      </Text>
                        {isOverdue && (
                          <Icon
                            as={FiAlertCircle}
                            color="red.500"
                            boxSize={3}
                          />
                        )}
                    </HStack>
                  )}
                </Box>

                {/* Project */}
                <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={mutedColor}
                      mb={2}
                    >
                    Project
                  </Text>
                  {isEditing ? (
                    <Select
                      value={editedTask.project_id || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          project_id: e.target.value || undefined,
                        })
                      }
                      size="sm"
                    >
                      <option value="">No project</option>
                      {projectsData?.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </Select>
                  ) : currentProject ? (
                    <HStack
                      p={2}
                      bg={hoverBg}
                      borderRadius="md"
                      spacing={2}
                      as={Link}
                      to={`/projects/${currentProject.id}`}
                        _hover={{
                          bg: useColorModeValue("gray.100", "gray.700"),
                        }}
                    >
                      <Icon as={FiFolder} color={currentProject.color} />
                      <Text fontSize="sm" color={textColor}>
                        {currentProject.name}
                      </Text>
                    </HStack>
                  ) : (
                    <Text fontSize="sm" color={mutedColor}>
                      No project assigned
                    </Text>
                  )}
                </Box>

                {/* Progress */}
                {task.completed_percentage > 0 && (
                  <Box>
                    <HStack justify="space-between" mb={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={mutedColor}
                        >
                        Progress
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {task.completed_percentage}%
                      </Text>
                    </HStack>
                    <Progress
                      value={task.completed_percentage}
                      colorScheme="green"
                      size="sm"
                      borderRadius="full"
                    />
                  </Box>
                )}

                <Divider />

                {/* Metadata */}
                <VStack align="stretch" spacing={3}>
                  <Box>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color={mutedColor}
                        mb={1}
                      >
                      CREATED
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                        {format(
                          new Date(task.created_at),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                    </Text>
                  </Box>
                  {task.updated_at && (
                    <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color={mutedColor}
                          mb={1}
                        >
                        LAST UPDATED
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {formatDistanceToNow(new Date(task.updated_at), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Box>
                  )}
                  {task.completed_at && (
                    <Box>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color={mutedColor}
                          mb={1}
                        >
                        COMPLETED
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                          {format(
                            new Date(task.completed_at),
                            "MMM dd, yyyy 'at' h:mm a"
                          )}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
              Are you sure you want to delete this task? This action cannot be
              undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
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
    </Container>
    </Box>
  );
}
