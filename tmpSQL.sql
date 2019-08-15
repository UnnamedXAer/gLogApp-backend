/*begin;
set transaction read write;
alter database exercises set default_transaction_read_only = off;
commit;*/
select setval('appuser_uskey_seq', (select max(uskey) from appuser));