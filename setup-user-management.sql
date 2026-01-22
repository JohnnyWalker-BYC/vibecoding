-- ============================================
-- 회원 관리 시스템 데이터베이스 설정
-- ============================================

-- 1. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  
  -- 주소 정보
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'KR',
  
  -- 계정 상태
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  
  -- 마케팅 동의
  marketing_consent BOOLEAN DEFAULT false,
  
  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- 통계
  login_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0
);

-- 사용자 프로필 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- 2. 사용자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'profile_update', 'password_change', etc.
  activity_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 활동 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- 3. 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 세션 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON user_sessions(is_active);

-- 4. 뉴스레터 구독자 테이블 (이미 있다면 스킵)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 회원이면 연결
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 뉴스레터 인덱스
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_user_id ON newsletter_subscribers(user_id);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- user_profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필을 볼 수 있음
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 사용자는 자신의 프로필을 수정할 수 있음
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 관리자는 모든 프로필을 볼 수 있음
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 관리자는 모든 프로필을 수정할 수 있음
CREATE POLICY "Admins can update all profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- user_activity_logs RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 활동 로그를 볼 수 있음
CREATE POLICY "Users can view own activity logs"
ON user_activity_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 모든 인증된 사용자는 활동 로그를 생성할 수 있음
CREATE POLICY "Authenticated users can insert activity logs"
ON user_activity_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 관리자는 모든 활동 로그를 볼 수 있음
CREATE POLICY "Admins can view all activity logs"
ON user_activity_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- user_sessions RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 세션을 볼 수 있음
CREATE POLICY "Users can view own sessions"
ON user_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 관리자는 모든 세션을 볼 수 있음
CREATE POLICY "Admins can view all sessions"
ON user_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- newsletter_subscribers RLS 업데이트
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 구독 가능
CREATE POLICY "Anyone can subscribe to newsletter" 
ON newsletter_subscribers FOR INSERT 
TO public 
WITH CHECK (true);

-- 인증된 사용자는 조회 가능
CREATE POLICY "Authenticated users can view subscribers"
ON newsletter_subscribers FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 트리거: 자동 프로필 생성
-- ============================================

-- 새 사용자 가입 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (이미 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 뷰: 사용자 통계
-- ============================================

CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
  COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_this_week,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_this_month,
  COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_today,
  COUNT(CASE WHEN marketing_consent = true THEN 1 END) as marketing_consent_count
FROM user_profiles;

-- 뷰: 최근 활동
CREATE OR REPLACE VIEW recent_user_activity AS
SELECT 
  ual.id,
  ual.user_id,
  up.email,
  up.username,
  ual.activity_type,
  ual.activity_description,
  ual.created_at
FROM user_activity_logs ual
LEFT JOIN user_profiles up ON ual.user_id = up.id
ORDER BY ual.created_at DESC
LIMIT 100;

-- ============================================
-- 권한 설정
-- ============================================

-- anon 사용자 권한
GRANT INSERT ON newsletter_subscribers TO anon;

-- authenticated 사용자 권한
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT ON user_activity_logs TO authenticated;
GRANT SELECT ON user_sessions TO authenticated;
GRANT SELECT ON newsletter_subscribers TO authenticated;
GRANT SELECT ON user_statistics TO authenticated;
GRANT SELECT ON recent_user_activity TO authenticated;

-- ============================================
-- 초기 데이터 (선택사항)
-- ============================================

-- 테스트용 활동 타입 (참고용)
-- 실제 사용 시 애플리케이션에서 직접 입력
COMMENT ON COLUMN user_activity_logs.activity_type IS 
'활동 타입: login, logout, signup, profile_update, password_change, email_change, newsletter_subscribe, post_create, comment_create, like, share, bookmark';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 회원 관리 시스템 데이터베이스 설정이 완료되었습니다!';
  RAISE NOTICE '📊 생성된 테이블: user_profiles, user_activity_logs, user_sessions, newsletter_subscribers';
  RAISE NOTICE '👁️ 생성된 뷰: user_statistics, recent_user_activity';
  RAISE NOTICE '🔒 RLS 정책이 설정되었습니다.';
  RAISE NOTICE '⚙️ 자동 트리거가 설정되었습니다.';
END $$;
