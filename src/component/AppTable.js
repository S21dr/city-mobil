import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Table, Input, message} from 'antd';
import Highlighter from 'react-highlight-words';

export const AppTable = () => {

    const [baseData, setBaseData] = useState([])
    const [filterTable, setFilterTable] = useState(null)
    const [columns, setColumns] = useState([])
    const [columnsData, setColumnsData] = useState([])
    const [selectedRow, setSelectedRow] = useState(null)
    const [selectedRowYear, setSelectedRowYear] = useState(null)
    const [loadTableData, setLoadTableData] = useState(false)

    const inputRef = useRef()

    const getData = async () => {
        setLoadTableData(true)
        try {
            const res = await fetch('https://city-mobil.ru/api/cars')
            const data = await res.json()

            if (data) {
                let tariffs_list = data.tariffs_list
                tariffs_list = ["Марка и модель", ...tariffs_list]
                setColumnsData(tariffs_list)

                const newData = data.cars.map((car, i) => {
                    let newEl = {}
                    tariffs_list.forEach(tariffs => {
                        newEl[tariffs] = 0
                    })
                    for (let key in car.tariffs) {
                        newEl[key] = car.tariffs[key].year
                    }
                    newEl.key = i
                    newEl["Марка и модель"] = `${car.mark} ${car.model}`
                    return newEl
                })
                setBaseData(newData)
            }

        } catch (e) {
            message.error(e?.message || "Произошла ошибка при загрузке Таблицы, поробуйте перезагрузить страницу");
        }
        setLoadTableData(false)
    }


    const renderCol = useCallback((text) => {
        if (!filterTable) {
            return text || '—'
        }
        return (
            text ? <Highlighter
                highlightStyle={{backgroundColor: '#ffc069', padding: 0}}
                searchWords={[inputRef.current.state.value]}
                autoEscape
                textToHighlight={text ? text.toString() : ''}
            /> : '—'
        )
    }, [filterTable])


    const search = (val) => {
        if (val) {
            const newFilterTable = baseData.filter(o => {
                    for (let key in o) {
                        if (key !== 'key') {
                            const findVal = String(o[key])
                                .toLowerCase()
                                .includes(val.toLowerCase())
                            if (findVal) {
                                return true
                            }
                        }
                    }
                    return false
                }
            )
            setFilterTable(newFilterTable)
        } else {
            setFilterTable(null)
        }

    }


    const getOnClickText = (record) => {
        if (record) {
            let year = null
            for (let key in record) {
                if (record[key] && key !== "Марка и модель") {
                    year = record[key]
                    break
                }
            }
            setSelectedRowYear(year)
        }
    }


    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {

        setColumns(columnsData.map(el => {
            const newEl = {
                title: el,
                dataIndex: el,
                fixed: el === "Марка и модель" && 'left',
                align: el === "Марка и модель" ? "left" : "center",
                sortDirections: ['descend', 'ascend'],
                sorter: el === "Марка и модель" ? (a, b) => a[el].localeCompare(b[el]) : (a, b) => a[el] - b[el],
                render: renderCol
            }
            return newEl
        }))
    }, [columnsData, filterTable, renderCol])


    return (
        <>
            <Input.Search
                placeholder="Поиск"
                enterButton
                ref={inputRef}
                onSearch={search}
            />
            <Table
                loading={loadTableData}
                columns={columns}
                dataSource={filterTable == null ? baseData : filterTable}
                pagination={false}
                onRow={(record, rowIndex) => {
                    return {
                        onClick: (event) => {
                            setSelectedRow(record)
                            getOnClickText(record)
                        },
                    };
                }}
                rowClassName={(record) => {
                    return record?.key === selectedRow?.key ? 'clickRowStyl' : ''
                }}
                bordered
                scroll={{y: '100%', x: 1500}}
            />
            <div className={'selectedRow'}>
                {
                    selectedRow
                        ? (setSelectedRowYear
                            ? `Выбран автомобиль ${selectedRow["Марка и модель"]} ${selectedRowYear} года выпуска`
                            : `Выбран автомобиль ${selectedRow["Марка и модель"]}. Его нет в наличии`
                        )
                        : 'Автомобиль не выбран. Кликните по строке в таблице, чтобы выбрать автомобиль'
                }
            </div>
        </>
    )
}
