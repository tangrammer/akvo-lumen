import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Pie } from '@potion/layout'; // TODO: see if can optimize this
import { positionFromAngle } from '@nivo/core'; // TODO: move this to potion
import { Arc, Svg, Group, Text, Line } from '@potion/element';
import get from 'lodash/get';
import { Portal } from 'react-portal';
import merge from 'lodash/merge';

import { sortAlphabetically, sortChronologically } from '../../utilities/utils';
import { round, replaceLabelIfValueEmpty } from '../../utilities/chart';
import Legend from './Legend';
import ResponsiveWrapper from '../common/ResponsiveWrapper';
import ColorPicker from '../common/ColorPicker';
import ChartLayout from './ChartLayout';
import Tooltip from './Tooltip';
import { labelFont, connectionStyle } from '../../constants/chart';

const getDatum = (data, datum) => data.filter(({ key }) => key === datum)[0];

const getLabelText = (count, totalCount) => `${count} (${round(100 * (count / totalCount), 2)}%)`;

export default class PieChart extends Component {

  static propTypes = {
    data: PropTypes.shape({
      data: PropTypes.array,
      metadata: PropTypes.object,
    }),
    donut: PropTypes.bool,
    colors: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    colorMapping: PropTypes.object,
    onChangeVisualisationSpec: PropTypes.func,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    innerRadius: PropTypes.number,
    legendPosition: PropTypes.oneOf(['right']),
    legendTitle: PropTypes.string,
    print: PropTypes.bool,
    interactive: PropTypes.bool,
    edit: PropTypes.bool,
    legendVisible: PropTypes.bool,
    style: PropTypes.object,
  }

  static defaultProps = {
    innerRadius: 0,
    interactive: true,
    legendVisible: true,
    edit: false,
    colorMapping: {},
  }

  state = {
    isPickingColor: false,
  }

  getData() {
    const { data } = this.props;
    if (!get(data, 'series[0]')) return false;

    const series = merge({}, data.common, data.series[0]);
    const sortFunctionFactory = get(data, 'series.common.metadata.type') === 'text' ?
      sortAlphabetically :
      sortChronologically;

    return {
      ...series,
      data: series.data
        .sort((a, b) => sortFunctionFactory(a, b, ({ key }) => key))
        .map(datum => ({
          ...datum,
          value: Math.abs(datum.value),
          key: replaceLabelIfValueEmpty(datum.key),
          label: replaceLabelIfValueEmpty(datum.label),
        })),
    };
  }

  getColor(key, index) {
    const { colorMapping, colors } = this.props;
    return colorMapping[key] || colors[index];
  }

  handleShowTooltip(event, content) {
    const { clientX, clientY } = event;
    const bounds = this.wrap.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;

    const tooltipPosition = {};

    if (x < bounds.width / 2) tooltipPosition.left = x + 20;
    else tooltipPosition.right = (bounds.width - x) + 20;

    if (y < bounds.height / 2) tooltipPosition.top = y - 12;
    else tooltipPosition.bottom = bounds.height - y - 12;
    console.log(content);
    this.setState({
      tooltipVisible: true,
      tooltipItems: [content],
      tooltipPosition,
    });
  }

  handleMouseEnterNode({ key, value, totalCount }, event) {
    const { interactive, print, colors } = this.props;
    if (!interactive || print) return;
    this.handleShowTooltip(event, {
      key,
      color: colors[key],
      value: getLabelText(value, totalCount),
    });
    this.setState({ hoveredNode: key });
  }

  handleMouseEnterLegendNode({ key }) {
    if (this.state.isPickingColor) return;
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    this.setState({ hoveredNode: key });
  }

  handleMouseLeaveNode({ key }) {
    const { interactive, print } = this.props;
    if (!interactive || print) return;
    if (this.state.hoveredNode === key) {
      this.setState({ hoveredNode: null, tooltipVisible: false });
    }
  }

  handleClickNode({ key }, event) {
    const { interactive, print, edit } = this.props;
    if (!interactive || print) return;
    event.stopPropagation();
    this.setState({
      isPickingColor: edit ? key : null,
      hoveredNode: key,
    });
  }

  renderLabel({ key, value, labelPosition, edgePosition, midAngle, totalCount, angle }) {
    const { print, interactive, legendVisible } = this.props;
    const offset = (input, mult) => Math.floor(input * mult);
    const labelOffset = 0.95;
    const edgeOffset = 1.01;
    const showKey = Boolean(!legendVisible);
    const showLabel = Boolean(!interactive || print);
    return ((print || !interactive || !legendVisible) && angle > Math.PI / 12) ? (
      <Group>
        <Text
          textAnchor={midAngle > Math.PI / 2 ? 'end' : 'start'}
          transform={{ translate: [labelPosition.x, labelPosition.y] }}
          {...labelFont}
        >
          {showKey && `${key}`}
          {(showKey && showLabel) && ': '}
          {showLabel && getLabelText(value, totalCount)}
        </Text>
        <Line
          x1={offset(labelPosition.x, labelOffset)}
          y1={offset(labelPosition.y, labelOffset)}
          x2={offset(edgePosition.x, edgeOffset)}
          y2={offset(edgePosition.y, edgeOffset)}
          {...connectionStyle}
        />
      </Group>
    ) : null;
  }

  render() {
    const {
      width,
      height,
      colorMapping,
      onChangeVisualisationSpec,
      donut,
      style,
      legendTitle,
      legendVisible,
      edit,
    } = this.props;

    const innerRadius = donut ? Math.floor(Math.min(width, height) / 8) : 0;

    const series = this.getData();

    if (!series) return null;

    const totalCount = series.data.reduce((total, datum) => total + datum.value, 0);
    const { tooltipItems, tooltipVisible, tooltipPosition } = this.state;
    return (
      <ChartLayout
        style={style}
        width={width}
        height={height}
        legendVisible={legendVisible}
        onClick={() => {
          this.setState({ isPickingColor: undefined });
        }}
        legend={({ horizontal }) => (
          <Legend
            horizontal={!horizontal}
            title={legendTitle}
            data={series.data.map(({ key }) => `${key}`)}
            colorMapping={
              series.data.reduce((acc, { key }, i) => ({
                ...acc,
                [key]: this.getColor(key, i),
              }), {})
            }
            activeItem={get(this.state, 'hoveredNode')}
            onClick={({ datum }) => (event) => {
              this.handleClickNode({ ...getDatum(series.data, datum) }, event);
            }}
            onMouseEnter={({ datum }) => () => {
              this.handleMouseEnterLegendNode(getDatum(series.data, datum));
            }}
            onMouseLeave={({ datum }) => () => {
              if (this.state.isPickingColor) return;
              this.handleMouseLeaveNode(getDatum(series.data, datum));
            }}
          />
        )}
        chart={
          <ResponsiveWrapper>{(dimensions) => {
            const diameter = Math.min(dimensions.width, dimensions.height);

            return (
              <div
                style={{ position: 'relative' }}
                ref={(c) => {
                  this.wrap = c;
                }}
              >
                {tooltipVisible && (
                  <Tooltip
                    items={tooltipItems}
                    {...tooltipPosition}
                  />
                )}
                <Svg width={dimensions.width} height={dimensions.height}>
                  <Group transform={{ translate: [dimensions.width / 2, dimensions.height / 2] }}>
                    <Pie
                      data={series.data}
                      value={datum => datum.value}
                      id={datum => datum.key}
                      sort={(a, b) => {
                        const sortFunctionFactory =
                          get(this.props.data, 'series.common.metadata.type') === 'text' ?
                            sortAlphabetically
                            :
                            sortChronologically
                          ;

                        return sortFunctionFactory(a, b, ({ key }) => key);
                      }}
                    >{nodes => (
                      <Group>
                        {nodes.map(({
                          startAngle,
                          endAngle,
                          data: { key, value },
                        }, i) => {
                          const color = this.getColor(key, i);
                          const midAngle = (((endAngle - startAngle) / 2) + startAngle) -
                            (Math.PI / 2);
                          const labelPosition = positionFromAngle(midAngle, diameter * 0.4);
                          const edgePosition = positionFromAngle(midAngle, diameter * 0.3);
                          const colorpickerPlacement = labelPosition.x < 0 ?
                            'right' :
                            'left';

                          return (
                            <Group key={key}>
                              {(this.state.isPickingColor === key) && (
                                <Portal node={this.wrap}>
                                  <ColorPicker
                                    left={dimensions.width / 2}
                                    top={dimensions.height / 2}
                                    placement={colorpickerPlacement}
                                    title={`Pick color: ${key}`}
                                    color={color}
                                    onChange={({ hex }) => {
                                      onChangeVisualisationSpec({
                                        colors: {
                                          ...colorMapping,
                                          [this.state.isPickingColor]: hex,
                                        },
                                      });
                                      this.setState({ isPickingColor: null });
                                    }}
                                  />
                                </Portal>
                              )}
                              <Arc
                                key={i}
                                innerRadius={innerRadius}
                                outerRadius={diameter *
                                  (get(this.state, 'hoveredNode') === key ? 0.31 : 0.3)}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={color}
                                stroke="white"
                                cursor={edit ? 'pointer' : 'default'}
                                onClick={(event) => {
                                  this.handleClickNode({ key }, event);
                                }}
                                onMouseEnter={(event) => {
                                  this.handleMouseEnterNode({ key, value, totalCount }, event);
                                }}
                                onMouseMove={(event) => {
                                  this.handleMouseEnterNode({ key, value, totalCount }, event);
                                }}
                                onMouseLeave={() => {
                                  this.handleMouseLeaveNode({ key });
                                }}
                              />
                              {this.renderLabel({
                                key,
                                value,
                                midAngle,
                                labelPosition,
                                edgePosition,
                                totalCount,
                                angle: endAngle - startAngle,
                              })}
                            </Group>
                          );
                        })}
                      </Group>
                    )}</Pie>
                  </Group>
                </Svg>
              </div>
            );
          }}</ResponsiveWrapper>
        }
      />
    );
  }

}
