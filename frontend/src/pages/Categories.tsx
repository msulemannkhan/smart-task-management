import { useState, useEffect } from "react";
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
  IconButton,
  useColorModeValue,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Progress,
  ButtonGroup,
  Divider,
} from "@chakra-ui/react";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiTag, 
  FiMoreVertical, 
  FiActivity, 
  FiCheckCircle,
  FiGrid,
  FiList
} from "react-icons/fi";
import { CategoryService } from "../services/categoryService";
import type { CategoryResponse } from "../services/categoryService";
import {
  ProjectService,
  type ProjectListResponse,
} from "../services/projectService";
import { ActivityService, type Activity } from "../services/activityService";
import { CategoryModal } from "../components/categories/CategoryModal";
import useCustomToast from "../hooks/useToast";
import { CategoryCardSkeleton, ListItemSkeleton, GridSkeleton, ListSkeleton } from "../components/ui/SkeletonLoaders";

type ViewMode = 'list' | 'grid';

export function Categories() {
  const toast = useCustomToast();
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list view
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "dark.border.subtle");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");
  const hoverBg = useColorModeValue("gray.50", "dark.bg.hover");

  // Project ID: load first accessible project; fallback to undefined
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    description: string;
    color: string;
  } | null>(null);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryActivities, setCategoryActivities] = useState<
    Record<string, Activity[]>
  >({});

  // Load projects on mount
  useEffect(() => {
    (async () => {
      try {
        const res: ProjectListResponse = await ProjectService.list();
        if (res.projects?.length) {
          setProjectId(res.projects[0].id);
        }
      } catch {}
    })();
  }, []);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('categoriesViewMode') as ViewMode;
    if (savedView) {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('categoriesViewMode', mode);
  };

  // Fetch categories whenever projectId becomes available/changes
  useEffect(() => {
    fetchCategories(projectId);
  }, [projectId]);

  const fetchCategories = async (pid?: string) => {
    setIsLoading(true);
    try {
      // Guard against undefined project id; will fallback to static data
      const response = pid
        ? await CategoryService.getProjectCategories(pid)
        : { categories: [], total: 0 };
      if (response.categories && response.categories.length > 0) {
        setCategories(response.categories);
        // Fetch activities for each category
        await fetchCategoryActivities(response.categories);
      } else {
        // No categories from API - show empty state
        console.log("No categories from API");
        setCategories([]);
        setCategoryActivities({});
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      // Show empty state on error
      setCategories([]);
      setCategoryActivities({});
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryActivities = async (categories: CategoryResponse[]) => {
    const activitiesMap: Record<string, Activity[]> = {};

    for (const category of categories) {
      try {
        const activities = await ActivityService.getCategoryActivities(
          category.id,
          3
        );
        activitiesMap[category.id] = activities.activities;
      } catch (error) {
        console.error(
          `Failed to fetch activities for category ${category.id}:`,
          error
        );
        activitiesMap[category.id] = [];
      }
    }

    setCategoryActivities(activitiesMap);
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setEditingCategory({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
      });
      setCategoryModalOpen(true);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await CategoryService.deleteCategory(categoryId);
        await fetchCategories(projectId);
        toast.success("Category deleted successfully");
      } catch (error) {
        toast.error("Failed to delete category");
      }
    }
  };

  const handleCategorySuccess = () => {
    fetchCategories(projectId);
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const CategoryListItem = ({ category }: { category: CategoryResponse }) => {
    const completionRate = getCompletionPercentage(
      category.completed_tasks || 0,
      category.task_count || 0
    );

    return (
      <Card
        bg={cardBg}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        transition="all 0.2s"
        _hover={{
          bg: hoverBg,
          transform: "translateY(-1px)",
          boxShadow: "md",
        }}
      >
        <CardBody p={4}>
          <HStack spacing={4} align="center">
            {/* Color indicator */}
            <Box
              w={3}
              h={12}
              bg={category.color || "gray.400"}
              borderRadius="full"
            />

            {/* Category info */}
            <VStack align="start" spacing={1} flex={1}>
              <Text fontSize="md" fontWeight="semibold">
                {category.name}
              </Text>
              <Text fontSize="sm" color={textMuted} noOfLines={1}>
                {category.description || "No description"}
              </Text>
            </VStack>

            {/* Stats */}
            <HStack spacing={6} divider={<Divider orientation="vertical" h={8} />}>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold">
                  {category.task_count || 0}
                </Text>
                <Text fontSize="xs" color={textMuted}>
                  Tasks
                </Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color="green.500">
                  {category.completed_tasks || 0}
                </Text>
                <Text fontSize="xs" color={textMuted}>
                  Done
                </Text>
              </VStack>
              <VStack spacing={0}>
                <Text fontSize="lg" fontWeight="bold">
                  {completionRate}%
                </Text>
                <Text fontSize="xs" color={textMuted}>
                  Progress
                </Text>
              </VStack>
            </HStack>

            {/* Progress bar */}
            <Box w="120px">
              <Progress
                value={completionRate}
                size="sm"
                borderRadius="full"
                colorScheme={
                  completionRate >= 75
                    ? "green"
                    : completionRate >= 50
                    ? "yellow"
                    : "gray"
                }
              />
            </Box>

            {/* Actions menu */}
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
                    handleEditCategory(category.id);
                  }}
                >
                  Edit Category
                </MenuItem>
                <MenuItem
                  icon={<FiTrash2 />}
                  color="red.500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                >
                  Delete Category
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </CardBody>
      </Card>
    );
  };

  const CategoryGridCard = ({ category }: { category: CategoryResponse }) => {
    const completionRate = getCompletionPercentage(
      category.completed_tasks || 0,
      category.task_count || 0
    );

    return (
      <Card
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        position="relative"
        transition="all 0.2s"
        _hover={{
          transform: "translateY(-4px)",
          boxShadow: "lg",
          cursor: "pointer",
        }}
      >
        {/* Color bar at top */}
        <Box h="4px" bg={category.color || "gray.400"} />
        
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
                  {category.name}
                </Text>
                <Text
                  fontSize="xs"
                  color={textMuted}
                  noOfLines={2}
                  minH="2rem"
                >
                  {category.description || "No description"}
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
                      handleEditCategory(category.id);
                    }}
                  >
                    Edit Category
                  </MenuItem>
                  <MenuItem
                    icon={<FiTrash2 />}
                    color="red.500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    Delete Category
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>

            {/* Task Stats */}
            <HStack justify="space-between" align="center">
              <HStack spacing={4}>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold">
                    {category.task_count || 0}
                  </Text>
                  <Text fontSize="xs" color={textMuted}>
                    Tasks
                  </Text>
                </VStack>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {category.completed_tasks || 0}
                  </Text>
                  <Text fontSize="xs" color={textMuted}>
                    Done
                  </Text>
                </VStack>
              </HStack>
            </HStack>

            {/* Progress Bar */}
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color={textMuted}>
                  Progress
                </Text>
                <Text fontSize="xs" fontWeight="medium">
                  {completionRate}%
                </Text>
              </HStack>
              <Progress
                value={completionRate}
                size="sm"
                borderRadius="full"
                colorScheme={
                  completionRate >= 75
                    ? "green"
                    : completionRate >= 50
                    ? "yellow"
                    : "gray"
                }
              />
            </Box>

            {/* Bottom Stats */}
            <HStack
              justify="space-between"
              pt={3}
              borderTop="1px"
              borderColor={borderColor}
            >
              <HStack spacing={1}>
                <Icon as={FiActivity} boxSize={3} color={textMuted} />
                <Text fontSize="xs" color={textMuted}>
                  {categoryActivities[category.id]?.length || 0} activities
                </Text>
              </HStack>
              {completionRate === 100 && (
                <HStack spacing={1}>
                  <Icon as={FiCheckCircle} boxSize={3} color="green.500" />
                  <Text fontSize="xs" color="green.500" fontWeight="medium">
                    Complete
                  </Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <>
      <Box h="full" bg={bgColor} p={8}>
        <VStack align="stretch" spacing={8}>
          {/* Header */}
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="lg">Categories</Heading>
              <Text color={textMuted} fontSize="sm" mt={1}>
                Organize your tasks with categories
              </Text>
            </Box>
            <HStack spacing={3}>
              {/* View mode toggle */}
              <ButtonGroup size="sm" isAttached variant="outline">
                <IconButton
                  aria-label="List view"
                  icon={<FiList />}
                  isActive={viewMode === 'list'}
                  onClick={() => handleViewModeChange('list')}
                  bg={viewMode === 'list' ? useColorModeValue('primary.50', 'primary.900') : undefined}
                  color={viewMode === 'list' ? 'primary.500' : undefined}
                />
                <IconButton
                  aria-label="Grid view"
                  icon={<FiGrid />}
                  isActive={viewMode === 'grid'}
                  onClick={() => handleViewModeChange('grid')}
                  bg={viewMode === 'grid' ? useColorModeValue('primary.50', 'primary.900') : undefined}
                  color={viewMode === 'grid' ? 'primary.500' : undefined}
                />
              </ButtonGroup>

              <Button
                colorScheme="primary"
                leftIcon={<FiPlus />}
                onClick={handleCreateCategory}
                size="md"
                borderRadius="lg"
              >
                New Category
              </Button>
            </HStack>
          </HStack>

          {/* Loading State */}
          {isLoading && categories.length === 0 ? (
            viewMode === 'grid' ? (
              <GridSkeleton items={6} columns={3} component={CategoryCardSkeleton} />
            ) : (
              <ListSkeleton items={5} component={ListItemSkeleton} />
            )
          ) : categories.length === 0 ? (
            /* Empty State */
            <Box
              textAlign="center"
              py={12}
              px={6}
              bg={cardBg}
              borderRadius="xl"
              border="1px dashed"
              borderColor={borderColor}
            >
              <Icon as={FiTag} boxSize={12} color={textMuted} mb={4} />
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                No categories yet
              </Text>
              <Text color={textMuted} mb={4}>
                Create your first category to start organizing tasks
              </Text>
              <Button
                colorScheme="primary"
                leftIcon={<FiPlus />}
                onClick={handleCreateCategory}
              >
                Create Category
              </Button>
            </Box>
          ) : (
            /* Categories Display */
            viewMode === 'grid' ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5}>
                {categories.map((category) => (
                  <CategoryGridCard key={category.id} category={category} />
                ))}
              </SimpleGrid>
            ) : (
              <VStack align="stretch" spacing={3}>
                {categories.map((category) => (
                  <CategoryListItem key={category.id} category={category} />
                ))}
              </VStack>
            )
          )}
        </VStack>
      </Box>

      {/* Category Modal */}
      {projectId && (
        <CategoryModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          onSuccess={handleCategorySuccess}
          projectId={projectId}
          category={editingCategory}
        />
      )}
    </>
  );
}