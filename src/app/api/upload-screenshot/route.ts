import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const captureJobId = formData.get('captureJobId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!captureJobId) {
      return NextResponse.json({ error: 'No capture job ID provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Create directory structure in Next.js public folder for custom uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'screenshots', captureJobId);
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const extension = path.extname(originalName) || '.png';
    const baseName = path.basename(originalName, extension);
    const filename = `custom_${timestamp}_${baseName}${extension}`;
    const filePath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the path structure for custom screenshots
    // This will be served from /uploads/screenshots/${captureJobId}/${filename}
    const relativePath = `uploads/screenshots/${captureJobId}/${filename}`;
    
    return NextResponse.json({
      success: true,
      filename,
      path: relativePath,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString(),
      url: `/${relativePath}` // This will be served by Next.js static files
    });

  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to upload screenshot' },
      { status: 500 }
    );
  }
}