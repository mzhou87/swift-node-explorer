import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_VAST_API_KEY;

  console.log("API KEY:", apiKey);

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

 
  const response = await fetch("https://vast.ai/api/v0/jobs/", {
    headers: {
      Authorization: `Bearer ${process.env.VAST_API_KEY}`,
    },
  });
  

  console.log("Response status:", response.status);

  const text = await response.text();
  console.log("Response text:", text); 
  
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse JSON", preview: text.slice(0, 200) },
      { status: 500 }
    );
  }
}
