"use client"

import { AlertTriangle, Calendar } from "lucide-react"

export function SimulationBar({ simulatedDate }: { simulatedDate: string | null }) {
    if (!simulatedDate) return null

    const dateObj = new Date(simulatedDate)

    // Format: "Miércoles, 1 de Febrero de 2026"
    const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="w-full bg-yellow-400 text-yellow-950 px-4 py-2 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-sm font-medium shadow-md relative z-50 text-center md:text-left">
            <div className="flex items-center gap-2 animate-pulse">
                <AlertTriangle className="h-4 w-4 text-yellow-800" />
                <span className="uppercase tracking-wider font-bold text-xs bg-yellow-500/50 text-yellow-900 px-2 py-0.5 rounded">Modo Test Activo</span>
            </div>
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Fecha del Sistema: <span className="font-bold underline decoration-yellow-700 decoration-2 underline-offset-2">{formattedDate}</span></span>
            </div>
        </div>
    )
}
