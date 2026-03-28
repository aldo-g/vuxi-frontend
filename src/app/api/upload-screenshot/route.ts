import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const ext = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const filename = `custom_${timestamp}_${baseName}.${ext}`;
    const storagePath = `job_${captureJobId}/${filename}`;

    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from('screenshots')
      .upload(storagePath, Buffer.from(bytes), { contentType: file.type, upsert: true });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      filename,
      path: storagePath,
      storageUrl: publicUrl,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return NextResponse.json({ error: 'Failed to upload screenshot' }, { status: 500 });
  }
}
