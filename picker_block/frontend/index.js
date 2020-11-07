import {initializeBlock, TablePicker, useBase, ViewPicker, Select, useRecords} from '@airtable/blocks/ui';
import React, {useState, useEffect} from 'react';



function HelloWorldApp() {
    // YOUR CODE GOES HERE
    const [table, setTable] = useState();
    const [view, setView] = useState();
    const [value, setValue] = useState();
    const [options, setOptions] = useState([]);
    let records;

    useEffect( () => {
        (async () => {
            if (table && view) {
                const query = await table.selectRecordsAsync();
                await query.loadDataAsync();
                records = query.records;
                if (records && records.length > 0) setOptions(records.map((record) => {
                    console.log('record', record);
                    console.log('record.getCellValue(Email)', record.getCellValue('Email'));
                    return {value: record.getCellValue('Email'), label: record.getCellValue('Email')}}));
            }
        })();
    }, [table, view]);

    return <><div>Hello world 🚀 Yes</div>
        <TablePicker
            table={table}
            onChange={newTable => setTable(newTable)}
            width="320px"
        />
        <ViewPicker
            table={table}
            view={view}
            onChange={newView => setView(newView)}
            width="320px"
            disabled={(table === undefined)}
        />
        <Select
            options={options}
            value={value}
            onChange={newValue => setValue(newValue)}
            width="320px"
            disabled={(table === undefined && view === undefined)}
        />
    </>;
}

initializeBlock(() => <HelloWorldApp />);
