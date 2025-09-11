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
  VStack,
  HStack,
  Box,
  useToast,
  FormErrorMessage,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  CategoryService,
  type CategoryCreateRequest,
  type CategoryUpdateRequest,
} from "../../services/categoryService";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  category?: {
    id: string;
    name: string;
    description: string;
    color: string;
  } | null;
}

const CATEGORY_COLORS = [
  "#E53E3E", // red.500
  "#DD6B20", // orange.500
  "#D69E2E", // yellow.500
  "#38A169", // green.500
  "#319795", // teal.500
  "#3182CE", // blue.500
  "#553C9A", // purple.500
  "#AD1FEA", // pink.500
  "#4299E1", // blue.400
  "#9F7AEA", // purple.400
  "#48BB78", // green.400
  "#ED8936", // orange.400
  "#F56565", // red.400
  "#38B2AC", // teal.400
];

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  category,
}: CategoryModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: CATEGORY_COLORS[0],
  });

  const isEdit = !!category;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        color: category.color,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: CATEGORY_COLORS[0],
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Category description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEdit && category) {
        const updateData: CategoryUpdateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
        };
        await CategoryService.updateCategory(category.id, updateData);
        toast({
          title: "Category updated successfully",
          status: "success",
          duration: 3000,
        });
      } else {
        const createData: CategoryCreateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          project_id: projectId,
        };
        await CategoryService.createCategory(createData);
        toast({
          title: "Category created successfully",
          status: "success",
          duration: 3000,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: isEdit
          ? "Failed to update category"
          : "Failed to create category",
        description: error.response?.data?.detail || "An error occurred",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEdit ? "Edit Category" : "Create New Category"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Category Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter category name"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter category description"
                rows={3}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Category Color</FormLabel>
              <HStack spacing={2} wrap="wrap">
                {CATEGORY_COLORS.map((color) => (
                  <Box
                    key={color}
                    w={8}
                    h={8}
                    bg={color}
                    borderRadius="md"
                    cursor="pointer"
                    border={
                      formData.color === color ? "3px solid" : "2px solid"
                    }
                    borderColor={
                      formData.color === color ? "blue.500" : "gray.200"
                    }
                    _hover={{ transform: "scale(1.1)" }}
                    transition="all 0.2s"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </HStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isEdit ? "Update Category" : "Create Category"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
