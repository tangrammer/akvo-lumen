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

;; derive-actions

(defn db-set-cell-nil! [conn opts [rnum :as data]]
  (log/debug :db-set-cell-nil! :data data) 
  (set-cell-value conn (merge {:value nil :rnum rnum} opts)))

(defn db-remove-row! [conn opts [rnum :as data]]
  (log/debug :db-remove-row! :data data)
  (delete-row conn (merge {:rnum rnum} opts)))

(defn error-handling [error-map-cbs op-spec]
  (if-let [error-strategy-cb (get error-map-cbs (engine/error-strategy op-spec))]
    (fn [[i e :as o]]
      (log/warn :error-strategy (engine/error-strategy op-spec) (.getMessage e))
      (error-strategy-cb o))
    (throw (ex-info (str "not valid error strategy!" (engine/error-strategy op-spec) {})))))

(defn set-cells-values! [conn opts data-col]
  (log/info :set-cells-values! :data (count data-col))
  (set-cells-value conn (merge opts {:params data-col})))

(defn stop-stream-processing! [streams [rnum e :as data]]
  (log/error e)
  (doseq [s streams]
   (m.s/close! s))
  (throw e))

;; end-derive-actions

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (time* :derive
           (let [{:keys [::code
                         ::column-title
                         ::column-type]} (args op-spec)
                 new-column-name         (engine/next-column-name columns)
                 opts                    {:table-name  table-name
                                          :column-name new-column-name
                                          :column-type (lumen->pg-type column-type)}
                 _                       (time* :add-column
                                                (add-column conn (merge opts {:new-column-name new-column-name})))
                 data                    (all-data conn {:table-name table-name})]

             
             (let [[main-stream
                    success-stream
                    fail-stream :as streams]        (js-engine/execute!
                                                     data                                                 
                                                     {:columns     columns
                                                      :code        code
                                                      :column-type column-type})

                   stream-fail-cb    (-> {"leave-empty" (partial db-set-cell-nil! conn opts)
                                          "delete-row"  (partial db-remove-row! conn opts)
                                          "fail"        (partial stop-stream-processing! streams)}
                                         (error-handling op-spec))

                   stream-success-cb (partial set-cells-values! conn opts)
                                
                   ]
               (time*
                :Set-vals
                @(m.d/zip (->> success-stream
                               (m.s/batch 8000 300)
                               (m.s/consume stream-success-cb))
                          (->> fail-stream
                               (m.s/consume stream-fail-cb)))))

             
             {:success?      true
              :execution-log [(format "Derived columns using '%s'" code)]
              :columns       (conj columns {"title"      column-title
                                            "type"       column-type
                                            "sort"       nil
                                            "hidden"     false
                                            "direction"  nil
                                            "columnName" new-column-name})}))))
