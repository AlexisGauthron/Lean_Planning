import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Simulation d'envoi d'email (aucun vrai envoi)
  await new Promise((r) => setTimeout(r, 200));
  console.log(`[MAIL SIMULÉ] À: ${body.to} | Objet: ${body.subject}`);
  return NextResponse.json({ success: true, to: body.to, subject: body.subject });
}
