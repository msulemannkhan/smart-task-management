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
  Badge,
  Icon,
  Flex,
  Button,
  useColorModeValue,
  useToast,
  Avatar,
  AvatarGroup,
  Divider,
  IconButton,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Container,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { TaskService } from "../services/taskService";
import { ProjectService } from "../services/projectService";
import { ActivityService, type Activity } from "../services/activityService";
import { TaskStatus, TaskPriority } from "../types/task";
import type { Task } from "../types/task";
import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
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
  FiRefreshCw,
  FiTarget,
  FiZap,
  FiAward,
  FiBarChart2,
  FiPieChart,
  FiTrendingDown,
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { StatsCard } from "../components/dashboard/StatsCard";
import {
  TaskStatusPieChart,
  TaskCompletionTrend,
  PriorityBarChart,
  TeamPerformanceRadar,
} from "../components/dashboard/TaskCharts";

const MotionBox = motion(Box);

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

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  // Theme colors
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  // Fetch all data needed for dashboard
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["taskStats"],
    queryFn: () => TaskService.getTaskStats(undefined),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const {
    data: allTasksResponse,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["dashboardTasks"],
    queryFn: () => TaskService.getAllTasks({ per_page: 200 }),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ["dashboardProjects"],
    queryFn: () => ProjectService.list(),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const {
    data: activitiesResponse,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["dashboardActivities"],
    queryFn: () => ActivityService.getRecentActivities(undefined, 20),
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const allTasks = allTasksResponse?.tasks || [];
  const projects = (projectsResponse?.projects || []).filter(
    (project, index, self) =>
      index === self.findIndex((p) => p.id === project.id)
  );
  const activities = activitiesResponse?.activities || [];
  const isLoading = statsLoading || tasksLoading || projectsLoading;

  // Calculate metrics
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(
    (t) => t.status === TaskStatus.DONE
  ).length;
  const inProgressTasks = allTasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS
  ).length;
  const overdueTasks = allTasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== TaskStatus.DONE
  ).length;
  const blockedTasks = allTasks.filter(
    (t) => t.status === TaskStatus.BLOCKED
  ).length;

  // Calculate completion rate and trends
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const productivityScore =
    totalTasks > 0
      ? Math.round(((completedTasks + inProgressTasks) / totalTasks) * 100)
      : 0;

  // Get tasks created today
  const todayTasks = allTasks.filter((t) => {
    const createdDate = parseISO(t.created_at);
    return isToday(createdDate);
  }).length;

  // Get tasks completed this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const completedThisWeek = allTasks.filter(
    (t) =>
      t.status === TaskStatus.DONE &&
      t.updated_at &&
      new Date(t.updated_at) > weekStart
  ).length;

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchTasks(), refetchActivities()]);
    toast({
      title: "Dashboard refreshed",
      status: "success",
      duration: 2000,
      position: "top-right",
    });
  };

  // Handle clear activities
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

  // Get activity icon
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
    return <Icon as={IconComponent} color={`${style.color}.500`} boxSize={4} />;
  };

  // Get upcoming tasks
  const upcomingTasks = allTasks
    .filter((t) => t.due_date && new Date(t.due_date) > new Date())
    .sort(
      (a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    )
    .slice(0, 5);

  // Get high priority tasks
  const highPriorityTasks = allTasks
    .filter(
      (t) =>
        (t.priority === TaskPriority.HIGH ||
          t.priority === TaskPriority.URGENT ||
          t.priority === TaskPriority.CRITICAL) &&
        t.status !== TaskStatus.DONE
    )
    .slice(0, 5);

  if (statsError) {
    return (
      <Box h="full" p={8}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          Failed to load dashboard data
        </Alert>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Box maxW="1400px" mx="auto" p={{ base: 4, md: 6, lg: 8 }}>
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Section */}
          <MotionBox variants={itemVariants} mb={8}>
            <Flex justify="space-between" align="center" mb={2}>
              <VStack align="flex-start" spacing={1}>
                <Heading size="lg" color={textColor}>
                  Welcome back!
                </Heading>
                <Text color={textMuted} fontSize="md">
                  Here's what's happening with your tasks today
                </Text>
              </VStack>
              <HStack spacing={3}>
                <IconButton
                  aria-label="Refresh"
                  icon={<Icon as={FiRefreshCw} />}
                  variant="outline"
                  onClick={handleRefresh}
                  isLoading={isLoading}
                />
                <Button
                  leftIcon={<Icon as={FiPlus} />}
                  colorScheme="blue"
                  onClick={() => navigate("/tasks")}
                >
                  New Task
                </Button>
              </HStack>
            </Flex>
          </MotionBox>

          {/* Stats Cards */}
          <MotionBox variants={itemVariants}>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} mb={8}>
              <StatsCard
                title="Total Tasks"
                value={isLoading ? "..." : totalTasks}
                icon={FiFileText}
                colorScheme="blue"
                isLoading={isLoading}
                subtitle={`${todayTasks} created today`}
                onClick={() => navigate("/tasks")}
              />
              <StatsCard
                title="In Progress"
                value={isLoading ? "..." : inProgressTasks}
                icon={FiClock}
                colorScheme="orange"
                isLoading={isLoading}
                subtitle={`${blockedTasks} blocked`}
                onClick={() => navigate("/tasks")}
              />
              <StatsCard
                title="Completed"
                value={isLoading ? "..." : completedTasks}
                icon={FiCheckCircle}
                colorScheme="green"
                isLoading={isLoading}
                subtitle={`${completedThisWeek} this week`}
                change={completionRate}
                changeType="increase"
                onClick={() => navigate("/tasks")}
              />
              <StatsCard
                title="Productivity"
                value={isLoading ? "..." : `${productivityScore}%`}
                icon={FiTrendingUp}
                colorScheme="purple"
                isLoading={isLoading}
                subtitle={
                  overdueTasks > 0 ? `${overdueTasks} overdue` : "All on track"
                }
                onClick={() => navigate("/tasks")}
              />
            </SimpleGrid>
          </MotionBox>

          {/* Charts Section */}
          <MotionBox variants={itemVariants}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
              <Skeleton isLoaded={!isLoading}>
                <TaskStatusPieChart tasks={allTasks} />
              </Skeleton>
              <Skeleton isLoaded={!isLoading}>
                <TaskCompletionTrend tasks={allTasks} />
              </Skeleton>
              <Skeleton isLoaded={!isLoading}>
                <PriorityBarChart tasks={allTasks} />
              </Skeleton>
              <Skeleton isLoaded={!isLoading}>
                <TeamPerformanceRadar tasks={allTasks} />
              </Skeleton>
            </SimpleGrid>
          </MotionBox>

          {/* Main Content Grid */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
            {/* Projects Overview */}
            <MotionBox variants={itemVariants} gridColumn={{ lg: "span 2" }}>
              <Card bg={cardBg} shadow="md" borderRadius="xl">
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <HStack spacing={2}>
                      <Icon as={FiBriefcase} color="blue.500" />
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color={textColor}
                      >
                        Projects Overview
                      </Text>
                      <Badge colorScheme="blue" variant="subtle">
                        {projects.length}
                      </Badge>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      rightIcon={<Icon as={FiArrowRight} />}
                      onClick={() => navigate("/projects")}
                    >
                      View All
                    </Button>
                  </Flex>

                  <VStack align="stretch" spacing={3}>
                    {isLoading ? (
                      <>
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                      </>
                    ) : projects.length > 0 ? (
                      projects.slice(0, 5).map((project) => {
                        const projectTasks = allTasks.filter(
                          (t) => t.project_id === project.id
                        );
                        const completed = projectTasks.filter(
                          (t) => t.status === TaskStatus.DONE
                        ).length;
                        const progress =
                          projectTasks.length > 0
                            ? Math.round(
                                (completed / projectTasks.length) * 100
                              )
                            : 0;

                        return (
                          <Box
                            key={project.id}
                            p={3}
                            borderRadius="lg"
                            border="1px"
                            borderColor={borderColor}
                            _hover={{ bg: hoverBg }}
                            cursor="pointer"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            transition="all 0.2s"
                          >
                            <Flex justify="space-between" align="center" mb={2}>
                              <HStack spacing={3}>
                                <Box
                                  w={3}
                                  h={3}
                                  bg={project.color}
                                  borderRadius="full"
                                />
                                <Text fontWeight="medium" color={textColor}>
                                  {project.name}
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color={textMuted}>
                                {completed}/{projectTasks.length} tasks
                              </Text>
                            </Flex>
                            <Progress
                              value={progress}
                              size="sm"
                              colorScheme="blue"
                              borderRadius="full"
                            />
                          </Box>
                        );
                      })
                    ) : (
                      <Text color={textMuted} textAlign="center" py={4}>
                        No projects yet
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </MotionBox>

            {/* Recent Activity */}
            <MotionBox variants={itemVariants}>
              <Card bg={cardBg} shadow="md" borderRadius="xl">
                <CardBody>
                  <Flex justify="space-between" align="center" mb={4}>
                    <HStack spacing={2}>
                      <Icon as={FiActivity} color="purple.500" />
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color={textColor}
                      >
                        Recent Activity
                      </Text>
                    </HStack>
                    {activities.length > 0 && (
                      <IconButton
                        aria-label="Clear activities"
                        icon={<Icon as={FiTrash2} />}
                        size="sm"
                        variant="ghost"
                        color="red.500"
                        onClick={handleClearActivities}
                      />
                    )}
                  </Flex>

                  <Box maxH="400px" overflowY="auto">
                    <VStack align="stretch" spacing={3}>
                      {activitiesLoading ? (
                        <>
                          <SkeletonText noOfLines={2} />
                          <SkeletonText noOfLines={2} />
                          <SkeletonText noOfLines={2} />
                        </>
                      ) : activities.length > 0 ? (
                        activities.slice(0, 15).map((activity) => (
                          <HStack
                            key={activity.id}
                            spacing={3}
                            align="flex-start"
                          >
                            {getActivityIcon(activity)}
                            <Box flex={1}>
                              <Text fontSize="sm" color={textColor}>
                                {activity.description}
                              </Text>
                              <Text fontSize="xs" color={textMuted}>
                                {formatDistanceToNow(
                                  new Date(activity.created_at),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </Text>
                            </Box>
                          </HStack>
                        ))
                      ) : (
                        <Text color={textMuted} textAlign="center" py={4}>
                          No recent activity
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </CardBody>
              </Card>
            </MotionBox>

            {/* Upcoming Deadlines */}
            {upcomingTasks.length > 0 && (
              <MotionBox variants={itemVariants} gridColumn={{ lg: "span 2" }}>
                <Card bg={cardBg} shadow="md" borderRadius="xl">
                  <CardBody>
                    <HStack spacing={2} mb={4}>
                      <Icon as={FiCalendar} color="orange.500" />
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color={textColor}
                      >
                        Upcoming Deadlines
                      </Text>
                    </HStack>

                    <VStack align="stretch" spacing={3}>
                      {upcomingTasks.map((task) => (
                        <HStack
                          key={task.id}
                          p={3}
                          borderRadius="lg"
                          border="1px"
                          borderColor={borderColor}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                          onClick={() => navigate("/tasks")}
                        >
                          <Badge colorScheme="orange" variant="subtle">
                            {format(new Date(task.due_date!), "MMM dd")}
                          </Badge>
                          <Text fontSize="sm" color={textColor} noOfLines={1}>
                            {task.title}
                          </Text>
                          {task.project && (
                            <Badge
                              colorScheme="purple"
                              variant="subtle"
                              ml="auto"
                            >
                              {task.project.name}
                            </Badge>
                          )}
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            )}

            {/* High Priority Tasks */}
            {highPriorityTasks.length > 0 && (
              <MotionBox variants={itemVariants}>
                <Card bg={cardBg} shadow="md" borderRadius="xl">
                  <CardBody>
                    <HStack spacing={2} mb={4}>
                      <Icon as={FiAlertCircle} color="red.500" />
                      <Text
                        fontSize="lg"
                        fontWeight="semibold"
                        color={textColor}
                      >
                        High Priority
                      </Text>
                    </HStack>

                    <VStack align="stretch" spacing={3}>
                      {highPriorityTasks.map((task) => (
                        <HStack
                          key={task.id}
                          p={3}
                          borderRadius="lg"
                          border="1px"
                          borderColor={borderColor}
                          _hover={{ bg: hoverBg }}
                          cursor="pointer"
                          onClick={() => navigate("/tasks")}
                        >
                          <Badge
                            colorScheme={
                              task.priority === TaskPriority.CRITICAL
                                ? "red"
                                : task.priority === TaskPriority.URGENT
                                ? "orange"
                                : "yellow"
                            }
                            variant="solid"
                          >
                            {task.priority}
                          </Badge>
                          <Text fontSize="sm" color={textColor} noOfLines={1}>
                            {task.title}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            )}
          </SimpleGrid>
        </MotionBox>
      </Box>
    </Box>
  );
}
