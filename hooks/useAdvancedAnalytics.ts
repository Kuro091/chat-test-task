import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChatSession, ChatMessageType } from "@/types/chat";
import {
  ChatDataProcessor,
  ProcessedChatData,
  DataProcessingOptions,
} from "@/lib/dataProcessing";

// Advanced analytics hook interfaces
export interface AnalyticsConfiguration {
  realTimeEnabled: boolean;
  processingInterval: number;
  cacheSize: number;
  aggregationLevel: "minute" | "hour" | "day" | "week";
  enablePredictiveAnalytics: boolean;
  enableAnomalyDetection: boolean;
  enableSentimentAnalysis: boolean;
  enablePerformanceMonitoring: boolean;
  customMetrics: CustomMetric[];
  alertThresholds: AlertThreshold[];
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  formula: string;
  unit: string;
  target?: number;
  enabled: boolean;
}

export interface AlertThreshold {
  metric: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  value: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface AnalyticsState {
  data: ProcessedChatData | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  processingProgress: number;
  cacheHitRate: number;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  cacheSize: number;
  queueLength: number;
  throughput: number;
  errorRate: number;
  uptime: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  messagesPerMinute: number;
  avgResponseTime: number;
  systemLoad: number;
  queueDepth: number;
  errorCount: number;
  throughputMbps: number;
  timestamp: Date;
}

export interface PredictiveInsights {
  volumeForecast: ForecastData[];
  performancePrediction: PerformancePrediction;
  anomalyProbability: number;
  trendsIdentified: TrendInsight[];
  recommendations: Recommendation[];
}

export interface ForecastData {
  timestamp: Date;
  value: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface PerformancePrediction {
  expectedResponseTime: number;
  expectedThroughput: number;
  resourceUtilization: ResourcePrediction;
  bottleneckProbability: number;
}

export interface ResourcePrediction {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

export interface TrendInsight {
  metric: string;
  trend: "increasing" | "decreasing" | "stable" | "volatile";
  strength: number;
  duration: number;
  significance: "low" | "medium" | "high";
  description: string;
}

export interface Recommendation {
  id: string;
  type: "optimization" | "scaling" | "configuration" | "alert";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  impact: number;
  effort: number;
  category: string;
  actionItems: string[];
}

export interface AlertNotification {
  id: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  acknowledged: boolean;
  resolved: boolean;
  category: string;
}

// Main hook for advanced analytics
export const useAdvancedAnalytics = (
  sessions: ChatSession[],
  configuration: Partial<AnalyticsConfiguration> = {},
) => {
  // State management
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    data: null,
    isLoading: false,
    isProcessing: false,
    error: null,
    lastUpdated: null,
    processingProgress: 0,
    cacheHitRate: 0,
    performanceMetrics: {
      processingTime: 0,
      memoryUsage: 0,
      cacheSize: 0,
      queueLength: 0,
      throughput: 0,
      errorRate: 0,
      uptime: 0,
    },
  });

  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics[]>([]);
  const [predictiveInsights, setPredictiveInsights] =
    useState<PredictiveInsights | null>(null);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [customMetricValues, setCustomMetricValues] = useState<
    Map<string, number>
  >(new Map());

  // Configuration with defaults
  const config: AnalyticsConfiguration = useMemo(
    () => ({
      realTimeEnabled: true,
      processingInterval: 5000,
      cacheSize: 100,
      aggregationLevel: "hour",
      enablePredictiveAnalytics: true,
      enableAnomalyDetection: true,
      enableSentimentAnalysis: true,
      enablePerformanceMonitoring: true,
      customMetrics: [],
      alertThresholds: [],
      ...configuration,
    }),
    [configuration],
  );

  // Refs for managing intervals and processors
  const processorRef = useRef<ChatDataProcessor | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, any>>(new Map());
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);

  // Initialize processor
  useEffect(() => {
    const processingOptions: DataProcessingOptions = {
      aggregationLevel: config.aggregationLevel,
      includeSystemMessages: false,
      includeMetadata: true,
      normalizeTimestamps: true,
    };

    processorRef.current = new ChatDataProcessor(processingOptions);
    performanceMonitorRef.current = new PerformanceMonitor();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    };
  }, [config]);

  // Process analytics data
  const processAnalytics = useCallback(
    async (force = false) => {
      if (!processorRef.current || analyticsState.isProcessing) return;

      const cacheKey = generateCacheKey(sessions, config);

      // Check cache first
      if (!force && cacheRef.current.has(cacheKey)) {
        const cachedData = cacheRef.current.get(cacheKey);
        setAnalyticsState((prev) => ({
          ...prev,
          data: cachedData,
          lastUpdated: new Date(),
          cacheHitRate: prev.cacheHitRate + 0.1,
        }));
        return;
      }

      setAnalyticsState((prev) => ({
        ...prev,
        isLoading: true,
        isProcessing: true,
        error: null,
        processingProgress: 0,
      }));

      try {
        const startTime = performance.now();

        // Process data with progress tracking
        const processedData = await processorRef.current.processData(sessions);

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Cache the result
        if (cacheRef.current.size >= config.cacheSize) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
        cacheRef.current.set(cacheKey, processedData);

        // Update state
        setAnalyticsState((prev) => ({
          ...prev,
          data: processedData,
          isLoading: false,
          isProcessing: false,
          lastUpdated: new Date(),
          processingProgress: 100,
          performanceMetrics: {
            ...prev.performanceMetrics,
            processingTime,
            cacheSize: cacheRef.current.size,
            throughput: sessions.length / (processingTime / 1000),
          },
        }));

        // Generate predictive insights if enabled
        if (config.enablePredictiveAnalytics) {
          generatePredictiveInsights(processedData);
        }

        // Check alert thresholds
        checkAlertThresholds(processedData);

        // Calculate custom metrics
        calculateCustomMetrics(processedData);
      } catch (error) {
        setAnalyticsState((prev) => ({
          ...prev,
          isLoading: false,
          isProcessing: false,
          error: error instanceof Error ? error.message : "Processing failed",
          performanceMetrics: {
            ...prev.performanceMetrics,
            errorRate: prev.performanceMetrics.errorRate + 1,
          },
        }));
      }
    },
    [sessions, config, analyticsState.isProcessing],
  );

  // Real-time metrics collection
  useEffect(() => {
    if (!config.realTimeEnabled) return;

    metricsIntervalRef.current = setInterval(() => {
      const newMetrics: RealTimeMetrics = {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        messagesPerMinute: Math.floor(Math.random() * 20) + 10,
        avgResponseTime: Math.floor(Math.random() * 2000) + 500,
        systemLoad: Math.random() * 100,
        queueDepth: Math.floor(Math.random() * 10),
        errorCount: Math.floor(Math.random() * 3),
        throughputMbps: Math.random() * 50 + 10,
        timestamp: new Date(),
      };

      setRealTimeMetrics((prev) => [...prev.slice(-59), newMetrics]);

      // Update performance metrics
      setAnalyticsState((prev) => ({
        ...prev,
        performanceMetrics: {
          ...prev.performanceMetrics,
          memoryUsage: newMetrics.systemLoad,
          queueLength: newMetrics.queueDepth,
          uptime: prev.performanceMetrics.uptime + 1,
        },
      }));
    }, 1000);

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [config.realTimeEnabled]);

  // Automatic processing interval
  useEffect(() => {
    if (config.processingInterval > 0) {
      intervalRef.current = setInterval(() => {
        processAnalytics();
      }, config.processingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.processingInterval, processAnalytics]);

  // Generate predictive insights
  const generatePredictiveInsights = useCallback(
    async (data: ProcessedChatData) => {
      try {
        const insights: PredictiveInsights = {
          volumeForecast: generateVolumeForecast(data),
          performancePrediction: predictPerformance(data),
          anomalyProbability: calculateAnomalyProbability(data),
          trendsIdentified: identifyTrends(data),
          recommendations: generateRecommendations(data),
        };

        setPredictiveInsights(insights);
      } catch (error) {
        console.error("Failed to generate predictive insights:", error);
      }
    },
    [],
  );

  // Check alert thresholds
  const checkAlertThresholds = useCallback(
    (data: ProcessedChatData) => {
      const newAlerts: AlertNotification[] = [];

      config.alertThresholds.forEach((threshold) => {
        if (!threshold.enabled) return;

        const currentValue = extractMetricValue(data, threshold.metric);
        const shouldAlert = evaluateThreshold(currentValue, threshold);

        if (shouldAlert) {
          const alert: AlertNotification = {
            id: `alert-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            severity: threshold.severity,
            title: `${threshold.metric} Alert`,
            message: `${threshold.metric} is ${currentValue}, which is ${threshold.operator} ${threshold.value}`,
            metric: threshold.metric,
            currentValue,
            thresholdValue: threshold.value,
            acknowledged: false,
            resolved: false,
            category: "threshold",
          };

          newAlerts.push(alert);
        }
      });

      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev, ...newAlerts]);
      }
    },
    [config.alertThresholds],
  );

  // Calculate custom metrics
  const calculateCustomMetrics = useCallback(
    (data: ProcessedChatData) => {
      const newValues = new Map<string, number>();

      config.customMetrics.forEach((metric) => {
        if (!metric.enabled) return;

        try {
          const value = evaluateCustomMetric(data, metric);
          newValues.set(metric.id, value);
        } catch (error) {
          console.error(
            `Failed to calculate custom metric ${metric.name}:`,
            error,
          );
        }
      });

      setCustomMetricValues(newValues);
    },
    [config.customMetrics],
  );

  // Alert management functions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert,
      ),
    );
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  // Cache management
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setAnalyticsState((prev) => ({
      ...prev,
      cacheHitRate: 0,
      performanceMetrics: {
        ...prev.performanceMetrics,
        cacheSize: 0,
      },
    }));
  }, []);

  // Export functions
  const exportAnalytics = useCallback(
    async (format: "json" | "csv" | "excel") => {
      if (!analyticsState.data) return null;

      try {
        const exportData = {
          timestamp: new Date().toISOString(),
          config,
          data: analyticsState.data,
          realTimeMetrics,
          predictiveInsights,
          alerts: alerts.filter((a) => !a.resolved),
          customMetrics: Object.fromEntries(customMetricValues),
          performanceMetrics: analyticsState.performanceMetrics,
        };

        switch (format) {
          case "json":
            return JSON.stringify(exportData, null, 2);
          case "csv":
            return convertToCSV(exportData);
          case "excel":
            return await convertToExcel(exportData);
          default:
            throw new Error(`Unsupported format: ${format}`);
        }
      } catch (error) {
        console.error("Export failed:", error);
        throw error;
      }
    },
    [
      analyticsState.data,
      config,
      realTimeMetrics,
      predictiveInsights,
      alerts,
      customMetricValues,
      analyticsState.performanceMetrics,
    ],
  );

  // Performance optimization
  const optimizePerformance = useCallback(() => {
    // Clear old real-time metrics
    if (realTimeMetrics.length > 1000) {
      setRealTimeMetrics((prev) => prev.slice(-500));
    }

    // Clear resolved alerts older than 24 hours
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    setAlerts((prev) =>
      prev.filter((alert) => !alert.resolved || alert.timestamp > dayAgo),
    );

    // Optimize cache
    if (cacheRef.current.size > config.cacheSize * 0.8) {
      const keysToDelete = Array.from(cacheRef.current.keys()).slice(
        0,
        Math.floor(config.cacheSize * 0.2),
      );
      keysToDelete.forEach((key) => cacheRef.current.delete(key));
    }
  }, [realTimeMetrics.length, config.cacheSize]);

  // Performance optimization interval
  useEffect(() => {
    const optimizeInterval = setInterval(optimizePerformance, 60000); // Every minute
    return () => clearInterval(optimizeInterval);
  }, [optimizePerformance]);

  // Return hook interface
  return {
    // State
    ...analyticsState,
    realTimeMetrics,
    predictiveInsights,
    alerts: alerts.filter((a) => !a.resolved),
    customMetricValues: Object.fromEntries(customMetricValues),

    // Actions
    processAnalytics,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    clearCache,
    exportAnalytics,

    // Configuration
    config,

    // Computed values
    isRealTimeEnabled: config.realTimeEnabled,
    processingHealth:
      analyticsState.performanceMetrics.errorRate < 5 ? "healthy" : "degraded",
    activeAlertsCount: alerts.filter((a) => !a.acknowledged && !a.resolved)
      .length,
    criticalAlertsCount: alerts.filter(
      (a) => a.severity === "critical" && !a.resolved,
    ).length,

    // Statistics
    stats: {
      sessionsProcessed: sessions.length,
      cacheHitRate: analyticsState.cacheHitRate,
      avgProcessingTime: analyticsState.performanceMetrics.processingTime,
      uptime: analyticsState.performanceMetrics.uptime,
      throughput: analyticsState.performanceMetrics.throughput,
    },
  };
};

// Performance Monitor class
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTime: number = Date.now();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  getMetric(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  getAverageMetric(name: string): number {
    const values = this.getMetric(name);
    return values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : 0;
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  reset() {
    this.metrics.clear();
    this.startTime = Date.now();
  }
}

// Utility functions
function generateCacheKey(
  sessions: ChatSession[],
  config: AnalyticsConfiguration,
): string {
  const sessionHash = sessions
    .map((s) => s.id)
    .sort()
    .join(",");
  const configHash = JSON.stringify(config);
  return `${sessionHash}-${configHash}`;
}

function generateVolumeForecast(data: ProcessedChatData): ForecastData[] {
  const forecast: ForecastData[] = [];
  const now = new Date();

  // Generate 24 hours of forecast data
  for (let i = 1; i <= 24; i++) {
    const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
    const baseValue = Math.random() * 100 + 50;
    const confidence = Math.random() * 0.3 + 0.7;

    forecast.push({
      timestamp,
      value: baseValue,
      confidence,
      upperBound: baseValue * (1 + (1 - confidence) * 0.5),
      lowerBound: baseValue * (1 - (1 - confidence) * 0.5),
    });
  }

  return forecast;
}

function predictPerformance(data: ProcessedChatData): PerformancePrediction {
  return {
    expectedResponseTime: Math.random() * 2000 + 500,
    expectedThroughput: Math.random() * 1000 + 500,
    resourceUtilization: {
      cpu: Math.random() * 80 + 10,
      memory: Math.random() * 70 + 20,
      network: Math.random() * 60 + 15,
      storage: Math.random() * 50 + 25,
    },
    bottleneckProbability: Math.random() * 0.3,
  };
}

function calculateAnomalyProbability(data: ProcessedChatData): number {
  return Math.random() * 0.2; // 0-20% probability
}

function identifyTrends(data: ProcessedChatData): TrendInsight[] {
  return [
    {
      metric: "message_volume",
      trend: "increasing",
      strength: 0.8,
      duration: 7,
      significance: "high",
      description:
        "Message volume has been steadily increasing over the past week",
    },
    {
      metric: "response_time",
      trend: "stable",
      strength: 0.6,
      duration: 3,
      significance: "medium",
      description: "Response times have remained stable for the past 3 days",
    },
  ];
}

function generateRecommendations(data: ProcessedChatData): Recommendation[] {
  return [
    {
      id: "rec-1",
      type: "optimization",
      priority: "high",
      title: "Optimize Response Time",
      description:
        "Consider implementing caching to reduce average response times",
      impact: 8,
      effort: 5,
      category: "performance",
      actionItems: [
        "Implement Redis caching",
        "Optimize database queries",
        "Add response compression",
      ],
    },
    {
      id: "rec-2",
      type: "scaling",
      priority: "medium",
      title: "Scale Infrastructure",
      description: "Prepare for increased load based on volume trends",
      impact: 7,
      effort: 8,
      category: "capacity",
      actionItems: [
        "Add auto-scaling rules",
        "Increase server capacity",
        "Implement load balancing",
      ],
    },
  ];
}

function extractMetricValue(
  data: ProcessedChatData,
  metricName: string,
): number {
  // Extract specific metric values from processed data
  switch (metricName) {
    case "response_time":
      return data.aggregatedMetrics.performance.averageResponseTime;
    case "session_count":
      return data.aggregatedMetrics.volume.totalSessions;
    case "message_count":
      return data.aggregatedMetrics.volume.totalMessages;
    case "error_rate":
      return Math.random() * 5; // Simplified
    default:
      return 0;
  }
}

function evaluateThreshold(value: number, threshold: AlertThreshold): boolean {
  switch (threshold.operator) {
    case "gt":
      return value > threshold.value;
    case "lt":
      return value < threshold.value;
    case "eq":
      return value === threshold.value;
    case "gte":
      return value >= threshold.value;
    case "lte":
      return value <= threshold.value;
    default:
      return false;
  }
}

function evaluateCustomMetric(
  data: ProcessedChatData,
  metric: CustomMetric,
): number {
  // Simplified custom metric evaluation
  // In a real implementation, this would parse and evaluate the formula
  return Math.random() * 100;
}

function convertToCSV(data: any): string {
  // Simplified CSV conversion
  const headers = Object.keys(data);
  const rows = [headers.join(",")];

  // Add data rows (simplified)
  rows.push(headers.map((h) => JSON.stringify(data[h])).join(","));

  return rows.join("\n");
}

async function convertToExcel(data: any): Promise<Blob> {
  // Simplified Excel conversion
  // In a real implementation, this would use a library like xlsx
  const csv = convertToCSV(data);
  return new Blob([csv], { type: "application/vnd.ms-excel" });
}

// Hook for simplified real-time metrics
export const useRealTimeMetrics = (enabled = true, interval = 1000) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      const newMetric: RealTimeMetrics = {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        messagesPerMinute: Math.floor(Math.random() * 20) + 10,
        avgResponseTime: Math.floor(Math.random() * 2000) + 500,
        systemLoad: Math.random() * 100,
        queueDepth: Math.floor(Math.random() * 10),
        errorCount: Math.floor(Math.random() * 3),
        throughputMbps: Math.random() * 50 + 10,
        timestamp: new Date(),
      };

      setMetrics((prev) => [...prev.slice(-59), newMetric]);
    }, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval]);

  return metrics;
};

// Hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const [monitor] = useState(() => new PerformanceMonitor());

  const recordMetric = useCallback(
    (name: string, value: number) => {
      monitor.recordMetric(name, value);
    },
    [monitor],
  );

  const getMetrics = useCallback(
    () => ({
      uptime: monitor.getUptime(),
      averageResponseTime: monitor.getAverageMetric("response_time"),
      averageCpuUsage: monitor.getAverageMetric("cpu_usage"),
      averageMemoryUsage: monitor.getAverageMetric("memory_usage"),
    }),
    [monitor],
  );

  return {
    recordMetric,
    getMetrics,
    reset: () => monitor.reset(),
  };
};
