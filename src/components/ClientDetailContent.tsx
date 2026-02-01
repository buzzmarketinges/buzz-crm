'use client'

import { useState, useEffect } from 'react'

import { updateCompany, createContact, deleteContact } from "@/actions/company-actions"
import { createService, deleteService, toggleServiceStatus, getServiceTemplates, createServiceTemplate } from "@/actions/service-actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus, Briefcase, RotateCw, Download, Building2, Plus, Mail, Phone, User, Trash, Calendar, ArrowRight, Check, AlertCircle } from "lucide-react"
import { DeleteClientButton } from "@/components/DeleteClientButton"
import { InvoiceStatusSelect } from "@/components/InvoiceStatusSelect"
import { AnimatedTabs } from "@/components/ui/AnimatedTabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { deleteInvoice } from "@/actions/invoice-actions"

// Minimalist Input Component
const MinimalInput = ({ label, className, ...props }: any) => (
    <div className="space-y-1 w-full">
        {label && <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>}
        <Input {...props} className={cn("bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-none focus:ring-1 focus:ring-gray-300 rounded-lg", className)} />
    </div>
)

interface ServiceFormData {
    name: string
    price: number
    discount: number
    startDate: string
    endDate: string
    type: 'PUNTUAL' | 'RECURRENTE'
    billingOption: 'FULL' | 'PRORATED' | 'NONE'
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
}

export function ClientDetailContent({ company, onUpdate, simulatedDate }: { company: any, onUpdate?: () => void, simulatedDate?: string }) {
    const [activeTab, setActiveTab] = useState("data")
    const [isContactOpen, setIsContactOpen] = useState(false)
    const [isServiceOpen, setIsServiceOpen] = useState(false)
    const router = useRouter()

    // Service Wizard State
    const [serviceStep, setServiceStep] = useState(1)
    const [serviceData, setServiceData] = useState<ServiceFormData>({
        name: "",
        price: 0,
        discount: 0,
        startDate: simulatedDate ? simulatedDate.split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: "",
        type: 'RECURRENTE',
        billingOption: 'NONE',
        billingCycle: 'MONTHLY'
    })

    // Template Logic State
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [isTemplatePromptOpen, setIsTemplatePromptOpen] = useState(false)

    // Invoice Deletion State
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)

    useEffect(() => {
        getServiceTemplates().then(setTemplates)
    }, [])

    const handleUpdate = () => {
        if (onUpdate) {
            onUpdate()
        } else {
            router.refresh()
        }
    }

    const updateCompanyAction = async (formData: FormData) => {
        await updateCompany(company.id, formData)
        handleUpdate()
    }

    const handleCreateContact = async (formData: FormData) => {
        await createContact(company.id, formData)
        setIsContactOpen(false)
        handleUpdate()
    }

    const handleDeleteContact = async (id: string) => {
        await deleteContact(id, company.id)
        handleUpdate()
    }

    // Service Handlers
    const handleServiceNext = () => {
        if (!serviceData.name || !serviceData.price) {
            toast.error("Rellena nombre y precio")
            return
        }
        setServiceStep(2)
    }

    const calculateProrated = () => {
        if (!serviceData.startDate) return 0
        const price = Number(serviceData.price)
        const start = new Date(serviceData.startDate)
        const year = start.getFullYear()
        const month = start.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const startDay = start.getDate()

        // Days inclusive
        const remaining = Math.max(0, daysInMonth - startDay + 1)
        return (price / 30) * remaining
    }

    const submitService = async () => {
        // Prepare data for server action
        const payload = {
            name: serviceData.name,
            price: Number(serviceData.price),
            discount: Number(serviceData.discount),
            companyId: company.id,
            startDate: new Date(serviceData.startDate),
            endDate: serviceData.endDate ? new Date(serviceData.endDate) : undefined,
            type: serviceData.type,
            billingOption: serviceData.billingOption,
            billingCycle: serviceData.billingCycle,
            serviceTemplateId: selectedTemplateId !== 'OTHER' ? selectedTemplateId : undefined
        }

        // Logic for "OTHER" -> Prompt to save template
        if (selectedTemplateId === 'OTHER') {
            setIsTemplatePromptOpen(true)
            return
        }

        // If PUNTUAL, we just create it. No billing options wizard needed usually, 
        // but 'billingOption' might be irrelevant or we set it to 'FULL' implicitly if we want it on next invoice?
        // Actually, createService backend handles PUNTUAL by just creating it active. 
        // If we want it "Pending Billing", createService sets lastBilledAt=null.

        await executeCreateService(payload)
    }

    const executeCreateService = async (payload: any) => {
        try {
            await createService(payload)
            setIsServiceOpen(false)
            setServiceStep(1)
            setServiceData({ name: "", price: 0, discount: 0, startDate: simulatedDate ? simulatedDate.split('T')[0] : new Date().toISOString().split('T')[0], endDate: "", type: 'RECURRENTE', billingOption: 'NONE', billingCycle: 'MONTHLY' }) // Reset
            setSelectedTemplateId("") // Reset select
            toast.success("Servicio creado correctamente")
            handleUpdate()
        } catch (error) {
            console.error(error)
            toast.error("Error al crear servicio")
        }
    }

    const handleTemplatePromptResponse = async (shouldSave: boolean) => {
        setIsTemplatePromptOpen(false)
        let templateId = undefined

        if (shouldSave) {
            try {
                const t = await createServiceTemplate(serviceData.name)
                templateId = t.id
                // Update local templates list immediately for better UX
                setTemplates(prev => [...prev.filter(x => x.id !== t.id), t])
            } catch (e) {
                toast.error("Error al guardar categoría")
            }
        }

        const payload = {
            name: serviceData.name,
            price: Number(serviceData.price),
            discount: Number(serviceData.discount),
            companyId: company.id,
            startDate: new Date(serviceData.startDate),
            endDate: serviceData.endDate ? new Date(serviceData.endDate) : undefined,
            type: serviceData.type,
            billingOption: serviceData.billingOption,
            billingCycle: serviceData.billingCycle,
            serviceTemplateId: templateId
        }

        await executeCreateService(payload)
    }

    const handleDeleteService = async (serviceId: string) => {
        await deleteService(serviceId, company.id)
        handleUpdate()
    }

    const handleDeleteInvoice = async () => {
        if (!invoiceToDelete) return
        const res = await deleteInvoice(invoiceToDelete)
        if (res.success) {
            toast.success("Factura eliminada")
            handleUpdate()
        } else {
            toast.error("Error al eliminar factura")
        }
        setInvoiceToDelete(null)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 md:relative z-10 bg-white/80 backdrop-blur-md md:bg-transparent pb-4 md:pb-0 pt-2 md:pt-0">
                <AnimatedTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabs={[
                        { id: "data", label: "Datos & Contactos" },
                        { id: "services", label: `Servicios (${company.services.length})` },
                        { id: "invoices", label: `Facturas (${company.invoices.length})` },
                    ]}
                    className="w-full md:w-auto"
                />
            </div>

            {/* --- DATA TAB --- */}
            {activeTab === "data" && (
                <div className="space-y-8">
                    {/* Organization Section */}
                    <div className="grid gap-8">
                        {/* Company Form */}
                        <form action={updateCompanyAction}>
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Información Fiscal</h3>
                                </div>

                                <div className="grid gap-5">
                                    <MinimalInput label="Nombre Comercial" name="name" defaultValue={company.name} required />
                                    <MinimalInput label="Razón Social" name="businessName" defaultValue={company.businessName} required />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <MinimalInput label="CIF / NIF" name="taxId" defaultValue={company.taxId} required />
                                        <MinimalInput label="Email Facturas" name="billingEmail" type="email" defaultValue={company.billingEmail} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dirección Fiscal</label>
                                        <Textarea name="address" defaultValue={company.address || ""} className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-none resize-none rounded-lg" rows={3} />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" className="rounded-full px-6 shadow-lg shadow-blue-500/20">
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </div>
                        </form>

                        <div className="border-t border-gray-100 my-2" />

                        {/* Contacts Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Personas de Contacto</h3>
                                </div>
                                <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="rounded-full border-dashed border-gray-300 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50">
                                            <Plus className="h-4 w-4 mr-1" /> Nuevo Contacto
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Añadir Nuevo Contacto</DialogTitle>
                                            <DialogDescription>
                                                Ingresa los datos de la persona de contacto para esta empresa.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form action={handleCreateContact} className="space-y-4 pt-4">
                                            <div className="space-y-4">
                                                <MinimalInput name="name" placeholder="Nombre completo" required label="Nombre" />
                                                <MinimalInput name="email" placeholder="Email" required label="Email" />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <MinimalInput name="role" placeholder="Cargo" label="Cargo" />
                                                    <MinimalInput name="phone" placeholder="Teléfono" label="Teléfono" />
                                                </div>
                                            </div>
                                            <DialogFooter className="pt-4">
                                                <Button type="submit">Guardar Contacto</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid gap-3">
                                {company.contacts.length === 0 && <div className="text-sm text-gray-400 italic py-4">No hay contactos registrados.</div>}
                                {company.contacts.map((contact: any) => (
                                    <div key={contact.id} className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                                                {contact.role && <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{contact.role}</span>}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>
                                                {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>}
                                            </div>
                                        </div>
                                        <form action={handleDeleteContact.bind(null, contact.id)}>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="border-t border-gray-100 pt-8 mt-4">
                            <div className="flex items-center justify-between p-4 bg-red-50/30 rounded-xl border border-red-100/50">
                                <div>
                                    <h3 className="text-red-900/80 font-medium text-sm">Zona de Peligro</h3>
                                </div>
                                <DeleteClientButton clientId={company.id} companyName={company.name} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SERVICES TAB --- */}
            {activeTab === "services" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Servicios Activos</h3>

                        {/* NEW SERVICE POPUP */}
                        <Dialog open={isServiceOpen} onOpenChange={(open) => {
                            setIsServiceOpen(open)
                            if (!open) setServiceStep(1) // Reset on close
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-black text-white hover:bg-slate-800 rounded-lg">
                                    <Plus className="h-4 w-4 mr-2" /> Nuevo Servicio
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white p-0 gap-0 overflow-hidden rounded-2xl">
                                <DialogHeader className="p-6 pb-2">
                                    <DialogTitle className="text-xl font-bold text-gray-900">
                                        {serviceStep === 1 ? "Añadir Nuevo Servicio" : "Opciones de Facturación"}
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-500 mt-1">
                                        {serviceStep === 1
                                            ? "Define las características del servicio recurrente."
                                            : "¿Deseas emitir una factura inicial ahora mismo?"}
                                    </DialogDescription>
                                </DialogHeader>

                                {serviceStep === 1 ? (
                                    // STEP 1: FORM
                                    <div className="space-y-4 px-6 py-4">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de Servicio</label>
                                                <Select
                                                    value={serviceData.type}
                                                    onValueChange={(val: 'PUNTUAL' | 'RECURRENTE') => setServiceData({ ...serviceData, type: val })}
                                                >
                                                    <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="RECURRENTE">Recurrente (Mensual)</SelectItem>
                                                        <SelectItem value="PUNTUAL">Puntual (Un solo cobro)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Concepto / Nombre</label>
                                                <Select
                                                    value={selectedTemplateId}
                                                    onValueChange={(val) => {
                                                        setSelectedTemplateId(val)
                                                        if (val !== 'OTHER') {
                                                            const t = templates.find(t => t.id === val)
                                                            if (t) setServiceData({ ...serviceData, name: t.name })
                                                        } else {
                                                            setServiceData({ ...serviceData, name: "" })
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                                                        <SelectValue placeholder="Selecciona un servicio" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {templates.map((t) => (
                                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                        ))}
                                                        <SelectSeparator />
                                                        <SelectItem value="OTHER">Otro (Personalizado)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {selectedTemplateId === 'OTHER' && (
                                                <MinimalInput
                                                    label="Nombre Específico"
                                                    placeholder="Ej: Consultoría Especial"
                                                    value={serviceData.name}
                                                    onChange={(e: any) => setServiceData({ ...serviceData, name: e.target.value })}
                                                    autoFocus
                                                />
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <MinimalInput
                                                    label="Precio (Sin IVA)"
                                                    placeholder="0.00"
                                                    type="number"
                                                    value={serviceData.price}
                                                    onChange={(e: any) => setServiceData({ ...serviceData, price: e.target.value })}
                                                />
                                                <MinimalInput
                                                    label="Descuento (%)"
                                                    placeholder="0"
                                                    type="number"
                                                    value={serviceData.discount}
                                                    onChange={(e: any) => setServiceData({ ...serviceData, discount: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inicio Servicio</label>
                                                <Input
                                                    type="date"
                                                    value={serviceData.startDate}
                                                    onChange={(e) => setServiceData({ ...serviceData, startDate: e.target.value })}
                                                    className="bg-gray-50/50 border-gray-200 block w-full rounded-lg"
                                                />
                                            </div>


                                            {serviceData.type === 'RECURRENTE' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frecuencia de Facturación</label>
                                                        <Select
                                                            value={serviceData.billingCycle}
                                                            onValueChange={(val: 'MONTHLY' | 'QUARTERLY' | 'YEARLY') => setServiceData({ ...serviceData, billingCycle: val })}
                                                        >
                                                            <SelectTrigger className="w-full bg-gray-50/50 border-gray-200">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="MONTHLY">Mensual (Día 1)</SelectItem>
                                                                <SelectItem value="QUARTERLY">Trimestral (Cada 3 meses)</SelectItem>
                                                                <SelectItem value="YEARLY">Anual (Cada 365 días)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fin Servicio (Opcional)</label>
                                                        <Input
                                                            type="date"
                                                            value={serviceData.endDate}
                                                            onChange={(e) => setServiceData({ ...serviceData, endDate: e.target.value })}
                                                            className="bg-gray-50/50 border-gray-200 block w-full rounded-lg"
                                                        />
                                                        <p className="text-[10px] text-gray-400">Si se deja vacío, se facturará indefinidamente.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // STEP 2: BILLING OPTIONS
                                    <div className="space-y-4 px-6 py-4">
                                        <div className="grid gap-3">
                                            {/* OPTION 1: FULL BILL */}
                                            <div
                                                onClick={() => setServiceData({ ...serviceData, billingOption: 'FULL' })}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all",
                                                    serviceData.billingOption === 'FULL' ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", serviceData.billingOption === 'FULL' ? "border-blue-500" : "border-slate-400")}>
                                                        {serviceData.billingOption === 'FULL' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900">Cobrar mes completo</p>
                                                        <p className="text-xs text-slate-500">Se generará una factura por el total.</p>
                                                    </div>
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">{Number(serviceData.price).toFixed(2)}€</span>
                                            </div>

                                            {/* OPTION 2: PRORATED */}
                                            <div
                                                onClick={() => setServiceData({ ...serviceData, billingOption: 'PRORATED' })}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all",
                                                    serviceData.billingOption === 'PRORATED' ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", serviceData.billingOption === 'PRORATED' ? "border-blue-500" : "border-slate-400")}>
                                                        {serviceData.billingOption === 'PRORATED' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900">Cobrar parte proporcional</p>
                                                        <p className="text-xs text-slate-500">Hasta final de mes (div 30).</p>
                                                    </div>
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">~{calculateProrated().toFixed(2)}€</span>
                                            </div>

                                            {/* OPTION 3: NONE */}
                                            <div
                                                onClick={() => setServiceData({ ...serviceData, billingOption: 'NONE' })}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all",
                                                    serviceData.billingOption === 'NONE' ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", serviceData.billingOption === 'NONE' ? "border-blue-500" : "border-slate-400")}>
                                                        {serviceData.billingOption === 'NONE' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900">No cobrar este mes</p>
                                                        <p className="text-xs text-slate-500">La primera factura será el próximo día 1.</p>
                                                    </div>
                                                </div>
                                                <span className="font-mono font-bold text-slate-400">0.00€</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <DialogFooter className="p-6 pt-2 bg-gray-50/50 border-t border-gray-100/50 rounded-b-2xl">
                                    {serviceStep === 2 && (
                                        <Button variant="ghost" onClick={() => setServiceStep(1)}>Atrás</Button>
                                    )}
                                    <Button
                                        className="bg-black hover:bg-slate-800 text-white rounded-lg px-6"
                                        onClick={serviceStep === 1 ? (serviceData.type === 'PUNTUAL' ? submitService : handleServiceNext) : submitService}
                                    >
                                        {serviceStep === 1 ? (serviceData.type === 'PUNTUAL' ? "Guardar Servicio" : <span className="flex items-center">Siguiente <ArrowRight className="ml-2 h-4 w-4" /></span>) : "Guardar Servicio"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Prompt Dialog for Saving Template */}
                        <Dialog open={isTemplatePromptOpen} onOpenChange={setIsTemplatePromptOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>¿Guardar como servicio predefinido?</DialogTitle>
                                    <DialogDescription>
                                        Has creado un servicio personalizado "{serviceData.name}".
                                        ¿Quieres guardarlo en el catálogo para usarlo en el futuro?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button variant="secondary" onClick={() => handleTemplatePromptResponse(false)}>
                                        No, solo para este cliente
                                    </Button>
                                    <Button onClick={() => handleTemplatePromptResponse(true)}>
                                        Sí, guardar en catálogo
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-3">
                        {company.services.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
                                No hay servicios contratados actualmente.
                            </div>
                        ) : (
                            company.services.map((service: any) => {
                                const isActive = !service.endDate || new Date(service.endDate) > new Date();
                                return (
                                    <div key={service.id} className={cn("flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all group",
                                        isActive ? "bg-white border-gray-100 hover:shadow-md" : "bg-gray-50 border-gray-100 opacity-60"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${service.type === 'RECURRENTE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {service.type === 'RECURRENTE' ? <RotateCw className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                                    {!isActive && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 rounded">Inactivo</span>}
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs text-gray-500 font-medium">
                                                    <span>{service.type === 'RECURRENTE' ? 'Cobro Mensual' : 'Cobro Único'}</span>
                                                    {service.type === 'RECURRENTE' && (
                                                        <span className="hidden sm:inline text-gray-300">•</span>
                                                    )}
                                                    {service.type === 'RECURRENTE' && (
                                                        <span>Desde: {new Date(service.startDate).toLocaleDateString()} {service.endDate && `- Hasta: ${new Date(service.endDate).toLocaleDateString()}`}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono text-lg font-bold text-gray-900">
                                                    {(Number(service.price) * (service.discount ? (100 - Number(service.discount)) / 100 : 1)).toFixed(2)}€
                                                </span>
                                                {Number(service.discount) > 0 && (
                                                    <span className="text-xs text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded-full">
                                                        -{Number(service.discount)}% (Base: {Number(service.price).toFixed(2)}€)
                                                    </span>
                                                )}
                                            </div>
                                            <form action={handleDeleteService.bind(null, service.id)}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )
            }

            {/* --- INVOICES TAB --- */}
            {
                activeTab === "invoices" && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="font-semibold">Nº Factura</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {company.invoices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                                No hay facturas registradas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {company.invoices.map((invoice: any) => (
                                        <TableRow key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-medium text-gray-900">{invoice.number}</TableCell>
                                            <TableCell className="text-gray-500">{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <InvoiceStatusSelect
                                                    invoiceId={invoice.id}
                                                    currentStatus={invoice.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium">{Number(invoice.totalAmount).toFixed(2)}€</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 items-center">
                                                    <form action={`/api/invoice/${invoice.id}/pdf`} target="_blank">
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full hover:bg-gray-100">
                                                            <Download className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </form>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500"
                                                        onClick={() => setInvoiceToDelete(invoice.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. La factura se eliminará permanentemente de la base de datos.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            }
        </div >
    )
}
