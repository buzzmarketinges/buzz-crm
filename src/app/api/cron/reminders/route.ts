import { NextResponse } from 'next/server'
import { sendTaskReminders } from '@/actions/tasks-actions'

export async function GET(request: Request) {
    // Optional: Protect with a secret header token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (process.env.CRON_TOKEN && token !== process.env.CRON_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await sendTaskReminders()
        return NextResponse.json({ success: true, message: 'Reminders triggered' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
