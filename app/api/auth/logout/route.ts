import { destroySession } from "@/lib/auth";

// Plain <form method="post"> from the header, so it works without JS.
export async function POST(req: Request) {
  await destroySession();
  return Response.redirect(new URL("/", req.url), 303);
}
