'use client'

import { useState, useRef, useEffect } from 'react'
import { updateInvoiceStatus } from '@/actions/invoice-actions'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InvoiceStatusSelectProps {
    invoiceId: string
    currentStatus: string
    lastError?: string | null
}

export function InvoiceStatusSelect({ invoiceId, currentStatus, lastError }: InvoiceStatusSelectProps) {
    const [status, setStatus] = useState(currentStatus)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync if props update
    useEffect(() => {
        setStatus(currentStatus)
    }, [currentStatus])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = async (newStatus: string) => {
        setIsOpen(false)
        if (newStatus === status) return;

        const previousStatus = status
        setStatus(newStatus)
        setIsLoading(true)

        try {
            await updateInvoiceStatus(invoiceId, newStatus)
            router.refresh()
        } catch (error) {
            console.error("Failed to update status", error)
            setStatus(previousStatus)
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusInfo = (s: string) => {
        switch (s) {
            case 'PAID': return { label: 'PAGADO', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200', dot: 'bg-green-500' }
            case 'SENT': return { label: 'ENVIADO', color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', dot: 'bg-blue-500' }
            case 'ERROR': return { label: 'ERROR', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 cursor-help', dot: 'bg-red-500' }
            case 'CREATED': default: return { label: 'CREADO', color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200', dot: 'bg-slate-500' }
        }
    }

    const currentInfo = getStatusInfo(status)

    const triggerButton = (
        <button
            onClick={(e) => {
                if (status === 'ERROR') {
                    // Even if error, allow click to change status (e.g. retry manually)
                }
                setIsOpen(!isOpen)
            }}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 ${currentInfo.color} ${isOpen ? 'ring-2 ring-offset-1 ring-blue-300' : ''}`}
        >
            {status === 'ERROR' ? <AlertCircle className="w-3 h-3 text-red-600" /> : <div className={`w-2 h-2 rounded-full ${currentInfo.dot} shadow-sm`} />}
            {currentInfo.label}
            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    )

    return (
        <div className="relative w-fit" ref={containerRef}>
            {status === 'ERROR' && lastError ? (
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            {triggerButton}
                        </TooltipTrigger>
                        <TooltipContent className="bg-red-600 text-white border-red-700 max-w-xs break-words">
                            <p className="font-semibold mb-1">Error en el envío:</p>
                            <p className="text-xs">{lastError}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                triggerButton
            )}

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 ease-out origin-top-left ring-1 ring-slate-900/5">
                    {['CREATED', 'SENT', "PAID"].map((s) => {
                        const info = getStatusInfo(s)
                        const isSelected = status === s
                        return (
                            <button
                                key={s}
                                onClick={() => handleSelect(s)}
                                className={`w-full text-left px-3 py-2.5 text-xs font-medium flex items-center gap-2 transition-colors ${isSelected ? 'text-slate-900 bg-slate-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${info.dot}`} />
                                {info.label}
                                {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-slate-900" />}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
