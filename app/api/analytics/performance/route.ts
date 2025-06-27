import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Define the performance metric types
interface PerformanceMetric {
    name: string
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    timestamp: number
    url: string
    userAgent: string
}

interface APIPerformanceMetric {
    endpoint: string
    method: string
    duration: number
    status: number
    timestamp: number
    success: boolean
}

type MetricData = PerformanceMetric | APIPerformanceMetric | {
    type: string
    page?: string
    action?: string
    element?: string
    component?: string
    duration: number
    timestamp: number
    url?: string
}

// POST endpoint for collecting metrics
export async function POST(request: NextRequest) {
    try {
        // Check if request has content before parsing
        const contentLength = request.headers.get('content-length')
        if (!contentLength || contentLength === '0') {
            return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
        }
        
        // Safely parse JSON with better error handling
        let data: MetricData
        try {
            const text = await request.text()
            if (!text || text.trim() === '') {
                return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
            }
            data = JSON.parse(text)
        } catch (jsonError) {
            console.error('JSON parsing error:', jsonError)
            return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
        }
        
        // Validate that data is an object
        if (!data || typeof data !== 'object') {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
        }
        
        // Basic validation for required fields
        if (!('timestamp' in data) || typeof data.timestamp !== 'number') {
            return NextResponse.json({ error: 'Missing or invalid timestamp' }, { status: 400 })
        }
        const supabase = await createServerSupabaseClient()

        // Get user info if available
        const { data: { user } } = await supabase.auth.getUser()

        // Insert the metric into the database
        const { error } = await supabase
            .from('performance_metrics')
            .insert({
                user_id: user?.id || null,
                metric_type: ('type' in data) ? data.type || 'unknown' :
                    ('endpoint' in data) ? 'api' : 'web-vitals',
                metric_name: 'metric_name' in data ? data.metric_name :
                    'endpoint' in data ? data.endpoint :
                        'page' in data ? data.page :
                            'action' in data ? data.action : 'unknown',
                value: 'value' in data ? data.value :
                    'duration' in data ? data.duration : 0,
                rating: 'rating' in data ? data.rating : null,
                url: 'url' in data ? data.url : null,
                user_agent: 'userAgent' in data ? data.userAgent :
                    request.headers.get('user-agent'),
                additional_data: {
                    ...data,
                    ip: request.headers.get('x-forwarded-for') ||
                        request.headers.get('x-real-ip') || 'unknown'
                }
            })

        if (error) {
            console.error('Error inserting performance metric:', error)
            return NextResponse.json(
                { error: 'Failed to store metric' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        console.error('Error processing performance metric:', error)
        return NextResponse.json(
            { error: 'Invalid request data' },
            { status: 400 }
        )
    }
}

// GET endpoint for retrieving metrics (for dashboard)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { searchParams } = new URL(request.url)

        const summary = searchParams.get('summary') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')
        const metricType = searchParams.get('type')
        const timeRange = searchParams.get('range') || '24h' // 1h, 24h, 7d, 30d

        // Calculate time range
        const now = new Date()
        const fromTime = new Date()
        switch (timeRange) {
            case '1h':
                fromTime.setHours(now.getHours() - 1)
                break
            case '24h':
                fromTime.setDate(now.getDate() - 1)
                break
            case '7d':
                fromTime.setDate(now.getDate() - 7)
                break
            case '30d':
                fromTime.setDate(now.getDate() - 30)
                break
        }

        // Build base query
        let query = supabase
            .from('performance_metrics')
            .select('*')
            .gte('created_at', fromTime.toISOString())
            .order('created_at', { ascending: false })

        // Apply filters
        if (metricType) {
            query = query.eq('metric_type', metricType)
        }

        if (!summary) {
            query = query.limit(limit)
        }

        const { data: metrics, error } = await query

        if (error) {
            console.error('Error fetching performance metrics:', error)
            return NextResponse.json(
                { error: 'Failed to fetch metrics' },
                { status: 500 }
            )
        }

        if (summary) {
            // Generate summary statistics
            const summaryData = generateSummary(metrics || [])

            return NextResponse.json({
                summary: summaryData,
                metrics: (metrics || []).slice(0, limit),
                count: metrics?.length || 0,
                timeRange
            })
        }

        return NextResponse.json({
            metrics: metrics || [],
            count: metrics?.length || 0,
            timeRange
        })
    } catch (error) {
        console.error('Error in GET performance metrics:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Generate summary statistics for metrics
function generateSummary(metrics: Array<{
    metric_name: string;
    value: number;
    created_at: string;
    [key: string]: unknown;
}>) {
    const grouped = metrics.reduce((acc, metric) => {
        const key = metric.metric_name
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(metric)
        return acc
    }, {} as Record<string, typeof metrics>)

    return Object.entries(grouped).map(([name, values]) => {
        const metricsArray = values
        const numericValues = metricsArray.map(v => v.value).filter(v => !isNaN(v))
        const average = numericValues.length > 0
            ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
            : 0

        const lastValue = metricsArray[0]?.value || 0
        const previousValue = metricsArray[1]?.value || lastValue

        // Determine trend
        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (lastValue > previousValue * 1.1) trend = 'up'
        else if (lastValue < previousValue * 0.9) trend = 'down'

        // Determine rating based on metric name and average value
        let rating = 'good'
        if (name === 'LCP') {
            rating = average <= 2500 ? 'good' : average <= 4000 ? 'needs-improvement' : 'poor'
        } else if (name === 'INP') {
            rating = average <= 200 ? 'good' : average <= 500 ? 'needs-improvement' : 'poor'
        } else if (name === 'CLS') {
            rating = average <= 0.1 ? 'good' : average <= 0.25 ? 'needs-improvement' : 'poor'
        } else if (name === 'FCP') {
            rating = average <= 1800 ? 'good' : average <= 3000 ? 'needs-improvement' : 'poor'
        } else if (name === 'TTFB') {
            rating = average <= 800 ? 'good' : average <= 1800 ? 'needs-improvement' : 'poor'
        } else if (name.startsWith('/api/')) {
            // API endpoint performance
            rating = average <= 200 ? 'good' : average <= 500 ? 'needs-improvement' : 'poor'
        }

        return {
            name,
            average,
            count: metricsArray.length,
            rating,
            trend,
            lastValue
        }
    }).sort((a, b) => {
        // Sort Core Web Vitals first, then API endpoints
        const coreVitals = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']
        const aIsCore = coreVitals.includes(a.name)
        const bIsCore = coreVitals.includes(b.name)

        if (aIsCore && !bIsCore) return -1
        if (!aIsCore && bIsCore) return 1
        if (aIsCore && bIsCore) {
            return coreVitals.indexOf(a.name) - coreVitals.indexOf(b.name)
        }

        return b.count - a.count // Sort by frequency for non-core vitals
    })
} 