import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3456'); // Replace with your server URL

const ExcelLikeTable = () => {
  const [headers] = useState([
    'Header 1', 'Header 2', 'Header 3',
    'Header 4', 'Header 5', 'Header 6',
    'Header 7', 'Header 8', 'Header 9',
    'Header 10', 'Header 11', 'Header 12',
    'Header 13', 'Header 14', 'Header 15'
  ]);
  const [rows, setRows] = useState([]);

  const handleAddRow = () => {
    setRows(prevRows => [...prevRows, Array(headers.length).fill('')]);
  };

  const handleDeleteRow = rowIndex => {
    setRows(prevRows => prevRows.filter((row, index) => index !== rowIndex));
    socket.emit('deleteRow', rowIndex);
  };

  const handleCellValueChange = (event, rowIndex, cellIndex) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][cellIndex] = event.target.value;
    setRows(updatedRows);
    socket.emit('cellValueChange', { rowIndex, cellIndex, value: event.target.value });
  };

  const handleSave = () => {
    socket.emit('saveData', { rows });
  };

  useEffect(() => {
    socket.on('cellValueChange', ({ rowIndex, cellIndex, value }) => {
      const updatedRows = [...rows];
      updatedRows[rowIndex][cellIndex] = value;
      setRows(updatedRows);
    });
    socket.on('connect', () => {
      socket.emit('initialState', rows);
    });
    socket.on('addRow', newRow => {
      setRows(prevRows => [...prevRows, newRow]);
    });
    socket.on('deleteRow', rowIndex => {
      setRows(prevRows => prevRows.filter((row, index) => index !== rowIndex));
    });
    return () => {
      socket.off('cellValueChange');
      socket.off('connect');
      socket.off('addRow');
      socket.off('deleteRow');
    };
  }, [rows]);

  useEffect(() => {
    socket.on('initialState', initialState => {
      setRows(initialState.length > 0 ? initialState : [Array(headers.length).fill('')]);
    });
    if (rows.length === 0) {
      setRows([Array(headers.length).fill('')]);
    }
    return () => {
      socket.off('initialState');
    };
  }, []);

  return (
    <div>
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
            <th></th> 
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  <input
                    type="text"
                    value={cell}
                    onChange={event => handleCellValueChange(event, rowIndex, cellIndex)}
                  />
                </td>
              ))}
              <td>
                <button onClick={() => handleDeleteRow(rowIndex)}>Delete Row</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddRow}>Add Row</button>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default ExcelLikeTable;
