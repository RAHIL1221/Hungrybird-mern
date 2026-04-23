import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { menuAPI } from '../../api';
import { LoadingCenter } from '../../components/ui/Loading';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('-rating');
  const { addToCart } = useCart();

  useEffect(() => {
    loadRestaurants();
    loadCategories();
  }, [search, selectedCategory, sort]);

  const loadCategories = async () => {
    try {
      const { data } = await menuAPI.getCategories();
      setCategories(data.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const loadRestaurants = async () => {
    try {
      if (selectedCategory) {
        // Search foods by category
        const { data } = await menuAPI.searchFoods({ category: selectedCategory });
        setFoods(data.data);
        setRestaurants([]);
      } else if (search.trim()) {
        // Search both restaurants by name AND foods by name
        const [restaurantsRes, foodsRes] = await Promise.all([
          menuAPI.getRestaurants({ search, sort }),
          menuAPI.searchFoods({ q: search })
        ]);
        
        // Get restaurants from direct search
        const directRestaurants = restaurantsRes.data.data;
        
        // Get unique restaurants from food search
        const foodRestaurants = [...new Map(
          foodsRes.data.data
            .filter(f => f.restaurant?.status === 'approved' && f.restaurant?.isActive)
            .map(food => [food.restaurant._id, food.restaurant])
        ).values()];
        
        // Combine and deduplicate
        const allRestaurants = [...directRestaurants];
        foodRestaurants.forEach(fr => {
          if (!allRestaurants.find(r => r._id === fr._id)) {
            allRestaurants.push(fr);
          }
        });
        
        setRestaurants(allRestaurants);
        setFoods([]);
      } else {
        const { data } = await menuAPI.getRestaurants({ sort });
        setRestaurants(data.data);
        setFoods([]);
      }
    } catch (err) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (food) => {
    if (!food.restaurant) return;
    addToCart(food, food.restaurant);
    toast.success('Added to cart!');
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="container page-content">
      <div className="section-header">
        <h1 className="section-title">All Restaurants</h1>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search restaurants..."
          className="form-control"
          style={{ maxWidth: 300 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-control" style={{ maxWidth: 200 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="-rating">Top Rated</option>
          <option value="name">Name (A-Z)</option>
          <option value="-createdAt">Newest</option>
        </select>
      </div>

      {categories.length > 0 && (
        <div className="filters-bar" style={{ marginTop: 0 }}>
          <button 
            className={`filter-btn ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`filter-btn ${selectedCategory === cat._id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat._id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {cat.image ? (
                <img 
                  src={getImageUrl(cat.image)} 
                  alt={cat.name}
                  style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <span>{cat.icon || <i className="fa-solid fa-utensils" />}</span>
              )}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {restaurants.length === 0 && foods.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-utensils" /></div>
          <div className="empty-state-title">No results found</div>
          <div className="empty-state-text">Try adjusting your search or filters</div>
        </div>
      ) : (
        <>
          {restaurants.length > 0 && (
            <div className="restaurants-grid">
              {restaurants.map((rest) => (
                <Link key={rest._id} to={`/restaurants/${rest._id}`} className="restaurant-card">
                  <img src={getImageUrl(rest.logo || rest.coverImage) || 'https://picsum.photos/400/300?random=3'} alt={rest.name} className="restaurant-img" />
                  <div className="restaurant-info">
                    <div className="restaurant-name">{rest.name}</div>
                    <div className="restaurant-cuisine">{rest.cuisine?.join(', ')}</div>
                    <div className="restaurant-meta">
                      <span className="restaurant-rating">
                        {rest.rating > 0 ? <><i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> {rest.rating.toFixed(1)}</> : <><i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> New</>}
                      </span>
                      <span className="restaurant-time">{rest.deliveryTime}</span>
                      {rest.deliveryFee > 0 && <span className="restaurant-fee">${rest.deliveryFee} delivery</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {foods.length > 0 && (
            <div className="foods-grid">
              {foods.map((food) => (
                <div key={food._id} className="food-card">
                  <img 
                    src={getImageUrl(food.image) || 'https://picsum.photos/400/300?random=2'} 
                    alt={food.name} 
                    className="food-img"
                    onError={(e) => e.target.src = 'https://picsum.photos/400/300?random=2'}
                  />
                  {food.isVeg && <div className="food-badge"><i className="fa-solid fa-leaf" /> Veg</div>}
                  <div className="food-info">
                    <div className="food-name">{food.name}</div>
                    <div className="food-desc">{food.description}</div>
                    {food.restaurant && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                        <i className="fa-solid fa-location-dot" /> {food.restaurant.name}
                      </div>
                    )}
                    <div className="food-footer">
                      <div>
                        {food.discountPrice > 0 && food.discountPrice < food.price ? (
                          <>
                            <div className="food-price">${food.discountPrice.toFixed(2)}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              ${food.price.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <div className="food-price">${food.price.toFixed(2)}</div>
                        )}
                      </div>
                      <button className="food-add-btn" onClick={() => handleAddToCart(food)}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
