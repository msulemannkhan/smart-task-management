import {
  Box,
  Text,
  Input,
  Button,
  HStack,
  Icon,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  Tab,
  TabList,
  useDisclosure,
  useColorModeValue,
  VStack,
  Heading,
  Badge,
  Flex,
  IconButton,
  Tooltip,
  Checkbox,
  MenuDivider,
  MenuGroup,
  MenuItemOption,
  MenuOptionGroup,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiPlus,
  FiChevronDown,
  FiFilter,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiLayout,
  FiCheck,
  FiArrowDown,
} from "react-icons/fi";
import { TaskListSimple } from "../components/tasks/TaskListSimple";
import { TaskGridView } from "../components/tasks/TaskGridView";
import { useEffect, useState } from "react";
import { ProjectService, type Project } from "../services/projectService";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { useTaskRefresh } from "../context/TaskRefreshContext";
import { TaskDetailPanel } from "../components/layout/TaskDetailPanel";
import { TaskStatus } from "../types/task";
import { type SortOption, getSortLabel } from "../utils/taskSort";
import { useLocation } from "react-router-dom";

export function Tasks() {
  const [selectedView, setSelectedView] = useState<"List" | "Grid">("Grid");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
    undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
  ]);
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshTrigger, triggerRefresh } = useTaskRefresh();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();

  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  // Load saved sort preference
  useEffect(() => {
    const savedSort = localStorage.getItem('taskSortPreference');
    if (savedSort) {
      setSortBy(savedSort as SortOption);
    }
  }, []);

  // Save sort preference
  useEffect(() => {
    localStorage.setItem('taskSortPreference', sortBy);
  }, [sortBy]);

  // Load accessible projects from API
  useEffect(() => {
    (async () => {
      try {
        const res = await ProjectService.list();
        // Remove duplicates
        const uniqueProjects = res.projects.filter(
          (project, index, self) =>
            index === self.findIndex((p) => p.id === project.id)
        );
        setProjects(uniqueProjects);
        // Default to "All Projects" (undefined) instead of first project
        // User can select a specific project if they want
      } catch (e) {
        console.error("Failed to load projects:", e);
        // Ignore for now; UI will still work without explicit project selection
      }
    })();
  }, []);

  // Handle URL parameters for status and project filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Handle project filter
    const projectParam = params.get('project');
    if (projectParam) {
      setActiveProjectId(projectParam);
    }

    // Handle status filter
    const statusParam = params.get('status');
    if (statusParam) {
      // Map URL params to TaskStatus
      const statusMap: Record<string, TaskStatus> = {
        'todo': TaskStatus.TODO,
        'in_progress': TaskStatus.IN_PROGRESS,
        'done': TaskStatus.DONE,
        'blocked': TaskStatus.BLOCKED,
        'in_review': TaskStatus.IN_REVIEW,
        'backlog': TaskStatus.BACKLOG,
        'cancelled': TaskStatus.CANCELLED,
      };

      const mappedStatus = statusMap[statusParam];
      if (mappedStatus) {
        setSelectedStatuses([mappedStatus]);
      }
    }
  }, [location.search]);

  const handleTaskCreated = () => {
    // Trigger refresh of the kanban board
    triggerRefresh();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getProjectColor = (projectId: string | undefined) => {
    if (!projectId) return "blue";
    const project = projects.find((p) => p.id === projectId);
    return project?.color || "blue";
  };

  // Status options for filter
  const statusOptions = [
    { value: TaskStatus.BACKLOG, label: "Backlog", color: "gray" },
    { value: TaskStatus.TODO, label: "To Do", color: "blue" },
    { value: TaskStatus.IN_PROGRESS, label: "In Progress", color: "yellow" },
    { value: TaskStatus.IN_REVIEW, label: "In Review", color: "purple" },
    { value: TaskStatus.BLOCKED, label: "Blocked", color: "red" },
    { value: TaskStatus.DONE, label: "Completed", color: "green" },
    { value: TaskStatus.CANCELLED, label: "Cancelled", color: "gray" },
  ];

  const handleStatusToggle = (status: TaskStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  };

  const handleSelectAllStatuses = () => {
    setSelectedStatuses(statusOptions.map(opt => opt.value));
  };

  const handleClearStatuses = () => {
    setSelectedStatuses([TaskStatus.TODO, TaskStatus.IN_PROGRESS]);
  };

  // Streamlined views retained only for future extension

  return (
    <Box h="full" bg={bgColor} display="flex" flexDirection="column">
      {/* Simplified Header */}
      <Box
        bg={cardBg}
        borderBottom="1px"
        borderBottomColor={borderColor}
        px={{ base: 4, md: 6 }}
        py={{ base: 3, md: 4 }}
      >
        {/* Single row header */}
        <Flex justify="space-between" align="center" mb={3}>
          {/* Project selector with integrated title */}
          <HStack spacing={3}>
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                rightIcon={<Icon as={FiChevronDown} />}
                fontSize={{ base: "lg", md: "xl" }}
                fontWeight="bold"
                color={textColor}
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                px={2}
              >
                <HStack spacing={2}>
                  <Box
                    w={3}
                    h={3}
                    bg={`${getProjectColor(activeProjectId)}.500`}
                    borderRadius="full"
                  />
                  <Text>
                    {activeProjectId
                      ? projects.find((p) => p.id === activeProjectId)?.name ||
                        "Project"
                      : "All Tasks"}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={() => setActiveProjectId(undefined)}
                >
                  <HStack spacing={3}>
                    <Box w={3} h={3} bg="gray.400" borderRadius="full" />
                    <Text>All Tasks</Text>
                  </HStack>
                </MenuItem>
                {projects.map((p) => (
                  <MenuItem
                    key={p.id}
                    onClick={() => setActiveProjectId(p.id)}
                  >
                    <HStack spacing={3}>
                      <Box w={3} h={3} bg={p.color} borderRadius="full" />
                      <Text>{p.name}</Text>
                    </HStack>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </HStack>

          {/* Right side - Actions */}
          <HStack spacing={2}>
            <IconButton
              aria-label="Refresh"
              icon={<Icon as={FiRefreshCw} />}
              variant="ghost"
              size="sm"
              isLoading={isRefreshing}
              onClick={handleRefresh}
            />
            <Button
              colorScheme="primary"
              leftIcon={<Icon as={FiPlus} />}
              onClick={onOpen}
              size="sm"
            >
              New Task
            </Button>
          </HStack>
        </Flex>

        {/* Compact search and controls row */}
        <HStack spacing={3}>
          <InputGroup flex={1} maxW="400px">
            <InputLeftElement>
              <Icon as={FiSearch} color={mutedTextColor} />
            </InputLeftElement>
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              borderRadius="md"
            />
          </InputGroup>

          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              variant="outline"
              leftIcon={<Icon as={FiFilter} />}
              size="sm"
            >
              Filter ({selectedStatuses.length})
            </MenuButton>
            <MenuList minWidth="240px">
              <MenuGroup title="Status Filter">
                <HStack px={3} py={2} justify="space-between">
                  <Button size="xs" variant="link" onClick={handleSelectAllStatuses}>
                    Select All
                  </Button>
                  <Button size="xs" variant="link" onClick={handleClearStatuses}>
                    Clear
                  </Button>
                </HStack>
                <MenuDivider />
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} closeOnSelect={false}>
                    <HStack w="full" justify="space-between">
                      <HStack flex={1} onClick={() => handleStatusToggle(option.value)} cursor="pointer">
                        <Box w={2} h={2} bg={`${option.color}.400`} borderRadius="full" />
                        <Text fontSize="sm">{option.label}</Text>
                      </HStack>
                      <Checkbox
                        isChecked={selectedStatuses.includes(option.value)}
                        onChange={() => handleStatusToggle(option.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </HStack>
                  </MenuItem>
                ))}
              </MenuGroup>
            </MenuList>
          </Menu>

          {/* Sort dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              variant="outline"
              leftIcon={<Icon as={FiArrowDown} />}
              size="sm"
            >
              {getSortLabel(sortBy)}
            </MenuButton>
            <MenuList>
              <MenuGroup title="Sort by">
                <MenuItem onClick={() => setSortBy('created_desc')}>
                  <HStack justify="space-between" w="full">
                    <Text>Newest First</Text>
                    {sortBy === 'created_desc' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => setSortBy('created_asc')}>
                  <HStack justify="space-between" w="full">
                    <Text>Oldest First</Text>
                    {sortBy === 'created_asc' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => setSortBy('alpha_asc')}>
                  <HStack justify="space-between" w="full">
                    <Text>A → Z</Text>
                    {sortBy === 'alpha_asc' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => setSortBy('alpha_desc')}>
                  <HStack justify="space-between" w="full">
                    <Text>Z → A</Text>
                    {sortBy === 'alpha_desc' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => setSortBy('priority_high')}>
                  <HStack justify="space-between" w="full">
                    <Text>Priority ↓</Text>
                    {sortBy === 'priority_high' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => setSortBy('priority_low')}>
                  <HStack justify="space-between" w="full">
                    <Text>Priority ↑</Text>
                    {sortBy === 'priority_low' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={() => setSortBy('due_soon')}>
                  <HStack justify="space-between" w="full">
                    <Text>Due Soon</Text>
                    {sortBy === 'due_soon' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => setSortBy('due_late')}>
                  <HStack justify="space-between" w="full">
                    <Text>Due Later</Text>
                    {sortBy === 'due_late' && <Icon as={FiCheck} color="blue.500" />}
                  </HStack>
                </MenuItem>
              </MenuGroup>
            </MenuList>
          </Menu>

          {/* View switcher */}
          <HStack spacing={1}>
            <Tooltip label="Grid view">
              <IconButton
                aria-label="Grid view"
                icon={<Icon as={FiGrid} />}
                variant={selectedView === "Grid" ? "solid" : "ghost"}
                colorScheme={selectedView === "Grid" ? "primary" : "gray"}
                size="sm"
                onClick={() => setSelectedView("Grid")}
              />
            </Tooltip>
            <Tooltip label="List view">
              <IconButton
                aria-label="List view"
                icon={<Icon as={FiList} />}
                variant={selectedView === "List" ? "solid" : "ghost"}
                colorScheme={selectedView === "List" ? "primary" : "gray"}
                size="sm"
                onClick={() => setSelectedView("List")}
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Box>

      {/* Main Content Area */}
      <Box flex={1} overflow="hidden">
        {selectedView === "Grid" ? (
          <TaskGridView
            refreshTrigger={refreshTrigger}
            projectId={activeProjectId}
            searchQuery={searchQuery}
            selectedStatuses={selectedStatuses}
            sortBy={sortBy}
          />
        ) : (
          <TaskListSimple
            refreshTrigger={refreshTrigger}
            projectId={activeProjectId}
            searchQuery={searchQuery}
            statusFilter={(statusFilter as any) || "ALL"}
            sortBy={sortBy}
          />
        )}
      </Box>

      {/* Task Detail Panel */}
      <TaskDetailPanel onTaskUpdate={handleTaskCreated} />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isOpen}
        onClose={onClose}
        onTaskCreated={handleTaskCreated}
        projectId={activeProjectId}
      />
    </Box>
  );
}
