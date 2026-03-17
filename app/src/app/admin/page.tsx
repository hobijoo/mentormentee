import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BINGO_ITEMS, calculateLines, getLineBonus } from '@/lib/constants';
import DeleteButton from './DeleteButton';
import type { BingoUploadsMap, StoredOption, StoredUploadRow } from '@/lib/types';
import RetroHeader from '../RetroHeader';

export default async function AdminDashboard() {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
        redirect('/');
    }

    const usersStmt = db.prepare("SELECT id, username FROM users WHERE role = 'user' ORDER BY id ASC");
    const teams = usersStmt.all() as { id: number, username: string }[];

    const uploadsStmt = db.prepare('SELECT user_id, item_index, photo_url, score_awarded, options FROM uploads');
    const allUploads = uploadsStmt.all() as StoredUploadRow[];

    const teamData = teams.map(team => {
        const teamUploads = allUploads.filter(u => u.user_id === team.id);

        let totalScore = 0;
        const uploadsMap: BingoUploadsMap = {};

        teamUploads.forEach(u => {
            totalScore += u.score_awarded || 0;
            uploadsMap[u.item_index] = true;
        });

        const lines = calculateLines(uploadsMap);
        totalScore += getLineBonus(lines);

        return { ...team, uploads: teamUploads, lines, totalScore };
    });

    teamData.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.lines - a.lines;
    });

    const totalTeams = teamData.length;
    const totalUploads = allUploads.length;
    const totalLines = teamData.reduce((sum, team) => sum + team.lines, 0);
    const averageScore = totalTeams > 0 ? Math.round(teamData.reduce((sum, team) => sum + team.totalScore, 0) / totalTeams) : 0;
    const topTeam = teamData[0];

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #213989 0%, #1a2d6d 100%)', color: '#333', fontFamily: '"SUITE", sans-serif' }}>
            <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '24px 18px 40px' }}>
                <div
                    style={{
                        padding: '22px',
                        borderRadius: '30px',
                        background: '#f4efe6',
                        color: '#213989',
                        boxShadow: '0 24px 40px rgba(8, 16, 52, 0.24)',
                        border: '3px solid #213989',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', inset: '10px', border: '2px solid rgba(33, 57, 137, 0.74)', borderRadius: '20px', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                            <RetroHeader
                                compact
                                eyebrow="ADMIN CONSOLE"
                                title="관리자 대시보드"
                                subtitle="TEAM SCORE · BINGO LINE · MISSION REVIEW"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {topTeam && (
                                <div style={{ padding: '10px 14px', borderRadius: '18px', backgroundColor: '#e8f5f3', minWidth: '140px', border: '2px solid #213989' }}>
                                    <div style={{ fontSize: '11px', opacity: 0.72, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Team</div>
                                    <strong style={{ display: 'block', marginTop: '4px', fontSize: '17px' }}>{topTeam.username}</strong>
                                    <span style={{ fontSize: '13px', opacity: 0.86 }}>{topTeam.totalScore}점</span>
                                </div>
                            )}
                            <a href="/api/logout" title="로그아웃" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', backgroundColor: '#213989', borderRadius: '50%', boxShadow: '0 8px 0 rgba(12,25,78,0.2)' }}>
                                <img src="/arrow.right.to.line.compact.svg" alt="로그아웃" style={{ width: '22px', height: '22px', filter: 'invert(1) brightness(100)' }} />
                            </a>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                    {[
                        { label: '총 팀 수', value: `${totalTeams}팀`, color: '#f4efe6' },
                        { label: '총 인증 수', value: `${totalUploads}개`, color: '#f4efe6' },
                        { label: '총 빙고 라인', value: `${totalLines}줄`, color: '#f4efe6' },
                        { label: '평균 점수', value: `${averageScore}점`, color: '#f4efe6' },
                    ].map((card) => (
                        <div key={card.label} style={{ padding: '18px', borderRadius: '22px', backgroundColor: card.color, boxShadow: '0 10px 24px rgba(8, 16, 52, 0.12)', border: '2px solid #213989' }}>
                            <div style={{ fontSize: '12px', color: '#667090', fontWeight: 800 }}>{card.label}</div>
                            <strong style={{ display: 'block', marginTop: '8px', fontSize: '28px', color: '#213989', letterSpacing: '-0.02em' }}>{card.value}</strong>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {teamData.map((team, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                        const accent = index === 0 ? '#f3c54b' : index === 1 ? '#b9c2d7' : index === 2 ? '#df9b5c' : '#20317E';
                        const completedCount = team.uploads.length;

                        return (
                            <div
                                key={team.id}
                                style={{
                                    padding: '20px',
                                    backgroundColor: '#f4efe6',
                                    borderRadius: '24px',
                                    boxShadow: '0 14px 30px rgba(8, 16, 52, 0.14)',
                                    border: '2px solid #213989'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                        <div
                                            style={{
                                                width: '52px',
                                                height: '52px',
                                                borderRadius: '18px',
                                                background: index < 3 ? `linear-gradient(180deg, ${accent}, #f4efe6)` : '#213989',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '22px',
                                                fontWeight: 900,
                                                color: index < 3 ? '#4d3b06' : '#f4efe6',
                                                boxShadow: 'inset 0 -4px 0 rgba(255,255,255,0.28)'
                                            }}
                                        >
                                            {medal}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#1c1c1e', letterSpacing: '-0.03em' }}>{team.username}</div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: '#213989', color: '#f4efe6', fontSize: '12px', fontWeight: 800 }}>총점 {team.totalScore}점</span>
                                                <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: '#dff4ef', color: '#16634a', fontSize: '12px', fontWeight: 800 }}>빙고 {team.lines}줄</span>
                                                <span style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: '#dce7ff', color: '#213989', fontSize: '12px', fontWeight: 800 }}>인증 {completedCount}개</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ minWidth: '180px', flex: '0 0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', alignSelf: 'stretch' }}>
                                        <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: '#fbf7f0', border: '1.5px solid rgba(33,57,137,0.18)' }}>
                                            <div style={{ fontSize: '11px', color: '#7b839d', fontWeight: 800 }}>RANK</div>
                                            <strong style={{ display: 'block', marginTop: '5px', fontSize: '18px', color: '#213989' }}>{index + 1}위</strong>
                                        </div>
                                        <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: '#fbf7f0', border: '1.5px solid rgba(33,57,137,0.18)' }}>
                                            <div style={{ fontSize: '11px', color: '#7b839d', fontWeight: 800 }}>PROGRESS</div>
                                            <strong style={{ display: 'block', marginTop: '5px', fontSize: '18px', color: '#213989' }}>{Math.round((completedCount / BINGO_ITEMS.length) * 100)}%</strong>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {team.uploads.length === 0 && (
                                        <div style={{ padding: '18px', borderRadius: '18px', backgroundColor: '#f7f8fc', color: '#6e7690', fontWeight: 700 }}>
                                            아직 제출된 인증이 없습니다.
                                        </div>
                                    )}

                                    {team.uploads.map((u) => {
                                        const bingoItem = BINGO_ITEMS.find((b) => b.id === u.item_index);
                                        let opts: StoredOption[] = [];
                                        try {
                                            const parsed = JSON.parse(u.options || '[]');
                                            opts = (Array.isArray(parsed) ? parsed : []).map((o: unknown) => {
                                                const option = typeof o === 'object' && o !== null ? o as Partial<StoredOption> : {};
                                                return {
                                                    id: typeof o === 'string' ? o : option.id || '',
                                                    photoUrl: option.photoUrl ? option.photoUrl.replace('/uploads/', '/api/file/') : ''
                                                };
                                            }).filter(option => option.id);
                                        } catch { }

                                        const mainPhotoUrl = u.photo_url ? u.photo_url.replace('/uploads/', '/api/file/') : '';

                                        return (
                                            <div key={u.item_index} style={{ border: '2px solid rgba(33,57,137,0.16)', borderRadius: '20px', backgroundColor: '#fbf7f0', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '14px', borderBottom: opts.length > 0 ? '1px solid rgba(33,57,137,0.12)' : 'none' }}>
                                                    <div
                                                        style={{
                                                            width: '68px',
                                                            height: '68px',
                                                            backgroundImage: `url(${mainPhotoUrl})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            borderRadius: '16px',
                                                            border: '1px solid #e5e5ea',
                                                            flexShrink: 0,
                                                            boxShadow: '0 6px 0 rgba(33,57,137,0.08)'
                                                        }}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '17px', fontWeight: 900, color: '#1c1c1e', lineHeight: 1.35 }}>
                                                            <span dangerouslySetInnerHTML={{ __html: bingoItem?.text.replace(/<br>/g, ' ') || `아이템 ${u.item_index}` }} />
                                                        </div>
                                                        <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '12px', color: '#f4efe6', fontWeight: 800, backgroundColor: '#213989', padding: '6px 10px', borderRadius: '999px' }}>
                                                                기본 성공 +{bingoItem?.score || u.score_awarded}점
                                                            </span>
                                                            {opts.length > 0 && (
                                                                <span style={{ fontSize: '12px', color: '#173467', fontWeight: 800, backgroundColor: '#dff4ef', padding: '6px 10px', borderRadius: '999px' }}>
                                                                    보너스 {opts.length}개
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ flexShrink: 0 }}>
                                                        <DeleteButton userId={team.id} itemId={u.item_index} isOption={false} />
                                                    </div>
                                                </div>

                                                {opts.length > 0 && bingoItem && bingoItem.options && (
                                                    <div style={{ padding: '0 16px 14px 98px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {opts.map((optObj) => {
                                                            const oInfo = bingoItem.options?.find((o) => o.id === optObj.id);
                                                            return (
                                                                <div key={optObj.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '14px', backgroundColor: '#fff', border: '1px solid rgba(33,57,137,0.14)' }}>
                                                                    {optObj.photoUrl ? (
                                                                        <div
                                                                            style={{
                                                                                width: '42px',
                                                                                height: '42px',
                                                                                backgroundImage: `url(${optObj.photoUrl})`,
                                                                                backgroundSize: 'cover',
                                                                                backgroundPosition: 'center',
                                                                                borderRadius: '10px',
                                                                                border: '1px solid #e5e5ea',
                                                                                flexShrink: 0
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div style={{ width: '42px', height: '42px', backgroundColor: '#f2f2f7', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e93', fontSize: '10px', fontWeight: 800 }}>
                                                                            NO IMG
                                                                        </div>
                                                                    )}
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {oInfo ? oInfo.label : optObj.id}
                                                                        </div>
                                                                        <div style={{ fontSize: '12px', color: '#8e8e93', fontWeight: 700, marginTop: '2px' }}>
                                                                            추가 보너스 +{oInfo?.score || 0}점
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ flexShrink: 0 }}>
                                                                        <DeleteButton userId={team.id} itemId={u.item_index} optionId={optObj.id} isOption={true} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
