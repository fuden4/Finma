import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

function getPgErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function getPgConstraint(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("constraint" in error)) {
    return undefined;
  }
  const constraint = (error as { constraint: unknown }).constraint;
  return typeof constraint === "string" ? constraint : undefined;
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const pgCode = getPgErrorCode(error);
  if (pgCode === "23505") {
    const constraint = getPgConstraint(error) ?? "";
    if (constraint.includes("episodes")) {
      return NextResponse.json(
        {
          error:
            "This season and episode number already exists for this series. Choose the next episode number.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "A record with these values already exists." },
      { status: 409 }
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertUuid(value: string, label: string): void {
  if (!UUID_REGEX.test(value)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
}
