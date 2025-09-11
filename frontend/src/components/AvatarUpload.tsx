import {
  Box,
  Avatar,
  IconButton,
  VStack,
  Text,
  useToast,
  Progress,
  HStack,
  Badge,
  useColorModeValue,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { FiCamera, FiUpload, FiTrash2, FiUser } from "react-icons/fi";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  isEditable?: boolean;
}

export function AvatarUpload({
  currentAvatarUrl,
  userName = "User",
  onUpload,
  onRemove,
  size = "xl",
  isEditable = true,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setSelectedFile(file);
      onOpen(); // Open confirmation modal
    };
    reader.readAsDataURL(file);
  };

  // Upload avatar
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated",
        status: "success",
        duration: 3000,
      });

      onClose();
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove avatar
  const handleRemove = async () => {
    if (!onRemove) return;

    try {
      setIsUploading(true);
      await onRemove();
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to remove avatar",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const avatarSize = {
    sm: "48px",
    md: "64px",
    lg: "96px",
    xl: "128px",
    "2xl": "192px",
  }[size];

  return (
    <>
      <VStack spacing={4}>
        <Box position="relative">
          <Avatar
            size={size}
            name={userName}
            src={currentAvatarUrl}
            bg={currentAvatarUrl ? "transparent" : "gray.400"}
            icon={<FiUser />}
            border="4px solid"
            borderColor={borderColor}
          />
          
          {isEditable && (
            <HStack
              position="absolute"
              bottom={0}
              right={0}
              spacing={1}
              bg={bgColor}
              borderRadius="full"
              p={1}
              boxShadow="md"
            >
              <Tooltip label="Upload new avatar">
                <IconButton
                  aria-label="Upload avatar"
                  icon={<FiCamera />}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                />
              </Tooltip>
              
              {currentAvatarUrl && onRemove && (
                <Tooltip label="Remove avatar">
                  <IconButton
                    aria-label="Remove avatar"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    borderRadius="full"
                    onClick={handleRemove}
                    isLoading={isUploading}
                  />
                </Tooltip>
              )}
            </HStack>
          )}
        </Box>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {isEditable && (
          <VStack spacing={1}>
            <Text fontSize="sm" color="gray.500">
              Click camera icon to upload
            </Text>
            <Text fontSize="xs" color="gray.400">
              JPG, PNG or GIF (Max 5MB)
            </Text>
          </VStack>
        )}

        {isUploading && (
          <Box w="full" maxW="200px">
            <Progress value={uploadProgress} size="xs" colorScheme="blue" borderRadius="full" />
            <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">
              Uploading... {uploadProgress}%
            </Text>
          </Box>
        )}
      </VStack>

      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Avatar Upload</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Preview of your new avatar:
              </Text>
              <Avatar
                size="2xl"
                src={previewUrl || undefined}
                border="4px solid"
                borderColor={borderColor}
              />
              <Badge colorScheme="green">
                Ready to upload
              </Badge>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpload}
              isLoading={isUploading}
              loadingText="Uploading..."
              leftIcon={<FiUpload />}
            >
              Upload Avatar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}