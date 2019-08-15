-- scrypt 1

CREATE TABLE public.appuser (
    uskey integer NOT NULL,
    uslogin character varying(20) NOT NULL,
    uspassword character varying(100) NOT NULL,
    usemail character varying(50) NOT NULL,
    usfirstname character varying(20),
    uslastname character varying(20),
    usdob date,
    usimgname character varying(120),
    uscreatedon timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    uslastlogin timestamp(6) with time zone --DEFAULT CURRENT_TIMESTAMP NOT NULL
);


CREATE TABLE public.exercise (
    exkey integer NOT NULL,
    exname character varying(100) NOT NULL,
    exdescription character varying(1000),
    exiconname character varying(100),
    exsetsunit smallint DEFAULT 1 NOT NULL,
    eximgname character varying(120),
    exyturl character varying(200),
    excreatedby integer NOT NULL,
    excreatedon timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
COMMENT ON COLUMN public.exercise.exsetsunit IS 'Sets unit
- counted repetitions or time.
1 - Repetition in set
2 - Time [seconds] eg. for plank -> 60 seconds';


CREATE TABLE public.bodyparts (
    bpkey integer NOT NULL,
    bpname character varying(50) NOT NULL,
    bpdescription character varying(1000)
);


CREATE TABLE public.bodypartsengaged (
    bpekey integer NOT NULL,
    bpeexkey integer NOT NULL,
    bpebpkey integer NOT NULL
);
COMMENT ON TABLE public.bodypartsengaged IS 'Body part that is engaged by specific exercise.';
COMMENT ON COLUMN public.bodypartsengaged.bpeexkey IS 'link to exercise';
COMMENT ON COLUMN public.bodypartsengaged.bpebpkey IS 'link to bodypart';


CREATE TABLE public.exerciseaccessories (
    eakey integer NOT NULL,
    eaexkey integer NOT NULL,
    eaaccessoryexkey integer NOT NULL
);
COMMENT ON TABLE public.exerciseaccessories IS 'Declarations that specific exercise can be helpful in progression in another exercise.';


CREATE TABLE public.training (
    trkey integer NOT NULL,
    truskey integer NOT NULL,
    trstarttime timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trendtime timestamp(6) with time zone,
    trcomment character varying(3000)
);


CREATE TABLE public.trainingexercise (
    tekey integer NOT NULL,
    testarttime timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    teendtime timestamp(6) with time zone,
    tetrkey integer NOT NULL,
    teexkey integer NOT NULL,
    tecomment character varying(1000)
);


CREATE TABLE public.trainingset (
    setkey integer NOT NULL,
    settime timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    settekey integer NOT NULL,
    setweight numeric(5,2) NOT NULL,
    setreps smallint NOT NULL,
    setdrop character varying(100),
    settempo character varying(20),
    setcomment character varying(1000)
);


CREATE TABLE public.txt (
    txt character varying(3000),
    createdon timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.txt IS 'dumb data / logs';

commit;