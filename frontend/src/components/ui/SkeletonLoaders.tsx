import {
  Box,
  VStack,
  HStack,
  Grid,
  GridItem,
  useColorModeValue,
} from "@chakra-ui/react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonProps {
  count?: number;
  height?: number | string;
  width?: number | string;
}

export function TaskCardSkeleton() {
  const bgColor = useColorModeValue("#f0f0f0", "#2a2a2a");
  const highlightColor = useColorModeValue("#e0e0e0", "#3a3a3a");

  return (
    <SkeletonTheme baseColor={bgColor} highlightColor={highlightColor}>
      <Box
        p={4}
        borderRadius="lg"
        border="1px solid"
        borderColor={useColorModeValue("gray.200", "dark.border.subtle")}
        bg={useColorModeValue("white", "dark.bg.tertiary")}
      >
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Skeleton width="60%" height={20} />
            <Skeleton width={60} height={20} borderRadius={10} />
          </HStack>
          <Skeleton count={2} height={15} />
          <HStack spacing={2}>
            <Skeleton width={80} height={25} borderRadius={5} />
            <Skeleton width={80} height={25} borderRadius={5} />
            <Skeleton width={100} height={25} borderRadius={5} />
          </HStack>
        </VStack>
      </Box>
    </SkeletonTheme>
  );
}

export function ProjectCardSkeleton() {
  const bgColor = useColorModeValue("#f0f0f0", "#2a2a2a");
  const highlightColor = useColorModeValue("#e0e0e0", "#3a3a3a");

  return (
    <SkeletonTheme baseColor={bgColor} highlightColor={highlightColor}>
      <Box
        p={6}
        borderRadius="xl"
        border="1px solid"
        borderColor={useColorModeValue("gray.200", "dark.border.subtle")}
        bg={useColorModeValue("white", "dark.bg.tertiary")}
        h="200px"
      >
        <VStack align="stretch" spacing={4} h="full">
          <HStack>
            <Skeleton circle width={12} height={12} />
            <Skeleton width="70%" height={24} />
          </HStack>
          <Skeleton count={2} height={15} />
          <Box flex={1} />
          <HStack justify="space-between">
            <Skeleton width={100} height={20} />
            <Skeleton width={60} height={20} />
          </HStack>
          <Skeleton height={8} borderRadius={4} />
        </VStack>
      </Box>
    </SkeletonTheme>
  );
}

export function CategoryCardSkeleton() {
  const bgColor = useColorModeValue("#f0f0f0", "#2a2a2a");
  const highlightColor = useColorModeValue("#e0e0e0", "#3a3a3a");

  return (
    <SkeletonTheme baseColor={bgColor} highlightColor={highlightColor}>
      <Box
        p={6}
        borderRadius="xl"
        border="1px solid"
        borderColor={useColorModeValue("gray.200", "dark.border.subtle")}
        bg={useColorModeValue("white", "dark.bg.tertiary")}
        h="180px"
      >
        <VStack align="stretch" spacing={4}>
          <HStack>
            <Skeleton circle width={10} height={10} />
            <Skeleton width="60%" height={20} />
          </HStack>
          <Skeleton count={2} height={14} />
          <HStack justify="space-between" mt="auto">
            <Skeleton width={80} height={20} />
            <Skeleton width={60} height={20} />
          </HStack>
        </VStack>
      </Box>
    </SkeletonTheme>
  );
}

export function ListItemSkeleton() {
  const bgColor = useColorModeValue("#f0f0f0", "#2a2a2a");
  const highlightColor = useColorModeValue("#e0e0e0", "#3a3a3a");

  return (
    <SkeletonTheme baseColor={bgColor} highlightColor={highlightColor}>
      <Box
        p={4}
        borderRadius="lg"
        border="1px solid"
        borderColor={useColorModeValue("gray.200", "dark.border.subtle")}
        bg={useColorModeValue("white", "dark.bg.tertiary")}
      >
        <HStack spacing={4}>
          <Skeleton circle width={40} height={40} />
          <VStack align="stretch" flex={1} spacing={2}>
            <Skeleton width="40%" height={18} />
            <Skeleton width="60%" height={14} />
          </VStack>
          <HStack spacing={2}>
            <Skeleton width={80} height={25} borderRadius={5} />
            <Skeleton width={80} height={25} borderRadius={5} />
          </HStack>
        </HStack>
      </Box>
    </SkeletonTheme>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const bgColor = useColorModeValue("#f0f0f0", "#2a2a2a");
  const highlightColor = useColorModeValue("#e0e0e0", "#3a3a3a");

  return (
    <SkeletonTheme baseColor={bgColor} highlightColor={highlightColor}>
      <VStack align="stretch" spacing={2}>
        {/* Header */}
        <Box
          p={3}
          borderBottom="2px solid"
          borderColor={useColorModeValue("gray.200", "dark.border.subtle")}
        >
          <HStack spacing={4}>
            <Skeleton width="20%" height={18} />
            <Skeleton width="30%" height={18} />
            <Skeleton width="15%" height={18} />
            <Skeleton width="15%" height={18} />
            <Skeleton width="20%" height={18} />
          </HStack>
        </Box>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <Box
            key={i}
            p={3}
            borderBottom="1px solid"
            borderColor={useColorModeValue("gray.100", "dark.border.subtle")}
          >
            <HStack spacing={4}>
              <Skeleton width="20%" height={16} />
              <Skeleton width="30%" height={16} />
              <Skeleton width="15%" height={16} />
              <Skeleton width="15%" height={16} />
              <Skeleton width="20%" height={16} />
            </HStack>
          </Box>
        ))}
      </VStack>
    </SkeletonTheme>
  );
}

export function DetailPanelSkeleton() {
  const bgColor = useColorModeValue("#f0f0f0", "#2a2a2a");
  const highlightColor = useColorModeValue("#e0e0e0", "#3a3a3a");

  return (
    <SkeletonTheme baseColor={bgColor} highlightColor={highlightColor}>
      <VStack align="stretch" spacing={6} p={6}>
        {/* Title */}
        <Skeleton height={32} width="80%" />
        
        {/* Meta info */}
        <HStack spacing={4}>
          <Skeleton width={100} height={25} borderRadius={5} />
          <Skeleton width={100} height={25} borderRadius={5} />
          <Skeleton width={100} height={25} borderRadius={5} />
        </HStack>

        {/* Description */}
        <VStack align="stretch" spacing={2}>
          <Skeleton height={16} width="30%" />
          <Skeleton count={3} height={14} />
        </VStack>

        {/* Details */}
        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
          {Array.from({ length: 6 }).map((_, i) => (
            <GridItem key={i}>
              <VStack align="stretch" spacing={1}>
                <Skeleton height={12} width="40%" />
                <Skeleton height={16} width="60%" />
              </VStack>
            </GridItem>
          ))}
        </Grid>

        {/* Actions */}
        <HStack spacing={3}>
          <Skeleton width={100} height={40} borderRadius={8} />
          <Skeleton width={100} height={40} borderRadius={8} />
          <Skeleton width={100} height={40} borderRadius={8} />
        </HStack>
      </VStack>
    </SkeletonTheme>
  );
}

export function GridSkeleton({ 
  items = 6, 
  columns = 3,
  component: Component = ProjectCardSkeleton 
}: { 
  items?: number; 
  columns?: number;
  component?: React.ComponentType;
}) {
  return (
    <Grid
      templateColumns={{
        base: "1fr",
        md: `repeat(2, 1fr)`,
        lg: `repeat(${columns}, 1fr)`,
      }}
      gap={6}
    >
      {Array.from({ length: items }).map((_, i) => (
        <GridItem key={i}>
          <Component />
        </GridItem>
      ))}
    </Grid>
  );
}

export function ListSkeleton({ 
  items = 5,
  component: Component = ListItemSkeleton
}: { 
  items?: number;
  component?: React.ComponentType;
}) {
  return (
    <VStack align="stretch" spacing={3}>
      {Array.from({ length: items }).map((_, i) => (
        <Component key={i} />
      ))}
    </VStack>
  );
}