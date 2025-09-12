import {
  Box,
  VStack,
  HStack,
  Text,
  Checkbox,
  Input,
  IconButton,
  Button,
  Progress,
  Badge,
  useToast,
  useColorModeValue,
  Collapse,
  Flex,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { TaskService } from "../services/taskService";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  parent_task_id: string;
  created_at: string;
  updated_at?: string;
}

interface SubtaskListProps {
  taskId: string;
  onProgressUpdate?: (progress: number) => void;
  isEditable?: boolean;
}

export function SubtaskList({ taskId, onProgressUpdate, isEditable = true }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const completedTextColor = useColorModeValue("gray.500", "gray.600");

  // Calculate progress
  const progress = subtasks.length > 0 
    ? Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100)
    : 0;

  // Fetch subtasks
  const fetchSubtasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9200'}/api/v1/tasks/${taskId}/subtasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubtasks(data.subtasks || []);
      }
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add subtask
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      setIsAddingSubtask(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9200'}/api/v1/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          title: newSubtaskTitle,
          parent_task_id: taskId,
        }),
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setSubtasks(prev => [...prev, newSubtask]);
        setNewSubtaskTitle("");
        toast({
          title: "Subtask added",
          status: "success",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to add subtask",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // Toggle subtask completion
  const handleToggleComplete = async (subtask: Subtask) => {
    try {
      const newCompleted = !subtask.completed;
      
      // Optimistic update
      setSubtasks(prev => prev.map(s => 
        s.id === subtask.id ? { ...s, completed: newCompleted } : s
      ));

      const response = await fetch(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:9200'}'}/api/v1/tasks/subtasks/${subtask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          completed: newCompleted,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setSubtasks(prev => prev.map(s => 
          s.id === subtask.id ? { ...s, completed: !newCompleted } : s
        ));
        throw new Error("Failed to update subtask");
      }

      const updatedProgress = calculateProgress(subtasks.map(s => 
        s.id === subtask.id ? { ...s, completed: newCompleted } : s
      ));
      onProgressUpdate?.(updatedProgress);
    } catch (error) {
      toast({
        title: "Failed to update subtask",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Update subtask title
  const handleUpdateTitle = async (subtaskId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9200'}/api/v1/tasks/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          title: editingTitle,
        }),
      });

      if (response.ok) {
        setSubtasks(prev => prev.map(s => 
          s.id === subtaskId ? { ...s, title: editingTitle } : s
        ));
        setEditingId(null);
        toast({
          title: "Subtask updated",
          status: "success",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update subtask",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Delete subtask
  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9200'}/api/v1/tasks/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const newSubtasks = subtasks.filter(s => s.id !== subtaskId);
        setSubtasks(newSubtasks);
        onProgressUpdate?.(calculateProgress(newSubtasks));
        toast({
          title: "Subtask deleted",
          status: "success",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to delete subtask",
        status: "error",
        duration: 3000,
      });
    }
  };

  const calculateProgress = (tasks: Subtask[]) => {
    return tasks.length > 0 
      ? Math.round((tasks.filter(s => s.completed).length / tasks.length) * 100)
      : 0;
  };

  // Start editing
  const startEditing = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  useEffect(() => {
    onProgressUpdate?.(progress);
  }, [progress]);

  return (
    <VStack align="stretch" spacing={3}>
      {/* Header */}
      <HStack justify="space-between">
        <HStack spacing={2}>
          <IconButton
            aria-label="Toggle subtasks"
            icon={isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            size="xs"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          />
          <Text fontWeight="medium" fontSize="sm">
            Subtasks
          </Text>
          {subtasks.length > 0 && (
            <>
              <Badge colorScheme="gray" fontSize="xs">
                {subtasks.filter(s => s.completed).length}/{subtasks.length}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {progress}%
              </Text>
            </>
          )}
        </HStack>
      </HStack>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <Progress 
          value={progress} 
          size="xs" 
          colorScheme={progress === 100 ? "green" : "blue"}
          borderRadius="full"
        />
      )}

      <Collapse in={isExpanded} animateOpacity>
        <VStack align="stretch" spacing={2}>
          {/* Subtask List */}
          {subtasks.map(subtask => (
            <HStack 
              key={subtask.id} 
              p={2} 
              bg={bgColor} 
              borderRadius="md"
              border="1px"
              borderColor={borderColor}
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            >
              <Checkbox
                isChecked={subtask.completed}
                onChange={() => handleToggleComplete(subtask)}
                isDisabled={!isEditable}
              />
              
              {editingId === subtask.id ? (
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  size="sm"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle(subtask.id);
                    if (e.key === 'Escape') cancelEditing();
                  }}
                />
              ) : (
                <Text
                  flex={1}
                  fontSize="sm"
                  textDecoration={subtask.completed ? "line-through" : "none"}
                  color={subtask.completed ? completedTextColor : "inherit"}
                  cursor="pointer"
                  onClick={() => isEditable && startEditing(subtask)}
                >
                  {subtask.title}
                </Text>
              )}

              {isEditable && (
                <HStack spacing={1}>
                  {editingId === subtask.id ? (
                    <>
                      <IconButton
                        aria-label="Save"
                        icon={<FiCheck />}
                        size="xs"
                        colorScheme="green"
                        variant="ghost"
                        onClick={() => handleUpdateTitle(subtask.id)}
                      />
                      <IconButton
                        aria-label="Cancel"
                        icon={<FiX />}
                        size="xs"
                        variant="ghost"
                        onClick={cancelEditing}
                      />
                    </>
                  ) : (
                    <>
                      <IconButton
                        aria-label="Edit"
                        icon={<FiEdit2 />}
                        size="xs"
                        variant="ghost"
                        onClick={() => startEditing(subtask)}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<FiTrash2 />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      />
                    </>
                  )}
                </HStack>
              )}
            </HStack>
          ))}

          {/* Add Subtask Input */}
          {isEditable && (
            <HStack>
              <Input
                placeholder="Add a subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                size="sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddSubtask();
                }}
              />
              <Button
                leftIcon={<FiPlus />}
                size="sm"
                colorScheme="blue"
                onClick={handleAddSubtask}
                isLoading={isAddingSubtask}
                isDisabled={!newSubtaskTitle.trim()}
              >
                Add
              </Button>
            </HStack>
          )}
        </VStack>
      </Collapse>
    </VStack>
  );
}