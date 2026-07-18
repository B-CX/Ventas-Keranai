import { auth } from '@/auth.config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = nextUrl.pathname === '/login';

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isPublicRoute) {
    if (isLoggedIn) {
      const userRole = (req.auth?.user as any)?.role;
      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', nextUrl));
      } else {
        return NextResponse.redirect(new URL('/venta', nextUrl));
      }
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  const userRole = (req.auth?.user as any)?.role;
  if (userRole === 'VENDEDOR' && nextUrl.pathname.startsWith('/admin')) {
    const allowedForVendedor = ['/admin/productos', '/admin/clientes', '/admin/calendario'];
    if (!allowedForVendedor.includes(nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/venta', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
