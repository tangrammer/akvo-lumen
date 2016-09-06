import React, { Component, PropTypes } from 'react';
import DataTypeContextMenu from './context-menus/DataTypeContextMenu';
import ColumnTransformationContextMenu from './context-menus/ColumnTransformationContextMenu';

require('../../../styles/ColumnHeader.scss');

export default class TableHeaderCell extends Component {
  constructor(props) {
    super(props);
    this.state = {
      changeDataTypeContextMenuVisible: false,
      columnTransformationContextMenuVisible: false,
    };

    this.toggleChangeDatatypeContextMenu = this.toggleChangeDatatypeContextMenu.bind(this);
    this.toggleColumnTransformationContextMenu
      = this.toggleColumnTransformationContextMenu.bind(this);
  }

  toggleChangeDatatypeContextMenu() {
    this.setState({
      changeDataTypeContextMenuVisible: !this.state.changeDataTypeContextMenuVisible,
    });
  }

  toggleColumnTransformationContextMenu() {
    this.setState({
      columnTransformationContextMenuVisible: !this.state.columnTransformationContextMenuVisible,
    });
  }

  render() {
    const { column } = this.props;
    return (
      <div className="TableHeaderCell">
        <div
          className="ColumnHeader clickable"
          onClick={this.toggleColumnTransformationContextMenu}
        >
          <span className="columnType clickable">
            <span
              className="columnTypeToggle"
              onClick={(evt) => {
                evt.stopPropagation();
                this.toggleChangeDatatypeContextMenu();
              }}
            >
            <DataTypeContextMenu
              column={column}
              style={{zIndex:1000000, overflow: 'visible'}}
              onSelect={(col, value) => {
                this.toggleChangeDatatypeContextMenu();
              }}
            />
              {column.get('type')}
            </span>
          </span>
          <span className="columnTitleText">
            {column.get('title')}
          </span>
        </div>
        {this.state.changeDataTypeContextMenuVisible &&
          <DataTypeContextMenu
            column={column}
            onSelect={(col, value) => {
              this.toggleChangeDatatypeContextMenu();
            }}
          />
        }
        {this.state.columnTransformationContextMenuVisible &&
          <ColumnTransformationContextMenu
            column={column}
            onSelect={(col, value) => {
              this.toggleColumnTransformationContextMenu();
            }}
          />
        }
      </div>
    );
  }
}

TableHeaderCell.propTypes = {
  column: PropTypes.object.isRequired,
};
