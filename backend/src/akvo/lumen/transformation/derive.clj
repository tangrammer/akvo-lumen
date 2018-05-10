(ns akvo.lumen.transformation.derive
  (:require [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [akvo.lumen.transformation.engine :as engine]
            [clj-time.coerce :as tc]
            [akvo.lumen.util :refer (time*)]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/derive.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn lumen->pg-type [type]
  (condp = type
    "text"   "text"
    "number" "double precision"
    "date"   "timestamptz"))

(defn args [op-spec]
  (let [{code         "code"
         column-title "newColumnTitle"
         column-type  "newColumnType"} (engine/args op-spec)]
    {::code code ::column-title column-title ::column-type column-type}))

(defmethod engine/valid? :core/derive
  [op-spec]
  (let [{:keys [::code
                ::column-title
                ::column-type]} (args op-spec)]
    (and (string? column-title) 
         (engine/valid-type? column-type)
         (#{"fail" "leave-empty" "delete-row"} (engine/error-strategy op-spec))
         (js-engine/evaluable? code))))

(defn js-execution>sql-params [js-seq result-kw]
  (->> js-seq
       (filter (fn [[j r i]]
                 (= r result-kw)))
       (map (fn [[i _ v]] [i v]))))

(defn set-cells-values! [conn opts data]
  (set-cells-value conn (merge opts {:params data})))

(defn delete-rows! [conn opts data]
  (when (not-empty data)
    (delete-rows conn (merge opts {:rnums (mapv first data)}))))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (time* :derive
           (let [{:keys [::code
                         ::column-title
                         ::column-type]} (args op-spec)
                 new-column-name         (engine/next-column-name columns)
                 row-fn                   (time* :row-transform-fn
                                                      (js-engine/row-transform-fn {:columns     columns
                                                                                   :code        code
                                                                                   :column-type column-type}))
                 data (time* :all-data (all-data conn {:table-name table-name}))
                 js-execution-seq        (time* :js-execution-seq
                                                (->> data
                                                     (map (fn [i]
                                                            (try
                                                              [(:rnum i) :set-value! (row-fn i)]
                                                              (catch Exception e
                                                                (condp = (engine/error-strategy op-spec)
                                                                  "leave-empty" [(:rnum i) :set-value! nil]
                                                                  "delete-row"  [(:rnum i) :delete-row!]
                                                                  ;; interrupt js execution
                                                                  "fail"        (throw e))))))
             ;;                                        doall
                                                     ))
                 base-opts               {:table-name  table-name
                                          :column-name new-column-name
                                          :column-type (lumen->pg-type column-type)}]
             (time* :add-column
                    (add-column conn (merge base-opts {:new-column-name new-column-name})))

             (time* :set-db-values
                    (doall (map #(do
                                   (set-cells-values! conn base-opts (js-execution>sql-params  % :set-value!))
                                   (delete-rows! conn base-opts (js-execution>sql-params % :delete-row!)))
                                (partition 1000 js-execution-seq))))
             
             {:success?      true
              :execution-log [(format "Derived columns using '%s'" code)]
              :columns       (conj columns {"title"      column-title
                                            "type"       column-type
                                            "sort"       nil
                                            "hidden"     false
                                            "direction"  nil
                                            "columnName" new-column-name})}))))
