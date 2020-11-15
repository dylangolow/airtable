import React, {useEffect, useState} from 'react';
import SingleChart from '../single_chart'
import {Box, Button, useGlobalConfig} from '@airtable/blocks/ui';
import {GlobalConfigKeys} from "../../index";

function getCharts({table, records}) {

    const globalConfig = useGlobalConfig();

    useEffect(() => {
            (async () => {
                let chartSaved = globalConfig.get([GlobalConfigKeys.X_CHARTS]);
                // console.log('chartSaved', chartSaved);
                if (chartSaved) {
                    // let chartData = JSON.parse(chartSaved);
                    let keys = Object.keys(chartSaved);
                    // console.log('keys', keys);
                    if (keys.length > 0) {
                        setCharts([...keys.map(each => {
                            return {id: each}
                        })])
                    }
                }
            })();
        }, []);

    const [charts, setCharts] = useState([]);

    const handleAddChart = () => {
        // console.log('Chart add');
        setCharts([...charts, {id: 'chart-' + new Date().getTime()}]);
        // console.log('charts in add', charts);
    }

    const handleDeleteTable = (id) => {
        // console.log('charts', JSON.stringify(charts));
        // console.log('Delete chart ' + id);
        // console.log('charts.findIndex(each => each.id === index)', charts.findIndex(each => each.id === id));
        charts.splice(charts.findIndex(each => each.id === id), 1);
        setCharts([...charts]);
        // console.log('charts after delete', JSON.stringify(charts));
        globalConfig.setPathsAsync([{path: [GlobalConfigKeys.X_CHARTS, id], value: undefined}]);
    }

    return (
        <><Box margin={0} display="flex" flexWrap="wrap">
            {charts && charts.length > 0 ?
                charts.map((chart, index) => <SingleChart key={chart.id} id={chart.id} table={table} records={records} deleteTable={handleDeleteTable} index={index+1} />)
                : null}
        </Box>
            <Button style={{margin: 20}} onClick={() => handleAddChart()}>Add Chart</Button>
        </>
    );
}

export default getCharts;
