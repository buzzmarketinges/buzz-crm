'use client'

import { useState } from 'react'
import { DataTable, ColumnDef } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SidePanel } from "@/components/ui/SidePanel"
import { getCompany, deleteCompany } from "@/actions/company-actions"
import { ClientDetailContent } from "@/components/ClientDetailContent"
import { Loader2, Trash2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface ClientsTableProps {
    initialData: any[]
    simulatedDate?: string
}

export function ClientsTable({ initialData, simulatedDate }: ClientsTableProps) {
    const router = useRouter()
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
    const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [companyToDelete, setCompanyToDelete] = useState<any | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const filteredData = initialData.filter(item => {
        if (filterStatus === 'all') return true
        if (filterStatus === 'active') return item.isActive
        if (filterStatus === 'inactive') return !item.isActive
        return true
    })

    const handleRowClick = async (item: any) => {
        setSelectedCompanyId(item.id)
        setIsLoading(true)
        setSelectedCompany(null) // reset while loading to show skeletons if needed

        try {
            const fullData = await getCompany(item.id)
            setSelectedCompany(fullData)
        } catch (error) {
            console.error("Failed to load company details", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!companyToDelete) return

        setIsDeleting(true)
        try {
            await deleteCompany(companyToDelete.id)
            toast.success(`Cliente "${companyToDelete.name}" eliminado correctamente`)
            setCompanyToDelete(null)
            router.refresh()
        } catch (error) {
            console.error("Error deleting company:", error)
            toast.error("Error al eliminar el cliente")
        } finally {
            setIsDeleting(false)
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            header: "Nombre",
            accessorKey: "name",
            className: "font-semibold text-slate-900 pl-6 w-[25%]",
            sortable: true,
        },
        {
            header: "Estado",
            accessorKey: "isActive",
            cell: (item) => (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {item.isActive ? 'Activo' : 'Inactivo'}
                </span>
            ),
            className: "w-[12%]",
            sortable: true
        },
        {
            header: "Razón Social",
            accessorKey: "businessName",
            className: "text-slate-600 text-sm w-[18%]",
            sortable: true
        },
        {
            header: "Email",
            accessorKey: "billingEmail",
            className: "text-slate-500 text-sm w-[18%]",
            sortable: true
        },
        {
            header: "Servicios",
            accessorKey: "_count.services",
            cell: (item) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {item._count?.services || 0}
                </span>
            ),
            className: "text-center w-[12%]",
            sortable: true
        },
        {
            header: "Acciones",
            accessorKey: "id",
            cell: (item) => (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            setCompanyToDelete(item)
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: "text-center w-[10%]",
            sortable: false
        }
    ]

    return (
        <div className="pb-10">
            <DataTable
                data={filteredData}
                columns={columns}
                searchKeys={['name', 'businessName', 'taxId', 'billingEmail']}
                onRowClick={handleRowClick}
                containerClassName="max-h-[calc(100vh-300px)]"
                headerActions={(
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px] bg-white text-sm h-9 border-slate-200 shadow-sm">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="all">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span className="text-slate-600">Todos</span>
                                </span>
                            </SelectItem>
                            <SelectItem value="active">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-emerald-700 font-medium">Activos</span>
                                </span>
                            </SelectItem>
                            <SelectItem value="inactive">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-slate-600">Inactivos</span>
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />

            <SidePanel
                isOpen={!!selectedCompanyId}
                onClose={() => setSelectedCompanyId(null)}
                title={selectedCompany?.name || "Cargando..."}
                width="max-w-3xl"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>Cargando información del cliente...</p>
                    </div>
                ) : (
                    selectedCompany && (
                        <ClientDetailContent
                            company={selectedCompany}
                            simulatedDate={simulatedDate}
                            onUpdate={async () => {
                                const refreshed = await getCompany(selectedCompany.id)
                                setSelectedCompany(refreshed)
                                router.refresh() // Refresh main table as well
                            }}
                        />
                    )
                )}
            </SidePanel>

            <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar el cliente <strong>{companyToDelete?.name}</strong>?
                            Esta acción no se puede deshacer y eliminará todos los contactos, servicios y facturas asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
