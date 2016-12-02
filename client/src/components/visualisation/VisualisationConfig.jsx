import React, { PropTypes } from 'react';
import VisualisationTypeMenu from './VisualisationTypeMenu';
import ConfigMenu from './ConfigMenu';

require('../../styles/VisualisationConfig.scss');

const getConfigMenu = (chartType, componentProps) => {
  const configMenu = (
    <ConfigMenu
      visualisation={componentProps.visualisation}
      datasets={componentProps.datasets}
      onChangeTitle={componentProps.onChangeTitle}
      onChangeSourceDataset={componentProps.onChangeSourceDataset}
      onChangeVisualisationSpec={componentProps.onChangeVisualisationSpec}
      rootState={componentProps.rootState}
      setRootState={componentProps.setRootState}
      onChangeVisualisationType={componentProps.onChangeVisualisationType}
    />
  );

  return configMenu;
};

export default function VisualisationConfig(props) {
  const visualisation = props.visualisation;
  const configMenu = getConfigMenu(visualisation.visualisationType, props);

  return (
    <div className="VisualisationConfig">
      {configMenu}
      <div className="saveContainer">
        <button
          className="saveChanges clickable"
          onClick={props.onSaveVisualisation}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

VisualisationConfig.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
};
