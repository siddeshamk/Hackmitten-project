import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, ArrowRight, AudioLines, Check, ChevronDown, CircleHelp, Database, Headphones, Heart, Laptop, ListChecks, Network, Search, Server, ShieldAlert, ShieldCheck, ShoppingBag, Sparkles, Truck, X, Zap, GitBranch, LockKeyhole, UserRound, LogOut, MapPin, Map, Plus, Minus, Trash2, CreditCard, Package } from 'lucide-react'
import './styles.css'

const SIGNALROOT_URL = import.meta.env.VITE_SIGNALROOT_URL || 'http://127.0.0.1:5173'
const failureScenarios = [
  { id: 'database_pool', name: 'Database connection pool exhaustion', description: 'Simulates saturated database connections, slow queries, and intermittent request failures.', severity: 'HIGH', Icon: Database },
  { id: 'app_exception', name: 'Application exception', description: 'Simulates an unhandled exception on selected application requests.', severity: 'HIGH', Icon: Zap },
  { id: 'network_timeout', name: 'Network latency / timeout', description: 'Simulates delayed communication between the API and a downstream service.', severity: 'MEDIUM', Icon: Network },
  { id: 'queue_backlog', name: 'Background queue backlog', description: 'Simulates a slow background worker and delayed jobs.', severity: 'MEDIUM', Icon: Activity },
  { id: 'bad_config', name: 'Bad configuration / deployment', description: 'Simulates a configuration change causing cascading failures.', severity: 'CRITICAL', Icon: GitBranch },
  { id: 'auth_session', name: 'Authentication / session issue', description: 'Simulates invalid session configuration and authentication failures.', severity: 'MEDIUM', Icon: ShieldCheck },
  { id: 'duplicate_user', name: 'Duplicate username validation', description: 'Simulates a registration conflict and uniqueness validation.', severity: 'LOW', Icon: ListChecks },
  { id: 'downstream_service', name: 'Downstream microservice unavailable', description: 'Simulates one dependency becoming unavailable while other routes remain healthy.', severity: 'HIGH', Icon: Server },
]


const actionLocations = {
  database_pool: [
    { value: 'inventory_lookup', label: 'Inventory lookup' },
    { value: 'checkout_order_creation', label: 'Checkout / order creation' },
    { value: 'product_search', label: 'Product search' },
  ],
  network_timeout: [
    { value: 'product_recommendations', label: 'Product recommendations' },
    { value: 'inventory_lookup', label: 'Inventory lookup' },
    { value: 'shipping_estimate', label: 'Shipping estimate' },
    { value: 'payment_request', label: 'Payment request' },
    { value: 'product_search', label: 'Product search' },
  ],
  bad_config: [
    { value: 'api_gateway', label: 'API Gateway' },
    { value: 'checkout', label: 'Checkout' },
    { value: 'payment_integration', label: 'Payment integration' },
  ],
  duplicate_user: [
    { value: 'registration', label: 'Registration page' },
    { value: 'user_service', label: 'User Service' },
  ],
  app_exception: [
    { value: 'product_details', label: 'Product details' },
    { value: 'cart_calculation', label: 'Cart calculations' },
    { value: 'checkout', label: 'Checkout' },
    { value: 'order_creation', label: 'Order creation' },
  ],
  queue_backlog: [
    { value: 'background_worker', label: 'Background worker' },
    { value: 'order_notifications', label: 'Order notifications' },
  ],
  auth_session: [
    { value: 'login', label: 'Login / session validation' },
    { value: 'checkout', label: 'Authenticated checkout' },
  ],
  downstream_service: [
    { value: 'inventory_lookup', label: 'Inventory service' },
    { value: 'shipping_estimate', label: 'Shipping service' },
    { value: 'payment_request', label: 'Payment service' },
  ],
}

const coreProducts = [
  { id: 'p1', name: 'Aura Wireless Headphones', category: 'Electronics', price: '₹4,499', old: '₹5,999', rating: '4.8', tag: 'Bestseller', color: 'lavender', icon: Headphones, desc: 'Immersive sound, 40-hour battery, and all-day comfort.' },
  { id: 'p2', name: 'Pulse ANC Headphones', category: 'Electronics', price: '₹6,999', old: '₹8,499', rating: '4.7', tag: 'Noise cancelling', color: 'mint', icon: AudioLines, desc: 'Adaptive noise cancellation for focused listening.' },
  { id: 'p3', name: 'Nova Ultrabook 14', category: 'Electronics', price: '₹64,990', old: '₹72,990', rating: '4.6', tag: 'New arrival', color: 'sand', icon: Laptop, desc: 'A lightweight everyday laptop with a crisp 14-inch display.' },
  { id: 'p4', name: 'Studio Buds Pro', category: 'Electronics', price: '₹3,299', old: '₹4,199', rating: '4.5', tag: 'Popular', color: 'rose', icon: Headphones, desc: 'Pocket-sized earbuds with rich sound and clear calls.' },
]
const extraProducts = [
  ...[
    ['e1','LED Smart Bulb 9W','₹399','₹499','Smart lighting for every room.'],['e2','Power Strip 6 Socket','₹799','₹999','Surge-protected multi-plug power strip.'],['e3','USB-C Fast Charger 45W','₹1,299','₹1,599','Compact fast charging adapter.'],['e4','Table Fan 400mm','₹1,899','₹2,299','Quiet airflow with three speed settings.'],['e5','Electric Kettle 1.5L','₹1,099','₹1,399','Stainless steel quick-boil kettle.'],['e6','Mixer Grinder 500W','₹2,499','₹2,999','Everyday blending and grinding.'],['e7','Emergency LED Torch','₹549','₹699','Rechargeable torch for power cuts.'],['e8','Extension Cable 5m','₹449','₹599','Durable cable for home and office.'],['e9','Induction Cooktop','₹2,799','₹3,299','Efficient countertop cooking.'],['e10','Voltage Stabilizer','₹1,699','₹1,999','Voltage protection for compatible appliances.']
  ].map(([id,name,price,old,desc],i)=>({id,name,category:'Electrical',price,old,rating:(4.3+(i%6)*0.1).toFixed(1),tag:i===0?'Energy saver':'Home essential',color:['sand','mint','lavender','rose'][i%4],icon:[Zap,PlugIcon,LightIcon,FanIcon][i%4],desc})),
  ...[
    ['g1','Basmati Rice 5kg','₹699','₹799','Aromatic long-grain rice.'],['g2','Whole Wheat Atta 5kg','₹289','₹329','Everyday whole wheat flour.'],['g3','Toor Dal 1kg','₹169','₹199','Protein-rich pantry staple.'],['g4','Sunflower Oil 1L','₹149','₹179','Light cooking oil.'],['g5','Tata Salt 1kg','₹28','₹32','Iodised salt for daily cooking.'],['g6','Green Tea 25 Bags','₹199','₹249','Refreshing tea bags.'],['g7','Rolled Oats 1kg','₹179','₹219','A wholesome breakfast option.'],['g8','Creamy Peanut Butter','₹249','₹299','Creamy spread for snacks.'],['g9','Mixed Nuts 500g','₹499','₹599','A crunchy snack mix.'],['g10','Dark Chocolate 70%','₹149','₹179','Rich dark chocolate treat.']
  ].map(([id,name,price,old,desc],i)=>({id,name,category:'Grocery',price,old,rating:(4.2+(i%7)*0.1).toFixed(1),tag:i===0?'Pantry pick':'Daily essential',color:['mint','sand','rose','lavender'][i%4],icon:[ShoppingBag,Package,Truck,Heart][i%4],desc})),
  ...[
    ['t1','Building Blocks 120pc','₹599','₹799','Creative colourful construction blocks.'],['t2','Remote Control Car','₹999','₹1,299','Rechargeable RC car for racing fun.'],['t3','Plush Teddy Bear','₹499','₹649','Soft cuddly plush companion.'],['t4','Wooden Puzzle Set','₹349','₹449','Shape and pattern learning puzzle.'],['t5','Kids Art Kit','₹399','₹549','Crayons, paints, and drawing supplies.'],['t6','Mini Doctor Play Set','₹549','₹699','Pretend-play medical kit.'],['t7','Dinosaur Figure Set','₹449','₹599','Adventure-ready dinosaur figures.'],['t8','Board Game Family Pack','₹799','₹999','Family game-night favourites.'],['t9','Flying Disc Set','₹199','₹299','Outdoor play for parks and gardens.'],['t10','Toy Train Track Set','₹1,199','₹1,499','Train and track starter set.']
  ].map(([id,name,price,old,desc],i)=>({id,name,category:'Toys',price,old,rating:(4.3+(i%6)*0.1).toFixed(1),tag:i===0?'Kids favourite':'Play & learn',color:['lavender','rose','mint','sand'][i%4],icon:[Package,Truck,Heart,Activity][i%4],desc})),
]
function PlugIcon(props){return <Zap {...props}/>}
function LightIcon(props){return <Sparkles {...props}/>}
function FanIcon(props){return <Activity {...props}/>}
const products = [...coreProducts, ...extraProducts]


function App() {
  const [query, setQuery] = useState('wireless headphones')
  const [selectedScenario, setSelectedScenario] = useState('network_timeout')
  const [actionLocation, setActionLocation] = useState('product_recommendations')
  const availableActions = actionLocations[selectedScenario] || actionLocations.network_timeout
  useEffect(() => { if (!availableActions.some(action => action.value === actionLocation)) setActionLocation(availableActions[0].value) }, [selectedScenario])
  const [loading, setLoading] = useState(false)
  const [cartFailureLoading, setCartFailureLoading] = useState(false)
  const [error, setError] = useState('')
  const [incident, setIncident] = useState(null)
  const [assistantSummary, setAssistantSummary] = useState('')
  const [assistantMode, setAssistantMode] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [wish, setWish] = useState([])
  const [searched, setSearched] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('shopsphere_cart') || '[]') } catch { return [] } })
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentReady, setPaymentReady] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [address, setAddress] = useState(() => { try { return JSON.parse(localStorage.getItem('shopsphere_address') || '{\"fullName\":\"\",\"phone\":\"\",\"line1\":\"\",\"city\":\"\",\"postalCode\":\"\"}') } catch { return { fullName:'', phone:'', line1:'', city:'', postalCode:'' } } })
  const [orderMessage, setOrderMessage] = useState('')

  async function searchProducts(event) {
    event?.preventDefault()
    const term = query.trim()
    if (term.length < 2) { setError('Enter at least two characters to search.'); return }
    setLoading(true); setError(''); setIncident(null); setAssistantSummary(''); setAssistantMode(''); setAssistantLoading(false); setDismissed(false); setSearched(true)
    try {
      const response = await fetch('/api/shopsphere/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term, scenario: 'network_timeout', user_action: 'product_search' }),
      })
      const payload = await response.json().catch(() => ({}))
      if (payload.incident?.id) {
        setIncident({ ...payload.incident, trace_id: payload.trace_id, request_id: payload.request_id, failure_code: payload.failure_code })
        setError(`${payload.scenario_name || 'Failure scenario'} reproduced at Product search (HTTP ${payload.http_status || response.status}). SignalRoot recorded the incident and its evidence.`)
        setAssistantLoading(true)
        fetch('/api/assistant/investigate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incident_id: payload.incident.id, question: 'Summarize the strongest evidence for this ShopSphere search timeout and recommend the next two investigation steps. Clearly separate facts from hypotheses.' }),
        }).then(async r => {
          const answer = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(answer.detail || 'Assistant request failed')
          setAssistantSummary(answer.answer || 'Incident recorded. Open SignalRoot for the full investigation.')
          setAssistantMode(answer.mode || 'evidence-fallback')
        }).catch(() => {
          setAssistantSummary('The timeout and correlated trace evidence have been recorded. Open SignalRoot to review the full timeline and competing hypotheses.')
          setAssistantMode('summary-unavailable')
        }).finally(() => setAssistantLoading(false))
      } else if (!response.ok) {
        setError(payload.detail || `Search failed with HTTP ${response.status}.`)
      } else {
        setError('The demo expected a timeout response but received a successful response. Check the backend configuration.')
      }
    } catch (e) {
      setError('Cannot reach the demo API. Start the SignalRoot FastAPI backend on port 8000 and try again.')
    } finally { setLoading(false) }
  }

  async function triggerAuthSessionFailure() {
    setAuthBusy(true); setAuthError(''); setAuthMessage(''); setError('');
    setIncident(null); setAssistantSummary(''); setAssistantMode(''); setAssistantLoading(false); setDismissed(false);
    try {
      const response = await fetch('/api/shopsphere/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `Login attempt for ${authUsername.trim() || 'demo user'}`, scenario: 'auth_session', user_action: 'login' }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!payload.incident?.id) throw new Error(payload.detail || `Unable to create demo incident (HTTP ${response.status}).`);
      setIncident({ ...payload.incident, trace_id: payload.trace_id, request_id: payload.request_id, failure_code: payload.failure_code, http_status: payload.http_status, user_action: payload.user_action, target_area: payload.target_area, search_query: payload.search_query });
      setAuthOpen(false);
      setAuthError('Demo session configuration failure reproduced. SignalRoot recorded the incident.');
      setAssistantLoading(true);
      fetch('/api/assistant/investigate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: payload.incident.id, question: 'Investigate this ShopSphere authentication/session failure at login. Summarize observed evidence, separate facts from hypotheses, and recommend two checks for session/token configuration.' }),
      }).then(async r => {
        const answer = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(answer.detail || 'Assistant request failed');
        setAssistantSummary(answer.answer || 'Authentication incident recorded. Open SignalRoot for the full investigation.');
        setAssistantMode(answer.mode || 'evidence-fallback');
      }).catch(() => {
        setAssistantSummary('The simulated login/session failure and linked trace evidence were recorded. Open SignalRoot to inspect authentication evidence and session configuration hypotheses.');
        setAssistantMode('summary-unavailable');
      }).finally(() => setAssistantLoading(false));
    } catch (err) {
      setAuthError(err.message || 'Cannot reach SignalRoot. Ensure the backend is running.');
    } finally { setAuthBusy(false); }
  }

  async function triggerCartPoolFailure(product) {
    // Deliberate demo fault: adding a product simulates a saturated database pool.
    // The backend records the incident and linked telemetry; the cart is not modified.
    setCartFailureLoading(true)
    setError('')
    setIncident(null)
    setAssistantSummary('')
    setAssistantMode('')
    setAssistantLoading(false)
    setDismissed(false)
    try {
      const response = await fetch('/api/shopsphere/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: product.name,
          scenario: 'database_pool',
          user_action: 'cart_calculation',
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!payload.incident?.id) {
        throw new Error(payload.detail || `Unable to record cart failure (HTTP ${response.status}).`)
      }
      setIncident({
        ...payload.incident,
        trace_id: payload.trace_id,
        request_id: payload.request_id,
        failure_code: payload.failure_code,
        http_status: payload.http_status || response.status,
        user_action: payload.user_action || 'cart_calculation',
        target_area: payload.target_area || 'cart calculations',
        search_query: payload.search_query || product.name,
      })
      setOrderMessage(`${product.name} could not be added because the demo database connection pool is exhausted.`)
      setError(`Database connection pool exhaustion reproduced at cart calculations (HTTP ${payload.http_status || response.status}). SignalRoot recorded the incident and its evidence.`)
      setAssistantLoading(true)
      fetch('/api/assistant/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: payload.incident.id,
          question: `Investigate this ShopSphere database connection pool exhaustion during Add to Cart for ${product.name}. Summarize the recorded evidence, separate facts from hypotheses, and recommend two checks for connection saturation and query latency.`,
        }),
      }).then(async r => {
        const answer = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(answer.detail || 'Assistant request failed')
        setAssistantSummary(answer.answer || 'The cart failure and correlated evidence were recorded. Open SignalRoot for the full investigation.')
        setAssistantMode(answer.mode || 'evidence-fallback')
      }).catch(() => {
        setAssistantSummary('The database-pool failure and linked trace evidence were recorded. Open SignalRoot to inspect connection saturation, query latency, and the correlated timeline.')
        setAssistantMode('summary-unavailable')
      }).finally(() => setAssistantLoading(false))
    } catch (err) {
      setError(err.message || 'Cannot reach SignalRoot. Ensure the backend is running.')
    } finally {
      setCartFailureLoading(false)
    }
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthBusy(true); setAuthMessage(''); setAuthError('')
    try {
      const isRegister = authMode === 'register'
      const response = await fetch(isRegister ? '/api/shopsphere/register' : '/api/shopsphere/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername.trim(), password: authPassword, ...(isRegister && authEmail.trim() ? { email: authEmail.trim() } : {}) }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok && isRegister && response.status === 409) {
        const detail = payload.detail && typeof payload.detail === 'object' ? payload.detail : {}
        const suggestedUsername = detail.suggestion || `${authUsername.trim()}1`
        setAuthError(detail.message || (typeof payload.detail === 'string' ? payload.detail : 'That username already exists.'))
        // Record the conflict as a real linked SignalRoot demo incident.
        const incidentResponse = await fetch('/api/shopsphere/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `Duplicate username registration: ${authUsername.trim()}`, scenario: 'duplicate_user', user_action: 'registration' }),
        })
        const incidentPayload = await incidentResponse.json().catch(() => ({}))
        if (!incidentPayload.incident?.id) throw new Error(incidentPayload.detail || 'Username conflict detected, but SignalRoot could not record the incident.')
        setIncident({ ...incidentPayload.incident, trace_id: incidentPayload.trace_id, request_id: incidentPayload.request_id, failure_code: incidentPayload.failure_code, http_status: incidentPayload.http_status || 409, user_action: 'registration', target_area: 'Registration page', search_query: authUsername.trim(), suggested_username: suggestedUsername })
        setAuthOpen(false)
        setDismissed(false)
        setAssistantSummary('')
        setAssistantMode('')
        setAssistantLoading(true)
        fetch('/api/assistant/investigate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incident_id: incidentPayload.incident.id, question: `Investigate this duplicate username registration conflict for '${authUsername.trim()}'. Explain the HTTP 409 uniqueness conflict and safely suggest the available alternative username '${suggestedUsername}'.` }),
        }).then(r => r.json()).then(answer => {
          setAssistantSummary(`${answer.answer || 'Duplicate username conflict recorded.'}\n\nSuggested available username: ${suggestedUsername}`)
          setAssistantMode(answer.mode || 'evidence-fallback')
        }).catch(() => {
          setAssistantSummary(`The username '${authUsername.trim()}' already exists. Try the suggested alternative '${suggestedUsername}', or switch to Sign in. SignalRoot recorded the registration conflict for investigation.`)
          setAssistantMode('evidence-fallback')
        }).finally(() => setAssistantLoading(false))
        return
      }
      if (!response.ok && !isRegister && response.status === 401) {
        // Demo behavior: surface failed login attempts in SignalRoot without revealing whether
        // the username exists. The controlled incident is explicitly labeled as a login/auth event.
        const incidentResponse = await fetch('/api/shopsphere/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `ShopSphere login authentication failure for ${authUsername.trim()}`, scenario: 'auth_session', user_action: 'login' }),
        })
        const incidentPayload = await incidentResponse.json().catch(() => ({}))
        if (incidentPayload.incident?.id) {
          setIncident({ ...incidentPayload.incident, trace_id: incidentPayload.trace_id, request_id: incidentPayload.request_id, failure_code: incidentPayload.failure_code, http_status: incidentPayload.http_status || 401, user_action: 'login', target_area: 'Login / session validation', search_query: authUsername.trim() })
          setAuthOpen(false)
          setDismissed(false)
          setAssistantSummary('A login authentication failure was recorded for investigation. The user-facing credential error remains generic to avoid disclosing account details.')
          setAssistantMode('evidence-fallback')
          setAssistantLoading(false)
          setAuthPassword('')
          return
        }
      }
      if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : (payload.detail?.message || 'Unable to complete your request.'))
      if (isRegister) {
        setAuthMessage('Account created successfully. Sign in with your new credentials.')
        setAuthMode('login'); setAuthPassword('')
      } else {
        setCurrentUser(payload.user)
        setAuthMessage(payload.message || 'Signed in successfully.')
        setAuthPassword('')
        window.setTimeout(() => setAuthOpen(false), 900)
      }
    } catch (err) {
      setAuthError(err.message || 'Unable to connect to the ShopSphere account service.')
    } finally { setAuthBusy(false) }
  }

  useEffect(() => { localStorage.setItem('shopsphere_cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('shopsphere_address', JSON.stringify(address)) }, [address])
  function addToCart(product, qty=1) { setCart(prev => { const found=prev.find(x=>x.id===product.id); return found ? prev.map(x=>x.id===product.id?{...x,qty:x.qty+qty}:x) : [...prev,{...product,qty}] }); setOrderMessage(`${product.name} added to cart.`) }
  function changeQty(id, delta) { setCart(prev=>prev.map(x=>x.id===id?{...x,qty:x.qty+delta}:x).filter(x=>x.qty>0)) }
  function priceValue(value) { return Number(String(value).replace(/[^0-9]/g,'')) || 0 }
  const cartCount = cart.reduce((sum,item)=>sum+item.qty,0)
  const cartTotal = cart.reduce((sum,item)=>sum+priceValue(item.price)*item.qty,0)
  function buyNow(product) { addToCart(product); setCheckoutOpen(true); setCartOpen(false); setOrderMessage(''); setPaymentReady(false); setPaymentSubmitted(false) }
  function placeDemoOrder(event) {
    event.preventDefault()
    if (!address.fullName.trim() || !address.phone.trim() || !address.line1.trim() || !address.city.trim() || !address.postalCode.trim()) {
      setOrderMessage('Please complete all delivery address fields.')
      return
    }
    localStorage.setItem('shopsphere_address', JSON.stringify(address))
    if (!cart.length) { setOrderMessage('Delivery address saved on this device.'); return }
    setOrderMessage('')
    setPaymentReady(true)
    setPaymentSubmitted(false)
  }
  async function triggerPaymentFailure() {
    setError('')
    setIncident(null)
    setAssistantSummary('')
    setAssistantMode('')
    setAssistantLoading(false)
    setDismissed(false)
    setOrderMessage('')
    try {
      const response = await fetch('/api/shopsphere/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Payment request for cart total ₹${cartTotal}`,
          scenario: 'network_timeout',
          user_action: 'payment_request',
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!payload.incident?.id) throw new Error(payload.detail || `Unable to record payment failure (HTTP ${response.status}).`)
      setIncident({
        ...payload.incident,
        trace_id: payload.trace_id,
        request_id: payload.request_id,
        failure_code: payload.failure_code,
        http_status: payload.http_status || response.status,
        user_action: 'payment_request',
        target_area: payload.target_area || 'payment request',
        search_query: payload.search_query || `Payment request ₹${cartTotal}`,
      })
      setCheckoutOpen(false)
      setPaymentReady(false)
      setPaymentSubmitted(false)
      setAssistantLoading(true)
      fetch('/api/assistant/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: payload.incident.id,
          question: `Investigate this ShopSphere payment request timeout for cart total ₹${cartTotal}. Summarize the recorded evidence, distinguish facts from hypotheses, and recommend two checks for payment service latency and timeout configuration.`,
        }),
      }).then(async r => {
        const answer = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(answer.detail || 'Assistant request failed')
        setAssistantSummary(answer.answer || 'The payment timeout and linked evidence were recorded. Open SignalRoot for the full investigation.')
        setAssistantMode(answer.mode || 'evidence-fallback')
      }).catch(() => {
        setAssistantSummary('A simulated payment request timeout was recorded with linked trace evidence. Open SignalRoot to inspect the payment service timeline and timeout hypotheses.')
        setAssistantMode('summary-unavailable')
      }).finally(() => setAssistantLoading(false))
    } catch (err) {
      setOrderMessage(err.message || 'Unable to record the payment failure. Check that the backend is running.')
    }
  }

  function submitPaymentForVerification() {
    setPaymentSubmitted(true)
    setOrderMessage('Payment marked as submitted for manual verification. This demo cannot verify bank or UPI payments automatically.')
  }
  function openAddressMap() { const destination=[address.line1,address.city,address.postalCode].filter(Boolean).join(', '); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination || 'enter delivery address')}`, '_blank', 'noopener,noreferrer') }

  function openInvestigation() {
    if (!incident?.id) return
    const url = new URL(SIGNALROOT_URL)
    url.searchParams.set('incidentId', incident.id)
    url.searchParams.set('source', 'shopsphere')
    window.location.assign(url.toString())
  }

  const filtered = products.filter(p => `${p.name} ${p.category} ${p.desc}`.toLowerCase().includes(query.toLowerCase().trim()))
  const baseVisible = searched && !incident && !error ? filtered : products
  const visible = categoryFilter === 'All' ? baseVisible : baseVisible.filter(p => p.category === categoryFilter)

  return <div className="shop-app">
    <div className="announcement"><Sparkles size={14}/> New season, better everyday tech <span>•</span> Free delivery on orders over ₹999</div>
    <header className="shop-header">
      <a className="shop-logo" href="#top" aria-label="ShopSphere home"><span className="logo-mark"><ShoppingBag size={21}/></span><span>shop<span>sphere</span></span></a>
      <nav className="shop-nav"><a href="#discover">Discover</a><a href="#catalog">All products</a><a href="#catalog">Electrical</a><a href="#catalog">Grocery</a><a href="#catalog">Toys</a><a href="#support">Support</a></nav>
      <div className="header-actions"><button className="icon-action" aria-label="Wishlist"><Heart size={19}/><span>{wish.length}</span></button>{currentUser ? <button className="account-button" onClick={()=>{setCurrentUser(null);setAuthMessage('Signed out.')}}><UserRound size={16}/> {currentUser.username}<LogOut size={14}/></button> : <button className="account-button" onClick={()=>{setAuthOpen(true);setAuthMode('login');setAuthMessage('');setAuthError('')}}><UserRound size={16}/> Login</button>}<button className="account-button address-header-button" onClick={()=>{setCheckoutOpen(true);setOrderMessage('')}}><MapPin size={15}/> Address</button><button className="bag-button" onClick={()=>{setCartOpen(true);setOrderMessage('')}}><ShoppingBag size={17}/> Bag <span>{cartCount}</span></button></div>
    </header>

    <main id="top">
      <section className="hero" id="discover">
        <div className="hero-copy"><div className="eyebrow"><span/> THE EVERYDAY TECH EDIT</div><h1>Good tech.<br/><em>Better days.</em></h1><p>Thoughtfully chosen tech for work, play, and everything in between.</p>
          <form className="search-form" onSubmit={searchProducts}><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search headphones, laptops…" aria-label="Search products"/><button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button></form>
          <div className="hero-notes"><span><Truck size={15}/> Free delivery ₹999+</span><span><ShieldCheck size={15}/> Secure checkout</span></div>
        </div>
        <div className="hero-art" aria-label="Featured wireless headphones illustration"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-glow"/><div className="headphone-art"><div className="headband"/><div className="earcup left-cup"/><div className="earcup right-cup"/><div className="cup-detail left-detail"/><div className="cup-detail right-detail"/></div><div className="floating-chip chip-top"><Sparkles size={15}/> Studio sound</div><div className="floating-chip chip-bottom"><span className="tiny-dot"/> Up to 40 hours</div><div className="art-caption">AURA / SERIES 04</div></div>
      </section>

      {error && <div className={`search-alert ${incident ? 'alert-error' : 'alert-neutral'}`} role="status"><ShieldAlert size={18}/><span>{error}</span>{!incident&&<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={16}/></button>}</div>}

      <section className="catalog" id="catalog"><div className="section-heading"><div><div className="eyebrow">THE COMMUNITY FAVOURITES</div><h2>{searched && !incident && !error ? `Results for “${query}”` : 'Shop everyday essentials'}</h2><p>Electrical items, groceries, toys, and tech in one place.</p></div><span className="view-all">{products.length} products <ArrowRight size={15}/></span></div><div className="category-filters">{['All','Electronics','Electrical','Grocery','Toys'].map(cat=><button key={cat} className={categoryFilter===cat?'active':''} onClick={()=>{setCategoryFilter(cat);setSearched(false);setError('')}}>{cat}</button>)}</div>
        <div className="product-grid">{visible.map(p=>{const Icon=p.icon;return <article className="product-card" key={p.id}><div className={`product-visual ${p.color}`}><span className="product-tag">{p.tag}</span><button className={`wish-button ${wish.includes(p.id)?'wished':''}`} aria-label={`Add ${p.name} to wishlist`} onClick={()=>setWish(prev=>prev.includes(p.id)?prev.filter(x=>x!==p.id):[...prev,p.id])}><Heart size={17} fill={wish.includes(p.id)?'currentColor':'none'}/></button><div className="product-illustration"><Icon size={83} strokeWidth={1.15}/></div><div className="product-orb"/></div><div className="product-info"><div className="product-category">{p.category} <span>★ {p.rating}</span></div><h3>{p.name}</h3><p>{p.desc}</p><div className="product-bottom"><div><strong>{p.price}</strong> <del>{p.old}</del></div><div className="product-actions"><button className="add-button" onClick={()=>triggerCartPoolFailure(p)} disabled={cartFailureLoading} aria-label={`Add ${p.name} to cart (demo database failure)`} title={cartFailureLoading ? "Recording demo incident…" : "Add to cart — demo database pool failure"}><Plus size={17}/></button><button className="buy-button" onClick={()=>buyNow(p)}>Buy</button></div></div></div></article>})}</div>
        {searched && !incident && !error && filtered.length===0 && <div className="empty-search"><Search size={22}/><b>No exact matches</b><span>Try “headphones” or “laptop”.</span></div>}
      </section>

      <section className="service-strip" id="support"><div><Truck size={22}/><span><b>Quick delivery</b><small>Track every order</small></span></div><div><ShieldCheck size={22}/><span><b>Secure by design</b><small>Your data stays protected</small></span></div><div><Check size={22}/><span><b>Easy returns</b><small>14-day return window</small></span></div><div><CircleHelp size={22}/><span><b>Real support</b><small>Here when you need us</small></span></div></section>
    </main>
    <footer className="shop-footer"><a className="shop-logo" href="#top"><span className="logo-mark"><ShoppingBag size={18}/></span><span>shop<span>sphere</span></span></a><span>Thoughtful tech for everyday life.</span><span>© 2026 ShopSphere Demo</span></footer>

    {cartOpen && <div className="auth-overlay" role="presentation"><section className="commerce-modal" role="dialog" aria-modal="true" aria-labelledby="cart-title"><button className="modal-close" onClick={()=>setCartOpen(false)} aria-label="Close cart"><X size={18}/></button><div className="auth-eyebrow">YOUR SHOPPING BAG</div><h2 id="cart-title">Your cart ({cartCount})</h2>{cart.length===0?<p className="auth-subtitle">Your cart is empty. Add something you like from the catalogue.</p>:<div className="cart-items">{cart.map(item=><div className="cart-item" key={item.id}><div className="cart-item-copy"><b>{item.name}</b><small>{item.price} each</small><div className="quantity-controls"><button onClick={()=>changeQty(item.id,-1)} aria-label={`Decrease ${item.name}`}><Minus size={13}/></button><span>{item.qty}</span><button onClick={()=>changeQty(item.id,1)} aria-label={`Increase ${item.name}`}><Plus size={13}/></button><button className="remove-item" onClick={()=>setCart(prev=>prev.filter(x=>x.id!==item.id))} aria-label={`Remove ${item.name}`}><Trash2 size={13}/></button></div></div><strong>₹{(priceValue(item.price)*item.qty).toLocaleString('en-IN')}</strong></div>)}</div>}{cart.length>0&&<><div className="cart-total"><span>Subtotal</span><b>₹{cartTotal.toLocaleString('en-IN')}</b></div><button className="auth-submit" onClick={()=>{setCartOpen(false);setCheckoutOpen(true);setOrderMessage('')}}>Continue to address <ArrowRight size={16}/></button></>}{orderMessage&&<p className="auth-feedback auth-success">{orderMessage}</p>}</section></div>}

    {checkoutOpen && <div className="auth-overlay" role="presentation"><section className="commerce-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="modal-close" onClick={()=>{setCheckoutOpen(false);setPaymentReady(false);setPaymentSubmitted(false)}} aria-label="Close checkout"><X size={18}/></button><div className="auth-mark"><MapPin size={22}/></div><div className="auth-eyebrow">DELIVERY DETAILS</div><h2 id="checkout-title">Delivery address</h2><p className="auth-subtitle">Save your address locally for this demo and preview it on a map.</p>{!paymentReady ? <form className="auth-form" onSubmit={placeDemoOrder}><label>Full name<input required value={address.fullName} onChange={e=>setAddress({...address,fullName:e.target.value})} placeholder="Recipient name"/></label><label>Phone number<input required inputMode="tel" pattern="[0-9+() -]{7,20}" value={address.phone} onChange={e=>setAddress({...address,phone:e.target.value})} placeholder="Contact number"/></label><label>Address / street<input required value={address.line1} onChange={e=>setAddress({...address,line1:e.target.value})} placeholder="House number, street, area"/></label><div className="address-row"><label>City<input required value={address.city} onChange={e=>setAddress({...address,city:e.target.value})} placeholder="City"/></label><label>PIN code<input required inputMode="numeric" pattern="[0-9]{5,8}" value={address.postalCode} onChange={e=>setAddress({...address,postalCode:e.target.value})} placeholder="PIN code"/></label></div><button type="button" className="map-button" onClick={openAddressMap}><Map size={16}/> Open address in Google Maps</button>{orderMessage&&<div className="auth-feedback auth-success" role="status">{orderMessage}</div>}<button className="auth-submit" type="submit">{cart.length ? <><CreditCard size={16}/> Continue to payment · ₹{cartTotal.toLocaleString('en-IN')}</> : <><Check size={16}/> Save address</>}</button></form> : <div className="payment-panel"><div className="payment-total"><span>Amount to pay</span><strong>₹{cartTotal.toLocaleString('en-IN')}</strong></div><p className="auth-subtitle">Scan this QR code using your UPI app to pay the exact amount shown above.</p><img className="payment-qr" src="/payment-qr.jpeg" alt="Payment QR code" /><div className="payment-instructions"><strong>How to pay</strong><ol><li>Open your UPI app on another device, or use its scan-from-gallery feature if supported.</li><li>Scan the QR code and check the recipient and amount before authorizing.</li><li>Complete payment only if the recipient details shown in your UPI app are correct.</li></ol></div><p className="auth-security"><ShieldCheck size={13}/> Never share your UPI PIN or OTP with this website. Payment is not automatically verified.</p><button type="button" className="map-button" onClick={triggerPaymentFailure}><ShieldAlert size={15}/> Simulate payment service timeout</button><button type="button" className="auth-submit" disabled={paymentSubmitted} onClick={submitPaymentForVerification}>{paymentSubmitted ? <><Check size={16}/> Submitted for manual verification</> : <><CreditCard size={16}/> I have paid — mark pending verification</>}</button><button type="button" className="map-button" onClick={()=>{setPaymentReady(false);setPaymentSubmitted(false);setOrderMessage('')}}>Back to delivery address</button>{orderMessage&&<div className="auth-feedback auth-success" role="status">{orderMessage}</div>}</div>}<p className="auth-security"><ShieldCheck size={13}/> ShopSphere demo checkout. Order remains unconfirmed until payment is manually verified.</p></section></div>}

    {authOpen && <div className="auth-overlay" role="presentation"><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close" onClick={()=>setAuthOpen(false)} aria-label="Close login"><X size={18}/></button>
      <div className="auth-mark"><LockKeyhole size={22}/></div>
      <div className="auth-eyebrow">SHOPSPHERE ACCOUNT</div>
      <h2 id="auth-title">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
      <p className="auth-subtitle">{authMode === 'login' ? 'Sign in to continue to your everyday tech.' : 'Create an account to get started.'}</p>
      <form className="auth-form" onSubmit={submitAuth}>
        <label>Username<input autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9_]+" required value={authUsername} onChange={e=>setAuthUsername(e.target.value)} placeholder="e.g. siddesha_01"/></label>
        {authMode === 'register' && <label>Email (optional)<input type="email" autoComplete="email" maxLength={254} value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label>}
        <label>Password<input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={authMode === 'register' ? 8 : 1} maxLength={128} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder={authMode === 'register' ? 'At least 8 characters' : 'Enter your password'}/></label>
        {authError && <div className="auth-feedback auth-error" role="alert">{authError}</div>}
        {authMessage && <div className="auth-feedback auth-success" role="status">{authMessage}</div>}
        <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16}/></button>
      </form>
      {authMode === 'login' && <div className="auth-demo-failure"><div className="auth-demo-caption">DEMO / FAILURE TESTING</div><button type="button" className="map-button" disabled={authBusy} onClick={triggerAuthSessionFailure}><ShieldAlert size={15}/> Simulate authentication / session issue</button><p>Creates a controlled HTTP 401 incident and opens the SignalRoot AI assistant.</p></div>}
      <div className="auth-switch">{authMode === 'login' ? 'New to ShopSphere?' : 'Already have an account?'} <button onClick={()=>{setAuthMode(authMode === 'login' ? 'register' : 'login');setAuthMessage('');setAuthError('')}}>{authMode === 'login' ? 'Create account' : 'Sign in'}</button></div>
      <p className="auth-security"><ShieldCheck size={13}/> Passwords are salted and hashed before database storage.</p>
    </section></div>}

    {incident && !dismissed && <div className="incident-overlay" role="presentation"><section className="incident-modal" role="dialog" aria-modal="true" aria-labelledby="incident-title">
      <button className="modal-close" onClick={()=>setDismissed(true)} aria-label="Dismiss incident assistant"><X size={18}/></button>
      <div className="modal-brand"><div className="signal-icon"><Activity size={20}/></div><div><b>SignalRoot AI</b><span>INCIDENT ASSISTANT</span></div><span className="detected-pill"><i/> DETECTED</span></div>
      <div className="incident-graphic"><div className="pulse-ring"/><div className="incident-alert-icon"><ShieldAlert size={30}/></div></div>
      <div className="modal-kicker">AUTOMATED INCIDENT DETECTION</div><h2 id="incident-title">We detected a {incident.scenario_id === 'network_timeout' ? 'service timeout' : (failureScenarios.find(s => s.id === incident.scenario_id)?.name || 'service failure').toLowerCase()}</h2><p className="modal-desc">ShopSphere reproduced a controlled failure. SignalRoot recorded the incident and linked evidence so an engineer can investigate.</p>
      <div className="incident-facts"><div><small>INCIDENT ID</small><b>{incident.id}</b></div><div><small>SEVERITY</small><b className="severity-medium">{String(incident.severity || 'medium').toUpperCase()}</b></div><div><small>HTTP STATUS</small><b>{incident.http_status || ({database_pool:503,app_exception:500,network_timeout:504,queue_backlog:503,bad_config:503,auth_session:401,duplicate_user:409,downstream_service:503}[incident.scenario_id] || 500)} {({500:'Internal Error',401:'Unauthorized',409:'Conflict',503:'Service Unavailable',504:'Gateway Timeout'}[incident.http_status || ({database_pool:503,app_exception:500,network_timeout:504,queue_backlog:503,bad_config:503,auth_session:401,duplicate_user:409,downstream_service:503}[incident.scenario_id] || 500)])}</b></div></div>
      <div className="evidence-preview"><div className="evidence-preview-head"><span><Activity size={15}/> Evidence captured</span><b>{incident.evidence?.length || 0} events</b></div><p><span className="evidence-bullet"/>Action: {incident.user_action || 'product_search'} · {incident.search_query || query}</p><p><span className="evidence-bullet"/>Target: {incident.target_area || 'ShopSphere service'}</p><p><span className="evidence-bullet"/>Trace ID: <code>{(incident.trace_id || '').slice(0, 20)}…</code></p><p><span className="evidence-bullet error-bullet"/>Request {incident.request_id} · HTTP {incident.http_status || 'error'}</p>{incident.suggested_username && <p><span className="evidence-bullet"/>Suggested available username: <b>{incident.suggested_username}</b></p>}</div>
      <div className="assistant-summary"><div className="assistant-summary-head"><Sparkles size={14}/><b>Initial AI investigation</b><span>{assistantLoading ? 'ANALYZING' : assistantMode === 'ollama' ? 'LOCAL AI' : assistantMode === 'evidence-fallback' ? 'EVIDENCE SUMMARY' : assistantMode === 'summary-unavailable' ? 'LIMITED' : 'READY'}</span></div>{assistantLoading ? <p>Correlating the incident evidence and preparing next-step recommendations…</p> : <p>{assistantSummary || 'The incident and trace evidence are saved. SignalRoot will open the full investigation when you continue.'}</p>}</div>
      <button className="investigate-button" onClick={openInvestigation}>Investigate in SignalRoot <ArrowRight size={17}/></button>
      <button className="continue-button" onClick={()=>setDismissed(true)}>Dismiss and continue browsing</button>
      <div className="modal-footnote"><ShieldCheck size={13}/> Controlled demo failure · No production service affected</div>
    </section></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
