// طبقة الاتصال بـ Frankfurter API؛ لا تتعامل هذه الوظائف مع عناصر الصفحة.
window.CurrencyApi = (() => {
    const API_BASE_URL = 'https://api.frankfurter.dev/v1';

    // ينفذ الطلب ويتحقق من نجاحه ثم يعيد البيانات بصيغة JSON.
    async function requestJson(url, errorMessage) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(errorMessage);
        }

        return response.json();
    }

    return {
        // يجلب رموز العملات وأسماءها.
        getCurrencies() {
            return requestJson(
                `${API_BASE_URL}/currencies`,
                'فشل جلب قائمة العملات الأساسية'
            );
        },

        // يجلب أسعار الصرف لعملة الأساس المطلوبة.
        getLatestRates(base) {
            const params = new URLSearchParams({ base });
            return requestJson(
                `${API_BASE_URL}/latest?${params}`,
                'فشل جلب أسعار الجدول'
            );
        },

        // يجلب سعر تحويل المبلغ بين عملتي المصدر والهدف.
        convert(amount, from, to) {
            const params = new URLSearchParams({ amount, from, to });
            return requestJson(
                `${API_BASE_URL}/latest?${params}`,
                'فشل جلب سعر الصرف للتحويل'
            );
        }
    };
})();
