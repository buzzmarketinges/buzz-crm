"use client"

import { TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"

interface ClientRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    clientId: string
    children: React.ReactNode
}

export function ClientRow({ clientId, children, className, ...props }: ClientRowProps) {
    const router = useRouter()

    return (
        <TableRow
            className={`cursor-pointer hover:bg-slate-50 transition-colors ${className}`}
            onClick={() => router.push(`/clients/${clientId}`)}
            {...props}
        >
            {children}
        </TableRow>
    )
}
