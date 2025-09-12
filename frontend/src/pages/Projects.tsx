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
  CardBody,
  Badge,
  Spinner,
  IconButton,
  Progress,
  Flex,
  useColorModeValue,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  AvatarGroup,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  FiPlus,
  FiUsers,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiClock,
  FiCheckCircle,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  ProjectService,
  type ProjectListResponse,
} from "../services/projectService";
import { ProjectMemberService } from "../services/projectMemberService";
import { MembersDrawer } from "../components/projects/MembersDrawer";
import { ProjectModal } from "../components/projects/ProjectModal";
import { TaskService } from "../services/taskService";

export function Projects() {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const progressBg = useColorModeValue("gray.100", "gray.700");
  const tableBg = useColorModeValue("white", "dark.bg.tertiary");
  const hoverBg = useColorModeValue("gray.50", "dark.bg.hover");

  const [projects, setProjects] = useState<ProjectListResponse["projects"]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [taskCounts, setTaskCounts] = useState<
    Record<string, { total: number; completed: number }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
    description: string;
    status: string;
    color: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    (async () => {
      try {
        const res = await ProjectService.list();
        // Remove duplicates first
        const uniqueProjects = res.projects.filter(
          (project, index, self) =>
            index === self.findIndex((p) => p.id === project.id)
        );
        setProjects(uniqueProjects);

        // Fetch member counts and task stats per project
        const memberEntries: [string, number][] = [];
        const taskEntries: [string, { total: number; completed: number }][] =
          [];

        for (const p of uniqueProjects) {
          // Get member count
          try {
            const m = await ProjectMemberService.list(p.id);
            memberEntries.push([p.id, m.total]);
          } catch {
            memberEntries.push([p.id, 1]); // At least owner
          }

          // Get task stats
          try {
            const stats = await TaskService.getTaskStats(p.id);
            taskEntries.push([
              p.id,
              { total: stats.total, completed: stats.completed },
            ]);
          } catch {
            taskEntries.push([p.id, { total: 0, completed: 0 }]);
          }
        }

        setMemberCounts(Object.fromEntries(memberEntries));
        setTaskCounts(Object.fromEntries(taskEntries));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await ProjectService.list();
      setProjects(res.projects);

      // Reload member counts and task stats
      const memberEntries: [string, number][] = [];
      const taskEntries: [string, { total: number; completed: number }][] = [];

      for (const p of res.projects) {
        try {
          const m = await ProjectMemberService.list(p.id);
          memberEntries.push([p.id, m.total]);
        } catch {
          memberEntries.push([p.id, 1]);
        }

        try {
          const stats = await TaskService.getTaskStats(p.id);
          taskEntries.push([
            p.id,
            { total: stats.total, completed: stats.completed },
          ]);
        } catch {
          taskEntries.push([p.id, { total: 0, completed: 0 }]);
        }
      }

      setMemberCounts(Object.fromEntries(memberEntries));
      setTaskCounts(Object.fromEntries(taskEntries));
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleProjectSuccess = () => {
    loadProjects();
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "green",
      planning: "blue",
      on_hold: "orange",
      completed: "gray",
      archived: "red",
    };
    return colors[status] || "gray";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      active: FiCheckCircle,
      planning: FiClock,
      on_hold: FiClock,
      completed: FiCheckCircle,
      archived: FiFolder,
    };
    return icons[status] || FiFolder;
  };

  if (isLoading) {
    return (
      <Box h="full" p={8}>
        <VStack align="center" justify="center" h="full">
          <Spinner size="lg" color="primary.500" thickness="3px" />
          <Text color={textMuted} fontSize="sm">
            Loading projects...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      <Box
        h="full"
        p={8}
        bg="white"
        _dark={{ bg: "black", color: "gray.100" }}
        color="gray.800"
        boxShadow={{ base: "sm", _dark: "md" }}
      >
        <VStack align="stretch" spacing={8}>
          {/* Header */}
          <Box>
            <Flex justify="space-between" align="center" mb={2} wrap="wrap" gap={3}>
              <Box>
                <Heading size="lg">Projects</Heading>
                <Text color={textMuted} fontSize="sm" mt={1}>
                  Manage and track your projects
                </Text>
              </Box>
              <HStack spacing={3}>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <IconButton
                    aria-label="List view"
                    icon={<FiList />}
                    onClick={() => setViewMode('list')}
                    bg={viewMode === 'list' ? useColorModeValue('primary.50', 'primary.900') : 'transparent'}
                    borderColor={viewMode === 'list' ? 'primary.500' : borderColor}
                  />
                  <IconButton
                    aria-label="Grid view"
                    icon={<FiGrid />}
                    onClick={() => setViewMode('grid')}
                    bg={viewMode === 'grid' ? useColorModeValue('primary.50', 'primary.900') : 'transparent'}
                    borderColor={viewMode === 'grid' ? 'primary.500' : borderColor}
                  />
                </ButtonGroup>
                <Button
                  colorScheme="primary"
                  leftIcon={<FiPlus />}
                  onClick={handleNewProject}
                  size="md"
                  borderRadius="lg"
                >
                  New Project
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Projects Display */}
          {viewMode === 'grid' ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5}>
            {projects.map((project) => {
              const tasks = taskCounts[project.id] || {
                total: 0,
                completed: 0,
              };
              const progress =
                tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;

              return (
                <Card
                  key={project.id}
                  // bg={cardBg}
                  borderRadius="xl"
                  border="none"
                  // boxShadow="sm"
                  overflow="hidden"
                  position="relative"
                  transition="all 0.2s"
                  _hover={{
                    transform: "translateY(-4px)",
                    boxShadow: "lg",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {/* Color bar at top */}
                  {/* <Box h="4px" bg={project.color} /> */}

                  <CardBody p={5}>
                    <VStack align="stretch" spacing={4}>
                      {/* Header with title and menu */}
                      <Flex justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex={1}>
                          <Text
                            fontSize="lg"
                            fontWeight="semibold"
                            noOfLines={1}
                          >
                            {project.name}
                          </Text>
                          <Text
                            fontSize="xs"
                            color={textMuted}
                            noOfLines={2}
                            minH="2rem"
                          >
                            {project.description}
                          </Text>
                        </VStack>

                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <MenuList>
                            <MenuItem
                              icon={<FiEdit2 />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProject(project);
                              }}
                            >
                              Edit Project
                            </MenuItem>
                            <MenuItem
                              icon={<FiUsers />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProjectForMembers({
                                  id: project.id,
                                  name: project.name,
                                });
                              }}
                            >
                              Manage Members
                            </MenuItem>
                            <MenuItem
                              icon={<FiTrash2 />}
                              color="red.500"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Add delete functionality
                              }}
                            >
                              Delete Project
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Flex>

                      {/* Status Badge */}
                      <Badge
                        colorScheme={getStatusColor(project.status)}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="md"
                        alignSelf="start"
                      >
                        <HStack spacing={1}>
                          <Icon
                            as={getStatusIcon(project.status)}
                            boxSize={3}
                          />
                          <Text>
                            {project.status.replace("_", " ").toUpperCase()}
                          </Text>
                        </HStack>
                      </Badge>

                      {/* Task Progress */}
                      <Box>
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="xs" color={textMuted}>
                            Tasks
                          </Text>
                          <Text fontSize="xs" fontWeight="medium">
                            {tasks.completed}/{tasks.total}
                          </Text>
                        </HStack>
                        <Progress
                          value={progress}
                          size="xs"
                          borderRadius="full"
                          bg={progressBg}
                          sx={{
                            "& > div": {
                              background: project.color,
                            },
                          }}
                        />
                      </Box>

                      {/* Footer with members */}
                      <HStack
                        justify="space-between"
                        pt={2}
                        borderTop="1px"
                        borderColor={borderColor}
                      >
                        <HStack spacing={1} fontSize="xs" color={textMuted}>
                          <Icon as={FiUsers} boxSize={3} />
                          <Text>
                            {memberCounts[project.id] ?? 1} member
                            {memberCounts[project.id] !== 1 ? "s" : ""}
                          </Text>
                        </HStack>

                        <Tooltip label="View Project" placement="top">
                          <IconButton
                            aria-label="View project"
                            icon={<FiFolder />}
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${project.id}`);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}

              {/* Empty state card for adding new project */}
              <Card
                bg={useColorModeValue("gray.50", "gray.800")}
                borderRadius="xl"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={borderColor}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  borderColor: "primary.500",
                  transform: "translateY(-4px)",
                }}
                onClick={handleNewProject}
              >
                <CardBody p={5}>
                  <VStack justify="center" h="full" minH="200px" spacing={3}>
                    <Icon as={FiPlus} boxSize={8} color={textMuted} />
                    <Text color={textMuted} fontSize="sm" fontWeight="medium">
                      Create New Project
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          ) : (
            <Box borderWidth="1px" borderRadius="xl" borderColor={borderColor} overflow="hidden" bg={tableBg}>
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'dark.bg.secondary')}>
                  <Tr>
                    <Th>Project Name</Th>
                    <Th>Status</Th>
                    <Th isNumeric>Tasks</Th>
                    <Th isNumeric>Progress</Th>
                    <Th>Members</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {projects.map((project) => {
                    const tasks = taskCounts[project.id] || { total: 0, completed: 0 };
                    const progress = tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;
                    
                    return (
                      <Tr
                        key={project.id}
                        _hover={{ bg: hoverBg, cursor: 'pointer' }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <Td>
                          <HStack spacing={3}>
                            <Box w={3} h={3} bg={project.color} borderRadius="full" />
                            <Box>
                              <Text fontWeight="medium">{project.name}</Text>
                              <Text fontSize="sm" color={textMuted} noOfLines={1}>
                                {project.description}
                              </Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getStatusColor(project.status)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {project.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          <Text fontSize="sm">
                            {tasks.completed}/{tasks.total}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <HStack spacing={2}>
                            <Progress
                              value={progress}
                              size="sm"
                              borderRadius="full"
                              w="60px"
                              bg={progressBg}
                              sx={{
                                "& > div": {
                                  background: project.color,
                                },
                              }}
                            />
                            <Text fontSize="sm" color={textMuted}>
                              {Math.round(progress)}%
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <Icon as={FiUsers} boxSize={3} color={textMuted} />
                            <Text fontSize="sm">
                              {memberCounts[project.id] ?? 1}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <MenuList>
                              <MenuItem
                                icon={<FiEdit2 />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProject(project);
                                }}
                              >
                                Edit Project
                              </MenuItem>
                              <MenuItem
                                icon={<FiUsers />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProjectForMembers({
                                    id: project.id,
                                    name: project.name,
                                  });
                                }}
                              >
                                Manage Members
                              </MenuItem>
                              <MenuItem
                                icon={<FiTrash2 />}
                                color="red.500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Add delete functionality
                                }}
                              >
                                Delete Project
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
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

      {/* Project Modal */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={handleProjectSuccess}
        project={editingProject}
      />
    </>
  );
}
