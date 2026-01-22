-- ============================================
-- 한국의 애완동물 - Supabase 데이터베이스 설정
-- ============================================

-- 1. 뉴스레터 구독자 테이블 생성
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이메일 인덱스 추가 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- 코멘트 추가
COMMENT ON TABLE newsletter_subscribers IS '뉴스레터 구독자 정보를 저장하는 테이블';
COMMENT ON COLUMN newsletter_subscribers.email IS '구독자 이메일 주소 (중복 불가)';
COMMENT ON COLUMN newsletter_subscribers.subscribed_at IS '구독 신청 일시';

-- ============================================
-- 2. Row Level Security (RLS) 설정
-- ============================================

-- RLS 활성화
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Service role can view subscribers" ON newsletter_subscribers;

-- 누구나 구독 가능 정책 (INSERT)
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- 인증된 사용자는 조회 가능 (SELECT) - 관리자용
CREATE POLICY "Authenticated users can view subscribers"
ON newsletter_subscribers
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 3. 통계 뷰 생성 (선택사항)
-- ============================================

-- 구독자 통계를 한눈에 볼 수 있는 뷰
CREATE OR REPLACE VIEW newsletter_stats AS
SELECT 
  COUNT(*) as total_subscribers,
  COUNT(CASE WHEN subscribed_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
  COUNT(CASE WHEN subscribed_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month,
  MAX(subscribed_at) as last_subscription
FROM newsletter_subscribers;

COMMENT ON VIEW newsletter_stats IS '뉴스레터 구독자 통계';

-- ============================================
-- 4. 사용자 프로필 테이블 (선택사항)
-- ============================================

-- 사용자 추가 정보 저장용 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  pet_type TEXT, -- '강아지', '고양이', '햄스터', '토끼' 등
  pet_name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 이름 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 자신의 프로필 생성 가능
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. 트리거 설정 (선택사항)
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_profiles 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 테스트 데이터 (개발용 - 선택사항)
-- ============================================

-- 테스트 구독자 추가 (필요시 주석 해제)
-- INSERT INTO newsletter_subscribers (email) 
-- VALUES ('test@example.com')
-- ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 7. 권한 설정
-- ============================================

-- anon 사용자가 newsletter_subscribers에 INSERT 가능하도록 권한 부여
GRANT INSERT ON newsletter_subscribers TO anon;

-- authenticated 사용자가 newsletter_subscribers 조회 가능
GRANT SELECT ON newsletter_subscribers TO authenticated;

-- 모든 사용자가 통계 뷰 조회 가능
GRANT SELECT ON newsletter_stats TO anon;
GRANT SELECT ON newsletter_stats TO authenticated;

-- ============================================
-- 완료!
-- ============================================

-- 설정 확인 쿼리
SELECT 
  'newsletter_subscribers' as table_name, 
  COUNT(*) as row_count 
FROM newsletter_subscribers;

SELECT * FROM newsletter_stats;

-- ============================================
-- 사용 방법:
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor 메뉴 클릭
-- 3. 이 파일 내용 복사 & 붙여넣기
-- 4. Run 버튼 클릭
-- ============================================
