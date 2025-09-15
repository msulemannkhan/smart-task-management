import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors = {
  primary: {
    50: "#e6f3ff",
    100: "#b3d9ff",
    200: "#80bfff",
    300: "#4da5ff",
    400: "#1a8aff",
    500: "#006ce5",
    600: "#0054b3",
    700: "#003c80",
    800: "#00254d",
    900: "#00142b",
  },
  dark: {
    bg: {
      primary: "#0a0e1a",
      secondary: "#141922",
      tertiary: "#1c2333",
      hover: "#252c3d",
    },
    border: {
      primary: "#2d3447",
      secondary: "#3a4255",
    },
  },
};

const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === "dark" ? "dark.bg.primary" : "gray.50",
      color: props.colorMode === "dark" ? "gray.100" : "gray.800",
    },
    "*::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "*::-webkit-scrollbar-track": {
      background: props.colorMode === "dark" ? "dark.bg.secondary" : "gray.100",
    },
    "*::-webkit-scrollbar-thumb": {
      background: props.colorMode === "dark" ? "gray.600" : "gray.400",
      borderRadius: "4px",
    },
    "*::-webkit-scrollbar-thumb:hover": {
      background: props.colorMode === "dark" ? "gray.500" : "gray.500",
    },
  }),
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: "medium",
      borderRadius: "lg",
    },
    defaultProps: {
      colorScheme: "primary",
    },
  },
  Card: {
    baseStyle: (props: any) => ({
      container: {
        bg: props.colorMode === "dark" ? "dark.bg.tertiary" : "white",
        borderColor: props.colorMode === "dark" ? "dark.border.primary" : "gray.200",
        borderWidth: "1px",
        borderRadius: "xl",
        boxShadow: "sm",
      },
    }),
  },
  Modal: {
    baseStyle: (props: any) => ({
      dialog: {
        bg: props.colorMode === "dark" ? "dark.bg.tertiary" : "white",
        borderRadius: "xl",
      },
      overlay: {
        backdropFilter: "blur(4px)",
      },
    }),
  },
  Menu: {
    baseStyle: (props: any) => ({
      list: {
        bg: props.colorMode === "dark" ? "dark.bg.tertiary" : "white",
        borderColor: props.colorMode === "dark" ? "dark.border.primary" : "gray.200",
        borderWidth: "1px",
        borderRadius: "lg",
        boxShadow: "lg",
      },
      item: {
        bg: props.colorMode === "dark" ? "dark.bg.tertiary" : "white",
        _hover: {
          bg: props.colorMode === "dark" ? "dark.bg.hover" : "gray.50",
        },
        _focus: {
          bg: props.colorMode === "dark" ? "dark.bg.hover" : "gray.50",
        },
      },
    }),
  },
  Input: {
    defaultProps: {
      focusBorderColor: "primary.500",
    },
    baseStyle: (props: any) => ({
      field: {
        borderRadius: "lg",
        bg: props.colorMode === "dark" ? "dark.bg.secondary" : "white",
        borderColor: props.colorMode === "dark" ? "dark.border.primary" : "gray.300",
        _hover: {
          borderColor: props.colorMode === "dark" ? "dark.border.secondary" : "gray.400",
        },
      },
    }),
  },
  Select: {
    defaultProps: {
      focusBorderColor: "primary.500",
    },
    baseStyle: (props: any) => ({
      field: {
        borderRadius: "lg",
        bg: props.colorMode === "dark" ? "dark.bg.secondary" : "white",
        borderColor: props.colorMode === "dark" ? "dark.border.primary" : "gray.300",
        _hover: {
          borderColor: props.colorMode === "dark" ? "dark.border.secondary" : "gray.400",
        },
      },
    }),
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: "primary.500",
    },
    baseStyle: (props: any) => ({
      borderRadius: "lg",
      bg: props.colorMode === "dark" ? "dark.bg.secondary" : "white",
      borderColor: props.colorMode === "dark" ? "dark.border.primary" : "gray.300",
      _hover: {
        borderColor: props.colorMode === "dark" ? "dark.border.secondary" : "gray.400",
      },
    }),
  },
  Badge: {
    baseStyle: {
      borderRadius: "md",
      px: 2,
      py: 1,
      fontSize: "xs",
      fontWeight: "medium",
    },
  },
  Drawer: {
    baseStyle: (props: any) => ({
      dialog: {
        bg: props.colorMode === "dark" ? "dark.bg.secondary" : "white",
      },
    }),
  },
  Popover: {
    baseStyle: (props: any) => ({
      content: {
        bg: props.colorMode === "dark" ? "dark.bg.tertiary" : "white",
        borderColor: props.colorMode === "dark" ? "dark.border.primary" : "gray.200",
        borderWidth: "1px",
        borderRadius: "lg",
        boxShadow: "lg",
      },
    }),
  },
  Tooltip: {
    baseStyle: (props: any) => ({
      bg: props.colorMode === "dark" ? "gray.700" : "gray.800",
      color: "white",
      borderRadius: "md",
      px: 3,
      py: 2,
      fontSize: "sm",
    }),
  },
};

export const theme = extendTheme({
  config,
  colors,
  styles,
  components,
  fonts: {
    body: "Inter, system-ui, sans-serif",
    heading: "Inter, system-ui, sans-serif",
  },
  shadows: {
    outline: "0 0 0 3px rgba(0, 108, 229, 0.4)",
  },
});