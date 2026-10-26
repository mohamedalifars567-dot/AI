// أسماء العملات حسب رمزها، مثل USD وEUR.
let currenciesMap = {};

// عناصر واجهة محول العملات.
const amountInput = document.getElementById('amountInput');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const swapBtn = document.getElementById('swapBtn');
const conversionResult = document.getElementById('conversionResult');
const exchangeRateInfo = document.getElementById('exchangeRateInfo');

// عناصر جدول الأسعار والرسائل.
const tableBaseCurrency = document.getElementById('tableBaseCurrency');
const ratesTableBody = document.getElementById('ratesTableBody');
const tableLoading = document.getElementById('tableLoading');
const tableSearchInput = document.getElementById('tableSearchInput');
const globalError = document.getElementById('globalError');
const errorText = document.getElementById('errorText');

// يجلب العملات أولًا، ثم يجهز القوائم ويعرض التحويل والأسعار.
async function init() {
    try {
        currenciesMap = await CurrencyApi.getCurrencies();

        populateDropdowns();
        triggerConversion();
        fetchTableRates();
    } catch (err) {
        showError(err.message);
    }
}

// يضيف العملات إلى القوائم ويحدد القيم الافتراضية.
function populateDropdowns() {
    const codes = Object.keys(currenciesMap);

    fromCurrency.innerHTML = '';
    toCurrency.innerHTML = '';
    tableBaseCurrency.innerHTML = '';

    codes.forEach(code => {
        const text = `${code} - ${currenciesMap[code]}`;
        fromCurrency.add(new Option(text, code));
        toCurrency.add(new Option(text, code));
        tableBaseCurrency.add(new Option(code, code));
    });

    if (currenciesMap['USD']) fromCurrency.value = 'USD';
    if (currenciesMap['EUR']) toCurrency.value = 'EUR';
    if (currenciesMap['USD']) tableBaseCurrency.value = 'USD';
}

// يحسب المبلغ بعملة الهدف ويعرض سعر الوحدة.
async function triggerConversion() {
    const amount = amountInput.value;
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (!amount || amount < 0) {
        conversionResult.textContent = 'قيمة غير صالحة';
        exchangeRateInfo.textContent = '--';
        return;
    }

    if (from === to) {
        conversionResult.textContent = `${Number(amount).toLocaleString()} ${to}`;
        exchangeRateInfo.textContent = `1 ${from} = 1 ${to}`;
        return;
    }

    try {
        const data = await CurrencyApi.convert(amount, from, to);
        const converted = data.rates[to];

        conversionResult.textContent = `${converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to}`;

        // يقسم الناتج على المبلغ لإظهار سعر صرف وحدة واحدة.
        const unitRate = data.rates[to] / amount;
        exchangeRateInfo.textContent = `1 ${from} = ${unitRate.toFixed(4)} ${to}`;
    } catch (err) {
        conversionResult.textContent = 'خطأ بالتحويل';
        console.error(err);
    }
}

// يحتفظ بالأسعار الحالية لإعادة عرضها عند استخدام البحث.
let currentRatesData = {};

// يجلب أسعار العملات نسبةً إلى عملة الأساس المختارة.
async function fetchTableRates() {
    const base = tableBaseCurrency.value;
    tableLoading.classList.remove('hidden');

    try {
        const data = await CurrencyApi.getLatestRates(base);
        currentRatesData = data.rates;
        renderTable(currentRatesData);
    } catch (err) {
        showError(err.message);
    } finally {
        tableLoading.classList.add('hidden');
    }
}

// يرسم صفوف الأسعار بعد تطبيق البحث على الرمز أو اسم العملة.
function renderTable(rates, filter = '') {
    ratesTableBody.innerHTML = '';
    const filteredEntries = Object.entries(rates).filter(([code, rate]) => {
        const name = currenciesMap[code] || '';
        return code.toLowerCase().includes(filter.toLowerCase()) || name.toLowerCase().includes(filter.toLowerCase());
    });

    if (filteredEntries.length === 0) {
        ratesTableBody.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-slate-500 text-xs">لا توجد نتائج مطابقة</td></tr>`;
        return;
    }

    for (const [code, rate] of filteredEntries) {
        const name = currenciesMap[code] || 'غير معروف';
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-900/60 transition border-b border-slate-900/50';
        tr.innerHTML = `
            <td class="p-3 text-emerald-400 font-bold text-xs">
                <span class="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">${code}</span>
            </td>
            <td class="p-3 text-slate-300 text-xs">${name}</td>
            <td class="p-3 text-left text-slate-200">${rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
        `;
        ratesTableBody.appendChild(tr);
    }
}

// يعرض رسالة الخطأ العامة في أعلى الصفحة.
function showError(msg) {
    errorText.textContent = msg;
    globalError.classList.remove('hidden');
}

// يربط عناصر الصفحة بأحداث التحويل والتبديل والبحث.
amountInput.addEventListener('input', triggerConversion);
fromCurrency.addEventListener('change', triggerConversion);
toCurrency.addEventListener('change', triggerConversion);

swapBtn.addEventListener('click', () => {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    triggerConversion();
});

tableBaseCurrency.addEventListener('change', fetchTableRates);

tableSearchInput.addEventListener('input', (e) => {
    renderTable(currentRatesData, e.target.value);
});

// يبدأ تحميل بيانات التطبيق عند جاهزية الصفحة.
init();
