/* ============================================================
   福天天导航 · 开源演示版 — 站点配置（config.js）
   ------------------------------------------------------------
   本文件只负责「展示结构」配置，不包含网站链接数据（链接在 data.js）。
   修改本文件即可调整全站首页布局，无需改动 HTML / 主逻辑 app.js。

   ── NAV_CONFIG.navTabs：首页「精选推荐」上方的 Tab 页签 ──────────
     category：对应 data.js 中精选数据分组的键（TJ_a ~ TJ_g），
               键名以 TJ_ 开头，data.js 中同名的数组即该 Tab 的内容
     text    ：Tab 上显示的文字
     → 想新增一个 Tab：先在 data.js 增加 TJ_x 数组，再在下面加一项

   ── NAV_CONFIG.sidebar：首页左侧「网站分类」速达菜单 ────────────
     target：对应 data.js 全部分类的键（FL_a ~ FL_l），同时对应
             首页 index.html 里 <section class="category" id="FL_x">
             的锚点 id，点击后平滑滚动到该分类区块
     icon  ：分类图标，取值见 public/symbol/ 中 <symbol id="icon-xxx">
     text  ：分类显示名称
     → 注意：新增分类需要同步修改 index.html（增加 <section id="FL_x">），
       工具栏「网站分类」面板会自动跟随本配置渲染

   ── SEARCH_ENGINES：搜索框的引擎切换配置 ────────────────────────
     url ：搜索请求地址，关键词由 app.js 直接拼接到 url 之后
     icon：iconfont 图标引用（#icon-xxx）
     → 想新增引擎：在此追加一项，并在 index.html 的搜索区
       （桌面端 .search-engines 与移动端 .mobile-search-engines）
       各加一个对应 data-engine 的选项节点
   ============================================================ */

// 精选推荐 Tab 配置（TJ_a ~ TJ_g 必须与 data.js 中的键一致）
const NAV_CONFIG = {
  navTabs: [
    { category: 'TJ_a', text: '政府服务' },
    { category: 'TJ_b', text: '新闻媒体' },
    { category: 'TJ_c', text: '办公协作' },
    { category: 'TJ_d', text: '邮箱直达' },
    { category: 'TJ_e', text: '银行金融' },
    { category: 'TJ_f', text: 'AI智能' },
    { category: 'TJ_g', text: '在线工具' }
  ],
  sidebar: [
    { target: 'FL_a', icon: 'yingyin', text: '影音视听' },
    { target: 'FL_b', icon: 'chaxun', text: '查询工具' },
    { target: 'FL_c', icon: 'gouwu', text: '商城导购' },
    { target: 'FL_d', icon: 'shenghuo', text: '生活服务' },
    { target: 'FL_e', icon: 'pingtai', text: '运营平台' },
    { target: 'FL_f', icon: 'youxi', text: '游戏娱乐' },
    { target: 'FL_g', icon: 'book', text: '文学小说' },
    { target: 'FL_h', icon: 'study', text: '学习资源' },
    { target: 'FL_i', icon: 'job', text: '求职招聘' },
    { target: 'FL_j', icon: 'chengxuyuan', text: '专业开发' },
    { target: 'FL_k', icon: 'shuma', text: '科技数码' },
    { target: 'FL_l', icon: 'qiche', text: '车友关注' }
  ]
};

// 搜索引擎配置（关键词拼接在 url 之后）
const SEARCH_ENGINES = {
  baidu: { url: 'https://www.baidu.com/s?wd=', icon: '#icon-baidu' },
  bing: { url: 'https://www.bing.com/search?q=', icon: '#icon-bing' },
  '360': { url: 'https://www.so.com/s?q=', icon: '#icon-so360' },
  google: { url: 'https://www.google.com/search?q=', icon: '#icon-google' }
};
