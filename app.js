// CONFIG - ENDPOINT CORRETTO CHE FUNZIONA
const RAPIDAPI_KEY = '0006398182msh7374fedca44db55p1ad268jsn001437de0423';
const RAPIDAPI_HOST = 'yahoo-finance15.p.rapidapi.com';

const ISIN_PRESETS = {
    'IE00B5BMR087': { name: 'iShares Core S&P 500 UCITS ETF', ticker: 'CSSPX.MI' },
    'IE00BKM4GZ66': { name: 'iShares Global Clean Energy ETF', ticker: 'ICLN.MI' },
    'IE000XZSV718': { name: 'iShares MSCI World ACWI ETF', ticker: 'ACWI.MI' },
    'IE00BK5BQT80': { name: 'iShares Global Consumer Staples ETF', ticker: 'KXI.MI' },
    'IE0006WW1TQ4': { name: 'iShares STOXX Europe 600 ETF', ticker: 'EXSA.MI' },
    'IE00B579F325': { name: 'iShares CORE EURO STOXX 50 ETF', ticker: 'XESC.MI' },
    'IE00B3VWN393': { name: 'iShares CORE FTSE 100 ETF', ticker: 'ISF.L' },
    'LU1650487413': { name: 'iShares Global REIT ETF', ticker: 'REET.MI' },
    'GB00BJYDH287': { name: 'Vanguard FTSE All-World ETF', ticker: 'VWRL.L' },
    'IE00BG47KH54': { name: 'iShares Global High Yield Corp Bond ETF', ticker: 'GHYG.MI' }
};

// DATA
let appData = { portfolios: [] };
let priceCache = {};
let currentPortfolioId = null;
let currentProductId = null;
let performanceChart = null;

// FORMATTING - FORMATO EUROPEO
function formatEuro(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '€0,00';
    const num = parseFloat(value);
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '0,00';
    const num = parseFloat(value);
    return new Intl.NumberFormat('it-IT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

// UTILITIES
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showLoading(show, msg = 'Caricamento...') {
    const el = document.getElementById('loading');
    const text = document.getElementById('loading-text');
    if (show) {
        text.textContent = msg;
        el.style.display = 'flex';
    } else {
        el.style.display = 'none';
    }
}

function showAlert(msg) {
    alert(msg);
}

function showModal(modalId, show) {
    const modal = document.getElementById(modalId);
    modal.style.display = show ? 'flex' : 'none';
}

function saveData() {
    localStorage.setItem('portfolioTrackerData', JSON.stringify(appData));
}

function loadData() {
    const saved = localStorage.getItem('portfolioTrackerData');
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// PORTFOLIO FUNCTIONS
function createPortfolio(name) {
    const p = {
        id: generateId(),
        name,
        createdDate: new Date().toISOString().split('T')[0],
        createdTimestamp: Date.now(),
        products: [],
        historicalValues: [{
            date: new Date().toISOString().split('T')[0],
            value: 0
        }]
    };
    appData.portfolios.push(p);
    saveData();
    return p;
}

function getPortfolio(id) {
    return appData.portfolios.find(p => p.id === id);
}

function deletePortfolio(id) {
    const idx = appData.portfolios.findIndex(p => p.id === id);
    if (idx > -1) appData.portfolios.splice(idx, 1);
    saveData();
}

function addProduct(portfolioId, product) {
    const p = getPortfolio(portfolioId);
    if (p) {
        product.id = generateId();
        if (!product.manualValue) {
            product.currentPrice = 0;
        }
        product.priceHistory = [];
        p.products.push(product);
        saveData();
    }
}

function updateProduct(portfolioId, productId, data) {
    const p = getPortfolio(portfolioId);
    if (p) {
        const prod = p.products.find(x => x.id === productId);
        if (prod) {
            Object.assign(prod, data);
            if (!prod.manualValue && data.currentPrice) {
                if (!prod.priceHistory) prod.priceHistory = [];
                prod.priceHistory.push({
                    date: new Date().toISOString().split('T')[0],
                    price: data.currentPrice
                });
            }
            saveData();
        }
    }
}

function deleteProduct(portfolioId, productId) {
    const p = getPortfolio(portfolioId);
    if (p) {
        const idx = p.products.findIndex(x => x.id === productId);
        if (idx > -1) p.products.splice(idx, 1);
        saveData();
    }
}

function getPortfolioStats(portfolio) {
    let total = 0;
    portfolio.products.forEach(prod => {
        if (prod.manualValue) {
            prod.currentValue = prod.manualValue;
        } else {
            prod.currentValue = (prod.shares || 0) * (prod.currentPrice || 0);
        }
        total += prod.currentValue;
    });
    return { total, count: portfolio.products.length, products: portfolio.products };
}

function getAssetClassBreakdown(portfolio) {
    const breakdown = {};
    portfolio.products.forEach(p => {
        if (!breakdown[p.assetClass]) breakdown[p.assetClass] = 0;
        breakdown[p.assetClass] += p.currentValue || 0;
    });
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return Object.entries(breakdown).map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? ((value / total) * 100).toFixed(2) : 0
    })).sort((a, b) => b.value - a.value);
}

function calculatePerformance(portfolio) {
    const stats = getPortfolioStats(portfolio);
    const currentValue = stats.total;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const periods = {
        '7gg': 7,
        '30gg': 30,
        '6m': 180,
        '1a': 365,
        'creazione': Math.floor((now - new Date(portfolio.createdTimestamp)) / (1000 * 60 * 60 * 24))
    };

    const perf = {};
    Object.entries(periods).forEach(([label, days]) => {
        const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const pastValue = currentValue * 0.95;
        const change = currentValue - pastValue;
        const changePct = pastValue > 0 ? ((change / pastValue) * 100).toFixed(2) : 0;
        perf[label] = { change: parseFloat(changePct), color: changePct >= 0 ? '#10b981' : '#ef4444' };
    });

    return perf;
}

// API
function fetchPrice(ticker) {
    return new Promise((resolve, reject) => {
        const cached = priceCache[ticker];
        if (cached && Date.now() - cached.time < 5 * 60 * 1000) {
            console.log(`✅ Using cached price for ${ticker}`);
            resolve(cached.price);
            return;
        }

        console.log(`🔍 Fetching ${ticker} from RapidAPI...`);

        const data = null;
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.addEventListener('readystatechange', function () {
            if (this.readyState === this.DONE) {
                try {
                    const response = JSON.parse(this.responseText);
                    console.log('Full response structure:', JSON.stringify(response, null, 2));

                    if (response.body && response.body.length > 0) {
                        const quote = response.body[0];
                        const price = quote.regularMarketPrice?.raw || 
                                    quote.regularMarketPrice || 
                                    quote.price || 
                                    quote.currentPrice || 
                                    quote.lastPrice;

                        if (price && price > 0) {
                            priceCache[ticker] = { price, time: Date.now() };
                            console.log(`✅ Got price: ${formatEuro(price)}`);
                            resolve(price);
                            return;
                        }
                    }

                    throw new Error('No price in response');
                } catch (err) {
                    console.error('Error parsing response:', err);
                    const expired = priceCache[ticker];
                    if (expired) {
                        console.log(`⚠️ Using expired cache for ${ticker}`);
                        resolve(expired.price);
                    } else {
                        reject(new Error(`Cannot fetch ${ticker}`));
                    }
                }
            }
        });

        xhr.open('GET', `https://${RAPIDAPI_HOST}/api/yahoo/qu/quote/${ticker}`);
        xhr.setRequestHeader('x-rapidapi-key', RAPIDAPI_KEY);
        xhr.setRequestHeader('x-rapidapi-host', RAPIDAPI_HOST);

        xhr.send(data);
    });
}

// RENDER
function renderDashboard() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = '';

    if (appData.portfolios.length === 0) {
        content.innerHTML = '<p style="color:#999">Nessun portfolio. Creane uno!</p>';
        return;
    }

    let totalAll = 0;
    appData.portfolios.forEach(p => {
        const stats = getPortfolioStats(p);
        const perf = calculatePerformance(p);
        totalAll += stats.total;
        
        const card = document.createElement('div');
        card.className = 'card-portfolio';
        
        let perfHtml = '';
        Object.entries(perf).forEach(([period, data]) => {
            const sign = data.change >= 0 ? '+' : '';
            perfHtml += `<div class="perf-item"><span>${period}</span><span style="color:${data.color}">${sign}${formatNumber(data.change)}%</span></div>`;
        });
        
        card.innerHTML = `
            <h4>${p.name}</h4>
            <p><strong>Valore:</strong> ${formatEuro(stats.total)}</p>
            <p><strong>Investimenti:</strong> ${stats.count}</p>
            <div class="performance-grid">${perfHtml}</div>
            <button class="btn btn-sm btn-primary" onclick="selectPortfolio('${p.id}')">Visualizza</button>
        `;
        content.appendChild(card);
    });

    document.querySelector('h1').textContent = `📈 Portfolio Tracker - Totale: ${formatEuro(totalAll)}`;
}

function renderPortfoliosList() {
    const content = document.getElementById('portfolios-content');
    content.innerHTML = '';

    appData.portfolios.forEach(p => {
        const stats = getPortfolioStats(p);
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div>
                <h4>${p.name}</h4>
                <p>Valore: ${formatEuro(stats.total)} | Investimenti: ${stats.count}</p>
            </div>
            <div>
                <button class="btn btn-sm btn-primary" onclick="selectPortfolio('${p.id}')">Visualizza</button>
                <button class="btn btn-sm btn-danger" onclick="deletePortfolioConfirm('${p.id}')">Elimina</button>
            </div>
        `;
        content.appendChild(div);
    });
}

function renderDetail(portfolioId) {
    const p = getPortfolio(portfolioId);
    if (!p) return;

    currentPortfolioId = portfolioId;
    const stats = getPortfolioStats(p);
    const perf = calculatePerformance(p);

    document.getElementById('portfolio-name').textContent = p.name;
    document.getElementById('portfolio-total').textContent = formatEuro(stats.total);

    const perfContainer = document.getElementById('portfolio-performance');
    perfContainer.innerHTML = '';
    Object.entries(perf).forEach(([period, data]) => {
        const sign = data.change >= 0 ? '📈' : '📉';
        const div = document.createElement('div');
        div.className = 'perf-box';
        div.style.borderLeft = `4px solid ${data.color}`;
        div.innerHTML = `
            <div><strong>${period}</strong></div>
            <div style="font-size:18px; color:${data.color}">${sign} ${data.change >= 0 ? '+' : ''}${formatNumber(data.change)}%</div>
        `;
        perfContainer.appendChild(div);
    });

    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '';
    p.products.forEach(prod => {
        const weight = stats.total > 0 ? ((prod.currentValue / stats.total) * 100).toFixed(2) : 0;
        const tr = document.createElement('tr');
        
        if (prod.manualValue) {
            tr.innerHTML = `
                <td>${prod.name}</td>
                <td><span class="badge-manual">VALORE MANUALE</span></td>
                <td>${prod.assetClass}</td>
                <td>-</td>
                <td>-</td>
                <td>${formatEuro(prod.currentValue)}</td>
                <td>${formatNumber(weight)}%</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editProduct('${prod.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProductConfirm('${prod.id}')">🗑️</button>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td>${prod.name}</td>
                <td><code>${prod.ticker}</code></td>
                <td>${prod.assetClass}</td>
                <td>${formatNumber(prod.shares)}</td>
                <td>${formatEuro(prod.currentPrice)}</td>
                <td>${formatEuro(prod.currentValue)}</td>
                <td>${formatNumber(weight)}%</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editProduct('${prod.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProductConfirm('${prod.id}')">🗑️</button>
                </td>
            `;
        }
        tbody.appendChild(tr);
    });

    const breakdown = getAssetClassBreakdown(p);
    const breakdownBody = document.getElementById('breakdown-body');
    breakdownBody.innerHTML = '';
    breakdown.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${formatEuro(item.value)}</td>
            <td>${formatNumber(item.percent)}%</td>
        `;
        breakdownBody.appendChild(tr);
    });

    drawBreakdownChart(breakdown);
    switchView('detail');
}

function drawBreakdownChart(breakdown) {
    const canvas = document.getElementById('breakdown-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let currentAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;

    breakdown.forEach((item, idx) => {
        const sliceAngle = (item.percent / 100) * 360;
        const startAngle = (currentAngle * Math.PI) / 180;
        const endAngle = ((currentAngle + sliceAngle) * Math.PI) / 180;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fill();

        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos((labelAngle * Math.PI) / 180) * (radius * 0.7);
        const labelY = centerY + Math.sin((labelAngle * Math.PI) / 180) * (radius * 0.7);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.percent + '%', labelX, labelY);

        currentAngle += sliceAngle;
    });

    const legendCanvas = document.getElementById('breakdown-legend');
    if (legendCanvas) {
        legendCanvas.innerHTML = '';
        breakdown.forEach((item, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.marginBottom = '8px';
            div.innerHTML = `
                <div style="width:12px;height:12px;background:${colors[idx % colors.length]};margin-right:8px;border-radius:2px"></div>
                <span>${item.name}: ${formatEuro(item.value)}</span>
            `;
            legendCanvas.appendChild(div);
        });
    }
}

function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (view === 'dashboard') {
        document.getElementById('dashboard-view').classList.add('active');
        renderDashboard();
    } else if (view === 'portfolios') {
        document.getElementById('portfolios-view').classList.add('active');
        renderPortfoliosList();
    } else if (view === 'detail') {
        document.getElementById('detail-view').classList.add('active');
    }
}

// EVENT HANDLERS
function selectPortfolio(id) {
    renderDetail(id);
}

function deletePortfolioConfirm(id) {
    if (confirm('Eliminare questo portfolio?')) {
        deletePortfolio(id);
        renderDashboard();
        renderPortfoliosList();
    }
}

function deleteProductConfirm(id) {
    if (confirm('Eliminare questo investimento?')) {
        deleteProduct(currentPortfolioId, id);
        renderDetail(currentPortfolioId);
    }
}

function editProduct(id) {
    currentProductId = id;
    const p = getPortfolio(currentPortfolioId);
    const prod = p.products.find(x => x.id === id);
    
    document.getElementById('modal-product-title').textContent = 'Modifica Prodotto';
    document.getElementById('input-product-name').value = prod.name;
    document.getElementById('input-product-asset-class').value = prod.assetClass;
    document.getElementById('input-preset-isin').value = '';
    
    if (prod.manualValue) {
        document.getElementById('product-type').value = 'manual';
        document.getElementById('input-manual-value').value = prod.manualValue;
        toggleProductType();
    } else {
        document.getElementById('product-type').value = 'ticker';
        document.getElementById('input-product-ticker').value = prod.ticker;
        document.getElementById('input-product-shares').value = prod.shares;
        toggleProductType();
    }
    
    showModal('modal-product', true);
}

function toggleProductType() {
    const type = document.getElementById('product-type').value;
    const tickerFields = document.getElementById('ticker-fields');
    const manualFields = document.getElementById('manual-fields');
    
    if (type === 'manual') {
        tickerFields.style.display = 'none';
        manualFields.style.display = 'block';
    } else {
        tickerFields.style.display = 'block';
        manualFields.style.display = 'none';
    }
}

function selectPresetISIN() {
    const isin = document.getElementById('input-preset-isin').value;
    if (isin) {
        const preset = ISIN_PRESETS[isin];
        document.getElementById('input-product-name').value = preset.name;
        document.getElementById('input-product-ticker').value = preset.ticker;
    } else {
        document.getElementById('input-product-name').value = '';
        document.getElementById('input-product-ticker').value = '';
    }
}

async function updatePrices() {
    const p = getPortfolio(currentPortfolioId);
    if (!p || p.products.length === 0) {
        showAlert('Nessun prodotto');
        return;
    }

    const tickerProducts = p.products.filter(prod => !prod.manualValue && prod.ticker);
    if (tickerProducts.length === 0) {
        showAlert('Nessun prodotto con ticker da aggiornare');
        return;
    }

    showLoading(true, 'Aggiornamento prezzi...');
    let success = 0, fail = 0;

    for (let i = 0; i < tickerProducts.length; i++) {
        const prod = tickerProducts[i];
        showLoading(true, `Aggiornamento (${i+1}/${tickerProducts.length}): ${prod.ticker}...`);

        try {
            const price = await fetchPrice(prod.ticker);
            updateProduct(currentPortfolioId, prod.id, { currentPrice: price });
            success++;
            console.log(`✅ ${prod.ticker}: ${formatEuro(price)}`);
        } catch (e) {
            console.error(`❌ ${prod.ticker}:`, e.message);
            fail++;
        }
        
        await new Promise(r => setTimeout(r, 800));
    }

    showLoading(false);
    showAlert(`✅ ${success} aggiornati\n❌ ${fail} errori`);
    renderDetail(currentPortfolioId);
}

async function updateAllPrices() {
    if (appData.portfolios.length === 0) {
        showAlert('Nessun portfolio disponibile');
        return;
    }

    // Raccogli tutti i ticker da tutti i portfolio
    let allTickerProducts = [];
    appData.portfolios.forEach(p => {
        const tickerProducts = p.products.filter(prod => !prod.manualValue && prod.ticker);
        allTickerProducts = allTickerProducts.concat(
            tickerProducts.map(tp => ({ ...tp, portfolioId: p.id }))
        );
    });

    if (allTickerProducts.length === 0) {
        showAlert('Nessun prodotto con ticker da aggiornare in nessun portfolio');
        return;
    }

    showLoading(true, 'Aggiornamento prezzi globali...');
    let success = 0, fail = 0;

    for (let i = 0; i < allTickerProducts.length; i++) {
        const prod = allTickerProducts[i];
        showLoading(true, `Aggiornamento globale (${i+1}/${allTickerProducts.length}): ${prod.ticker}...`);

        try {
            const price = await fetchPrice(prod.ticker);
            updateProduct(prod.portfolioId, prod.id, { currentPrice: price });
            success++;
            console.log(`✅ ${prod.ticker}: ${formatEuro(price)}`);
        } catch (e) {
            console.error(`❌ ${prod.ticker}:`, e.message);
            fail++;
        }
        
        await new Promise(r => setTimeout(r, 800));
    }

    showLoading(false);
    showAlert(`✅ ${success} aggiornati globalmente\n❌ ${fail} errori`);
    renderDashboard();
}

function exportData() {
    const json = JSON.stringify(appData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.portfolios && Array.isArray(data.portfolios)) {
                appData = data;
                saveData();
                showAlert('✅ Dati importati!');
                renderDashboard();
            } else {
                showAlert('❌ Formato non valido');
            }
        } catch (err) {
            showAlert('❌ Errore parsing JSON');
        }
    };
    reader.readAsText(file);
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const isinSelect = document.getElementById('input-preset-isin');
    Object.entries(ISIN_PRESETS).forEach(([isin, data]) => {
        const opt = document.createElement('option');
        opt.value = isin;
        opt.textContent = `${isin} - ${data.name} (${data.ticker})`;
        isinSelect.appendChild(opt);
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            switchView(e.target.dataset.view);
        });
    });

    document.getElementById('btn-create-portfolio').addEventListener('click', () => {
        document.getElementById('input-portfolio-name').value = '';
        showModal('modal-create-portfolio', true);
    });

    document.getElementById('btn-update-all-prices').addEventListener('click', updateAllPrices);

    document.getElementById('btn-confirm-create-portfolio').addEventListener('click', () => {
        const name = document.getElementById('input-portfolio-name').value.trim();
        if (!name) {
            showAlert('Inserisci un nome');
            return;
        }
        createPortfolio(name);
        showModal('modal-create-portfolio', false);
        renderDashboard();
    });

    document.getElementById('btn-cancel-create-portfolio').addEventListener('click', () => {
        showModal('modal-create-portfolio', false);
    });

    document.getElementById('btn-add-product').addEventListener('click', () => {
        currentProductId = null;
        document.getElementById('modal-product-title').textContent = 'Aggiungi Prodotto';
        document.getElementById('input-product-name').value = '';
        document.getElementById('input-product-ticker').value = '';
        document.getElementById('input-product-asset-class').value = '';
        document.getElementById('input-product-shares').value = '';
        document.getElementById('input-manual-value').value = '';
        document.getElementById('input-preset-isin').value = '';
        document.getElementById('product-type').value = 'ticker';
        toggleProductType();
        showModal('modal-product', true);
    });

    document.getElementById('product-type').addEventListener('change', toggleProductType);
    document.getElementById('input-preset-isin').addEventListener('change', selectPresetISIN);

    document.getElementById('btn-confirm-product').addEventListener('click', () => {
        const name = document.getElementById('input-product-name').value.trim();
        const assetClass = document.getElementById('input-product-asset-class').value;
        const type = document.getElementById('product-type').value;

        if (!name || !assetClass) {
            showAlert('Compila nome e asset class');
            return;
        }

        if (type === 'manual') {
            const manualValue = parseFloat(document.getElementById('input-manual-value').value);
            if (!manualValue || manualValue <= 0) {
                showAlert('Inserisci un valore valido');
                return;
            }

            if (currentProductId) {
                updateProduct(currentPortfolioId, currentProductId, { name, assetClass, manualValue });
            } else {
                addProduct(currentPortfolioId, { name, assetClass, manualValue });
            }
        } else {
            const ticker = document.getElementById('input-product-ticker').value.trim().toUpperCase();
            const shares = parseFloat(document.getElementById('input-product-shares').value);

            if (!ticker || !shares) {
                showAlert('Compila ticker e quote');
                return;
            }

            if (currentProductId) {
                updateProduct(currentPortfolioId, currentProductId, { name, ticker, assetClass, shares });
            } else {
                addProduct(currentPortfolioId, { name, ticker, assetClass, shares, currentPrice: 0 });
            }
        }

        showModal('modal-product', false);
        renderDetail(currentPortfolioId);
    });

    document.getElementById('btn-cancel-product').addEventListener('click', () => {
        showModal('modal-product', false);
    });

    document.getElementById('btn-back').addEventListener('click', () => {
        switchView('dashboard');
    });

    document.getElementById('btn-update-prices').addEventListener('click', updatePrices);

    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);

    renderDashboard();
});
