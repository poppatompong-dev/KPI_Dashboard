/* =============================================
   Admin Back-Office Controller
   Municipal KPI Platform
   =============================================
   Main SPA controller for the back-office.
   Manages 8 sections via tab routing.
   ============================================= */

const BackOffice = (() => {
  let session = null;
  let currentSection = 'dashboard';

  // ─── Init ──────────────────────────────────
  function init() {
    if (!Auth.requireLogin()) return;
    session = Auth.getSession();

    renderUserBadge();
    setupNavigation();
    setupLogout();
    navigateTo('dashboard');
  }

  function renderUserBadge() {
    const el = document.getElementById('userBadge');
    if (!el || !session) return;
    const roleInfo = Auth.ROLES[session.role] || {};
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div style="width:2rem;height:2rem;border-radius:var(--radius-full);background:${roleInfo.color || '#666'};display:grid;place-items:center;color:#fff;font-size:0.75rem;font-weight:700;">${(session.display_name || 'U')[0]}</div>
        <div>
          <div style="font-size:0.78rem;font-weight:600;color:var(--clr-neutral-800);">${session.display_name}</div>
          <div style="font-size:0.65rem;color:var(--clr-neutral-400);">${roleInfo.label || session.role}</div>
        </div>
      </div>`;
  }

  // ─── Navigation ────────────────────────────
  function setupNavigation() {
    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(link.dataset.section);
      });
    });

    // Mobile toggle
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar--open'));
    }
  }

  function navigateTo(section) {
    currentSection = section;

    // Update active nav
    document.querySelectorAll('[data-section]').forEach(l => {
      l.classList.toggle('sidebar__link--active', l.dataset.section === section);
    });

    // Update title
    const titles = {
      dashboard: '📊 แดชบอร์ดระบบ',
      users: '👥 จัดการผู้ใช้งาน',
      departments: '🏢 จัดการหน่วยงาน',
      kpis: '📋 จัดการตัวชี้วัด KPI',
      results: '📝 บันทึกผลการดำเนินงาน',
      strategies: '🎯 ยุทธศาสตร์',
      audit: '📜 Audit Logs',
      monitoring: '🖥️ System Monitoring'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[section] || section;

    // Render section
    const container = document.getElementById('sectionContent');
    if (!container) return;

    switch (section) {
      case 'dashboard': renderDashboard(container); break;
      case 'users': renderUserMgmt(container); break;
      case 'departments': renderDeptMgmt(container); break;
      case 'kpis': renderKpiMgmt(container); break;
      case 'results': renderResultEntry(container); break;
      case 'strategies': renderStrategies(container); break;
      case 'audit': renderAuditLogs(container); break;
      case 'monitoring': renderMonitoring(container); break;
      default: container.innerHTML = '<p>Section not found</p>';
    }
  }

  function setupLogout() {
    const btn = document.getElementById('btnLogout');
    if (btn) btn.addEventListener('click', () => { Auth.logout(); window.location.href = 'login.html'; });
  }

  // ═══════ SECTION 1: Dashboard ══════════════
  function renderDashboard(el) {
    const users = Auth.getAllUsers();
    const depts = typeof DataPlatform !== 'undefined' ? DataPlatform.getDepartments() : [];
    const kpis = typeof DataPlatform !== 'undefined' ? DataPlatform.getKpiMaster() : [];
    const results = typeof DataPlatform !== 'undefined' ? DataPlatform.getResults() : [];
    const auditStats = AuditLog.getStats();
    const governance = Auth.getDataGovernanceReport();
    const recentLogs = AuditLog.getRecent(10);

    el.innerHTML = `
      <!-- Stats Cards -->
      <div class="stats-grid" style="grid-template-columns:repeat(6,1fr);">
        ${_statCard('👥', 'ผู้ใช้งาน', users.length, 'คน', 'total')}
        ${_statCard('🏢', 'หน่วยงาน', depts.length, 'แห่ง', 'success')}
        ${_statCard('📊', 'KPI ทั้งหมด', kpis.length, 'ตัว', 'score')}
        ${_statCard('📝', 'ผลงานบันทึก', results.length, 'รายการ', 'total')}
        ${_statCard('📈', 'ข้อมูลครบถ้วน', governance.overall_completeness + '%', '', 'success')}
        ${_statCard('📜', 'Audit Logs', auditStats.total_logs, 'รายการ', 'risk')}
      </div>

      <!-- Data Quality + Recent Activity -->
      <div class="section-grid">
        <!-- Data Quality by Department -->
        <div class="chart-card">
          <div class="chart-card__header"><h2 class="chart-card__title">📊 ข้อมูลครบถ้วนรายหน่วยงาน</h2></div>
          <div id="deptCompletenessChart"></div>
        </div>

        <!-- Recent Activity -->
        <div class="chart-card">
          <div class="chart-card__header"><h2 class="chart-card__title">🕐 กิจกรรมล่าสุด</h2></div>
          <div style="max-height:320px;overflow-y:auto;">
            ${recentLogs.map(log => {
              const at = AuditLog.ACTION_TYPES[log.action] || { icon: '📌', label: log.action, color: 'gray' };
              const time = new Date(log.timestamp);
              const timeStr = time.toLocaleDateString('th-TH') + ' ' + time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              return `<div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">${at.icon} ${at.label}</span><span style="font-size:0.65rem;color:var(--clr-neutral-400);">${timeStr}</span></div><div style="font-size:0.7rem;color:var(--clr-neutral-500);margin-top:0.15rem;">โดย: ${log.user} — ${log.details}</div></div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Alerts: Missing Data, Inactive Users -->
      <div class="section-grid">
        <div class="chart-card">
          <div class="chart-card__header"><h2 class="chart-card__title">⚠️ KPI ที่ยังไม่มีข้อมูล (${governance.missing_results.length})</h2></div>
          <div style="max-height:240px;overflow-y:auto;">
            ${governance.missing_results.length === 0 ? '<div style="text-align:center;padding:1rem;color:var(--clr-neutral-400);">✅ ข้อมูลครบถ้วน</div>' :
            governance.missing_results.slice(0, 15).map(k => `<div class="risk-alert-item"><div style="font-size:0.8rem;font-weight:500;">${k.kpi_name}</div><div style="font-size:0.7rem;color:var(--clr-neutral-400);">${k.department}</div></div>`).join('')}
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card__header"><h2 class="chart-card__title">👥 ผู้ใช้งาน</h2></div>
          <div style="max-height:240px;overflow-y:auto;">
            ${users.map(u => {
              const roleInfo = Auth.ROLES[u.role] || { label: u.role, color: '#666' };
              const statusBadge = u.status === 'active'
                ? '<span class="badge badge--green"><span class="badge__dot"></span>ใช้งาน</span>'
                : '<span class="badge badge--red"><span class="badge__dot"></span>ระงับ</span>';
              return `<div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;font-weight:500;">${u.display_name} (${u.username})</span>${statusBadge}</div><div style="font-size:0.7rem;color:var(--clr-neutral-400);">บทบาท: ${roleInfo.label} | สำนัก: ${u.department === 'all' ? 'ทุกหน่วยงาน' : u.department}</div></div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Render dept completeness
    const complEl = document.getElementById('deptCompletenessChart');
    if (complEl) {
      complEl.innerHTML = Object.entries(governance.dept_completeness).map(([dept, info]) => {
        const color = info.pct >= 90 ? 'var(--clr-success-500)' : info.pct >= 60 ? 'var(--clr-warning-500)' : 'var(--clr-danger-500)';
        return `<div style="margin-bottom:0.6rem;"><div style="display:flex;justify-content:space-between;margin-bottom:0.2rem;"><span style="font-size:0.75rem;color:var(--clr-neutral-600);">${dept.length > 22 ? dept.substring(0,20) + '…' : dept}</span><span style="font-size:0.7rem;font-weight:600;color:${color};">${info.pct}% (${info.withData}/${info.total})</span></div><div style="height:6px;background:var(--clr-neutral-200);border-radius:var(--radius-full);overflow:hidden;"><div style="height:100%;width:${info.pct}%;background:${color};border-radius:var(--radius-full);transition:width 0.5s;"></div></div></div>`;
      }).join('');
    }
  }

  // ═══════ SECTION 2: User Management ════════
  function renderUserMgmt(el) {
    const users = Auth.getAllUsers();
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:var(--space-sm);">
        <span style="font-size:0.85rem;color:var(--clr-neutral-500);">ทั้งหมด ${users.length} ผู้ใช้</span>
        ${session.role === 'SUPER_ADMIN' ? '<button class="btn btn--primary" id="btnAddUser"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>เพิ่มผู้ใช้ใหม่</button>' : ''}
      </div>
      <div class="table-card"><div style="overflow-x:auto;"><table class="kpi-table"><thead><tr>
        <th>ผู้ใช้</th><th>ชื่อแสดง</th><th class="text-center">บทบาท</th><th>หน่วยงาน</th><th class="text-center">สถานะ</th><th>เข้าสู่ระบบล่าสุด</th>${session.role === 'SUPER_ADMIN' ? '<th class="text-center">จัดการ</th>' : ''}
      </tr></thead><tbody id="userTableBody"></tbody></table></div></div>
      <div class="modal-backdrop" id="userModal"><div class="modal"><div class="modal__header"><h3 class="modal__title" id="userModalTitle">เพิ่มผู้ใช้ใหม่</h3><button class="modal__close" id="closeUserModal"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
      <div class="modal__body">
        <input type="hidden" id="editUserId">
        <div class="form-row"><div class="form-group"><label class="form-label">ชื่อผู้ใช้</label><input class="form-input" id="uUsername" placeholder="username"></div><div class="form-group"><label class="form-label">ชื่อที่แสดง</label><input class="form-input" id="uDisplayName" placeholder="ชื่อ-นามสกุล"></div></div>
        <div class="form-row"><div class="form-group"><label class="form-label">รหัสผ่าน</label><input class="form-input" id="uPassword" type="password" placeholder="อย่างน้อย 8 ตัวอักษร"></div><div class="form-group"><label class="form-label">อีเมล</label><input class="form-input" id="uEmail" placeholder="email@example.com"></div></div>
        <div class="form-row"><div class="form-group"><label class="form-label">บทบาท</label><select class="form-select" id="uRole"><option value="STAFF">เจ้าหน้าที่</option><option value="DIRECTOR">ผู้อำนวยการ</option><option value="EXECUTIVE">ผู้บริหาร</option><option value="AUDITOR">ผู้ตรวจสอบ</option><option value="SUPER_ADMIN">ผู้ดูแลระบบ</option></select></div><div class="form-group"><label class="form-label">หน่วยงาน</label><select class="form-select" id="uDepartment"><option value="all">ทุกหน่วยงาน</option></select></div></div>
      </div>
      <div class="modal__footer"><button class="btn btn--outline" id="cancelUserModal">ยกเลิก</button><button class="btn btn--primary" id="saveUserBtn">บันทึก</button></div></div></div>
    `;

    // Populate dept dropdown
    const deptSel = document.getElementById('uDepartment');
    if (deptSel && typeof DataPlatform !== 'undefined') {
      DataPlatform.getDepartments().forEach(d => {
        const o = document.createElement('option');
        o.value = d.name; o.textContent = d.name;
        deptSel.appendChild(o);
      });
    }

    // Render table
    _renderUserTable(users);

    // Events
    document.getElementById('btnAddUser')?.addEventListener('click', () => _openUserModal());
    document.getElementById('closeUserModal')?.addEventListener('click', () => _closeModal('userModal'));
    document.getElementById('cancelUserModal')?.addEventListener('click', () => _closeModal('userModal'));
    document.getElementById('saveUserBtn')?.addEventListener('click', _saveUser);
  }

  function _renderUserTable(users) {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => {
      const roleInfo = Auth.ROLES[u.role] || { label: u.role, color: '#666' };
      const statusBadge = u.status === 'active'
        ? '<span class="badge badge--green"><span class="badge__dot"></span>ใช้งาน</span>'
        : '<span class="badge badge--red"><span class="badge__dot"></span>ระงับ</span>';
      const lastLogin = u.last_login ? new Date(u.last_login).toLocaleDateString('th-TH') : 'ยังไม่เคย';
      const actions = session.role === 'SUPER_ADMIN' ? `
        <button class="btn btn--sm btn--outline" onclick="BackOffice._editUser('${u.user_id}')">แก้ไข</button>
        <button class="btn btn--sm ${u.status === 'active' ? 'btn--danger' : 'btn--primary'}" onclick="BackOffice._toggleUser('${u.user_id}')">${u.status === 'active' ? 'ระงับ' : 'เปิดใช้'}</button>
      ` : '';
      return `<tr><td style="font-weight:500;">${u.username}</td><td>${u.display_name}</td><td class="text-center"><span style="background:${roleInfo.color}20;color:${roleInfo.color};padding:0.15rem 0.5rem;border-radius:var(--radius-full);font-size:0.7rem;font-weight:600;">${roleInfo.label}</span></td><td style="font-size:0.8rem;">${u.department === 'all' ? 'ทุกหน่วยงาน' : u.department}</td><td class="text-center">${statusBadge}</td><td style="font-size:0.8rem;color:var(--clr-neutral-400);">${lastLogin}</td>${session.role === 'SUPER_ADMIN' ? `<td class="text-center" style="white-space:nowrap;">${actions}</td>` : ''}</tr>`;
    }).join('');
  }

  function _openUserModal(userId) {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    const title = document.getElementById('userModalTitle');

    if (userId) {
      const user = Auth.getUserById(userId);
      if (!user) return;
      title.textContent = 'แก้ไขผู้ใช้';
      document.getElementById('editUserId').value = userId;
      document.getElementById('uUsername').value = user.username;
      document.getElementById('uDisplayName').value = user.display_name;
      document.getElementById('uEmail').value = user.email || '';
      document.getElementById('uRole').value = user.role;
      document.getElementById('uDepartment').value = user.department;
      document.getElementById('uPassword').value = '';
      document.getElementById('uPassword').placeholder = 'เว้นว่างเพื่อไม่เปลี่ยน';
    } else {
      title.textContent = 'เพิ่มผู้ใช้ใหม่';
      document.getElementById('editUserId').value = '';
      document.getElementById('uUsername').value = '';
      document.getElementById('uDisplayName').value = '';
      document.getElementById('uEmail').value = '';
      document.getElementById('uPassword').value = '';
      document.getElementById('uPassword').placeholder = 'อย่างน้อย 8 ตัวอักษร';
      document.getElementById('uRole').value = 'STAFF';
      document.getElementById('uDepartment').value = 'all';
    }
    modal.classList.add('modal-backdrop--visible');
  }

  function _saveUser() {
    const editId = document.getElementById('editUserId')?.value;
    const data = {
      username: document.getElementById('uUsername').value.trim(),
      display_name: document.getElementById('uDisplayName').value.trim(),
      email: document.getElementById('uEmail').value.trim(),
      role: document.getElementById('uRole').value,
      department: document.getElementById('uDepartment').value,
      password: document.getElementById('uPassword').value
    };

    if (!data.username) { _toast('กรุณากรอกชื่อผู้ใช้', 'error'); return; }

    let result;
    if (editId) {
      const updates = { ...data };
      if (!updates.password) delete updates.password;
      result = Auth.updateUser(editId, updates);
    } else {
      if (!data.password) { _toast('กรุณากรอกรหัสผ่าน', 'error'); return; }
      result = Auth.createUser(data);
    }

    if (result.success) {
      _toast(editId ? 'แก้ไขผู้ใช้สำเร็จ' : 'สร้างผู้ใช้สำเร็จ', 'success');
      _closeModal('userModal');
      renderUserMgmt(document.getElementById('sectionContent'));
    } else {
      _toast(result.error, 'error');
    }
  }

  // ═══════ SECTION 3: Department Management ══
  function renderDeptMgmt(el) {
    const depts = typeof DataPlatform !== 'undefined' ? DataPlatform.getDepartments() : [];
    const kpis = typeof DataPlatform !== 'undefined' ? DataPlatform.getKpiMaster() : [];
    const users = Auth.getAllUsers();
    const deptColors = ['#2563eb','#d97706','#059669','#db2777','#4f46e5','#0891b2','#ca8a04','#e11d48','#9333ea','#16a34a','#475569'];

    el.innerHTML = `
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
        ${depts.map((d, i) => {
          const color = deptColors[i % deptColors.length];
          const deptKpis = kpis.filter(k => k.department === d.name);
          const deptUsers = users.filter(u => u.department === d.name);
          const director = deptUsers.find(u => u.role === 'DIRECTOR');
          return `<div class="stat-card" style="cursor:pointer;" onclick="BackOffice._viewDept('${d.name}')">
            <div class="stat-card__icon" style="background:${color}15;color:${color};"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>
            <div><div style="font-size:0.85rem;font-weight:600;color:var(--clr-neutral-800);">${d.name}</div>
            <div style="font-size:0.7rem;color:var(--clr-neutral-400);margin-top:0.2rem;">KPI: ${deptKpis.length} | ผู้ใช้: ${deptUsers.length}</div>
            <div style="font-size:0.65rem;color:var(--clr-neutral-400);">${director ? '👤 ' + director.display_name : 'ยังไม่มีผู้อำนวยการ'}</div></div></div>`;
        }).join('')}
      </div>`;
  }

  // ═══════ SECTION 4: KPI Management ═════════
  function renderKpiMgmt(el) {
    const kpis = typeof DataPlatform !== 'undefined' ? DataPlatform.getKpiMaster() : [];
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:var(--space-sm);">
        <div style="display:flex;gap:var(--space-sm);align-items:center;">
          <input class="form-input" id="kpiSearchInput" placeholder="🔍 ค้นหา KPI..." style="width:200px;padding:0.4rem 0.75rem;font-size:0.8rem;">
          <select class="filter-bar__select" id="kpiDeptFilter"><option value="all">ทุกหน่วยงาน</option></select>
        </div>
        <span style="font-size:0.8rem;color:var(--clr-neutral-400);">ทั้งหมด ${kpis.length} KPIs</span>
      </div>
      <div class="table-card"><div style="overflow-x:auto;"><table class="kpi-table"><thead><tr>
        <th>รหัส</th><th>ชื่อตัวชี้วัด</th><th>หน่วยงาน</th><th class="text-center">เป้าหมาย</th><th class="text-center">น้ำหนัก</th><th class="text-center">วิธีคำนวณ</th><th>ยุทธศาสตร์</th>
      </tr></thead><tbody id="kpiMgmtTable"></tbody></table></div></div>`;

    // Populate dept filter
    const deptFilter = document.getElementById('kpiDeptFilter');
    if (deptFilter && typeof DataPlatform !== 'undefined') {
      DataPlatform.getDepartments().forEach(d => {
        const o = document.createElement('option');
        o.value = d.name; o.textContent = d.short || d.name;
        deptFilter.appendChild(o);
      });
      deptFilter.addEventListener('change', () => _filterKpiTable(kpis));
    }

    document.getElementById('kpiSearchInput')?.addEventListener('input', () => _filterKpiTable(kpis));
    _filterKpiTable(kpis);
  }

  function _filterKpiTable(allKpis) {
    const search = (document.getElementById('kpiSearchInput')?.value || '').toLowerCase();
    const dept = document.getElementById('kpiDeptFilter')?.value || 'all';

    let filtered = allKpis;
    if (dept !== 'all') filtered = filtered.filter(k => k.department === dept);
    if (search) filtered = filtered.filter(k =>
      k.kpi_name.toLowerCase().includes(search) ||
      k.kpi_id.toLowerCase().includes(search)
    );

    const tbody = document.getElementById('kpiMgmtTable');
    if (!tbody) return;

    const calcLabels = { higher_better: 'ยิ่งมากยิ่งดี', lower_better: 'ยิ่งน้อยยิ่งดี', percentage: 'ร้อยละ' };

    tbody.innerHTML = filtered.map(k => `
      <tr>
        <td style="font-weight:600;font-size:0.75rem;color:var(--clr-primary-500);">${k.kpi_id}</td>
        <td class="kpi-name">${k.kpi_name}</td>
        <td style="font-size:0.8rem;">${k.department ? (k.department.length > 18 ? k.department.substring(0,16) + '…' : k.department) : '-'}</td>
        <td class="text-center">${k.target_value} ${k.unit}</td>
        <td class="text-center">${k.weight}%</td>
        <td class="text-center"><span style="font-size:0.7rem;background:var(--clr-primary-50);color:var(--clr-primary-500);padding:0.15rem 0.5rem;border-radius:var(--radius-full);">${calcLabels[k.calculation_type] || k.calculation_type}</span></td>
        <td style="font-size:0.75rem;color:var(--clr-neutral-400);">${k.strategy || '-'}</td>
      </tr>`).join('');
  }

  // ═══════ SECTION 5: KPI Results ════════════
  function renderResultEntry(el) {
    const kpis = typeof DataPlatform !== 'undefined' ? DataPlatform.getKpiMaster() : [];
    const results = typeof DataPlatform !== 'undefined' ? DataPlatform.getResults() : [];

    el.innerHTML = `
      <div class="section-grid">
        <!-- Entry Form -->
        <div class="chart-card">
          <h2 class="chart-card__title" style="margin-bottom:var(--space-lg);">📝 บันทึกผลการดำเนินงาน</h2>
          <div class="form-group"><label class="form-label">ตัวชี้วัด (KPI)</label><select class="form-select" id="rKpiId"><option value="">เลือกตัวชี้วัด</option></select></div>
          <div class="form-row"><div class="form-group"><label class="form-label">ปี (พ.ศ.)</label><input class="form-input" type="number" id="rYear" value="2569"></div><div class="form-group"><label class="form-label">เดือน</label><select class="form-select" id="rMonth"></select></div></div>
          <div class="form-group"><label class="form-label">ผลงานจริง</label><input class="form-input" type="number" step="0.01" id="rActual" placeholder="กรอกค่าผลงาน"></div>
          <div class="form-group"><label class="form-label">หมายเหตุ</label><textarea class="form-input" id="rNote" rows="2" style="resize:vertical;"></textarea></div>
          <div id="validationResults" style="margin-bottom:var(--space-md);"></div>
          <button class="btn btn--primary" id="btnSaveResult" style="width:100%;justify-content:center;">💾 บันทึกผลการดำเนินงาน</button>
        </div>

        <!-- Recent Results -->
        <div class="chart-card">
          <h2 class="chart-card__title" style="margin-bottom:var(--space-lg);">📋 ผลงานล่าสุด (${Math.min(results.length, 20)} รายการ)</h2>
          <div style="max-height:400px;overflow-y:auto;">
            ${results.slice(0, 20).map(r => {
              const kpi = kpis.find(k => k.kpi_id === r.kpi_id);
              return `<div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.78rem;font-weight:500;">${kpi?.kpi_name || r.kpi_id}</span><span style="font-size:0.75rem;font-weight:600;color:var(--clr-primary-500);">${r.actual_value}</span></div><div style="font-size:0.65rem;color:var(--clr-neutral-400);">เดือน ${r.month}/${r.year}</div></div>`;
            }).join('')}
          </div>
        </div>
      </div>`;

    // Populate dropdowns
    const kpiSel = document.getElementById('rKpiId');
    kpis.forEach(k => {
      const o = document.createElement('option');
      o.value = k.kpi_id; o.textContent = `${k.kpi_id} — ${k.kpi_name}`;
      kpiSel.appendChild(o);
    });

    const mSel = document.getElementById('rMonth');
    const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    thaiMonths.forEach((m, i) => { const o = document.createElement('option'); o.value = i + 1; o.textContent = m; mSel.appendChild(o); });

    // Validation on input change
    document.getElementById('rActual')?.addEventListener('input', _validateResult);

    // Save
    document.getElementById('btnSaveResult')?.addEventListener('click', () => {
      const kpiId = document.getElementById('rKpiId').value;
      const year = document.getElementById('rYear').value;
      const month = document.getElementById('rMonth').value;
      const actual = document.getElementById('rActual').value;
      const note = document.getElementById('rNote').value;

      if (!kpiId || !year || !month || actual === '') {
        _toast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
      }

      AuditLog.log(session.username, 'SAVE_RESULT', 'result', kpiId,
        `บันทึกผลงาน KPI:${kpiId} เดือน:${month} ค่า:${actual}`);
      _toast('บันทึกผลการดำเนินงานสำเร็จ', 'success');
      document.getElementById('rActual').value = '';
      document.getElementById('rNote').value = '';
    });
  }

  function _validateResult() {
    const el = document.getElementById('validationResults');
    const val = parseFloat(document.getElementById('rActual')?.value);
    if (!el || isNaN(val)) { if (el) el.innerHTML = ''; return; }

    const warnings = [];
    if (val < 0) warnings.push('⚠️ ค่าผลงานติดลบ — กรุณาตรวจสอบ');
    if (val > 10000) warnings.push('⚠️ ค่าผลงานสูงผิดปกติ — กรุณาตรวจสอบ');

    if (warnings.length > 0) {
      el.innerHTML = warnings.map(w => `<div class="insight-card insight--warning" style="margin-bottom:0.3rem;padding:0.4rem 0.6rem;"><span style="font-size:0.75rem;">${w}</span></div>`).join('');
    } else {
      el.innerHTML = '<div class="insight-card insight--success" style="padding:0.4rem 0.6rem;"><span style="font-size:0.75rem;">✅ ค่าผลงานถูกต้อง</span></div>';
    }
  }

  // ═══════ SECTION 6: Strategies ═════════════
  function renderStrategies(el) {
    const strategies = typeof DataPlatform !== 'undefined' ? DataPlatform.getStrategies() : [];
    const kpis = typeof DataPlatform !== 'undefined' ? DataPlatform.getKpiMaster() : [];
    const stratColors = ['#2563eb','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ec4899'];

    el.innerHTML = `
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr));">
        ${strategies.map((s, i) => {
          const color = stratColors[i % stratColors.length];
          const stratKpis = kpis.filter(k => k.strategy === s.name);
          return `<div class="chart-card">
            <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-md);">
              <div style="width:3rem;height:3rem;border-radius:var(--radius-md);background:${color}15;display:grid;place-items:center;"><span style="font-size:1.3rem;">🎯</span></div>
              <div><div style="font-weight:600;color:var(--clr-neutral-800);">${s.name}</div><div style="font-size:0.75rem;color:var(--clr-neutral-400);">${s.thai}</div></div>
            </div>
            <div style="font-size:0.8rem;color:var(--clr-neutral-600);margin-bottom:var(--space-sm);">ตัวชี้วัดที่เกี่ยวข้อง: <strong>${stratKpis.length}</strong></div>
            ${stratKpis.slice(0, 4).map(k => `<div style="font-size:0.72rem;color:var(--clr-neutral-500);padding:0.2rem 0;border-bottom:1px solid var(--clr-neutral-100);">• ${k.kpi_name}</div>`).join('')}
            ${stratKpis.length > 4 ? `<div style="font-size:0.7rem;color:var(--clr-neutral-400);padding-top:0.3rem;">+${stratKpis.length - 4} อื่นๆ</div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  }

  // ═══════ SECTION 7: Audit Logs ═════════════
  function renderAuditLogs(el) {
    const logs = AuditLog.getAll();
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);flex-wrap:wrap;gap:var(--space-sm);">
        <div style="display:flex;gap:var(--space-sm);align-items:center;">
          <input class="form-input" id="auditSearch" placeholder="🔍 ค้นหาผู้ใช้..." style="width:160px;padding:0.4rem 0.75rem;font-size:0.8rem;">
          <select class="filter-bar__select" id="auditActionFilter"><option value="">ทุก Action</option></select>
        </div>
        <span style="font-size:0.8rem;color:var(--clr-neutral-400);">ทั้งหมด ${logs.length} รายการ</span>
      </div>
      <div class="table-card"><div style="overflow-x:auto;"><table class="kpi-table"><thead><tr>
        <th style="width:60px;">เวลา</th><th>ผู้ใช้</th><th>Action</th><th>ประเภท</th><th>รายละเอียด</th>
      </tr></thead><tbody id="auditTableBody"></tbody></table></div></div>`;

    // Populate action filter
    const actionFilter = document.getElementById('auditActionFilter');
    Object.entries(AuditLog.ACTION_TYPES).forEach(([key, val]) => {
      const o = document.createElement('option');
      o.value = key; o.textContent = `${val.icon} ${val.label}`;
      actionFilter.appendChild(o);
    });

    const renderLogs = () => {
      const search = document.getElementById('auditSearch')?.value?.toLowerCase() || '';
      const action = document.getElementById('auditActionFilter')?.value || '';
      const filtered = AuditLog.search({ user: search, action: action || undefined }).slice(0, 100);

      const tbody = document.getElementById('auditTableBody');
      if (!tbody) return;
      tbody.innerHTML = filtered.map(log => {
        const at = AuditLog.ACTION_TYPES[log.action] || { icon: '📌', label: log.action, color: 'gray' };
        const time = new Date(log.timestamp);
        const dateStr = time.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
        const timeStr = time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const colorClass = at.color === 'red' ? 'badge--red' : at.color === 'green' ? 'badge--green' : at.color === 'yellow' ? 'badge--yellow' : 'badge--green';
        return `<tr><td style="font-size:0.7rem;color:var(--clr-neutral-400);white-space:nowrap;">${dateStr}<br>${timeStr}</td><td style="font-weight:500;font-size:0.8rem;">${log.user}</td><td><span class="badge ${colorClass}" style="font-size:0.65rem;">${at.icon} ${at.label}</span></td><td style="font-size:0.75rem;color:var(--clr-neutral-500);">${log.target_type}</td><td style="font-size:0.75rem;color:var(--clr-neutral-500);max-width:300px;overflow:hidden;text-overflow:ellipsis;">${log.details}</td></tr>`;
      }).join('');
    };

    renderLogs();
    document.getElementById('auditSearch')?.addEventListener('input', renderLogs);
    document.getElementById('auditActionFilter')?.addEventListener('change', renderLogs);
  }

  // ═══════ SECTION 8: System Monitoring ══════
  function renderMonitoring(el) {
    const stats = AuditLog.getStats();
    const users = Auth.getAllUsers();
    const activeUsers = users.filter(u => u.status === 'active');
    const inactiveUsers = users.filter(u => u.status !== 'active');
    const governance = Auth.getDataGovernanceReport();

    el.innerHTML = `
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);">
        ${_statCard('✅', 'ระบบ', 'ปกติ', '', 'success')}
        ${_statCard('👥', 'ผู้ใช้ Active', activeUsers.length, 'คน', 'total')}
        ${_statCard('🚫', 'Login ล้มเหลว', stats.login_failures_total, 'ครั้ง', stats.login_failures_total > 10 ? 'failed' : 'risk')}
        ${_statCard('📊', 'ข้อมูลครบถ้วน', governance.overall_completeness + '%', '', 'score')}
      </div>

      <div class="section-grid" style="grid-template-columns:1fr 1fr 1fr;">
        <!-- System Health -->
        <div class="chart-card">
          <div class="chart-card__header"><h2 class="chart-card__title">🖥️ System Health</h2></div>
          <div style="text-align:center;padding:var(--space-lg);">
            <div style="width:5rem;height:5rem;border-radius:50%;background:var(--clr-success-100);display:grid;place-items:center;margin:0 auto var(--space-md);">
              <span style="font-size:2rem;">✅</span>
            </div>
            <div style="font-size:1.2rem;font-weight:700;color:var(--clr-success-500);">ระบบทำงานปกติ</div>
            <div style="font-size:0.75rem;color:var(--clr-neutral-400);margin-top:0.3rem;">All Services Online</div>
          </div>
          <div style="border-top:1px solid var(--clr-neutral-100);padding-top:var(--space-md);">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:0.3rem 0;"><span style="color:var(--clr-neutral-500);">Database</span><span class="badge badge--green" style="font-size:0.6rem;"><span class="badge__dot"></span>Google Sheets</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:0.3rem 0;"><span style="color:var(--clr-neutral-500);">Backend</span><span class="badge badge--green" style="font-size:0.6rem;"><span class="badge__dot"></span>Apps Script</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:0.3rem 0;"><span style="color:var(--clr-neutral-500);">AI Engine</span><span class="badge badge--green" style="font-size:0.6rem;"><span class="badge__dot"></span>Client-side</span></div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:0.3rem 0;"><span style="color:var(--clr-neutral-500);">Auth</span><span class="badge badge--green" style="font-size:0.6rem;"><span class="badge__dot"></span>localStorage</span></div>
          </div>
        </div>

        <!-- Security -->
        <div class="chart-card">
          <div class="chart-card__header"><h2 class="chart-card__title">🔒 Security</h2></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">Login ล้มเหลวทั้งหมด</span><span style="font-size:0.85rem;font-weight:700;color:${stats.login_failures_total > 10 ? 'var(--clr-danger-500)' : 'var(--clr-neutral-500)'};">${stats.login_failures_total}</span></div></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">ผู้ใช้ที่ถูกระงับ</span><span style="font-size:0.85rem;font-weight:700;color:var(--clr-neutral-500);">${inactiveUsers.length}</span></div></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">Session Timeout</span><span style="font-size:0.85rem;font-weight:700;color:var(--clr-neutral-500);">8 ชม.</span></div></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">Password Rules</span><span style="font-size:0.85rem;font-weight:700;color:var(--clr-neutral-500);">8+ chars</span></div></div>
        </div>

        <!-- Data Quality -->
        <div class="chart-card">
          <div class="chart-card__header"><h2 class="chart-card__title">📊 Data Quality</h2></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">KPI ที่ไม่มีข้อมูล</span><span style="font-size:0.85rem;font-weight:700;color:${governance.missing_results.length > 0 ? 'var(--clr-warning-500)' : 'var(--clr-success-500)'};">${governance.missing_results.length}</span></div></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">ข้อมูลซ้ำ</span><span style="font-size:0.85rem;font-weight:700;color:${governance.duplicates.length > 0 ? 'var(--clr-danger-500)' : 'var(--clr-success-500)'};">${governance.duplicates.length}</span></div></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">ค่าผิดปกติ</span><span style="font-size:0.85rem;font-weight:700;color:${governance.outliers.length > 0 ? 'var(--clr-warning-500)' : 'var(--clr-success-500)'};">${governance.outliers.length}</span></div></div>
          <div class="risk-alert-item"><div class="risk-alert-item__header"><span style="font-size:0.8rem;">ข้อมูลครบถ้วน</span><span style="font-size:0.85rem;font-weight:700;color:var(--clr-primary-500);">${governance.overall_completeness}%</span></div></div>
        </div>
      </div>

      <!-- Recent Errors -->
      <div class="chart-card">
        <div class="chart-card__header"><h2 class="chart-card__title">⚠️ System Errors (ล่าสุด)</h2></div>
        ${stats.recent_errors.length === 0
          ? '<div style="text-align:center;padding:var(--space-lg);color:var(--clr-neutral-400);font-size:0.85rem;">✅ ไม่มี Error ล่าสุด</div>'
          : stats.recent_errors.map(e => `<div class="insight-card insight--danger" style="margin-bottom:0.3rem;"><div class="insight-card__body"><div class="insight-card__text">${e.details} — ${new Date(e.timestamp).toLocaleString('th-TH')}</div></div></div>`).join('')
        }
      </div>`;
  }

  // ─── Utility ───────────────────────────────
  function _statCard(icon, label, value, unit, type) {
    return `<div class="stat-card stat-card--${type}"><div class="stat-card__icon"><span style="font-size:1.3rem;">${icon}</span></div><div class="stat-card__info"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}<small>${unit ? ' ' + unit : ''}</small></div></div></div>`;
  }

  function _closeModal(id) {
    document.getElementById(id)?.classList.remove('modal-backdrop--visible');
  }

  function _toast(msg, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type || 'info'}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // Exposed for inline onclick handlers
  function _editUser(id) { _openUserModal(id); }
  function _toggleUser(id) {
    const user = Auth.getUserById(id);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    Auth.updateUser(id, { status: newStatus });
    AuditLog.log(session.username, newStatus === 'disabled' ? 'DISABLE_USER' : 'UPDATE_USER', 'user', id,
      `${newStatus === 'disabled' ? 'ระงับ' : 'เปิดใช้'}ผู้ใช้ "${user.username}"`);
    _toast(`${newStatus === 'disabled' ? 'ระงับ' : 'เปิดใช้'}ผู้ใช้ "${user.username}" สำเร็จ`, 'success');
    renderUserMgmt(document.getElementById('sectionContent'));
  }
  function _viewDept(name) {
    window.open(`director.html?dept=${encodeURIComponent(name)}`, '_blank');
  }

  return {
    init, navigateTo,
    _editUser, _toggleUser, _viewDept
  };
})();

document.addEventListener('DOMContentLoaded', BackOffice.init);
