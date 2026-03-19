import { getProject, getProjectReport } from "@/actions/projects-actions"
import { getServices } from "@/actions/service-actions"
import { ProjectDetailContent } from "@/components/ProjectDetailContent"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params
    const project = await getProject(resolvedParams.id)
    if (!project) return <div className="p-8 text-slate-500">Proyecto no encontrado.</div>

    // Parallel sub-fetches
    const [report, services] = await Promise.all([
        getProjectReport(resolvedParams.id),
        getServices(project.companyId)
    ])

    const unlinkedServices = services.filter((s: any) => s.projectId !== project.id)

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-7xl">
            <div className="flex items-center gap-4">
                <Link href="/projects">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
                    <p className="text-sm text-slate-500">{project.company?.name}</p>
                </div>
            </div>

            <ProjectDetailContent 
                project={project} 
                report={report} 
                services={unlinkedServices}
                isPage={true} 
            />
        </div>
    )
}
