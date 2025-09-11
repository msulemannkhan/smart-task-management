import { Box, Flex, useDisclosure } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileHeader } from "./components/layout/MobileHeader";
import { TaskDetailPanel } from "./components/layout/TaskDetailPanel";
import { TaskProvider, useTask } from "./context/TaskContext";
import {
  TaskRefreshProvider,
  useTaskRefresh,
} from "./context/TaskRefreshContext";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect, lazy, Suspense } from "react";
import { Spinner, Center, VStack, Text } from "@chakra-ui/react";

// Lazy load pages for code splitting
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const Tasks = lazy(() =>
  import("./pages/Tasks").then((m) => ({ default: m.Tasks }))
);
const TaskDetail = lazy(() =>
  import("./pages/TaskDetail").then((m) => ({ default: m.TaskDetail }))
);
const Calendar = lazy(() =>
  import("./pages/Calendar").then((m) => ({ default: m.Calendar }))
);
const Projects = lazy(() =>
  import("./pages/Projects").then((m) => ({ default: m.Projects }))
);
const ProjectDetail = lazy(() =>
  import("./pages/ProjectDetail").then((m) => ({ default: m.ProjectDetail }))
);
const Categories = lazy(() =>
  import("./pages/Categories").then((m) => ({ default: m.Categories }))
);
const Profile = lazy(() =>
  import("./pages/Profile").then((m) => ({ default: m.Profile }))
);
const Settings = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Settings }))
);
const Login = lazy(() =>
  import("./pages/Login").then((m) => ({ default: m.Login }))
);
const Register = lazy(() =>
  import("./pages/Register").then((m) => ({ default: m.Register }))
);
const ForgotPassword = lazy(() =>
  import("./pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword }))
);
const ResetPassword = lazy(() =>
  import("./pages/ResetPassword").then((m) => ({ default: m.ResetPassword }))
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component to handle route changes and clear task selection
function RouteChangeHandler() {
  const location = useLocation();
  const { setSelectedTask } = useTask();

  useEffect(() => {
    // Clear selected task when navigating away from tasks-related pages
    if (!location.pathname.startsWith("/tasks")) {
      setSelectedTask(null);
    }
  }, [location.pathname, setSelectedTask]);

  return null;
}

function AppContent() {
  const { triggerRefresh } = useTaskRefresh();
  const {
    isOpen: isSidebarOpen,
    onOpen: onSidebarOpen,
    onClose: onSidebarClose,
  } = useDisclosure();

  // Loading component
  const PageLoader = () => (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="primary.500" thickness="4px" />
        <Text color="gray.600">Loading...</Text>
      </VStack>
    </Center>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Box minH="100vh" bg="gray.50">
                  <RouteChangeHandler />

                  {/* Mobile Header */}
                  <MobileHeader onOpenSidebar={onSidebarOpen} />

                  <Flex direction="row" minH="100vh">
                    {/* Left Sidebar - Desktop static, Mobile drawer */}
                    <Sidebar isOpen={isSidebarOpen} onClose={onSidebarClose} />

                    {/* Main Content Area */}
                    <Box flex="1" minW={0} overflowY="auto" overflowX="hidden">
                      <Routes>
                        <Route
                          path="/"
                          element={<Navigate to="/dashboard" replace />}
                        />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/tasks/:taskId" element={<TaskDetail />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route
                          path="/projects/:projectId"
                          element={<ProjectDetail />}
                        />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </Box>

                    {/* Right Task Detail Panel */}
                    <TaskDetailPanel onTaskUpdate={triggerRefresh} />
                  </Flex>

                  {/* WebSocket Connection Status */}
                  <ConnectionStatus />
                </Box>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <WebSocketProvider>
            <TaskProvider>
              <TaskRefreshProvider>
                <AppContent />
              </TaskRefreshProvider>
            </TaskProvider>
          </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
