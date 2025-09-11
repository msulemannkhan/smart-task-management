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
  useToast,
  useColorModeValue,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Progress,
} from "@chakra-ui/react";
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiMoreVertical, FiActivity, FiCheckCircle } from "react-icons/fi";
import { CategoryService } from "../services/categoryService";
import type { CategoryResponse } from "../services/categoryService";
import {
  ProjectService,
  type ProjectListResponse,
} from "../services/projectService";
import { ActivityService, type Activity } from "../services/activityService";
import { CategoryModal } from "../components/categories/CategoryModal";

export function Categories() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textMuted = useColorModeValue("gray.600", "gray.400");
  const bgColor = useColorModeValue("gray.50", "dark.bg.primary");

  // Project ID: load first accessible project; fallback to undefined
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    description: string;
    color: string;
  } | null>(null);

  // No static categories - only show real data from backend

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
        toast({
          title: "Category deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Failed to delete category",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleCategorySuccess = () => {
    fetchCategories(projectId);
  };

  // Use hex color directly or provide a fallback
  const getCategoryColor = (hexColor: string) => {
    // Return the hex color directly, or a default if not provided
    return hexColor || "#718096"; // Default to gray if no color
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (isLoading && categories.length === 0) {
    return (
      <Box h="full" p={8}>
        <VStack align="center" justify="center" h="full">
          <Spinner size="lg" color="primary.500" thickness="3px" />
          <Text color={textMuted} fontSize="sm">
            Loading categories...
          </Text>
        </VStack>
      </Box>
    );
  }

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

          {/* Categories Grid */}
          {categories.length === 0 ? (
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
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5}>
            {categories.map((category) => {
              const completionRate = getCompletionPercentage(
                category.completed_tasks || 0,
                category.task_count || 0
              );
              
              return (
              <Card
                key={category.id}
                bg={cardBg}
                borderRadius="xl"
                boxShadow="sm"
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
            })}
          </SimpleGrid>
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
