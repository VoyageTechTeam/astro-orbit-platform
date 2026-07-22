--
-- PostgreSQL database dump
--

\restrict FWaMv934hQcgBhboQHOkwbdocbc1swyHrIG0hjsrfY1RA9hw83G9FNMGPBRUbFb

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-22 23:40:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 876 (class 1247 OID 16408)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CONFLICT_FAILED'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- TOC entry 873 (class 1247 OID 16401)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'TRAVELER',
    'HOST',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 16469)
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    booking_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL,
    traveler_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.booking_status DEFAULT 'PENDING'::public.booking_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_dates CHECK ((start_date < end_date))
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16568)
-- Name: host_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.host_profiles (
    user_id uuid NOT NULL,
    bank_account_number character varying(100),
    routing_number character varying(100),
    tax_identifier character varying(50),
    is_verified_host boolean DEFAULT false
);


ALTER TABLE public.host_profiles OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16451)
-- Name: media_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_assets (
    media_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL,
    file_url text NOT NULL,
    thumbnail_url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.media_assets OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16430)
-- Name: property_listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_listings (
    property_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    host_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    base_rate numeric(10,2) NOT NULL,
    location_coordinates point NOT NULL,
    stay_guidelines text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT property_listings_base_rate_check CHECK ((base_rate >= (0)::numeric))
);


ALTER TABLE public.property_listings OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16521)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    review_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    traveler_id uuid NOT NULL,
    property_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16494)
-- Name: tour_guides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tour_guides (
    guide_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    location_area character varying(255) NOT NULL,
    rating numeric(2,1) DEFAULT 0.0,
    hourly_rate numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tour_guides_hourly_rate_check CHECK ((hourly_rate >= (0)::numeric)),
    CONSTRAINT tour_guides_rating_check CHECK (((rating >= 0.0) AND (rating <= 5.0)))
);


ALTER TABLE public.tour_guides OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16555)
-- Name: traveler_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.traveler_profiles (
    user_id uuid NOT NULL,
    passport_number character varying(50),
    emergency_contact character varying(255),
    travel_preferences text
);


ALTER TABLE public.traveler_profiles OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16415)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16516)
-- Name: view_active_bookings_with_price; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_active_bookings_with_price AS
 SELECT b.booking_id,
    b.property_id,
    b.traveler_id,
    b.start_date,
    b.end_date,
    b.status,
    p.title AS property_title,
    (b.end_date - b.start_date) AS total_nights,
    p.base_rate,
    (((b.end_date - b.start_date))::numeric * p.base_rate) AS total_price
   FROM (public.bookings b
     JOIN public.property_listings p ON ((b.property_id = p.property_id)));


ALTER VIEW public.view_active_bookings_with_price OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16586)
-- Name: view_hosts; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_hosts AS
 SELECT u.user_id,
    u.name,
    u.email,
    u.role,
    u.created_at,
    h.bank_account_number,
    h.tax_identifier,
    h.is_verified_host
   FROM (public.users u
     JOIN public.host_profiles h ON ((u.user_id = h.user_id)))
  WHERE (u.role = 'HOST'::public.user_role);


ALTER VIEW public.view_hosts OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16582)
-- Name: view_travelers; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_travelers AS
 SELECT u.user_id,
    u.name,
    u.email,
    u.role,
    u.created_at,
    t.passport_number,
    t.emergency_contact,
    t.travel_preferences
   FROM (public.users u
     JOIN public.traveler_profiles t ON ((u.user_id = t.user_id)))
  WHERE (u.role = 'TRAVELER'::public.user_role);


ALTER VIEW public.view_travelers OWNER TO postgres;

--
-- TOC entry 5124 (class 0 OID 16469)
-- Dependencies: 223
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (booking_id, property_id, traveler_id, start_date, end_date, status, created_at) FROM stdin;
\.


--
-- TOC entry 5128 (class 0 OID 16568)
-- Dependencies: 228
-- Data for Name: host_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.host_profiles (user_id, bank_account_number, routing_number, tax_identifier, is_verified_host) FROM stdin;
\.


--
-- TOC entry 5123 (class 0 OID 16451)
-- Dependencies: 222
-- Data for Name: media_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_assets (media_id, property_id, file_url, thumbnail_url, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5122 (class 0 OID 16430)
-- Dependencies: 221
-- Data for Name: property_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_listings (property_id, host_id, title, description, base_rate, location_coordinates, stay_guidelines, created_at) FROM stdin;
\.


--
-- TOC entry 5126 (class 0 OID 16521)
-- Dependencies: 226
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (review_id, booking_id, traveler_id, property_id, rating, comment, created_at) FROM stdin;
\.


--
-- TOC entry 5125 (class 0 OID 16494)
-- Dependencies: 224
-- Data for Name: tour_guides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tour_guides (guide_id, name, location_area, rating, hourly_rate, created_at) FROM stdin;
\.


--
-- TOC entry 5127 (class 0 OID 16555)
-- Dependencies: 227
-- Data for Name: traveler_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.traveler_profiles (user_id, passport_number, emergency_contact, travel_preferences) FROM stdin;
\.


--
-- TOC entry 5121 (class 0 OID 16415)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, role, created_at) FROM stdin;
\.


--
-- TOC entry 4944 (class 2606 OID 16483)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (booking_id);


--
-- TOC entry 4960 (class 2606 OID 16574)
-- Name: host_profiles host_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_profiles
    ADD CONSTRAINT host_profiles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4942 (class 2606 OID 16463)
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (media_id);


--
-- TOC entry 4939 (class 2606 OID 16445)
-- Name: property_listings property_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_pkey PRIMARY KEY (property_id);


--
-- TOC entry 4953 (class 2606 OID 16537)
-- Name: reviews reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_key UNIQUE (booking_id);


--
-- TOC entry 4955 (class 2606 OID 16535)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 4950 (class 2606 OID 16509)
-- Name: tour_guides tour_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_guides
    ADD CONSTRAINT tour_guides_pkey PRIMARY KEY (guide_id);


--
-- TOC entry 4958 (class 2606 OID 16562)
-- Name: traveler_profiles traveler_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traveler_profiles
    ADD CONSTRAINT traveler_profiles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4933 (class 2606 OID 16429)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4935 (class 2606 OID 16427)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4945 (class 1259 OID 16515)
-- Name: idx_bookings_date_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_date_range ON public.bookings USING btree (property_id, start_date, end_date);


--
-- TOC entry 4946 (class 1259 OID 16512)
-- Name: idx_bookings_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_property ON public.bookings USING btree (property_id);


--
-- TOC entry 4947 (class 1259 OID 16513)
-- Name: idx_bookings_traveler; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_traveler ON public.bookings USING btree (traveler_id);


--
-- TOC entry 4961 (class 1259 OID 16581)
-- Name: idx_host_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_host_profiles_id ON public.host_profiles USING btree (user_id);


--
-- TOC entry 4940 (class 1259 OID 16511)
-- Name: idx_media_assets_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_assets_property ON public.media_assets USING btree (property_id);


--
-- TOC entry 4936 (class 1259 OID 16514)
-- Name: idx_properties_location_gist; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_location_gist ON public.property_listings USING gist (box(location_coordinates, location_coordinates));


--
-- TOC entry 4937 (class 1259 OID 16510)
-- Name: idx_property_listings_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_listings_host ON public.property_listings USING btree (host_id);


--
-- TOC entry 4951 (class 1259 OID 16553)
-- Name: idx_reviews_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_property ON public.reviews USING btree (property_id);


--
-- TOC entry 4948 (class 1259 OID 16554)
-- Name: idx_tour_guides_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tour_guides_search ON public.tour_guides USING btree (location_area, rating DESC);


--
-- TOC entry 4956 (class 1259 OID 16580)
-- Name: idx_traveler_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_traveler_profiles_id ON public.traveler_profiles USING btree (user_id);


--
-- TOC entry 4962 (class 2606 OID 16446)
-- Name: property_listings fk_host; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT fk_host FOREIGN KEY (host_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4970 (class 2606 OID 16575)
-- Name: host_profiles fk_host_base; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_profiles
    ADD CONSTRAINT fk_host_base FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4964 (class 2606 OID 16484)
-- Name: bookings fk_property_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_property_booking FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 16464)
-- Name: media_assets fk_property_media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT fk_property_media FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 4966 (class 2606 OID 16538)
-- Name: reviews fk_review_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 4967 (class 2606 OID 16548)
-- Name: reviews fk_review_property; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_review_property FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 16543)
-- Name: reviews fk_review_traveler; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_review_traveler FOREIGN KEY (traveler_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4965 (class 2606 OID 16489)
-- Name: bookings fk_traveler; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_traveler FOREIGN KEY (traveler_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4969 (class 2606 OID 16563)
-- Name: traveler_profiles fk_traveler_base; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traveler_profiles
    ADD CONSTRAINT fk_traveler_base FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2026-07-22 23:40:29

--
-- PostgreSQL database dump complete
--

\unrestrict FWaMv934hQcgBhboQHOkwbdocbc1swyHrIG0hjsrfY1RA9hw83G9FNMGPBRUbFb

