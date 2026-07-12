// Raw departments metadata representing 41 curated clinics as specified by the user
// - Mỗi khối tương ứng với 1 Tòa nhà (Tòa A -> F)
// - Mỗi tầng có 2 đến 4 khoa
export const DEPARTMENTS_RAW = [
  // 1. Khối Tiếp nhận & Cấp cứu (Tòa A)
  { id: 'K_KB', name: 'Khoa Khám bệnh', category: 'Khối Tiếp nhận & Cấp cứu', toa: 'A', floor: 1, blockBase: 10 },
  { id: 'K_CC', name: 'Khoa Cấp cứu', category: 'Khối Tiếp nhận & Cấp cứu', toa: 'A', floor: 1, blockBase: 20 },
  { id: 'K_PHARMACY', name: 'Quầy Phát Thuốc Ngoại Trú', category: 'Khối Tiếp nhận & Cấp cứu', toa: 'A', floor: 1, blockBase: 90 }, // Near Exit

  // 2. Khối Nội khoa (Tòa B - 13 khoa)
  { id: 'K_LAO', name: 'Khoa Lão', category: 'Khối Nội khoa', toa: 'B', floor: 1, blockBase: 10 },
  { id: 'K_LOCMAU', name: 'Khoa Lọc máu', category: 'Khối Nội khoa', toa: 'B', floor: 1, blockBase: 20 },
  { id: 'K_DD', name: 'Khoa Dinh dưỡng', category: 'Khối Nội khoa', toa: 'B', floor: 1, blockBase: 30 },

  { id: 'K_NHH', name: 'Khoa Nội hô hấp', category: 'Khối Nội khoa', toa: 'B', floor: 2, blockBase: 10 },
  { id: 'K_YHCT', name: 'Khoa Y học cổ truyền', category: 'Khối Nội khoa', toa: 'B', floor: 2, blockBase: 20 },
  { id: 'K_NTT', name: 'Khoa Nội tiết - Thận', category: 'Khối Nội khoa', toa: 'B', floor: 2, blockBase: 30 },

  { id: 'K_NTIM', name: 'Khoa Nội Tim mạch', category: 'Khối Nội khoa', toa: 'B', floor: 3, blockBase: 10 },
  { id: 'K_HSTC', name: 'Khoa Hồi sức tích cực - Chống độc', category: 'Khối Nội khoa', toa: 'B', floor: 3, blockBase: 20 },
  { id: 'K_HSTM', name: 'Khoa Hồi sức tim mạch', category: 'Khối Nội khoa', toa: 'B', floor: 3, blockBase: 30 },

  { id: 'K_NTH', name: 'Khoa Nội Tiêu hóa', category: 'Khối Nội khoa', toa: 'B', floor: 4, blockBase: 10 },
  { id: 'K_NTK', name: 'Khoa Nội Thần kinh', category: 'Khối Nội khoa', toa: 'B', floor: 4, blockBase: 20 },
  { id: 'K_NCXK', name: 'Khoa Nội cơ xương khớp', category: 'Khối Nội khoa', toa: 'B', floor: 4, blockBase: 30 },

  // 3. Khối Ngoại khoa (Tòa C - 10 khoa)
  { id: 'K_THOP', name: 'Khoa Tổng hợp', category: 'Khối Ngoại khoa', toa: 'C', floor: 1, blockBase: 10 },
  { id: 'K_VLTL', name: 'Khoa Vật lý trị liệu - Phục hồi chức năng', category: 'Khối Ngoại khoa', toa: 'C', floor: 1, blockBase: 20 },

  { id: 'K_NGTK', name: 'Khoa Ngoại thần kinh', category: 'Khối Ngoại khoa', toa: 'C', floor: 2, blockBase: 10 },
  { id: 'K_NGTH', name: 'Khoa Ngoại tiêu hóa', category: 'Khối Ngoại khoa', toa: 'C', floor: 2, blockBase: 20 },
  { id: 'K_NGGMT', name: 'Khoa Ngoại Gan - Mật - Tụy', category: 'Khối Ngoại khoa', toa: 'C', floor: 2, blockBase: 30 },

  { id: 'K_NGCT', name: 'Khoa Ngoại chấn thương chỉnh hình', category: 'Khối Ngoại khoa', toa: 'C', floor: 3, blockBase: 10 },
  { id: 'K_NGTN', name: 'Khoa Ngoại Thận - Tiết niệu', category: 'Khối Ngoại khoa', toa: 'C', floor: 3, blockBase: 20 },

  { id: 'K_PTT', name: 'Khoa Phẫu thuật tim', category: 'Khối Ngoại khoa', toa: 'C', floor: 4, blockBase: 10 },
  { id: 'K_GMHS', name: 'Khoa Gây mê hồi sức', category: 'Khối Ngoại khoa', toa: 'C', floor: 4, blockBase: 20 },
  { id: 'K_NGLN', name: 'Khoa Ngoại lồng ngực - Mạch máu', category: 'Khối Ngoại khoa', toa: 'C', floor: 4, blockBase: 30 },

  // 4. Khối Sản - Nhi (Tòa D - 6 khoa)
  { id: 'K_SANTH', name: 'Khoa Sản thường', category: 'Khối Sản - Nhi', toa: 'D', floor: 1, blockBase: 10 },
  { id: 'K_SANB', name: 'Khoa Sản bệnh', category: 'Khối Sản - Nhi', toa: 'D', floor: 1, blockBase: 20 },

  { id: 'K_SANPHU', name: 'Khoa Sản phụ', category: 'Khối Sản - Nhi', toa: 'D', floor: 2, blockBase: 10 },
  { id: 'K_SANH', name: 'Khoa Sanh', category: 'Khối Sản - Nhi', toa: 'D', floor: 2, blockBase: 20 },

  { id: 'K_NHI', name: 'Khoa Nhi', category: 'Khối Sản - Nhi', toa: 'D', floor: 3, blockBase: 10 },
  { id: 'K_BLSS', name: 'Khoa Bệnh lý sơ sinh', category: 'Khối Sản - Nhi', toa: 'D', floor: 3, blockBase: 20 },

  // 5. Khối Chuyên khoa (Tòa E - 3 khoa)
  { id: 'K_MAT', name: 'Khoa Mắt', category: 'Khối Chuyên khoa & Dịch vụ tổng hợp', toa: 'E', floor: 1, blockBase: 10 },
  { id: 'K_RHM', name: 'Khoa Răng Hàm Mặt', category: 'Khối Chuyên khoa & Dịch vụ tổng hợp', toa: 'E', floor: 1, blockBase: 20 },
  { id: 'K_TMH', name: 'Khoa Tai Mũi Họng', category: 'Khối Chuyên khoa & Dịch vụ tổng hợp', toa: 'E', floor: 1, blockBase: 30 },

  // 6. Khối Cận lâm sàng (Tòa F - 7 khoa)
  { id: 'K_CDHA', name: 'Khoa Chẩn đoán hình ảnh', category: 'Khối Cận Lâm Sàng', toa: 'F', floor: 1, blockBase: 10 },
  { id: 'K_SHHH', name: 'Khoa Sinh hóa Huyết học', category: 'Khối Cận Lâm Sàng', toa: 'F', floor: 1, blockBase: 20 },

  { id: 'K_NSTD', name: 'Khoa Nội soi - Thăm dò chức năng', category: 'Khối Cận Lâm Sàng', toa: 'F', floor: 2, blockBase: 10 },
  { id: 'K_DUC', name: 'Khoa Dược', category: 'Khối Cận Lâm Sàng', toa: 'F', floor: 2, blockBase: 20 },

  { id: 'K_GPB', name: 'Khoa Giải phẫu bệnh', category: 'Khối Cận Lâm Sàng', toa: 'F', floor: 3, blockBase: 10 },
  { id: 'K_KSNK', name: 'Khoa Kiểm soát Nhiễm khuẩn', category: 'Khối Cận Lâm Sàng', toa: 'F', floor: 3, blockBase: 20 },
  { id: 'K_VS', name: 'Khoa Vi sinh', category: 'Khối Cận Lâm Sàng', toa: 'F', floor: 3, blockBase: 30 }
];


// Dynamically construct 4 detailed sub-rooms/processes for each main department (Total 164 sub-clinical rooms)
export const DEPARTMENTS_CONFIG = DEPARTMENTS_RAW.map((dept) => {
  let steps = [];
  if (dept.category === 'Khối Cận Lâm Sàng') {
    steps = [
      { suffix: 'TN', label: 'Tiếp nhận mẫu & Hồ sơ', roomOffset: 1 },
      { suffix: 'PT', label: 'Phân tích & Kỹ thuật chuyên biệt', roomOffset: 2 },
      { suffix: 'KQ', label: 'Đánh giá & Ký duyệt kết quả', roomOffset: 3 },
      { suffix: 'BC', label: 'Trả bản báo cáo lâm sàng', roomOffset: 4 }
    ];
  } else if (dept.id === 'K_KB') {
    steps = [
      { suffix: 'HS', label: 'Tiếp nhận & Đo sinh hiệu', roomOffset: 1 },
      { suffix: 'LS', label: 'Khám lâm sàng bác sĩ', roomOffset: 2 },
      { suffix: 'CD', label: 'Chẩn đoán lâm sàng bổ sung', roomOffset: 3 },
      { suffix: 'TV', label: 'Kết luận & Cấp đơn thuốc khám', roomOffset: 4 }
    ];
  } else if (dept.id === 'K_CC') {
    steps = [
      { suffix: 'PL', label: 'Sàng lọc phân loại mức cứu cấp', roomOffset: 1 },
      { suffix: 'HS', label: 'Hồi sức đo vẽ nhịp tim chỉ số', roomOffset: 2 },
      { suffix: 'ST', label: 'Sơ cứu xử lý vết thương cấp tốc', roomOffset: 3 },
      { suffix: 'TD', label: 'Theo dõi tích cực hậu cấp cứu', roomOffset: 4 }
    ];
  } else if (dept.id === 'K_PHARMACY') {
    steps = [
      { suffix: 'RX', label: 'Nộp sổ & Nhận thuốc ra về', roomOffset: 1 }
    ];
  } else {
    steps = [
      { suffix: 'TN', label: 'Tiếp nhận & Kê khai triệu chứng', roomOffset: 1 },
      { suffix: 'KS', label: 'Khám chuyên khoa lâm sàng', roomOffset: 2 },
      { suffix: 'CD', label: 'Chẩn đoán lâm sàng chuyên sâu', roomOffset: 3 },
      { suffix: 'TV', label: 'Tư vấn phác đồ & Hướng điều trị', roomOffset: 4 }
    ];
  }

  const subRooms = steps.map(step => {
    // Generate Room format like "B211" (Tòa B - Tầng 2 - Block 10 - Room 1)
    const formattedRoomNum = `${dept.toa}${dept.floor}${dept.blockBase + step.roomOffset}`;
    return {
      id: `${dept.id}_${step.suffix}`,
      name: `${dept.name} - ${step.label}`,
      room: `Phòng ${formattedRoomNum}`
    };
  });

  return {
    ...dept,
    subRooms
  };
});

// Compile flatness array of 164 sub-room configurations for database seeding
export const seedDepartments = DEPARTMENTS_CONFIG.flatMap(dept =>
  dept.subRooms.map(sub => ({
    deptId: sub.id,
    name: sub.name,
    roomNumber: sub.room,
    queue: [],
    currentTicketId: null
  }))
);

// Inject 1 Centralized Testing Lab per floor for relevant Clinical buildings, now broken down into 3 granular sub-steps
const sharedLabsMap = {};
DEPARTMENTS_RAW.forEach(dept => {
  if (['Khối Nội khoa', 'Khối Ngoại khoa', 'Khối Sản - Nhi', 'Khối Chuyên khoa & Dịch vụ tổng hợp', 'Khối Cận Lâm Sàng'].includes(dept.category)) {
    const labBaseId = `LAB_${dept.toa}${dept.floor}`;
    const labBaseName = `Trung tâm Lấy mẫu Xét nghiệm Tầng ${dept.floor}`;
    const roomNum = `Phòng ${dept.toa}${dept.floor}99`; // e.g. Phòng E199

    if (!sharedLabsMap[`${labBaseId}_TP`]) {
      sharedLabsMap[`${labBaseId}_TP`] = {
        deptId: `${labBaseId}_TP`,
        name: `${labBaseName} - Kê khai & Đóng lệ phí`,
        roomNumber: roomNum,
        queue: [], currentTicketId: null
      };
      sharedLabsMap[`${labBaseId}_LM`] = {
        deptId: `${labBaseId}_LM`,
        name: `${labBaseName} - Lấy mẫu (Máu/Nước tiểu)`,
        roomNumber: roomNum,
        queue: [], currentTicketId: null
      };
      sharedLabsMap[`${labBaseId}_KQ`] = {
        deptId: `${labBaseId}_KQ`,
        name: `${labBaseName} - Nhận kết quả Xét nghiệm`,
        roomNumber: roomNum,
        queue: [], currentTicketId: null
      };
    }
  }
});

seedDepartments.push(...Object.values(sharedLabsMap));

// Map parent ID to its sub-room child IDs, and dynamically inject the Testing Lab module if applicable
export const DEPT_EXPANSION_MAP = DEPARTMENTS_CONFIG.reduce((map, dept) => {
  const subIds = dept.subRooms.map(sub => sub.id);

  if (['Khối Nội khoa', 'Khối Ngoại khoa', 'Khối Sản - Nhi', 'Khối Chuyên khoa & Dịch vụ tổng hợp', 'Khối Cận Lâm Sàng'].includes(dept.category)) {
    const labBaseId = `LAB_${dept.toa}${dept.floor}`;
    // Injects the 3 granular lab steps right after Khám chuyên khoa (index 2)
    subIds.splice(2, 0, `${labBaseId}_TP`, `${labBaseId}_LM`, `${labBaseId}_KQ`);
  }

  map[dept.id] = subIds;
  return map;
}, {});
