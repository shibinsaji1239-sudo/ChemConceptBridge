import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaFlask, FaAtom, FaChalkboardTeacher, FaCrown } from 'react-icons/fa';
import api from '../../apiClient';
import './SubscriptionModule.css';

const SubscriptionModule = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/user/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Basic Student',
      icon: <FaFlask />,
      price: '0',
      currency: '₹',
      features: [
        { name: 'Access to basic concepts', included: true },
        { name: 'Limited quizzes (5/day)', included: true },
        { name: 'Basic progress tracking', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Personalized learning path', included: false },
        { name: 'Gamification features', included: false },
        { name: 'AR Multimedia access', included: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro Student',
      icon: <FaAtom />,
      price: '830',
      currency: '₹',
      featured: true,
      features: [
        { name: 'Unlimited access to all concepts', included: true },
        { name: 'Unlimited quizzes & practice', included: true },
        { name: 'Advanced progress analytics', included: true },
        { name: 'AI-driven learning path', included: true },
        { name: 'Gamification & Leaderboards', included: true },
        { name: 'Priority support', included: true },
        { name: 'AR Multimedia access', included: true },
      ]
    },
    {
      id: 'teacher',
      name: 'Teacher / Institution',
      icon: <FaChalkboardTeacher />,
      price: '2500',
      currency: '₹',
      features: [
        { name: 'All Pro Student features', included: true },
        { name: 'Classroom management tools', included: true },
        { name: 'Student performance analytics', included: true },
        { name: 'Custom quiz creation', included: true },
        { name: 'Assignment distribution', included: true },
        { name: 'Bulk student import', included: true },
        { name: 'AR Multimedia access', included: true },
      ]
    },
  ];

  const handleSubscribe = async (planId) => {
    if (planId === 'free') {
      // Free plan - just refresh the page or show message
      alert('You are already on the Basic Student plan!');
      return;
    }

    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    try {
      const response = await api.post('/payment/create-order', { planId });
      const order = response.data;

      const options = {
        key: 'rzp_test_S1Fsdwu5K3M4lx',
        amount: order.amount,
        currency: order.currency,
        name: 'ChemConcept Bridge',
        description: `Subscription for ${planId} plan`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payment/verify-payment', {
              ...response,
              planId
            });

            if (verifyRes.status === 200) {
              alert('Subscription successful!');
              // Refresh user data
              const profileRes = await api.get('/user/profile');
              setUser(profileRes.data);
            }
          } catch (verifyError) {
            alert('Payment verification failed: ' + (verifyError.response?.data?.message || verifyError.message));
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#3498db',
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
      });
      rzp1.open();

    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const getCurrentPlan = () => {
    if (!user || !user.subscription) return 'free';
    return user.subscription.plan || 'free';
  };

  const isPlanActive = (planId) => {
    if (!user || !user.subscription) return planId === 'free';
    return user.subscription.plan === planId && user.subscription.status === 'active';
  };

  if (loading) {
    return (
      <div className="subscription-module">
        <div className="module-content">
          <div className="loading">Loading subscription details...</div>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="subscription-module">
      <div className="module-content">
        <div className="subscription-header">
          <h2><FaCrown /> Subscription Management</h2>
          <p>Manage your subscription plan and unlock premium features</p>
        </div>

        {user && (
          <div className="current-plan-status">
            <div className="status-card">
              <h3>Current Plan: {plans.find(p => p.id === currentPlan)?.name || 'Basic Student'}</h3>
              <p>Status: {user.subscription?.status === 'active' ? 'Active' : 'Inactive'}</p>
              {user.subscription?.endDate && (
                <p>Expires: {new Date(user.subscription.endDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}

        <div className="plans-container">
          {plans.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.featured ? 'featured' : ''} ${isPlanActive(plan.id) ? 'current' : ''}`}>
              {plan.featured && <div className="popular-badge">Most Popular</div>}
              {isPlanActive(plan.id) && <div className="current-badge">Current Plan</div>}

              <div className="plan-header">
                <div className="plan-icon">{plan.icon}</div>
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">
                  <span className="plan-currency">{plan.currency}</span>
                  {plan.price}
                  <span className="plan-period">/month</span>
                </div>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ opacity: feature.included ? 1 : 0.5 }}>
                    <span className="feature-icon">
                      {feature.included ?
                        <FaCheckCircle style={{ color: '#2ecc71' }} /> :
                        <FaTimesCircle style={{ color: '#e74c3c' }} />
                      }
                    </span>
                    {feature.name}
                  </li>
                ))}
              </ul>

              <button
                className={`plan-button ${plan.featured ? 'primary' : 'outline'} ${isPlanActive(plan.id) ? 'disabled' : ''}`}
                onClick={() => handleSubscribe(plan.id)}
                disabled={isPlanActive(plan.id)}
              >
                {isPlanActive(plan.id) ? 'Current Plan' : (plan.price === '0' ? 'Free Plan' : 'Upgrade Now')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModule;
