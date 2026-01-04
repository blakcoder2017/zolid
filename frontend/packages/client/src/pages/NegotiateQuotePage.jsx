import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

const NegotiateQuotePage = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = React.useState(null);
  const [negotiations, setNegotiations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  
  // Counter-offer form
  const [counterAmount, setCounterAmount] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  React.useEffect(() => {
    fetchQuoteAndNegotiations();
  }, [quoteId]);

  const fetchQuoteAndNegotiations = async () => {
    try {
      setLoading(true);
      
      // Fetch quote details
      const quoteResponse = await apiClient.get(`/jobs/quotes/${quoteId}`);
      setQuote(quoteResponse.data.quote);
      
      // Fetch negotiation history
      const negotiationsResponse = await apiClient.get(`/jobs/quotes/${quoteId}/negotiations`);
      setNegotiations(negotiationsResponse.data.negotiations || []);
      
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      alert('Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCounterOffer = async (e) => {
    e.preventDefault();
    
    const amountPesewas = Math.floor(parseFloat(counterAmount) * 100);
    
    if (!amountPesewas || amountPesewas < 1000) {
      alert('Minimum counter-offer is GHS 10.00');
      return;
    }
    
    // Validate range (±30%)
    const minAllowed = quote.quoted_fee_pesewas * 0.7;
    const maxAllowed = quote.quoted_fee_pesewas * 1.3;
    
    if (amountPesewas < minAllowed || amountPesewas > maxAllowed) {
      alert(`Counter-offer must be within ±30% of original quote (GHS ${(minAllowed/100).toFixed(2)} - GHS ${(maxAllowed/100).toFixed(2)})`);
      return;
    }
    
    try {
      setSubmitting(true);
      await apiClient.post(`/jobs/quotes/${quoteId}/counter-offer`, {
        offered_amount_pesewas: amountPesewas,
        message: message || null
      });
      
      alert('✅ Counter-offer sent to artisan!');
      setCounterAmount('');
      setMessage('');
      setShowForm(false);
      await fetchQuoteAndNegotiations();
      
    } catch (error) {
      console.error('Failed to send counter-offer:', error);
      alert('Failed to send counter-offer: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOffer = async (negotiationId) => {
    if (!window.confirm('Accept this offer? The quote will be updated to this amount.')) {
      return;
    }
    
    try {
      await apiClient.post(`/jobs/negotiations/${negotiationId}/accept`);
      alert('✅ Offer accepted! You can now proceed to payment.');
      navigate(-1); // Go back to quotes page
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert('Failed to accept offer: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 pb-20">
        <nav className="bg-navy-900 text-white px-6 py-4">
          <img src={logo} alt="ZOLID" className="h-8 w-auto" />
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <p className="text-navy-600 text-center py-8">Loading negotiation...</p>
          </Card>
        </div>
        <BottomNavigation items={navItems} />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-grey-50 pb-20">
        <nav className="bg-navy-900 text-white px-6 py-4">
          <img src={logo} alt="ZOLID" className="h-8 w-auto" />
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <p className="text-navy-600 text-center py-8">Quote not found</p>
            <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Card>
        </div>
        <BottomNavigation items={navItems} />
      </div>
    );
  }

  const latestNegotiation = negotiations[negotiations.length - 1];
  const canSendCounterOffer = quote.negotiation_rounds < 3 && (!latestNegotiation || latestNegotiation.offered_by === 'artisan');

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <nav className="bg-navy-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Back
        </Button>

        <h1 className="font-condensed font-bold text-3xl mb-2">
          Negotiate Quote
        </h1>
        <p className="text-navy-600 mb-6">
          Round {quote.negotiation_rounds + 1} of 3 • Counter-offers must be within ±30%
        </p>

        {/* Original Quote */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              {quote.artisan_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="font-bold text-navy-900">{quote.artisan_name}</h2>
              <p className="text-sm text-navy-600">⭐ {parseFloat(quote.artisan_rating || 0).toFixed(1)}/5.0</p>
            </div>
          </div>
          
          <div className="border-t border-navy-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-navy-600">Original Quote:</span>
              <span className="font-bold text-2xl text-navy-900">
                {formatCurrency(quote.quoted_fee_pesewas)}
              </span>
            </div>
          </div>
        </Card>

        {/* Negotiation Timeline */}
        {negotiations.length > 0 && (
          <Card className="mb-6">
            <h3 className="font-bold text-navy-900 mb-4">Negotiation History</h3>
            <div className="space-y-4">
              {negotiations.map((neg, index) => (
                <div 
                  key={neg.id} 
                  className={`p-4 rounded-lg ${
                    neg.offered_by === 'client' 
                      ? 'bg-indigo-50 border border-indigo-200' 
                      : 'bg-mint-50 border border-mint-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-navy-900">
                        {neg.offered_by === 'client' ? 'You' : quote.artisan_name} Offered
                      </p>
                      <p className="text-sm text-navy-600">
                        Round {neg.round_number} • {new Date(neg.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold text-xl">
                      GHS {(neg.offered_amount_pesewas / 100).toFixed(2)}
                    </p>
                  </div>
                  {neg.message && (
                    <p className="text-sm text-navy-700 mt-2 italic">"{neg.message}"</p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      neg.status === 'ACCEPTED' ? 'bg-mint-500 text-white' :
                      neg.status === 'REJECTED' ? 'bg-coral-500 text-white' :
                      neg.status === 'COUNTER' ? 'bg-indigo-500 text-white' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {neg.status}
                    </span>
                  </div>
                  
                  {/* Accept button for artisan's counter-offers */}
                  {neg.offered_by === 'artisan' && neg.status === 'PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptOffer(neg.id)}
                      className="mt-3"
                    >
                      ✅ Accept This Offer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Counter-Offer Form */}
        {canSendCounterOffer && (
          <>
            {!showForm ? (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowForm(true)}
              >
                💬 Send Counter-Offer
              </Button>
            ) : (
              <Card>
                <h3 className="font-bold text-navy-900 mb-4">Send Counter-Offer</h3>
                <form onSubmit={handleSendCounterOffer}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-navy-700 font-semibold mb-2">
                        Your Offer (GHS)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={(quote.quoted_fee_pesewas * 0.7 / 100).toFixed(2)}
                        max={(quote.quoted_fee_pesewas * 1.3 / 100).toFixed(2)}
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        placeholder="350.00"
                        className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-2xl font-bold"
                        required
                      />
                      <p className="text-navy-500 text-sm mt-1">
                        Range: GHS {(quote.quoted_fee_pesewas * 0.7 / 100).toFixed(2)} - 
                        GHS {(quote.quoted_fee_pesewas * 1.3 / 100).toFixed(2)} (±30%)
                      </p>
                    </div>

                    <div>
                      <label className="block text-navy-700 font-semibold mb-2">
                        Message to Artisan (Optional)
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="My budget is limited, can we meet in the middle?"
                        rows={3}
                        className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowForm(false);
                          setCounterAmount('');
                          setMessage('');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? 'Sending...' : 'Send Offer'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            )}
          </>
        )}

        {quote.negotiation_rounds >= 3 && (
          <Card className="mt-4 bg-coral-50 border-coral-200">
            <p className="text-center text-coral-700 font-semibold">
              Maximum negotiation rounds reached (3). Please accept the current offer or select a different artisan.
            </p>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default NegotiateQuotePage;
