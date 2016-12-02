import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import SelectMenu from '../common/SelectMenu';
import SelectInput from './configMenu/SelectInput';
import LabelInput from './configMenu/LabelInput';
import FilterMenu from './configMenu/FilterMenu';
import * as entity from '../../domain/entity';
import VisualisationTypeMenu from './VisualisationTypeMenu';

const redColor = 'rgba(255, 0,0,0.1)';


const sortFunction = (a, b) => {
  const string1 = entity.getTitle(a).toLowerCase();
  const string2 = entity.getTitle(b).toLowerCase();
  return string1.localeCompare(string2);
};

const getDatasetArray = datasetObject =>
  Object.keys(datasetObject)
    .map(id => datasetObject[id])
    .sort(sortFunction);

const getDatasetOptions = datasetArray =>
  datasetArray.map(dataset => ({
    value: entity.getId(dataset),
    label: entity.getTitle(dataset),
  }));

const getSelectMenuOptionsFromColumnList = (columns = Immutable.List()) =>
  columns.map((column, index) => ({
    value: index.toString(),
    title: `${column.get('title')}`,
    label: `${column.get('title')} [${column.get('type')}]`,
    type: `${column.get('type')}`,
  })).toArray();

const getColumnType = (index, options) => {
  let columnType = null;

  if (index !== null) {
    columnType = options.find(option => option.value === index).type;
  }

  return columnType;
};

const getColColor = (index, spec) => {
  let count = 0;

  [spec.datasetColumnX, spec.datasetColumnY, spec.colorColumn, spec.sizeColumn].forEach(num => {
    if (num === index) ++count;
  });

  if (count === 0) return('#f1f2f2');

  return `rgba(43, 182, 115, ${count * 0.25})`
}

const Subtitle = ({ children }) => (
  <h3 className="subtitle">{children}</h3>
);

const datasetColumnLabelText = 'Dataset column';
const datasetColumnPlaceholder = 'Choose a dataset column...';

const labelColumnLabelText = 'Label column';
const labelColumnPlaceholder = 'Choose a name column...';

const groupColumnLabelText = 'Group by column';
const groupColumnPlaceholder = 'Choose a column to group by...';

const aggregationColumnLabelText = 'Aggregation type';

const aggregationOptions = [
  {
    value: 'mean',
    label: 'mean',
  },
  {
    value: 'median',
    label: 'median',
  },
  {
    value: 'max',
    label: 'max',
  },
  {
    value: 'min',
    label: 'min',
  },
  {
    value: 'count',
    label: 'count',
  },
  {
    value: 'distinct',
    label: 'count unique',
  },
  {
    value: 'sum',
    label: 'sum',
  },
  {
    value: 'q1',
    label: 'lower quartile',
  },
  {
    value: 'q3',
    label: 'upper quartile',
  },
];

const getTitle = (columnOptions, id) => {
  let out;

  columnOptions.forEach(item => {
    if (item.value === id) {
      out = item.title;
    }
  });

  return out;
}

const getType = (columnOptions, id) => {
  let out;

  columnOptions.forEach(item => {
    if (item.value === id) {
      out = item.type;
    }
  });

  return out;
}

const ColumnGroupingInput = ({ spec, columnOptions, onChangeSpec }) => (
  <div
    className="ColumnGroupingInput"
  >
    <SelectInput
      placeholder={groupColumnPlaceholder}
      labelText={groupColumnLabelText}
      choice={spec.datasetGroupColumnX !== null ?
        spec.datasetGroupColumnX.toString() : null}
      name="xGroupColumnMenu"
      options={columnOptions}
      clearable
      onChange={value => onChangeSpec({
        datasetGroupColumnX: value,
        datasetGroupColumnXType: getColumnType(value, columnOptions),
      })}
    />
    <div
      className="inputSeperator"
    >
      - or -
    </div>
    <SelectInput
      placeholder={labelColumnPlaceholder}
      labelText={labelColumnLabelText}
      choice={(spec.datasetNameColumnX !== null && spec.datasetGroupColumnX == null) ?
        spec.datasetNameColumnX.toString() : null}
      name="xNameColumnMenu"
      options={columnOptions}
      disabled={spec.datasetGroupColumnX !== null}
      clearable
      onChange={value => onChangeSpec({
        datasetNameColumnX: value,
        datasetNameColumnXType: getColumnType(value, columnOptions),
      })}
    />
  </div>
);

ColumnGroupingInput.propTypes = {
  spec: PropTypes.object.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

const AggregationInput = ({ spec, onChangeSpec }) => (
  <SelectInput
    placeholder={spec.datasetGroupColumnX !== null ?
      'Choose aggregation type...' : 'Must choose "Group by" column first'}
    labelText={aggregationColumnLabelText}
    choice={spec.datasetGroupColumnX !== null ?
      spec.aggregationTypeY.toString() : null}
    name="yAggregationMenu"
    options={aggregationOptions}
    disabled={spec.datasetGroupColumnX === null}
    onChange={value => onChangeSpec({
      aggregationTypeY: value,
    })}
  />
);

const ColorAggregationInput = ({ spec, onChangeSpec }) => (
  <SelectInput
    placeholder="Choose color metric aggregation..."
    labelText={aggregationColumnLabelText}
    choice={spec.colorAggregationType !== null ?
      spec.colorAggregationType.toString() : null}
    name="yAggregationMenu"
    options={aggregationOptions}
    onChange={value => onChangeSpec({
      colorAggregationType: value,
    })}
  />
);

AggregationInput.propTypes = {
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

const SortInput = ({ spec, columnOptions, onChangeSpec }) => (
  <div>
    <SelectInput
      placeholder="Choose a column to sort by..."
      labelText="Sort column"
      choice={spec.datasetSortColumnX !== null ? spec.datasetSortColumnX.toString() : null}
      name="xSortColumnInput"
      options={columnOptions}
      clearable
      onChange={value => onChangeSpec({
        datasetSortColumnX: value,
        datasetSortColumnXType: getColumnType(value, columnOptions),
        reverseSortX: value === null ? false : spec.reverseSortX,
      })}
    />
    <SelectInput
      placeholder="Sort direction..."
      labelText="Sort direction"
      choice={spec.reverseSortX ? 'dsc' : 'asc'}
      disabled={!spec.datasetSortColumnX}
      name="xSortColumnInput"
      options={[
        {
          value: 'asc',
          label: 'Ascending',
        },
        {
          value: 'dsc',
          label: 'Descending',
        },
      ]}
      onChange={value => onChangeSpec({
        reverseSortX: value === 'dsc',
      })}
    />
  </div>
);

SortInput.propTypes = {
  spec: PropTypes.object.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

export default class ConfigMenu extends Component {
  constructor() {
    super();
  }

  render() {
    const props = this.props;
    const datasetArray = getDatasetArray(props.datasets);
    const datasetOptions = getDatasetOptions(datasetArray);
    const visualisation = props.visualisation;
    const onChangeSpec = props.onChangeVisualisationSpec;
    const spec = visualisation.spec;

    const columns = props.datasets[visualisation.datasetId] ?
      props.datasets[visualisation.datasetId].get('columns') : Immutable.List();
    const columnOptions = getSelectMenuOptionsFromColumnList(columns);

    return (
      <div
        className="ConfigMenu"
        style={{
          display: 'flex',
          flexDirection: 'row',
          minHeight: '100%',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          props.setRootState({
            draggedColumn: null,
          });
        }}
      >
        <div
          className="column1"
          style={{
            flex: 1,
            borderRight: '1px solid whitesmoke',
            paddingRight: '1rem',
          }}
        >
          <h3>Dataset</h3>
          <div className="inputGroup">
            <label htmlFor="xDatasetMenu">Source dataset:</label>
            <SelectMenu
              name="xDatasetMenu"
              placeholder="Choose dataset..."
              value={visualisation.datasetId !== null ?
                visualisation.datasetId.toString() : null}
              options={datasetOptions}
              onChange={props.onChangeSourceDataset}
            />
          </div>
          <FilterMenu
            hasDataset={Boolean(visualisation.datasetId !== null)}
            onChangeSpec={onChangeSpec}
            spec={spec}
            columnOptions={columnOptions}
          />
          {visualisation.datasetId !== null &&
            <div>
              <hr />
              <h3
                style={{
                  marginBottom: '1rem',
                }}
              >
                Columns
              </h3>
              <ul>
                {columnOptions.map(item =>
                  <li
                    key={item.value}
                    onDragStart={() => {
                      props.setRootState({
                        draggedColumn: item.value,
                        draggedColumnType: item.type,
                      });
                    }}
                    draggable
                  >
                    <h4
                      className="clickable"
                      style={{
                        position: 'relative',
                        backgroundColor: getColColor(item.value, visualisation.spec),
                        padding: '0.5rem',
                        borderRadius: '0.4rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span>
                        {'[' + item.type + '] '}
                      </span>
                      <span>
                        {item.title.length > 20 ? item.title.substring(0, 17) + '...' : item.title}
                      </span>
                    </h4>
                  </li>
                )}
              </ul>
            </div>
          }
        </div>

        <div
          className="column2"
          style={{
            flex: 1,
            paddingLeft: '1rem',
          }}
        >
          {visualisation.datasetId !== null &&
            <div>
              <h3>Visualisation</h3>
              <div className="inputGroupFoo">
                <label htmlFor="chartTitle">Chart title:</label>
                <input
                  className="textInput"
                  type="text"
                  id="chartTitle"
                  placeholder="Untitled chart"
                  defaultValue={visualisation.name !== null ? visualisation.name.toString() : null}
                  onChange={props.onChangeTitle}
                />
              </div>
              <VisualisationTypeMenu
                visualisation={visualisation}
                onChangeVisualisationType={this.props.onChangeVisualisationType}
              />
              <div
                style={{
                  paddingTop: '1rem',
                }}
              />
              <hr
              />
              <PlacementMenu
                columnOptions={columnOptions}
                {...this.props}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

const getDragTargetColor = (itemType, validTypes) => {
  let color;
  let flag;

  flag = validTypes.indexOf(itemType) > -1;

  color = flag ? 'rgba(0,255,0,0.1)' : 'rgba(255, 0,0,0.1)';

  return color;
}

Subtitle.propTypes = {
  children: PropTypes.node.isRequired,
};

ConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
};

class PlacementMenu extends Component {
  render() {
    const props = this.props;
    const { columnOptions } = props;
    const visualisation = props.visualisation;
    const onChangeSpec = props.onChangeVisualisationSpec;
    const spec = visualisation.spec;
    const vType = visualisation.visualisationType;


    const sizeMenu = (
      <div>
        <label>Size</label>
        <div
          style={{
            border: '1px solid #f1f2f2',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            position: 'relative',
            backgroundColor: props.rootState.draggedColumn != null ?
              getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date'])
              :
              'transparent',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            if (getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date']) === redColor) {
              return false;
            }
            props.setRootState({
              sizeColumn: props.rootState.draggedColumn,
              draggedColumn: null,
            })
           onChangeSpec({
              sizeColumn: props.rootState.draggedColumn,
              sizeColumnType: getType(columnOptions, props.rootState.draggedColumn),
              sizeTitle: getTitle(columnOptions, props.rootState.draggedColumn),
            });
          }}
        >
          {spec.sizeColumn !== null ?
            <span>
              {getTitle(columnOptions, props.rootState.sizeColumn)}
              <span
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  cursor: 'pointer',
                }}
                onClick={()=> {
                  props.setRootState({
                    sizeColumn: null,
                  });
                  onChangeSpec({
                    sizeColumn: null,
                    sizeColumnType: null,
                    sizeColumnTitle: null,
                  })
                }}
              >x</span>
            </span>
            :
            <span
              style={{
                color: 'grey',
              }}
            >
              Drag column for size
            </span>
          }
        </div>
      </div>
    );

    const colorMenu = (
      <div>
        <label>Color</label>
        <div
          style={{
            border: '1px solid #f1f2f2',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            position: 'relative',
            backgroundColor: props.rootState.draggedColumn != null ?
              getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date'])
              :
              'transparent',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            if (getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date']) === redColor) return false;
            props.setRootState({
              colorColumn: props.rootState.draggedColumn,
              draggedColumn: null,
            })
           onChangeSpec({
              colorColumn: props.rootState.draggedColumn,
              colorColumnType: getType(columnOptions, props.rootState.draggedColumn),
              colorTitle: getTitle(columnOptions, props.rootState.draggedColumn),
            });
          }}
        >
          {spec.colorColumn !== null ?
            <span>
              {getTitle(columnOptions, props.rootState.colorColumn)}
              <span
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  cursor: 'pointer',
                }}
                onClick={()=> {
                  props.setRootState({
                    colorColumn: null,
                  });
                  onChangeSpec({
                    colorColumn: null,
                    colorColumnType: null,
                    colorColumnTitle: null,
                  })
                }}
              >x</span>
            </span>
            :
            <span
              style={{
                color: 'grey',
              }}
            >
              Drag column for color
            </span>
          }
        </div>
        {(vType === 'pie' && spec.colorColumn !== null) &&
          <ColorAggregationInput
            spec={spec}
            onChangeSpec={onChangeSpec}
          />
        }
      </div>
    );

    const labelMenu = (
          <div>
            <label>Bar labels</label>
            <div
              style={{
                border: '1px solid #f1f2f2',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                position: 'relative',
                backgroundColor: props.rootState.draggedColumn != null ?
                  getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date', 'text'])
                  :
                  'transparent',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                if (getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date', 'text']) === redColor) return false;
                if (spec.datasetGroupColumnX !== null) {
                  return false;
                }
                props.setRootState({
                  datasetNameColumnX: props.rootState.draggedColumn,
                  draggedColumn: null,
                })
               onChangeSpec({
                  datasetNameColumnX: props.rootState.draggedColumn,
                  datasetNameColumnXType: getType(columnOptions, props.rootState.draggedColumn),
                  labelX: getTitle(columnOptions, props.rootState.draggedColumn),
                });
              }}
            >
              {spec.datasetGroupColumnX !== null ?
                  <span
                    style={{
                      color: 'grey',
                    }}
                  >
                    Showing "Group by" labels
                  </span>
                :
                <div>
                  {spec.datasetNameColumnX !== null ?
                    <span>
                      {getTitle(columnOptions, props.rootState.datasetNameColumnX)}
                      <span
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          cursor: 'pointer',
                        }}
                        onClick={()=> {
                          props.setRootState({
                            datasetNameColumnX: null,
                          });
                          onChangeSpec({
                            datasetNameColumnX: null,
                            datasetNameColumnXType: null,
                            labelX: null,
                          })
                        }}
                      >x</span>
                    </span>
                    :
                    <span
                      style={{
                        color: 'grey',
                      }}
                    >
                      Drag column for bar label
                    </span>
                  }
                </div>
            }
            </div>
          </div>
        );

  const groupColumnMenu = (
    <div>
      <label>Group by</label>
      <div
        style={{
          border: '1px solid #f1f2f2',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          position: 'relative',
          backgroundColor: props.rootState.draggedColumn != null ?
            getDragTargetColor(props.rootState.draggedColumnType, ['text', 'number'])
            :
            'transparent',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (getDragTargetColor(props.rootState.draggedColumnType, ['text', 'number']) === redColor) return false;
          props.setRootState({
            datasetGroupColumnX: props.rootState.draggedColumn,
            draggedColumn: null,
          })
         onChangeSpec({
            datasetGroupColumnX: props.rootState.draggedColumn,
            datasetGroupColumnXType: getType(columnOptions, props.rootState.draggedColumn),
            labelX: getTitle(columnOptions, props.rootState.draggedColumn),
          });
        }}
      >
        {spec.datasetGroupColumnX !== null ?
          <span>
            {getTitle(columnOptions, props.rootState.datasetGroupColumnX)}
            <span
              style={{
                position: 'absolute',
                right: '0.5rem',
                cursor: 'pointer',
              }}
              onClick={()=> {
                props.setRootState({
                  datasetGroupColumnX: null,
                });
                onChangeSpec({
                  datasetGroupColumnX: null,
                  datasetGroupColumnXType: null,
                  labelX: null,
                })
              }}
            >x</span>
          </span>
          :
          <span
            style={{
              color: 'grey',
            }}
          >
            Choose a column to group by
          </span>
        }
      </div>
      {spec.datasetGroupColumnX !== null &&
        <AggregationInput
          spec={spec}
          onChangeSpec={onChangeSpec}
        />
      }
    </div>
  );

    return (
      <div>
        <div>
          <h3>Placement</h3>
          {['line', 'area', 'scatter'].indexOf(vType) > -1 &&
            <div>
              <label>X axis</label>
              <div
                style={{
                  border: '1px solid #f1f2f2',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  position: 'relative',
                  backgroundColor: props.rootState.draggedColumn != null ?
                    getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date'])
                    :
                    'transparent',
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (getDragTargetColor(props.rootState.draggedColumnType, ['number', 'date']) === redColor) return false;
                  props.setRootState({
                    columnX: props.rootState.draggedColumn,
                    draggedColumn: null,
                  })
                 onChangeSpec({
                    datasetColumnX: props.rootState.draggedColumn,
                    datasetColumnXType: getType(columnOptions, props.rootState.draggedColumn),
                    labelX: getTitle(columnOptions, props.rootState.draggedColumn),
                  });
                }}
              >
                {props.rootState.columnX ?
                  <span>
                    {getTitle(columnOptions, props.rootState.columnX)}
                    <span
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        cursor: 'pointer',
                      }}
                      onClick={()=> {
                        props.setRootState({
                          columnX: null,
                        });
                        onChangeSpec({
                          datasetColumnX: null,
                          datasetColumnX: null,
                          labelX: null,
                        })
                      }}
                    >x</span>
                  </span>
                  :
                  <span
                    style={{
                      color: 'grey',
                    }}
                  >
                    Drag column for X axis
                  </span>
                }
              </div>
            </div>
          }
          <div>
            <label>{vType === 'pie' ? 'Data column' : 'Y axis'}</label>
            <div
              style={{
                border: '1px solid #f1f2f2',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                position: 'relative',
                backgroundColor: props.rootState.draggedColumn != null ?
                  getDragTargetColor(props.rootState.draggedColumnType, vType === 'pie' ? ['text', 'number'] : ['number'])
                  :
                  'transparent',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                if (getDragTargetColor(props.rootState.draggedColumnType, vType === 'pie' ? ['text', 'number'] : ['number']) == redColor) return false;
                props.setRootState({
                  columnY: props.rootState.draggedColumn,
                  draggedColumn: null,
                })
               onChangeSpec({
                  datasetColumnY: props.rootState.draggedColumn,
                  datasetColumnYType: getType(columnOptions, props.rootState.draggedColumn),
                  labelY: getTitle(columnOptions, props.rootState.draggedColumn),
                });
              }}
            >
              {props.rootState.columnY ?
                <span>
                  {getTitle(columnOptions, props.rootState.columnY)}
                  <span
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      cursor: 'pointer',
                    }}
                    onClick={()=> {
                      props.setRootState({
                        columnY: null,
                      });
                      onChangeSpec({
                        datasetColumnY: null,
                        datasetColumnY: null,
                        labelY: null,
                      })
                    }}
                  >x</span>
                </span>
                :
                <span
                  style={{
                    color: 'grey',
                  }}
                >
                  Drag column for {vType === 'pie' ? 'data column' : 'Y axis'}
                </span>
              }
            </div>
          </div>
          {(['bar'].indexOf(vType) > -1 && spec.datasetColumnY !== null) &&
            <SelectInput
              placeholder="None"
              labelText="Sort option"
              choice={spec.sortOption}
              name="xSortColumnInput"
              options={[
                {
                  value: 'none',
                  label: 'None',
                },
                {
                  value: 'asc',
                  label: 'Ascending',
                },
                {
                  value: 'dsc',
                  label: 'Descending',
                },
              ]}
              onChange={value => onChangeSpec({
                sortOption: value,
              })}
            />
          }
        </div>
        <div>
          {(visualisation.spec.datasetColumnX !== null || visualisation.spec.datasetColumnY !== null) &&
            <div>
              <hr />
              {(['bar', 'scatter', 'pie', 'donut'].indexOf(vType) > -1) &&
                <h3>Marks</h3>
              }
              <div>
                {vType=== 'bar' && groupColumnMenu}
                {vType=== 'bar' && labelMenu}
                {(['bar', 'scatter', 'pie', 'donut'].indexOf(vType) > -1) && colorMenu}
                {vType === 'scatter' && sizeMenu}
              </div>
            </div>
          }
        </div>
      </div>
    )
  }
}

