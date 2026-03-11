import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
    try {
        const { filename } = await params;
        if (!filename) {
            return new NextResponse('Not found', { status: 404 });
        }

        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

        if (!existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const buffer = await fs.readFile(filePath);

        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.gif') contentType = 'image/gif';
        if (ext === '.svg') contentType = 'image/svg+xml';
        if (ext === '.webp') contentType = 'image/webp';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (e) {
        console.error(e);
        return new NextResponse('Error loading image', { status: 500 });
    }
}
