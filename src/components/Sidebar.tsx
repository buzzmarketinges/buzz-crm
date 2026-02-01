"use client"

import { SidebarContent } from "./SidebarContent"

export function Sidebar() {
    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed inset-y-0 left-0 z-50 transition-all duration-300">
            <SidebarContent />
        </aside>
    )
}
