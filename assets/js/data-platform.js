/* =============================================
   Municipal Data Platform
   Extended data model with 50 KPIs across
   11 departments for realistic simulation
   ============================================= */

const DataPlatform = (() => {

  // ─── Departments ───────────────────────────
  const DEPARTMENTS = [
    { id: 'DEPT-01', name: 'สำนักปลัดเทศบาล', short: 'สนป.', division: 'สำนัก' },
    { id: 'DEPT-02', name: 'สำนักช่าง', short: 'สช.', division: 'สำนัก' },
    { id: 'DEPT-03', name: 'สำนักคลัง', short: 'สค.', division: 'สำนัก' },
    { id: 'DEPT-04', name: 'สำนักสาธารณสุขและสิ่งแวดล้อม', short: 'สสส.', division: 'สำนัก' },
    { id: 'DEPT-05', name: 'สำนักการศึกษา', short: 'สกศ.', division: 'สำนัก' },
    { id: 'DEPT-06', name: 'สำนักการประปา', short: 'สปป.', division: 'สำนัก' },
    { id: 'DEPT-07', name: 'กองยุทธศาสตร์และงบประมาณ', short: 'กยง.', division: 'กอง' },
    { id: 'DEPT-08', name: 'กองสวัสดิการสังคม', short: 'กสส.', division: 'กอง' },
    { id: 'DEPT-09', name: 'กองสารสนเทศภาษีและทรัพย์สิน', short: 'กสภ.', division: 'กอง' },
    { id: 'DEPT-10', name: 'กองการเจ้าหน้าที่', short: 'กจ.', division: 'กอง' },
    { id: 'DEPT-11', name: 'หน่วยตรวจสอบภายใน', short: 'ตสน.', division: 'หน่วย' }
  ];

  const STRATEGIES = [
    { id: 'STRAT-01', name: 'Smart City', thai: 'เมืองอัจฉริยะ' },
    { id: 'STRAT-02', name: 'Infrastructure Development', thai: 'พัฒนาโครงสร้างพื้นฐาน' },
    { id: 'STRAT-03', name: 'Public Health', thai: 'สาธารณสุขและคุณภาพชีวิต' },
    { id: 'STRAT-04', name: 'Education Development', thai: 'พัฒนาการศึกษา' },
    { id: 'STRAT-05', name: 'Transparent Governance', thai: 'ธรรมาภิบาล' },
    { id: 'STRAT-06', name: 'Environmental Sustainability', thai: 'สิ่งแวดล้อมยั่งยืน' }
  ];

  const ROLES = {
    EXECUTIVE: { label: 'ผู้บริหาร', level: 1, canViewAll: true },
    DIRECTOR: { label: 'ผู้อำนวยการ', level: 2, canViewAll: false },
    STAFF: { label: 'เจ้าหน้าที่', level: 3, canViewAll: false }
  };

  // ─── 50 KPIs across all departments ────────
  const KPI_MASTER = [
    // --- สำนักปลัดเทศบาล (5 KPIs) ---
    { kpi_id: 'KPI-001', kpi_name: 'ร้อยละความพึงพอใจของประชาชน', department: 'สำนักปลัดเทศบาล', strategy: 'Smart City', category: 'บริการ', target_value: 90, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-002', kpi_name: 'ร้อยละของข้อร้องเรียนที่ได้รับการแก้ไขภายใน 7 วัน', department: 'สำนักปลัดเทศบาล', strategy: 'Smart City', category: 'บริการ', target_value: 95, unit: '%', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-003', kpi_name: 'จำนวนครั้งการให้บริการ One Stop Service', department: 'สำนักปลัดเทศบาล', strategy: 'Smart City', category: 'บริการ', target_value: 5000, unit: 'ครั้ง', weight: 5, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-004', kpi_name: 'ร้อยละการดำเนินงานตามแผนปฏิบัติราชการ', department: 'สำนักปลัดเทศบาล', strategy: 'Transparent Governance', category: 'แผนงาน', target_value: 100, unit: '%', weight: 7, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-005', kpi_name: 'คะแนน ITA (ดัชนีความโปร่งใส)', department: 'สำนักปลัดเทศบาล', strategy: 'Transparent Governance', category: 'ธรรมาภิบาล', target_value: 85, unit: 'คะแนน', weight: 6, calculation_type: 'higher_better', year: 2569 },

    // --- สำนักช่าง (5 KPIs) ---
    { kpi_id: 'KPI-006', kpi_name: 'ร้อยละของถนนที่ได้รับการซ่อมบำรุง', department: 'สำนักช่าง', strategy: 'Infrastructure Development', category: 'โครงสร้างพื้นฐาน', target_value: 85, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-007', kpi_name: 'ระยะเวลาเฉลี่ยการอนุญาตก่อสร้าง', department: 'สำนักช่าง', strategy: 'Smart City', category: 'บริการ', target_value: 15, unit: 'วัน', weight: 7, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-008', kpi_name: 'จำนวนโครงการก่อสร้างที่แล้วเสร็จตามแผน', department: 'สำนักช่าง', strategy: 'Infrastructure Development', category: 'โครงการ', target_value: 20, unit: 'โครงการ', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-009', kpi_name: 'ความยาวถนนที่ปรับปรุง', department: 'สำนักช่าง', strategy: 'Infrastructure Development', category: 'โครงสร้างพื้นฐาน', target_value: 50, unit: 'กม.', weight: 6, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-010', kpi_name: 'ร้อยละไฟฟ้าสาธารณะที่ใช้งานได้', department: 'สำนักช่าง', strategy: 'Infrastructure Development', category: 'โครงสร้างพื้นฐาน', target_value: 98, unit: '%', weight: 5, calculation_type: 'higher_better', year: 2569 },

    // --- สำนักคลัง (5 KPIs) ---
    { kpi_id: 'KPI-011', kpi_name: 'ร้อยละความสำเร็จในการจัดเก็บรายได้', department: 'สำนักคลัง', strategy: 'Transparent Governance', category: 'การเงิน', target_value: 95, unit: '%', weight: 12, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-012', kpi_name: 'ร้อยละการเบิกจ่ายงบลงทุน', department: 'สำนักคลัง', strategy: 'Transparent Governance', category: 'งบประมาณ', target_value: 80, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-013', kpi_name: 'จำนวนวันเฉลี่ยในการเบิกจ่าย', department: 'สำนักคลัง', strategy: 'Transparent Governance', category: 'การเงิน', target_value: 5, unit: 'วัน', weight: 6, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-014', kpi_name: 'ร้อยละความถูกต้องของบัญชี', department: 'สำนักคลัง', strategy: 'Transparent Governance', category: 'การเงิน', target_value: 100, unit: '%', weight: 5, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-015', kpi_name: 'รายได้จัดเก็บเอง (ล้านบาท)', department: 'สำนักคลัง', strategy: 'Transparent Governance', category: 'การเงิน', target_value: 500, unit: 'ล้านบาท', weight: 8, calculation_type: 'higher_better', year: 2569 },

    // --- สำนักสาธารณสุขฯ (5 KPIs) ---
    { kpi_id: 'KPI-016', kpi_name: 'อัตราการเกิดโรคระบาดในเขตเทศบาล', department: 'สำนักสาธารณสุขและสิ่งแวดล้อม', strategy: 'Public Health', category: 'สาธารณสุข', target_value: 5, unit: 'ครั้ง/ปี', weight: 10, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-017', kpi_name: 'ร้อยละของร้านอาหารที่ผ่านมาตรฐาน', department: 'สำนักสาธารณสุขและสิ่งแวดล้อม', strategy: 'Public Health', category: 'สาธารณสุข', target_value: 90, unit: '%', weight: 7, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-018', kpi_name: 'ปริมาณขยะที่นำกลับมาใช้ประโยชน์', department: 'สำนักสาธารณสุขและสิ่งแวดล้อม', strategy: 'Environmental Sustainability', category: 'สิ่งแวดล้อม', target_value: 30, unit: '%', weight: 6, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-019', kpi_name: 'คุณภาพอากาศ PM2.5 (เฉลี่ยวัน)', department: 'สำนักสาธารณสุขและสิ่งแวดล้อม', strategy: 'Environmental Sustainability', category: 'สิ่งแวดล้อม', target_value: 50, unit: 'μg/m³', weight: 8, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-020', kpi_name: 'ร้อยละการควบคุมสัตว์จรจัด', department: 'สำนักสาธารณสุขและสิ่งแวดล้อม', strategy: 'Public Health', category: 'สาธารณสุข', target_value: 80, unit: '%', weight: 4, calculation_type: 'higher_better', year: 2569 },

    // --- สำนักการศึกษา (5 KPIs) ---
    { kpi_id: 'KPI-021', kpi_name: 'ร้อยละนักเรียนที่ผ่านเกณฑ์มาตรฐาน', department: 'สำนักการศึกษา', strategy: 'Education Development', category: 'การศึกษา', target_value: 85, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-022', kpi_name: 'อัตราการเข้าเรียนเฉลี่ย', department: 'สำนักการศึกษา', strategy: 'Education Development', category: 'การศึกษา', target_value: 95, unit: '%', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-023', kpi_name: 'จำนวนห้องเรียนดิจิทัล', department: 'สำนักการศึกษา', strategy: 'Smart City', category: 'การศึกษา', target_value: 50, unit: 'ห้อง', weight: 5, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-024', kpi_name: 'อัตราส่วนครูต่อนักเรียน', department: 'สำนักการศึกษา', strategy: 'Education Development', category: 'บุคลากร', target_value: 25, unit: '1:n', weight: 5, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-025', kpi_name: 'ร้อยละของโรงเรียนที่ผ่านเกณฑ์ประกัน', department: 'สำนักการศึกษา', strategy: 'Education Development', category: 'การศึกษา', target_value: 100, unit: '%', weight: 7, calculation_type: 'higher_better', year: 2569 },

    // --- สำนักการประปา (4 KPIs) ---
    { kpi_id: 'KPI-026', kpi_name: 'ร้อยละน้ำประปาที่ผ่านเกณฑ์คุณภาพ', department: 'สำนักการประปา', strategy: 'Environmental Sustainability', category: 'สาธารณูปโภค', target_value: 98, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-027', kpi_name: 'อัตราน้ำสูญเสีย', department: 'สำนักการประปา', strategy: 'Environmental Sustainability', category: 'สาธารณูปโภค', target_value: 25, unit: '%', weight: 8, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-028', kpi_name: 'จำนวนชั่วโมงน้ำไม่ไหลสะสม', department: 'สำนักการประปา', strategy: 'Infrastructure Development', category: 'สาธารณูปโภค', target_value: 24, unit: 'ชม./ปี', weight: 7, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-029', kpi_name: 'ครัวเรือนที่มีน้ำประปาใช้', department: 'สำนักการประปา', strategy: 'Infrastructure Development', category: 'สาธารณูปโภค', target_value: 98, unit: '%', weight: 6, calculation_type: 'higher_better', year: 2569 },

    // --- กองยุทธศาสตร์ (4 KPIs) ---
    { kpi_id: 'KPI-030', kpi_name: 'ร้อยละการเบิกจ่ายงบประมาณรวม', department: 'กองยุทธศาสตร์และงบประมาณ', strategy: 'Transparent Governance', category: 'งบประมาณ', target_value: 95, unit: '%', weight: 10, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-031', kpi_name: 'จำนวนโครงการยุทธศาสตร์ที่ดำเนินการ', department: 'กองยุทธศาสตร์และงบประมาณ', strategy: 'Smart City', category: 'แผนงาน', target_value: 30, unit: 'โครงการ', weight: 7, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-032', kpi_name: 'ร้อยละความสอดคล้องแผนกับยุทธศาสตร์', department: 'กองยุทธศาสตร์และงบประมาณ', strategy: 'Transparent Governance', category: 'แผนงาน', target_value: 100, unit: '%', weight: 5, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-033', kpi_name: 'ร้อยละการติดตามประเมินผลโครงการ', department: 'กองยุทธศาสตร์และงบประมาณ', strategy: 'Transparent Governance', category: 'การประเมิน', target_value: 100, unit: '%', weight: 5, calculation_type: 'higher_better', year: 2569 },

    // --- กองสวัสดิการสังคม (4 KPIs) ---
    { kpi_id: 'KPI-034', kpi_name: 'จำนวนครัวเรือนที่ได้รับสวัสดิการ', department: 'กองสวัสดิการสังคม', strategy: 'Public Health', category: 'สวัสดิการ', target_value: 800, unit: 'ครัวเรือน', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-035', kpi_name: 'ร้อยละผู้สูงอายุที่ได้รับเบี้ยยังชีพ', department: 'กองสวัสดิการสังคม', strategy: 'Public Health', category: 'สวัสดิการ', target_value: 100, unit: '%', weight: 7, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-036', kpi_name: 'จำนวนกิจกรรมชุมชนที่จัดขึ้น', department: 'กองสวัสดิการสังคม', strategy: 'Public Health', category: 'ชุมชน', target_value: 24, unit: 'กิจกรรม', weight: 4, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-037', kpi_name: 'ร้อยละผู้พิการที่ได้รับการสนับสนุน', department: 'กองสวัสดิการสังคม', strategy: 'Public Health', category: 'สวัสดิการ', target_value: 100, unit: '%', weight: 6, calculation_type: 'higher_better', year: 2569 },

    // --- กองสารสนเทศภาษี (4 KPIs) ---
    { kpi_id: 'KPI-038', kpi_name: 'ร้อยละความครบถ้วนฐานข้อมูลภาษี', department: 'กองสารสนเทศภาษีและทรัพย์สิน', strategy: 'Smart City', category: 'ข้อมูล', target_value: 100, unit: '%', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-039', kpi_name: 'จำนวนแปลงที่ดินที่สำรวจ', department: 'กองสารสนเทศภาษีและทรัพย์สิน', strategy: 'Transparent Governance', category: 'สำรวจ', target_value: 10000, unit: 'แปลง', weight: 6, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-040', kpi_name: 'ร้อยละการจัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง', department: 'กองสารสนเทศภาษีและทรัพย์สิน', strategy: 'Transparent Governance', category: 'การเงิน', target_value: 90, unit: '%', weight: 7, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-041', kpi_name: 'ร้อยละทรัพย์สินที่มีข้อมูลดิจิทัล', department: 'กองสารสนเทศภาษีและทรัพย์สิน', strategy: 'Smart City', category: 'ข้อมูล', target_value: 80, unit: '%', weight: 4, calculation_type: 'higher_better', year: 2569 },

    // --- กองการเจ้าหน้าที่ (4 KPIs) ---
    { kpi_id: 'KPI-042', kpi_name: 'อัตราการลาออกของพนักงาน', department: 'กองการเจ้าหน้าที่', strategy: 'Transparent Governance', category: 'บุคลากร', target_value: 5, unit: '%', weight: 7, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-043', kpi_name: 'ร้อยละพนักงานที่ผ่านการอบรม', department: 'กองการเจ้าหน้าที่', strategy: 'Transparent Governance', category: 'บุคลากร', target_value: 80, unit: '%', weight: 6, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-044', kpi_name: 'ร้อยละอัตรากำลังที่ครบถ้วน', department: 'กองการเจ้าหน้าที่', strategy: 'Transparent Governance', category: 'บุคลากร', target_value: 90, unit: '%', weight: 5, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-045', kpi_name: 'คะแนนความผูกพันของพนักงาน', department: 'กองการเจ้าหน้าที่', strategy: 'Transparent Governance', category: 'บุคลากร', target_value: 80, unit: 'คะแนน', weight: 5, calculation_type: 'higher_better', year: 2569 },

    // --- หน่วยตรวจสอบภายใน (5 KPIs) ---
    { kpi_id: 'KPI-046', kpi_name: 'จำนวนข้อสังเกตจากการตรวจสอบ', department: 'หน่วยตรวจสอบภายใน', strategy: 'Transparent Governance', category: 'ธรรมาภิบาล', target_value: 10, unit: 'ข้อ', weight: 6, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-047', kpi_name: 'ร้อยละหน่วยงานที่ได้รับการตรวจสอบ', department: 'หน่วยตรวจสอบภายใน', strategy: 'Transparent Governance', category: 'ธรรมาภิบาล', target_value: 100, unit: '%', weight: 8, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-048', kpi_name: 'ร้อยละข้อเสนอแนะที่ได้รับการปฏิบัติ', department: 'หน่วยตรวจสอบภายใน', strategy: 'Transparent Governance', category: 'ธรรมาภิบาล', target_value: 90, unit: '%', weight: 5, calculation_type: 'higher_better', year: 2569 },
    { kpi_id: 'KPI-049', kpi_name: 'ระยะเวลาเฉลี่ยในการออกรายงาน', department: 'หน่วยตรวจสอบภายใน', strategy: 'Transparent Governance', category: 'ธรรมาภิบาล', target_value: 30, unit: 'วัน', weight: 4, calculation_type: 'lower_better', year: 2569 },
    { kpi_id: 'KPI-050', kpi_name: 'คะแนนความเสี่ยงองค์กรโดยรวม', department: 'หน่วยตรวจสอบภายใน', strategy: 'Transparent Governance', category: 'ธรรมาภิบาล', target_value: 20, unit: 'คะแนน', weight: 5, calculation_type: 'lower_better', year: 2569 },
  ];

  // ─── Generate 6 months of realistic results ─
  function generateMonthlyResults() {
    const results = [];
    // Seed-based pseudo-random for consistent demo data
    const seed = (kpiIdx, month) => {
      const x = Math.sin(kpiIdx * 127.1 + month * 311.7) * 43758.5453;
      return x - Math.floor(x); // 0-1
    };

    KPI_MASTER.forEach((kpi, kpiIdx) => {
      for (let m = 1; m <= 6; m++) {
        const r = seed(kpiIdx, m);
        const target = kpi.target_value;
        let actual;

        if (kpi.calculation_type === 'lower_better') {
          // Actual should be around or above target (lower is better)
          const variance = target * 0.4;
          actual = target + (r - 0.5) * variance;
          // Add slight trend: some improve, some worsen
          if (kpiIdx % 3 === 0) actual += m * 0.5; // worsening
          else actual -= m * 0.3; // improving
          actual = Math.max(0, Math.round(actual * 10) / 10);
        } else {
          // higher_better: actual should be around target
          const variance = target * 0.15;
          const basePerformance = target * (0.85 + r * 0.25);
          actual = basePerformance + (m - 1) * (target * 0.02 * (r > 0.3 ? 1 : -1));
          actual = Math.max(0, Math.round(actual * 10) / 10);
        }

        results.push({
          record_id: `REC-${kpi.kpi_id}-2569-${String(m).padStart(2, '0')}`,
          kpi_id: kpi.kpi_id,
          year: 2569,
          quarter: m <= 3 ? 2 : 3,
          month: m,
          actual_value: actual,
          note: '',
          updated_at: `2026-${String(m).padStart(2, '0')}-15`
        });
      }
    });

    return results;
  }

  // ─── Data Access Methods ───────────────────

  function getKpiMaster() { return [...KPI_MASTER]; }
  function getDepartments() { return [...DEPARTMENTS]; }
  function getStrategies() { return [...STRATEGIES]; }
  function getResults() { return generateMonthlyResults(); }

  /**
   * Get scored KPIs for a specific month
   */
  function getScoredKpis(month) {
    const results = generateMonthlyResults();
    return KPI_MASTER.map(master => {
      const result = results.find(r => r.kpi_id === master.kpi_id && r.month === month);
      const actual = result ? result.actual_value : null;
      const scoreResult = ScoringEngine.calculateKpiScore(
        master.target_value, actual, master.weight, master.calculation_type
      );
      return { ...master, actual_value: actual, ...scoreResult };
    });
  }

  /**
   * Get scored KPIs filtered by department
   */
  function getDeptKpis(department, month) {
    return getScoredKpis(month).filter(k => k.department === department);
  }

  /**
   * Build full analysis data package
   */
  function buildAnalysisPackage(month, department) {
    const allKpis = getScoredKpis(month);
    const allResults = generateMonthlyResults();
    const filtered = department && department !== 'all'
      ? allKpis.filter(k => k.department === department)
      : allKpis;

    // Run AI analysis
    const analysis = AIEngine.runFullAnalysis(filtered, allResults);

    // Build trend data
    const trendData = buildTrendData(month);

    return {
      ...analysis,
      kpiList: filtered,
      allKpiList: allKpis,
      trendData,
      historicalData: allResults
    };
  }

  function buildTrendData(upToMonth) {
    const labels = [];
    const targetAvgs = [];
    const actualAvgs = [];
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    for (let m = 1; m <= Math.min(upToMonth || 6, 12); m++) {
      const scored = getScoredKpis(m);
      if (scored.length === 0) continue;

      labels.push(thaiMonths[m - 1]);

      const avgScore = scored.reduce((s, k) => s + (k.score || 0), 0) / scored.length;
      actualAvgs.push(Math.round(avgScore * 10) / 10);
      targetAvgs.push(100);
    }

    return { labels, target: targetAvgs, actual: actualAvgs };
  }

  return {
    DEPARTMENTS,
    STRATEGIES,
    ROLES,
    KPI_MASTER,
    getKpiMaster,
    getDepartments,
    getStrategies,
    getResults,
    getScoredKpis,
    getDeptKpis,
    buildAnalysisPackage,
    buildTrendData,
    generateMonthlyResults
  };
})();
