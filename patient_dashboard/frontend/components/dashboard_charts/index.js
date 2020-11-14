import React, {useState} from 'react';
import SingleChart from '../single_chart'
import {Box, Button} from '@airtable/blocks/ui';

function getCharts({table, records, initialEval}) {

    const [charts, setCharts] = useState([]);

    const handleAddChart = () => {
        console.log('Chart add');
        setCharts([...charts, {id: charts.length}]);
        console.log('charts in add', charts);
    }

    const handleDeleteTable = (index) => {
        console.log('charts', JSON.stringify(charts));
        console.log('Delete chart ' + index);
        console.log('charts.findIndex(each => each.id === index)', charts.findIndex(each => each.id === index));
        charts.splice(charts.findIndex(each => each.id === index), 1);
        setCharts([...charts]);
        console.log('charts after delete', JSON.stringify(charts));
    }

    return (
        <><Box margin={0} display="flex" flexWrap="wrap">
            {charts && charts.length > 0 ?
                charts.map((chart) => <SingleChart id={chart.id} table={table} records={records} deleteTable={handleDeleteTable} />)
                : null}
        </Box>
            <Button style={{margin: 20}} onClick={() => handleAddChart()}>Add Chart</Button>
        </>
    );
}

export default getCharts;
