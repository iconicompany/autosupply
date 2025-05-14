DROP DATABASE IF EXISTS autosupply;
create database autosupply;
CREATE USER autosupply WITH PASSWORD 'autosupply';
ALTER USER autosupply CREATEDB;
ALTER DATABASE autosupply OWNER TO autosupply;