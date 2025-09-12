import React from 'react';
import { Box, Skeleton, SkeletonText, SkeletonCircle, Stack, HStack, VStack, Card, CardBody } from '@chakra-ui/react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'grid' | 'table' | 'detail' | 'stats' | 'chart';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Skeleton height="20px" width="60%" />
                  <Skeleton height="20px" width="80px" borderRadius="full" />
                </HStack>
                <SkeletonText mt="4" noOfLines={2} spacing="4" />
                <HStack spacing={2}>
                  <Skeleton height="24px" width="60px" borderRadius="md" />
                  <Skeleton height="24px" width="80px" borderRadius="md" />
                </HStack>
                <HStack justify="space-between" mt={2}>
                  <HStack spacing={2}>
                    <SkeletonCircle size="6" />
                    <Skeleton height="16px" width="100px" />
                  </HStack>
                  <Skeleton height="16px" width="80px" />
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        );

      case 'list':
        return (
          <Box p={4} borderWidth="1px" borderRadius="lg">
            <HStack spacing={4}>
              <Skeleton height="20px" width="20px" />
              <VStack align="stretch" flex={1} spacing={2}>
                <Skeleton height="20px" width="70%" />
                <Skeleton height="16px" width="40%" />
              </VStack>
              <Skeleton height="24px" width="80px" borderRadius="full" />
            </HStack>
          </Box>
        );

      case 'grid':
        return (
          <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
            {Array.from({ length: count }).map((_, i) => (
              <Card key={i}>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Skeleton height="120px" borderRadius="md" />
                    <Skeleton height="24px" />
                    <SkeletonText noOfLines={2} />
                    <HStack>
                      <Skeleton height="20px" width="60px" borderRadius="full" />
                      <Skeleton height="20px" width="60px" borderRadius="full" />
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Box>
        );

      case 'table':
        return (
          <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
            <Box p={4} bg="gray.50" _dark={{ bg: 'gray.800' }}>
              <HStack spacing={4}>
                <Skeleton height="20px" width="40px" />
                <Skeleton height="20px" flex={1} />
                <Skeleton height="20px" width="100px" />
                <Skeleton height="20px" width="100px" />
                <Skeleton height="20px" width="80px" />
              </HStack>
            </Box>
            {Array.from({ length: count }).map((_, i) => (
              <Box key={i} p={4} borderTopWidth="1px">
                <HStack spacing={4}>
                  <Skeleton height="20px" width="40px" />
                  <Skeleton height="20px" flex={1} />
                  <Skeleton height="20px" width="100px" borderRadius="full" />
                  <Skeleton height="20px" width="100px" />
                  <Skeleton height="20px" width="80px" />
                </HStack>
              </Box>
            ))}
          </Box>
        );

      case 'detail':
        return (
          <VStack align="stretch" spacing={6}>
            <Box>
              <Skeleton height="32px" width="60%" mb={4} />
              <SkeletonText noOfLines={3} spacing={4} />
            </Box>
            <HStack spacing={4}>
              <Box flex={1}>
                <Skeleton height="16px" width="80px" mb={2} />
                <Skeleton height="32px" borderRadius="md" />
              </Box>
              <Box flex={1}>
                <Skeleton height="16px" width="80px" mb={2} />
                <Skeleton height="32px" borderRadius="md" />
              </Box>
            </HStack>
            <Box>
              <Skeleton height="16px" width="100px" mb={2} />
              <SkeletonText noOfLines={4} spacing={3} />
            </Box>
            <HStack spacing={2}>
              <SkeletonCircle size="10" />
              <VStack align="start" flex={1}>
                <Skeleton height="16px" width="120px" />
                <Skeleton height="14px" width="80px" />
              </VStack>
            </HStack>
          </VStack>
        );

      case 'stats':
        return (
          <HStack spacing={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} flex={1} p={4} borderWidth="1px" borderRadius="lg">
                <Skeleton height="14px" width="80px" mb={2} />
                <Skeleton height="32px" width="60%" mb={1} />
                <Skeleton height="14px" width="100px" />
              </Box>
            ))}
          </HStack>
        );

      case 'chart':
        return (
          <Box p={4} borderWidth="1px" borderRadius="lg">
            <Skeleton height="24px" width="200px" mb={4} />
            <Skeleton height="300px" borderRadius="md" />
            <HStack spacing={2} mt={4} justify="center">
              {Array.from({ length: 4 }).map((_, i) => (
                <HStack key={i}>
                  <Skeleton height="12px" width="12px" borderRadius="full" />
                  <Skeleton height="12px" width="60px" />
                </HStack>
              ))}
            </HStack>
          </Box>
        );

      default:
        return null;
    }
  };

  if (variant === 'grid') {
    return renderSkeleton();
  }

  return (
    <Stack spacing={4}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i}>{renderSkeleton()}</Box>
      ))}
    </Stack>
  );
};

export const TaskCardSkeleton: React.FC = () => (
  <Card>
    <CardBody>
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Skeleton height="20px" width="60%" />
          <Skeleton height="20px" width="80px" borderRadius="full" />
        </HStack>
        <SkeletonText mt="4" noOfLines={2} spacing="4" />
        <HStack spacing={2}>
          <Skeleton height="24px" width="60px" borderRadius="md" />
          <Skeleton height="24px" width="80px" borderRadius="md" />
        </HStack>
        <HStack justify="space-between" mt={2}>
          <HStack spacing={2}>
            <SkeletonCircle size="6" />
            <Skeleton height="16px" width="100px" />
          </HStack>
          <Skeleton height="16px" width="80px" />
        </HStack>
      </VStack>
    </CardBody>
  </Card>
);

export const ProjectCardSkeleton: React.FC = () => (
  <Card>
    <CardBody>
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Skeleton height="24px" width="150px" />
            <Skeleton height="16px" width="200px" />
          </VStack>
          <Skeleton height="24px" width="80px" borderRadius="full" />
        </HStack>
        <Box>
          <Skeleton height="14px" width="60px" mb={2} />
          <Skeleton height="8px" borderRadius="full" />
        </Box>
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Skeleton height="16px" width="16px" />
            <Skeleton height="16px" width="60px" />
          </HStack>
          <HStack spacing={-2}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCircle key={i} size="8" />
            ))}
          </HStack>
        </HStack>
      </VStack>
    </CardBody>
  </Card>
);

export const DashboardStatsSkeleton: React.FC = () => (
  <HStack spacing={6} w="full">
    {Array.from({ length: 4 }).map((_, i) => (
      <Box key={i} flex={1} p={6} borderWidth="1px" borderRadius="xl" bg="white" _dark={{ bg: 'dark.bg.tertiary' }}>
        <VStack align="start" spacing={3}>
          <Skeleton height="14px" width="100px" />
          <Skeleton height="36px" width="80px" />
          <Skeleton height="12px" width="120px" />
        </VStack>
      </Box>
    ))}
  </HStack>
);

export const CalendarSkeleton: React.FC = () => (
  <Box>
    <HStack justify="space-between" mb={4}>
      <Skeleton height="32px" width="200px" />
      <HStack>
        <Skeleton height="40px" width="100px" borderRadius="md" />
        <Skeleton height="40px" width="120px" borderRadius="md" />
      </HStack>
    </HStack>
    <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
      {Array.from({ length: 35 }).map((_, i) => (
        <Box key={i} h="100px" p={2} borderWidth="1px" borderRadius="md">
          <Skeleton height="16px" width="24px" mb={2} />
          {i % 3 === 0 && <Skeleton height="24px" borderRadius="md" mt={2} />}
          {i % 5 === 0 && <Skeleton height="24px" borderRadius="md" mt={1} />}
        </Box>
      ))}
    </Box>
  </Box>
);