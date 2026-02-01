'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowUpRight, DollarSign, Activity, AlertCircle, TrendingUp, TrendingDown, Euro, RefreshCcw } from "lucide-react"
import { RevenueChart } from "@/components/revenue-chart"
import { ServiceDistributionChart } from "@/components/service-distribution-chart"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function DashboardContent({ stats }: { stats: any }) {
    const [showNet, setShowNet] = useState(false) // Default to Gross ("Total") as per user "Facturación Total" being one option

    // Helper to get value based on mode
    const getVal = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj || 0
        return showNet ? obj.net : obj.gross
    }

    // For charts, we need to map the data array specifically
    const revenueChartData = stats.revenueChartData.map((d: any) => ({
        ...d,
        total: showNet ? d.total.net : d.total.gross,
        recurring: showNet ? d.recurring.net : d.recurring.gross,
        punctual: showNet ? d.punctual.net : d.punctual.gross
    }))

    const serviceDistributionData = stats.serviceDistributionData.map((d: any) => ({
        name: d.name,
        value: showNet ? d.net : d.gross,
        percentage: showNet ? d.percentageNet : d.percentageGross
    }))

    const recurringRevenue = getVal(stats.recurringRevenue)
    const monthlyInvoiced = getVal(stats.monthlyInvoiced)

    // Growth also has .net/.gross
    const recurringGrowth = getVal(stats.recurringGrowth)
    const monthlyInvoicedGrowth = getVal(stats.monthlyInvoicedGrowth)

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-700">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Resumen de la actividad y estado financiero.</p>
                </div>

                <div className="flex items-center gap-6">
                    {/* Net/Gross Switch */}
                    <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
                        <Switch id="net-mode" checked={showNet} onCheckedChange={setShowNet} />
                        <Label htmlFor="net-mode" className="text-sm font-medium text-slate-700 cursor-pointer">
                            {showNet ? "Facturación Neta (Sin Impuestos)" : "Facturación Total (Con Impuestos)"}
                        </Label>
                    </div>

                    <div className="flex gap-2">
                        <Link href="/clients/new">
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 transition-all active:scale-95">
                                Nuevo Cliente
                            </Button>
                        </Link>
                        <Link href="/billing">
                            <Button variant="outline" className="text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
                                Ver Facturas
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-none bg-white/50 backdrop-blur-sm group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Recurrentes (Mensual)</CardTitle>
                        <div className="p-2 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                            <RefreshCcw className="h-4 w-4 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{recurringRevenue.toFixed(2).replace('.', ',')}€</div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center">
                            {recurringGrowth >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                            )}
                            <span className={recurringGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {recurringGrowth > 0 ? '+' : ''}{recurringGrowth.toFixed(1).replace('.', ',')}%
                            </span>
                            <span className="ml-1">vs mes anterior</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-none bg-white/50 backdrop-blur-sm group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Facturado este Mes</CardTitle>
                        <div className="p-2 bg-amber-50 rounded-full group-hover:bg-amber-100 transition-colors">
                            <Euro className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">{monthlyInvoiced.toFixed(2).replace('.', ',')}€</div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center">
                            {monthlyInvoicedGrowth >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                            )}
                            <span className={monthlyInvoicedGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {monthlyInvoicedGrowth > 0 ? '+' : ''}{monthlyInvoicedGrowth.toFixed(1).replace('.', ',')}%
                            </span>
                            <span className="ml-1">vs mes anterior</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-none bg-white/50 backdrop-blur-sm group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">% Impagados</CardTitle>
                        <div className="p-2 bg-rose-50 rounded-full group-hover:bg-rose-100 transition-colors">
                            <AlertCircle className="h-4 w-4 text-rose-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.unpaidPercentage > 20 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {stats.unpaidPercentage.toFixed(1)}%
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            {stats.unpaidPercentage > 20 ? 'Atención necesaria' : 'Ratio saludable'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpRight className="h-24 w-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-slate-200">Objetivo Anual</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-slate-300" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-bold text-white">
                                {(() => {
                                    const last12Revenue = revenueChartData.reduce((acc: number, curr: any) => acc + curr.total, 0)
                                    const goal = stats.yearlyGoal
                                    const percentage = goal > 0 ? (last12Revenue / goal) * 100 : 0
                                    return `${percentage.toFixed(0)}%`
                                })()}
                            </span>
                            <span className="text-sm font-medium text-slate-300">
                                {(() => {
                                    const last12Revenue = revenueChartData.reduce((acc: number, curr: any) => acc + curr.total, 0)
                                    return `${last12Revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ Acumulado`
                                })()}
                            </span>
                        </div>

                        <div className="w-full bg-slate-700/50 h-1 mt-3 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-400 h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${(() => {
                                        const last12Revenue = revenueChartData.reduce((acc: number, curr: any) => acc + curr.total, 0)
                                        const goal = stats.yearlyGoal
                                        const percentage = goal > 0 ? (last12Revenue / goal) * 100 : 0
                                        return Math.min(percentage, 100)
                                    })()}%`
                                }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Meta: {stats.yearlyGoal.toLocaleString()}€
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <RevenueChart data={revenueChartData} />

                {/* Service Distribution Chart */}
                <ServiceDistributionChart data={serviceDistributionData} />
            </div>

        </div>
    )
}
