import {
  Box,
  Heading,
  VStack,
  Text,
  SimpleGrid,
  HStack,
  Button,
  Icon,
  Spinner,
  Badge,
  useDisclosure,
  useColorModeValue,
  Flex,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Checkbox,
  useToast,
} from "@chakra-ui/react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiFilter,
  FiCalendar,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { TaskService } from "../services/taskService";
import { type Task, TaskStatus, TaskPriority } from "../types/task";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { CalendarDateModal } from "../components/calendar/CalendarDateModal";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addDays,
  subDays,
  parseISO,
  startOfDay,
} from "date-fns";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilters, setStatusFilters] = useState<Set<TaskStatus>>(
    new Set(Object.values(TaskStatus))
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDateModalOpen,
    onOpen: onDateModalOpen,
    onClose: onDateModalClose,
  } = useDisclosure();
  const toast = useToast();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get all days in the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty days at the start to align with Sunday
  const startDay = monthStart.getDay();
  const emptyDays = Array.from({ length: startDay }, (_, i) => null);
  const allDays = [...emptyDays, ...daysInMonth];

  useEffect(() => {
    fetchTasks();
  }, [currentDate]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);

      // Fetch ALL tasks - use max allowed limit
      const response = await TaskService.getTasks({
        per_page: 100, // Maximum allowed by backend API
      });

      console.log("Calendar: Total tasks fetched:", response.tasks.length);
      
      // Log tasks with dates for debugging
      const tasksWithDates = response.tasks.filter(t => t.due_date || t.start_date);
      console.log("Calendar: Tasks with dates:", tasksWithDates.length);
      
      if (tasksWithDates.length > 0) {
        console.log("Sample task with date:", {
          id: tasksWithDates[0].id,
          title: tasksWithDates[0].title,
          due_date: tasksWithDates[0].due_date,
          start_date: tasksWithDates[0].start_date,
        });
      }

      setTasks(response.tasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateModalOpen();
  };

  const handleCreateTaskFromDate = () => {
    onDateModalClose();
    onOpen();
  };

  const handleViewTask = (task: Task) => {
    // You can implement task detail view here
    console.log("View task:", task);
    onDateModalClose();
  };

  const handleTaskCreated = () => {
    fetchTasks();
    onClose();
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      // Filter by status first
      if (!statusFilters.has(task.status || TaskStatus.TODO)) {
        return false;
      }

      // Helper to safely parse and compare dates
      const isDateMatch = (taskDateStr: string | undefined, targetDate: Date) => {
        if (!taskDateStr) return false;
        try {
          // Handle both date-only (YYYY-MM-DD) and datetime formats
          let taskDate: Date;
          if (taskDateStr.includes('T')) {
            // Full datetime format
            taskDate = parseISO(taskDateStr);
          } else {
            // Date-only format - treat as start of day
            taskDate = parseISO(taskDateStr + 'T00:00:00');
          }
          
          // Compare only the date part, ignoring time
          return isSameDay(taskDate, targetDate);
        } catch (e) {
          console.error('Date parse error for task', task.id, ':', taskDateStr, e);
          return false;
        }
      };

      // Check due_date first
      if (isDateMatch(task.due_date, date)) {
        return true;
      }
      
      // Check start_date if no due_date
      if (!task.due_date && isDateMatch(task.start_date, date)) {
        return true;
      }
      
      // Don't show tasks without dates on calendar
      return false;
    });
  };

  // Get all tasks for the current month for better visibility
  const getTasksForCurrentMonth = () => {
    return tasks.filter((task) => {
      // Filter by status first
      if (!statusFilters.has(task.status || TaskStatus.TODO)) {
        return false;
      }

      const taskDate = task.due_date || task.start_date || task.created_at;
      if (!taskDate) return false;

      const date = new Date(taskDate);
      return (
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const toggleStatusFilter = (status: TaskStatus) => {
    const newFilters = new Set(statusFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setStatusFilters(newFilters);
  };

  const getStatusLabel = (status: TaskStatus) => {
    const labels = {
      [TaskStatus.TODO]: "To Do",
      [TaskStatus.IN_PROGRESS]: "In Progress",
      [TaskStatus.DONE]: "Completed",
      [TaskStatus.BLOCKED]: "Blocked",
      [TaskStatus.IN_REVIEW]: "In Review",
      [TaskStatus.BACKLOG]: "Backlog",
      [TaskStatus.CANCELLED]: "Cancelled",
    };
    return labels[status] || status;
  };

  const getTaskColor = (task: Task) => {
    if (task.priority === "high" || task.priority === "critical") return "red";
    if (task.priority === "medium") return "blue";
    if (task.priority === "low") return "green";
    return "gray";
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };


  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  const monthlyTasks = getTasksForCurrentMonth();

  return (
    <Box h="full" bg={bgColor} p={6}>
      <VStack align="stretch" spacing={6}>
        {/* Modern Header */}
        <Flex justify="space-between" align="center">
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg" color={textColor} fontWeight="bold">
              Calendar
            </Heading>
            <Text fontSize="sm" color={mutedTextColor}>
              {monthlyTasks.length} tasks this month
            </Text>
          </VStack>

          <HStack spacing={4}>
            {/* Status Filter */}
            <Menu closeOnSelect={false}>
              <MenuButton
                as={Button}
                variant="outline"
                leftIcon={<Icon as={FiFilter} boxSize={4} />}
                size="sm"
                borderRadius="lg"
                borderColor={borderColor}
                _hover={{
                  borderColor: "primary.300",
                  bg: useColorModeValue("primary.50", "primary.900"),
                }}
              >
                Filter ({statusFilters.size})
              </MenuButton>
              <MenuList
                bg={cardBg}
                borderColor={borderColor}
                shadow="xl"
                borderRadius="xl"
              >
                {Object.values(TaskStatus).map((status) => (
                  <MenuItem
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                  >
                    <Checkbox
                      isChecked={statusFilters.has(status)}
                      onChange={() => toggleStatusFilter(status)}
                      colorScheme="primary"
                      mr={3}
                    >
                      {getStatusLabel(status)}
                    </Checkbox>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {/* Month Navigation */}
            <HStack spacing={1}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
                borderRadius="lg"
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
              >
                <Icon as={FiChevronLeft} />
              </Button>
              <Text
                fontSize="lg"
                fontWeight="bold"
                minW="140px"
                textAlign="center"
                color={textColor}
              >
                {format(currentDate, "MMMM yyyy")}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
                borderRadius="lg"
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
              >
                <Icon as={FiChevronRight} />
              </Button>
            </HStack>

            <Button
              colorScheme="primary"
              leftIcon={<Icon as={FiPlus} boxSize={4} />}
              onClick={() => {
                setSelectedDate(new Date());
                onOpen();
              }}
              borderRadius="xl"
              fontWeight="semibold"
              shadow="sm"
              _hover={{
                transform: "translateY(-1px)",
                shadow: "md",
              }}
              transition="all 0.2s"
            >
              New Task
            </Button>
          </HStack>
        </Flex>

        {/* Modern Calendar Grid */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          shadow="sm"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          {/* Days header */}
          <SimpleGrid
            columns={7}
            spacing={0}
            bg={useColorModeValue("gray.50", "dark.bg.secondary")}
          >
            {days.map((day) => (
              <Box
                key={day}
                p={4}
                textAlign="center"
                fontSize="sm"
                fontWeight="bold"
                color={mutedTextColor}
                borderRight="1px"
                borderColor={borderColor}
                _last={{ borderRight: "none" }}
              >
                {day}
              </Box>
            ))}
          </SimpleGrid>

          {/* Calendar dates */}
          <SimpleGrid columns={7} spacing={0}>
            {isLoading ? (
              <Box gridColumn="span 7" p={12} textAlign="center">
                <Spinner size="lg" color="primary.500" thickness="3px" />
                <Text mt={4} color={mutedTextColor}>
                  Loading tasks...
                </Text>
              </Box>
            ) : (
              allDays.map((date, index) => {
                if (!date) {
                  return (
                    <Box
                      key={index}
                      h="140px"
                      border="1px"
                      borderColor={borderColor}
                      bg={useColorModeValue("gray.25", "dark.bg.primary")}
                    />
                  );
                }

                const dayTasks = getTasksForDate(date);
                const isCurrentDay = isToday(date);

                return (
                  <Box
                    key={index}
                    h="140px"
                    p={3}
                    border="1px"
                    borderColor={borderColor}
                    cursor="pointer"
                    _hover={{
                      bg: useColorModeValue("primary.50", "primary.900"),
                      borderColor: "primary.300",
                    }}
                    position="relative"
                    bg={
                      isCurrentDay
                        ? useColorModeValue("primary.50", "primary.900")
                        : cardBg
                    }
                    onClick={() => handleDateClick(date)}
                    transition="all 0.2s"
                  >
                    {/* Date number */}
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text
                        fontSize="sm"
                        fontWeight={isCurrentDay ? "bold" : "semibold"}
                        color={isCurrentDay ? "primary.600" : textColor}
                      >
                        {format(date, "d")}
                      </Text>
                      {dayTasks.length > 0 && (
                        <Badge
                          colorScheme="primary"
                          variant="subtle"
                          fontSize="xs"
                          borderRadius="full"
                          px={2}
                        >
                          {dayTasks.length}
                        </Badge>
                      )}
                    </Flex>

                    {/* Display tasks for this date */}
                    <VStack
                      spacing={1}
                      align="stretch"
                      h="calc(100% - 32px)"
                      overflow="hidden"
                    >
                      {dayTasks.slice(0, 3).map((task, taskIndex) => {
                        const taskColor = getTaskColor(task);
                        return (
                          <Tooltip
                            key={taskIndex}
                            label={task.title}
                            placement="top"
                          >
                            <Box
                              p={2}
                              bg={`${taskColor}.100`}
                              borderLeft="3px solid"
                              borderLeftColor={`${taskColor}.500`}
                              borderRadius="md"
                              fontSize="xs"
                              color={`${taskColor}.800`}
                              w="full"
                              _hover={{
                                bg: `${taskColor}.200`,
                                transform: "translateX(2px)",
                              }}
                              transition="all 0.2s"
                              cursor="pointer"
                            >
                              <Text noOfLines={1} fontWeight="medium">
                                {task.title}
                              </Text>
                              {task.priority && (
                                <Text
                                  fontSize="2xs"
                                  color={`${taskColor}.600`}
                                  mt={1}
                                >
                                  {task.priority.toUpperCase()}
                                </Text>
                              )}
                            </Box>
                          </Tooltip>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <Text
                          fontSize="xs"
                          color={mutedTextColor}
                          textAlign="center"
                          fontWeight="medium"
                        >
                          +{dayTasks.length - 3} more
                        </Text>
                      )}
                    </VStack>
                  </Box>
                );
              })
            )}
          </SimpleGrid>
        </Box>
      </VStack>

      {/* Calendar Date Modal */}
      {selectedDate && (
        <CalendarDateModal
          isOpen={isDateModalOpen}
          onClose={onDateModalClose}
          selectedDate={selectedDate}
          tasks={getTasksForDate(selectedDate)}
          onCreateTask={handleCreateTaskFromDate}
          onViewTask={handleViewTask}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isOpen}
        onClose={onClose}
        onTaskCreated={handleTaskCreated}
        initialDueDate={
          selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined
        }
      />
    </Box>
  );
}
