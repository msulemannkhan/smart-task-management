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
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Flex,
} from "@chakra-ui/react";
import {
  FiHome,
  FiFolder,
  FiCalendar,
  FiMessageSquare,
  FiFile,
  FiFileText,
  FiSettings,
  FiHelpCircle,
  FiPlus,
  FiSun,
  FiMoon,
  FiLogOut,
  FiUser,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ProjectService,
  type ProjectListResponse,
} from "../../services/projectService";
import { useState, useEffect } from "react";
import { ProjectModal } from "../projects/ProjectModal";

interface SidebarItemProps {
  icon: any;
  label: string;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

function SidebarItem({
  icon,
  label,
  isActive,
  badge,
  onClick,
}: SidebarItemProps) {
  return (
    <Button
      variant="ghost"
      w="full"
      justifyContent="flex-start"
      px={3}
      py={2}
      h="auto"
      fontWeight="medium"
      fontSize="sm"
      color={isActive ? "primary.600" : { base: "gray.700", _dark: "gray.300" }}
      bg={isActive ? "primary.50" : "transparent"}
      _hover={{
        bg: isActive ? "primary.50" : { base: "gray.100", _dark: "gray.700" },
      }}
      onClick={onClick}
    >
      <HStack spacing={3} w="full">
        <Icon as={icon} boxSize={4} />
        <Text flex={1} textAlign="left">
          {label}
        </Text>
        {badge && (
          <Badge colorScheme="gray" variant="subtle" fontSize="xs" px={2}>
            {badge}
          </Badge>
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
  const [projects, setProjects] = useState<ProjectListResponse["projects"]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
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
    { icon: FiFolder, label: "Tasks", path: "/tasks", badge: undefined },
    {
      icon: FiCalendar,
      label: "Calendar",
      path: "/calendar",
      badge: undefined,
    },
    { icon: FiFolder, label: "Projects", path: "/projects", badge: undefined },
    {
      icon: FiFolder,
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

  const SidebarContent = () => (
    <Box
      w={{ base: "full", lg: "280px" }}
      bg={{ base: "white", _dark: "gray.800" }}
      borderRight={{ base: "none", lg: "1px" }}
      borderRightColor={{ base: "gray.200", _dark: "gray.700" }}
      h="100vh"
      position={{ base: "relative", lg: "sticky" }}
      top="0"
      overflowY="auto"
      display="flex"
      flexDirection="column"
    >
      {/* Logo/Brand */}
      <HStack justify="space-between" p={6}>
        <Text fontSize="xl" fontWeight="bold">
          TaskHub
        </Text>
        <IconButton
          aria-label="Toggle theme"
          icon={<Icon as={colorMode === "light" ? FiMoon : FiSun} />}
          size="sm"
          variant="ghost"
          onClick={toggleColorMode}
        />
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
            onClick={() => navigate(item.path)}
          />
        ))}
      </VStack>

      <Divider my={4} />

      {/* Projects Section */}
      <Box px={4}>
        <HStack justify="space-between" mb={3}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={{ base: "gray.600", _dark: "gray.400" }}
          >
            Projects
          </Text>
          <Button
            size="xs"
            variant="ghost"
            leftIcon={<FiPlus />}
            onClick={onProjectModalOpen}
          >
            New
          </Button>
        </HStack>

        <VStack spacing={2} align="stretch">
          {isLoadingProjects ? (
            <Text fontSize="sm" color="gray.500" px={3} py={2}>
              Loading projects...
            </Text>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <HStack
                key={project.id}
                px={3}
                py={2}
                spacing={3}
                cursor="pointer"
                _hover={{ bg: { base: "gray.50", _dark: "gray.700" } }}
                borderRadius="md"
                onClick={() => navigate(`/projects/${project.id}`)}
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
                  color={{ base: "gray.700", _dark: "gray.300" }}
                  noOfLines={1}
                >
                  {project.name}
                </Text>
              </HStack>
            ))
          ) : (
            <Text fontSize="sm" color="gray.500" px={3} py={2}>
              No projects yet
            </Text>
          )}
        </VStack>
      </Box>

      {/* User Profile Section */}
      <Box
        mt="auto"
        p={4}
        borderTop="1px"
        borderTopColor={{ base: "gray.100", _dark: "gray.700" }}
      >
        <Menu placement="top-start">
          <MenuButton
            as={Button}
            variant="ghost"
            w="full"
            h="auto"
            p={3}
            justifyContent="flex-start"
          >
            <HStack spacing={3}>
              <Avatar
                size="sm"
                name={user?.full_name || user?.email || "User"}
                src={user?.avatar_url}
              />
              <Box flex={1} textAlign="left">
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                  {user?.full_name || "User"}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {user?.email}
                </Text>
              </Box>
            </HStack>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiUser />} onClick={() => navigate("/profile")}>
              Profile
            </MenuItem>
            <MenuItem
              icon={<FiSettings />}
              onClick={() => navigate("/settings")}
            >
              Settings
            </MenuItem>
            <MenuItem 
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />} 
              onClick={toggleColorMode}
            >
              {colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </MenuItem>
            <MenuItem icon={<FiHelpCircle />} onClick={() => navigate("/help")}>
              Help & Support
            </MenuItem>
            <MenuDivider />
            <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
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
            <DrawerCloseButton />
            <SidebarContent />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Show static sidebar
  return <SidebarContent />;
}
