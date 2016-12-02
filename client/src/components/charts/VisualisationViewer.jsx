import React, { PropTypes } from 'react';
import Chart from './Chart';
import MapVisualisation from './MapVisualisation';

export default function VisualisationViewer(props) {
  switch (props.visualisation.visualisationType) {
    case 'bar':
    case 'line':
    case 'area':
    case 'donut':
    case 'pie':
    case 'scatter':
    case 'auto':
      if (props.visualisation.datasetId === null) {
        return null;
      }

      if (props.visualisation.spec.datasetColumnX === null
        && props.visualisation.spec.datasetColumnY === null) {
        return (
          <span
            style={{
              display: 'flex',
              flex: '1',
              justifyContent: 'center',
              alignSelf: 'center',
            }}
          > Choose a column to get started </span>
        );
      }
      return (
        <Chart
          {...props}
        />
      );

    case 'map':
      return (
        <MapVisualisation
          {...props}
        />
      );

    default:
      throw new Error(`Unknown chart type ${props.visualisation.visualisationType}
        supplied to VisualisationViewer`);
  }
}

VisualisationViewer.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
