import { NextResponse } from "next/server";
import { createPoster, listAdminPosters } from "@/db/queries";
import {
  parsePosterFormData,
  resolvePosterImageUrl,
} from "@/lib/admin-upload";
import { requireAdmin } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const posters = await listAdminPosters();
    return NextResponse.json({ posters });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const parsed = parsePosterFormData(formData);
    const image_url = await resolvePosterImageUrl(parsed, parsed.title);

    const poster = await createPoster({
      title: parsed.title,
      description: parsed.description,
      image_url,
    });

    return NextResponse.json({ poster }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
