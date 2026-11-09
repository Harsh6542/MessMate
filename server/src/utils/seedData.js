import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Hostel } from '../models/Hostel.js';
import { MessFacility } from '../models/MessFacility.js';
import { Menu } from '../models/Menu.js';
import { MealSession } from '../models/MealSession.js';
import { MealDeclaration } from '../models/MealDeclaration.js';
import { Coupon } from '../models/Coupon.js';
import { Attendance } from '../models/Attendance.js';
import { Feedback } from '../models/Feedback.js';
import { Complaint } from '../models/Complaint.js';
import { Announcement } from '../models/Announcement.js';
import { WasteLog } from '../models/WasteLog.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { StockTransaction } from '../models/StockTransaction.js';
import { GuestMealRequest } from '../models/GuestMealRequest.js';
import { ROLES, BILLING_POLICIES, MEAL_TYPES, MEAL_SESSION_STATUS, DECLARATION_STATUS } from '../config/constants.js';
import { ensureDailySessions, normalizeDate } from '../services/mealSessionService.js';

const sampleWeeklyMenu = [
  // Sunday (0)
  {
    day: 0,
    breakfast: [
      { name: 'Masala Dosa with Sambar & Coconut Chutney', category: 'staple', isVeg: true, allergens: ['mustard'] },
      { name: 'Boiled Eggs / Banana', category: 'side_dish', isVeg: false, allergens: ['egg'] },
      { name: 'Filter Coffee / Milk', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Veg Pulao with Raita', category: 'staple', isVeg: true, allergens: ['dairy'] },
      { name: 'Paneer Butter Masala', category: 'main_curry', isVeg: true, allergens: ['dairy', 'nuts'] },
      { name: 'Dal Tadka', category: 'side_dish', isVeg: true },
      { name: 'Gulab Jamun', category: 'dessert', isVeg: true, allergens: ['dairy', 'gluten'] }
    ],
    dinner: [
      { name: 'Tandoori Roti & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Chole Masala', category: 'main_curry', isVeg: true },
      { name: 'Green Salad & Papad', category: 'salad_snack', isVeg: true }
    ]
  },
  // Monday (1)
  {
    day: 1,
    breakfast: [
      { name: 'Aloo Paratha with Curd & Pickle', category: 'staple', isVeg: true, allergens: ['gluten', 'dairy'] },
      { name: 'Fresh Fruits', category: 'side_dish', isVeg: true },
      { name: 'Masala Chai / Tea', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Roti & Jeera Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Rajma Punjabi Masala', category: 'main_curry', isVeg: true },
      { name: 'Aloo Gobhi Sabzi', category: 'side_dish', isVeg: true },
      { name: 'Boondi Raita', category: 'salad_snack', isVeg: true, allergens: ['dairy'] }
    ],
    dinner: [
      { name: 'Chapati & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Egg Curry / Kadai Paneer', category: 'main_curry', isVeg: false, allergens: ['egg', 'dairy'] },
      { name: 'Moong Dal Fry', category: 'side_dish', isVeg: true },
      { name: 'Custard Pudding', category: 'dessert', isVeg: true, allergens: ['dairy'] }
    ]
  },
  // Tuesday (2)
  {
    day: 2,
    breakfast: [
      { name: 'Idli Vada with Coconut Chutney & Sambar', category: 'staple', isVeg: true },
      { name: 'Sweet Corn Chaat', category: 'side_dish', isVeg: true },
      { name: 'Hot Tea / Milk', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Roti & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Palak Paneer', category: 'main_curry', isVeg: true, allergens: ['dairy'] },
      { name: 'Dal Makhani', category: 'side_dish', isVeg: true, allergens: ['dairy'] },
      { name: 'Green Salad', category: 'salad_snack', isVeg: true }
    ],
    dinner: [
      { name: 'Butter Roti & Veg Biryani', category: 'staple', isVeg: true, allergens: ['gluten', 'dairy'] },
      { name: 'Mix Veg Korma', category: 'main_curry', isVeg: true },
      { name: 'Kheer', category: 'dessert', isVeg: true, allergens: ['dairy'] }
    ]
  },
  // Wednesday (3)
  {
    day: 3,
    breakfast: [
      { name: 'Poha with Sev, Roasted Peanuts & Lemon', category: 'staple', isVeg: true, allergens: ['peanuts'] },
      { name: 'Boiled Eggs / Sprouts', category: 'side_dish', isVeg: false, allergens: ['egg'] },
      { name: 'Chai / Coffee', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Roti & Plain Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Kadhi Pakoda', category: 'main_curry', isVeg: true, allergens: ['dairy'] },
      { name: 'Bhindi Masala', category: 'side_dish', isVeg: true },
      { name: 'Fried Papad', category: 'salad_snack', isVeg: true }
    ],
    dinner: [
      { name: 'Chapati & Peas Pulao', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Chicken Curry / Shahi Paneer', category: 'main_curry', isVeg: false, allergens: ['dairy'] },
      { name: 'Dal Tadka', category: 'side_dish', isVeg: true },
      { name: 'Ice Cream Cup', category: 'dessert', isVeg: true, allergens: ['dairy'] }
    ]
  },
  // Thursday (4)
  {
    day: 4,
    breakfast: [
      { name: 'Methi Paratha with White Butter & Curd', category: 'staple', isVeg: true, allergens: ['gluten', 'dairy'] },
      { name: 'Banana / Apple', category: 'side_dish', isVeg: true },
      { name: 'Ginger Tea / Milk', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Roti & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Soyabean Aloo Matar', category: 'main_curry', isVeg: true, allergens: ['soy'] },
      { name: 'Chana Dal Fry', category: 'side_dish', isVeg: true },
      { name: 'Kachumber Salad', category: 'salad_snack', isVeg: true }
    ],
    dinner: [
      { name: 'Tandoori Roti & Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Dum Aloo Kashmiri', category: 'main_curry', isVeg: true },
      { name: 'Moong Dal', category: 'side_dish', isVeg: true },
      { name: 'Fruit Custard', category: 'dessert', isVeg: true, allergens: ['dairy'] }
    ]
  },
  // Friday (5)
  {
    day: 5,
    breakfast: [
      { name: 'Pav Bhaji with Lemon & Onions', category: 'staple', isVeg: true, allergens: ['gluten', 'dairy'] },
      { name: 'Cornflakes with Milk', category: 'side_dish', isVeg: true, allergens: ['dairy'] },
      { name: 'Coffee / Tea', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Roti & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Lauki Kofta Curry', category: 'main_curry', isVeg: true },
      { name: 'Dal Arhar Fry', category: 'side_dish', isVeg: true },
      { name: 'Cucumber Salad', category: 'salad_snack', isVeg: true }
    ],
    dinner: [
      { name: 'Veg Fried Rice with Manchurian', category: 'main_curry', isVeg: true, allergens: ['soy', 'gluten'] },
      { name: 'Roti & Dal', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Rasgulla', category: 'dessert', isVeg: true, allergens: ['dairy'] }
    ]
  },
  // Saturday (6)
  {
    day: 6,
    breakfast: [
      { name: 'Poori Bhaji (Aloo Tamatar Gravy)', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Sooji Halwa', category: 'side_dish', isVeg: true, allergens: ['gluten', 'dairy'] },
      { name: 'Chai / Coffee', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Khichdi with Ghee & Chokha', category: 'staple', isVeg: true, allergens: ['dairy'] },
      { name: 'Baingan Bharta', category: 'side_dish', isVeg: true },
      { name: 'Curd & Fried Papad', category: 'salad_snack', isVeg: true, allergens: ['dairy'] }
    ],
    dinner: [
      { name: 'Litti Chokha / Roti & Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Egg Bhurji / Matar Paneer', category: 'main_curry', isVeg: false, allergens: ['egg', 'dairy'] },
      { name: 'Moong Dal', category: 'side_dish', isVeg: true },
      { name: 'Gulab Jamun', category: 'dessert', isVeg: true, allergens: ['gluten', 'dairy'] }
    ]
  }
];

// Official Demo Students (Clean & Production-Ready)
const demoStudentsList = [
  {
    firstName: 'Ayush',
    lastName: 'Singh',
    gender: 'male',
    email: 'student@messmate.edu',
    rollNumber: '2201003',
    roomNumber: 'K-103',
    phone: '9876522003',
    hostelCode: 'H-KAUTILYA'
  },
  {
    firstName: 'Priya',
    lastName: 'Kumari',
    gender: 'female',
    email: 'priya.kumari@messmate.edu',
    rollNumber: '2201010',
    roomNumber: 'KD-102',
    phone: '9876522010',
    hostelCode: 'H-KADAMBINI'
  }
];

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmate_dev';
    await mongoose.connect(uri);
    console.log('[Seed] Connected to MongoDB database.');

    // 1. Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Hostel.deleteMany({}),
      MessFacility.deleteMany({}),
      Menu.deleteMany({}),
      MealSession.deleteMany({}),
      MealDeclaration.deleteMany({}),
      Coupon.deleteMany({}),
      Attendance.deleteMany({}),
      Feedback.deleteMany({}),
      Complaint.deleteMany({}),
      Announcement.deleteMany({}),
      WasteLog.deleteMany({}),
      InventoryItem.deleteMany({}),
      StockTransaction.deleteMany({}),
      GuestMealRequest.deleteMany({})
    ]);
    console.log('[Seed] Database collections purged cleanly.');

    // 2. Create the 4 Hostels: 3 Boys Hostels + 1 Girls Hostel
    // Boys Hostels: Kautilya Hostel, Nagarjuna Hostel, Aryabhatta Hostel
    const kautilyaHostel = await Hostel.create({
      name: 'Kautilya Hostel',
      code: 'H-KAUTILYA',
      type: 'boys',
      address: 'East Campus, NIT Patna',
      capacity: 450,
      isActive: true
    });

    const nagarjunaHostel = await Hostel.create({
      name: 'Nagarjuna Hostel',
      code: 'H-NAGARJUNA',
      type: 'boys',
      address: 'West Campus, NIT Patna',
      capacity: 450,
      isActive: true
    });

    const aryabhattaHostel = await Hostel.create({
      name: 'Aryabhatta Hostel',
      code: 'H-ARYABHATTA',
      type: 'boys',
      address: 'Main Academic Campus, NIT Patna',
      capacity: 500,
      isActive: true
    });

    // Girls Hostel: Kadambini Hostel
    const kadambiniHostel = await Hostel.create({
      name: 'Kadambini Hostel',
      code: 'H-KADAMBINI',
      type: 'girls',
      address: 'Girls Enclave, NIT Patna',
      capacity: 400,
      isActive: true
    });

    console.log('[Seed] Hostels created: Kautilya, Nagarjuna, Aryabhatta (Boys) & Kadambini (Girls).');

    // 3. Create Super Admin (Demo Mode)
    const admin = await User.create({
      firstName: 'Demo',
      lastName: 'Administrator',
      email: 'admin@messmate.edu',
      password: 'Password@123',
      role: ROLES.ADMIN,
      gender: 'male',
      phone: '9999900001',
      isDemo: true
    });

    // Real Institutional Super Admin (Full Live Powers: Can Create/Delete Real Users & Staff)
    await User.create({
      firstName: 'NIT Patna',
      lastName: 'System Admin',
      email: 'admin@nitp.ac.in',
      password: 'Password@123',
      role: ROLES.ADMIN,
      gender: 'male',
      phone: '9999900000',
      isDemo: false
    });

    // 4. Create Mess Facilities & Managers for each hostel
    // Kautilya Mess
    const managerKautilya = await User.create({
      firstName: 'Suresh',
      lastName: 'Sharma',
      email: 'manager@messmate.edu',
      password: 'Password@123',
      staffId: 'MGR-101',
      staffPin: '1234',
      role: ROLES.MESS_MANAGER,
      gender: 'male',
      phone: '9999900010',
      hostel: kautilyaHostel._id,
      isDemo: true
    });

    const kautilyaMess = await MessFacility.create({
      name: 'Kautilya Central Mess Block',
      hostel: kautilyaHostel._id,
      manager: managerKautilya._id,
      mealTimings: {
        breakfast: { start: '07:30', end: '09:30' },
        lunch: { start: '12:30', end: '14:30' },
        dinner: { start: '19:30', end: '21:30' }
      },
      declarationCutoffs: {
        breakfast: '21:00',
        lunch: '09:00',
        dinner: '15:00'
      },
      billingPolicy: BILLING_POLICIES.FIXED_MONTHLY
    });
    managerKautilya.mess = kautilyaMess._id;
    await managerKautilya.save();

    // Kadambini Mess
    const managerKadambini = await User.create({
      firstName: 'Meenakshi',
      lastName: 'Rao',
      email: 'manager.kadambini@messmate.edu',
      password: 'Password@123',
      staffId: 'MGR-102',
      staffPin: '1234',
      role: ROLES.MESS_MANAGER,
      gender: 'female',
      phone: '9999900011',
      hostel: kadambiniHostel._id,
      isDemo: true
    });

    const kadambiniMess = await MessFacility.create({
      name: 'Kadambini Dining Facility',
      hostel: kadambiniHostel._id,
      manager: managerKadambini._id,
      mealTimings: {
        breakfast: { start: '07:30', end: '09:30' },
        lunch: { start: '12:30', end: '14:30' },
        dinner: { start: '19:30', end: '21:30' }
      },
      declarationCutoffs: {
        breakfast: '21:00',
        lunch: '09:00',
        dinner: '15:00'
      },
      billingPolicy: BILLING_POLICIES.FIXED_MONTHLY
    });
    managerKadambini.mess = kadambiniMess._id;
    await managerKadambini.save();

    // Nagarjuna Mess
    const managerNagarjuna = await User.create({
      firstName: 'Mahesh',
      lastName: 'Prasad',
      email: 'manager.nagarjuna@messmate.edu',
      password: 'Password@123',
      staffId: 'MGR-103',
      staffPin: '1234',
      role: ROLES.MESS_MANAGER,
      gender: 'male',
      phone: '9999900012',
      hostel: nagarjunaHostel._id,
      isDemo: true
    });

    const nagarjunaMess = await MessFacility.create({
      name: 'Nagarjuna Dining Hall',
      hostel: nagarjunaHostel._id,
      manager: managerNagarjuna._id,
      mealTimings: {
        breakfast: { start: '07:30', end: '09:30' },
        lunch: { start: '12:30', end: '14:30' },
        dinner: { start: '19:30', end: '21:30' }
      },
      declarationCutoffs: {
        breakfast: '21:00',
        lunch: '09:00',
        dinner: '15:00'
      },
      billingPolicy: BILLING_POLICIES.PER_MEAL
    });
    managerNagarjuna.mess = nagarjunaMess._id;
    await managerNagarjuna.save();

    // Aryabhatta Mess
    const managerAryabhatta = await User.create({
      firstName: 'Dharmendra',
      lastName: 'Singh',
      email: 'manager.aryabhatta@messmate.edu',
      password: 'Password@123',
      staffId: 'MGR-104',
      staffPin: '1234',
      role: ROLES.MESS_MANAGER,
      gender: 'male',
      phone: '9999900013',
      hostel: aryabhattaHostel._id,
      isDemo: true
    });

    const aryabhattaMess = await MessFacility.create({
      name: 'Aryabhatta Food Court',
      hostel: aryabhattaHostel._id,
      manager: managerAryabhatta._id,
      mealTimings: {
        breakfast: { start: '07:30', end: '09:30' },
        lunch: { start: '12:30', end: '14:30' },
        dinner: { start: '19:30', end: '21:30' }
      },
      declarationCutoffs: {
        breakfast: '21:00',
        lunch: '09:00',
        dinner: '15:00'
      },
      billingPolicy: BILLING_POLICIES.FIXED_MONTHLY
    });
    managerAryabhatta.mess = aryabhattaMess._id;
    await managerAryabhatta.save();

    console.log('[Seed] Mess facilities & managers created for all 4 hostels.');

    // 6. Create Mess Staff Members
    const staffMembers = [
      { firstName: 'Raju', lastName: 'Kumar', email: 'staff@messmate.edu', staffId: 'STF-101', staffPin: '1234', phone: '9999900020', hostel: kautilyaHostel._id, mess: kautilyaMess._id, gender: 'male', isDemo: true },
      { firstName: 'Vikram', lastName: 'Yadav', email: 'staff2@messmate.edu', staffId: 'STF-102', staffPin: '1234', phone: '9999900021', hostel: kautilyaHostel._id, mess: kautilyaMess._id, gender: 'male', isDemo: true },
      { firstName: 'Sunita', lastName: 'Devi', email: 'staff.kadambini@messmate.edu', staffId: 'STF-103', staffPin: '1234', phone: '9999900022', hostel: kadambiniHostel._id, mess: kadambiniMess._id, gender: 'female', isDemo: true },
      { firstName: 'Sunil', lastName: 'Paswan', email: 'staff.nagarjuna@messmate.edu', staffId: 'STF-104', staffPin: '1234', phone: '9999900023', hostel: nagarjunaHostel._id, mess: nagarjunaMess._id, gender: 'male', isDemo: true },
      { firstName: 'Santosh', lastName: 'Thakur', email: 'staff.aryabhatta@messmate.edu', staffId: 'STF-105', staffPin: '1234', phone: '9999900024', hostel: aryabhattaHostel._id, mess: aryabhattaMess._id, gender: 'male', isDemo: true }
    ];

    const staffDocs = [];
    for (const s of staffMembers) {
      const doc = await User.create({ ...s, password: 'Password@123', role: ROLES.MESS_STAFF, isDemo: true });
      staffDocs.push(doc);
    }

    // 7. Create Demo Students (Ayush Singh & Priya Kumari)
    const studentDocs = [];
    for (const s of demoStudentsList) {
      const isAyush = s.email === 'student@messmate.edu';
      const hId = isAyush ? kautilyaHostel._id : kadambiniHostel._id;
      const mId = isAyush ? kautilyaMess._id : kadambiniMess._id;

      const st = await User.create({
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        password: 'Password@123',
        role: ROLES.STUDENT,
        rollNumber: s.rollNumber,
        gender: s.gender,
        roomNumber: s.roomNumber,
        phone: s.phone,
        hostel: hId,
        mess: mId,
        isDemo: true
      });
      studentDocs.push(st);
    }
      studentDocs.push(st);
    }
    console.log(`[Seed] Created 2 Essential Demo Student accounts: Ayush Singh (Kautilya) & Priya Kumari (Kadambini). All other roll numbers free for real students.`);

    // 8. Populate Menus for all 4 mess facilities
    const allMesses = [kautilyaMess._id, kadambiniMess._id, nagarjunaMess._id, aryabhattaMess._id];
    for (const item of sampleWeeklyMenu) {
      for (const mId of allMesses) {
        for (const type of [MEAL_TYPES.BREAKFAST, MEAL_TYPES.LUNCH, MEAL_TYPES.DINNER]) {
          await Menu.create({
            mess: mId,
            dayOfWeek: item.day,
            mealType: type,
            dishes: item[type],
            createdBy: managerKautilya._id
          });
        }
      }
    }
    console.log('[Seed] Populated complete 7-day weekly menu for all 4 mess facilities (84 slots).');

    // 9. Generate Daily Sessions for Today + Past 6 Days for Kautilya Mess & Kadambini Mess
    const today = normalizeDate(new Date());

    for (const activeMess of [kautilyaMess._id, kadambiniMess._id]) {
      const isKautilya = activeMess.toString() === kautilyaMess._id.toString();
      const messStaff = isKautilya ? staffDocs[0]._id : staffDocs[2]._id;
      const eligibleStudents = studentDocs.filter(
        (st) => st.mess.toString() === activeMess.toString()
      );

      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const sessionDate = new Date(today);
        sessionDate.setUTCDate(sessionDate.getUTCDate() - dayOffset);

        const sessions = await ensureDailySessions(activeMess, sessionDate);

        for (const sess of sessions) {
          const eligibleCount = eligibleStudents.length || 8;
          let optOuts = 0;
          let actualServed = 0;

          if (dayOffset > 0) {
            sess.status = MEAL_SESSION_STATUS.COMPLETED;
            optOuts = Math.min(2, Math.floor(Math.random() * 2));
            actualServed = Math.max(1, eligibleCount - optOuts);
            sess.optOutCount = optOuts;
            sess.declaredDemand = eligibleCount - optOuts;
            sess.managerAdjustedQuantity = sess.declaredDemand;
            sess.actualServedCount = actualServed;
            await sess.save();

            // Create Attendance records
            const attendanceBatch = [];
            for (let sIdx = 0; sIdx < actualServed && sIdx < eligibleStudents.length; sIdx++) {
              attendanceBatch.push({
                student: eligibleStudents[sIdx]._id,
                mealSession: sess._id,
                verifiedBy: messStaff,
                verificationMethod: sIdx % 4 === 0 ? 'admin_override' : 'qr_scan',
                timestamp: new Date(sess.startTime.getTime() + sIdx * 60000)
              });
            }
            if (attendanceBatch.length > 0) {
              await Attendance.insertMany(attendanceBatch);
            }

            // Create Waste Log
            const surplusKg = Math.round((Math.random() * 3 + 1) * 10) / 10;
            const plateKg = Math.round((Math.random() * 2 + 0.5) * 10) / 10;
            const costLost = Math.round(surplusKg * 50 + plateKg * 35);

            await WasteLog.create({
              mealSession: sess._id,
              mess: activeMess,
              totalPreparedServings: sess.managerAdjustedQuantity,
              totalActualServed: actualServed,
              unservedSurplusWeightKg: surplusKg,
              plateWasteWeightKg: plateKg,
              estimatedCostLostINR: costLost,
              disposalMethod: surplusKg > 3 ? 'biogas' : 'compost',
              remarks: 'Standard session weight measurement verified on kitchen digital scale.',
              recordedBy: messStaff
            });
          }
        }
      }
    }
    console.log('[Seed] Populated 7 days of historical MealSessions, Attendance scans, and WasteLogs.');

    // 10. Populate Raw Inventory Items & Initial Purchases for Kautilya Mess
    const inventoryList = [
      { name: 'Basmati Rice (Grade A)', category: 'grain', unit: 'kg', currentStock: 240, minimumThreshold: 50, unitCostEstimate: 45 },
      { name: 'Sharbati Wheat Flour (Atta)', category: 'grain', unit: 'kg', currentStock: 310, minimumThreshold: 60, unitCostEstimate: 36 },
      { name: 'Toor Dal (Arhar)', category: 'pulse', unit: 'kg', currentStock: 85, minimumThreshold: 25, unitCostEstimate: 140 },
      { name: 'Chana Dal', category: 'pulse', unit: 'kg', currentStock: 95, minimumThreshold: 20, unitCostEstimate: 85 },
      { name: 'Mustard Cooking Oil', category: 'oil', unit: 'litre', currentStock: 18, minimumThreshold: 20, unitCostEstimate: 135 }, // LOW STOCK
      { name: 'Fresh Milk', category: 'dairy', unit: 'litre', currentStock: 45, minimumThreshold: 15, unitCostEstimate: 54 },
      { name: 'Fresh Paneer', category: 'dairy', unit: 'kg', currentStock: 12, minimumThreshold: 15, unitCostEstimate: 320 }, // LOW STOCK
      { name: 'Potatoes (Aloo)', category: 'vegetable', unit: 'kg', currentStock: 150, minimumThreshold: 30, unitCostEstimate: 22 },
      { name: 'Onions (Pyaaz)', category: 'vegetable', unit: 'kg', currentStock: 120, minimumThreshold: 30, unitCostEstimate: 28 },
      { name: 'Garam Masala Blend', category: 'spice', unit: 'kg', currentStock: 8, minimumThreshold: 3, unitCostEstimate: 450 }
    ];

    for (const it of inventoryList) {
      const itemDoc = await InventoryItem.create({ ...it, mess: kautilyaMess._id, lastRestockedAt: new Date() });
      await StockTransaction.create({
        item: itemDoc._id,
        mess: kautilyaMess._id,
        type: 'purchase',
        quantity: it.currentStock,
        previousStock: 0,
        newStock: it.currentStock,
        unitPrice: it.unitCostEstimate,
        vendor: 'Patna Wholesale Grains',
        invoiceNumber: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        remarks: 'Monthly opening stock intake',
        performedBy: managerKautilya._id,
        recordedBy: managerKautilya._id
      });
    }
    console.log('[Seed] Populated 10 Inventory Commodities with low-stock test triggers & stock receipts.');

    // 11. Populate Verified Feedback
    const pastAttendances = await Attendance.find().limit(15);
    for (const att of pastAttendances) {
      await Feedback.create({
        student: att.student,
        mealSession: att.mealSession,
        attendance: att._id,
        ratings: {
          taste: 4,
          hygiene: 5,
          temperature: 4,
          portionSize: 5,
          overall: 5
        },
        comment: 'Fresh, piping hot and well-seasoned. Paneer gravy was excellent.'
      });
    }
    console.log('[Seed] Created verified student feedback records.');

    // 12. Populate Grievance / Complaint Tickets with SLA Tracking
    const ayushStudent = studentDocs.find((s) => s.email === 'student@messmate.edu') || studentDocs[0];
    const priyaStudent = studentDocs.find((s) => s.email === 'priya.kumari@messmate.edu') || studentDocs[studentDocs.length - 1];

    const complaintsSeed = [
      {
        complaintId: 'CMP-2026-0001',
        complainant: ayushStudent._id,
        mess: kautilyaMess._id,
        category: 'hygiene',
        priority: 'high',
        subject: 'Water dispenser filter near dining hall entrance needs cleaning',
        description: 'The cold water dispenser in the dining lobby has a slight odor. Please replace or service the RO filter cartridge.',
        status: 'under_review',
        isConfidential: false,
        resolutionDeadline: new Date(Date.now() + 18 * 3600000)
      },
      {
        complaintId: 'CMP-2026-0002',
        complainant: priyaStudent._id,
        mess: kadambiniMess._id,
        category: 'food_quality',
        priority: 'medium',
        subject: 'Dal salt proportion in Monday dinner was slightly high',
        description: 'Moong dal during Monday night dinner was noticeably salty. Requesting kitchen cooks to taste test before bulk serving.',
        status: 'resolved',
        isConfidential: true,
        resolutionDeadline: new Date(Date.now() - 4 * 3600000),
        resolvedAt: new Date(),
        responses: [
          {
            by: managerKadambini._id,
            role: 'mess_manager',
            message: 'Cooks instructed to use standardized measuring spoons for salt in bulk preparation.',
            isInternal: false,
            createdAt: new Date()
          }
        ]
      }
    ];

    for (const c of complaintsSeed) {
      await Complaint.create(c);
    }
    console.log('[Seed] Seeded sample complaints with SLA timers and confidential mode.');

    // 12. Populate Pinned Announcements
    await Announcement.create({
      title: 'Special Feast on Friday Evening',
      content: 'A special dinner including Veg Biryani, Kadai Paneer, and Gulab Jamun will be served this Friday from 19:30 to 22:00. Advance opt-out cutoff is Friday 15:00.',
      priority: 'important',
      hostel: kautilyaHostel._id,
      mess: kautilyaMess._id,
      publishedBy: managerKautilya._id,
      targetRoles: [ROLES.STUDENT, ROLES.MESS_STAFF, ROLES.MESS_MANAGER]
    });

    await Announcement.create({
      title: 'Kadambini Mess Routine Hygiene Audit',
      content: 'Routine monthly deep-cleaning and pest control scheduled this Sunday after lunch session. Dinner service will resume on normal schedule.',
      priority: 'normal',
      hostel: kadambiniHostel._id,
      mess: kadambiniMess._id,
      publishedBy: managerKadambini._id,
      targetRoles: [ROLES.STUDENT, ROLES.MESS_STAFF, ROLES.MESS_MANAGER]
    });
    console.log('[Seed] Pinned announcements created for Kautilya & Kadambini.');

    console.log('\n======================================================');
    console.log('  MESSMATE COMPREHENSIVE SEEDING COMPLETED');
    console.log('======================================================\n');
    console.log('NIT Patna Hostels Configured:');
    console.table([
      { Hostel: 'Kautilya Hostel', Code: 'H-KAUTILYA', Type: 'Boys', Capacity: 450, Mess: 'Kautilya Central Mess Block' },
      { Hostel: 'Nagarjuna Hostel', Code: 'H-NAGARJUNA', Type: 'Boys', Capacity: 450, Mess: 'Nagarjuna Dining Hall' },
      { Hostel: 'Aryabhatta Hostel', Code: 'H-ARYABHATTA', Type: 'Boys', Capacity: 500, Mess: 'Aryabhatta Food Court' },
      { Hostel: 'Kadambini Hostel', Code: 'H-KADAMBINI', Type: 'Girls', Capacity: 400, Mess: 'Kadambini Dining Facility' }
    ]);

    console.log('\nDemo Credentials for Active Roles:');
    console.table([
      { Role: 'Super Admin', Email: 'admin@messmate.edu', Password: 'Password@123', Access: 'Platform-wide' },
      { Role: 'Mess Manager (Kautilya)', Email: 'manager@messmate.edu', StaffID: 'MGR-101', PIN: '1234', Password: 'Password@123', Access: 'Kautilya Central Mess' },
      { Role: 'Mess Manager (Kadambini)', Email: 'manager.kadambini@messmate.edu', StaffID: 'MGR-102', PIN: '1234', Password: 'Password@123', Access: 'Kadambini Mess' },
      { Role: 'Mess Staff (Kautilya)', Email: 'staff@messmate.edu', StaffID: 'STF-101', PIN: '1234', Password: 'Password@123', Access: 'Kautilya Scanner & Scale' },
      { Role: 'Student (Male - Kautilya)', Email: 'student@messmate.edu', Password: 'Password@123', Roll: ayushStudent.rollNumber },
      { Role: 'Student (Female - Kadambini)', Email: 'priya.kumari@messmate.edu', Password: 'Password@123', Roll: priyaStudent.rollNumber }
    ]);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seed();
