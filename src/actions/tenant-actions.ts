'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function selectCompany(settingsId: string) {
    const cookieStore = await cookies()
    cookieStore.set('buzz_tenant_id', settingsId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    redirect('/')
}

export async function clearTenant() {
    const cookieStore = await cookies()
    cookieStore.delete('buzz_tenant_id')
    redirect('/select-company')
}
