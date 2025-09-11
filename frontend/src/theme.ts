import { extendTheme, type ThemeConfig } from "@chakra-ui/react"

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

export const theme = extendTheme({
  config,
  colors: {
    // Monday.com inspired color palette
    primary: {
      50: "#f7f4ff",
      100: "#efe7ff", 
      200: "#dfd3ff",
      300: "#c7b2ff",
      400: "#a685ff",
      500: "#8454ff", // Primary purple
      600: "#7c3aed",
      700: "#6d28d9",
      800: "#5b21b6",
      900: "#4c1d95"
    },
    brand: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd", 
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // Monday.com blue
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e"
    },
    // Status colors for consistency
    status: {
      todo: {
        50: "#f8fafc",
        100: "#f1f5f9",
        500: "#64748b",
        600: "#475569"
      },
      progress: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#3b82f6",
        600: "#2563eb"
      },
      review: {
        50: "#fff7ed",
        100: "#ffedd5",
        500: "#f97316",
        600: "#ea580c"
      },
      done: {
        50: "#f0fdf4",
        100: "#dcfce7",
        500: "#22c55e",
        600: "#16a34a"
      }
    },
    // Dark mode specific colors
    dark: {
      bg: {
        primary: "#0d1117", // Very dark background
        secondary: "#161b22", // Slightly lighter
        tertiary: "#21262d", // Card backgrounds
        hover: "#30363d" // Hover states
      }
    }
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif"
  },
  styles: {
    global: ({ colorMode }) => ({
      body: {
        bg: colorMode === 'dark' ? 'dark.bg.primary' : 'gray.50',
        color: colorMode === 'dark' ? 'gray.100' : 'gray.900',
      },
      "*::placeholder": {
        color: colorMode === 'dark' ? 'gray.500' : 'gray.400',
      }
    })
  },
  components: {
    Card: {
      baseStyle: ({ colorMode }) => ({
        container: {
          bg: colorMode === 'dark' ? 'dark.bg.tertiary' : 'white',
          borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.100',
          boxShadow: colorMode === 'dark' ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : 'sm',
          borderRadius: 'xl',
          transition: 'all 0.2s ease',
          _hover: {
            bg: colorMode === 'dark' ? 'dark.bg.hover' : 'gray.50',
            transform: 'translateY(-2px)',
            boxShadow: colorMode === 'dark' ? '0 4px 12px 0 rgba(0, 0, 0, 0.4)' : 'lg'
          }
        }
      }),
      variants: {
        elevated: ({ colorMode }) => ({
          container: {
            bg: colorMode === 'dark' ? 'dark.bg.tertiary' : 'white',
            borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.100',
            boxShadow: colorMode === 'dark' ? '0 4px 12px 0 rgba(0, 0, 0, 0.4)' : 'lg',
            borderRadius: 'xl',
            border: '1px solid',
            _hover: {
              transform: 'translateY(-4px)',
              boxShadow: colorMode === 'dark' ? '0 8px 24px 0 rgba(0, 0, 0, 0.5)' : 'xl'
            }
          }
        }),
        interactive: ({ colorMode }) => ({
          container: {
            bg: colorMode === 'dark' ? 'dark.bg.tertiary' : 'white',
            borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.100',
            boxShadow: colorMode === 'dark' ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : 'sm',
            borderRadius: 'xl',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            _hover: {
              bg: colorMode === 'dark' ? 'dark.bg.hover' : 'gray.50',
              transform: 'translateY(-2px)',
              boxShadow: colorMode === 'dark' ? '0 4px 12px 0 rgba(0, 0, 0, 0.4)' : 'lg',
              borderColor: 'primary.300'
            }
          }
        })
      }
    },
    Box: {
      baseStyle: ({ colorMode }) => ({
        _dark: {
          bg: 'dark.bg.tertiary',
          borderColor: 'gray.600'
        }
      })
    },
    Modal: {
      baseStyle: ({ colorMode }) => ({
        dialog: {
          bg: colorMode === 'dark' ? 'dark.bg.secondary' : 'white',
        },
        header: {
          color: colorMode === 'dark' ? 'gray.100' : 'gray.900',
        },
        body: {
          color: colorMode === 'dark' ? 'gray.200' : 'gray.700',
        }
      })
    },
    Input: {
      baseStyle: ({ colorMode }) => ({
        field: {
          bg: colorMode === 'dark' ? 'dark.bg.primary' : 'white',
          borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.200',
          _hover: {
            borderColor: colorMode === 'dark' ? 'gray.500' : 'gray.400',
          },
          _focus: {
            borderColor: 'primary.500',
            boxShadow: colorMode === 'dark' ? '0 0 0 1px rgba(132, 84, 255, 0.3)' : '0 0 0 1px rgba(132, 84, 255, 0.2)',
          }
        }
      })
    },
    Select: {
      baseStyle: ({ colorMode }) => ({
        field: {
          bg: colorMode === 'dark' ? 'dark.bg.primary' : 'white',
          borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.200',
        }
      })
    },
    Button: {
      baseStyle: ({ colorMode }) => ({
        borderRadius: 'lg',
        fontWeight: 'medium',
        transition: 'all 0.2s ease',
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'lg'
        },
        _active: {
          transform: 'translateY(0)',
          boxShadow: 'md'
        }
      }),
      variants: {
        solid: ({ colorMode, colorScheme }) => ({
          bg: colorScheme === 'primary' ? 'primary.500' : undefined,
          color: 'white',
          _hover: {
            bg: colorScheme === 'primary' ? 'primary.600' : undefined,
            boxShadow: 'xl'
          }
        }),
        ghost: ({ colorMode }) => ({
          color: colorMode === 'dark' ? 'gray.300' : 'gray.700',
          _hover: {
            bg: colorMode === 'dark' ? 'dark.bg.hover' : 'gray.100',
            transform: 'translateY(-1px)'
          }
        }),
        outline: ({ colorMode }) => ({
          borderColor: colorMode === 'dark' ? 'gray.600' : 'gray.200',
          _hover: {
            borderColor: 'primary.500',
            bg: colorMode === 'dark' ? 'dark.bg.hover' : 'primary.50',
            transform: 'translateY(-1px)'
          }
        })
      }
    },
    Stat: {
      baseStyle: ({ colorMode }) => ({
        container: {
          bg: colorMode === 'dark' ? 'dark.bg.tertiary' : 'white',
          borderRadius: 'lg',
          p: 4,
          boxShadow: colorMode === 'dark' ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : 'sm',
        },
        label: {
          color: colorMode === 'dark' ? 'gray.400' : 'gray.600',
        },
        number: {
          color: colorMode === 'dark' ? 'gray.100' : 'gray.900',
        }
      })
    }
  }
})