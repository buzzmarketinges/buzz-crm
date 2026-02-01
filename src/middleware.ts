import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const tenantId = req.cookies.get("buzz_tenant_id")
        const isSelectCompany = req.nextUrl.pathname === "/select-company"

        if (!tenantId && !isSelectCompany) {
            return NextResponse.redirect(new URL("/select-company", req.url))
        }

        if (tenantId && isSelectCompany) {
            return NextResponse.redirect(new URL("/", req.url))
        }
    },
    {
        pages: {
            signIn: "/login",
        },
    }
)

export const config = {
    matcher: [
        "/((?!api|login|forgot-password|reset-password|_next/static|_next/image|favicon.ico).*)",
    ],
}
