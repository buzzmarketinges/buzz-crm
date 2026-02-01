'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// Ensure you have lucide-react installed and it has Euro. If not, fallback or check availability.
import { FileText, Users, Settings, Briefcase, Euro, LayoutDashboard, DollarSign } from "lucide-react"

import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['900']
})

const items = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Facturación", href: "/billing", icon: Euro },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Servicios", href: "/services", icon: Briefcase },
    { name: "Ajustes", href: "/settings", icon: Settings },
]

interface SidebarContentProps {
    onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3 text-white">
                    {/* Icon removed as requesting */}
                    <span className={cn("text-xl tracking-tight text-white", montserrat.className)}>BuzzMarketing</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Gestión
                </div>
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2 text-[14px] rounded-md transition-all duration-200 text-slate-400",
                                isActive
                                    ? "bg-slate-800 text-white font-medium shadow-sm ring-1 ring-slate-700"
                                    : "hover:bg-slate-800/50 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-[18px] w-[18px] transition-colors",
                                    isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"
                                )}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800">
                        GU
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Galos User</p>
                        <p className="text-xs text-slate-400 truncate">Pro Plan</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
