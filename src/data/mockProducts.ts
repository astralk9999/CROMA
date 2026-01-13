export const mockProducts = [
    // JACKETS
    {
        id: 'jacket-1',
        name: 'Urban Bomber Jacket',
        slug: 'urban-bomber-jacket',
        price: 119.99,
        images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop'],
        stock: 15,
        stockBySizes: { 'S': 3, 'M': 5, 'L': 4, 'XL': 3 },
        category: 'jackets',
        brand: 'black-squad',
        colors: ['black', 'green']
    },
    {
        id: 'jacket-2',
        name: 'Denim Trucker Jacket',
        slug: 'denim-trucker-jacket',
        price: 89.99,
        images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop'],
        stock: 8,
        stockBySizes: { 'S': 2, 'M': 3, 'L': 2, 'XL': 1 },
        category: 'jackets',
        brand: 'smog',
        colors: ['blue']
    },
    {
        id: 'jacket-3',
        name: 'Puffer Winter Coat',
        slug: 'puffer-winter-coat',
        price: 159.99,
        images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop'],
        stock: 20,
        stockBySizes: { 'S': 4, 'M': 6, 'L': 6, 'XL': 4 },
        category: 'jackets',
        brand: 'iq',
        colors: ['orange', 'red']
    },

    // SWEATSHIRTS
    {
        id: 'sweat-1',
        name: 'Oversized Street Hoodie',
        slug: 'oversized-street-hoodie',
        price: 69.99,
        images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop'],
        stock: 20,
        stockBySizes: { 'S': 4, 'M': 6, 'L': 6, 'XL': 4 },
        category: 'sweatshirt-pullover',
        brand: 'fsbn',
        colors: ['grey-black', 'white']
    },
    {
        id: 'sweat-2',
        name: 'Graphic Pullover',
        slug: 'graphic-pullover',
        price: 54.99,
        images: ['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1000&auto=format&fit=crop'],
        stock: 35,
        stockBySizes: { 'S': 8, 'M': 10, 'L': 10, 'XL': 7 },
        category: 'sweatshirt-pullover',
        brand: 'black-squad',
        colors: ['black', 'yellow']
    },

    // T-SHIRTS
    {
        id: 'tshirt-1',
        name: 'Essential White Tee',
        slug: 'essential-white-tee',
        price: 29.99,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'],
        stock: 50,
        stockBySizes: { 'S': 12, 'M': 15, 'L': 13, 'XL': 10 },
        category: 't-shirts',
        brand: 'smog',
        colors: ['white']
    },
    {
        id: 'tshirt-2',
        name: 'Vintage Wash Tee',
        slug: 'vintage-wash-tee',
        price: 34.99,
        images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'],
        stock: 40,
        stockBySizes: { 'S': 10, 'M': 12, 'L': 10, 'XL': 8 },
        category: 't-shirts',
        brand: 'fsbn',
        colors: ['grey-black', 'blue']
    },
    {
        id: 'tshirt-3',
        name: 'Striped Cotton Tee',
        slug: 'striped-cotton-tee',
        price: 24.99,
        images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop'],
        stock: 25,
        stockBySizes: { 'S': 6, 'M': 8, 'L': 7, 'XL': 4 },
        category: 't-shirts',
        brand: 'icono',
        colors: ['blue', 'white']
    },

    // DENIM & TROUSERS
    {
        id: 'denim-1',
        name: 'Distressed Denim Jeans',
        slug: 'distressed-denim-jeans',
        price: 79.99,
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'],
        stock: 12,
        stockBySizes: { '30': 3, '32': 4, '34': 3, '36': 2 },
        category: 'denim',
        brand: 'black-squad',
        colors: ['blue']
    },
    {
        id: 'pants-1',
        name: 'Cargo Utility Pants',
        slug: 'cargo-utility-pants',
        price: 74.99,
        images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop'],
        stock: 18,
        stockBySizes: { '30': 4, '32': 6, '34': 5, '36': 3 },
        category: 'trousers',
        brand: 'smog',
        colors: ['green', 'beige']
    },
    {
        id: 'pants-2',
        name: 'Slim Fit Chinos',
        slug: 'slim-fit-chinos',
        price: 59.99,
        images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop'],
        stock: 30,
        stockBySizes: { '30': 7, '32': 9, '34': 8, '36': 6 },
        category: 'trousers',
        brand: 'smog',
        colors: ['beige', 'brown']
    },

    // SHOES
    {
        id: 'shoes-1',
        name: 'Canvas High Tops',
        slug: 'canvas-high-tops',
        price: 64.99,
        images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1000&auto=format&fit=crop'],
        stock: 30,
        stockBySizes: { '40': 6, '41': 8, '42': 8, '43': 5, '44': 3 },
        category: 'shoes',
        brand: 'iq',
        colors: ['black', 'white']
    },
    {
        id: 'shoes-2',
        name: 'Performance Runners',
        slug: 'performance-runners',
        price: 99.99,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop'],
        stock: 8,
        stockBySizes: { '40': 2, '41': 2, '42': 2, '43': 1, '44': 1 },
        category: 'sportswear',
        brand: 'lucky-athletes',
        colors: ['red', 'white']
    },
    {
        id: 'shoes-3',
        name: 'Urban Sneakers',
        slug: 'urban-sneakers',
        price: 109.99,
        images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop'],
        stock: 15,
        stockBySizes: { '40': 3, '41': 4, '42': 4, '43': 3, '44': 1 },
        category: 'shoes',
        brand: 'iq',
        colors: ['grey-black']
    },

    // SHIRTS
    {
        id: 'shirt-1',
        name: 'Oxford Casual Shirt',
        slug: 'oxford-casual-shirt',
        price: 54.99,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'],
        stock: 22,
        stockBySizes: { 'S': 5, 'M': 7, 'L': 6, 'XL': 4 },
        category: 'shirts',
        brand: 'smog',
        colors: ['blue', 'white']
    },
    {
        id: 'shirt-2',
        name: 'Flannel Check Shirt',
        slug: 'flannel-check-shirt',
        price: 49.99,
        images: ['https://images.unsplash.com/photo-1576566582149-4347729df66f?q=80&w=1000&auto=format&fit=crop'],
        stock: 18,
        stockBySizes: { 'S': 4, 'M': 6, 'L': 5, 'XL': 3 },
        category: 'shirts',
        brand: 'fsbn',
        colors: ['red', 'black']
    },

    // ACCESSORIES & UNDERWEAR
    {
        id: 'acc-1',
        name: 'Retro Sunglasses',
        slug: 'retro-sunglasses',
        price: 29.99,
        images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop'],
        stock: 45,
        stockBySizes: { 'One Size': 45 },
        category: 'accessories',
        brand: 'icono',
        colors: ['black', 'gold']
    },
    {
        id: 'acc-2',
        name: 'Beanie Hat',
        slug: 'beanie-hat',
        price: 19.99,
        images: ['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1000&auto=format&fit=crop'],
        stock: 100,
        stockBySizes: { 'One Size': 100 },
        category: 'accessories',
        brand: 'fsbn',
        colors: ['grey-black', 'blue']
    },
    {
        id: 'acc-3',
        name: 'Leather Weekend Bag',
        slug: 'leather-weekend-bag',
        price: 149.99,
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop'],
        stock: 5,
        stockBySizes: { 'One Size': 5 },
        category: 'accessories',
        brand: 'black-squad',
        colors: ['brown']
    },
    {
        id: 'socks-1',
        name: 'Sport Socks Pack',
        slug: 'sport-socks-pack',
        price: 16.99,
        images: ['https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1000&auto=format&fit=crop'],
        stock: 200,
        stockBySizes: { 'S': 50, 'M': 70, 'L': 50, 'XL': 30 },
        category: 'underwear-and-socks',
        brand: 'lucky-athletes',
        colors: ['white', 'black']
    },

    // SPORTSWEAR
    {
        id: 'sport-1',
        name: 'Training Track Jacket',
        slug: 'training-track-jacket',
        price: 64.99,
        images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'],
        stock: 25,
        stockBySizes: { 'S': 6, 'M': 8, 'L': 7, 'XL': 4 },
        category: 'sportswear',
        brand: 'lucky-athletes',
        colors: ['blue', 'black']
    },
    // Extra colors
    {
        id: 'acc-4',
        name: 'Gold Chain',
        slug: 'gold-chain',
        price: 44.99,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop'],
        stock: 10,
        stockBySizes: { 'One Size': 10 },
        category: 'accessories',
        brand: 'icono',
        colors: ['gold']
    },
    {
        id: 'acc-5',
        name: 'Silver Watch',
        slug: 'silver-watch',
        price: 249.99,
        images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1000&auto=format&fit=crop'],
        stock: 3,
        stockBySizes: { 'One Size': 3 },
        category: 'accessories',
        brand: 'icono',
        colors: ['silver']
    },
    {
        id: 'hoodie-2',
        name: 'Violet Hoodie',
        slug: 'violet-hoodie',
        price: 69.99,
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop'],
        stock: 15,
        stockBySizes: { 'S': 3, 'M': 5, 'L': 4, 'XL': 3 },
        category: 'sweatshirt-pullover',
        brand: 'fsbn',
        colors: ['violet']
    },
    {
        id: 'tshirt-4',
        name: 'Pink Graphic Tee',
        slug: 'pink-graphic-tee',
        price: 32.99,
        images: ['https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=1000&auto=format&fit=crop'],
        stock: 30,
        stockBySizes: { 'S': 7, 'M': 9, 'L': 8, 'XL': 6 },
        category: 't-shirts',
        brand: 'smog',
        colors: ['pink']
    }
];
