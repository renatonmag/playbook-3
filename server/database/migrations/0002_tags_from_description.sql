-- Custom SQL migration file, put your code below! ---- Tags are now the description's lines: recompute them, discarding the old separate tags.
UPDATE "setup_examples" e SET "tags" = coalesce((
  SELECT array_agg(t ORDER BY ord) FROM (
    SELECT t, min(ord) AS ord FROM (
      SELECT left(lower(regexp_replace(btrim(line), '\s+', ' ', 'g')), 100) AS t, ord
      FROM unnest(string_to_array(replace(e."description", E'\r', ''), E'\n')) WITH ORDINALITY AS l(line, ord)
    ) x
    WHERE t <> ''
    GROUP BY t
    ORDER BY min(ord)
    LIMIT 30
  ) y
), '{}'::text[]);
