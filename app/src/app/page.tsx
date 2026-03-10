import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BingoBoard from './BingoBoard';
import { calculateLines, getLineBonus } from '@/lib/constants';

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role === 'admin') {
    redirect('/admin');
  }

  const stmt = db.prepare('SELECT item_index, photo_url, score_awarded, options FROM uploads WHERE user_id = ?');
  const userUploads = stmt.all(user.userId) as { item_index: number, photo_url: string, score_awarded: number, options: string }[];

  let initialScore = 0;
  const initialUploads: Record<number, { photoUrl: string, options: { id: string, photoUrl: string }[], scoreAwarded: number }> = {};
  const uploadsMap: any = {};

  for (const row of userUploads) {
    initialScore += row.score_awarded || 0;
    let opt = [];
    try {
      const parsed = JSON.parse(row.options || '[]');
      opt = parsed.map((o: any) => typeof o === 'string' ? { id: o, photoUrl: '' } : o);
    } catch (e) { }

    initialUploads[row.item_index] = {
      photoUrl: row.photo_url,
      options: opt,
      scoreAwarded: row.score_awarded
    };
    uploadsMap[row.item_index] = true;
  }

  let lines = 0;
  try { lines = calculateLines(uploadsMap); } catch (e) { }
  initialScore += getLineBonus(lines);

  const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
  const userDetails = userStmt.get(user.userId) as { username: string };

  return (
    <BingoBoard
      initialScore={initialScore}
      initialUploads={initialUploads}
      user={userDetails}
    />
  );
}
