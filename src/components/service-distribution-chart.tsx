"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts"

const COLORS = [
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#eab308', // Yellow
    '#10b981', // Emerald
    '#6366f1'  // Indigo
];

interface ServiceDistributionChartProps {
    data: any[]
}

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 8}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            cornerRadius={6}
        />
    );
};

export function ServiceDistributionChart({ data }: ServiceDistributionChartProps) {
    const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

    // Calculate Total
    const totalValue = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data])

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index)
    }

    const onPieLeave = () => {
        setActiveIndex(undefined)
    }

    return (
        <Card className="col-span-3 shadow-sm border-none bg-white/50 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-slate-800">Distribución de Servicios</CardTitle>
                <CardDescription className="text-slate-500">Por valor facturado este mes</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center pb-6">
                <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {/* @ts-ignore */}
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                onMouseLeave={onPieLeave}
                                cornerRadius={6}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        className="transition-all duration-300 focus:outline-none"
                                    />
                                ))}
                            </Pie>
                            {/* Center Text Overlay */}
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                <tspan x="50%" dy="-1em" fontSize="14" fill="#64748b" fontWeight="500">
                                    {activeIndex !== undefined && data[activeIndex]
                                        ? (data[activeIndex].name.length > 20 ? data[activeIndex].name.substring(0, 18) + '...' : data[activeIndex].name)
                                        : "Total"
                                    }
                                </tspan>
                                <tspan x="50%" dy="1.6em" fontSize="24" fill="#1e293b" fontWeight="bold">
                                    {activeIndex !== undefined && data[activeIndex]
                                        ? `${data[activeIndex].value.toFixed(0)}€`
                                        : `${totalValue.toFixed(0)}€`
                                    }
                                </tspan>
                                {activeIndex !== undefined && data[activeIndex] && (
                                    <tspan x="50%" dy="1.6em" fontSize="12" fill="#94a3b8">
                                        {`${data[activeIndex].percentage.toFixed(1)}%`}
                                    </tspan>
                                )}
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4 px-2">
                    {data.map((entry, index) => (
                        <div
                            key={`legend-${index}`}
                            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${activeIndex === index ? 'bg-slate-100 scale-105' : 'hover:bg-slate-50'
                                }`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(undefined)}
                        >
                            <div
                                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className={`text-xs font-medium truncate ${activeIndex === index ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {entry.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {entry.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
