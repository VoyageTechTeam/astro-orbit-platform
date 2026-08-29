--
-- PostgreSQL database dump
--

\restrict lhT7UFjeMUd2wMYQ56p9eYhAYuNalaj520UVxr101nb1BsaQj1LcXkDLRfP4e0w

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-29 10:44:45

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
-- TOC entry 3 (class 3079 OID 16825)
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- TOC entry 6453 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- TOC entry 4 (class 3079 OID 31706)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 6454 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 6455 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1858 (class 1247 OID 16408)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CONFLICT_FAILED'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- TOC entry 1933 (class 1247 OID 17639)
-- Name: booking_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status_type AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled'
);


ALTER TYPE public.booking_status_type OWNER TO postgres;

--
-- TOC entry 1921 (class 1247 OID 17587)
-- Name: listing_status_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_status_type AS ENUM (
    'active',
    'inactive',
    'pending',
    'archived'
);


ALTER TYPE public.listing_status_type OWNER TO postgres;

--
-- TOC entry 1855 (class 1247 OID 16401)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'TRAVELER',
    'HOST',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 1936 (class 1247 OID 17648)
-- Name: user_role_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role_type AS ENUM (
    'traveler',
    'host',
    'admin'
);


ALTER TYPE public.user_role_type OWNER TO postgres;

--
-- TOC entry 378 (class 1255 OID 17636)
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 16469)
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
-- TOC entry 236 (class 1259 OID 16802)
-- Name: concierge_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.concierge_requests (
    request_id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    service_id uuid NOT NULL,
    status character varying(20) DEFAULT 'requested'::character varying,
    requested_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.concierge_requests OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16790)
-- Name: concierge_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.concierge_services (
    service_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    is_available boolean DEFAULT true
);


ALTER TABLE public.concierge_services OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 17617)
-- Name: host_payout_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.host_payout_accounts (
    payout_account_id uuid DEFAULT gen_random_uuid() NOT NULL,
    host_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    account_number_encrypted text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.host_payout_accounts OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16568)
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
-- TOC entry 234 (class 1259 OID 16771)
-- Name: listing_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listing_media (
    media_id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    url text NOT NULL,
    caption character varying(255),
    display_order integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.listing_media OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17598)
-- Name: listing_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.listing_summary AS
SELECT
    NULL::uuid AS listing_id,
    NULL::character varying(255) AS title,
    NULL::numeric AS avg_rating,
    NULL::bigint AS total_reviews;


ALTER VIEW public.listing_summary OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17558)
-- Name: listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listings (
    listing_id uuid DEFAULT gen_random_uuid() NOT NULL,
    host_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    property_type character varying(50) NOT NULL,
    city character varying(100) NOT NULL,
    address text NOT NULL,
    price_per_night numeric(10,2) NOT NULL,
    max_guests integer NOT NULL,
    is_active boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status public.listing_status_type DEFAULT 'active'::public.listing_status_type NOT NULL,
    CONSTRAINT listings_max_guests_check CHECK ((max_guests > 0)),
    CONSTRAINT listings_price_per_night_check CHECK ((price_per_night > (0)::numeric))
);


ALTER TABLE public.listings OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16451)
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
-- TOC entry 239 (class 1259 OID 17603)
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotions (
    promo_id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    discount_percentage numeric(5,2),
    valid_until timestamp with time zone NOT NULL,
    max_uses integer DEFAULT 1,
    times_used integer DEFAULT 0,
    CONSTRAINT promotions_discount_percentage_check CHECK (((discount_percentage > (0)::numeric) AND (discount_percentage <= (100)::numeric)))
);


ALTER TABLE public.promotions OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16430)
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
-- TOC entry 228 (class 1259 OID 16521)
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
-- TOC entry 226 (class 1259 OID 16494)
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
-- TOC entry 233 (class 1259 OID 16590)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    transaction_id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    payment_method character varying(50) NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    transaction_reference character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16555)
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
-- TOC entry 222 (class 1259 OID 16415)
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
-- TOC entry 227 (class 1259 OID 16516)
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
-- TOC entry 232 (class 1259 OID 16586)
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
-- TOC entry 231 (class 1259 OID 16582)
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
-- TOC entry 6436 (class 0 OID 16469)
-- Dependencies: 225
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (booking_id, property_id, traveler_id, start_date, end_date, status, created_at) FROM stdin;
\.


--
-- TOC entry 6444 (class 0 OID 16802)
-- Dependencies: 236
-- Data for Name: concierge_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.concierge_requests (request_id, booking_id, service_id, status, requested_time, created_at) FROM stdin;
\.


--
-- TOC entry 6443 (class 0 OID 16790)
-- Dependencies: 235
-- Data for Name: concierge_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.concierge_services (service_id, title, description, price, is_available) FROM stdin;
\.


--
-- TOC entry 6447 (class 0 OID 17617)
-- Dependencies: 240
-- Data for Name: host_payout_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.host_payout_accounts (payout_account_id, host_id, provider, account_number_encrypted, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 6440 (class 0 OID 16568)
-- Dependencies: 230
-- Data for Name: host_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.host_profiles (user_id, bank_account_number, routing_number, tax_identifier, is_verified_host) FROM stdin;
\.


--
-- TOC entry 6442 (class 0 OID 16771)
-- Dependencies: 234
-- Data for Name: listing_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.listing_media (media_id, listing_id, url, caption, display_order, is_primary, created_at) FROM stdin;
\.


--
-- TOC entry 6445 (class 0 OID 17558)
-- Dependencies: 237
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.listings (listing_id, host_id, title, description, property_type, city, address, price_per_night, max_guests, is_active, is_deleted, created_at, updated_at, status) FROM stdin;
\.


--
-- TOC entry 6435 (class 0 OID 16451)
-- Dependencies: 224
-- Data for Name: media_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_assets (media_id, property_id, file_url, thumbnail_url, uploaded_at) FROM stdin;
\.


--
-- TOC entry 6446 (class 0 OID 17603)
-- Dependencies: 239
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promotions (promo_id, code, discount_percentage, valid_until, max_uses, times_used) FROM stdin;
\.


--
-- TOC entry 6434 (class 0 OID 16430)
-- Dependencies: 223
-- Data for Name: property_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_listings (property_id, host_id, title, description, base_rate, location_coordinates, stay_guidelines, created_at) FROM stdin;
\.


--
-- TOC entry 6438 (class 0 OID 16521)
-- Dependencies: 228
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (review_id, booking_id, traveler_id, property_id, rating, comment, created_at) FROM stdin;
\.


--
-- TOC entry 6155 (class 0 OID 32025)
-- Dependencies: 242
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 6437 (class 0 OID 16494)
-- Dependencies: 226
-- Data for Name: tour_guides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tour_guides (guide_id, name, location_area, rating, hourly_rate, created_at) FROM stdin;
\.


--
-- TOC entry 6441 (class 0 OID 16590)
-- Dependencies: 233
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (transaction_id, booking_id, amount, currency, payment_method, payment_status, transaction_reference, created_at) FROM stdin;
\.


--
-- TOC entry 6439 (class 0 OID 16555)
-- Dependencies: 229
-- Data for Name: traveler_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.traveler_profiles (user_id, passport_number, emergency_contact, travel_preferences) FROM stdin;
\.


--
-- TOC entry 6433 (class 0 OID 16415)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, role, created_at) FROM stdin;
\.


--
-- TOC entry 6220 (class 2606 OID 16483)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (booking_id);


--
-- TOC entry 6249 (class 2606 OID 16813)
-- Name: concierge_requests concierge_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concierge_requests
    ADD CONSTRAINT concierge_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 6247 (class 2606 OID 16801)
-- Name: concierge_services concierge_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concierge_services
    ADD CONSTRAINT concierge_services_pkey PRIMARY KEY (service_id);


--
-- TOC entry 6258 (class 2606 OID 17630)
-- Name: host_payout_accounts host_payout_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_payout_accounts
    ADD CONSTRAINT host_payout_accounts_pkey PRIMARY KEY (payout_account_id);


--
-- TOC entry 6238 (class 2606 OID 16574)
-- Name: host_profiles host_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_profiles
    ADD CONSTRAINT host_profiles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 6245 (class 2606 OID 16784)
-- Name: listing_media listing_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_media
    ADD CONSTRAINT listing_media_pkey PRIMARY KEY (media_id);


--
-- TOC entry 6252 (class 2606 OID 17579)
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (listing_id);


--
-- TOC entry 6218 (class 2606 OID 16463)
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (media_id);


--
-- TOC entry 6225 (class 2606 OID 17552)
-- Name: bookings prevent_double_booking; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT prevent_double_booking EXCLUDE USING gist (property_id WITH =, daterange(start_date, end_date, '[)'::text) WITH &&) WHERE ((status = 'CONFIRMED'::public.booking_status));


--
-- TOC entry 6254 (class 2606 OID 17616)
-- Name: promotions promotions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_code_key UNIQUE (code);


--
-- TOC entry 6256 (class 2606 OID 17614)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (promo_id);


--
-- TOC entry 6215 (class 2606 OID 16445)
-- Name: property_listings property_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT property_listings_pkey PRIMARY KEY (property_id);


--
-- TOC entry 6231 (class 2606 OID 16537)
-- Name: reviews reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_key UNIQUE (booking_id);


--
-- TOC entry 6233 (class 2606 OID 16535)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 6228 (class 2606 OID 16509)
-- Name: tour_guides tour_guides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tour_guides
    ADD CONSTRAINT tour_guides_pkey PRIMARY KEY (guide_id);


--
-- TOC entry 6241 (class 2606 OID 16604)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 6243 (class 2606 OID 16606)
-- Name: transactions transactions_transaction_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_transaction_reference_key UNIQUE (transaction_reference);


--
-- TOC entry 6236 (class 2606 OID 16562)
-- Name: traveler_profiles traveler_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traveler_profiles
    ADD CONSTRAINT traveler_profiles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 6207 (class 2606 OID 16429)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 6209 (class 2606 OID 16427)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 6221 (class 1259 OID 16515)
-- Name: idx_bookings_date_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_date_range ON public.bookings USING btree (property_id, start_date, end_date);


--
-- TOC entry 6222 (class 1259 OID 16512)
-- Name: idx_bookings_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_property ON public.bookings USING btree (property_id);


--
-- TOC entry 6223 (class 1259 OID 16513)
-- Name: idx_bookings_traveler; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_traveler ON public.bookings USING btree (traveler_id);


--
-- TOC entry 6239 (class 1259 OID 16581)
-- Name: idx_host_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_host_profiles_id ON public.host_profiles USING btree (user_id);


--
-- TOC entry 6210 (class 1259 OID 17557)
-- Name: idx_listings_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_location ON public.property_listings USING gist (location_coordinates);


--
-- TOC entry 6211 (class 1259 OID 17655)
-- Name: idx_listings_location_gist; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_location_gist ON public.property_listings USING gist (location_coordinates);


--
-- TOC entry 6250 (class 1259 OID 17597)
-- Name: idx_listings_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listings_search ON public.listings USING btree (city, price_per_night, status) WHERE (is_active = true);


--
-- TOC entry 6216 (class 1259 OID 16511)
-- Name: idx_media_assets_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_assets_property ON public.media_assets USING btree (property_id);


--
-- TOC entry 6212 (class 1259 OID 16514)
-- Name: idx_properties_location_gist; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_location_gist ON public.property_listings USING gist (box(location_coordinates, location_coordinates));


--
-- TOC entry 6213 (class 1259 OID 16510)
-- Name: idx_property_listings_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_listings_host ON public.property_listings USING btree (host_id);


--
-- TOC entry 6229 (class 1259 OID 16553)
-- Name: idx_reviews_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_property ON public.reviews USING btree (property_id);


--
-- TOC entry 6226 (class 1259 OID 16554)
-- Name: idx_tour_guides_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tour_guides_search ON public.tour_guides USING btree (location_area, rating DESC);


--
-- TOC entry 6234 (class 1259 OID 16580)
-- Name: idx_traveler_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_traveler_profiles_id ON public.traveler_profiles USING btree (user_id);


--
-- TOC entry 6427 (class 2618 OID 17601)
-- Name: listing_summary _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.listing_summary AS
 SELECT l.listing_id,
    l.title,
    COALESCE(avg(r.rating), (0)::numeric) AS avg_rating,
    count(r.review_id) AS total_reviews
   FROM (public.listings l
     LEFT JOIN public.reviews r ON ((l.listing_id = r.property_id)))
  GROUP BY l.listing_id;


--
-- TOC entry 6276 (class 2620 OID 17637)
-- Name: listings set_timestamp_listings; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp_listings BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- TOC entry 6272 (class 2606 OID 16814)
-- Name: concierge_requests concierge_requests_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concierge_requests
    ADD CONSTRAINT concierge_requests_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 6273 (class 2606 OID 16819)
-- Name: concierge_requests concierge_requests_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.concierge_requests
    ADD CONSTRAINT concierge_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.concierge_services(service_id);


--
-- TOC entry 6261 (class 2606 OID 16446)
-- Name: property_listings fk_host; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_listings
    ADD CONSTRAINT fk_host FOREIGN KEY (host_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 6269 (class 2606 OID 16575)
-- Name: host_profiles fk_host_base; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_profiles
    ADD CONSTRAINT fk_host_base FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 6263 (class 2606 OID 16484)
-- Name: bookings fk_property_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_property_booking FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 6262 (class 2606 OID 16464)
-- Name: media_assets fk_property_media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_assets
    ADD CONSTRAINT fk_property_media FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 6265 (class 2606 OID 16538)
-- Name: reviews fk_review_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


--
-- TOC entry 6266 (class 2606 OID 16548)
-- Name: reviews fk_review_property; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_review_property FOREIGN KEY (property_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 6267 (class 2606 OID 16543)
-- Name: reviews fk_review_traveler; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_review_traveler FOREIGN KEY (traveler_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 6264 (class 2606 OID 16489)
-- Name: bookings fk_traveler; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_traveler FOREIGN KEY (traveler_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 6268 (class 2606 OID 16563)
-- Name: traveler_profiles fk_traveler_base; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traveler_profiles
    ADD CONSTRAINT fk_traveler_base FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 6275 (class 2606 OID 17631)
-- Name: host_payout_accounts host_payout_accounts_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.host_payout_accounts
    ADD CONSTRAINT host_payout_accounts_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 6271 (class 2606 OID 16785)
-- Name: listing_media listing_media_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_media
    ADD CONSTRAINT listing_media_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.property_listings(property_id) ON DELETE CASCADE;


--
-- TOC entry 6274 (class 2606 OID 17580)
-- Name: listings listings_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 6270 (class 2606 OID 16607)
-- Name: transactions transactions_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(booking_id) ON DELETE CASCADE;


-- Completed on 2026-08-29 10:44:46

--
-- PostgreSQL database dump complete
--

\unrestrict lhT7UFjeMUd2wMYQ56p9eYhAYuNalaj520UVxr101nb1BsaQj1LcXkDLRfP4e0w

