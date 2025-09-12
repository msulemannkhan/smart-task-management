/**
 * Utility functions to translate technical errors into user-friendly messages
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

/**
 * Convert technical error messages to user-friendly ones
 */
export function getUserFriendlyError(error: unknown): UserFriendlyError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Network connectivity issues
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      type: 'error'
    };
  }
  
  // Authentication specific errors
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid credentials')) {
    return {
      title: 'Login Failed',
      message: 'The email or password you entered is incorrect. Please try again.',
      type: 'error'
    };
  }
  
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    return {
      title: 'Access Denied',
      message: 'You do not have permission to access this resource.',
      type: 'error'
    };
  }
  
  if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
    return {
      title: 'Not Found',
      message: 'The requested resource could not be found. Please try again later.',
      type: 'error'
    };
  }
  
  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again in a moment.',
      type: 'error'
    };
  }
  
  if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
    return {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again later.',
      type: 'error'
    };
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
      type: 'error'
    };
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return {
      title: 'Invalid Input',
      message: 'Please check your input and try again.',
      type: 'error'
    };
  }
  
  // Email already exists
  if (errorMessage.includes('already exists') || errorMessage.includes('duplicate') || errorMessage.includes('already registered')) {
    return {
      title: 'Account Already Exists',
      message: 'An account with this email address already exists. Try logging in instead.',
      type: 'info'
    };
  }
  
  // Generic error fallback
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again, and if the problem persists, contact support.',
    type: 'error'
  };
}

/**
 * Get appropriate retry message based on error type
 */
export function getRetryMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return 'Check your connection and try again';
  }
  
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return 'Double-check your credentials';
  }
  
  if (errorMessage.includes('500') || errorMessage.includes('timeout')) {
    return 'Wait a moment and try again';
  }
  
  return 'Please try again';
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Network errors are usually retryable
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('timeout')) {
    return true;
  }
  
  // Server errors are retryable
  if (errorMessage.includes('500') || errorMessage.includes('503')) {
    return true;
  }
  
  // Client errors (4xx) are usually not retryable
  if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('404')) {
    return false;
  }
  
  return true; // Default to retryable
}