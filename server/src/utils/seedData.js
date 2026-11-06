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
import { ROLES, BILLING_POLICIES, MEAL_TYPES } from '../config/constants.js';
import { ensureDailySessions } from '../services/mealSessionService.js';

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
      { name: 'Idli Vada with Sambar', category: 'staple', isVeg: true, allergens: ['mustard'] },
      { name: 'Boiled Eggs / Sprouts', category: 'side_dish', isVeg: false, allergens: ['egg'] },
      { name: 'Coffee & Tea', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Phulka & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Kadhi Pakora', category: 'main_curry', isVeg: true, allergens: ['dairy'] },
      { name: 'Bhindi Masala Fry', category: 'side_dish', isVeg: true },
      { name: 'Kachumber Salad', category: 'salad_snack', isVeg: true }
    ],
    dinner: [
      { name: 'Roti & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Dal Makhani', category: 'main_curry', isVeg: true, allergens: ['dairy'] },
      { name: 'Mix Veg Korma', category: 'side_dish', isVeg: true },
      { name: 'Kheer', category: 'dessert', isVeg: true, allergens: ['dairy'] }
    ]
  },
  // Wednesday (3)
  {
    day: 3,
    breakfast: [
      { name: 'Poha with Sev & Roasted Peanuts', category: 'staple', isVeg: true, allergens: ['nuts'] },
      { name: 'Jalebi & Curd', category: 'side_dish', isVeg: true, allergens: ['gluten', 'dairy'] },
      { name: 'Ginger Tea', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Roti & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Shahi Paneer', category: 'main_curry', isVeg: true, allergens: ['dairy', 'nuts'] },
      { name: 'Dal Fry & Roasted Papad', category: 'side_dish', isVeg: true }
    ],
    dinner: [
      { name: 'Chapati & Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Chicken Curry / Mushroom Masala', category: 'main_curry', isVeg: false },
      { name: 'Yellow Dal', category: 'side_dish', isVeg: true },
      { name: 'Fruit Salad', category: 'dessert', isVeg: true }
    ]
  },
  // Thursday (4)
  {
    day: 4,
    breakfast: [
      { name: 'Methi / Onion Paratha with Butter', category: 'staple', isVeg: true, allergens: ['gluten', 'dairy'] },
      { name: 'Banana & Boiled Eggs', category: 'side_dish', isVeg: false, allergens: ['egg'] },
      { name: 'Tea / Hot Milk', category: 'beverage', isVeg: true, allergens: ['dairy'] }
    ],
    lunch: [
      { name: 'Roti & Steamed Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Kala Chana Masala', category: 'main_curry', isVeg: true },
      { name: 'Aloo Jeera', category: 'side_dish', isVeg: true },
      { name: 'Curd & Pickle', category: 'salad_snack', isVeg: true, allergens: ['dairy'] }
    ],
    dinner: [
      { name: 'Phulka & Rice', category: 'staple', isVeg: true, allergens: ['gluten'] },
      { name: 'Palak Paneer', category: 'main_curry', isVeg: true, allergens: ['dairy'] },
      { name: 'Chana Dal Tadka', category: 'side_dish', isVeg: true },
      { name: 'Ice Cream', category: 'dessert', isVeg: true, allergens: ['dairy'] }
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

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmate_dev';
    await mongoose.connect(uri);
    console.log('[Seed] Connected to database.');

    // 1. Clean existing records
    await User.deleteMany({});
    await Hostel.deleteMany({});
    await MessFacility.deleteMany({});
    await Menu.deleteMany({});
    await MealSession.deleteMany({});
    await MealDeclaration.deleteMany({});
    await Coupon.deleteMany({});
    await Attendance.deleteMany({});
    console.log('[Seed] Cleared existing records.');

    // 2. Create Hostels
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

    console.log('[Seed] Created sample Hostels.');

    // 3. Create Users
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@messmate.edu',
      password: 'Password@123',
      role: ROLES.ADMIN,
      phone: '9999900001'
    });

    const warden = await User.create({
      firstName: 'Dr. Ramesh',
      lastName: 'Verma',
      email: 'warden@messmate.edu',
      password: 'Password@123',
      role: ROLES.WARDEN,
      phone: '9999900002',
      hostel: kosiHostel._id
    });
    kosiHostel.warden = warden._id;
    await kosiHostel.save();

    const manager = await User.create({
      firstName: 'Suresh',
      lastName: 'Sharma',
      email: 'manager@messmate.edu',
      password: 'Password@123',
      role: ROLES.MESS_MANAGER,
      phone: '9999900003',
      hostel: kosiHostel._id
    });

    // 4. Create Mess Facility
    const messFacility = await MessFacility.create({
      name: 'Kosi Central Mess Block',
      hostel: kosiHostel._id,
      manager: manager._id,
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

    manager.mess = messFacility._id;
    await manager.save();

    const staff = await User.create({
      firstName: 'Raju',
      lastName: 'Kumar',
      email: 'staff@messmate.edu',
      password: 'Password@123',
      role: ROLES.MESS_STAFF,
      phone: '9999900004',
      hostel: kosiHostel._id,
      mess: messFacility._id
    });

    const student = await User.create({
      firstName: 'Ayush',
      lastName: 'Singh',
      email: 'student@messmate.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      rollNumber: '2201045',
      phone: '9999900005',
      hostel: kosiHostel._id,
      mess: messFacility._id
    });

    // Second sample student
    const student2 = await User.create({
      firstName: 'Priya',
      lastName: 'Kumari',
      email: 'priya@messmate.edu',
      password: 'Password@123',
      role: ROLES.STUDENT,
      rollNumber: '2201046',
      phone: '9999900006',
      hostel: kosiHostel._id,
      mess: messFacility._id
    });

    // 5. Populate Complete 7-Day Weekly Menu
    for (const item of sampleWeeklyMenu) {
      // Breakfast
      await Menu.create({
        mess: messFacility._id,
        dayOfWeek: item.day,
        mealType: MEAL_TYPES.BREAKFAST,
        dishes: item.breakfast,
        createdBy: manager._id
      });
      // Lunch
      await Menu.create({
        mess: messFacility._id,
        dayOfWeek: item.day,
        mealType: MEAL_TYPES.LUNCH,
        dishes: item.lunch,
        createdBy: manager._id
      });
      // Dinner
      await Menu.create({
        mess: messFacility._id,
        dayOfWeek: item.day,
        mealType: MEAL_TYPES.DINNER,
        dishes: item.dinner,
        createdBy: manager._id
      });
    }
    console.log('[Seed] Populated complete 7-day weekly menu (21 meal slots).');

    // 6. Generate Today's Meal Sessions
    await ensureDailySessions(messFacility._id, new Date());
    console.log("[Seed] Generated today's meal sessions (Breakfast, Lunch, Dinner).");

    console.log('[Seed] Ready! Credentials:');
    console.table([
      { Role: 'Admin', Email: 'admin@messmate.edu', Password: 'Password@123' },
      { Role: 'Warden', Email: 'warden@messmate.edu', Password: 'Password@123' },
      { Role: 'Mess Manager', Email: 'manager@messmate.edu', Password: 'Password@123' },
      { Role: 'Mess Staff', Email: 'staff@messmate.edu', Password: 'Password@123' },
      { Role: 'Student 1', Email: 'student@messmate.edu', Password: 'Password@123', Roll: '2201045' },
      { Role: 'Student 2', Email: 'priya@messmate.edu', Password: 'Password@123', Roll: '2201046' }
    ]);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seed();
