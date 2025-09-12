import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  IconButton,
  Progress,
  Alert,
  AlertIcon,
  Image,
  Badge,
  useColorModeValue,
  Flex,
  Tooltip,
} from "@chakra-ui/react";
import { useState, useRef, useCallback } from "react";
import {
  FiUploadCloud,
  FiFile,
  FiImage,
  FiFileText,
  FiVideo,
  FiMusic,
  FiArchive,
  FiTrash2,
  FiDownload,
  FiEye,
  FiX,
} from "react-icons/fi";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  status: "uploading" | "uploaded" | "error";
  error?: string;
}

interface FileUploadProps {
  taskId: string;
  onFileUploaded?: (file: FileItem) => void;
  onFileRemoved?: (fileId: string) => void;
  existingFiles?: FileItem[];
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

export function FileUpload({
  taskId,
  onFileUploaded,
  onFileRemoved,
  existingFiles = [],
  maxFileSize = 10, // 10MB default
  allowedTypes,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>(existingFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const dragBg = useColorModeValue("blue.50", "blue.900");

  // Get file icon based on mime type
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FiImage;
    if (type.startsWith("video/")) return FiVideo;
    if (type.startsWith("audio/")) return FiMusic;
    if (type.includes("pdf")) return FiFileText;
    if (type.includes("zip") || type.includes("rar")) return FiArchive;
    return FiFile;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type if restrictions are specified
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!allowedTypes.some(type => type.includes(fileExtension || ""))) {
        return `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`;
      }
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: FileItem[] = [];
    setUploadError(null);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);

      if (error) {
        setUploadError(error);
        continue;
      }

      const fileItem: FileItem = {
        id: `${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      };

      newFiles.push(fileItem);

      // Simulate file upload
      simulateUpload(fileItem);
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [maxFileSize, allowedTypes]);

  // Simulate file upload (replace with actual API call)
  const simulateUpload = async (file: FileItem) => {
    const totalSteps = 10;
    
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, progress: (i / totalSteps) * 100 }
          : f
      ));
    }

    // Mark as uploaded
    setFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, status: "uploaded", url: URL.createObjectURL(new Blob()) }
        : f
    ));

    // Notify parent
    if (onFileUploaded) {
      onFileUploaded({ ...file, status: "uploaded" });
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (onFileRemoved) {
      onFileRemoved(fileId);
    }
  };

  // Download file
  const handleDownloadFile = (file: FileItem) => {
    if (file.url) {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      link.click();
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Upload area */}
      <Box
        border="2px dashed"
        borderColor={isDragging ? "blue.400" : borderColor}
        borderRadius="lg"
        p={8}
        bg={isDragging ? dragBg : bgColor}
        _hover={{ bg: hoverBg }}
        cursor="pointer"
        transition="all 0.2s"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <VStack spacing={3}>
          <Icon
            as={FiUploadCloud}
            boxSize={12}
            color={isDragging ? "blue.500" : "gray.400"}
          />
          <Text fontWeight="medium">
            {isDragging ? "Drop files here" : "Drag & drop files here"}
          </Text>
          <Text fontSize="sm" color="gray.500">
            or click to browse
          </Text>
          <Text fontSize="xs" color="gray.400">
            Maximum file size: {maxFileSize}MB
          </Text>
        </VStack>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={allowedTypes?.join(",")}
      />

      {/* Upload error */}
      {uploadError && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {uploadError}
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <VStack spacing={2} align="stretch">
          <Text fontWeight="medium" fontSize="sm">
            Attachments ({files.length})
          </Text>
          
          {files.map(file => {
            const FileIcon = getFileIcon(file.type);
            const isImage = file.type.startsWith("image/");
            
            return (
              <Box
                key={file.id}
                p={3}
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
                bg={useColorModeValue("white", "gray.900")}
              >
                <HStack spacing={3}>
                  {/* File preview/icon */}
                  {isImage && file.url ? (
                    <Image
                      src={file.url}
                      boxSize={10}
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ) : (
                    <Flex
                      w={10}
                      h={10}
                      align="center"
                      justify="center"
                      bg={useColorModeValue("gray.100", "gray.800")}
                      borderRadius="md"
                    >
                      <Icon as={FileIcon} boxSize={5} />
                    </Flex>
                  )}

                  {/* File info */}
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                      {file.name}
                    </Text>
                    <HStack spacing={2}>
                      <Text fontSize="xs" color="gray.500">
                        {formatFileSize(file.size)}
                      </Text>
                      {file.status === "uploaded" && (
                        <Badge colorScheme="green" fontSize="xs">
                          Uploaded
                        </Badge>
                      )}
                      {file.status === "uploading" && (
                        <Badge colorScheme="blue" fontSize="xs">
                          Uploading...
                        </Badge>
                      )}
                      {file.status === "error" && (
                        <Badge colorScheme="red" fontSize="xs">
                          Error
                        </Badge>
                      )}
                    </HStack>
                  </VStack>

                  {/* Actions */}
                  <HStack spacing={1}>
                    {file.status === "uploaded" && (
                      <>
                        {isImage && (
                          <Tooltip label="Preview">
                            <IconButton
                              aria-label="Preview"
                              icon={<FiEye />}
                              size="sm"
                              variant="ghost"
                            />
                          </Tooltip>
                        )}
                        <Tooltip label="Download">
                          <IconButton
                            aria-label="Download"
                            icon={<FiDownload />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadFile(file)}
                          />
                        </Tooltip>
                      </>
                    )}
                    <Tooltip label="Remove">
                      <IconButton
                        aria-label="Remove"
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleRemoveFile(file.id)}
                      />
                    </Tooltip>
                  </HStack>
                </HStack>

                {/* Upload progress */}
                {file.status === "uploading" && file.progress !== undefined && (
                  <Progress
                    value={file.progress}
                    size="xs"
                    colorScheme="blue"
                    mt={2}
                    borderRadius="full"
                  />
                )}
              </Box>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}