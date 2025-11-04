import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const digits = formData.get('Digits') as string;
    const callSid = formData.get('CallSid') as string;
    
    console.log(`Call ${callSid} responded with digits: ${digits}`);

    let twiml: string;

    if (digits === '1') {
      // Candidate said yes, continue with interview
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Great! Let's begin with a few questions.</Say>
  <Pause length="1"/>
  <Say voice="alice">Can you tell me about yourself and your background?</Say>
  <Pause length="3"/>
  <Say voice="alice">What interests you about this position?</Say>
  <Pause length="3"/>
  <Say voice="alice">What are your key strengths and skills?</Say>
  <Pause length="3"/>
  <Say voice="alice">Do you have any questions about the role or company?</Say>
  <Pause length="3"/>
  <Say voice="alice">What is your availability for the next steps?</Say>
  <Pause length="3"/>
  <Say voice="alice">Thank you for your time! We     will be in touch soon. Goodbye.</Say>
</Response>`;
    } else if (digits === '2') {
      // Candidate said no
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">No problem. Please call back when you have time for the interview. Thank you and goodbye.</Say>
</Response>`;
    } else {
      // No response or invalid response
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I didn't understand your response. Please call back when you're available. Goodbye.</Say>
</Response>`;
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error("Error handling call response:", error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was a technical issue. Please call back later. Goodbye.</Say>
</Response>`;

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}
