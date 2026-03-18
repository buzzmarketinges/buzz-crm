import { NextResponse } from 'next/server'
import { sendDailySummary } from '@/actions/tasks-actions'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (process.env.CRON_TOKEN && token !== process.env.CRON_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await sendDailySummary()
        return NextResponse.json({ success: true, message: 'Daily summary triggered' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
