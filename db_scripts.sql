-- TABLE creation 
CREATE TABLE routes (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    stops UUID[] DEFAULT '{}'
) IF NOT EXISTS;

CREATE TABLE stops (
    id UUID PRIMARY KEY,
    text VARCHAR(100) NOT NULL,
    position integer NOT NULL,
    ind integer NOT NULL,
    route_id UUID REFERENCES routes
);

-- USER actions: SELECT, INSERT, UPDATE, DELETE
CREATE ROLE manager LOGIN ENCRYPTED PASSWORD 'admin';
GRANT SELECT, INSERT, UPDATE, DELETE ON routes, stops TO manager;

-- SQL queries
SELECT * FROM routes ORDER BY id;
SELECT * FROM stops ORDER BY route_id;

INSERT INTO routes (id, name) VALUES (<id>, <name>);

INSERT INTO stops (id, text, position, route_id) VALUES (<id>, <text>, <position>, <route_id>);
UPDATE routes SET stops = array_append(stops, <stop_id>) WHERE id = <route_id>;

UPDATE routes SET name = <name> WHERE id = <id>;

SELECT route_id FROM stops WHERE id = <stop_id>
UPDATE routes SET stops = array_remove(stops, <stop_id>) WHERE id = <route_id>;
DELETE FROM stops WHERE id = <stop_id>;

UPDATE stops SET route_id = <dest_route_id> WHERE id = <stop_id>;
UPDATE routes SET stops = array_append(stops, <stop_id>) WHERE id = <dest_route_id>;
UPDATE routes SET stops = array_remove(stops, <stop_id>) WHERE id = <src_route_id>;
