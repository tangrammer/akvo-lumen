(ns akvo.lumen.transformation.derive
  (:require [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/derive.sql")
(hugsql/def-sqlvec-fns "akvo/lumen/transformation/derive.sql")

(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")

(defn handle-transform-exception
  [exn conn on-error table-name column-name rnum]
  (condp = on-error
    "leave-empty" (set-cells-value conn {:table-name  table-name
                                         :column-name column-name
                                         :rnums       [rnum]
                                         :value       nil})
    "fail"        (throw exn)
    "delete-row"  (delete-rows conn {:table-name table-name
                                     :rnums      [rnum]})))

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
  (let [{:keys [::code ::column-title ::column-type]} (args op-spec)]
    (and (string? column-title) ;; TODO: ... should that be checked at other level .... endpoint???
         (engine/valid-type? column-type) ;; same applies here ...
         (#{"fail" "leave-empty" "delete-row"} (engine/error-strategy op-spec)) ;; too
         (js-engine/evaluable? code))))

(defn js-execution>sql-params [js-seq result-kw & error-type]
  (->> js-seq
       (take-while (fn [[_ r v]]
                     (and
                      (= r result-kw)
                      (if error-type (= v error-type) true))))
       (map (fn [[i _ v]] [i v]))))

(def max-items-to-process 8000)

(defn set-cells-values! [conn opts data]
  (pmap #(set-cells-values conn (merge {:params %} opts)) (partition-all max-items-to-process data)))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [::code
                  ::column-title
                  ::column-type]} (args op-spec)
          new-column-name         (engine/next-column-name columns)
          row-fn                  (js-engine/row-transform-fn {:columns     columns
                                                               :code        code
                                                               :column-type column-type})
          js-execution-seq        (->> (all-data conn {:table-name table-name})
                                       (map (fn [i]
                                              (try
                                                [(:rnum i) :success (row-fn i)]
                                                (catch Exception e [(:rnum i) :error (engine/error-strategy op-spec)])))))
          base-opts               {:table-name  table-name
                                   :column-name new-column-name}]
      (add-column conn {:table-name      table-name
                        :column-type     (lumen->pg-type column-type)
                        :new-column-name new-column-name})

      (set-cells-values! conn base-opts (js-execution>sql-params js-execution-seq :success))
      
      {:success?      true
       :execution-log [(format "Derived columns using '%s'" code)]
       :columns       (conj columns {"title"      column-title
                                     "type"       column-type
                                     "sort"       nil
                                     "hidden"     false
                                     "direction"  nil
                                     "columnName" new-column-name})})))

;; to debug queries use suffix -sqlvec =>     (log/debug :SQL (set-cells-values-sqlvec sql-success-opts))
