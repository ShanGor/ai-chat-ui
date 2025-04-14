/*
 * COPYRIGHT (c). HSBC HOLDINGS PLC 2024. ALL RIGHTS RESERVED.
 *
 * This software is only to be used for the purpose for which it has been
 * provided. No part of it is to be reproduced, disassembled, transmitted,
 * stored in a retrieval system nor translated in any human or computer
 * language in any way or for any other purposes whatsoever without the prior
 * written consent of HSBC Holdings plc.
 */

import {useEffect, useState} from 'react';
import {Table} from "antd";
import {countCharacterOccurrences, parseCSV} from "../Utility.js"

// eslint-disable-next-line react/prop-types
const MarkdownCsvShow = ({csv}) => {
    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        position: ['bottomLeft'],
        current: 1,
        pageSize: 10,
        totalBoundaryShowSizeChanger: true
    })

    useEffect(() => {
        if (!csv) return;
        // eslint-disable-next-line react/prop-types
        const lines = csv.split('\n');
        const headerLine = lines[0];
        let separator = ',';
        if (countCharacterOccurrences(headerLine, "|") > 1) {
            separator = '|';
        }

        const rows = parseCSV(csv, separator)
        const headerRow = rows[0]

        headerRow.map((header, index) => ({
            title: header.trim().trim("\""),
            dataIndex: `col${index}`,
            key: `col${index}`,
        })).forEach((column) => {
            setColumns((prev) => [...prev, column]);
        });

        if (rows.length < 2) {
            setData([])
            return
        }

        rows.slice(1).forEach((row, rowIndex) => {
            const rowData = {};
            // row.split(separator)
            row.forEach((cell, cellIndex) => {
                rowData[`col${cellIndex}`] = cell.trim();
            });
            setData((prev) => [...prev, {...rowData, key: rowIndex}]);
        });
    }, []);

    // can have 4 parameters: pagination, filters, sorter, extra
    const tableActions = (pagination) => {
        setPagination(pagination)
    }

    return (<div style={{width: '100%', overflowX: "scroll"}}>
        <Table columns={columns}
               dataSource={data}
               onChange={tableActions}
               pagination={pagination}
               size="small" />
    </div>);
};

export default MarkdownCsvShow;