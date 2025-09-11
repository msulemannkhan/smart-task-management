import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Skeleton,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { IconType } from "react-icons";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: IconType;
  change?: number;
  changeType?: "increase" | "decrease";
  colorScheme: string;
  isLoading?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

const MotionBox = motion(Box);

export function StatsCard({
  title,
  value,
  icon,
  change,
  changeType,
  colorScheme,
  isLoading = false,
  subtitle,
  onClick,
}: StatsCardProps) {
  const bgGradient = useColorModeValue(
    `linear(to-br, ${colorScheme}.400, ${colorScheme}.600)`,
    `linear(to-br, ${colorScheme}.500, ${colorScheme}.700)`
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  return (
    <MotionBox
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        position="relative"
        bg={cardBg}
        borderRadius="xl"
        overflow="hidden"
        shadow="lg"
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick}
        _hover={onClick ? { shadow: "xl" } : {}}
        transition="all 0.3s"
      >
        {/* Gradient Background */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="4px"
          bgGradient={bgGradient}
        />
        
        <Box p={6}>
          <Flex justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing={3} flex={1}>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={textColor}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {title}
              </Text>
              
              {isLoading ? (
                <Skeleton height="36px" width="100px" />
              ) : (
                <HStack spacing={2} align="baseline">
                  <Text
                    fontSize="3xl"
                    fontWeight="bold"
                    color={textColor}
                    lineHeight="1"
                  >
                    {value}
                  </Text>
                  {change !== undefined && (
                    <Text
                      fontSize="sm"
                      color={changeType === "increase" ? "green.500" : "red.500"}
                      fontWeight="medium"
                    >
                      {changeType === "increase" ? "+" : "-"}{Math.abs(change)}%
                    </Text>
                  )}
                </HStack>
              )}
              
              {subtitle && (
                <Text fontSize="xs" color={subtitleColor}>
                  {subtitle}
                </Text>
              )}
            </VStack>
            
            <Box
              p={3}
              bg={`${colorScheme}.50`}
              borderRadius="lg"
              color={`${colorScheme}.500`}
            >
              <Icon as={icon} boxSize={6} />
            </Box>
          </Flex>
        </Box>
      </Box>
    </MotionBox>
  );
}