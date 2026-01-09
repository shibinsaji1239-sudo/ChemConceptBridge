import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaFlask, FaAtom, FaChalkboardTeacher } from 'react-icons/fa';
import Navbar from '../components/Layout/Navbar';
import api from '../apiClient';
import './SubscriptionPage.css';

const SubscriptionPage = ({ user, isStandalone = false }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  // If user is provided (logged in), we don't show the public navbar because the dashboard has its own sidebar/header.
  // If user is null (guest), we show the public navbar.
  // If isStandalone is true, we show navbar even if logged in (so they can navigate back)
  const showNavbar = !user || isStandalone;

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
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/register');
      }
      return;
    }

    if (!user) {
      navigate('/register');
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
              window.location.href = '/dashboard';
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

  return (
    <div className="subscription-page-wrapper">
      {showNavbar && <Navbar user={user} />}
      <div className="subscription-container" style={{ paddingTop: showNavbar ? '100px' : '4rem' }}>
        <div className="subscription-header">
          <h1>Unlock Your Potential</h1>
        <p>Choose the perfect plan to accelerate your chemistry learning journey. Upgrade anytime as your needs grow.</p>
      </div>

      <div className="plans-container">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
            {plan.featured && <div className="popular-badge">Most Popular</div>}
            
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
              className={`plan-button ${plan.featured ? 'primary' : 'outline'}`}
              onClick={() => handleSubscribe(plan.id)}
            >
              {user ? (plan.price === '0' ? 'Current Plan' : 'Upgrade Now') : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default SubscriptionPage;
