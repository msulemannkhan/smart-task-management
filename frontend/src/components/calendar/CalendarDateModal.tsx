import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Icon,
  useColorModeValue,
  Tooltip,
  Divider,
  Flex,
} from "@chakra-ui/react";
import { FiPlus, FiEye, FiCalendar } from "react-icons/fi";
import { format } from "date-fns";
import type { Task } from "../../types/task";

interface CalendarDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  tasks: Task[];
  onCreateTask: () => void;
  onViewTask: (task: Task) => void;
}

export function CalendarDateModal({
  isOpen,
  onClose,
  selectedDate,
  tasks,
  onCreateTask,
  onViewTask,
}: CalendarDateModalProps) {
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  const getTaskColor = (task: Task) => {
    if (task.priority === "high" || task.priority === "critical") return "red";
    if (task.priority === "medium") return "blue";
    if (task.priority === "low") return "green";
    return "gray";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "gray";
      case "in_progress":
        return "blue";
      case "in_review":
        return "orange";
      case "done":
        return "green";
      case "backlog":
        return "purple";
      default:
        return "gray";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent
        bg={cardBg}
        borderRadius="2xl"
        border="1px"
        borderColor={borderColor}
        maxH="80vh"
      >
        <ModalHeader pb={2}>
          <HStack spacing={3}>
            <Icon as={FiCalendar} color="primary.500" boxSize={5} />
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={4}>
          <VStack spacing={4} align="stretch">
            {/* Action Buttons */}
            <HStack spacing={3}>
              <Button
                colorScheme="primary"
                leftIcon={<Icon as={FiPlus} />}
                onClick={onCreateTask}
                borderRadius="xl"
                flex={1}
                fontWeight="semibold"
              >
                Add Task
              </Button>
              {tasks.length > 0 && (
                <Button
                  variant="outline"
                  leftIcon={<Icon as={FiEye} />}
                  borderRadius="xl"
                  borderColor={borderColor}
                  _hover={{
                    borderColor: "primary.300",
                    bg: useColorModeValue("primary.50", "primary.900"),
                  }}
                >
                  View All ({tasks.length})
                </Button>
              )}
            </HStack>

            {tasks.length > 0 && <Divider />}

            {/* Tasks List */}
            {tasks.length > 0 ? (
              <Box
                maxH="400px"
                overflowY="auto"
                css={{
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: useColorModeValue("#E2E8F0", "#4A5568"),
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: useColorModeValue("#CBD5E0", "#718096"),
                  },
                }}
              >
                <VStack spacing={3} align="stretch">
                  {tasks.map((task) => {
                    const taskColor = getTaskColor(task);
                    const statusColor = getStatusColor(task.status || "todo");

                    return (
                      <Box
                        key={task.id}
                        p={4}
                        bg={useColorModeValue("gray.50", "dark.bg.secondary")}
                        borderRadius="xl"
                        border="1px"
                        borderColor={borderColor}
                        cursor="pointer"
                        _hover={{
                          bg: useColorModeValue("gray.100", "dark.bg.hover"),
                          borderColor: "primary.300",
                          transform: "translateY(-1px)",
                        }}
                        transition="all 0.2s"
                        onClick={() => onViewTask(task)}
                      >
                        <VStack align="stretch" spacing={2}>
                          <Flex justify="space-between" align="flex-start">
                            <Text
                              fontWeight="semibold"
                              color={textColor}
                              fontSize="sm"
                              noOfLines={2}
                              flex={1}
                            >
                              {task.title}
                            </Text>
                            <HStack spacing={2} ml={2}>
                              {task.priority && (
                                <Badge
                                  colorScheme={taskColor}
                                  variant="subtle"
                                  fontSize="xs"
                                  borderRadius="md"
                                >
                                  {task.priority.toUpperCase()}
                                </Badge>
                              )}
                            </HStack>
                          </Flex>

                          <Flex justify="space-between" align="center">
                            <Badge
                              colorScheme={statusColor}
                              variant="outline"
                              fontSize="xs"
                              borderRadius="md"
                            >
                              {(task.status || "todo")
                                .replace("_", " ")
                                .toUpperCase()}
                            </Badge>

                            {task.due_date && (
                              <Text fontSize="xs" color={mutedTextColor}>
                                Due: {format(new Date(task.due_date), "MMM d")}
                              </Text>
                            )}
                          </Flex>

                          {task.description && (
                            <Text
                              fontSize="xs"
                              color={mutedTextColor}
                              noOfLines={2}
                            >
                              {task.description}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            ) : (
              <Box py={8} textAlign="center" color={mutedTextColor}>
                <Icon as={FiCalendar} boxSize={12} mb={4} opacity={0.5} />
                <Text fontSize="sm">No tasks scheduled for this date</Text>
                <Text fontSize="xs" mt={1}>
                  Click "Add Task" to create one
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter pt={2}>
          <Button variant="ghost" onClick={onClose} borderRadius="xl">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
