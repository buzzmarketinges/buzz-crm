'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { InvoiceStatusSelect } from "@/components/InvoiceStatusSelect"
import { Download, Mail, Building2, Calendar, CreditCard, Hash, Loader2, FileText, Check, AlertCircle } from "lucide-react"
import { sendInvoiceEmail, getInvoiceEmailData } from "@/actions/email-actions"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface InvoiceDetailContentProps {
    invoice: any
    onUpdate?: () => void
}

export function InvoiceDetailContent({ invoice, onUpdate }: InvoiceDetailContentProps) {
    const [isSending, setIsSending] = useState(false)
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)

    // Email Form State
    const [emailSubject, setEmailSubject] = useState("")
    const [emailBody, setEmailBody] = useState("")
    const [availableContacts, setAvailableContacts] = useState<any[]>([])
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])

    // BCC State
    const [bccEnabled, setBccEnabled] = useState(true)
    const [companyEmail, setCompanyEmail] = useState<string | null>(null)

    const router = useRouter()
    const items = (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || []) as { name: string, price: number }[]

    const handleOpenEmailDialog = async () => {
        setIsEmailDialogOpen(true)
        setIsLoadingPreview(true)
        try {
            const data = await getInvoiceEmailData(invoice.id)
            setEmailSubject(data.subject)
            setEmailBody(data.body)
            setAvailableContacts(data.contacts)
            setCompanyEmail(data.companyEmail)
            setBccEnabled(!!data.companyEmail)
            // Default select all contacts
            setSelectedRecipients(data.contacts.map((c: any) => c.email))
        } catch (error) {
            console.error("Failed to load email preview", error)
            toast.error("Error al cargar la vista previa del email")
            setIsEmailDialogOpen(false)
        } finally {
            setIsLoadingPreview(false)
        }
    }

    const toggleRecipient = (email: string) => {
        setSelectedRecipients(prev =>
            prev.includes(email)
                ? prev.filter(e => e !== email)
                : [...prev, email]
        )
    }

    const handleSendConfirm = async () => {
        if (selectedRecipients.length === 0) {
            toast.error("Debes seleccionar al menos un destinatario")
            return
        }

        setIsSending(true)
        try {
            await sendInvoiceEmail(invoice.id, {
                recipients: selectedRecipients,
                subject: emailSubject,
                body: emailBody,
                bcc: (bccEnabled && companyEmail) ? [companyEmail] : undefined
            })

            toast.success("Factura enviada correctamente", {
                description: `Se ha enviado a ${selectedRecipients.length} destinatarios.`
            })

            setIsEmailDialogOpen(false)

            if (onUpdate) onUpdate()
            else router.refresh()
        } catch (e) {
            console.error(e)
            toast.error("Error al enviar el email")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-700">
                            <Hash className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{invoice.number}</h2>
                        </div>
                    </div>
                    {/* Compact Status */}
                    <div className="scale-90 origin-right">
                        <InvoiceStatusSelect invoiceId={invoice.id} currentStatus={invoice.status} />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
                <form action={`/api/invoice/${invoice.id}/pdf`} target="_blank">
                    <Button variant="outline" className="w-full h-12 border-slate-200 hover:bg-slate-50 hover:text-slate-900 justify-start px-4">
                        <Download className="mr-2 h-4 w-4" /> Descargar PDF
                    </Button>
                </form>

                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={handleOpenEmailDialog}
                            className="w-full h-12 bg-black hover:bg-slate-800 text-white justify-start px-4 shadow-lg shadow-slate-900/10"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Enviar por Email
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900">Enviar Factura por Email</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Personaliza el mensaje y selecciona los destinatarios.
                            </DialogDescription>
                        </DialogHeader>

                        {isLoadingPreview ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                <p>Preparando vista previa...</p>
                            </div>
                        ) : (
                            <div className="space-y-6 pt-2">
                                {/* Recipients */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enviar a:</Label>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
                                        {availableContacts.map((contact) => (
                                            <div key={contact.email} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                                                <Checkbox
                                                    id={`contact-${contact.email}`}
                                                    checked={selectedRecipients.includes(contact.email)}
                                                    onCheckedChange={() => toggleRecipient(contact.email)}
                                                    className="border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50"
                                                />
                                                <div className="grid gap-0.5 leading-none cursor-pointer" onClick={() => toggleRecipient(contact.email)}>
                                                    <label
                                                        htmlFor={`contact-${contact.email}`}
                                                        className="text-sm font-medium text-slate-900 cursor-pointer"
                                                    >
                                                        {contact.name || contact.email}
                                                    </label>
                                                    <p className="text-xs text-slate-500">
                                                        {contact.email} • {contact.role || 'Contacto'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedRecipients.length === 0 && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Selecciona al menos un destinatario.
                                        </p>
                                    )}
                                </div>

                                {/* Subject */}
                                <div className="space-y-2">
                                    <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Asunto</Label>
                                    <Input
                                        id="subject"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        className="font-medium bg-white border-slate-200 text-slate-900 focus-visible:ring-slate-400"
                                    />
                                </div>

                                {/* Body */}
                                <div className="space-y-2">
                                    <Label htmlFor="body" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mensaje</Label>
                                    <Textarea
                                        id="body"
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        rows={6}
                                        className="resize-none bg-white border-slate-200 text-slate-900 focus-visible:ring-slate-400"
                                    />
                                </div>

                                {/* Attachment Visualization */}
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white rounded-lg border border-blue-100 flex items-center justify-center text-red-500 shadow-sm">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Factura-{invoice.number}.pdf</p>
                                        <p className="text-xs text-slate-500">Adjunto automático</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">PDF</Badge>
                                    </div>
                                </div>

                                {/* BCC Option */}
                                {companyEmail && (
                                    <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <Checkbox
                                            id="bcc-toggle"
                                            checked={bccEnabled}
                                            onCheckedChange={(checked) => setBccEnabled(checked as boolean)}
                                            className="border-slate-300 data-[state=checked]:bg-slate-900"
                                        />
                                        <Label htmlFor="bcc-toggle" className="text-sm text-slate-700 font-medium cursor-pointer">
                                            Este e-mail se enviará con copia oculta a <span className="font-bold text-slate-900">{companyEmail}</span>
                                        </Label>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">Cancelar</Button>
                            <Button
                                onClick={handleSendConfirm}
                                disabled={isSending || isLoadingPreview || selectedRecipients.length === 0}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                                    </>
                                ) : (
                                    <>
                                        Enviar Email <Mail className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Client Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" /> Cliente
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-1">
                        <p className="font-semibold text-slate-900">{invoice.company.name}</p>
                        <p className="text-sm text-slate-500">{invoice.company.businessName}</p>
                        <p className="text-sm text-slate-500">{invoice.company.taxId}</p>
                        <p className="text-sm text-blue-600 truncate">{invoice.company.billingEmail}</p>
                    </div>
                </div>

                {/* Dates & Amounts */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" /> Detalles
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Fecha Emisión</span>
                            <span className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Total</span>
                            <span className="font-mono font-bold text-lg">{Number(invoice.totalAmount).toFixed(2)}€</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-400" /> Conceptos
                </h3>
                <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Descripción</th>
                                <th className="px-6 py-4 font-semibold text-right">Precio Unit.</th>
                                <th className="px-6 py-4 font-semibold text-right">Dto.</th>
                                <th className="px-6 py-4 font-semibold text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {items.map((item: any, idx) => {
                                const price = Number(item.price)
                                const discount = Number(item.discount || 0)
                                const finalPrice = discount > 0 ? price * ((100 - discount) / 100) : price
                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-700 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-right">{price.toFixed(2)}€</td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-right">
                                            {discount > 0 ? (
                                                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs font-semibold">
                                                    -{discount}%
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 font-mono font-medium text-right">{finalPrice.toFixed(2)}€</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50/50 border-t border-slate-200">
                            {/* Subtotal */}
                            <tr>
                                <td colSpan={3} className="px-6 py-3 text-right text-slate-500">Subtotal</td>
                                <td className="px-6 py-3 text-right font-mono text-slate-900">{Number(invoice.subtotal).toFixed(2)}€</td>
                            </tr>

                            {/* Taxes (IVA) */}
                            {Number(invoice.taxRate) > 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-2 text-right text-slate-500">
                                        IVA ({Number(invoice.taxRate)}%)
                                    </td>
                                    <td className="px-6 py-2 text-right font-mono text-slate-600">
                                        +{Number(invoice.taxAmount).toFixed(2)}€
                                    </td>
                                </tr>
                            )}

                            {/* Withholding (IRPF) */}
                            {Number(invoice.withholdingRate) > 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-2 text-right text-slate-500">
                                        IRPF (-{Number(invoice.withholdingRate)}%)
                                    </td>
                                    <td className="px-6 py-2 text-right font-mono text-slate-600">
                                        -{Number(invoice.withholdingAmount).toFixed(2)}€
                                    </td>
                                </tr>
                            )}

                            {/* Total Final */}
                            <tr className="bg-slate-100/50 border-t border-slate-200">
                                <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-900 text-base">Total</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono text-lg text-blue-600">
                                    {Number(invoice.totalAmount).toFixed(2)}€
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    )
}
