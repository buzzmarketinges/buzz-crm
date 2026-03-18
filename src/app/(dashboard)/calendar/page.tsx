import { getTasks } from "@/actions/tasks-actions"
import { getProjects } from "@/actions/projects-actions"
import { CalendarContent } from "@/components/CalendarContent"

export default async function CalendarPage() {
    const [tasks, projects] = await Promise.all([
        getTasks(),
        getProjects()
    ])

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-7xl animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">Calendario</h1>
            <CalendarContent tasks={tasks} projects={projects} />
        </div>
    )
}
