/**
 * Centralized API client.
 *
 * Every HTTP call in the app goes through this file. If the base URL, cookie
 * credentials, or error-handling logic ever needs to change, there is exactly
 * one place to update.
 */

const API_BASE: string =
    import.meta.env.VITE_API_URL ?? "http://localhost:5500";

/* ─── payload / response types ─────────────────────────────────────────── */

export interface LoginPayload {
    email: string;
    password?: string;
    otp?: string;
}

export interface AuthResponse {
    user?: {
        _id: string;
        name: string;
        email: string;
        profilePic: string;
        isEmailVerified: boolean;
    };
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface UpdateProfilePayload {
    name?: string;
    about?: string;
    profilePic?: string;
    oldpassword?: string;
    newpassword?: string;
    emailNotificationsEnabled?: boolean;
}

export interface UploadImageResponse {
    imageUrl: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
}

export type NonFriendsSort = "name_asc" | "name_desc" | "last_seen_recent" | "last_seen_oldest";

export interface NonFriendsParams {
    search?: string;
    sort?: NonFriendsSort;
    page?: number;
    limit?: number;
}

/* ─── helpers ──────────────────────────────────────────────────────────── */

const headers = (extra: Record<string, string> = {}): Record<string, string> => ({
    "Content-Type": "application/json",
    ...extra,
});

const request = (input: RequestInfo | URL, init: RequestInit = {}) =>
    fetch(input, {
        ...init,
        credentials: "include",
        headers: headers(init.headers as Record<string, string> | undefined),
    });

const handleResponse = async <T = unknown>(res: Response): Promise<T> => {
    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
        ? await res.json() as T & { error?: string }
        : ({ error: await res.text() } as T & { error?: string });
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
};

const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ""))
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
    })

/* ─── auth ─────────────────────────────────────────────────────────────── */

export const authApi = {
    login: (payload: LoginPayload) =>
        request(`${API_BASE}/auth/login`, {
            method: "POST",
            body: JSON.stringify(payload),
        }).then((res) => handleResponse<AuthResponse>(res)),

    register: (payload: RegisterPayload) =>
        request(`${API_BASE}/auth/register`, {
            method: "POST",
            body: JSON.stringify(payload),
        }).then((res) => handleResponse<AuthResponse>(res)),

    getMe: <T = unknown>() =>
        request(`${API_BASE}/auth/me`).then((res) => handleResponse<T>(res)),

    logout: () =>
        request(`${API_BASE}/auth/logout`, {
            method: "POST",
        }).then(handleResponse),

    sendOtp: (email: string) =>
        request(`${API_BASE}/auth/getotp`, {
            method: "POST",
            body: JSON.stringify({ email }),
        }).then(handleResponse),

    sendVerificationOtp: () =>
        request(`${API_BASE}/auth/send-verification-otp`, {
            method: "POST",
        }).then(handleResponse),

    verifyEmail: (otp: string) =>
        request(`${API_BASE}/auth/verify-email`, {
            method: "POST",
            body: JSON.stringify({ otp }),
        }).then(handleResponse),
};

/* ─── conversations ────────────────────────────────────────────────────── */

export const conversationApi = {
    list: <T = unknown>() =>
        request(`${API_BASE}/conversation/`).then((res) => handleResponse<T>(res)),

    get: <T = unknown>(id: string) =>
        request(`${API_BASE}/conversation/${id}`).then((res) => handleResponse<T>(res)),

    create: (memberIds: string[]) =>
        request(`${API_BASE}/conversation/`, {
            method: "POST",
            body: JSON.stringify({ members: memberIds }),
        }).then(handleResponse),

    togglePin: (id: string) =>
        request(`${API_BASE}/conversation/${id}/pin`, {
            method: "POST",
        }).then((res) => handleResponse<{ isPinned: boolean }>(res)),
};

/* ─── messages ─────────────────────────────────────────────────────────── */

export const messageApi = {
    list: (conversationId: string, page: number = 1, limit: number = 50) =>
        request(`${API_BASE}/message/${conversationId}?page=${page}&limit=${limit}`).then(handleResponse),

    delete: (messageId: string, scope: "me" | "everyone") =>
        request(`${API_BASE}/message/${messageId}`, {
            method: "DELETE",
            body: JSON.stringify({ scope }),
        }).then(handleResponse),

    bulkDelete: (messageIds: string[]) =>
        request(`${API_BASE}/message/bulk/hide`, {
            method: "DELETE",
            body: JSON.stringify({ messageIds }),
        }).then(handleResponse),

    clearChat: (conversationId: string) =>
        request(`${API_BASE}/message/clear/${conversationId}`, {
            method: "POST",
        }).then(handleResponse),

    toggleStar: (messageId: string) =>
        request(`${API_BASE}/message/${messageId}/star`, {
            method: "POST",
        }).then((res) => handleResponse<{ isStarred: boolean; starredBy: string[] }>(res)),

    getStarred: <T = unknown>() =>
        request(`${API_BASE}/message/starred`).then((res) => handleResponse<T>(res)),
};

/* ─── users ────────────────────────────────────────────────────────────── */

export const userApi = {
    getOnlineStatus: (userId: string) =>
        request(`${API_BASE}/user/online-status/${userId}`).then(handleResponse),

    getNonFriends: (params: NonFriendsParams = {}) => {
        const qs = new URLSearchParams()
        if (params.search) qs.set("search", params.search)
        if (params.sort)   qs.set("sort",   params.sort)
        if (params.page)   qs.set("page",   String(params.page))
        if (params.limit)  qs.set("limit",  String(params.limit))
        return request(`${API_BASE}/user/non-friends?${qs.toString()}`).then(handleResponse)
    },

    updateProfile: (payload: UpdateProfilePayload) =>
        request(`${API_BASE}/user/update`, {
            method: "PUT",
            body: JSON.stringify(payload),
        }).then(handleResponse),

    uploadImage: async (file: File, folder = "chatloop") =>
        request(`${API_BASE}/user/upload-image`, {
            method: "POST",
            body: JSON.stringify({
                image: await fileToDataUrl(file),
                filename: file.name,
                folder,
            }),
        }).then((res) => handleResponse<UploadImageResponse>(res)),

    blockUser: (userId: string) =>
        request(`${API_BASE}/user/block/${userId}`, {
            method: "POST",
        }).then(handleResponse),

    unblockUser: (userId: string) =>
        request(`${API_BASE}/user/block/${userId}`, {
            method: "DELETE",
        }).then(handleResponse),

    getBlockStatus: (userId: string) =>
        request(`${API_BASE}/user/block-status/${userId}`).then((res) => handleResponse<{ iBlockedThem: boolean; theyBlockedMe: boolean }>(res)),

    deleteAccount: () =>
        request(`${API_BASE}/user/delete`, {
            method: "DELETE",
        }).then(handleResponse),
};

export { API_BASE };
