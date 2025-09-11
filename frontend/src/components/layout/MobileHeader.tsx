import {
  Box,
  Flex,
  IconButton,
  Text,
  useColorMode,
  Icon,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
} from "@chakra-ui/react";
import { FiMenu, FiSun, FiMoon, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      display={{ base: "block", lg: "none" }}
      position="sticky"
      top="0"
      zIndex="sticky"
      bg={{ base: "white", _dark: "gray.800" }}
      borderBottom="1px"
      borderBottomColor={{ base: "gray.200", _dark: "gray.700" }}
      px={4}
      py={3}
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={3}>
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            onClick={onOpenSidebar}
            variant="ghost"
            size="md"
          />
          <Text fontSize="lg" fontWeight="bold">
            TaskHub
          </Text>
        </HStack>

        <HStack spacing={2}>
          <IconButton
            aria-label="Toggle theme"
            icon={<Icon as={colorMode === "light" ? FiMoon : FiSun} />}
            size="sm"
            variant="ghost"
            onClick={toggleColorMode}
          />
          
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              aria-label="User menu"
              variant="ghost"
              size="sm"
            >
              <Avatar
                size="sm"
                name={user?.full_name || user?.email || "User"}
                src={user?.avatar_url}
              />
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />} onClick={() => navigate("/profile")}>
                Profile
              </MenuItem>
              <MenuItem icon={<FiSettings />} onClick={() => navigate("/settings")}>
                Settings
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
}