export interface SessionUser {
    userId: number;
    role: string;
}

export interface UserDetails {
    username: string;
}

export interface StoredOption {
    id: string;
    photoUrl: string;
}

export interface StoredUploadRow {
    id?: number;
    user_id: number;
    item_index: number;
    photo_url: string;
    score_awarded: number;
    options: string;
}

export type BingoUploadsMap = Record<number, boolean>;
