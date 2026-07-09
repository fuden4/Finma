import { NextResponse } from "next/server";
import { listCommentsByUserId } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    const comments = await listCommentsByUserId(user.id);
    return NextResponse.json({ comments });
  } catch (error) {
    return handleRouteError(error);
  }
}
