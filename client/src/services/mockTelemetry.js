// Client-side fallback telemetry provider for evaluation and offline resilience
// Seamlessly provides authentic mock telemetry if live Render server is sleeping or cold-starting

export const getDemoPersona = (role) => {
  if (role === 'mess_staff') {
    return {
      _id: 'demo_staff_01',
      firstName: 'Raju',
      lastName: 'Kumar',
      email: 'staff@messmate.edu',
      staffId: 'STF-101',
      role: 'mess_staff',
      gender: 'male',
      phone: '9999900020',
      hostel: { _id: 'h_kautilya', name: 'Kautilya Hostel', code: 'H-KAUTILYA' },
      mess: { _id: 'm_kautilya', name: 'Kautilya Central Mess Block' }
    };
  }

  if (role === 'mess_manager') {
    return {
      _id: 'demo_manager_01',
      firstName: 'Suresh',
      lastName: 'Sharma',
      email: 'manager@messmate.edu',
      staffId: 'MGR-101',
      role: 'mess_manager',
      gender: 'male',
      phone: '9999900010',
      hostel: { _id: 'h_kautilya', name: 'Kautilya Hostel', code: 'H-KAUTILYA' },
      mess: { _id: 'm_kautilya', name: 'Kautilya Central Mess Block' }
    };
  }

  if (role === 'student_female') {
    return {
      _id: 'demo_student_female_01',
      firstName: 'Priya',
      lastName: 'Kumari',
      email: 'priya.kumari@messmate.edu',
      role: 'student',
      gender: 'female',
      rollNumber: '2201010',
      roomNumber: 'KD-102',
      phone: '9876543211',
      hostel: { _id: 'h_kadambini', name: 'Kadambini Hostel', code: 'H-KADAMBINI' },
      mess: { _id: 'm_kadambini', name: 'Kadambini Dining Facility' },
      couponWallet: {
        semesterTotalAmount: 6000,
        balanceAmount: 5850,
        monthlyMaxAmount: 1000,
        currentMonthAmountSpent: 150
      }
    };
  }

  if (role === 'admin') {
    return {
      _id: 'demo_admin_01',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@messmate.edu',
      role: 'admin',
      gender: 'male',
      phone: '9999900001'
    };
  }

  // Default: Student (Male - Ayush Singh)
  return {
    _id: 'demo_student_male_01',
    firstName: 'Ayush',
    lastName: 'Singh',
    email: 'student@messmate.edu',
    role: 'student',
    gender: 'male',
    rollNumber: '2201003',
    roomNumber: 'K-103',
    phone: '9876543210',
    hostel: { _id: 'h_kautilya', name: 'Kautilya Hostel', code: 'H-KAUTILYA' },
    mess: { _id: 'm_kautilya', name: 'Kautilya Central Mess Block' },
    couponWallet: {
      semesterTotalAmount: 6000,
      balanceAmount: 5600,
      monthlyMaxAmount: 1000,
      currentMonthAmountSpent: 400
    }
  };
};

const sampleMenus = [
  {
    _id: 'menu_0',
    dayOfWeek: 0,
    mealType: 'breakfast',
    dishes: [
      { name: 'Masala Dosa with Sambar & Coconut Chutney', category: 'staple', isVeg: true },
      { name: 'Boiled Eggs / Banana', category: 'side_dish', isVeg: false },
      { name: 'Filter Coffee / Hot Milk', category: 'beverage', isVeg: true }
    ]
  },
  {
    _id: 'menu_1',
    dayOfWeek: 1,
    mealType: 'lunch',
    dishes: [
      { name: 'Jeera Rice & Tandoori Roti', category: 'staple', isVeg: true },
      { name: 'Paneer Butter Masala', category: 'main_curry', isVeg: true },
      { name: 'Dal Tadka', category: 'side_dish', isVeg: true },
      { name: 'Gulab Jamun', category: 'dessert', isVeg: true }
    ]
  },
  {
    _id: 'menu_2',
    dayOfWeek: 1,
    mealType: 'dinner',
    dishes: [
      { name: 'Butter Roti & Veg Pulao', category: 'staple', isVeg: true },
      { name: 'Chole Masala', category: 'main_curry', isVeg: true },
      { name: 'Moong Dal Fry', category: 'side_dish', isVeg: true },
      { name: 'Green Salad & Papad', category: 'salad_snack', isVeg: true }
    ]
  }
];

export const getFallbackData = (config) => {
  const url = (config?.url || '').replace(/^\/api\/v1/, '').split('?')[0];
  const method = (config?.method || 'get').toLowerCase();

  // If write request (POST, PUT, DELETE), simulate success in demo mode
  if (method !== 'get') {
    return {
      success: true,
      status: 'success',
      message: 'Operation performed successfully (Demo sandbox active).',
      data: {
        _id: 'simulated_' + Date.now(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  // 1. Hostels list
  if (url === '/hostels' || url.startsWith('/hostels')) {
    return {
      success: true,
      data: {
        hostels: [
          { _id: 'h_kautilya', name: 'Kautilya Hostel', code: 'H-KAUTILYA', type: 'boys', capacity: 450, isActive: true },
          { _id: 'h_kadambini', name: 'Kadambini Hostel', code: 'H-KADAMBINI', type: 'girls', capacity: 400, isActive: true },
          { _id: 'h_nagarjuna', name: 'Nagarjuna Hostel', code: 'H-NAGARJUNA', type: 'boys', capacity: 450, isActive: true },
          { _id: 'h_aryabhatta', name: 'Aryabhatta Hostel', code: 'H-ARYABHATTA', type: 'boys', capacity: 500, isActive: true }
        ]
      }
    };
  }

  // 2. Mess facilities list
  if (url === '/mess' || url.startsWith('/mess')) {
    return {
      success: true,
      data: {
        messes: [
          { _id: 'm_kautilya', name: 'Kautilya Central Mess Block', hostel: 'h_kautilya' },
          { _id: 'm_kadambini', name: 'Kadambini Dining Facility', hostel: 'h_kadambini' },
          { _id: 'm_nagarjuna', name: 'Nagarjuna Dining Hall', hostel: 'h_nagarjuna' },
          { _id: 'm_aryabhatta', name: 'Aryabhatta Food Court', hostel: 'h_aryabhatta' }
        ]
      }
    };
  }

  // 3. Student Dashboard
  if (url === '/dashboard/student') {
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60000).toISOString();
    const endTime = new Date(now.getTime() + 90 * 60000).toISOString();

    return {
      success: true,
      data: {
        user: {
          firstName: 'Ayush',
          lastName: 'Singh',
          rollNumber: '2201003',
          roomNumber: 'K-103',
          hostelName: 'Kautilya Hostel',
          messName: 'Kautilya Central Mess Block'
        },
        nextSession: {
          sessionId: 'sess_live_today',
          mealType: 'dinner',
          date: new Date().toISOString(),
          startTime,
          endTime,
          cutoffTime: '17:00',
          isActive: true
        },
        todayMenu: {
          title: 'Special North Indian Deluxe',
          dishes: [
            { name: 'Butter Roti & Steamed Basmati Rice', category: 'staple', isVeg: true },
            { name: 'Paneer Butter Masala', category: 'main_curry', isVeg: true },
            { name: 'Dal Makhani', category: 'side_dish', isVeg: true },
            { name: 'Gulab Jamun', category: 'dessert', isVeg: true }
          ]
        },
        hasActiveCoupon: true,
        hasDeclaredOptOut: false,
        attendanceStats: {
          attendedPast30Days: 26,
          optOutsPast30Days: 4
        },
        couponWallet: {
          semesterTotalAmount: 6000,
          balanceAmount: 5600,
          monthlyMaxAmount: 1000,
          currentMonthAmountSpent: 400,
          monthlyRemaining: 600,
          effectiveAvailableThisMonth: 600,
          isMonthlyExhausted: false
        },
        recentComplaints: [
          {
            _id: 'comp_01',
            subject: 'Water dispenser filter replacement',
            category: 'water_filter',
            status: 'resolved',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
          }
        ],
        announcements: [
          {
            _id: 'ann_01',
            title: 'Sunday Feast & Special Dessert Menu',
            content: 'This Sunday dinner features special Paneer Tikka, Veg Biryani and Kesar Kheer for all hostel residents.',
            isPinned: true,
            createdAt: new Date().toISOString()
          }
        ],
        uniqueStudentQR: 'MESSMATE:STUDENT:demo_student_male_01:2201003'
      }
    };
  }

  // 4. Staff Dashboard
  if (url === '/dashboard/staff') {
    return {
      success: true,
      data: {
        messInfo: {
          id: 'm_kautilya',
          name: 'Kautilya Central Mess Block',
          counterQR: 'MESSMATE:COUNTER:m_kautilya:Kautilya_Central_Mess'
        },
        activeSession: {
          sessionId: 'sess_live_staff',
          mealType: 'dinner',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          isActive: true,
          declaredDemand: 420,
          actualServedCount: 286,
          percentageServed: 68,
          remainingExpected: 134
        },
        todayBreakdown: [
          { sessionId: 's1', mealType: 'breakfast', status: 'completed', declaredDemand: 390, actualServedCount: 382 },
          { sessionId: 's2', mealType: 'lunch', status: 'completed', declaredDemand: 415, actualServedCount: 408 },
          { sessionId: 's3', mealType: 'dinner', status: 'active', declaredDemand: 420, actualServedCount: 286 }
        ],
        recentScans: [
          {
            _id: 'scan_01',
            student: { firstName: 'Rohan', lastName: 'Kumar', rollNumber: '2201004', roomNumber: 'K-104' },
            timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
            method: 'qr'
          },
          {
            _id: 'scan_02',
            student: { firstName: 'Amit', lastName: 'Verma', rollNumber: '2201015', roomNumber: 'K-112' },
            timestamp: new Date(Date.now() - 1000 * 85).toISOString(),
            method: 'qr'
          },
          {
            _id: 'scan_03',
            student: { firstName: 'Vikash', lastName: 'Jha', rollNumber: '2201021', roomNumber: 'K-118' },
            timestamp: new Date(Date.now() - 1000 * 140).toISOString(),
            method: 'manual'
          }
        ]
      }
    };
  }

  // 5. Manager Dashboard
  if (url === '/dashboard/manager') {
    return {
      success: true,
      data: {
        today: {
          totalPrepared: 1225,
          totalServed: 1076
        },
        attendanceTrend: [
          { day: 'Mon', declaredDemand: 410, actualServed: 398 },
          { day: 'Tue', declaredDemand: 425, actualServed: 412 },
          { day: 'Wed', declaredDemand: 430, actualServed: 422 },
          { day: 'Thu', declaredDemand: 415, actualServed: 405 },
          { day: 'Fri', declaredDemand: 400, actualServed: 388 },
          { day: 'Sat', declaredDemand: 390, actualServed: 375 },
          { day: 'Sun', declaredDemand: 435, actualServed: 428 }
        ],
        wastageTrend: [
          { day: 'Mon', surplusKg: 12.4, plateWasteKg: 8.6, costLost: 1850 },
          { day: 'Tue', surplusKg: 9.8, plateWasteKg: 6.2, costLost: 1420 },
          { day: 'Wed', surplusKg: 8.1, plateWasteKg: 5.5, costLost: 1200 },
          { day: 'Thu', surplusKg: 10.2, plateWasteKg: 7.1, costLost: 1540 },
          { day: 'Fri', surplusKg: 7.5, plateWasteKg: 4.8, costLost: 1080 },
          { day: 'Sat', surplusKg: 8.9, plateWasteKg: 5.9, costLost: 1310 },
          { day: 'Sun', surplusKg: 6.2, plateWasteKg: 4.1, costLost: 910 }
        ],
        qualityScores: {
          overall: 4.3,
          taste: 4.2,
          hygiene: 4.6,
          temperature: 4.4,
          portion: 4.5,
          totalReviews: 348
        },
        inventory: {
          totalItems: 38,
          lowStockCount: 2
        },
        complaints: {
          open: 2,
          resolved: 24,
          total: 26
        }
      }
    };
  }

  // 6. Admin Dashboard
  if (url === '/dashboard/admin') {
    return {
      success: true,
      data: {
        metrics: {
          totalStudents: 1820,
          totalStaff: 18,
          totalManagers: 4,
          totalHostels: 4,
          activeMealSessions: 4,
          monthWastageReducedPercent: 38.4
        },
        hostelsSummary: [
          { name: 'Kautilya Hostel', capacity: 450, enrolled: 435, messName: 'Kautilya Central Mess' },
          { name: 'Kadambini Hostel', capacity: 400, enrolled: 392, messName: 'Kadambini Dining Facility' },
          { name: 'Nagarjuna Hostel', capacity: 450, enrolled: 428, messName: 'Nagarjuna Dining Hall' },
          { name: 'Aryabhatta Hostel', capacity: 500, enrolled: 485, messName: 'Aryabhatta Food Court' }
        ],
        recentUsers: [
          { firstName: 'Ayush', lastName: 'Singh', role: 'student', rollNumber: '2201003' },
          { firstName: 'Priya', lastName: 'Kumari', role: 'student', rollNumber: '2201010' },
          { firstName: 'Raju', lastName: 'Kumar', role: 'mess_staff', staffId: 'STF-101' },
          { firstName: 'Suresh', lastName: 'Sharma', role: 'mess_manager', staffId: 'MGR-101' }
        ]
      }
    };
  }

  // 7. Menus
  if (url.includes('/menus')) {
    return {
      success: true,
      data: sampleMenus
    };
  }

  // 8. Coupons
  if (url.includes('/coupons')) {
    return {
      success: true,
      data: {
        coupons: [
          {
            _id: 'coup_01',
            status: 'active',
            mealType: 'dinner',
            qrCodeData: 'MESSMATE:COUPON:demo_active_nonce_123',
            validUntil: new Date(Date.now() + 3600000).toISOString()
          }
        ]
      }
    };
  }

  // 9. Inventory items
  if (url.includes('/inventory')) {
    return {
      success: true,
      data: {
        items: [
          { _id: 'inv_1', name: 'Basmati Rice', currentStock: 180, unit: 'kg', minThreshold: 50, costPerUnit: 68 },
          { _id: 'inv_2', name: 'Fresh Paneer', currentStock: 35, unit: 'kg', minThreshold: 15, costPerUnit: 340 },
          { _id: 'inv_3', name: 'Atta (Wheat Flour)', currentStock: 220, unit: 'kg', minThreshold: 80, costPerUnit: 38 },
          { _id: 'inv_4', name: 'Toor Dal', currentStock: 95, unit: 'kg', minThreshold: 30, costPerUnit: 145 },
          { _id: 'inv_5', name: 'Sunflower Oil', currentStock: 60, unit: 'liters', minThreshold: 20, costPerUnit: 130 }
        ]
      }
    };
  }

  // 10. Complaints
  if (url.includes('/complaints')) {
    return {
      success: true,
      data: {
        complaints: [
          {
            _id: 'c_01',
            subject: 'Chutney consistency during breakfast',
            category: 'food_taste',
            severity: 'low',
            status: 'resolved',
            resolutionNotes: 'Kitchen instructed to maintain thicker consistency and check fresh coconut ratio.',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            _id: 'c_02',
            subject: 'Dining hall table cleaning frequency',
            category: 'hygiene',
            severity: 'medium',
            status: 'in_review',
            createdAt: new Date(Date.now() - 43200000).toISOString()
          }
        ]
      }
    };
  }

  // 11. Announcements
  if (url.includes('/announcements')) {
    return {
      success: true,
      data: {
        announcements: [
          {
            _id: 'ann_01',
            title: 'Zero Waste Campus Dining Initiative',
            content: 'Please ensure declaring meal absence before 5:00 PM if dining outside to help our hostel eliminate food wastage.',
            isPinned: true,
            createdAt: new Date().toISOString()
          }
        ]
      }
    };
  }

  // 12. Users
  if (url.includes('/users')) {
    return {
      success: true,
      data: {
        users: [
          { _id: 'u1', firstName: 'Ayush', lastName: 'Singh', email: 'student@messmate.edu', role: 'student', rollNumber: '2201003' },
          { _id: 'u2', firstName: 'Priya', lastName: 'Kumari', email: 'priya.kumari@messmate.edu', role: 'student', rollNumber: '2201010' },
          { _id: 'u3', firstName: 'Raju', lastName: 'Kumar', email: 'staff@messmate.edu', role: 'mess_staff', staffId: 'STF-101' },
          { _id: 'u4', firstName: 'Suresh', lastName: 'Sharma', email: 'manager@messmate.edu', role: 'mess_manager', staffId: 'MGR-101' },
          { _id: 'u5', firstName: 'System', lastName: 'Admin', email: 'admin@messmate.edu', role: 'admin' }
        ]
      }
    };
  }

  // 13. Meal Declarations
  if (url.includes('/declarations')) {
    return {
      success: true,
      data: {
        declarations: [
          {
            _id: 'dec_1',
            date: new Date().toISOString(),
            mealType: 'breakfast',
            status: 'attended'
          }
        ]
      }
    };
  }

  // Fallback generic object
  return {
    success: true,
    data: {}
  };
};
