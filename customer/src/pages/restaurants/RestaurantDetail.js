import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { menuAPI } from '../../api';
import { LoadingCenter } from '../../components/ui/Loading';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function RestaurantDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    loadRestaurant();
  }, [id]);

  const loadRestaurant = async () => {
    try {
      const { data } = await menuAPI.getRestaurant(id);
      setRestaurant(data.data.restaurant);
      setMenu(data.data.menu);
    } catch (err) {
      toast.error('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (food) => {
    addToCart(food, restaurant);
    toast.success('Added to cart!');
  };

  if (loading) return <LoadingCenter />;
  if (!restaurant) return <div className="empty-state">Restaurant not found</div>;

  return (
    <>
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '32px 20px' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>
            <img
              src={getImageUrl(restaurant.logo) || 'https://picsum.photos/200/200?random=4'}
              alt={restaurant.name}
              style={{ width: 120, height: 120, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{restaurant.name}</h1>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{restaurant.description}</p>
              <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                {restaurant.rating > 0 && <span><i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> {restaurant.rating.toFixed(1)} ({restaurant.totalReviews || 0})</span>}
                {restaurant.rating === 0 && <span style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-star" style={{ color: '#f59e0b' }} /> No reviews yet</span>}
                <span><i className="fa-solid fa-clock" /> {restaurant.deliveryTime}</span>
                <span><i className="fa-solid fa-location-dot" /> {restaurant.address?.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container page-content">
        {menu.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fa-solid fa-utensils" /></div>
            <div className="empty-state-title">No menu items available</div>
          </div>
        ) : (
          menu.map((group) => (
            <div key={group.category._id} className="section">
              <h2 className="section-title">{group.category.name}</h2>
              <div className="foods-grid">
                {group.items.map((food) => (
                  <div key={food._id} className="food-card">
                    <img src={getImageUrl(food.image) || 'https://picsum.photos/400/300?random=5'} alt={food.name} className="food-img" />
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
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
