(ns akvo.lumen.lib.share-impl
  (:require [akvo.lumen.lib :as lib]
            [clojure.string :as string]
            [clojurewerkz.scrypt.core :as scrypt]
            [hugsql.core :as hugsql])
  (:import (java.security SecureRandom)
           (java.util Base64)))


(hugsql/def-db-fns "akvo/lumen/lib/share.sql")
(hugsql/def-db-fns "akvo/lumen/lib/public.sql")

(defn all [tenant-conn]
  (lib/ok (all-shares tenant-conn)))

(defn random-url-safe-string
  "Returns a url safe random string of provided size. Defaults to size 8 bytes."
  ([] (random-url-safe-string 8))
  ([size]
   (let [random-bytes (let [seed (byte-array size)]
                        (.nextBytes (SecureRandom.) seed)
                        seed)
         encoder      (.withoutPadding (Base64/getUrlEncoder))]
     (String. (.encode encoder random-bytes)))))

(defn visualisation
  "Share a visualisation"
  [tenant-conn visualisation-id]
  (first (insert-visualisation-share tenant-conn
                                     {:id (random-url-safe-string)
                                      :visualisation-id visualisation-id})))

(defn dashboard
  "Share a dashboard"
  [tenant-conn dashboard-id]
  (first (insert-dashboard-share tenant-conn
                                   {:id (random-url-safe-string)
                                    :dashboard-id dashboard-id})))

(defn fetch [tenant-conn spec]
  (cond
    (contains? spec "visualisationId")
    (if-let [v (visualisation tenant-conn (get spec "visualisationId"))]
      (lib/ok v)
      (lib/not-found {:error "Not found"}))

    (contains? spec "dashboardId")
    (if-let [d (dashboard tenant-conn (get spec "dashboardId"))]
      (lib/ok d)
      (lib/not-found {:error "Not found"}))

    :else
    (lib/bad-request {:error "Required key not provided"})))


(defn valid-password? [password]
  (and (some? password)
       (> (count password) 7)))

(defn put
  [tenant-conn id {:strs [password protected]}]
  (try
    (if (some? password)
      (if (valid-password? password)
        (let [hash (scrypt/encrypt (format "%s|%s" id password) 16384 8 1)]
          (if (boolean? protected)
            (db-set-protected-and-password tenant-conn {:id id
                                                        :hash hash
                                                        :protected protected})
            (db-set-password tenant-conn {:id id
                                          :hash hash
                                          :protected protected}))
          (lib/ok {}))
        (lib/bad-request {:message "Invalid password (min 8 characters)"}))
      (if (boolean? protected)
        (if (-> (public-by-id tenant-conn {:id id})
                :password
                (valid-password?))
          (do
            (db-set-protected-flag tenant-conn {:id id :protected protected})
            (lib/ok {}))
          (lib/bad-request {:message "Can't enable protection without valid password"}))
        (lib/bad-request {:message "Nothing to update"})))

    (catch Exception e
      (prn e)
      (lib/bad-request {}))))
