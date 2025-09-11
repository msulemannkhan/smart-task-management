import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiUsers,
  FiCalendar,
  FiTag,
} from "react-icons/fi";
import {
  ProjectService,
  type ProjectResponse,
} from "../services/projectService";
import { TaskService, type TaskStats } from "../services/taskService";
import { ProjectMemberService } from "../services/projectMemberService";
import { MembersDrawer } from "../components/projects/MembersDrawer";
import { ProjectModal } from "../components/projects/ProjectModal";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
    description: string;
    status: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch project details
        const projectData = await ProjectService.get(projectId);
        setProject(projectData);

        // Fetch member count
        try {
          const members = await ProjectMemberService.list(projectId);
          setMemberCount(members.total || 0);
        } catch (memberError) {
          console.warn('Failed to fetch project members:', memberError);
          setMemberCount(0);
        }

        // Fetch task stats
        try {
          const stats = await TaskService.getTaskStats(projectId);
          setTaskStats(stats);
        } catch {
          setTaskStats(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch project data";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleEditProject = () => {
    if (!project) return;
    setEditingProject({
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: project.status,
      color: project.color,
    });
    setProjectModalOpen(true);
  };

  const handleProjectSuccess = () => {
    // Refresh project data
    if (projectId) {
      ProjectService.get(projectId).then(setProject).catch(console.error);
    }
  };

  const handleViewMembers = () => {
    if (!project) return;
    setSelectedProjectForMembers({
      id: project.id,
      name: project.name,
    });
  };

  const handleNewTask = () => {
    setTaskModalOpen(true);
  };

  const handleTaskCreated = () => {
    // Refresh task stats
    if (projectId) {
      TaskService.getTaskStats(projectId)
        .then(setTaskStats)
        .catch(console.error);
    }
  };

  // Color mode values for dark mode support
  const bgColor = useColorModeValue('white', 'dark.bg.secondary');
  const borderColor = useColorModeValue('gray.100', 'gray.600');
  const cardBg = useColorModeValue('white', 'dark.bg.tertiary');
  const hoverBg = useColorModeValue('gray.50', 'dark.bg.hover');

  if (isLoading) {
    return (
      <Box h="full" bg={bgColor} p={6}>
        <VStack align="center" justify="center" h="full">
          <Spinner size="xl" color="blue.500" />
          <Text>Loading project...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box h="full" bg={bgColor} p={6}>
        <VStack align="center" justify="center" h="full">
          <Alert status="error" maxW="md">
            <AlertIcon />
            <Text>{error || "Project not found"}</Text>
          </Alert>
          <Button
            onClick={() => navigate("/projects")}
            leftIcon={<FiArrowLeft />}
          >
            Back to Projects
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      <Box h="full" bg={bgColor} p={6}>
        <VStack align="stretch" spacing={6}>
          {/* Enhanced Header */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={6}
            shadow="sm"
            border="1px"
            borderColor={borderColor}
          >
            <HStack justify="space-between" align="center">
              <HStack spacing={4}>
                <Button
                  variant="ghost"
                  leftIcon={<FiArrowLeft />}
                  onClick={() => navigate("/projects")}
                  size="sm"
                >
                  Back
                </Button>
                <Divider orientation="vertical" h="8" />
                <HStack spacing={4}>
                  <Box
                    w={6}
                    h={6}
                    bg={project.color}
                    borderRadius="lg"
                    flexShrink={0}
                    shadow="sm"
                  />
                  <VStack align="start" spacing={1}>
                    <Heading size="xl" color="gray.800">
                      {project.name}
                    </Heading>
                    <Text fontSize="md" color="gray.600" maxW="600px">
                      {project.description ||
                        "No description provided for this project."}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
              <HStack spacing={3}>
                <Button
                  variant="outline"
                  leftIcon={<FiUsers />}
                  onClick={handleViewMembers}
                  size="sm"
                >
                  Members ({memberCount})
                </Button>
                <Button
                  colorScheme="blue"
                  leftIcon={<FiPlus />}
                  onClick={handleNewTask}
                  size="sm"
                >
                  New Task
                </Button>
                <Button variant="outline" onClick={handleEditProject} size="sm">
                  Edit Project
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* Enhanced Project Stats */}
          {taskStats && (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Card
                bg={cardBg}
                borderRadius="xl"
                shadow="sm"
                border="1px"
                borderColor={borderColor}
              >
                <CardBody p={6}>
                  <Stat>
                    <HStack justify="space-between" align="center" mb={2}>
                      <StatLabel
                        fontSize="sm"
                        color="gray.600"
                        fontWeight="medium"
                      >
                        Total Tasks
                      </StatLabel>
                      <Box w={3} h={3} bg="blue.400" borderRadius="full" />
                    </HStack>
                    <StatNumber fontSize="2xl" color="gray.800" mb={1}>
                      {taskStats.total || 0}
                    </StatNumber>
                    <StatHelpText fontSize="xs" color="gray.500">
                      <StatArrow type="increase" />
                      {((taskStats.completion_rate || 0) * 100).toFixed(1)}%
                      completion rate
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card
                bg={cardBg}
                borderRadius="xl"
                shadow="sm"
                border="1px"
                borderColor={borderColor}
              >
                <CardBody p={6}>
                  <Stat>
                    <HStack justify="space-between" align="center" mb={2}>
                      <StatLabel
                        fontSize="sm"
                        color="gray.600"
                        fontWeight="medium"
                      >
                        In Progress
                      </StatLabel>
                      <Box w={3} h={3} bg="orange.400" borderRadius="full" />
                    </HStack>
                    <StatNumber fontSize="2xl" color="gray.800" mb={1}>
                      {taskStats.in_progress || 0}
                    </StatNumber>
                    <StatHelpText fontSize="xs" color="gray.500">
                      {taskStats.in_progress
                        ? "Active tasks"
                        : "No active tasks"}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card
                bg={cardBg}
                borderRadius="xl"
                shadow="sm"
                border="1px"
                borderColor={borderColor}
              >
                <CardBody p={6}>
                  <Stat>
                    <HStack justify="space-between" align="center" mb={2}>
                      <StatLabel
                        fontSize="sm"
                        color="gray.600"
                        fontWeight="medium"
                      >
                        Completed
                      </StatLabel>
                      <Box w={3} h={3} bg="green.400" borderRadius="full" />
                    </HStack>
                    <StatNumber fontSize="2xl" color="gray.800" mb={1}>
                      {taskStats.completed || 0}
                    </StatNumber>
                    <StatHelpText fontSize="xs" color="gray.500">
                      {((taskStats.completion_rate || 0) * 100).toFixed(1)}%
                      complete
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card
                bg={cardBg}
                borderRadius="xl"
                shadow="sm"
                border="1px"
                borderColor={borderColor}
              >
                <CardBody p={6}>
                  <Stat>
                    <HStack justify="space-between" align="center" mb={2}>
                      <StatLabel
                        fontSize="sm"
                        color="gray.600"
                        fontWeight="medium"
                      >
                        Overdue
                      </StatLabel>
                      <Box
                        w={3}
                        h={3}
                        bg={taskStats.overdue ? "red.400" : "green.400"}
                        borderRadius="full"
                      />
                    </HStack>
                    <StatNumber fontSize="2xl" color="gray.800" mb={1}>
                      {taskStats.overdue || 0}
                    </StatNumber>
                    <StatHelpText
                      fontSize="xs"
                      color={taskStats.overdue ? "red.500" : "green.500"}
                    >
                      {taskStats.overdue ? "Needs attention" : "All on track"}
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}

          {/* Enhanced Project Info */}
          <Card
            bg={cardBg}
            borderRadius="xl"
            shadow="sm"
            border="1px"
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack justify="space-between">
                <Heading size="md" color="gray.800">
                  Project Information
                </Heading>
                <Badge
                  colorScheme={
                    project.status === "active"
                      ? "green"
                      : project.status === "planning"
                      ? "blue"
                      : project.status === "on_hold"
                      ? "yellow"
                      : project.status === "completed"
                      ? "purple"
                      : "gray"
                  }
                  variant="solid"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  {project.status.toUpperCase().replace("_", " ")}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack align="stretch" spacing={4}>
                <HStack p={3} bg={hoverBg} borderRadius="lg">
                  <Icon as={FiCalendar} boxSize={5} color="blue.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Created
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(project.created_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
                <HStack p={3} bg={hoverBg} borderRadius="lg">
                  <Icon as={FiUsers} boxSize={5} color="green.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Team Members
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </Text>
                  </VStack>
                </HStack>
                <HStack p={3} bg={hoverBg} borderRadius="lg">
                  <Icon as={FiTag} boxSize={5} color="purple.500" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Last Updated
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Enhanced Quick Actions */}
          <Card
            bg={cardBg}
            borderRadius="xl"
            shadow="sm"
            border="1px"
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <Heading size="md" color="gray.800">
                Quick Actions
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <HStack spacing={4} flexWrap="wrap">
                <Button
                  colorScheme="blue"
                  leftIcon={<FiPlus />}
                  onClick={handleNewTask}
                  size="md"
                  borderRadius="lg"
                >
                  Create Task
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<FiUsers />}
                  onClick={handleViewMembers}
                  size="md"
                  borderRadius="lg"
                >
                  Manage Members
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/tasks?project=${project.id}`)}
                  size="md"
                  borderRadius="lg"
                >
                  View All Tasks
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>

      {/* Members Drawer */}
      {selectedProjectForMembers && (
        <MembersDrawer
          isOpen={!!selectedProjectForMembers}
          onClose={() => setSelectedProjectForMembers(null)}
          projectId={selectedProjectForMembers.id}
          projectName={selectedProjectForMembers.name}
        />
      )}

      {/* Project Edit Modal */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSuccess={handleProjectSuccess}
        project={editingProject}
      />

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        projectId={projectId}
      />
    </>
  );
}
