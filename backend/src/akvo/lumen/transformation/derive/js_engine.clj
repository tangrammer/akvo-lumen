(ns akvo.lumen.transformation.derive.js-engine
  (:require [clojure.set :as set]
            [clojure.string :as str]
            [manifold.stream :as m.s]
            [manifold.bus :as m.b]
            [manifold.deferred :as m.d]
            [akvo.lumen.util :refer (time*)]
            [clojure.tools.logging :as log])
  (:import [java.util.concurrent Executors]
           [delight.nashornsandbox NashornSandboxes NashornSandbox]
           [javax.script ScriptEngine Invocable]))

(defn- throw-invalid-return-type [value]
  (throw (ex-info "Invalid return type"
                  {:value value
                   :type (type value)})))

(defn- column-function [fun code]
  (format "var %s = function(row) {  return %s; }" fun code))

(defn- valid-type? [value type]
  (when-not (nil? value)
    (condp = type
      "number" (if (and (number? value)
                        (if (float? value)
                          (java.lang.Double/isFinite value)
                          true))
                 value
                 (throw-invalid-return-type value))
      "text" (if (string? value)
               value
               (throw-invalid-return-type value))
      "date" (cond
               (number? value)
               (java.sql.Timestamp. (long value))

               (and (instance? jdk.nashorn.api.scripting.ScriptObjectMirror value)
                    (.containsKey value "getTime"))
               (java.sql.Timestamp. (long (.callMember value "getTime" (object-array 0))))

               :else
               (throw-invalid-return-type value)))))

(defn ^NashornSandbox js-engine []
  (time* :js-engine
         (let [maxmemory (* 1000 1024)
               maxtime 2000]
           (doto (NashornSandboxes/create)
             (.allowReadFunctions false)
             (.allowLoadFunctions false)
             (.allowPrintFunctions false)
             (.allowExitFunctions false)
             (.allowGlobalsObjects false)

             
             (.setMaxMemory maxmemory)
             (.setMaxCPUTime maxtime)

             ;; Specifies the executor service which is used to run scripts when a CPU time limit is specified.

             (.setExecutor (Executors/newSingleThreadExecutor))
             #_(.setExecutor (Executors/newFixedThreadPool 50))
             ))))

(defn- column-name->column-title
  "replace column-name by column-title"
  [columns]
  (let [key-translation (->> columns
                             (map (fn [{:strs [columnName title]}]
                                    [(keyword columnName) title]))
                             (into {}))]
    #(set/rename-keys % key-translation)))

(defn- eval*
  ([^NashornSandbox engine ^String code]
   (.eval ^NashornSandbox engine ^String code)))

(defn- invoke* [^Invocable invocable-engine ^String fun & args]
  (.invokeFunction invocable-engine fun (object-array args)))

(defn- invocation
  ([engine fun]
   (invocation engine fun nil))
  ([engine fun type*]
   (fn [& args]
     (let [res (apply invoke* (.getSandboxedInvocable engine) fun args)]
       (if (some? type*)
         (valid-type? res type*)
         res)))))

(defn- row-transform-fn
  [{:keys [columns code column-type]}]
  (let [adapter (column-name->column-title columns)
        engine (js-engine)
        fun-name "deriveColumn"
        typed-invocation (invocation engine fun-name column-type)]
    (eval* engine (column-function fun-name code))
    (fn [row]
      (->> row
           (adapter)
           (typed-invocation)))))

(defn evaluable? [code]
  (and (not (str/includes? code "function"))
       (not (str/includes? code "=>"))
       (let [try-code (column-function "try_js_sintax" code)]
         (try
           (eval* (js-engine) try-code) ;; invoke with sample row?
           true
           ;; Catches syntax errors
           (catch Exception e
             (log/warn :not-valid-js try-code)
             false)))))

(defn execute! [data opts]
  (let [row-fn (row-transform-fn opts)
        [success-stream fail-stream] [(m.s/buffered-stream 10000)(m.s/buffered-stream 10000)]
        routing-fun (fn [i]
                      (try
                        #_(log/warn :info [(:rnum i) (row-fn i)])
                        (m.s/try-put! success-stream [(:rnum i) (row-fn i)] 100)
                        #_(m.s/put! success-stream [(:rnum i) (row-fn i)])
                        (catch Exception e
                          (m.s/try-put! fail-stream [(:rnum i) e] 100)
                          #_(m.s/put! fail-stream [(:rnum i) e])
                          )))
        data-stream (->> data m.s/->source (m.s/map routing-fun))]
    (future (try
              (println "consuming main js stream in future" @(m.s/consume (fn [i] i) data-stream))
              
              (println "ending main js stream in future")
              (m.s/close! success-stream)
              (m.s/close! fail-stream)
              (println "streams closed!")
              (catch Exception e
                (do
                  (log/error e "consuming stream exception!")
                  (throw e)))))
    [data-stream success-stream fail-stream]))
