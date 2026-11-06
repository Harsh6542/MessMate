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

const studentNames = [
  { first: 'Aarav', last: 'Sharma' },
  { first: 'Aditi', last: 'Verma' },
  { first: 'Akash', last: 'Gupta' },
  { first: 'Ananya', last: 'Mishra' },
  { first: 'Ayush', last: 'Singh' },
  { first: 'Bhavna', last: 'Patel' },
  { first: 'Chirag', last: 'Jha' },
  { first: 'Deepak', last: 'Choudhary' },
  { first: 'Divya', last: 'Sinha' },
  { first: 'Gaurav', last: 'Kumar' },
  { first: 'Harsh', last: 'Pandey' },
  { first: 'Ishita', last: 'Roy' },
  { first: 'Kunal', last: 'Yadav' },
  { first: 'Manish', last: 'Tiwari' },
  { first: 'Neha', last: 'Kashyap' },
  { first: 'Nikhil', last: 'Rao' },
  { first: 'Pooja', last: 'Kumari' },
  { first: 'Prateek', last: 'Saxena' },
  { first: 'Priya', last: 'Kumari' },
  { first: 'Rahul', last: 'Tripathi' },
  { first: 'Rhea', last: 'Menon' },
  { first: 'Rishabh', last: 'Chauhan' },
  { first: 'Rohan', last: 'Bose' },
  { first: 'Sakshi', last: 'Agrawal' },
  { first: 'Sameer', last: 'Khan' },
  { first: 'Saurav', last: 'Chatterjee' },
  { first: 'Shreya', last: 'Ghosh' },
  { first: 'Sneha', last: 'Reddy' },
  { first: 'Tanmay', last: 'Das' },
  { first: 'Utkarsh', last: 'Dubey' }
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

    // 2. Create 2 Hostels
    const kosiHostel = await Hostel.create({
      name: 'Kosi Hostel',
      code: 'H-KOSI',
      address: 'North Campus, NIT Patna',
      capacity: 450,
      isActive: true
    });

    const gangaHostel = await Hostel.create({
      name: 'Ganga Hall of Residence',
      code: 'H-GANGA',
      address: 'Main Campus, NIT Patna',
      capacity: 550,
      isActive: true
    });
    console.log('[Seed] Hostels created: Kosi Hostel & Ganga Hall of Residence.');

    // 3. Create Super Admin
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@messmate.edu',
      password: 'Password@123',
      role: ROLES.ADMIN,
      phone: '9999900001'
    });

    // 4. Create 2 Hostels Wardens
    const wardenKosi = await User.create({
      firstName: 'Dr. Ramesh',
      lastName: 'Verma',
      email: 'warden@messmate.edu',
      password: 'Password@123',
      role: ROLES.WARDEN,
      phone: '9999900002',
      hostel: kosiHostel._id
    });
    kosiHostel.warden = wardenKosi._id;
    await kosiHostel.save();

    const wardenGanga = await User.create({
      firstName: 'Dr. Alok',
      lastName: 'Srivastava',
      email: 'warden.ganga@messmate.edu',
      password: 'Password@123',
      role: ROLES.WARDEN,
      phone: '9999900003',
      hostel: gangaHostel._id
    });
    gangaHostel.warden = wardenGanga._id;
    await gangaHostel.save();

    // 5. Create 2 Mess Facilities & Managers
    const managerKosi = await User.create({
      firstName: 'Suresh',
      lastName: 'Sharma',
      email: 'manager@messmate.edu',
      password: 'Password@123',
      role: ROLES.MESS_MANAGER,
      phone: '9999900004',
      hostel: kosiHostel._id
    });

    const kosiMess = await MessFacility.create({
      name: 'Kosi Central Mess Block',
      hostel: kosiHostel._id,
      manager: managerKosi._id,
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
    managerKosi.mess = kosiMess._id;
    await managerKosi.save();

    const managerGanga = await User.create({
      firstName: 'Mahesh',
      lastName: 'Prasad',
      email: 'manager.ganga@messmate.edu',
      password: 'Password@123',
      role: ROLES.MESS_MANAGER,
      phone: '9999900005',
      hostel: gangaHostel._id
    });

    const gangaMess = await MessFacility.create({
      name: 'Ganga Dining Complex',
      hostel: gangaHostel._id,
      manager: managerGanga._id,
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
    managerGanga.mess = gangaMess._id;
    await managerGanga.save();

    // 6. Create 4 Mess Staff Members
    const staffMembers = [
      { firstName: 'Raju', lastName: 'Kumar', email: 'staff@messmate.edu', phone: '9999900006', hostel: kosiHostel._id, mess: kosiMess._id },
      { firstName: 'Vikram', lastName: 'Yadav', email: 'staff2@messmate.edu', phone: '9999900007', hostel: kosiHostel._id, mess: kosiMess._id },
      { firstName: 'Sunil', lastName: 'Paswan', email: 'staff.ganga1@messmate.edu', phone: '9999900008', hostel: gangaHostel._id, mess: gangaMess._id },
      { firstName: 'Santosh', lastName: 'Thakur', email: 'staff.ganga2@messmate.edu', phone: '9999900009', hostel: gangaHostel._id, mess: gangaMess._id }
    ];

    const staffDocs = [];
    for (const s of staffMembers) {
      const doc = await User.create({ ...s, password: 'Password@123', role: ROLES.MESS_STAFF });
      staffDocs.push(doc);
    }

    // 7. Create 30 Students (Roll 2201001 - 2201030)
    const studentDocs = [];
    for (let i = 0; i < studentNames.length; i++) {
      const rollNum = (2201001 + i).toString();
      const isKosi = i < 18;
      const hId = isKosi ? kosiHostel._id : gangaHostel._id;
      const mId = isKosi ? kosiMess._id : gangaMess._id;
      const room = `${isKosi ? 'K' : 'G'}-${101 + (i % 25)}`;

      const st = await User.create({
        firstName: studentNames[i].first,
        lastName: studentNames[i].last,
        email: i === 4 ? 'student@messmate.edu' : `${studentNames[i].first.toLowerCase()}.${studentNames[i].last.toLowerCase()}${i}@nitp.ac.in`,
        password: 'Password@123',
        role: ROLES.STUDENT,
        rollNumber: rollNum,
        roomNumber: room,
        phone: `98765${(10000 + i).toString()}`,
        hostel: hId,
        mess: mId
      });
      studentDocs.push(st);
    }
    console.log(`[Seed] Created 30 Student accounts (Rolls 2201001 to 2201030).`);

    // 8. Populate Menus for both messes
    for (const item of sampleWeeklyMenu) {
      for (const mId of [kosiMess._id, gangaMess._id]) {
        for (const type of [MEAL_TYPES.BREAKFAST, MEAL_TYPES.LUNCH, MEAL_TYPES.DINNER]) {
          await Menu.create({
            mess: mId,
            dayOfWeek: item.day,
            mealType: type,
            dishes: item[type],
            createdBy: managerKosi._id
          });
        }
      }
    }
    console.log('[Seed] Populated complete 7-day weekly menu for both mess facilities (42 slots).');

    // 9. Generate Daily Sessions for Today + Past 6 Days (with realistic attendance & waste)
    const today = normalizeDate(new Date());

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const sessionDate = new Date(today);
      sessionDate.setUTCDate(sessionDate.getUTCDate() - dayOffset);

      const sessions = await ensureDailySessions(kosiMess._id, sessionDate);

      for (const sess of sessions) {
        // Compute realistic attendance
        const eligibleCount = 18; // Kosi students
        let optOuts = 0;
        let actualServed = 0;

        if (dayOffset > 0) {
          sess.status = MEAL_SESSION_STATUS.COMPLETED;
          // Randomly create opt-outs for 2-3 students
          optOuts = Math.floor(Math.random() * 3) + 1;
          actualServed = Math.max(12, eligibleCount - optOuts);
          sess.optOutCount = optOuts;
          sess.declaredDemand = eligibleCount - optOuts;
          sess.managerAdjustedQuantity = sess.declaredDemand;
          sess.actualServedCount = actualServed;
          await sess.save();

          // Create Attendance records for served students in batch for fast execution
          const attendanceBatch = [];
          for (let sIdx = 0; sIdx < actualServed; sIdx++) {
            attendanceBatch.push({
              student: studentDocs[sIdx]._id,
              mealSession: sess._id,
              verifiedBy: staffDocs[0]._id,
              verificationMethod: sIdx % 4 === 0 ? 'admin_override' : 'qr_scan',
              timestamp: new Date(sess.startTime.getTime() + sIdx * 60000)
            });
          }
          if (attendanceBatch.length > 0) {
            await Attendance.insertMany(attendanceBatch);
          }

          // Create Waste Log
          const surplusKg = Math.round((Math.random() * 4 + 1) * 10) / 10;
          const plateKg = Math.round((Math.random() * 3 + 0.8) * 10) / 10;
          const costLost = Math.round(surplusKg * 50 + plateKg * 35);

          await WasteLog.create({
            mealSession: sess._id,
            mess: kosiMess._id,
            totalPreparedServings: sess.managerAdjustedQuantity,
            totalActualServed: actualServed,
            unservedSurplusWeightKg: surplusKg,
            plateWasteWeightKg: plateKg,
            estimatedCostLostINR: costLost,
            disposalMethod: surplusKg > 3 ? 'biogas' : 'compost',
            remarks: 'Standard session weight measurement verified on kitchen digital scale.',
            recordedBy: staffDocs[0]._id
          });
        }
      }
    }
    console.log('[Seed] Populated 7 days of historical MealSessions, Attendance scans, and WasteLogs.');

    // 10. Populate Raw Inventory Items & Initial Purchases
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
      const itemDoc = await InventoryItem.create({ ...it, mess: kosiMess._id, lastRestockedAt: new Date() });
      await StockTransaction.create({
        item: itemDoc._id,
        mess: kosiMess._id,
        type: 'purchase',
        quantity: it.currentStock,
        previousStock: 0,
        newStock: it.currentStock,
        unitPrice: it.unitCostEstimate,
        vendor: 'Patna Wholesale Grains',
        invoiceNumber: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
        remarks: 'Monthly opening stock intake',
        performedBy: managerKosi._id,
        recordedBy: managerKosi._id
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
    const complaintsSeed = [
      {
        complaintId: 'CMP-2026-0001',
        complainant: studentDocs[4]._id, // Ayush
        mess: kosiMess._id,
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
        complainant: studentDocs[18]._id, // Priya
        mess: kosiMess._id,
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
            by: managerKosi._id,
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

    // 13. Populate Pinned Announcements
    await Announcement.create({
      title: 'Special Feast on Friday Evening',
      content: 'A special dinner including Veg Biryani, Kadai Paneer, and Gulab Jamun will be served this Friday from 19:30 to 22:00. Advance opt-out cutoff is Friday 15:00.',
      priority: 'important',
      hostel: kosiHostel._id,
      mess: kosiMess._id,
      publishedBy: wardenKosi._id,
      targetRoles: [ROLES.STUDENT, ROLES.MESS_STAFF, ROLES.MESS_MANAGER]
    });
    console.log('[Seed] Pinned announcement created.');

    console.log('\n======================================================');
    console.log('  MESSMATE COMPREHENSIVE SEEDING COMPLETED');
    console.log('======================================================\n');
    console.log('Demo Credentials for All 5 Roles:');
    console.table([
      { Role: 'Super Admin', Email: 'admin@messmate.edu', Password: 'Password@123', Access: 'Platform-wide' },
      { Role: 'Hostel Warden', Email: 'warden@messmate.edu', Password: 'Password@123', Access: 'Kosi Hostel' },
      { Role: 'Warden (Ganga)', Email: 'warden.ganga@messmate.edu', Password: 'Password@123', Access: 'Ganga Hall' },
      { Role: 'Mess Manager', Email: 'manager@messmate.edu', Password: 'Password@123', Access: 'Kosi Central Mess' },
      { Role: 'Mess Staff', Email: 'staff@messmate.edu', Password: 'Password@123', Access: 'Kosi Scanner & Scale' },
      { Role: 'Student 1', Email: 'student@messmate.edu', Password: 'Password@123', Roll: '2201045' },
      { Role: 'Student 2 (Priya)', Email: 'priya.kumari18@nitp.ac.in', Password: 'Password@123', Roll: '2201019' }
    ]);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seed();
