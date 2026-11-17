document.documentElement.classList.add('js-ready');

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const updateHeader = () => {
  header.classList.toggle('scrolled', window.scrollY > 16);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const closeMenu = () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '打开导航菜单');
  mobileNav.hidden = true;
  header.classList.remove('menu-active');
  document.body.classList.remove('menu-open');
};

menuToggle.addEventListener('click', () => {
  const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(willOpen));
  menuToggle.setAttribute('aria-label', willOpen ? '关闭导航菜单' : '打开导航菜单');
  mobileNav.hidden = !willOpen;
  header.classList.toggle('menu-active', willOpen);
  document.body.classList.toggle('menu-open', willOpen);
});

mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 820) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});

const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

// 保持手风琴内容清晰，同时允许用户自由展开多个条目进行对比。
document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    const summary = detail.querySelector('summary');
    if (summary) summary.setAttribute('aria-expanded', String(detail.open));
  });
});

const form = document.querySelector('#consultation-form');
const successPanel = document.querySelector('#form-success');
const briefOutput = document.querySelector('#brief-output');
const copyButton = document.querySelector('#copy-brief');
const editButton = document.querySelector('#edit-brief');
const copyStatus = document.querySelector('#copy-status');
const challengeInput = document.querySelector('#challenge');
const charCount = document.querySelector('[data-char-count]');

challengeInput.addEventListener('input', () => {
  charCount.textContent = `${challengeInput.value.length} / 800`;
});

const errorMessages = {
  company: '请填写企业名称',
  name: '请填写您的称呼',
  contact: '请留下一种方便联系您的方式',
  challenge: '请至少用 10 个字描述希望解决的问题',
  consent: '请确认了解当前表单的信息处理方式'
};

const validateField = (field) => {
  let valid = field.checkValidity();
  if (field.name === 'challenge' && field.value.trim().length < 10) valid = false;
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = valid ? '' : errorMessages[field.name];
  field.setAttribute('aria-invalid', String(!valid));
  return valid;
};

form.querySelectorAll('[required]').forEach((field) => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.getAttribute('aria-invalid') === 'true') validateField(field);
  });
});

const buildBrief = (data) => {
  const topics = data.getAll('topic');
  return [
    '行略咨询｜初步沟通需求单',
    '————————————————',
    `企业名称：${data.get('company').trim()}`,
    `联系人：${data.get('name').trim()}`,
    `联系方式：${data.get('contact').trim()}`,
    `探讨方向：${topics.length ? topics.join('、') : '待沟通确认'}`,
    '',
    '希望解决的问题：',
    data.get('challenge').trim(),
    '————————————————',
    '说明：本需求单由网站在本地生成，尚未自动发送。'
  ].join('\n');
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const requiredFields = [...form.querySelectorAll('[required]')];
  const results = requiredFields.map(validateField);
  const firstInvalidIndex = results.indexOf(false);
  if (firstInvalidIndex !== -1) {
    requiredFields[firstInvalidIndex].focus();
    return;
  }

  const data = new FormData(form);
  briefOutput.textContent = buildBrief(data);
  form.hidden = true;
  successPanel.hidden = false;
  copyStatus.textContent = '';
  successPanel.focus({ preventScroll: true });
  successPanel.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
});

const fallbackCopy = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  const succeeded = document.execCommand('copy');
  textArea.remove();
  return succeeded;
};

copyButton.addEventListener('click', async () => {
  const text = briefOutput.textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else if (!fallbackCopy(text)) {
      throw new Error('copy-unavailable');
    }
    copyStatus.textContent = '已复制，可粘贴到您常用的沟通工具中。';
    copyButton.textContent = '已复制';
  } catch {
    copyStatus.textContent = '未能自动复制，请选中上方文字后手动复制。';
  }
});

editButton.addEventListener('click', () => {
  successPanel.hidden = true;
  form.hidden = false;
  document.querySelector('#company').focus();
});
