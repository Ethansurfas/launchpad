const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = "https://api.daily.co/v1";

if (!DAILY_API_KEY) {
  console.warn("Warning: DAILY_API_KEY is not set");
}

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    enable_recording?: string;
  };
}

export async function createDailyRoom(roomName: string): Promise<DailyRoom> {
  if (!DAILY_API_KEY) {
    throw new Error("DAILY_API_KEY is not configured");
  }

  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_recording: "cloud", // $0.003/min - requires card on Daily.co
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // Expires in 2 hours
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Daily.co API error:", error);
    throw new Error(error.info || `Failed to create Daily room: ${response.status}`);
  }

  return response.json();
}

export async function getDailyRoom(roomName: string): Promise<DailyRoom | null> {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to get Daily room");
  }

  return response.json();
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });
}

export async function getRecordings(roomName: string): Promise<any[]> {
  const response = await fetch(`${DAILY_API_URL}/recordings?room_name=${roomName}`, {
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get recordings");
  }

  const data = await response.json();
  return data.data || [];
}

export async function getRecordingAccessLink(recordingId: string): Promise<string> {
  const response = await fetch(`${DAILY_API_URL}/recordings/${recordingId}/access-link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get recording access link");
  }

  const data = await response.json();
  return data.download_link;
}
