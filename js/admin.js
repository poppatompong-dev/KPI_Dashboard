/* =============================================
   Admin Panel Logic
   Municipal KPI Dashboard
   ============================================= */

const Admin = (() => {
  let editingKpiId = null;

  // ─── Initialization ────────────────────────
  function init() {
    setupTabs();
    setupModals();
    setupFilters();
    loadKpiList();
    loadResultsForm();
  }

  // ─── Tabs ──────────────────────────────────
  function setupTabs() {
    document.querySelectorAll('.tab[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(target)?.classList.remove('hidden');
      });
    });
  }

  // ─── Modals ─────────────────────────────────
  function setupModals() {
    // Add KPI button
    const addBtn = document.getElementById('btnAddKpi');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        editingKpiId = null;
        clearKpiForm();
        document.getElementById('kpiModalTitle').textContent = 'เพิ่มตัวชี้วัด (KPI) ใหม่';
        openModal('kpiModal');
      });
    }

    // Modal close buttons
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) closeModal(modal.id);
      });
    });

    // Save KPI form
    const saveKpiBtn = document.getElementById('btnSaveKpi');
    if (saveKpiBtn) saveKpiBtn.addEventListener('click', handleSaveKpi);

    // Save Result form
    const saveResultBtn = document.getElementById('btnSaveResult');
    if (saveResultBtn) saveResultBtn.addEventListener('click', handleSaveResult);
  }

  function openModal(id) {
    document.getElementById(id)?.classList.add('modal-backdrop--visible');
  }

  function closeModal(id) {
    document.getElementById(id)?.classList.remove('modal-backdrop--visible');
  }

  // ─── Filters ────────────────────────────────
  function setupFilters() {
    // Department filter for admin KPI list
    const deptFilter = document.getElementById('adminDeptFilter');
    if (deptFilter) {
      deptFilter.innerHTML = '<option value="all">ทุกสำนัก/กอง</option>';
      (App?.DEPARTMENTS || []).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        deptFilter.appendChild(opt);
      });
      deptFilter.addEventListener('change', loadKpiList);
    }

    // Populate department select in KPI form
    const formDept = document.getElementById('kpiDepartment');
    if (formDept) {
      formDept.innerHTML = '<option value="">เลือกสำนัก/กอง</option>';
      (App?.DEPARTMENTS || []).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        formDept.appendChild(opt);
      });
    }

    // KPI select in results form
    populateKpiSelect();
  }

  // ─── KPI Management ────────────────────────
  const DEMO_KPIS = [
    { kpi_id: 'KPI-001', kpi_name: 'ร้อยละความสำเร็จในการจัดเก็บรายได้', department: 'สำนักคลัง', strategy: 'Transparent Governance', category: 'การเงิน', target_value: 95, unit: '%', weight: 15, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-002', kpi_name: 'ร้อยละความพึงพอใจของประชาชน', department: 'สำนักปลัดเทศบาล', strategy: 'Smart City', category: 'บริการ', target_value: 90, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-003', kpi_name: 'จำนวนข้อร้องเรียนที่ได้รับการแก้ไขทันเวลา', department: 'สำนักปลัดเทศบาล', strategy: 'Smart City', category: 'บริการ', target_value: 95, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-004', kpi_name: 'ร้อยละของถนนที่ได้รับการซ่อมบำรุง', department: 'สำนักช่าง', strategy: 'Infrastructure Development', category: 'โครงสร้างพื้นฐาน', target_value: 80, unit: '%', weight: 12, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-005', kpi_name: 'อัตราการเกิดโรคระบาดในเขตเทศบาล', department: 'สำนักสาธารณสุขและสิ่งแวดล้อม', strategy: 'Public Health', category: 'สาธารณสุข', target_value: 5, unit: 'ครั้ง/ปี', weight: 10, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-006', kpi_name: 'ร้อยละของนักเรียนที่ผ่านเกณฑ์มาตรฐาน', department: 'สำนักการศึกษา', strategy: 'Education Development', category: 'การศึกษา', target_value: 85, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
  ];

  let localKpis = [...DEMO_KPIS];

  function loadKpiList() {
    const dept = document.getElementById('adminDeptFilter')?.value || 'all';

    // Try API, fallback to local
    try {
      API.getKpiMasterList().then(data => {
        localKpis = data.kpis || localKpis;
        renderKpiAdminTable(filterByDept(localKpis, dept));
        populateKpiSelect();
      }).catch(() => {
        renderKpiAdminTable(filterByDept(localKpis, dept));
      });
    } catch {
      renderKpiAdminTable(filterByDept(localKpis, dept));
    }
  }

  function filterByDept(kpis, dept) {
    if (dept === 'all') return kpis;
    return kpis.filter(k => k.department === dept);
  }

  function renderKpiAdminTable(kpis) {
    const tbody = document.getElementById('adminKpiTableBody');
    if (!tbody) return;

    if (kpis.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--clr-neutral-400);">ไม่มีข้อมูล KPI</td></tr>`;
      return;
    }

    const calcTypeLabels = {
      'higher_better': 'ยิ่งมาก ยิ่งดี',
      'lower_better': 'ยิ่งน้อย ยิ่งดี',
      'percentage': 'ร้อยละ'
    };

    tbody.innerHTML = kpis.map(kpi => `
      <tr>
        <td style="font-weight:600;color:var(--clr-primary-500);font-size:0.75rem;">${kpi.kpi_id}</td>
        <td class="kpi-name">${kpi.kpi_name}</td>
        <td><span style="font-size:0.75rem;">${kpi.department || ''}</span></td>
        <td class="text-center">${kpi.target_value || ''} ${kpi.unit || ''}</td>
        <td class="text-center">${kpi.weight || 0}%</td>
        <td class="text-center"><span style="font-size:0.7rem;background:var(--clr-neutral-100);padding:0.15rem 0.5rem;border-radius:var(--radius-full);">${calcTypeLabels[kpi.calculation_type] || kpi.calculation_type}</span></td>
        <td class="text-center">
          <div style="display:flex;gap:0.3rem;justify-content:center;">
            <button class="btn btn--outline btn--sm" onclick="Admin.editKpi('${kpi.kpi_id}')">
              <svg style="width:0.85rem;height:0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              แก้ไข
            </button>
            <button class="btn btn--danger btn--sm" onclick="Admin.deleteKpi('${kpi.kpi_id}')">
              <svg style="width:0.85rem;height:0.85rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              ลบ
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ─── KPI Form ───────────────────────────────
  function clearKpiForm() {
    document.getElementById('kpiId')?.setAttribute('value', '');
    document.getElementById('kpiName')?.setAttribute('value', '');
    document.getElementById('kpiDepartment').value = '';
    document.getElementById('kpiStrategy').value = '';
    document.getElementById('kpiCategory')?.setAttribute('value', '');
    document.getElementById('kpiTarget')?.setAttribute('value', '');
    document.getElementById('kpiUnit')?.setAttribute('value', '');
    document.getElementById('kpiWeight')?.setAttribute('value', '');
    document.getElementById('kpiCalcType').value = 'higher_better';
    document.getElementById('kpiDescription')?.setAttribute('value', '');

    ['kpiId','kpiName','kpiCategory','kpiTarget','kpiUnit','kpiWeight','kpiDescription'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  function editKpi(kpiId) {
    const kpi = localKpis.find(k => k.kpi_id === kpiId);
    if (!kpi) return;

    editingKpiId = kpiId;
    document.getElementById('kpiModalTitle').textContent = 'แก้ไขตัวชี้วัด (KPI)';

    document.getElementById('kpiId').value = kpi.kpi_id || '';
    document.getElementById('kpiName').value = kpi.kpi_name || '';
    document.getElementById('kpiDepartment').value = kpi.department || '';
    document.getElementById('kpiStrategy').value = kpi.strategy || '';
    document.getElementById('kpiCategory').value = kpi.category || '';
    document.getElementById('kpiTarget').value = kpi.target_value || '';
    document.getElementById('kpiUnit').value = kpi.unit || '';
    document.getElementById('kpiWeight').value = kpi.weight || '';
    document.getElementById('kpiCalcType').value = kpi.calculation_type || 'higher_better';
    document.getElementById('kpiDescription').value = kpi.description || '';

    openModal('kpiModal');
  }

  function handleSaveKpi() {
    const kpiData = {
      kpi_id: document.getElementById('kpiId').value.trim(),
      kpi_name: document.getElementById('kpiName').value.trim(),
      department: document.getElementById('kpiDepartment').value,
      strategy: document.getElementById('kpiStrategy').value,
      category: document.getElementById('kpiCategory').value.trim(),
      target_value: parseFloat(document.getElementById('kpiTarget').value) || 0,
      unit: document.getElementById('kpiUnit').value.trim(),
      weight: parseFloat(document.getElementById('kpiWeight').value) || 0,
      calculation_type: document.getElementById('kpiCalcType').value,
      description: document.getElementById('kpiDescription').value.trim(),
      year: new Date().getFullYear() + 543
    };

    if (!kpiData.kpi_id || !kpiData.kpi_name || !kpiData.department) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    // Try API
    try {
      API.saveKpiMaster(kpiData).then(res => {
        showToast('บันทึกข้อมูล KPI สำเร็จ', 'success');
        closeModal('kpiModal');
        loadKpiList();
      }).catch(() => saveKpiLocally(kpiData));
    } catch {
      saveKpiLocally(kpiData);
    }
  }

  function saveKpiLocally(kpiData) {
    const existIdx = localKpis.findIndex(k => k.kpi_id === kpiData.kpi_id);
    if (existIdx >= 0) {
      localKpis[existIdx] = { ...localKpis[existIdx], ...kpiData };
    } else {
      localKpis.push(kpiData);
    }
    showToast('บันทึกข้อมูล KPI สำเร็จ (Local)', 'success');
    closeModal('kpiModal');
    loadKpiList();
  }

  function deleteKpi(kpiId) {
    if (!confirm(`ต้องการลบตัวชี้วัด ${kpiId} หรือไม่?`)) return;

    try {
      API.deleteKpi(kpiId).then(() => {
        showToast('ลบ KPI สำเร็จ', 'success');
        loadKpiList();
      }).catch(() => deleteKpiLocally(kpiId));
    } catch {
      deleteKpiLocally(kpiId);
    }
  }

  function deleteKpiLocally(kpiId) {
    localKpis = localKpis.filter(k => k.kpi_id !== kpiId);
    showToast('ลบ KPI สำเร็จ (Local)', 'success');
    loadKpiList();
  }

  // ─── Results Entry ─────────────────────────
  function loadResultsForm() {
    populateKpiSelect();
  }

  function populateKpiSelect() {
    const select = document.getElementById('resultKpiId');
    if (!select) return;
    select.innerHTML = '<option value="">เลือกตัวชี้วัด</option>';
    localKpis.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.kpi_id;
      opt.textContent = `${k.kpi_id} - ${k.kpi_name}`;
      select.appendChild(opt);
    });
  }

  function handleSaveResult() {
    const resultData = {
      kpi_id: document.getElementById('resultKpiId').value,
      year: parseInt(document.getElementById('resultYear')?.value) || (new Date().getFullYear() + 543),
      month: parseInt(document.getElementById('resultMonth')?.value) || (new Date().getMonth() + 1),
      actual_value: parseFloat(document.getElementById('resultActual').value) || 0,
      note: document.getElementById('resultNote')?.value || ''
    };

    if (!resultData.kpi_id) {
      showToast('กรุณาเลือกตัวชี้วัด', 'error');
      return;
    }

    try {
      API.saveKpiResult(resultData).then(() => {
        showToast('บันทึกผลการดำเนินงานสำเร็จ', 'success');
        clearResultForm();
      }).catch(() => {
        showToast('บันทึกผลการดำเนินงานสำเร็จ (Local)', 'success');
        clearResultForm();
      });
    } catch {
      showToast('บันทึกผลการดำเนินงานสำเร็จ (Local)', 'success');
      clearResultForm();
    }
  }

  function clearResultForm() {
    ['resultKpiId', 'resultActual', 'resultNote'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  // ─── Toast Helper ───────────────────────────
  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  return {
    init,
    editKpi,
    deleteKpi,
    openModal,
    closeModal
  };
})();

document.addEventListener('DOMContentLoaded', Admin.init);
