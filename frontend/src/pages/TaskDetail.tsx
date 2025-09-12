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
} from "@chakra-ui/react";
import {
  FiArrowLeft,
  FiEdit2,
  FiSave,
  FiX,
  FiSend,
  FiExternalLink,
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "../services/taskService";
import { ProjectService } from "../services/projectService";
import { TaskStatus, TaskPriority, type Task } from "../types/task";
import { useAuth } from "../context/AuthContext";

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState("");

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
      });
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return "gray";
      case TaskStatus.IN_PROGRESS:
        return "blue";
      case TaskStatus.COMPLETED:
        return "green";
      default:
        return "gray";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "green";
      case TaskPriority.MEDIUM:
        return "yellow";
      case TaskPriority.HIGH:
        return "red";
      default:
        return "gray";
    }
  };

  if (isLoading) {
    return (
      <Box
        p={8}
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="400px"
      >
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text color="gray.500">Loading task...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !task) {
    return (
      <Box p={8}>
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
      </Box>
    );
  }

  const currentProject = projectsData?.projects.find(
    (p) => p.id === task.project_id
  );

  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header */}
      <HStack mb={6} justify="space-between">
        <HStack spacing={4}>
          <IconButton
            aria-label="Back to tasks"
            icon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => navigate("/tasks")}
          />
          <Heading size="lg">Task Details</Heading>
        </HStack>

        <HStack spacing={2}>
          <Button
            leftIcon={<FiExternalLink />}
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({
                title: "Link copied to clipboard",
                status: "success",
                duration: 2000,
              });
            }}
          >
            Share
          </Button>

          {isEditing ? (
            <HStack spacing={2}>
              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                size="sm"
                onClick={handleSave}
                isLoading={updateTaskMutation.isPending}
              >
                Save
              </Button>
              <Button
                leftIcon={<FiX />}
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </HStack>
          ) : (
            <Button
              leftIcon={<FiEdit2 />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </HStack>
      </HStack>

      <Flex gap={8} align="flex-start">
        {/* Main Content */}
        <VStack flex={2} align="stretch" spacing={6}>
          {/* Task Title */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              Title
            </Text>
            {isEditing ? (
              <Input
                value={editedTask.title || ""}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                size="lg"
                fontSize="xl"
                fontWeight="bold"
              />
            ) : (
              <Heading size="xl" color="gray.800">
                {task.title}
              </Heading>
            )}
          </Box>

          {/* Description */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              Description
            </Text>
            {isEditing ? (
              <Textarea
                value={editedTask.description || ""}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, description: e.target.value })
                }
                minH="120px"
                resize="vertical"
              />
            ) : (
              <Text
                color="gray.700"
                minH="60px"
                p={3}
                bg="gray.50"
                borderRadius="md"
                whiteSpace="pre-wrap"
              >
                {task.description || "No description provided"}
              </Text>
            )}
          </Box>

          {/* Comments Section */}
          <Box>
            <Heading size="md" mb={4}>
              Comments
            </Heading>

            {/* Mock Comments */}
            <VStack align="stretch" spacing={4} mb={4}>
              <Flex gap={3}>
                <Avatar size="sm" name="John Smith" />
                <Box flex={1}>
                  <HStack spacing={2} mb={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      John Smith
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      8 Sep 2025
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.700">
                    Hi 👋 I'll do that task now, you can start working on
                    another task!
                  </Text>
                </Box>
              </Flex>

              <Flex gap={3}>
                <Avatar size="sm" name="John Smith" />
                <Box flex={1}>
                  <HStack spacing={2} mb={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      John Smith
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Just Now
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.700">
                    Hello!
                  </Text>
                </Box>
              </Flex>
            </VStack>

            {/* Add Comment */}
            <HStack spacing={2}>
              <Avatar size="sm" name={user?.full_name || user?.email} />
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                flex={1}
              />
              <IconButton
                aria-label="Send comment"
                icon={<FiSend />}
                colorScheme="blue"
                isDisabled={!newComment.trim()}
                onClick={() => {
                  // TODO: Implement comment submission
                  toast({
                    title: "Comment functionality coming soon",
                    status: "info",
                    duration: 2000,
                  });
                  setNewComment("");
                }}
              />
            </HStack>
          </Box>
        </VStack>

        {/* Sidebar */}
        <VStack flex={1} align="stretch" spacing={4} minW="300px">
          {/* Status */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
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
              >
                <option value={TaskStatus.TODO}>To Do</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
              </Select>
            ) : (
              <Badge
                colorScheme={getStatusColor(task.status)}
                px={3}
                py={1}
                fontSize="sm"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {task.status.replace("_", " ")}
              </Badge>
            )}
          </Box>

          {/* Priority */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
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
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </Select>
            ) : (
              <Badge
                colorScheme={getPriorityColor(task.priority)}
                px={3}
                py={1}
                fontSize="sm"
                textTransform="uppercase"
              >
                {task.priority}
              </Badge>
            )}
          </Box>

          {/* Due Date */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              Due Date
            </Text>
            {isEditing ? (
              <Input
                type="date"
                value={
                  editedTask.due_date
                    ? new Date(editedTask.due_date).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    due_date: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            ) : (
              <Text color="gray.700">
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "No due date"}
              </Text>
            )}
          </Box>

          {/* Project */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={2}>
              Project
            </Text>
            {isEditing ? (
              <Select
                value={editedTask.project_id || ""}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    project_id: e.target.value || null,
                  })
                }
              >
                <option value="">No project</option>
                {projectsData?.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            ) : currentProject ? (
              <HStack>
                <Box
                  w={3}
                  h={3}
                  bg={currentProject.color}
                  borderRadius="full"
                />
                <Text color="gray.700">{currentProject.name}</Text>
              </HStack>
            ) : (
              <Text color="gray.500">No project assigned</Text>
            )}
          </Box>

          {/* Creator & Dates */}
          <Box pt={4} borderTop="1px" borderColor="gray.200">
            <VStack align="stretch" spacing={2}>
              <Box>
                <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                  CREATED
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {new Date(task.created_at).toLocaleDateString()}
                </Text>
              </Box>
              {task.updated_at && (
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                    UPDATED
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {new Date(task.updated_at).toLocaleDateString()}
                  </Text>
                </Box>
              )}
              {task.completed_at && (
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                    COMPLETED
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {new Date(task.completed_at).toLocaleDateString()}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </VStack>
      </Flex>
    </Box>
  );
}