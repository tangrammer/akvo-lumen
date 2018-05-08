(ns akvo.lumen.transformation.derive
  (:require [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [akvo.lumen.transformation.engine :as engine]
            [clj-time.coerce :as tc]
            [manifold.stream :as m.s]
            [manifold.deferred :as m.d]
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

(def error-strategy #{"fail" "leave-empty" "delete-row"})

#_(def reactive-actions {:success :set-value!
                       :leave-empty false
                       :delete-row true
                       :fail :ss})

(defmethod engine/valid? :core/derive
  [op-spec]
  (let [{:keys [::code
                ::column-title
                ::column-type]} (args op-spec)]
    (and (string? column-title) 
         (engine/valid-type? column-type)
         (error-strategy (engine/error-strategy op-spec))
         (js-engine/evaluable? code))))

#_(defn set-cells-values! [conn opts data]
  (->> data
       (map (fn [[i v]] (set-cell-value conn (merge {:value v :rnum i} opts))))
       doall))

#_(defn delete-rows! [conn opts data]
  (->> data
       (map (fn [[i]] (delete-row conn (merge {:rnum i} opts))))
       doall))

(defmethod engine/apply-operation :core/derive
  [tenant-conn table-name columns op-spec]
  (jdbc/with-db-transaction [conn tenant-conn]
    (let [{:keys [::code
                  ::column-title
                  ::column-type]} (args op-spec)
          new-column-name         (engine/next-column-name columns)

          [success-stream fail-stream]   [(m.s/stream) (m.s/stream)]

          execution-stream  (js-engine/execute!
                             (all-data conn {:table-name table-name})
                             {:columns     columns
                              :code        code
                              :column-type column-type}
                             [success-stream fail-stream])
          
          base-opts        {:table-name  table-name
                            :column-name new-column-name}
          res-error (m.d/deferred)]

      (add-column conn {:table-name      table-name
                        :column-type     (lumen->pg-type column-type)
                        :new-column-name new-column-name})
      (m.s/consume  (fn [i]
                      (println :execution-i i))
                    execution-stream)

      (m.s/consume  (fn [[i v :as o] ]
                      (println :execution-success o)
                      (set-cell-value conn (merge {:value v :rnum i} base-opts)))
                    success-stream)
      
      (condp = (engine/error-strategy op-spec)
        "leave-empty" (m.s/consume
                       (fn [[i e :as o]]
                         (println :ex-leave-empty (.getMessage e))
                         (set-cell-value conn (merge {:value nil :rnum i} base-opts)))
                       fail-stream)
        "delete-row"  (m.s/consume
                       (fn [[i e :as o]]
                         (println :ex-delete-row (.getMessage e))
                         (delete-row conn (merge {:rnum i} base-opts)))
                       fail-stream)
        "fail"        (m.s/consume
                       (fn [[i e :as o]]
                         (println :ex-fail-row (.getMessage e))
                         (m.s/close! execution-stream)
                         (m.d/error! res-error e))
                       fail-stream))
      (when (m.d/realized? res-error) (throw @res-error))
      {:success?      true
       :execution-log [(format "Derived columns using '%s'" code)]
       :columns       (conj columns {"title"      column-title
                                     "type"       column-type
                                     "sort"       nil
                                     "hidden"     false
                                     "direction"  nil
                                     "columnName" new-column-name})})))


(comment
  (def x1 (->> (m.s/->source [])
               (m.s/map (fn [i] (str "I: " i)))))
  (do
    (m.s/consume (fn [i] (println i)) x1 ))

  (def hola (m.d/deferred ))
  (m.d/error! hola "hot")
  (m.d/realized? hola)
  (m.s/drained? x1)
  
  )
