import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Save, Calendar, Check, Utensils } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const CATEGORIES = ['staple', 'main_curry', 'side_dish', 'beverage', 'dessert', 'salad_snack'];

export const MenuEditor = () => {
  const [selectedDay, setSelectedDay] = useState(1); // Monday default
  const [selectedMeal, setSelectedMeal] = useState('lunch');
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New dish input state
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('main_curry');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishAllergens, setNewDishAllergens] = useState('');

  // Fetch current menu for day & meal
  const loadMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menus/weekly');
      if (res.success && res.data?.menus) {
        const found = res.data.menus.find(
          (m) => m.dayOfWeek === selectedDay && m.mealType === selectedMeal && !m.isSpecial
        );
        setDishes(found?.dishes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [selectedDay, selectedMeal]);

  const addDish = () => {
    if (!newDishName.trim()) {
      toast.error('Dish name is required');
      return;
    }

    const allergensArr = newDishAllergens
      ? newDishAllergens.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const newDish = {
      name: newDishName.trim(),
      category: newDishCategory,
      isVeg: newDishIsVeg,
      allergens: allergensArr
    };

    setDishes([...dishes, newDish]);
    setNewDishName('');
    setNewDishAllergens('');
  };

  const removeDish = (index) => {
    setDishes(dishes.filter((_, i) => i !== index));
  };

  const saveMenu = async () => {
    try {
      setSaving(true);
      const res = await api.post('/menus', {
        dayOfWeek: selectedDay,
        mealType: selectedMeal,
        dishes
      });

      if (res.success) {
        toast.success(`Menu for ${DAYS[selectedDay]} ${selectedMeal} published!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update menu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Weekly Menu Planner</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure dishes, dietary tags, and allergen warnings for hostel meals.
          </p>
        </div>
        <button
          onClick={saveMenu}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Publishing...' : 'Save & Publish Menu'}
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Day:</span>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {DAYS.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Meal:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {MEALS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMeal(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  selectedMeal === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dish List & Add Dish Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Existing Dishes Column */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>
              Configured Dishes for {DAYS[selectedDay]} ({selectedMeal.toUpperCase()})
            </span>
            <span className="text-xs font-normal text-slate-400">{dishes.length} items</span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading dishes...</div>
          ) : dishes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No dishes added for this slot yet. Use the form on the right to add dishes.
            </div>
          ) : (
            <div className="space-y-2.5">
              {dishes.map((dish, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        dish.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    ></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{dish.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {dish.category?.replace('_', ' ')}
                        </span>
                        {dish.allergens?.length > 0 && (
                          <span className="text-[10px] text-amber-600">
                            • Allergens: {dish.allergens.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDish(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Dish Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Add New Dish</h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Dish Name</label>
            <input
              type="text"
              value={newDishName}
              onChange={(e) => setNewDishName(e.target.value)}
              placeholder="e.g. Paneer Butter Masala"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={newDishCategory}
              onChange={(e) => setNewDishCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs capitalize focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Dietary Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewDishIsVeg(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  newDishIsVeg
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                Veg
              </button>
              <button
                type="button"
                onClick={() => setNewDishIsVeg(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  !newDishIsVeg
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                Non-Veg
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Allergens <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={newDishAllergens}
              onChange={(e) => setNewDishAllergens(e.target.value)}
              placeholder="dairy, gluten, nuts"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={addDish}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Dish to Slot
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuEditor;
