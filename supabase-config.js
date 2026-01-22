// Supabase 설정
const SUPABASE_URL = 'https://fgdgsbmvxiqabedctxbw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZGdzYm12eGlxYWJlZGN0eGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNjc0OTcsImV4cCI6MjA4NDY0MzQ5N30.TqOT3Mc4Bw2FsShVVtQ8_FjPelB22_pXHAwSPZDXtME';

// Supabase 클라이언트 초기화
let supabase;

// Supabase 클라이언트 로드
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase 클라이언트 초기화 완료');
        checkAuthState();
    } else {
        console.error('❌ Supabase 클라이언트 라이브러리를 로드할 수 없습니다');
    }
}

// 인증 상태 확인
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        console.log('✅ 로그인됨:', session.user.email);
        updateUIForLoggedInUser(session.user);
    } else {
        console.log('ℹ️ 로그인되지 않음');
        updateUIForLoggedOutUser();
    }
}

// 로그인된 사용자 UI 업데이트
function updateUIForLoggedInUser(user) {
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <span class="user-email">👋 ${user.email}</span>
            <button onclick="handleLogout()" class="btn btn-secondary">로그아웃</button>
        `;
    }
    
    // 사용자 정보 저장
    localStorage.setItem('user', JSON.stringify(user));
}

// 로그아웃된 사용자 UI 업데이트
function updateUIForLoggedOutUser() {
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <button onclick="showLoginModal()" class="btn btn-primary">로그인</button>
            <button onclick="showSignupModal()" class="btn btn-secondary">회원가입</button>
        `;
    }
    
    localStorage.removeItem('user');
}

// 회원가입
async function handleSignup(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        alert('✅ 회원가입 성공! 이메일을 확인해주세요.');
        return data;
    } catch (error) {
        alert('❌ 회원가입 실패: ' + error.message);
        console.error(error);
    }
}

// 로그인
async function handleLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        alert('✅ 로그인 성공!');
        updateUIForLoggedInUser(data.user);
        closeModal();
        return data;
    } catch (error) {
        alert('❌ 로그인 실패: ' + error.message);
        console.error(error);
    }
}

// 로그아웃
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        alert('✅ 로그아웃되었습니다');
        updateUIForLoggedOutUser();
    } catch (error) {
        alert('❌ 로그아웃 실패: ' + error.message);
        console.error(error);
    }
}

// 소셜 로그인 (Google)
async function handleGoogleLogin() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        
        if (error) throw error;
    } catch (error) {
        alert('❌ Google 로그인 실패: ' + error.message);
        console.error(error);
    }
}

// 비밀번호 재설정 요청
async function handlePasswordReset(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });
        
        if (error) throw error;
        
        alert('✅ 비밀번호 재설정 이메일이 발송되었습니다');
    } catch (error) {
        alert('❌ 비밀번호 재설정 실패: ' + error.message);
        console.error(error);
    }
}

// 뉴스레터 구독자를 Supabase에 저장
async function saveNewsletterSubscriber(email) {
    try {
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert([
                { email: email, subscribed_at: new Date().toISOString() }
            ]);
        
        if (error) throw error;
        
        console.log('✅ 뉴스레터 구독자 저장 완료');
        return data;
    } catch (error) {
        console.error('❌ 뉴스레터 구독 저장 실패:', error);
        // 테이블이 없으면 로컬 스토리지에 저장
        const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
        subscribers.push({ email, subscribed_at: new Date().toISOString() });
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
    }
}

// 인증 상태 변경 리스너
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // Supabase 라이브러리가 로드되면 초기화
        if (typeof window.supabase !== 'undefined') {
            initSupabase();
        }
    });
}
