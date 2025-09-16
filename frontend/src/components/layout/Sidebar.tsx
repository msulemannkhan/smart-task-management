import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Divider,
  Badge,
  useColorMode,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiHome,
  FiFolder,
  FiCalendar,
  FiPlus,
  FiSun,
  FiMoon,
  FiLogOut,
  FiUser,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCheckSquare,
  FiTag,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ProjectService,
  type ProjectListResponse,
} from "../../services/projectService";
import { useState, useEffect } from "react";
import { ProjectModal } from "../projects/ProjectModal";
import { UserAvatar } from "../common/UserAvatar";

interface SidebarItemProps {
  icon: any;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
  isCollapsed?: boolean;
}

function SidebarItem({
  icon,
  label,
  isActive,
  badge,
  onClick,
  isCollapsed,
}: SidebarItemProps) {
  return (
    <Button
      variant="ghost"
      w="full"
      justifyContent={isCollapsed ? "center" : "flex-start"}
      px={isCollapsed ? 2 : 3}
      py={2}
      h={isCollapsed ? "40px" : "auto"}
      minH={"40px"}
      fontWeight="medium"
      fontSize="sm"
      color={isActive ? { base: "blue.600", _dark: "blue.400" } : { base: "gray.700", _dark: "gray.300" }}
      bg={
        isActive ? { base: "blue.50", _dark: "blue.900" } : "transparent"
      }
      _hover={{
        bg: isActive
          ? { base: "blue.50", _dark: "blue.900" }
          : { base: "gray.100", _dark: "dark.bg.hover" },
      }}
      _active={{
        bg: isActive
          ? { base: "blue.100", _dark: "blue.800" }
          : { base: "gray.200", _dark: "gray.600" },
      }}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      overflow="hidden"
      whiteSpace="nowrap"
      borderRadius="lg"
      position="relative"
    >
      <HStack
        spacing={isCollapsed ? 0 : 3}
        w="full"
        justify={isCollapsed ? "center" : "flex-start"}
      >
        <Icon as={icon} boxSize={isCollapsed ? 5 : 4} flexShrink={0} />
        {!isCollapsed && (
          <>
            <Text flex={1} textAlign="left" noOfLines={1}>
              {label}
            </Text>
            {badge && (
              <Badge
                colorScheme="blue"
                variant="subtle"
                fontSize="xs"
                px={2}
                flexShrink={0}
                borderRadius="full"
              >
                {badge}
              </Badge>
            )}
          </>
        )}
        {/* Active indicator for collapsed state */}
        {isCollapsed && isActive && (
          <Box
            position="absolute"
            left={0}
            top="50%"
            transform="translateY(-50%)"
            w={1}
            h={6}
            bg={{ base: "blue.500", _dark: "blue.400" }}
            borderRadius="0 2px 2px 0"
          />
        )}
      </HStack>
    </Button>
  );
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();

  // Theme-consistent color values
  const bgColor = useColorModeValue('white', 'dark.bg.secondary');
  const borderColor = useColorModeValue('gray.200', 'dark.border.subtle');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'dark.bg.hover');
  const [projects, setProjects] = useState<ProjectListResponse["projects"]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    isOpen: isProjectModalOpen,
    onOpen: onProjectModalOpen,
    onClose: onProjectModalClose,
  } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const loadProjects = async () => {
    try {
      const res = await ProjectService.list();
      // Remove duplicates and limit to 6 projects for sidebar
      const uniqueProjects = res.projects.filter(
        (project, index, self) =>
          index === self.findIndex((p) => p.id === project.id)
      );
      setProjects(uniqueProjects.slice(0, 6));
    } catch (error) {
      console.error("Failed to load projects for sidebar:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const mainNavItems = [
    { icon: FiHome, label: "Dashboard", path: "/dashboard", badge: undefined },
    { icon: FiCheckSquare, label: "Tasks", path: "/tasks", badge: undefined },
    {
      icon: FiCalendar,
      label: "Calendar",
      path: "/calendar",
      badge: undefined,
    },
    { icon: FiFolder, label: "Projects", path: "/projects", badge: undefined },
    {
      icon: FiTag,
      label: "Categories",
      path: "/categories",
      badge: undefined,
    },
  ];

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path === "/dashboard" && location.pathname === "/")
    );
  };

  const SidebarContent = ({
    onCloseMobile,
  }: {
    onCloseMobile?: () => void;
  }) => (
    <Box
      as="aside"
      w={{ base: "full", lg: isCollapsed ? "68px" : "280px" }}
      minW={{ base: "full", lg: isCollapsed ? "68px" : "280px" }}
      maxW={{ base: "full", lg: isCollapsed ? "68px" : "280px" }}
      bg={bgColor}
      borderRight="1px solid"
      borderRightColor={borderColor}
      h="100vh"
      position={{ base: "relative", lg: "sticky" }}
      top="0"
      overflowY="auto"
      overflowX="hidden"
      display="flex"
      flexDirection="column"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      flexShrink={0}
      boxShadow={{ base: "none", _dark: "xl" }}
    >
      {/* Logo/Brand */}
      <HStack
        justify={isCollapsed ? "center" : "space-between"}
        p={isCollapsed ? 3 : 6}
        position="relative"
        borderBottom="1px solid"
        borderBottomColor={borderColor}
        mb={2}
      >
        {!isCollapsed && (
          <Text
            fontSize="xl"
            fontWeight="bold"
            color={textColor}
          >
            TaskHub
          </Text>
        )}
        {isCollapsed && (
          <Text
            fontSize="lg"
            fontWeight="bold"
            color={{ base: "blue.600", _dark: "blue.400" }}
          >
            T
          </Text>
        )}
        {/* Desktop toggle button */}
        {!isMobile && (
          <IconButton
            aria-label="Toggle sidebar"
            icon={<Icon as={isCollapsed ? FiChevronRight : FiChevronLeft} />}
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            color={secondaryTextColor}
            _hover={{ bg: hoverBg }}
            borderRadius="md"
          />
        )}
        {/* Mobile close button */}
        {isMobile && onCloseMobile && (
          <IconButton
            aria-label="Close menu"
            icon={<Icon as={FiX} />}
            size="sm"
            variant="ghost"
            onClick={onCloseMobile}
          />
        )}
      </HStack>

      {/* Main Navigation */}
      <VStack spacing={1} px={4} align="stretch">
        {mainNavItems.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.path)}
            badge={item.badge}
            onClick={() => {
              navigate(item.path);
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            isCollapsed={isCollapsed}
          />
        ))}
      </VStack>

      <Divider my={4} />

      {/* Projects Section */}
      <Box px={isCollapsed ? 2 : 4} overflow="hidden">
        {!isCollapsed && (
          <HStack justify="space-between" mb={3}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={secondaryTextColor}
              noOfLines={1}
            >
              Projects
            </Text>
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<FiPlus />}
              onClick={onProjectModalOpen}
              color={secondaryTextColor}
              _hover={{ bg: hoverBg }}
            >
              New
            </Button>
          </HStack>
        )}

        {/* Collapsed New Project Button */}
        {isCollapsed && (
          <Box mb={3} display="flex" justifyContent="center">
            <IconButton
              aria-label="New project"
              icon={<FiPlus />}
              size="sm"
              variant="ghost"
              onClick={onProjectModalOpen}
              color={secondaryTextColor}
              _hover={{ bg: hoverBg }}
            />
          </Box>
        )}

        <VStack spacing={2} align="stretch">
          {isLoadingProjects ? (
            !isCollapsed ? (
              <Text fontSize="sm" color="gray.500" px={3} py={2}>
                Loading projects...
              </Text>
            ) : null
          ) : projects.length > 0 ? (
            projects.map((project) => (
              isCollapsed ? (
                <IconButton
                  key={project.id}
                  aria-label={project.name}
                  icon={<Box w={2} h={2} bg={project.color} borderRadius="full" />}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigate(`/projects/${project.id}`);
                    if (isMobile && onCloseMobile) onCloseMobile();
                  }}
                  _hover={{ bg: hoverBg }}
                  title={project.name}
                  color={{ base: "gray.700", _dark: "gray.300" }}
                />
              ) : (
                <HStack
                  key={project.id}
                  px={3}
                  py={2}
                  spacing={3}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  borderRadius="md"
                  onClick={() => {
                    navigate(`/projects/${project.id}`);
                    if (isMobile && onCloseMobile) onCloseMobile();
                  }}
                >
                  <Box
                    w={3}
                    h={3}
                    bg={project.color}
                    borderRadius="full"
                    flexShrink={0}
                  />
                  <Text
                    fontSize="sm"
                    color={textColor}
                    noOfLines={1}
                  >
                    {project.name}
                  </Text>
                </HStack>
              )
            ))
          ) : (
            !isCollapsed && (
              <Text fontSize="sm" color="gray.500" px={3} py={2}>
                No projects yet
              </Text>
            )
          )}
        </VStack>
      </Box>

      {/* User Profile Section */}
      <Box
        mt="auto"
        p={isCollapsed ? 2 : 4}
        borderTop="1px"
        borderTopColor={borderColor}
      >
        <Menu
          placement={isCollapsed ? "right-start" : "top-start"}
          offset={isCollapsed ? [0, 10] : undefined}
        >
          <MenuButton
            as={Button}
            variant="ghost"
            w="full"
            h="auto"
            p={isCollapsed ? 2 : 3}
            justifyContent={isCollapsed ? "center" : "flex-start"}
            _hover={{ bg: hoverBg }}
          >
            <HStack spacing={3} justify={isCollapsed ? "center" : "flex-start"}>
              <UserAvatar
                user={user}
                size="sm"
              />
              {!isCollapsed && (
                <Box flex={1} textAlign="left">
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                    {user?.full_name || "User"}
                  </Text>
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {user?.email}
                  </Text>
                </Box>
              )}
            </HStack>
          </MenuButton>
          <MenuList
            minW={isCollapsed ? "200px" : "auto"}
            boxShadow="xl"
            borderRadius="lg"
            overflow="hidden"
            bg={useColorModeValue('white', 'dark.bg.tertiary')}
            borderColor={borderColor}
            border="1px solid"
          >
            {/* User Info Header in Menu */}
            {isCollapsed && (
              <>
                <Box px={4} py={3} bg={{ base: "gray.50", _dark: "gray.800" }}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold">
                      {user?.full_name || "User"}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {user?.email}
                    </Text>
                  </VStack>
                </Box>
                <MenuDivider />
              </>
            )}

            <MenuItem
              icon={<FiUser />}
              onClick={() => navigate("/profile")}
              _hover={{ bg: { base: "gray.50", _dark: "dark.bg.hover" } }}
              color={{ base: "gray.700", _dark: "gray.300" }}
            >
              Account Settings
            </MenuItem>
            <MenuItem
              icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              _hover={{ bg: { base: "gray.50", _dark: "dark.bg.hover" } }}
              color={{ base: "gray.700", _dark: "gray.300" }}
            >
              {colorMode === "light" ? "Dark Mode" : "Light Mode"}
            </MenuItem>
            <MenuDivider
              borderColor={{ base: "gray.200", _dark: "dark.border.subtle" }}
            />
            <MenuItem
              icon={<FiLogOut />}
              onClick={handleLogout}
              color="red.500"
              _hover={{ bg: { base: "red.50", _dark: "red.900" } }}
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={onProjectModalClose}
        onSuccess={() => {
          loadProjects(); // Reload projects after creating a new one
          onProjectModalClose();
        }}
        project={null}
      />
    </Box>
  );

  // Mobile: Show drawer
  if (isMobile) {
    return (
      <>
        <Drawer
          isOpen={isOpen}
          placement="left"
          onClose={onClose || (() => {})}
          size="full"
        >
          <DrawerOverlay />
          <DrawerContent>
            <SidebarContent onCloseMobile={onClose} />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Show static sidebar
  return <SidebarContent />;
}
