import {setLabel, sortByField} from "../../utils";
import React from "react";
import {Box, Label} from "@airtable/blocks/ui";
import styled from "styled-components";
import {DashboardTile} from "./DashboardTile";

const SummaryStat = ({label, value, units}) => <>
    <SummaryStatStyled padding={2} margin={1} alignItems="center" justifyContent="center" key={label}>
        <Label>{label}</Label>
        <div>
            <span>{value} {units ? (<span>{units}</span>) : null}</span>
        </div>
    </SummaryStatStyled>
</>

const SummaryStatStyled = styled(Box)`
    flex-direction: column;
    display: flex;
    justify-content: center;
    align-content: center;
`;

const NumericStats = ({table, initialEval, records}) => {

    const weightField = table ? table.fields.filter(field => field.description?.includes("#WEIGHT#")).map(field => setLabel(field))[0] : null;
    const heightField = table ? table.fields.filter(field => field.description?.includes("#HEIGHT#")).map(field => setLabel(field))[0] : null;

    // const sortByField = (field) => (a, b) => b.getCellValue(`${field}`) - a.getCellValue(`${field}`);

    // console.log(`weightField: ${weightField} | heightField: ${heightField}`);
    // console.log(`weightField.name: ${weightField.name} | heightField.name: ${heightField.name}`);
    // console.log(`weightField.label: ${weightField.label} | heightField.label: ${heightField.label}`);
    // console.log('[...records.sort(sortByField(\'Date Created\'))][0]', [...records.sort(sortByField('Date Created'))]);

    const latestWeight = weightField && records && records.length > 0 ? [...records.sort(sortByField('Date Created'))][0].getCellValue(weightField.name) : null;
    const latestHeight = heightField && records && records.length > 0 ? [...records.sort(sortByField('Date Created'))][0].getCellValue(heightField.name) : null;
    const bmi = latestWeight && latestHeight ? (Number((latestWeight) / Math.pow(latestHeight / 100, 2))).toFixed(2) : 'N/A';

    const values = [
        {
            value: bmi,
            units: '',
            label: 'IMC'
        },
        {
            value: latestWeight,
            units: 'kg',
            label: weightField.label
        },
        {
            value: latestHeight,
            units: 'cm',
            label: heightField.label
        },
    ];

    return (
        <div>
            <DashboardTile>
                <div style={{display: "flex", justifyContent: "space-evenly"}}>
                    {values && values.map(each =>
                        <SummaryStat
                            value={each.value}
                            label={each.label}
                            units={each.units}
                            key={each.label}
                        />
                    )}
                </div>
            </DashboardTile>
        </div>
    );
}

export default NumericStats;
