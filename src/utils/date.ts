export const formatDate = (date: Date) => {
    const isPM = date.getHours() > 12;

    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours() % 12}:${date.getMinutes()} ${isPM ? "PM" : "AM"}`
}

export const getRelativeTimestamp = (duration: number) => {
    return `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`;
}

export const formatDuration = (ms: number) => {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 48) return `${h}h ${m % 60}m`;
    return `${Math.floor(h / 24)}d ${h % 24}h`;
}