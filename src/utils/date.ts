export const formatDate = (date: Date) => {
    const isPM = date.getHours() > 12;

    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours() % 12}:${date.getMinutes()} ${isPM ? "PM" : "AM"}`
}