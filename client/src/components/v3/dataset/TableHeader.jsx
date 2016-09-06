import React, { Component, PropTypes } from 'react';
import { Grid } from 'react-virtualized';
import TableHeaderCell from './TableHeaderCell';

require('../../../styles/ColumnHeader.scss');

export default class TableHeader extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { scrollLeft, columns, width } = this.props;
    return (
      <div className="TableHeader">
        <Grid
          scrollLeft={scrollLeft}
          style={{ overflowX: 'hidden' }}
          width={width}
          height={200}
          columnWidth={200}
          rowHeight={60}
          columnCount={columns.size}
          rowCount={1}
          cellRenderer={({ columnIndex }) => (
            <TableHeaderCell column={columns.get(columnIndex)} />
          )}
        />
      </div>
    );
  }
}

TableHeader.propTypes = {
  columns: PropTypes.object.isRequired,
  scrollLeft: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
};
