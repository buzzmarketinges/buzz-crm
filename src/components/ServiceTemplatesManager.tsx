'use client'

import { useState } from 'react'
import { createServiceTemplate, deleteServiceTemplate } from "@/actions/service-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/DataTable"
import { Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function ServiceTemplatesManager({ initialTemplates }: { initialTemplates: any[] }) {
    const [templates, setTemplates] = useState(initialTemplates)
    const [newTemplateName, setNewTemplateName] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const handleCreate = async () => {
        if (!newTemplateName) return

        try {
            const created = await createServiceTemplate(newTemplateName)
            if (created) {
                setTemplates([...templates, created])
                setNewTemplateName("")
                setIsOpen(false)
                toast.success("Categoría creada")
            }
        } catch (error) {
            toast.error("Error al crear categoría")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteServiceTemplate(id)
            setTemplates(templates.filter(t => t.id !== id))
            toast.success("Categoría eliminada")
        } catch (error) {
            toast.error("Error al eliminar")
        }
    }

    const columns = [
        {
            header: "Nombre de Categoría / Servicio Predefinido",
            accessorKey: "name",
            className: "font-medium text-slate-900",
            sortable: true
        },
        {
            header: "Acciones",
            cell: (item: any) => (
                <div className="flex justify-end pr-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (confirm("¿Eliminar esta categoría?")) handleDelete(item.id)
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: "text-right w-[100px]"
        }
    ]

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Servicios Predefinidos</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 text-white hover:bg-slate-800">
                            <Plus className="h-4 w-4 mr-2" /> Nueva Categoría
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir Servicio Predefinido</DialogTitle>
                            <DialogDescription>
                                Esto creará una categoría que podrás seleccionar al dar de alta servicios en clientes.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="Ej: Mantenimiento Web"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <p className="text-sm text-slate-500 mb-4">
                Gestiona aquí los nombres de servicios comunes para estandarizar tus facturas y estadísticas.
            </p>

            <DataTable
                data={templates}
                columns={columns}
                searchKeys={['name']}
            />
        </div>
    )
}
