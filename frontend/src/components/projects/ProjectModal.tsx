import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Box,
  Text,
  useToast,
  FormErrorMessage,
  Icon,
  Divider,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  ProjectService,
  type ProjectCreateRequest,
  type ProjectUpdateRequest,
} from "../../services/projectService";
import { FiFolder, FiCalendar, FiFlag, FiDroplet } from "react-icons/fi";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: {
    id: string;
    name: string;
    description: string;
    status: string;
    color: string;
  } | null;
}

const PROJECT_COLORS = [
  "#E53E3E", // red.500
  "#DD6B20", // orange.500
  "#D69E2E", // yellow.500
  "#38A169", // green.500
  "#319795", // teal.500
  "#3182CE", // blue.500
  "#553C9A", // purple.500
  "#AD1FEA", // pink.500
  "#718096", // gray.500
];

const PROJECT_STATUSES = [
  { value: "planning", label: "Planning", color: "blue" },
  { value: "active", label: "Active", color: "green" },
  { value: "on_hold", label: "On Hold", color: "orange" },
  { value: "completed", label: "Completed", color: "gray" },
  { value: "archived", label: "Archived", color: "red" },
];

export function ProjectModal({
  isOpen,
  onClose,
  onSuccess,
  project,
}: ProjectModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    color: PROJECT_COLORS[5], // Default to blue
    startDate: "",
    endDate: "",
    priority: "medium",
  });

  const isEdit = !!project;

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        color: project.color,
        startDate: "",
        endDate: "",
        priority: "medium",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        status: "planning",
        color: PROJECT_COLORS[5],
        startDate: "",
        endDate: "",
        priority: "medium",
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Project name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Project description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEdit && project) {
        const updateData: ProjectUpdateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status as any,
          color: formData.color,
        };
        await ProjectService.update(project.id, updateData);
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
          status: "success",
          duration: 3000,
          position: "top-right",
        });
      } else {
        const createData: ProjectCreateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status as any,
          color: formData.color,
        };
        await ProjectService.create(createData);
        toast({
          title: "Project created",
          description: "Your new project has been created successfully.",
          status: "success",
          duration: 3000,
          position: "top-right",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: isEdit ? "Failed to update project" : "Failed to create project",
        description: error.response?.data?.detail || "An error occurred",
        status: "error",
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusObj = PROJECT_STATUSES.find(s => s.value === status);
    return statusObj ? (
      <Badge colorScheme={statusObj.color} variant="subtle" fontSize="xs">
        {statusObj.label}
      </Badge>
    ) : null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader pb={2}>
          <HStack spacing={3}>
            <Icon as={FiFolder} boxSize={5} color="primary.500" />
            <Text fontSize="xl" fontWeight="semibold">
              {isEdit ? "Edit Project" : "Create New Project"}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <Divider />

        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Basic Information Section */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                BASIC INFORMATION
              </Text>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel fontSize="sm">Project Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter a unique project name"
                    size="md"
                    borderRadius="lg"
                  />
                  <FormErrorMessage fontSize="xs">{errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.description}>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your project goals and objectives"
                    rows={4}
                    resize="vertical"
                    borderRadius="lg"
                  />
                  <FormErrorMessage fontSize="xs">{errors.description}</FormErrorMessage>
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Project Settings Section */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                PROJECT SETTINGS
              </Text>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">
                    <HStack spacing={2}>
                      <Icon as={FiFlag} boxSize={4} />
                      <Text>Status</Text>
                    </HStack>
                  </FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value }))
                    }
                    aria-label="Project status"
                    borderRadius="lg"
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                  <Box mt={2}>
                    {getStatusIcon(formData.status)}
                  </Box>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">
                    <HStack spacing={2}>
                      <Icon as={FiDroplet} boxSize={4} />
                      <Text>Project Color</Text>
                    </HStack>
                  </FormLabel>
                  <Box bg={cardBg} p={3} borderRadius="lg" border="1px" borderColor={borderColor}>
                    <HStack spacing={3} wrap="wrap" justify="center">
                      {PROJECT_COLORS.map((color) => (
                        <Box
                          key={color}
                          w={10}
                          h={10}
                          bg={color}
                          borderRadius="lg"
                          cursor="pointer"
                          border={
                            formData.color === color ? "3px solid" : "2px solid"
                          }
                          borderColor={
                            formData.color === color ? "primary.500" : "gray.300"
                          }
                          _hover={{ 
                            transform: "scale(1.1)",
                            boxShadow: "md"
                          }}
                          transition="all 0.2s"
                          onClick={() => setFormData((prev) => ({ ...prev, color }))}
                          position="relative"
                        >
                          {formData.color === color && (
                            <Box
                              position="absolute"
                              top="50%"
                              left="50%"
                              transform="translate(-50%, -50%)"
                              color="white"
                              fontSize="lg"
                              fontWeight="bold"
                            >
                              ✓
                            </Box>
                          )}
                        </Box>
                      ))}
                    </HStack>
                  </Box>
                </FormControl>

                {/* Optional Date Fields */}
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel fontSize="sm">
                      <HStack spacing={2}>
                        <Icon as={FiCalendar} boxSize={4} />
                        <Text>Start Date (Optional)</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      borderRadius="lg"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">
                      <HStack spacing={2}>
                        <Icon as={FiCalendar} boxSize={4} />
                        <Text>End Date (Optional)</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      borderRadius="lg"
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel fontSize="sm">Priority</FormLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    borderRadius="lg"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </Select>
                </FormControl>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <Divider />

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            loadingText={isEdit ? "Updating..." : "Creating..."}
            leftIcon={<Icon as={FiFolder} />}
          >
            {isEdit ? "Update Project" : "Create Project"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}