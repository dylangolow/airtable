import {setLabel} from "../../utils";
import {Box, Label, Text} from "@airtable/blocks/ui";
import React from "react";
import {DashboardTile} from "./DashboardTile";

const MedHistory = ({table, initialEval}) => {

    const medFields = table ? table.fields
            .filter(field => {
                return field.description?.includes("#MED#") && initialEval.getCellValueAsString(field.id) === 'Sim';
            })
            .map(field => {
                return setLabel(field);
            })
        : null;
    const famFields = table ? table.fields
            .filter(field => {
                return field.description?.includes("#FAM#") && initialEval.getCellValueAsString(field.id) !== '';
            })
            .map(field => {
                let fieldWithLabel = setLabel(field);
                let value = initialEval.getCellValueAsString(field.id);
                return {...fieldWithLabel, value};
            })
        : null;
    const cancerFields = table ? table.fields
            .filter(field => {
                return field.description?.includes("#CAN#") && initialEval.getCellValueAsString(field.id) !== '';
            })
            .map(field => {
                let fieldWithLabel = setLabel(field);
                let value = initialEval.getCellValueAsString(field.id);
                return {...fieldWithLabel, value};
            })
        : null;

    return (
        <div>
            <DashboardTile>
                <Box padding={1} marginBottom={2}>
                    <Label>
                        Uso de remédios:
                    </Label>
                    {medFields && medFields.length > 0 ? medFields.map((field, index) =>
                            <Text key={`${field.label}-${index}`}>{field.label}</Text>) :
                        <Text>Nenhum</Text>}
                </Box>
                <Box padding={1} marginBottom={2}>
                    <Label>
                        História da Família:
                    </Label>
                    {famFields && famFields.length > 0 ? famFields.map((field, index) =>
                            <div key={`${field.label}-${index}`}>
                                <Text key={`${field.label}-${index}`}>{field.label} ({field.value})</Text>
                            </div>) :
                        <Text>Nenhum</Text>}
                </Box>
                <Box padding={1}>
                    <Label>
                        História do Câncer:
                    </Label>
                    {cancerFields && cancerFields.length > 0 ? cancerFields.map((field, index) =>
                            <div key={`${field.label}-${index}`}>
                                <Text key={`${field.label}-${index}`}>{field.label} ({field.value})</Text>
                            </div>) :
                        <Text>Nenhum</Text>}
                </Box>
            </DashboardTile>
        </div>
    );
}
export default MedHistory;
