export interface BingoOption {
    id: string;
    label: string;
    score: number;
}

export interface BingoItem {
    id: number;
    text: string;
    score: number;
    description?: string;
    options?: BingoOption[];
}

export const BINGO_ITEMS: BingoItem[] = [
    {
        id: 0,
        text: '바다<br>놀이공원<br>동물원 가기',
        score: 300,
        description: '팀원 4명 이상이 모여서 바다 또는 놀이공원 또는 동물원 방문하고 인증샷 남기기',
        options: [
            { id: '추가1', label: '장소 추가 1곳', score: 200 },
            { id: '추가2', label: '장소 추가 2곳', score: 200 }
        ]
    },
    {
        id: 1,
        text: '술집 가기',
        score: 50,
        description: '팀원 4명 이상이 모여서 식사하면서 술병이 포함된 인증샷 남기기',
        options: [
            { id: '의리주', label: '의리주 병샷 인증', score: 100 },
            { id: '볼링핀3', label: '볼링핀 3줄 세우기', score: 100 },
            { id: '볼링핀4', label: '볼링핀 4줄 세우기 (+200)', score: 300 },
            { id: '볼링핀5', label: '볼링핀 5줄 세우기 (+200)', score: 500 }
        ]
    },
    {
        id: 2,
        text: '인스타<br>맞팔하기',
        score: 30,
        description: '팀원 전원 서로 인스타 맞팔하기. 이 미션 제외 다른 미션 할 때 팀원 전원 태그해서 스토리 업로드하기'
    },
    {
        id: 3,
        text: '노래방 or<br>방탈출',
        score: 100,
        description: '팀원 6명 이상이 모여서 노래방이나 방탈출카페 가서 활동하고 인증샷 남기기',
        options: [
            { id: '둘다', label: '둘 다 함', score: 100 },
            { id: '듀엣곡', label: '선배 후배 듀엣곡', score: 200 },
            { id: '방탈출성공', label: '방탈출 성공', score: 100 }
        ]
    },
    {
        id: 4,
        text: '보겜카<br>가기',
        score: 70,
        description: '팀원 6명 이상이 모여서 보드게임 카페에서 게임하고, 인증샷 남기기'
    },
    {
        id: 5,
        text: '서울대<br>행사 참가',
        score: 100,
        description: '팀원 4명 이상 모여서 서울대 축제 부스, 만우절 부스, 공림픽 부스 중 하나 방문하고 인증샷 남기기',
        options: [
            { id: '행사추가1', label: '서울대 축제 부스/만우절 부스/공림픽 1 추가', score: 100 },
            { id: '행사추가2', label: '서울대 축제 부스/만우절 부스/공림픽 2 추가', score: 100 }
        ]
    },
    {
        id: 6,
        text: '다같이<br>학식',
        score: 50,
        description: '팀원 4명 이상 모여서 학교 내 식당에서 식사하고, 인증샷 남기기'
    },
    {
        id: 7,
        text: '관악산<br>등산',
        score: 300,
        description: '팀원 4명 이상이 모여서 관악산 등산하고 관악산 정상에서 인증샷 남기기',
        options: [
            { id: '정상', label: '1시간 30분만에 산 정상 도달', score: 150 }
        ]
    },
    {
        id: 8,
        text: '<div style="font-size:22px;">릴스 찍기</div>',
        score: 400,
        description: '팀원 4명 이상이 출연하는 릴스 찍고 짝선짝후 계정 태그해서 업로드하기'
    },
    {
        id: 9,
        text: '버들골·한강<br>피크닉',
        score: 200,
        description: '버들골, 잔디광장, 한강 중 원하는 장소에서 팀원 4명 이상 모여서 피크닉 후 인증샷 남기기'
    },
    {
        id: 10,
        text: '네컷 찍고<br>과방 게시',
        score: 50,
        description: '팀원 6명 이상이 모여서 인생네컷 찍고 과방에 있는 인생네컷 게시판에 붙이고 인증샷 남기기'
    },
    {
        id: 11,
        text: '밥약&<br>보은',
        score: 150,
        description: '팀원 6명 이상이 모여서 밥약하고, 밥약 보은까지 둘 다 하고 인증샷 남기기'
    },
    {
        id: 12,
        text: '다른 조와<br>같이 밥',
        score: 100,
        description: '다른 조 4명, 우리 조 4명 이상 모여서 밥 먹고 인증샷 남기기'
    },
    {
        id: 13,
        text: '도서관 or<br>카공',
        score: 60,
        description: '관정 또는 중앙도서관에 팀원 4명 이상 모여서 공부하고 인증샷 남기기'
    },
    {
        id: 14,
        text: '스포츠<br>경기 직관',
        score: 300,
        description: '팀원 4명 이상이 모여서 스포츠 경기(야구, 축구, 배구, 농구 등) 관람하고 인증샷 남기기'
    },
    {
        id: 15,
        text: '302동<br>가기',
        score: 150,
        description: '팀원 6명 이상이 모여서 남산타워 또는 63빌딩이 보이게 사진 찍고 인증샷 남기기'
    }
];

export function calculateLines(uploads: Record<number, unknown>): number {
    const grid = Array(16).fill(false);
    for (const key in uploads) {
        if (uploads[key]) grid[Number(key)] = true;
    }

    const lines = [
        [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], // horizontal
        [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], // vertical
        [0, 5, 10, 15], [3, 6, 9, 12] // diagonal
    ];

    let lineCount = 0;
    for (const line of lines) {
        if (line.every(idx => grid[idx])) {
            lineCount++;
        }
    }
    return lineCount;
}

export function getLineBonus(lineCount: number): number {
    // 모든 달성한 빙고 1줄 당 200점씩
    return lineCount * 200;
}
