import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  HStack,
  VStack,
  Icon,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  Tab,
  TabList,
  Badge,
} from "@chakra-ui/react"
import {
  FiSearch,
  FiPlus,
  FiFilter,
  FiMoreVertical,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi"
import { KanbanBoardSimple } from "../tasks/KanbanBoardSimple"
import { useState } from "react"

export function MainContent() {
  const [selectedView, setSelectedView] = useState("Timeline")

  const views = [
    { name: "Overview", count: null },
    { name: "List", count: null },
    { name: "Board", count: null },
    { name: "Timeline", count: null },
    { name: "Calendar", count: null },
    { name: "Members", count: null },
  ]

  return (
    <Box h="full" bg="white" display="flex" flexDirection="column">
      {/* Header */}
      <Box borderBottom="1px" borderBottomColor="dark.border.subtle" px={6} py={4}>
        {/* Top Header */}
        <HStack justify="space-between" mb={4}>
          <InputGroup maxW="md">
            <InputLeftElement>
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search or type a command"
              bg="gray.50"
              border="none"
              _focus={{ bg: "white", boxShadow: "sm" }}
            />
          </InputGroup>

          <HStack spacing={3}>
            <Text fontSize="sm" color="gray.600">⌘ F</Text>
            <Button colorScheme="blue" leftIcon={<FiPlus />}>
              New Project
            </Button>
            <Box w={8} h={8} bg="orange.400" borderRadius="full" />
          </HStack>
        </HStack>

        {/* Project Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <HStack spacing={2}>
              <Box w={4} h={4} bg="purple.400" borderRadius="sm" />
              <Menu>
                <MenuButton as={Button} variant="ghost" rightIcon={<FiChevronDown />}>
                  <Text fontSize="lg" fontWeight="semibold">
                    All Tasks
                  </Text>
                </MenuButton>
                <MenuList>
                  <MenuItem>Frontend Development</MenuItem>
                  <MenuItem>Backend API</MenuItem>
                  <MenuItem>Database Migration</MenuItem>
                  <MenuItem>User Authentication</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </HStack>

          <HStack spacing={2}>
            <Button variant="ghost" size="sm">
              Mark Complete
            </Button>
            <Button variant="ghost" size="sm">
              <Icon as={FiMoreVertical} />
            </Button>
          </HStack>
        </HStack>

        {/* Tabs */}
        <HStack spacing={6} mt={4}>
          <Tabs variant="unstyled" index={views.findIndex(v => v.name === selectedView)}>
            <TabList>
              {views.map((view) => (
                <Tab
                  key={view.name}
                  px={0}
                  pb={2}
                  mr={6}
                  _selected={{
                    color: "blue.600",
                    borderBottom: "2px solid",
                    borderBottomColor: "blue.600",
                  }}
                  onClick={() => setSelectedView(view.name)}
                >
                  <Text fontSize="sm" fontWeight="medium">
                    {view.name}
                  </Text>
                  {view.count && (
                    <Badge ml={2} colorScheme="gray" variant="subtle">
                      {view.count}
                    </Badge>
                  )}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </HStack>

        {/* Controls */}
        <HStack spacing={3} mt={4}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FiPlus />}
            colorScheme="blue"
          >
            Add Task
          </Button>

          <HStack spacing={1}>
            <Button variant="ghost" size="sm">
              <Icon as={FiChevronLeft} />
            </Button>
            <Text fontSize="sm" color="gray.600" minW="60px" textAlign="center">
              Today
            </Text>
            <Button variant="ghost" size="sm">
              <Icon as={FiChevronRight} />
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Main Content Area */}
      <Box flex={1} overflow="auto">
        <KanbanBoardSimple />
      </Box>
    </Box>
  )
}