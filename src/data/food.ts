// src/data/food.ts
// Личные блюда для «Доставки на дом». Не привязаны к складу бизнесов.
export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  energyRestore: number;
  description: string;
}

export const FOOD_ITEMS: FoodItem[] = [
  { id: 'coffee', name: 'Кофе', emoji: '☕', price: 300, energyRestore: 15, description: 'Американо, бодрит' },
  { id: 'burger', name: 'Бургер', emoji: '🍔', price: 500, energyRestore: 20, description: 'Сочный бургер с говядиной' },
  { id: 'pizza', name: 'Пицца', emoji: '🍕', price: 800, energyRestore: 30, description: 'Пепперони, 8 кусков' },
  { id: 'energy', name: 'Энергетик', emoji: '🥤', price: 400, energyRestore: 25, description: 'Заряд бодрости' },
  { id: 'sushi', name: 'Суши сет', emoji: '🍣', price: 1200, energyRestore: 50, description: 'Ассорти из 24 штук' },
  { id: 'steak', name: 'Стейк', emoji: '🥩', price: 2000, energyRestore: 70, description: 'Мраморная говядина' },
  { id: 'lobster', name: 'Лобстер', emoji: '🦞', price: 5000, energyRestore: 100, description: 'Деликатес' },
];

export const FOOD_ITEMS_BY_ID: Record<string, FoodItem> = Object.fromEntries(
  FOOD_ITEMS.map((f) => [f.id, f]),
);