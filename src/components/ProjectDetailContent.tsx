'use client'

import { useState, useEffect } from 'react'
import { getProjectReport, linkServiceToProject, getProject } from "@/actions/projects-actions"
import { createExpense, deleteExpense } from "@/actions/expenses-actions"
import { getServices } from "@/actions/service-actions"
import { createTask, getTasks, updateTaskStatus, updateTask, deleteTask } from "@/actions/tasks-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Euro, TrendingUp, DollarSign, Wallet, Calendar, CheckSquare, BarChart3, LineChart, AreaChart, Trash } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ResponsiveContainer, BarChart, Bar, LineChart as RechartsLineChart, Line, AreaChart as RechartsAreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'

interface ProjectDetailContentProps {
    project: any
    report?: any
    services?: any[]
    onUpdate?: () => void
    isPage?: boolean
}

export function ProjectDetailContent({ project: initialProject, report: initialReport, services: initialServices = [], onUpdate, isPage = false }: ProjectDetailContentProps) {
    const [project, setProject] = useState(initialProject)
    const [report, setReport] = useState<any>(initialReport || null)
    const [isLoading, setIsLoading] = useState(!initialReport)
    const [clientServices, setClientServices] = useState<any[]>(initialServices)
    
    // Charts Type
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar')

    // Form Inputs for Expense
    const [expenseForm, setExpenseForm] = useState({ concept: '', provider: '', amount: '', date: '', notes: '' })
    const [isExpenseOpen, setIsExpenseOpen] = useState(false)
    
    // Link Service
    const [selectedServiceId, setSelectedServiceId] = useState<string>('')
    const [isLinkServiceOpen, setIsLinkServiceOpen] = useState(false)

    // Form Inputs for Tasks
    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [taskForm, setTaskForm] = useState({ title: '', description: '', date: '', time: '' })
    const [isTaskOpen, setIsTaskOpen] = useState(false)

    const fetchReport = async () => {
        // Only run if we don't already have it, or it was triggered by a CRUD
        try {
            const [reportData, services, fullProject] = await Promise.all([
                getProjectReport(initialProject.id),
                getServices(initialProject.companyId),
                getProject(initialProject.id)
            ])
            
            setReport(reportData)
            setProject(fullProject)
            const unlinked = services.filter((s: any) => s.projectId !== initialProject.id)
            setClientServices(unlinked)
        } catch (error) {
            console.error("Error loading project data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!initialReport && initialProject?.id) {
            fetchReport()
        }
    }, [initialProject?.id, initialReport])

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!expenseForm.concept || !expenseForm.provider || !expenseForm.amount) {
            toast.error("Por favor completa los campos obligatorios")
            return
        }

        try {
            await createExpense({
                concept: expenseForm.concept,
                provider: expenseForm.provider,
                amount: parseFloat(expenseForm.amount),
                date: expenseForm.date ? new Date(expenseForm.date) : new Date(),
                notes: expenseForm.notes,
                projectId: project.id
            })
            toast.success("Gasto añadido")
            setIsExpenseOpen(false)
            setExpenseForm({ concept: '', provider: '', amount: '', date: '', notes: '' })
            fetchReport()
            if (onUpdate) onUpdate()
        } catch (error) {
            toast.error("Error al añadir gasto")
        }
    }

    const handleDeleteExpense = async (expenseId: string) => {
        try {
            await deleteExpense(expenseId, project.id)
            toast.success("Gasto eliminado")
            fetchReport()
            if (onUpdate) onUpdate()
        } catch (error) {
            toast.error("Error al eliminar gasto")
        }
    }

    const handleLinkService = async () => {
        if (!selectedServiceId) return
        try {
            await linkServiceToProject(selectedServiceId, project.id)
            toast.success("Servicio vinculado")
            setIsLinkServiceOpen(false)
            setSelectedServiceId('')
            fetchReport()
            if (onUpdate) onUpdate()
        } catch (error) {
            toast.error("Error al vincular")
        }
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!taskForm.title || !taskForm.date) {
            toast.error("Título y fecha obligatorios")
            return
        }

        try {
            const dateStr = `${taskForm.date}T${taskForm.time || '09:00'}:00`
            const dataLoad = {
                title: taskForm.title,
                description: taskForm.description,
                date: new Date(dateStr),
                projectId: project.id
            }

            if (selectedTask) {
                await updateTask(selectedTask.id, dataLoad)
                toast.success("Tarea modificada")
            } else {
                await createTask(dataLoad)
                toast.success("Tarea creada")
            }
            setIsTaskOpen(false)
            setTaskForm({ title: '', description: '', date: '', time: '' })
            setSelectedTask(null)
            fetchReport()
        } catch (error) {
            toast.error("Error al procesar tarea")
        }
    }

    const handleDeleteTask = async () => {
        if (!selectedTask) return
        try {
            await deleteTask(selectedTask.id)
            toast.success("Tarea eliminada")
            setIsTaskOpen(false)
            setTaskForm({ title: '', description: '', date: '', time: '' })
            setSelectedTask(null)
            fetchReport()
        } catch (error) {
            toast.error("Error al eliminar")
        }
    }

    const handleToggleTask = async (taskId: string, current: boolean) => {
        try {
            await updateTaskStatus(taskId, !current)
            fetchReport()
        } catch (error) { }
    }

    if (isLoading) {
        return <div className="p-4 text-slate-500 animate-pulse">Cargando...</div>
    }

    return (
        <div className={`space-y-6 ${isPage ? 'pb-24' : 'pb-20'}`}>
            <div className={`grid ${isPage ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                
                {/* Column 1 & 2: Main Statistics & Charts */}
                <div className={`${isPage ? 'lg:col-span-2' : ''} space-y-6`}>
                    
                    {/* KPI Totals */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="bg-emerald-50/50 border-emerald-100/50 shadow-sm">
                            <CardHeader className="py-4 flex flex-row items-center justify-between pb-1">
                                <CardTitle className="text-xs font-semibold text-emerald-800">Ingresos</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent className="py-2">
                                <div className="text-2xl font-bold text-emerald-700">{report?.totals?.income.toFixed(2)}€</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-rose-50/50 border-rose-100/50 shadow-sm">
                            <CardHeader className="py-4 flex flex-row items-center justify-between pb-1">
                                <CardTitle className="text-xs font-semibold text-rose-800">Gastos</CardTitle>
                                <Wallet className="h-4 w-4 text-rose-600" />
                            </CardHeader>
                            <CardContent className="py-2">
                                <div className="text-2xl font-bold text-rose-700">{report?.totals?.expenses.toFixed(2)}€</div>
                            </CardContent>
                        </Card>
                        <Card className={report?.totals?.total >= 0 ? "bg-blue-50/50 border-blue-100/50 shadow-sm" : "bg-red-50/50 border-red-100/50 shadow-sm"}>
                            <CardHeader className="py-4 flex flex-row items-center justify-between pb-1">
                                <CardTitle className="text-xs font-semibold text-blue-800">Beneficio</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="py-2">
                                <div className="text-2xl font-bold text-blue-700">{report?.totals?.total.toFixed(2)}€</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart with Type Tabs */}
                    {report?.chartData?.length > 0 && (
                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-800">Evolución Financiera</h3>
                                <div className="flex bg-slate-50 border p-1 rounded-lg gap-1">
                                    <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs gap-1 ${chartType === 'bar' ? 'bg-white shadow-sm' : ''}`} onClick={() => setChartType('bar')}><BarChart3 className="h-3.5 w-3.5" /> Barras</Button>
                                    <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs gap-1 ${chartType === 'line' ? 'bg-white shadow-sm' : ''}`} onClick={() => setChartType('line')}><LineChart className="h-3.5 w-3.5" /> Líneas</Button>
                                    <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs gap-1 ${chartType === 'area' ? 'bg-white shadow-sm' : ''}`} onClick={() => setChartType('area')}><AreaChart className="h-3.5 w-3.5" /> Áreas</Button>
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'bar' ? (
                                        <BarChart data={report.chartData} barGap={2}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="month" fontSize={11} tickLine={false} stroke="#64748b" />
                                            <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `${v}€`} stroke="#64748b" />
                                            <Tooltip formatter={(value) => `${parseFloat(value as string).toFixed(2)}€`} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="income" name="Ingreso" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="expenses" name="Gasto" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : chartType === 'line' ? (
                                        <RechartsLineChart data={report.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                                            <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => `${v}€`} />
                                            <Tooltip formatter={(value) => `${parseFloat(value as string).toFixed(2)}€`} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Line type="monotone" dataKey="income" name="Ingreso" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="expenses" name="Gasto" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                                        </RechartsLineChart>
                                    ) : (
                                        <RechartsAreaChart data={report.chartData}>
                                            <defs>
                                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" fontSize={11} />
                                            <YAxis fontSize={11} tickFormatter={(v) => `${v}€`} />
                                            <Tooltip formatter={(value) => `${parseFloat(value as string).toFixed(2)}€`} />
                                            <Area type="monotone" dataKey="income" name="Ingreso" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                                            <Area type="monotone" dataKey="expenses" name="Gasto" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" />
                                        </RechartsAreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Tareas y Recordatorios */}
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Tareas y Recordatorios</h3>
                            <Button size="sm" variant="outline" onClick={() => {
                                setSelectedTask(null)
                                setTaskForm({ title: '', description: '', date: '', time: '' })
                                setIsTaskOpen(true)
                            }} className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Añadir</Button>
                        </div>
                        {project.tasks?.length === 0 ? (
                            <p className="text-xs text-slate-400">Sin tareas programadas.</p>
                        ) : (
                            <ul className="space-y-2">
                                {project.tasks?.map((t: any) => (
                                    <li 
                                        key={t.id} 
                                        onClick={() => {
                                            setSelectedTask(t)
                                            const d = new Date(t.date)
                                            setTaskForm({
                                                title: t.title,
                                                description: t.description || '',
                                                date: d.toISOString().split('T')[0],
                                                time: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
                                            })
                                            setIsTaskOpen(true)
                                        }}
                                        className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer hover:bg-slate-50/80 ${t.isCompleted ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                                checked={t.isCompleted} 
                                                onClick={(e) => e.stopPropagation()} 
                                                onCheckedChange={() => handleToggleTask(t.id, t.isCompleted)} 
                                            />
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${t.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.title}</span>
                                                <span className="text-[11px] text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(t.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Unified Dialog Modal */}
                        <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
                            <DialogContent>
                                <DialogHeader className="flex flex-row items-center justify-between">
                                    <DialogTitle className="font-semibold text-slate-800">{selectedTask ? "Modificar Recordatorio" : "Nuevo Recordatorio"}</DialogTitle>
                                    {selectedTask && <Button variant="ghost" size="sm" onClick={handleDeleteTask} className="text-red-500 h-7 px-2"><Trash className="h-4 w-4" /></Button>}
                                </DialogHeader>
                                <form onSubmit={handleAddTask} className="space-y-4 py-3">
                                    <div className="space-y-1">
                                        <Label>Título *</Label>
                                        <Input required value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Detalles</Label>
                                        <Input value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Fecha *</Label>
                                            <Input type="date" required value={taskForm.date} onChange={e => setFormAndResetDate(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Hora</Label>
                                            <Input type="time" value={taskForm.time} onChange={e => setTaskForm({ ...taskForm, time: e.target.value })} />
                                        </div>
                                    </div>
                                    <DialogFooter className="flex flex-row justify-between items-center w-full gap-2 pt-2">
                                        {selectedTask && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                className={`h-8 text-xs font-semibold gap-1 ${selectedTask.isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                onClick={() => {
                                                    const current = selectedTask.isCompleted
                                                    handleToggleTask(selectedTask.id, current)
                                                    setSelectedTask({ ...selectedTask, isCompleted: !current })
                                                    setIsTaskOpen(false) // Close modal
                                                }}
                                            >
                                                <CheckSquare className={`h-3.5 w-3.5 ${selectedTask.isCompleted ? 'fill-emerald-100' : ''}`} />
                                                {selectedTask.isCompleted ? "Completada" : "Marcar como Completada"}
                                            </Button>
                                        )}
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs ml-auto">{selectedTask ? "Guardar Cambios" : "Guardar"}</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                </div>

                {/* Column 3: Services & Expenses */}
                <div className="space-y-6">
                    {/* Servicios */}
                    <Card className="shadow-sm border-slate-100">
                        <CardHeader className="py-4 border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-semibold text-slate-800">Servicios Facturados</CardTitle>
                                <Dialog open={isLinkServiceOpen} onOpenChange={setIsLinkServiceOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Vincular</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Vincular Servicio</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                                <SelectTrigger><SelectValue placeholder="-- Selecciona Servicio --" /></SelectTrigger>
                                                <SelectContent>
                                                    {clientServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.price}€)</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <DialogFooter><Button onClick={handleLinkService} disabled={!selectedServiceId}>Vincular</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="py-2">
                            {project.services?.length === 0 ? <p className="text-xs text-slate-400 p-2">Sin servicios.</p> : (
                                <ul className="divide-y divide-slate-100">
                                    {project.services.map((s: any) => (
                                        <li key={s.id} className="flex justify-between py-2 text-sm">
                                            <span className="font-medium text-slate-700">{s.name}</span>
                                            <span className="font-semibold text-slate-600">{Number(s.price).toFixed(2)}€</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gastos */}
                    <Card className="shadow-sm border-slate-100">
                        <CardHeader className="py-4 border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-semibold text-slate-800">Gastos Manuales</CardTitle>
                                <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus className="h-3 w-3" /> Añadir</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Nuevo Gasto</DialogTitle></DialogHeader>
                                        <form onSubmit={handleAddExpense} className="space-y-4 py-3">
                                            <div className="space-y-1"><Label>Concepto *</Label><Input required value={expenseForm.concept} onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })} /></div>
                                            <div className="space-y-1"><Label>Proveedor *</Label><Input required value={expenseForm.provider} onChange={e => setExpenseForm({ ...expenseForm, provider: e.target.value })} /></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1"><Label>Importe (€) *</Label><Input type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></div>
                                                <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} /></div>
                                            </div>
                                            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="py-2">
                            {project.expenses?.length === 0 ? <p className="text-xs text-slate-400 p-2">Sin gastos.</p> : (
                                <ul className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                                    {project.expenses.map((exp: any) => (
                                        <li key={exp.id} className="flex justify-between items-center py-2 text-sm">
                                            <div>
                                                <div className="font-medium text-slate-700">{exp.concept}</div>
                                                <span className="text-xs text-slate-400">{exp.provider}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-600">{Number(exp.amount).toFixed(2)}€</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDeleteExpense(exp.id)}><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )

    function setFormAndResetDate(val: string) {
        setTaskForm({ ...taskForm, date: val })
    }
}
