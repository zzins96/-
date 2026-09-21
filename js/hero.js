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