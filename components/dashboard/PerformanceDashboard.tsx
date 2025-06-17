'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface PerformanceMetric {
    id: string
    metric_type: string
    metric_name: string
    value: number
    rating?: string
    url?: string
    created_at: string
    additional_data?: Record<string, unknown>
}

interface MetricSummary {
    name: string
    average: number
    count: number
    rating: string
    trend: 'up' | 'down' | 'stable'
    lastValue: number
}

export function PerformanceDashboard() {
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
    const [summary, setSummary] = useState<MetricSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const fetchMetrics = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/analytics/performance?summary=true&limit=100')
            if (response.ok) {
                const data = await response.json()
                setMetrics(data.metrics || [])
                setSummary(data.summary || [])
                setLastUpdate(new Date())
            }
        } catch (error) {
            console.error('Failed to fetch performance metrics:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics()

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchMetrics, 30000)
        return () => clearInterval(interval)
    }, [])

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'good': return 'bg-green-100 text-green-800 border-green-200'
            case 'needs-improvement': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'poor': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
            case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
            default: return <div className="h-4 w-4" />
        }
    }

    const formatValue = (value: number, metricName: string) => {
        if (metricName === 'CLS') {
            return value.toFixed(3)
        }
        return `${Math.round(value)}ms`
    }

    const coreWebVitals = summary.filter(s =>
        ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].includes(s.name)
    )

    const apiMetrics = summary.filter(s => s.name.startsWith('/api/'))

    const getOverallHealth = () => {
        const goodMetrics = coreWebVitals.filter(m => m.rating === 'good').length
        const totalMetrics = coreWebVitals.length

        if (totalMetrics === 0) return { status: 'unknown', color: 'gray' }

        const ratio = goodMetrics / totalMetrics
        if (ratio >= 0.8) return { status: 'excellent', color: 'green' }
        if (ratio >= 0.6) return { status: 'good', color: 'yellow' }
        return { status: 'needs attention', color: 'red' }
    }

    const health = getOverallHealth()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Performance Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time performance metrics and Core Web Vitals
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </div>
                    <Button
                        onClick={fetchMetrics}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Overall Health */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {health.color === 'green' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {health.color === 'yellow' && <Clock className="h-5 w-5 text-yellow-500" />}
                        {health.color === 'red' && <AlertCircle className="h-5 w-5 text-red-500" />}
                        Overall Performance Health
                    </CardTitle>
                    <CardDescription>
                        Performance health based on Core Web Vitals compliance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Badge className={getRatingColor(health.status)}>
                            {health.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {coreWebVitals.filter(m => m.rating === 'good').length} of {coreWebVitals.length} metrics performing well
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Core Web Vitals */}
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Core Web Vitals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {coreWebVitals.map((metric) => (
                        <Card key={metric.name}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center justify-between">
                                    {metric.name}
                                    {getTrendIcon(metric.trend)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-2xl font-bold">
                                        {formatValue(metric.average, metric.name)}
                                    </div>
                                    <Badge className={getRatingColor(metric.rating)}>
                                        {metric.rating}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground">
                                        {metric.count} samples
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* API Performance */}
            {apiMetrics.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">API Performance</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {apiMetrics.slice(0, 6).map((metric) => (
                            <Card key={metric.name}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                        <span className="truncate">{metric.name}</span>
                                        {getTrendIcon(metric.trend)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-lg font-semibold">
                                                {Math.round(metric.average)}ms
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                avg from {metric.count} calls
                                            </div>
                                        </div>
                                        <Badge className={
                                            metric.average < 200 ? 'bg-green-100 text-green-800' :
                                                metric.average < 500 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                        }>
                                            {metric.average < 200 ? 'Fast' :
                                                metric.average < 500 ? 'Moderate' : 'Slow'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Metrics */}
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Performance Events</CardTitle>
                        <CardDescription>
                            Most recent performance measurements
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {metrics.slice(0, 10).map((metric) => (
                                <div
                                    key={metric.id}
                                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">
                                                {metric.metric_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {metric.metric_type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm">
                                            {formatValue(metric.value, metric.metric_name)}
                                        </span>
                                        {metric.rating && (
                                            <Badge className={getRatingColor(metric.rating)}>
                                                {metric.rating}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(metric.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {metrics.length === 0 && !loading && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No performance metrics available yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 