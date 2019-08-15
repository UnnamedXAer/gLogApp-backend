-- Started on 2019-03-23 12:27:17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

-- DROP ROLE IF EXISTS glogappuser;
-- create user --interactive
-- glogappuser;


-- alter user glogappuser with superuser;
-- alter user glogappuser with ENCRYPTED  password 'glogapppassword';

-- create database glogapp_database with owner glogappuser;

-- \connect glogapp_database
commit;

--1. createTables +
--2. createSequences +
--3. addConstrains +
--4. insertInitialDate +
--5. updateSequencesValue 
