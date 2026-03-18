'use client'

import { useState } from 'react'
import { DataTable, ColumnDef } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createProject } from "@/actions/projects-actions"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ProjectsTableProps {
    initialData: any[]
    clients: any[]
}

export function ProjectsTable({ initialData, clients }: ProjectsTableProps) {
    const router = useRouter()
    
    // New Project Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form, setForm] = useState({
        name: '',
        description: '',
        companyId: '',
        startDate: '',
        endDate: '',
        status: 'ACTIVE' as 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    })

    const handleRowClick = (item: any) => {
        router.push(`/projects/${item.id}`)
    }

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.companyId || !form.startDate) {
            toast.error("Por favor completa los campos obligatorios")
            return
        }
        setIsSubmitting(true)

        try {
            await createProject({
                name: form.name,
                description: form.description,
                companyId: form.companyId,
                startDate: new Date(form.startDate),
                endDate: form.endDate ? new Date(form.endDate) : undefined,
                status: form.status
            })
            toast.success("Proyecto creado correctamente")
            setIsCreateOpen(false)
            setForm({ name: '', description: '', companyId: '', startDate: '', endDate: '', status: 'ACTIVE' })
            router.refresh()
        } catch (error) {
            toast.error("Error al crear proyecto")
        } finally {
            setIsSubmitting(false)
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            header: "Nombre Proyecto",
            accessorKey: "name",
            className: "font-semibold text-slate-800 pl-6 w-[35%]",
            sortable: true
        },
        {
            header: "Cliente",
            accessorKey: "company.name",
            className: "text-slate-600 text-sm w-[35%]",
            sortable: true
        },
        {
            header: "Inicio",
            accessorKey: "startDate",
            cell: (item) => new Date(item.startDate).toLocaleDateString(),
            className: "text-slate-500 text-sm w-[15%]",
            sortable: true
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (item) => {
                const statusMap: Record<string, { label: string, badge: string }> = {
                    'ACTIVE': { label: 'Activo', badge: 'bg-emerald-50 text-emerald-700' },
                    'COMPLETED': { label: 'Completado', badge: 'bg-blue-50 text-blue-700' },
                    'CANCELLED': { label: 'Cancelado', badge: 'bg-red-50 text-red-700' }
                }
                const current = statusMap[item.status] || { label: item.status, badge: 'bg-gray-50 text-gray-700' }
                return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${current.badge}`}>{current.label}</span>
            },
            className: "w-[15%]",
            sortable: true
        }
    ]

    return (
        <div className="pb-10">
            <DataTable
                data={initialData}
                columns={columns}
                searchKeys={['name', 'company.name']}
                onRowClick={handleRowClick}
                containerClassName="max-h-[calc(100vh-300px)]"
                headerActions={(
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-slate-900"><Plus className="mr-1 h-3.5 w-3.5" /> Nuevo Proyecto</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Crear Proyecto</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateProject} className="space-y-4 py-3">
                                <div className="space-y-1">
                                    <Label>Nombre *</Label>
                                    <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Cliente *</Label>
                                    <Select value={form.companyId} onValueChange={val => setForm({ ...form, companyId: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="-- Selecciona Cliente --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Descripción</Label>
                                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Fecha Inicio *</Label>
                                        <Input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Fecha Fin</Label>
                                        <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Estado</Label>
                                    <Select value={form.status} onValueChange={(val: any) => setForm({ ...form, status: val })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Activo</SelectItem>
                                            <SelectItem value="COMPLETED">Completado</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Guardando..." : "Crear"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            />
        </div>
    )
}
