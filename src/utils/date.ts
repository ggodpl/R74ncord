export const formatDate = (date: Date) => {
    const isPM = date.getHours() > 12;

    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours() % 12}:${date.getMinutes()} ${isPM ? "PM" : "AM"}`
}

export const getRelativeTimestamp = (duration: number) => {
    return `<t:${(Date.now() + duration) / 1000}:R>`;
}