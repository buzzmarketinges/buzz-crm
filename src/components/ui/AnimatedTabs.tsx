'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Tab {
    id: string
    label: string
}

interface AnimatedTabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (id: string) => void
    className?: string
}

export function AnimatedTabs({ tabs, activeTab, onChange, className }: AnimatedTabsProps) {
    return (
        <div className={cn("flex p-1 bg-gray-100/50 rounded-xl", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`${activeTab === tab.id ? "" : "hover:text-gray-700"
                        } relative flex-1 rounded-lg py-2.5 text-sm font-medium text-gray-600 outline-sky-400 transition focus-visible:outline-2`}
                    style={{
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="bubble"
                            className="absolute inset-0 z-10 bg-white shadow-sm rounded-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className={cn("relative z-20 transition-colors duration-300 block text-center truncate px-2", activeTab === tab.id ? "text-gray-900 font-semibold" : "text-gray-500")}>
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    )
}
