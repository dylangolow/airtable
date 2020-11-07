import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    Box,
    FormField,
    Select, Text, Label, Icon, useViewport, Heading, useSettingsButton, Button
} from '@airtable/blocks/ui';
import {FieldType} from "@airtable/blocks/models";
import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

import moment from 'moment';
// This app uses chart.js and the react-chartjs-2 packages.
// Install them by running this in the terminal:
// npm install chart.js react-chartjs-2
import {Bar} from 'react-chartjs-2';
import {viewport} from "@airtable/blocks";

const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    VIEW_ID: 'viewId',
    X_FIELD_ID: 'xFieldId',
    X_FIELD_VALUE: 'xFieldValue',
};

function Dashboard() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    // const [table, setTable] = useState(null);

    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    let table = base.getTableByIdIfExists(tableId);

    const viewId = globalConfig.get(GlobalConfigKeys.VIEW_ID);
    let view = table ? table.getViewByIdIfExists(viewId) : null;

    let xFieldId = globalConfig.get(GlobalConfigKeys.X_FIELD_ID);
    let xField = table ? table.getFieldByIdIfExists(xFieldId) : null;

    const [options, setOptions] = useState([]);
    const [value, setValue] = useState(null);
    const [initialEval, setInitialEval] = useState(null);
    const [stateRecords, setStateRecords] = useState([]);
    const [objectives, setObjectives] = useState([]);
    const [showSettings, setShowSettings] = useState(false);

    let records;

    const handleSetEval = (value) => {
        // console.log('value', value);
        setInitialEval(value);
    }

    useEffect(() => {
        (async () => {
            if (table && view) {
                // console.log('xFieldId', xFieldId);
                if (xFieldId && !table.getFieldByIdIfExists(xFieldId)) {
                    xFieldId = null;
                    handleResetValues.resetTable();
                }
                if (xFieldId) {
                    const queryValues = xFieldId ? await table.selectRecordsAsync({fields: [xField]}) : await table.selectRecordsAsync();
                    await queryValues.loadDataAsync();
                    if (queryValues.records && queryValues.records.length > 0) {
                        let column = xFieldId;
                        let newArray = [...queryValues.records.filter(rec => typeof rec.getCellValue(`${column}`) !== 'object').map((rec) => {
                            return rec.getCellValue(`${column}`);
                        }).sort()];
                        const uniqueSet = new Set(newArray);
                        // console.log('uniqueSet.values()', uniqueSet.values());
                        const finalArray = [...uniqueSet.values()].map((each) => {
                            return {value: each, label: each};
                        })
                        setOptions(finalArray);
                    }
                    const queryRecords = await table.selectRecordsAsync();
                    await queryRecords.loadDataAsync();
                    records = queryRecords.records;
                    if (records && records.length > 0) {
                        records.filter((record) => {
                            if (value) return record.getCellValue(`${xFieldId}`) === value;
                            return record;
                        });
                        // console.log('setting state records');
                        setStateRecords(records);
                    }
                    // console.log('records.length', records.length);
                    if (value && records && records.length > 0) {
                        const exists = records.find((record) => record.getCellValue('Eval Type') === 'A' && record.getCellValue(`${xFieldId}`) === value);
                        // console.log('exists', exists);
                        handleSetEval(exists);
                    }
                }
            }
        })();
    }, [table, view, xFieldId, value]);

    useEffect(() => {
        (async () => {
            if (table && initialEval && value) {
                // set objectives fields
                const ratingFields = table.fields.filter(field => field.type === 'rating' && field.name !== 'Sleep Quality' && field.description?.includes('OBJ'));
                // console.log('ratingFields', ratingFields);
                // anything over 4 stars
                const patientObjectives = [];
                for (const f of ratingFields) {
                    const name = f.name;
                    const value = initialEval.getCellValue(f.name);
                    if (value >= 4) patientObjectives.push({name, value});
                }
                // console.log('patientObjectives', patientObjectives);
                setObjectives(patientObjectives);
            }
        })();
    }, [initialEval, value]);

    // const data = records && xField ? getChartData({records, xField}) : null;

    const selected = value;

    const handleResetValues = {
        resetTable: () => {
            view = undefined;
            xFieldId = undefined;
            setValue(undefined);
        },
        resetView: () => {
            xFieldId = null;
            setValue(null);
        },
        resetField: () => {
            setValue(null);
        }
    }

    const viewport = useViewport();

    useSettingsButton(() => setShowSettings(!showSettings));

    const Setup = () => {

        return (
            <Box padding={4} display="flex" alignContent="center" justifyContent="content" flexDirection="column">
                <FormField label="Table">
                    <TablePickerSynced
                        globalConfigKey={GlobalConfigKeys.TABLE_ID}
                        onChange={() => handleResetValues.resetTable()}
                    />
                </FormField>
                {table && (
                    <FormField label="View" paddingX={1}>
                        <ViewPickerSynced
                            table={table}
                            globalConfigKey={GlobalConfigKeys.VIEW_ID}
                            onChange={() => handleResetValues.resetView()}
                        />
                    </FormField>
                )}
                <Button variant="primary" onClick={() => setShowSettings(false)} disabled={!(!!table && !!view)}>Save</Button>
            </Box>
        );
    }

    if (showSettings) {
        return <Setup/>
    }


    return (
        <>
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                flexDirection="column"
            >
                <Settings table={table} xFieldValues={options} setFieldValue={setValue}
                          handleResetValues={handleResetValues}/>
                {selected && initialEval ? (
                    <>
                        {/*<Box position="relative" flex="auto" padding={3}>*/}
                        <Box position="relative" flex="auto" flexWrap="wrap" padding={3}>
                            <div style={{display: "flex", maxWidth: viewport.width, flexWrap: "wrap"}}>
                                <PatientInfo initialEval={initialEval}/>
                                <div style={{
                                    display: "flex",
                                    maxWidth: viewport.width,
                                    flexWrap: "wrap",
                                    flexDirection: "column"
                                }}>
                                    <NumericStats table={table} initialEval={initialEval} records={stateRecords}/>
                                    <MedHistory table={table} initialEval={initialEval}/>
                                    <HealthTags initialEval={initialEval}/>
                                </div>

                            </div>
                            <div style={{display: "flex", maxWidth: viewport.width, flexWrap: "wrap"}}>

                                <Objectives initialEval={initialEval} objectives={objectives}/>

                            </div>

                        </Box>
                        <Box position="relative" flex="auto" padding={3}>
                            <Charts/>
                        </Box>
                        {/*</Box>*/}
                    </>
                ) : <DashboardTile><Heading>Could not find patient data...</Heading></DashboardTile>}
            </Box>
        </>

    );
}

export const DashboardTile = ({children, ...props}) => {
    return (
        <Box
            // position="relative"
            // flex="auto"
            padding={3}
            margin={2}
            borderRadius="large"
            backgroundColor="lightGray1"
            // minWidth="33%"
            // maxWidth="50%"
            {...props}>{children}</Box>
    );
}

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

const TableText = ({children, ...props}) => <Text padding={1} margin={2} {...props}>{children}</Text>

const NoEvalTile = () => <DashboardTile>
    <Heading>
        No data found.
    </Heading>
</DashboardTile>

const PatientInfo = ({initialEval}) => {
    const calculateAge = (dateOfBirth) => moment().diff(moment(dateOfBirth), 'years');
    const age = initialEval ? calculateAge(initialEval.getCellValue('DoB')) : 'Unknown';

    return (
        <>{initialEval ?
            <DashboardTile>
                <Label>GENERAL INFO</Label>
                <table>
                    <tr>
                        <td><TableText>Patient Name </TableText></td>
                        <td><TableText>{initialEval.getCellValueAsString('Name')}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>Email </TableText></td>
                        <td><TableText>{initialEval.getCellValueAsString('Email')}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>Age </TableText></td>
                        <td><TableText>{age}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>DoB </TableText></td>
                        <td><TableText>{initialEval.getCellValueAsString('DoB')}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>Gender </TableText></td>
                        <td><TableText>{initialEval.getCellValueAsString('Sex')}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>Preferred Contact </TableText></td>
                        <td><TableText>{initialEval.getCellValueAsString('Contact preference')}</TableText></td>
                    </tr>
                    <tr>
                        <td><TableText>Phone Number </TableText></td>
                        <td><TableText>{initialEval.getCellValueAsString('Phone Number')}</TableText></td>
                    </tr>
                </table>
            </DashboardTile> : <NoEvalTile/>
        }
        </>
    );
}

const SpacedText = ({children, ...props}) => <Text padding={1} {...props}>{children}</Text>

const Objectives = ({initialEval, objectives}) => {

    console.log('objectives', objectives);

    const renderObjectives = (objectives) => {
        return (
            <>
                {objectives && objectives.length > 0 ?
                    <table style={{width: "100%"}}>
                        {objectives.map(obj =>
                            <tr style={{display: "flex", justifyContent: "space-between", margin: 5, width: "100%"}}
                                key={obj.name}>
                                <td style={{margin: 5}}>{obj.name}</td>
                                <td style={{margin: 5, alignSelf: "end", textAlign: "end"}}>
                                    <div>{Array(obj.value * 1).fill(true).map(o => <Icon name="star" size={24}/>)}</div>
                                </td>
                            </tr>)}
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
                minWidth={400}
                maxWidth="50%"
            >
                <Label>OBJECTIVES</Label>
                {renderObjectives(objectives)}
            </DashboardTile>


        </>

    );
}

const NumericStats = ({table, initialEval, records}) => {

    const weightField = table ? table.fields.filter(field => field.description?.includes("WEIGHT"))[0] : null;
    const heightField = table ? table.fields.filter(field => field.description?.includes("HEIGHT"))[0] : null;

    const sortByField = (field) => (a, b) => b.getCellValue(`${field}`) - a.getCellValue(`${field}`);

    console.log(`weightField: ${weightField} | heightField: ${heightField}`);
    console.log(`weightField.name: ${weightField.name} | heightField.name: ${heightField.name}`);
    console.log('[...records.sort(sortByField(\'Date Created\'))][0]', [...records.sort(sortByField('Date Created'))]);

    const latestWeight = weightField && records && records.length > 0 ? [...records.sort(sortByField('Date Created'))][0].getCellValue(weightField.name) : null;
    const latestHeight = heightField && records && records.length > 0 ? [...records.sort(sortByField('Date Created'))][0].getCellValue(heightField.name) : null;
    const bmi = latestWeight && latestHeight ? (Number((latestWeight) / Math.pow(latestHeight / 100, 2))).toFixed(2) : 'N/A';

    const values = [
        {
            value: bmi,
            units: '',
            label: 'BMI'
        },
        {
            value: latestWeight,
            units: 'kg',
            label: 'Weight'
        },
        {
            value: latestHeight,
            units: 'cm',
            label: 'Height'
        },

    ];

    return (
        <>
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
        </>
    );
}

const MedHistory = ({table, initialEval}) => {

    const medUse = [
        'Diabetes',
        'Blood Pressure'
    ];

    const familyHistory = [
        'Diabetes',
        'Blood Pressure'
    ];
    const cancerHistory = [
        'Bone / Grandmother',

    ];

    return (
        <>
            <DashboardTile>
                <Box padding={1} marginBottom={2}>
                    <Label>
                        Medicine usage:
                    </Label>
                    {medUse && medUse.length > 0 ? <Text>{medUse.join(', ')}</Text> :
                        <Text>None</Text>}
                </Box>
                <Box padding={1} marginBottom={2}>
                    <Label>
                        Family History for Conditions:
                    </Label>
                    {familyHistory && familyHistory.length > 0 ? <Text>{familyHistory.join(', ')}</Text> :
                        <Text>None</Text>}
                </Box>
                <Box padding={1}>
                    <Label>
                        Cancer History:
                    </Label>
                    {cancerHistory && cancerHistory.length > 0 ? <Text>{cancerHistory.join(', ')}</Text> :
                        <Text>None</Text>}
                </Box>
            </DashboardTile>
        </>
    );
}

const HTag = ({label, renderIcon}) => <>
    <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" flexBasis="content"
         key={label}
         margin={0}>
        <Box>
            {renderIcon}
        </Box>
        <Box>
            <Label>{label}</Label>
        </Box>
    </Box>
</>

const HealthTags = ({initialEval}) => {

    const tags = [
        {
            label: 'Heart',
            renderIcon: <Icon name="heart"/>
        },
        {
            label: 'Shapes',
            renderIcon: <Icon name="shapes"/>
        },
        {
            label: 'Share',
            renderIcon: <Icon name="share"/>
        },
    ];

    return (
        <>
            <DashboardTile>
                <Label>HEALTH / CONDITION TAGS</Label>
                <div style={{display: "flex", justifyContent: "space-evenly", marginTop: 12}}>
                    {tags.map(tag =>
                        <div>
                            <HTag label={tag.label} renderIcon={tag.renderIcon} key={tag.label}/>
                        </div>
                    )}
                </div>

            </DashboardTile>
        </>
    );
}

const Charts = () => {

    return (
        <>

        </>
    );
}

function getChartData({records, xField}) {
    const recordsByXValueString = new Map();
    for (const record of records) {
        const xValue = record.getCellValue(xField);
        const xValueString = xValue === null ? null : record.getCellValueAsString(xField);

        if (!recordsByXValueString.has(xValueString)) {
            recordsByXValueString.set(xValueString, [record]);
        } else {
            recordsByXValueString.get(xValueString).push(record);
        }
    }

    const labels = [];
    const points = [];
    for (const [xValueString, records] of recordsByXValueString.entries()) {
        const label = xValueString === null ? 'Empty' : xValueString;
        labels.push(label);
        points.push(records.length);
    }

    const data = {
        labels,
        datasets: [
            {
                backgroundColor: '#4380f1',
                data: points,
            },
        ],
    };
    return data;
}

const FieldValueSelect = ({options, setFieldValue}) => {
    const [value, setValue] = useState(null);

    useEffect(() => {
        setFieldValue(value);
    }, [value]);

    return (
        <>
            {(options && options.length > 0) ? (<Select
                options={options}
                value={value}
                onChange={newValue => setValue(newValue)}
                width="320px"
            />) : <Text>No filter options available</Text>
            }
        </>

    );
}

function Settings({table, xFieldValues, setFieldValue, handleResetValues}) {

    return (
        <Box display="flex" padding={3} borderBottom="thick" maxWidth={viewport.width}>
            <FormField label="Table" width="25%" paddingRight={1} marginBottom={0}>
                <TablePickerSynced
                    globalConfigKey={GlobalConfigKeys.TABLE_ID}
                    onChange={() => handleResetValues.resetTable()}
                />
            </FormField>
            {table && (
                <FormField label="View" width="25%" paddingX={1} marginBottom={0}>
                    <ViewPickerSynced
                        table={table}
                        globalConfigKey={GlobalConfigKeys.VIEW_ID}
                        onChange={() => handleResetValues.resetView()}
                    />
                </FormField>
            )}
            {table && (
                <FormField label="Filter by" width="25%" paddingX={1} marginBottom={0}>
                    <FieldPickerSynced
                        table={table}
                        globalConfigKey={GlobalConfigKeys.X_FIELD_ID}
                        // onChange={() => handleResetValues.resetField()}
                        allowedTypes={[FieldType.EMAIL, FieldType.SINGLE_LINE_TEXT]}
                    />
                </FormField>
            )}
            {console.log('xFieldValues', xFieldValues)}
            {xFieldValues && xFieldValues.length > 0 && (
                <FormField label="Filter value" width="25%" paddingRight={1} marginBottom={0}>
                    <FieldValueSelect maxWidth={50} width="25%" options={xFieldValues} setFieldValue={setFieldValue}/>
                </FormField>
            )}
        </Box>
    );
}

initializeBlock(() => <Dashboard/>);
