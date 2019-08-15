-- scrypt 2

CREATE SEQUENCE public.appuser_uskey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.appuser_uskey_seq OWNED BY public.appuser.uskey;

CREATE SEQUENCE public.exercise_exkey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.exercise_exkey_seq OWNED BY public.exercise.exkey;

CREATE SEQUENCE public.exerciseaccessories_eakey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE SEQUENCE public.exercisetype_extkey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.exercisetype_extkey_seq OWNED BY public.bodypartsengaged.bpekey;


CREATE SEQUENCE public.training_trkey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.training_trkey_seq OWNED BY public.training.trkey;

CREATE SEQUENCE public.trainingexercise_tekey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.trainingexercise_tekey_seq OWNED BY public.trainingexercise.tekey;

CREATE SEQUENCE public.trainingset_setkey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.trainingset_setkey_seq OWNED BY public.trainingset.setkey;


CREATE SEQUENCE public.types4exercise_tfekey_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.types4exercise_tfekey_seq OWNED BY public.bodyparts.bpkey;

commit;

ALTER TABLE ONLY public.appuser ALTER COLUMN uskey SET DEFAULT nextval('public.appuser_uskey_seq'::regclass);
ALTER TABLE ONLY public.bodyparts ALTER COLUMN bpkey SET DEFAULT nextval('public.types4exercise_tfekey_seq'::regclass);
ALTER TABLE ONLY public.bodypartsengaged ALTER COLUMN bpekey SET DEFAULT nextval('public.exercisetype_extkey_seq'::regclass);
ALTER TABLE ONLY public.exercise ALTER COLUMN exkey SET DEFAULT nextval('public.exercise_exkey_seq'::regclass);
ALTER TABLE ONLY public.exerciseaccessories ALTER COLUMN eakey SET DEFAULT nextval('public.exerciseaccessories_eakey_seq'::regclass);
ALTER TABLE ONLY public.training ALTER COLUMN trkey SET DEFAULT nextval('public.training_trkey_seq'::regclass);
ALTER TABLE ONLY public.trainingexercise ALTER COLUMN tekey SET DEFAULT nextval('public.trainingexercise_tekey_seq'::regclass);
ALTER TABLE ONLY public.trainingset ALTER COLUMN setkey SET DEFAULT nextval('public.trainingset_setkey_seq'::regclass);
commit;