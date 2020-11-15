import {
    Box,
    Button,
    FormField,
    Heading,
    initializeBlock,
    InputSynced,
    loadCSSFromString,
    loadCSSFromURLAsync,
    useBase,
    useGlobalConfig,
    useViewport
} from '@airtable/blocks/ui';
import {DashboardTile} from "./components/dashboard_components/DashboardTile";
import NumericStats from "./components/dashboard_components/NumericStats";

import React, {Fragment, useEffect, useState} from 'react';
import {Highlighter, Menu, MenuItem, Typeahead} from 'react-bootstrap-typeahead';
import {globalConfig, viewport} from "@airtable/blocks";
import Charts from "./components/dashboard_charts";
import {getOptionLabel, getOptionProperty} from "react-bootstrap-typeahead/lib/utils";
import PatientInfo from "./components/dashboard_components/PatientInfo";
import MedHistory from "./components/dashboard_components/MedHistory";
import HealthTags from "./components/dashboard_components/HealthTags";
import Objectives from "./components/dashboard_components/Objectives";

loadCSSFromURLAsync('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'); // required for typeahead styling

export const GlobalConfigKeys = {
    TABLE_ID_EVALS: 'tableIdEvals',
    VIEW_ID_INITIAL: 'viewIdInitial',
    X_PATIENT_EMAIL: 'xPatientEmail',
    X_TYPEAHEAD_VALUE: 'xTypeaheadValue',
    X_INITIAL_EVAL_ID: 'xInitialEvalId',
    X_SELECTED_VALUE: 'xSelectedValue',
    X_CHARTS: 'xCharts'
};

function Dashboard() {

    const base = useBase();
    const globalConfig = useGlobalConfig();
    const viewport = useViewport();

    const [options, setOptions] = useState([]); // typeahead options
    const [value, setValue] = useState(null); // patient email value to filter records
    const [initialEval, setInitialEval] = useState(null); // initial eval record for patient email
    const [stateRecords, setStateRecords] = useState([]); // record filtered to patient email

    let table; // EVALUATIONS - #EVALS# tag
    let records;
    let tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID_EVALS);
    let patientEmail = globalConfig.get(GlobalConfigKeys.X_PATIENT_EMAIL);

    table = base.getTableByIdIfExists(tableId) || base.tables.filter(table => table.description.includes('#EVALS#')) ?
        base.tables.filter(table => table.description.includes('#EVALS#'))[0] : null;

    const canFindInitialEval = table && table.fields.filter(field => field.name === "Eval Type") &&
        table.fields.filter(field => field.name === "Eval Type").length > 0;

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
    const initialEvalView = table.getViewByNameIfExists('#INITIAL#');

    if (!initialEvalView) {
        return (returnError('Table is missing view with name #INITIAL# filtered to only the Initial Evaluations.'));
    }

    let xFieldId = table && table.fields.filter(field => field.description.includes('#EMAIL#')).length > 0 ?
        table.fields.filter(field => field.description.includes('#EMAIL#'))[0].id : null;

    const handleSetEval = (value) => {
        setInitialEval(value);
    }

    const handleSetValue = (value) => {
        setValue(value);
    }

    const handleSetOptions = async () => {
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
    }

    const setEvalInEffect = async () => {
        const queryRecords = await table.selectRecordsAsync();
        await queryRecords.loadDataAsync();
        records = queryRecords.records ? [...queryRecords.records].filter((record) => {
                if (patientEmail) return record.getCellValue(`${xFieldId}`) === patientEmail;
                return record;
            })
            : null;

        setStateRecords(records);
        if (patientEmail && records && records.length > 0) {
            const exists = records.find((record) =>
                record.getCellValue('Eval Type') === 'A'
                && record.getCellValue(`${xFieldId}`) === patientEmail);
            handleSetEval(exists);
        } else {
            handleSetEval(null);
        }
    }

    const handleSetValueInEffect = async () => {
        if (patientEmail) {
            const newSelectedValue = options.find(each => {
                return each.email === patientEmail
            })
            if (newSelectedValue) {
                handleSetValue([newSelectedValue]);
            }
        }
    }

    useEffect(() => {
        (async () => {
            await handleSetOptions();
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (table && initialEvalView) {
                if (xFieldId && !table.getFieldByIdIfExists(xFieldId)) xFieldId = null;
                await handleSetOptions();
                await setEvalInEffect();
            }
        })();
    }, [value]);

    useEffect(() => {
        (async () => {
            await handleSetValueInEffect();
            await handleSetOptions();
            await setEvalInEffect();
        })();
    }, [initialEval]);

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
                <Settings table={table} xFieldValues={options} setFieldValue={handleSetValue} />

                {value && initialEval && options && options.length > 0 ? (
                    <>
                        <Box position="relative" display="flex" flex="auto" flexWrap="wrap" padding={3}>
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
                            <Objectives style={{height: "fit-content"}} table={table} initialEval={initialEval}/>
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

function Settings({table, xFieldValues, setFieldValue}) {

    const ref = React.createRef();

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
            if (option === undefined) return;
            const label = getOptionLabel(option, labelKey);

            const menuItemProps = {
                disabled: getOptionProperty(option, 'disabled'),
                label,
                option,
                position,
            };

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
            <Menu {...menuProps} text={text}>
                {options.map(renderMenuItem)}
            </Menu>
        );
    };

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
                                if (newValue && newValue.length > 0) {
                                    globalConfig.setAsync(GlobalConfigKeys.X_PATIENT_EMAIL, newValue[0].email);
                                    globalConfig.setAsync(GlobalConfigKeys.X_TYPEAHEAD_VALUE, newValue[0].label);
                                } else {
                                    globalConfig.setAsync(GlobalConfigKeys.X_PATIENT_EMAIL, undefined);
                                    globalConfig.setAsync(GlobalConfigKeys.X_TYPEAHEAD_VALUE, undefined);
                                }
                                globalConfig.setAsync(GlobalConfigKeys.X_SELECTED_VALUE, JSON.stringify(newValue));
                                setFieldValue(newValue)
                            }}
                            id="react-bootstrap-typeahead"
                            open={undefined}
                            selected={xFieldValues.find(x => x.email === globalConfig.get(GlobalConfigKeys.X_PATIENT_EMAIL)) ?
                                [xFieldValues.find(x => x.email === globalConfig.get(GlobalConfigKeys.X_PATIENT_EMAIL))] : null}
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
                            maxResults={20}
                            placeholder={"Encontre um paciente..."}
                            paginationText={"Exibir resultados adicionais..."}
                            renderMenu={(results, menuProps) => {
                                if (!results.length) {
                                    return null;
                                }
                                return <div style={{padding: 0}}>
                                    <TypeaheadMenu
                                        options={results}
                                        labelKey="label"
                                        paginate
                                        filterBy={['email', 'name']}
                                        flip
                                        text={globalConfig.get(GlobalConfigKeys.X_TYPEAHEAD_VALUE)}
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
                            marginBottom={0}
                            onClick={() => {
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
