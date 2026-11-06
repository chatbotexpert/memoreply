import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToGoogleDrive } from '@/lib/googleDrive';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * POST /api/upload/drive
 * Uploads heavy attachments, images, or documents to Google Drive.
 * Persists only the metadata and Google Drive URL reference into Supabase PostgreSQL.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let fileName = 'document.pdf';
    let mimeType = 'application/pdf';
    let buffer: Buffer;
    let userId = 'system';
    let conversationId: string | undefined;
    let clientId: string | undefined;
    let messageId: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file uploaded.' },
          { status: 400, headers: corsHeaders }
        );
      }

      fileName = file.name;
      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      userId = (formData.get('userId') as string) || userId;
      conversationId = (formData.get('conversationId') as string) || undefined;
      clientId = (formData.get('clientId') as string) || undefined;
      messageId = (formData.get('messageId') as string) || undefined;
    } else {
      // JSON Base64 Payload
      const body = await req.json();
      if (!body.base64Data) {
        return NextResponse.json(
          { success: false, error: 'Missing base64Data in payload.' },
          { status: 400, headers: corsHeaders }
        );
      }

      fileName = body.fileName || fileName;
      mimeType = body.mimeType || mimeType;
      userId = body.userId || userId;
      conversationId = body.conversationId;
      clientId = body.clientId;
      messageId = body.messageId;

      const base64Clean = body.base64Data.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(base64Clean, 'base64');
    }

    // 1. Upload to Google Drive (Zero binary storage in Supabase)
    const driveResult = await uploadFileToGoogleDrive({
      fileName,
      mimeType,
      buffer,
    });

    if (!driveResult.success) {
      return NextResponse.json(
        { success: false, error: driveResult.error || 'Google Drive upload failed.' },
        { status: 500, headers: corsHeaders }
      );
    }

    // 2. Persist ONLY the Google Drive URL reference in Supabase PostgreSQL
    let attachmentRecord = null;
    try {
      if (prisma) {
        attachmentRecord = await (prisma as any).fileAttachment.create({
          data: {
            userId,
            conversationId: conversationId || null,
            clientId: clientId || null,
            messageId: messageId || null,
            fileName: driveResult.fileName,
            fileSize: driveResult.fileSize,
            mimeType: driveResult.mimeType,
            driveFileId: driveResult.fileId,
            driveViewUrl: driveResult.driveViewUrl,
            driveDownloadUrl: driveResult.driveDownloadUrl || null,
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Memoreply Upload] FileAttachment DB write warning:', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'File uploaded to Google Drive. Secure reference saved in Supabase.',
        attachment: {
          id: attachmentRecord?.id || driveResult.fileId,
          fileName: driveResult.fileName,
          fileSize: driveResult.fileSize,
          mimeType: driveResult.mimeType,
          driveFileId: driveResult.fileId,
          driveViewUrl: driveResult.driveViewUrl,
          driveDownloadUrl: driveResult.driveDownloadUrl,
          isMock: driveResult.isMock,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Memoreply Drive Upload Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
