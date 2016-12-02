import getVegaScatterSpec from './Scatter';
import getVegaPieSpec from './Pie';
import getVegaAreaSpec from './Area';
import getVegaBarSpec from './Bar';

export default function getVegaAutoSpec(visualisation, data, containerHeight, containerWidth) {
  const hasAggregation = Boolean(visualisation.spec.datasetGroupColumnX);
  const dataArray = data.map(item => item);
  const transformType = hasAggregation ? visualisation.spec.aggregationTypeY : null;
  const deets = visualisation.spec;

  if (hasAggregation) {
    const transform1 = {
      name: 'summary',
      source: 'table',
      transform: [
        {
          type: 'aggregate',
          groupby: ['aggregationValue'],
          summarize: {
            y: [
              transformType,
            ],
            sortValue: [
              transformType,
            ],
          },
        },
      ],
    };
    dataArray.push(transform1);
  }

  const dataSource = hasAggregation ? 'summary' : 'table';
  const hasSort = visualisation.spec.datasetSortColumnX !== null;
  const fieldX = hasAggregation ? 'aggregationValue' : 'x';
  const fieldY = hasAggregation ? `${transformType}_y` : 'y';

  let sort = null;
  let reverse = false;

  if (hasAggregation && hasSort) {
    // Vega won't use an operation on text, so just set sort to "true" for text types
    sort = visualisation.spec.datasetSortColumnXType === 'text' ? 'true' : {
      field: `${transformType}_sortValue`,
      op: 'mean',
    };
    reverse = visualisation.spec.reverseSortX;
  }

  let out = {
    data: dataArray,
    width: containerWidth - 100,
    height: 25,
    padding: {
      top: 30,
      left: 50,
      bottom: 40,
      right: 50,
    },
  };

  if (deets.datasetColumnX !== null && deets.datasetColumnY === null) {
    if (deets.datasetColumnXType === 'number') {
      out = {
        data: dataArray,
        width: containerWidth - 100,
        height: 25,
        padding: {
          top: 130,
          left: 50,
          bottom: 140,
          right: 400,
        },
      };

      out.scales = [
        {
          name: 'x',
          type: 'linear',
          domain: {
            data: dataSource,
            field: fieldY,
          },
          round: true,
          nice: true,
          rangeMin: 0,
          rangeMax: 400,
          zero: true,
        },
      ];

      if (deets.colorColumn !== null) {
        out.scales.push({
          name: 'color',
          type: 'linear',
          domain: { data: dataSource, field: 'colorValue' },
          range: ['#AFC6A3', '#09622A'],
          nice: false,
          zero: false,
        });
      }

      out.axes = [
        {
          type: 'x',
          scale: 'x',
          format: 's',
          grid: true,
          layer: 'back',
          ticks: 5,
          title: deets.labelX,
        },
      ];

      out.marks = [
        {
          name: 'marks',
          type: 'rect',
          from: { data: dataSource },
          properties: {
            update: {
              xc: { scale: 'x', field: fieldY },
              yc: { value: 18 },
              width: { value: 2 },
              height: { value: 14 },
              opacity: { value: 0.7 },
              fill: { value: '#4682b4' },
            },
          },
        },
      ];

      out.legends = [];

      if (deets.colorColumn !== null) {
        out.marks[0].properties.update.fill = {
          scale: 'color',
          field: 'colorValue',
        };
      }

      if (deets.colorColumn !== null) {
        out.legends.push(
          {
            fill: 'color',
            title: deets.colorTitle,
            format: 's',
            properties: {
              symbols: {
                shape: { value: 'circle' },
                strokeWidth: { value: 0 },
                opacity: { value: 0.7 },
              },
            },
          }
        );
      }

      if (deets.sizeColumn !== null) {
        out.scales.push({
          name: 'size',
          type: 'linear',
          domain: { data: dataSource, field: 'sizeValue' },
          range: [5, 200],
          nice: false,
          zero: false,
        });

        out.legends.push(
          {
            size: 'size',
            title: deets.sizeTitle,
            format: 's',
            properties: {
              symbols: {
                shape: { value: 'circle' },
                strokeWidth: { value: 2 },
                opacity: { value: 0.7 },
              },
            },
          }
        );

        out.marks[0].type = 'symbol';
        delete out.marks[0].properties.update.width;
        delete out.marks[0].properties.update.height;

        out.marks[0].properties.shape = { value: 'circle' };
        out.marks[0].properties.strokeWidth = { value: 2 };
        out.marks[0].properties.update.size = {
          scale: 'size',
          field: 'sizeValue',
        };
      }
    }
  }

  if (deets.datasetColumnX === null && deets.datasetColumnY !== null) {
    if (deets.datasetColumnYType === 'number') {
      out = {
        data: dataArray,
        width: 100,
        height: 500,
        padding: {
          top: 30,
          left: 50,
          bottom: 40,
          right: 400,
        },
      };

      out.scales = [
        {
          name: 'y',
          type: 'linear',
          domain: {
            data: dataSource,
            field: fieldY,
          },
          round: true,
          nice: true,
          rangeMin: 0,
          rangeMax: 400,
          zero: true,
        },
      ];

      if (deets.colorColumn !== null) {
        out.scales.push({
          name: 'color',
          type: 'linear',
          domain: { data: dataSource, field: 'colorValue' },
          range: ['#AFC6A3', '#09622A'],
          nice: false,
          zero: false,
        });
      }

      out.axes = [
        {
          type: 'y',
          scale: 'y',
          format: 's',
          grid: true,
          layer: 'back',
          ticks: 5,
          title: deets.labelY,
        },
      ];

      out.marks = [
        {
          name: 'marks',
          type: 'rect',
          from: { data: dataSource },
          properties: {
            update: {
              yc: { scale: 'y', field: fieldY },
              yx: { value: 18 },
              height: { value: 2 },
              width: { value: 14 },
              opacity: { value: 0.7 },
              fill: { value: '#4682b4' },
            },
          },
        },
      ];

      out.legends = [];

      if (deets.colorColumn !== null) {
        out.marks[0].properties.update.fill = {
          scale: 'color',
          field: 'colorValue',
        };
      }

      if (deets.colorColumn !== null) {
        out.legends.push(
          {
            fill: 'color',
            title: deets.colorTitle,
            format: 's',
            properties: {
              symbols: {
                shape: { value: 'circle' },
                strokeWidth: { value: 0 },
                opacity: { value: 0.7 },
              },
            },
          }
        );
      }
    }
  }

  if (deets.datasetColumnX !== null && deets.datasetColumnY !== null) {
    if (deets.datasetColumnXType === 'date') {
      return getVegaAreaSpec(visualisation, data, containerHeight, containerWidth);
    }
    if (deets.datasetColumnXType === 'text') {
      out = {
        width: 300,
        height: 300,
        data: dataArray,
        marks: [
          {
            name: 'marks',
            type: 'rect',
            from: { data: dataSource },
            properties: {
              update: {
                xc: { scale: 'x', field: fieldX },
                yc: { scale: 'y', field: fieldY },
                width: { value: 14 },
                height: { value: 1 },
                opacity: { value: 0.7 },
                fill: { value: '#4682b4' },
              },
            },
          },
        ],
        scales: [
          {
            name: 'x',
            type: 'ordinal',
            domain: { data: dataSource, field: fieldX, sort: true },
            bandSize: 21,
            round: true,
            points: true,
            padding: 1,
          },
          {
            name: 'y',
            type: 'linear',
            domain: { data: dataSource, field: fieldY },
            rangeMin: 300,
            rangeMax: 0,
            round: true,
            nice: true,
            zero: true,
          },
        ],
        axes: [
          {
            type: 'x',
            scale: 'x',
            grid: false,
            ticks: 5,
            title: deets.labelX,
            properties: {
              labels: {
                text: { template: '{{ datum["data"] | truncate:25 }}' },
                angle: { value: 270 },
                align: { value: 'right' },
                baseline: { value: 'middle' },
              },
            },
          },
          {
            type: 'y',
            scale: 'y',
            format: 's',
            grid: true,
            layer: 'back',
            title: deets.labelY,
          },
        ],
      };
    } else {
      out = {
        width: 300,
        height: 300,
        padding: 'auto',
        data: dataArray,
        scales: [
          {
            name: 'x',
            type: 'linear',
            domain: { data: dataSource, field: fieldX },
            range: 'width',
            round: true,
            nice: true,
            zero: true,
          },
          {
            name: 'y',
            type: 'linear',
            domain: { data: dataSource, field: fieldY },
            range: 'height',
            round: true,
            nice: true,
            zero: true,
          },
        ],
        axes: [
          {
            type: 'x',
            scale: 'x',
            format: 's',
            grid: true,
            layer: 'back',
            ticks: 5,
            title: deets.labelX,
          },
          {
            type: 'y',
            scale: 'y',
            format: 's',
            grid: true,
            layer: 'back',
            title: deets.labelY,
          },
        ],
        marks: [
          {
            name: 'marks',
            type: 'symbol',
            from: { data: dataSource },
            properties: {
              update: {
                x: { scale: 'x', field: fieldX },
                y: { scale: 'y', field: fieldY },
                size: { value: 30 },
                shape: { value: 'circle' },
                strokeWidth: { value: 2 },
                opacity: { value: 0.9 },
                fillOpacity: { value: 0 },
                stroke: { value: '#4682b4' },
                fill: { value: 'transparent' },
              },
            },
          },
        ],
        legends: [],
      };
    }

    if (deets.colorColumn !== null) {
      out.scales.push({
        name: 'color',
        type: 'linear',
        domain: { data: dataSource, field: 'colorValue' },
        range: ['#AFC6A3', '#09622A'],
        nice: false,
        zero: false,
      });

      if (out.legends == null) {
        out.legends = [];
      }

      out.legends.push(
        {
          fill: 'color',
          title: deets.colorTitle,
          format: 's',
          properties: {
            symbols: {
              shape: { value: 'circle' },
              strokeWidth: { value: 0 },
              opacity: { value: 0.7 },
            },
          },
        }
      );

      out.marks[0].properties.update.stroke = {
        scale: 'color',
        field: 'colorValue',
      };
      out.marks[0].properties.update.fill = {
        scale: 'color',
        field: 'colorValue',
      };
    }

    if (deets.sizeColumn !== null) {
      out.scales.push({
        name: 'size',
        type: 'linear',
        domain: { data: dataSource, field: 'sizeValue' },
        range: [5, 200],
        nice: false,
        zero: false,
      });

      out.legends.push(
        {
          size: 'size',
          title: deets.sizeTitle,
          format: 's',
          properties: {
            symbols: {
              shape: { value: 'circle' },
              strokeWidth: { value: 2 },
              opacity: { value: 0.7 },
            },
          },
        }
      );

      out.marks[0].type = 'symbol';
      delete out.marks[0].properties.update.width;
      delete out.marks[0].properties.update.height;

      out.marks[0].properties.shape = { value: 'circle' };
      out.marks[0].properties.strokeWidth = { value: 2 };
      out.marks[0].properties.update.size = {
        scale: 'size',
        field: 'sizeValue',
      };
    }
  }

  return out;

  /*

  return ({

    scales: [
      {
        name: 'x',
        type: 'ordinal',
        range: 'width',
        domain: {
          data: dataSource,
          field: fieldX,
          sort,
        },
        reverse,
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        domain: {
          data: dataSource,
          field: fieldY,
        },
        nice: true,
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        title: visualisation.spec.labelX,
        tickPadding: 0,
        properties: {
          labels: (visualisation.spec.datasetNameColumnX === null && !hasAggregation) ?
            // Supply an empty object to use the default axis labels
            {}
            :
            // Force the axis labels to be blank - we will provide our own
            {
              text: {
                value: '',
              },
            }
          ,
        },
      },
      {
        type: 'y',
        scale: 'y',
        title: visualisation.spec.labelY,
      },
    ],
    marks: [
      {
        name: 'bars',
        type: 'rect',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              scale: 'x',
              field: fieldX,
            },
            width: {
              scale: 'x',
              band: true,
              offset: -1,
            },
            y: {
              scale: 'y',
              field: fieldY,
            },
            y2: {
              scale: 'y',
              value: 0,
            },
          },
          update: {
            fill: {
              value: 'rgb(149, 150, 184)',
            },
          },
          hover: {
            fill: {
              value: 'rgb(43, 182, 115)',
            },
          },
        },
      },
      {
        type: 'text',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              scale: 'x',
              field: fieldX,
            },
            y: {
              scale: 'y',
              value: 0,
              offset: 20,
            },
            dy: {
              scale: 'x',
              band: 'true',
              mult: '-0.5',
            },
            fill: {
              value: 'black',
            },
            align: {
              value: 'left',
            },
            baseline: {
              value: 'middle',
            },
            text: (visualisation.spec.datasetNameColumnX !== null || hasAggregation) ?
              {
                template: hasAggregation ? '{{datum.aggregationValue}}' : '{{datum.label}}',
              }
              :
              {
                value: '',
              },
            angle: {
              value: 90,
            },
          },
        },
      },
      {
        type: 'text',
        properties: {
          enter: {
            align: {
              value: 'center',
            },
            fill: {
              value: 'black',
            },
          },
          update: {
            x: {
              scale: 'x',
              signal: `tooltip.${fieldX}`,
            },
            dx: {
              scale: 'x',
              band: true,
              mult: 0.5,
            },
            y: {
              scale: 'y',
              signal: `tooltip.${fieldY}`,
              offset: -5,
            },
            text: {
              signal: 'tooltipText',
            },
            fillOpacity: [
              {
                test: '!tooltip._id',
                value: 0,
              },
              {
                value: 1,
              },
            ],
          },
        },
      },
    ],
    signals: [
      {
        name: 'tooltip',
        init: {},
        streams: [
          {
            type: 'rect:mouseover',
            expr: 'datum',
          },
          {
            type: 'rect:mouseout',
            expr: '{}',
          },
        ],
      },
      {
        name: 'tooltipText',
        init: {},
        streams: [
          {
            type: 'rect:mouseover',
            expr: hasAggregation ?
              // Round aggregation metrics to 3 decimal places for tooltip
              `floor(datum.${transformType}_y * 1000) / 1000`
              :
              'datum.y'
            ,
          },
          {
            type: 'rect:mouseout',
            expr: '{}',
          },
        ],
      },
    ],
  });
*/
}
