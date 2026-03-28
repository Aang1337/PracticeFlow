import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    
    // Check if directory exists
    if (!fs.existsSync(videosDir)) {
      return NextResponse.json({ videos: [] });
    }

    // Read directory
    const files = fs.readdirSync(videosDir);
    
    // Filter out non-video files
    const validExtensions = ['.mp4', '.webm', '.mkv', '.mov', '.m4v'];
    const videos = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return validExtensions.includes(ext);
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error reading videos directory:', error);
    return NextResponse.json({ videos: [] }, { status: 500 });
  }
}
