import {InputSynced, loadCSSFromString, loadCSSFromURLAsync, useGlobalConfig} from '@airtable/blocks/ui';

loadCSSFromURLAsync('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css')
import {
    initializeBlock,
    useBase,
    useRecords,
    Box,
    FormField,
    Text, Label, Icon, useViewport, Heading, Button, Input
} from '@airtable/blocks/ui';
import React, {Fragment, useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {Highlighter, Typeahead} from 'react-bootstrap-typeahead';
import moment from 'moment';
import {globalConfig, viewport} from "@airtable/blocks";
import Charts from "./components/dashboard_charts";
import {Menu} from "react-bootstrap-typeahead";
import {MenuItem} from "react-bootstrap-typeahead";
// import {TypeaheadMenu} from "react-bootstrap-typeahead";
import {getOptionProperty, getOptionLabel} from "react-bootstrap-typeahead/lib/utils";

const GlobalConfigKeys = {
    TABLE_ID_EVALS: 'tableIdEvals',
    VIEW_ID_INITIAL: 'viewIdInitial',
    X_PATIENT_EMAIL: 'xPatientEmail',
    X_TYPEAHEAD_VALUE: 'xTypeaheadValue',
    X_INITIAL_EVAL_ID: 'xInitialEvalId',
    X_SELECTED_VALUE: 'xSelectedValue'
};

function Dashboard() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    let table; // EVALUATIONS - #EVALS# tag
    let viewInitial;
    let records;
    let tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID_EVALS);
    table = base.getTableByIdIfExists(tableId) || base.tables.filter(table => table.description.includes('#EVALS#')) ?
        base.tables.filter(table => table.description.includes('#EVALS#'))[0] : null;

    // table = base && base.tables.filter(table => table.description.includes('#EVALS#')) ?
    //     base.tables.filter(table => table.description.includes('#EVALS#'))[0] : null;
    console.log('evalTableExists', table);
    // globalConfig.setAsync(GlobalConfigKeys.TABLE_ID_EVALS, table.id);

    const canFindInitialEval = table && table.fields.filter(field => field.name === "Eval Type") &&
        table.fields.filter(field => field.name === "Eval Type").length > 0;
    console.log('canFindInitialEval', canFindInitialEval);
    const returnError = (error) => {
        return (<Box display="flex" justifyContent="center" alignContent="center"
                     borderRadius="large" backgroundColor="lightGray"
                     margin={2} padding={3}>
            <Heading>{error}</Heading>
        </Box>);
    }

    if (!table || !canFindInitialEval) {
        let error = !table ? 'Cannot find table tagged with #EVALS#, ensure this tag appears in description to use this dashboard app.' :
            'Table is missing column "Eval Type" to identify initial evaluation. Ensure the proper table has the #EVALS# tag.'
        return (returnError(error));
    }
    const initialEvalView = table.getViewByNameIfExists('#INITIAL#')

    if (!initialEvalView) {
        return (returnError('Table is missing view with name #INITIAL# filtered to only the Initial Evaluations.'));
    }

    let xFieldId = table && table.fields.filter(field => field.description.includes('#EMAIL#')).length > 0 ?
        table.fields.filter(field => field.description.includes('#EMAIL#'))[0].id : null;

    console.log('xFieldId', xFieldId);

    const [options, setOptions] = useState([]); //
    const [value, setValue] = useState(null); // patient email value to filter records
    const [initialEval, setInitialEval] = useState(null); // initial eval record for patient email
    const [stateRecords, setStateRecords] = useState([]); // record filtered to patient email

    const handleSetEval = (value) => {
        console.log('handleSetEval value', value);
        setInitialEval(value);
    }

    const handleSetValue = (value) => {
        console.log('handleSetValue value', value);
        setValue(value);
    }

    // initialEvalView && (async () => {
    //     const queryValues = await initialEvalView.selectRecordsAsync();
    //     await queryValues.loadDataAsync();
    //     if (queryValues.records && queryValues.records.length > 0) {
    //         let column = xFieldId;
    //         let newArray = [...queryValues.records
    //             .filter(rec => typeof rec.getCellValue(`${column}`) !== 'object')
    //             .map((rec) => {
    //                 let nameColumn = table.fields.filter(field => field.description.includes('#NAME#'))[0];
    //                 return {
    //                     email: rec.getCellValue(`${column}`),
    //                     name: rec.getCellValueAsString(nameColumn.id)
    //                 };
    //             }).sort()];
    //         const uniqueSet = new Set(newArray);
    //         console.log('uniqueSet.values()', uniqueSet.values());
    //         const finalArray = [...uniqueSet.values()].map((each) => {
    //             return {
    //                 label: `${each.name} (${each.email})`,
    //                 id: each.email,
    //                 name: each.name,
    //                 email: each.email
    //             };
    //         })
    //         console.log('finalArray', finalArray);
    //         setOptions(finalArray);
    //     }
    //     console.log('options above', options);
    // })();

    let patientEmail = globalConfig.get(GlobalConfigKeys.X_PATIENT_EMAIL);

    // if (patientEmail) {
    //     console.log('patientEmail lower', patientEmail);
    //     handleSetValue([options.find(each => {
    //         console.log('each', each);
    //         return each.email === patientEmail
    //     })]);
    // }

    // let selectedValue = globalConfig.get(GlobalConfigKeys.X_SELECTED_VALUE);
    // if (selectedValue) {
    //     let tempValue = JSON.parse(selectedValue);
    //     setValue(tempValue);
    // }




    let fake = false;

    useEffect(() => {
            (async () => {
                const queryValues = await initialEvalView.selectRecordsAsync();
                await queryValues.loadDataAsync();
                if (queryValues.records && queryValues.records.length > 0) {
                    let column = xFieldId;
                    let newArray = [...queryValues.records
                        .filter(rec => typeof rec.getCellValue(`${column}`) !== 'object')
                        .map((rec) => {
                            let nameColumn = table.fields.filter(field => field.description.includes('#NAME#'))[0];
                            return {
                                email: rec.getCellValue(`${column}`),
                                name: rec.getCellValueAsString(nameColumn.id)
                            };
                        }).sort()];
                    const uniqueSet = new Set(newArray);
                    console.log('uniqueSet.values()', uniqueSet.values());
                    const finalArray = [...uniqueSet.values()].map((each) => {
                        return {
                            label: `${each.name} (${each.email})`,
                            id: each.email,
                            name: each.name,
                            email: each.email
                        };
                    })
                    setOptions(finalArray);
                }
            })();
        }, []);

    useEffect(() => {
        (async () => {

            if (table && initialEvalView) {
                if (xFieldId && !table.getFieldByIdIfExists(xFieldId)) xFieldId = null;
                console.log('xFieldId', xFieldId);
                // if (true) {
                    const queryValues = await initialEvalView.selectRecordsAsync();
                    await queryValues.loadDataAsync();
                    if (queryValues.records && queryValues.records.length > 0) {
                        let column = xFieldId;
                        let newArray = [...queryValues.records
                            .filter(rec => typeof rec.getCellValue(`${column}`) !== 'object')
                            .map((rec) => {
                                let nameColumn = table.fields.filter(field => field.description.includes('#NAME#'))[0];
                                return {
                                    email: rec.getCellValue(`${column}`),
                                    name: rec.getCellValueAsString(nameColumn.id)
                                };
                            }).sort()];
                        const uniqueSet = new Set(newArray);
                        console.log('uniqueSet.values()', uniqueSet.values());
                        const finalArray = [...uniqueSet.values()].map((each) => {
                            return {
                                label: `${each.name} (${each.email})`,
                                id: each.email,
                                name: each.name,
                                email: each.email
                            };
                        })
                        setOptions(finalArray);
                    }
                    const queryRecords = await table.selectRecordsAsync();
                    await queryRecords.loadDataAsync();
                    // const patientEmail = globalConfig.get(GlobalConfigKeys.X_PATIENT_EMAIL);
                    records = queryRecords.records ? [...queryRecords.records].filter((record) => {
                            console.log('value', value);
                            console.log('patientEmail', patientEmail);
                            if (patientEmail) return record.getCellValue(`${xFieldId}`) === patientEmail;
                            return record;
                        })
                        : null;
                    console.log('records', records, options);
                    console.log('options', options);

                    setStateRecords(records);
                    // console.log('records.length', records.length);
                    if (patientEmail && records && records.length > 0) {
                        const exists = records.find((record) =>
                            record.getCellValue('Eval Type') === 'A'
                            && record.getCellValue(`${xFieldId}`) === patientEmail);
                        // console.log('exists', exists);
                        handleSetEval(exists);
                    } else {
                        handleSetEval(null);
                    }
                    console.log('initialEval', initialEval);
                }
            if (patientEmail && options && options.length > 0) {
                console.log('patientEmail lower', patientEmail);
                console.log('patientEmail lower options', options);
                handleSetValue([options.find(each => {
                    console.log('each', each);
                    return each.email === patientEmail
                })]);
            }
            // }

            console.log('triggered useEffect table, xFieldId, value')
        })();
    }, [value]);

    useEffect(() => {
            (async () => {
                if (patientEmail) {
                    console.log('patientEmail lower', patientEmail);
                    console.log('patientEmail lower options', options);
                    const newSelectedValue = options.find(each => {
                        console.log('each', each);
                        return each.email === patientEmail
                    })
                    if (newSelectedValue) {
                        handleSetValue([newSelectedValue]);
                    }

                }
            })();
        }, []);

    const fillValue = () => {
        if (patientEmail) {
            console.log('patientEmail lower', patientEmail);
            console.log('patientEmail lower options', options);
            const newSelectedValue = options.find(each => {
                console.log('each', each);
                return each.email === patientEmail
            })
            if (newSelectedValue) {
                handleSetValue([newSelectedValue]);
            }
            return value;
        }
    }

    const selected = value;
    console.log('selected', selected);
    const viewport = useViewport();

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
                {console.log('options', options)}

                <Settings table={table} xFieldValues={options} setFieldValue={handleSetValue}
                                                         value={value}/>

                {selected && initialEval && options && options.length > 0 ? (
                    <>
                        <Box position="relative" display="flex" flex="auto" flexWrap="wrap" padding={3}>
                            {/*<div style={{display: "flex", maxWidth: viewport.width, flexWrap: "wrap"}}>*/}
                            <PatientInfo table={table} initialEval={initialEval}/>
                            <div style={{
                                display: "flex",
                                maxWidth: viewport.width,
                                flexWrap: "wrap",
                                flexDirection: "column"
                            }}>
                                <NumericStats table={table} initialEval={initialEval} records={stateRecords}/>
                                <MedHistory table={table} initialEval={initialEval}/>

                            </div>
                            <HealthTags style={{height: "fit-content"}} table={table} initialEval={initialEval}/>

                            {/*</div>*/}
                            {/*<div style={{display: "flex", maxWidth: viewport.width, flexWrap: "wrap"}}>*/}
                            <Objectives style={{height: "fit-content"}} table={table} initialEval={initialEval}/>
                            {/*</div>*/}
                        </Box>
                        <Box position="relative" flex="auto" padding={3}>
                            <Charts table={table} records={stateRecords}/>
                        </Box>
                    </>
                ) : <DashboardTile><Heading>Não foi possível encontrar os dados do
                    paciente...</Heading></DashboardTile>}
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

const SpacedText = ({children, ...props}) => <Text padding={1} {...props}>{children}</Text>

const Objectives = ({table, initialEval}) => {
    const objectives = table.fields
        .filter(field => {
            const value = initialEval.getCellValue(field.name);
            return field.type === 'rating' &&
                // field.name !== 'Sleep Quality' &&
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
                        {objectives.map(obj =>
                            <tr style={{display: "flex", justifyContent: "space-between", margin: 5, width: "100%"}}
                                key={obj.name}>
                                <td style={{margin: 5}}>{obj.label}</td>
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

export const setLabel = (field, labelTag = "#LABEL#") => {
    const labelTags = (field.description?.match(new RegExp(labelTag, "g")) || []).length;
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
        <div>
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
        </div>
    );
}

const HTag = ({label, renderIcon, key}) => <>
    <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" flexBasis="content"
         margin={3} padding={2} key={key}>
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
            console.log('defaultExists', defaultExists);
            if (!attachmentsExist && defaultExists) attachmentsExist = defaultExists.getCellValue(attachmentField.id) ? defaultExists.getCellValue(attachmentField.id)[0] : null;
            if (!attachmentsExist) {
                return {
                    ...record,
                    label: displayName,
                    renderIcon: <Box display="flex" justifyContent="center" alignContent="center"
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
                renderIcon: <img key={attachmentObj.id} src={clientUrl} width={36} alt={record.name}/>
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
                        {tags && tags.length > 0 ? tags.map(tag =>
                            <HTag label={tag.label} renderIcon={tag.renderIcon} key={tag.id}/>
                        ) : <Text>Nenhum</Text>}
                    </Box>
                    : <Heading>Cannot find TAGS table. Add #TAGS# to table description to ensure it can be
                        found.</Heading>}
                </div>
            </DashboardTile>
        </>
    );
}

function Settings({table, xFieldValues, setFieldValue, value}) {

    const ref = React.forwardRef();

    const changeBackground = (e) => {
        e.target.style.background = '#F0F0F0';
    }
    const revertBackground = (e) => {
        e.target.style.background = 'white'
    }

    const TypeaheadMenu = (props) => {
        const {
            labelKey,
            newSelectionPrefix,
            options,
            paginationText,
            renderMenuItemChildren,
            text,
            ...menuProps
        } = props;


        const renderMenuItem = (option, position) => {
            console.log('option', option);
            if (option === undefined) return;
            const label = getOptionLabel(option, labelKey);

            const menuItemProps = {
                disabled: getOptionProperty(option, 'disabled'),
                label,
                option,
                position,
            };

            // if (option.customOption) {
            //     return (
            //         <MenuItem
            //             {...menuItemProps}
            //             key={position}
            //             label={label}>
            //             {newSelectionPrefix}
            //             <Highlighter search={text} className={"rbt-highlight-text"} style={{fontWeight: 'bold'}}>
            //                 {label}
            //             </Highlighter>
            //         </MenuItem>
            //     );
            // }

            if (option && option.paginationOption) {
                return (
                    <Fragment key="pagination-item">
                        <div style={{width: "100%", marginTop: 8, display: "flex", flexDirection: "column"}}
                             onMouseEnter={changeBackground} onMouseLeave={revertBackground}>
                            <MenuItem
                                {...menuItemProps}
                                className="rbt-menu-pagination-option"
                                style={{
                                    color: '#2D2D2D',
                                    textTransform: 'none',
                                    width: "100%",
                                    textAlign: 'center',
                                    borderTopColor: 'lightGrey',
                                    borderTopWidth: 1,
                                    borderTopStyle: 'solid',
                                    paddingTop: 4,
                                    paddingBottom: 4
                                }}
                                label={paginationText}>
                                {paginationText}
                            </MenuItem>
                        </div>
                    </Fragment>
                );
            }

            return (
                <MenuItem {...menuItemProps} key={position} onMouseEnter={changeBackground}
                          onMouseLeave={revertBackground}>
                    {renderMenuItemChildren(option, props, position)}
                </MenuItem>
            );
        };

        return (
            // Explictly pass `text` so Flow doesn't complain...
            <Menu {...menuProps} text={text}>
                {options.map(renderMenuItem)}
            </Menu>
        );
    };
    // console.log('xFieldValues', xFieldValues);

    loadCSSFromString('a, a:hover, a:focus {text-decoration: none; color: #2D2D2D;}');
    loadCSSFromString('mark { padding: 0; font-weight: bold; background: transparent; }')
    return (
        <Box display="flex" padding={3} borderBottom="thick" maxWidth={viewport.width}>
            {table && xFieldValues && xFieldValues.length > 0 && (<>
                    <FormField label="Valor do filtro" paddingRight={1} marginBottom={0}>
                        <Typeahead
                            ref={ref}
                            options={xFieldValues}
                            onChange={(newValue) => {
                                console.log('newValue', newValue);
                                globalConfig.setAsync(GlobalConfigKeys.X_PATIENT_EMAIL, newValue[0].email);
                                globalConfig.setAsync(GlobalConfigKeys.X_TYPEAHEAD_VALUE, newValue[0].label);
                                globalConfig.setAsync(GlobalConfigKeys.X_SELECTED_VALUE, JSON.stringify(newValue));
                                setFieldValue(newValue)
                            }}
                            id="react-bootstrap-typeahead"
                            open={undefined}
                            selected={value}
                            renderInput={({inputRef, referenceElementRef, ...inputProps}) => (
                                <InputSynced
                                    globalConfigKey={GlobalConfigKeys.X_TYPEAHEAD_VALUE}
                                    {...inputProps}
                                    ref={(input) => {
                                        inputRef(input);
                                        referenceElementRef(input);
                                    }}
                                />
                            )}
                            maxResults={2}
                            placeholder={"Encontre um paciente..."}
                            paginationText={"          Exibir resultados adicionais..."}
                            renderMenu={(results, menuProps) => {
                                console.log('results', results);
                                if (!results.length) {
                                    return null;
                                }
                                return <div style={{padding: 0}}>
                                    {console.log('in typeahead results', results)}
                                    <TypeaheadMenu
                                        options={results}
                                        labelKey="label"
                                        // ref={ref}
                                        paginate
                                        filterBy={['email', 'name']}
                                        flip
                                        // text={ref.current.state.text}
                                        text={globalConfig.get(GlobalConfigKeys.X_TYPEAHEAD_VALUE)}
                                        maxResults={50}
                                        {...menuProps}
                                        renderMenuItemChildren={(option, props, index) => (
                                            <Fragment>
                                                <div style={{padding: 12, backgroundColor: "white"}}>
                                                    <Highlighter search={props.text} style={{fontWeight: 'bold'}}>
                                                        {option[props.labelKey]}
                                                    </Highlighter>

                                                </div>
                                            </Fragment>
                                        )}>
                                    </TypeaheadMenu>
                                </div>
                            }}

                        />
                    </FormField>
                    <Button alignSelf="flex-end"
                            justifySelf="flex-end"
                            marginBottom={0} onClick={() => {
                        globalConfig.setAsync(GlobalConfigKeys.X_TYPEAHEAD_VALUE, undefined);
                        globalConfig.setAsync(GlobalConfigKeys.X_PATIENT_EMAIL, undefined);
                        globalConfig.setAsync(GlobalConfigKeys.X_SELECTED_VALUE, undefined);
                        setFieldValue(null);
                        ref.current.clear();
                    }}
                    >Limpar</Button>
                </>
            )}
        </Box>
    );
}

initializeBlock(() => <Dashboard/>);
