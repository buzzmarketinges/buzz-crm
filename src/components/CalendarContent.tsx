'use client'

import { useState } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, Trash, CheckSquare } from "lucide-react"
import { updateTaskStatus, createTask, updateTask, deleteTask } from "@/actions/tasks-actions"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CalendarContentProps {
    tasks: any[]
    projects?: any[]
}

export function CalendarContent({ tasks: initialTasks, projects = [] }: CalendarContentProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [currentDate, setCurrentDate] = useState(new Date())

    // Modal & Edit state
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any | null>(null)
    const [taskForm, setTaskForm] = useState({ title: '', description: '', date: '', time: '', endTime: '', projectId: '' })

    // Drag and Drop confirmation state
    const [dropData, setDropData] = useState<{ taskId: string, day: Date, hour: number } | null>(null)
    const [isConfirmDropOpen, setIsConfirmDropOpen] = useState(false)

    const getWeekDays = (date: Date) => {
        const start = new Date(date)
        const day = start.getDay()
        const diff = start.getDate() - day + (day === 0 ? -6 : 1)
        start.setDate(diff)
        
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            return d
        })
    }

    const weekDays = getWeekDays(currentDate)
    const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 to 21:00

    const navigateWeek = (direction: number) => {
        const d = new Date(currentDate)
        d.setDate(d.getDate() + direction * 7)
        setCurrentDate(d)
    }

    const handleToggleTask = async (taskId: string, current: boolean) => {
        try {
            await updateTaskStatus(taskId, !current)
            setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, isCompleted: !current } : t))
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask({ ...selectedTask, isCompleted: !current })
            }
            toast.success("Estado actualizado")
        } catch (error) { }
    }

    const getTasksForHourAndDay = (hour: number, day: Date) => {
        return tasks.filter((t: any) => {
            const taskDate = new Date(t.date)
            const isSameDay = taskDate.getDate() === day.getDate() &&
                              taskDate.getMonth() === day.getMonth() &&
                              taskDate.getFullYear() === day.getFullYear()
            if (!isSameDay) return false

            const startHour = taskDate.getHours()
            const endHour = t.endDate ? new Date(t.endDate).getHours() : startHour + 1 // Default 1 hour
            return hour >= startHour && hour < endHour
        })
    }

    const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`

    const handleCellClick = (day: Date, hour: number) => {
        const dateStr = day.toISOString().split('T')[0]
        const hourStr = `${hour.toString().padStart(2, '0')}:00`
        const endHourStr = `${(hour + 1).toString().padStart(2, '0')}:00`
        setSelectedTask(null)
        setTaskForm({ title: '', description: '', date: dateStr, time: hourStr, endTime: endHourStr, projectId: '' })
        setIsCreateOpen(true)
    }

    const handleTaskClick = (t: any, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedTask(t)
        const d = new Date(t.date)
        const dateStr = d.toISOString().split('T')[0]
        const hourStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
        
        const endD = t.endDate ? new Date(t.endDate) : null
        const endHourStr = endD ? `${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}` : ""

        setTaskForm({
            title: t.title,
            description: t.description || '',
            date: dateStr,
            time: hourStr,
            endTime: endHourStr,
            projectId: t.projectId || ''
        })
        setIsCreateOpen(true)
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!taskForm.title || !taskForm.date) return

        try {
            const dStart = new Date(taskForm.date)
            const [sh, sm] = (taskForm.time || "09:00").split(":")
            dStart.setHours(parseInt(sh), parseInt(sm), 0, 0)

            let dEnd: Date | undefined = undefined
            if (taskForm.endTime) {
                dEnd = new Date(taskForm.date)
                const [eh, em] = taskForm.endTime.split(":")
                dEnd.setHours(parseInt(eh), parseInt(em), 0, 0)
            }
            
            const dataLoad = {
                title: taskForm.title,
                description: taskForm.description,
                date: dStart,
                endDate: dEnd,
                projectId: taskForm.projectId || undefined
            }

            if (selectedTask) {
                await updateTask(selectedTask.id, dataLoad)
                toast.success("Tarea modificada")
                setTasks(tasks.map((t: any) => t.id === selectedTask.id ? { 
                    ...t, 
                    ...dataLoad, 
                    date: dStart.toISOString(),
                    endDate: dEnd ? dEnd.toISOString() : null 
                } : t))
            } else {
                const res = await createTask(dataLoad)
                toast.success("Tarea creada")
                const newTask = {
                    id: res.id,
                    ...dataLoad,
                    date: dStart.toISOString(),
                    endDate: dEnd ? dEnd.toISOString() : null,
                    isCompleted: false,
                    projectId: taskForm.projectId || null,
                    project: taskForm.projectId ? { name: projects.find((p:any) => p.id === taskForm.projectId)?.name || 'Proyect' } : null
                }
                setTasks([...tasks, newTask])
            }
            setIsCreateOpen(false)
        } catch (error) { 
            console.error("Error task:", error)
            toast.error("Error al procesar") 
        }
    }

    const handleDelete = async () => {
        if (!selectedTask) return
        try {
            await deleteTask(selectedTask.id)
            setTasks(tasks.filter((t: any) => t.id !== selectedTask.id))
            toast.success("Tarea eliminada")
            setIsCreateOpen(false)
        } catch (error) { }
    }

    const handleInitiateDrop = (taskId: string, day: Date, hour: number) => {
        setDropData({ taskId, day, hour })
        setIsConfirmDropOpen(true)
    }

    const handleConfirmDrop = async () => {
        if (!dropData) return
        try {
            const { taskId, day, hour } = dropData
            const newDate = new Date(day)
            newDate.setHours(hour, 0, 0, 0)

            await updateTask(taskId, { date: newDate })
            setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, date: newDate.toISOString() } : t))
            toast.success("Tarea movida correctamente")
        } catch (error) {
            toast.error("Error al mover la tarea")
        } finally {
            setIsConfirmDropOpen(false)
            setDropData(null)
        }
    }

    const upcomingTasks = tasks
        .filter(t => !t.isCompleted)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)

    const isPast = (dateStr: string) => {
        const d = new Date(dateStr)
        const now = new Date()
        return d < now
    }

    const generateMiniCalendar = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1).getDay()
        const totalDays = new Date(year, month + 1, 0).getDate()
        const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1
        const calendarGrid = []
        for (let i = 0; i < leadingBlanks; i++) calendarGrid.push(null)
        for (let i = 1; i <= totalDays; i++) calendarGrid.push(new Date(year, month, i))
        return calendarGrid
    }

    return (
        <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-300">
            {/* LEFT SIDEBAR */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
                {/* Mini Calendar */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-700 uppercase">
                            {currentDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                        {['L','M','X','J','V','S','D'].map((d, i) => <div key={i}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {generateMiniCalendar().map((day, idx) => {
                            if (!day) return <div key={idx} className="h-6" />
                            const isToday = day.toDateString() === new Date().toDateString()
                            const isSelected = day.toDateString() === currentDate.toDateString()

                            return (
                                <button key={idx} onClick={() => setCurrentDate(day)} className={`h-6 w-6 mx-auto flex items-center justify-center rounded-full text-[11px] font-medium transition-colors ${
                                    isSelected ? 'bg-blue-600 text-white font-bold' : isToday ? 'border border-blue-600 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                                }`}>{day.getDate()}</button>
                            )
                        })}
                    </div>
                </div>

                {/* Upcoming tasks */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-500" /> Próximas Tareas</h3>
                    <div className="space-y-2">
                        {upcomingTasks.length === 0 ? ( <p className="text-[11px] text-slate-400">No hay tareas programadas.</p> ) : (
                            upcomingTasks.map((t) => {
                                const past = isPast(t.date)
                                return (
                                    <div key={t.id} onClick={(e) => handleTaskClick(t, e)} className={`p-2 rounded-lg border text-[11px] flex flex-col gap-0.5 border-l-4 cursor-pointer hover:shadow-sm transition-all ${
                                        past ? 'bg-red-50 border-red-500 text-red-800 border-l-red-600' : 'bg-slate-50 border-slate-100 text-slate-700 border-l-blue-500'
                                    }`}>
                                        <div className="font-semibold line-clamp-1">{t.title}</div>
                                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                                            <span>{new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} • {new Date(t.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CALENDAR GRID */}
            <div className="col-span-12 lg:col-span-9 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex justify-between items-center mb-5">
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-7 text-xs px-3 font-semibold text-slate-700 border-slate-200">
                        Hoy
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 px-1 hover:bg-slate-100" onClick={() => navigateWeek(-1)}><ChevronLeft className="h-4 w-4 text-slate-600" /></Button>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h2>
                        <Button variant="ghost" size="sm" className="h-7 px-1 hover:bg-slate-100" onClick={() => navigateWeek(1)}><ChevronRight className="h-4 w-4 text-slate-600" /></Button>
                    </div>

                    <Button variant="default" size="sm" onClick={() => {
                        setSelectedTask(null)
                        const today = new Date().toISOString().split('T')[0]
                        setTaskForm({ title: '', description: '', date: today, time: '09:00', endTime: '10:00', projectId: '' })
                        setIsCreateOpen(true)
                    }} className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 font-medium shadow-sm">
                        + Nueva Tarea
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[750px] border-collapse relative">
                        <div className="grid grid-cols-8 border-b pb-2 mb-2">
                            <div className="text-xs font-semibold text-slate-400 text-center">Hora</div>
                            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, idx) => {
                                const isSelectedCol = weekDays[idx].toDateString() === currentDate.toDateString()
                                return (
                                    <div key={idx} className={`text-center py-1 rounded-md ${isSelectedCol ? 'bg-blue-50/50' : ''}`}>
                                        <span className={`text-[10px] font-bold text-slate-400 block mb-0.5 ${weekDays[idx].toDateString() === new Date().toDateString() ? 'text-blue-500' : ''}`}>{day}</span>
                                        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold transition-colors ${isSelectedCol ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                                            {weekDays[idx].getDate()}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex border-t border-slate-100 relative">
                            {/* Column 1: Time Labels */}
                            <div className="w-[12.5%] divide-y divide-slate-100/60 border-r border-slate-100">
                                {hours.map((h) => (
                                    <div key={h} className="h-10 text-[10px] text-slate-400 font-medium flex items-center justify-center px-1">
                                        {formatHour(h)}
                                    </div>
                                ))}
                            </div>

                            {/* Column 2-8: Day columns absolute grids */}
                            <div className="flex-1 grid grid-cols-7 divide-x divide-slate-100 relative">
                                {weekDays.map((targetDay, dayIdx) => {
                                    const isSelectedCol = targetDay.toDateString() === currentDate.toDateString()
                                    const dayTasks = tasks.filter((t: any) => {
                                        const taskDate = new Date(t.date)
                                        return taskDate.getDate() === targetDay.getDate() &&
                                               taskDate.getMonth() === targetDay.getMonth() &&
                                               taskDate.getFullYear() === targetDay.getFullYear()
                                    })

                                    return (
                                        <div 
                                            key={dayIdx} 
                                            className={`relative h-full ${targetDay.getDay() === 0 || targetDay.getDay() === 6 ? 'bg-slate-50/10' : ''} ${isSelectedCol ? 'bg-blue-50/20' : ''}`}
                                        >
                                            {/* Background slots for hours to click & drop */}
                                            {hours.map((h) => (
                                                <div 
                                                    key={h} 
                                                    className="h-10 hover:bg-slate-50/30 cursor-pointer relative border-b border-slate-100/60"
                                                    onClick={() => handleCellClick(targetDay, h)}
                                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-blue-50/40") }}
                                                    onDragLeave={(e) => { e.currentTarget.classList.remove("bg-blue-50/40") }}
                                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("bg-blue-50/40"); const taskId = e.dataTransfer.getData("taskId"); if (taskId) handleInitiateDrop(taskId, targetDay, h); }}
                                                />
                                            ))}

                                            {/* Absolute Overlay Task Cards */}
                                            {dayTasks.map((t: any) => {
                                                const dStart = new Date(t.date)
                                                const dEnd = t.endDate ? new Date(t.endDate) : new Date(dStart.getTime() + 60*60*1000)

                                                const startHour = dStart.getHours() + dStart.getMinutes() / 60
                                                const endHour = dEnd.getHours() + dEnd.getMinutes() / 60

                                                if (startHour < 7 || startHour >= 22) return null // Out of bounding hours

                                                const topOffset = (startHour - 7) * 40
                                                const heightDuration = (endHour - startHour) * 40

                                                return (
                                                    <div 
                                                        key={t.id}
                                                        draggable={!t.isCompleted}
                                                        style={{ top: `${topOffset}px`, height: `${heightDuration}px`, zIndex: 10 }}
                                                        onDragStart={(e) => { e.dataTransfer.setData("taskId", t.id); e.dataTransfer.effectAllowed = "move" }}
                                                        className={`absolute left-0.5 right-0.5 p-1 rounded-md border shadow-sm transition-all text-left flex flex-col gap-0.5 overflow-hidden ${t.isCompleted ? 'bg-slate-50 opacity-60 line-through text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-blue-50 border-blue-100 text-blue-800 cursor-move hover:shadow-md hover:bg-blue-50/95'}`}
                                                        onClick={(e) => handleTaskClick(t, e)}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <Checkbox 
                                                                checked={t.isCompleted} 
                                                                className="h-2.5 w-2.5" 
                                                                onCheckedChange={() => handleToggleTask(t.id, t.isCompleted)} 
                                                                onClick={(e) => e.stopPropagation()} 
                                                            />
                                                            <span className="text-[10px] font-bold leading-tight line-clamp-1">{t.title}</span>
                                                        </div>
                                                        {heightDuration > 20 && (
                                                            <span className="text-[8px] opacity-75 mt-0.5 flex items-center gap-0.5">
                                                                {dStart.toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Creation/Edit Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="font-semibold text-sm text-slate-800">{selectedTask ? "Modificar Recordatorio" : "Nuevo Recordatorio"}</DialogTitle>
                        {selectedTask && <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 h-7 px-2"><Trash className="h-4 w-4" /></Button>}
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
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label>Fecha *</Label>
                                <Input type="date" required value={taskForm.date} onChange={e => setTaskForm({ ...taskForm, date: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Inicio</Label>
                                <Input type="time" value={taskForm.time} onChange={e => setTaskForm({ ...taskForm, time: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Fin</Label>
                                <Input type="time" value={taskForm.endTime} onChange={e => setTaskForm({ ...taskForm, endTime: e.target.value })} />
                            </div>
                        </div>
                        {projects.length > 0 && (
                            <div className="space-y-1">
                                <Label>Proyecto Asociado</Label>
                                <Select value={taskForm.projectId} onValueChange={(val) => setTaskForm({ ...taskForm, projectId: val })}>
                                    <SelectTrigger><SelectValue placeholder="-- Vincular a Proyecto --" /></SelectTrigger>
                                    <SelectContent>
                                        {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.company?.name})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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
                                        setIsCreateOpen(false) // Close modal
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

            {/* Drag & Drop Confirmation */}
            <Dialog open={isConfirmDropOpen} onOpenChange={setIsConfirmDropOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-800">
                             ¿Mover Recordatorio?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-slate-600">
                            ¿Estás seguro de que quieres mover esta tarea a una nueva fecha y hora en tu calendario?
                        </p>
                    </div>
                    <DialogFooter className="flex flex-row justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsConfirmDropOpen(false)} className="text-slate-500 h-8 text-xs">
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmDrop} className="bg-blue-600 hover:bg-blue-700 h-8 text-xs shadow-sm">
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
