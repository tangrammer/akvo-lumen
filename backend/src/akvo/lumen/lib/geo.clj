(ns akvo.lumen.lib.geo
  (:require [garden.core :refer [css]]))

(def ^:private versions
  {:cartocss  "2.0.1"
   :mapconfig "1.6.0"})

(defn- get-sql
  "Builds a Windshaft `MapConfig` SQL query"
  [table-name]
  (format "SELECT * FROM %s" table-name))

(defn- cartocss
  "Converts the styles in the given `mapSpec` to CartoCSS"
  [{:keys [pointColorColumn pointColorMapping pointSize popup]}]
  (css {:#layer {}}))

(defn- layer
  "Converts the given Lumen `mapSpec` layer to  a Windshaft `MapConfig` layer"
  [table-name {:keys [datasetId geopointColumn] :as layer}]
  (let [config {:id datasetId :type "mapnik"}]
    (into config {:options {:attributes       {:columns []
                                               :id      "?"}
                            :cartocss         (cartocss layer)
                            :cartocss_version (:cartocss version)
                            :geom_column      geopointColumn
                            :geom_type        "geometry"
                            :sql              (get-sql table-name)
                            :srid             4326}})))

(defn mapspec->mapconfig
  "Converts the given Lumen `mapSpec` to a Windshaft `MapConfig`"
  [table-name {:keys [layers] :as spec}]
  (let [config {:srid 4326 :version (:mapconfig versions)}]
    (into config {:layers (mapv #(layer table-name %) layers)})))

#_()
