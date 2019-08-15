-- scrypt
--
-- PRIMATY KEYs
ALTER TABLE ONLY public.appuser
    ADD CONSTRAINT appuser_pkey PRIMARY KEY (uskey);
ALTER TABLE ONLY public.appuser
    ADD CONSTRAINT appuser_uslogin_key UNIQUE (uslogin);
ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_exname_key UNIQUE (exname);
ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_pkey PRIMARY KEY (exkey);
ALTER TABLE ONLY public.exerciseaccessories
    ADD CONSTRAINT exerciseaccessories_pkey PRIMARY KEY (eakey);
ALTER TABLE ONLY public.bodypartsengaged
    ADD CONSTRAINT exercisetype_pkey PRIMARY KEY (bpekey);
ALTER TABLE ONLY public.training
    ADD CONSTRAINT training_pkey PRIMARY KEY (trkey);
ALTER TABLE ONLY public.trainingexercise
    ADD CONSTRAINT trainingexercise_pkey PRIMARY KEY (tekey);
ALTER TABLE ONLY public.trainingset
    ADD CONSTRAINT trainingset_pkey PRIMARY KEY (setkey);
ALTER TABLE ONLY public.bodyparts
    ADD CONSTRAINT types4exercise_pkey PRIMARY KEY (bpkey);
ALTER TABLE ONLY public.bodyparts
    ADD CONSTRAINT types4exercise_tfename_key UNIQUE (bpname);



--FOREIGN KEYs
ALTER TABLE ONLY public.exerciseaccessories
    ADD CONSTRAINT exerciseaccessories_eaexkey_fkey FOREIGN KEY (eaexkey) REFERENCES public.exercise(exkey);
COMMENT ON CONSTRAINT exerciseaccessories_eaexkey_fkey ON public.exerciseaccessories IS 'Exercise for which accessory is assigned';


ALTER TABLE ONLY public.exerciseaccessories
    ADD CONSTRAINT exerciseaccessories_eaaccessoryexkey_fkey FOREIGN KEY (eaaccessoryexkey) REFERENCES public.exercise(exkey);
COMMENT ON CONSTRAINT exerciseaccessories_eaaccessoryexkey_fkey ON public.exerciseaccessories IS 'Exercise key witch is accessory.';


ALTER TABLE ONLY public.bodypartsengaged
    ADD CONSTRAINT bodypartsengaged_bpeexkey_fkey FOREIGN KEY (bpeexkey) REFERENCES public.exercise(exkey);


ALTER TABLE ONLY public.bodypartsengaged
    ADD CONSTRAINT bodypartsengaged_bpebpkey_fkey FOREIGN KEY (bpebpkey) REFERENCES public.bodyparts(bpkey);


ALTER TABLE ONLY public.exercise
    ADD CONSTRAINT exercise_excreatedby_fkey FOREIGN KEY (excreatedby) REFERENCES public.appuser(uskey);
COMMENT ON CONSTRAINT exercise_excreatedby_fkey ON public.exercise IS ' link to appuser.uskey';


ALTER TABLE ONLY public.training
    ADD CONSTRAINT training_truskey_fkey FOREIGN KEY (truskey) REFERENCES public.appuser(uskey);


ALTER TABLE ONLY public.trainingexercise
    ADD CONSTRAINT trainingexercise_teexkey_fkey FOREIGN KEY (teexkey) REFERENCES public.exercise(exkey);


ALTER TABLE ONLY public.trainingexercise
    ADD CONSTRAINT trainingexercise_tetrkey_fkey FOREIGN KEY (tetrkey) REFERENCES public.training(trkey);


ALTER TABLE ONLY public.trainingset
    ADD CONSTRAINT trainingset_settekey_fkey FOREIGN KEY (settekey) REFERENCES public.trainingexercise(tekey);

commit;