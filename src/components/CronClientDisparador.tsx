'use client'
import { useEffect } from 'react'

export function CronClientDisparador() {
    useEffect(() => {
        // Disparador automático cada 60 segundos desde cliente
        const i = setInterval(() => {
            fetch('/api/cron/reminders').catch(() => { })
        }, 60000)

        // Registrar Service Worker para PWA y Push
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => { })
        }
        
        return () => clearInterval(i)
    }, [])
    
    return null
}
