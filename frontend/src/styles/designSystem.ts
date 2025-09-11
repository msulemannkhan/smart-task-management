// Unified Design System for Smart Task Management
// NO GRADIENTS - Simple, modern, functional design

export const designSystem = {
  // Consistent spacing scale
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
    xxxl: '4rem',     // 64px
  },

  // Border radius for consistency
  radius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',   // Full circle
  },

  // Box shadows (no gradients, just clean shadows)
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    dark: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    }
  },

  // Consistent colors (flat colors, no gradients)
  colors: {
    // Primary brand colors
    primary: {
      light: '#8454ff',
      DEFAULT: '#7c3aed',
      dark: '#6d28d9',
    },
    // Secondary colors
    secondary: {
      light: '#38bdf8',
      DEFAULT: '#0ea5e9',
      dark: '#0284c7',
    },
    // Status colors for tasks
    status: {
      todo: '#64748b',
      inProgress: '#3b82f6',
      review: '#f97316',
      done: '#22c55e',
      archived: '#6b7280',
    },
    // Category colors (flat, vibrant)
    categories: [
      '#ef4444', // red
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#14b8a6', // teal
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#6b7280', // gray
    ],
    // UI colors
    ui: {
      background: {
        light: '#f8fafc',
        DEFAULT: '#ffffff',
        dark: '#0d1117',
      },
      surface: {
        light: '#ffffff',
        DEFAULT: '#f8fafc',
        dark: '#161b22',
      },
      border: {
        light: '#e2e8f0',
        DEFAULT: '#cbd5e1',
        dark: '#30363d',
      },
      text: {
        primary: {
          light: '#0f172a',
          dark: '#f1f5f9',
        },
        secondary: {
          light: '#475569',
          dark: '#94a3b8',
        },
        muted: {
          light: '#94a3b8',
          dark: '#64748b',
        }
      }
    }
  },

  // Typography
  typography: {
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Animation transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
    toast: 70,
  },

  // Layout constants
  layout: {
    sidebarWidth: '280px',
    headerHeight: '64px',
    containerMaxWidth: '1280px',
    taskCardMinHeight: '120px',
    taskCardMaxWidth: '100%',
  }
};

// Helper function to get consistent card styles
export const getCardStyle = (colorMode: 'light' | 'dark') => ({
  backgroundColor: colorMode === 'dark' ? designSystem.colors.ui.surface.dark : designSystem.colors.ui.surface.light,
  borderColor: colorMode === 'dark' ? designSystem.colors.ui.border.dark : designSystem.colors.ui.border.light,
  boxShadow: colorMode === 'dark' ? designSystem.shadows.dark.md : designSystem.shadows.md,
  borderRadius: designSystem.radius.lg,
  padding: designSystem.spacing.lg,
  transition: designSystem.transitions.normal,
});

// Helper function for consistent button styles
export const getButtonStyle = (variant: 'primary' | 'secondary' | 'ghost', colorMode: 'light' | 'dark') => {
  const styles = {
    primary: {
      backgroundColor: designSystem.colors.primary.DEFAULT,
      color: '#ffffff',
      border: 'none',
      '&:hover': {
        backgroundColor: designSystem.colors.primary.dark,
      }
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colorMode === 'dark' ? designSystem.colors.ui.text.primary.dark : designSystem.colors.ui.text.primary.light,
      border: `1px solid ${colorMode === 'dark' ? designSystem.colors.ui.border.dark : designSystem.colors.ui.border.light}`,
      '&:hover': {
        backgroundColor: colorMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colorMode === 'dark' ? designSystem.colors.ui.text.secondary.dark : designSystem.colors.ui.text.secondary.light,
      border: 'none',
      '&:hover': {
        backgroundColor: colorMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      }
    }
  };

  return {
    ...styles[variant],
    padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
    borderRadius: designSystem.radius.md,
    fontSize: designSystem.typography.fontSize.sm,
    fontWeight: designSystem.typography.fontWeight.medium,
    transition: designSystem.transitions.fast,
    cursor: 'pointer',
  };
};

// Helper function for status badge colors
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'todo': designSystem.colors.status.todo,
    'in_progress': designSystem.colors.status.inProgress,
    'in progress': designSystem.colors.status.inProgress,
    'review': designSystem.colors.status.review,
    'done': designSystem.colors.status.done,
    'completed': designSystem.colors.status.done,
    'archived': designSystem.colors.status.archived,
  };
  return statusMap[status.toLowerCase()] || designSystem.colors.status.todo;
};

// Helper function for priority colors
export const getPriorityColor = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'critical': '#dc2626',
    'high': '#ea580c',
    'medium': '#eab308',
    'low': '#22c55e',
  };
  return priorityMap[priority.toLowerCase()] || designSystem.colors.ui.text.muted.light;
};

// Export for use in components
export default designSystem;