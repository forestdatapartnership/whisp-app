import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

export class BaseRoute {
  protected req: NextRequest;
  
  constructor(req: NextRequest) {
    this.req = req;
  }

  public async jsonOrNull(): Promise<any> {
    try {
      if (this.req.body) {
        return await this.req.json();
      }
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return null;
    }
    return null;
  }

  public jsonResponse(data: any, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
  }

  public errorResponse(message: string, status: number = 500): NextResponse {
    return this.jsonResponse({ error: message }, status);
  }

  public badRequestResponse(message: string, status: number = 400) : NextResponse {
    return this.errorResponse(message , status);
  }

  public missingOrInvalidBodyResponse() : NextResponse {
    return this.badRequestResponse("Missing or invalid request body.");
  }
}