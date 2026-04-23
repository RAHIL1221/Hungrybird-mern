import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { menuAPI } from '../../api';
import { LoadingCenter } from '../../components/ui/Loading';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, restRes, foodRes] = await Promise.all([
        menuAPI.getCategories(),
        menuAPI.getFeaturedRestaurants(),
        menuAPI.getFeaturedFoods(),
      ]);
      setCategories(catRes.data.data);
      setRestaurants(restRes.data.data);
      setFoods(foodRes.data.data);
      
      // Debug: Log food data to see image paths
      console.log('Foods loaded:', foodRes.data.data);
      if (foodRes.data.data.length > 0) {
        console.log('First food image path:', foodRes.data.data[0].image);
        console.log('Image URL will be:', getImageUrl(foodRes.data.data[0].image));
      }
    } catch (err) {
      toast.error('Failed to load data');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (food) => {
    if (!food.restaurant) return;
    addToCart(food, food.restaurant);
    toast.success('Added to cart!');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/restaurants?category=${categoryId}`);
  };

  if (loading) return <LoadingCenter />;

  return (
    <>
      <div className="hero">
        <div className="container">
          <h1>Order Food Online</h1>
          <p>Delicious food delivered to your doorstep</p>
          <form onSubmit={handleSearch} className="hero-search">
            <span className="hero-search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
            <input 
              type="text" 
              placeholder="Search for restaurants or dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" style={{ 
              position: 'absolute', 
              right: 4, 
              top: '50%', 
              transform: 'translateY(-50%)',
              padding: '10px 28px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)'
            }}
            onMouseEnter={(e) => e.target.style.background = '#ff5722'}
            onMouseLeave={(e) => e.target.style.background = 'var(--primary)'}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="container page-content">
        {categories.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Browse by Category</h2>
            </div>
            <div className="categories-grid">
              {categories.slice(0, 8).map((cat) => (
                <div 
                  key={cat._id} 
                  className="category-card"
                  onClick={() => handleCategoryClick(cat._id)}
                  style={{ cursor: 'pointer' }}
                >
                  {cat.image ? (
                    <img 
                      src={getImageUrl(cat.image)} 
                      alt={cat.name} 
                      style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }}
                      onError={(e) => e.target.src = 'https://via.placeholder.com/60?text=' + cat.name.charAt(0)}
                    />
                  ) : (
                    <div className="category-icon"><i className="fa-solid fa-utensils" /></div>
                  )}
                  <div className="category-name">{cat.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {restaurants.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Featured Restaurants</h2>
              <Link to="/restaurants" className="section-link">
                View All →
              </Link>
            </div>
            <div className="restaurants-grid">
              {restaurants.map((rest) => (
                <Link key={rest._id} to={`/restaurants/${rest._id}`} className="restaurant-card">
                  <img src={getImageUrl(rest.logo || rest.coverImage) || 'https://picsum.photos/400/300?random=1'} alt={rest.name} className="restaurant-img" />
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
          </div>
        )}

        {foods.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Popular Dishes</h2>
            </div>
            <div className="foods-grid">
              {foods.map((food) => {
                const imageUrl = getImageUrl(food.image) || 'https://picsum.photos/400/300?random=2';
                console.log(`Food: ${food.name}, Image path: ${food.image}, Full URL: ${imageUrl}`);
                return (
                  <div key={food._id} className="food-card">
                    <img 
                      src={imageUrl} 
                      alt={food.name} 
                      className="food-img"
                      onError={(e) => {
                        console.error(`Failed to load image for ${food.name}:`, imageUrl);
                        e.target.src = 'https://picsum.photos/400/300?random=2';
                      }}
                    />
                    {food.isVeg && <div className="food-badge"><i className="fa-solid fa-leaf" /> Veg</div>}
                    <div className="food-info">
                      <div className="food-name">{food.name}</div>
                      <div className="food-desc">{food.description}</div>
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
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
