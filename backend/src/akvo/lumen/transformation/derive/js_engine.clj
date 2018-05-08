(ns akvo.lumen.transformation.derive.js-engine
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [manifold.stream :as m.s]
            [clojure.string :as str]
            [clojure.tools.logging :as log])
  (:import [javax.script ScriptEngineManager ScriptEngine Invocable ScriptContext Bindings]
           [jdk.nashorn.api.scripting NashornScriptEngineFactory ClassFilter]))

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

(def ^ClassFilter class-filter
  (reify ClassFilter
    (exposeToScripts [this s]
      false)))

(defn- remove-bindings [^Bindings bindings]
  (doseq [function ["print" "load" "loadWithNewGlobal" "exit" "quit" "eval"]]
    (.remove bindings function)))

(defn- column-name->column-title
  "replace column-name by column-title"
  [columns]
  (let [key-translation (->> columns
                             (map (fn [{:strs [columnName title]}]
                                    [(keyword columnName) title]))
                             (into {}))]
    #(clojure.set/rename-keys % key-translation)))

(defn- js-factory [] (NashornScriptEngineFactory.))

(defn- js-engine
  ([]
   (js-engine (js-factory)))
  ([factory]
   (let [engine (.getScriptEngine factory class-filter)]
     (remove-bindings (.getBindings engine ScriptContext/ENGINE_SCOPE))
     engine)))

(defn- eval*
  ([^ScriptEngine engine ^String code]
   (.eval ^ScriptEngine engine ^String code)))

(defn- invoke* [^Invocable engine ^String fun & args]
  (.invokeFunction engine fun (object-array args)))

(defn- invocation
  ([engine fun]
   (invocation engine fun nil))
  ([engine fun type*]
   (fn [& args]
     (let [res (apply invoke* engine fun args)]
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
        [success-stream fail-stream] [(m.s/stream) (m.s/stream)]
        routing-fun (fn [i]
                      (try
                        (log/warn :info [(:rnum i) (row-fn i)])
                        (m.s/put! success-stream [(:rnum i) (row-fn i)])
                        (catch Exception e
                          (m.s/put! fail-stream [(:rnum i) e]))))
        data-stream (->> data m.s/->source (m.s/map routing-fun))]
    ;; force consumption
    (m.s/consume (fn [i] (println :execution-i i)) data-stream)
    {:success-stream success-stream
     :fail-stream fail-stream
     :data-stream data-stream}))
