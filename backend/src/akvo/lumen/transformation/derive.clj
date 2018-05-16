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
  (log/debug :set-cells-values! data)
  (->> data
       (map (fn [[i v]] (set-cell-value conn (merge {:value v :rnum i} opts))))
       doall))

(defn delete-rows! [conn opts data]
  (log/debug :delete-rows data)
  (->> data
       (map (fn [[i]] (delete-row conn (merge {:rnum i} opts))))
       doall))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (time* :derive
          (let [{:keys [::code
                        ::column-title
                        ::column-type]} (args op-spec)
                new-column-name         (engine/next-column-name columns)
                row-fn                  (time* :row-tx-fn
                                               (js-engine/>fun {:columns     columns
                                                                :code        code
                                                                :column-type column-type}))
                js-execution-seq        (time* :js-exec
                                               (->> (all-data conn {:table-name table-name})
                                                    (map (fn [i]
                                                           (let [[res i v] (row-fn i)]
                                                             (if (= :success res)
                                                               [i :set-value! v]
                                                               (do
                                                                 (log/warn v :js-execution-ex code i)
                                                                 (condp = (engine/error-strategy op-spec)
                                                                   "leave-empty" [i :set-value! nil]
                                                                   "delete-row"  [i :delete-row!]
                                                                   ;; interrupt js execution
                                                                   "fail"        (throw v)))))))
                                                    doall))
                base-opts               {:table-name  table-name
                                         :column-name new-column-name}]
            (time* :add-column
                   (add-column conn {:table-name      table-name
                                     :column-type     (lumen->pg-type column-type)
                                     :new-column-name new-column-name}))
            (time* :set-cells-values
                   (set-cells-values! conn base-opts (js-execution>sql-params js-execution-seq :set-value!)))
            (time* :delete-rows!
                   (delete-rows! conn base-opts (js-execution>sql-params js-execution-seq :delete-row!)))      
            {:success?      true
             :execution-log [(format "Derived columns using '%s'" code)]
             :columns       (conj columns {"title"      column-title
                                           "type"       column-type
                                           "sort"       nil
                                           "hidden"     false
                                           "direction"  nil
                                           "columnName" new-column-name})}))))
