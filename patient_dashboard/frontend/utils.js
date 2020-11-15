export const sortByField = (field) => (a, b) => b.getCellValue(`${field}`) - a.getCellValue(`${field}`);

export const setLabel = (field, labelTag = "#LABEL#") => {
    const labelTags = (field.description?.match(new RegExp(labelTag, "g")) || []).length;
    let label;
    if (labelTags === 2) label = field.description?.split(`${labelTag}`)[1];
    if (!label || label?.trim() === '') label = field.name;
    return {...field, label, name: field.name, description: field.description};
}
