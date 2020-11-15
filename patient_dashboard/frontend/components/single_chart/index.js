import {
    Box,
    Button,
    ColorPalette,
    colors,
    colorUtils,
    FormField,
    Heading,
    Icon,
    Input,
    Select,
    useGlobalConfig
} from '@airtable/blocks/ui';
import React, {useEffect, useState} from 'react';
import {Bar} from 'react-chartjs-2';
import {GlobalConfigKeys} from "../../index";
import {setLabel} from "../../utils";

function SingleChart({table, deleteTable, id, records}) {

    const globalConfig = useGlobalConfig();
    const initialFieldObj = {field: null, chartOption: null, color: null};

    const [fieldSelectOptions, setFieldSelectOptions] = useState([]);
    const [fields, setFields] = useState([{...initialFieldObj}]);
    const [dateField, setDateField] = useState(null);
    const [chartTitle, setChartTitle] = useState(`Gráfico criado em ${new Date().toLocaleString()}`);
    const [editTitle, setEditTitle] = useState(false);

    const {data, options} = records && dateField && fields ? new_getChartData({records, fields, dateField, table}) : {};

    // set chart on load
    useEffect(() => {
        (async () => {
            let chartSaved = globalConfig.get([GlobalConfigKeys.X_CHARTS, id]);
            if (chartSaved) {
                let chartData = JSON.parse(chartSaved);
                if (chartData) {
                    setFields(chartData.fields);
                    setChartTitle(chartData.chartTitle);
                }
            }
        })();
    }, []);

    // save to globalConfig for chart at id on changes
    useEffect(() => {
        (async () => {
            let chartJson = JSON.stringify({fields, chartTitle});
            let path = [GlobalConfigKeys.X_CHARTS, id];
            await globalConfig.setPathsAsync([{path, value: chartJson}])
        })();
    }, [chartTitle, fields]);

    useEffect(() => {
        (async () => {
            const dateFieldTemp = table &&
            table.fields.filter(field => field.description?.includes('#DATE#')) ?
                table.fields.filter(field => field.description?.includes('#DATE#'))[0]
                : null;
            setDateField(dateFieldTemp);

            if (table) {
                const tempFieldOptions = table.fields.filter(field => field.description?.includes('#CHART#')).map(field => {
                    return {
                        ...setLabel(field),
                        value: field.id
                    }
                });
                setFieldSelectOptions([...tempFieldOptions]);
            }
        })();
    }, [table, records, fields]);


    const handleSetFields = (field, index) => {
        fields[index] = field;
        setFields([...fields]);
    }

    const deleteField = (index) => {
        if (fields.length === 1) {
            setFields([{...initialFieldObj}]);
            return;
        }
        fields.splice(index, 1);
        setFields([...fields]);
    }

    const addField = () => {
        setFields([...fields, {...initialFieldObj}]);
    }

    const atLeastOneMetric = () => {
        let flag = false;
        for (const f of fields) {
            if (f.field && f.color && f.chartOption) flag = true;
        }
        return flag;
    }

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
            <Settings table={table} fieldOptions={fieldSelectOptions} filters={fields} setFields={handleSetFields}
                      deleteTable={deleteTable}
                      deleteField={deleteField} id={id} addField={addField}
                      chartTitle={chartTitle} setChartTitle={setChartTitle}
                      editTitle={editTitle} setEditTitle={setEditTitle}
            />
            {data && options && atLeastOneMetric() && (
                <Box position="relative" flex="auto" padding={3}>
                    <Bar data={data} options={options}/>
                </Box>
            )}
        </Box>
    );
}

function new_getChartData({records, fields, dateField, table}) {

    const datasets = [];

    for (const [index, f] of fields.entries()) {
        if (!f.field || !f.color || !f.chartOption) {
            continue;
        }
        const fieldObj = table.fields.find(field => field.id === f.field);
        const fieldWithLabel = setLabel(fieldObj);

        datasets[index] = {};
        datasets[index].labels = [];
        datasets[index].data = [];
        datasets[index].label = fieldWithLabel.label || table.getFieldByIdIfExists(f.field).name;
        datasets[index].backgroundColor = f.hex;
        datasets[index].borderColor = f.hex;
        datasets[index].strokeColor = f.hex;
        datasets[index].fillColor = f.hex;
        datasets[index].type = f.chartOption;
        datasets[index].yAxisID = f.field;
        datasets[index].showLine = true;
        datasets[index].spanGaps = true;
        datasets[index].fill = true;
        datasets[index].rating = fieldObj.type === 'rating';

        for (const record of records) {
            const yValue = record.getCellValue(f.field);
            const date = dateField ? record.getCellValue(dateField.id) : null;
            if (yValue) {
                datasets[index].data.push({y: yValue, x: date});
            }
        }
    }
    const options = {
        maintainAspectRatio: true,
        scales: {
            yAxes: [...datasets.map((d, index) => {
                return {
                    type: 'linear',
                    display: true,
                    position: index === 0 ? 'left' : 'right',
                    label: d.label,
                    id: d.yAxisID,
                    ticks: {
                        beginAtZero: d.rating
                    }
                }
            })
            ],
            xAxes: [
                {
                    type: 'time',
                    scaleLabel: {
                        display: true,
                        labelString: 'Data'
                    },
                    time: {
                        displayFormats: {
                            day: 'YYYY-MM-DD',
                            hour: 'MMM-DD HH:mm A',
                            minute: 'MMM-DD HH:mm A',
                            second: 'MMM-DD HH:mm A'
                        },
                        minUnit: 'second'
                    }
                }
            ],
        },
        legend: {
            display: true,
        },
        plugins: {
            filler: {
                propagate: true
            }
        }
    };

    const data = {
        datasets: [...datasets],
    };
    return {data, options};
}

function Settings({table, filters, setFields, deleteField, deleteTable, id, addField, fieldOptions, chartTitle, setChartTitle, editTitle, setEditTitle}) {

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
                    {editTitle ? <div style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            maxWidth: 450,
                            width: "-webkit-fill-available"
                        }}>
                            <Input
                                value={chartTitle}
                                onChange={e => setChartTitle(e.target.value)}
                            />
                            <Icon justifySelf={"flex-start"} alignSelf={"center"} marginLeft={1} paddingBottom={1}
                                  onClick={() => setEditTitle(false)} name={"check"} size={20} fillColor={"green"}/></div>
                        : <div style={{display: "flex", justifyContent: "flex-start", maxWidth: 450}}><Heading
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
                                    <Select value={filter.field} options={fieldOptions}
                                            onChange={field => setFields({...filter, field}, index)}/>
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
