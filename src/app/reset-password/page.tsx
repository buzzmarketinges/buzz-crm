
'use client'

import { useState, Suspense } from "react"
import { resetPassword } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"

function ResetForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    if (!token) {
        return (
            <div className="text-center p-4">
                <p className="text-red-500">Enlace inválido. No se ha proporcionado ningún token.</p>
                <Link href="/login" className="text-blue-600 underline mt-4 block">Volver al Login</Link>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const password = formData.get("password") as string
        const confirm = formData.get("confirm") as string

        if (password !== confirm) {
            toast.error("Las contraseñas no coinciden")
            setLoading(false)
            return
        }

        try {
            const result = await resetPassword(token, password)
            if (result.success) {
                setSuccess(true)
                toast.success("Contraseña restablecida con éxito")
                setTimeout(() => router.push("/login"), 3000)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Error al procesar la solicitud")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">¡Contraseña Actualizada!</h3>
                <p className="text-slate-500">Tu contraseña ha sido cambiada correctamente.</p>
                <Button onClick={() => router.push("/login")} className="w-full mt-4">
                    Ir al Login
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar Contraseña</Label>
                <Input id="confirm" name="confirm" type="password" required />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md shadow-xl border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">Restablecer Contraseña</CardTitle>
                    <CardDescription>
                        Introduce tu nueva contraseña.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<p className="text-center p-4">Cargando...</p>}>
                        <ResetForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
