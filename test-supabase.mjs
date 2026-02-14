
const url = "https://lwdjsayywvqiovfhnpqn.supabase.co/auth/v1/health";

async function testFetch() {
    console.log(`Testing fetch to ${url}...`);
    try {
        const start = Date.now();
        const res = await fetch(url, { method: 'GET' });
        const end = Date.now();
        console.log(`Status: ${res.status}`);
        console.log(`Time: ${end - start}ms`);
        if (res.ok) {
            const data = await res.json();
            console.log('Result:', data);
        }
    } catch (err) {
        console.error('Fetch failed:', err.message);
        if (err.cause) {
            console.error('Cause:', err.cause);
        }
    }
}

testFetch();
