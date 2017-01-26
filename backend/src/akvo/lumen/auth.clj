(ns akvo.lumen.auth
  (:require [akvo.commons.jwt :as jwt]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.string :as s]
            [clojure.set :as set]
            [ring.util.response :as response]))

(defn tenant-user?
  [tenant-label claimed-roles]
  (contains? (set claimed-roles)
             (format "akvo:lumen:%s" tenant-label)))

(defn tenant-admin?
  [tenant-label claimed-roles]
  (contains? (set claimed-roles)
             (format "akvo:lumen:%s:admin" tenant-label)))

(defn admin-path?
  [path-info]
  )

(defn wrap-auth
  "Wrap authentication for API. Allow GET to root / and share urls at /s/<id>.
  If request don't contain claims return 401. If current dns label (tenant) is
  not in claimed roles return 403.
  Otherwiese grant access. This implies that access is on tenant level."
  [handler]
  (fn [{:keys [path-info request-method tenant] :as request}]
    (if (or (and (= "/api" path-info)
                 (= :get request-method))
            (and (= "/env" path-info)
                 (= :get request-method))
            (and (s/starts-with? path-info "/s/")
                 (= :get request-method))
            (and (s/starts-with? path-info "/verify/")
                 (= :get request-method)))
      (handler request)
      (if-let [claimed-roles (get-in request [:jwt-claims "realm_access" "roles"])]
        (if (tenant-user? (:tenant request) claimed-roles)
          (if (s/starts-with? path-info "/api/admin/")
            (if (tenant-admin? tenant claimed-roles)
              (handler request)
              (-> (response/response "Not authorized")
                  (response/status 403)))
            (handler request))
          (-> (response/response "Not authorized")
              (response/status 403)))
        (-> (response/response "Not authenticated")
            (response/status 401))))))


(defn wrap-jwt
  "Go get cert from Keycloak and feed it to wrap-jwt-claims. Keycloak url can
  be configured via the KEYCLOAK_URL env var."
  [handler {:keys [keycloak-url keycloak-realm]}]
  (try
    (let [issuer (str keycloak-url "/realms/" keycloak-realm)
          certs (-> (str issuer "/protocol/openid-connect/certs")
                    client/get
                    :body)]
      (jwt/wrap-jwt-claims handler (jwt/rsa-key certs 0) issuer))
    (catch Exception e
      (println "Could not get cert from Keycloak")
      (throw e))))
