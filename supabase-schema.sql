-- 🗄️ SUPABASE SCHEMATICS & POLICIES - WORLD CUP 2026 PREDICTIONS
-- Run this script inside the SQL Editor of your Supabase Dashboard.

-- 1. CLEANUP (Optional)
-- DROP TABLE IF EXISTS predictions;
-- DROP TABLE IF EXISTS matches;
-- DROP TABLE IF EXISTS teams;
-- DROP TABLE IF EXISTS profiles;

-- 2. CREATE TABLE: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CREATE TABLE: TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE, -- FIFA 3-letter abbreviation, e.g. USA, MEX, ARG
    flag_url TEXT,
    group_name TEXT NOT NULL CHECK (group_name IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'))
);

-- 4. CREATE TABLE: MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
    away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
    group_name TEXT NOT NULL CHECK (group_name IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L')),
    round INTEGER NOT NULL CHECK (round IN (1, 2, 3)), -- Matchday 1, 2, 3
    stadium TEXT,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    result TEXT CHECK (result IN ('L', 'E', 'V', NULL)), -- L=Local, E=Empate, V=Visita
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'finished')),
    CONSTRAINT different_teams CHECK (home_team_id <> away_team_id)
);

-- 5. CREATE TABLE: PREDICTIONS
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    prediction TEXT NOT NULL CHECK (prediction IN ('L', 'E', 'V')),
    points INTEGER DEFAULT 0, -- 1 point if correct, 0 otherwise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, match_id)
);

-- 6. AUTO-PROVISION PROFILES TRIGGER
-- Triggers a profile creation immediately when a new user registers in Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. AUTO-CALCULATE RESULT ON SCORE INSERT
-- Triggers automatic result resolution when an administrator updates the score of a match.
CREATE OR REPLACE FUNCTION public.resolve_match_result()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
        NEW.status := 'finished';
        IF NEW.home_score > NEW.away_score THEN
            NEW.result := 'L';
        ELSIF NEW.home_score < NEW.away_score THEN
            NEW.result := 'V';
        ELSE
            NEW.result := 'E';
        END IF;
    ELSE
        NEW.result := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_match_score_update
    BEFORE INSERT OR UPDATE OF home_score, away_score ON public.matches
    FOR EACH ROW EXECUTE FUNCTION public.resolve_match_result();

-- 8. AUTO-CALCULATE PREDICTIONS POINTS TRIGGER
-- Recalculates and awards 1 point dynamically to all users who correctly guessed the resolved result.
CREATE OR REPLACE FUNCTION public.recalculate_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.result IS NOT NULL AND (OLD.result IS NULL OR OLD.result <> NEW.result) THEN
        -- Award 1 point for correct forecasts
        UPDATE public.predictions
        SET points = 1
        WHERE match_id = NEW.id AND prediction = NEW.result;

        -- Revoke points for incorrect forecasts
        UPDATE public.predictions
        SET points = 0
        WHERE match_id = NEW.id AND prediction <> NEW.result;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER after_match_resolved
    AFTER UPDATE OF result ON public.matches
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_prediction_points();

-- 9. BEFORE PREDICTION INSERT/UPDATE LOCK CHECK
-- Database level security: prevents submitting predictions after a match has started.
CREATE OR REPLACE FUNCTION public.check_match_started_before_prediction()
RETURNS TRIGGER AS $$
DECLARE
    v_match_date TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT match_date INTO v_match_date
    FROM public.matches
    WHERE id = NEW.match_id;

    IF v_match_date <= NOW() THEN
        RAISE EXCEPTION 'El partido ya ha comenzado. Predicciones cerradas.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_prediction_insert_update
    BEFORE INSERT OR UPDATE ON public.predictions
    FOR EACH ROW EXECUTE FUNCTION public.check_match_started_before_prediction();

-- 10. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- 11. SECURITY POLICIES (RLS)

-- Profiles Policies
CREATE POLICY "Enable read access for all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on email" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Teams Policies
CREATE POLICY "Enable read access for all teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Enable write access for admins only" ON public.teams FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Matches Policies
CREATE POLICY "Enable read access for all matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Enable write access for admins only" ON public.matches FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Predictions Policies
CREATE POLICY "Enable read access for all predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users on their own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users on their own predictions" ON public.predictions FOR DELETE USING (auth.uid() = user_id);
