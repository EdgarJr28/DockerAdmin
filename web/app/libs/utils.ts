export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

export const shortId = (id: string) => id?.slice(0, 12) ?? '';

export const getName = (c: { Names?: string[]; Name?: string; Id: string }) =>
    ((c.Names?.[0] || c.Name || '').replace(/^\//, '') || shortId(c.Id));
