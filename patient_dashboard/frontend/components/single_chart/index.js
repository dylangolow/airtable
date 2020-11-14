import {
    Box,
    Button,
    ColorPalette,
    colors, colorUtils,
    FieldPicker,
    FormField,
    Heading,
    Icon, Input,
    Select,
    Text
} from '@airtable/blocks/ui';
import React, {useEffect, useState} from 'react';

// This app uses chart.js and the react-chartjs-2 packages.
// Install them by running this in the terminal:
// npm install chart.js react-chartjs-2
import {Bar, Line} from 'react-chartjs-2';

const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    VIEW_ID: 'viewId',
    X_FIELD_ID: 'xFieldId',
    X_PATIENT_EMAIL: 'xPatientEmail'
};

function SingleChart({table, deleteTable, id, records}) {

    const initialFieldObj = {field: null, chartOption: null, color: null};

    const [fieldSelectOptions, setFieldSelectOptions] = useState([]);

    const [xField, setXField] = useState(null);
    const [fields, setFields] = useState([{...initialFieldObj}]);

    const [dateField, setDateField] = useState(null);

    const handleSetFields = (field, index) => {
        setData(null);
        console.log('field', field);
        fields[index] = field;
        console.log('fields[index]', fields[index]);
        // const newFieldObj = {...fields, field};
        setFields([...fields]);
        console.log('fields', fields);
    }

    const deleteField = (index) => {
        if (fields.length === 1) {
            setFields([{...initialFieldObj}]);
            return;
        }
        console.log('delete field', index);
        const removeField = fields.splice(index, 1);
        console.log('removeField', removeField);
        setFields([...fields]);
    }

    const addField = () => {
        setFields([...fields, {...initialFieldObj}]);
    }

    const [data, setData] = useState(null);
    const [options, setOptions] = useState(undefined);


    useEffect(() => {
        (async () => {
            const dateFieldTemp = table &&
            table.fields.filter(field => field.description?.includes('#DATE#')) ?
                table.fields.filter(field => field.description?.includes('#DATE#'))[0]
                : null;
            setDateField(dateFieldTemp);
            const newData = records && atLeastOneMetric() ? new_getChartData({records, fields, dateField, table}) : null;
            setData({...newData});

            if (table) {
                const tempFieldOptions = table.fields.filter(field => field.description?.includes('#CHART#')).map(field => {
                    return {
                        label: field.name,
                        value: field.id
                    }
                });
                setFieldSelectOptions([...tempFieldOptions]);
            }

        })();
    }, [table, records, fields]);
    const atLeastOneMetric = () => {
        let flag = false;
        for (const f of fields) {
            if (f.field && f.color && f.chartOption) flag = true;
            // if (!f.field || !f.color || !f.chartOption) {
            //     setData(null);
            //     return false;
            // }
        }
        return flag;
    }
    // const [data, setData] = useState(null);
    // const data = records && xField ? getChartData({records, xField}) : null;
    // const data = records && atLeastOneMetric() ? new_getChartData({records, fields, dateField}) : null;
    let timeFormat = 'MM/DD/YYYY HH:mm';



    useEffect(() => {
            (async () => {

                if (data && atLeastOneMetric()) {
                    const tempOptions = {
                        maintainAspectRatio: true,
                        scales: {
                            yAxes: [...data.datasets.map((d, index) => {
                                return {
                                    // ticks: {
                                    //     major: true,
                                    //     minor: false
                                    //     // beginAtZero: true,
                                    //
                                    // },
                                    type: 'linear',
                                    display: true,
                                    // position: index === 0 ? 'left' : 'right',
                                    id: d.yAxisID

                                }
                            })

                            ],
                            xAxes: [
                                {
                                    type: 'time',
                                    // distribution: 'linear',
                                    // time: {
                                    //     unit: 'day',
                                    // displayFormats: {
                                    //     day: 'MMM D'
                                    // },
                                    // format: 'MMM D hA',
                                    // },
                                    // ticks: {
                                    //     source: 'auto'
                                    // },
                                    scaleLabel: {
                                        display: true,
                                        labelString: 'Date'
                                    }
                                }
                            ],
                        },
                        legend: {
                            display: true,

                        },
                        // maintainAspectRatio: true
                    };
                    setOptions({...tempOptions});
                }


            })();
        }, [data, fields]);

    return (
        <Box
            position="relative"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            flexDirection="column"
            minWidth={600}
            maxWidth={1000}
            border="default"
            borderRadius="large"
            margin={2}
            padding={1}

        >
            <Settings table={table} fieldOptions={fieldSelectOptions} filters={fields} setFields={handleSetFields} deleteTable={deleteTable}
                      deleteField={deleteField} id={id} addField={addField}/>
            {data && options && atLeastOneMetric() && (
                <Box position="relative" flex="auto" padding={3} >
                    {console.log('options',options)}
                    {/*{data.datasets && data.datasets.length > 0 &&*/}
                        <Bar data={data} options={options}/>
                    {/*// :*/}
                    {/*//     <Line data={data} options={options} />*/}
                    {/*}*/}


                </Box>
            )}
        </Box>
    );
}

function new_getChartData({records, fields, dateField, table}) {
    const recordsByXValueString = new Map();

    const datasets = [];
    console.log('dateField', dateField);

    for (const [index, f] of fields.entries()) {
        console.log('f', f);
        if (!f.field || !f.color || !f.chartOption) {
            console.log('found empty filter')
            continue;
        }

        datasets[index] = {};
        datasets[index].labels = [];
        datasets[index].data = [];
        datasets[index].label = f.field.name || table.getFieldByIdIfExists(f.field).name;
        datasets[index].backgroundColor = f.hex;
        datasets[index].type = f.chartOption;
        datasets[index].yAxisID = f.field;
        for (const record of records) {
            console.log('record', record);

            // const labels = [];
            // const data = [];
            const yValue = record.getCellValue(f.field) || 0;
            // const date = record.createdTime;
            const date = dateField ? record.getCellValue(dateField.id) : null;
            console.log('date', date);
            console.log('yValue', yValue);
            // const xValueString = xValue === null ? null : record.getCellValue(xField);

            // if (!recordsByXValueString.has(xValueString)) {
            //     recordsByXValueString.set(xValueString, [record]);
            // } else {
            //     recordsByXValueString.get(xValueString).push(record);
            // }
            if (fields.length === 1 && yValue === 0) {
                continue;
            }
            datasets[index].data.push({y: yValue, x: date});
            // datasets[index].labels.push(date.toString());

            console.log('data', datasets[index].data);
        }
    }
    console.log('datasets', datasets);

    // for (const [xValueString, records] of recordsByXValueString.entries()) {
    //     const label = xValueString === null ? 'Empty' : xValueString;
    //     labels.push(label);
    //     points.push(records.length);
    // }

    const data = {
        // labels: datasets[0].labels,
        datasets: [...datasets],
    };
    return data;
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

function Settings({table, filters, setFields, deleteField, deleteTable, id, addField, fieldOptions}) {
    const [chartTitle, setChartTitle] = useState(`Chart #${id}`);
    const [editTitle, setEditTitle] = useState(false);
    const chartOptions = [
        {label: 'Linha', value: 'line'},
        {label: 'Barra', value: 'bar'}
    ]

    const allowedColors = [
        colors.BLUE,
        colors.BLUE_BRIGHT,
        colors.BLUE_DARK_1,
        colors.BLUE_LIGHT_1,
        colors.BLUE_LIGHT_2
    ];

    return (
        <>

            <Box display="flex" padding={3} borderBottom="thick" width="100%" justifyContent="space-between"
                 flexDirection={"column"}>
                <Box display="flex" width="100%" marginBottom={3} justifyContent="space-between">
                    {editTitle ? <div style={{display: "flex", justifyContent: "flex-start", maxWidth: 400}}><Input

                            value={chartTitle}
                            onChange={e => setChartTitle(e.target.value)}
                        /><Icon justifySelf={"flex-start"} alignSelf={"center"} marginLeft={1} paddingBottom={1}
                                onClick={() => setEditTitle(false)} name={"check"} size={20} fillColor={"green"}/></div>
                        : <div style={{display: "flex", justifyContent: "flex-start", maxWidth: 400}}><Heading
                            alignSelf={"flex-start"}
                            justifySelf={"flex-start"}
                        >
                            {chartTitle}
                        </Heading> <Icon justifySelf={"flex-start"} alignSelf={"center"} marginLeft={2} marginBottom={2}
                                         onClick={() => setEditTitle(true)} name={"edit"} size={16} fillColor={"grey"}/>
                        </div>
                    }
                    <Button
                        onClick={() => deleteTable(id)}
                        alignSelf="flex-start"
                        justifySelf="flex-end">
                        Remover
                    </Button>
                </Box>

                {table && (
                    <div style={{display: "flex", flexDirection: "column"}}> {filters && filters.map((filter, index) =>
                        <div style={{display: "flex", flexDirection: "row"}} key={index}>
                            {index === 0 && filters.length === 1 &&
                            <Icon onClick={() => addField()} alignSelf="flex-end" justifySelf="flex-end" name={"plus"}
                                  size={20} marginRight={1} style={{marginBottom: 6}} padding={0} fillColor={"grey"}/>
                            }
                            <div>
                                <FormField label={index === 0 ? "Eixo Y" : ""} minWidth={150} maxWidth={200}
                                           paddingLeft={0} marginBottom={0}>
                                    <Select value={filter.field} options={fieldOptions} onChange={field => setFields({...filter, field}, index)} />
                                    {/*<FieldPicker*/}
                                    {/*    table={table}*/}
                                    {/*    field={filter.field}*/}
                                    {/*    onChange={field => setFields({...filter, field}, index)}*/}
                                    {/*/>*/}
                                </FormField></div>

                            <div><FormField label={index === 0 ? "Tipo de Gráfico" : ""} minWidth={150} maxWidth={200}
                                            paddingLeft={1} marginBottom={0}>
                                <Select
                                    options={chartOptions}
                                    value={filter?.chartOption || null}
                                    onChange={chartOption => setFields({...filter, chartOption}, index)}
                                /></FormField></div>
                            <div><FormField label={index === 0 ? "Cor" : ""} minWidth={150} maxWidth={200}
                                            paddingLeft={4} paddingRight={4} marginBottom={0}>
                                <ColorPalette
                                    style={{paddingTop: 6}}
                                    alignSelf={"center"}
                                    allowedColors={allowedColors}
                                    color={filter?.color || null}
                                    onChange={color => setFields({
                                        ...filter,
                                        color,
                                        hex: colorUtils.getHexForColor(color)
                                    }, index)}
                                    squareMargin={8}
                                    width="150px"
                                /></FormField></div>
                            <Icon onClick={() => deleteField(index)} alignSelf="flex-end" justifySelf="flex-end"
                                  name={filters.length === 1 ? "redo" : "x"} size={20} style={{marginBottom: 8}}
                                  fillColor={"grey"}/>
                        </div>)}
                    </div>
                )}

            </Box>
        </>
    );
}

export default SingleChart;
