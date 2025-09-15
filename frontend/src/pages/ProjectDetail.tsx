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
  AvatarGroup,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiUsers,
  FiCalendar,
  FiTag,
  FiActivity,
  FiList,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiFolder,
  FiFlag,
} from "react-icons/fi";
import {
  ProjectService,
  type ProjectListResponse,
} from "../services/projectService";
import { TaskService } from "../services/taskService";
import { ProjectMemberService } from "../services/projectMemberService";
import { MembersDrawer } from "../components/projects/MembersDrawer";
import { ProjectModal } from "../components/projects/ProjectModal";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { UserAvatar } from "../components/common/UserAvatar";
import { ActivityService, type Activity } from "../services/activityService";
import { formatDistanceToNow } from "date-fns";

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<
    ProjectListResponse["projects"][0] | null
  >(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [members, setMembers] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
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

        // Fetch members with details
        try {
          const membersData = await ProjectMemberService.list(projectId);
          // Filter out duplicate members based on user_id
          const uniqueMembers =
            membersData.members?.filter(
              (member, index, self) =>
                index === self.findIndex((m) => m.user_id === member.user_id)
            ) || [];
          setMembers(uniqueMembers);
          setMemberCount(uniqueMembers.length);
        } catch (memberError) {
          console.warn("Failed to fetch project members:", memberError);
          setMembers([]);
          setMemberCount(0);
        }

        // Fetch task stats
        try {
          const stats = await TaskService.getTaskStats(projectId);
          setTaskStats(stats);
        } catch {
          setTaskStats(null);
        }

        // Fetch recent activities
        try {
          const activities = await ActivityService.getRecentActivities(
            projectId,
            5
          );
          setRecentActivities(activities.activities || []);
        } catch {
          setRecentActivities([]);
        }

        // Fetch recent tasks
        try {
          const tasksRes = await TaskService.getTasks({
            project_id: projectId,
            per_page: 5,
          });
          // Filter out any duplicate tasks based on ID
          const uniqueTasks =
            tasksRes.tasks?.filter(
              (task, index, self) =>
                index === self.findIndex((t) => t.id === task.id)
            ) || [];
          setRecentTasks(uniqueTasks);
        } catch {
          setRecentTasks([]);
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
      <Box minH="100vh" bg={bgColor}>
        <Box p={8}>
          <VStack align="stretch" spacing={8}>
            {/* Enhanced Header with Gradient Background */}
            <Box
              bg={cardBg}
              borderRadius="2xl"
              p={8}
              shadow="lg"
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
                background: `linear-gradient(90deg, ${project.color} 0%, ${accentColor} 50%, ${project.color} 100%)`,
                opacity: 0.8,
              }}
            >
              <HStack
                justify="space-between"
                align="center"
                position="relative"
                zIndex={1}
              >
                <HStack spacing={6}>
                  <Button
                    variant="ghost"
                    leftIcon={<FiArrowLeft />}
                    onClick={() => navigate("/projects")}
                    size="sm"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                  >
                    Back
                  </Button>
                  <Divider
                    orientation="vertical"
                    h="8"
                    borderColor={borderColor}
                  />
                  <HStack spacing={6}>
                    <Box
                      w={8}
                      h={8}
                      bg={project.color}
                      borderRadius="xl"
                      flexShrink={0}
                      shadow="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FiFolder} color="white" boxSize={5} />
                    </Box>
                    <VStack align="start" spacing={2}>
                      <Heading size="xl" color={textColor} fontWeight="bold">
                        {project.name}
                      </Heading>
                      <Text
                        fontSize="lg"
                        color={mutedColor}
                        maxW="600px"
                        lineHeight="1.5"
                      >
                        {project.description ||
                          "No description provided for this project."}
                      </Text>
                    </VStack>
                  </HStack>
                </HStack>
                <HStack spacing={4}>
                  {/* Member Avatars */}
                  <AvatarGroup size="md" max={4}>
                    {members.map((member) => (
                      <Tooltip
                        key={member.id}
                        label={member.user?.full_name || member.user?.email}
                      >
                        <Box>
                          <UserAvatar user={member.user} size="md" />
                        </Box>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                  <Button
                    variant="outline"
                    leftIcon={<FiUsers />}
                    onClick={handleViewMembers}
                    size="md"
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ bg: hoverBg, borderColor: accentColor }}
                  >
                    {memberCount} Members
                  </Button>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiPlus />}
                    onClick={handleNewTask}
                    size="md"
                    _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
                  >
                    New Task
                  </Button>
                  <IconButton
                    aria-label="Edit project"
                    icon={<FiEdit />}
                    variant="outline"
                    onClick={handleEditProject}
                    size="md"
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ bg: hoverBg, borderColor: accentColor }}
                  />
                </HStack>
              </HStack>
            </Box>

            {/* Enhanced Project Stats */}
            {taskStats && (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                <Card
                  bg={cardBg}
                  borderRadius="2xl"
                  shadow="md"
                  border="1px"
                  borderColor={borderColor}
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                  transition="all 0.3s ease"
                  position="relative"
                  overflow="hidden"
                >
                  <CardBody p={8}>
                    <Stat>
                      <HStack justify="space-between" align="center" mb={4}>
                        <StatLabel
                          fontSize="sm"
                          color={mutedColor}
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          Total Tasks
                        </StatLabel>
                        <Box
                          w={4}
                          h={4}
                          bg={accentColor}
                          borderRadius="full"
                          shadow="sm"
                        />
                      </HStack>
                      <StatNumber
                        fontSize="3xl"
                        color={textColor}
                        mb={2}
                        fontWeight="bold"
                      >
                        {taskStats.total || 0}
                      </StatNumber>
                      <StatHelpText fontSize="sm" color={mutedColor}>
                        <StatArrow type="increase" />
                        {((taskStats.completion_rate || 0) * 100).toFixed(1)}%
                        completion rate
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card
                  bg={cardBg}
                  borderRadius="2xl"
                  shadow="md"
                  border="1px"
                  borderColor={borderColor}
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                  transition="all 0.3s ease"
                >
                  <CardBody p={8}>
                    <Stat>
                      <HStack justify="space-between" align="center" mb={4}>
                        <StatLabel
                          fontSize="sm"
                          color={mutedColor}
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          In Progress
                        </StatLabel>
                        <Box
                          w={4}
                          h={4}
                          bg={warningColor}
                          borderRadius="full"
                          shadow="sm"
                        />
                      </HStack>
                      <StatNumber
                        fontSize="3xl"
                        color={textColor}
                        mb={2}
                        fontWeight="bold"
                      >
                        {taskStats.in_progress || 0}
                      </StatNumber>
                      <StatHelpText fontSize="sm" color={mutedColor}>
                        {taskStats.in_progress
                          ? "Active tasks"
                          : "No active tasks"}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card
                  bg={cardBg}
                  borderRadius="2xl"
                  shadow="md"
                  border="1px"
                  borderColor={borderColor}
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                  transition="all 0.3s ease"
                >
                  <CardBody p={8}>
                    <Stat>
                      <HStack justify="space-between" align="center" mb={4}>
                        <StatLabel
                          fontSize="sm"
                          color={mutedColor}
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          Completed
                        </StatLabel>
                        <Box
                          w={4}
                          h={4}
                          bg={successColor}
                          borderRadius="full"
                          shadow="sm"
                        />
                      </HStack>
                      <StatNumber
                        fontSize="3xl"
                        color={textColor}
                        mb={2}
                        fontWeight="bold"
                      >
                        {taskStats.completed || 0}
                      </StatNumber>
                      <StatHelpText fontSize="sm" color={mutedColor}>
                        {((taskStats.completion_rate || 0) * 100).toFixed(1)}%
                        complete
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card
                  bg={cardBg}
                  borderRadius="2xl"
                  shadow="md"
                  border="1px"
                  borderColor={borderColor}
                  _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                  transition="all 0.3s ease"
                >
                  <CardBody p={8}>
                    <Stat>
                      <HStack justify="space-between" align="center" mb={4}>
                        <StatLabel
                          fontSize="sm"
                          color={mutedColor}
                          fontWeight="semibold"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          Overdue
                        </StatLabel>
                        <Box
                          w={4}
                          h={4}
                          bg={taskStats.overdue ? errorColor : successColor}
                          borderRadius="full"
                          shadow="sm"
                        />
                      </HStack>
                      <StatNumber
                        fontSize="3xl"
                        color={textColor}
                        mb={2}
                        fontWeight="bold"
                      >
                        {taskStats.overdue || 0}
                      </StatNumber>
                      <StatHelpText
                        fontSize="sm"
                        color={taskStats.overdue ? errorColor : successColor}
                        fontWeight="medium"
                      >
                        {taskStats.overdue ? "Needs attention" : "All on track"}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </SimpleGrid>
            )}

            {/* Enhanced Tabbed Interface */}
            <Card
              bg={cardBg}
              borderRadius="2xl"
              shadow="md"
              border="1px"
              borderColor={borderColor}
              _hover={{ shadow: "lg" }}
              transition="all 0.3s ease"
            >
              <CardBody p={0}>
                <Tabs colorScheme="blue" variant="enclosed">
                  <TabList
                    bg={hoverBg}
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
                        <Icon as={FiTag} />
                        <Text>Overview</Text>
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
                        <Text>Recent Activity</Text>
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
                        <Icon as={FiList} />
                        <Text>Recent Tasks</Text>
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
                        <Icon as={FiTrendingUp} />
                        <Text>Analytics</Text>
                      </HStack>
                    </Tab>
                  </TabList>

                  <TabPanels>
                    {/* Enhanced Overview Tab */}
                    <TabPanel px={6} py={8}>
                      <VStack align="stretch" spacing={6}>
                        <HStack justify="space-between" mb={6}>
                          <Heading
                            size="md"
                            color={textColor}
                            fontWeight="bold"
                          >
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
                            px={6}
                            py={2}
                            borderRadius="full"
                            fontSize="sm"
                            fontWeight="semibold"
                            textTransform="uppercase"
                            letterSpacing="wide"
                          >
                            {project.status.replace("_", " ")}
                          </Badge>
                        </HStack>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                          <Box
                            p={6}
                            bg={hoverBg}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor={borderColor}
                          >
                            <HStack spacing={4}>
                              <Box p={3} bg={accentColor} borderRadius="lg">
                                <Icon
                                  as={FiCalendar}
                                  boxSize={6}
                                  color="white"
                                />
                              </Box>
                              <VStack align="start" spacing={1}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="semibold"
                                  color={mutedColor}
                                  textTransform="uppercase"
                                  letterSpacing="wide"
                                >
                                  Created
                                </Text>
                                <Text
                                  fontSize="lg"
                                  color={textColor}
                                  fontWeight="medium"
                                >
                                  {new Date(
                                    project.created_at
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                          <Box
                            p={6}
                            bg={hoverBg}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor={borderColor}
                          >
                            <HStack spacing={4}>
                              <Box p={3} bg={successColor} borderRadius="lg">
                                <Icon as={FiTag} boxSize={6} color="white" />
                              </Box>
                              <VStack align="start" spacing={1}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="semibold"
                                  color={mutedColor}
                                  textTransform="uppercase"
                                  letterSpacing="wide"
                                >
                                  Last Updated
                                </Text>
                                <Text
                                  fontSize="lg"
                                  color={textColor}
                                  fontWeight="medium"
                                >
                                  {new Date(
                                    project.updated_at
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </SimpleGrid>

                        {/* Enhanced Team Members Section */}
                        <Box
                          p={6}
                          bg={hoverBg}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between" mb={6}>
                            <HStack spacing={3}>
                              <Box p={2} bg={successColor} borderRadius="lg">
                                <Icon as={FiUsers} boxSize={5} color="white" />
                              </Box>
                              <VStack align="start" spacing={0}>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  Team Members
                                </Text>
                                <Text fontSize="sm" color={mutedColor}>
                                  {memberCount} active members
                                </Text>
                              </VStack>
                            </HStack>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleViewMembers}
                              color={textColor}
                              borderColor={borderColor}
                              _hover={{ bg: cardBg, borderColor: accentColor }}
                            >
                              Manage
                            </Button>
                          </HStack>
                          <AvatarGroup size="lg" max={8} spacing={-2}>
                            {members.map((member) => (
                              <Tooltip
                                key={member.id}
                                label={`${
                                  member.user?.full_name || member.user?.email
                                } (${member.role})`}
                              >
                                <Box>
                                  <UserAvatar user={member.user} size="lg" />
                                </Box>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        </Box>

                        {/* Enhanced Task Progress */}
                        <Box
                          p={6}
                          bg={hoverBg}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <HStack justify="space-between" mb={6}>
                            <HStack spacing={3}>
                              <Box p={2} bg={accentColor} borderRadius="lg">
                                <Icon
                                  as={FiTrendingUp}
                                  boxSize={5}
                                  color="white"
                                />
                              </Box>
                              <VStack align="start" spacing={0}>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  Overall Progress
                                </Text>
                                <Text fontSize="sm" color={mutedColor}>
                                  Task completion status
                                </Text>
                              </VStack>
                            </HStack>
                            <Text
                              fontSize="2xl"
                              color={textColor}
                              fontWeight="bold"
                            >
                              {taskStats
                                ? Math.round(
                                    (taskStats.completed / taskStats.total) *
                                      100
                                  )
                                : 0}
                              %
                            </Text>
                          </HStack>
                          <Progress
                            value={
                              taskStats
                                ? (taskStats.completed / taskStats.total) * 100
                                : 0
                            }
                            size="lg"
                            borderRadius="full"
                            colorScheme="blue"
                            bg={borderColor}
                          />
                          <HStack justify="space-between" mt={3}>
                            <Text fontSize="sm" color={mutedColor}>
                              {taskStats?.completed || 0} of{" "}
                              {taskStats?.total || 0} tasks completed
                            </Text>
                            <Text fontSize="sm" color={mutedColor}>
                              {taskStats?.in_progress || 0} in progress
                            </Text>
                          </HStack>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced Recent Activity Tab */}
                    <TabPanel px={6} py={8}>
                      <VStack align="stretch" spacing={4}>
                        {recentActivities.length > 0 ? (
                          recentActivities.map((activity) => (
                            <Box
                              key={activity.id}
                              p={4}
                              bg={hoverBg}
                              borderRadius="xl"
                              border="1px solid"
                              borderColor={borderColor}
                              _hover={{
                                shadow: "md",
                                transform: "translateY(-1px)",
                              }}
                              transition="all 0.2s ease"
                            >
                              <HStack spacing={4}>
                                <Box p={2} bg={accentColor} borderRadius="lg">
                                  <Icon
                                    as={FiActivity}
                                    color="white"
                                    boxSize={5}
                                  />
                                </Box>
                                <Box flex={1}>
                                  <Text
                                    fontSize="md"
                                    color={textColor}
                                    fontWeight="medium"
                                    mb={1}
                                  >
                                    {activity.description}
                                  </Text>
                                  <Text fontSize="sm" color={mutedColor}>
                                    {formatDistanceToNow(
                                      new Date(activity.created_at),
                                      { addSuffix: true }
                                    )}
                                  </Text>
                                </Box>
                              </HStack>
                            </Box>
                          ))
                        ) : (
                          <Box textAlign="center" py={12}>
                            <Icon
                              as={FiActivity}
                              boxSize={12}
                              color={mutedColor}
                              mb={4}
                            />
                            <Text
                              color={mutedColor}
                              fontSize="lg"
                              fontWeight="medium"
                            >
                              No recent activities
                            </Text>
                            <Text color={mutedColor} fontSize="sm">
                              Activity will appear here when team members make
                              changes
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>

                    {/* Enhanced Recent Tasks Tab */}
                    <TabPanel px={6} py={8}>
                      <VStack align="stretch" spacing={4}>
                        {recentTasks.length > 0 ? (
                          recentTasks.map((task) => (
                            <Box
                              key={task.id}
                              p={4}
                              bg={hoverBg}
                              borderRadius="xl"
                              border="1px solid"
                              borderColor={borderColor}
                              cursor="pointer"
                              _hover={{
                                shadow: "md",
                                transform: "translateY(-1px)",
                                borderColor: accentColor,
                              }}
                              transition="all 0.2s ease"
                              onClick={() => navigate(`/tasks/${task.id}`)}
                            >
                              <HStack spacing={4}>
                                <Box
                                  p={2}
                                  bg={
                                    task.status === "completed"
                                      ? successColor
                                      : task.status === "in_progress"
                                      ? warningColor
                                      : mutedColor
                                  }
                                  borderRadius="lg"
                                >
                                  <Icon
                                    as={
                                      task.status === "completed"
                                        ? FiCheckCircle
                                        : task.status === "in_progress"
                                        ? FiClock
                                        : FiAlertCircle
                                    }
                                    color="white"
                                    boxSize={5}
                                  />
                                </Box>
                                <Box flex={1}>
                                  <Text
                                    fontSize="md"
                                    fontWeight="semibold"
                                    color={textColor}
                                    mb={2}
                                  >
                                    {task.title}
                                  </Text>
                                  <HStack spacing={3} flexWrap="wrap">
                                    <Badge
                                      size="sm"
                                      colorScheme={
                                        task.priority === "urgent"
                                          ? "red"
                                          : task.priority === "high"
                                          ? "orange"
                                          : task.priority === "medium"
                                          ? "yellow"
                                          : "gray"
                                      }
                                      borderRadius="full"
                                      px={3}
                                      py={1}
                                    >
                                      {task.priority}
                                    </Badge>
                                    <Text fontSize="sm" color={mutedColor}>
                                      {task.assignee?.full_name || "Unassigned"}
                                    </Text>
                                  </HStack>
                                </Box>
                              </HStack>
                            </Box>
                          ))
                        ) : (
                          <Box textAlign="center" py={12}>
                            <Icon
                              as={FiList}
                              boxSize={12}
                              color={mutedColor}
                              mb={4}
                            />
                            <Text
                              color={mutedColor}
                              fontSize="lg"
                              fontWeight="medium"
                            >
                              No tasks yet
                            </Text>
                            <Text color={mutedColor} fontSize="sm">
                              Create your first task to get started
                            </Text>
                          </Box>
                        )}
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() =>
                            navigate(`/tasks?project=${project.id}`)
                          }
                          w="full"
                          color={textColor}
                          borderColor={borderColor}
                          _hover={{ bg: cardBg, borderColor: accentColor }}
                          _active={{ transform: "scale(0.98)" }}
                        >
                          View All Tasks
                        </Button>
                      </VStack>
                    </TabPanel>

                    {/* Enhanced Analytics Tab */}
                    <TabPanel px={6} py={8}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <Box
                          p={6}
                          bg={hoverBg}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <VStack align="start" spacing={4}>
                            <HStack spacing={3}>
                              <Box p={2} bg={accentColor} borderRadius="lg">
                                <Icon as={FiList} boxSize={5} color="white" />
                              </Box>
                              <Text
                                fontSize="lg"
                                fontWeight="bold"
                                color={textColor}
                              >
                                Task Distribution
                              </Text>
                            </HStack>
                            <VStack w="full" spacing={3}>
                              <HStack
                                w="full"
                                justify="space-between"
                                p={3}
                                bg={cardBg}
                                borderRadius="lg"
                              >
                                <HStack spacing={3}>
                                  <Box
                                    w={3}
                                    h={3}
                                    bg={mutedColor}
                                    borderRadius="full"
                                  />
                                  <Text fontSize="md" color={textColor}>
                                    Todo
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  {taskStats?.todo || 0}
                                </Text>
                              </HStack>
                              <HStack
                                w="full"
                                justify="space-between"
                                p={3}
                                bg={cardBg}
                                borderRadius="lg"
                              >
                                <HStack spacing={3}>
                                  <Box
                                    w={3}
                                    h={3}
                                    bg={warningColor}
                                    borderRadius="full"
                                  />
                                  <Text fontSize="md" color={textColor}>
                                    In Progress
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  {taskStats?.in_progress || 0}
                                </Text>
                              </HStack>
                              <HStack
                                w="full"
                                justify="space-between"
                                p={3}
                                bg={cardBg}
                                borderRadius="lg"
                              >
                                <HStack spacing={3}>
                                  <Box
                                    w={3}
                                    h={3}
                                    bg={successColor}
                                    borderRadius="full"
                                  />
                                  <Text fontSize="md" color={textColor}>
                                    Completed
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  {taskStats?.completed || 0}
                                </Text>
                              </HStack>
                            </VStack>
                          </VStack>
                        </Box>

                        <Box
                          p={6}
                          bg={hoverBg}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <VStack align="start" spacing={4}>
                            <HStack spacing={3}>
                              <Box p={2} bg={successColor} borderRadius="lg">
                                <Icon as={FiFlag} boxSize={5} color="white" />
                              </Box>
                              <Text
                                fontSize="lg"
                                fontWeight="bold"
                                color={textColor}
                              >
                                Priority Breakdown
                              </Text>
                            </HStack>
                            <VStack w="full" spacing={3}>
                              <HStack
                                w="full"
                                justify="space-between"
                                p={3}
                                bg={cardBg}
                                borderRadius="lg"
                              >
                                <HStack spacing={3}>
                                  <Box
                                    w={3}
                                    h={3}
                                    bg={errorColor}
                                    borderRadius="full"
                                  />
                                  <Text fontSize="md" color={textColor}>
                                    Urgent
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  {taskStats?.urgent || 0}
                                </Text>
                              </HStack>
                              <HStack
                                w="full"
                                justify="space-between"
                                p={3}
                                bg={cardBg}
                                borderRadius="lg"
                              >
                                <HStack spacing={3}>
                                  <Box
                                    w={3}
                                    h={3}
                                    bg={warningColor}
                                    borderRadius="full"
                                  />
                                  <Text fontSize="md" color={textColor}>
                                    High
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  {taskStats?.high || 0}
                                </Text>
                              </HStack>
                              <HStack
                                w="full"
                                justify="space-between"
                                p={3}
                                bg={cardBg}
                                borderRadius="lg"
                              >
                                <HStack spacing={3}>
                                  <Box
                                    w={3}
                                    h={3}
                                    bg={accentColor}
                                    borderRadius="full"
                                  />
                                  <Text fontSize="md" color={textColor}>
                                    Medium
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  {taskStats?.medium || 0}
                                </Text>
                              </HStack>
                              <HStack
                                w="full"
                                justify="space-between"
                                p={3}
                                bg={cardBg}
                                borderRadius="lg"
                              >
                                <HStack spacing={3}>
                                  <Box
                                    w={3}
                                    h={3}
                                    bg={successColor}
                                    borderRadius="full"
                                  />
                                  <Text fontSize="md" color={textColor}>
                                    Low
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="lg"
                                  fontWeight="bold"
                                  color={textColor}
                                >
                                  {taskStats?.low || 0}
                                </Text>
                              </HStack>
                            </VStack>
                          </VStack>
                        </Box>
                      </SimpleGrid>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card
              bg={cardBg}
              borderRadius="2xl"
              shadow="md"
              border="1px"
              borderColor={borderColor}
              _hover={{ shadow: "lg" }}
              transition="all 0.3s ease"
            >
              <CardHeader pb={6}>
                <Heading size="lg" color={textColor} fontWeight="bold">
                  Quick Actions
                </Heading>
                <Text color={mutedColor} fontSize="sm">
                  Common actions for this project
                </Text>
              </CardHeader>
              <CardBody pt={0}>
                <HStack spacing={4} flexWrap="wrap">
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiPlus />}
                    onClick={handleNewTask}
                    size="lg"
                    borderRadius="xl"
                    _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
                    transition="all 0.2s ease"
                  >
                    Create Task
                  </Button>
                  <Button
                    variant="outline"
                    leftIcon={<FiUsers />}
                    onClick={handleViewMembers}
                    size="lg"
                    borderRadius="xl"
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ bg: hoverBg, borderColor: accentColor }}
                  >
                    Manage Members
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/tasks?project=${project.id}`)}
                    size="lg"
                    borderRadius="xl"
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ bg: hoverBg, borderColor: accentColor }}
                  >
                    View All Tasks
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          </VStack>
        </Box>
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
