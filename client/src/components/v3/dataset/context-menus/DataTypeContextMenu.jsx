import React, { PropTypes } from 'react';
import ContextMenu from '../../../common/ContextMenu';

const dataTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
];

export default function DataTypeContextMenu({ column, onSelect }) {
  return (
    <ContextMenu
      style={{ width: 200, overflow: 'visible', zIndex: 10000000 }}
      options={dataTypeOptions}
      selected={column.get('type')}
      onOptionSelected={value => onSelect(column, value)}
    />
  );
}

DataTypeContextMenu.propTypes = {
  column: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};
