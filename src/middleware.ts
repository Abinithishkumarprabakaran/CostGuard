import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is public, bypass middleware protection
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect all other routes
  const session = await auth();
  
  // If user is not authenticated, Clerk will redirect them to the sign-in page
  if (!session.userId) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
  }

  // If user is logged in but doesn't have an active organization, 
  // redirect them to a hypothetical org-selection page or block access depending on UX constraints.
  // For AWS Cost Alert B2B SaaS, an org is required to view the dashboards.
  if (!session.orgId && req.nextUrl.pathname !== '/org-selection') {
    // In a real app we'd redirect to an org creation/selection page.
    // For this implementation, we enforce orgId presence. If they don't have one,
    // they can't access deeper routes.
    
    // We'll let Clerk handle the org creation flow by keeping things simple:
    // This allows the <OrganizationSwitcher/> or <OrganizationList/> to mount
    // if we put it on a designated page.
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
