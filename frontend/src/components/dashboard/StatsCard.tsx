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
// Define IconType interface locally since it's not exported from react-icons
type IconType = React.ComponentType<{
  size?: string | number;
  color?: string;
  className?: string;
}>;

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
  const cardBg = useColorModeValue("white", "dark.bg.tertiary");
  const textColor = useColorModeValue("gray.700", "gray.100");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);

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
        border="none"
        boxShadow="none"
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick}
        _hover={onClick ? { 
          transform: "translateY(-2px)",
          boxShadow: "lg"
        } : {}}
        transition="all 0.3s"
        background={useColorModeValue(
          "white",
          "linear-gradient(135deg, #1c2128 0%, #262c36 100%)"
        )}
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
                      color={
                        changeType === "increase" ? "green.500" : "red.500"
                      }
                      fontWeight="medium"
                    >
                      {changeType === "increase" ? "+" : "-"}
                      {Math.abs(change)}%
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
              bg={iconBg}
              borderRadius="lg"
              color={iconColor}
              opacity={0.9}
            >
              <Icon as={icon} boxSize={6} />
            </Box>
          </Flex>
        </Box>
      </Box>
    </MotionBox>
  );
}
