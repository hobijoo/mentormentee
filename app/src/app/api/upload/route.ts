import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { BINGO_ITEMS, calculateLines, getLineBonus } from '@/lib/constants';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

async function saveFile(file: File, userId: number, itemId: number, suffix: string) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${userId}-${itemId}-${suffix}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);
    return `/api/file/${filename}`;
}

export async function POST(req: Request) {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const itemId = parseInt(formData.get('itemId') as string, 10);
        const optionsStr = formData.get('options') as string || '[]';
        let selectedOptions: string[] = [];
        try { selectedOptions = JSON.parse(optionsStr); } catch (e) { }

        if (isNaN(itemId)) {
            return NextResponse.json({ success: false, message: 'Invalid format' }, { status: 400 });
        }

        const bingoItem = BINGO_ITEMS.find((b) => b.id === itemId);
        if (!bingoItem) {
            return NextResponse.json({ success: false, message: 'Invalid item id' }, { status: 400 });
        }

        // Get existing row
        const stmtSelect = db.prepare('SELECT * FROM uploads WHERE user_id = ? AND item_index = ?');
        const existingRow = stmtSelect.get(user.userId, itemId) as any;

        let photoUrl = existingRow ? existingRow.photo_url : null;
        const baseFile = formData.get('file') as File | null;
        if (baseFile && baseFile.size > 0) {
            photoUrl = await saveFile(baseFile, user.userId, itemId, 'base');
        }

        if (!photoUrl) {
            return NextResponse.json({ success: false, message: '기본 사진이 필요합니다.' }, { status: 400 });
        }

        let existingOptions: { id: string, photoUrl: string }[] = [];
        if (existingRow && existingRow.options) {
            try {
                const parsed = JSON.parse(existingRow.options);
                // Handle backwards compatibility if it was array of strings
                existingOptions = parsed.map((o: any) => typeof o === 'string' ? { id: o, photoUrl: '' } : o);
            } catch (e) { }
        }

        let finalOptions = [...existingOptions];
        let totalScoreForItem = bingoItem.score;

        for (const optId of selectedOptions) {
            const alreadyExists = finalOptions.find(o => o.id === optId);
            const optInfo = bingoItem.options?.find(o => o.id === optId);

            if (!alreadyExists) {
                const optFile = formData.get(`file_opt_${optId}`) as File | null;
                if (optFile && optFile.size > 0 && optInfo) {
                    const optPhotoUrl = await saveFile(optFile, user.userId, itemId, optId);
                    finalOptions.push({ id: optId, photoUrl: optPhotoUrl });
                    totalScoreForItem += optInfo.score;
                }
            } else if (optInfo) {
                totalScoreForItem += optInfo.score;
            }
        }

        // Add back scores of options that were previously submitted but not in selectedOptions this time
        // Wait, the client should send all selectedOptions including previously completed ones.
        // Let's just calculate score based on finalOptions
        totalScoreForItem = bingoItem.score;
        for (const o of finalOptions) {
            const optInfo = bingoItem.options?.find(oi => oi.id === o.id);
            if (optInfo) totalScoreForItem += optInfo.score;
        }

        const stmt = db.prepare(`
            INSERT INTO uploads (user_id, item_index, photo_url, score_awarded, options) 
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, item_index) DO UPDATE SET 
            photo_url=excluded.photo_url, 
            score_awarded=excluded.score_awarded,
            options=excluded.options
        `);
        stmt.run(user.userId, itemId, photoUrl, totalScoreForItem, JSON.stringify(finalOptions));

        // Get new total score
        const scoreStmt = db.prepare('SELECT item_index, photo_url, score_awarded, options FROM uploads WHERE user_id = ?');
        const userUploads = scoreStmt.all(user.userId) as any[];

        let totalScore = 0;
        const uploadsMap: any = {};
        for (const row of userUploads) {
            totalScore += row.score_awarded || 0;
            uploadsMap[row.item_index] = true;
        }

        const lines = calculateLines(uploadsMap);
        totalScore += getLineBonus(lines);

        return NextResponse.json({
            success: true,
            photoUrl,
            options: finalOptions,
            scoreAwarded: totalScoreForItem,
            newScore: totalScore
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
