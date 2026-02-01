'use client'

import { useState } from "react"
import { DataTable } from "@/components/DataTable"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toggleServiceStatus, deleteService } from "@/actions/service-actions"
import { toast } from "sonner"
import { Trash2, RotateCw, Briefcase, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ServicesTable({ initialData }: { initialData: any[] }) {
    const [data, setData] = useState(initialData)

    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        const newData = data.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s)
        setData(newData)

        try {
            await toggleServiceStatus(id, !currentStatus)
            toast.success(currentStatus ? "Servicio desactivado" : "Servicio activado")
        } catch (error) {
            toast.error("Error al actualizar estado")
            setData(data) // Revert
        }
    }

    const columns = [
        {
            header: "Servicio",
            accessorKey: "name",
            cell: (item: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{item.name}</span>
                    <span className="text-xs text-slate-500">{item.type === 'RECURRENTE' ? 'Recurrente' : 'Puntual'}</span>
                </div>
            ),
            sortable: true
        },
        {
            header: "Cliente",
            accessorKey: "company.name",
            cell: (item: any) => (
                <Link href={`/clients/${item.companyId}`} className="flex items-center gap-2 hover:underline text-blue-600">
                    {item.company.name} <ExternalLink className="h-3 w-3" />
                </Link>
            ),
            sortable: true
        },
        {
            header: "Precio",
            accessorKey: "price",
            cell: (item: any) => <span className="font-mono font-bold">{item.price.toFixed(2)}€</span>,
            sortable: true
        },
        {
            header: "Tipo",
            accessorKey: "type",
            cell: (item: any) => (
                <Badge variant="outline" className={item.type === 'RECURRENTE' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"}>
                    {item.type === 'RECURRENTE' ? <RotateCw className="mr-1 h-3 w-3" /> : <Briefcase className="mr-1 h-3 w-3" />}
                    {item.type}
                </Badge>
            ),
            sortable: true
        },
        {
            header: "Periodo",
            cell: (item: any) => (
                <div className="text-xs text-slate-500">
                    <div>Desde: {new Date(item.startDate).toLocaleDateString()}</div>
                    {item.endDate && <div>Hasta: {new Date(item.endDate).toLocaleDateString()}</div>}
                </div>
            )
        },
        {
            header: "Estado",
            accessorKey: "isActive",
            cell: (item: any) => (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                        checked={item.isActive}
                        onCheckedChange={() => handleToggle(item.id, item.isActive)}
                    />
                    <span className={`text-xs font-medium ${item.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                        {item.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            ),
            sortable: true
        },
    ]

    return (
        <DataTable
            data={data}
            columns={columns}
            searchKeys={['name', 'company.name']}
        />
    )
}
