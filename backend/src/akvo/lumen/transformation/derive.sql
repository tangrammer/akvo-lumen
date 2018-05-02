
-- :name all-data :?
-- :doc Get all data from a data table
SELECT * FROM :i:table-name

-- :name set-cells-value :!
-- :doc Set cells same value
UPDATE :i:table-name SET :i:column-name = :value WHERE rnum IN (:v*:rnums)


-- :name set-cells-values :!
-- :doc Set cells different value
/* :require [clojure.string :as string] */
UPDATE :i:table-name
SET :i:column-name = c.derived_val
FROM (values
/*~
(->> (:params params)
     (map (fn [[i v]] (format "(%s, '%s')" i v)))
     (string/join ","))
~*/
) as c(ref_num, derived_val)
WHERE rnum=c.ref_num


-- :name delete-row :!
-- :doc Delete a row
DELETE FROM :i:table-name WHERE rnum=:rnum

-- :name delete-rows :!
-- :doc Delete multiple rows
DELETE FROM :i:table-name WHERE rnum IN (:v*:rnums)



-- :name clj-expr-generic-update :! :n
/* :require [clojure.string :as string]
            [hugsql.parameters :refer [identifier-param-quote]] */
update :i:table set
/*~
(string/join ","
  (for [[field _] (:updates params)]
    (str (identifier-param-quote (name field) options)
      " = :v:updates." (name field))))
~*/
where id = :id
