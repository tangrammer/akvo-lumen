(defproject org.akvo/lumen "0.24.0-SNAPSHOT"
  :description "Akvo Lumen backend"
  :url "https://github.com/akvo/akvo-lumen"
  :license {:name "GNU Affero General Public License 3.0"
            :url  "https://www.gnu.org/licenses/agpl-3.0.html"}
  :min-lein-version "2.0.0"
  :dependencies [[clojurewerkz/scrypt "1.2.0"]
                 [ch.qos.logback/logback-classic "1.2.3"]
                 [org.clojure/tools.logging "0.4.0"]
                 [org.slf4j/log4j-over-slf4j "1.7.25"]
                 [org.slf4j/jcl-over-slf4j "1.7.25"]
                 [org.slf4j/jul-to-slf4j "1.7.25"]
                 [cheshire "5.8.0" :exclusions [com.fasterxml.jackson.core/jackson-core]]
                 [clj-http "3.7.0" :exclusions [org.apache.httpcomponents/httpcore org.apache.httpcomponents/httpclient org.apache.httpcomponents/httpmime]]
                 [clj-time "0.14.2"]
                 [com.layerware/hugsql "0.4.8"]
                 [com.stuartsierra/component "0.3.2"]
                 [commons-io/commons-io "2.6"]
                 [compojure "1.6.0" :exclusions [medley]]
                 [duct "0.8.2"]
                 [duct/hikaricp-component "0.1.1" :exclusions [org.slf4j/slf4j-nop]]
                 [environ "1.1.0"]
                 [funcool/cuerdas "2.0.5"]
                 [honeysql "0.9.1"]
                 [meta-merge "1.0.0"]
                 [org.akvo/commons "0.4.5" :exclusions [org.postgresql/postgresql org.clojure/java.jdbc]]
                 [org.akvo/resumed "1.17.be5e74d2518253bb87ce087c15f5e04bd4b8b824"]
                 [org.apache.tika/tika-core "1.17"]
                 [org.apache.tika/tika-parsers "1.17" :exclusions [org.slf4j/slf4j-api com.fasterxml.jackson.core/jackson-core org.apache.httpcomponents/httpcore org.apache.httpcomponents/httpclient org.apache.httpcomponents/httpmime]]
                 ;; explicit versions of commons deps used by tika-parsers and clj-http
                 [com.fasterxml.jackson.core/jackson-core "2.9.2"]
                 [org.apache.httpcomponents/httpcore "4.4.7"]
                 [org.apache.httpcomponents/httpclient "4.5.4"]
                 [org.apache.httpcomponents/httpmime "4.5.4"]

                 [org.clojure/clojure "1.9.0"]
                 [org.clojure/data.csv "0.1.4"]
                 [org.clojure/core.match "0.3.0-alpha5"]
                 [org.clojure/java.jdbc "0.7.5"]
                 [org.immutant/web "2.1.9" :exclusions [ch.qos.logback/logback-classic]]
                 [org.postgresql/postgresql "42.2.1"]
                 [ragtime/ragtime.jdbc "0.6.4"]
                 [raven-clj "1.5.1"]
                 [ring "1.6.3" :exclusions [ring/ring-core]]
                 [ring/ring-core "1.6.3"]
                 [ring/ring-defaults "0.3.1"]
                 [ring/ring-json "0.4.0"]
                 [selmer "1.11.5"]
                 [net.postgis/postgis-jdbc "2.2.1" :exclusions [org.postgresql/postgresql]]
                 [org.javadelight/delight-nashorn-sandbox "0.1.13"]]
  :uberjar-name "akvo-lumen.jar"
  :repl-options {:timeout 120000}
  :pedantic? :abort
  :plugins [[lein-ancient "0.6.15"]
            [lein-codox "0.9.6"]
            [lein-environ "1.0.3"]
            [jonase/eastwood "0.2.5"]]
  :codox {:doc-paths   ["resources/akvo/lumen/doc"]
          :output-path "../docs"}
  :main ^:skip-aot akvo.lumen.main
  :target-path "target/%s/"
  :aliases {"setup"   ["run" "-m" "duct.util.repl/setup"]
            "migrate" ["run" "-m" "dev/migrate"]
            "seed"    ["run" "-m" "dev/seed"]}
  :test-selectors {:default (and (constantly true)
                                 (complement :functional))
                   :functional :functional
                   :all     (constantly true)}
  :eastwood {:config-files ["eastwood_cfg.clj"]}
  :profiles
  {:dev           [:project/dev :profiles/dev]
   :test          [:project/test :profiles/test]
   :uberjar       {:aot :all}
   :profiles/dev  {}
   :profiles/test {}
   :project/dev   {:dependencies   [[duct/generate "0.8.2"]
                                    [reloaded.repl "0.2.4"]
                                    [org.clojure/tools.namespace "0.2.11"]
                                    [org.clojure/tools.nrepl "0.2.13"]
                                    [eftest "0.4.1"]
                                    [com.gearswithingears/shrubbery "0.4.1"]
                                    [kerodon "0.9.0"]]
                   :source-paths   ["dev/src"]
                   :resource-paths ["dev/resources" "test/resources"]
                   :repl-options   {:init-ns dev
                                    :init (do
                                            (println "Starting BackEnd ...")
                                            (go)
                                            (migrate-and-seed))
                                    :host "0.0.0.0"
                                    :port 47480}
                   :env            {:port "3000"}}
   :project/test  {:resource-paths ["test/resources"]
                   :env
                   {:db {:uri "jdbc:postgresql://postgres/lumen?user=lumen&password=password"}}}})
