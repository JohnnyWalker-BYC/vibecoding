# 🔐 Supabase 회원 관리 시스템 설정 가이드

## 📋 개요
이 프로젝트는 Supabase를 사용하여 완전한 회원 관리 시스템을 구현합니다.

**프로젝트 ID**: `fgdgsbmvxiqabedctxbw`  
**프로젝트 URL**: `https://fgdgsbmvxiqabedctxbw.supabase.co`

### 🎯 주요 기능
- ✅ 사용자 인증 (이메일/비밀번호, Google OAuth)
- ✅ 회원 프로필 관리
- ✅ 뉴스레터 구독 관리
- ✅ 활동 로그 추적
- ✅ 세션 관리
- ✅ 관리자 대시보드

---

## ⚙️ 1단계: Supabase API 키 설정

### 1. Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 `fgdgsbmvxiqabedctxbw` 선택

### 2. API 키 확인
1. 좌측 메뉴에서 **⚙️ Settings** 클릭
2. **API** 메뉴 선택
3. **Project API keys** 섹션에서 다음 키 확인:
   - **anon** (public) key 복사

### 3. API 키 적용
`supabase-config.js` 파일을 열고 다음 라인을 수정:

```javascript
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

복사한 anon key로 교체:

```javascript
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## 🗄️ 2단계: 데이터베이스 테이블 생성

### 🚀 빠른 설정 (권장)

**SQL Editor에서 전체 스크립트 한 번에 실행:**

1. Supabase 대시보드에서 **🔧 SQL Editor** 클릭
2. 프로젝트 폴더의 `setup-user-management.sql` 파일 열기
3. 전체 내용을 복사하여 SQL Editor에 붙여넣기
4. **Run** 버튼 클릭
5. "Success" 메시지 확인 ✅

이렇게 하면 다음이 모두 자동으로 생성됩니다:
- ✅ user_profiles (회원 프로필)
- ✅ user_activity_logs (활동 로그)
- ✅ user_sessions (세션 관리)
- ✅ newsletter_subscribers (뉴스레터 구독자)
- ✅ RLS 정책
- ✅ 자동 트리거
- ✅ 통계 뷰

### 📝 또는 개별 테이블 생성

각 테이블을 하나씩 생성하려면 다음 순서대로 진행하세요:

#### 1) 뉴스레터 구독자 테이블
```sql
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
```

#### 2) 회원 프로필 테이블
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0
);
```

#### 3) 활동 로그 테이블
```sql
CREATE TABLE user_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4) 세션 테이블
```sql
CREATE TABLE user_sessions (
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
```

---

## 🔒 3단계: Authentication 설정

### 1. Email/Password 인증 활성화
1. **🔐 Authentication** 메뉴 클릭
2. **Providers** 탭 선택
3. **Email** 제공자 활성화
4. 이메일 확인 필요 여부 설정 (권장: 활성화)

### 2. Google OAuth 설정 (선택사항)
1. **Providers** 탭에서 **Google** 클릭
2. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
3. Client ID와 Client Secret 입력
4. Authorized redirect URIs에 추가:
   ```
   https://fgdgsbmvxiqabedctxbw.supabase.co/auth/v1/callback
   ```

---

## 🔑 4단계: Row Level Security (RLS) 설정

### newsletter_subscribers 테이블 보안 정책

```sql
-- RLS 활성화
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 구독 가능 (INSERT)
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- 관리자만 조회 가능 (SELECT)
CREATE POLICY "Only admins can view subscribers"
ON newsletter_subscribers
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 📧 5단계: 이메일 템플릿 설정

### 이메일 확인 템플릿 커스터마이징

1. **🔐 Authentication** → **Email Templates** 클릭
2. **Confirm signup** 선택
3. 템플릿 수정:

```html
<h2>이메일 주소를 확인해주세요</h2>
<p>한국의 애완동물에 가입해주셔서 감사합니다! 🐾</p>
<p>아래 버튼을 클릭하여 이메일 주소를 확인해주세요:</p>
<a href="{{ .ConfirmationURL }}">이메일 확인하기</a>
```

---

## ✅ 6단계: 테스트

### 로컬 테스트
1. 브라우저에서 사이트 열기
2. **회원가입** 버튼 클릭
3. 이메일과 비밀번호 입력
4. 이메일 확인 메일 수신 확인
5. 확인 링크 클릭
6. **로그인** 테스트

### 뉴스레터 구독 테스트
1. 홈페이지 하단 뉴스레터 섹션
2. 이메일 입력 후 구독
3. Supabase 대시보드에서 `newsletter_subscribers` 테이블 확인

---

## 🎨 추가 기능

### 사용자 프로필 테이블 (선택사항)

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  pet_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

---

## 🚨 주의사항

1. **절대 Service Role Key를 클라이언트 코드에 노출하지 마세요!**
2. **anon key만 `supabase-config.js`에 사용하세요**
3. **RLS 정책을 반드시 설정하여 데이터 보안을 확보하세요**
4. **프로덕션 환경에서는 환경변수로 API 키 관리를 권장합니다**

---

## 👑 관리자 설정

### 첫 관리자 계정 설정

1. 회원가입 후 Supabase 대시보드에서 **Table Editor** 클릭
2. `user_profiles` 테이블 선택
3. 본인 계정 찾기 (이메일로 검색)
4. `is_admin` 컬럼을 `true`로 변경
5. Save 클릭 ✅

### 관리자 페이지 접속

**URL**: `https://vibecoding-mauve-chi.vercel.app/admin.html`

관리자로 로그인하면 다음 기능을 사용할 수 있습니다:
- 📊 대시보드 (통계, 최근 활동)
- 👥 회원 관리 (목록, 검색, 상세 정보)
- 📧 뉴스레터 구독자 관리
- 📝 활동 로그 조회
- ⚙️ 시스템 설정

## 📱 사용 가능한 기능

### 사용자 기능
- ✅ 이메일/비밀번호 회원가입
- ✅ 이메일/비밀번호 로그인
- ✅ Google OAuth 로그인
- ✅ 비밀번호 재설정
- ✅ 이메일 인증
- ✅ 뉴스레터 구독
- ✅ 사용자 세션 관리
- ✅ 자동 로그인 상태 유지

### 관리자 기능
- ✅ 전체 회원 목록 조회
- ✅ 회원 검색 (이메일, 이름)
- ✅ 회원 상태 관리 (활성/비활성)
- ✅ 뉴스레터 구독자 관리
- ✅ 활동 로그 조회 및 필터링
- ✅ 통계 대시보드
- ✅ CSV 데이터 다운로드
- ✅ 데이터베이스 상태 확인

---

## 🔗 유용한 링크

- [Supabase 대시보드](https://supabase.com/dashboard)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

---

## 💬 문의

설정 중 문제가 발생하면 Supabase 대시보드의 Support 메뉴를 이용하거나,  
[Supabase Discord](https://discord.supabase.com/)에서 도움을 받을 수 있습니다.

---

**Made with ❤️ for Korean Pets** 🐾
