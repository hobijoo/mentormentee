'use client';

import { useState, useRef, useEffect } from 'react';

function AutoFitText({ html }: { html: string }) {
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = textRef.current;
        if (!el || !el.parentElement) return;

        // Reset to original before measuring again in case of resize
        el.style.fontSize = '18px';

        const parent = el.parentElement;
        // Assume padding is 10px around, so subtract 20px from dimensions
        const pWidth = parent.clientWidth - 20;
        const pHeight = parent.clientHeight - 20;

        let fontSize = 18;
        while ((el.scrollHeight > pHeight || el.scrollWidth > pWidth) && fontSize > 10) {
            fontSize--;
            el.style.fontSize = `${fontSize}px`;
        }
    }, [html]);

    return (
        <span
            ref={textRef}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
                display: 'inline-block',
                wordBreak: 'keep-all',
                lineHeight: '1.2',
                fontSize: '18px',
                textAlign: 'center'
            }}
        />
    );
}
import { BINGO_ITEMS, calculateLines, getLineBonus } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export interface OptionData {
    id: string;
    photoUrl: string;
}

export interface UploadData {
    photoUrl: string;
    options: OptionData[];
    scoreAwarded: number;
}

export default function BingoBoard({ initialScore, initialUploads, user }: any) {
    const [score, setScore] = useState(initialScore);
    const [uploads, setUploads] = useState<Record<number, UploadData>>(initialUploads);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    // Upload Modal State
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [optionFiles, setOptionFiles] = useState<Record<string, File>>({});

    // History Modal State
    const [showHistory, setShowHistory] = useState(false);

    // Bingo Animation State
    const [showBingoAnimation, setShowBingoAnimation] = useState<number>(0);

    const uData = selectedItemId !== null ? uploads[selectedItemId] : null;

    const handleItemClick = (id: number) => {
        const itemInfo = BINGO_ITEMS.find(i => i.id === id);
        const existingData = uploads[id];

        if (existingData && itemInfo && (!itemInfo.options || existingData.options.length >= itemInfo.options.length)) {
            return;
        }

        setSelectedItemId(id);
        setSelectedFile(null);
        setSelectedOptions(existingData ? existingData.options.map(o => o.id) : []);
        setOptionFiles({});
    };

    const toggleOption = (optId: string, isMutuallyExclusiveGroup: boolean = false, groupOptIds: string[] = []) => {
        setSelectedOptions(prev => {
            let next = [...prev];

            // If toggling off
            if (next.includes(optId)) {
                next = next.filter(o => o !== optId);
            } else {
                // If toggling on, check if it's mutually exclusive with others (e.g. 볼링핀 3줄, 4줄, 5줄)
                if (isMutuallyExclusiveGroup) {
                    next = next.filter(o => !groupOptIds.includes(o)); // remove other group items
                }
                next.push(optId);
            }
            return next;
        });

        // Clear file when unchecked, or when mutually exclusive options are removed
        setOptionFiles(prev => {
            const next = { ...prev };
            if (isMutuallyExclusiveGroup) {
                groupOptIds.forEach(id => {
                    if (id !== optId) delete next[id];
                });
            }
            // For the specific one being toggled
            if (prev[optId]) {
                delete next[optId]; // remove file if unchecked, or reset
            }
            return next;
        });
    };

    const handleOptionFileChange = (optId: string, file: File | null) => {
        if (file) {
            setOptionFiles(prev => ({ ...prev, [optId]: file }));
        } else {
            setOptionFiles(prev => {
                const next = { ...prev };
                delete next[optId];
                return next;
            });
        }
    };

    const canSubmit = () => {
        if (!uData && !selectedFile) return false;
        const existingOptIds = uData ? uData.options.map(o => o.id) : [];
        for (const optId of selectedOptions) {
            if (!existingOptIds.includes(optId)) {
                if (!optionFiles[optId]) return false;
            }
        }
        return true;
    };

    const handleSubmitUpload = async () => {
        if (selectedItemId === null) return;
        setIsUploading(true);
        const formData = new FormData();
        if (selectedFile) formData.append('file', selectedFile);
        formData.append('itemId', selectedItemId.toString());
        formData.append('options', JSON.stringify(selectedOptions));

        for (const [optId, file] of Object.entries(optionFiles)) {
            formData.append(`file_opt_${optId}`, file);
        }

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                const nextUploads = {
                    ...uploads,
                    [selectedItemId]: {
                        photoUrl: data.photoUrl,
                        options: data.options,
                        scoreAwarded: data.scoreAwarded
                    }
                };

                const oldLines = calculateLines(uploads);
                const newLines = calculateLines(nextUploads);
                if (newLines > oldLines) {
                    // Show Bingo Animation
                    setShowBingoAnimation(newLines - oldLines);
                    setTimeout(() => setShowBingoAnimation(0), 3000);
                }

                setUploads(nextUploads);
                setScore(data.newScore);
                setSelectedItemId(null);
            } else {
                alert('업로드 실패: ' + data.message);
            }
        } catch (error) {
            console.error('Upload error', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const getScoreHistory = () => {
        const history = [];

        for (const [idStr, uDataEntry] of Object.entries(uploads)) {
            const id = Number(idStr);
            const item = BINGO_ITEMS.find(i => i.id === id);
            if (!item) continue;

            const baseScore = item.score;
            history.push({ label: item.text.replace(/<[^>]*>/g, ' '), score: baseScore });

            if (uDataEntry.options && item.options) {
                for (const o of uDataEntry.options) {
                    const opt = item.options.find(oi => oi.id === o.id);
                    if (opt) {
                        history.push({ label: `└── ${opt.label}`, score: opt.score });
                    }
                }
            }
        }

        const lines = calculateLines(uploads);
        const linesBonus = getLineBonus(lines);
        if (linesBonus > 0) {
            history.push({ label: `빙고 총 ${lines}줄 보너스 (줄당 200점)`, score: linesBonus });
        }

        return history;
    };

    const selectedItemInfo = BINGO_ITEMS.find(i => i.id === selectedItemId);

    // Group definition for mutually exclusive logic
    const bowlingOptions = ['볼링핀3', '볼링핀4', '볼링핀5'];

    return (
        <div style={{ position: 'fixed', top: 0, width: '100%', maxWidth: '430px', height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'none' }}>
            <div id="header" style={{ width: '100%', flexShrink: 0 }}>
                <img src="/top.png" alt="Header Banner" style={{ width: '100%', height: 'auto', display: 'block', transform: 'translateZ(0)' }} />
            </div>
            <div id="bingo" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)', boxSizing: 'border-box' }}>
                <div id="bingoHeader">
                    <div id="bingoMole"></div>
                    <div
                        id="bingoScore"
                        className="holtwood-one-sc-regular"
                        onClick={() => setShowHistory(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        {score}
                    </div>
                </div>
                <div id="bingoBoard">
                    {BINGO_ITEMS.map((item) => {
                        const existingData = uploads[item.id];
                        const hasPhoto = !!existingData;
                        const isMaxed = existingData && (!item.options || existingData.options.length >= item.options.length);
                        return (
                            <div
                                key={item.id}
                                className="bingoBoardItem"
                                onClick={() => handleItemClick(item.id)}
                                style={{
                                    cursor: isMaxed ? 'default' : 'pointer',
                                    backgroundImage: hasPhoto ? `url(${existingData.photoUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: hasPhoto ? 'transparent' : undefined,
                                    border: hasPhoto && !isMaxed ? '5px dashed #F1B329' : '5px solid white'
                                }}
                            >
                                {!hasPhoto && (
                                    <AutoFitText html={item.text} />
                                )}
                                {hasPhoto && !isMaxed && (
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px 5px', borderRadius: '5px', fontSize: '12px', color: 'black', fontWeight: 'bold' }}>
                                        보너스 추가 가능!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0 20px 0' }}>
                    <button
                        onClick={() => router.push('/api/logout')}
                        title={`로그아웃 (${user?.username})`}
                        style={{ width: '44px', height: '44px', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                    >
                        <img src="/arrow.right.to.line.compact.svg" alt="로그아웃" style={{ width: '100%', height: '100%', opacity: 0.8, filter: 'invert(1) brightness(100)' }} />
                    </button>
                </div>
            </div>

            {/* Upload Modal */}
            {selectedItemId !== null && selectedItemInfo && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000, boxSizing: 'border-box', backdropFilter: 'blur(2px)' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedItemId(null); }}>
                    <div style={{ touchAction: 'pan-y', backgroundColor: 'white', padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '90dvh', overflowY: 'auto', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ width: '40px', height: '5px', backgroundColor: '#e0e0e0', borderRadius: '3px', margin: '-10px auto 10px auto' }} />
                        <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#1B2A68' }} dangerouslySetInnerHTML={{ __html: selectedItemInfo.text.replace(/<br>/g, ' ') }} />
                        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>기본 점수: {selectedItemInfo.score}점</p>
                        {selectedItemInfo.description && (
                            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>설명: {selectedItemInfo.description}</p>
                        )}

                        {!uData && (
                            <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '12px', backgroundColor: '#fdfdfd', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <strong style={{ display: 'block', marginBottom: '8px', color: '#333' }}>기본 사진 (필수):</strong>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}
                        {uData && (
                            <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '12px', backgroundColor: '#f0f4f8', color: '#20317E', textAlign: 'center' }}>
                                <strong>✓ 기본 사진 인증 완료</strong>
                            </div>
                        )}

                        {selectedItemInfo.options && selectedItemInfo.options.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fafafa', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                <strong style={{ color: '#F1B329' }}>🔥 추가 보너스 미션 (체크 시 사진 필수)</strong>
                                {selectedItemInfo.options.map(opt => {
                                    const isAlreadyDone = uData && uData.options.find(o => o.id === opt.id);
                                    const isChecked = selectedOptions.includes(opt.id);
                                    let isOptionDisabled = !!isAlreadyDone;

                                    const isBowlingGroup = bowlingOptions.includes(opt.id);

                                    return (
                                        <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isOptionDisabled ? '#aaa' : 'black' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => toggleOption(opt.id, isBowlingGroup, bowlingOptions)}
                                                    disabled={isOptionDisabled}
                                                />
                                                {opt.label} (+{opt.score}점)
                                                {isAlreadyDone && ' ✓'}
                                            </label>

                                            {isChecked && !isAlreadyDone && (
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleOptionFileChange(opt.id, e.target.files?.[0] || null)}
                                                    style={{ width: '100%', marginLeft: '20px' }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingBottom: '10px' }}>
                            <button
                                onClick={handleSubmitUpload}
                                disabled={!canSubmit() || isUploading}
                                style={{ flex: 1, padding: '16px', backgroundColor: '#20317E', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', opacity: (!canSubmit() || isUploading) ? 0.5 : 1, transition: '0.2s' }}
                            >
                                {isUploading ? '업로드 중...' : '확인'}
                            </button>
                            <button
                                onClick={() => setSelectedItemId(null)}
                                style={{ flex: 1, padding: '16px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px' }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Score History Modal */}
            {showHistory && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000, boxSizing: 'border-box', backdropFilter: 'blur(2px)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowHistory(false); }}>
                    <div style={{ touchAction: 'pan-y', backgroundColor: 'white', padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '90dvh', overflowY: 'auto', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ width: '40px', height: '5px', backgroundColor: '#e0e0e0', borderRadius: '3px', margin: '-10px auto 10px auto' }} />
                        <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#1B2A68' }}>점수 내역</h2>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {getScoreHistory().map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                                    <span style={{ color: item.label.includes('└──') ? '#666' : 'black' }}>
                                        {item.label}
                                    </span>
                                    <span style={{ fontWeight: 'bold', color: '#20317E', whiteSpace: 'nowrap' }}>
                                        +{item.score}점
                                    </span>
                                </div>
                            ))}
                            {getScoreHistory().length === 0 && (
                                <p style={{ textAlign: 'center', color: '#888' }}>내역이 없습니다.</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', borderTop: '2px dashed #ccc', paddingTop: '15px', fontSize: '18px', fontWeight: '900', color: '#1B2A68' }}>
                            <span>총점</span>
                            <span style={{ color: '#F1B329' }}>{score}점</span>
                        </div>

                        <button
                            onClick={() => setShowHistory(false)}
                            style={{ padding: '16px', backgroundColor: '#20317E', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', marginTop: '15px', paddingBottom: '16px' }}
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* Bingo Completion Animation Overlay */}
            {showBingoAnimation > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                    pointerEvents: 'none', zIndex: 9999, display: 'flex',
                    justifyContent: 'center', alignItems: 'center',
                    flexDirection: 'column',
                    animation: 'bingoFadeIn 0.3s ease-out, bingoFadeOut 1s ease-in 2s forwards'
                }}>
                    <style>{`
                        @keyframes bingoFadeIn {
                            from { opacity: 0; transform: scale(0.5); }
                            to { opacity: 1; transform: scale(1); }
                        }
                        @keyframes bingoFadeOut {
                            from { opacity: 1; }
                            to { opacity: 0; }
                        }
                        @keyframes pulseBingo {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                            100% { transform: scale(1); }
                        }
                    `}</style>
                    <div style={{
                        fontSize: '50px', fontWeight: '900', color: '#F1B329',
                        textShadow: '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 5px 5px 10px rgba(0,0,0,0.5)',
                        animation: 'pulseBingo 0.5s infinite',
                        textAlign: 'center'
                    }}>
                        🎉 BINGO! 🎉
                    </div>
                    <div style={{
                        marginTop: '10px', fontSize: '24px', fontWeight: 'bold', color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)', textAlign: 'center'
                    }}>
                        {showBingoAnimation}줄 달성!
                        <br />(+{showBingoAnimation * 200}점 추가)
                    </div>
                </div>
            )}
        </div>
    );
}
