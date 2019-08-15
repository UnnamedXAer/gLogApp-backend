select setval('appuser_uskey_seq', (select max(uskey) from appuser));
select setval('types4exercise_tfekey_seq', (select max(bpkey) from bodyparts));
select setval('exercise_exkey_seq', (select max(exkey) from exercise));
select setval('exerciseaccessories_eakey_seq', (select max(eakey) from exerciseaccessories));
select setval('exercisetype_extkey_seq', (select max(bpekey) from bodypartsengaged));
select setval('training_trkey_seq', (select max(trkey) from training));
select setval('trainingexercise_tekey_seq', (select max(tekey) from trainingexercise));
select setval('trainingset_setkey_seq', (select max(setkey) from trainingset));

commit;