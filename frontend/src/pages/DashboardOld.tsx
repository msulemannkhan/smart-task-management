import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
  Badge,
  Icon,
  Flex,
  Button,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { TaskService } from "../services/taskService";
import { ProjectService } from "../services/projectService";
import { ActivityService, type Activity } from "../services/activityService";
import { TaskStatus, TaskPriority } from "../types/task";
import type { Task } from "../types/task";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiArrowRight,
  FiActivity,
  FiTrash2,
  FiUserPlus,
  FiPlus,
  FiEdit,
  FiUser,
  FiFolder,
  FiEdit2,
  FiUserMinus,
  FiFlag,
  FiCalendar,
  FiMessageCircle,
  FiTrash,
} from "react-icons/fi";

export function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const progressBg = useColorModeValue("gray.100", "gray.700");

  // Show stats across all projects for logged-in user
  const PROJECT_ID: string | undefined = undefined;

  // Color schemes for different priorities and statuses
  const priorityColors = {
    [TaskPriority.CRITICAL]: "red",
    [TaskPriority.URGENT]: "orange",
    [TaskPriority.HIGH]: "yellow",
    [TaskPriority.MEDIUM]: "blue",
    [TaskPriority.LOW]: "gray",
  };

  const statusColors = {
    [TaskStatus.DONE]: "green",
    [TaskStatus.IN_PROGRESS]: "blue",
    [TaskStatus.TODO]: "gray",
    [TaskStatus.BLOCKED]: "red",
    [TaskStatus.IN_REVIEW]: "purple",
    [TaskStatus.BACKLOG]: "gray",
    [TaskStatus.CANCELLED]: "red",
  };

  // Fetch stats using React Query
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["taskStats", PROJECT_ID],
    queryFn: () => TaskService.getTaskStats(PROJECT_ID),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch recent tasks for activity feed
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ["recentTasks", 20],
    queryFn: () => TaskService.getAllTasks({ per_page: 20 }),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch all tasks for analysis
  const { data: allTasksResponse, isLoading: allTasksLoading } = useQuery({
    queryKey: ["allTasks"],
    queryFn: () => TaskService.getAllTasks({ per_page: 100 }),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch projects for breakdown
  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectService.list(),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch user activities
  const {
    data: activitiesResponse,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["userActivities"],
    queryFn: () => ActivityService.getRecentActivities(undefined, 50),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const recentTasks = tasksResponse?.tasks || [];
  const allTasks = allTasksResponse?.tasks || [];
  const userActivities = activitiesResponse?.activities || [];
  // Remove duplicates from projects
  const projects = (projectsResponse?.projects || []).filter(
    (project, index, self) =>
      index === self.findIndex((p) => p.id === project.id)
  );
  const isLoading =
    statsLoading || tasksLoading || allTasksLoading || projectsLoading;
  const error = statsError || tasksError;

  // Calculate priority breakdown
  const priorityBreakdown = allTasks.reduce((acc, task) => {
    const priority = task.priority || TaskPriority.MEDIUM;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);

  // Calculate status breakdown
  const statusBreakdown = allTasks.reduce((acc, task) => {
    const status = task.status || TaskStatus.TODO;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  if (isLoading) {
    return (
      <Box h="full" p={8}>
        <VStack align="center" justify="center" h="full">
          <Spinner size="lg" color="primary.500" thickness="3px" />
          <Text color={textMuted} fontSize="sm">
            Loading dashboard...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box h="full" p={8}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data"}
        </Alert>
      </Box>
    );
  }

  const getTaskActivityIcon = (task: Task) => {
    if (task.status === TaskStatus.DONE || task.completed) return <Icon as={FiCheckCircle} color="green.500" boxSize={3} />;
    if (task.status === TaskStatus.IN_PROGRESS) return <Icon as={FiActivity} color="blue.500" boxSize={3} />;
    if (task.status === TaskStatus.BLOCKED) return <Icon as={FiAlertCircle} color="red.500" boxSize={3} />;
    return <Icon as={FiClock} color="gray.500" boxSize={3} />;
  };

  const getActivityText = (task: Task): string => {
    switch (task.status) {
      case TaskStatus.DONE:
        return "Completed";
      case TaskStatus.IN_PROGRESS:
        return "Started";
      case TaskStatus.IN_REVIEW:
        return "In review";
      case TaskStatus.BLOCKED:
        return "Blocked";
      case TaskStatus.TODO:
        return "Created";
      default:
        return "Updated";
    }
  };
  
  // Sort tasks by updated_at for recent activity
  const recentActivities = [...recentTasks].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at).getTime();
    const dateB = new Date(b.updated_at || b.created_at).getTime();
    return dateB - dateA; // Most recent first
  }).slice(0, 5);

  // Handler for clearing activities
  const handleClearActivities = async () => {
    try {
      await ActivityService.clearActivities();
      await refetchActivities();
      toast({
        title: "Activities cleared",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to clear activities",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Get icon component based on activity type
  const getActivityIcon = (activity: Activity) => {
    const style = ActivityService.getActivityStyle(activity);
    const iconMap: Record<string, any> = {
      FiPlus,
      FiCheckCircle,
      FiTrash,
      FiEdit,
      FiUser,
      FiFolder,
      FiEdit2,
      FiUserPlus,
      FiUserMinus,
      FiActivity,
      FiFlag,
      FiCalendar,
      FiMessageCircle,
    };
    const IconComponent = iconMap[style.icon] || FiActivity;
    return <Icon as={IconComponent} color={`${style.color}.500`} boxSize={3} mt={0.5} />;
  };

  return (
    <Box h="full" p={{ base: 4, md: 6, lg: 8 }}>
      <VStack align="stretch" spacing={{ base: 4, md: 6, lg: 8 }}>
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Dashboard
          </Heading>
          <Text color={textMuted} fontSize="sm">
            Overview of your tasks and projects
          </Text>
        </Box>

        {/* Minimal Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 2, lg: 4 }} spacing={{ base: 3, md: 4 }}>
          <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
            <CardBody>
              <HStack spacing={3}>
                <Box p={2} bg="blue.50" borderRadius="lg">
                  <Icon as={FiTrendingUp} boxSize={5} color="blue.500" />
                </Box>
                <Box>
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
                    {allTasks.length}
                  </Text>
                  <Text fontSize="xs" color={textMuted} noOfLines={1}>
                    Total Tasks
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
            <CardBody>
              <HStack spacing={3}>
                <Box p={2} bg="orange.50" borderRadius="lg">
                  <Icon as={FiClock} boxSize={5} color="orange.500" />
                </Box>
                <Box>
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
                    {stats?.in_progress || 0}
                  </Text>
                  <Text fontSize="xs" color={textMuted} noOfLines={1}>
                    In Progress
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
            <CardBody>
              <HStack spacing={3}>
                <Box p={2} bg="green.50" borderRadius="lg">
                  <Icon as={FiCheckCircle} boxSize={5} color="green.500" />
                </Box>
                <Box>
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
                    {allTasks.filter((task) => task.completed).length}
                  </Text>
                  <Text fontSize="xs" color={textMuted} noOfLines={1}>
                    Completed
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
            <CardBody>
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg={stats?.overdue ? "red.50" : "gray.50"}
                  borderRadius="lg"
                >
                  <Icon
                    as={FiAlertCircle}
                    boxSize={5}
                    color={stats?.overdue ? "red.500" : "gray.500"}
                  />
                </Box>
                <Box>
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold">
                    {
                      allTasks.filter(
                        (task) =>
                          task.due_date &&
                          new Date(task.due_date) < new Date() &&
                          !task.completed
                      ).length
                    }
                  </Text>
                  <Text fontSize="xs" color={textMuted} noOfLines={1}>
                    Overdue
                  </Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Main Content Grid */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 4, md: 6 }}>
          {/* Task Distribution - Simplified */}
          <Card
            bg={cardBg}
            boxShadow="sm"
            borderRadius="xl"
            gridColumn={{ base: "span 1", lg: "span 2" }}
          >
            <CardBody>
              <Text fontSize="sm" fontWeight="semibold" mb={4}>
                Task Distribution
              </Text>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {/* Priority Distribution */}
                <Box>
                  <Text fontSize="xs" color={textMuted} mb={3}>
                    BY PRIORITY
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {Object.entries(TaskPriority)
                      .slice(0, 3)
                      .map(([key, value]) => {
                        const count =
                          priorityBreakdown[value as TaskPriority] || 0;
                        const percentage =
                          allTasks.length > 0
                            ? (count / allTasks.length) * 100
                            : 0;
                        return (
                          <Box key={key}>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" textTransform="capitalize">
                                {key.toLowerCase()}
                              </Text>
                              <Text fontSize="xs" color={textMuted}>
                                {count}
                              </Text>
                            </HStack>
                            <Progress
                              value={percentage}
                              size="xs"
                              colorScheme={
                                priorityColors[value as TaskPriority]
                              }
                              borderRadius="full"
                              bg={progressBg}
                            />
                          </Box>
                        );
                      })}
                  </VStack>
                </Box>

                {/* Status Distribution */}
                <Box>
                  <Text fontSize="xs" color={textMuted} mb={3}>
                    BY STATUS
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {[
                      TaskStatus.TODO,
                      TaskStatus.IN_PROGRESS,
                      TaskStatus.DONE,
                    ].map((status) => {
                      const count = statusBreakdown[status] || 0;
                      const percentage =
                        allTasks.length > 0
                          ? (count / allTasks.length) * 100
                          : 0;
                      const labels = {
                        [TaskStatus.TODO]: "To Do",
                        [TaskStatus.IN_PROGRESS]: "In Progress",
                        [TaskStatus.DONE]: "Completed",
                      };
                      return (
                        <Box key={status}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs">{labels[status]}</Text>
                            <Text fontSize="xs" color={textMuted}>
                              {count}
                            </Text>
                          </HStack>
                          <Progress
                            value={percentage}
                            size="xs"
                            colorScheme={statusColors[status]}
                            borderRadius="full"
                            bg={progressBg}
                          />
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Recent Activity - Real Activities from API */}
          <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="sm" fontWeight="semibold">
                  Recent Activity
                </Text>
                {userActivities.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    leftIcon={<Icon as={FiTrash2} boxSize={3} />}
                    onClick={handleClearActivities}
                    color="red.500"
                    _hover={{ bg: "red.50" }}
                  >
                    Clear
                  </Button>
                )}
              </HStack>
              
              <Box maxH="300px" overflowY="auto" pr={2}>
                <VStack align="stretch" spacing={3}>
                  {activitiesLoading ? (
                    <Spinner size="sm" />
                  ) : userActivities.length > 0 ? (
                    userActivities.slice(0, 20).map((activity) => (
                      <HStack key={activity.id} spacing={3} align="flex-start">
                        {getActivityIcon(activity)}
                        <Box flex={1}>
                          <Text fontSize="xs" fontWeight="medium">
                            {activity.description}
                          </Text>
                          <HStack spacing={2} mt={0.5}>
                            <Text fontSize="xs" color={textMuted}>
                              {formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                              })}
                            </Text>
                            {activity.project_name && (
                              <>
                                <Text fontSize="xs" color={textMuted}>•</Text>
                                <Text fontSize="xs" color={textMuted} noOfLines={1}>
                                  {activity.project_name}
                                </Text>
                              </>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                    ))
                  ) : recentActivities.length > 0 ? (
                    // Fallback to task-based activities if no user activities yet
                    recentActivities.map((task) => (
                      <HStack key={task.id} spacing={3} align="flex-start">
                        {getTaskActivityIcon(task)}
                        <Box flex={1}>
                          <HStack spacing={2} align="baseline">
                            <Text fontSize="xs" fontWeight="medium">
                              {getActivityText(task)}
                            </Text>
                            <Text fontSize="xs" noOfLines={1} color={textMuted}>
                              "{task.title}"
                            </Text>
                          </HStack>
                          <HStack spacing={2} mt={0.5}>
                            <Text fontSize="xs" color={textMuted}>
                              {formatDistanceToNow(new Date(task.updated_at || task.created_at), {
                                addSuffix: true,
                              })}
                            </Text>
                            {task.project && (
                              <>
                                <Text fontSize="xs" color={textMuted}>•</Text>
                                <Text fontSize="xs" color={textMuted} noOfLines={1}>
                                  {task.project.name}
                                </Text>
                              </>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                    ))
                  ) : (
                    <Text fontSize="xs" color={textMuted} textAlign="center">
                      No recent activity
                    </Text>
                  )}
                </VStack>
              </Box>
              
              {userActivities.length > 4 && (
                <Text 
                  fontSize="xs" 
                  color={textMuted} 
                  textAlign="center" 
                  mt={3}
                  fontStyle="italic"
                >
                  Scroll to see more activities
                </Text>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Project Task Breakdown */}
        {projects.length > 0 && (
          <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="sm" fontWeight="semibold">
                  Projects ({projects.length})
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  rightIcon={<Icon as={FiArrowRight} />}
                  onClick={() => navigate("/projects")}
                  color="primary.500"
                  _hover={{ bg: "primary.50" }}
                >
                  See All
                </Button>
              </HStack>
              <VStack align="stretch" spacing={3}>
                {projects.slice(0, 5).map((project) => {
                  const projectTasks = allTasks.filter(
                    (task) => task.project_id === project.id
                  );
                  const completedTasks = projectTasks.filter(
                    (task) => task.completed || task.status === "done"
                  );
                  const progress =
                    projectTasks.length > 0
                      ? (completedTasks.length / projectTasks.length) * 100
                      : 0;

                  return (
                    <HStack
                      key={project.id}
                      justify="space-between"
                      spacing={4}
                    >
                      <HStack spacing={3} flex={1}>
                        <Box
                          w={3}
                          h={3}
                          bg={project.color}
                          borderRadius="full"
                          flexShrink={0}
                        />
                        <VStack align="flex-start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {project.name}
                          </Text>
                          <Text fontSize="xs" color={textMuted}>
                            {completedTasks.length}/{projectTasks.length}{" "}
                            completed
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack spacing={2}>
                        <Badge
                          colorScheme={
                            projectTasks.length > 0 ? "blue" : "gray"
                          }
                          variant="subtle"
                          fontSize="xs"
                        >
                          {projectTasks.length}
                        </Badge>
                        <Box w={16}>
                          <Progress
                            value={progress}
                            size="xs"
                            colorScheme="green"
                            borderRadius="full"
                            bg={progressBg}
                          />
                        </Box>
                      </HStack>
                    </HStack>
                  );
                })}
                {projects.length > 5 && (
                  <Text
                    fontSize="xs"
                    color={textMuted}
                    textAlign="center"
                    pt={2}
                  >
                    +{projects.length - 5} more projects
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Upcoming Tasks */}
        {(() => {
          const upcomingTasks = allTasks
            .filter(
              (task) => task.due_date && new Date(task.due_date) > new Date()
            )
            .sort(
              (a, b) =>
                new Date(a.due_date!).getTime() -
                new Date(b.due_date!).getTime()
            )
            .slice(0, 3);

          return upcomingTasks.length > 0 ? (
            <Card bg={cardBg} boxShadow="sm" borderRadius="xl">
              <CardBody>
                <Text fontSize="sm" fontWeight="semibold" mb={4}>
                  Upcoming Deadlines
                </Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 6 }}>
                  {upcomingTasks.map((task) => (
                    <HStack key={task.id} flex={1}>
                      <Badge colorScheme="orange" fontSize="xs">
                        {formatDistanceToNow(new Date(task.due_date!), {
                          addSuffix: false,
                        })}
                      </Badge>
                      <Text fontSize="sm" noOfLines={1}>
                        {task.title}
                      </Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          ) : null;
        })()}
      </VStack>
    </Box>
  );
}
