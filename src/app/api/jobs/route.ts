import { NextResponse } from "next/server";


export async function GET() {
  const apiKey = process.env.VAST_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  const response = await fetch(`https://vast.ai/api/v0/instances?api_key=${apiKey}`);
  const text = await response.text();
  console.log("Response status:", response.status);
  console.log("Response text:", text.slice(0, 200));

  try {
    const data = JSON.parse(text);

    
    const shouldUseMock = process.env.NODE_ENV === "development" || (data.instances ?? []).length === 0;

    if (shouldUseMock) {
      const mockInstances = [
        {
          id: 1001,
          gpu_name: "A100",
          geolocation: "us-west",
          dph_total: 1.2,
          cur_state: "running",
          duration: 3600,
          start_date: Math.floor(Date.now() / 1000) - 3600,
        },
        {
          id: 1002,
          gpu_name: "RTX 4090",
          geolocation: "us-east",
          dph_total: 0.9,
          cur_state: "running",
          duration: 2400,
          start_date: Math.floor(Date.now() / 1000) - 2400,
        },
        {
          id: 1003,
          gpu_name: "T4",
          geolocation: "eu-central",
          dph_total: 0.4,
          cur_state: "completed",
          duration: 7200,
          start_date: Math.floor(Date.now() / 1000) - 7200,
        },
        {
          id: 1004,
          gpu_name: "A100",
          geolocation: "us-west",
          dph_total: 1.1,
          cur_state: "running",
          duration: 4800,
          start_date: Math.floor(Date.now() / 1000) - 4800,
        },
        {
          id: 1005,
          gpu_name: "RTX 3090",
          geolocation: "us-east",
          dph_total: 0.7,
          cur_state: "queued",
          duration: 0,
          start_date: Math.floor(Date.now() / 1000),
        },
      ]

      return NextResponse.json({ instances: mockInstances });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse JSON", preview: text.slice(0, 200) }, { status: 500 });
  }
}
