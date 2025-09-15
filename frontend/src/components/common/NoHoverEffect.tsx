import { Box, BoxProps } from "@chakra-ui/react";
import React from "react";

interface NoHoverEffectProps extends BoxProps {
  children: React.ReactNode;
}

export function NoHoverEffect({ children, ...props }: NoHoverEffectProps) {
  return (
    <Box
      {...props}
      _hover={{
        ...props._hover,
        transform: "none",
        translateY: 0,
      }}
      transition="none"
    >
      {children}
    </Box>
  );
}