"use client";

import React, { useState, useMemo } from "react";
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
} from "recharts";
import {
  Calendar,
  TrendingUp,
  MessageSquare,
  Clock,
  User,
  Bot,
  Activity,
  BarChart3,
} from "lucide-react";
import { ChatSession, ChatMessageType } from "@/types/chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatAnalyticsProps {
  sessions: ChatSession[];
}

interface DailyStats {
  date: string;
  userMessages: number;
  aiMessages: number;
  totalMessages: number;
  sessions: number;
  avgResponseTime: number;
}

interface MessageLengthDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface TopicAnalysis {
  topic: string;
  count: number;
  percentage: number;
  avgLength: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const ChatAnalytics: React.FC<ChatAnalyticsProps> = ({ sessions }) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const [selectedMetric, setSelectedMetric] = useState<
    "messages" | "sessions" | "engagement"
  >("messages");

  // Calculate date range
  const getDateRange = (range: string) => {
    const now = new Date();
    const days =
      range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate, endDate: now };
  };

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    if (timeRange === "all") return sessions;
    const { startDate } = getDateRange(timeRange);
    return sessions.filter((session) => session.createdAt >= startDate);
  }, [sessions, timeRange]);

  // Calculate daily statistics
  const dailyStats = useMemo((): DailyStats[] => {
    const statsMap = new Map<string, DailyStats>();

    filteredSessions.forEach((session) => {
      const dateKey = session.createdAt.toISOString().split("T")[0];

      if (!statsMap.has(dateKey)) {
        statsMap.set(dateKey, {
          date: dateKey,
          userMessages: 0,
          aiMessages: 0,
          totalMessages: 0,
          sessions: 0,
          avgResponseTime: 0,
        });
      }

      const dayStats = statsMap.get(dateKey)!;
      dayStats.sessions += 1;

      session.messages.forEach((message, index) => {
        if (message.isAI) {
          dayStats.aiMessages += 1;
          // Calculate response time based on previous user message
          if (index > 0 && !session.messages[index - 1].isAI) {
            const responseTime =
              message.timestamp.getTime() -
              session.messages[index - 1].timestamp.getTime();
            dayStats.avgResponseTime =
              (dayStats.avgResponseTime + responseTime) / 2;
          }
        } else {
          dayStats.userMessages += 1;
        }
        dayStats.totalMessages += 1;
      });
    });

    return Array.from(statsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [filteredSessions]);

  // Calculate message length distribution
  const messageLengthDistribution = useMemo((): MessageLengthDistribution[] => {
    const ranges = [
      { min: 0, max: 50, label: "0-50" },
      { min: 51, max: 100, label: "51-100" },
      { min: 101, max: 200, label: "101-200" },
      { min: 201, max: 500, label: "201-500" },
      { min: 501, max: Infinity, label: "500+" },
    ];

    const allMessages = filteredSessions.flatMap((s) => s.messages);
    const distribution = ranges.map((range) => {
      const count = allMessages.filter(
        (msg) =>
          msg.message.length >= range.min && msg.message.length <= range.max,
      ).length;

      return {
        range: range.label,
        count,
        percentage: Math.round((count / allMessages.length) * 100),
      };
    });

    return distribution;
  }, [filteredSessions]);

  // Analyze conversation topics (simplified keyword analysis)
  const topicAnalysis = useMemo((): TopicAnalysis[] => {
    const keywords = [
      "help",
      "support",
      "question",
      "problem",
      "issue",
      "bug",
      "error",
      "thank",
      "thanks",
      "appreciate",
      "good",
      "great",
      "excellent",
      "refund",
      "payment",
      "order",
      "purchase",
      "buy",
      "price",
      "account",
      "login",
      "password",
      "access",
      "profile",
    ];

    const topicCounts = new Map<
      string,
      { count: number; totalLength: number }
    >();
    const allMessages = filteredSessions.flatMap((s) => s.messages);

    keywords.forEach((keyword) => {
      const matchingMessages = allMessages.filter((msg) =>
        msg.message.toLowerCase().includes(keyword),
      );

      if (matchingMessages.length > 0) {
        topicCounts.set(keyword, {
          count: matchingMessages.length,
          totalLength: matchingMessages.reduce(
            (sum, msg) => sum + msg.message.length,
            0,
          ),
        });
      }
    });

    const totalMatchedMessages = Array.from(topicCounts.values()).reduce(
      (sum, topic) => sum + topic.count,
      0,
    );

    return Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        count: data.count,
        percentage: Math.round((data.count / totalMatchedMessages) * 100),
        avgLength: Math.round(data.totalLength / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredSessions]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const allMessages = filteredSessions.flatMap((s) => s.messages);
    const userMessages = allMessages.filter((m) => !m.isAI);
    const aiMessages = allMessages.filter((m) => m.isAI);

    const avgSessionLength =
      filteredSessions.length > 0
        ? Math.round(
            filteredSessions.reduce((sum, s) => sum + s.messages.length, 0) /
              filteredSessions.length,
          )
        : 0;

    const avgMessageLength =
      allMessages.length > 0
        ? Math.round(
            allMessages.reduce((sum, m) => sum + m.message.length, 0) /
              allMessages.length,
          )
        : 0;

    const totalDuration = filteredSessions.reduce((sum, session) => {
      return sum + (session.updatedAt.getTime() - session.createdAt.getTime());
    }, 0);

    const avgSessionDuration =
      filteredSessions.length > 0
        ? Math.round(totalDuration / filteredSessions.length / 1000 / 60) // in minutes
        : 0;

    return {
      totalSessions: filteredSessions.length,
      totalMessages: allMessages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      avgSessionLength,
      avgMessageLength,
      avgSessionDuration,
      mostActiveDay: dailyStats.reduce(
        (max, day) => (day.totalMessages > max.totalMessages ? day : max),
        dailyStats[0] || { date: "N/A", totalMessages: 0 },
      ),
    };
  }, [filteredSessions, dailyStats]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    trend?: string;
  }> = ({ title, value, description, icon, trend }) => (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
        <p className="text-muted-foreground text-xs">{description}</p>
        {trend && (
          <div className="flex items-center mt-1 text-green-600 text-xs">
            <TrendingUp className="mr-1 w-3 h-3" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (filteredSessions.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-3 w-12 h-12 text-gray-300" />
          <p className="text-gray-500">No data available for analytics</p>
          <p className="text-gray-400 text-sm">
            Start chatting to see your analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">Chat Analytics</h2>
          <p className="text-muted-foreground">
            Insights into your chat conversations and patterns
          </p>
        </div>

        <Select
          value={timeRange}
          onValueChange={(value: any) => setTimeRange(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Metrics */}
      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sessions"
          value={overallMetrics.totalSessions}
          description="Chat conversations"
          icon={<MessageSquare className="w-4 h-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Messages"
          value={overallMetrics.totalMessages}
          description={`${overallMetrics.userMessages} user, ${overallMetrics.aiMessages} AI`}
          icon={<Activity className="w-4 h-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Session Length"
          value={`${overallMetrics.avgSessionLength} msgs`}
          description="Messages per session"
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg Session Time"
          value={formatDuration(overallMetrics.avgSessionDuration)}
          description="Time per conversation"
          icon={<Clock className="w-4 h-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>
                Message volume and session activity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="totalMessages"
                      stroke="#8884d8"
                      name="Total Messages"
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#82ca9d"
                      name="Sessions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Types</CardTitle>
              <CardDescription>
                Breakdown of user vs AI messages per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Bar
                      dataKey="userMessages"
                      stackId="a"
                      fill="#8884d8"
                      name="User Messages"
                    />
                    <Bar
                      dataKey="aiMessages"
                      stackId="a"
                      fill="#82ca9d"
                      name="AI Messages"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="gap-4 grid md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Message Length Distribution</CardTitle>
                <CardDescription>
                  Distribution of message lengths (characters)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={messageLengthDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User vs AI Messages</CardTitle>
                <CardDescription>
                  Proportion of messages by sender type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "User Messages",
                            value: overallMetrics.userMessages,
                          },
                          {
                            name: "AI Messages",
                            value: overallMetrics.aiMessages,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {[
                          {
                            name: "User Messages",
                            value: overallMetrics.userMessages,
                          },
                          {
                            name: "AI Messages",
                            value: overallMetrics.aiMessages,
                          },
                        ].map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Topics</CardTitle>
              <CardDescription>
                Most discussed topics based on keyword analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicAnalysis.map((topic, index) => (
                  <div
                    key={topic.topic}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{topic.topic}</p>
                        <p className="text-muted-foreground text-sm">
                          {topic.count} mentions • Avg {topic.avgLength} chars
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{topic.percentage}%</p>
                    </div>
                  </div>
                ))}

                {topicAnalysis.length === 0 && (
                  <p className="py-8 text-muted-foreground text-center">
                    No topics detected in conversations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
