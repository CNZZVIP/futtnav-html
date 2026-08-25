/* ============================================================
   福天天导航 · 开源演示版 — 主逻辑（app.js）
   ------------------------------------------------------------
   职责分工（模块由底部 App 统一装配）：
   - SearchManager   搜索框 / 引擎切换 / 移动端搜索，引擎选择记忆在
                     localStorage（键 searchEngine）
   - NavManager      首页「精选推荐」Tab 切换与站点渲染，
                     上次选中的 Tab 记忆在 localStorage（键 navTab）
   - SidebarManager  左侧分类速达菜单，滚动时自动高亮当前分类
   - ThemeManager    深 / 浅色主题：跟随系统偏好、支持手动切换，
                     手动选择记忆在 localStorage（键 theme）
   - ToolbarManager  右下角工具栏：天气面板（2345 iframe 降级方案）、
                     分类速达、复制当前页链接、返回顶部
   - ContentRenderer 渲染「全部分类」区块与友情链接，并为所有站外
                     链接统一追加 ?source=hao.futt.cn 引流参数
   - App             模块装配与启动入口

   本文件依赖 config.js（NAV_CONFIG / SEARCH_ENGINES）与
   data.js（NAVIGATION_DATA），三者配合即可完成全站大部分定制，
   一般无需改动 HTML 主体结构。
   ============================================================ */

// 工具函数：图标推导、轻提示、DOM 快捷创建
const Utils = {
  getIcon(site) {
    if (site.icon) return `#icon-${site.icon}`;
    try {
      const u = site.url.toLowerCase().split('://')[1]?.split('/')[0] || site.url;
      const p = u.split('.');
      const c = ['com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn', 'ac.cn'];
      const l = p.slice(-2).join('.');
      if (p.length >= 3 && c.includes(l)) return `#icon-${p[p.length - 3]}`;
      return p[0] === 'www' && p.length >= 3 ? `#icon-${p[1]}` : `#icon-${p[p.length - 2] || p[0]}`;
    } catch { return '#icon-link'; }
  },
  showToast(m) {
    const t = document.createElement('div');
    t.textContent = m;
    t.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      background:var(--card);color:var(--text);padding:12px 24px;border-radius:var(--radius);
      box-shadow:var(--shadow-lg);z-index:10000;border:1px solid var(--border)`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  },
  create(t, a, c) {
    const e = document.createElement(t);
    Object.entries(a).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k.startsWith('data-')) e.setAttribute(k, v);
      else e[k] = v;
    });
    if (c) e.innerHTML = c;
    return e;
  },
  // HTML 转义（渲染动态数据到模板时防止特殊字符破坏结构）
  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  // 从 URL 提取可读域名（失败时原样返回）
  hostname(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return url; }
  }
};

// 搜索管理器：处理搜索框输入、引擎切换、移动端引擎选择。
// 输入时自动联想本站收录站点（对 data.js 全站数据模糊匹配，最多 8 条）：
//   ↑↓ 选择高亮、Enter 跳转（无高亮时走搜索引擎）、Esc 关闭、失焦隐藏
class SearchManager {
  constructor() {
    this.engines = SEARCH_ENGINES;
    this.currentEngine = localStorage.getItem('searchEngine') || 'baidu';
    this.index = [];        // 全站站点索引 [{ name, url, icon }]
    this.activeIndex = -1;  // 联想列表当前高亮项下标
    this.boxes = new WeakMap(); // input 元素 -> 联想下拉容器
  }
  init() {
    this.buildIndex();
    this.updateEngine();
    this.bindEvents();
  }
  // 合并 data.js 全部分组（TJ_*/FL_*/YL_*）建立全站搜索索引
  buildIndex() {
    this.index = [];
    Object.keys(NAVIGATION_DATA || {}).forEach(k => {
      (NAVIGATION_DATA[k] || []).forEach(s => {
        this.index.push({ name: s.name, url: s.url, icon: s.icon || '' });
      });
    });
  }
  // 获取输入框的联想容器（懒创建，挂在输入框父级下，用于定位下拉）
  suggestBox(input) {
    if (!this.boxes.has(input)) {
      const box = Utils.create('div', { class: 'search-suggest' });
      input.parentElement.appendChild(box);
      this.boxes.set(input, box);
    }
    return this.boxes.get(input);
  }
  // 渲染联想列表；q 为已转小写的关键词
  renderSuggest(input, q) {
    const box = this.suggestBox(input);
    if (!q) { box.classList.remove('show'); return; }
    const list = this.index.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
    if (!list.length) {
      box.innerHTML = '<div class="suggest-empty">未找到相关站点，回车将使用搜索引擎搜索</div>';
      box.classList.add('show');
      return;
    }
    this.activeIndex = -1;
    box.innerHTML = '<div class="search-suggest-header">本站收录</div>' + list.map((s, i) => `
      <a class="suggest-item" href="${Utils.escapeHtml(s.url)}" data-index="${i}"
        target="_blank" rel="noopener noreferrer">
        <span class="suggest-icon"><svg class="icon"><use xlink:href="${Utils.getIcon(s)}"></use></svg></span>
        <span class="suggest-name">${Utils.escapeHtml(s.name)}</span>
        <span class="suggest-url">${Utils.escapeHtml(Utils.hostname(s.url))}</span>
      </a>`).join('');
    box.classList.add('show');
  }
  // 键盘 ↑↓ 移动高亮（容器内滚动，避免带动页面滚动）
  moveHighlight(box, step) {
    const items = box.querySelectorAll('.suggest-item');
    if (!items.length) return;
    this.activeIndex = (this.activeIndex + step + items.length) % items.length;
    items.forEach((it, i) => it.classList.toggle('active', i === this.activeIndex));
    const cur = items[this.activeIndex];
    if (cur.offsetTop < box.scrollTop) box.scrollTop = cur.offsetTop;
    else if (cur.offsetTop + cur.clientHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = cur.offsetTop + cur.clientHeight - box.clientHeight;
    }
  }
  // 跳转联想项（统一追加 source 参数，与全站引流保持一致）
  gotoSuggest(item) {
    if (!item) return;
    try {
      const u = new URL(item.href);
      u.searchParams.set('source', 'hao.futt.cn');
      window.open(u.toString(), '_blank');
    } catch {
      window.open(item.href, '_blank');
    }
  }
  bindEvents() {
    // 引擎切换（桌面端）
    document.querySelectorAll('.search-engine').forEach(e => {
      e.addEventListener('click', () => {
        this.currentEngine = e.dataset.engine;
        this.updateEngine();
        this.search(document.querySelector('.search-input')?.value.trim());
      });
    });
    // 引擎切换（移动端）
    const mse = document.getElementById('mobileSearchEngine');
    mse?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('mobileSearchEngines').classList.toggle('show');
    });
    document.querySelectorAll('.mobile-engine-option').forEach(o => {
      o.addEventListener('click', e => {
        this.currentEngine = e.currentTarget.dataset.engine;
        this.updateEngine();
        document.getElementById('mobileSearchEngines').classList.remove('show');
      });
    });
    // 输入框统一绑定：联想渲染 + 键盘导航 + 回车跳转
    const setup = (inputSel, btnSel) => {
      const n = document.querySelector(inputSel);
      const t = document.querySelector(btnSel);
      if (!n || !t) return;
      const box = this.suggestBox(n);
      // 搜索按钮：有高亮项则跳联想项，否则执行搜索引擎搜索
      t.addEventListener('click', () => {
        if (box.classList.contains('show') && this.activeIndex >= 0) {
          this.gotoSuggest(box.querySelectorAll('.suggest-item')[this.activeIndex]);
        } else {
          this.search(n.value.trim());
        }
      });
      // 联想项点击跳转
      box.addEventListener('click', e => {
        const item = e.target.closest('.suggest-item');
        if (item) { e.preventDefault(); this.gotoSuggest(item); }
      });
      n.addEventListener('input', () => this.renderSuggest(n, n.value.trim().toLowerCase()));
      n.addEventListener('focus', () => {
        const q = n.value.trim().toLowerCase();
        if (q) this.renderSuggest(n, q);
      });
      n.addEventListener('keydown', e => {
        const isShow = box.classList.contains('show');
        if (e.key === 'Escape') { box.classList.remove('show'); return; }
        if (!isShow) {
          if (e.key === 'Enter') { e.preventDefault(); this.search(n.value.trim()); }
          return;
        }
        if (e.key === 'ArrowDown') { e.preventDefault(); this.moveHighlight(box, 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.moveHighlight(box, -1); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          const items = box.querySelectorAll('.suggest-item');
          if (items.length && this.activeIndex >= 0) this.gotoSuggest(items[this.activeIndex]);
          else this.search(n.value.trim());
        }
      });
      n.addEventListener('blur', () => setTimeout(() => box.classList.remove('show'), 150));
    };
    setup('.search-input', '.search-btn');
    setup('.mobile-search-input', '.mobile-search-btn');
    document.addEventListener('click', () => {
      document.getElementById('mobileSearchEngines')?.classList.remove('show');
    });
  }
  updateEngine() {
    const hl = (els, engine) => {
      els.forEach(e => e.classList.toggle('active', e.dataset.engine === this.currentEngine));
    };
    hl(document.querySelectorAll('.search-engine'), this.currentEngine);
    hl(document.querySelectorAll('.mobile-engine-option'), this.currentEngine);
    const m = document.querySelector('#mobileSearchEngine svg use');
    if (m && this.engines[this.currentEngine]) {
      m.setAttribute('xlink:href', this.engines[this.currentEngine].icon);
    }
    localStorage.setItem('searchEngine', this.currentEngine);
  }
  search(q) {
    if (q && this.engines[this.currentEngine]) {
      window.open(`${this.engines[this.currentEngine].url}${encodeURIComponent(q)}`, '_blank');
    }
  }
}

// 精选推荐管理器：渲染「精选推荐」Tab 页签与对应站点卡片，点击切换并记忆选择
class NavManager {
  constructor() {
    this.selectedTab = localStorage.getItem('navTab') || 'TJ_a';
  }
  init() {
    this.renderTabs();
    this.renderSites(this.selectedTab);
    this.bindEvents();
  }
  renderTabs() {
    const c = document.getElementById('navTabsContainer');
    if (!c) return;
    c.innerHTML = NAV_CONFIG.navTabs.map(t => `
      <div class="nav-tab ${this.selectedTab === t.category ? 'active' : ''}"
        data-category="${t.category}">${t.text}</div>`).join('');
  }
  renderSites(category) {
    const n = document.getElementById('navContent');
    if (!n || !NAVIGATION_DATA[category]) return;
    n.innerHTML = NAVIGATION_DATA[category].map(s => `
      <a href="${s.url}" target="_blank" rel="noopener noreferrer"
        class="nav-site ${s.highlight ? 'highlight-site' : ''}" title="${s.name}">
        <span class="nav-site-name">${s.name}</span>
      </a>`).join('');
  }
  bindEvents() {
    document.getElementById('navTabsContainer').addEventListener('click', e => {
      const t = e.target.closest('.nav-tab');
      if (t) {
        document.querySelectorAll('.nav-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.selectedTab = t.dataset.category;
        localStorage.setItem('navTab', this.selectedTab);
        this.renderSites(this.selectedTab);
      }
    });
  }
}

// 侧边栏管理器：渲染左侧分类速达菜单，点击平滑滚动到对应分类，滚动时高亮当前分类
class SidebarManager {
  constructor() {
    this.container = document.getElementById('sidebarContainer');
    this.categories = null;
    this.items = null;
  }
  init() {
    this.render();
    this.bindEvents();
    this.setupScroll();
  }
  render() {
    if (!this.container) return;
    this.container.innerHTML = NAV_CONFIG.sidebar.map(i => `
      <div class="sidebar-item" data-target="${i.target}">
        <svg class="icon"><use xlink:href="#icon-${i.icon}"></use></svg>
        <span>${i.text}</span>
      </div>`).join('');
  }
  bindEvents() {
    this.container.addEventListener('click', e => {
      const i = e.target.closest('.sidebar-item');
      if (i) {
        const t = i.dataset.target;
        const s = document.getElementById(t);
        if (s) {
          this.setActive(t);
          s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }
  setupScroll() {
    this.categories = document.querySelectorAll('.category');
    this.items = document.querySelectorAll('.sidebar-item');
    this.checkActive();
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.checkActive();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  checkActive() {
    if (this.container.offsetParent === null) return;
    const scrollPos = window.scrollY + 150;
    let activeId = null;
    let minDist = Infinity;
    this.categories.forEach(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) activeId = section.id;
      const center = top + section.offsetHeight / 2;
      const dist = Math.abs(scrollPos - center);
      if (dist < minDist) {
        minDist = dist;
        if (!activeId) activeId = section.id;
      }
    });
    if (activeId) this.setActive(activeId);
  }
  setActive(id) {
    this.items.forEach(item => {
      item.classList.toggle('active', item.dataset.target === id);
    });
  }
}

// 主题管理器：深/浅色主题（跟随系统 prefers-color-scheme，手动切换后记忆到 localStorage）
class ThemeManager {
  constructor() {
    this.btn = document.getElementById('themeToggleBtn');
    this.icon = this.btn.querySelector('svg use');
  }
  init() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    let isDark = savedTheme ? savedTheme === 'dark' : prefersDark.matches;
    this.apply(isDark);
    prefersDark.addEventListener('change', e => {
      if (!localStorage.getItem('theme')) this.apply(e.matches);
    });
    this.btn.addEventListener('click', () => {
      const isDark = document.body.dataset.theme === 'dark';
      this.apply(!isDark);
      localStorage.setItem('theme', !isDark ? 'dark' : 'light');
    });
  }
  apply(isDark) {
    if (isDark) {
      document.body.dataset.theme = 'dark';
      this.icon.setAttribute('xlink:href', '#icon-sun');
      this.btn.title = '切换到浅色';
    } else {
      document.body.dataset.theme = 'light';
      this.icon.setAttribute('xlink:href', '#icon-moon');
      this.btn.title = '切换到深色';
    }
  }
}

// 工具栏管理器：天气 / 分类速达 / 复制链接 / 返回顶部
// 天气面板使用 2345 天气网 iframe（纯静态无后端的最简降级方案）
class ToolbarManager {
  constructor() {
    this.panels = {};
  }
  init() {
    this.initPanels();
    this.initButtons();
    this.initBackTop();
  }
  initPanels() {
    this.panels.weather = this.createPanel('weatherPanel', '实时天气预报', `
      <div style="text-align:center">
        <iframe src="https://tianqi.2345.com/plugin/widget/index.htm?s=2&z=1&t=0&v=1&d=3&bd=0&k=&f=808080&q=1&e=1&a=1&c=54511&w=1&hh=&h=278"
          width="100%" height="278" frameborder="0" marginwidth="0" marginheight="0" scrolling="no"
          title="天气预报" style="border-radius:var(--radius)">
        </iframe>
        <p style="margin-top:10px;opacity:.7">数据来源：天气网</p>
      </div>`);
    this.panels.category = this.createPanel('categoryPanel', '网站分类', `
      <div class="category-menu">
        ${NAV_CONFIG.sidebar.map(i => `
          <div class="category-menu-item" data-target="${i.target}">
            <svg class="icon"><use xlink:href="#icon-${i.icon}"></use></svg>
            <span>${i.text}</span>
          </div>`).join('')}
      </div>`);
    this.panels.copyTip = this.createPanel('copyTip', '链接复制成功！', `
      <div style="text-align:center;padding:1rem">
        <svg class="icon" style="color:var(--accent);font-size:2rem">
          <use xlink:href="#icon-check"></use>
        </svg>
        <p style="margin-top:.5rem">链接已复制到剪贴板</p>
      </div>`);
  }
  createPanel(id, title, content) {
    const p = Utils.create('div', { id, class: 'toolbar-panel' }, `
      <div class="panel-header">
        <div class="panel-title">${title}</div>
        <button class="panel-close">
          <svg class="icon"><use xlink:href="#icon-close"></use></svg>
        </button>
      </div>
      ${content}`);
    document.querySelector('.toolbar').appendChild(p);
    p.querySelector('.panel-close').addEventListener('click', () => p.style.display = 'none');
    return p;
  }
  initButtons() {
    document.getElementById('weatherBtn').addEventListener('click', () => this.toggle(this.panels.weather));
    document.getElementById('categoryBtn').addEventListener('click', () => {
      this.toggle(this.panels.category);
      this.initCategoryMenu();
    });
    document.getElementById('copyLinkBtn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        this.panels.copyTip.style.display = 'block';
        setTimeout(() => this.panels.copyTip.style.display = 'none', 2000);
      } catch {
        const t = document.createElement('textarea');
        t.value = location.href;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        Utils.showToast('链接已复制');
      }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.toolbar') && !e.target.closest('.toolbar-panel')) {
        Object.values(this.panels).forEach(p => p.style.display = 'none');
      }
    });
  }
  initCategoryMenu() {
    this.panels.category.querySelectorAll('.category-menu-item').forEach(i => {
      i.addEventListener('click', () => {
        const t = i.dataset.target;
        const s = document.getElementById(t);
        if (s) {
          s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // 内页无分类区块，跳转首页对应分类
          location.href = `index.html#${t}`;
        }
        this.panels.category.style.display = 'none';
      });
    });
  }
  toggle(p) {
    Object.values(this.panels).forEach(x => x.style.display = 'none');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
  }
  initBackTop() {
    const btn = document.getElementById('backTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// 内容渲染器：渲染「全部分类」站点卡片与友情链接；
// 末尾统一为站外链接追加 source=hao.futt.cn 参数，便于统计引流来源
class ContentRenderer {
  static render() {
    Object.keys(NAVIGATION_DATA).forEach(k => {
      if (!k.startsWith('FL_')) return;
      const s = document.getElementById(k);
      if (!s) return;
      const g = s.querySelector('.category-content');
      if (!g) return;
      g.innerHTML = NAVIGATION_DATA[k].map(site => `
        <a href="${site.url}" target="_blank" rel="noopener noreferrer"
          class="category-site ${site.highlight ? 'highlight-site' : ''}" title="${site.name}">
          <div class="site-icon">
            <svg class="icon"><use xlink:href="${Utils.getIcon(site)}"></use></svg>
          </div>
          <span class="site-name">${site.name}</span>
        </a>`).join('');
    });
    const fl = document.getElementById('friendshipLinksContent');
    if (fl && NAVIGATION_DATA.YL_a) {
      fl.innerHTML = NAVIGATION_DATA.YL_a.map(s => `
        <a href="${s.url}" target="_blank" rel="noopener noreferrer"
          class="friendship-link">${s.name}</a>`).join('');
    }
    // 统一为站外链接追加 source 参数（便于统计引流来源）
    document.querySelectorAll('a[target="_blank"]').forEach(l => {
      if (!l.href.includes('futt.cn')) {
        try {
          const u = new URL(l.href);
          u.searchParams.set('source', 'hao.futt.cn');
          l.href = u.toString();
        } catch { }
      }
    });
  }
}

// 主应用：装配各模块并启动；页面带 #分类 锚点时自动滚动定位（工具栏跨页跳转用）
// 头部滚动管理器：参考正式版交互——
// 向下滚动超过阈值后自动隐藏头部（translateY 滑出），向上滚动立即滑回
class HeaderManager {
  constructor() {
    this.header = null;
    this.threshold = 320; // 滚动超过该距离后才允许隐藏
    this.lastY = 0;
  }
  init() {
    this.header = document.querySelector('header');
    if (!this.header) return;
    this.lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      const delta = y - this.lastY;
      // 联想下拉展开时保持头部可见，避免搜索过程被打断
      const suggestOpen = document.querySelector('.search-suggest.show');
      if (y > this.threshold && delta > 0 && !suggestOpen) {
        this.header.classList.add('header-hide');
      } else if (delta < 0 || y <= this.threshold) {
        this.header.classList.remove('header-hide');
      }
      this.lastY = y;
    }, { passive: true });
  }
}

// 认证徽章管理器：页脚质量认证徽章按当前站点域名填充各验证服务的专属链接
// （HTML5/CSS/SSL/TLS/Security Headers/HSTS/Rich Results/PageSpeed）
class BadgesManager {
  init() {
    const host = location.hostname;
    const site = encodeURIComponent(location.origin + '/');
    const links = {
      html5: 'https://validator.w3.org/nu/?doc=' + site,
      css: 'https://jigsaw.w3.org/css-validator/validator?uri=' + site,
      ssl: 'https://www.ssllabs.com/ssltest/analyze.html?d=' + host,
      security: 'https://securityheaders.com/?q=' + host,
      hsts: 'https://hstspreload.org/?domain=' + host,
      richresults: 'https://search.google.com/test/rich-results?url=' + site,
      pagespeed: 'https://pagespeed.web.dev/analysis?url=' + site
    };
    document.querySelectorAll('.footer-badges a[data-badge]').forEach(function (b) {
      const u = links[b.dataset.badge];
      if (u) b.href = u;
    });
  }
}

class App {
  constructor() {
    this.modules = {
      search: new SearchManager(),
      nav: new NavManager(),
      sidebar: new SidebarManager(),
      theme: new ThemeManager(),
      toolbar: new ToolbarManager(),
      header: new HeaderManager(),
      badges: new BadgesManager()
    };
  }
  init() {
    this.modules.theme.init();
    this.modules.header.init();
    this.modules.badges.init();
    this.modules.search.init();
    this.modules.nav.init();
    ContentRenderer.render();
    this.modules.sidebar.init();
    this.modules.toolbar.init();
    // 页面带 #分类 锚点时自动滚动定位（工具栏分类面板跨页跳转）
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
    const input = window.innerWidth < 768 ? '.mobile-search-input' : '.search-input';
    document.querySelector(input)?.focus();
  }
}

// 版权年份自动更新：纯静态环境通过浏览器本地时间动态显示当前年份，跨年自动更新，无需重新构建
// 版权声明（FUTT.CN）受 MIT 开源协议保护，保留版权是协议强制条款，请勿删除或篡改
(function initCopyrightYear() {
  const el = document.getElementById('copy-year');
  if (el) el.textContent = String(new Date().getFullYear());
})();

// 初始化
document.addEventListener('DOMContentLoaded', () => new App().init());
