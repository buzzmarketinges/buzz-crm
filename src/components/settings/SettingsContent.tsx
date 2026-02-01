'use client'

import { useState, useEffect } from 'react'
import { updateSettings } from "@/actions/settings-actions"
import { clearTenant } from "@/actions/tenant-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AnimatedTabs } from "@/components/ui/AnimatedTabs"
import { Building2, Mail, Settings2, Save, ShieldCheck, Percent } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Minimalist Input Component
const MinimalInput = ({ label, ...props }: any) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
        <Input {...props} className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-none focus:ring-1 focus:ring-gray-300 rounded-lg" />
    </div>
)

export function SettingsContent({ settings }: { settings: any }) {
    const [activeTab, setActiveTab] = useState("company")
    const s = settings as any
    const [adminMode, setAdminMode] = useState(s.isAdminMode || false)
    const [taxEnabled, setTaxEnabled] = useState(s.taxEnabled || false)
    const [withholdingEnabled, setWithholdingEnabled] = useState(s.withholdingEnabled || false)
    const [isDirty, setIsDirty] = useState(false)

    // Helper to mark dirty when user interacts with custom switches
    const markDirty = () => setIsDirty(true)

    // Wrapper for setters
    const handleSetTaxEnabled = (val: boolean) => { setTaxEnabled(val); markDirty(); }
    const handleSetWithholdingEnabled = (val: boolean) => { setWithholdingEnabled(val); markDirty(); }
    const handleSetAdminMode = (val: boolean) => { setAdminMode(val); markDirty(); }

    useEffect(() => {
        setTaxEnabled(s.taxEnabled || false)
        setWithholdingEnabled(s.withholdingEnabled || false)
        setAdminMode(s.isAdminMode || false)
    }, [s])

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ... tabs container ... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 md:relative z-10 bg-white/80 backdrop-blur-md md:bg-transparent pb-4 md:pb-0 pt-2 md:pt-0">
                <AnimatedTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    tabs={[
                        { id: "company", label: "Empresa & Pagos" },
                        { id: "bank", label: "Datos Bancarios" },
                        { id: "email", label: "Email & Comunicaciones" },
                        { id: "system", label: "Sistema" },
                        { id: "switch", label: "Cambiar Empresa" },
                    ]}
                    className="w-full md:w-auto"
                />
            </div>

            {activeTab === 'switch' && (
                <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <h3 className="text-xl font-bold text-slate-800">¿Deseas cambiar de empresa?</h3>
                    <p className="text-slate-500 text-center max-w-md">
                        Serás redirigido a la pantalla de selección de empresa.
                    </p>
                    <Button
                        onClick={() => clearTenant()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-900/20"
                    >
                        <Building2 className="mr-2 h-6 w-6" />
                        Ir a Selección de Empresa
                    </Button>
                </div>
            )}

            <form
                onChange={() => setIsDirty(true)}
                action={async (formData) => {
                    const data = Object.fromEntries(formData.entries())
                    const res = await updateSettings(data)
                    if (res.success) {
                        toast.success("Cambios guardados correctamente")
                        setIsDirty(false)
                    } else {
                        toast.error("Error al guardar cambios")
                    }
                }}
            >
                {/* GLOBAL HIDDEN INPUTS (Always preserved across tabs) */}
                <input type="hidden" name="taxEnabled" value={String(taxEnabled)} />
                <input type="hidden" name="withholdingEnabled" value={String(withholdingEnabled)} />
                <input type="hidden" name="isAdminMode" value={String(adminMode)} />

                {/* --- COMPANY TAB --- */}
                {activeTab === "company" && (
                    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in zoom-in-95 duration-300">
                        {/* Mis Datos */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Datos de Empresa</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <MinimalInput label="Nombre Comercial" name="commercialName" defaultValue={s.commercialName || ""} placeholder="Nombre visible en facturas" />
                                <MinimalInput label="Razón Social (Legal)" name="companyName" defaultValue={s.companyName || ""} placeholder="BuzzMarketing LLC" />
                                <MinimalInput label="Email Corporativo" name="companyEmail" defaultValue={s.companyEmail || ""} />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <MinimalInput label={s.taxIdLabel || "EIN"} name="companyTaxId" defaultValue={s.companyTaxId || ""} />
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Etiqueta ID Fiscal</label>
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <div className="flex items-center space-x-2">
                                                <input type="radio" id="r1" name="taxIdLabel" value="EIN" defaultChecked={s.taxIdLabel === 'EIN' || !s.taxIdLabel} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                                <label htmlFor="r1" className="text-sm font-medium text-gray-700">EIN (USA)</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input type="radio" id="r2" name="taxIdLabel" value="NIF" defaultChecked={s.taxIdLabel === 'NIF'} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                                <label htmlFor="r2" className="text-sm font-medium text-gray-700">NIF (España)</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dirección</label>
                                    <Textarea name="companyAddress" defaultValue={s.companyAddress || ""} className="bg-gray-50/50 border-gray-200 resize-none rounded-lg" rows={5} />
                                </div>
                            </div>
                        </div>

                        {/* Configuración Fiscal */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <Percent className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Configuración Fiscal</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">

                                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-lg border border-purple-100/50">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-base font-semibold text-slate-900">Aplicar IVA</Label>
                                        </div>
                                        <p className="text-xs text-slate-500">Añade el porcentaje de impuesto a la base imponible.</p>
                                    </div>
                                    <Switch
                                        checked={taxEnabled}
                                        onCheckedChange={handleSetTaxEnabled}
                                    />
                                </div>
                                <div className={`transition-all duration-300 ${taxEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <MinimalInput label="Porcentaje IVA (%)" name="taxRate" type="number" step="0.01" defaultValue={s.taxRate ? Number(s.taxRate) : 21} />
                                </div>

                                <div className="h-px bg-gray-100 my-4" />

                                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-lg border border-purple-100/50">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-base font-semibold text-slate-900">Aplicar Retención (IRPF)</Label>
                                        </div>
                                        <p className="text-xs text-slate-500">Resta el porcentaje de retención a la base imponible.</p>
                                    </div>
                                    <Switch
                                        checked={withholdingEnabled}
                                        onCheckedChange={handleSetWithholdingEnabled}
                                    />
                                </div>
                                <div className={`transition-all duration-300 ${withholdingEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <MinimalInput label="Porcentaje Retención (%)" name="withholdingRate" type="number" step="0.01" defaultValue={s.withholdingRate ? Number(s.withholdingRate) : 15} />
                                </div>

                            </div>
                        </div>

                    </div>
                )}

                {/* --- BANK TAB --- */}
                {activeTab === "bank" && (
                    <div className="max-w-4xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Datos Bancarios</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <MinimalInput label="Beneficiario" name="bankBeneficiary" defaultValue={s.bankBeneficiary || ""} />
                                <MinimalInput label="IBAN" name="bankIban" defaultValue={s.bankIban || ""} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <MinimalInput label="Banco" name="bankName" defaultValue={s.bankName || ""} />
                                    <MinimalInput label="SWIFT / BIC" name="bankSwift" defaultValue={s.bankSwift || ""} />
                                </div>
                                <MinimalInput label="Dirección Banco" name="bankAddress" defaultValue={s.bankAddress || ""} />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- EMAIL TAB --- */}
                {activeTab === "email" && (
                    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in zoom-in-95 duration-300">
                        {/* SMTP Configuration */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Configuración SMTP</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <MinimalInput label="SMTP Host" name="emailSmtpHost" defaultValue={s.emailSmtpHost || ""} />
                                    <MinimalInput label="SMTP Port" name="emailSmtpPort" defaultValue={s.emailSmtpPort || 587} />
                                    <MinimalInput label="Usuario" name="emailSmtpUser" defaultValue={s.emailSmtpUser || ""} />
                                    <MinimalInput label="Contraseña" name="emailSmtpPass" type="password" defaultValue={s.emailSmtpPass || ""} />
                                </div>
                            </div>
                        </div>

                        {/* Email Templates */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Plantillas de Correo</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <MinimalInput label="Asunto del Correo" name="emailSubject" defaultValue={s.emailSubject || "Factura %numfactura%"} />
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cuerpo del Mensaje</label>
                                    <Textarea
                                        name="emailBodyTemplate"
                                        defaultValue={s.emailBodyTemplate || ""}
                                        placeholder="Hola, adjunto factura..."
                                        className="min-h-[200px] font-mono text-sm bg-gray-50/50 border-gray-200 resize-y rounded-lg"
                                    />
                                    <p className="text-xs text-gray-400">Variables disponibles: %numfactura%, %nombreempresa%, %total%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SYSTEM TAB --- */}
                {activeTab === "system" && (
                    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                                    <Settings2 className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Facturación</h3>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-slate-600" />
                                            <Label className="text-base font-semibold text-slate-900">Modo Administrador</Label>
                                        </div>
                                        <p className="text-xs text-slate-500">Habilita funciones avanzadas como simulación de fecha y exportación de datos.</p>
                                    </div>
                                    <Switch
                                        name="isAdminMode"
                                        checked={adminMode}
                                        onCheckedChange={setAdminMode}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <MinimalInput label="Prefijo Factura" name="invoicePrefix" defaultValue={s.invoicePrefix || "INV-"} />
                                        <p className="text-xs text-gray-500">Variables: %yy% %yyyy%</p>
                                    </div>
                                    <MinimalInput label="Próximo Número" name="invoiceNextNumber" type="number" defaultValue={s.invoiceNextNumber || 1} />
                                </div>
                                <MinimalInput label="Ruta Guardado Local (PDF)" name="localSavePath" defaultValue={s.localSavePath || "C:/Facturas"} />
                                <MinimalInput label="Objetivo Anual de Facturación (€)" name="yearlyGoal" type="number" defaultValue={s.yearlyGoal || 100000} />
                            </div>
                        </div>

                        {adminMode && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                        <Settings2 className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Modo Simulación</h3>
                                </div>
                                <div className="bg-amber-50/30 p-6 rounded-2xl border border-amber-100/50 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-amber-700 uppercase tracking-wide">Fecha Simulada</label>
                                        <Input
                                            name="simulatedDate"
                                            type="date"
                                            defaultValue={s.simulatedDate ? new Date(s.simulatedDate).toISOString().split('T')[0] : ""}
                                            className="bg-white border-amber-200 focus:ring-amber-500 text-amber-900"
                                        />
                                        <p className="text-xs text-amber-600/80 mt-1">Si defines una fecha, el sistema creerá que es ese día para generar facturas recurrentes.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="fixed bottom-6 right-6 z-20">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={!isDirty}
                        className={`rounded-full shadow-xl px-8 h-12 text-base transition-all ${isDirty ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 text-white' : 'bg-gray-200 text-gray-400'}`}
                    >
                        <Save className="w-4 h-4 mr-2" /> {isDirty ? 'Guardar Cambios' : 'Sin cambios'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
