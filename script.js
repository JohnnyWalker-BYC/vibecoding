// 네비게이션 스크롤 효과
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // 현재 섹션에 따라 네비게이션 활성화
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// 햄버거 메뉴 토글
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// 네비게이션 링크 클릭 시 메뉴 닫기
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// 숫자 카운트 애니메이션
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// 히어로 통계 카운터 실행
const statNumbers = document.querySelectorAll('.stat-number');
let countersAnimated = false;

function checkCounters() {
    const heroSection = document.querySelector('.hero');
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    
    if (window.scrollY < heroBottom && !countersAnimated) {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            animateCounter(stat, target);
        });
        countersAnimated = true;
    }
}

// 초기 로드 시 카운터 실행
setTimeout(checkCounters, 500);

// 스크롤 애니메이션
const scrollElements = document.querySelectorAll('.pet-card, .step-card, .care-card, .gallery-item');

const elementInView = (el, offset = 100) => {
    const elementTop = el.getBoundingClientRect().top;
    return elementTop <= (window.innerHeight || document.documentElement.clientHeight) - offset;
};

const displayScrollElement = (element) => {
    element.classList.add('scroll-animation');
};

const hideScrollElement = (element) => {
    element.classList.remove('scroll-animation');
};

const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
        if (elementInView(el, 100)) {
            displayScrollElement(el);
            setTimeout(() => {
                el.classList.add('active');
            }, 100);
        }
    });
};

// 초기 로드 시 애니메이션 체크
window.addEventListener('load', () => {
    handleScrollAnimation();
});

window.addEventListener('scroll', () => {
    handleScrollAnimation();
});

// 부드러운 스크롤
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// 연락처 폼 제출 처리
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 폼 데이터 가져오기
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const petType = formData.get('pet-type');
    const message = formData.get('message');

    // 여기서 실제로는 서버로 데이터를 전송해야 합니다
    // 현재는 콘솔에 출력하고 알림을 표시합니다
    console.log('문의 내용:', { name, email, petType, message });

    // 성공 메시지 표시
    const petTypeText = {
        'dog': '강아지',
        'cat': '고양이',
        'hamster': '햄스터',
        'rabbit': '토끼',
        'other': '기타'
    };

    const selectedPet = petTypeText[petType] || '반려동물';
    
    alert(`🐾 ${name}님, 문의가 성공적으로 접수되었습니다!\n\n${selectedPet}에 대한 정보를 ${email}로 보내드리겠습니다.\n\n행복한 반려동물과의 만남을 기대해주세요! ❤️`);

    // 폼 초기화
    contactForm.reset();
});

// 반려동물 카드 호버 효과 강화
const petCards = document.querySelectorAll('.pet-card');
petCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-20px) scale(1.03)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// 단계 카드 순차적 애니메이션
const stepCards = document.querySelectorAll('.step-card');
stepCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

// 돌보기 카드 호버 효과
const careCards = document.querySelectorAll('.care-card');
careCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        const icon = this.querySelector('.care-icon');
        icon.style.transform = 'scale(1.3) rotate(10deg)';
        icon.style.transition = 'transform 0.3s ease';
    });
    
    card.addEventListener('mouseleave', function() {
        const icon = this.querySelector('.care-icon');
        icon.style.transform = 'scale(1) rotate(0deg)';
    });
});

// 갤러리 아이템 클릭 효과
const galleryItems = document.querySelectorAll('.gallery-item');
galleryItems.forEach(item => {
    item.addEventListener('click', function() {
        const icon = this.querySelector('.placeholder-icon');
        const text = this.querySelector('.gallery-placeholder p').textContent;
        
        // 간단한 애니메이션 효과
        icon.style.transform = 'scale(1.3)';
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
        }, 300);
        
        console.log(`갤러리 항목 클릭됨: ${text}`);
    });
});

// 폼 입력 유효성 검사 강화
const formInputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
formInputs.forEach(input => {
    input.addEventListener('blur', function() {
        if (this.value.trim() === '' && this.hasAttribute('required')) {
            this.style.borderColor = '#f56565';
        } else if (this.value.trim() !== '') {
            this.style.borderColor = '#10B981';
        }
    });

    input.addEventListener('focus', function() {
        this.style.borderColor = 'var(--primary-color)';
    });
});

// 이메일 유효성 검사
const emailInput = document.getElementById('email');
emailInput.addEventListener('blur', function() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.value && !emailPattern.test(this.value)) {
        this.style.borderColor = '#f56565';
    } else if (this.value) {
        this.style.borderColor = '#10B981';
    }
});

// 로고 클릭 시 맨 위로 스크롤
const logo = document.querySelector('.logo');
logo.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// 성능 최적화: 스크롤 이벤트 쓰로틀링
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 쓰로틀링 적용
window.addEventListener('scroll', throttle(() => {
    handleScrollAnimation();
    checkCounters();
}, 100));

// 페이지 로드 애니메이션
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // 히어로 섹션 요소들 순차적으로 나타내기
    const heroElements = [
        document.querySelector('.hero-title'),
        document.querySelector('.hero-subtitle'),
        document.querySelector('.hero-buttons'),
        document.querySelector('.hero-stats')
    ];

    heroElements.forEach((el, index) => {
        if (el) {
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 50);
            }, index * 200);
        }
    });
});

// 페이지 최상단 확인 및 네비게이션 상태 업데이트
function updateNavOnTop() {
    if (window.scrollY === 0) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#home') {
                link.classList.add('active');
            }
        });
    }
}

window.addEventListener('scroll', throttle(updateNavOnTop, 100));

// 반려동물 관련 재미있는 인터랙션
const petEmojis = ['🐶', '🐱', '🐹', '🐰', '❤️', '🐾'];
let emojiInterval;

// 특정 요소에 마우스를 올렸을 때 귀여운 이모지 효과
function createEmojiEffect(x, y) {
    const emoji = document.createElement('div');
    emoji.textContent = petEmojis[Math.floor(Math.random() * petEmojis.length)];
    emoji.style.position = 'fixed';
    emoji.style.left = x + 'px';
    emoji.style.top = y + 'px';
    emoji.style.fontSize = '2rem';
    emoji.style.pointerEvents = 'none';
    emoji.style.zIndex = '9999';
    emoji.style.transition = 'all 1s ease-out';
    document.body.appendChild(emoji);
    
    setTimeout(() => {
        emoji.style.transform = 'translateY(-100px)';
        emoji.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
        document.body.removeChild(emoji);
    }, 1100);
}

// 반려동물 카드 클릭 시 이모지 효과
petCards.forEach(card => {
    card.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // 여러 개의 이모지를 다양한 위치에서 생성
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 100;
                createEmojiEffect(x + offsetX, y + offsetY);
            }, i * 100);
        }
    });
});

// 초기화
updateNavOnTop();

// 콘솔에 귀여운 메시지 출력
console.log('%c🐾 한국의 애완동물에 오신 것을 환영합니다! 🐾', 'color: #FF6B9D; font-size: 20px; font-weight: bold;');
console.log('%c사랑스러운 반려동물과 함께 행복한 삶을 시작하세요! ❤️', 'color: #C44569; font-size: 14px;');
