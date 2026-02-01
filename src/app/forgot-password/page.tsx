
'use client'

import { useState } from "react"
import { requestPasswordReset } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string

        try {
            const result = await requestPasswordReset(email)
            if (result.success) {
                setSent(true)
                toast.success("Email enviado")
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Error al procesar la solicitud")
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Card className="w-full max-w-md shadow-xl border-none">
                    <CardHeader className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800">Email Enviado</CardTitle>
                        <CardDescription className="mt-2">
                            Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña en unos minutos.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pb-8">
                        <Link href="/login">
                            <Button variant="outline">Volver a Login</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md shadow-xl border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">Recuperar Contraseña</CardTitle>
                    <CardDescription>
                        Ingresa tu email para recibir un enlace de recuperación.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="info@buzzmarketing.es" required />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? "Enviando..." : "Enviar Enlace"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
