import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Utensils, AlertCircle, Clock, Check } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WeeklyMenuView = () => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await api.get('/menus/weekly');
        if (res.success && res.data?.menus) {
          setMenus(res.data.menus);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Filter menus for the selected day
  const dayMenus = menus.filter((m) => m.dayOfWeek === selectedDay);
  const breakfast = dayMenus.find((m) => m.mealType === 'breakfast');
  const lunch = dayMenus.find((m) => m.mealType === 'lunch');
  const dinner = dayMenus.find((m) => m.mealType === 'dinner');

  const renderMealCard = (title, timing, menuData, badgeColor) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
            {title}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {timing}
          </span>
        </div>

        {menuData?.dishes && menuData.dishes.length > 0 ? (
          <div className="space-y-3 mt-4">
            {menuData.dishes.map((dish, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        dish.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    ></span>
                    <h4 className="text-sm font-semibold text-slate-800">{dish.name}</h4>
                  </div>
                  {dish.description && (
                    <p className="text-xs text-slate-500 mt-0.5 ml-4.5">{dish.description}</p>
                  )}
                  {dish.allergens && dish.allergens.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-4.5">
                      {dish.allergens.map((alg, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded"
                        >
                          Contains: {alg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {dish.category?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No dishes published yet for this meal.
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Diet: Balanced Nutrition</span>
        <span className="text-emerald-600 font-medium flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> FSSAI Compliant
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hostel Mess Menu</h1>
        <p className="text-xs text-slate-500 mt-1">
          Weekly rotating schedule. Menus update automatically based on fresh ingredient procurement.
        </p>
      </div>

      {/* Day Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DAYS.map((dayName, idx) => {
          const isToday = new Date().getDay() === idx;
          const isSelected = selectedDay === idx;
          return (
            <button
              key={dayName}
              onClick={() => setSelectedDay(idx)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dayName}
              {isToday && (
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Meals Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading weekly menu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMealCard('Breakfast', '07:30 – 09:30', breakfast, 'bg-amber-100 text-amber-800')}
          {renderMealCard('Lunch', '12:30 – 14:30', lunch, 'bg-emerald-100 text-emerald-800')}
          {renderMealCard('Dinner', '19:30 – 21:30', dinner, 'bg-indigo-100 text-indigo-800')}
        </div>
      )}
    </div>
  );
};

export default WeeklyMenuView;

