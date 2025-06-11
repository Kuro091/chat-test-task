"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  Sankey,
  FunnelChart,
  Funnel,
  LabelList,
  ReferenceLine,
  ReferenceArea,
  Brush,
  ErrorBar,
  RectangleProps,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  Zap,
  Eye,
  EyeOff,
  Download,
  Maximize,
  Minimize,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Filter,
  Layers,
  Grid,
  Target,
  Crosshair,
  MousePointer,
  Move,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Save,
  Share,
  Copy,
  Edit3,
  Trash2,
  Plus,
} from "lucide-react";
import { ChatSession, ChatMessageType } from "@/types/chat";
import { ProcessedChatData } from "@/lib/dataProcessing";

// Visualization configuration interfaces
export interface VisualizationConfig {
  chartType: ChartType;
  dataSource: DataSource;
  timeRange: TimeRange;
  aggregation: AggregationType;
  filters: VisualizationFilter[];
  styling: ChartStyling;
  interactions: InteractionConfig;
  annotations: Annotation[];
  customizations: ChartCustomization[];
}

export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "column"
  | "pie"
  | "donut"
  | "scatter"
  | "bubble"
  | "radar"
  | "treemap"
  | "sankey"
  | "funnel"
  | "gauge"
  | "heatmap"
  | "candlestick"
  | "waterfall"
  | "combo";

export type DataSource =
  | "sessions"
  | "messages"
  | "response_times"
  | "user_activity"
  | "sentiment"
  | "topics"
  | "performance"
  | "errors"
  | "custom";

export type TimeRange =
  | "1h"
  | "6h"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "1y"
  | "all";

export type AggregationType =
  | "sum"
  | "avg"
  | "count"
  | "min"
  | "max"
  | "median"
  | "p95"
  | "p99";

export interface VisualizationFilter {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "in"
    | "nin"
    | "contains";
  value: any;
  enabled: boolean;
}

export interface ChartStyling {
  theme: "light" | "dark" | "auto";
  colorScheme: ColorScheme;
  gridLines: boolean;
  legend: LegendConfig;
  axis: AxisConfig;
  animations: AnimationConfig;
}

export interface ColorScheme {
  primary: string[];
  secondary: string[];
  accent: string[];
  gradient: boolean;
  opacity: number;
}

export interface LegendConfig {
  show: boolean;
  position: "top" | "bottom" | "left" | "right";
  align: "start" | "center" | "end";
  orientation: "horizontal" | "vertical";
}

export interface AxisConfig {
  xAxis: {
    show: boolean;
    label: string;
    format: string;
    scale: "linear" | "log" | "time";
  };
  yAxis: {
    show: boolean;
    label: string;
    format: string;
    scale: "linear" | "log";
    min?: number;
    max?: number;
  };
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  delay: number;
}

export interface InteractionConfig {
  zoom: boolean;
  pan: boolean;
  brush: boolean;
  crosshair: boolean;
  tooltip: TooltipConfig;
  clickEvents: boolean;
  hoverEffects: boolean;
}

export interface TooltipConfig {
  enabled: boolean;
  formatter: "default" | "custom";
  customTemplate?: string;
  showLabel: boolean;
  showValue: boolean;
  showPercentage: boolean;
}

export interface Annotation {
  id: string;
  type: "line" | "area" | "point" | "text" | "arrow";
  position: { x: number | string; y: number | string };
  content: string;
  style: AnnotationStyle;
  visible: boolean;
}

export interface AnnotationStyle {
  color: string;
  strokeWidth: number;
  fontSize: number;
  fontWeight: "normal" | "bold";
  opacity: number;
}

export interface ChartCustomization {
  id: string;
  name: string;
  description: string;
  config: Partial<VisualizationConfig>;
  preview?: string;
  category: string;
}

export interface ChartVisualizationProps {
  data: ProcessedChatData;
  sessions: ChatSession[];
  config?: Partial<VisualizationConfig>;
  height?: number;
  width?: number;
  responsive?: boolean;
  onConfigChange?: (config: VisualizationConfig) => void;
  onDataExport?: (data: any, format: string) => void;
}

const DEFAULT_COLORS = {
  primary: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"],
  secondary: ["#8dd1e1", "#d084d0", "#ffb347", "#87ceeb", "#dda0dd"],
  accent: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"],
};

const CHART_THEMES = {
  light: {
    background: "#ffffff",
    grid: "#f0f0f0",
    text: "#333333",
    tooltip: "#ffffff",
  },
  dark: {
    background: "#1a1a1a",
    grid: "#404040",
    text: "#ffffff",
    tooltip: "#2a2a2a",
  },
};

export const ChatVisualization: React.FC<ChartVisualizationProps> = ({
  data,
  sessions,
  config = {},
  height = 400,
  width,
  responsive = true,
  onConfigChange,
  onDataExport,
}) => {
  // State management
  const [visualizationConfig, setVisualizationConfig] =
    useState<VisualizationConfig>({
      chartType: "line",
      dataSource: "sessions",
      timeRange: "24h",
      aggregation: "count",
      filters: [],
      styling: {
        theme: "light",
        colorScheme: {
          primary: DEFAULT_COLORS.primary,
          secondary: DEFAULT_COLORS.secondary,
          accent: DEFAULT_COLORS.accent,
          gradient: false,
          opacity: 1,
        },
        gridLines: true,
        legend: {
          show: true,
          position: "bottom",
          align: "center",
          orientation: "horizontal",
        },
        axis: {
          xAxis: {
            show: true,
            label: "Time",
            format: "auto",
            scale: "time",
          },
          yAxis: {
            show: true,
            label: "Count",
            format: "auto",
            scale: "linear",
          },
        },
        animations: {
          enabled: true,
          duration: 800,
          easing: "ease-in-out",
          delay: 0,
        },
      },
      interactions: {
        zoom: true,
        pan: false,
        brush: false,
        crosshair: true,
        tooltip: {
          enabled: true,
          formatter: "default",
          showLabel: true,
          showValue: true,
          showPercentage: false,
        },
        clickEvents: true,
        hoverEffects: true,
      },
      annotations: [],
      customizations: [],
      ...config,
    });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [selectedDataPoints, setSelectedDataPoints] = useState<any[]>([]);
  const [zoomDomain, setZoomDomain] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    "png" | "svg" | "pdf" | "csv"
  >("png");

  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process and transform data based on configuration
  const chartData = useMemo(() => {
    return processDataForVisualization(data, sessions, visualizationConfig);
  }, [data, sessions, visualizationConfig]);

  // Chart dimension calculations
  const chartDimensions = useMemo(() => {
    if (!responsive) {
      return { width: width || 800, height };
    }

    if (isFullscreen && containerRef.current) {
      return {
        width: window.innerWidth - 100,
        height: window.innerHeight - 200,
      };
    }

    return {
      width: width || "100%",
      height,
    };
  }, [width, height, responsive, isFullscreen]);

  // Color palette based on theme and configuration
  const colorPalette = useMemo(() => {
    const { colorScheme, theme } = visualizationConfig.styling;
    const baseColors = colorScheme.primary;

    if (colorScheme.gradient) {
      return baseColors.map((color, index) => ({
        color,
        gradient: `linear-gradient(45deg, ${color}, ${colorScheme.secondary[index] || color})`,
      }));
    }

    return baseColors.map((color) => ({ color, gradient: null }));
  }, [visualizationConfig.styling]);

  // Update configuration
  const updateConfig = useCallback(
    (updates: Partial<VisualizationConfig>) => {
      const newConfig = { ...visualizationConfig, ...updates };
      setVisualizationConfig(newConfig);
      onConfigChange?.(newConfig);
    },
    [visualizationConfig, onConfigChange],
  );

  // Export functionality
  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;

    setIsLoading(true);
    try {
      let exportData;

      switch (exportFormat) {
        case "png":
        case "svg":
          exportData = await exportChartAsImage(chartRef.current, exportFormat);
          break;
        case "pdf":
          exportData = await exportChartAsPDF(
            chartRef.current,
            visualizationConfig,
          );
          break;
        case "csv":
          exportData = exportChartDataAsCSV(chartData);
          break;
      }

      onDataExport?.(exportData, exportFormat);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [exportFormat, chartData, visualizationConfig, onDataExport]);

  // Chart event handlers
  const handleChartClick = useCallback(
    (data: any, event: any) => {
      if (!visualizationConfig.interactions.clickEvents) return;

      setSelectedDataPoints((prev) => {
        const isSelected = prev.some((point) => point.id === data.id);
        if (isSelected) {
          return prev.filter((point) => point.id !== data.id);
        } else {
          return [...prev, data];
        }
      });
    },
    [visualizationConfig.interactions.clickEvents],
  );

  const handleBrushChange = useCallback((domain: any) => {
    setZoomDomain(domain);
  }, []);

  // Render different chart types
  const renderChart = () => {
    const { chartType, styling, interactions } = visualizationConfig;
    const { width: chartWidth, height: chartHeight } = chartDimensions;

    const commonProps = {
      data: chartData,
      width: chartWidth,
      height: chartHeight,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    const commonAxisProps = {
      xAxis: styling.axis.xAxis.show ? (
        <XAxis
          dataKey="x"
          tick={{ fontSize: 12, fill: CHART_THEMES[styling.theme].text }}
          tickLine={{ stroke: CHART_THEMES[styling.theme].grid }}
          axisLine={{ stroke: CHART_THEMES[styling.theme].grid }}
        />
      ) : (
        false
      ),
      yAxis: styling.axis.yAxis.show ? (
        <YAxis
          tick={{ fontSize: 12, fill: CHART_THEMES[styling.theme].text }}
          tickLine={{ stroke: CHART_THEMES[styling.theme].grid }}
          axisLine={{ stroke: CHART_THEMES[styling.theme].grid }}
          domain={
            styling.axis.yAxis.min !== undefined
              ? [styling.axis.yAxis.min, styling.axis.yAxis.max || "dataMax"]
              : undefined
          }
        />
      ) : (
        false
      ),
      grid: styling.gridLines ? (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_THEMES[styling.theme].grid}
          opacity={0.3}
        />
      ) : null,
      tooltip: interactions.tooltip.enabled ? (
        <Tooltip
          contentStyle={{
            backgroundColor: CHART_THEMES[styling.theme].tooltip,
            border: `1px solid ${CHART_THEMES[styling.theme].grid}`,
            borderRadius: 4,
            color: CHART_THEMES[styling.theme].text,
          }}
          formatter={(value: any, name: string) => {
            if (interactions.tooltip.formatter === "custom") {
              return formatCustomTooltip(value, name, interactions.tooltip);
            }
            return [value, name];
          }}
        />
      ) : (
        false
      ),
      legend: styling.legend.show ? (
        <Legend
          verticalAlign={styling.legend.position as any}
          align={styling.legend.align as any}
          layout={
            styling.legend.orientation === "horizontal"
              ? "horizontal"
              : "vertical"
          }
        />
      ) : (
        false
      ),
    };

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <LineChart {...commonProps} onClick={handleChartClick}>
              {commonAxisProps.grid}
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              {interactions.brush && <Brush dataKey="x" height={30} />}
              {colorPalette.map((color, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`y${index}`}
                  stroke={color.color}
                  strokeWidth={2}
                  dot={{ fill: color.color, r: 4 }}
                  activeDot={{ r: 6, fill: color.color }}
                  animationDuration={
                    styling.animations.enabled ? styling.animations.duration : 0
                  }
                />
              ))}
              {visualizationConfig.annotations.map((annotation) =>
                renderAnnotation(annotation, chartType),
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <AreaChart {...commonProps} onClick={handleChartClick}>
              {commonAxisProps.grid}
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              {colorPalette.map((color, index) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={`y${index}`}
                  stroke={color.color}
                  fill={color.gradient || color.color}
                  fillOpacity={styling.colorScheme.opacity}
                  animationDuration={
                    styling.animations.enabled ? styling.animations.duration : 0
                  }
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "bar":
      case "column":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <BarChart {...commonProps} onClick={handleChartClick}>
              {commonAxisProps.grid}
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              {colorPalette.map((color, index) => (
                <Bar
                  key={index}
                  dataKey={`y${index}`}
                  fill={color.gradient || color.color}
                  fillOpacity={styling.colorScheme.opacity}
                  animationDuration={
                    styling.animations.enabled ? styling.animations.duration : 0
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={chartType === "donut" ? 100 : 120}
                innerRadius={chartType === "donut" ? 60 : 0}
                fill="#8884d8"
                onClick={handleChartClick}
                animationDuration={
                  styling.animations.enabled ? styling.animations.duration : 0
                }
                label={interactions.tooltip.showLabel}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorPalette[index % colorPalette.length].color}
                  />
                ))}
              </Pie>
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <ScatterChart {...commonProps} onClick={handleChartClick}>
              {commonAxisProps.grid}
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              <Scatter
                dataKey="y"
                fill={colorPalette[0].color}
                animationDuration={
                  styling.animations.enabled ? styling.animations.duration : 0
                }
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <RadarChart data={chartData}>
              <PolarGrid stroke={CHART_THEMES[styling.theme].grid} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 12, fill: CHART_THEMES[styling.theme].text }}
              />
              <PolarRadiusAxis
                tick={{ fontSize: 10, fill: CHART_THEMES[styling.theme].text }}
                domain={[0, "dataMax"]}
              />
              {colorPalette.map((color, index) => (
                <Radar
                  key={index}
                  name={`Series ${index + 1}`}
                  dataKey={`y${index}`}
                  stroke={color.color}
                  fill={color.color}
                  fillOpacity={styling.colorScheme.opacity}
                  animationDuration={
                    styling.animations.enabled ? styling.animations.duration : 0
                  }
                />
              ))}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
            </RadarChart>
          </ResponsiveContainer>
        );

      case "funnel":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <FunnelChart>
              <Funnel
                dataKey="value"
                data={chartData}
                isAnimationActive={styling.animations.enabled}
                animationDuration={styling.animations.duration}
              >
                <LabelList position="center" fill="#fff" stroke="none" />
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorPalette[index % colorPalette.length].color}
                  />
                ))}
              </Funnel>
              {commonAxisProps.tooltip}
            </FunnelChart>
          </ResponsiveContainer>
        );

      case "combo":
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <ComposedChart {...commonProps} onClick={handleChartClick}>
              {commonAxisProps.grid}
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.tooltip}
              {commonAxisProps.legend}
              <Bar
                dataKey="y0"
                fill={colorPalette[0].color}
                animationDuration={
                  styling.animations.enabled ? styling.animations.duration : 0
                }
              />
              <Line
                type="monotone"
                dataKey="y1"
                stroke={colorPalette[1].color}
                strokeWidth={2}
                animationDuration={
                  styling.animations.enabled ? styling.animations.duration : 0
                }
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type: {chartType}</div>;
    }
  };

  // Render annotations
  const renderAnnotation = (annotation: Annotation, chartType: ChartType) => {
    if (!annotation.visible) return null;

    switch (annotation.type) {
      case "line":
        return (
          <ReferenceLine
            key={annotation.id}
            x={annotation.position.x}
            stroke={annotation.style.color}
            strokeWidth={annotation.style.strokeWidth}
            strokeOpacity={annotation.style.opacity}
            label={{ value: annotation.content, position: "top" }}
          />
        );
      case "area":
        return (
          <ReferenceArea
            key={annotation.id}
            x1={annotation.position.x}
            x2={(annotation.position as any).x2}
            fill={annotation.style.color}
            fillOpacity={annotation.style.opacity}
          />
        );
      default:
        return null;
    }
  };

  // Configuration panel
  const renderConfigPanel = () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Chart Configuration
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfigPanelOpen(false)}
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Chart Type</Label>
          <Select
            value={visualizationConfig.chartType}
            onValueChange={(value: ChartType) =>
              updateConfig({ chartType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="scatter">Scatter Plot</SelectItem>
              <SelectItem value="radar">Radar Chart</SelectItem>
              <SelectItem value="funnel">Funnel Chart</SelectItem>
              <SelectItem value="combo">Combo Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Data Source</Label>
          <Select
            value={visualizationConfig.dataSource}
            onValueChange={(value: DataSource) =>
              updateConfig({ dataSource: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sessions">Sessions</SelectItem>
              <SelectItem value="messages">Messages</SelectItem>
              <SelectItem value="response_times">Response Times</SelectItem>
              <SelectItem value="sentiment">Sentiment</SelectItem>
              <SelectItem value="topics">Topics</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Time Range</Label>
          <Select
            value={visualizationConfig.timeRange}
            onValueChange={(value: TimeRange) =>
              updateConfig({ timeRange: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Theme</Label>
          <Select
            value={visualizationConfig.styling.theme}
            onValueChange={(value: "light" | "dark") =>
              updateConfig({
                styling: {
                  ...visualizationConfig.styling,
                  theme: value,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={visualizationConfig.styling.gridLines}
            onCheckedChange={(checked) =>
              updateConfig({
                styling: {
                  ...visualizationConfig.styling,
                  gridLines: checked,
                },
              })
            }
          />
          <Label>Show Grid Lines</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={visualizationConfig.styling.animations.enabled}
            onCheckedChange={(enabled) =>
              updateConfig({
                styling: {
                  ...visualizationConfig.styling,
                  animations: {
                    ...visualizationConfig.styling.animations,
                    enabled,
                  },
                },
              })
            }
          />
          <Label>Enable Animations</Label>
        </div>

        <div>
          <Label>Animation Duration (ms)</Label>
          <Slider
            value={[visualizationConfig.styling.animations.duration]}
            onValueChange={([duration]) =>
              updateConfig({
                styling: {
                  ...visualizationConfig.styling,
                  animations: {
                    ...visualizationConfig.styling.animations,
                    duration,
                  },
                },
              })
            }
            min={0}
            max={2000}
            step={100}
            className="mt-2"
          />
          <span className="text-gray-500 text-sm">
            {visualizationConfig.styling.animations.duration}ms
          </span>
        </div>

        <div>
          <Label>Color Opacity</Label>
          <Slider
            value={[visualizationConfig.styling.colorScheme.opacity * 100]}
            onValueChange={([opacity]) =>
              updateConfig({
                styling: {
                  ...visualizationConfig.styling,
                  colorScheme: {
                    ...visualizationConfig.styling.colorScheme,
                    opacity: opacity / 100,
                  },
                },
              })
            }
            min={10}
            max={100}
            step={10}
            className="mt-2"
          />
          <span className="text-gray-500 text-sm">
            {Math.round(visualizationConfig.styling.colorScheme.opacity * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {visualizationConfig.chartType.charAt(0).toUpperCase() +
                  visualizationConfig.chartType.slice(1)}
              </Badge>
              <Badge variant="outline">
                {visualizationConfig.dataSource.replace("_", " ").toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {visualizationConfig.timeRange.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
              >
                <Settings className="mr-1 w-4 h-4" />
                Configure
              </Button>

              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading}
              >
                <Download className="mr-1 w-4 h-4" />
                Export
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="flex space-x-4">
        {/* Chart Container */}
        <div
          ref={containerRef}
          className={`flex-1 ${isFullscreen ? "fixed inset-0 z-50 bg-white p-4" : ""}`}
        >
          <Card className="h-full">
            <CardContent className="p-4">
              {isLoading && (
                <div className="z-10 absolute inset-0 flex justify-center items-center bg-white bg-opacity-75">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                </div>
              )}

              <div ref={chartRef}>{renderChart()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        {isConfigPanelOpen && renderConfigPanel()}
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex justify-between items-center text-gray-500 text-sm">
            <div className="flex items-center space-x-4">
              <span>Data Points: {chartData.length}</span>
              <span>Selected: {selectedDataPoints.length}</span>
              {zoomDomain && <span>Zoomed</span>}
            </div>

            <div className="flex items-center space-x-4">
              <span>Last Updated: {new Date().toLocaleTimeString()}</span>
              <span>Theme: {visualizationConfig.styling.theme}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility functions
function processDataForVisualization(
  data: ProcessedChatData,
  sessions: ChatSession[],
  config: VisualizationConfig,
): any[] {
  const { dataSource, timeRange, aggregation } = config;

  // Filter data based on time range
  const endTime = new Date();
  const startTime = getStartTimeFromRange(timeRange, endTime);

  let filteredData: any[] = [];

  switch (dataSource) {
    case "sessions":
      filteredData = sessions
        .filter((s) => s.createdAt >= startTime && s.createdAt <= endTime)
        .map((s) => ({
          x: s.createdAt.toISOString(),
          y: 1,
          id: s.id,
          name: `Session ${s.id.slice(0, 8)}`,
        }));
      break;

    case "messages":
      filteredData = sessions
        .flatMap((s) => s.messages)
        .filter((m) => m.timestamp >= startTime && m.timestamp <= endTime)
        .map((m) => ({
          x: m.timestamp.toISOString(),
          y: m.message.length,
          id: m.id,
          name: m.isAI ? "AI" : "User",
        }));
      break;

    case "sentiment":
      // Simulate sentiment data
      filteredData = [
        { name: "Positive", value: 60, color: "#10B981" },
        { name: "Neutral", value: 30, color: "#F59E0B" },
        { name: "Negative", value: 10, color: "#EF4444" },
      ];
      break;

    default:
      filteredData = [];
  }

  // Apply aggregation if needed
  if (aggregation !== "count" && filteredData.length > 0) {
    filteredData = applyAggregation(filteredData, aggregation);
  }

  return filteredData;
}

function getStartTimeFromRange(range: TimeRange, endTime: Date): Date {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  switch (range) {
    case "1h":
      return new Date(endTime.getTime() - hour);
    case "6h":
      return new Date(endTime.getTime() - 6 * hour);
    case "24h":
      return new Date(endTime.getTime() - day);
    case "7d":
      return new Date(endTime.getTime() - 7 * day);
    case "30d":
      return new Date(endTime.getTime() - 30 * day);
    case "90d":
      return new Date(endTime.getTime() - 90 * day);
    case "1y":
      return new Date(endTime.getTime() - 365 * day);
    default:
      return new Date(0);
  }
}

function applyAggregation(data: any[], aggregation: AggregationType): any[] {
  // Simplified aggregation logic
  return data; // Would implement actual aggregation here
}

function formatCustomTooltip(
  value: any,
  name: string,
  config: TooltipConfig,
): [string, string] {
  // Custom tooltip formatting logic
  return [value.toString(), name];
}

async function exportChartAsImage(
  chartElement: any,
  format: "png" | "svg",
): Promise<Blob> {
  // Chart image export logic (would use html2canvas or similar)
  return new Blob([], { type: `image/${format}` });
}

async function exportChartAsPDF(
  chartElement: any,
  config: VisualizationConfig,
): Promise<Blob> {
  // PDF export logic
  return new Blob([], { type: "application/pdf" });
}

function exportChartDataAsCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = [headers.join(",")];

  data.forEach((item) => {
    const values = headers.map((header) => JSON.stringify(item[header] || ""));
    rows.push(values.join(","));
  });

  return rows.join("\n");
}
