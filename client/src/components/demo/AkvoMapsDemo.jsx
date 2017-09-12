import React, { Component } from 'react';
import { Map, TileLayer } from 'react-leaflet';
import moment from 'moment';
import * as api from '../../api';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('../charts/MapVisualisation.scss');

const baseURL = '/maps/lumen_tenant_1/layergroup';

const table = 'ds_935251f7_5022_4663_92b9_b1409974f69d';

const mapConfig = {
  version: '1.6.0',
  layers: [
    {
      type: 'mapnik',
      options: {
        srid: 4326,
        sql: `select * from ${table}`,
        geom_column: 'd2',
        cartocss: '#s { marker-width: 10; marker-fill: #e00050; }',
        cartocss_version: '2.0.0',
        interactivity: 'c1',
      },
    },
  ],
};

export default class AkvoMapsDemo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lastUpdated: null,
      layerGroupId: null,
      layers: [],
    };
  }

  componentDidMount() {
    const timestamp = moment().unix();
    const headers = {
      'x-db-host': 'postgres',
      'x-db-port': 5432,
      'x-db-user': 'lumen',
      'x-db-password': 'password',
      'x-db-last-update': timestamp,
    };
    api.post(baseURL, mapConfig, headers)
      .then(response => response.json())
      .then(({ layergroupid, metadata }) => this.setState({
        layerGroupId: layergroupid,
        layers: metadata.layers,
      }));
  }

  render() {
    const center = [0, 0];
    const width = 800;
    const height = 600;
    const zoom = 2;
    const title = 'Windshaft map demo';
    const titleLength = title.toString().length;
    const titleHeight = titleLength > 48 ? 56 : 36;
    const mapHeight = height - titleHeight;
    const layerGroupId = this.state.layerGroupId;

    return (
      <div
        className="MapVisualisation dashChart"
        style={{ width, height }}
      >
        <h2
          style={{
            height: titleHeight,
            lineHeight: titleLength > 96 ? '16px' : '20px',
            fontSize: titleLength > 96 ? '14px' : '16px',
          }}
        >
          <span>{title}</span>
        </h2>
        <Map
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          key={width}
          style={{ width, height: mapHeight }}
        >
          <TileLayer
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
          />
          {(layerGroupId != null) &&
            <TileLayer
              url={`${baseURL}/${layerGroupId}/{z}/{x}/{y}.png`}
            />
          }
        </Map>
      </div>
    );
  }
}
