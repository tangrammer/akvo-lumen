(ns akvo.lumen.specs
  (:require [akvo.lumen.transformation.derive :as t.derive]
            [akvo.lumen.transformation.derive.js-engine :as t.d.js-engine]
            [akvo.lumen.transformation.engine :as t.engine]
            [akvo.lumen.transformation :as transformation]
            [akvo.lumen.lib.dataset :as l.dataset]
            [clojure.spec.alpha :as s])
  (:import javax.sql.DataSource))

(defn exception? [o] (instance? java.lang.Exception o))

(defn db-connection? [o] (satisfies? javax.sql.DataSource o))

(s/def ::any (constantly true))
(s/def ::string-nullable (s/or :s string? :n nil?))



(s/def ::t.derive/code string?)
(s/def ::t.derive/column-title string?)
(s/def ::t.derive/column-type #{"text" "number" "date" "geopoint"})
(s/def ::t.derive/args (s/keys :req [::t.derive/code ::t.derive/column-title ::t.derive/column-type]))

(s/fdef t.derive/args :ret ::t.derive/args)

(s/def ::t.d.js-engine/js-value-types #{"number" "text" "date"})

(s/fdef t.d.js-engine/valid-type? :args (s/cat
                                    :value ::any
                                    :type ::t.d.js-engine/js-value-types))

;; TODO: how to spec HOF
;; https://clojure.org/guides/spec#_higher_order_functions
;; js-engine/column-name->column-title

(s/def ::t.engine/error-strategy #{"leave-empty" "fail" "delete-row"}) ;; TODO: complete ...  core/change-datatype introduces "defaultValue"

(s/def ::t.engine/op #{"core/change-datatype" "core/derive"}) ;; TODO: complete

(s/def ::t.engine/args map?)

(s/def ::t.engine/onError ::t.engine/error-strategy)

#_{op core/change-datatype, args {columnName c2, newType number, defaultValue nil}, onError default-value}
(s/def ::t.engine/op-spec (s/keys :req [::t.engine/op ::t.engine/args ::t.engine/onError]))

(s/def ::l.dataset/sort ::string-nullable)
(s/def ::l.dataset/type #{"text" "number"}) ;; TODO: complete
(s/def ::l.dataset/hidden boolean?)
(s/def ::l.dataset/direction ::string-nullable)
(s/def ::l.dataset/direction string?)

(s/def ::l.dataset/column (s/keys :req [::l.dataset/sort ::l.dataset/type ::l.dataset/title ::l.dataset/hidden ::l.dataset/direction ::l.dataset/columnName]))

(s/fdef t.engine/error-strategy :ret ::t.engine/error-strategy)

(s/fdef t.engine/try-apply-operation :args (s/cat :tenant-conn db-connection?
                                                  :table-name string?
                                                  :columns (s/coll-of ::l.dataset/column)
                                                  :op-spec ::t.engine/op-spec))

(s/fdef t.derive/handle-transform-exception :args (s/cat :exn exception? :conn db-connection?
                                                         :on-error ::t.engine/error-strategy
                                                         :table-name string?
                                                         :column-name string?
                                                         :rnum int?))




(comment "following code should live in test specs"

         (exception? (ClassNotFoundException. "my exception message"))
         (i (ClassNotFoundException. "my exception message"))
         (exception? (ex-info "example " {}) )
         (i (ex-info "example " {}) )
         
         (s/valid? ::t.derive/args (t.derive/args {"args" {"code" "nil" "newColumnTitle" "nil" "newColumnType" "true"}})))

