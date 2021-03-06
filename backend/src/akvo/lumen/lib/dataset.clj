(ns akvo.lumen.lib.dataset
  (:refer-clojure :exclude [update])
  (:require [akvo.lumen.lib.dataset-impl :as impl]))


(defn all
  "Return all datasets."
  [tenant-conn]
  (impl/all tenant-conn))

(defn create
  "Create new dataset. Body should conform..."
  [tenant-conn config error-tracker jwt-claims body]
  (impl/create tenant-conn config error-tracker jwt-claims body))

(defn fetch
  "Fetch dataset with id"
  [tenant-conn id]
  (impl/fetch tenant-conn id))

(defn delete
  "Delete dataset with id"
  [tenant-conn id]
  (impl/delete tenant-conn id))

(defn update-meta
  "Update dataset meta with id. Body should conform..."
  [tenant-conn id body]
  (impl/update-meta tenant-conn id body))

(defn update
  "Update dataset with id"
  [tenant-conn config id body]
  (impl/update tenant-conn config id body))
