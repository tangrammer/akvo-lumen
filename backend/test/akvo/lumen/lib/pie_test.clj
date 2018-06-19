(ns akvo.lumen.lib.pie-test
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.utils.specs]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.test-utils :refer [import-file instrument-fixture with-instrument-disabled]]
            [clojure.test :refer :all]))

(use-fixtures :once tenant-conn-fixture error-tracker-fixture instrument-fixture)

(deftest ^:functional test-pie
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "pie.csv" {:dataset-name "pie"
                                                                         :has-column-headers? true})
        query (partial aggregation/query *tenant-conn* dataset-id "pie")]
    (testing "Simple queries"
      (let [[tag query-result] (query {"bucketColumn" "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {"metadata" {"bucketColumnTitle" "A"
                                         "bucketColumnType" "text"},
                             "data" [{"bucketValue" "a1", "bucketCount" 4}
                                     {"bucketValue" "a2", "bucketCount" 4}]})))

      (let [[tag query-result] (query {"bucketColumn" "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result {"metadata" {"bucketColumnTitle" "B"
                                         "bucketColumnType" "text"},
                             "data" [{"bucketValue" "b1", "bucketCount" 5}
                                     {"bucketValue" "b2", "bucketCount" 3}]}))))))
