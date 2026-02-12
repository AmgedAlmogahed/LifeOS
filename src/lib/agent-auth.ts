import { NextResponse, type NextRequest } from "next/server";

/**
 * Validates that the incoming request has a valid agent API key.
 * Checks both X-AGENT-API-KEY header and Authorization: Bearer token.
 * Also accepts Supabase SERVICE_ROLE_KEY as a valid credential.
 */
export function validateAgentAuth(request: NextRequest): {
    valid: boolean;
    error?: string;
} {
    const agentApiKey = process.env.AGENT_API_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const headerKey = request.headers.get("x-agent-api-key");
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    const providedKey = headerKey || bearerToken;

    if (!providedKey) {
        return {
            valid: false,
            error: "Missing authentication. Provide X-AGENT-API-KEY header or Bearer token.",
        };
    }

    if (providedKey !== agentApiKey && providedKey !== serviceRoleKey) {
        return {
            valid: false,
            error: "Invalid API key.",
        };
    }

    return { valid: true };
}

/**
 * Creates a standardized error response for agent API routes.
 */
export function agentErrorResponse(message: string, status: number = 400) {
    return NextResponse.json(
        {
            success: false,
            error: message,
            timestamp: new Date().toISOString(),
        },
        { status }
    );
}

/**
 * Creates a standardized success response for agent API routes.
 */
export function agentSuccessResponse(data: Record<string, unknown>, status: number = 200) {
    return NextResponse.json(
        {
            success: true,
            ...data,
            timestamp: new Date().toISOString(),
        },
        { status }
    );
}
