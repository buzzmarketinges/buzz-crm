
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getTenantId() {
    const cookieStore = await cookies()
    const tenantId = cookieStore.get('buzz_tenant_id')?.value

    if (!tenantId) {
        redirect('/select-company')
    }

    return tenantId
}
