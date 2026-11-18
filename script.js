document.documentElement.classList.add('js-ready');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 页头：滚动状态与进度 ---------- */
const header = document.querySelector('[data-header]');
const progress = document.querySelector('[data-progress]');

function updateHeader() {
  const scrolled = window.scrollY > 8;
  header.classList.toggle('scrolled', scrolled);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateActiveNav();
      ticking = false;
    });
  }
}, { passive: true });
updateHeader();

/* ---------- 移动端导航 ---------- */
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');

function closeMenu() {
  if (!menuToggle || !mobileNav) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '打开导航菜单');
  mobileNav.hidden = true;
  header.classList.remove('menu-active');
  document.body.classList.remove('menu-open');
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', '关闭导航菜单');
      mobileNav.hidden = false;
      header.classList.add('menu-active');
      document.body.classList.add('menu-open');
    }
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });
}

/* ---------- 导航高亮 ---------- */
const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
const navSections = navLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateActiveNav() {
  if (!navSections.length) return;
  const marker = window.scrollY + 160;
  let current = null;
  navSections.forEach(section => {
    const top = section.offsetTop;
    if (top <= marker && marker < top + section.offsetHeight) current = section.id;
  });
  navLinks.forEach(link => {
    const active = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
updateActiveNav();

/* ---------- 入屏动效 ---------- */
const revealItems = [...document.querySelectorAll('.reveal')];
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach(item => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

  revealItems.forEach(item => {
    const siblings = [...(item.parentElement?.children || [])].filter(child => child.classList?.contains('reveal'));
    const index = siblings.indexOf(item);
    if (index > 0) item.style.transitionDelay = `${Math.min(index, 5) * 60}ms`;
    revealObserver.observe(item);
  });
}

/* ---------- 数字递增 ---------- */
const counters = [...document.querySelectorAll('[data-count]')];
function animateCounter(el) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  if (reduceMotion) {
    el.textContent = String(target);
    return;
  }
  const duration = 1200;
  const start = performance.now();
  function frame(now) {
    const progressValue = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progressValue, 3);
    el.textContent = String(Math.round(target * eased));
    if (progressValue < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(counter => counterObserver.observe(counter));
} else {
  counters.forEach(counter => { counter.textContent = counter.dataset.count; });
}

/* ---------- 服务手风琴：一次只展开一项 ---------- */
const serviceCards = [...document.querySelectorAll('.service-grid details')];
serviceCards.forEach(card => {
  card.addEventListener('toggle', () => {
    if (!card.open) return;
    serviceCards.forEach(other => {
      if (other !== card) other.open = false;
    });
  });
});

/* ---------- 咨询需求单 ---------- */
const form = document.getElementById('consultation-form');
const successPanel = document.getElementById('form-success');
const briefOutput = document.getElementById('brief-output');
const copyButton = document.getElementById('copy-brief');
const editButton = document.getElementById('edit-brief');
const copyStatus = document.getElementById('copy-status');
const challengeInput = document.getElementById('challenge');
const charCount = document.querySelector('[data-char-count]');

if (challengeInput && charCount) {
  const renderCount = () => {
    charCount.textContent = `${challengeInput.value.length} / 800`;
  };
  challengeInput.addEventListener('input', renderCount);
  renderCount();
}

function setError(name, message) {
  const field = form?.querySelector(`[name="${name}"]`);
  const target = form?.querySelector(`[data-error-for="${name}"]`);
  if (target) target.textContent = message;
  if (field && 'setAttribute' in field) {
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }
}

function clearErrorOnInput(event) {
  const field = event.target;
  if (!field.name) return;
  setError(field.name, '');
}

if (form) {
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', clearErrorOnInput);
    field.addEventListener('change', clearErrorOnInput);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const company = form.company.value.trim();
    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    const challenge = form.challenge.value.trim();
    const consent = form.consent.checked;
    let firstInvalid = null;

    setError('company', '');
    setError('name', '');
    setError('contact', '');
    setError('challenge', '');
    setError('consent', '');

    if (company.length < 2) {
      setError('company', '请填写企业名称（至少 2 个字符）。');
      firstInvalid = firstInvalid || form.company;
    }
    if (name.length < 2) {
      setError('name', '请填写您的姓名或职务。');
      firstInvalid = firstInvalid || form.name;
    }
    if (contact.length < 5) {
      setError('contact', '请填写有效的联系方式。');
      firstInvalid = firstInvalid || form.contact;
    } else if (contact.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setError('contact', '邮箱格式似乎不完整，请检查。');
      firstInvalid = firstInvalid || form.contact;
    }
    if (challenge.length < 10) {
      setError('challenge', '请用 10 个字符以上描述希望解决的问题。');
      firstInvalid = firstInvalid || form.challenge;
    }
    if (!consent) {
      setError('consent', '请先确认您了解表单的生成方式。');
      firstInvalid = firstInvalid || form.consent;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const topics = [...form.querySelectorAll('input[name="topic"]:checked')].map(input => input.value);
    const now = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date());

    const brief = [
      '行略咨询 · 沟通需求单',
      `生成时间：${now}`,
      '--------------------------------',
      `企业名称：${company}`,
      `联系人：${name}`,
      `联系方式：${contact}`,
      `关注方向：${topics.length ? topics.join('、') : '暂未选择'}`,
      '希望解决的问题：',
      challenge,
      '--------------------------------',
      '说明：本需求单由网页在本地生成，未自动发送。',
      '可发送至：xinglue2018@126.com，或致电 138 7313 4618（谢先生）、177 0077 5178。'
    ].join('\n');

    briefOutput.textContent = brief;
    form.hidden = true;
    successPanel.hidden = false;
    copyStatus.textContent = '';
    successPanel.focus();
    successPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });
}

if (editButton) {
  editButton.addEventListener('click', () => {
    successPanel.hidden = true;
    form.hidden = false;
    form.querySelector('#company')?.focus();
  });
}

if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const text = briefOutput.textContent;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }
      copyStatus.textContent = '已复制，可粘贴到邮件或微信中发送。';
    } catch (error) {
      copyStatus.textContent = '复制失败，请手动选择上方内容复制。';
    }
    window.setTimeout(() => { copyStatus.textContent = ''; }, 5000);
  });
}
