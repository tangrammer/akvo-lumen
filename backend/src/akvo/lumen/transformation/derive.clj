(ns akvo.lumen.transformation.derive
  (:require [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [akvo.lumen.transformation.engine :as engine]
            [clj-time.coerce :as tc]
            [manifold.stream :as m.s]
            [manifold.bus :as m.b]
            [manifold.deferred :as m.d]
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

(defn error-handling [op-spec conn base-opts throw-error-fn]
  (condp = (engine/error-strategy op-spec)
    "leave-empty" (fn [[i e :as o]]
                    (log/warn :ex-leave-empty (.getMessage e))
                    (set-cell-value conn (merge {:value nil :rnum i} base-opts)))

    "delete-row" (fn [[i e :as o]]
                   (log/warn :ex-delete-row (.getMessage e))
                   (delete-row conn (merge {:rnum i} base-opts)))

    "fail" (fn [[i e :as o]]
             (log/warn :ex-fail-row (.getMessage e))
             (throw-error-fn e))))

(defn set-cells-values! [conn opts data]
  (set-cells-value conn (merge opts {:params data})))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (time* :derive
           (let [{:keys [::code
                         ::column-title
                         ::column-type]} (args op-spec)
                 new-column-name (engine/next-column-name columns)

                 data (all-data conn {:table-name table-name})
                 sql-stream (m.s/buffered-stream 8000)
                 [main-stream
                  success-stream
                  fail-stream] (js-engine/execute!
                                data                                                 
                                {:columns     columns
                                 :code        code
                                 :column-type column-type})
                 base-opts     {:table-name  table-name
                                :column-name new-column-name
                                :column-type (lumen->pg-type column-type)}
                 res-error (m.d/deferred)
                 fail-fun (error-handling op-spec conn base-opts
                                          (fn [e]
                                            (log/error e)
                                            (m.s/close! main-stream)
                                            (m.d/error! res-error e)))]
             (time* :add-column
                    (add-column conn (merge base-opts {:new-column-name new-column-name})))
             (time* :Set-vals
                    @(m.d/let-flow [res-success (-> (fn [[i v :as o]]
                                                      ;;               (log/warn :Rnum i)
                                                      (let [d (m.s/description sql-stream)
]
                                                        (if (>= (d :buffer-size) (d :buffer-capacity))
                                                          (->> (reduce (fn [c _]
                                                                         (conj c @(m.s/take! sql-stream)))
                                                                       [] (range (d :buffer-size)))
                                                               (set-cells-values! conn base-opts))
                                                          (m.s/put! sql-stream o))))
                                            (m.s/consume success-stream))

                                    res-fail (m.s/consume fail-fun fail-stream)]

                       [res-success res-fail]))
             (if-not (m.d/realized? res-error)
               {:success?      true
                :execution-log [(format "Derived columns using '%s'" code)]
                :columns       (conj columns {"title"      column-title
                                              "type"       column-type
                                              "sort"       nil
                                              "hidden"     false
                                              "direction"  nil
                                              "columnName" new-column-name})}
               @res-error)))))
