import React, { PropTypes } from 'react';
import ContextMenu from '../../../common/ContextMenu';

const options = [
  {
    label: 'Filter',
    value: 'core/filter-column',
  }, {
    label: 'Whitespace',
    value: 'whitespace',
    subMenu: [{
      label: 'Remove leading and trailing whitespace',
      value: 'core/trim',
    }, {
      label: 'Remove double spaces',
      value: 'core/trim-doublespace',
    }],
  }, {
    label: 'Change case',
    value: 'change-case',
    subMenu: [{
      label: 'To Uppercase',
      value: 'core/to-uppercase',
    }, {
      label: 'To Lowercase',
      value: 'core/to-lowercase',
    }, {
      label: 'To Titlecase',
      value: 'core/to-titlecase',
    }],
  },
];


export default function ColumnTransformationContextMenu({ column, onSelect }) {
  return (
    <ContextMenu
      style={{ width: 200, zIndex: 60000000 }}
      options={options}
      onOptionSelected={value => onSelect(column, value)}
    />
  );
}

ColumnTransformationContextMenu.propTypes = {
  onSelect: PropTypes.func.isRequired,
  column: PropTypes.object.isRequired,
};
