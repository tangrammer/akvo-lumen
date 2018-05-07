
-- :name all-data :?
-- :doc Get all data from a data table
SELECT * FROM :i:table-name

-- :name set-cell-value :!
-- :doc Set cell value
UPDATE :i:table-name SET :i:column-name = :value WHERE rnum=:rnum

-- :name set-cells-value :!
-- :doc set multiple cell values
/* :require [clojure.string :as string] */
UPDATE :i:table-name 
SET :i:column-name = c.derived_val:::i:column-type
FROM (values
/*~
;; we need to cover 3 types => dates, numbers and strings (and nil)
(->> (:params params)
     (map (fn [[i v]]
            (format (cond
                      (inst? v) "(%s, '%s')" 
                      (string? v) "(%s, '%s')" 
                      :else "(%s, %s)") i v)))
     (string/join ","))
~*/
) as c(ref_num, derived_val)
WHERE rnum=c.ref_num;

-- :name delete-row :!
-- :doc Delete a row
DELETE FROM :i:table-name WHERE rnum=:rnum

-- :name delete-rows :!
-- :doc Delete multiple rows
DELETE FROM :i:table-name WHERE rnum IN (:v*:rnums)
