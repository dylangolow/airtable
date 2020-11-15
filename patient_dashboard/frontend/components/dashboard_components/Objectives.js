import {setLabel} from "../../utils";
import {Icon, Label} from "@airtable/blocks/ui";
import React from "react";
import {DashboardTile} from "./DashboardTile";
import NoEvalTile from "./NoDataTile";

const Objectives = ({table, initialEval}) => {
    const objectives = table.fields
        .filter(field => {
            const value = initialEval.getCellValue(field.name);
            return field.type === 'rating' &&
                field.description?.includes('OBJ') &&
                value >= 4;
        })
        .map(field => {
            const name = field.name;
            const value = initialEval.getCellValue(field.name);
            return {
                ...setLabel(field),
                name,
                value
            }
        });
    const renderObjectives = (objectives) => {
        return (
            <>
                {objectives && objectives.length > 0 ?
                    <table style={{width: "100%"}}>
                        <tbody>
                        {objectives.map(obj =>
                            <tr style={{display: "flex", justifyContent: "space-between", margin: 5, width: "100%"}}
                                key={obj.name}>
                                <td style={{margin: 5}}>{obj.label}</td>
                                <td style={{margin: 5, alignSelf: "end", textAlign: "end"}}>
                                    <div>{Array(obj.value * 1).fill(true).map((o, index) => <Icon
                                        key={`${obj.name}-star-${index}`} name="star" size={24}/>)}</div>
                                </td>
                            </tr>)}
                        </tbody>
                    </table>
                    :
                    <NoEvalTile/>
                }
            </>
        );
    }

    return (
        <>
            <DashboardTile
                position="relative"
                flex="auto"
                padding={3}
                borderRadius="large"
                backgroundColor="lightGray1"
                minWidth={300}
                maxWidth={400}
                height={"fit-content"}
            >
                <Label>OBJETIVOS</Label>
                {renderObjectives(objectives)}
            </DashboardTile>


        </>

    );
}

export default Objectives;
