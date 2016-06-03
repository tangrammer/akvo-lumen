import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import DashboardEditor from '../components/dashboard/DashboardEditor';
import EntityTypeHeader from '../components/entity-editor/EntityTypeHeader';
import * as actions from '../actions/dashboard';
import { fetchDataset } from '../actions/dataset';
import { push } from 'react-router-redux';

const getEditingStatus = location => {
  const testString = 'create';

  return location.pathname.indexOf(testString) === -1;
};

const getLayoutObjectFromArray = arr => {
  const object = {};

  arr.forEach(item => {
    const key = item.i;

    object[key] = item;
  });

  return object;
};

const getDashboardFromState = state => (
  {
    type: state.type,
    title: state.name,
    entities: state.entities,
    layout: getLayoutObjectFromArray(state.layout),
    id: state.id,
    created: state.created,
    modified: state.modified,
  }
);

class Dashboard extends Component {

  constructor() {
    super();
    this.state = {
      type: 'dashboard',
      name: 'Untitled dashboard',
      entities: {},
      layout: [],
      id: null,
      created: null,
      modified: null,
    };
    this.onAddVisualisation = this.onAddVisualisation.bind(this);
    this.updateLayout = this.updateLayout.bind(this);
    this.updateEntities = this.updateEntities.bind(this);
    this.onUpdateName = this.onUpdateName.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentWillMount() {
    const isEditingExistingDashboard = getEditingStatus(this.props.location);

    if (isEditingExistingDashboard) {
      const dashboardId = this.props.params.dashboardId;
      this.props.dispatch(actions.fetchDashboard(dashboardId));
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.dashboardId != null) {
      const dashboardIsEmpty = Boolean(Object.keys(this.state.entities).length === 0 &&
        this.state.layout.length === 0);

      if (dashboardIsEmpty) {
        const dash = nextProps.library.dashboards[nextProps.params.dashboardId];

        this.setState({
          id: dash.id,
          name: dash.title,
          entities: dash.entities,
          layout: Object.keys(dash.layout).map(key => dash.layout[key]),
          created: dash.created,
          modified: dash.modified,
        });

        Object.keys(dash.entities).forEach(key => {
          const entity = dash.entities[key];
          if (entity.type === 'visualisation') {
            this.onAddVisualisation(this.props.library.visualisations[key].datasetId);
          }
        });
      }
    }
  }

  onSave() {
    const { dispatch } = this.props;
    const dashboard = getDashboardFromState(this.state);
    this.setState({
      isUnsavedChanges: false,
    });
    if (this.state.id) {
      dispatch(actions.saveDashboardChanges(dashboard));
    } else {
      dispatch(actions.createDashboard(dashboard));
    }
    dispatch(push('/library?filter=dashboards&sort=created'));
  }

  onAddVisualisation(datasetId) {
    if (!this.props.library.datasets[datasetId].columns) {
      this.props.dispatch(fetchDataset(datasetId));
    }
  }

  onUpdateName(name) {
    this.setState({ name });
  }

  updateLayout(layout) {
    this.setState({ layout });
  }

  updateEntities(entities) {
    this.setState({ entities });
  }

  render() {
    return (
      <div className="Dashboard">
        <EntityTypeHeader
          title={this.state.name || this.state.title}
          saveStatus={'Saving not yet implemented'}
          actionButtons={[]}
        />
        <DashboardEditor
          dashboard={this.state}
          datasets={this.props.library.datasets}
          visualisations={this.props.library.visualisations}
          onAddVisualisation={this.onAddVisualisation}
          onSave={this.onSave}
          onUpdateLayout={this.updateLayout}
          onUpdateEntities={this.updateEntities}
          onUpdateName={this.onUpdateName}
        />
      </div>
    );
  }
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired,
  library: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
};

export default connect(state => state)(Dashboard);