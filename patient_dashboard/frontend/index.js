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
import Charts from "./components/dashboard_charts";

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
                        let newArray = [...queryValues.records
                            .filter(rec => typeof rec.getCellValue(`${column}`) !== 'object')
                            .map((rec) => {
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
                        const exists = records.find((record) =>
                            record.getCellValue('Eval Type') === 'A'
                            && record.getCellValue(`${xFieldId}`) === value);
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
                                <PatientInfo table={table} initialEval={initialEval}/>
                                <div style={{
                                    display: "flex",
                                    maxWidth: viewport.width,
                                    flexWrap: "wrap",
                                    flexDirection: "column"
                                }}>
                                    <NumericStats table={table} initialEval={initialEval} records={stateRecords}/>
                                    <MedHistory table={table} initialEval={initialEval}/>
                                    <HealthTags table={table} initialEval={initialEval}/>
                                </div>

                            </div>
                            <div style={{display: "flex", maxWidth: viewport.width, flexWrap: "wrap"}}>

                                <Objectives initialEval={initialEval} objectives={objectives}/>

                            </div>

                        </Box>
                        <Box position="relative" flex="auto" padding={3}>
                            <Charts table={table} records={stateRecords} />
                        </Box>
                        {/*</Box>*/}
                    </>
                ) : <DashboardTile><Heading>Não foi possível encontrar os dados do paciente...</Heading></DashboardTile>}
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
        Nenhum dado encontrado.
    </Heading>
</DashboardTile>

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
            <DashboardTile>
                <Label>GENERAL INFO</Label>
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

const SpacedText = ({children, ...props}) => <Text padding={1} {...props}>{children}</Text>

const Objectives = ({initialEval, objectives}) => {
    // console.log('objectives', objectives);
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
                maxWidth={600}
            >
                <Label>OBJETIVOS</Label>
                {renderObjectives(objectives)}
            </DashboardTile>


        </>

    );
}

export const sortByField = (field) => (a, b) => b.getCellValue(`${field}`) - a.getCellValue(`${field}`);

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

export const setLabel = (field, labelTag = "#LABEL#") => {
    const labelTags = (field.description?.match(new RegExp(labelTag,"g")) || []).length;
    let label;
    if (labelTags === 2) label = field.description?.split(`${labelTag}`)[1];
    if (!label || label?.trim() === '') label = field.name;
    return {...field, label, name: field.name, description: field.description};
}

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
        <>
            <DashboardTile>
                <Box padding={1} marginBottom={2}>
                    <Label>
                        Uso de remédios:
                    </Label>
                    {medFields && medFields.length > 0 ? medFields.map(field =>
                            <Text>{field.label}</Text>) :
                        <Text>Nenhum</Text>}
                </Box>
                <Box padding={1} marginBottom={2}>
                    <Label>
                        História da Família:
                    </Label>
                    {famFields && famFields.length > 0 ? famFields.map(field =>
                            <>
                            <Text>{field.label} ({field.value})</Text>
                            </>) :
                        <Text>Nenhum</Text>}
                </Box>
                <Box padding={1}>
                    <Label>
                        História do Câncer:
                    </Label>
                    {cancerFields && cancerFields.length > 0 ? cancerFields.map(field =>
                            <>
                                <Text>{field.label} ({field.value})</Text>
                            </>) :
                        <Text>Nenhum</Text>}
                </Box>
            </DashboardTile>
        </>
    );
}

const HTag = ({label, renderIcon, key}) => <>
    <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" flexBasis="content"
         margin={3} padding={2} key={key}>
        <Box >
            {renderIcon}
        </Box>
        <Box>
            <Label>{label}</Label>
        </Box>
    </Box>
</>

const HealthTags = ({table, initialEval}) => {
    const base = useBase();
    const tagsTable = base.getTableByNameIfExists('TAGS');
    let attachmentField = tagsTable ? tagsTable.fields.filter(field => field.description?.includes('#ATTACH#'))[0] : null;
    // console.log('attachmentField', attachmentField);
    const displayNameField = tagsTable ? tagsTable.fields.filter(field => field.description?.includes('#DISPLAY#'))[0] : null;
    const tagsRecords = useRecords(tagsTable);
    // console.log('tagsRecords', tagsRecords);
    let patientTags = table && initialEval && table.fields.filter(field => field.description?.includes('#TAGS#')).length > 0 ?
        table.fields.filter(field => field.description?.includes('#TAGS#')).map(field => initialEval.getCellValue(field.id))[0] : null;
    // if (patientTags?.length > 0) patientTags = patientTags[0].split(',');
    console.log('patientTags', patientTags);
    const tags = patientTags?.length > 0 && tagsRecords?.length > 0 && attachmentField ?

            patientTags.map(tag => {
                console.log('tag', tag);
                const record = tagsTable.selectRecords().getRecordById(tag.id);
                const attachmentObj = record.getCellValue(attachmentField.id)[0];
                const displayName = record.getCellValueAsString(displayNameField.id);
                const clientUrl =
                    record.getAttachmentClientUrlFromCellValueUrl(
                        attachmentObj.id,
                        attachmentObj.url
                    );
                return {
                    ...record,
                    label: displayName,
                    renderIcon: <img key={attachmentObj.id} src={clientUrl} width={36} alt={record.name} />
                }
            })
        : null;

    return (
        <>
            <DashboardTile>
                <Label>TAGS DE SAÚDE / CONDIÇÃO</Label>
                <div>
                    <Box display="flex" flexWrap="wrap" maxWidth={300} style={{display: "flex", justifyContent: "space-evenly", marginTop: 12, flexWrap: "wrap"}}>
                        {tags && tags.length > 0 ? tags.map(tag =>
                            // <div>
                                <HTag label={tag.label} renderIcon={tag.renderIcon} key={tag.id}/>
                            // </div>
                        ) : <Text>Nenhum</Text>}
                    </Box>
                </div>


            </DashboardTile>
        </>
    );
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
            <FormField label="Tabela" width="25%" paddingRight={1} marginBottom={0}>
                <TablePickerSynced
                    globalConfigKey={GlobalConfigKeys.TABLE_ID}
                    onChange={() => handleResetValues.resetTable()}
                />
            </FormField>
            {table && (
                <FormField label="Visão" width="25%" paddingX={1} marginBottom={0}>
                    <ViewPickerSynced
                        table={table}
                        globalConfigKey={GlobalConfigKeys.VIEW_ID}
                        onChange={() => handleResetValues.resetView()}
                    />
                </FormField>
            )}
            {table && (
                <FormField label="Filtrar por" width="25%" paddingX={1} marginBottom={0}>
                    <FieldPickerSynced
                        table={table}
                        globalConfigKey={GlobalConfigKeys.X_FIELD_ID}
                        // onChange={() => handleResetValues.resetField()}
                        allowedTypes={[FieldType.EMAIL, FieldType.SINGLE_LINE_TEXT]}
                    />
                </FormField>
            )}
            {xFieldValues && xFieldValues.length > 0 && (
                <FormField label="Valor do filtro" width="25%" paddingRight={1} marginBottom={0}>
                    <FieldValueSelect maxWidth={50} width="25%" options={xFieldValues} setFieldValue={setFieldValue}/>
                </FormField>
            )}
        </Box>
    );
}

initializeBlock(() => <Dashboard/>);
