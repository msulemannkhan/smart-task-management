import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  CheckboxGroup,
  Text,
  Badge,
  Box,
  Icon,
  Divider,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiCalendar, FiSave, FiClock, FiX } from "react-icons/fi";
import { TaskStatus, TaskPriority } from "../types/task";
import { format } from "date-fns";

interface SearchFilters {
  query: string;
  status: TaskStatus[];
  priority: TaskPriority[];
  assignee: string[];
  project: string[];
  category: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  hasAttachments: boolean;
  hasComments: boolean;
  isOverdue: boolean;
  isCompleted: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  projects?: any[];
  categories?: any[];
  users?: any[];
}

export function AdvancedSearch({
  isOpen,
  onClose,
  onSearch,
  projects = [],
  categories = [],
  users = [],
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    status: [],
    priority: [],
    assignee: [],
    project: [],
    category: [],
    dateRange: {
      start: null,
      end: null,
    },
    hasAttachments: false,
    hasComments: false,
    isOverdue: false,
    isCompleted: false,
  });

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedSearches");
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }

    const recent = localStorage.getItem("recentSearches");
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Handle search
  const handleSearch = () => {
    // Save to recent searches
    if (filters.query && !recentSearches.includes(filters.query)) {
      const newRecent = [filters.query, ...recentSearches.slice(0, 4)];
      setRecentSearches(newRecent);
      localStorage.setItem("recentSearches", JSON.stringify(newRecent));
    }

    onSearch(filters);
    onClose();
  };

  // Save current search
  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast({
        title: "Please enter a name for the search",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem("savedSearches", JSON.stringify(updated));

    toast({
      title: "Search saved",
      status: "success",
      duration: 2000,
    });

    setSearchName("");
    setShowSaveDialog(false);
  };

  // Load saved search
  const handleLoadSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    toast({
      title: `Loaded search: ${search.name}`,
      status: "info",
      duration: 2000,
    });
  };

  // Delete saved search
  const handleDeleteSearch = (searchId: string) => {
    const updated = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updated);
    localStorage.setItem("savedSearches", JSON.stringify(updated));
    
    toast({
      title: "Search deleted",
      status: "success",
      duration: 2000,
    });
  };

  // Reset filters
  const handleReset = () => {
    setFilters({
      query: "",
      status: [],
      priority: [],
      assignee: [],
      project: [],
      category: [],
      dateRange: {
        start: null,
        end: null,
      },
      hasAttachments: false,
      hasComments: false,
      isOverdue: false,
      isCompleted: false,
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.assignee.length > 0) count++;
    if (filters.project.length > 0) count++;
    if (filters.category.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.hasAttachments) count++;
    if (filters.hasComments) count++;
    if (filters.isOverdue) count++;
    if (filters.isCompleted) count++;
    return count;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiSearch} />
              <Text>Advanced Search</Text>
            </HStack>
            {getActiveFilterCount() > 0 && (
              <Badge colorScheme="blue">
                {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Search Query */}
            <FormControl>
              <FormLabel fontSize="sm">Search Query</FormLabel>
              <Input
                placeholder="Search by title or description..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                size="md"
              />
            </FormControl>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Box>
                <Text fontSize="xs" color="gray.500" mb={2}>Recent Searches</Text>
                <Wrap spacing={2}>
                  {recentSearches.map((search, index) => (
                    <WrapItem key={index}>
                      <Tag
                        size="sm"
                        variant="subtle"
                        cursor="pointer"
                        onClick={() => setFilters({ ...filters, query: search })}
                      >
                        <TagLabel>{search}</TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            <Divider />

            {/* Status Filter */}
            <FormControl>
              <FormLabel fontSize="sm">Status</FormLabel>
              <CheckboxGroup
                value={filters.status}
                onChange={(values) => setFilters({ ...filters, status: values as TaskStatus[] })}
              >
                <Wrap spacing={3}>
                  {Object.values(TaskStatus).map((status) => (
                    <WrapItem key={status}>
                      <Checkbox value={status} size="sm">
                        <Badge variant="subtle" colorScheme={getStatusColor(status)}>
                          {status.replace('_', ' ')}
                        </Badge>
                      </Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
            </FormControl>

            {/* Priority Filter */}
            <FormControl>
              <FormLabel fontSize="sm">Priority</FormLabel>
              <CheckboxGroup
                value={filters.priority}
                onChange={(values) => setFilters({ ...filters, priority: values as TaskPriority[] })}
              >
                <Wrap spacing={3}>
                  {Object.values(TaskPriority).map((priority) => (
                    <WrapItem key={priority}>
                      <Checkbox value={priority} size="sm">
                        <Badge variant="subtle" colorScheme={getPriorityColor(priority)}>
                          {priority}
                        </Badge>
                      </Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
            </FormControl>

            {/* Date Range */}
            <HStack spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">From Date</FormLabel>
                <Input
                  type="date"
                  size="sm"
                  value={filters.dateRange.start || ""}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">To Date</FormLabel>
                <Input
                  type="date"
                  size="sm"
                  value={filters.dateRange.end || ""}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                />
              </FormControl>
            </HStack>

            {/* Assignee Filter */}
            {users.length > 0 && (
              <FormControl>
                <FormLabel fontSize="sm">Assignee</FormLabel>
                <Select
                  placeholder="Select assignees"
                  size="sm"
                  onChange={(e) => {
                    if (e.target.value && !filters.assignee.includes(e.target.value)) {
                      setFilters({ ...filters, assignee: [...filters.assignee, e.target.value] });
                    }
                  }}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </Select>
                <Wrap mt={2}>
                  {filters.assignee.map((userId) => {
                    const user = users.find(u => u.id === userId);
                    return (
                      <WrapItem key={userId}>
                        <Tag size="sm">
                          <TagLabel>{user?.full_name || user?.email}</TagLabel>
                          <TagCloseButton
                            onClick={() => setFilters({
                              ...filters,
                              assignee: filters.assignee.filter(id => id !== userId)
                            })}
                          />
                        </Tag>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              </FormControl>
            )}

            {/* Additional Filters */}
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" fontWeight="medium">Additional Filters</Text>
              <Checkbox
                isChecked={filters.hasAttachments}
                onChange={(e) => setFilters({ ...filters, hasAttachments: e.target.checked })}
                size="sm"
              >
                Has Attachments
              </Checkbox>
              <Checkbox
                isChecked={filters.hasComments}
                onChange={(e) => setFilters({ ...filters, hasComments: e.target.checked })}
                size="sm"
              >
                Has Comments
              </Checkbox>
              <Checkbox
                isChecked={filters.isOverdue}
                onChange={(e) => setFilters({ ...filters, isOverdue: e.target.checked })}
                size="sm"
              >
                Overdue Tasks
              </Checkbox>
              <Checkbox
                isChecked={filters.isCompleted}
                onChange={(e) => setFilters({ ...filters, isCompleted: e.target.checked })}
                size="sm"
              >
                Completed Tasks
              </Checkbox>
            </VStack>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Saved Searches</Text>
                <VStack align="stretch" spacing={2}>
                  {savedSearches.map((search) => (
                    <HStack
                      key={search.id}
                      p={2}
                      border="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      justify="space-between"
                    >
                      <HStack flex={1} cursor="pointer" onClick={() => handleLoadSearch(search)}>
                        <Icon as={FiClock} boxSize={3} />
                        <Text fontSize="sm">{search.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {format(new Date(search.createdAt), 'MMM dd')}
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label="Delete search"
                        icon={<FiX />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDeleteSearch(search.id)}
                      />
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="full" justify="space-between">
            <HStack>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
              {!showSaveDialog ? (
                <Button
                  leftIcon={<FiSave />}
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                >
                  Save Search
                </Button>
              ) : (
                <HStack>
                  <Input
                    placeholder="Search name..."
                    size="sm"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                  <Button size="sm" colorScheme="green" onClick={handleSaveSearch}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                </HStack>
              )}
            </HStack>
            <HStack>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSearch}>
                Search
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Helper functions
function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.DONE: return "green";
    case TaskStatus.IN_PROGRESS: return "blue";
    case TaskStatus.IN_REVIEW: return "purple";
    case TaskStatus.BLOCKED: return "red";
    default: return "gray";
  }
}

function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.CRITICAL: return "red";
    case TaskPriority.URGENT: return "orange";
    case TaskPriority.HIGH: return "yellow";
    case TaskPriority.MEDIUM: return "blue";
    default: return "gray";
  }
}