async function run() {
    try {
        const res = await fetch('http://localhost:4321/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                origin: 'http://localhost:4321',
                guestEmail: 'test@example.com',
                shippingAddress: {
                    name: 'Test', email: 'test@example.com', phone: '123',
                    address: '123 Test St', city: 'Test City',
                    postal_code: '12345', country: 'ES'
                },
                items: [
                    {
                        id: 'd0107d4b-2f3b-488b-a131-ab7bd0345ca5',
                        name: 'Test Product', slug: 'test-product',
                        price: 10, quantity: 1, size: 'M',
                        image: 'https://example.com/image.png'
                    }
                ]
            })
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}
run();
