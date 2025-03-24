import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Please provide subject and message." }, { status: 400 });
    }
    return NextResponse.json({ success: "Email request received!" }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }
}
