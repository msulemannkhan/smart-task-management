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
} from "@chakra-ui/react";
import {
  FiSearch,
  FiPlus,
  FiChevronDown,
  FiFilter,
  FiGrid,
  FiList,
  FiRefreshCw,
} from "react-icons/fi";
import { KanbanBoardSimple } from "../components/tasks/KanbanBoardSimple";
import { TaskListSimple } from "../components/tasks/TaskListSimple";
import { useEffect, useState } from "react";
import { ProjectService, type Project } from "../services/projectService";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { useTaskRefresh } from "../context/TaskRefreshContext";
import { TaskDetailPanel } from "../components/layout/TaskDetailPanel";

export function Tasks() {
  const [selectedView, setSelectedView] = useState<"Board" | "List">("Board");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
    undefined
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshTrigger, triggerRefresh } = useTaskRefresh();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Theme colors
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

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

          <Menu>
            <MenuButton
              as={Button}
              variant="outline"
              leftIcon={<Icon as={FiFilter} />}
              size="sm"
            >
              Filter
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setStatusFilter(undefined)}>
                All statuses
              </MenuItem>
              <MenuItem onClick={() => setStatusFilter("todo")}>
                To Do
              </MenuItem>
              <MenuItem onClick={() => setStatusFilter("in_progress")}>
                In Progress
              </MenuItem>
              <MenuItem onClick={() => setStatusFilter("done")}>
                Done
              </MenuItem>
            </MenuList>
          </Menu>

          {/* View switcher */}
          <HStack spacing={1}>
            <IconButton
              aria-label="Board view"
              icon={<Icon as={FiGrid} />}
              variant={selectedView === "Board" ? "solid" : "ghost"}
              colorScheme={selectedView === "Board" ? "primary" : "gray"}
              size="sm"
              onClick={() => setSelectedView("Board")}
            />
            <IconButton
              aria-label="List view"
              icon={<Icon as={FiList} />}
              variant={selectedView === "List" ? "solid" : "ghost"}
              colorScheme={selectedView === "List" ? "primary" : "gray"}
              size="sm"
              onClick={() => setSelectedView("List")}
            />
          </HStack>
        </HStack>
      </Box>

      {/* Main Content Area */}
      <Box flex={1} overflow="hidden">
        {selectedView === "Board" ? (
          <KanbanBoardSimple
            refreshTrigger={refreshTrigger}
            projectId={activeProjectId}
            searchQuery={searchQuery}
            statusFilter={statusFilter as any}
          />
        ) : (
          <TaskListSimple
            refreshTrigger={refreshTrigger}
            projectId={activeProjectId}
            searchQuery={searchQuery}
            statusFilter={(statusFilter as any) || "ALL"}
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
