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
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { TaskService } from "../../services/taskService"
import { ProjectService } from "../../services/projectService"
import { CategoryService } from "../../services/categoryService"
import { ProjectMemberService } from "../../services/projectMemberService"
import { TaskStatus, TaskPriority } from "../../types/task"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: () => void
  projectId?: string
  initialDueDate?: string
}

export function CreateTaskModal({ isOpen, onClose, onTaskCreated, projectId, initialDueDate }: CreateTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("")
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM)
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO)
  const [dueDate, setDueDate] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [dueDateError, setDueDateError] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [projectMembers, setProjectMembers] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  
  const toast = useToast()

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects()
      // Set projectId if provided
      if (projectId) {
        setSelectedProjectId(projectId)
      }
      // Set initial due date if provided
      if (initialDueDate) {
        setDueDate(initialDueDate)
      }
    }
  }, [isOpen, projectId, initialDueDate])

  // Load categories and members when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectCategories(selectedProjectId)
      loadProjectMembers(selectedProjectId)
    } else {
      // Clear categories and members if no project selected
      setCategories([])
      setProjectMembers([])
      setSelectedCategoryId("")
      setSelectedAssigneeId("")
    }
  }, [selectedProjectId])

  const loadProjects = async () => {
    setProjectsLoading(true)
    try {
      const response = await ProjectService.list()
      setProjects(response.projects || [])
    } catch (error) {
      console.error("Failed to load projects:", error)
      toast({
        title: "Failed to load projects",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setProjectsLoading(false)
    }
  }

  const loadProjectCategories = async (projectId: string) => {
    setCategoriesLoading(true)
    try {
      const response = await CategoryService.getProjectCategories(projectId)
      setCategories(response.categories || [])
    } catch (error) {
      console.error("Failed to load categories:", error)
      // Don't show error toast for categories as they're optional
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadProjectMembers = async (projectId: string) => {
    setMembersLoading(true)
    try {
      const response = await ProjectMemberService.list(projectId)
      setProjectMembers(response.members || [])
    } catch (error) {
      console.error("Failed to load project members:", error)
      // Don't show error toast for members as they're optional
    } finally {
      setMembersLoading(false)
    }
  }

  // Validate date format
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true // Allow empty dates
    
    // Check if it's a valid date in YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString)) return false
    
    // Check if it's a valid actual date
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setDueDateError("")

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    // Validate due date
    if (!validateDate(dueDate)) {
      setDueDateError("Please enter a valid date in YYYY-MM-DD format")
      return
    }

    setIsLoading(true)
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        ...(selectedProjectId && { project_id: selectedProjectId }),
        ...(selectedCategoryId && { category_id: selectedCategoryId }),
        ...(selectedAssigneeId && { assignee_id: selectedAssigneeId }),
        priority,
        status,
        due_date: dueDate ? `${dueDate}T00:00:00` : undefined,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      }

      await TaskService.createTask(taskData)
      
      toast({
        title: "Task created",
        description: "Task has been created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Reset form
      setTitle("")
      setDescription("")
      setSelectedProjectId(projectId || "")
      setSelectedCategoryId("")
      setPriority(TaskPriority.MEDIUM)
      setStatus(TaskStatus.TODO)
      setDueDate("")
      setEstimatedHours("")
      setDueDateError("")
      
      onTaskCreated()
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task"
      setError(errorMessage)
      toast({
        title: "Failed to create task",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setTitle("")
      setDescription("")
      setSelectedProjectId(projectId || "")
      setSelectedCategoryId("")
      setSelectedAssigneeId("")
      setPriority(TaskPriority.MEDIUM)
      setStatus(TaskStatus.TODO)
      setDueDate("")
      setEstimatedHours("")
      setError("")
      setDueDateError("")
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Create New Task</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!error && !title.trim()}>
                <FormLabel>Title</FormLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                />
                {error && !title.trim() && (
                  <FormErrorMessage>Title is required</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description (optional)"
                  resize="vertical"
                  minH="100px"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Project</FormLabel>
                <Select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  placeholder="Select a project (optional)"
                  isDisabled={projectsLoading || !!projectId}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  placeholder={selectedProjectId ? "Select a category (optional)" : "Select a project first"}
                  isDisabled={categoriesLoading || !selectedProjectId}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                {selectedCategoryId && (
                  <Box mt={2}>
                    <HStack spacing={2}>
                      <Box
                        w={4}
                        h={4}
                        bg={categories.find(c => c.id === selectedCategoryId)?.color || "gray.500"}
                        borderRadius="sm"
                      />
                      <Text fontSize="sm" color="gray.600">
                        {categories.find(c => c.id === selectedCategoryId)?.name}
                      </Text>
                    </HStack>
                  </Box>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Assign To</FormLabel>
                <Select
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  placeholder={selectedProjectId ? "Select assignee (optional)" : "Select a project first"}
                  isDisabled={membersLoading || !selectedProjectId}
                >
                  {projectMembers.map((member) => (
                    <option key={member.user_id || member.id} value={member.user_id || member.id}>
                      {member.user?.full_name || member.user?.username || member.user?.email || "Unknown User"} ({member.role})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Priority</FormLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.URGENT}>Urgent</option>
                  <option value={TaskPriority.CRITICAL}>Critical</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value={TaskStatus.BACKLOG}>Backlog</option>
                  <option value={TaskStatus.TODO}>Todo</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.IN_REVIEW}>In Review</option>
                  <option value={TaskStatus.BLOCKED}>Blocked</option>
                  <option value={TaskStatus.DONE}>Done</option>
                </Select>
              </FormControl>

              <FormControl isInvalid={!!dueDateError}>
                <FormLabel>Due Date</FormLabel>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value)
                    setDueDateError("")
                  }}
                />
                {dueDateError && (
                  <FormErrorMessage>{dueDateError}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Estimated Hours</FormLabel>
                <Input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="Enter estimated hours"
                  min="0"
                  step="0.5"
                />
              </FormControl>

              {error && (
                <FormControl isInvalid={!!error}>
                  <FormErrorMessage>{error}</FormErrorMessage>
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              type="submit"
              isLoading={isLoading}
              loadingText="Creating..."
            >
              Create Task
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}