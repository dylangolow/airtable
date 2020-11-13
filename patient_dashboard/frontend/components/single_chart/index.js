import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    Box,
    FormField, FieldPicker, Button,
} from '@airtable/blocks/ui';
import React, {useEffect, useState} from 'react';

// This app uses chart.js and the react-chartjs-2 packages.
// Install them by running this in the terminal:
// npm install chart.js react-chartjs-2
import {Bar} from 'react-chartjs-2';

const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    VIEW_ID: 'viewId',
    X_FIELD_ID: 'xFieldId',
};

function SingleChart({table, deleteTable, id, records}) {

    const [xField, setXField] = useState(null);

    const [dateField, setDateField] = useState(null);

    useEffect(() => {
        (async () => {
            const dateFieldTemp = table &&
            table.fields.filter(field => field.description?.includes('#DATE#')) ?
                table.fields.filter(field => field.description?.includes('#DATE#'))[0]
                : null;
            setDateField(dateFieldTemp);
        })();
    }, [table, records]);

    // const data = records && xField ? getChartData({records, xField}) : null;
    const data = records && xField ? new_getChartData({records, xField, dateField}) : null;
    let timeFormat = 'MM/DD/YYYY HH:mm';

    return (
        <Box
            position="relative"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            flexDirection="column"
            minWidth={400}
            maxWidth={600}
            border="default"
            borderRadius="large"
            margin={2}

        >
            <Settings table={table} xField={xField} setXField={setXField} deleteTable={deleteTable} id={id}/>
            {data && (
                <Box position="relative" flex="auto" padding={3}>
                    <Bar
                        data={data}
                        options={{
                            maintainAspectRatio: false,
                            scales: {
                                yAxes: [
                                    {
                                        ticks: {
                                            beginAtZero: true,
                                        },
                                    },
                                ],
                                xAxes: [
                                    {
                                        type: 'time',
                                        distribution: 'series',
                                        time: {
                                            unit: 'day',
                                            // displayFormats: {
                                            //     day: 'MMM D'
                                            // },
                                            // format: 'MMM D hA',
                                        },
                                        ticks: {
                                            source: 'auto'
                                        },
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
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}

function new_getChartData({records, xField, dateField}) {
    const recordsByXValueString = new Map();
    const labels = [];
    const points = [];
    console.log('dateField', dateField);
    for (const record of records) {
        console.log('record', record);
        const yValue = record.getCellValue(xField);
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
        if (yValue !== null && date) {
            points.push({y: yValue, t: new Date(date)});
            labels.push(date.toString());
        }
    }
    console.log('points', points);
    // for (const [xValueString, records] of recordsByXValueString.entries()) {
    //     const label = xValueString === null ? 'Empty' : xValueString;
    //     labels.push(label);
    //     points.push(records.length);
    // }

    const data = {
        labels,
        datasets: [
            {
                label: xField.name,
                backgroundColor: '#4380f1',
                data: points,
            },
        ],
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

function Settings({table, xField, setXField, deleteTable, id}) {
    return (
        <Box display="flex" padding={3} borderBottom="thick" width="100%" justifyContent="space-between">
            {table && (
                <>
                    <FormField label="Eixo Y" width="33.33%" paddingLeft={1} marginBottom={0}>
                        <FieldPicker
                            table={table}
                            field={xField}
                            onChange={newField => setXField(newField)}
                        />
                    </FormField>
                </>
            )}
            <Button
                onClick={() => deleteTable(id)}
                alignSelf="flex-end"
                justifySelf="flex-end"
                marginBottom={0}
            >
                Remover
            </Button>
        </Box>
    );
}

export default SingleChart;
