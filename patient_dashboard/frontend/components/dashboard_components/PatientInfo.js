import {setLabel} from "../../utils";
import moment from "moment";
import {Label, Text} from "@airtable/blocks/ui";
import React from "react";
import {DashboardTile} from "./DashboardTile";

const TableText = ({children, ...props}) => <Text padding={1} margin={2} {...props}>{children}</Text>

const PatientInfo = ({table, initialEval}) => {
    const calculateAge = (dobField) => {
        return {
            ...setLabel(dobField, "#AGE_LABEL#"),
            value: moment().diff(moment(dobField.value), 'years')
        }
    }
    // const dobField = table ? table.fields.filter(field => field.description?.includes("#DoB#"))[0] : null;
    const dob = table ? table.fields.filter(field => field.description?.includes("#DoB#")).map(field => {
        return {
            description: field.description,
            ...setLabel(field),
            value: initialEval.getCellValueAsString(field.id)
        }
    })[0] : '';
    const age = initialEval && dob.description ? calculateAge(dob) : null;
    const name = table ? table.fields.filter(field => field.description?.includes("#NAME#")).map(field => {
        return {
            ...setLabel(field),
            value: initialEval.getCellValueAsString(field.id)
        }
    })[0] : '';
    const email = table ? table.fields.filter(field => field.description?.includes("#EMAIL#")).map(field => {
        return {
            ...setLabel(field),
            value: initialEval.getCellValueAsString(field.id)
        }
    })[0] : '';
    const sex = table ? table.fields.filter(field => field.description?.includes("#SEX#")).map(field => {
        return {
            ...setLabel(field),
            value: initialEval.getCellValueAsString(field.id)
        }
    })[0] : '';
    const contact = table ? table.fields.filter(field => field.description?.includes("#CONTACT#")).map(field => {
        return {
            ...setLabel(field),
            value: initialEval.getCellValueAsString(field.id)
        }
    })[0] : '';
    const phone = table ? table.fields.filter(field => field.description?.includes("#PHONE#")).map(field => {
        return {
            ...setLabel(field),
            value: initialEval.getCellValueAsString(field.id)
        }
    })[0] : '';


    return (
        <>{initialEval ?
            <DashboardTile height={"fit-content"} width={"fit-content"}>
                <Label>Informações Gerais</Label>
                <table>
                    <tr>
                        <td><TableText>{name?.label || ''} </TableText></td>
                        <td><TableText>{name?.value || ''}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>{email?.label || ''}</TableText></td>
                        <td><TableText>{email?.value || ''}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>{age?.label || ''}</TableText></td>
                        <td><TableText>{age?.value || ''}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>{dob?.label || ''}</TableText></td>
                        <td><TableText>{dob?.value || ''}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>{sex?.label || ''}</TableText></td>
                        <td><TableText>{sex?.value || ''}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>{contact?.label || ''}</TableText></td>
                        <td><TableText>{contact?.value || ''}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>{phone?.label || ''}</TableText></td>
                        <td><TableText>{phone?.value || ''}</TableText></td>
                    </tr>
                </table>
            </DashboardTile> : <NoEvalTile/>
        }
        </>
    );
}

export default PatientInfo;
