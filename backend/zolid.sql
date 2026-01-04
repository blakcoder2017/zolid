-- --
-- -- PostgreSQL database dump
-- --

-- \restrict y1Mq6HEj2gtwemUMF0IEKqUnWeqZT2oXvTuBtHXOKhvNKds0LIJ5M4Nt3fbBuNU

-- -- Dumped from database version 18.0
-- -- Dumped by pg_dump version 18.0

-- SET statement_timeout = 0;
-- SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
-- SET client_encoding = 'UTF8';
-- SET standard_conforming_strings = on;
-- SELECT pg_catalog.set_config('search_path', '', false);
-- SET check_function_bodies = false;
-- SET xmloption = content;
-- SET client_min_messages = warning;
-- SET row_security = off;

-- --
-- -- Name: public; Type: SCHEMA; Schema: -; Owner: -
-- --

-- CREATE SCHEMA public;


-- --
-- -- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
-- --

-- COMMENT ON SCHEMA public IS 'standard public schema';


-- --
-- -- Name: account_type_enum; Type: TYPE; Schema: public; Owner: -
-- --

-- CREATE TYPE public.account_type_enum AS ENUM (
--     'ASSET',
--     'LIABILITY',
--     'EQUITY',
--     'REVENUE',
--     'EXPENSE'
-- );


-- --
-- -- Name: job_state_enum; Type: TYPE; Schema: public; Owner: -
-- --

-- CREATE TYPE public.job_state_enum AS ENUM (
--     'DRAFT',
--     'MATCHED_PENDING_PAYMENT',
--     'ESCROW_PENDING',
--     'ESCROW_HELD',
--     'STARTED',
--     'COMPLETED_PENDING',
--     'DISPUTED',
--     'PAYOUT_SUCCESS',
--     'CANCELLED',
--     'OPEN_FOR_QUOTES',
--     'QUOTED',
--     'MATCHED',
--     'AWAITING_PAYMENT',
--     'IN_PROGRESS',
--     'PAYOUT_FAILED',
--     'CANCELLED_REFUNDED'
-- );


-- --
-- -- Name: posting_direction_enum; Type: TYPE; Schema: public; Owner: -
-- --

-- CREATE TYPE public.posting_direction_enum AS ENUM (
--     'DEBIT',
--     'CREDIT'
-- );


-- --
-- -- Name: update_account_balance(); Type: FUNCTION; Schema: public; Owner: -
-- --

-- CREATE FUNCTION public.update_account_balance() RETURNS trigger
--     LANGUAGE plpgsql
--     AS $$
-- DECLARE
--     account_type account_type_enum;
-- BEGIN
--     SELECT type INTO account_type FROM accounts WHERE id = NEW.account_id;
    
--     UPDATE accounts
--     SET balance_pesewas = balance_pesewas + (
--         CASE 
--             -- ASSET/EXPENSE: Debit increases, Credit decreases
--             WHEN account_type IN ('ASSET', 'EXPENSE') AND NEW.direction = 'DEBIT' THEN NEW.amount_pesewas
--             WHEN account_type IN ('ASSET', 'EXPENSE') AND NEW.direction = 'CREDIT' THEN -NEW.amount_pesewas
--             -- LIABILITY/EQUITY/REVENUE: Credit increases, Debit decreases
--             WHEN account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') AND NEW.direction = 'CREDIT' THEN NEW.amount_pesewas
--             WHEN account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') AND NEW.direction = 'DEBIT' THEN -NEW.amount_pesewas
--             ELSE 0
--         END
--     )
--     WHERE id = NEW.account_id;
    
--     RETURN NEW;
-- END;
-- $$;


-- --
-- -- Name: update_job_quotes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
-- --

-- CREATE FUNCTION public.update_job_quotes_updated_at() RETURNS trigger
--     LANGUAGE plpgsql
--     AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$;


-- SET default_tablespace = '';

-- SET default_table_access_method = heap;

-- --
-- -- Name: accounts; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.accounts (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     code character varying(10) NOT NULL,
--     name character varying(100) NOT NULL,
--     type public.account_type_enum NOT NULL,
--     currency character(3) DEFAULT 'GHS'::bpchar,
--     is_tax_liability boolean DEFAULT false,
--     balance_pesewas bigint DEFAULT 0,
--     created_at timestamp with time zone DEFAULT now()
-- );


-- --
-- -- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.admin_audit_log (
--     id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
--     admin_id uuid,
--     action character varying(100) NOT NULL,
--     entity_type character varying(50),
--     entity_id uuid,
--     old_value jsonb,
--     new_value jsonb,
--     ip_address character varying(45),
--     user_agent text,
--     metadata jsonb,
--     created_at timestamp without time zone DEFAULT now()
-- );


-- --
-- -- Name: admin_users; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.admin_users (
--     id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
--     email character varying(255) NOT NULL,
--     password_hash character varying(255) NOT NULL,
--     full_name character varying(100) NOT NULL,
--     phone character varying(20),
--     role character varying(50) DEFAULT 'ADMIN'::character varying,
--     permissions jsonb DEFAULT '{}'::jsonb,
--     is_active boolean DEFAULT true,
--     last_login timestamp without time zone,
--     created_at timestamp without time zone DEFAULT now(),
--     updated_at timestamp without time zone DEFAULT now()
-- );


-- --
-- -- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.analytics_events (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     event_type character varying(50) NOT NULL,
--     user_id uuid,
--     user_type character varying(20),
--     job_id uuid,
--     quote_id uuid,
--     event_data jsonb,
--     created_at timestamp with time zone DEFAULT now()
-- );


-- --
-- -- Name: artisan_guarantors; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.artisan_guarantors (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     artisan_id uuid,
--     name character varying(100) NOT NULL,
--     phone character varying(15) NOT NULL,
--     relationship character varying(50),
--     is_verified boolean DEFAULT false,
--     created_at timestamp with time zone DEFAULT now()
-- );


-- --
-- -- Name: artisan_profiles; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.artisan_profiles (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     phone_primary character varying(15) NOT NULL,
--     full_name character varying(100) NOT NULL,
--     password_hash character varying(255) NOT NULL,
--     profile_picture_url text,
--     momo_network character varying(20) NOT NULL,
--     is_momo_verified boolean DEFAULT false,
--     paystack_resolved_name character varying(100),
--     paystack_recipient_code character varying(50),
--     gh_card_number character varying(20),
--     gh_card_image_url text,
--     is_identity_verified boolean DEFAULT false,
--     primary_trade character varying(50),
--     primary_language character varying(20) DEFAULT 'ENGLISH'::character varying,
--     home_gps_address character varying(255),
--     home_lat numeric(9,6),
--     home_lon numeric(9,6),
--     riviaco_policy_id character varying(50),
--     tier_level integer DEFAULT 1,
--     reputation_score numeric(3,2) DEFAULT 0.00,
--     total_review_count integer DEFAULT 0,
--     created_at timestamp with time zone DEFAULT now(),
--     updated_at timestamp with time zone DEFAULT now(),
--     fcm_token text,
--     fcm_token_updated_at timestamp with time zone,
--     riviaco_plan character varying(20) DEFAULT NULL::character varying,
--     riviaco_enrollment_date timestamp with time zone,
--     riviaco_standard_plan_contribution_pesewas bigint DEFAULT 0,
--     riviaco_member_id character varying(50),
--     riviaco_card_code character varying(50),
--     riviaco_sync_status character varying(20) DEFAULT 'pending'::character varying,
--     dob date,
--     gender character varying(10),
--     email character varying(150),
--     accept_terms boolean DEFAULT false,
--     accept_privacy boolean DEFAULT false
-- );


-- --
-- -- Name: COLUMN artisan_profiles.riviaco_plan; Type: COMMENT; Schema: public; Owner: -
-- --

-- COMMENT ON COLUMN public.artisan_profiles.riviaco_plan IS 'RiviaCo plan type: FREE (upon verification) or STANDARD (after first gig earnings)';


-- --
-- -- Name: COLUMN artisan_profiles.riviaco_enrollment_date; Type: COMMENT; Schema: public; Owner: -
-- --

-- COMMENT ON COLUMN public.artisan_profiles.riviaco_enrollment_date IS 'Date when artisan enrolled in RiviaCo (Free plan)';


-- --
-- -- Name: COLUMN artisan_profiles.riviaco_standard_plan_contribution_pesewas; Type: COMMENT; Schema: public; Owner: -
-- --

-- COMMENT ON COLUMN public.artisan_profiles.riviaco_standard_plan_contribution_pesewas IS 'Total contribution toward Standard plan annual fee (500 GHS = 50000 pesewas). 20 cedis/month = 2000 pesewas/month';


-- --
-- -- Name: COLUMN artisan_profiles.riviaco_sync_status; Type: COMMENT; Schema: public; Owner: -
-- --

-- COMMENT ON COLUMN public.artisan_profiles.riviaco_sync_status IS 'Status of RiviaCo synchronization: pending, synced, failed';


-- --
-- -- Name: artisan_reviews; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.artisan_reviews (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     job_transaction_id uuid NOT NULL,
--     artisan_id uuid NOT NULL,
--     client_id uuid NOT NULL,
--     rating integer NOT NULL,
--     review_text text,
--     created_at timestamp with time zone DEFAULT now(),
--     updated_at timestamp with time zone DEFAULT now(),
--     CONSTRAINT artisan_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
-- );


-- --
-- -- Name: benefits_ledger; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.benefits_ledger (
--     ledger_id uuid DEFAULT gen_random_uuid() NOT NULL,
--     artisan_id uuid,
--     job_id uuid,
--     premium_amount_pesewas bigint NOT NULL,
--     remittance_batch_id uuid,
--     status character varying(20) DEFAULT 'PENDING'::character varying,
--     created_at timestamp with time zone DEFAULT now(),
--     remitted_at timestamp with time zone,
--     CONSTRAINT benefits_ledger_premium_amount_pesewas_check CHECK ((premium_amount_pesewas > 0))
-- );


-- --
-- -- Name: client_profiles; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.client_profiles (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     phone_primary character varying(15) NOT NULL,
--     full_name character varying(100),
--     email character varying(100),
--     password_hash character varying(255) NOT NULL,
--     home_gps_address character varying(255),
--     home_lat numeric(9,6),
--     home_lon numeric(9,6),
--     created_at timestamp with time zone DEFAULT now(),
--     updated_at timestamp with time zone DEFAULT now(),
--     fcm_token text,
--     fcm_token_updated_at timestamp with time zone
-- );


-- --
-- -- Name: dispute_messages; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.dispute_messages (
--     id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
--     dispute_id uuid,
--     sender_id uuid NOT NULL,
--     sender_role character varying(20),
--     message text NOT NULL,
--     created_at timestamp without time zone DEFAULT now(),
--     CONSTRAINT dispute_messages_sender_role_check CHECK (((sender_role)::text = ANY ((ARRAY['CLIENT'::character varying, 'ARTISAN'::character varying, 'ADMIN'::character varying])::text[])))
-- );


-- --
-- -- Name: disputes; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.disputes (
--     id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
--     job_id uuid NOT NULL,
--     raised_by_client_id uuid,
--     raised_by_artisan_id uuid,
--     category character varying(50) NOT NULL,
--     description text NOT NULL,
--     evidence_urls text[],
--     status character varying(20) DEFAULT 'OPEN'::character varying,
--     resolution_notes text,
--     proposed_refund_amount integer,
--     artisan_counter_offer integer,
--     current_turn character varying(20),
--     created_at timestamp without time zone DEFAULT now(),
--     updated_at timestamp without time zone DEFAULT now(),
--     CONSTRAINT check_raiser_exists CHECK ((((raised_by_client_id IS NOT NULL) AND (raised_by_artisan_id IS NULL)) OR ((raised_by_client_id IS NULL) AND (raised_by_artisan_id IS NOT NULL))))
-- );


-- --
-- -- Name: financial_config; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.financial_config (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     platform_commission_percent numeric(3,2) NOT NULL,
--     warranty_fee_percent numeric(3,2) NOT NULL,
--     riviaco_premium_pesewas bigint NOT NULL,
--     is_active boolean DEFAULT true,
--     created_at timestamp with time zone DEFAULT now()
-- );


-- --
-- -- Name: job_artisan_acceptances; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.job_artisan_acceptances (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     job_id uuid NOT NULL,
--     artisan_id uuid NOT NULL,
--     accepted_at timestamp with time zone DEFAULT now(),
--     is_selected boolean DEFAULT false
-- );


-- --
-- -- Name: job_quotes; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.job_quotes (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     job_id uuid NOT NULL,
--     artisan_id uuid NOT NULL,
--     quoted_fee_pesewas integer NOT NULL,
--     quote_message text,
--     estimated_duration_hours integer,
--     warranty_fee_pesewas integer NOT NULL,
--     total_client_pays_pesewas integer NOT NULL,
--     artisan_payout_pesewas integer NOT NULL,
--     platform_commission_pesewas integer NOT NULL,
--     riviaco_premium_pesewas integer NOT NULL,
--     status character varying(50) DEFAULT 'PENDING'::character varying,
--     rejection_reason character varying(100),
--     created_at timestamp with time zone DEFAULT now(),
--     updated_at timestamp with time zone DEFAULT now(),
--     allows_negotiation boolean DEFAULT true,
--     negotiation_rounds integer DEFAULT 0,
--     current_negotiation_id uuid,
--     CONSTRAINT job_quotes_estimated_duration_hours_check CHECK ((estimated_duration_hours > 0)),
--     CONSTRAINT job_quotes_quoted_fee_pesewas_check CHECK (((quoted_fee_pesewas >= 1000) AND (quoted_fee_pesewas <= 1000000))),
--     CONSTRAINT job_quotes_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying, 'WITHDRAWN'::character varying])::text[])))
-- );


-- --
-- -- Name: job_transactions; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.job_transactions (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     client_id uuid,
--     artisan_id uuid,
--     current_state public.job_state_enum DEFAULT 'DRAFT'::public.job_state_enum,
--     gross_fee_pesewas bigint,
--     warranty_fee_pesewas bigint NOT NULL,
--     artisan_payout_pesewas bigint NOT NULL,
--     riviaco_premium_pesewas bigint NOT NULL,
--     platform_commission_pesewas bigint NOT NULL,
--     location_gps_address character varying(20),
--     location_lat numeric(9,6),
--     location_lon numeric(9,6),
--     paystack_reference_id character varying(100),
--     photo_evidence_before_url text,
--     photo_evidence_after_url text,
--     is_client_signed_off boolean DEFAULT false,
--     client_otp character varying(6),
--     otp_generated_at timestamp with time zone,
--     otp_expires_at timestamp with time zone,
--     created_at timestamp with time zone DEFAULT now(),
--     updated_at timestamp with time zone DEFAULT now(),
--     job_description text,
--     selected_quote_id uuid,
--     quotes_deadline timestamp with time zone DEFAULT (now() + '48:00:00'::interval),
--     max_quotes integer DEFAULT 10,
--     quote_count integer DEFAULT 0
-- );


-- --
-- -- Name: momo_providers; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.momo_providers (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     provider_name character varying(50) NOT NULL,
--     provider_code character varying(10) NOT NULL,
--     country character varying(50) NOT NULL,
--     is_active boolean DEFAULT true,
--     created_at timestamp with time zone DEFAULT now(),
--     updated_at timestamp with time zone DEFAULT now()
-- );


-- --
-- -- Name: TABLE momo_providers; Type: COMMENT; Schema: public; Owner: -
-- --

-- COMMENT ON TABLE public.momo_providers IS 'Mobile Money provider codes for Paystack transfers. Maps provider names to Paystack codes.';


-- --
-- -- Name: COLUMN momo_providers.provider_code; Type: COMMENT; Schema: public; Owner: -
-- --

-- COMMENT ON COLUMN public.momo_providers.provider_code IS 'The code used by Paystack API (e.g., mtn, atl, vod, mpesa, orange, wave)';


-- --
-- -- Name: COLUMN momo_providers.country; Type: COMMENT; Schema: public; Owner: -
-- --

-- COMMENT ON COLUMN public.momo_providers.country IS 'ISO country code or country name where this provider operates';


-- --
-- -- Name: notifications; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.notifications (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     user_id uuid NOT NULL,
--     user_type character varying(20) NOT NULL,
--     notification_type character varying(50) NOT NULL,
--     title text NOT NULL,
--     body text NOT NULL,
--     data jsonb,
--     sent_at timestamp with time zone DEFAULT now(),
--     delivered boolean DEFAULT false,
--     read_at timestamp with time zone,
--     fcm_message_id text,
--     CONSTRAINT notifications_user_type_check CHECK (((user_type)::text = ANY ((ARRAY['artisan'::character varying, 'client'::character varying])::text[])))
-- );


-- --
-- -- Name: postings; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.postings (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     transaction_id uuid,
--     account_id uuid,
--     amount_pesewas bigint NOT NULL,
--     direction public.posting_direction_enum NOT NULL,
--     created_at timestamp with time zone DEFAULT now(),
--     CONSTRAINT postings_amount_pesewas_check CHECK ((amount_pesewas > 0))
-- );


-- --
-- -- Name: quote_negotiations; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.quote_negotiations (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     quote_id uuid NOT NULL,
--     round_number integer NOT NULL,
--     offered_by character varying(20) NOT NULL,
--     offered_amount_pesewas integer NOT NULL,
--     message text,
--     status character varying(20) DEFAULT 'PENDING'::character varying,
--     created_at timestamp with time zone DEFAULT now(),
--     expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval),
--     responded_at timestamp with time zone,
--     CONSTRAINT quote_negotiations_offered_by_check CHECK (((offered_by)::text = ANY ((ARRAY['client'::character varying, 'artisan'::character varying])::text[]))),
--     CONSTRAINT quote_negotiations_round_number_check CHECK (((round_number >= 1) AND (round_number <= 3))),
--     CONSTRAINT quote_negotiations_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying, 'EXPIRED'::character varying, 'COUNTER'::character varying])::text[])))
-- );


-- --
-- -- Name: remittance_batch; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.remittance_batch (
--     batch_id uuid DEFAULT gen_random_uuid() NOT NULL,
--     partner_name character varying(50) NOT NULL,
--     total_amount_pesewas bigint NOT NULL,
--     status character varying(20) DEFAULT 'PENDING'::character varying,
--     paystack_transfer_ref character varying(100),
--     paystack_batch_code character varying(100),
--     scheduled_date date NOT NULL,
--     processed_at timestamp with time zone,
--     error_message text,
--     created_at timestamp with time zone DEFAULT now(),
--     updated_at timestamp with time zone DEFAULT now(),
--     CONSTRAINT remittance_batch_total_amount_pesewas_check CHECK ((total_amount_pesewas > 0))
-- );


-- --
-- -- Name: rivia_cards; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.rivia_cards (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     created_on timestamp without time zone NOT NULL,
--     card_code character varying(20) NOT NULL,
--     brand character varying(50) NOT NULL,
--     valid_till date,
--     member_id uuid,
--     price numeric(10,2),
--     is_free boolean DEFAULT false,
--     status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
--     assigned_to uuid,
--     CONSTRAINT price_free_check CHECK ((((is_free = true) AND (price = (0)::numeric)) OR ((is_free = false) AND (price > (0)::numeric))))
-- );


-- --
-- -- Name: transactions; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.transactions (
--     id uuid DEFAULT gen_random_uuid() NOT NULL,
--     reference_id character varying(100) NOT NULL,
--     description text,
--     metadata jsonb,
--     created_at timestamp with time zone DEFAULT now()
-- );


-- --
-- -- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: -
-- --

-- CREATE TABLE public.withdrawal_requests (
--     id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
--     user_id uuid NOT NULL,
--     user_role character varying(20) DEFAULT 'CLIENT'::character varying,
--     amount_pesewas bigint NOT NULL,
--     status character varying(20) DEFAULT 'PENDING'::character varying,
--     transaction_id uuid,
--     admin_notes text,
--     processed_at timestamp without time zone,
--     processed_by uuid,
--     created_at timestamp without time zone DEFAULT now(),
--     updated_at timestamp without time zone DEFAULT now(),
--     paystack_recipient_code character varying(100),
--     resolved_account_name character varying(255),
--     momo_number character varying(20),
--     bank_code character varying(10),
--     CONSTRAINT withdrawal_requests_amount_pesewas_check CHECK ((amount_pesewas > 0)),
--     CONSTRAINT withdrawal_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'PROCESSED'::character varying])::text[])))
-- );


-- --
-- -- Name: accounts accounts_code_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.accounts
--     ADD CONSTRAINT accounts_code_key UNIQUE (code);


-- --
-- -- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.accounts
--     ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


-- --
-- -- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.admin_audit_log
--     ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


-- --
-- -- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.admin_users
--     ADD CONSTRAINT admin_users_email_key UNIQUE (email);


-- --
-- -- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.admin_users
--     ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


-- --
-- -- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.analytics_events
--     ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


-- --
-- -- Name: artisan_guarantors artisan_guarantors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_guarantors
--     ADD CONSTRAINT artisan_guarantors_pkey PRIMARY KEY (id);


-- --
-- -- Name: artisan_profiles artisan_profiles_gh_card_number_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_profiles
--     ADD CONSTRAINT artisan_profiles_gh_card_number_key UNIQUE (gh_card_number);


-- --
-- -- Name: artisan_profiles artisan_profiles_phone_primary_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_profiles
--     ADD CONSTRAINT artisan_profiles_phone_primary_key UNIQUE (phone_primary);


-- --
-- -- Name: artisan_profiles artisan_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_profiles
--     ADD CONSTRAINT artisan_profiles_pkey PRIMARY KEY (id);


-- --
-- -- Name: artisan_reviews artisan_reviews_job_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_reviews
--     ADD CONSTRAINT artisan_reviews_job_transaction_id_key UNIQUE (job_transaction_id);


-- --
-- -- Name: artisan_reviews artisan_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_reviews
--     ADD CONSTRAINT artisan_reviews_pkey PRIMARY KEY (id);


-- --
-- -- Name: benefits_ledger benefits_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.benefits_ledger
--     ADD CONSTRAINT benefits_ledger_pkey PRIMARY KEY (ledger_id);


-- --
-- -- Name: client_profiles client_profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.client_profiles
--     ADD CONSTRAINT client_profiles_email_key UNIQUE (email);


-- --
-- -- Name: client_profiles client_profiles_phone_primary_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.client_profiles
--     ADD CONSTRAINT client_profiles_phone_primary_key UNIQUE (phone_primary);


-- --
-- -- Name: client_profiles client_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.client_profiles
--     ADD CONSTRAINT client_profiles_pkey PRIMARY KEY (id);


-- --
-- -- Name: dispute_messages dispute_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.dispute_messages
--     ADD CONSTRAINT dispute_messages_pkey PRIMARY KEY (id);


-- --
-- -- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.disputes
--     ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


-- --
-- -- Name: financial_config financial_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.financial_config
--     ADD CONSTRAINT financial_config_pkey PRIMARY KEY (id);


-- --
-- -- Name: job_artisan_acceptances job_artisan_acceptances_job_id_artisan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_artisan_acceptances
--     ADD CONSTRAINT job_artisan_acceptances_job_id_artisan_id_key UNIQUE (job_id, artisan_id);


-- --
-- -- Name: job_artisan_acceptances job_artisan_acceptances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_artisan_acceptances
--     ADD CONSTRAINT job_artisan_acceptances_pkey PRIMARY KEY (id);


-- --
-- -- Name: job_quotes job_quotes_job_id_artisan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_quotes
--     ADD CONSTRAINT job_quotes_job_id_artisan_id_key UNIQUE (job_id, artisan_id);


-- --
-- -- Name: job_quotes job_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_quotes
--     ADD CONSTRAINT job_quotes_pkey PRIMARY KEY (id);


-- --
-- -- Name: job_transactions job_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_transactions
--     ADD CONSTRAINT job_transactions_pkey PRIMARY KEY (id);


-- --
-- -- Name: momo_providers momo_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.momo_providers
--     ADD CONSTRAINT momo_providers_pkey PRIMARY KEY (id);


-- --
-- -- Name: momo_providers momo_providers_provider_name_country_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.momo_providers
--     ADD CONSTRAINT momo_providers_provider_name_country_key UNIQUE (provider_name, country);


-- --
-- -- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.notifications
--     ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


-- --
-- -- Name: postings postings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.postings
--     ADD CONSTRAINT postings_pkey PRIMARY KEY (id);


-- --
-- -- Name: quote_negotiations quote_negotiations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.quote_negotiations
--     ADD CONSTRAINT quote_negotiations_pkey PRIMARY KEY (id);


-- --
-- -- Name: remittance_batch remittance_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.remittance_batch
--     ADD CONSTRAINT remittance_batch_pkey PRIMARY KEY (batch_id);


-- --
-- -- Name: rivia_cards rivia_cards_card_code_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.rivia_cards
--     ADD CONSTRAINT rivia_cards_card_code_key UNIQUE (card_code);


-- --
-- -- Name: rivia_cards rivia_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.rivia_cards
--     ADD CONSTRAINT rivia_cards_pkey PRIMARY KEY (id);


-- --
-- -- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.transactions
--     ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


-- --
-- -- Name: transactions transactions_reference_id_key; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.transactions
--     ADD CONSTRAINT transactions_reference_id_key UNIQUE (reference_id);


-- --
-- -- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.withdrawal_requests
--     ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


-- --
-- -- Name: idx_admin_email; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_admin_email ON public.admin_users USING btree (email);


-- --
-- -- Name: idx_analytics_created; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_analytics_created ON public.analytics_events USING btree (created_at DESC);


-- --
-- -- Name: idx_analytics_type; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_analytics_type ON public.analytics_events USING btree (event_type);


-- --
-- -- Name: idx_artisan_phone; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_phone ON public.artisan_profiles USING btree (phone_primary);


-- --
-- -- Name: idx_artisan_profiles_riviaco_card_code; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_profiles_riviaco_card_code ON public.artisan_profiles USING btree (riviaco_card_code);


-- --
-- -- Name: idx_artisan_profiles_riviaco_member_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_profiles_riviaco_member_id ON public.artisan_profiles USING btree (riviaco_member_id);


-- --
-- -- Name: idx_artisan_profiles_riviaco_plan; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_profiles_riviaco_plan ON public.artisan_profiles USING btree (riviaco_plan);


-- --
-- -- Name: idx_artisan_reviews_artisan_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_reviews_artisan_id ON public.artisan_reviews USING btree (artisan_id);


-- --
-- -- Name: idx_artisan_reviews_client_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_reviews_client_id ON public.artisan_reviews USING btree (client_id);


-- --
-- -- Name: idx_artisan_reviews_job_transaction_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_reviews_job_transaction_id ON public.artisan_reviews USING btree (job_transaction_id);


-- --
-- -- Name: idx_artisan_riviaco_sync_status; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_artisan_riviaco_sync_status ON public.artisan_profiles USING btree (riviaco_sync_status);


-- --
-- -- Name: idx_audit_admin_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_audit_admin_id ON public.admin_audit_log USING btree (admin_id);


-- --
-- -- Name: idx_audit_entity_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_audit_entity_id ON public.admin_audit_log USING btree (entity_id);


-- --
-- -- Name: idx_benefits_artisan; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_benefits_artisan ON public.benefits_ledger USING btree (artisan_id);


-- --
-- -- Name: idx_benefits_batch; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_benefits_batch ON public.benefits_ledger USING btree (remittance_batch_id);


-- --
-- -- Name: idx_benefits_status; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_benefits_status ON public.benefits_ledger USING btree (status);


-- --
-- -- Name: idx_client_phone; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_client_phone ON public.client_profiles USING btree (phone_primary);


-- --
-- -- Name: idx_disputes_artisan; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_disputes_artisan ON public.disputes USING btree (raised_by_artisan_id);


-- --
-- -- Name: idx_disputes_client; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_disputes_client ON public.disputes USING btree (raised_by_client_id);


-- --
-- -- Name: idx_job_artisan_acceptances_artisan_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_artisan_acceptances_artisan_id ON public.job_artisan_acceptances USING btree (artisan_id);


-- --
-- -- Name: idx_job_artisan_acceptances_job_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_artisan_acceptances_job_id ON public.job_artisan_acceptances USING btree (job_id);


-- --
-- -- Name: idx_job_artisan_acceptances_selected; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_artisan_acceptances_selected ON public.job_artisan_acceptances USING btree (job_id, is_selected) WHERE (is_selected = true);


-- --
-- -- Name: idx_job_quotes_artisan_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_quotes_artisan_id ON public.job_quotes USING btree (artisan_id);


-- --
-- -- Name: idx_job_quotes_created_at; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_quotes_created_at ON public.job_quotes USING btree (created_at);


-- --
-- -- Name: idx_job_quotes_job_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_quotes_job_id ON public.job_quotes USING btree (job_id);


-- --
-- -- Name: idx_job_quotes_status; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_quotes_status ON public.job_quotes USING btree (status);


-- --
-- -- Name: idx_job_state; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_state ON public.job_transactions USING btree (current_state);


-- --
-- -- Name: idx_job_transactions_artisan_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_transactions_artisan_id ON public.job_transactions USING btree (artisan_id);


-- --
-- -- Name: idx_job_transactions_artisan_state; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_transactions_artisan_state ON public.job_transactions USING btree (artisan_id, current_state);


-- --
-- -- Name: idx_job_transactions_client_id; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_transactions_client_id ON public.job_transactions USING btree (client_id);


-- --
-- -- Name: idx_job_transactions_client_state; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_transactions_client_state ON public.job_transactions USING btree (client_id, current_state);


-- --
-- -- Name: idx_job_transactions_created_at; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_job_transactions_created_at ON public.job_transactions USING btree (created_at DESC);


-- --
-- -- Name: idx_momo_providers_code_country; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_momo_providers_code_country ON public.momo_providers USING btree (provider_code, country) WHERE (is_active = true);


-- --
-- -- Name: idx_momo_providers_name_country; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_momo_providers_name_country ON public.momo_providers USING btree (provider_name, country) WHERE (is_active = true);


-- --
-- -- Name: idx_negotiation_quote; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_negotiation_quote ON public.quote_negotiations USING btree (quote_id);


-- --
-- -- Name: idx_negotiation_status; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_negotiation_status ON public.quote_negotiations USING btree (status);


-- --
-- -- Name: idx_notifications_sent; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_notifications_sent ON public.notifications USING btree (sent_at DESC);


-- --
-- -- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, user_type);


-- --
-- -- Name: idx_posting_account; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_posting_account ON public.postings USING btree (account_id);


-- --
-- -- Name: idx_posting_transaction; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_posting_transaction ON public.postings USING btree (transaction_id);


-- --
-- -- Name: idx_remittance_partner; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_remittance_partner ON public.remittance_batch USING btree (partner_name);


-- --
-- -- Name: idx_remittance_scheduled; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_remittance_scheduled ON public.remittance_batch USING btree (scheduled_date);


-- --
-- -- Name: idx_remittance_status; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_remittance_status ON public.remittance_batch USING btree (status);


-- --
-- -- Name: idx_rivia_cards_assigned_to; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_rivia_cards_assigned_to ON public.rivia_cards USING btree (assigned_to);


-- --
-- -- Name: idx_withdrawal_user; Type: INDEX; Schema: public; Owner: -
-- --

-- CREATE INDEX idx_withdrawal_user ON public.withdrawal_requests USING btree (user_id);


-- --
-- -- Name: job_quotes job_quotes_updated_at; Type: TRIGGER; Schema: public; Owner: -
-- --

-- CREATE TRIGGER job_quotes_updated_at BEFORE UPDATE ON public.job_quotes FOR EACH ROW EXECUTE FUNCTION public.update_job_quotes_updated_at();


-- --
-- -- Name: postings trigger_update_balance; Type: TRIGGER; Schema: public; Owner: -
-- --

-- CREATE TRIGGER trigger_update_balance AFTER INSERT ON public.postings FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();


-- --
-- -- Name: admin_audit_log admin_audit_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.admin_audit_log
--     ADD CONSTRAINT admin_audit_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id);


-- --
-- -- Name: artisan_guarantors artisan_guarantors_artisan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_guarantors
--     ADD CONSTRAINT artisan_guarantors_artisan_id_fkey FOREIGN KEY (artisan_id) REFERENCES public.artisan_profiles(id) ON DELETE CASCADE;


-- --
-- -- Name: artisan_reviews artisan_reviews_artisan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_reviews
--     ADD CONSTRAINT artisan_reviews_artisan_id_fkey FOREIGN KEY (artisan_id) REFERENCES public.artisan_profiles(id) ON DELETE CASCADE;


-- --
-- -- Name: artisan_reviews artisan_reviews_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_reviews
--     ADD CONSTRAINT artisan_reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE CASCADE;


-- --
-- -- Name: artisan_reviews artisan_reviews_job_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.artisan_reviews
--     ADD CONSTRAINT artisan_reviews_job_transaction_id_fkey FOREIGN KEY (job_transaction_id) REFERENCES public.job_transactions(id) ON DELETE CASCADE;


-- --
-- -- Name: benefits_ledger benefits_ledger_artisan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.benefits_ledger
--     ADD CONSTRAINT benefits_ledger_artisan_id_fkey FOREIGN KEY (artisan_id) REFERENCES public.artisan_profiles(id) ON DELETE CASCADE;


-- --
-- -- Name: benefits_ledger benefits_ledger_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.benefits_ledger
--     ADD CONSTRAINT benefits_ledger_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_transactions(id) ON DELETE SET NULL;


-- --
-- -- Name: benefits_ledger benefits_ledger_remittance_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.benefits_ledger
--     ADD CONSTRAINT benefits_ledger_remittance_batch_id_fkey FOREIGN KEY (remittance_batch_id) REFERENCES public.remittance_batch(batch_id) ON DELETE SET NULL;


-- --
-- -- Name: dispute_messages dispute_messages_dispute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.dispute_messages
--     ADD CONSTRAINT dispute_messages_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;


-- --
-- -- Name: disputes disputes_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.disputes
--     ADD CONSTRAINT disputes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_transactions(id);


-- --
-- -- Name: disputes disputes_raised_by_artisan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.disputes
--     ADD CONSTRAINT disputes_raised_by_artisan_id_fkey FOREIGN KEY (raised_by_artisan_id) REFERENCES public.artisan_profiles(id);


-- --
-- -- Name: disputes disputes_raised_by_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.disputes
--     ADD CONSTRAINT disputes_raised_by_client_id_fkey FOREIGN KEY (raised_by_client_id) REFERENCES public.client_profiles(id);


-- --
-- -- Name: job_artisan_acceptances job_artisan_acceptances_artisan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_artisan_acceptances
--     ADD CONSTRAINT job_artisan_acceptances_artisan_id_fkey FOREIGN KEY (artisan_id) REFERENCES public.artisan_profiles(id) ON DELETE CASCADE;


-- --
-- -- Name: job_artisan_acceptances job_artisan_acceptances_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_artisan_acceptances
--     ADD CONSTRAINT job_artisan_acceptances_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_transactions(id) ON DELETE CASCADE;


-- --
-- -- Name: job_quotes job_quotes_artisan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_quotes
--     ADD CONSTRAINT job_quotes_artisan_id_fkey FOREIGN KEY (artisan_id) REFERENCES public.artisan_profiles(id) ON DELETE CASCADE;


-- --
-- -- Name: job_quotes job_quotes_current_negotiation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_quotes
--     ADD CONSTRAINT job_quotes_current_negotiation_id_fkey FOREIGN KEY (current_negotiation_id) REFERENCES public.quote_negotiations(id);


-- --
-- -- Name: job_quotes job_quotes_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_quotes
--     ADD CONSTRAINT job_quotes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_transactions(id) ON DELETE CASCADE;


-- --
-- -- Name: job_transactions job_transactions_artisan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_transactions
--     ADD CONSTRAINT job_transactions_artisan_id_fkey FOREIGN KEY (artisan_id) REFERENCES public.artisan_profiles(id);


-- --
-- -- Name: job_transactions job_transactions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_transactions
--     ADD CONSTRAINT job_transactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client_profiles(id);


-- --
-- -- Name: job_transactions job_transactions_selected_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.job_transactions
--     ADD CONSTRAINT job_transactions_selected_quote_id_fkey FOREIGN KEY (selected_quote_id) REFERENCES public.job_quotes(id);


-- --
-- -- Name: postings postings_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.postings
--     ADD CONSTRAINT postings_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE RESTRICT;


-- --
-- -- Name: postings postings_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.postings
--     ADD CONSTRAINT postings_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE RESTRICT;


-- --
-- -- Name: quote_negotiations quote_negotiations_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.quote_negotiations
--     ADD CONSTRAINT quote_negotiations_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.job_quotes(id) ON DELETE CASCADE;


-- --
-- -- Name: rivia_cards rivia_cards_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.rivia_cards
--     ADD CONSTRAINT rivia_cards_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.artisan_profiles(id);


-- --
-- -- Name: withdrawal_requests withdrawal_requests_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
-- --

-- ALTER TABLE ONLY public.withdrawal_requests
--     ADD CONSTRAINT withdrawal_requests_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


-- --
-- -- PostgreSQL database dump complete
-- --

-- \unrestrict y1Mq6HEj2gtwemUMF0IEKqUnWeqZT2oXvTuBtHXOKhvNKds0LIJ5M4Nt3fbBuNU

-- ====================================================================
-- ZOLID SYSTEMS: FULL DATABASE RESET SCRIPT
-- ====================================================================

-- 1. DROP EVERYTHING (Clean Slate)
-- ====================================================================
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;

-- 2. ENABLE EXTENSIONS
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 
-- uuid-ossp is not needed if we use pgcrypto's gen_random_uuid()

-- 3. CREATE ENUMS
-- ====================================================================
CREATE TYPE account_type_enum AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE posting_direction_enum AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE job_state_enum AS ENUM (
    'DRAFT', 'MATCHED_PENDING_PAYMENT', 'ESCROW_PENDING', 'ESCROW_HELD', 
    'STARTED', 'COMPLETED_PENDING', 'DISPUTED', 'PAYOUT_SUCCESS', 'CANCELLED', 
    'OPEN_FOR_QUOTES', 'QUOTED', 'MATCHED', 'AWAITING_PAYMENT', 'IN_PROGRESS', 
    'PAYOUT_FAILED', 'CANCELLED_REFUNDED'
);

-- 4. CREATE TABLES (Order matters for dependencies)
-- ====================================================================

-- Independent Tables
CREATE TABLE accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code character varying(10) NOT NULL UNIQUE,
    name character varying(100) NOT NULL,
    type account_type_enum NOT NULL,
    currency character(3) DEFAULT 'GHS',
    is_tax_liability boolean DEFAULT false,
    balance_pesewas bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email character varying(255) NOT NULL UNIQUE,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    phone character varying(20),
    role character varying(50) DEFAULT 'ADMIN',
    permissions jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE client_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_primary character varying(15) NOT NULL UNIQUE,
    full_name character varying(100),
    email character varying(100) UNIQUE,
    password_hash character varying(255) NOT NULL,
    home_gps_address character varying(255),
    home_lat numeric(9,6),
    home_lon numeric(9,6),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    fcm_token text,
    fcm_token_updated_at timestamp with time zone
);

CREATE TABLE artisan_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_primary character varying(15) NOT NULL UNIQUE,
    full_name character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    profile_picture_url text,
    momo_network character varying(20) NOT NULL,
    is_momo_verified boolean DEFAULT false,
    paystack_resolved_name character varying(100),
    paystack_recipient_code character varying(50),
    gh_card_number character varying(20) UNIQUE,
    gh_card_image_url text,
    is_identity_verified boolean DEFAULT false,
    primary_trade character varying(50),
    primary_language character varying(20) DEFAULT 'ENGLISH',
    home_gps_address character varying(255),
    home_lat numeric(9,6),
    home_lon numeric(9,6),
    riviaco_policy_id character varying(50),
    tier_level integer DEFAULT 1,
    reputation_score numeric(3,2) DEFAULT 0.00,
    total_review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    fcm_token text,
    fcm_token_updated_at timestamp with time zone,
    riviaco_plan character varying(20),
    riviaco_enrollment_date timestamp with time zone,
    riviaco_standard_plan_contribution_pesewas bigint DEFAULT 0,
    riviaco_member_id character varying(50),
    riviaco_card_code character varying(50),
    riviaco_sync_status character varying(20) DEFAULT 'pending',
    dob date,
    gender character varying(10),
    email character varying(150),
    accept_terms boolean DEFAULT false,
    accept_privacy boolean DEFAULT false
);

CREATE TABLE financial_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_commission_percent numeric(3,2) NOT NULL,
    warranty_fee_percent numeric(3,2) NOT NULL,
    riviaco_premium_pesewas bigint NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE momo_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name character varying(50) NOT NULL,
    provider_code character varying(10) NOT NULL,
    country character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(provider_name, country)
);

CREATE TABLE transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_id character varying(100) NOT NULL UNIQUE,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE remittance_batch (
    batch_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_name character varying(50) NOT NULL,
    total_amount_pesewas bigint NOT NULL CHECK (total_amount_pesewas > 0),
    status character varying(20) DEFAULT 'PENDING',
    paystack_transfer_ref character varying(100),
    paystack_batch_code character varying(100),
    scheduled_date date NOT NULL,
    processed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Dependent Tables
CREATE TABLE admin_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES admin_users(id),
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    old_value jsonb,
    new_value jsonb,
    ip_address character varying(45),
    user_agent text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE artisan_guarantors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    artisan_id uuid REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    name character varying(100) NOT NULL,
    phone character varying(15) NOT NULL,
    relationship character varying(50),
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE rivia_cards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_on timestamp without time zone NOT NULL,
    card_code character varying(20) NOT NULL UNIQUE,
    brand character varying(50) NOT NULL,
    valid_till date,
    member_id uuid,
    price numeric(10,2),
    is_free boolean DEFAULT false,
    status character varying(20) DEFAULT 'pending' NOT NULL,
    assigned_to uuid REFERENCES artisan_profiles(id)
);

-- Core Job Tables (Handling Circular Dependency via ALTER later)
CREATE TABLE job_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES client_profiles(id),
    artisan_id uuid REFERENCES artisan_profiles(id),
    current_state job_state_enum DEFAULT 'DRAFT',
    gross_fee_pesewas bigint,
    warranty_fee_pesewas bigint NOT NULL,
    artisan_payout_pesewas bigint NOT NULL,
    riviaco_premium_pesewas bigint NOT NULL,
    platform_commission_pesewas bigint NOT NULL,
    location_gps_address character varying(20),
    location_lat numeric(9,6),
    location_lon numeric(9,6),
    paystack_reference_id character varying(100),
    photo_evidence_before_url text,
    photo_evidence_after_url text,
    is_client_signed_off boolean DEFAULT false,
    client_otp character varying(6),
    otp_generated_at timestamp with time zone,
    otp_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    job_description text,
    selected_quote_id uuid, -- FK added later
    quotes_deadline timestamp with time zone DEFAULT (now() + '48:00:00'::interval),
    max_quotes integer DEFAULT 10,
    quote_count integer DEFAULT 0
);

CREATE TABLE job_quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES job_transactions(id) ON DELETE CASCADE,
    artisan_id uuid NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    quoted_fee_pesewas integer NOT NULL,
    quote_message text,
    estimated_duration_hours integer,
    warranty_fee_pesewas integer NOT NULL,
    total_client_pays_pesewas integer NOT NULL,
    artisan_payout_pesewas integer NOT NULL,
    platform_commission_pesewas integer NOT NULL,
    riviaco_premium_pesewas integer NOT NULL,
    status character varying(50) DEFAULT 'PENDING',
    rejection_reason character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    allows_negotiation boolean DEFAULT true,
    negotiation_rounds integer DEFAULT 0,
    current_negotiation_id uuid, -- FK added later
    UNIQUE(job_id, artisan_id)
);

-- Now Add Circular FKs
ALTER TABLE job_transactions 
ADD CONSTRAINT job_transactions_selected_quote_id_fkey 
FOREIGN KEY (selected_quote_id) REFERENCES job_quotes(id);

CREATE TABLE quote_negotiations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id uuid NOT NULL REFERENCES job_quotes(id) ON DELETE CASCADE,
    round_number integer NOT NULL,
    offered_by character varying(20) NOT NULL,
    offered_amount_pesewas integer NOT NULL,
    message text,
    status character varying(20) DEFAULT 'PENDING',
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval),
    responded_at timestamp with time zone
);

ALTER TABLE job_quotes 
ADD CONSTRAINT job_quotes_current_negotiation_id_fkey 
FOREIGN KEY (current_negotiation_id) REFERENCES quote_negotiations(id);

CREATE TABLE job_artisan_acceptances (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES job_transactions(id) ON DELETE CASCADE,
    artisan_id uuid NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    accepted_at timestamp with time zone DEFAULT now(),
    is_selected boolean DEFAULT false,
    UNIQUE(job_id, artisan_id)
);

CREATE TABLE artisan_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_transaction_id uuid NOT NULL REFERENCES job_transactions(id) ON DELETE CASCADE,
    artisan_id uuid NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(job_transaction_id)
);

CREATE TABLE benefits_ledger (
    ledger_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    artisan_id uuid REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    job_id uuid REFERENCES job_transactions(id) ON DELETE SET NULL,
    premium_amount_pesewas bigint NOT NULL CHECK (premium_amount_pesewas > 0),
    remittance_batch_id uuid REFERENCES remittance_batch(batch_id) ON DELETE SET NULL,
    status character varying(20) DEFAULT 'PENDING',
    created_at timestamp with time zone DEFAULT now(),
    remitted_at timestamp with time zone
);

CREATE TABLE disputes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES job_transactions(id),
    raised_by_client_id uuid REFERENCES client_profiles(id),
    raised_by_artisan_id uuid REFERENCES artisan_profiles(id),
    category character varying(50) NOT NULL,
    description text NOT NULL,
    evidence_urls text[],
    status character varying(20) DEFAULT 'OPEN',
    resolution_notes text,
    proposed_refund_amount integer,
    artisan_counter_offer integer,
    current_turn character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE dispute_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dispute_id uuid REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    sender_role character varying(20),
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE withdrawal_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    user_role character varying(20) DEFAULT 'CLIENT',
    amount_pesewas bigint NOT NULL CHECK (amount_pesewas > 0),
    status character varying(20) DEFAULT 'PENDING',
    transaction_id uuid REFERENCES transactions(id),
    admin_notes text,
    processed_at timestamp without time zone,
    processed_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    paystack_recipient_code character varying(100),
    resolved_account_name character varying(255),
    momo_number character varying(20),
    bank_code character varying(10)
);

CREATE TABLE postings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id uuid REFERENCES transactions(id) ON DELETE RESTRICT,
    account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT,
    amount_pesewas bigint NOT NULL CHECK (amount_pesewas > 0),
    direction posting_direction_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    user_type character varying(20) NOT NULL,
    notification_type character varying(50) NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data jsonb,
    sent_at timestamp with time zone DEFAULT now(),
    delivered boolean DEFAULT false,
    read_at timestamp with time zone,
    fcm_message_id text
);

CREATE TABLE analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type character varying(50) NOT NULL,
    user_id uuid,
    user_type character varying(20),
    job_id uuid,
    quote_id uuid,
    event_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. FUNCTIONS & TRIGGERS
-- ====================================================================
CREATE OR REPLACE FUNCTION update_account_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    account_type account_type_enum;
BEGIN
    SELECT type INTO account_type FROM accounts WHERE id = NEW.account_id;
    
    UPDATE accounts
    SET balance_pesewas = balance_pesewas + (
        CASE 
            WHEN account_type IN ('ASSET', 'EXPENSE') AND NEW.direction = 'DEBIT' THEN NEW.amount_pesewas
            WHEN account_type IN ('ASSET', 'EXPENSE') AND NEW.direction = 'CREDIT' THEN -NEW.amount_pesewas
            WHEN account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') AND NEW.direction = 'CREDIT' THEN NEW.amount_pesewas
            WHEN account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') AND NEW.direction = 'DEBIT' THEN -NEW.amount_pesewas
            ELSE 0
        END
    )
    WHERE id = NEW.account_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_balance AFTER INSERT ON postings FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE OR REPLACE FUNCTION update_job_quotes_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER job_quotes_updated_at BEFORE UPDATE ON job_quotes FOR EACH ROW EXECUTE FUNCTION update_job_quotes_updated_at();