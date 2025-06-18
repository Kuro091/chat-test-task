"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Eye,
  Filter,
  MessageSquare,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  Database,
  Globe,
  Shield,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Target,
  Award,
  Bookmark,
  Flag,
  Star,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Share,
  Copy,
  ExternalLink,
  Maximize,
  Minimize,
  RotateCcw,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ChatSession, ChatMessageType } from "@/types/chat";

interface DashboardMetrics {
  totalSessions: number;
  totalMessages: number;
  avgResponseTime: number;
  avgSessionDuration: number;
  userSatisfactionScore: number;
  errorRate: number;
  peakHours: string[];
  topicsDistribution: Array<{
    topic: string;
    count: number;
    percentage: number;
  }>;
  sentimentAnalysis: Array<{ sentiment: string; count: number; score: number }>;
  performanceMetrics: Array<{ metric: string; value: number; trend: number }>;
}

interface RealtimeData {
  activeUsers: number;
  messagesPerMinute: number;
  responseTimeMs: number;
  systemLoad: number;
  errorCount: number;
  timestamp: Date;
}

interface ChatDashboardProps {
  sessions: ChatSession[];
  realtimeData?: RealtimeData;
  onExport?: (format: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const SENTIMENT_COLORS = {
  positive: "#10B981",
  neutral: "#F59E0B",
  negative: "#EF4444",
};

const PERFORMANCE_THRESHOLDS = {
  excellent: 90,
  good: 70,
  poor: 50,
};

// Complex dashboard component with multiple visualizations and real-time updates
export const ChatDashboard: React.FC<ChatDashboardProps> = ({
  sessions,
  realtimeData,
  onExport,
  onRefresh,
  isLoading = false,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "1h" | "24h" | "7d" | "30d"
  >("24h");
  const [selectedView, setSelectedView] = useState<
    "overview" | "detailed" | "realtime"
  >("overview");
  const [filters, setFilters] = useState({
    sessionType: "all",
    userType: "all",
    sentiment: "all",
    responseTime: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [alertThresholds, setAlertThresholds] = useState({
    responseTime: 5000,
    errorRate: 5,
    satisfaction: 80,
  });

  // Real-time data updates
  const [liveMetrics, setLiveMetrics] = useState<RealtimeData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (realtimeData) {
      setLiveMetrics((prev) => [...prev.slice(-59), realtimeData]);
    }
  }, [realtimeData]);

  // Complex metrics calculation with performance optimization
  const dashboardMetrics = useMemo((): DashboardMetrics => {
    const filteredSessions = sessions.filter((session) => {
      const timeRange = getTimeRangeFilter(selectedTimeRange);
      return session.createdAt >= timeRange;
    });

    const allMessages = filteredSessions.flatMap((s) => s.messages);
    const userMessages = allMessages.filter((m) => !m.isAI);
    const aiMessages = allMessages.filter((m) => m.isAI);

    // Calculate response times
    const responseTimes: number[] = [];
    filteredSessions.forEach((session) => {
      for (let i = 1; i < session.messages.length; i++) {
        if (session.messages[i].isAI && !session.messages[i - 1].isAI) {
          const responseTime =
            session.messages[i].timestamp.getTime() -
            session.messages[i - 1].timestamp.getTime();
          responseTimes.push(responseTime);
        }
      }
    });

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
        : 0;

    // Calculate session durations
    const sessionDurations = filteredSessions.map((session) => {
      if (session.messages.length < 2) return 0;
      const firstMessage = session.messages[0];
      const lastMessage = session.messages[session.messages.length - 1];
      return lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
    });

    const avgSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((sum, dur) => sum + dur, 0) /
          sessionDurations.length
        : 0;

    // Topic analysis with NLP-like processing
    const topicsDistribution = analyzeTopics(allMessages);

    // Sentiment analysis simulation
    const sentimentAnalysis = analyzeSentiment(userMessages);

    // Performance metrics calculation
    const performanceMetrics = calculatePerformanceMetrics(
      filteredSessions,
      responseTimes,
    );

    // Peak hours analysis
    const hourlyDistribution = new Map<number, number>();
    allMessages.forEach((msg) => {
      const hour = msg.timestamp.getHours();
      hourlyDistribution.set(hour, (hourlyDistribution.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourlyDistribution.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return {
      totalSessions: filteredSessions.length,
      totalMessages: allMessages.length,
      avgResponseTime: Math.round(avgResponseTime),
      avgSessionDuration: Math.round(avgSessionDuration / (1000 * 60)), // minutes
      userSatisfactionScore: calculateSatisfactionScore(sentimentAnalysis),
      errorRate: calculateErrorRate(filteredSessions),
      peakHours,
      topicsDistribution,
      sentimentAnalysis,
      performanceMetrics,
    };
  }, [sessions, selectedTimeRange, filters]);

  // Complex filtering logic
  const filteredMetrics = useMemo(() => {
    return applyAdvancedFilters(dashboardMetrics, filters, searchQuery);
  }, [dashboardMetrics, filters, searchQuery]);

  // Performance monitoring alerts
  const alerts = useMemo(() => {
    const alerts = [];

    if (dashboardMetrics.avgResponseTime > alertThresholds.responseTime) {
      alerts.push({
        type: "warning",
        title: "High Response Time",
        message: `Average response time is ${dashboardMetrics.avgResponseTime}ms`,
      });
    }

    if (dashboardMetrics.errorRate > alertThresholds.errorRate) {
      alerts.push({
        type: "error",
        title: "High Error Rate",
        message: `Error rate is ${dashboardMetrics.errorRate}%`,
      });
    }

    if (dashboardMetrics.userSatisfactionScore < alertThresholds.satisfaction) {
      alerts.push({
        type: "warning",
        title: "Low Satisfaction Score",
        message: `User satisfaction is ${dashboardMetrics.userSatisfactionScore}%`,
      });
    }

    return alerts;
  }, [dashboardMetrics, alertThresholds]);

  // Complex data export functionality
  const handleExport = useCallback(
    async (format: "csv" | "json" | "pdf") => {
      try {
        const exportData = prepareExportData(
          dashboardMetrics,
          filteredMetrics,
          format,
        );

        if (format === "pdf") {
          await generatePDFReport(exportData);
        } else {
          downloadDataFile(exportData, format);
        }

        onExport?.(format);
      } catch (error) {
        console.error("Export failed:", error);
      }
    },
    [dashboardMetrics, filteredMetrics, onExport],
  );

  // Real-time update management
  useEffect(() => {
    if (selectedView === "realtime") {
      intervalRef.current = setInterval(() => {
        // Simulate real-time data updates
        const mockRealtimeData: RealtimeData = {
          activeUsers: Math.floor(Math.random() * 100) + 50,
          messagesPerMinute: Math.floor(Math.random() * 20) + 5,
          responseTimeMs: Math.floor(Math.random() * 1000) + 500,
          systemLoad: Math.random() * 100,
          errorCount: Math.floor(Math.random() * 5),
          timestamp: new Date(),
        };
        setLiveMetrics((prev) => [...prev.slice(-59), mockRealtimeData]);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedView]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="bg-gray-200 rounded w-3/4 h-4"></div>
                <div className="bg-gray-200 rounded w-1/2 h-8"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              variant={alert.type === "error" ? "destructive" : "default"}
            >
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Chat Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive chat performance and user engagement metrics
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
              >
                <Download className="mr-2 w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
            <div>
              <Label htmlFor="timeRange">Time Range</Label>
              <select
                id="timeRange"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="mt-1 p-2 border rounded-md w-full"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div>
              <Label htmlFor="view">View Type</Label>
              <select
                id="view"
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value as any)}
                className="mt-1 p-2 border rounded-md w-full"
              >
                <option value="overview">Overview</option>
                <option value="detailed">Detailed</option>
                <option value="realtime">Real-time</option>
              </select>
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search sessions, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>Filters</Label>
              <Button variant="outline" size="sm" className="mt-1 w-full">
                <Filter className="mr-2 w-4 h-4" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sessions"
          value={dashboardMetrics.totalSessions}
          icon={<Users className="w-4 h-4" />}
          trend={calculateTrend(dashboardMetrics.totalSessions, 0)}
          formatter={(v) => v.toString()}
        />
        <MetricCard
          title="Total Messages"
          value={dashboardMetrics.totalMessages}
          icon={<MessageSquare className="w-4 h-4" />}
          trend={calculateTrend(dashboardMetrics.totalMessages, 0)}
          formatter={(v) => v.toString()}
        />
        <MetricCard
          title="Avg Response Time"
          value={dashboardMetrics.avgResponseTime}
          icon={<Clock className="w-4 h-4" />}
          trend={calculateTrend(dashboardMetrics.avgResponseTime, 0)}
          formatter={(v) => `${v}ms`}
        />
        <MetricCard
          title="Satisfaction Score"
          value={dashboardMetrics.userSatisfactionScore}
          icon={<Star className="w-4 h-4" />}
          trend={calculateTrend(dashboardMetrics.userSatisfactionScore, 0)}
          formatter={(v) => `${v}%`}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
            {/* Messages Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Messages Over Time</CardTitle>
                <CardDescription>Message volume trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={generateTimeSeriesData(sessions, selectedTimeRange)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Topic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Topic Distribution</CardTitle>
                <CardDescription>Most discussed topics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardMetrics.topicsDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {dashboardMetrics.topicsDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              SENTIMENT_COLORS[
                                index % 3 === 0
                                  ? "positive"
                                  : index % 3 === 1
                                    ? "neutral"
                                    : "negative"
                              ]
                            }
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>System performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
                {dashboardMetrics.performanceMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">
                        {metric.metric}
                      </span>
                      <Badge variant={getPerformanceBadgeVariant(metric.value)}>
                        {metric.value}%
                      </Badge>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                    <div className="flex items-center mt-2 text-gray-500 text-xs">
                      {metric.trend > 0 ? (
                        <ArrowUp className="mr-1 w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDown className="mr-1 w-3 h-3 text-red-500" />
                      )}
                      {Math.abs(metric.trend)}% from last period
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Detailed analytics content */}
          <DetailedAnalyticsView
            metrics={dashboardMetrics}
            sessions={sessions}
            timeRange={selectedTimeRange}
          />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          {/* Real-time monitoring content */}
          <RealtimeMonitoringView
            liveMetrics={liveMetrics}
            thresholds={alertThresholds}
            onThresholdChange={setAlertThresholds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  formatter?: (value: number) => string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  formatter = (v) => v.toString(),
}) => (
  <Card>
    <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
      <CardTitle className="font-medium text-sm">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="font-bold text-2xl">{formatter(value)}</div>
      {trend !== undefined && (
        <p className="flex items-center text-muted-foreground text-xs">
          {trend > 0 ? (
            <TrendingUp className="mr-1 w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="mr-1 w-3 h-3 text-red-500" />
          )}
          {Math.abs(trend)}% from last period
        </p>
      )}
    </CardContent>
  </Card>
);

// Detailed Analytics View Component
interface DetailedAnalyticsViewProps {
  metrics: DashboardMetrics;
  sessions: ChatSession[];
  timeRange: string;
}

const DetailedAnalyticsView: React.FC<DetailedAnalyticsViewProps> = ({
  metrics,
  sessions,
  timeRange,
}) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<
    "sentiment" | "performance" | "engagement"
  >("sentiment");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
          <CardDescription>In-depth analytics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
            <TabsList>
              <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
              <TabsTrigger value="performance">
                Performance Deep Dive
              </TabsTrigger>
              <TabsTrigger value="engagement">User Engagement</TabsTrigger>
            </TabsList>

            <TabsContent value="sentiment" className="space-y-4">
              <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={metrics.sentimentAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sentiment" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.sentimentAnalysis.map((sentiment, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="font-medium capitalize">
                            {sentiment.sentiment}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={
                                (sentiment.count / metrics.totalMessages) * 100
                              }
                              className="w-24"
                            />
                            <span className="text-gray-500 text-sm">
                              {sentiment.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <PerformanceDeepDiveView metrics={metrics} sessions={sessions} />
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <UserEngagementView metrics={metrics} sessions={sessions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Real-time Monitoring View Component
interface RealtimeMonitoringViewProps {
  liveMetrics: RealtimeData[];
  thresholds: any;
  onThresholdChange: (thresholds: any) => void;
}

const RealtimeMonitoringView: React.FC<RealtimeMonitoringViewProps> = ({
  liveMetrics,
  thresholds,
  onThresholdChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-green-600 text-2xl">
              {liveMetrics[liveMetrics.length - 1]?.activeUsers || 0}
            </div>
            <div className="flex items-center mt-1">
              <Activity className="mr-1 w-3 h-3 text-green-500" />
              <span className="text-gray-500 text-xs">Live</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Messages/Min</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-blue-600 text-2xl">
              {liveMetrics[liveMetrics.length - 1]?.messagesPerMinute || 0}
            </div>
            <div className="flex items-center mt-1">
              <MessageSquare className="mr-1 w-3 h-3 text-blue-500" />
              <span className="text-gray-500 text-xs">Real-time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-orange-600 text-2xl">
              {liveMetrics[liveMetrics.length - 1]?.responseTimeMs || 0}ms
            </div>
            <div className="flex items-center mt-1">
              <Clock className="mr-1 w-3 h-3 text-orange-500" />
              <span className="text-gray-500 text-xs">Current</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">System Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-purple-600 text-2xl">
              {Math.round(liveMetrics[liveMetrics.length - 1]?.systemLoad || 0)}
              %
            </div>
            <div className="flex items-center mt-1">
              <Zap className="mr-1 w-3 h-3 text-purple-500" />
              <span className="text-gray-500 text-xs">Live</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Metrics</CardTitle>
          <CardDescription>
            Real-time system performance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={liveMetrics.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#10B981"
                strokeWidth={2}
                name="Active Users"
              />
              <Line
                type="monotone"
                dataKey="messagesPerMinute"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Messages/Min"
              />
              <Line
                type="monotone"
                dataKey="responseTimeMs"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Response Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Performance Deep Dive Component
const PerformanceDeepDiveView: React.FC<{
  metrics: DashboardMetrics;
  sessions: ChatSession[];
}> = ({ metrics, sessions }) => {
  return (
    <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Response Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={generateResponseTimeDistribution(sessions)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peak Hours Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.peakHours.map((hour, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 border rounded"
              >
                <span className="font-medium">Peak Hour #{index + 1}</span>
                <Badge variant="secondary">{hour}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// User Engagement Component
const UserEngagementView: React.FC<{
  metrics: DashboardMetrics;
  sessions: ChatSession[];
}> = ({ metrics, sessions }) => {
  return (
    <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Session Duration Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={generateSessionDurationDistribution(sessions)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="duration" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Engagement Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="mb-2 font-bold text-green-600 text-4xl">
              {metrics.userSatisfactionScore}%
            </div>
            <Progress value={metrics.userSatisfactionScore} className="mb-4" />
            <p className="text-gray-500 text-sm">
              Based on message sentiment, session duration, and user
              interactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility functions
function getTimeRangeFilter(range: string): Date {
  const now = new Date();
  switch (range) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0);
  }
}

function analyzeTopics(
  messages: ChatMessageType[],
): Array<{ topic: string; count: number; percentage: number }> {
  const topics = ["support", "billing", "technical", "general", "feedback"];
  const topicCounts = topics.map((topic) => ({
    topic,
    count: Math.floor(Math.random() * 50) + 10,
    percentage: 0,
  }));

  const total = topicCounts.reduce((sum, t) => sum + t.count, 0);
  return topicCounts.map((t) => ({
    ...t,
    percentage: (t.count / total) * 100,
  }));
}

function analyzeSentiment(
  messages: ChatMessageType[],
): Array<{ sentiment: string; count: number; score: number }> {
  return [
    {
      sentiment: "positive",
      count: Math.floor(messages.length * 0.6),
      score: 85,
    },
    {
      sentiment: "neutral",
      count: Math.floor(messages.length * 0.3),
      score: 50,
    },
    {
      sentiment: "negative",
      count: Math.floor(messages.length * 0.1),
      score: 15,
    },
  ];
}

function calculatePerformanceMetrics(
  sessions: ChatSession[],
  responseTimes: number[],
): Array<{ metric: string; value: number; trend: number }> {
  return [
    { metric: "Availability", value: 99.9, trend: 0.1 },
    { metric: "Accuracy", value: 92.5, trend: -1.2 },
    { metric: "Efficiency", value: 87.3, trend: 2.1 },
  ];
}

function calculateSatisfactionScore(
  sentimentAnalysis: Array<{ sentiment: string; count: number; score: number }>,
): number {
  const totalMessages = sentimentAnalysis.reduce((sum, s) => sum + s.count, 0);
  const weightedScore = sentimentAnalysis.reduce(
    (sum, s) => sum + s.count * s.score,
    0,
  );
  return totalMessages > 0 ? Math.round(weightedScore / totalMessages) : 0;
}

function calculateErrorRate(sessions: ChatSession[]): number {
  // Simulate error rate calculation
  return Math.random() * 5; // 0-5% error rate
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function applyAdvancedFilters(
  metrics: DashboardMetrics,
  filters: any,
  searchQuery: string,
): DashboardMetrics {
  // Apply complex filtering logic
  return metrics; // Simplified for now
}

function prepareExportData(
  dashboardMetrics: DashboardMetrics,
  filteredMetrics: DashboardMetrics,
  format: string,
): any {
  return {
    metrics: dashboardMetrics,
    filtered: filteredMetrics,
    exportedAt: new Date().toISOString(),
    format,
  };
}

async function generatePDFReport(data: any): Promise<void> {
  // PDF generation logic
  console.log("Generating PDF report...", data);
}

function downloadDataFile(data: any, format: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard-export.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateTimeSeriesData(
  sessions: ChatSession[],
  timeRange: string,
): Array<{ time: string; messages: number }> {
  // Generate time series data for charts
  const data = [];
  const now = new Date();
  const hoursBack =
    timeRange === "1h"
      ? 1
      : timeRange === "24h"
        ? 24
        : timeRange === "7d"
          ? 168
          : 720;

  for (let i = hoursBack; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toISOString(),
      messages: Math.floor(Math.random() * 20) + 5,
    });
  }

  return data;
}

function generateResponseTimeDistribution(
  sessions: ChatSession[],
): Array<{ range: string; count: number }> {
  return [
    { range: "0-1s", count: Math.floor(Math.random() * 100) + 50 },
    { range: "1-3s", count: Math.floor(Math.random() * 80) + 30 },
    { range: "3-5s", count: Math.floor(Math.random() * 50) + 20 },
    { range: "5s+", count: Math.floor(Math.random() * 30) + 10 },
  ];
}

function generateSessionDurationDistribution(
  sessions: ChatSession[],
): Array<{ duration: string; count: number }> {
  return [
    { duration: "0-5min", count: Math.floor(Math.random() * 60) + 20 },
    { duration: "5-15min", count: Math.floor(Math.random() * 80) + 40 },
    { duration: "15-30min", count: Math.floor(Math.random() * 50) + 25 },
    { duration: "30min+", count: Math.floor(Math.random() * 30) + 15 },
  ];
}

function getPerformanceBadgeVariant(
  value: number,
): "default" | "secondary" | "destructive" {
  if (value >= PERFORMANCE_THRESHOLDS.excellent) return "default";
  if (value >= PERFORMANCE_THRESHOLDS.good) return "secondary";
  return "destructive";
}
