import React, { Component, PropTypes } from 'react';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';
import VisualisationViewer from '../charts/VisualisationViewer';

require('../../styles/VisualisationEditor.scss');

export default class VisualisationEditor extends Component {
  constructor() {
    super();
    this.state = {
      datasetId: null,
      draggedColumn: null,
      columnX: null,
      columnY: null,
      labelX: null,
      title: '',
      datasetNameColumnX: null,
      datasetNameColumnX: null,
    };
  }
  render() {
    const props = this.props;

    return (
      <div className="VisualisationEditor">
        <VisualisationConfig
          rootState={this.state}
          setRootState={(newState) => { this.setState(newState); }}
          {...props}
        />
        <div style={{
          display: 'flex',
          flex: 1,
        }}
        >
          <VisualisationViewer
            visualisation={props.visualisation}
            datasets={props.datasets}
          />
        </div>
      </div>
    );
  }
}

VisualisationEditor.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

/*
      <VisualisationPreview
        visualisation={props.visualisation}
        datasets={props.datasets}
      />
*/
