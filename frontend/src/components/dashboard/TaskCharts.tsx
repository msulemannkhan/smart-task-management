import {
  Box,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Flex,
} from "@chakra-ui/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TaskStatus, TaskPriority } from "../../types/task";
import type { Task } from "../../types/task";
import { format, subDays, startOfDay } from "date-fns";

interface ChartProps {
  tasks: Task[];
}

// Color mappings
const STATUS_COLORS = {
  [TaskStatus.TODO]: "#3182ce",
  [TaskStatus.IN_PROGRESS]: "#f6ad55",
  [TaskStatus.IN_REVIEW]: "#805ad5",
  [TaskStatus.DONE]: "#48bb78",
  [TaskStatus.BLOCKED]: "#fc8181",
  [TaskStatus.BACKLOG]: "#718096",
  [TaskStatus.CANCELLED]: "#e53e3e",
};

const PRIORITY_COLORS = {
  [TaskPriority.CRITICAL]: "#e53e3e",
  [TaskPriority.URGENT]: "#ed8936",
  [TaskPriority.HIGH]: "#f6ad55",
  [TaskPriority.MEDIUM]: "#3182ce",
  [TaskPriority.LOW]: "#718096",
};

export function TaskStatusPieChart({ tasks }: ChartProps) {
  const textColor = useColorModeValue("gray.700", "gray.100");
  const bgColor = useColorModeValue("white", "dark.bg.tertiary");
  const borderColor = useColorModeValue("gray.200", "dark.border.subtle");
  
  // Prepare data for pie chart
  const statusData = Object.values(TaskStatus).map(status => {
    const count = tasks.filter(task => task.status === status).length;
    return {
      name: status.replace(/_/g, " "),
      value: count,
      color: STATUS_COLORS[status],
    };
  }).filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <Box bg={bgColor} p={2} borderRadius="md" shadow="lg" border="1px" borderColor={borderColor}>
          <Text fontSize="sm" fontWeight="bold">{payload[0].name}</Text>
          <Text fontSize="sm">{payload[0].value} tasks</Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box 
      bg={bgColor} 
      p={6} 
      borderRadius="xl" 
      border="none"
      boxShadow="none"
      background={useColorModeValue(
        "white",
        "linear-gradient(135deg, #1c2128 0%, #262c36 100%)"
      )}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #3182ce 0%, #805ad5 50%, #d53f8c 100%)',
        opacity: 0.8
      }}
    >
      <Text fontSize="md" fontWeight="semibold" mb={4} color={textColor}>
        Task Status Distribution
      </Text>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={statusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {statusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function TaskCompletionTrend({ tasks }: ChartProps) {
  const textColor = useColorModeValue("gray.700", "gray.100");
  const bgColor = useColorModeValue("white", "dark.bg.tertiary");
  const gridColor = useColorModeValue("#e2e8f0", "#30363d");
  
  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dateStr = format(date, "MMM dd");
    const dayTasks = tasks.filter(task => {
      const taskDate = task.updated_at ? new Date(task.updated_at) : new Date(task.created_at);
      return startOfDay(taskDate).getTime() === date.getTime();
    });
    
    return {
      date: dateStr,
      completed: dayTasks.filter(t => t.status === TaskStatus.DONE).length,
      created: dayTasks.filter(t => {
        const createdDate = new Date(t.created_at);
        return startOfDay(createdDate).getTime() === date.getTime();
      }).length,
    };
  });

  return (
    <Box 
      bg={bgColor} 
      p={6} 
      borderRadius="xl" 
      border="none"
      boxShadow="none"
      background={useColorModeValue(
        "white",
        "linear-gradient(135deg, #1c2128 0%, #262c36 100%)"
      )}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #48bb78 0%, #38bdf8 50%, #f6ad55 100%)',
        opacity: 0.8
      }}
    >
      <Text fontSize="md" fontWeight="semibold" mb={4} color={textColor}>
        Task Activity Trend (Last 7 Days)
      </Text>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={last7Days}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" stroke={textColor} fontSize={12} />
          <YAxis stroke={textColor} fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: bgColor,
              border: "1px solid",
              borderColor: gridColor,
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#48bb78"
            strokeWidth={2}
            dot={{ fill: "#48bb78", r: 4 }}
            activeDot={{ r: 6 }}
            name="Completed"
          />
          <Line
            type="monotone"
            dataKey="created"
            stroke="#3182ce"
            strokeWidth={2}
            dot={{ fill: "#3182ce", r: 4 }}
            activeDot={{ r: 6 }}
            name="Created"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function PriorityBarChart({ tasks }: ChartProps) {
  const textColor = useColorModeValue("gray.700", "gray.100");
  const bgColor = useColorModeValue("white", "dark.bg.tertiary");
  const gridColor = useColorModeValue("#e2e8f0", "#30363d");
  
  const priorityData = Object.values(TaskPriority).map(priority => ({
    name: priority.charAt(0) + priority.slice(1).toLowerCase(),
    tasks: tasks.filter(task => task.priority === priority).length,
    color: PRIORITY_COLORS[priority],
  }));

  return (
    <Box 
      bg={bgColor} 
      p={6} 
      borderRadius="xl" 
      border="none"
      boxShadow="none"
      background={useColorModeValue(
        "white",
        "linear-gradient(135deg, #1c2128 0%, #262c36 100%)"
      )}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #e53e3e 0%, #f6ad55 50%, #3182ce 100%)',
        opacity: 0.8
      }}
    >
      <Text fontSize="md" fontWeight="semibold" mb={4} color={textColor}>
        Task Priority Distribution
      </Text>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={priorityData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={textColor} fontSize={12} />
          <YAxis stroke={textColor} fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: bgColor,
              border: "1px solid",
              borderColor: gridColor,
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="tasks" radius={[8, 8, 0, 0]}>
            {priorityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function TeamPerformanceRadar({ tasks }: ChartProps) {
  const textColor = useColorModeValue("gray.700", "gray.100");
  const bgColor = useColorModeValue("white", "dark.bg.tertiary");
  const gridColor = useColorModeValue("#e2e8f0", "#30363d");
  
  // Calculate performance metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const overdueTask = tasks.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && t.status !== TaskStatus.DONE
  ).length;
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const blockedTasks = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
  
  const data = [
    {
      metric: "Completion Rate",
      value: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      fullMark: 100,
    },
    {
      metric: "On Time",
      value: totalTasks > 0 ? ((totalTasks - overdueTask) / totalTasks) * 100 : 100,
      fullMark: 100,
    },
    {
      metric: "Active Tasks",
      value: totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0,
      fullMark: 100,
    },
    {
      metric: "Unblocked",
      value: totalTasks > 0 ? ((totalTasks - blockedTasks) / totalTasks) * 100 : 100,
      fullMark: 100,
    },
    {
      metric: "Productivity",
      value: totalTasks > 0 ? ((completedTasks + inProgressTasks) / totalTasks) * 100 : 0,
      fullMark: 100,
    },
  ];

  return (
    <Box 
      bg={bgColor} 
      p={6} 
      borderRadius="xl" 
      border="none"
      boxShadow="none"
      background={useColorModeValue(
        "white",
        "linear-gradient(135deg, #1c2128 0%, #262c36 100%)"
      )}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #805ad5 0%, #3182ce 50%, #48bb78 100%)',
        opacity: 0.8
      }}
    >
      <Text fontSize="md" fontWeight="semibold" mb={4} color={textColor}>
        Performance Metrics
      </Text>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid stroke={gridColor} />
          <PolarAngleAxis dataKey="metric" stroke={textColor} fontSize={11} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={gridColor} />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#3182ce"
            fill="#3182ce"
            fillOpacity={0.6}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: bgColor,
              border: "1px solid",
              borderColor: gridColor,
              borderRadius: "8px",
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
}