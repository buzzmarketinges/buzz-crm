"use client"
import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

// Data passed as props now

interface RevenueChartProps {
    data: any[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    const [activeSeries, setActiveSeries] = React.useState<{
        total: boolean
        recurring: boolean
        punctual: boolean
    }>({
        total: true,
        recurring: true,
        punctual: true
    })

    const [timeRange, setTimeRange] = React.useState<'3M' | '6M' | '12M' | 'YTD'>('12M')

    const toggleSeries = (key: keyof typeof activeSeries) => {
        setActiveSeries(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // Filter Data based on Time Range
    const chartData = React.useMemo(() => {
        if (!data || data.length === 0) return []

        const lastIndex = data.length - 1
        // Assuming data is sorted chronologically

        switch (timeRange) {
            case '3M':
                return data.slice(Math.max(0, data.length - 3))
            case '6M':
                return data.slice(Math.max(0, data.length - 6))
            case '12M':
                return data
            case 'YTD':
                // Find index of January of the current year (which should be the year of the last data point)
                if (lastIndex >= 0) {
                    const currentYear = data[lastIndex].year
                    return data.filter(d => d.year === currentYear)
                }
                return data
            default:
                return data
        }
    }, [data, timeRange])

    // Helper to determine opacity based on state
    const getOpacity = (key: keyof typeof activeSeries) => activeSeries[key] ? 1 : 0.1
    const getFillOpacity = (key: keyof typeof activeSeries) => activeSeries[key] ? 0.3 : 0.05

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
                    <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{d.fullName || label}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4 text-xs">
                            <span className="text-violet-600 font-medium">Total:</span>
                            <span className="font-bold text-slate-700">{d.total.toFixed(2).replace('.', ',')}€</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                            <span className="text-cyan-600 font-medium">Recurrentes:</span>
                            <span className="font-bold text-slate-700">{d.recurring.toFixed(2).replace('.', ',')}€</span>
                        </div>
                        <div className="flex justify-between gap-4 text-xs">
                            <span className="text-rose-600 font-medium">Puntual:</span>
                            <span className="font-bold text-slate-700">{d.punctual.toFixed(2).replace('.', ',')}€</span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="col-span-4 shadow-sm border-none bg-white/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">Resumen Financiero</CardTitle>
                        <CardDescription className="text-slate-500">Volumen de facturación real</CardDescription>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                        {/* Time Range Filters */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {(['3M', '6M', '12M', 'YTD'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeRange === range
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Series Filters */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleSeries('total')}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${activeSeries.total ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-50'}`}
                            >
                                Total
                            </button>
                            <button
                                onClick={() => toggleSeries('recurring')}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${activeSeries.recurring ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-50'}`}
                            >
                                Recurrente
                            </button>
                            <button
                                onClick={() => toggleSeries('punctual')}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${activeSeries.punctual ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-50'}`}
                            >
                                Puntual
                            </button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRecurring" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPunctual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}€`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />

                            {/* Total Line (Purple) */}
                            <Area
                                type="monotone"
                                dataKey="total"
                                name="Total"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                strokeOpacity={getOpacity('total')}
                                fillOpacity={getFillOpacity('total')}
                                fill="url(#colorTotal)"
                                animationDuration={500}
                            />
                            {/* Recurring Line (Cyan) */}
                            <Area
                                type="monotone"
                                dataKey="recurring"
                                name="Recurrente"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                strokeOpacity={getOpacity('recurring')}
                                fillOpacity={getFillOpacity('recurring')}
                                fill="url(#colorRecurring)"
                                animationDuration={500}
                            />
                            {/* Punctual Line (Rose) */}
                            <Area
                                type="monotone"
                                dataKey="punctual"
                                name="Puntual"
                                stroke="#f43f5e"
                                strokeWidth={2}
                                strokeOpacity={getOpacity('punctual')}
                                fillOpacity={getFillOpacity('punctual')}
                                fill="url(#colorPunctual)"
                                animationDuration={500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
