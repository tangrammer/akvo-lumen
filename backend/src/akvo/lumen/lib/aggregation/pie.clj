(ns akvo.lumen.lib.aggregation.pie
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.filter :as filter]
            [akvo.lumen.lib.aggregation.utils :as utils]
            [clojure.java.jdbc :as jdbc]))

(defn- run-query [tenant-conn table-name column-name filter-sql]
  (rest (jdbc/query tenant-conn
                    [(format "SELECT %1$s, count(*) FROM %2$s WHERE %3$s GROUP BY %1$s"
                             column-name table-name filter-sql)]
                    {:as-arrays? true})) )

(defn query
  [tenant-conn {:keys [columns table-name]} query]
  (let [filter-sql (filter/sql-str columns (:filters query))
        bucket-column (utils/find-column columns (:bucketColumn query))
        bucket-column-name (:columnName bucket-column)
        counts (run-query tenant-conn table-name bucket-column-name filter-sql)]
    (lib/ok {"metadata" {"bucketColumnTitle" (:title bucket-column)
                         "bucketColumnType" (:type bucket-column)}
             "data" (mapv (fn [[bucket-value bucket-count]]
                            {"bucketValue" bucket-value
                             "bucketCount" bucket-count})
                          counts)})))
