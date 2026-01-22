// Supabase 연결 테스트 스크립트
const https = require('https');

const SUPABASE_URL = 'https://fgdgsbmvxiqabedctxbw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZGdzYm12eGlxYWJlZGN0eGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNjc0OTcsImV4cCI6MjA4NDY0MzQ5N30.TqOT3Mc4Bw2FsShVVtQ8_FjPelB22_pXHAwSPZDXtME';

console.log('🔍 Supabase 연결 테스트 시작...\n');
console.log('📡 프로젝트 URL:', SUPABASE_URL);
console.log('🔑 Anon Key:', SUPABASE_ANON_KEY.substring(0, 50) + '...\n');

// Test 1: Supabase API 응답 확인
function testSupabaseAPI() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Supabase API 응답 테스트...');
        
        const options = {
            hostname: 'fgdgsbmvxiqabedctxbw.supabase.co',
            port: 443,
            path: '/rest/v1/',
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('   ✅ API 응답 성공!');
                    console.log('   📊 상태 코드:', res.statusCode);
                    resolve(true);
                } else if (res.statusCode === 404) {
                    console.log('   ⚠️ API 엔드포인트는 응답하지만 경로를 찾을 수 없습니다');
                    console.log('   📊 상태 코드:', res.statusCode);
                    resolve(true); // 서버 자체는 살아있음
                } else {
                    console.log('   ❌ API 응답 오류');
                    console.log('   📊 상태 코드:', res.statusCode);
                    console.log('   📄 응답:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('   ❌ 네트워크 오류:', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.log('   ❌ 타임아웃 (5초)');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Test 2: 테이블 조회 테스트
function testTableQuery() {
    return new Promise((resolve, reject) => {
        console.log('\n2️⃣ newsletter_subscribers 테이블 조회 테스트...');
        
        const options = {
            hostname: 'fgdgsbmvxiqabedctxbw.supabase.co',
            port: 443,
            path: '/rest/v1/newsletter_subscribers?select=count',
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('   📊 상태 코드:', res.statusCode);
                
                if (res.statusCode === 200) {
                    const contentRange = res.headers['content-range'];
                    if (contentRange) {
                        const count = contentRange.split('/')[1];
                        console.log('   ✅ 테이블 조회 성공!');
                        console.log('   📧 현재 구독자 수:', count + '명');
                        console.log('   📄 응답 데이터:', data.substring(0, 200));
                        resolve({ success: true, count: count });
                    } else {
                        console.log('   ✅ 테이블 조회 성공! (카운트 정보 없음)');
                        console.log('   📄 응답 데이터:', data);
                        resolve({ success: true, count: 'unknown' });
                    }
                } else if (res.statusCode === 404) {
                    console.log('   ⚠️ 404 오류: 테이블이 존재하지 않습니다');
                    console.log('   📄 응답:', data);
                    try {
                        const errorData = JSON.parse(data);
                        console.log('   💡 오류 메시지:', errorData.message || errorData.hint);
                        if (errorData.code === '42P01') {
                            console.log('   📝 해결 방법: Supabase 대시보드에서 SQL 스크립트를 실행해야 합니다.');
                        }
                    } catch (e) {
                        // JSON 파싱 실패
                    }
                    resolve({ success: false, reason: 'table_not_found' });
                } else if (res.statusCode === 401) {
                    console.log('   ❌ 401 인증 오류: API Key가 유효하지 않습니다');
                    console.log('   📄 응답:', data);
                    resolve({ success: false, reason: 'invalid_api_key' });
                } else if (res.statusCode === 403) {
                    console.log('   ❌ 403 권한 오류: 접근 권한이 없습니다');
                    console.log('   📄 응답:', data);
                    resolve({ success: false, reason: 'permission_denied' });
                } else {
                    console.log('   ❌ 알 수 없는 오류');
                    console.log('   📄 응답:', data);
                    resolve({ success: false, reason: 'unknown_error', response: data });
                }
            });
        });

        req.on('error', (error) => {
            console.log('   ❌ 네트워크 오류:', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.log('   ❌ 타임아웃 (5초)');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Test 3: 인증 상태 확인
function testAuth() {
    return new Promise((resolve, reject) => {
        console.log('\n3️⃣ Supabase Auth 서비스 테스트...');
        
        const options = {
            hostname: 'fgdgsbmvxiqabedctxbw.supabase.co',
            port: 443,
            path: '/auth/v1/health',
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('   📊 상태 코드:', res.statusCode);
                if (res.statusCode === 200) {
                    console.log('   ✅ Auth 서비스 정상 작동!');
                    resolve(true);
                } else {
                    console.log('   ⚠️ Auth 서비스 상태:', res.statusCode);
                    console.log('   📄 응답:', data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('   ❌ Auth 서비스 오류:', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.log('   ❌ 타임아웃 (5초)');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// 모든 테스트 실행
async function runAllTests() {
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Supabase 연결 진단 도구');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Test 1
        await testSupabaseAPI();
        
        // Test 2
        const tableResult = await testTableQuery();
        
        // Test 3
        await testAuth();

        // 결과 요약
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  📋 진단 결과 요약');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (tableResult.success) {
            console.log('🎉 모든 연결이 정상입니다!');
            console.log('\n✅ Supabase 프로젝트에 성공적으로 연결되었습니다.');
            console.log('✅ API Key가 정상적으로 작동합니다.');
            console.log('✅ newsletter_subscribers 테이블이 존재합니다.');
            console.log('📧 현재 구독자 수:', tableResult.count + '명');
            console.log('\n💡 이제 실제 웹사이트에서 뉴스레터 구독 기능을 사용할 수 있습니다!');
            console.log('   🌐 https://vibecoding-mauve-chi.vercel.app/');
        } else if (tableResult.reason === 'table_not_found') {
            console.log('⚠️ 연결은 성공했지만 테이블이 없습니다.');
            console.log('\n✅ Supabase 프로젝트에 성공적으로 연결되었습니다.');
            console.log('✅ API Key가 정상적으로 작동합니다.');
            console.log('❌ newsletter_subscribers 테이블이 아직 생성되지 않았습니다.');
            console.log('\n📝 해결 방법:');
            console.log('   1. Supabase 대시보드를 엽니다:');
            console.log('      https://supabase.com/dashboard/project/fgdgsbmvxiqabedctxbw');
            console.log('   2. 왼쪽 메뉴에서 "SQL Editor"를 클릭합니다.');
            console.log('   3. setup-database.sql 파일의 내용을 복사해서 실행합니다.');
            console.log('   4. 이 스크립트를 다시 실행해서 확인합니다.');
        } else if (tableResult.reason === 'invalid_api_key') {
            console.log('❌ API Key 오류');
            console.log('\n✅ Supabase 서버에는 연결됩니다.');
            console.log('❌ API Key가 유효하지 않거나 만료되었습니다.');
            console.log('\n📝 해결 방법:');
            console.log('   1. Supabase 대시보드를 엽니다.');
            console.log('   2. Settings → API에서 anon/public key를 다시 확인합니다.');
            console.log('   3. supabase-config.js 파일의 SUPABASE_ANON_KEY를 업데이트합니다.');
        } else {
            console.log('❌ 예상치 못한 오류');
            console.log('   이유:', tableResult.reason);
        }

    } catch (error) {
        console.log('\n❌ 치명적 오류 발생:');
        console.log('   ', error.message);
        console.log('\n📝 가능한 원인:');
        console.log('   1. 인터넷 연결이 불안정합니다.');
        console.log('   2. 방화벽이 Supabase 연결을 차단하고 있습니다.');
        console.log('   3. Supabase 서비스가 일시적으로 중단되었습니다.');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 테스트 실행
runAllTests();
