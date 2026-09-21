/* =========================================================================
   hero.js
   -------------------------------------------------------------------------
   1) 히어로 진입 애니메이션 켜기
   2) 숫자 카운트업 (화면에 보일 때 1회 실행)
 
   [숫자 수정 방법]  index.html 에서만 고치면 됩니다.
     <p class="count__num gold"
        data-count="152782"        ← 목표 숫자
        data-count-suffix="+"      ← 숫자 뒤에 붙일 문자 (예: "+", "년+", "만+")
        data-count-comma="true">   ← 천 단위 콤마 사용 여부
        152,782+                   ← JS 미실행 시 그대로 보이는 값
     </p>
========================================================================= */
(function () {
    'use strict';

    var REDUCED = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------------
       1. 진입 애니메이션
    ------------------------------------------------------------------ */
    document.body.classList.add('is-animated');

    /* ------------------------------------------------------------------
       2. 카운트업
    ------------------------------------------------------------------ */
    var DURATION = 1600;   // 카운트업 시간(ms) — 여기만 바꾸면 됩니다

    var nodes = document.querySelectorAll('[data-count]');
    if (!nodes.length) return;

    function format(value, useComma) {
        var v = Math.round(value);
        return useComma ? v.toLocaleString('ko-KR') : String(v);
    }

    // easeOutExpo : 빠르게 올라갔다가 부드럽게 멈춤
    function ease(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function run(el) {
        if (el.dataset.counted === 'true') return;
        el.dataset.counted = 'true';

        var target = parseFloat(el.dataset.count) || 0;
        var suffix = el.dataset.countSuffix || '';
        var comma = el.dataset.countComma === 'true';

        // 모션 최소화 설정이면 최종값만 바로 표시
        if (REDUCED) {
            el.textContent = format(target, comma) + suffix;
            return;
        }

        var start = null;

        function step(now) {
            if (start === null) start = now;
            var progress = Math.min((now - start) / DURATION, 1);
            el.textContent = format(target * ease(progress), comma) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }

        el.textContent = format(0, comma) + suffix;
        requestAnimationFrame(step);
    }

    // IntersectionObserver 미지원 브라우저는 즉시 실행
    if (!('IntersectionObserver' in window)) {
        Array.prototype.forEach.call(nodes, run);
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            run(entry.target);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.4 });

    Array.prototype.forEach.call(nodes, function (el) {
        observer.observe(el);
    });
})();


/* =========================================================================
   section1.js  —  탭 메뉴
   -------------------------------------------------------------------------
   [동작]
     · .section1__tab  버튼을 누르면 aria-controls 가 가리키는 패널만 표시
     · ← → Home End 키보드 조작 지원
     · JS 가 없어도 첫 번째 패널은 그대로 노출됩니다
 
   [탭 추가/삭제 방법]  index.html 에서 아래 한 쌍만 늘리거나 지우면 됩니다.
     <button class="section1__tab" role="tab"
             aria-selected="false" aria-controls="s1-panel-5" id="s1-tab-5"> … </button>
     <div class="section1__panel" role="tabpanel"
          id="s1-panel-5" aria-labelledby="s1-tab-5" hidden> … </div>
========================================================================= */
(function () {
    'use strict';

    var tablist = document.querySelector('[data-tabs]');
    if (!tablist) return;

    var tabs = Array.prototype.slice.call(
        tablist.querySelectorAll('[role="tab"]')
    );
    if (!tabs.length) return;

    function panelOf(tab) {
        return document.getElementById(tab.getAttribute('aria-controls'));
    }

    function select(tab, focus) {
        tabs.forEach(function (t) {
            var isTarget = t === tab;
            var panel = panelOf(t);

            t.setAttribute('aria-selected', isTarget ? 'true' : 'false');
            t.setAttribute('tabindex', isTarget ? '0' : '-1');
            if (panel) panel.hidden = !isTarget;
        });

        if (focus) tab.focus();
    }

    // 클릭
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () { select(tab, false); });
    });

    // 키보드
    tablist.addEventListener('keydown', function (e) {
        var index = tabs.indexOf(document.activeElement);
        if (index === -1) return;

        var next = null;
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                next = tabs[(index - 1 + tabs.length) % tabs.length];
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                next = tabs[(index + 1) % tabs.length];
                break;
            case 'Home':
                next = tabs[0];
                break;
            case 'End':
                next = tabs[tabs.length - 1];
                break;
            default:
                return;
        }
        e.preventDefault();
        select(next, true);
    });

    // 초기 상태 정리 (aria-selected="true" 가 붙은 탭 기준)
    var initial = tabs.filter(function (t) {
        return t.getAttribute('aria-selected') === 'true';
    })[0] || tabs[0];
    select(initial, false);
})();

/* =========================================================================
   section2.js  —  스크롤 등장 애니메이션 (선택 사항)
   · 이 파일을 빼도 section2 는 정상적으로 보입니다.
   · 화면에 들어오는 요소에 .is-in 을 붙여 아래에서 위로 나타나게 합니다.
========================================================================= */
(function () {
    'use strict';

    var section = document.querySelector('.section2');
    if (!section || !('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var targets = section.querySelectorAll(
        '.section2__qbox, .section2__sub, .section2__highlight, .section2__desc, .section2__compare'
    );

    section.classList.add('is-ready');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(targets, function (el) { observer.observe(el); });
})();

/* =========================================================================
   section3.js  —  화면에 들어오면 원 화살표 1회 회전 (선택 사항)
   · 이 파일을 빼도 section3 는 정상적으로 보입니다.
========================================================================= */
(function () {
    'use strict';

    var section = document.querySelector('.section3');
    if (!section) return;

    if (!('IntersectionObserver' in window)) {
        section.classList.add('is-in');
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            section.classList.add('is-in');
            observer.disconnect();
        });
    }, { threshold: 0.35 });

    observer.observe(section);
})();

/* =========================================================================
   section4.js  —  화면에 들어오면 카드 · 과정 목록 등장 애니메이션 (선택 사항)
   · 이 파일을 빼도 section4 는 정상적으로 보입니다.
========================================================================= */
(function () {
    'use strict';

    var section = document.querySelector('.section4');
    if (!section || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            section.classList.add('is-in');
            observer.disconnect();
        });
    }, { threshold: 0.15 });

    observer.observe(section);
})();

/* =========================================================================
   section5.js  —  과정 블록이 화면에 들어올 때 하나씩 등장 (선택 사항)
   · 이 파일을 빼도 section5 는 정상적으로 보입니다.
========================================================================= */
(function () {
    'use strict';

    var section = document.querySelector('.section5');
    if (!section || !('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var courses = section.querySelectorAll('.section5__course');
    section.classList.add('is-ready');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    Array.prototype.forEach.call(courses, function (el) {
        // section4 링크로 바로 이동해 온 경우 대비 : 이미 화면 위쪽에 있으면 즉시 표시
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
        else observer.observe(el);
    });
})();

/* =========================================================================
   section6.js  —  화면에 들어오면 단계가 순서대로 등장 (선택 사항)
   · 01 → 06 순서로 나타나고, 마지막에 06 동그라미가 튀어나오며 빨간 별이 그려집니다.
   · 이 파일을 빼도 section6 는 정상적으로 보입니다.
========================================================================= */
(function () {
    'use strict';

    var section = document.querySelector('.section6');
    if (!section || !('IntersectionObserver' in window)) return;

    var list = section.querySelector('.section6__steps');
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            section.classList.add('is-in');
            observer.disconnect();
        });
    }, { threshold: 0.3 });

    observer.observe(list || section);
})();


/* =========================================================================
   section7.js  —  후기 카드 마퀴(무한 흐름)
   -------------------------------------------------------------------------
   · 후기 목록(.section7__list)을 한 번 복제해 뒤에 붙이고,
     트랙을 -50% 까지 이동시키는 CSS 애니메이션을 켭니다 → 끊김 없이 반복.
   · 속도는 CSS 의 --marquee-speed (1초에 이동하는 px) 로 조절합니다.
     카드 수가 바뀌어도 속도는 그대로 유지됩니다.
   · 마우스를 올리거나 키보드로 카드에 들어오면 멈춥니다.
   · '동작 줄이기' 설정 사용자 / JS 미실행 시 : 좌우로 넘겨보는 목록으로 동작.
========================================================================= */
(function () {
    'use strict';

    var section = document.querySelector('.section7');
    if (!section) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var track = section.querySelector('.section7__track');
    var list = section.querySelector('.section7__list');
    if (!track || !list) return;

    // 1) 목록 복제 (스크린리더에는 한 번만 읽히도록 숨김)
    var clone = list.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(clone.querySelectorAll('img'), function (img) { img.alt = ''; });
    Array.prototype.forEach.call(clone.querySelectorAll('a, button'), function (el) { el.tabIndex = -1; });
    track.appendChild(clone);

    // 2) 목록 길이 ÷ 속도 = 한 바퀴 시간
    function updateDuration() {
        var speed = parseFloat(getComputedStyle(section).getPropertyValue('--marquee-speed')) || 60;
        var distance = list.getBoundingClientRect().width;   // 복제본 하나 길이(= 이동 거리)
        track.style.setProperty('--marquee-duration', (distance / speed).toFixed(2) + 's');
    }

    updateDuration();
    section.classList.add('is-marquee');

    // 화면 크기가 바뀌면(카드 크기 변화) 시간 다시 계산
    var timer;
    window.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(updateDuration, 150);
    });

    // 폰트가 늦게 로드되면 폭이 달라질 수 있어 한 번 더 계산
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateDuration);

    // 화면 밖에 있을 때는 애니메이션 멈춤 (배터리 · 성능)
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            track.style.animationPlayState = entries[0].isIntersecting ? '' : 'paused';
        }).observe(section);
    }
})();