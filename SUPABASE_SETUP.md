# 🔐 Supabase 사용자 관리 시스템 설정 가이드

## 📋 개요
이 프로젝트는 Supabase를 사용하여 사용자 인증 및 뉴스레터 구독자 관리를 구현합니다.

**프로젝트 ID**: `fgdgsbmvxiqabedctxbw`  
**프로젝트 URL**: `https://fgdgsbmvxiqabedctxbw.supabase.co`

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

### 뉴스레터 구독자 테이블 생성

1. Supabase 대시보드에서 **🗄️ Table Editor** 클릭
2. **New table** 버튼 클릭
3. 다음 정보로 테이블 생성:

**테이블 이름**: `newsletter_subscribers`

**컬럼 설정**:
```sql
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이메일 인덱스 추가 (검색 최적화)
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
```

또는 **SQL Editor**에서 직접 실행:
1. 좌측 메뉴에서 **🔧 SQL Editor** 클릭
2. 위 SQL 코드 붙여넣기
3. **Run** 버튼 클릭

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

## 📱 사용 가능한 기능

- ✅ 이메일/비밀번호 회원가입
- ✅ 이메일/비밀번호 로그인
- ✅ Google OAuth 로그인
- ✅ 비밀번호 재설정
- ✅ 이메일 인증
- ✅ 뉴스레터 구독 관리
- ✅ 사용자 세션 관리
- ✅ 자동 로그인 상태 유지

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
