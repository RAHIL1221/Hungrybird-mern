import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { menuAPI } from '../../api';
import { LoadingCenter } from '../../components/ui/Loading';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const { addToCart } = useCart();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    if (searchQuery.trim()) {
      loadSearchResults();
    }
  }, [searchQuery]);

  const loadSearchResults = async () => {
    setLoading(true);
    try {
      const [restaurantsRes, foodsRes] = await Promise.all([
        menuAPI.getRestaurants({ search: searchQuery }),
        menuAPI.searchFoods({ q: searchQuery })
      ]);
      
      setRestaurants(restaurantsRes.data.data);
      setFoods(foodsRes.data.data);
    } catch (err) {
      toast.error('Failed to load search results');
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

  const totalResults = restaurants.length + foods.length;

  return (
    <div className="container page-content">
      <div className="section-header">
        <h1 className="section-title">Search Results for "{searchQuery}"</h1>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          {totalResults} result{totalResults !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="filters-bar">
        <button 
          className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({totalResults})
        </button>
        <button 
          className={`filter-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants ({restaurants.length})
        </button>
        <button 
          className={`filter-btn ${activeTab === 'foods' ? 'active' : ''}`}
          onClick={() => setActiveTab('foods')}
        >
          Dishes ({foods.length})
        </button>
      </div>

      {totalResults === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-magnifying-glass" /></div>
          <div className="empty-state-title">No results found</div>
          <div className="empty-state-text">Try searching with different keywords</div>
        </div>
      ) : (
        <>
          {(activeTab === 'all' || activeTab === 'restaurants') && restaurants.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Restaurants</h2>
              </div>
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
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'foods') && foods.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Dishes</h2>
              </div>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
