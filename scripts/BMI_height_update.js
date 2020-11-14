// let table = base.tables.filter(table => table.description && table.description?.includes('#EVALS#'))[0];
let table = base.getTable("tblGU2fJkhCJKrmvQ");
let view = table.getView("viwGVWAonKASki8jQ");
let queryResult = await view.selectRecordsAsync();
let inputConfig = input.config();
let heightField = table.fields.filter(field => field.description && field.description.includes('#HEIGHT#'))[0];
let emailField = table.fields.filter(field => field.description && field.description.includes('#EMAIL#'))[0];
output.set('heightId', heightField.id);

let height = queryResult.records.filter(record => record.getCellValue(emailField.id)===inputConfig.email).map(record => record.getCellValue(heightField.id))[0];
await table.updateRecordAsync(inputConfig.recordId, {[`${heightField.id}`]:height});
