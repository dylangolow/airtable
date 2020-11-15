import {Box, Heading, Label, Text, useBase, useRecords} from "@airtable/blocks/ui";
import React from "react";
import {DashboardTile} from "./DashboardTile";

const HTag = ({label, renderIcon}) => <>
    <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" flexBasis="content"
         margin={3} padding={2}>
        <Box>
            {renderIcon}
        </Box>
        <Box>
            <Label>{label}</Label>
        </Box>
    </Box>
</>

const HealthTags = ({table, initialEval}) => {
    const base = useBase();

    const tagsTable = base.tables.filter(table => table.description.includes('#TAGS#')) ? base.tables.filter(table => table.description.includes('#TAGS#'))[0] : null;

    let attachmentField = tagsTable ? tagsTable.fields?.filter(field => field.description?.includes('#ATTACH#'))[0] : null;
    const displayNameField = tagsTable ? tagsTable.fields?.filter(field => field.description?.includes('#DISPLAY#'))[0] : null;

    const tagsRecords = tagsTable ? useRecords(tagsTable) : null;

    let patientTags = table && initialEval && table.fields.filter(field => field.description?.includes('#TAGS#')).length > 0 ?
        table.fields.filter(field => field.description?.includes('#TAGS#')).map(field => initialEval.getCellValue(field.id))[0] : null;
    const tags = patientTags?.length > 0 && tagsRecords?.length > 0 && attachmentField ?
        patientTags.map(tag => {
            const record = tagsTable.selectRecords().getRecordById(tag.id);
            const displayName = record.getCellValueAsString(displayNameField.id);
            let attachmentsExist = record.getCellValue(attachmentField.id) ? record.getCellValue(attachmentField.id)[0] : null;
            const defaultExists = tagsRecords.find(record => record.getCellValueAsString('Tag') === 'DEFAULT');
            // console.log('defaultExists', defaultExists);
            if (!attachmentsExist && defaultExists) attachmentsExist = defaultExists.getCellValue(attachmentField.id) ? defaultExists.getCellValue(attachmentField.id)[0] : null;
            if (!attachmentsExist) {
                return {
                    ...record,
                    label: displayName,
                    renderIcon: <Box key={tag.id} display="flex" justifyContent="center" alignContent="center"
                                     style={{backgroundColor: "#FBDEDE", height: 36, width: 36, borderRadius: 36}}>
                        <span style={{color: "#EA5A5A", fontWeight: "bold", alignSelf: "center"}}>?</span>
                    </Box>
                }
            }
            const attachmentObj = attachmentsExist;
            const clientUrl =
                record.getAttachmentClientUrlFromCellValueUrl(
                    attachmentObj.id,
                    attachmentObj.url
                );
            return {
                ...record,
                label: displayName,
                renderIcon: <img key={tag.id} src={clientUrl} width={36} alt={record.name}/>
            }
        })
        : null;

    return (
        <>
            <DashboardTile height={"fit-content"} width={"fit-content"}>
                <Label>TAGS DE SAÚDE / CONDIÇÃO</Label>
                <div>{tagsTable ?
                    <Box display="flex" flexWrap="wrap" maxWidth={300}
                         style={{display: "flex", justifyContent: "space-evenly", marginTop: 12, flexWrap: "wrap"}}>
                        {tags && tags.length > 0 ? tags.map((tag, index) =>
                            <HTag key={`tag${index}-${new Date().getTime()}`} label={tag.label} renderIcon={tag.renderIcon} />
                        ) : <Text>Nenhum</Text>}
                    </Box>
                    : <Heading>Cannot find TAGS table. Add #TAGS# to table description to ensure it can be
                        found.</Heading>}
                </div>
            </DashboardTile>
        </>
    );
}

export default HealthTags;
