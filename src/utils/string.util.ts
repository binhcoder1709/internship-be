const normalizeSearchText = (text: string): string => {
    if (!text) return '';
    
    return text
        .trim()
        // Loại bỏ dấu tiếng Việt
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Chuyển về lowercase
        .toLowerCase();
}

export const  StringUtil = {
    normalizeSearchText
}