import React, { Component, PropTypes } from 'react';
import fetch from 'isomorphic-fetch';
import { AutoSizer, ScrollSync, InfiniteLoader } from 'react-virtualized';
import DatasetControls from './DatasetControls';
import TableHeader from './TableHeader';
import TableDataGrid from './TableDataGrid';
import TransformationLog from './sidebars/TransformationLog';
import headers from '../../../actions/headers';

require('../../../styles/DatasetTable.scss');
require('react-virtualized/styles.css');

export default class DatasetTable extends Component {

  constructor(props) {
    super(props);
    this.state = {
      transformationLogSidebarOpen: false,
      rows: [],
    };

    this.isRowLoaded = this.isRowLoaded.bind(this);
    this.loadMoreRows = this.loadMoreRows.bind(this);
    this.toggleTransformationLog = this.toggleTransformationLog.bind(this);
  }

  componentDidMount() {
    this.loadMoreRows({ startIndex: 0, stopIndex: 4 });
  }

  isRowLoaded({ index }) {
    return !!this.state.rows[index];
  }

  loadMoreRows({ startIndex, stopIndex }) {
    const limit = stopIndex - startIndex;
    return fetch(`/api/datasets/${this.props.id}/rows?offset=${startIndex}&limit=${limit}`, {
      method: 'GET',
      headers: headers(),
    })
    .then(response => response.json())
    .then(response => {
      const rows = this.state.rows;
      const newRows = response.rows;
      this.setState({ rows: [].concat(rows, newRows) });
    });
  }

  toggleTransformationLog() {
    this.setState({
      transformationLogSidebarOpen: !this.state.transformationLogSidebarOpen,
    });
  }


  render() {
    const { columns, transformations } = this.props;
    const { rows, transformationLogSidebarOpen } = this.state;

    return (
      <div style={{ height: '80%' }}>
        <DatasetControls
          onToggleTransformationLog={this.toggleTransformationLog}
          onClickMenuItem={() => null}
          columns={columns}
          rowsCount={1000000}
        />
        <div
          style={{
            height: '100%',
            display: 'flex',
            justifyContent: 'stretch',
          }}
        >
          {this.state.sideBarVisible &&
            <div style={{ flex: 1 }} />
          }
          <div style={{ flex: 3 }}>
            <AutoSizer>
              {({ width, height }) =>
                <ScrollSync>
                  {({ onScroll, scrollLeft }) => (
                    <div>
                      <TableHeader
                        columns={columns}
                        width={width}
                        scrollLeft={scrollLeft}
                      />
                      <InfiniteLoader
                        isRowLoaded={this.isRowLoaded}
                        loadMoreRows={this.loadMoreRows}
                        minimumBatchSize={30}
                        rowCount={1000000}
                      >
                        {({ onRowsRendered, registerChild }) => (
                          <TableDataGrid
                            columns={columns}
                            rows={rows}
                            registerChild={registerChild}
                            onRowsRendered={onRowsRendered}
                            onScroll={onScroll}
                            width={width}
                            height={height}
                          />
                        )}
                      </InfiniteLoader>
                    </div>
                  )}
                </ScrollSync>
              }
            </AutoSizer>
          </div>
          { transformationLogSidebarOpen &&
            <div
              style={{ flexBasis: '300px' }}
            >
              <TransformationLog
                onClose={this.toggleTransformationLog}
                onUndo={() => null}
                columns={columns}
                transformations={transformations}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

DatasetTable.propTypes = {
  id: PropTypes.string.isRequired,
  columns: PropTypes.object.isRequired,
  rows: PropTypes.object.isRequired,
  transformations: PropTypes.object,
  onTransform: PropTypes.func.isRequired,
  onUndoTransformation: PropTypes.func.isRequired,
};
