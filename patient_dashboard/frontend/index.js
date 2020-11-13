import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    Box,
    FormField,
    Select, Text, Label, Icon, useViewport, Heading, Button, Input
} from '@airtable/blocks/ui';
import React, {Fragment, useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {Highlighter, Typeahead, useItem} from 'react-bootstrap-typeahead';
import moment from 'moment';
import {viewport} from "@airtable/blocks";
import Charts from "./components/dashboard_charts";
import {Menu} from "react-bootstrap-typeahead";
import {MenuItem} from "react-bootstrap-typeahead";
import {TypeaheadMenu} from "react-bootstrap-typeahead";

function Dashboard() {
    const base = useBase();

    let records;
    const table = base && base.tables.filter(table => table.description.includes('#EVALS#')) ?
        base.tables.filter(table => table.description.includes('#EVALS#'))[0] : null;
    console.log('evalTableExists', table);

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

    const [options, setOptions] = useState([]);
    const [value, setValue] = useState(null);
    const [initialEval, setInitialEval] = useState(null);
    const [stateRecords, setStateRecords] = useState([]);

    const handleSetEval = (value) => {
        console.log('handleSetEval value', value);
        setInitialEval(value);
    }

    const handleSetValue = (value) => {
        console.log('handleSetValue value', value);
        setValue(value);
    }

    useEffect(() => {
        (async () => {
            if (table && initialEvalView) {
                if (xFieldId && !table.getFieldByIdIfExists(xFieldId)) xFieldId = null;
                if (xFieldId) {
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
                        // console.log('uniqueSet.values()', uniqueSet.values());
                        const finalArray = [...uniqueSet.values()].map((each) => {
                            return {label: `${each.name} (${each.email})`, id: each.email, name: each.name, email: each.email};
                        })
                        setOptions(finalArray);
                    }
                    const queryRecords = await table.selectRecordsAsync();
                    await queryRecords.loadDataAsync();
                    records = queryRecords ? queryRecords.records.filter((record) => {
                            if (value && value.length > 0) return record.getCellValue(`${xFieldId}`) === value[0].email;
                            return record;
                        })
                        : null;
                    setStateRecords(records);
                    // console.log('records.length', records.length);
                    if (value && value.length > 0 && records && records.length > 0) {
                        const exists = records.find((record) =>
                            record.getCellValue('Eval Type') === 'A'
                            && record.getCellValue(`${xFieldId}`) === value[0].email);
                        // console.log('exists', exists);
                        handleSetEval(exists);
                    } else {
                        handleSetEval(null);
                    }
                }
            }
        })();
    }, [table, xFieldId, value]);

    const selected = value;
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
                <Settings table={table} xFieldValues={options} setFieldValue={handleSetValue}
                          value={value}/>
                {selected && initialEval ? (
                    <>
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
                                <Objectives table={table} initialEval={initialEval}/>
                            </div>
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
            <DashboardTile>
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
            // console.log('tag', tag);
            const record = tagsTable.selectRecords().getRecordById(tag.id);
            const displayName = record.getCellValueAsString(displayNameField.id);
            const attachmentsExist = record.getCellValue(attachmentField.id);
            if (!attachmentsExist) {
                return {
                    ...record,
                    label: displayName,
                    renderIcon:
                        <Box display="flex" justifyContent="center" alignContent="center"
                             style={{backgroundColor: "#FBDEDE", height: 36, width: 36, borderRadius: 36}}>
                            <span style={{color: "#EA5A5A", fontWeight: "bold", alignSelf: "center"}}>?</span>
                        </Box>
                }
            }
            const attachmentObj = record.getCellValue(attachmentField.id)[0];
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
            <DashboardTile>
                <Label>TAGS DE SAÚDE / CONDIÇÃO</Label>
                <div>{tagsTable ?
                    <Box display="flex" flexWrap="wrap" maxWidth={300}
                         style={{display: "flex", justifyContent: "space-evenly", marginTop: 12, flexWrap: "wrap"}}>
                        {tags && tags.length > 0 ? tags.map(tag =>
                                // <div>
                                <HTag label={tag.label} renderIcon={tag.renderIcon} key={tag.id}/>
                            // </div>
                        ) : <Text>Nenhum</Text>}
                    </Box>
                    : <Heading>Cannot find TAGS table. Add #TAGS# to table description to ensure it can be
                        found.</Heading>}
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

function Settings({table, xFieldValues, setFieldValue, value, handleResetValues}) {
    console.log('xFieldValues', xFieldValues);
    const ref = React.forwardRef(undefined);
    return (
        <Box display="flex" padding={3} borderBottom="thick" maxWidth={viewport.width}>
            {table && xFieldValues && xFieldValues.length > 0 && (<>
                <FormField label="Valor do filtro" paddingRight={1} marginBottom={0}>
                    <Typeahead
                        style={{borderColor: "black", borderWidth: 1}}
                        ref={ref}
                        options={xFieldValues}
                        // minLength={2}
                        highlightOnlyResult
                        labelKey="label"
                        onChange={(newValue) => {
                            console.log('newValue', newValue);
                            setFieldValue(newValue)
                        }}
                        id="react-bootstrap-typeahead"
                        open={undefined}
                        filterBy={['email', 'name']}
                        flip
                        selected={value}
                        positionFixed={true}
                        renderInput={({inputRef, referenceElementRef, ...inputProps}) => (
                            <Input
                                {...inputProps}
                                ref={(input) => {
                                    inputRef(input);
                                    referenceElementRef(input);
                                }}
                            />
                        )}
                        renderMenu={(results, menuProps) => {
                            if (!results.length) {
                                return null;
                            }
                            console.log('results', results);
                            return <div style={{borderColor: "black", borderWidth: 1}}><TypeaheadMenu options={results} labelKey="label" ref={ref}
                                                  {...menuProps}
                                                  renderMenuItemChildren={(option, { text }, index) => (
                                                      <Fragment>
                                                          <div style={{padding: 12, backgroundColor: "white"}}>
                                                              <Highlighter search={text}>
                                                                  {option.label}
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
