import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FeedbackResult {
  clarityScore: number;
  pacingScore: number;
  engagementScore: number;
  suggestions: string;
}

interface AnalysisResult {
  interviewer: FeedbackResult;
  candidate: FeedbackResult;
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
  // Download the audio file
  const response = await fetch(audioUrl);
  const audioBuffer = await response.arrayBuffer();

  // Create a file-like object for OpenAI
  const file = new File([audioBuffer], "interview.mp4", { type: "audio/mp4" });

  // Transcribe using Whisper
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "text",
  });

  return transcription;
}

export async function analyzeInterview(
  transcript: string,
  interviewerName: string,
  candidateName: string
): Promise<AnalysisResult> {
  const prompt = `You are an interview coach analyzing a recorded interview transcript.

Participants:
- Interviewer (employer): ${interviewerName}
- Candidate (student): ${candidateName}

Transcript:
${transcript}

Analyze the communication quality of BOTH participants. For each person, provide:
1. Clarity score (1-10): How clear and understandable was their communication?
2. Pacing score (1-10): Was their speaking pace appropriate? Not too fast or slow?
3. Engagement score (1-10): Did they seem engaged, attentive, and enthusiastic?
4. 2-3 specific, actionable suggestions for improvement

Be constructive and encouraging. Focus on communication skills, not technical content.

Respond with ONLY valid JSON in this exact format:
{
  "interviewer": {
    "clarityScore": 8,
    "pacingScore": 7,
    "engagementScore": 9,
    "suggestions": "Your specific suggestions here..."
  },
  "candidate": {
    "clarityScore": 7,
    "pacingScore": 8,
    "engagementScore": 8,
    "suggestions": "Your specific suggestions here..."
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse the JSON response
  try {
    const result = JSON.parse(textContent.text) as AnalysisResult;
    return result;
  } catch {
    console.error("Failed to parse Claude response:", textContent.text);
    throw new Error("Failed to parse AI feedback");
  }
}
