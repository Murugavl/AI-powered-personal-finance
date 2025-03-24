import { NextResponse } from "next/server";

// Predefined responses for website-related questions
const websiteResponses: { [key: string]: string } = {
  "where can i see the accounts page": "In the navbar, click the 'Accounts' tab to access the accounts page.",
  "how to contact support": "Click the 'Support' tab in the footer or email support@yourwebsite.com.",
  "how to reset my password": "Go to the login page, click 'Forgot Password,' and follow the instructions.",
  "how do i add a new transaction?": "Go to 'Transactions' → Click 'Add Transaction' → Fill in details → Click 'Save'.",
  "how can i set up a budget?": "Go to 'Budgets' → Click 'Create New Budget' → Set category, amount & duration → Save.",
  "how do i connect my bank account?": "Go to 'Accounts' → Click 'Add Account' → Select your bank → Follow login steps.",
  "can i export my financial data?": "Yes, go to 'Settings' → 'Export Data' → Choose CSV or PDF format.",
  "how do i set up notifications?": "Go to 'Settings' → 'Notifications' → Choose alerts like low balance & reminders."
};

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const lowercaseMessage = message.toLowerCase().trim(); // Normalize input

    // Check if message matches a predefined response
    if (websiteResponses[lowercaseMessage]) {
      return NextResponse.json({ reply: websiteResponses[lowercaseMessage] });
    }

    // If not found, send request to Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "Server error: Missing API key." }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: `Summarize in 2-3 sentences:\n\n${message}` }] 
          }],
          generationConfig: {
            temperature: 0.7,  // Controls randomness (0 = deterministic, 1 = most random)
            maxOutputTokens: 60,  // Limit response length to avoid long paragraphs
            topP: 0.9
          }
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ reply: "Sorry, something went wrong." }, { status: 500 });
  }
}
