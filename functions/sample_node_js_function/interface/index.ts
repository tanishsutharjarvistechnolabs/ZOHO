import catalyst from "zcatalyst-sdk-node";

export interface TodoRowData {
    Title: string;
    Description: string;
    Completed: boolean;
}

export interface TodoUpdateData {
    ROWID: string | number;
    Title?: string;
    Description?: string;
    Completed?: boolean;
    IsDeleted?: boolean;
}

export interface AuthenticatedRequest extends Request {
    catalystApp?: ReturnType<typeof catalyst.initialize>;
    catalystUser?: unknown;
}

