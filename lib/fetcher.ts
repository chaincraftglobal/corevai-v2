// lib/fetcher.ts
export class HTTPError extends Error {
    status: number;
    data: any;
    constructor(status: number, data: any, message?: string) {
        super(message ?? `HTTP ${status}`);
        this.status = status;
        this.data = data;
    }
}

async function parseBody(res: Response) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        try {
            return await res.json();
        } catch {
            return null;
        }
    }
    try {
        return await res.text();
    } catch {
        return null;
    }
}

export async function getJSON<T>(url: string, init?: RequestInit) {
    const res = await fetch(url, { credentials: "include", ...init });
    const data = await parseBody(res);
    if (!res.ok) throw new HTTPError(res.status, data, `GET ${url} failed: ${res.status}`);
    return data as T;
}

export async function postJSON<T>(url: string, body?: any, init?: RequestInit) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: "include",
        ...init,
    });
    const data = await parseBody(res);
    if (!res.ok) throw new HTTPError(res.status, data, `POST ${url} failed: ${res.status}`);
    return data as T;
}

export async function delJSON<T>(url: string, init?: RequestInit) {
    const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        ...init,
    });
    const data = await parseBody(res);
    if (!res.ok) throw new HTTPError(res.status, data, `DELETE ${url} failed: ${res.status}`);
    return data as T;
}