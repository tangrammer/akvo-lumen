import React, { Component, PropTypes } from 'react';
import { Grid } from 'react-virtualized';

export default class TableDataGrid extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { registerChild, onRowsRendered, onScroll, width, height, columns, rows } = this.props;

    return (
      <div className="TableDataGrid">
        <Grid
          ref={registerChild}
          onSectionRendered={({
            rowOverscanStartIndex,
            rowOverscanStopIndex,
            rowStartIndex,
            rowStopIndex,
          }) =>
            onRowsRendered({
              overscanStartIndex: rowOverscanStartIndex,
              overscanStopIndex: rowOverscanStopIndex,
              startIndex: rowStartIndex,
              stopIndex: rowStopIndex,
            })
          }
          onScroll={onScroll}
          width={width}
          height={height - 30}
          columnWidth={200}
          rowHeight={30}
          columnCount={columns.size}
          rowCount={rows.length}
          cellRenderer={({ columnIndex, rowIndex }) => {
            if (rows[rowIndex] == null) {
              return '';
            }
            return rows[rowIndex][columnIndex];
          }}
        />
      </div>
    );
  }
}

TableDataGrid.propTypes = {
  rows: PropTypes.array.isRequired,
  columns: PropTypes.object.isRequired,
  onRowsRendered: PropTypes.func.isRequired,
  registerChild: PropTypes.func.isRequired,
  onScroll: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};
