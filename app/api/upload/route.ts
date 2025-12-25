import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  console.log("Upload API called");

  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session?.user?.id ? "Found" : "Not found");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized - please log in" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    console.log("File received:", file?.name, "Type:", type);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not allowed. Use PDF, Word, images, or text files.` }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Create unique filename
    const ext = file.name.split(".").pop();
    const filename = `${session.user.id}/${type}-${Date.now()}.${ext}`;
    console.log("Uploading to:", filename);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Upload to Supabase Storage
    console.log("Uploading to Supabase...");
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    console.log("Upload successful:", data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filename);

    console.log("Public URL:", urlData.publicUrl);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
